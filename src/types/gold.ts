export interface GoldPriceData {
    source: string
    name: string
    symbol: string
    currency: string
    price: number
    prev_close?: number
    change: number
    change_pct: number
    update_time: string
}

export interface ApiResponse<T> {
    code: number
    msg: string
    data: T
}

export interface ChartDataPoint {
    t: number
    p: number
}

export interface HeartbeatData {
    count: number
}
