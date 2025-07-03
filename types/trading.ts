export interface MarketData {
  symbol: string
  price: number
  priceChange24h: number
  priceChangePercent24h: number
  volume24h: number
  high24h: number
  low24h: number
  fundingRate: number
  nextFundingTime: number
  oraclePrice: number
}

export interface OrderBookEntry {
  price: number
  size: number
  total: number
}

export interface OrderBook {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
  lastUpdateId: number
}

export interface Order {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit'
  quantity: number
  price?: number
  status: 'pending' | 'filled' | 'cancelled' | 'partial' | 'rejected'
  timestamp: number
  leverage?: number
  stopLoss?: number
  takeProfit?: number
  timeInForce?: 'GTC' | 'IOC' | 'FOK'
  filledQuantity?: number
  averagePrice?: number
  filledAt?: number
  cancelledAt?: number
  rejectedReason?: string
}

export interface Position {
  id: string
  symbol: string
  side: 'long' | 'short' | 'buy' | 'sell'
  size: number
  entryPrice: number
  markPrice: number
  pnl: number
  pnlPercent: number
  unrealizedPnl: number
  realizedPnl: number
  margin: number
  leverage: number
  liquidationPrice?: number
  timestamp: number
  stopLoss?: number
  takeProfit?: number
}

export interface Trade {
  id: string
  orderId?: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  timestamp: number
  fee: number
  leverage?: number
}

export interface Candlestick {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

export interface Blockchain {
  id: string
  name: string
  icon: string
  iconUrl?: string
  color: string
}

export interface CoinData {
  id: string
  rank: number
  symbol: string
  name: string
  price: number
  age: string
  txns: number
  volume: number
  makers: number
  changes: {
    m5: number
    h1: number
    h6: number
    h24: number
  }
  liquidity: number
  mcap: number
  blockchain: string
  iconUrl?: string
  isTopGainer?: boolean
  isNewPair?: boolean
}