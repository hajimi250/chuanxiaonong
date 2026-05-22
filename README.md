# 川小农 - AI文案助手

一个基于小米大模型的AI文案助手，通过GitHub Pages部署，提供专业的文案创作服务。

## 功能特点

- AI对话式文案创作
- 支持多种文案类型：营销文案、产品介绍、社交媒体、品牌故事等
- 流式输出，实时显示生成内容
- 对话历史本地保存
- 响应式设计，支持移动端访问

## 技术栈

- 前端：HTML5 + CSS3 + JavaScript
- 大模型：小米大模型API（OpenAI兼容格式）
- 部署：GitHub Pages

## 部署步骤

### 1. Fork或克隆本项目

```bash
git clone https://github.com/yourusername/chuanxiaonong.git
```

### 2. 配置GitHub Secrets

在GitHub仓库的 Settings -> Secrets and variables -> Actions 中添加以下Secrets：

- `XIAOMI_API_URL`: 小米API地址
- `XIAOMI_API_KEY`: 小米API密钥

### 3. 启用GitHub Pages

在仓库的 Settings -> Pages 中：
- Source 选择 "GitHub Actions"

### 4. 推送代码

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

GitHub Actions会自动构建并部署到GitHub Pages。

## 本地开发

直接在浏览器中打开 `index.html` 即可本地预览。

需要配置API时，点击右上角设置图标，输入API地址和密钥。

## 项目结构

```
├── index.html              # 主页面
├── css/
│   └── style.css          # 样式文件
├── js/
│   ├── config.js          # 配置管理
│   ├── api.js             # API调用模块
│   └── app.js             # 主应用逻辑
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions部署配置
└── README.md              # 项目说明
```

## 使用说明

1. 访问部署后的网站
2. 点击"新对话"开始
3. 输入您的文案需求
4. 等待AI生成文案

## 许可证

MIT License
