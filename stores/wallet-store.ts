import { create } from 'zustand'
import { walletService, WalletConnection } from '../lib/wallet'

interface WalletState {
  // Connection state
  isConnected: boolean
  address: string | null
  chainId: number | null
  
  // Balance data
  balance: string
  usdBalance: number
  
  // UI state
  isConnecting: boolean
  isVip: boolean
  error: string | null
  
  // Actions
  connectWallet: (connectorType?: 'injected' | 'metaMask' | 'walletConnect' | 'coinbase') => Promise<void>
  disconnectWallet: () => Promise<void>
  refreshBalance: () => Promise<void>
  setConnectionState: (connected: boolean, address?: string, chainId?: number) => void
  setBalance: (balance: string, usdBalance: number) => void
  setConnecting: (connecting: boolean) => void
  setVipStatus: (isVip: boolean) => void
  setError: (error: string | null) => void
  disconnect: () => void
}

export const useWalletStore = create<WalletState>()((set, get) => ({
  // Initial state
  isConnected: false,
  address: null,
  chainId: null,
  balance: '0',
  usdBalance: 0,
  isConnecting: false,
  isVip: false,
  error: null,
  
  // Actions
  connectWallet: async (connectorType = 'injected') => {
    try {
      set({ isConnecting: true, error: null })
      
      const connection = await walletService.connectWallet(connectorType)
      
      set({
        isConnected: connection.isConnected,
        address: connection.address,
        chainId: connection.chainId,
        balance: connection.balance || '0',
        isConnecting: false,
        error: null
      })

      // Set up connection listener
      walletService.onConnectionChange((connection) => {
        if (connection) {
          set({
            isConnected: connection.isConnected,
            address: connection.address,
            chainId: connection.chainId,
            balance: connection.balance || get().balance
          })
        } else {
          get().disconnect()
        }
      })

      // Refresh balance after connection
      await get().refreshBalance()
      
    } catch (error) {
      set({
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet'
      })
      throw error
    }
  },

  disconnectWallet: async () => {
    try {
      await walletService.disconnectWallet()
      get().disconnect()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to disconnect wallet'
      })
      throw error
    }
  },

  refreshBalance: async () => {
    try {
      const { address } = get()
      if (!address) return

      const balance = await walletService.getBalance(address)
      if (balance) {
        set({
          balance: balance.formatted,
          // Calculate USD balance based on current ETH price (placeholder)
          usdBalance: parseFloat(balance.formatted) * 2500 // Mock ETH price
        })
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    }
  },
  
  setConnectionState: (connected, address, chainId) =>
    set({ isConnected: connected, address, chainId }),
  
  setBalance: (balance, usdBalance) =>
    set({ balance, usdBalance }),
  
  setConnecting: (connecting) =>
    set({ isConnecting: connecting }),
  
  setVipStatus: (isVip) =>
    set({ isVip }),

  setError: (error) =>
    set({ error }),
  
  disconnect: () =>
    set({
      isConnected: false,
      address: null,
      chainId: null,
      balance: '0',
      usdBalance: 0,
      isConnecting: false,
      error: null
    }),
}))