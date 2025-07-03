"use client";

import { useState } from 'react';
import { X, ShoppingCart, Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { authService } from '@/lib/auth';
import { CoinData } from '@/types/trading';
import Image from 'next/image';

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  coin: CoinData | null;
}

export function BuyModal({ isOpen, onClose, coin }: BuyModalProps) {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !coin) return null;

  const handleBuy = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const purchaseAmount = parseFloat(amount);
      const totalCost = purchaseAmount * coin.price;
      
      if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      
      if (totalCost > user.balance) {
        setError('Insufficient balance');
        return;
      }
      
      // Simulate purchase delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update balance
      const newBalance = user.balance - totalCost;
      authService.updateBalance(newBalance);
      
      // Add to portfolio
      authService.addToPortfolio({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        amount: purchaseAmount,
        price: coin.price,
        purchasePrice: coin.price,
        blockchain: coin.blockchain,
        purchaseDate: new Date().toISOString(),
        iconUrl: coin.iconUrl
      });
      
      // Refresh user data
      refreshUser();
      
      setSuccess(true);
      setAmount('');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
      
    } catch (err) {
      setError('Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = amount ? parseFloat(amount) * coin.price : 0;
  const canAfford = user ? totalCost <= user.balance : false;

  const formatBalance = (balance: number) => {
    if (balance >= 1000000) return `${(balance / 1000000).toFixed(1)}M`;
    if (balance >= 1000) return `${(balance / 1000).toFixed(1)}K`;
    return balance.toFixed(0);
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Purchase Successful!</h2>
            <p className="text-zinc-300 mb-4">
              You've successfully purchased {amount} {coin.symbol} tokens
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Buy {coin.symbol}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 p-4 bg-zinc-800 rounded-lg">
            <Image
              src={coin.iconUrl}
              alt={coin.symbol}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="flex-1">
              <h3 className="text-white font-medium">{coin.name}</h3>
              <p className="text-zinc-400 text-sm">{coin.symbol}/{coin.blockchain.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">${coin.price.toFixed(6)}</p>
              <p className={`text-sm ${coin.changes.h24 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {coin.changes.h24 >= 0 ? '+' : ''}{coin.changes.h24.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-zinc-300 text-sm font-medium mb-2">
              Amount to Buy
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none"
              min="0"
              step="0.000001"
            />
          </div>

          <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Price per token:</span>
              <span className="text-white">${coin.price.toFixed(6)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Total cost:</span>
              <span className="text-white">{totalCost.toFixed(2)} tokens</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Your balance:</span>
              <span className="text-white">{user ? formatBalance(user.balance) : '0'} tokens</span>
            </div>
            {!canAfford && amount && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Insufficient balance</span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            onClick={handleBuy}
            disabled={loading || !amount || !canAfford || !user}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Buy {coin.symbol}
              </>
            )}
          </button>
        </div>

        <div className="mt-4 p-3 bg-zinc-800 rounded-lg">
          <p className="text-zinc-300 text-sm">
            💡 <strong>Note:</strong> This is a test environment. All purchases are made with test tokens.
          </p>
        </div>
      </div>
    </div>
  );
}