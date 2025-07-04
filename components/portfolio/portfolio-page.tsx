"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  DollarSign, 
  Minus,
  Plus,
  Calendar,
  ArrowUpDown,
  Loader2,
  RefreshCw
} from "lucide-react";
import { getPortfolio } from "@/lib/portfolio-storage";
import { useAuth } from "@/lib/auth-context";
import { SellModal } from "./sell-modal";

interface PortfolioItem {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  price: number;
  purchasePrice: number;
  purchaseDate: string;
}

export function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<PortfolioItem | null>(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [sortBy, setSortBy] = useState<'value' | 'amount' | 'pnl'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { user, isAuthenticated } = useAuth();

  const loadPortfolioData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setPortfolio([]);
        return;
      }

      const userPortfolio = getPortfolio(user.id);
      const portfolioItems: PortfolioItem[] = [];

      // Get current prices from CoinGecko API
      for (const [coinId, coinData] of Object.entries(userPortfolio)) {
        try {
          const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
          const priceData = await response.json();
          const currentPrice = priceData[coinId]?.usd || coinData.averagePrice;

          portfolioItems.push({
            id: coinId,
            symbol: coinData.symbol,
            name: coinData.name,
            amount: coinData.totalAmount,
            price: currentPrice,
            purchasePrice: coinData.averagePrice,
            purchaseDate: coinData.transactions[0]?.timestamp instanceof Date ? coinData.transactions[0].timestamp.toISOString() : coinData.transactions[0]?.timestamp || new Date().toISOString()
          });
        } catch {
          // If API fails, use stored data
          portfolioItems.push({
            id: coinId,
            symbol: coinData.symbol,
            name: coinData.name,
            amount: coinData.totalAmount,
            price: coinData.averagePrice,
            purchasePrice: coinData.averagePrice,
            purchaseDate: coinData.transactions[0]?.timestamp instanceof Date ? coinData.transactions[0].timestamp.toISOString() : coinData.transactions[0]?.timestamp || new Date().toISOString()
          });
        }
      }

      setPortfolio(portfolioItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPortfolioData();
  }, [user, loadPortfolioData]);

  if (!isAuthenticated) {
    return (
      <div className="flex-1 bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Login Required</h2>
          <p className="text-zinc-400">Please login to view your portfolio</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold mb-2">Loading Portfolio</h2>
          <p className="text-zinc-400">Please wait while we fetch your data...</p>
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
          <h2 className="text-2xl font-bold mb-2">Error Loading Portfolio</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <button
            onClick={loadPortfolioData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate portfolio totals
  const totalValue = portfolio.reduce((sum, item) => sum + (item.amount * item.price), 0);
  const totalCost = portfolio.reduce((sum, item) => sum + (item.amount * item.purchasePrice), 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercentage = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  // Sort portfolio
  const sortedPortfolio = [...portfolio].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy) {
      case 'value':
        valueA = a.amount * a.price;
        valueB = b.amount * b.price;
        break;
      case 'amount':
        valueA = a.amount;
        valueB = b.amount;
        break;
      case 'pnl':
        valueA = (a.amount * a.price) - (a.amount * a.purchasePrice);
        valueB = (b.amount * b.price) - (b.amount * b.purchasePrice);
        break;
      default:
        valueA = a.amount * a.price;
        valueB = b.amount * b.price;
    }
    
    return sortOrder === 'desc' ? valueB - valueA : valueA - valueB;
  });

  const handleSort = (newSortBy: 'value' | 'amount' | 'pnl') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handleSellClick = (coin: PortfolioItem) => {
    setSelectedCoin(coin);
    setShowSellModal(true);
  };

  const handleSellComplete = () => {
    setShowSellModal(false);
    setSelectedCoin(null);
    loadPortfolioData(); // Refresh portfolio data
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(6);
  };

  return (
    <div className="flex-1 bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
          <p className="text-zinc-400">Track your crypto investments and trading performance</p>
        </div>
        <button
          onClick={loadPortfolioData}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Total Holdings</p>
              <p className="text-white text-sm font-medium">{portfolio.length} assets</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Portfolio Value</p>
              <p className="text-white text-lg font-bold">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              totalPnL >= 0 ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {totalPnL >= 0 ? (
                <TrendingUp className="w-5 h-5 text-white" />
              ) : (
                <TrendingDown className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Total P&L</p>
              <p className={`text-lg font-bold ${
                totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(totalPnL)} ({totalPnLPercentage.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold">Holdings</h2>
        </div>

        {portfolio.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No holdings yet</h3>
            <p className="text-zinc-400">Your portfolio is empty</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-zinc-400 text-sm border-b border-zinc-800">
                  <th className="text-left p-4 font-medium">ASSET</th>
                  <th className="text-left p-4 font-medium">
                    <button
                      onClick={() => handleSort('amount')}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      AMOUNT
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-medium">AVG PRICE</th>
                  <th className="text-left p-4 font-medium">CURRENT PRICE</th>
                  <th className="text-left p-4 font-medium">
                    <button
                      onClick={() => handleSort('value')}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      VALUE
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-medium">
                    <button
                      onClick={() => handleSort('pnl')}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      P&L
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-medium">PURCHASE DATE</th>
                  <th className="text-left p-4 font-medium">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {sortedPortfolio.map((item) => {
                  const currentValue = item.amount * item.price;
                  const purchaseValue = item.amount * item.purchasePrice;
                  const pnl = currentValue - purchaseValue;
                  const pnlPercentage = (pnl / purchaseValue) * 100;

                  return (
                    <tr key={item.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {item.symbol.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{item.symbol}</p>
                            <p className="text-sm text-zinc-400">{item.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white font-medium">{formatNumber(item.amount)}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white">{formatCurrency(item.purchasePrice)}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white">{formatCurrency(item.price)}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-white font-medium">{formatCurrency(currentValue)}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {pnl >= 0 ? (
                            <Plus className="w-3 h-3 text-green-400" />
                          ) : (
                            <Minus className="w-3 h-3 text-red-400" />
                          )}
                          <p className={`font-medium ${
                            pnl >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(Math.abs(pnl))} ({Math.abs(pnlPercentage).toFixed(2)}%)
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            {new Date(item.purchaseDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleSellClick(item)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sell Modal */}
      {showSellModal && selectedCoin && (
        <SellModal
          coin={selectedCoin}
          isOpen={showSellModal}
          onClose={() => setShowSellModal(false)}
          onSellComplete={handleSellComplete}
        />
      )}
    </div>
  );
}