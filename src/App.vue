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
                    <div class="status-indicator">
                        <span class="pulse-dot"></span>
                        <span>当前在线: {{ onlineCount }}</span>
                    </div>
                    <button class="refresh-btn" @click="fetchAllPrices" :disabled="isRefreshing">
                        <reload-outlined :spin="isRefreshing" />
                        <span>刷新数据</span>
                    </button>
                </div>
            </div>
        </header>

        <main class="main-content">
            <!-- Section: Real-time Data -->
            <section class="data-section">
                <div class="section-header">
                    <h2 class="section-title">实时行情</h2>
                    <p class="section-desc">同步各大银行最新金价数据，每 30 秒自动更新</p>
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
                    <h2 class="section-title">趋势分析</h2>
                </div>

                <div class="analysis-card minimal-card">
                    <div class="analysis-controls">
                        <div class="control-label">查看历史数据:</div>
                        <div class="bank-selector">
                            <button v-for="bank in banks" :key="bank.code" class="selector-btn" :class="{ active: selectedBank === bank.code }" @click="selectBank(bank.code)">
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
                    <h2 class="section-title">AI 洞察</h2>
                    <button class="ai-trigger-btn" @click="fetchAiInsights" :disabled="isAiAnalyzing || Object.keys(prices).length === 0">
                        <robot-outlined :spin="isAiAnalyzing" />
                        <span>{{ isAiAnalyzing ? '正在深度分析行情...' : '点击获取 AI 锐评 & 分析' }}</span>
                    </button>
                </div>

                <div class="ai-insights-grid">
                    <div class="minimal-card ai-card commentary-card">
                        <div class="ai-card-header">
                            <span class="ai-tag">AI 锐评</span>
                        </div>
                        <div class="ai-card-body" :class="{ 'is-loading': isAiAnalyzing }">
                            <p v-if="!isAiAnalyzing">{{ aiCommentary || '等待数据分析...' }}</p>
                            <div v-else class="ai-loading-skeleton">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
                            </div>
                        </div>
                    </div>

                    <div class="minimal-card ai-card analysis-card-ai">
                        <div class="ai-card-header">
                            <span class="ai-tag analysis">AI 分析</span>
                        </div>
                        <div class="ai-card-body" :class="{ 'is-loading': isAiAnalyzing }">
                            <p v-if="!isAiAnalyzing">{{ aiAnalysis || '等待行情数据获取后开始分析...' }}</p>
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
            <div class="footer-inner">
                <div class="footer-info">
                    <span>系统状态: 运行正常</span>
                    <span class="dot-separator"></span>
                    <span>数据来源: jin.20021002.xyz</span>
                </div>
                <div class="footer-copyright">© 2026 GoldMonitor System. All rights reserved.</div>
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
    height: 72px;
    display: flex;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.header-inner {
    max-width: 1280px;
    width: 100%;
    margin: 0 auto;
    padding: 0 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.brand {
    display: flex;
    align-items: center;
    gap: 12px;
}

.brand-logo {
    font-size: 28px;
    color: var(--primary-color);
    background: #e6f7ff;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
}

.brand-name {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-main);
    display: block;
}

.brand-tag {
    font-size: 12px;
    color: var(--text-secondary);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 32px;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-secondary);
}

.pulse-dot {
    width: 8px;
    height: 8px;
    background: var(--down-color);
    border-radius: 50%;
    position: relative;
}

.pulse-dot::after {
    content: '';
    position: absolute;
    inset: -4px;
    background: var(--down-color);
    border-radius: 50%;
    opacity: 0.3;
    animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
    0% {
        transform: scale(0.5);
        opacity: 0.5;
    }
    100% {
        transform: scale(2);
        opacity: 0;
    }
}

.refresh-btn {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
}

.refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.main-content {
    max-width: 1280px;
    width: 100%;
    margin: 0 auto;
    padding: 48px 32px;
    flex: 1;
}

.section-header {
    margin-bottom: 32px;
}

.section-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 8px;
}

.section-desc {
    color: var(--text-secondary);
    font-size: 14px;
}

.price-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    margin-bottom: 64px;
}

.selected-card {
    border-color: var(--primary-color) !important;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

/* AI Insights Styles */
.ai-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.ai-trigger-btn {
    background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.ai-trigger-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(24, 144, 255, 0.3);
    filter: brightness(1.1);
}

.ai-trigger-btn:active:not(:disabled) {
    transform: translateY(0);
}

.ai-trigger-btn:disabled {
    background: #f5f5f5;
    color: #bfbfbf;
    cursor: not-allowed;
    box-shadow: none;
}

.ai-insights-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 24px;
    margin-bottom: 24px;
}

.ai-card {
    padding: 24px !important;
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: all 0.3s ease;
}

.ai-card-header {
    display: flex;
    align-items: center;
}

.ai-tag {
    background: #e6f7ff;
    color: #1890ff;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.ai-tag.analysis {
    background: #f6ffed;
    color: #52c41a;
}

.ai-card-body {
    font-size: 15px;
    line-height: 1.6;
    color: var(--text-main);
}

.commentary-card .ai-card-body {
    font-style: italic;
    font-size: 16px;
    color: #262626;
    font-weight: 500;
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
    .header-inner {
        padding: 0 16px;
    }
    .header-actions {
        gap: 12px;
    }
    .status-indicator {
        display: none; /* Hide on small mobile to save space */
    }
    .brand-logo {
        width: 36px;
        height: 36px;
        font-size: 20px;
    }
    .brand-name {
        font-size: 16px;
    }

    .main-content {
        padding: 24px 16px;
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
