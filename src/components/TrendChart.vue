<template>
    <div class="minimal-card chart-card" :class="{ 'is-loading': loading }">
        <div class="chart-header">
            <div class="header-left">
                <h3 class="chart-title mono-text">// 价格走势</h3>
                <span class="chart-subtitle mono-text">实时更新中</span>
            </div>
            <div class="header-right">
                <div class="status-pill">
                    <span>LIVE</span>
                </div>
            </div>
        </div>
        <div class="stats-row" v-if="stats">
            <div class="stat-item">
                <div class="stat-label mono-text">今日最高</div>
                <div class="stat-value mono-text">
                    <span>{{ stats.high }}</span>
                    <span class="stat-sub">{{ stats.unit }}</span>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-label mono-text">今日最低</div>
                <div class="stat-value mono-text">
                    <span>{{ stats.low }}</span>
                    <span class="stat-sub">{{ stats.unit }}</span>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-label mono-text">振幅</div>
                <div class="stat-value mono-text">
                    <span>{{ stats.amplitude }}</span>
                    <span class="stat-sub">{{ stats.unit }}</span>
                </div>
                <div class="stat-meta mono-text">{{ stats.amplitudePct }}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label mono-text">偏离均值</div>
                <div class="stat-value mono-text" :class="stats.deviationClass">
                    <span>{{ stats.deviation }}</span>
                    <span class="stat-sub">{{ stats.unit }}</span>
                </div>
                <div class="stat-meta mono-text">{{ stats.deviationPct }}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label mono-text">近 {{ stats.windowMinutes }} 分钟</div>
                <div class="stat-value mono-text" :class="stats.windowClass">
                    <span>{{ stats.windowChange }}</span>
                    <span class="stat-sub">{{ stats.unit }}</span>
                </div>
                <div class="stat-meta mono-text">{{ stats.windowPct }}</div>
            </div>
        </div>
        <div class="chart-body">
            <div ref="chartRef" class="trend-chart"></div>
            <div v-if="loading" class="chart-loading">
                <div class="loading-spinner"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type { ChartDataPoint } from '../types/gold'

dayjs.extend(utc)
dayjs.extend(timezone)

const props = defineProps<{
    data: ChartDataPoint[]
    title?: string
    loading?: boolean
    unit?: string
    changeWindowMinutes?: number
}>()

const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const stats = computed(() => {
    const points = props.data || []
    if (points.length === 0) return null

    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    let sum = 0

    for (const p of points) {
        const v = p.p
        if (!Number.isFinite(v)) continue
        if (v < min) min = v
        if (v > max) max = v
        sum += v
    }

    const count = points.length
    const mean = count > 0 ? sum / count : NaN
    const lastPoint = points[points.length - 1]
    const latest = lastPoint?.p ?? NaN
    const unit = props.unit || 'CNY/g'

    const fmt = (n: number, digits = 2) => (Number.isFinite(n) ? n.toFixed(digits) : '-')
    const fmtSigned = (n: number, digits = 2) => {
        if (!Number.isFinite(n)) return '-'
        const s = n > 0 ? '+' : ''
        return `${s}${n.toFixed(digits)}`
    }
    const fmtPctSigned = (n: number, digits = 2) => {
        if (!Number.isFinite(n)) return '-'
        const s = n > 0 ? '+' : ''
        return `${s}${n.toFixed(digits)}%`
    }

    const amplitude = max - min
    const amplitudePct = Number.isFinite(mean) && mean !== 0 ? (amplitude / mean) * 100 : NaN
    const deviation = latest - mean
    const deviationPct = Number.isFinite(mean) && mean !== 0 ? (deviation / mean) * 100 : NaN

    const windowMinutes = props.changeWindowMinutes ?? 30
    const lastT = lastPoint?.t ?? NaN
    const targetT = Number.isFinite(lastT) ? lastT - windowMinutes * 60 : NaN
    let base: number | null = null
    if (Number.isFinite(targetT)) {
        for (let i = points.length - 1; i >= 0; i--) {
            const t = points[i]?.t ?? NaN
            if (Number.isFinite(t) && t <= targetT) {
                base = points[i]?.p ?? null
                break
            }
        }
    }

    const windowChange = base !== null ? latest - base : NaN
    const windowPct = base !== null && base !== 0 ? (windowChange / base) * 100 : NaN

    const deviationClass = deviation > 0 ? 'value-up' : deviation < 0 ? 'value-down' : ''
    const windowClass = windowChange > 0 ? 'value-up' : windowChange < 0 ? 'value-down' : ''

    return {
        unit,
        high: fmt(max),
        low: fmt(min),
        amplitude: fmt(amplitude),
        amplitudePct: Number.isFinite(amplitudePct) ? fmtPctSigned(amplitudePct) : '-',
        deviation: fmtSigned(deviation),
        deviationPct: Number.isFinite(deviationPct) ? fmtPctSigned(deviationPct) : '-',
        deviationClass,
        windowMinutes,
        windowChange: base !== null ? fmtSigned(windowChange) : '-',
        windowPct: base !== null && Number.isFinite(windowPct) ? fmtPctSigned(windowPct) : '-',
        windowClass
    }
})

const initChart = () => {
    if (!chartRef.value) return

    chart = echarts.init(chartRef.value)
    updateChart()
}

const updateChart = () => {
    if (!chart) return

    const option: echarts.EChartsOption = {
        useUTC: true,
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderColor: '#e0e0e0',
            borderWidth: 1,
            padding: [12, 16],
            shadowBlur: 0,
            textStyle: {
                color: '#2d3436',
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace'
            },
            formatter: (params: any) => {
                const item = params[0]
                const time = dayjs(item.value[0]).utc().format('HH:mm:ss')
                return `
                    <div style="color: #636e72; font-size: 12px; margin-bottom: 4px;">${time}</div>
                    <div style="display: flex; align-items: baseline; gap: 4px;">
                        <span style="font-weight: 600; font-size: 16px; color: #ff7675;">${item.value[1].toFixed(2)}</span>
                        <span style="color: #636e72; font-size: 12px;">${props.unit || 'CNY/g'}</span>
                    </div>
                `
            }
        },
        grid: {
            left: '10',
            right: '10',
            bottom: '10',
            top: '40',
            containLabel: true
        },
        xAxis: {
            type: 'time',
            min: dayjs().utc().startOf('day').valueOf(),
            max: Math.max(dayjs().utc().valueOf(), props.data.length > 0 ? (props.data[props.data.length - 1]?.t || 0) * 1000 : 0),
            axisLine: { show: true, lineStyle: { color: '#e0e0e0' } },
            axisTick: { show: true },
            axisLabel: {
                color: '#636e72',
                fontSize: 10,
                fontFamily: 'JetBrains Mono, monospace',
                formatter: (value: number) => dayjs(value).utc().format('HH:mm'),
                hideOverlap: true
            },
            minInterval: 3600 * 1000 * 2, // 至少2小时一个刻度，避免太拥挤
            splitLine: { show: false }
        },
        yAxis: {
            type: 'value',
            scale: true,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: '#636e72',
                fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace'
            },
            splitLine: {
                lineStyle: {
                    color: '#f0f0f0',
                    type: 'dashed'
                }
            }
        },
        series: [
            {
                name: 'Price',
                type: 'line',
                showSymbol: false,
                data: props.data.map(item => [item.t * 1000, item.p]),
                smooth: true,
                lineStyle: {
                    width: 2,
                    color: '#ff7675'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(255, 118, 117, 0.2)' },
                        { offset: 1, color: 'rgba(255, 118, 117, 0.02)' }
                    ])
                },
                markPoint: {
                    symbol: 'circle',
                    symbolSize: 4,
                    data: [
                        {
                            type: 'max',
                            name: '最高',
                            itemStyle: { color: '#ff7675' },
                            label: {
                                position: 'top',
                                offset: [0, -5]
                            }
                        },
                        {
                            type: 'min',
                            name: '最低',
                            itemStyle: { color: '#0984e3' },
                            label: {
                                position: 'bottom',
                                offset: [0, 5]
                            }
                        }
                    ],
                    label: {
                        show: true,
                        fontSize: 11,
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 500,
                        color: 'inherit',
                        backgroundColor: 'transparent',
                        padding: [4, 6],
                        formatter: (params: any) => `${params.name}: ${params.value.toFixed(2)}`
                    }
                }
            }
        ]
    }

    chart.setOption(option)
}

watch(
    () => props.data,
    () => {
        updateChart()
    },
    { deep: true }
)

onMounted(() => {
    initChart()
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    chart?.dispose()
})

const handleResize = () => {
    chart?.resize()
}
</script>

<style scoped>
.chart-card {
    padding: 32px !important;
}

.stats-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}

.stat-item {
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 12px 12px;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

.stat-label {
    font-size: 11px;
    color: var(--text-secondary);
    opacity: 0.85;
    letter-spacing: 0.2px;
}

.stat-value {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.1;
}

.stat-sub {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary);
    white-space: nowrap;
}

.stat-meta {
    font-size: 11px;
    color: var(--text-secondary);
    opacity: 0.9;
}

.value-up {
    color: var(--accent-blue);
}

.value-down {
    color: var(--primary-color);
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-top: 8px; /* Add space for the traffic light dots */
}

.chart-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-main);
    margin: 0;
}

.chart-subtitle {
    font-size: 12px;
    color: var(--text-secondary);
    opacity: 0.7;
}

.status-pill {
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--accent-green);
    color: var(--accent-green);
    letter-spacing: 1px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    line-height: 1;
}

.status-pill::before {
    content: '';
    width: 6px;
    height: 6px;
    background: var(--accent-green);
    border-radius: 50%;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(0, 184, 148, 0.7);
    }
    70% {
        transform: scale(1);
        box-shadow: 0 0 0 6px rgba(0, 184, 148, 0);
    }
    100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(0, 184, 148, 0);
    }
}

.chart-body {
    position: relative;
}

.trend-chart {
    width: 100%;
    height: 450px;
}

@media (max-width: 768px) {
    .chart-card {
        padding: 32px 8px 16px !important;
    }
    .stats-row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 12px;
        padding: 0 8px;
    }
    .stat-item {
        padding: 10px 10px;
    }
    .stat-value {
        font-size: 15px;
    }
    .trend-chart {
        height: 260px;
    }
    .chart-header {
        margin-bottom: 12px;
        padding: 4px 8px 0;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
    }
    .chart-title {
        font-size: 15px;
    }
}

.chart-loading {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(255, 255, 255, 0.6);
    z-index: 10;
}

.loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f0f0f0;
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
