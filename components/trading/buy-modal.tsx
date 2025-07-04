"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ShoppingCart, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { saveTransaction, Transaction } from "@/lib/portfolio-storage";

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  coin: {
    id: string;
    symbol: string;
    name: string;
    price: number;
    image?: string;
  };
}

export function BuyModal({ isOpen, onClose, coin }: BuyModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    
    try {
      const transaction: Transaction = {
        id: Date.now().toString(),
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        amount: parseFloat(amount),
        price: coin.price,
        type: 'buy',
        timestamp: new Date(),
        userId: user.id
      };

      saveTransaction(transaction);
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setAmount('');
      }, 2000);
    } catch (error) {
      console.error('Error buying token:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCost = amount ? (parseFloat(amount) * coin.price).toFixed(2) : '0.00';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md mx-4 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Buy {coin.symbol}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Purchase Successful!</h3>
            <p className="text-zinc-400">
              You bought {amount} {coin.symbol} for ${totalCost}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
              {coin.image && (
                <Image
                  src={coin.image}
                  alt={coin.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-white">{coin.name}</p>
                <p className="text-sm text-zinc-400">{coin.symbol}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-white font-medium">${coin.price.toFixed(6)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Amount to buy
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter amount"
                  step="0.000001"
                  min="0"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
                  {coin.symbol}
                </span>
              </div>
            </div>

            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400">Total Cost:</span>
                <span className="text-white font-medium">${totalCost}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Price per token:</span>
                <span className="text-white">${coin.price.toFixed(6)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}