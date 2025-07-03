"use client"

import { useState, useEffect } from "react"
import { useWalletStore } from "@/stores/wallet-store"
import { useTradingStore } from "@/stores/trading-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Download, Upload, TrendingUp, TrendingDown, Loader2, AlertCircle } from "lucide-react"
import { marketDataService } from "@/lib/market-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WalletConnect } from "@/components/wallet/wallet-connect"

interface MarketData {
  price: number
  change24h: number
  changePercent24h: number
  symbol: string
}

interface AccountBalance {
  available: number
  margin: number
  total: number
}

export function TradingPanel() {
  const { isConnected, usdBalance } = useWalletStore()
  const { 
    orderType, 
    orderQuantity, 
    orderPrice, 
    selectedLeverage, 
    isPlacingOrder, 
    orderError,
    setOrderType, 
    setOrderQuantity, 
    setOrderPrice, 
    setSelectedLeverage, 
    placeOrder,
    setOrderError
  } = useTradingStore()
  
  const [tradeType, setTradeType] = useState<"Isolated" | "Hedge">("Isolated")
  const [positionType, setPositionType] = useState<"Open" | "Close">("Open")
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [balance, setBalance] = useState<AccountBalance>({
    available: usdBalance || 1250.45,
    margin: 0,
    total: usdBalance || 1250.45
  })
  const [estimatedFees] = useState(0.05)
  const [showTPSL, setShowTPSL] = useState(false)
  const [takeProfitPrice, setTakeProfitPrice] = useState("")
  const [stopLossPrice, setStopLossPrice] = useState("")

  const handlePlaceOrder = async (side: 'buy' | 'sell') => {
    if (!isConnected) return
    if (!orderQuantity || parseFloat(orderQuantity) <= 0) return
    if (orderType === 'limit' && (!orderPrice || parseFloat(orderPrice) <= 0)) return

    try {
      setOrderError(null)
      
      const orderData: { 
        side: 'buy' | 'sell', 
        stopLoss?: number, 
        takeProfit?: number 
      } = { side }
      
      if (showTPSL) {
        if (takeProfitPrice) {
          orderData.takeProfit = parseFloat(takeProfitPrice)
        }
        if (stopLossPrice) {
          orderData.stopLoss = parseFloat(stopLossPrice)
        }
      }
      
      await placeOrder(orderData)
      
      // Clear TP/SL inputs after successful order
      if (showTPSL) {
        setTakeProfitPrice("")
        setStopLossPrice("")
        setShowTPSL(false)
      }
    } catch (error) {
      console.error('Order placement error:', error)
    }
  }

  // Load market data and update every 5 seconds
  useEffect(() => {
    const loadMarketData = async () => {
      try {
        const ticker = await marketDataService.getMarketTicker('BTCUSDT')
        setMarketData({
          price: ticker.price,
          change24h: ticker.change24h,
          changePercent24h: ticker.changePercent24h,
          symbol: ticker.symbol
        })
      } catch (error) {
        console.error('Error loading market data:', error)
      }
    }

    loadMarketData()

    // Subscribe to real-time updates
    const unsubscribe = marketDataService.subscribeToTicker('BTCUSDT', (ticker) => {
      setMarketData({
        price: ticker.price,
        change24h: ticker.change24h,
        changePercent24h: ticker.changePercent24h,
        symbol: ticker.symbol
      })
    })

    // Update balance simulation every 5 seconds
    const balanceInterval = setInterval(() => {
      setBalance(prev => ({
        ...prev,
        available: prev.available + (Math.random() - 0.5) * 10, // Simulate small balance changes
        total: prev.available + prev.margin
      }))
    }, 5000)

    return () => {
      unsubscribe()
      clearInterval(balanceInterval)
    }
  }, [])

  // Calculate order value and fees
  const orderValue = parseFloat(orderQuantity || '0') * (marketData?.price || 0)
  const calculatedFees = orderValue * (estimatedFees / 100)

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Header with Profile and Balance */}
      <div className="border-b border-zinc-800 bg-zinc-950 p-4 space-y-4">
        {/* Profile Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-zinc-400 text-sm">Profile 1</span>
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-1">
              <Download className="h-4 w-4 text-zinc-400" />
            </Button>
            <Button variant="ghost" size="sm" className="p-1">
              <Upload className="h-4 w-4 text-zinc-400" />
            </Button>
          </div>
        </div>

        {/* Balance */}
        <div className="space-y-1">
          <div className="text-lg font-mono text-white">
            {balance.available.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })} USDT
          </div>
          <div className="text-xs text-zinc-400">
            Total: {balance.total.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })} USDT
          </div>
        </div>
      </div>

      {/* Trading Controls */}
      <div className="flex-1 p-4 space-y-4">
        {/* Trade Type Selector */}
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
          <button
            onClick={() => setTradeType("Isolated")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              tradeType === "Isolated"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Isolated
          </button>
          <button
            onClick={() => setTradeType("Hedge")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              tradeType === "Hedge"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Hedge
          </button>
        </div>

        {/* Position Type */}
        <div className="flex bg-zinc-950 rounded-lg">
          <button
            onClick={() => setPositionType("Open")}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 ${
              positionType === "Open"
                ? "border-cyan-400 text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setPositionType("Close")}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 ${
              positionType === "Close"
                ? "border-cyan-400 text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Close
          </button>
        </div>

        {/* Order Type */}
        <div className="flex bg-zinc-950 rounded-lg relative">
          <button
            onClick={() => setOrderType("market")}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 ${
              orderType === "market"
                ? "border-cyan-400 text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Market
          </button>
          <button
            onClick={() => setOrderType("limit")}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 ${
              orderType === "limit"
                ? "border-cyan-400 text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Limit
          </button>
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center">
            <span className="text-cyan-400 text-sm font-medium">2x</span>
            <ChevronDown className="h-3 w-3 text-cyan-400 ml-1" />
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Amount</label>
          <div className="relative">
            <Input
              value={orderQuantity}
              onChange={(e) => setOrderQuantity(e.target.value)}
              placeholder="0.00"
              className="pr-20 font-mono text-lg h-12"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <span className="text-sm text-zinc-400">BTC</span>
              <div className="flex flex-col">
                <ChevronDown className="h-2 w-2 text-zinc-400" />
                <ChevronDown className="h-2 w-2 text-zinc-400 rotate-180" />
              </div>
            </div>
          </div>
        </div>

        {/* Leverage Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">Leverage</span>
            <span className="text-sm text-white">{selectedLeverage}x</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="1"
              max="100"
              value={selectedLeverage}
              onChange={(e) => setSelectedLeverage(Number(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <style jsx>{`
              .slider::-webkit-slider-thumb {
                appearance: none;
                height: 16px;
                width: 16px;
                border-radius: 50%;
                background: #ffffff;
                cursor: pointer;
              }
              .slider::-moz-range-thumb {
                height: 16px;
                width: 16px;
                border-radius: 50%;
                background: #ffffff;
                cursor: pointer;
                border: none;
              }
            `}</style>
          </div>
        </div>

        {/* Market Price Display */}
        {marketData && (
          <div className="bg-zinc-900 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Market Price</span>
              <div className={`flex items-center space-x-1 ${
                marketData.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {marketData.changePercent24h >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="text-xs">
                  {marketData.changePercent24h >= 0 ? '+' : ''}{marketData.changePercent24h.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="text-lg font-mono text-white">
              ${marketData.price.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </div>
            {orderValue > 0 && (
              <div className="text-xs text-zinc-400">
                Order Value: ${orderValue.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
            )}
          </div>
        )}

        {/* Order Error Alert */}
        {orderError && (
          <Alert className="border-red-500 bg-red-950">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              {orderError}
            </AlertDescription>
          </Alert>
        )}

        {/* Limit Price Input (only for limit orders) */}
        {orderType === 'limit' && (
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Limit Price</label>
            <Input
              value={orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              placeholder="0.00"
              className="font-mono text-lg h-12"
            />
          </div>
        )}

        {/* Buy/Sell Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3"
            disabled={isPlacingOrder || !isConnected || !orderQuantity}
            onClick={() => handlePlaceOrder('buy')}
          >
            {isPlacingOrder ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing...
              </>
            ) : (
              'Buy BTC'
            )}
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-3"
            disabled={isPlacingOrder || !isConnected || !orderQuantity}
            onClick={() => handlePlaceOrder('sell')}
          >
            {isPlacingOrder ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing...
              </>
            ) : (
              'Sell BTC'
            )}
          </Button>
        </div>

        {/* TP/SL Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="tpsl" 
              checked={showTPSL}
              onChange={(e) => setShowTPSL(e.target.checked)}
              className="rounded border-zinc-600" 
            />
            <label htmlFor="tpsl" className="text-sm text-zinc-400">TP/SL</label>
          </div>
          
          {showTPSL && (
            <div className="space-y-3 pl-6">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Take Profit ($)</label>
                <Input
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  placeholder="Take profit price"
                  className="font-mono text-sm h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Stop Loss ($)</label>
                <Input
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  placeholder="Stop loss price"
                  className="font-mono text-sm h-10"
                />
              </div>
            </div>
          )}
        </div>

        {/* Connect Wallet Button or Account Info */}
        {!isConnected ? (
          <div className="mt-4">
            <WalletConnect />
          </div>
        ) : (
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            {/* Account Details */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">${balance.available.toFixed(2)}</span>
                <span className="text-zinc-400">Available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">${orderValue.toFixed(2)}</span>
                <span className="text-zinc-400">Value</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">${balance.margin.toFixed(2)}</span>
                <span className="text-zinc-400">Margin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{estimatedFees.toFixed(2)}%</span>
                <span className="text-zinc-400">Slippage</span>
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Estimated fees</span>
              <span className="text-white">${calculatedFees.toFixed(2)} USDT</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}