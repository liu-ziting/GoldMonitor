<template>
    <a-card :loading="loading" class="price-card" :bordered="false">
        <div class="card-inner">
            <div class="card-top">
                <div class="bank-info">
                    <span class="bank-name">{{ data?.name || '-' }}</span>
                    <span class="bank-symbol">{{ data?.symbol }}</span>
                </div>
                <div class="trend-tag" :class="isUp ? 'tag-up' : 'tag-down'">
                    <component :is="isUp ? CaretUpOutlined : CaretDownOutlined" />
                    {{ Math.abs(data?.change_pct || 0).toFixed(2) }}%
                </div>
            </div>

            <div class="price-main">
                <span class="currency">{{ data?.currency }}</span>
                <span class="price-value">{{ data?.price.toFixed(2) }}</span>
            </div>

            <div class="card-footer">
                <div class="change-info">
                    <span class="label">涨跌</span>
                    <span class="value" :class="isUp ? 'text-up' : 'text-down'"> {{ isUp ? '+' : '' }}{{ data?.change.toFixed(2) }} </span>
                </div>
                <div class="time-info">
                    {{ data?.update_time }}
                </div>
            </div>
        </div>
    </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons-vue'
import type { GoldPriceData } from '../types/gold'

const props = defineProps<{
    data?: GoldPriceData
    loading?: boolean
}>()

const isUp = computed(() => (props.data?.change ?? 0) >= 0)
</script>

<style scoped>
.price-card {
    overflow: hidden;
    position: relative;
}

.card-inner {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.bank-info {
    display: flex;
    flex-direction: column;
}

.bank-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-main);
}

.bank-symbol {
    font-size: 12px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
}

.trend-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
}

.tag-up {
    background: rgba(255, 77, 79, 0.1);
    color: var(--up-color);
}

.tag-down {
    background: rgba(82, 196, 26, 0.1);
    color: var(--down-color);
}

.price-main {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.currency {
    font-size: 18px;
    font-weight: 500;
    color: var(--text-secondary);
}

.price-value {
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -1px;
    color: var(--text-main);
}

.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
    padding-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.change-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.label {
    font-size: 12px;
    color: var(--text-secondary);
}

.value {
    font-size: 14px;
    font-weight: 600;
}

.time-info {
    font-size: 11px;
    color: #bfbfbf;
}

.text-up {
    color: var(--up-color);
}
.text-down {
    color: var(--down-color);
}

/* Animation */
.price-value {
    transition: all 0.5s ease;
}
</style>

