export interface PortfolioItem {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  price: number;
  purchasePrice: number;
  purchaseDate: string;
  change24h: number;
  marketCap: number;
}

export interface PortfolioData {
  items: PortfolioItem[];
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercentage: number;
}

export async function fetchPortfolioData(): Promise<PortfolioData> {
  // Replace with your actual API endpoint
  const response = await fetch('/api/portfolio');
  
  if (!response.ok) {
    throw new Error('Failed to fetch portfolio data');
  }
  
  const data = await response.json();
  return data;
}

export async function sellPortfolioItem(itemId: string, amount: number): Promise<void> {
  const response = await fetch('/api/portfolio/sell', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ itemId, amount }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to sell portfolio item');
  }
}