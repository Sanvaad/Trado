"use client";

import { useState } from 'react';
import { User, LogOut, Wallet, TrendingUp, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const formatBalance = (balance: number) => {
    if (balance >= 1000000) return `${(balance / 1000000).toFixed(1)}M`;
    if (balance >= 1000) return `${(balance / 1000).toFixed(1)}K`;
    return balance.toFixed(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-white text-sm font-medium">{user.name}</p>
          <p className="text-zinc-400 text-xs">{formatBalance(user.balance)} tokens</p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-zinc-900 rounded-lg shadow-lg border border-zinc-800 z-50">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-zinc-400 text-sm">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <div className="px-3 py-2 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-sm">Balance</span>
                <span className="text-white font-medium">{formatBalance(user.balance)} tokens</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-zinc-300 text-sm">Portfolio</span>
                <span className="text-zinc-400 text-sm">{user.portfolio.length} coins</span>
              </div>
            </div>

            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Portfolio</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Trading History</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </button>
            </div>

            <div className="border-t border-zinc-800 mt-2 pt-2">
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left text-red-400 hover:text-red-300 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}