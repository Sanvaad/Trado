"use client";

import { ChevronDown, User } from "lucide-react";
import { Blockchain } from "@/types/trading";
import { useAuth } from "@/lib/auth";

const blockchains: Blockchain[] = [
  {
    id: "solana",
    name: "Solana",
    icon: "🔮",
    color: "from-purple-500 to-blue-500",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    icon: "💎",
    color: "from-blue-500 to-gray-500",
  },
  {
    id: "base",
    name: "Base",
    icon: "🔵",
    color: "from-blue-600 to-blue-400",
  },
  {
    id: "bsc",
    name: "BSC",
    icon: "🟡",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "pulsechain",
    name: "PulseChain",
    icon: "💜",
    color: "from-purple-600 to-pink-500",
  },
  {
    id: "avalanche",
    name: "Avalanche",
    icon: "🔺",
    color: "from-red-500 to-pink-500",
  },
  {
    id: "polygon",
    name: "Polygon",
    icon: "🟣",
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    icon: "🔷",
    color: "from-blue-500 to-cyan-400",
  },
  {
    id: "abstract",
    name: "Abstract",
    icon: "🔶",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "sui",
    name: "Sui",
    icon: "🔹",
    color: "from-blue-400 to-cyan-400",
  },
];

interface BlockchainSidebarProps {
  onBlockchainSelect: (blockchain: Blockchain) => void;
  selectedBlockchain?: Blockchain;
}

export function BlockchainSidebar({
  onBlockchainSelect,
  selectedBlockchain,
}: BlockchainSidebarProps) {
  const { user } = useAuth();

  const getBlockchainColor = (id: string) => {
    const colorMap: Record<string, string> = {
      solana: 'bg-gradient-to-r from-purple-500 to-pink-500',
      ethereum: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      base: 'bg-gradient-to-r from-blue-600 to-blue-400',
      bsc: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      pulsechain: 'bg-gradient-to-r from-pink-500 to-purple-500',
      avalanche: 'bg-gradient-to-r from-red-500 to-orange-500',
      polygon: 'bg-gradient-to-r from-purple-600 to-indigo-600',
      arbitrum: 'bg-gradient-to-r from-blue-500 to-cyan-400',
      abstract: 'bg-gradient-to-r from-gray-500 to-gray-400',
      sui: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    };
    return colorMap[id] || 'bg-gradient-to-r from-gray-500 to-gray-400';
  };

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-zinc-400 text-sm">more</span>
          <ChevronDown className="w-3 h-3 text-zinc-400" />
        </div>
      </div>

      {/* Blockchain List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {blockchains.map((blockchain) => (
            <button
              key={blockchain.id}
              onClick={() => onBlockchainSelect(blockchain)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1 ${
                selectedBlockchain?.id === blockchain.id
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <div className={`w-5 h-5 rounded-full ${getBlockchainColor(blockchain.id)} flex items-center justify-center`}>
                <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
              </div>
              <span className="text-sm font-medium">{blockchain.name}</span>
            </button>
          ))}
        </div>
      </div>


      {/* User Section */}
      <div className="border-t border-zinc-800 p-4">
        {!user ? (
          <div className="space-y-3">
            <div className="text-center">
              <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <User className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-zinc-400 text-sm mb-1">Not signed in</p>
              <p className="text-zinc-500 text-xs">Sign in to track your portfolio</p>
            </div>
            <div className="text-center">
              <p className="text-zinc-500 text-sm">
                Use the Sign In button in the top navigation to authenticate
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center relative">
                <User className="w-5 h-5 text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-zinc-900"></div>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">
                  {user.name}
                </p>
                <p className="text-green-400 text-xs font-medium">● Online</p>
              </div>
            </div>
            
            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 text-xs">Balance</span>
                <span className="text-white text-sm font-medium">{user.balance.toFixed(2)} tokens</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-xs">Holdings</span>
                <span className="text-zinc-300 text-sm">{user.portfolio.length} coins</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
