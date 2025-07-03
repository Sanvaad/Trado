"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Wifi, WifiOff } from "lucide-react";
import { marketDataService } from "@/lib/market-data";

interface OrderBookLevel {
  price: number;
  quantity: number;
  sum: number;
}

interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdated: number;
}

export function OrderBook() {
  const [activeTab, setActiveTab] = useState("Orderbook");
  const [orderBookData, setOrderBookData] = useState<OrderBookData | null>(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initOrderBook = async () => {
      try {
        // Get initial data
        const [orderBook, ticker] = await Promise.all([
          marketDataService.getOrderBook('BTCUSDT', 15),
          marketDataService.getMarketTicker('BTCUSDT')
        ]);
        
        // Calculate cumulative sums
        let bidSum = 0;
        let askSum = 0;
        
        const processedBids = orderBook.bids.map(level => {
          bidSum += level.quantity;
          return {
            price: level.price,
            quantity: level.quantity,
            sum: bidSum
          };
        });
        
        const processedAsks = orderBook.asks.reverse().map(level => {
          askSum += level.quantity;
          return {
            price: level.price,
            quantity: level.quantity,
            sum: askSum
          };
        }).reverse();
        
        setOrderBookData({
          bids: processedBids,
          asks: processedAsks,
          lastUpdated: orderBook.lastUpdated
        });
        
        setCurrentPrice(ticker.price);
        setPriceChange(ticker.changePercent24h);
        setIsLoading(false);
        setIsConnected(true);
        
      } catch (error) {
        console.error('Error initializing order book:', error);
        setIsLoading(false);
        // Fallback to mock data
        generateMockOrderBook();
      }
    };
    
    initOrderBook();
    
    // Subscribe to real-time order book updates
    const unsubscribeOrderBook = marketDataService.subscribeToOrderBook('BTCUSDT', (orderBook) => {
      try {
        let bidSum = 0;
        let askSum = 0;
        
        const processedBids = orderBook.bids.slice(0, 15).map(level => {
          bidSum += level.quantity;
          return {
            price: level.price,
            quantity: level.quantity,
            sum: bidSum
          };
        });
        
        const processedAsks = orderBook.asks.slice(0, 15).reverse().map(level => {
          askSum += level.quantity;
          return {
            price: level.price,
            quantity: level.quantity,
            sum: askSum
          };
        }).reverse();
        
        setOrderBookData({
          bids: processedBids,
          asks: processedAsks,
          lastUpdated: orderBook.lastUpdated
        });
        
        setIsConnected(true);
      } catch (error) {
        console.error('Error processing order book update:', error);
        setIsConnected(false);
      }
    });
    
    // Subscribe to ticker updates for current price
    const unsubscribeTicker = marketDataService.subscribeToTicker('BTCUSDT', (ticker) => {
      setCurrentPrice(ticker.price);
      setPriceChange(ticker.changePercent24h);
    });
    
    return () => {
      unsubscribeOrderBook();
      unsubscribeTicker();
    };
  }, []);

  const generateMockOrderBook = () => {
    const basePrice = 45000;
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];
    
    let bidSum = 0;
    let askSum = 0;
    
    // Generate mock bids
    for (let i = 0; i < 15; i++) {
      const quantity = Math.random() * 5 + 0.1;
      bidSum += quantity;
      bids.push({
        price: basePrice - (i + 1) * 10,
        quantity,
        sum: bidSum
      });
    }
    
    // Generate mock asks
    for (let i = 14; i >= 0; i--) {
      const quantity = Math.random() * 5 + 0.1;
      askSum += quantity;
      asks.push({
        price: basePrice + (15 - i) * 10,
        quantity,
        sum: askSum
      });
    }
    
    setOrderBookData({ bids, asks, lastUpdated: Date.now() });
    setCurrentPrice(basePrice);
    setPriceChange((Math.random() - 0.5) * 10);
  };

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-950">
        <button
          onClick={() => setActiveTab("Orderbook")}
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === "Orderbook"
              ? "text-white border-b-2 border-cyan-400"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Orderbook
        </button>
        <button
          onClick={() => setActiveTab("Trades")}
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === "Trades"
              ? "text-white border-b-2 border-cyan-400"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Trades
        </button>
        
        {/* Connection Status */}
        <div className="ml-auto flex items-center px-4 py-3">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
          <span className={`ml-2 text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isLoading ? 'Loading...' : isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Order Book Content */}
      <div className="flex-1 p-4 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-zinc-400 font-medium">
          <div>Price<br/>(USDT)</div>
          <div className="text-right">Size<br/>(BTC)</div>
          <div className="text-right">Sum<br/>(BTC)</div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-zinc-400">Loading order book...</div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {/* Asks (Sell orders) */}
            {orderBookData?.asks.map((ask, i) => (
              <div key={`ask-${i}`} className="grid grid-cols-3 gap-2 text-xs font-mono py-0.5 hover:bg-zinc-900 transition-colors">
                <div className="text-red-400">${ask.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="text-zinc-300 text-right">{ask.quantity.toFixed(4)}</div>
                <div className="text-zinc-300 text-right">{ask.sum.toFixed(4)}</div>
              </div>
            ))}

            {/* Current Price */}
            <div className="flex items-center justify-center py-2 my-1 border-y border-zinc-800">
              <span className={`font-bold font-mono flex items-center space-x-1 ${
                priceChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                <span>${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                {priceChange >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span className="text-xs">
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </span>
            </div>

            {/* Bids (Buy orders) */}
            {orderBookData?.bids.map((bid, i) => (
              <div key={`bid-${i}`} className="grid grid-cols-3 gap-2 text-xs font-mono py-0.5 hover:bg-zinc-900 transition-colors">
                <div className="text-green-400">${bid.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="text-zinc-300 text-right">{bid.quantity.toFixed(4)}</div>
                <div className="text-zinc-300 text-right">{bid.sum.toFixed(4)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Powered by <span className="font-semibold text-blue-400">Binance API</span></span>
          {orderBookData && (
            <span>Updated: {new Date(orderBookData.lastUpdated).toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
