import { Order, Position, Trade } from '@/types/trading'

export interface OrderValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface OrderExecutionResult {
  success: boolean
  orderId?: string
  executedPrice?: number
  executedQuantity?: number
  error?: string
  trade?: Trade
}

export interface RiskCheckResult {
  allowed: boolean
  reason?: string
  suggestedMaxSize?: number
}

export class TradingEngine {
  private static instance: TradingEngine
  private orders: Map<string, Order> = new Map()
  private positions: Map<string, Position> = new Map()
  private trades: Trade[] = []
  private orderCounter = 0

  static getInstance(): TradingEngine {
    if (!TradingEngine.instance) {
      TradingEngine.instance = new TradingEngine()
    }
    return TradingEngine.instance
  }

  private generateOrderId(): string {
    return `order-${Date.now()}-${++this.orderCounter}`
  }

  private generateTradeId(): string {
    return `trade-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }

  validateOrder(order: Partial<Order>, userBalance: number, currentPrice: number): OrderValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields validation
    if (!order.symbol) errors.push('Symbol is required')
    if (!order.side) errors.push('Order side is required')
    if (!order.quantity || order.quantity <= 0) errors.push('Quantity must be greater than 0')
    if (!order.type) errors.push('Order type is required')

    // Price validation for limit orders
    if (order.type === 'limit' && (!order.price || order.price <= 0)) {
      errors.push('Price is required for limit orders')
    }

    // Balance validation
    if (order.side === 'buy' && order.quantity && order.price) {
      const requiredBalance = order.quantity * order.price
      if (requiredBalance > userBalance) {
        errors.push(`Insufficient balance. Required: $${requiredBalance.toFixed(2)}, Available: $${userBalance.toFixed(2)}`)
      }
    }

    // Minimum order size validation
    const minOrderSize = 10 // $10 minimum
    if (order.quantity && order.price && (order.quantity * order.price) < minOrderSize) {
      errors.push(`Order size must be at least $${minOrderSize}`)
    }

    // Maximum order size validation (risk management)
    const maxOrderSize = userBalance * 0.5 // Max 50% of balance per order
    if (order.quantity && order.price && (order.quantity * order.price) > maxOrderSize) {
      warnings.push(`Large order size. Consider splitting into smaller orders.`)
    }

    // Price deviation warning for market orders
    if (order.type === 'market' && currentPrice) {
      warnings.push('Market orders execute at current market price and may have slippage')
    }

    // Price deviation warning for limit orders
    if (order.type === 'limit' && order.price && currentPrice) {
      const deviation = Math.abs(order.price - currentPrice) / currentPrice
      if (deviation > 0.05) { // 5% deviation
        warnings.push(`Limit price deviates significantly from current market price (${(deviation * 100).toFixed(1)}%)`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  async executeOrder(orderData: Partial<Order>, userBalance: number, currentPrice: number): Promise<OrderExecutionResult> {
    try {
      // Validate order
      const validation = this.validateOrder(orderData, userBalance, currentPrice)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        }
      }

      // Create order
      const order: Order = {
        id: this.generateOrderId(),
        symbol: orderData.symbol!,
        side: orderData.side!,
        type: orderData.type!,
        quantity: orderData.quantity!,
        price: orderData.price || currentPrice,
        status: 'pending',
        timestamp: Date.now(),
        leverage: orderData.leverage || 1,
        stopLoss: orderData.stopLoss,
        takeProfit: orderData.takeProfit,
        timeInForce: orderData.timeInForce || 'GTC'
      }

      // Store order
      this.orders.set(order.id, order)

      // Execute based on order type
      let executionResult: OrderExecutionResult

      if (order.type === 'market') {
        executionResult = await this.executeMarketOrder(order, currentPrice)
      } else {
        executionResult = await this.executeLimitOrder(order, currentPrice)
      }

      // Update order status
      if (executionResult.success) {
        order.status = 'filled'
        order.filledQuantity = executionResult.executedQuantity
        order.averagePrice = executionResult.executedPrice
        order.filledAt = Date.now()
      } else {
        order.status = 'rejected'
        order.rejectedReason = executionResult.error
      }

      this.orders.set(order.id, order)
      return { ...executionResult, orderId: order.id }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error'
      }
    }
  }

  private async executeMarketOrder(order: Order, currentPrice: number): Promise<OrderExecutionResult> {
    // Simulate market order execution with slippage
    const slippage = Math.random() * 0.001 // 0.1% random slippage
    const slippageDirection = order.side === 'buy' ? 1 : -1
    const executedPrice = currentPrice * (1 + (slippage * slippageDirection))
    
    // Create trade
    const trade: Trade = {
      id: this.generateTradeId(),
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: executedPrice,
      timestamp: Date.now(),
      fee: this.calculateFee(order.quantity, executedPrice),
      leverage: order.leverage
    }

    this.trades.push(trade)

    // Update or create position
    await this.updatePosition(trade)

    return {
      success: true,
      executedPrice,
      executedQuantity: order.quantity,
      trade
    }
  }

  private async executeLimitOrder(order: Order, currentPrice: number): Promise<OrderExecutionResult> {
    // For now, simulate immediate execution if price is favorable
    // In a real system, this would be queued and matched by the order book
    
    const shouldExecute = (
      (order.side === 'buy' && order.price! >= currentPrice) ||
      (order.side === 'sell' && order.price! <= currentPrice)
    )

    if (!shouldExecute) {
      // Order would be queued in the order book
      return {
        success: true,
        executedPrice: undefined,
        executedQuantity: 0
      }
    }

    // Execute at limit price
    const trade: Trade = {
      id: this.generateTradeId(),
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price!,
      timestamp: Date.now(),
      fee: this.calculateFee(order.quantity, order.price!),
      leverage: order.leverage
    }

    this.trades.push(trade)
    await this.updatePosition(trade)

    return {
      success: true,
      executedPrice: order.price,
      executedQuantity: order.quantity,
      trade
    }
  }

  private async updatePosition(trade: Trade): Promise<void> {
    const positionKey = `${trade.symbol}-${trade.leverage}`
    let position = this.positions.get(positionKey)

    if (!position) {
      // Create new position
      position = {
        id: `pos-${Date.now()}`,
        symbol: trade.symbol,
        side: trade.side,
        size: trade.side === 'buy' ? trade.quantity : -trade.quantity,
        entryPrice: trade.price,
        markPrice: trade.price,
        pnl: 0,
        pnlPercent: 0,
        unrealizedPnl: 0,
        realizedPnl: 0,
        leverage: trade.leverage || 1,
        margin: (trade.quantity * trade.price) / (trade.leverage || 1),
        timestamp: trade.timestamp,
        stopLoss: undefined,
        takeProfit: undefined
      }
    } else {
      // Update existing position
      const currentSize = position.size
      const tradeSize = trade.side === 'buy' ? trade.quantity : -trade.quantity
      const newSize = currentSize + tradeSize

      if (Math.sign(currentSize) === Math.sign(tradeSize) || currentSize === 0) {
        // Same direction or opening new position
        const totalValue = (Math.abs(currentSize) * position.entryPrice) + (trade.quantity * trade.price)
        const totalQuantity = Math.abs(currentSize) + trade.quantity
        position.entryPrice = totalValue / totalQuantity
        position.size = newSize
        position.margin += (trade.quantity * trade.price) / (trade.leverage || 1)
      } else {
        // Opposite direction - closing or reducing position
        const closingQuantity = Math.min(Math.abs(currentSize), trade.quantity)
        const pnlPerUnit = trade.side === 'buy' ? 
          (position.entryPrice - trade.price) : 
          (trade.price - position.entryPrice)
        
        position.realizedPnl += pnlPerUnit * closingQuantity * position.leverage
        position.size = newSize
        
        if (Math.abs(newSize) < Math.abs(currentSize)) {
          // Reducing position
          position.margin = (Math.abs(newSize) * position.entryPrice) / position.leverage
        }
      }
    }

    if (position) {
      this.positions.set(positionKey, position)
    }
  }

  private calculateFee(quantity: number, price: number): number {
    const feeRate = 0.001 // 0.1% fee
    return quantity * price * feeRate
  }

  checkRisk(order: Partial<Order>, userBalance: number, currentPositions: Position[]): RiskCheckResult {
    if (!order.quantity || !order.price) {
      return { allowed: false, reason: 'Invalid order parameters' }
    }

    const orderValue = order.quantity * order.price
    const leverage = order.leverage || 1
    const margin = orderValue / leverage

    // Check if user has enough margin
    if (margin > userBalance * 0.8) { // Max 80% of balance as margin
      return {
        allowed: false,
        reason: 'Insufficient margin',
        suggestedMaxSize: (userBalance * 0.8 * leverage) / order.price
      }
    }

    // Check total exposure
    const totalExposure = currentPositions.reduce((sum, pos) => sum + Math.abs(pos.size * pos.markPrice), 0)
    const newExposure = totalExposure + orderValue

    if (newExposure > userBalance * 10) { // Max 10x total exposure
      return {
        allowed: false,
        reason: 'Maximum exposure limit reached'
      }
    }

    return { allowed: true }
  }

  getOrders(): Order[] {
    return Array.from(this.orders.values())
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values())
  }

  getTrades(): Trade[] {
    return this.trades
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId)
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId)
    if (!order || order.status !== 'pending') {
      return false
    }

    order.status = 'cancelled'
    order.cancelledAt = Date.now()
    this.orders.set(orderId, order)
    return true
  }

  async closePosition(positionId: string, currentPrice: number): Promise<OrderExecutionResult> {
    const position = Array.from(this.positions.values()).find(p => p.id === positionId)
    if (!position) {
      return { success: false, error: 'Position not found' }
    }

    // Create closing order
    const closingOrder: Partial<Order> = {
      symbol: position.symbol,
      side: position.side === 'buy' ? 'sell' : 'buy',
      type: 'market',
      quantity: Math.abs(position.size),
      leverage: position.leverage
    }

    return this.executeOrder(closingOrder, Infinity, currentPrice) // Assume sufficient balance for closing
  }
}

export const tradingEngine = TradingEngine.getInstance()