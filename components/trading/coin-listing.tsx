"use client";

import { useState, useEffect } from "react";
import { Loader2, Flame, BarChart3 } from "lucide-react";
// Define types locally since @/types/trading doesn't exist
interface Blockchain {
  id: string;
  name: string;
}

interface CoinData {
  id: string;
  rank: number;
  symbol: string;
  name: string;
  price: number;
  age: string;
  txns: number;
  volume: number;
  makers: number;
  changes: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: number;
  mcap: number;
  blockchain: string;
  iconUrl: string;
  isTopGainer?: boolean;
  isNewPair?: boolean;
}
import Image from "next/image";
import { getCoinIcon } from "@/lib/crypto-images";

interface CoinListingProps {
  selectedBlockchain?: Blockchain;
}

export function CoinListing({ selectedBlockchain }: CoinListingProps) {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTimeFrame, setActiveTimeFrame] = useState("5M");
  const [activeFilters, setActiveFilters] = useState({
    trending: true,
    top: false,
    gainers: false,
    newPairs: false,
  });
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Fetch coins data
  useEffect(() => {
    const fetchCoins = async () => {
      setLoading(true);
      setError(null);

      try {
        const blockchain = selectedBlockchain?.id || "solana";
        const url = searchQuery
          ? `/api/coins/search?q=${encodeURIComponent(searchQuery)}&blockchain=${blockchain}`
          : `/api/coins/${blockchain}?limit=20`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          setCoins(data.data);
        } else {
          setError(data.error || "Failed to fetch data");
        }
      } catch (err) {
        setError("Network error occurred");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
  }, [selectedBlockchain?.id, searchQuery]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      // Trigger search after 500ms delay
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter and sort coins based on active filters
  const filteredAndSortedCoins = () => {
    let filtered = [...coins];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (coin) =>
          coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          coin.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filter states
    if (activeFilters.gainers) {
      filtered = filtered.filter((coin) => {
        const change =
          activeTimeFrame === "5M"
            ? coin.changes.m5
            : activeTimeFrame === "1H"
              ? coin.changes.h1
              : activeTimeFrame === "6H"
                ? coin.changes.h6
                : coin.changes.h24;
        return change > 0;
      });
    }

    if (activeFilters.newPairs) {
      filtered = filtered.filter((coin) => coin.isNewPair);
    }

    if (activeFilters.trending || activeFilters.top) {
      // Sort by trending/top based on timeframe
      filtered.sort((a, b) => {
        const aChange =
          activeTimeFrame === "5M"
            ? a.changes.m5
            : activeTimeFrame === "1H"
              ? a.changes.h1
              : activeTimeFrame === "6H"
                ? a.changes.h6
                : a.changes.h24;
        const bChange =
          activeTimeFrame === "5M"
            ? b.changes.m5
            : activeTimeFrame === "1H"
              ? b.changes.h1
              : activeTimeFrame === "6H"
                ? b.changes.h6
                : b.changes.h24;
        return Math.abs(bChange) - Math.abs(aChange); // Sort by magnitude of change
      });
    } else {
      // Default sort by rank
      filtered.sort((a, b) => a.rank - b.rank);
    }

    return filtered;
  };

  const displayCoins = filteredAndSortedCoins();

  const formatNumber = (num: number, decimals: number = 2) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(decimals);
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price || price <= 0) return '0.0000';
    if (price < 0.001) return price.toFixed(8);
    if (price < 1) return price.toFixed(6);
    return price.toFixed(4);
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return "text-green-400";
    if (change < 0) return "text-red-400";
    return "text-zinc-400";
  };

  return (
    <div className="flex-1 bg-black text-white">
      {/* Filters - Enhanced to match filter.png design */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {/* Enhanced Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 bg-zinc-800 text-white placeholder-zinc-400 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-zinc-700"
            />
          </div>

          {/* Trending Button */}
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilters.trending
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
            onClick={() =>
              setActiveFilters({
                ...activeFilters,
                trending: !activeFilters.trending,
              })
            }
          >
            <Flame className="w-4 h-4" />
            Trending
            <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">
              6
            </span>
          </button>

          {/* Time Frame Buttons */}
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
            {["5M", "1H", "6H", "24H"].map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setActiveTimeFrame(timeframe)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  activeTimeFrame === timeframe
                    ? "bg-zinc-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>

          {/* Gainers Button */}
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilters.gainers
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
            onClick={() =>
              setActiveFilters({
                ...activeFilters,
                gainers: !activeFilters.gainers,
              })
            }
          >
            <BarChart3 className="w-4 h-4" />
            Gainers
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead>
            <tr className="text-zinc-400 text-sm border-b border-zinc-800">
              <th className="text-left p-3 font-medium w-80">TOKEN</th>
              <th className="text-left p-3 font-medium">PRICE</th>
              <th className="text-left p-3 font-medium">AGE</th>
              <th className="text-left p-3 font-medium">TXNS</th>
              <th className="text-left p-3 font-medium">VOLUME</th>
              <th className="text-left p-3 font-medium">MAKERS</th>
              <th className="text-left p-3 font-medium">5M</th>
              <th className="text-left p-3 font-medium">1H</th>
              <th className="text-left p-3 font-medium">6H</th>
              <th className="text-left p-3 font-medium">24H</th>
              <th className="text-left p-3 font-medium">LIQUIDITY</th>
              <th className="text-left p-3 font-medium">MCAP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-zinc-400">
                      Loading {selectedBlockchain?.name || "Solana"} meme
                      coins...
                    </span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={12} className="p-8 text-center">
                  <div className="text-red-400">
                    <p className="mb-2">Failed to load data</p>
                    <p className="text-sm text-zinc-500">{error}</p>
                  </div>
                </td>
              </tr>
            ) : displayCoins.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-zinc-400">
                  {searchQuery
                    ? `No results found for "${searchQuery}"`
                    : `No meme coins found for ${selectedBlockchain?.name || "this blockchain"}`}
                </td>
              </tr>
            ) : (
              displayCoins.map((coin) => (
                <tr
                  key={coin.id}
                  className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors h-16"
                >
                  <td className="p-3 w-80 min-w-[320px]">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400 text-sm">
                        #{coin.rank}
                      </span>
                      <div className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                        {coin.iconUrl && !imageErrors.has(coin.id) ? (
                          <Image
                            src={coin.iconUrl}
                            alt={coin.symbol}
                            width={24}
                            height={24}
                            className="rounded-full"
                            onError={() => {
                              setImageErrors(
                                (prev) => new Set([...prev, coin.id])
                              );
                            }}
                          />
                        ) : (
                          <Image
                            src={getCoinIcon(coin.symbol)}
                            alt={coin.symbol}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {coin.symbol}
                          </span>
                          <span className="text-zinc-400 text-sm">
                            /{selectedBlockchain?.name || "SOL"}
                          </span>
                          <span className="text-zinc-400 text-sm">
                            {coin.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-white font-medium min-w-[100px]">
                    ${formatPrice(coin.price)}
                  </td>
                  <td className="p-3 text-zinc-300 min-w-[80px]">{coin.age}</td>
                  <td className="p-3 text-zinc-300 min-w-[80px]">
                    {formatNumber(coin.txns, 0)}
                  </td>
                  <td className="p-3 text-zinc-300 min-w-[100px]">
                    ${formatNumber(coin.volume)}M
                  </td>
                  <td className="p-3 text-zinc-300 min-w-[80px]">
                    {formatNumber(coin.makers, 0)}
                  </td>
                  <td
                    className={`p-3 font-medium min-w-[80px] ${getPriceChangeColor(coin.changes.m5 || 0)}`}
                  >
                    {(coin.changes.m5 || 0) > 0 ? "+" : ""}
                    {coin.changes.m5?.toFixed(2) || '0.00'}%
                  </td>
                  <td
                    className={`p-3 font-medium min-w-[80px] ${getPriceChangeColor(coin.changes.h1 || 0)}`}
                  >
                    {(coin.changes.h1 || 0) > 0 ? "+" : ""}
                    {coin.changes.h1?.toFixed(2) || '0.00'}%
                  </td>
                  <td
                    className={`p-3 font-medium min-w-[80px] ${getPriceChangeColor(coin.changes.h6 || 0)}`}
                  >
                    {(coin.changes.h6 || 0) > 0 ? "+" : ""}
                    {coin.changes.h6?.toFixed(2) || '0.00'}%
                  </td>
                  <td
                    className={`p-3 font-medium min-w-[80px] ${getPriceChangeColor(coin.changes.h24 || 0)}`}
                  >
                    {(coin.changes.h24 || 0) > 0 ? "+" : ""}
                    {coin.changes.h24?.toFixed(2) || '0.00'}%
                  </td>
                  <td className="p-3 text-zinc-300 min-w-[100px]">
                    ${formatNumber(coin.liquidity)}K
                  </td>
                  <td className="p-3 text-zinc-300 min-w-[100px]">
                    ${formatNumber(coin.mcap)}M
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
