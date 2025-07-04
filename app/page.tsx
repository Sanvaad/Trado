"use client";

import Link from "next/link";
import { BarChart3, Wallet, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Crypto Portfolio & Screener
          </h1>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Track your cryptocurrency investments and discover new opportunities with our powerful portfolio management and market screening tools.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/portfolio"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              <Wallet className="w-5 h-5" />
              View Portfolio
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/screener"
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              Market Screener
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Portfolio Management</h3>
            <p className="text-zinc-400 mb-4">
              Track your cryptocurrency holdings, monitor performance, and manage your investments with real-time data and detailed analytics.
            </p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• Real-time portfolio valuation</li>
              <li>• Profit & loss tracking</li>
              <li>• Asset allocation insights</li>
              <li>• Performance analytics</li>
            </ul>
          </div>

          <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Market Screener</h3>
            <p className="text-zinc-400 mb-4">
              Discover and analyze cryptocurrencies across multiple blockchains with advanced filtering and sorting capabilities.
            </p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• Multi-blockchain support</li>
              <li>• Advanced filtering options</li>
              <li>• Real-time market data</li>
              <li>• Sorting by various metrics</li>
            </ul>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">Real-time</div>
            <p className="text-zinc-400">Market Data</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">Multi-chain</div>
            <p className="text-zinc-400">Support</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">Comprehensive</div>
            <p className="text-zinc-400">Analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
}
