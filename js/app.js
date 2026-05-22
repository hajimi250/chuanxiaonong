// 主应用模块
const App = {
    // 当前对话
    currentChat: null,
    // 对话历史
    chats: [],
    // 是否正在生成
    isGenerating: false,
    // 存储键名
    CHATS_KEY: 'chuanxiaonong_chats',

    // 初始化
    init() {
        this.loadChats();
        this.bindEvents();
        this.renderChatHistory();
        this.initTextarea();
    },

    // 绑定事件
    bindEvents() {
        // 发送按钮
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());

        // 输入框
        document.getElementById('userInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 新对话按钮
        document.getElementById('newChatBtn').addEventListener('click', () => this.newChat());

        // 清除历史按钮
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearAllChats());

        // 设置按钮
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());

        // 快捷提示词
        document.querySelectorAll('.prompt-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const prompt = chip.dataset.prompt;
                document.getElementById('userInput').value = prompt;
                this.updateCharCount();
                this.updateSendButton();
                document.getElementById('userInput').focus();
            });
        });

        // 菜单切换（移动端）
        document.getElementById('menuToggle').addEventListener('click', () => this.toggleSidebar());

        // 点击遮罩关闭侧边栏
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menuToggle');
            if (sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    },

    // 初始化输入框
    initTextarea() {
        const textarea = document.getElementById('userInput');

        textarea.addEventListener('input', () => {
            // 自动调整高度
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';

            this.updateCharCount();
            this.updateSendButton();
        });
    },

    // 更新字符计数
    updateCharCount() {
        const textarea = document.getElementById('userInput');
        document.getElementById('charCount').textContent = textarea.value.length;
    },

    // 更新发送按钮状态
    updateSendButton() {
        const textarea = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = !textarea.value.trim() || this.isGenerating;
    },

    // 创建新对话
    newChat() {
        this.currentChat = {
            id: Date.now().toString(),
            title: '新对话',
            messages: [],
            createdAt: new Date().toISOString()
        };

        this.chats.unshift(this.currentChat);
        this.saveChats();
        this.renderChatHistory();
        this.renderMessages();
        this.showWelcome();

        // 关闭侧边栏（移动端）
        document.getElementById('sidebar').classList.remove('open');
    },

    // 切换对话
    switchChat(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (chat) {
            this.currentChat = chat;
            this.renderChatHistory();
            this.renderMessages();

            if (chat.messages.length === 0) {
                this.showWelcome();
            } else {
                this.hideWelcome();
            }
        }

        // 关闭侧边栏（移动端）
        document.getElementById('sidebar').classList.remove('open');
    },

    // 删除对话
    deleteChat(chatId, event) {
        event.stopPropagation();

        this.chats = this.chats.filter(c => c.id !== chatId);
        this.saveChats();

        if (this.currentChat && this.currentChat.id === chatId) {
            if (this.chats.length > 0) {
                this.switchChat(this.chats[0].id);
            } else {
                this.newChat();
            }
        }

        this.renderChatHistory();
    },

    // 发送消息
    async sendMessage() {
        const textarea = document.getElementById('userInput');
        const content = textarea.value.trim();

        if (!content || this.isGenerating) return;

        // 检查API配置
        if (!Config.isConfigured()) {
            this.openSettings();
            this.showError('请先配置API地址和密钥');
            return;
        }

        // 如果没有当前对话，创建新对话
        if (!this.currentChat) {
            this.newChat();
        }

        // 添加用户消息
        const userMessage = {
            role: 'user',
            content: content,
            timestamp: new Date().toISOString()
        };

        this.currentChat.messages.push(userMessage);

        // 更新对话标题（使用第一条消息的前20个字符）
        if (this.currentChat.messages.length === 1) {
            this.currentChat.title = content.substring(0, 20) + (content.length > 20 ? '...' : '');
            this.saveChats();
            this.renderChatHistory();
        }

        // 清空输入框
        textarea.value = '';
        textarea.style.height = 'auto';
        this.updateCharCount();
        this.updateSendButton();

        // 隐藏欢迎页面
        this.hideWelcome();

        // 渲染用户消息
        this.renderMessages();

        // 添加助手消息占位
        const assistantMessage = {
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString()
        };

        this.currentChat.messages.push(assistantMessage);
        this.renderMessages();

        // 显示加载状态
        this.isGenerating = true;
        this.updateSendButton();
        this.showLoading();

        // 准备消息历史（排除最后一条空的助手消息）
        const messageHistory = this.currentChat.messages
            .slice(0, -1)
            .map(m => ({ role: m.role, content: m.content }));

        // 调用API
        await API.sendMessage(
            messageHistory,
            // onChunk
            (chunk, fullContent) => {
                assistantMessage.content = fullContent;
                this.updateLastMessage(fullContent);
            },
            // onDone
            (fullContent) => {
                assistantMessage.content = fullContent;
                this.isGenerating = false;
                this.hideLoading();
                this.updateSendButton();
                this.saveChats();
                this.renderMessages();
            },
            // onError
            (error) => {
                console.error('API调用失败:', error);
                assistantMessage.content = `抱歉，发生了错误：${error.message}`;
                this.isGenerating = false;
                this.hideLoading();
                this.updateSendButton();
                this.saveChats();
                this.renderMessages();
            }
        );
    },

    // 渲染对话历史列表
    renderChatHistory() {
        const container = document.getElementById('chatHistory');
        container.innerHTML = '';

        this.chats.forEach(chat => {
            const item = document.createElement('div');
            item.className = `chat-history-item ${this.currentChat && this.currentChat.id === chat.id ? 'active' : ''}`;
            item.innerHTML = `
                <i class="fas fa-comment"></i>
                <span>${this.escapeHtml(chat.title)}</span>
                <button class="delete-chat" onclick="App.deleteChat('${chat.id}', event)">
                    <i class="fas fa-times"></i>
                </button>
            `;
            item.addEventListener('click', () => this.switchChat(chat.id));
            container.appendChild(item);
        });
    },

    // 渲染消息列表
    renderMessages() {
        const container = document.getElementById('messages');
        container.innerHTML = '';

        if (!this.currentChat) return;

        this.currentChat.messages.forEach((message, index) => {
            const messageEl = this.createMessageElement(message, index);
            container.appendChild(messageEl);
        });

        // 滚动到底部
        this.scrollToBottom();
    },

    // 创建消息元素
    createMessageElement(message, index) {
        const div = document.createElement('div');
        div.className = `message ${message.role}`;
        div.dataset.index = index;

        const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const avatarContent = message.role === 'user' ? '我' : '川';

        div.innerHTML = `
            <div class="message-avatar">${avatarContent}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${message.role === 'user' ? '你' : '川小农'}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-body">${this.renderMarkdown(message.content)}</div>
            </div>
        `;

        return div;
    },

    // 更新最后一条消息（流式输出）
    updateLastMessage(content) {
        const messages = document.querySelectorAll('.message');
        const lastMessage = messages[messages.length - 1];

        if (lastMessage) {
            const body = lastMessage.querySelector('.message-body');
            if (body) {
                body.innerHTML = this.renderMarkdown(content);
                this.scrollToBottom();
            }
        }
    },

    // 渲染Markdown
    renderMarkdown(content) {
        if (!content) return '';

        // 配置marked
        marked.setOptions({
            breaks: true,
            gfm: true
        });

        return marked.parse(content);
    },

    // 显示欢迎页面
    showWelcome() {
        document.getElementById('welcomeScreen').style.display = 'flex';
    },

    // 隐藏欢迎页面
    hideWelcome() {
        document.getElementById('welcomeScreen').style.display = 'none';
    },

    // 显示加载状态
    showLoading() {
        const container = document.getElementById('messages');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.innerHTML = `
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
        `;
        container.appendChild(loadingDiv);
        this.scrollToBottom();
    },

    // 隐藏加载状态
    hideLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.remove();
        }
    },

    // 显示错误
    showError(message) {
        // 简单的错误提示
        alert(message);
    },

    // 滚动到底部
    scrollToBottom() {
        const container = document.getElementById('chatContainer');
        container.scrollTop = container.scrollHeight;
    },

    // 打开设置
    openSettings() {
        const config = Config.getAll();
        document.getElementById('apiUrl').value = config.apiUrl;
        document.getElementById('apiKey').value = config.apiKey;
        document.getElementById('modelSelect').value = config.model;
        document.getElementById('systemPrompt').value = config.systemPrompt;
        document.getElementById('settingsModal').classList.add('active');
    },

    // 关闭设置
    closeSettings() {
        document.getElementById('settingsModal').classList.remove('active');
    },

    // 保存设置
    saveSettings() {
        Config.set('apiUrl', document.getElementById('apiUrl').value.trim());
        Config.set('apiKey', document.getElementById('apiKey').value.trim());
        Config.set('model', document.getElementById('modelSelect').value);
        Config.set('systemPrompt', document.getElementById('systemPrompt').value.trim());

        this.closeSettings();
        this.showSuccess('设置已保存');
    },

    // 显示成功提示
    showSuccess(message) {
        // 创建临时提示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2000);
    },

    // 切换侧边栏
    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
    },

    // 清除所有对话
    clearAllChats() {
        if (confirm('确定要清除所有对话历史吗？此操作不可撤销。')) {
            this.chats = [];
            this.currentChat = null;
            this.saveChats();
            this.newChat();
        }
    },

    // 加载对话历史
    loadChats() {
        try {
            const saved = localStorage.getItem(this.CHATS_KEY);
            this.chats = saved ? JSON.parse(saved) : [];

            if (this.chats.length > 0) {
                this.currentChat = this.chats[0];
                this.renderMessages();
                this.hideWelcome();
            }
        } catch (e) {
            console.error('加载对话历史失败:', e);
            this.chats = [];
        }
    },

    // 保存对话历史
    saveChats() {
        try {
            localStorage.setItem(this.CHATS_KEY, JSON.stringify(this.chats));
        } catch (e) {
            console.error('保存对话历史失败:', e);
        }
    },

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 导出应用模块
window.App = App;
