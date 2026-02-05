<template>
    <div class="window-frame price-card" :class="{ 'is-loading': loading }">
        <div class="window-header">
            <div class="window-dot dot-red"></div>
            <div class="window-dot dot-yellow"></div>
            <div class="window-dot dot-green"></div>
            <div class="window-title">{{ data?.symbol || 'data' }}.json</div>
        </div>
        <div class="card-content">
            <div class="card-top">
                <div class="bank-info">
                    <span class="bank-name">{{ data?.name || 'Loading...' }}</span>
                </div>
                <div class="trend-tag" :class="isUp ? 'tag-up' : 'tag-down'">
                    <span class="mono-text">{{ isUp ? '▲' : '▼' }} {{ Math.abs(data?.change_pct || 0).toFixed(2) }}%</span>
                </div>
            </div>

            <div class="price-main">
                <div class="price-row">
                    <span class="code-label">price:</span>
                    <span class="price-value mono-text">{{ data?.price.toFixed(2) || '0.00' }}</span>
                    <span class="currency">{{ data?.currency }}</span>
                </div>
                <div class="price-row">
                    <span class="code-label">change:</span>
                    <span class="change-value mono-text" :class="isUp ? 'text-up' : 'text-down'"> {{ isUp ? '+' : '' }}{{ data?.change.toFixed(2) || '0.00' }} </span>
                </div>
            </div>

            <div class="card-footer">
                <div class="time-info mono-text"><span class="code-label">updated_at:</span> "{{ data?.update_time || '-' }}"</div>
            </div>
        </div>
        <div v-if="loading" class="loading-overlay">
            <div class="loading-spinner"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GoldPriceData } from '../types/gold'

const props = defineProps<{
    data?: GoldPriceData
    loading?: boolean
}>()

const isUp = computed(() => (props.data?.change ?? 0) >= 0)
</script>

<style scoped>
.price-card {
    position: relative;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
    background: #ffffff;
}

.price-card:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0px rgba(0, 0, 0, 0.1);
}

.card-content {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.bank-name {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-main);
}

.trend-tag {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
}

.tag-up {
    background: #e6fffa;
    color: var(--down-color);
    border: 1px solid var(--down-color);
}

.tag-down {
    background: #fff5f5;
    color: var(--up-color);
    border: 1px solid var(--up-color);
}

.price-main {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.price-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.code-label {
    font-family: var(--mono-font);
    font-size: 13px;
    color: #a0aec0;
}

.mono-text {
    font-family: var(--mono-font);
}

.price-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--primary-color);
}

.currency {
    font-size: 14px;
    color: var(--text-secondary);
}

.change-value {
    font-size: 16px;
    font-weight: 600;
}

.card-footer {
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px dashed var(--border-color);
}

.time-info {
    font-size: 12px;
    color: #718096;
}

.text-up {
    color: var(--down-color);
}
.text-down {
    color: var(--up-color);
}

.loading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
}

.loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-color);
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

