<template>
    <div class="chart-container" :class="{ 'is-loading': loading }">
        <div ref="chartRef" class="trend-chart"></div>
        <div v-if="loading" class="chart-loading">
            <a-spin size="large" />
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
        useUTC: true, // 开启 UTC 模式，与服务器数据对齐
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#eee',
            borderWidth: 1,
            textStyle: { color: '#2d3436' },
            padding: [12, 16],
            extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.1); border-radius: 12px;',
            formatter: (params: any) => {
                const item = params[0]
                // 同样使用 UTC 格式化显示
                const time = dayjs(item.value[0]).utc().format('HH:mm:ss')
                return `
          <div style="font-size: 12px; color: #636e72; margin-bottom: 4px;">${time} (UTC)</div>
          <div style="display: flex; align-items: baseline; gap: 4px;">
            <span style="font-size: 18px; font-weight: 800; color: #faad14;">${item.value[1].toFixed(2)}</span>
            <span style="font-size: 11px; color: #636e72;">元/克</span>
          </div>
        `
            }
        },
        grid: {
            left: '20',
            right: '20',
            bottom: '10',
            top: '40',
            containLabel: true
        },
        xAxis: {
            type: 'time',
            // 设置范围为 UTC 时间的今日 0 点到现在
            min: dayjs().utc().startOf('day').valueOf(),
            max: Math.max(dayjs().utc().valueOf(), props.data.length > 0 ? props.data[props.data.length - 1].t * 1000 : 0),
            axisLine: { lineStyle: { color: '#f0f0f0' } },
            axisLabel: {
                color: '#8c8c8c',
                fontSize: 11,
                // 坐标轴也使用 UTC
                formatter: (value: number) => dayjs(value).utc().format('HH:mm')
            },
            splitLine: { show: false }
        },
        yAxis: {
            type: 'value',
            scale: true,
            axisLabel: { color: '#8c8c8c', fontSize: 11 },
            splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } }
        },
        series: [
            {
                name: '价格',
                type: 'line',
                showSymbol: false,
                data: props.data.map(item => [item.t * 1000, item.p]),
                smooth: 0.4,
                lineStyle: {
                    width: 3,
                    color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                        { offset: 0, color: '#faad14' },
                        { offset: 1, color: '#ffec3d' }
                    ])
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(250, 173, 20, 0.2)' },
                        { offset: 1, color: 'rgba(250, 173, 20, 0)' }
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
.chart-container {
    position: relative;
    width: 100%;
}

.trend-chart {
    width: 100%;
    height: 360px;
}

.chart-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(4px);
    z-index: 10;
}

.is-loading .trend-chart {
    filter: blur(2px);
}
</style>

