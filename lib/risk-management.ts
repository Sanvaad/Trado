import { Position, Order } from '@/types/trading'

export interface RiskMetrics {
  totalExposure: number
  availableMargin: number
  marginUsed: number
  marginUtilization: number
  totalUnrealizedPnl: number
  totalRealizedPnl: number
  riskScore: number
  maxPositionSize: number
  liquidationRisk: 'low' | 'medium' | 'high'
  warnings: string[]
}

export interface RiskLimits {
  maxMarginUtilization: number // 0.8 = 80%
  maxPositionSize: number
  maxDailyLoss: number
  maxConcurrentPositions: number
  maxLeveragePerPosition: number
}

export class RiskManager {
  private static instance: RiskManager
  private limits: RiskLimits = {
    maxMarginUtilization: 0.8, // 80%
    maxPositionSize: 10000, // $10,000
    maxDailyLoss: 1000, // $1,000
    maxConcurrentPositions: 5,
    maxLeveragePerPosition: 20
  }

  static getInstance(): RiskManager {
    if (!RiskManager.instance) {
      RiskManager.instance = new RiskManager()
    }
    return RiskManager.instance
  }

  private constructor() {}

  calculateRiskMetrics(
    positions: Position[], 
    orders: Order[], 
    accountBalance: number
  ): RiskMetrics {
    const totalExposure = positions.reduce((sum, pos) => 
      sum + Math.abs(pos.size * pos.markPrice), 0
    )
    
    const marginUsed = positions.reduce((sum, pos) => sum + pos.margin, 0)
    const availableMargin = accountBalance - marginUsed
    const marginUtilization = marginUsed / accountBalance
    
    const totalUnrealizedPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0)
    const totalRealizedPnl = positions.reduce((sum, pos) => sum + pos.realizedPnl, 0)
    
    const riskScore = this.calculateRiskScore(
      marginUtilization, 
      positions.length, 
      totalUnrealizedPnl / accountBalance
    )
    
    const liquidationRisk = this.calculateLiquidationRisk(positions, accountBalance)
    const maxPositionSize = this.calculateMaxPositionSize(accountBalance, marginUsed)
    const warnings = this.generateWarnings(positions, orders, accountBalance)

    return {
      totalExposure,
      availableMargin,
      marginUsed,
      marginUtilization,
      totalUnrealizedPnl,
      totalRealizedPnl,
      riskScore,
      maxPositionSize,
      liquidationRisk,
      warnings
    }
  }

  private calculateRiskScore(
    marginUtilization: number,
    positionCount: number,
    pnlRatio: number
  ): number {
    let score = 0
    
    // Margin utilization risk (0-40 points)
    score += marginUtilization * 40
    
    // Position count risk (0-30 points)
    score += Math.min(positionCount / this.limits.maxConcurrentPositions, 1) * 30
    
    // PnL risk (0-30 points)
    if (pnlRatio < 0) {
      score += Math.min(Math.abs(pnlRatio) * 2, 1) * 30
    }
    
    return Math.min(score, 100)
  }

  private calculateLiquidationRisk(
    positions: Position[], 
    accountBalance: number
  ): 'low' | 'medium' | 'high' {
    const highLeveragePositions = positions.filter(pos => pos.leverage > 10).length
    const marginUtilization = positions.reduce((sum, pos) => sum + pos.margin, 0) / accountBalance
    const negativePnlCount = positions.filter(pos => pos.unrealizedPnl < 0).length

    if (marginUtilization > 0.9 || highLeveragePositions > 2) {
      return 'high'
    } else if (marginUtilization > 0.7 || highLeveragePositions > 0 || negativePnlCount > 3) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  private calculateMaxPositionSize(accountBalance: number, marginUsed: number): number {
    const availableMargin = accountBalance - marginUsed
    const maxNewMargin = Math.min(
      availableMargin * 0.5, // Use max 50% of available margin
      this.limits.maxPositionSize
    )
    return maxNewMargin
  }

  private generateWarnings(
    positions: Position[], 
    orders: Order[], 
    accountBalance: number
  ): string[] {
    const warnings: string[] = []
    
    const marginUsed = positions.reduce((sum, pos) => sum + pos.margin, 0)
    const marginUtilization = marginUsed / accountBalance
    
    // High margin utilization
    if (marginUtilization > this.limits.maxMarginUtilization) {
      warnings.push(`High margin utilization: ${(marginUtilization * 100).toFixed(1)}%`)
    }
    
    // Too many positions
    if (positions.length > this.limits.maxConcurrentPositions) {
      warnings.push(`Too many concurrent positions: ${positions.length}`)
    }
    
    // High leverage positions
    const highLeveragePositions = positions.filter(pos => pos.leverage > this.limits.maxLeveragePerPosition)
    if (highLeveragePositions.length > 0) {
      warnings.push(`${highLeveragePositions.length} position(s) with high leverage (>${this.limits.maxLeveragePerPosition}x)`)
    }
    
    // Large unrealized losses
    const totalUnrealizedPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0)
    if (totalUnrealizedPnl < -this.limits.maxDailyLoss) {
      warnings.push(`Large unrealized losses: $${Math.abs(totalUnrealizedPnl).toFixed(2)}`)
    }
    
    // Positions close to liquidation
    const riskPositions = positions.filter(pos => {
      const pnlPercentage = (pos.unrealizedPnl / pos.margin) * 100
      return pnlPercentage < -50 // Position down 50% or more
    })
    if (riskPositions.length > 0) {
      warnings.push(`${riskPositions.length} position(s) at risk of liquidation`)
    }
    
    return warnings
  }

  validateOrder(
    order: Partial<Order>, 
    positions: Position[], 
    accountBalance: number
  ): { allowed: boolean; reasons: string[] } {
    const reasons: string[] = []
    
    if (!order.quantity || !order.price) {
      reasons.push('Invalid order parameters')
      return { allowed: false, reasons }
    }
    
    const orderValue = order.quantity * order.price
    const leverage = order.leverage || 1
    const requiredMargin = orderValue / leverage
    
    const currentMarginUsed = positions.reduce((sum, pos) => sum + pos.margin, 0)
    const newMarginUtilization = (currentMarginUsed + requiredMargin) / accountBalance
    
    // Check margin limits
    if (newMarginUtilization > this.limits.maxMarginUtilization) {
      reasons.push(`Would exceed margin limit (${(newMarginUtilization * 100).toFixed(1)}%)`)
    }
    
    // Check position size limits
    if (orderValue > this.limits.maxPositionSize) {
      reasons.push(`Position size too large (max: $${this.limits.maxPositionSize.toLocaleString()})`)
    }
    
    // Check position count limits
    if (positions.length >= this.limits.maxConcurrentPositions) {
      reasons.push(`Too many positions (max: ${this.limits.maxConcurrentPositions})`)
    }
    
    // Check leverage limits
    if (leverage > this.limits.maxLeveragePerPosition) {
      reasons.push(`Leverage too high (max: ${this.limits.maxLeveragePerPosition}x)`)
    }
    
    // Check sufficient balance
    if (requiredMargin > (accountBalance - currentMarginUsed)) {
      reasons.push('Insufficient available margin')
    }
    
    return {
      allowed: reasons.length === 0,
      reasons
    }
  }

  getPositionRecommendations(
    position: Position,
    currentPrice: number
  ): { action: string; reason: string; urgency: 'low' | 'medium' | 'high' }[] {
    const recommendations: { action: string; reason: string; urgency: 'low' | 'medium' | 'high' }[] = []
    
    const pnlPercentage = (position.unrealizedPnl / position.margin) * 100
    const priceChange = (currentPrice - position.entryPrice) / position.entryPrice
    
    // Liquidation risk
    if (pnlPercentage < -70) {
      recommendations.push({
        action: 'Close position immediately',
        reason: 'Position at critical liquidation risk',
        urgency: 'high'
      })
    } else if (pnlPercentage < -50) {
      recommendations.push({
        action: 'Consider closing position',
        reason: 'Position at high liquidation risk',
        urgency: 'medium'
      })
    }
    
    // Profit taking
    if (pnlPercentage > 100) {
      recommendations.push({
        action: 'Consider taking partial profits',
        reason: 'Position showing strong profits',
        urgency: 'low'
      })
    }
    
    // High leverage warning
    if (position.leverage > 10 && Math.abs(priceChange) > 0.05) {
      recommendations.push({
        action: 'Monitor position closely',
        reason: 'High leverage position with significant price movement',
        urgency: 'medium'
      })
    }
    
    return recommendations
  }

  setRiskLimits(newLimits: Partial<RiskLimits>): void {
    this.limits = { ...this.limits, ...newLimits }
  }

  getRiskLimits(): RiskLimits {
    return { ...this.limits }
  }
}

export const riskManager = RiskManager.getInstance()