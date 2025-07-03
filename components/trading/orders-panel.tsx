/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useTradingStore } from "@/stores/trading-store";
import { useWalletStore } from "@/stores/wallet-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Order, Trade } from "@/types/trading";

interface OrderCardProps {
  order: Order;
  onCancel: (orderId: string) => void;
  isCancelling: boolean;
}

function OrderCard({ order, onCancel, isCancelling }: OrderCardProps) {
  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "filled":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-400";
      case "filled":
        return "text-green-400";
      case "cancelled":
        return "text-gray-400";
      case "rejected":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const canCancel = order.status === "pending";
  const orderValue = order.quantity * (order.price || 0);

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-white">
              {order.symbol}
            </CardTitle>
            <Badge
              variant={order.side === "buy" ? "default" : "destructive"}
              className={order.side === "buy" ? "bg-green-600" : "bg-red-600"}
            >
              {order.side.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {order.type.toUpperCase()}
            </Badge>
            {(order.leverage || 1) > 1 && (
              <Badge variant="secondary" className="text-xs">
                {order.leverage || 1}x
              </Badge>
            )}
          </div>
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(order.id)}
              disabled={isCancelling}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Quantity</div>
            <div className="text-white font-mono">
              {order.quantity.toFixed(6)} BTC
            </div>
          </div>
          <div>
            <div className="text-gray-400">Price</div>
            <div className="text-white font-mono">
              ${order.price?.toLocaleString() || 'Market'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Value</div>
            <div className="text-white font-mono">
              ${orderValue.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Time in Force</div>
            <div className="text-white">
              {(order as any).timeInForce || "GTC"}
            </div>
          </div>
        </div>

        {/* Filled Information */}
        {order.status === "filled" &&
          (order as any).filledQuantity &&
          (order as any).averagePrice && (
            <div className="border-t border-gray-700 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Filled Qty</div>
                  <div className="text-white font-mono">
                    {((order as any).filledQuantity || 0).toFixed(6)} BTC
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Avg Price</div>
                  <div className="text-white font-mono">
                    ${((order as any).averagePrice || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Status and Actions */}
        <div className="flex items-center justify-between border-t border-gray-700 pt-4">
          <div className="flex items-center gap-2">
            {getStatusIcon(order.status)}
            <span
              className={`text-sm font-medium ${getStatusColor(order.status)}`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>

          <div className="text-xs text-gray-400">
            {new Date(order.timestamp).toLocaleString()}
          </div>
        </div>

        {order.status === "rejected" && (order as any).rejectedReason && (
          <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
            {(order as any).rejectedReason}
          </div>
        )}

        {canCancel && (
          <Button
            onClick={() => onCancel(order.id)}
            disabled={isCancelling}
            variant="outline"
            className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
          >
            {isCancelling ? "Cancelling..." : "Cancel Order"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface TradeCardProps {
  trade: Trade;
}

function TradeCard({ trade }: TradeCardProps) {
  const tradeValue = trade.quantity * trade.price;

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{trade.symbol}</span>
            <Badge
              variant={trade.side === "buy" ? "default" : "destructive"}
              className={trade.side === "buy" ? "bg-green-600" : "bg-red-600"}
            >
              {trade.side.toUpperCase()}
            </Badge>
            {((trade as any).leverage || 1) > 1 && (
              <Badge variant="secondary" className="text-xs">
                {(trade as any).leverage || 1}x
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {new Date(trade.timestamp).toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Quantity</div>
            <div className="text-white font-mono">
              {trade.quantity.toFixed(6)} BTC
            </div>
          </div>
          <div>
            <div className="text-gray-400">Price</div>
            <div className="text-white font-mono">
              ${trade.price.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mt-2">
          <div>
            <div className="text-gray-400">Value</div>
            <div className="text-white font-mono">
              ${tradeValue.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Fee</div>
            <div className="text-white font-mono">${trade.fee.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OrdersPanel() {
  const { orders, trades, cancelOrder, refreshPositions } = useTradingStore();
  const { isConnected } = useWalletStore();
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(
    new Set()
  );

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      refreshPositions(); // This also refreshes orders and trades
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected, refreshPositions]);

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrders((prev) => new Set(prev).add(orderId));

    try {
      const success = await cancelOrder(orderId);
      if (!success) {
        console.error("Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
    } finally {
      setCancellingOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Filter orders by status
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const filledOrders = orders.filter((order) => order.status === "filled");
  const otherOrders = orders.filter(
    (order) => !["pending", "filled"].includes(order.status)
  );

  if (!isConnected) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 mb-4">
          Connect your wallet to view orders
        </div>
        <Button variant="outline">Connect Wallet</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger
            value="orders"
            className="data-[state=active]:bg-gray-700"
          >
            Open Orders ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-gray-700"
          >
            Order History
          </TabsTrigger>
          <TabsTrigger
            value="trades"
            className="data-[state=active]:bg-gray-700"
          >
            Trade History ({trades.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No open orders</div>
              <div className="text-sm text-gray-500">
                Place an order to see it here
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onCancel={handleCancelOrder}
                  isCancelling={cancellingOrders.has(order.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {[...filledOrders, ...otherOrders].length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No order history</div>
              <div className="text-sm text-gray-500">
                Your completed orders will appear here
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {[...filledOrders, ...otherOrders]
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onCancel={handleCancelOrder}
                    isCancelling={false}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trades" className="space-y-4">
          {trades.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No trade history</div>
              <div className="text-sm text-gray-500">
                Your executed trades will appear here
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {trades
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((trade) => (
                  <TradeCard key={trade.id} trade={trade} />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
