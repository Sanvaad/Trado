import { blockchainPriceFeeds } from './blockchain-price-feeds'
import { dexMonitor } from './dex-monitor'
import { tradingBot } from './telegram-bot'
import { dexSwapEngine } from './dex-swaps'
import { feeCollectionSystem } from './fee-collection'

interface PlatformConfig {
  telegramBotToken?: string
  solanaRpcUrl?: string
  ethereumRpcUrl?: string
  baseRpcUrl?: string
  enableTelegramBot?: boolean
  enablePriceMonitoring?: boolean
  enableDexMonitoring?: boolean
  enableFeeCollection?: boolean
}

interface PlatformStatus {
  priceFeeds: {
    active: boolean
    monitoredTokens: number
    lastUpdate: number
  }
  dexMonitoring: {
    active: boolean
    connections: number
    newPairsToday: number
  }
  telegramBot: {
    active: boolean
    users: number
    commandsToday: number
  }
  feeCollection: {
    active: boolean
    totalFeesUsd: number
    transactionsToday: number
  }
  swapEngine: {
    active: boolean
    successRate: number
    totalSwaps: number
  }
}

export class TradingPlatform {
  private config: PlatformConfig
  private isInitialized = false
  private startTime: number = 0
  private stats = {
    totalSwaps: 0,
    successfulSwaps: 0,
    totalFeesCollected: 0,
    newPairsDiscovered: 0,
    activeUsers: 0
  }

  constructor(config: PlatformConfig = {}) {
    this.config = {
      enableTelegramBot: true,
      enablePriceMonitoring: true,
      enableDexMonitoring: true,
      enableFeeCollection: true,
      ...config
    }
  }

  // Initialize the entire trading platform
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Platform already initialized')
      return
    }

    console.log('🚀 Initializing Trado Trading Platform...')
    this.startTime = Date.now()

    try {
      // Initialize services in parallel for faster startup
      const initPromises: Promise<void>[] = []

      // 1. Initialize blockchain price feeds
      if (this.config.enablePriceMonitoring) {
        initPromises.push(this.initializePriceFeeds())
      }

      // 2. Initialize DEX monitoring
      if (this.config.enableDexMonitoring) {
        initPromises.push(this.initializeDexMonitoring())
      }

      // 3. Initialize Telegram bot
      if (this.config.enableTelegramBot && this.config.telegramBotToken) {
        initPromises.push(this.initializeTelegramBot())
      }

      // 4. Initialize fee collection
      if (this.config.enableFeeCollection) {
        initPromises.push(this.initializeFeeCollection())
      }

      // Wait for all services to initialize
      await Promise.all(initPromises)

      // Set up cross-service integrations
      await this.setupIntegrations()

      this.isInitialized = true
      console.log(`✅ Trado Platform initialized successfully in ${Date.now() - this.startTime}ms`)
      
      // Print platform status
      await this.printPlatformStatus()

    } catch (error) {
      console.error('❌ Failed to initialize trading platform:', error)
      throw error
    }
  }

  // Initialize blockchain price feeds
  private async initializePriceFeeds(): Promise<void> {
    console.log('📊 Initializing blockchain price feeds...')
    
    // Start monitoring popular meme coins on each chain
    const popularTokens = {
      solana: [
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
        'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
        'A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump'  // PNUT
      ],
      ethereum: [
        '0x6982508145454Ce325dDbE47a25d4ec3d2311933', // PEPE
        '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', // SHIB
        '0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E'  // FLOKI
      ],
      base: [
        '0x532f27101965dd16442E59d40670FaF5eBB142E4', // BRETT
        '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed'  // DEGEN
      ]
    }

    // Start monitoring each token
    for (const [blockchain, tokens] of Object.entries(popularTokens)) {
      for (const token of tokens) {
        try {
          await blockchainPriceFeeds.startPriceMonitoring(token, blockchain)
          console.log(`✅ Monitoring ${blockchain}:${token}`)
        } catch (error) {
          console.error(`❌ Failed to monitor ${blockchain}:${token}:`, error)
        }
      }
    }

    console.log('✅ Blockchain price feeds initialized')
  }

  // Initialize DEX monitoring
  private async initializeDexMonitoring(): Promise<void> {
    console.log('👀 Initializing DEX monitoring...')
    
    // Set up new pair detection callbacks
    dexMonitor.onNewPair((pairData) => {
      console.log(`🎉 New meme coin detected: ${pairData.tokenA.symbol}/${pairData.tokenB.symbol} on ${pairData.dex}`)
      this.stats.newPairsDiscovered++
      
      // Automatically start price monitoring for new pairs
      if (this.config.enablePriceMonitoring) {
        blockchainPriceFeeds.startPriceMonitoring(pairData.tokenA.address, pairData.blockchain)
          .then(() => {
            console.log(`📊 Started monitoring new token: ${pairData.tokenA.symbol}`)
          })
          .catch((error) => {
            console.error(`Failed to start monitoring ${pairData.tokenA.symbol}:`, error)
          })
      }
    })

    // Start monitoring all DEXes
    await dexMonitor.startMonitoring()
    console.log('✅ DEX monitoring initialized')
  }

  // Initialize Telegram bot
  private async initializeTelegramBot(): Promise<void> {
    console.log('🤖 Initializing Telegram bot...')
    
    if (!this.config.telegramBotToken) {
      console.log('⚠️ No Telegram bot token provided, skipping bot initialization')
      return
    }

    await tradingBot.start()
    console.log('✅ Telegram bot initialized')
  }

  // Initialize fee collection
  private async initializeFeeCollection(): Promise<void> {
    console.log('💰 Initializing fee collection system...')
    
    // Set up automatic fee collection for all swaps
    const originalExecuteSwap = dexSwapEngine.executeSwap.bind(dexSwapEngine)
    
    dexSwapEngine.executeSwap = async (params) => {
      const result = await originalExecuteSwap(params)
      
      if (result.success && result.outputAmount && result.txHash) {
        // Collect platform fee
        const feeResult = await feeCollectionSystem.collectTradingFee(
          params.userWallet || 'anonymous',
          result.txHash,
          params.blockchain,
          params.outputToken,
          'UNKNOWN', // Would get symbol from token registry
          result.outputAmount,
          'buy', // Would determine from params
          'unknown', // Would get from swap result
          result.outputAmount // Simplified USD calculation
        )
        
        if (feeResult.success) {
          this.stats.totalFeesCollected += feeResult.feeAmount
        }
      }
      
      // Update swap stats
      this.stats.totalSwaps++
      if (result.success) {
        this.stats.successfulSwaps++
      }
      
      return result
    }

    console.log('✅ Fee collection system initialized')
  }

  // Set up integrations between services
  private async setupIntegrations(): Promise<void> {
    console.log('🔗 Setting up service integrations...')
    
    // Integration: Price feeds → Telegram notifications
    if (this.config.enableTelegramBot && this.config.enablePriceMonitoring) {
      // Set up price alerts for significant moves
      blockchainPriceFeeds.getAllPrices().forEach((priceData, key) => {
        if (Math.abs(priceData.priceChange5m) > 20) { // 20% move in 5 minutes
          // Would send Telegram notification to subscribers
          console.log(`🚨 Price alert: ${priceData.symbol} moved ${priceData.priceChange5m.toFixed(2)}% in 5 minutes`)
        }
      })
    }

    // Integration: DEX monitoring → Auto-trading signals
    if (this.config.enableDexMonitoring) {
      dexMonitor.onNewPair((pairData) => {
        // Could implement auto-trading logic for new high-potential pairs
        if (pairData.initialLiquidity > 10000) { // $10k+ liquidity
          console.log(`💡 High liquidity new pair: ${pairData.tokenA.symbol} with $${pairData.initialLiquidity} liquidity`)
        }
      })
    }

    console.log('✅ Service integrations configured')
  }

  // Get platform status
  async getStatus(): Promise<PlatformStatus> {
    const allPrices = blockchainPriceFeeds.getAllPrices()
    const dexStatus = dexMonitor.getStatus()
    const revenueMetrics = feeCollectionSystem.getRevenueMetrics()

    return {
      priceFeeds: {
        active: allPrices.size > 0,
        monitoredTokens: allPrices.size,
        lastUpdate: Math.max(...Array.from(allPrices.values()).map(p => p.timestamp))
      },
      dexMonitoring: {
        active: dexStatus.isMonitoring,
        connections: dexStatus.connections,
        newPairsToday: this.stats.newPairsDiscovered
      },
      telegramBot: {
        active: this.config.enableTelegramBot || false,
        users: 0, // Would get from bot user count
        commandsToday: 0
      },
      feeCollection: {
        active: this.config.enableFeeCollection || false,
        totalFeesUsd: revenueMetrics.totalFeesUsd,
        transactionsToday: revenueMetrics.totalTransactions
      },
      swapEngine: {
        active: true,
        successRate: this.stats.totalSwaps > 0 ? (this.stats.successfulSwaps / this.stats.totalSwaps) * 100 : 0,
        totalSwaps: this.stats.totalSwaps
      }
    }
  }

  // Print platform status
  private async printPlatformStatus(): Promise<void> {
    const status = await this.getStatus()
    
    console.log('\n🎯 TRADO TRADING PLATFORM STATUS')
    console.log('================================')
    console.log(`📊 Price Feeds: ${status.priceFeeds.active ? '✅ Active' : '❌ Inactive'} (${status.priceFeeds.monitoredTokens} tokens)`)
    console.log(`👀 DEX Monitor: ${status.dexMonitoring.active ? '✅ Active' : '❌ Inactive'} (${status.dexMonitoring.connections} connections)`)
    console.log(`🤖 Telegram Bot: ${status.telegramBot.active ? '✅ Active' : '❌ Inactive'}`)
    console.log(`💰 Fee Collection: ${status.feeCollection.active ? '✅ Active' : '❌ Inactive'} ($${status.feeCollection.totalFeesUsd.toFixed(2)} collected)`)
    console.log(`🔄 Swap Engine: ${status.swapEngine.active ? '✅ Active' : '❌ Inactive'} (${status.swapEngine.successRate.toFixed(1)}% success rate)`)
    console.log(`\n🎉 Platform ready for meme coin trading!`)
    console.log(`📈 ${status.priceFeeds.monitoredTokens} tokens monitored across multiple chains`)
    console.log(`🆕 ${status.dexMonitoring.newPairsToday} new pairs discovered today`)
    console.log(`💵 $${status.feeCollection.totalFeesUsd.toFixed(2)} total fees collected`)
    console.log('================================\n')
  }

  // Start monitoring popular tokens
  async startPopularTokenMonitoring(): Promise<void> {
    console.log('🔥 Starting popular meme coin monitoring...')
    
    const popularTokens = [
      // Solana
      { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', blockchain: 'solana', symbol: 'BONK' },
      { address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', blockchain: 'solana', symbol: 'WIF' },
      { address: 'A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump', blockchain: 'solana', symbol: 'PNUT' },
      
      // Ethereum
      { address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', blockchain: 'ethereum', symbol: 'PEPE' },
      { address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', blockchain: 'ethereum', symbol: 'SHIB' },
      
      // Base
      { address: '0x532f27101965dd16442E59d40670FaF5eBB142E4', blockchain: 'base', symbol: 'BRETT' }
    ]

    for (const token of popularTokens) {
      try {
        await blockchainPriceFeeds.startPriceMonitoring(token.address, token.blockchain)
        console.log(`✅ Monitoring ${token.symbol} on ${token.blockchain}`)
      } catch (error) {
        console.error(`❌ Failed to monitor ${token.symbol}:`, error)
      }
    }
  }

  // Stop the platform
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Trado Platform...')
    
    try {
      // Stop all services
      if (this.config.enableDexMonitoring) {
        dexMonitor.stopMonitoring()
      }
      
      if (this.config.enablePriceMonitoring) {
        blockchainPriceFeeds.cleanup()
      }
      
      if (this.config.enableTelegramBot) {
        tradingBot.stop()
      }
      
      this.isInitialized = false
      console.log('✅ Platform shutdown complete')
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
    }
  }

  // Get platform metrics
  getMetrics() {
    return {
      uptime: Date.now() - this.startTime,
      stats: this.stats,
      isInitialized: this.isInitialized
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<PlatformConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('⚙️ Platform configuration updated')
  }
}

// Export singleton instance
export const tradingPlatform = new TradingPlatform({
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  solanaRpcUrl: process.env.SOLANA_RPC_URL,
  ethereumRpcUrl: process.env.ETHEREUM_RPC_URL,
  baseRpcUrl: process.env.BASE_RPC_URL
})