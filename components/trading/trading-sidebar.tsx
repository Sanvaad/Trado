"use client"

import { OrderBook } from "./order-book"
import { TradingPanel } from "./trading-panel"

export function TradingSidebar() {
  return (
    <div className="w-[800px] bg-black flex">
      {/* Left side - Order Book */}
      <div className="w-1/2 border-r border-zinc-800">
        <OrderBook />
      </div>
      
      {/* Right side - Trading Panel */}
      <div className="w-1/2">
        <TradingPanel />
      </div>
    </div>
  )
}