"use client"

import { useEffect, useState } from "react"
import { MarketHeader } from "@/components/trading/market-header"
import { TradingLayout } from "@/components/trading/trading-layout"
import { InlineLoader } from "@/components/ui/page-loader"

export default function TradingDashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <InlineLoader message="Loading Trading Dashboard" />
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <MarketHeader />
      <TradingLayout />
    </div>
  )
}
