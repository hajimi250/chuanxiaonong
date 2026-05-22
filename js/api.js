// API调用模块
const API = {
    // 发送消息（流式）
    async sendMessage(messages, onChunk, onDone, onError) {
        const config = Config.getAll();

        if (!config.apiUrl || !config.apiKey) {
            onError(new Error('请先配置API地址和密钥'));
            return;
        }

        // 构建请求体（OpenAI兼容格式）
        const requestBody = {
            model: config.model,
            messages: [
                { role: 'system', content: config.systemPrompt },
                ...messages
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 2000
        };

        try {
            const response = await fetch(config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API请求失败: ${response.status} - ${errorData}`);
            }

            // 处理SSE流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    onDone(fullContent);
                    break;
                }

                buffer += decoder.decode(value, { stream: true });

                // 处理SSE数据
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();

                    if (!trimmedLine || trimmedLine === 'data: [DONE]') {
                        continue;
                    }

                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmedLine.slice(6);
                            const data = JSON.parse(jsonStr);

                            if (data.choices && data.choices[0]) {
                                const delta = data.choices[0].delta;

                                if (delta && delta.content) {
                                    fullContent += delta.content;
                                    onChunk(delta.content, fullContent);
                                }
                            }
                        } catch (e) {
                            console.warn('解析SSE数据失败:', e);
                        }
                    }
                }
            }
        } catch (error) {
            onError(error);
        }
    },

    // 非流式发送（备用）
    async sendMessageSync(messages) {
        const config = Config.getAll();

        if (!config.apiUrl || !config.apiKey) {
            throw new Error('请先配置API地址和密钥');
        }

        const requestBody = {
            model: config.model,
            messages: [
                { role: 'system', content: config.systemPrompt },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 2000
        };

        const response = await fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`API请求失败: ${response.status} - ${errorData}`);
        }

        const data = await response.json();

        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        }

        throw new Error('无效的API响应');
    }
};

// 导出API模块
window.API = API;
