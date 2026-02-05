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
            <span class="brand-tag">v1.0.0</span>
          </div>
        </div>
        
        <div class="header-actions">
          <div class="online-status-badge">
            <span class="pulse-dot"></span>
            <span class="mono-text">{{ onlineCount }} WATCHING</span>
          </div>
          <button class="tech-btn" @click="fetchAllPrices" :disabled="isRefreshing">
            <reload-outlined :spin="isRefreshing" />
            <span>SYNC_DATA</span>
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- Section: Real-time Data -->
      <section class="data-section">
        <div class="section-header">
          <h2 class="section-title">> BROWSE_REALTIME_QUOTES</h2>
          <div class="section-desc">Real-time gold price data from major banks. updated every 30s.</div>
        </div>
        
        <div class="price-grid-wrapper">
          <div v-for="bank in banks" :key="bank.code" class="grid-item">
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
          <h2 class="section-title">> MARKET_TREND_ANALYSIS</h2>
        </div>
        
        <div class="analysis-controls">
          <div class="control-group">
            <span class="control-label">SELECT_PROVIDER:</span>
            <div class="bank-selector">
              <button 
                v-for="bank in banks" 
                :key="bank.code"
                class="selector-btn"
                :class="{ active: selectedBank === bank.code }"
                @click="selectBank(bank.code)"
              >
                {{ bank.name }}
              </button>
            </div>
          </div>
        </div>

        <TrendChart :data="chartData" :loading="chartLoading" />
      </section>
    </main>

    <footer class="main-footer">
      <div class="footer-inner">
        <div class="footer-left">
          <span class="mono-text">STATUS: OK</span>
          <span class="separator">|</span>
          <span class="mono-text">API_ENDPOINT: jin.20021002.xyz</span>
        </div>
        <div class="footer-right">
          <span class="mono-text">© 2026 GOLD_MONITOR_SYSTEM</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { GoldOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { goldApi } from './api/gold';
import type { GoldPriceData, ChartDataPoint } from './types/gold';
import PriceCard from './components/PriceCard.vue';
import TrendChart from './components/TrendChart.vue';

const banks = [
  { code: 'zs', name: '浙商银行' },
  { code: 'ms', name: '民生银行' },
  { code: 'icbc', name: '工商银行' },
  { code: 'cgb', name: '广发银行' },
  { code: 'cib', name: '兴业银行' },
  { code: 'gj', name: '伦敦金' },
];

const prices = reactive<Record<string, GoldPriceData>>({});
const loading = reactive<Record<string, boolean>>({});
const onlineCount = ref(0);
const selectedBank = ref('zs');
const chartData = ref<ChartDataPoint[]>([]);
const chartLoading = ref(false);

const isRefreshing = computed(() => Object.values(loading).some(l => l));

const fetchAllPrices = async () => {
  banks.forEach(async (bank) => {
    loading[bank.code] = true;
    try {
      const res = await goldApi.getPrice(bank.code);
      if (res.code === 200) {
        prices[bank.code] = res.data;
      }
    } catch (error) {
      console.error(`Fetch price error for ${bank.code}:`, error);
    } finally {
      loading[bank.code] = false;
    }
  });
};

const fetchChartData = async () => {
  chartLoading.value = true;
  try {
    const res = await goldApi.getChartData(selectedBank.value);
    if (res.code === 200) {
      chartData.value = res.data;
    }
  } catch (error) {
    console.error('Fetch chart data error:', error);
  } finally {
    chartLoading.value = false;
  }
};

const sendHeartbeat = async () => {
  try {
    const res = await goldApi.heartbeat();
    if (res.code === 200) {
      onlineCount.value = res.data.count;
    }
  } catch (error) {
    console.error('Heartbeat error:', error);
  }
};

const selectBank = (code: string) => {
  selectedBank.value = code;
  fetchChartData();
};

let priceTimer: any;
let heartbeatTimer: any;

onMounted(() => {
  fetchAllPrices();
  fetchChartData();
  sendHeartbeat();

  priceTimer = setInterval(fetchAllPrices, 30000);
  heartbeatTimer = setInterval(sendHeartbeat, 60000);
});

onUnmounted(() => {
  clearInterval(priceTimer);
  clearInterval(heartbeatTimer);
});
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-header {
  height: 80px;
  background: #ffffff;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand-logo {
  font-size: 32px;
  color: var(--primary-color);
  display: flex;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -1px;
  color: var(--text-main);
}

.brand-tag {
  font-family: var(--mono-font);
  font-size: 10px;
  color: var(--primary-color);
  background: #fff5f0;
  padding: 0 6px;
  border-radius: 4px;
  border: 1px solid #ffe8cc;
  width: fit-content;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}

.online-status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--accent-green);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.tech-btn {
  background: var(--text-main);
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-family: var(--mono-font);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.tech-btn:hover:not(:disabled) {
  background: var(--primary-color);
  transform: translateY(-1px);
}

.tech-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 60px;
}

.section-header {
  margin-bottom: 32px;
}

.section-title {
  font-family: var(--mono-font);
  font-size: 20px;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
}

.section-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.price-grid-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.analysis-controls {
  margin-bottom: 24px;
  background: #f8f9fa;
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.control-label {
  font-family: var(--mono-font);
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}

.bank-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selector-btn {
  background: #ffffff;
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
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
  color: #ffffff;
}

.main-footer {
  margin-top: auto;
  background: #ffffff;
  border-top: 1px solid var(--border-color);
  padding: 20px 0;
}

.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left, .footer-right {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 11px;
  color: var(--text-secondary);
}

.separator {
  color: var(--border-color);
}

.mono-text {
  font-family: var(--mono-font);
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(0, 209, 178, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(0, 209, 178, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 209, 178, 0); }
}

@media (max-width: 768px) {
  .header-inner { padding: 0 20px; }
  .main-content { padding: 20px; }
  .brand-name { font-size: 18px; }
  .header-actions { gap: 12px; }
  .online-status-badge { display: none; }
  .analysis-controls { padding: 12px; }
  .control-group { flex-direction: column; align-items: flex-start; }
}
</style>
