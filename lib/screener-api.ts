export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  image: string;
  rank: number;
  blockchain: string;
}

export interface ScreenerData {
  coins: CoinData[];
  totalCoins: number;
  page: number;
  limit: number;
}

export interface ScreenerFilters {
  blockchain?: string;
  minPrice?: number;
  maxPrice?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  sortBy?: 'price' | 'change24h' | 'volume24h' | 'marketCap' | 'rank';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function fetchScreenerData(filters: ScreenerFilters = {}): Promise<ScreenerData> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });
  
  // Replace with your actual API endpoint
  const response = await fetch(`/api/screener?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch screener data');
  }
  
  const data = await response.json();
  return data;
}

export async function fetchCoinDetails(coinId: string): Promise<CoinData> {
  const response = await fetch(`/api/coins/${coinId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch coin details');
  }
  
  const data = await response.json();
  return data;
}