import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Example using CoinGecko API - replace with your preferred API
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch data from CoinGecko API');
    }

    const coinsData = await response.json();
    
    // Transform the data to match your portfolio structure
    const portfolioItems = coinsData.map((coin: { id: string; symbol: string; name: string; current_price: number; price_change_percentage_24h: number; market_cap: number }) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      amount: Math.random() * 100, // Mock amount - replace with actual user data
      price: coin.current_price,
      purchasePrice: coin.current_price * (0.8 + Math.random() * 0.4), // Mock purchase price
      purchaseDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      change24h: coin.price_change_percentage_24h || 0,
      marketCap: coin.market_cap || 0,
    }));

    // Calculate portfolio totals
    const totalValue = portfolioItems.reduce((sum: number, item: { amount: number; price: number }) => sum + (item.amount * item.price), 0);
    const totalCost = portfolioItems.reduce((sum: number, item: { amount: number; purchasePrice: number }) => sum + (item.amount * item.purchasePrice), 0);
    const totalPnL = totalValue - totalCost;
    const totalPnLPercentage = totalCost > 0 ? ((totalPnL / totalCost) * 100) : 0;

    return NextResponse.json({
      items: portfolioItems,
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercentage,
    });
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data' },
      { status: 500 }
    );
  }
}