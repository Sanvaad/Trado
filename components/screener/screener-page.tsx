"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter, 
  RefreshCw,
  Loader2,
  ArrowUpDown,
  BarChart3,
  ShoppingCart
} from "lucide-react";
import { CoinData, ScreenerData, ScreenerFilters, fetchScreenerData } from "@/lib/screener-api";
import { useAuth } from "@/lib/auth-context";
import { BuyModal } from "@/components/trading/buy-modal";

const blockchains = [
  { id: 'all', name: 'All Chains', icon: '🔗' },
  { id: 'ethereum', name: 'Ethereum', icon: '⟠' },
  { id: 'solana', name: 'Solana', icon: '◎' },
  { id: 'binance', name: 'BSC', icon: '🟡' },
  { id: 'polygon', name: 'Polygon', icon: '🟣' },
  { id: 'avalanche', name: 'Avalanche', icon: '🔺' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
  { id: 'optimism', name: 'Optimism', icon: '🔴' },
];

export function ScreenerPage() {
  const [screenerData, setScreenerData] = useState<ScreenerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBlockchain, setSelectedBlockchain] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'price' | 'change24h' | 'volume24h' | 'marketCap'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated } = useAuth();
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const handleBuy = (coin: CoinData) => {
    setSelectedCoin(coin);
    setShowBuyModal(true);
  };

  const loadScreenerData = useCallback(async (filters: ScreenerFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const apiFilters: ScreenerFilters = {
        blockchain: selectedBlockchain === 'all' ? undefined : selectedBlockchain,
        sortBy,
        sortOrder,
        limit: 100,
        ...filters
      };
      
      const data = await fetchScreenerData(apiFilters);
      setScreenerData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load screener data');
    } finally {
      setLoading(false);
    }
  }, [selectedBlockchain, sortBy, sortOrder]);

  useEffect(() => {
    loadScreenerData();
  }, [selectedBlockchain, sortBy, sortOrder, loadScreenerData]);

  const filteredCoins = screenerData?.coins.filter(coin => 
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder(newSortBy === 'rank' ? 'asc' : 'desc');
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount || amount <= 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  // const formatNumber = (num: number | null | undefined) => {
  //   if (!num || num <= 0) return '0';
  //   if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
  //   if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  //   if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  //   return num.toFixed(2);
  // };

  const formatPrice = (price: number | null | undefined) => {
    if (!price || price <= 0) return '$0.00';
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return formatCurrency(price);
  };

  if (loading) {
    return (
      <div className="flex-1 bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold mb-2">Loading Crypto Screener</h2>
          <p className="text-zinc-400">Please wait while we fetch market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">!</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Screener</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <button
            onClick={() => loadScreenerData()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Crypto Screener</h1>
          <p className="text-zinc-400">Discover and analyze cryptocurrency markets</p>
        </div>
        <button
          onClick={() => loadScreenerData()}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        {/* Blockchain Filter */}
        <div className="flex gap-2">
          {blockchains.map(blockchain => (
            <button
              key={blockchain.id}
              onClick={() => setSelectedBlockchain(blockchain.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedBlockchain === blockchain.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <span>{blockchain.icon}</span>
              {blockchain.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search coins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-800 text-white pl-10 pr-4 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center gap-4">
        <p className="text-zinc-400">
          Showing {filteredCoins.length} coins
        </p>
        {selectedBlockchain !== 'all' && (
          <span className="text-sm text-blue-400">
            Filtered by {blockchains.find(b => b.id === selectedBlockchain)?.name}
          </span>
        )}
      </div>

      {/* Coins Table */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-zinc-400 text-sm border-b border-zinc-800">
                <th className="text-left p-4 font-medium">
                  <button
                    onClick={() => handleSort('rank')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    RANK
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium">COIN</th>
                <th className="text-left p-4 font-medium">
                  <button
                    onClick={() => handleSort('price')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    PRICE
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium">
                  <button
                    onClick={() => handleSort('change24h')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    24H CHANGE
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium">
                  <button
                    onClick={() => handleSort('volume24h')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    24H VOLUME
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium">
                  <button
                    onClick={() => handleSort('marketCap')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    MARKET CAP
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                {isAuthenticated && (
                  <th className="text-left p-4 font-medium">ACTION</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredCoins.map((coin) => (
                <tr key={coin.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 cursor-pointer">
                  <td className="p-4">
                    <span className="text-zinc-400 font-medium">#{coin.rank}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {coin.image ? (
                        <Image
                          src={coin.image}
                          alt={coin.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {coin.symbol.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{coin.symbol}</p>
                        <p className="text-sm text-zinc-400">{coin.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-white font-medium">{formatPrice(coin.price)}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      {(coin.change24h || 0) >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <p className={`font-medium ${
                        (coin.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(coin.change24h || 0) >= 0 ? '+' : ''}{coin.change24h?.toFixed(2) || '0.00'}%
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-white">{formatCurrency(coin.volume24h)}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-white">{formatCurrency(coin.marketCap)}</p>
                  </td>
                  {isAuthenticated && (
                    <td className="p-4">
                      <button
                        onClick={() => handleBuy(coin)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Buy
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCoins.length === 0 && !loading && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No coins found</h3>
          <p className="text-zinc-400">Try adjusting your search or filters</p>
        </div>
      )}

      {selectedCoin && (
        <BuyModal
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          coin={selectedCoin}
        />
      )}
    </div>
  );
}