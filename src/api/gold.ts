import axios from 'axios';
import type { GoldPriceData, ApiResponse, ChartDataPoint, HeartbeatData } from '../types/gold';

const API_BASE_URL = 'https://jin.20021002.xyz/api.php';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const goldApi = {
  // 获取实时金价
  getPrice(type: string): Promise<ApiResponse<GoldPriceData>> {
    return api.get('', { params: { type } }).then(res => res.data);
  },

  // 获取今日走势图数据
  getChartData(type: string): Promise<ApiResponse<ChartDataPoint[]>> {
    return api.get('', { params: { action: 'chart', type } }).then(res => res.data);
  },

  // 在线人数心跳包
  heartbeat(): Promise<ApiResponse<HeartbeatData>> {
    return api.get('', { params: { action: 'heartbeat' } }).then(res => res.data);
  }
};
