/* eslint-disable @typescript-eslint/no-explicit-any */
interface MarketTicker {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdated: number;
}

interface OrderBookLevel {
  price: number;
  quantity: number;
}

interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdated: number;
}

interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MarketStats {
  fundingRate: number;
  nextFunding: number;
  openInterest: number;
  indexPrice: number;
}

export class MarketDataService {
  private wsConnections: Map<string, WebSocket> = new Map();
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;

  // Map custom timeframes to Binance API intervals
  private mapTimeframeToInterval(timeframe: string): string {
    const timeframeMap: { [key: string]: string } = {
      'live': '1m',
      '1h': '1m',
      '24 hours': '1h',
      '7 days': '4h',
      '12 months': '1d',
    };
    
    return timeframeMap[timeframe] || '1m';
  }

  // Calculate days needed for historical data based on timeframe
  private getDaysForTimeframe(timeframe: string): number {
    const daysMap: { [key: string]: number } = {
      'live': 1,
      '1h': 1,
      '24 hours': 1,
      '7 days': 7,
      '12 months': 365,
    };
    
    return daysMap[timeframe] || 1;
  }

  // Calculate data points limit based on timeframe
  private getLimitForTimeframe(timeframe: string): number {
    const limitMap: { [key: string]: number } = {
      'live': 100,
      '1h': 60, // 60 minutes
      '24 hours': 24, // 24 hours
      '7 days': 42, // 7 days * 6 (4h intervals)
      '12 months': 365, // 365 days
    };
    
    return limitMap[timeframe] || 100;
  }

  // Binance API endpoints
  private readonly BINANCE_REST_API = "https://api.binance.com/api/v3";
  private readonly BINANCE_WS_API = "wss://stream.binance.com:9443/ws";

  // CoinGecko for additional market data
  private readonly COINGECKO_API = "https://api.coingecko.com/api/v3";

  async getMarketTicker(symbol: string = "BTCUSDT"): Promise<MarketTicker> {
    try {
      const response = await fetch(
        `${this.BINANCE_REST_API}/ticker/24hr?symbol=${symbol.toUpperCase()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        symbol: data.symbol,
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChange),
        changePercent24h: parseFloat(data.priceChangePercent),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume24h: parseFloat(data.volume),
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error("Error fetching market ticker:", error);
      // Return mock data as fallback
      return this.getMockTicker(symbol);
    }
  }

  async getOrderBook(
    symbol: string = "BTCUSDT",
    limit: number = 20
  ): Promise<OrderBook> {
    try {
      const response = await fetch(
        `${this.BINANCE_REST_API}/depth?symbol=${symbol.toUpperCase()}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        bids: data.bids.map(([price, quantity]: [string, string]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity),
        })),
        asks: data.asks.map(([price, quantity]: [string, string]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity),
        })),
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error("Error fetching order book:", error);
      return this.getMockOrderBook();
    }
  }

  async getCandlestickData(
    symbol: string = "BTCUSDT",
    interval: string = "1m",
    limit: number = 100,
    startTime?: number,
    endTime?: number
  ): Promise<CandlestickData[]> {
    try {
      const mappedInterval = this.mapTimeframeToInterval(interval);
      let url = `${this.BINANCE_REST_API}/klines?symbol=${symbol.toUpperCase()}&interval=${mappedInterval}&limit=${limit}`;

      if (startTime) {
        url += `&startTime=${startTime}`;
      }
      if (endTime) {
        url += `&endTime=${endTime}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return data.map((candle: any[]) => ({
        timestamp: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      }));
    } catch (error) {
      console.error("Error fetching candlestick data:", error);
      return this.getMockCandlestickData(limit, startTime, this.mapTimeframeToInterval(interval));
    }
  }

  async getHistoricalData(
    symbol: string = "BTCUSDT",
    interval: string = "1m",
    days?: number
  ): Promise<CandlestickData[]> {
    try {
      const actualDays = days || this.getDaysForTimeframe(interval);
      const limit = this.getLimitForTimeframe(interval);
      
      // For live chart, get recent data without time constraints
      if (interval === 'live') {
        return await this.getCandlestickData(symbol, interval, limit);
      }
      
      const endTime = Date.now();
      let startTime = endTime - actualDays * 24 * 60 * 60 * 1000;
      
      // For 1 hour timeframe, limit to exactly 1 hour
      if (interval === '1h') {
        startTime = endTime - 60 * 60 * 1000; // 1 hour
      }

      return await this.getCandlestickData(
        symbol,
        interval,
        limit,
        startTime,
        endTime
      );
    } catch (error) {
      console.error("Error fetching historical data:", error);
      const actualDays = days || this.getDaysForTimeframe(interval);
      const limit = this.getLimitForTimeframe(interval);
      let startTime = Date.now() - actualDays * 24 * 60 * 60 * 1000;
      
      if (interval === '1h') {
        startTime = Date.now() - 60 * 60 * 1000;
      }
      
      return this.getMockCandlestickData(limit, startTime, this.mapTimeframeToInterval(interval));
    }
  }

  async getMarketStats(): Promise<MarketStats> {
    try {
      // For demo purposes, return mock data as these require Binance Futures API
      return {
        fundingRate: 0.0001,
        nextFunding: Date.now() + 8 * 60 * 60 * 1000, // 8 hours from now
        openInterest: 125000000,
        indexPrice: 45250.5,
      };
    } catch (error) {
      console.error("Error fetching market stats:", error);
      return {
        fundingRate: 0.0001,
        nextFunding: Date.now() + 8 * 60 * 60 * 1000,
        openInterest: 125000000,
        indexPrice: 45250.5,
      };
    }
  }

  subscribeToTicker(
    symbol: string,
    callback: (ticker: MarketTicker) => void
  ): () => void {
    const key = `ticker_${symbol}`;

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key)!.add(callback);

    // Start WebSocket connection if not already connected
    if (!this.wsConnections.has(key)) {
      this.connectTickerWebSocket(symbol);
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(callback);
      if (this.subscribers.get(key)?.size === 0) {
        this.disconnectWebSocket(key);
      }
    };
  }

  subscribeToOrderBook(
    symbol: string,
    callback: (orderBook: OrderBook) => void
  ): () => void {
    const key = `orderbook_${symbol}`;

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key)!.add(callback);

    if (!this.wsConnections.has(key)) {
      this.connectOrderBookWebSocket(symbol);
    }

    return () => {
      this.subscribers.get(key)?.delete(callback);
      if (this.subscribers.get(key)?.size === 0) {
        this.disconnectWebSocket(key);
      }
    };
  }

  private connectTickerWebSocket(symbol: string): void {
    const key = `ticker_${symbol}`;
    const wsUrl = `${this.BINANCE_WS_API}/${symbol.toLowerCase()}@ticker`;

    try {
      const ws = new WebSocket(wsUrl);
      this.wsConnections.set(key, ws);

      ws.onopen = () => {
        console.log(`WebSocket connected for ticker: ${symbol}`);
        this.reconnectAttempts.set(key, 0);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const ticker: MarketTicker = {
            symbol: data.s,
            price: parseFloat(data.c),
            change24h: parseFloat(data.P),
            changePercent24h: parseFloat(data.P),
            high24h: parseFloat(data.h),
            low24h: parseFloat(data.l),
            volume24h: parseFloat(data.v),
            lastUpdated: Date.now(),
          };

          this.notifySubscribers(key, ticker);
        } catch (error) {
          console.error("Error parsing ticker data:", error);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for ${symbol}:`, error);
      };

      ws.onclose = () => {
        console.log(`WebSocket closed for ${symbol}`);
        this.handleReconnect(key, () => this.connectTickerWebSocket(symbol));
      };
    } catch (error) {
      console.error(`Error creating WebSocket for ${symbol}:`, error);
      // Fallback to polling
      this.startPolling(key, () => this.getMarketTicker(symbol));
    }
  }

  private connectOrderBookWebSocket(symbol: string): void {
    const key = `orderbook_${symbol}`;
    const wsUrl = `${this.BINANCE_WS_API}/${symbol.toLowerCase()}@depth20@100ms`;

    try {
      const ws = new WebSocket(wsUrl);
      this.wsConnections.set(key, ws);

      ws.onopen = () => {
        console.log(`WebSocket connected for order book: ${symbol}`);
        this.reconnectAttempts.set(key, 0);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const orderBook: OrderBook = {
            bids: data.bids.map(([price, quantity]: [string, string]) => ({
              price: parseFloat(price),
              quantity: parseFloat(quantity),
            })),
            asks: data.asks.map(([price, quantity]: [string, string]) => ({
              price: parseFloat(price),
              quantity: parseFloat(quantity),
            })),
            lastUpdated: Date.now(),
          };

          this.notifySubscribers(key, orderBook);
        } catch (error) {
          console.error("Error parsing order book data:", error);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for order book ${symbol}:`, error);
      };

      ws.onclose = () => {
        console.log(`WebSocket closed for order book ${symbol}`);
        this.handleReconnect(key, () => this.connectOrderBookWebSocket(symbol));
      };
    } catch (error) {
      console.error(
        `Error creating WebSocket for order book ${symbol}:`,
        error
      );
      this.startPolling(key, () => this.getOrderBook(symbol));
    }
  }

  private handleReconnect(key: string, reconnectFn: () => void): void {
    const attempts = this.reconnectAttempts.get(key) || 0;

    if (attempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
      console.log(`Reconnecting in ${delay}ms (attempt ${attempts + 1})`);

      setTimeout(() => {
        this.reconnectAttempts.set(key, attempts + 1);
        reconnectFn();
      }, delay);
    } else {
      console.error(`Max reconnection attempts reached for ${key}`);
    }
  }

  private startPolling(key: string, dataFetcher: () => Promise<any>): void {
    const interval = setInterval(async () => {
      try {
        const data = await dataFetcher();
        this.notifySubscribers(key, data);
      } catch (error) {
        console.error(`Polling error for ${key}:`, error);
      }
    }, 5000); // Poll every 5 seconds

    // Store interval for cleanup
    (this.wsConnections as any).set(`${key}_polling`, interval);
  }

  private notifySubscribers(key: string, data: any): void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in subscriber callback:", error);
        }
      });
    }
  }

  private disconnectWebSocket(key: string): void {
    const ws = this.wsConnections.get(key);
    if (ws) {
      ws.close();
      this.wsConnections.delete(key);
    }

    // Clear polling interval if exists
    const interval = (this.wsConnections as any).get(`${key}_polling`);
    if (interval) {
      clearInterval(interval);
      (this.wsConnections as any).delete(`${key}_polling`);
    }

    this.subscribers.delete(key);
    this.reconnectAttempts.delete(key);
  }

  // Fallback mock data methods
  private getMockTicker(symbol: string): MarketTicker {
    const basePrice = 45000;
    const randomChange = (Math.random() - 0.5) * 0.02; // ±2% change
    const price = basePrice * (1 + randomChange);

    return {
      symbol: symbol.toUpperCase(),
      price,
      change24h: price * randomChange,
      changePercent24h: randomChange * 100,
      high24h: price * 1.03,
      low24h: price * 0.97,
      volume24h: 50000,
      lastUpdated: Date.now(),
    };
  }

  private getMockOrderBook(): OrderBook {
    const basePrice = 45000;
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];

    for (let i = 0; i < 10; i++) {
      bids.push({
        price: basePrice - (i + 1) * 10,
        quantity: Math.random() * 5 + 0.1,
      });

      asks.push({
        price: basePrice + (i + 1) * 10,
        quantity: Math.random() * 5 + 0.1,
      });
    }

    return { bids, asks, lastUpdated: Date.now() };
  }

  private getMockCandlestickData(
    limit: number = 20,
    startTime?: number,
    interval?: string
  ): CandlestickData[] {
    const data: CandlestickData[] = [];
    let price = 45000;
    const now = Date.now();
    
    // Determine interval duration in milliseconds
    let intervalMs = 60000; // Default 1 minute
    switch (interval) {
      case '1m':
      case 'live':
        intervalMs = 60000; // 1 minute
        break;
      case '1h':
        intervalMs = 3600000; // 1 hour
        break;
      case '4h':
        intervalMs = 14400000; // 4 hours
        break;
      case '1d':
        intervalMs = 86400000; // 1 day
        break;
    }
    
    const baseTime = startTime || (now - limit * intervalMs);

    for (let i = 0; i < limit; i++) {
      const timestamp = baseTime + i * intervalMs;
      const change = (Math.random() - 0.5) * 0.02; // 2% volatility
      const open = price;
      const close = price * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.005);
      const low = Math.min(open, close) * (1 - Math.random() * 0.005);

      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume: Math.random() * 100 + 10,
      });

      price = close;
    }

    return data;
  }

  disconnect(): void {
    this.wsConnections.forEach((ws, key) => {
      this.disconnectWebSocket(key);
    });
    this.wsConnections.clear();
    this.subscribers.clear();
    this.reconnectAttempts.clear();
  }
}

// Singleton instance
export const marketDataService = new MarketDataService();
