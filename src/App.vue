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

            <!-- Section: Analysis -->
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
import { GoldOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { goldApi } from './api/gold'
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

const currentUnit = computed(() => {
    return prices[selectedBank.value]?.currency || 'CNY/g'
})

const isRefreshing = computed(() => Object.values(loading).some(l => l))

const fetchAllPrices = async () => {
    sendHeartbeat()
    banks.forEach(async bank => {
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

const selectBank = (code: string) => {
    selectedBank.value = code
    fetchChartData()
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
