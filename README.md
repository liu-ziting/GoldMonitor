# GoldMonitor 🪙

一个极致简约、极客风格的实时金价监控与 AI 分析平台。

![Vue 3](https://img.shields.io/badge/Vue.js-3.x-4fc08d?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff?logo=vite)
![ECharts](https://img.shields.io/badge/ECharts-6.x-aa344d?logo=apache-echarts)

## ✨ 项目特性

- **实时监控**：每 30 秒自动同步多家银行（浙商、民生、工行、广发、兴业等）及伦敦金的实时报价。
- **极客 UI**：采用类终端（Terminal）风格设计，配备网格背景、Monospace 字体、红黄绿状态灯装饰，极致冷静与美观。
- **趋势可视化**：基于 ECharts 定制开发的交互式折线图，支持查看各行历史价格走势及日内最高/最低点。
- **AI 洞察**：集成深度学习模型，一键生成“AI 锐评”与“AI 分析”，从专业与幽默的双重维度解读行情。
- **深度适配**：完美适配移动端与 PC 端，确保在各种屏幕尺寸下均能获得流畅的阅读体验。

## 🛠️ 技术栈

- **前端框架**: Vue 3 (Composition API)
- **开发语言**: TypeScript
- **构建工具**: Vite
- **图表库**: Apache ECharts
- **图标库**: Ant Design Icons Vue
- **日期处理**: Day.js
- **部署方案**: Cloudflare Pages / Wrangler

## 🚀 快速开始

### 环境准备

- Node.js 22.x 或更高版本
- npm 10.x 或更高版本

### 安装与运行

1. **克隆仓库**
   ```bash
   git clone https://github.com/liu-ziting/GoldMonitor.git
   cd GoldMonitor
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **本地开发**
   ```bash
   npm run dev
   ```

4. **生产构建**
   ```bash
   npm run build
   ```

## 🌐 部署

本项目支持通过 Cloudflare Wrangler 快速部署：

```bash
# 部署至 Cloudflare Pages
npx wrangler deploy
```

相关配置请参考 `wrangler.jsonc`。

## 📄 开源协议

本项目采用 MIT 协议开源。

---

**作者**: [liu-ziting](https://github.com/liu-ziting/)
**数据来源**: jin.20021002.xyz
