"use client"

import { useState, useEffect } from "react"
import { BlockchainSidebar } from "@/components/trading/blockchain-sidebar"
import { CoinListing } from "@/components/trading/coin-listing"
import { Blockchain } from "@/types/trading"
import { InlineLoader } from "@/components/ui/page-loader"

export default function ScreenerPage() {
  const [selectedBlockchain, setSelectedBlockchain] = useState<Blockchain>({
    id: "solana",
    name: "Solana",
    icon: "🔮",
    color: "from-purple-500 to-blue-500"
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate initial page loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  const handleBlockchainSelect = (blockchain: Blockchain) => {
    setSelectedBlockchain(blockchain)
  }

  if (loading) {
    return <InlineLoader message="Loading Crypto Screener" />
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-black">
      <BlockchainSidebar 
        onBlockchainSelect={handleBlockchainSelect}
        selectedBlockchain={selectedBlockchain}
      />
      <div className="flex-1 overflow-x-auto">
        <CoinListing selectedBlockchain={selectedBlockchain} />
      </div>
    </div>
  )
}