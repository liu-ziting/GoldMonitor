<template>
    <div class="window-frame chart-window" :class="{ 'is-loading': loading }">
        <div class="window-header">
            <div class="window-dot dot-red"></div>
            <div class="window-dot dot-yellow"></div>
            <div class="window-dot dot-green"></div>
            <div class="window-title">price_trend_analysis.sh</div>
            <div class="header-status">
                <span class="status-pulse"></span>
                LIVE
            </div>
        </div>
        <div class="chart-content">
            <div ref="chartRef" class="trend-chart"></div>
            <div v-if="loading" class="chart-loading">
                <div class="loading-spinner"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
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
}>()

const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

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
            backgroundColor: '#ffffff',
            borderColor: '#e0e0e0',
            borderWidth: 1,
            padding: [12, 16],
            shadowBlur: 0,
            shadowOffsetX: 4,
            shadowOffsetY: 4,
            shadowColor: 'rgba(0,0,0,0.05)',
            textStyle: {
                fontFamily: "'Fira Code', monospace",
                fontSize: 12,
                color: '#1a1a1a'
            },
            formatter: (params: any) => {
                const item = params[0]
                const time = dayjs(item.value[0]).utc().format('HH:mm:ss')
                return `
          <div style="color: #a0aec0; margin-bottom: 4px;">timestamp: "${time}"</div>
          <div style="display: flex; align-items: baseline; gap: 8px;">
            <span style="color: #ff5c00; font-weight: 700;">price:</span>
            <span style="font-size: 16px; font-weight: 800; color: #1a1a1a;">${item.value[1].toFixed(2)}</span>
            <span style="color: #a0aec0; font-size: 11px;">CNY/g</span>
          </div>
        `
            }
        },
        grid: {
            left: '40',
            right: '40',
            bottom: '40',
            top: '40',
            containLabel: true
        },
        xAxis: {
            type: 'time',
            min: dayjs().utc().startOf('day').valueOf(),
            max: Math.max(dayjs().utc().valueOf(), props.data.length > 0 ? props.data[props.data.length - 1].t * 1000 : 0),
            axisLine: { lineStyle: { color: '#e0e0e0' } },
            axisTick: { show: false },
            axisLabel: {
                color: '#a0aec0',
                fontFamily: "'Fira Code', monospace",
                fontSize: 11,
                formatter: (value: number) => dayjs(value).utc().format('HH:mm')
            },
            splitLine: {
                show: true,
                lineStyle: { color: '#f5f5f5', type: 'dashed' }
            }
        },
        yAxis: {
            type: 'value',
            scale: true,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: '#a0aec0',
                fontFamily: "'Fira Code', monospace",
                fontSize: 11
            },
            splitLine: { lineStyle: { color: '#f5f5f5' } }
        },
        series: [
            {
                name: 'Price',
                type: 'line',
                showSymbol: false,
                data: props.data.map(item => [item.t * 1000, item.p]),
                smooth: true,
                lineStyle: {
                    width: 3,
                    color: '#ff5c00'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(255, 92, 0, 0.15)' },
                        { offset: 1, color: 'rgba(255, 92, 0, 0)' }
                    ])
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
.chart-window {
    width: 100%;
    background: #ffffff;
}

.header-status {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono-font);
    font-size: 10px;
    font-weight: 700;
    color: var(--accent-green);
    background: #e6fffa;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid var(--accent-green);
}

.status-pulse {
    width: 6px;
    height: 6px;
    background: var(--accent-green);
    border-radius: 50%;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.5);
        opacity: 0.5;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.chart-content {
    position: relative;
    padding: 20px;
}

.trend-chart {
    width: 100%;
    height: 400px;
}

.chart-loading {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(4px);
    z-index: 10;
}

.loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-color);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.is-loading .trend-chart {
    filter: blur(2px);
}
</style>

