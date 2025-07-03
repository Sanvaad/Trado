import { createConfig, http, connect, getAccount, getBalance, watchAccount, disconnect } from '@wagmi/core'
import { mainnet, arbitrum, polygon } from '@wagmi/core/chains'
import { injected, metaMask, walletConnect, coinbaseWallet } from '@wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

let config: ReturnType<typeof createConfig> | null = null

function getConfig() {
  if (!config && typeof window !== 'undefined') {
    config = createConfig({
      chains: [mainnet, arbitrum, polygon],
      connectors: [
        injected(),
        metaMask(),
        walletConnect({ projectId }),
        coinbaseWallet({ appName: 'Trado Trading Platform' }),
      ],
      transports: {
        [mainnet.id]: http(),
        [arbitrum.id]: http(),
        [polygon.id]: http(),
      },
    })
  }
  return config
}

export { getConfig as config }

export interface WalletConnection {
  address: string
  chainId: number
  isConnected: boolean
  balance?: string
  ensName?: string
}

export class WalletService {
  private static instance: WalletService
  private connectionListeners: Set<(connection: WalletConnection | null) => void> = new Set()

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService()
    }
    return WalletService.instance
  }

  private constructor() {
    this.initializeWatcher()
  }

  private initializeWatcher() {
    if (typeof window === 'undefined') return
    const configInstance = getConfig()
    if (!configInstance) return
    
    watchAccount(configInstance, {
      onChange: (account) => {
        this.notifyListeners(account.isConnected ? {
          address: account.address || '',
          chainId: account.chainId || 1,
          isConnected: account.isConnected,
        } : null)
      }
    })
  }

  async connectWallet(connectorType: 'injected' | 'metaMask' | 'walletConnect' | 'coinbase' = 'injected'): Promise<WalletConnection> {
    try {
      const configInstance = getConfig()
      if (!configInstance) throw new Error('WAGMI config not initialized')
      
      const connectorMap = {
        injected: injected(),
        metaMask: metaMask(),
        walletConnect: walletConnect({ projectId }),
        coinbase: coinbaseWallet({ appName: 'Trado Trading Platform' })
      }

      const result = await connect(configInstance, {
        connector: connectorMap[connectorType]
      })

      const balance = await this.getBalance(result.accounts[0])

      const connection: WalletConnection = {
        address: result.accounts[0],
        chainId: result.chainId,
        isConnected: true,
        balance: balance?.formatted
      }

      this.notifyListeners(connection)
      return connection
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      const configInstance = getConfig()
      if (!configInstance) return
      
      await disconnect(configInstance)
      this.notifyListeners(null)
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      throw new Error('Failed to disconnect wallet')
    }
  }

  async getBalance(address?: string): Promise<{ value: bigint; decimals: number; symbol: string; formatted: string } | null> {
    try {
      const configInstance = getConfig()
      if (!configInstance) return null
      
      const account = getAccount(configInstance)
      const targetAddress = address || account.address
      
      if (!targetAddress) return null

      const balance = await getBalance(configInstance, {
        address: targetAddress as `0x${string}`
      })

      return balance
    } catch (error) {
      console.error('Failed to get balance:', error)
      return null
    }
  }

  getCurrentConnection(): WalletConnection | null {
    const configInstance = getConfig()
    if (!configInstance) return null
    
    const account = getAccount(configInstance)
    
    if (!account.isConnected || !account.address) {
      return null
    }

    return {
      address: account.address,
      chainId: account.chainId || 1,
      isConnected: account.isConnected
    }
  }

  onConnectionChange(callback: (connection: WalletConnection | null) => void): () => void {
    this.connectionListeners.add(callback)
    
    const currentConnection = this.getCurrentConnection()
    callback(currentConnection)

    return () => {
      this.connectionListeners.delete(callback)
    }
  }

  private notifyListeners(connection: WalletConnection | null) {
    this.connectionListeners.forEach(callback => callback(connection))
  }

  async switchChain(chainId: number): Promise<void> {
    try {
      // Implementation would depend on the specific chain switching logic
      // This is a placeholder for chain switching functionality
      console.log('Switching to chain:', chainId)
    } catch (error) {
      console.error('Failed to switch chain:', error)
      throw new Error('Failed to switch chain')
    }
  }

  async signMessage(message: string): Promise<string> {
    try {
      // Implementation would depend on the signing logic
      // This is a placeholder for message signing functionality
      console.log('Signing message:', message)
      return 'signed-message-placeholder'
    } catch (error) {
      console.error('Failed to sign message:', error)
      throw new Error('Failed to sign message')
    }
  }
}

export const walletService = WalletService.getInstance()