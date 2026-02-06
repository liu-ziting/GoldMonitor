<template>
    <div class="app-container">
        <header class="main-header">
            <div class="header-inner">
                <div class="brand">
                    <div class="brand-logo">
                        <gold-outlined />
                    </div>
                    <div class="brand-text">
                        <span class="brand-name">GoldMonitor</span>
                        <span class="brand-tag">实时金价监控</span>
                    </div>
                </div>

                <div class="header-actions">
                    <div class="status-pill">
                        <span class="online-count">在线: {{ onlineCount }}</span>
                    </div>
                    <button class="terminal-btn" @click="fetchAllPrices" :disabled="isRefreshing">
                        <reload-outlined :spin="isRefreshing" />
                        <span>刷新</span>
                    </button>
                </div>
            </div>
        </header>

        <main class="main-content">
            <!-- Section: Real-time Data -->
            <section class="data-section">
                <div class="section-header">
                    <h2 class="section-title mono-text">// 实时行情</h2>
                    <p class="section-desc">同步最新金价数据，每 30 秒自动更新</p>
                </div>

                <div class="price-grid">
                    <div v-for="bank in banks" :key="bank.code">
                        <PriceCard
                            :data="prices[bank.code]"
                            :loading="loading[bank.code]"
                            @click="selectBank(bank.code)"
                            :class="{ 'selected-card': selectedBank === bank.code }"
                        />
                    </div>
                </div>
            </section>

            <!-- Section: Trend -->
            <section class="analysis-section">
                <div class="section-header">
                    <h2 class="section-title mono-text">> 趋势分析</h2>
                </div>

                <div class="analysis-card minimal-card">
                    <div class="analysis-controls">
                        <div class="control-label mono-text">查看历史数据:</div>
                        <div class="bank-selector">
                            <button
                                v-for="bank in banks"
                                :key="bank.code"
                                class="selector-btn mono-text"
                                :class="{ active: selectedBank === bank.code }"
                                @click="selectBank(bank.code)"
                            >
                                {{ bank.name }}
                            </button>
                        </div>
                    </div>

                    <TrendChart :data="chartData" :loading="chartLoading" :unit="currentUnit" />
                </div>
            </section>

            <!-- Section: AI Insights -->
            <section class="analysis-section">
                <div class="section-header ai-header">
                    <h2 class="section-title mono-text">> AI 洞察</h2>
                    <button class="terminal-btn ai-trigger-btn" @click="fetchAiInsights" :disabled="isAiBusy || Object.keys(prices).length === 0">
                        <robot-outlined :spin="isAiBusy" />
                        <span>{{ isAiBusy ? '生成中...' : 'AI 洞察' }}</span>
                    </button>
                </div>

                <div class="ai-insights-grid">
                    <div class="minimal-card ai-card analysis-card-ai">
                        <div class="ai-card-header">
                            <span class="ai-tag analysis mono-text">/** AI 分析 */</span>
                        </div>
                        <div class="ai-card-body" :class="{ 'is-loading': isAiAnalyzing }">
                            <div v-if="!isAiAnalyzing" class="ai-md mono-text" v-html="aiAnalysisHtml || '行情数据获取后，AI 分析将在此显示。'"></div>
                            <div v-else class="ai-loading-skeleton">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
                            </div>

                            <div class="ai-commentary-block" :class="{ 'is-loading': isAiCommenting }">
                                <div v-if="!isAiCommenting" class="ai-md mono-text ai-commentary-inline" v-html="aiCommentaryHtml || '等待锐评中...'"></div>
                                <div v-else class="ai-loading-skeleton">
                                    <div class="skeleton-line"></div>
                                    <div class="skeleton-line short"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <footer class="main-footer">
            <div class="footer-inner mono-text">
                <div class="footer-info">
                    <span>系统状态: 运行正常</span>
                    <span class="dot-separator"></span>
                    <span>数据来源: jin.20021002.xyz</span>
                </div>
                <div class="footer-copyright">© 2026 <a href="https://github.com/liu-ziting/" target="_blank" class="author-link">github.com/liu-ziting</a></div>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { GoldOutlined, ReloadOutlined, RobotOutlined } from '@ant-design/icons-vue'
import { goldApi } from './api/gold'
import { aiService } from './api/ai'
import type { GoldPriceData, ChartDataPoint } from './types/gold'
import PriceCard from './components/PriceCard.vue'
import TrendChart from './components/TrendChart.vue'

const banks = [
    { code: 'zs', name: '浙商银行' },
    { code: 'ms', name: '民生银行' },
    { code: 'icbc', name: '工商银行' },
    { code: 'cgb', name: '广发银行' },
    { code: 'cib', name: '兴业银行' },
    { code: 'gj', name: '伦敦金' }
]

const prices = reactive<Record<string, GoldPriceData>>({})
const loading = reactive<Record<string, boolean>>({})
const onlineCount = ref(0)
const selectedBank = ref('zs')
const chartData = ref<ChartDataPoint[]>([])
const chartLoading = ref(false)

const aiCommentary = ref('')
const aiAnalysis = ref('')
const isAiAnalyzing = ref(false)
const isAiCommenting = ref(false)

const isAiBusy = computed(() => isAiAnalyzing.value || isAiCommenting.value)

const escapeHtml = (input: string) => {
    return String(input || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

const markdownToHtml = (md: string) => {
    const normalized = String(md || '').replace(/\r\n/g, '\n')
    const blocks: string[] = []

    let inCode = false
    let codeLang = ''
    let codeLines: string[] = []
    let listMode: 'ul' | 'ol' | null = null
    let listItems: string[] = []
    let paraLines: string[] = []

    const flushParagraph = () => {
        if (!paraLines.length) return
        const text = escapeHtml(paraLines.join(' ').trim())
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+?)`/g, '<code>$1</code>')
        blocks.push(`<p>${text}</p>`)
        paraLines = []
    }

    const flushList = () => {
        if (!listMode || !listItems.length) {
            listMode = null
            listItems = []
            return
        }
        const tag = listMode === 'ol' ? 'ol' : 'ul'
        const itemsHtml = listItems
            .map(item =>
                escapeHtml(item)
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/`([^`]+?)`/g, '<code>$1</code>')
            )
            .map(item => `<li>${item}</li>`)
            .join('')
        blocks.push(`<${tag}>${itemsHtml}</${tag}>`)
        listMode = null
        listItems = []
    }

    const flushCode = () => {
        if (!codeLines.length) {
            inCode = false
            codeLang = ''
            return
        }
        const code = escapeHtml(codeLines.join('\n'))
        const langClass = codeLang ? ` class="language-${escapeHtml(codeLang)}"` : ''
        blocks.push(`<pre><code${langClass}>${code}</code></pre>`)
        inCode = false
        codeLang = ''
        codeLines = []
    }

    for (const rawLine of normalized.split('\n')) {
        const line = rawLine.replace(/\s+$/g, '')

        const fenceMatch = line.match(/^```(\w+)?\s*$/)
        if (fenceMatch) {
            if (inCode) {
                flushCode()
            } else {
                flushParagraph()
                flushList()
                inCode = true
                codeLang = fenceMatch[1] || ''
                codeLines = []
            }
            continue
        }

        if (inCode) {
            codeLines.push(rawLine)
            continue
        }

        if (!line.trim()) {
            flushParagraph()
            flushList()
            continue
        }

        const headingMatch = line.match(/^(#{1,4})\s+(.+)\s*$/)
        if (headingMatch) {
            flushParagraph()
            flushList()
            const level = Math.min(4, (headingMatch[1] || '').length)
            const content = escapeHtml(headingMatch[2] || '')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/`([^`]+?)`/g, '<code>$1</code>')
            blocks.push(`<h${level}>${content}</h${level}>`)
            continue
        }

        const quoteMatch = line.match(/^>\s?(.+)\s*$/)
        if (quoteMatch) {
            flushParagraph()
            flushList()
            const content = escapeHtml(quoteMatch[1] || '')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/`([^`]+?)`/g, '<code>$1</code>')
            blocks.push(`<blockquote>${content}</blockquote>`)
            continue
        }

        const ulMatch = line.match(/^\s*[-*]\s+(.+)\s*$/)
        if (ulMatch) {
            flushParagraph()
            if (listMode && listMode !== 'ul') flushList()
            listMode = 'ul'
            listItems.push(ulMatch[1] || '')
            continue
        }

        const olMatch = line.match(/^\s*\d+\.\s+(.+)\s*$/)
        if (olMatch) {
            flushParagraph()
            if (listMode && listMode !== 'ol') flushList()
            listMode = 'ol'
            listItems.push(olMatch[1] || '')
            continue
        }

        if (listMode) {
            flushList()
        }

        paraLines.push(line.trim())
    }

    flushParagraph()
    flushList()
    flushCode()

    return blocks.join('')
}

const aiAnalysisHtml = computed(() => markdownToHtml(aiAnalysis.value))
const aiCommentaryHtml = computed(() => markdownToHtml(aiCommentary.value))

const currentUnit = computed(() => {
    return prices[selectedBank.value]?.currency || 'CNY/g'
})

const isRefreshing = computed(() => Object.values(loading).some(l => l))

const fetchAllPrices = async () => {
    sendHeartbeat()
    const promises = banks.map(async bank => {
        loading[bank.code] = true
        try {
            const res = await goldApi.getPrice(bank.code)
            if (res.code === 200) {
                prices[bank.code] = res.data
            }
        } catch (error) {
            console.error(`Fetch price error for ${bank.code}:`, error)
        } finally {
            loading[bank.code] = false
        }
    })

    await Promise.all(promises)
}

const fetchChartData = async () => {
    chartLoading.value = true
    try {
        const res = await goldApi.getChartData(selectedBank.value)
        if (res.code === 200) {
            chartData.value = res.data
        }
    } catch (error) {
        console.error('Fetch chart data error:', error)
    } finally {
        chartLoading.value = false
    }
}

const sendHeartbeat = async () => {
    try {
        const res = await goldApi.heartbeat()
        if (res.code === 200) {
            onlineCount.value = res.data.count
        }
    } catch (error) {
        console.error('Heartbeat error:', error)
    }
}

const fetchAiInsights = async () => {
    if (Object.keys(prices).length === 0) return

    const snapshot = Object.values(prices).map(p => ({
        name: p.name,
        symbol: p.symbol,
        currency: p.currency,
        price: p.price,
        prev_close: p.prev_close ?? null,
        change: p.change,
        change_pct: p.change_pct,
        update_time: p.update_time
    }))

    const focus = prices[selectedBank.value]

    const parseJson = (text: string) => {
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        if (start === -1 || end === -1 || end <= start) throw new Error('Invalid JSON response')
        return JSON.parse(text.slice(start, end + 1))
    }

    aiAnalysis.value = ''
    aiCommentary.value = ''

    isAiAnalyzing.value = true
    try {
        const prompt = `你是一个专业的黄金分析师。请基于以下行情快照做分析，重点关注“焦点”对应的品种。\n\n焦点: ${focus?.name ?? selectedBank.value}\n行情快照(JSON):\n${JSON.stringify(snapshot, null, 2)}\n\n输出要求：\n1) 直接输出 Markdown，用清晰标题/要点/列表呈现重点\n2) 必须包含“昨日收盘价”字段（若无数据写“暂无数据”）\n3) 结构建议：\n   - # 结论（3条要点）\n   - ## 关键数据（现价/昨日收盘/涨跌幅/更新时间）\n   - ## 趋势与关键位（支撑/压力/动能）\n   - ## 风险与关注（3条）\n4) 语言专业、克制，不要夸大，不要输出投资承诺\n5) 严格输出 JSON（不要代码块、不要多余文字）：{\"analysis_md\":\"...\"}`

        const response = await aiService.chat([
            { role: 'system', content: '你是黄金市场分析师，擅长结构化输出与风险提示。' },
            { role: 'user', content: prompt }
        ])

        const result = parseJson(response)
        aiAnalysis.value = result.analysis_md || ''
    } catch (error) {
        console.error('AI Analysis error:', error)
        aiAnalysis.value = '分析接口暂时不可用。'
    } finally {
        isAiAnalyzing.value = false
    }

    isAiCommenting.value = true
    try {
        const prompt = `你是一个擅长金融段子的锐评作者。基于以下行情快照，给出 1-2 句幽默、犀利但不冒犯的“AI锐评”。\n\n行情快照(JSON):\n${JSON.stringify(snapshot, null, 2)}\n\n要求：\n1) 输出 Markdown（建议用 > 引用块 或 **加粗**）\n2) 内容只要一句到两句中文\n3) 严格输出 JSON（不要代码块、不要多余文字）：{\"commentary_md\":\"...\"}`

        const response = await aiService.chat([
            { role: 'system', content: '你会用简短、有梗但不过界的语言点评行情。' },
            { role: 'user', content: prompt }
        ])

        const result = parseJson(response)
        aiCommentary.value = result.commentary_md || ''
    } catch (error) {
        console.error('AI Commentary error:', error)
        aiCommentary.value = 'AI 思考断电了，请稍后再试。'
    } finally {
        isAiCommenting.value = false
    }
}

const fetchSinglePrice = async (code: string) => {
    loading[code] = true
    try {
        const res = await goldApi.getPrice(code)
        if (res.code === 200) {
            prices[code] = res.data
        }
    } catch (error) {
        console.error(`Fetch price error for ${code}:`, error)
    } finally {
        loading[code] = false
    }
}

const selectBank = (code: string) => {
    selectedBank.value = code
    fetchChartData()
    fetchSinglePrice(code)
}

let priceTimer: any

onMounted(() => {
    fetchAllPrices()
    fetchChartData()

    priceTimer = setInterval(fetchAllPrices, 30000)
})

onUnmounted(() => {
    clearInterval(priceTimer)
})
</script>

<style scoped>
.app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.main-header {
    background: #ffffff;
    height: 60px;
    display: flex;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid var(--border-color);
}

.header-inner {
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: 0 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.brand {
    display: flex;
    align-items: center;
    gap: 16px;
}

.brand-logo {
    font-size: 24px;
    color: var(--primary-color);
    background: #fffafa;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

.brand-name {
    font-family: var(--font-mono);
    font-size: 18px;
    font-weight: 700;
    color: var(--text-main);
    display: block;
}

.brand-tag {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-secondary);
    opacity: 0.8;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 24px;
}

.status-pill {
    font-family: var(--font-mono);
    font-size: 13px;
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid var(--accent-green);
    color: var(--accent-green);
    display: inline-flex;
    align-items: center;
    line-height: 1;
    gap: 8px;
}

.status-pill::before {
    content: '';
    width: 6px;
    height: 6px;
    background: var(--accent-green);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--accent-green);
}

.online-count {
    /* Removed border and padding since it's the only child now */
}

.main-content {
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
    padding: 60px 40px;
    flex: 1;
}

.section-header {
    margin-bottom: 40px;
}

.section-title {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 12px;
    letter-spacing: -0.5px;
}

.section-desc {
    color: var(--text-secondary);
    font-size: 14px;
    font-family: var(--font-mono);
}

.price-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    margin-bottom: 80px;
}

.selected-card {
    border-color: var(--primary-color) !important;
    box-shadow: 0 4px 12px rgba(255, 118, 117, 0.1);
}

/* AI Insights Styles */
.ai-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.ai-trigger-btn {
    border-radius: 20px !important;
    padding: 8px 20px !important;
    background: #000 !important;
    color: #fff !important;
    border: none !important;
}

.ai-trigger-btn::before {
    display: none;
}

.ai-trigger-btn:hover {
    background: #333 !important;
}

.ai-insights-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    margin-bottom: 24px;
}

.ai-card {
    padding: 32px !important;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.ai-tag {
    background: transparent;
    color: var(--text-secondary);
    padding: 0;
    font-size: 13px;
    font-weight: 500;
}

.ai-card-body {
    font-size: 14px;
    line-height: 1.7;
}

.ai-commentary-block {
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px dashed var(--border-color);
}

.ai-commentary-inline {
    color: var(--accent-orange);
}

.ai-md :deep(h1),
.ai-md :deep(h2),
.ai-md :deep(h3),
.ai-md :deep(h4) {
    margin: 10px 0 8px;
    font-weight: 700;
    letter-spacing: -0.2px;
}

.ai-md :deep(p) {
    margin: 8px 0;
}

.ai-md :deep(ul),
.ai-md :deep(ol) {
    margin: 8px 0;
    padding-left: 18px;
}

.ai-md :deep(li) {
    margin: 6px 0;
}

.ai-md :deep(strong) {
    color: var(--text-main);
}

.ai-md :deep(code) {
    background: #f6f6f6;
    padding: 2px 6px;
    border-radius: 6px;
    font-family: var(--font-mono);
    font-size: 12px;
}

.ai-md :deep(pre) {
    background: #0b0b0b;
    color: #f6f6f6;
    padding: 12px;
    border-radius: 10px;
    overflow: auto;
    margin: 10px 0;
}

.ai-md :deep(blockquote) {
    margin: 8px 0;
    padding: 10px 12px;
    border-left: 3px solid var(--accent-orange);
    background: #fff7f2;
    border-radius: 10px;
}

.ai-loading-skeleton {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.skeleton-line {
    height: 12px;
    background: #f0f0f0;
    border-radius: 6px;
    width: 100%;
    animation: skeleton-pulse 1.5s infinite ease-in-out;
}

.skeleton-line.short {
    width: 60%;
}

@keyframes skeleton-pulse {
    0% {
        opacity: 1;
    }
    50% {
        opacity: 0.4;
    }
    100% {
        opacity: 1;
    }
}

@media (max-width: 992px) {
    .ai-insights-grid {
        grid-template-columns: 1fr;
    }
}

.analysis-section {
    margin-top: 64px;
}

.analysis-card {
    padding: 32px 0 0 !important;
    overflow: hidden;
}

.analysis-controls {
    padding: 16px 32px 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    background: #fafafa;
}

.control-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
}

.bank-selector {
    display: flex;
    gap: 8px;
}

.selector-btn {
    background: white;
    border: 1px solid var(--border-color);
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
}

.selector-btn:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
}

.selector-btn.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
}

.main-footer {
    background: #ffffff;
    padding: 48px 0;
    border-top: 1px solid var(--border-color);
}

.footer-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.footer-info {
    display: flex;
    align-items: center;
    gap: 16px;
    color: var(--text-secondary);
    font-size: 14px;
}

.dot-separator {
    width: 4px;
    height: 4px;
    background: #d9d9d9;
    border-radius: 50%;
}

.footer-copyright {
    color: var(--text-secondary);
    font-size: 14px;
}

.author-link {
    color: var(--text-main);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
}

.author-link:hover {
    color: var(--primary-color);
}

@media (max-width: 768px) {
    .main-header {
        height: auto;
        padding: 12px 0;
    }

    .header-inner {
        padding: 0 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
    }

    .brand {
        gap: 8px;
    }

    .brand-logo {
        width: 32px;
        height: 32px;
        font-size: 18px;
        border-radius: 6px;
    }

    .brand-name {
        font-size: 15px;
    }

    .brand-tag {
        display: none;
    }

    .header-actions {
        gap: 8px;
        margin-left: auto;
    }

    .status-pill {
        padding: 4px 10px;
        font-size: 12px;
    }

    .online-count {
        padding-left: 0;
        border-left: none;
    }

    .terminal-btn {
        padding: 4px 10px;
        font-size: 12px;
    }

    .terminal-btn span {
        font-size: 11px;
    }

    .status-pill::before {
        width: 6px;
        height: 6px;
    }

    .terminal-btn::before {
        font-size: 11px;
    }

    .main-content {
        padding: 20px 12px;
    }

    .analysis-section {
        margin-top: 32px;
    }

    .section-header {
        margin-bottom: 20px;
    }

    .section-title {
        font-size: 20px;
    }

    .price-grid {
        grid-template-columns: 1fr; /* Single column on mobile */
        gap: 16px;
    }

    .analysis-card {
        padding: 32px 0 0 !important;
    }

    .analysis-controls {
        padding: 12px 16px;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .control-label {
        font-size: 13px;
        margin-bottom: 4px;
    }

    .bank-selector {
        width: calc(100% + 32px);
        margin: 0 -16px;
        padding: 0 16px 8px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        display: flex;
        gap: 8px;
    }

    .selector-btn {
        padding: 6px 12px;
        font-size: 12px;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .footer-inner {
        flex-direction: column;
        text-align: center;
        gap: 12px;
        padding: 0 16px;
    }

    .footer-info {
        flex-direction: column;
        gap: 8px;
    }

    .dot-separator {
        display: none;
    }
}
</style>
