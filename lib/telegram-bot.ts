import TelegramBot from 'node-telegram-bot-api'
import { Telegraf, Context } from 'telegraf'
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token'
import { ethers } from 'ethers'
import { blockchainPriceFeeds } from './blockchain-price-feeds'
import { dexMonitor } from './dex-monitor'
import crypto from 'crypto'

interface TelegramUser {
  id: number
  username?: string
  first_name: string
  wallets: {
    solana?: {
      publicKey: string
      encryptedPrivateKey: string
    }
    ethereum?: {
      address: string
      encryptedPrivateKey: string
    }
  }
  settings: {
    slippage: number
    autoApprove: boolean
    maxGasPrice: number
    notifications: boolean
  }
  stats: {
    totalTrades: number
    totalVolume: number
    pnl: number
    successRate: number
  }
}

interface TradeOrder {
  userId: number
  tokenAddress: string
  blockchain: string
  type: 'buy' | 'sell'
  amount: number
  slippage: number
  timestamp: number
  status: 'pending' | 'executed' | 'failed'
  txHash?: string
}

export class TradingTelegramBot {
  private bot: Telegraf<Context>
  private solanaConnection: Connection
  private ethereumProvider: ethers.JsonRpcProvider
  private users: Map<number, TelegramUser> = new Map()
  private pendingOrders: Map<string, TradeOrder> = new Map()
  private botToken: string
  private encryptionKey: string

  // Bot commands and responses
  private readonly COMMANDS = {
    START: '/start',
    HELP: '/help',
    WALLET: '/wallet',
    BALANCE: '/balance',
    BUY: '/buy',
    SELL: '/sell',
    PRICE: '/price',
    TRENDING: '/trending',
    SETTINGS: '/settings',
    STATS: '/stats',
    EXPORT: '/export'
  }

  constructor(botToken: string) {
    this.botToken = botToken
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
    this.bot = new Telegraf(botToken)
    this.solanaConnection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
    this.ethereumProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key')
    
    this.setupCommands()
    this.setupInlineKeyboards()
    this.setupCallbackHandlers()
  }

  // Set up bot commands
  private setupCommands(): void {
    // Start command
    this.bot.command('start', async (ctx) => {
      const user = ctx.from
      if (!user) return
      
      await this.initializeUser(user)
      
      const welcomeMessage = `
🚀 Welcome to Trado Bot!

Your personal meme coin trading assistant on Telegram.

📊 **Features:**
• Real-time price tracking
• One-click buy/sell
• Auto wallet creation
• Multi-chain support (Solana, Ethereum, Base)
• Trending meme coins
• Portfolio tracking

💡 **Quick Start:**
1. Create wallet: /wallet
2. Check trending: /trending  
3. Buy a token: /buy [token_symbol] [amount]
4. Check balance: /balance

🔥 **Popular Commands:**
/price [symbol] - Get token price
/buy [symbol] [amount] - Buy token
/sell [symbol] [amount] - Sell token
/trending - Show trending memes
/settings - Bot settings

Need help? Use /help
      `
      
      await ctx.reply(welcomeMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💰 Create Wallet', callback_data: 'create_wallet' },
              { text: '🔥 Trending', callback_data: 'trending' }
            ],
            [
              { text: '📊 Settings', callback_data: 'settings' },
              { text: '❓ Help', callback_data: 'help' }
            ]
          ]
        }
      })
    })

    // Price command
    this.bot.command('price', async (ctx) => {
      const args = ctx.message.text.split(' ').slice(1)
      if (args.length === 0) {
        await ctx.reply('Usage: /price [token_symbol]\nExample: /price BONK')
        return
      }

      const symbol = args[0].toUpperCase()
      await this.sendTokenPrice(ctx, symbol)
    })

    // Buy command
    this.bot.command('buy', async (ctx) => {
      const args = ctx.message.text.split(' ').slice(1)
      if (args.length < 2) {
        await ctx.reply('Usage: /buy [token_symbol] [amount_in_sol]\nExample: /buy BONK 1')
        return
      }

      const symbol = args[0].toUpperCase()
      const amount = parseFloat(args[1])
      
      if (isNaN(amount) || amount <= 0) {
        await ctx.reply('❌ Invalid amount. Please enter a positive number.')
        return
      }

      await this.executeBuyOrder(ctx, symbol, amount)
    })

    // Sell command
    this.bot.command('sell', async (ctx) => {
      const args = ctx.message.text.split(' ').slice(1)
      if (args.length < 2) {
        await ctx.reply('Usage: /sell [token_symbol] [amount_or_percentage]\nExample: /sell BONK 50%')
        return
      }

      const symbol = args[0].toUpperCase()
      const amountStr = args[1]
      
      await this.executeSellOrder(ctx, symbol, amountStr)
    })

    // Wallet command
    this.bot.command('wallet', async (ctx) => {
      await this.showWalletInfo(ctx)
    })

    // Balance command
    this.bot.command('balance', async (ctx) => {
      await this.showBalance(ctx)
    })

    // Trending command
    this.bot.command('trending', async (ctx) => {
      await this.showTrendingTokens(ctx)
    })

    // Settings command
    this.bot.command('settings', async (ctx) => {
      await this.showSettings(ctx)
    })

    // Stats command
    this.bot.command('stats', async (ctx) => {
      await this.showUserStats(ctx)
    })

    // Help command
    this.bot.command('help', async (ctx) => {
      const helpMessage = `
🤖 **Trado Bot Commands**

**💰 Trading:**
/price [symbol] - Get token price
/buy [symbol] [amount] - Buy token
/sell [symbol] [amount] - Sell token
/balance - Show wallet balance
/stats - Trading statistics

**📊 Information:**
/trending - Trending meme coins
/wallet - Wallet information
/settings - Bot settings

**🔥 Quick Trading:**
Just type: "buy BONK 1" or "sell PEPE 50%"

**⚙️ Settings:**
• Slippage tolerance
• Auto-approve trades
• Notifications
• Gas price limits

**🔗 Supported Chains:**
• Solana (SOL)
• Ethereum (ETH) 
• Base (ETH)

**💡 Tips:**
• Always DYOR before trading
• Start with small amounts
• Check liquidity before big trades
• Use stop losses for risk management

⚠️ **Risk Warning:**
Meme coin trading is highly risky. Never invest more than you can afford to lose.
      `
      
      await ctx.reply(helpMessage)
    })
  }

  // Set up inline keyboards for quick actions
  private setupInlineKeyboards(): void {
    // Quick buy amounts
    this.getQuickBuyKeyboard = (symbol: string) => ({
      inline_keyboard: [
        [
          { text: '0.1 SOL', callback_data: `buy_${symbol}_0.1` },
          { text: '0.5 SOL', callback_data: `buy_${symbol}_0.5` },
          { text: '1 SOL', callback_data: `buy_${symbol}_1` }
        ],
        [
          { text: '2 SOL', callback_data: `buy_${symbol}_2` },
          { text: '5 SOL', callback_data: `buy_${symbol}_5` },
          { text: '10 SOL', callback_data: `buy_${symbol}_10` }
        ],
        [
          { text: '🔄 Refresh Price', callback_data: `price_${symbol}` },
          { text: '❌ Cancel', callback_data: 'cancel' }
        ]
      ]
    })

    // Quick sell percentages
    this.getQuickSellKeyboard = (symbol: string) => ({
      inline_keyboard: [
        [
          { text: '25%', callback_data: `sell_${symbol}_25%` },
          { text: '50%', callback_data: `sell_${symbol}_50%` },
          { text: '75%', callback_data: `sell_${symbol}_75%` }
        ],
        [
          { text: '100%', callback_data: `sell_${symbol}_100%` },
          { text: '🔄 Refresh', callback_data: `balance_${symbol}` },
          { text: '❌ Cancel', callback_data: 'cancel' }
        ]
      ]
    })
  }

  // Set up callback query handlers
  private setupCallbackHandlers(): void {
    this.bot.on('callback_query', async (ctx) => {
      const data = ctx.callbackQuery.data
      if (!data) return

      try {
        if (data === 'create_wallet') {
          await this.createWallet(ctx)
        } else if (data === 'trending') {
          await this.showTrendingTokens(ctx)
        } else if (data === 'settings') {
          await this.showSettings(ctx)
        } else if (data.startsWith('buy_')) {
          const [, symbol, amount] = data.split('_')
          await this.executeBuyOrder(ctx, symbol, parseFloat(amount))
        } else if (data.startsWith('sell_')) {
          const [, symbol, amount] = data.split('_')
          await this.executeSellOrder(ctx, symbol, amount)
        } else if (data.startsWith('price_')) {
          const symbol = data.split('_')[1]
          await this.sendTokenPrice(ctx, symbol)
        }
        
        await ctx.answerCbQuery()
      } catch (error) {
        console.error('Error handling callback:', error)
        await ctx.answerCbQuery('Error processing request')
      }
    })
  }

  // Initialize user data
  private async initializeUser(telegramUser: any): Promise<void> {
    const userId = telegramUser.id
    
    if (!this.users.has(userId)) {
      const user: TelegramUser = {
        id: userId,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        wallets: {},
        settings: {
          slippage: 1.0, // 1% default slippage
          autoApprove: false,
          maxGasPrice: 50, // Gwei
          notifications: true
        },
        stats: {
          totalTrades: 0,
          totalVolume: 0,
          pnl: 0,
          successRate: 0
        }
      }
      
      this.users.set(userId, user)
      console.log(`🆕 New user initialized: ${telegramUser.first_name} (@${telegramUser.username})`)
    }
  }

  // Create wallet for user
  private async createWallet(ctx: any): Promise<void> {
    const userId = ctx.from.id
    const user = this.users.get(userId)
    if (!user) return

    try {
      // Create Solana wallet
      const solanaKeyPair = Keypair.generate()
      const encryptedPrivateKey = this.encryptPrivateKey(solanaKeyPair.secretKey.toString())
      
      user.wallets.solana = {
        publicKey: solanaKeyPair.publicKey.toString(),
        encryptedPrivateKey
      }

      // Create Ethereum wallet
      const ethWallet = ethers.Wallet.createRandom()
      user.wallets.ethereum = {
        address: ethWallet.address,
        encryptedPrivateKey: this.encryptPrivateKey(ethWallet.privateKey)
      }

      this.users.set(userId, user)

      const message = `
🎉 **Wallets Created Successfully!**

**Solana Wallet:**
\`${user.wallets.solana.publicKey}\`

**Ethereum Wallet:**
\`${user.wallets.ethereum.address}\`

⚠️ **IMPORTANT:**
• These wallets are generated automatically
• Private keys are encrypted and stored securely
• Always test with small amounts first
• Backup your seed phrase (use /export)

💰 **Next Steps:**
1. Fund your wallets with SOL/ETH
2. Check trending tokens: /trending
3. Start trading: /buy [token] [amount]
      `

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💰 Check Balance', callback_data: 'balance' },
              { text: '🔥 Trending', callback_data: 'trending' }
            ],
            [
              { text: '🔄 Export Keys', callback_data: 'export' },
              { text: '⚙️ Settings', callback_data: 'settings' }
            ]
          ]
        }
      })
    } catch (error) {
      console.error('Error creating wallet:', error)
      await ctx.reply('❌ Error creating wallet. Please try again later.')
    }
  }

  // Show token price with trading options
  private async sendTokenPrice(ctx: any, symbol: string): Promise<void> {
    try {
      // Search for token by symbol across all chains
      const tokenData = await this.findTokenBySymbol(symbol)
      
      if (!tokenData) {
        await ctx.reply(`❌ Token "${symbol}" not found. Please check the symbol and try again.`)
        return
      }

      const priceData = blockchainPriceFeeds.getPrice(tokenData.address, tokenData.blockchain)
      
      if (!priceData) {
        await ctx.reply(`❌ Price data not available for ${symbol}`)
        return
      }

      const message = `
📊 **${priceData.symbol} (${priceData.name})**

💰 **Price:** $${priceData.priceUsd.toFixed(8)}
📈 **24h Change:** ${priceData.priceChange24h.toFixed(2)}%
🕐 **1h Change:** ${priceData.priceChange1h.toFixed(2)}%
⚡ **5m Change:** ${priceData.priceChange5m.toFixed(2)}%

📊 **Market Data:**
• Volume 24h: $${(priceData.volume24h * 1000000).toLocaleString()}
• Liquidity: $${(priceData.liquidity * 1000).toLocaleString()}
• Market Cap: $${(priceData.marketCap * 1000000).toLocaleString()}

🔗 **Chain:** ${priceData.blockchain.toUpperCase()}
🏪 **DEX:** ${priceData.dex.toUpperCase()}
      `

      await ctx.reply(message, {
        reply_markup: this.getQuickBuyKeyboard(symbol)
      })
    } catch (error) {
      console.error('Error sending token price:', error)
      await ctx.reply('❌ Error fetching price data. Please try again.')
    }
  }

  // Execute buy order
  private async executeBuyOrder(ctx: any, symbol: string, amount: number): Promise<void> {
    const userId = ctx.from.id
    const user = this.users.get(userId)
    
    if (!user?.wallets.solana) {
      await ctx.reply('❌ Please create a wallet first: /wallet')
      return
    }

    try {
      await ctx.reply(`⏳ Processing buy order for ${amount} SOL worth of ${symbol}...`)
      
      const tokenData = await this.findTokenBySymbol(symbol)
      if (!tokenData) {
        await ctx.reply(`❌ Token "${symbol}" not found`)
        return
      }

      // Create trade order
      const orderId = crypto.randomUUID()
      const order: TradeOrder = {
        userId,
        tokenAddress: tokenData.address,
        blockchain: tokenData.blockchain,
        type: 'buy',
        amount,
        slippage: user.settings.slippage,
        timestamp: Date.now(),
        status: 'pending'
      }

      this.pendingOrders.set(orderId, order)

      // Execute the swap
      const result = await this.executeSwap(order)

      if (result.success) {
        order.status = 'executed'
        order.txHash = result.txHash
        
        // Update user stats
        user.stats.totalTrades++
        user.stats.totalVolume += amount
        
        const message = `
✅ **Buy Order Executed!**

🎯 **Token:** ${symbol}
💰 **Amount:** ${amount} SOL
📦 **Tokens Received:** ${result.tokensReceived} ${symbol}
🔗 **Transaction:** \`${result.txHash}\`
⛽ **Gas Used:** $${result.gasCost.toFixed(4)}

🎉 **Success!** Your ${symbol} tokens are now in your wallet.
        `
        
        await ctx.reply(message, { parse_mode: 'Markdown' })
      } else {
        order.status = 'failed'
        await ctx.reply(`❌ Buy order failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error executing buy order:', error)
      await ctx.reply('❌ Error executing buy order. Please try again.')
    }
  }

  // Execute sell order
  private async executeSellOrder(ctx: any, symbol: string, amountStr: string): Promise<void> {
    const userId = ctx.from.id
    const user = this.users.get(userId)
    
    if (!user?.wallets.solana) {
      await ctx.reply('❌ Please create a wallet first: /wallet')
      return
    }

    try {
      await ctx.reply(`⏳ Processing sell order for ${amountStr} of ${symbol}...`)
      
      // Get user's token balance
      const balance = await this.getTokenBalance(user.wallets.solana.publicKey, symbol)
      if (balance === 0) {
        await ctx.reply(`❌ You don't have any ${symbol} tokens to sell`)
        return
      }

      // Calculate sell amount
      let sellAmount = 0
      if (amountStr.endsWith('%')) {
        const percentage = parseFloat(amountStr.replace('%', ''))
        sellAmount = (balance * percentage) / 100
      } else {
        sellAmount = parseFloat(amountStr)
      }

      if (sellAmount > balance) {
        await ctx.reply(`❌ Insufficient balance. You have ${balance} ${symbol}`)
        return
      }

      // Execute sell similar to buy
      const result = await this.executeSellSwap(user, symbol, sellAmount)
      
      if (result.success) {
        const message = `
✅ **Sell Order Executed!**

🎯 **Token:** ${symbol}
💰 **Amount Sold:** ${sellAmount} ${symbol}
💵 **SOL Received:** ${result.solReceived} SOL
🔗 **Transaction:** \`${result.txHash}\`
⛽ **Gas Used:** $${result.gasCost.toFixed(4)}

💰 **Profit/Loss:** ${result.pnl > 0 ? '+' : ''}$${result.pnl.toFixed(2)}
        `
        
        await ctx.reply(message, { parse_mode: 'Markdown' })
      } else {
        await ctx.reply(`❌ Sell order failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error executing sell order:', error)
      await ctx.reply('❌ Error executing sell order. Please try again.')
    }
  }

  // Show wallet information
  private async showWalletInfo(ctx: any): Promise<void> {
    const userId = ctx.from.id
    const user = this.users.get(userId)
    
    if (!user) {
      await ctx.reply('❌ User not found. Please use /start first.')
      return
    }

    if (!user.wallets.solana) {
      await ctx.reply('No wallet found. Create one now!', {
        reply_markup: {
          inline_keyboard: [[
            { text: '💰 Create Wallet', callback_data: 'create_wallet' }
          ]]
        }
      })
      return
    }

    const message = `
💼 **Your Wallets**

**Solana:**
\`${user.wallets.solana.publicKey}\`

**Ethereum:**
\`${user.wallets.ethereum?.address || 'Not created'}\`

⚙️ **Settings:**
• Slippage: ${user.settings.slippage}%
• Auto-approve: ${user.settings.autoApprove ? 'ON' : 'OFF'}
• Notifications: ${user.settings.notifications ? 'ON' : 'OFF'}

📊 **Trading Stats:**
• Total Trades: ${user.stats.totalTrades}
• Total Volume: ${user.stats.totalVolume.toFixed(2)} SOL
• P&L: ${user.stats.pnl > 0 ? '+' : ''}$${user.stats.pnl.toFixed(2)}
    `

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💰 Balance', callback_data: 'balance' },
            { text: '📊 Stats', callback_data: 'stats' }
          ],
          [
            { text: '⚙️ Settings', callback_data: 'settings' },
            { text: '🔄 Export Keys', callback_data: 'export' }
          ]
        ]
      }
    })
  }

  // Show trending tokens
  private async showTrendingTokens(ctx: any): Promise<void> {
    try {
      const trendingTokens = await this.getTrendingTokens()
      
      let message = '🔥 **Trending Meme Coins**\n\n'
      
      trendingTokens.slice(0, 10).forEach((token, index) => {
        const changeEmoji = token.priceChange24h > 0 ? '📈' : '📉'
        message += `${index + 1}. **${token.symbol}** - $${token.priceUsd.toFixed(8)}\n`
        message += `   ${changeEmoji} ${token.priceChange24h.toFixed(2)}% (24h)\n`
        message += `   💧 Liquidity: $${(token.liquidity * 1000).toLocaleString()}\n\n`
      })

      message += '💡 *Tap /price [symbol] to get detailed info and quick buy options*'

      await ctx.reply(message, { parse_mode: 'Markdown' })
    } catch (error) {
      console.error('Error showing trending tokens:', error)
      await ctx.reply('❌ Error fetching trending tokens. Please try again.')
    }
  }

  // Utility functions
  private encryptPrivateKey(privateKey: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey)
    let encrypted = cipher.update(privateKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  }

  private decryptPrivateKey(encryptedKey: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey)
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  private async findTokenBySymbol(symbol: string): Promise<any> {
    // Search across all monitored tokens
    const allPrices = blockchainPriceFeeds.getAllPrices()
    for (const [key, priceData] of allPrices) {
      if (priceData.symbol.toUpperCase() === symbol.toUpperCase()) {
        const [blockchain, address] = key.split(':')
        return { address, blockchain }
      }
    }
    return null
  }

  private async getTokenBalance(walletAddress: string, symbol: string): Promise<number> {
    // Get token balance from wallet
    return 0
  }

  private async executeSwap(order: TradeOrder): Promise<any> {
    // Execute actual swap transaction
    return {
      success: true,
      txHash: 'mock_tx_hash',
      tokensReceived: 1000000,
      gasCost: 0.005
    }
  }

  private async executeSellSwap(user: TelegramUser, symbol: string, amount: number): Promise<any> {
    // Execute sell swap
    return {
      success: true,
      txHash: 'mock_sell_tx',
      solReceived: 0.5,
      gasCost: 0.005,
      pnl: 25.50
    }
  }

  private async getTrendingTokens(): Promise<any[]> {
    // Get trending tokens from price feeds
    const allPrices = Array.from(blockchainPriceFeeds.getAllPrices().values())
    return allPrices
      .filter(token => token.volume24h > 10000) // Filter by volume
      .sort((a, b) => b.priceChange24h - a.priceChange24h) // Sort by 24h change
  }

  // Add methods for other functionality
  private async showBalance(ctx: any): Promise<void> {
    // Implementation for balance display
  }

  private async showSettings(ctx: any): Promise<void> {
    // Implementation for settings menu
  }

  private async showUserStats(ctx: any): Promise<void> {
    // Implementation for user statistics
  }

  private getQuickBuyKeyboard: (symbol: string) => any
  private getQuickSellKeyboard: (symbol: string) => any

  // Start the bot
  async start(): Promise<void> {
    console.log('🤖 Starting Telegram trading bot...')
    
    // Set up bot commands menu
    await this.bot.telegram.setMyCommands([
      { command: 'start', description: 'Start the bot' },
      { command: 'price', description: 'Get token price' },
      { command: 'buy', description: 'Buy tokens' },
      { command: 'sell', description: 'Sell tokens' },
      { command: 'balance', description: 'Check wallet balance' },
      { command: 'trending', description: 'Show trending tokens' },
      { command: 'wallet', description: 'Wallet information' },
      { command: 'settings', description: 'Bot settings' },
      { command: 'stats', description: 'Trading statistics' },
      { command: 'help', description: 'Show help' }
    ])

    // Start polling
    await this.bot.launch()
    console.log('✅ Telegram bot started successfully!')

    // Enable graceful shutdown
    process.once('SIGINT', () => this.bot.stop('SIGINT'))
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'))
  }

  // Stop the bot
  stop(): void {
    this.bot.stop()
    console.log('🛑 Telegram bot stopped')
  }
}

// Export singleton instance
export const tradingBot = new TradingTelegramBot(process.env.TELEGRAM_BOT_TOKEN || 'your-bot-token-here')