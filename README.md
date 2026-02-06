# GoldMonitor

GoldMonitor 是一个极简风格的实时金价看板：同步多家银行与伦敦金报价，提供日内趋势图与关键统计卡（最高/最低/振幅/偏离均值/近 N 分钟变化），并支持一键生成 AI 洞察文本。

![Vue](https://img.shields.io/badge/Vue-3-4fc08d?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite)
![ECharts](https://img.shields.io/badge/ECharts-6-aa344d?logo=apache-echarts)

## 功能概览

- 实时行情：默认每 30 秒刷新一次，展示多家银行与伦敦金实时价格。
- 趋势图：展示日内走势（time 轴），鼠标悬停查看精确时间与价格。
- 关键统计卡：趋势图上方展示今日最高/最低/振幅/偏离均值/最近 N 分钟变化。
- 在线人数：通过心跳接口显示在线计数（可作为访问量近似指标）。
- AI 洞察：将实时行情汇总为提示词，调用外部 AI 服务输出“锐评”和“分析”。

## 技术栈

- Vue 3 + TypeScript
- Vite
- Apache ECharts
- Ant Design Vue（主要用于 Icon）
- axios
- dayjs

## 目录结构

**核心页面**

- [App.vue](file:///d:/lztcode/GoldMonitor/src/App.vue)：页面布局、拉取行情、拉取图表、AI 洞察、定时刷新。

**组件**

- [PriceCard.vue](file:///d:/lztcode/GoldMonitor/src/components/PriceCard.vue)：单个报价卡片。
- [TrendChart.vue](file:///d:/lztcode/GoldMonitor/src/components/TrendChart.vue)：趋势图 + 关键统计卡。

**接口封装**

- [gold.ts](file:///d:/lztcode/GoldMonitor/src/api/gold.ts)：行情/图表/心跳 API。
- [ai.ts](file:///d:/lztcode/GoldMonitor/src/api/ai.ts)：AI 对话接口。

**类型**

- [gold.ts](file:///d:/lztcode/GoldMonitor/src/types/gold.ts)：接口响应与数据类型定义。

## 环境要求

- Node.js：建议 20+（或 22 LTS）
- npm：与 Node 版本匹配即可

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

生产构建（包含类型检查）：

```bash
npm run build
```

本地预览构建产物：

```bash
npm run preview
```

## 数据接口说明

本项目的金价数据来源为 `jin.20021002.xyz`，通过同一个入口地址以不同参数区分接口（见 [goldApi](file:///d:/lztcode/GoldMonitor/src/api/gold.ts)）。

**Base URL**

- `https://jin.20021002.xyz/api.php`

**实时价格**

- `GET /api.php?type=zs`
- `GET /api.php?type=ms`
- `GET /api.php?type=icbc`
- `GET /api.php?type=cgb`
- `GET /api.php?type=cib`
- `GET /api.php?type=gj`

返回结构（示意）：

```json
{
    "code": 200,
    "msg": "ok",
    "data": {
        "name": "浙商银行",
        "currency": "CNY/g",
        "price": 0,
        "prev_close": 0,
        "change": 0,
        "change_pct": 0,
        "update_time": "HH:mm:ss"
    }
}
```

**日内走势图**

- `GET /api.php?action=chart&type=zs`

返回结构（示意）：

```json
{
    "code": 200,
    "msg": "ok",
    "data": [{ "t": 0, "p": 0 }]
}
```

其中 `t` 为秒级时间戳，`p` 为价格。

**在线人数心跳**

- `GET /api.php?action=heartbeat`

## AI 接口说明

AI 服务由前端直接请求（见 [aiService](file:///d:/lztcode/GoldMonitor/src/api/ai.ts)），默认地址为：

- `POST https://silverera-api.lz-t.top/api/ai-chat`

请求体：

```json
{
    "messages": [{ "role": "user", "content": "..." }]
}
```

前端会发起两次请求：

- 第一次：AI 锐评（1~2 句话，偏幽默/犀利）
- 第二次：AI 分析（结构化要点 + 风险提示）

AI 分析请求会携带更“详细的数据”，至少包括：

- 当前价、昨收（`prev_close`）、较昨收涨跌与涨跌幅
- 接口返回的 `change` / `change_pct` / `update_time`
- 基于日内图表点位计算的统计：最高/最低/振幅/均值/偏离均值/近 30 分钟变化

如果你要替换为自己的 AI 网关/模型服务，直接改：

- [ai.ts](file:///d:/lztcode/GoldMonitor/src/api/ai.ts) 中的 `WORKER_URL`

## 配置与二次开发

**新增/调整银行或品类**

- 在 [App.vue](file:///d:/lztcode/GoldMonitor/src/App.vue) 的 `banks` 数组中添加 `{ code, name }`。
- `code` 会作为 `type` 参数传给金价接口。

**调整“最近 N 分钟变化”的窗口**

- 组件支持 `changeWindowMinutes` prop（默认 30）。
- 你可以在 [App.vue](file:///d:/lztcode/GoldMonitor/src/App.vue) 中给 `TrendChart` 传入 `:changeWindowMinutes="15"` 之类的值。

**统计卡的计算口径**

- 统计基于 `TrendChart` 接收到的日内数据点计算：最高、最低、振幅（max-min）、均值（简单平均）、偏离（最新价-均值）、窗口变化（最新价-窗口基准价）。

## 部署

### 静态托管（任意平台）

1. 构建产物：

```bash
npm run build
```

2. 将 `dist/` 目录上传到你的静态托管平台即可。

### Cloudflare Workers 静态资源（Wrangler）

仓库内提供了 `wrangler.jsonc`，使用 Workers 的静态资源能力发布 `dist/`（见 [wrangler.jsonc](file:///d:/lztcode/GoldMonitor/wrangler.jsonc)）。

```bash
npm run build
npx wrangler login
npx wrangler deploy
```

## 常见问题

**构建输出提示 chunk 过大**

- 这是 Vite 的告警，不影响部署。
- 若要优化体积，可考虑按需加载 ECharts、或做路由拆分（当前项目是单页，无路由）。

**时间显示与时区**

- 趋势图当前以 UTC 方式格式化时间轴与 tooltip（见 [TrendChart.vue](file:///d:/lztcode/GoldMonitor/src/components/TrendChart.vue)），如需展示本地时区，可调整 dayjs 的格式化逻辑。

**如何移除 Clarity 统计**

- 入口页面包含 Microsoft Clarity 注入脚本，位置在 [index.html](file:///d:/lztcode/GoldMonitor/index.html)。
