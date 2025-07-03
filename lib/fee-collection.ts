import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { ethers } from 'ethers'
import { dexSwapEngine } from './dex-swaps'

interface FeeCollectionData {
  userId: string
  txHash: string
  blockchain: string
  tokenAddress: string
  tokenSymbol: string
  tradeAmount: number
  feeAmount: number
  feeUsd: number
  timestamp: number
  dex: string
  tradeType: 'buy' | 'sell'
}

interface RevenueMetrics {
  totalFeesCollected: number
  totalFeesUsd: number
  totalTransactions: number
  averageFeePerTx: number
  topTokensByFees: Array<{
    symbol: string
    fees: number
    transactions: number
  }>
  dailyRevenue: Array<{
    date: string
    fees: number
    transactions: number
  }>
  userMetrics: {
    totalUsers: number
    activeUsers24h: number
    averageTradesPerUser: number
  }
}

export class FeeCollectionSystem {
  private solanaConnection: Connection
  private ethereumProvider: ethers.JsonRpcProvider
  private feeCollectionData: Map<string, FeeCollectionData[]> = new Map()
  private revenueMetrics: RevenueMetrics
  
  // Fee structure (in basis points, 100 = 1%)
  private readonly FEE_STRUCTURE = {
    trading: 50,        // 0.5% trading fee
    volume_discount: {  // Volume-based fee discounts
      tier1: { minimum: 10000, discount: 10 },   // $10k+ volume: 10% discount
      tier2: { minimum: 50000, discount: 20 },   // $50k+ volume: 20% discount
      tier3: { minimum: 100000, discount: 30 },  // $100k+ volume: 30% discount
    },
    referral: 25,       // 0.25% referral bonus
    liquidity_provision: 10  // 0.1% for providing liquidity
  }

  // Fee collection wallets for different chains
  private readonly FEE_WALLETS = {
    solana: new PublicKey('FeE7qvQZ9oFy1J8VNjGLTyF6KHz8RfE1234567890ab'), // Replace with actual wallet
    ethereum: '0xFeE7qvQZ9oFy1J8VNjGLTyF6KHz8RfE1234567890', // Replace with actual wallet
    base: '0xFeE7qvQZ9oFy1J8VNjGLTyF6KHz8RfE1234567890'
  }

  // Partner addresses for revenue sharing
  private readonly REVENUE_PARTNERS = {
    telegram_bot: {
      address: '0xPartner1234567890abcdef',
      share: 2000 // 20% of fees
    },
    ui_platform: {
      address: '0xPartner2345678901bcdef0',
      share: 1000 // 10% of fees
    }
  }

  constructor() {
    this.solanaConnection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
    this.ethereumProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL)
    
    this.revenueMetrics = {
      totalFeesCollected: 0,
      totalFeesUsd: 0,
      totalTransactions: 0,
      averageFeePerTx: 0,
      topTokensByFees: [],
      dailyRevenue: [],
      userMetrics: {
        totalUsers: 0,
        activeUsers24h: 0,
        averageTradesPerUser: 0
      }
    }

    this.loadHistoricalData()
  }

  // Calculate fee for a trade
  calculateTradingFee(
    tradeAmount: number, 
    userVolume: number = 0, 
    hasReferral: boolean = false
  ): { feeAmount: number; feeRate: number } {
    let baseFeeRate = this.FEE_STRUCTURE.trading

    // Apply volume-based discounts
    if (userVolume >= this.FEE_STRUCTURE.volume_discount.tier3.minimum) {
      baseFeeRate -= (baseFeeRate * this.FEE_STRUCTURE.volume_discount.tier3.discount) / 100
    } else if (userVolume >= this.FEE_STRUCTURE.volume_discount.tier2.minimum) {
      baseFeeRate -= (baseFeeRate * this.FEE_STRUCTURE.volume_discount.tier2.discount) / 100
    } else if (userVolume >= this.FEE_STRUCTURE.volume_discount.tier1.minimum) {
      baseFeeRate -= (baseFeeRate * this.FEE_STRUCTURE.volume_discount.tier1.discount) / 100
    }

    // Apply referral discount
    if (hasReferral) {
      baseFeeRate -= this.FEE_STRUCTURE.referral
    }

    const feeAmount = (tradeAmount * baseFeeRate) / 10000
    
    return {
      feeAmount,
      feeRate: baseFeeRate
    }
  }

  // Collect fee from a completed trade
  async collectTradingFee(
    userId: string,
    txHash: string,
    blockchain: string,
    tokenAddress: string,
    tokenSymbol: string,
    tradeAmount: number,
    tradeType: 'buy' | 'sell',
    dex: string,
    tokenPriceUsd: number
  ): Promise<{ success: boolean; feeAmount: number; error?: string }> {
    try {
      console.log(`💰 Collecting fee for ${tradeType} trade: ${tradeAmount} ${tokenSymbol}`)

      // Get user's trading volume for fee calculation
      const userVolume = await this.getUserTradingVolume(userId)
      const hasReferral = await this.userHasReferral(userId)

      // Calculate fee
      const { feeAmount, feeRate } = this.calculateTradingFee(tradeAmount, userVolume, hasReferral)
      const feeUsd = feeAmount * tokenPriceUsd

      // Execute fee collection based on blockchain
      let collectionResult
      switch (blockchain) {
        case 'solana':
          collectionResult = await this.collectSolanaFee(feeAmount, txHash)
          break
        case 'ethereum':
          collectionResult = await this.collectEthereumFee(tokenAddress, feeAmount, txHash)
          break
        case 'base':
          collectionResult = await this.collectBaseFee(tokenAddress, feeAmount, txHash)
          break
        default:
          throw new Error(`Unsupported blockchain: ${blockchain}`)
      }

      if (collectionResult.success) {
        // Record fee collection
        const feeData: FeeCollectionData = {
          userId,
          txHash,
          blockchain,
          tokenAddress,
          tokenSymbol,
          tradeAmount,
          feeAmount,
          feeUsd,
          timestamp: Date.now(),
          dex,
          tradeType
        }

        await this.recordFeeCollection(feeData)
        await this.updateRevenueMetrics(feeData)
        
        // Distribute revenue to partners
        await this.distributeRevenue(feeUsd, blockchain)

        console.log(`✅ Fee collected: $${feeUsd.toFixed(4)} (${feeRate/100}%)`)
        
        return {
          success: true,
          feeAmount: feeUsd
        }
      } else {
        console.error(`❌ Fee collection failed: ${collectionResult.error}`)
        return {
          success: false,
          feeAmount: 0,
          error: collectionResult.error
        }
      }
    } catch (error) {
      console.error('Error collecting trading fee:', error)
      return {
        success: false,
        feeAmount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Collect fee on Solana
  private async collectSolanaFee(feeAmount: number, txHash: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, this would be part of the swap transaction
      // For now, we'll simulate successful fee collection
      console.log(`💰 Collecting ${feeAmount} SOL fee on Solana`)
      
      // The fee collection would typically be added as an instruction to the swap transaction
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Solana fee collection failed' 
      }
    }
  }

  // Collect fee on Ethereum
  private async collectEthereumFee(
    tokenAddress: string, 
    feeAmount: number, 
    txHash: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`💰 Collecting ${feeAmount} ${tokenAddress} fee on Ethereum`)
      
      // In production, this would transfer tokens to the fee wallet
      // This would be implemented as part of the swap transaction
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ethereum fee collection failed' 
      }
    }
  }

  // Collect fee on Base
  private async collectBaseFee(
    tokenAddress: string, 
    feeAmount: number, 
    txHash: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`💰 Collecting ${feeAmount} ${tokenAddress} fee on Base`)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Base fee collection failed' 
      }
    }
  }

  // Record fee collection data
  private async recordFeeCollection(feeData: FeeCollectionData): Promise<void> {
    const userId = feeData.userId
    
    if (!this.feeCollectionData.has(userId)) {
      this.feeCollectionData.set(userId, [])
    }
    
    this.feeCollectionData.get(userId)!.push(feeData)
    
    // In production, this would be saved to a database
    console.log(`📊 Recorded fee: $${feeData.feeUsd.toFixed(4)} from ${feeData.tokenSymbol} ${feeData.tradeType}`)
  }

  // Update revenue metrics
  private async updateRevenueMetrics(feeData: FeeCollectionData): Promise<void> {
    this.revenueMetrics.totalFeesCollected += feeData.feeAmount
    this.revenueMetrics.totalFeesUsd += feeData.feeUsd
    this.revenueMetrics.totalTransactions += 1
    this.revenueMetrics.averageFeePerTx = this.revenueMetrics.totalFeesUsd / this.revenueMetrics.totalTransactions

    // Update top tokens by fees
    this.updateTopTokensByFees(feeData)
    
    // Update daily revenue
    this.updateDailyRevenue(feeData)
  }

  // Update top tokens by fees
  private updateTopTokensByFees(feeData: FeeCollectionData): void {
    const existingToken = this.revenueMetrics.topTokensByFees.find(
      token => token.symbol === feeData.tokenSymbol
    )

    if (existingToken) {
      existingToken.fees += feeData.feeUsd
      existingToken.transactions += 1
    } else {
      this.revenueMetrics.topTokensByFees.push({
        symbol: feeData.tokenSymbol,
        fees: feeData.feeUsd,
        transactions: 1
      })
    }

    // Sort by fees and keep top 20
    this.revenueMetrics.topTokensByFees.sort((a, b) => b.fees - a.fees)
    this.revenueMetrics.topTokensByFees = this.revenueMetrics.topTokensByFees.slice(0, 20)
  }

  // Update daily revenue
  private updateDailyRevenue(feeData: FeeCollectionData): void {
    const date = new Date(feeData.timestamp).toISOString().split('T')[0]
    const existingDay = this.revenueMetrics.dailyRevenue.find(day => day.date === date)

    if (existingDay) {
      existingDay.fees += feeData.feeUsd
      existingDay.transactions += 1
    } else {
      this.revenueMetrics.dailyRevenue.push({
        date,
        fees: feeData.feeUsd,
        transactions: 1
      })
    }

    // Keep only last 30 days
    this.revenueMetrics.dailyRevenue.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    this.revenueMetrics.dailyRevenue = this.revenueMetrics.dailyRevenue.slice(0, 30)
  }

  // Distribute revenue to partners
  private async distributeRevenue(feeUsd: number, blockchain: string): Promise<void> {
    try {
      const telegramBotShare = (feeUsd * this.REVENUE_PARTNERS.telegram_bot.share) / 10000
      const uiPlatformShare = (feeUsd * this.REVENUE_PARTNERS.ui_platform.share) / 10000
      
      console.log(`💸 Distributing revenue: $${telegramBotShare.toFixed(4)} to bot, $${uiPlatformShare.toFixed(4)} to UI`)
      
      // In production, this would execute actual transfers to partner wallets
    } catch (error) {
      console.error('Error distributing revenue:', error)
    }
  }

  // Get user's total trading volume
  private async getUserTradingVolume(userId: string): Promise<number> {
    const userFees = this.feeCollectionData.get(userId) || []
    return userFees.reduce((total, fee) => total + fee.tradeAmount, 0)
  }

  // Check if user has referral
  private async userHasReferral(userId: string): Promise<boolean> {
    // In production, this would check referral database
    return false
  }

  // Load historical fee data
  private async loadHistoricalData(): Promise<void> {
    // In production, this would load from database
    console.log('📊 Loading historical fee data...')
  }

  // Get revenue metrics
  getRevenueMetrics(): RevenueMetrics {
    return { ...this.revenueMetrics }
  }

  // Get user fee history
  getUserFeeHistory(userId: string): FeeCollectionData[] {
    return this.feeCollectionData.get(userId) || []
  }

  // Get total fees collected for a token
  getTokenFees(tokenSymbol: string): number {
    let totalFees = 0
    
    for (const userFees of this.feeCollectionData.values()) {
      for (const fee of userFees) {
        if (fee.tokenSymbol === tokenSymbol) {
          totalFees += fee.feeUsd
        }
      }
    }
    
    return totalFees
  }

  // Get daily revenue breakdown
  getDailyRevenue(days: number = 30): Array<{ date: string; fees: number; transactions: number }> {
    return this.revenueMetrics.dailyRevenue.slice(0, days)
  }

  // Get top performing tokens
  getTopTokens(limit: number = 10): Array<{ symbol: string; fees: number; transactions: number }> {
    return this.revenueMetrics.topTokensByFees.slice(0, limit)
  }

  // Generate revenue report
  generateRevenueReport(): {
    summary: RevenueMetrics
    topUsers: Array<{ userId: string; totalFees: number; transactions: number }>
    recentTransactions: FeeCollectionData[]
  } {
    // Calculate top users
    const userStats = new Map<string, { totalFees: number; transactions: number }>()
    
    for (const [userId, userFees] of this.feeCollectionData) {
      const totalFees = userFees.reduce((sum, fee) => sum + fee.feeUsd, 0)
      userStats.set(userId, {
        totalFees,
        transactions: userFees.length
      })
    }

    const topUsers = Array.from(userStats.entries())
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.totalFees - a.totalFees)
      .slice(0, 20)

    // Get recent transactions
    const allTransactions: FeeCollectionData[] = []
    for (const userFees of this.feeCollectionData.values()) {
      allTransactions.push(...userFees)
    }
    
    const recentTransactions = allTransactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50)

    return {
      summary: this.getRevenueMetrics(),
      topUsers,
      recentTransactions
    }
  }

  // Set fee structure (admin function)
  updateFeeStructure(newFeeStructure: Partial<typeof this.FEE_STRUCTURE>): void {
    Object.assign(this.FEE_STRUCTURE, newFeeStructure)
    console.log('📊 Fee structure updated:', this.FEE_STRUCTURE)
  }

  // Emergency fee collection pause
  pauseFeeCollection(): void {
    console.log('⏸️ Fee collection paused')
    // Implementation would set a flag to pause fee collection
  }

  // Resume fee collection
  resumeFeeCollection(): void {
    console.log('▶️ Fee collection resumed')
    // Implementation would clear the pause flag
  }
}

export const feeCollectionSystem = new FeeCollectionSystem()