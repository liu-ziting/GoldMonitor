<template>
    <div class="minimal-card price-card" :class="{ 'is-loading': loading }">
        <div class="card-header">
            <span class="bank-name">{{ data?.name || 'Loading...' }}</span>
            <div class="trend-tag" :class="isUp ? 'tag-up' : 'tag-down'">{{ isUp ? '▲' : '▼' }} {{ Math.abs(data?.change_pct || 0).toFixed(2) }}%</div>
        </div>

        <div class="price-section">
            <div class="price-value-container mono-text">
                <span class="price-value">{{ data?.price.toFixed(2) || '0.00' }}</span>
                <span class="currency">{{ data?.currency }}</span>
            </div>
            <div class="change-info mono-text" :class="isUp ? 'text-up' : 'text-down'">{{ isUp ? '+' : '' }}{{ data?.change.toFixed(2) || '0.00' }}</div>
        </div>

        <div class="card-footer mono-text">
            <span class="prev-close-inline" v-if="data?.prev_close != null">
                <span class="prev-close-inline-label">昨收</span>
                <span class="prev-close-inline-value">{{ Number(data.prev_close).toFixed(2) }}</span>
            </span>
            <span class="prev-close-inline" v-else></span>
            <span class="update-wrap">
                <span class="update-label">最后更新</span>
                <span class="update-time">{{ data?.update_time || '-' }}</span>
            </span>
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
    display: flex;
    flex-direction: column;
    gap: 20px;
    cursor: pointer;
}

.price-card:hover {
    border-color: var(--primary-color);
    background: #fffcfc;
}

.price-card:active {
    transform: translateY(1px);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 4px; /* Space for decor dots */
}

.bank-name {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-secondary);
}

.trend-tag {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
}

.tag-up {
    background: #e6f7ff;
    color: var(--accent-blue);
}

.tag-down {
    background: #fff1f0;
    color: var(--primary-color);
}

.price-section {
    display: flex;
    flex-direction: column;
}

.price-value-container {
    display: flex;
    align-items: baseline;
    gap: 6px;
}

.price-value {
    font-size: 36px;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.2;
}

.currency {
    font-size: 16px;
    color: var(--text-secondary);
    font-weight: 500;
}

.change-info {
    font-size: 16px;
    font-weight: 600;
    margin-top: 4px;
}

.card-footer {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
}

.update-wrap {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
}

.update-label {
    font-size: 12px;
    color: var(--text-secondary);
    opacity: 0.75;
}

.update-time {
    font-size: 12px;
    color: var(--text-main);
    font-weight: 500;
}

.prev-close-inline {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
    font-size: 12px;
    color: var(--text-secondary);
    opacity: 0.75;
}

.prev-close-inline-label {
    letter-spacing: 0.2px;
}

.prev-close-inline-value {
    font-weight: 600;
    color: var(--text-secondary);
}

.text-up {
    color: var(--accent-blue);
}

.text-down {
    color: var(--primary-color);
}

.loading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    z-index: 10;
}

.loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #f0f0f0;
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
