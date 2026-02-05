<template>
    <div class="minimal-card chart-card" :class="{ 'is-loading': loading }">
        <div class="chart-header">
            <div class="header-left">
                <h3 class="chart-title">价格走势</h3>
                <span class="chart-subtitle">实时更新中</span>
            </div>
            <div class="header-right">
                <div class="status-badge">
                    <span class="status-dot"></span>
                    LIVE
                </div>
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
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            borderColor: '#f0f0f0',
            borderWidth: 1,
            padding: [12, 16],
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.05)',
            textStyle: {
                color: '#262626',
                fontSize: 13
            },
            formatter: (params: any) => {
                const item = params[0]
                const time = dayjs(item.value[0]).utc().format('HH:mm:ss')
                return `
                    <div style="color: #8c8c8c; font-size: 12px; margin-bottom: 4px;">${time}</div>
                    <div style="display: flex; align-items: baseline; gap: 4px;">
                        <span style="font-weight: 600; font-size: 16px;">${item.value[1].toFixed(2)}</span>
                        <span style="color: #8c8c8c; font-size: 12px;">CNY/g</span>
                    </div>
                `
            }
        },
        grid: {
            left: '20',
            right: '20',
            bottom: '20',
            top: '40',
            containLabel: true
        },
        xAxis: {
            type: 'time',
            min: dayjs().utc().startOf('day').valueOf(),
            max: Math.max(dayjs().utc().valueOf(), props.data.length > 0 ? props.data[props.data.length - 1].t * 1000 : 0),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: '#8c8c8c',
                fontSize: 12,
                formatter: (value: number) => dayjs(value).utc().format('HH:mm')
            },
            splitLine: { show: false }
        },
        yAxis: {
            type: 'value',
            scale: true,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: '#8c8c8c',
                fontSize: 12
            },
            splitLine: {
                lineStyle: {
                    color: '#f0f0f0',
                    type: 'solid'
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
                    width: 4,
                    color: '#1890ff'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(24, 144, 255, 0.12)' },
                        { offset: 1, color: 'rgba(24, 144, 255, 0)' }
                    ])
                },
                markPoint: {
                    symbol: 'circle',
                    symbolSize: 6,
                    data: [
                        {
                            type: 'max',
                            name: '最高',
                            itemStyle: { color: '#f5222d' },
                            label: {
                                position: 'top',
                                offset: [0, -5]
                            }
                        },
                        {
                            type: 'min',
                            name: '最低',
                            itemStyle: { color: '#52c41a' },
                            label: {
                                position: 'bottom',
                                offset: [0, 5]
                            }
                        }
                    ],
                    label: {
                        show: true,
                        fontSize: 12,
                        fontWeight: '600',
                        color: 'inherit',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        padding: [4, 6],
                        borderRadius: 4,
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

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
}

.chart-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-main);
}

.chart-subtitle {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 4px;
    display: block;
}

.status-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--down-color);
    background: #f6ffed;
    padding: 6px 12px;
    border-radius: 20px;
}

.status-dot {
    width: 8px;
    height: 8px;
    background: var(--down-color);
    border-radius: 50%;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.4);
    }
    70% {
        box-shadow: 0 0 0 10px rgba(82, 196, 26, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
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
        padding: 20px !important;
    }
    .trend-chart {
        height: 300px;
    }
    .chart-header {
        margin-bottom: 20px;
        flex-direction: column;
        gap: 16px;
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

