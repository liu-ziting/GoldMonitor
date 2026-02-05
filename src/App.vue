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
                    <button class="terminal-btn ai-trigger-btn" @click="fetchAiInsights" :disabled="isAiAnalyzing || Object.keys(prices).length === 0">
                        <robot-outlined :spin="isAiAnalyzing" />
                        <span>{{ isAiAnalyzing ? '分析中...' : 'AI 分析' }}</span>
                    </button>
                </div>

                <div class="ai-insights-grid">
                    <div class="minimal-card ai-card commentary-card">
                        <div class="ai-card-header">
                            <span class="ai-tag mono-text">/** AI 锐评 */</span>
                        </div>
                        <div class="ai-card-body" :class="{ 'is-loading': isAiAnalyzing }">
                            <p v-if="!isAiAnalyzing" class="mono-text">{{ aiCommentary || '等待分析中...' }}</p>
                            <div v-else class="ai-loading-skeleton">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
                            </div>
                        </div>
                    </div>

                    <div class="minimal-card ai-card analysis-card-ai">
                        <div class="ai-card-header">
                            <span class="ai-tag analysis mono-text">/** AI 分析 */</span>
                        </div>
                        <div class="ai-card-body" :class="{ 'is-loading': isAiAnalyzing }">
                            <p v-if="!isAiAnalyzing" class="mono-text">{{ aiAnalysis || '行情数据获取后，AI 分析将在此显示。' }}</p>
                            <div v-else class="ai-loading-skeleton">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
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
                <div class="footer-copyright">© 2026 GOLD_MONITOR_SYS. v1.0.0</div>
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

    isAiAnalyzing.value = true
    try {
        const priceSummary = Object.values(prices)
            .map(p => `${p.name}: ${p.price}${p.currency} (涨跌: ${p.change_pct}%)`)
            .join('\n')

        const prompt = `你是一个专业的黄金分析师。以下是当前最新的金价行情：\n${priceSummary}\n\n请提供两部分内容：\n1. AI锐评：用一两句幽默、犀利或富有洞察力的话评价当前行情。\n2. AI分析：从专业角度简要分析当前趋势和可能的投资建议。\n请严格按照以下JSON格式返回：{"commentary": "锐评内容", "analysis": "分析内容"}`

        const response = await aiService.chat([
            { role: 'system', content: '你是一个黄金市场专家，擅长犀利点评和深度分析。' },
            { role: 'user', content: prompt }
        ])

        const result = JSON.parse(response)
        aiCommentary.value = result.commentary
        aiAnalysis.value = result.analysis
    } catch (error) {
        console.error('AI Insights error:', error)
        aiCommentary.value = 'AI 思考断电了，请稍后再试。'
        aiAnalysis.value = '分析接口暂时不可用。'
    } finally {
        isAiAnalyzing.value = false
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
    font-size: 12px;
    padding: 4px 12px;
    border-radius: 6px;
    border: 1px solid var(--accent-green);
    color: var(--accent-green);
    display: inline-flex;
    align-items: center;
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
}

.selected-card::before {
    background: var(--primary-color) !important;
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
    grid-template-columns: 1fr 2fr;
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

.commentary-card .ai-card-body {
    color: var(--accent-orange);
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
    padding: 0 !important;
    overflow: hidden;
}

.analysis-controls {
    padding: 24px 32px;
    border-bottom: 1px solid var(--border-color);
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
        padding: 2px 8px;
        font-size: 11px;
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

    .section-title {
        font-size: 20px;
    }

    .price-grid {
        grid-template-columns: 1fr; /* Single column on mobile */
        gap: 16px;
    }

    .analysis-controls {
        padding: 16px;
        flex-direction: column;
        align-items: flex-start;
    }

    .bank-selector {
        width: 100%;
        overflow-x: auto;
        padding-bottom: 8px;
        -webkit-overflow-scrolling: touch;
    }

    .selector-btn {
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
