"use client";

import { OrderBook } from "./order-book";
import { TradingPanel } from "./trading-panel";

export function TradingLayout() {
  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Right side - Order Book */}
      <div className="flex-1 border-r border-zinc-800">
        <OrderBook />
      </div>

      {/* Far Right - Trading Panel */}
      <div className="w-80">
        <TradingPanel />
      </div>
    </div>
  );
}
