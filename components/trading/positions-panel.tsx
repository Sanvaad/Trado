'use client'

import { useState, useEffect } from 'react'
import { useTradingStore } from '@/stores/trading-store'
import { useWalletStore } from '@/stores/wallet-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { X, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { Position } from '@/types/trading'

interface PositionCardProps {
  position: Position
  onClose: (positionId: string) => void
  isClosing: boolean
}

function PositionCard({ position, onClose, isClosing }: PositionCardProps) {
  const pnlPercentage = (position.pnl / position.margin) * 100
  const isProfitable = position.pnl >= 0
  
  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-white">
              {position.symbol}
            </CardTitle>
            <Badge
              variant={position.side === 'long' ? 'default' : 'destructive'}
              className={position.side === 'long' ? 'bg-green-600' : 'bg-red-600'}
            >
              {position.side.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {position.leverage}x
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClose(position.id)}
            disabled={isClosing}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Position Size and Entry Price */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Size</div>
            <div className="text-white font-mono">
              {Math.abs(position.size).toFixed(6)} BTC
            </div>
          </div>
          <div>
            <div className="text-gray-400">Entry Price</div>
            <div className="text-white font-mono">
              ${position.entryPrice.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Mark Price and Margin */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Mark Price</div>
            <div className="text-white font-mono">
              ${position.markPrice.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Margin</div>
            <div className="text-white font-mono">
              ${position.margin.toFixed(2)}
            </div>
          </div>
        </div>

        {/* P&L */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">Unrealized P&L</div>
            <div className={`flex items-center gap-1 font-mono ${
              isProfitable ? 'text-green-400' : 'text-red-400'
            }`}>
              {isProfitable ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                {isProfitable ? '+' : ''}${position.pnl.toFixed(2)}
              </span>
              <span className="text-xs ml-1">
                ({isProfitable ? '+' : ''}{pnlPercentage.toFixed(2)}%)
              </span>
            </div>
          </div>
          
          {/* P&L Progress Bar */}
          <div className="mt-2">
            <Progress
              value={Math.min(Math.abs(pnlPercentage), 100)}
              className={`h-2 ${isProfitable ? 'bg-green-900' : 'bg-red-900'}`}
            />
          </div>
        </div>

        {/* Liquidation Risk */}
        {position.leverage > 5 && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>High leverage position - Monitor closely</span>
          </div>
        )}

        {/* Close Position Button */}
        <Button
          onClick={() => onClose(position.id)}
          disabled={isClosing}
          className={`w-full ${
            isProfitable 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isClosing ? 'Closing...' : 'Close Position'}
        </Button>
      </CardContent>
    </Card>
  )
}

export function PositionsPanel() {
  const { positions, closePosition, refreshPositions } = useTradingStore()
  const { isConnected } = useWalletStore()
  const [closingPositions, setClosingPositions] = useState<Set<string>>(new Set())

  // Auto-refresh positions every 10 seconds
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      refreshPositions()
    }, 10000)

    return () => clearInterval(interval)
  }, [isConnected, refreshPositions])

  const handleClosePosition = async (positionId: string) => {
    setClosingPositions(prev => new Set(prev).add(positionId))

    try {
      const result = await closePosition(positionId)
      if (!result.success) {
        console.error('Failed to close position:', result.error)
      }
    } catch (error) {
      console.error('Error closing position:', error)
    } finally {
      setClosingPositions(prev => {
        const newSet = new Set(prev)
        newSet.delete(positionId)
        return newSet
      })
    }
  }

  // Calculate total P&L
  const totalUnrealizedPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0)
  const totalMargin = positions.reduce((sum, pos) => sum + pos.margin, 0)

  if (!isConnected) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 mb-4">Connect your wallet to view positions</div>
        <Button variant="outline">Connect Wallet</Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400">Total Positions</div>
            <div className="text-2xl font-bold text-white">{positions.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400">Total Margin</div>
            <div className="text-2xl font-bold text-white font-mono">
              ${totalMargin.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400">Unrealized P&L</div>
            <div className={`text-2xl font-bold font-mono ${
              totalUnrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions List */}
      {positions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">No open positions</div>
          <div className="text-sm text-gray-500">
            Place your first trade to see positions here
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {positions.map((position) => (
            <PositionCard
              key={position.id}
              position={position}
              onClose={handleClosePosition}
              isClosing={closingPositions.has(position.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}