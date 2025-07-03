import { Connection, PublicKey, GetProgramAccountsFilter } from '@solana/web3.js'
import { ethers } from 'ethers'
import WebSocket from 'ws'
import axios from 'axios'
import { blockchainPriceFeeds } from './blockchain-price-feeds'

interface NewPairData {
  address: string
  tokenA: {
    address: string
    symbol: string
    name: string
    decimals: number
  }
  tokenB: {
    address: string
    symbol: string
    name: string
    decimals: number
  }
  initialLiquidity: number
  initialPrice: number
  dex: string
  blockchain: string
  createdAt: number
  txHash: string
}

interface LiquidityEvent {
  type: 'add' | 'remove'
  pairAddress: string
  amount0: number
  amount1: number
  liquidityProvider: string
  txHash: string
  timestamp: number
}

export class DEXMonitor {
  private solanaConnection: Connection
  private ethereumProvider: ethers.JsonRpcProvider
  private wsConnections: Map<string, WebSocket> = new Map()
  private newPairCallbacks: Function[] = []
  private liquidityCallbacks: Function[] = []
  private isMonitoring = false

  // Known meme coin patterns for filtering
  private readonly MEME_PATTERNS = [
    /doge/i, /shib/i, /pepe/i, /wojak/i, /chad/i, /bonk/i, /wif/i,
    /moon/i, /pump/i, /safe/i, /baby/i, /mini/i, /rocket/i, /inu/i,
    /cat/i, /dog/i, /frog/i, /bear/i, /bull/i, /ape/i, /panda/i,
    /meme/i, /coin/i, /token/i, /floki/i, /elon/i, /tesla/i
  ]

  // Program IDs for different DEXes
  private readonly DEX_PROGRAM_IDS = {
    solana: {
      raydium: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
      orca: new PublicKey('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'),
      meteora: new PublicKey('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'),
      phoenix: new PublicKey('PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLmNQ4YXJRb9HvN')
    },
    ethereum: {
      uniswapV2Factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      sushiswapFactory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac'
    }
  }

  constructor() {
    this.solanaConnection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
    this.ethereumProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key')
  }

  // Start monitoring all DEXes for new pairs
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    console.log('🚀 Starting DEX monitoring for new meme coin pairs...')

    // Start monitoring different chains in parallel
    await Promise.all([
      this.startSolanaMonitoring(),
      this.startEthereumMonitoring(),
      this.startBaseMonitoring()
    ])
  }

  // Monitor Solana DEXes for new pairs
  private async startSolanaMonitoring(): Promise<void> {
    console.log('👀 Monitoring Solana DEXes...')

    // Monitor Raydium
    await this.monitorRaydiumPairs()
    
    // Monitor Orca
    await this.monitorOrcaPairs()
    
    // Monitor pump.fun (popular for meme coins)
    await this.monitorPumpFun()
  }

  // Monitor Raydium for new liquidity pools
  private async monitorRaydiumPairs(): Promise<void> {
    try {
      // Subscribe to new pool creation events
      const ws = new WebSocket('wss://api.mainnet-beta.solana.com')
      
      ws.on('open', () => {
        console.log('✅ Connected to Solana WebSocket for Raydium monitoring')
        
        // Subscribe to logs mentioning Raydium program
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'logsSubscribe',
          params: [
            {
              mentions: [this.DEX_PROGRAM_IDS.solana.raydium.toString()]
            },
            {
              commitment: 'finalized'
            }
          ]
        }))
      })

      ws.on('message', async (data) => {
        try {
          const response = JSON.parse(data.toString())
          if (response.method === 'logsNotification') {
            await this.processRaydiumLogs(response.params.result)
          }
        } catch (error) {
          console.error('Error processing Raydium logs:', error)
        }
      })

      this.wsConnections.set('solana:raydium', ws)
    } catch (error) {
      console.error('Error monitoring Raydium:', error)
    }
  }

  // Process Raydium transaction logs
  private async processRaydiumLogs(logData: any): Promise<void> {
    try {
      const { signature, logs } = logData.value
      
      // Look for pool initialization logs
      const initLogs = logs.filter((log: string) => 
        log.includes('InitializeInstruction') || 
        log.includes('initialize') ||
        log.includes('create_pool')
      )

      if (initLogs.length > 0) {
        const newPair = await this.parseRaydiumNewPair(signature)
        if (newPair && this.isMemeToken(newPair)) {
          console.log(`🎉 New meme coin pair detected on Raydium: ${newPair.tokenA.symbol}/${newPair.tokenB.symbol}`)
          this.notifyNewPair(newPair)
          
          // Start price monitoring for this new token
          await blockchainPriceFeeds.startPriceMonitoring(newPair.tokenA.address, 'solana')
        }
      }
    } catch (error) {
      console.error('Error processing Raydium logs:', error)
    }
  }

  // Parse new Raydium pair from transaction
  private async parseRaydiumNewPair(signature: string): Promise<NewPairData | null> {
    try {
      const transaction = await this.solanaConnection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      })

      if (!transaction?.meta?.logMessages) return null

      // Extract pool address and token information from logs
      // This is a simplified version - actual implementation would need
      // to parse the transaction instructions more thoroughly
      
      const poolAddress = this.extractPoolAddress(transaction.meta.logMessages)
      if (!poolAddress) return null

      // Get token info from the pool
      const tokenInfo = await this.getPoolTokenInfo(poolAddress)
      if (!tokenInfo) return null

      return {
        address: poolAddress,
        tokenA: tokenInfo.tokenA,
        tokenB: tokenInfo.tokenB,
        initialLiquidity: tokenInfo.liquidity,
        initialPrice: tokenInfo.price,
        dex: 'raydium',
        blockchain: 'solana',
        createdAt: Date.now(),
        txHash: signature
      }
    } catch (error) {
      console.error('Error parsing Raydium new pair:', error)
      return null
    }
  }

  // Monitor Orca pools
  private async monitorOrcaPairs(): Promise<void> {
    // Similar implementation for Orca
    console.log('🌊 Monitoring Orca pools...')
  }

  // Monitor pump.fun (popular meme coin launchpad)
  private async monitorPumpFun(): Promise<void> {
    try {
      console.log('💨 Monitoring pump.fun for new launches...')
      
      // pump.fun has an API for recent launches
      setInterval(async () => {
        try {
          const response = await axios.get('https://frontend-api.pump.fun/coins?offset=0&limit=50&sort=created_timestamp&order=DESC')
          const coins = response.data
          
          for (const coin of coins) {
            // Check if this is a new coin (within last 5 minutes)
            const isNew = (Date.now() - coin.created_timestamp * 1000) < 5 * 60 * 1000
            
            if (isNew && this.isMemeTokenName(coin.name)) {
              const newPair: NewPairData = {
                address: coin.mint,
                tokenA: {
                  address: coin.mint,
                  symbol: coin.symbol,
                  name: coin.name,
                  decimals: 6
                },
                tokenB: {
                  address: 'So11111111111111111111111111111111111111112', // SOL
                  symbol: 'SOL',
                  name: 'Solana',
                  decimals: 9
                },
                initialLiquidity: coin.virtual_sol_reserves,
                initialPrice: coin.virtual_sol_reserves / coin.virtual_token_reserves,
                dex: 'pump.fun',
                blockchain: 'solana',
                createdAt: coin.created_timestamp * 1000,
                txHash: coin.mint
              }

              console.log(`🚀 New pump.fun launch: ${coin.symbol} - ${coin.name}`)
              this.notifyNewPair(newPair)
            }
          }
        } catch (error) {
          console.error('Error monitoring pump.fun:', error)
        }
      }, 10000) // Check every 10 seconds
    } catch (error) {
      console.error('Error setting up pump.fun monitoring:', error)
    }
  }

  // Monitor Ethereum DEXes
  private async startEthereumMonitoring(): Promise<void> {
    console.log('🔷 Monitoring Ethereum DEXes...')
    await this.monitorUniswapV2()
    await this.monitorUniswapV3()
  }

  // Monitor Uniswap V2 for new pairs
  private async monitorUniswapV2(): Promise<void> {
    try {
      const factoryContract = new ethers.Contract(
        this.DEX_PROGRAM_IDS.ethereum.uniswapV2Factory,
        [
          'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
          'function getPair(address tokenA, address tokenB) external view returns (address pair)'
        ],
        this.ethereumProvider
      )

      // Listen for new pair creation events
      factoryContract.on('PairCreated', async (token0, token1, pairAddress, pairIndex) => {
        try {
          console.log(`🦄 New Uniswap V2 pair created: ${pairAddress}`)
          
          const tokenInfo0 = await this.getEthereumTokenInfo(token0)
          const tokenInfo1 = await this.getEthereumTokenInfo(token1)
          
          if (tokenInfo0 && tokenInfo1 && 
              (this.isMemeTokenName(tokenInfo0.name) || this.isMemeTokenName(tokenInfo1.name))) {
            
            const newPair: NewPairData = {
              address: pairAddress,
              tokenA: tokenInfo0,
              tokenB: tokenInfo1,
              initialLiquidity: 0, // Will be updated when liquidity is added
              initialPrice: 0,
              dex: 'uniswap-v2',
              blockchain: 'ethereum',
              createdAt: Date.now(),
              txHash: pairAddress
            }

            console.log(`🎯 New meme coin pair on Uniswap V2: ${tokenInfo0.symbol}/${tokenInfo1.symbol}`)
            this.notifyNewPair(newPair)
          }
        } catch (error) {
          console.error('Error processing Uniswap V2 pair creation:', error)
        }
      })
    } catch (error) {
      console.error('Error monitoring Uniswap V2:', error)
    }
  }

  // Monitor Uniswap V3
  private async monitorUniswapV3(): Promise<void> {
    // Similar implementation for Uniswap V3
    console.log('🦄 Monitoring Uniswap V3...')
  }

  // Monitor Base chain DEXes
  private async startBaseMonitoring(): Promise<void> {
    console.log('🔵 Monitoring Base DEXes...')
    // Implementation for Base chain DEXes (Aerodrome, etc.)
  }

  // Utility functions
  private isMemeToken(pairData: NewPairData): boolean {
    const tokenName = pairData.tokenA.name.toLowerCase()
    const tokenSymbol = pairData.tokenA.symbol.toLowerCase()
    
    return this.MEME_PATTERNS.some(pattern => 
      pattern.test(tokenName) || pattern.test(tokenSymbol)
    )
  }

  private isMemeTokenName(name: string): boolean {
    const lowerName = name.toLowerCase()
    return this.MEME_PATTERNS.some(pattern => pattern.test(lowerName))
  }

  private extractPoolAddress(logs: string[]): string | null {
    // Parse logs to extract pool address
    // This is simplified - actual implementation would need proper log parsing
    for (const log of logs) {
      const match = log.match(/Program ([A-Za-z0-9]{32,44}) invoke/)
      if (match) {
        return match[1]
      }
    }
    return null
  }

  private async getPoolTokenInfo(poolAddress: string): Promise<any> {
    // Get token information from pool address
    // This would involve calling the pool's token account info
    return {
      tokenA: {
        address: 'token_a_address',
        symbol: 'TOKENA',
        name: 'Token A',
        decimals: 6
      },
      tokenB: {
        address: 'token_b_address', 
        symbol: 'TOKENB',
        name: 'Token B',
        decimals: 9
      },
      liquidity: 1000,
      price: 0.001
    }
  }

  private async getEthereumTokenInfo(tokenAddress: string): Promise<any> {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          'function name() view returns (string)',
          'function symbol() view returns (string)',
          'function decimals() view returns (uint8)'
        ],
        this.ethereumProvider
      )

      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals()
      ])

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals: Number(decimals)
      }
    } catch (error) {
      console.error('Error getting Ethereum token info:', error)
      return null
    }
  }

  // Event subscription methods
  onNewPair(callback: (pairData: NewPairData) => void): void {
    this.newPairCallbacks.push(callback)
  }

  onLiquidityChange(callback: (event: LiquidityEvent) => void): void {
    this.liquidityCallbacks.push(callback)
  }

  private notifyNewPair(pairData: NewPairData): void {
    this.newPairCallbacks.forEach(callback => {
      try {
        callback(pairData)
      } catch (error) {
        console.error('Error in new pair callback:', error)
      }
    })
  }

  private notifyLiquidityChange(event: LiquidityEvent): void {
    this.liquidityCallbacks.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in liquidity change callback:', error)
      }
    })
  }

  // Get recently discovered pairs
  getRecentPairs(limit: number = 50): NewPairData[] {
    // Return recently discovered pairs from cache/database
    return []
  }

  // Stop monitoring
  stopMonitoring(): void {
    this.isMonitoring = false
    this.wsConnections.forEach(ws => ws.close())
    this.wsConnections.clear()
    console.log('🛑 DEX monitoring stopped')
  }

  // Get monitoring status
  getStatus(): { isMonitoring: boolean; connections: number } {
    return {
      isMonitoring: this.isMonitoring,
      connections: this.wsConnections.size
    }
  }
}

export const dexMonitor = new DEXMonitor()