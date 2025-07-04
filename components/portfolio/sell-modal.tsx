"use client";

import { useState } from 'react';
import { X, Loader2, DollarSign, TrendingDown, AlertCircle } from 'lucide-react';
import { saveTransaction, Transaction } from '@/lib/portfolio-storage';
import { useAuth } from '@/lib/auth-context';

interface PortfolioItem {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  price: number;
  purchasePrice: number;
  purchaseDate: string;
}

interface SellModalProps {
  coin: PortfolioItem;
  isOpen: boolean;
  onClose: () => void;
  onSellComplete: () => void;
}

export function SellModal({ coin, isOpen, onClose, onSellComplete }: SellModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  if (!isOpen) return null;

  const amountNumber = parseFloat(amount) || 0;
  const saleValue = amountNumber * coin.price;
  const isValidAmount = amountNumber > 0 && amountNumber <= coin.amount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isValidAmount || !user) {
        setError('Please enter a valid amount');
        return;
      }

      const transaction: Transaction = {
        id: Date.now().toString(),
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        amount: amountNumber,
        price: coin.price,
        type: 'sell',
        timestamp: new Date(),
        userId: user.id
      };

      saveTransaction(transaction);
      onSellComplete();
      setAmount('');
      onClose();
    } catch {
      setError('An error occurred while selling');
    } finally {
      setLoading(false);
    }
  };

  const handleMaxClick = () => {
    setAmount(coin.amount.toString());
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            Sell {coin.symbol}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coin Info */}
        <div className="bg-zinc-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {coin.symbol.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-white">{coin.symbol}</h3>
              <p className="text-sm text-zinc-400">{coin.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-400">Available</p>
              <p className="text-white font-medium">{formatNumber(coin.amount)}</p>
            </div>
            <div>
              <p className="text-zinc-400">Current Price</p>
              <p className="text-white font-medium">{formatCurrency(coin.price)}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Amount to Sell
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="any"
                min="0"
                max={coin.amount}
                className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-red-500 focus:outline-none pr-16"
                required
              />
              <button
                type="button"
                onClick={handleMaxClick}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-300 text-sm font-medium"
              >
                MAX
              </button>
            </div>
            {amountNumber > coin.amount && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Insufficient amount
              </p>
            )}
          </div>

          {/* Sale Summary */}
          {amountNumber > 0 && (
            <div className="bg-zinc-800 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Sale Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Amount</span>
                  <span className="text-white">{formatNumber(amountNumber)} {coin.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Price per token</span>
                  <span className="text-white">{formatCurrency(coin.price)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-700">
                  <span className="text-zinc-400">Total Sale Value</span>
                  <span className="text-white font-medium">{formatCurrency(saleValue)}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isValidAmount}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Sell'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}