"use client";

import { useEffect, useState } from "react";
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { marketDataService } from "@/lib/market-data";

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  fundingRate: number;
  nextFunding: number;
}

export function MarketHeader() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMarketData = async () => {
      try {
        const [ticker, stats] = await Promise.all([
          marketDataService.getMarketTicker(),
          marketDataService.getMarketStats(),
        ]);

        setMarketData({
          symbol: ticker.symbol,
          price: ticker.price,
          change24h: ticker.change24h,
          changePercent24h: ticker.changePercent24h,
          high24h: ticker.high24h,
          low24h: ticker.low24h,
          volume24h: ticker.volume24h,
          fundingRate: stats.fundingRate,
          nextFunding: stats.nextFunding,
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading market data:", error);
        setIsLoading(false);
      }
    };

    loadMarketData();

    // Subscribe to real-time updates
    const unsubscribe = marketDataService.subscribeToTicker(
      "BTCUSDT",
      (ticker) => {
        setMarketData((prev) =>
          prev
            ? {
                ...prev,
                price: ticker.price,
                change24h: ticker.change24h,
                changePercent24h: ticker.changePercent24h,
                high24h: ticker.high24h,
                low24h: ticker.low24h,
                volume24h: ticker.volume24h,
              }
            : null
        );
      }
    );

    // Additional polling every 5 seconds to ensure fresh data
    const pollingInterval = setInterval(async () => {
      try {
        const [ticker, stats] = await Promise.all([
          marketDataService.getMarketTicker(),
          marketDataService.getMarketStats(),
        ]);

        setMarketData({
          symbol: ticker.symbol,
          price: ticker.price,
          change24h: ticker.change24h,
          changePercent24h: ticker.changePercent24h,
          high24h: ticker.high24h,
          low24h: ticker.low24h,
          volume24h: ticker.volume24h,
          fundingRate: stats.fundingRate,
          nextFunding: stats.nextFunding,
        });
      } catch (error) {
        console.error("Error polling market data:", error);
      }
    }, 5000); // Update every 5 seconds

    return () => {
      unsubscribe();
      clearInterval(pollingInterval);
    };
  }, []);

  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return (volume / 1e9).toFixed(2) + "B";
    if (volume >= 1e6) return (volume / 1e6).toFixed(2) + "M";
    if (volume >= 1e3) return (volume / 1e3).toFixed(2) + "K";
    return volume.toFixed(2);
  };

  const formatNextFunding = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  return (
    <div className="border-b border-zinc-800 bg-zinc-950 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Market Selector */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">₿</span>
            </div>
            <span className="text-white font-medium text-lg">
              {marketData?.symbol.replace("USDT", "-PERP") || "BTC-PERP"}
            </span>
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </div>
        </div>

        {/* Center - Market Stats */}
        <div className="flex items-center space-x-8 text-sm">
          <div className="text-center">
            <div className="text-zinc-400 text-xs">Mark</div>
            <div className="text-white font-medium font-mono">
              {isLoading ? "..." : `$${formatPrice(marketData?.price || 0)}`}
            </div>
          </div>

          <div className="text-center">
            <div className="text-zinc-400 text-xs">24h change</div>
            <div
              className={`font-medium font-mono flex items-center justify-center space-x-1 ${
                (marketData?.changePercent24h || 0) >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {!isLoading && marketData && (
                <>
                  {marketData.changePercent24h >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {marketData.changePercent24h >= 0 ? "+" : ""}
                    {marketData.changePercent24h.toFixed(3)} %
                  </span>
                </>
              )}
              {isLoading && "..."}
            </div>
          </div>

          <div className="text-center">
            <div className="text-zinc-400 text-xs">Oracle Price</div>
            <div className="text-white font-medium font-mono">
              {isLoading ? "..." : `$${formatPrice(marketData?.price || 0)}`}
            </div>
          </div>

          <div className="text-center">
            <div className="text-zinc-400 text-xs">24h volume</div>
            <div className="text-white font-medium font-mono">
              {isLoading
                ? "..."
                : `$${formatVolume(marketData?.volume24h || 0)}`}
            </div>
          </div>

          <div className="text-center">
            <div className="text-zinc-400 text-xs">Funding</div>
            <div
              className={`font-medium font-mono ${
                (marketData?.fundingRate || 0) >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {isLoading
                ? "..."
                : `${(marketData?.fundingRate || 0) >= 0 ? "+" : ""}${((marketData?.fundingRate || 0) * 100).toFixed(6)} %`}
            </div>
          </div>

          <div className="text-center">
            <div className="text-zinc-400 text-xs">Next Funding</div>
            <div className="text-white font-medium font-mono">
              {isLoading
                ? "..."
                : formatNextFunding(marketData?.nextFunding || Date.now())}
            </div>
          </div>
        </div>

        {/* Right side - Connection Status */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isLoading ? "bg-yellow-400 animate-pulse" : "bg-green-400"
            }`}
          ></div>
          <span className="text-xs text-zinc-400">
            {isLoading ? "Loading..." : "Live"}
          </span>
        </div>
      </div>
    </div>
  );
}
