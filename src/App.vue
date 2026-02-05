<template>
  <a-layout class="layout">
    <a-layout-header class="header">
      <div class="header-container">
        <div class="logo">
          <div class="logo-icon">
            <gold-outlined />
          </div>
          <span class="title">GoldMonitor</span>
        </div>
        
        <div class="header-right">
          <a-space size="middle">
            <div class="online-status">
              <span class="pulse-dot"></span>
              <span class="online-text">{{ onlineCount }} 人在线盯盘</span>
            </div>
            <a-button type="primary" shape="round" @click="fetchAllPrices" :loading="isRefreshing">
              <template #icon><reload-outlined /></template>
              刷新
            </a-button>
          </a-space>
        </div>
      </div>
    </a-layout-header>

    <a-layout-content class="content">
      <div class="main-container">
        <!-- 实时价格网格 -->
        <div class="section-title">实时行情</div>
        <a-row :gutter="[20, 20]" class="price-grid">
          <a-col v-for="bank in banks" :key="bank.code" :xs="24" :sm="12" :md="8" :lg="4">
            <PriceCard 
              :data="prices[bank.code]" 
              :loading="loading[bank.code]" 
              @click="selectBank(bank.code)"
              :class="{ 'selected-card': selectedBank === bank.code }"
            />
          </a-col>
        </a-row>

        <!-- 走势分析区域 -->
        <div class="analysis-section">
          <div class="section-title">价格走势分析</div>
          <a-card class="chart-card" :bordered="false">
            <div class="chart-header">
              <div class="selected-bank-info">
                <span class="current-label">当前查看:</span>
                <span class="current-value">{{ selectedBankName }}</span>
              </div>
              <a-radio-group v-model:value="selectedBank" button-style="solid" size="middle" @change="fetchChartData">
                <a-radio-button v-for="bank in banks" :key="bank.code" :value="bank.code">
                  {{ bank.name }}
                </a-radio-button>
              </a-radio-group>
            </div>
            <TrendChart :data="chartData" :loading="chartLoading" />
          </a-card>
        </div>

        <!-- 提示信息 -->
        <div class="info-footer">
          <div class="info-card">
            <info-circle-outlined class="info-icon" />
            <p>数据来源于各银行公开接口，仅供参考。国际金价单位为美元/盎司，国内金价单位为元/克。</p>
          </div>
        </div>
      </div>
    </a-layout-content>

    <a-layout-footer class="footer">
      <div class="footer-content">
        <p>GoldMonitor © 2026</p>
        <p class="footer-sub">极简 · 高性能 · 实时黄金价格监控</p>
      </div>
    </a-layout-footer>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { GoldOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons-vue';
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

const selectedBankName = computed(() => {
  return banks.find(b => b.code === selectedBank.value)?.name || '';
});

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
.header {
  height: 70px;
  line-height: 70px;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(250, 173, 20, 0.4);
}

.title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(to right, #2d3436, #636e72);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.online-status {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(82, 196, 26, 0.1);
  padding: 0 16px;
  height: 36px;
  line-height: 36px;
  border-radius: 18px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #52c41a;
  border-radius: 50%;
  position: relative;
}

.pulse-dot::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: inherit;
  border-radius: inherit;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(3); opacity: 0; }
}

.online-text {
  font-size: 13px;
  font-weight: 600;
  color: #52c41a;
}

.content {
  padding: 40px 24px;
}

.main-container {
  max-width: 1400px;
  margin: 0 auto;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 18px;
  background: var(--primary-color);
  border-radius: 2px;
}

.price-grid {
  margin-bottom: 40px;
}

.chart-card {
  padding: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 16px;
}

.selected-bank-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-label {
  color: var(--text-secondary);
  font-size: 14px;
}

.current-value {
  color: var(--text-main);
  font-weight: 700;
  font-size: 16px;
}

.selected-card {
  border: 2px solid var(--primary-color) !important;
  transform: translateY(-8px) !important;
}

.info-footer {
  margin-top: 40px;
}

.info-card {
  background: rgba(255, 255, 255, 0.5);
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.info-icon {
  font-size: 20px;
  color: var(--primary-color);
  margin-top: 2px;
}

.info-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.footer {
  padding: 60px 24px;
  text-align: center;
}

.footer-content p {
  margin: 0;
  color: var(--text-main);
  font-weight: 600;
}

.footer-sub {
  font-size: 12px;
  color: var(--text-secondary) !important;
  margin-top: 4px !important;
  font-weight: 400 !important;
}

@media (max-width: 992px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 576px) {
  .header-container {
    padding: 0 16px;
  }
  .online-status {
    display: none;
  }
  .content {
    padding: 24px 16px;
  }
}
</style>
