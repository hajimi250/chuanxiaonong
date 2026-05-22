// 配置管理模块
const Config = {
    // 默认配置
    defaults: {
        apiUrl: 'https://api.xiaomi.com/v1/chat/completions',
        apiKey: '',
        model: 'MiMo',
        systemPrompt: '你是川小农，一个专业的AI文案助手。你擅长创作各类营销文案、产品介绍、社交媒体内容、品牌故事等。请用专业、有创意的方式帮助用户完成文案创作任务。'
    },

    // 存储键名
    STORAGE_KEY: 'chuanxiaonong_config',

    // 获取配置
    get(key) {
        const saved = this.load();
        return saved[key] ?? this.defaults[key];
    },

    // 设置配置
    set(key, value) {
        const config = this.load();
        config[key] = value;
        this.save(config);
    },

    // 加载所有配置
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error('加载配置失败:', e);
            return {};
        }
    },

    // 保存所有配置
    save(config) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
        } catch (e) {
            console.error('保存配置失败:', e);
        }
    },

    // 获取所有配置（合并默认值）
    getAll() {
        const saved = this.load();
        return { ...this.defaults, ...saved };
    },

    // 重置配置
    reset() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    // 检查API是否已配置
    isConfigured() {
        const config = this.getAll();
        return config.apiUrl && config.apiKey;
    }
};

// 导出配置模块
window.Config = Config;
