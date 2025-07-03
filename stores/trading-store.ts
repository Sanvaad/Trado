import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { MarketData, OrderBook, Position, Order, Trade, TimeFrame } from '@/types/trading'
import { tradingEngine, OrderExecutionResult } from '@/lib/trading-engine'

interface TradingState {
  // Market data
  selectedMarket: string
  marketData: Record<string, MarketData>
  orderBook: OrderBook | null
  
  // Chart data
  selectedTimeFrame: TimeFrame
  
  // Trading
  positions: Position[]
  orders: Order[]
  trades: Trade[]
  
  // UI state
  selectedLeverage: number
  orderQuantity: string
  orderPrice: string
  orderType: 'market' | 'limit'
  isPlacingOrder: boolean
  orderError: string | null
  
  // WebSocket connection
  isConnected: boolean
  
  // Actions
  setSelectedMarket: (market: string) => void
  setMarketData: (symbol: string, data: MarketData) => void
  setOrderBook: (orderBook: OrderBook) => void
  setSelectedTimeFrame: (timeFrame: TimeFrame) => void
  setPositions: (positions: Position[]) => void
  addOrder: (order: Order) => void
  updateOrder: (orderId: string, updates: Partial<Order>) => void
  addTrade: (trade: Trade) => void
  setSelectedLeverage: (leverage: number) => void
  setOrderQuantity: (quantity: string) => void
  setOrderPrice: (price: string) => void
  setOrderType: (type: 'market' | 'limit') => void
  setConnectionStatus: (connected: boolean) => void
  placeOrder: (orderData: { side: 'buy' | 'sell', stopLoss?: number, takeProfit?: number }) => Promise<OrderExecutionResult>
  cancelOrder: (orderId: string) => Promise<boolean>
  closePosition: (positionId: string) => Promise<OrderExecutionResult>
  refreshPositions: () => void
  setPlacingOrder: (placing: boolean) => void
  setOrderError: (error: string | null) => void
}

export const useTradingStore = create<TradingState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    selectedMarket: 'BTC-PERP',
    marketData: {},
    orderBook: null,
    selectedTimeFrame: '1h',
    positions: [],
    orders: [],
    trades: [],
    selectedLeverage: 2,
    orderQuantity: '',
    orderPrice: '',
    orderType: 'market',
    isPlacingOrder: false,
    orderError: null,
    isConnected: false,
    
    // Actions
    setSelectedMarket: (market) => set({ selectedMarket: market }),
    
    setMarketData: (symbol, data) => 
      set((state) => ({
        marketData: { ...state.marketData, [symbol]: data }
      })),
    
    setOrderBook: (orderBook) => set({ orderBook }),
    
    setSelectedTimeFrame: (timeFrame) => set({ selectedTimeFrame: timeFrame }),
    
    setPositions: (positions) => set({ positions }),
    
    addOrder: (order) => 
      set((state) => ({ orders: [order, ...state.orders] })),
    
    updateOrder: (orderId, updates) =>
      set((state) => ({
        orders: state.orders.map(order =>
          order.id === orderId ? { ...order, ...updates } : order
        )
      })),
    
    addTrade: (trade) =>
      set((state) => ({ trades: [trade, ...state.trades] })),
    
    setSelectedLeverage: (leverage) => set({ selectedLeverage: leverage }),
    
    setOrderQuantity: (quantity) => set({ orderQuantity: quantity }),
    
    setOrderPrice: (price) => set({ orderPrice: price }),
    
    setOrderType: (type) => set({ orderType: type }),
    
    setConnectionStatus: (connected) => set({ isConnected: connected }),

    setPlacingOrder: (placing) => set({ isPlacingOrder: placing }),

    setOrderError: (error) => set({ orderError: error }),

    placeOrder: async (orderData) => {
      const state = get()
      set({ isPlacingOrder: true, orderError: null })

      try {
        const currentMarketData = state.marketData[state.selectedMarket]
        const currentPrice = currentMarketData?.price || 0
        
        // Get user balance from wallet store (would need to import useWalletStore)
        const userBalance = 10000 // Mock balance for now

        const orderRequest = {
          symbol: state.selectedMarket,
          side: orderData.side,
          type: state.orderType,
          quantity: parseFloat(state.orderQuantity),
          price: state.orderType === 'limit' ? parseFloat(state.orderPrice) : undefined,
          leverage: state.selectedLeverage,
          stopLoss: orderData.stopLoss,
          takeProfit: orderData.takeProfit
        }

        const result = await tradingEngine.executeOrder(orderRequest, userBalance, currentPrice)
        
        if (result.success && result.orderId) {
          // Refresh data from trading engine
          const updatedOrders = tradingEngine.getOrders()
          const updatedPositions = tradingEngine.getPositions()
          const updatedTrades = tradingEngine.getTrades()

          set({ 
            orders: updatedOrders,
            positions: updatedPositions,
            trades: updatedTrades,
            orderQuantity: '',
            orderPrice: '',
            isPlacingOrder: false
          })
        } else {
          set({ 
            orderError: result.error || 'Order execution failed',
            isPlacingOrder: false
          })
        }

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        set({ 
          orderError: errorMessage,
          isPlacingOrder: false
        })
        return { success: false, error: errorMessage }
      }
    },

    cancelOrder: async (orderId) => {
      try {
        const result = await tradingEngine.cancelOrder(orderId)
        if (result) {
          const updatedOrders = tradingEngine.getOrders()
          set({ orders: updatedOrders })
        }
        return result
      } catch (error) {
        console.error('Failed to cancel order:', error)
        return false
      }
    },

    closePosition: async (positionId) => {
      const state = get()
      try {
        const currentMarketData = state.marketData[state.selectedMarket]
        const currentPrice = currentMarketData?.price || 0
        
        const result = await tradingEngine.closePosition(positionId, currentPrice)
        
        if (result.success) {
          const updatedPositions = tradingEngine.getPositions()
          const updatedOrders = tradingEngine.getOrders()
          const updatedTrades = tradingEngine.getTrades()
          
          set({ 
            positions: updatedPositions,
            orders: updatedOrders,
            trades: updatedTrades
          })
        }
        
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: errorMessage }
      }
    },

    refreshPositions: () => {
      const updatedPositions = tradingEngine.getPositions()
      const updatedOrders = tradingEngine.getOrders()
      const updatedTrades = tradingEngine.getTrades()
      
      set({ 
        positions: updatedPositions,
        orders: updatedOrders,
        trades: updatedTrades
      })
    },
  }))
)