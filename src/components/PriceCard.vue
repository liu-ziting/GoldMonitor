<template>
    <div class="minimal-card price-card" :class="{ 'is-loading': loading }">
        <div class="card-header">
            <span class="bank-name">{{ data?.name || 'Loading...' }}</span>
            <div class="trend-tag" :class="isUp ? 'tag-up' : 'tag-down'">{{ isUp ? '▲' : '▼' }} {{ Math.abs(data?.change_pct || 0).toFixed(2) }}%</div>
        </div>

        <div class="price-section">
            <div class="price-value-container">
                <span class="price-value">{{ data?.price.toFixed(2) || '0.00' }}</span>
                <span class="currency">{{ data?.currency }}</span>
            </div>
            <div class="change-info" :class="isUp ? 'text-up' : 'text-down'">{{ isUp ? '+' : '' }}{{ data?.change.toFixed(2) || '0.00' }}</div>
        </div>

        <div class="card-footer">
            <span class="update-label">最后更新</span>
            <span class="update-time">{{ data?.update_time || '-' }}</span>
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
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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
    background: #f6ffed;
    color: var(--down-color);
}

.tag-down {
    background: #fff1f0;
    color: var(--up-color);
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

.update-label {
    font-size: 12px;
    color: var(--text-secondary);
}

.update-time {
    font-size: 12px;
    color: var(--text-main);
    font-weight: 500;
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

