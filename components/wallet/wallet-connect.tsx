'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useWalletStore } from '@/stores/wallet-store'
import { Wallet, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const WALLET_OPTIONS = [
  {
    id: 'metaMask' as const,
    name: 'MetaMask',
    icon: '🦊',
    description: 'Connect using MetaMask wallet'
  },
  {
    id: 'walletConnect' as const,
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Connect using WalletConnect protocol'
  },
  {
    id: 'coinbase' as const,
    name: 'Coinbase Wallet',
    icon: '🔵',
    description: 'Connect using Coinbase Wallet'
  },
  {
    id: 'injected' as const,
    name: 'Browser Wallet',
    icon: '🌐',
    description: 'Connect using any injected wallet'
  }
]

export function WalletConnect() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  
  const {
    isConnected,
    isConnecting,
    address,
    balance,
    usdBalance,
    error,
    connectWallet,
    disconnectWallet
  } = useWalletStore()

  const handleConnect = async (connectorType: 'injected' | 'metaMask' | 'walletConnect' | 'coinbase') => {
    try {
      setSelectedWallet(connectorType)
      await connectWallet(connectorType)
      setIsOpen(false)
      setSelectedWallet(null)
    } catch (error) {
      console.error('Connection failed:', error)
      setSelectedWallet(null)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectWallet()
    } catch (error) {
      console.error('Disconnection failed:', error)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium text-white">
            {formatAddress(address || '')}
          </div>
          <div className="text-xs text-gray-400">
            {parseFloat(balance).toFixed(4)} ETH (${usdBalance.toFixed(2)})
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="border-gray-700 hover:border-gray-600"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-gray-700 hover:border-gray-600 text-white"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Connect Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert className="border-red-500 bg-red-950">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-3">
            {WALLET_OPTIONS.map((wallet) => (
              <Button
                key={wallet.id}
                variant="outline"
                className="h-auto p-4 border-gray-700 hover:border-gray-600 justify-start"
                onClick={() => handleConnect(wallet.id)}
                disabled={isConnecting || selectedWallet === wallet.id}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="text-2xl">{wallet.icon}</div>
                  <div className="text-left">
                    <div className="font-medium text-white">{wallet.name}</div>
                    <div className="text-sm text-gray-400">{wallet.description}</div>
                  </div>
                  {selectedWallet === wallet.id && (
                    <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                  )}
                </div>
              </Button>
            ))}
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            By connecting a wallet, you agree to the Terms of Service and Privacy Policy.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}