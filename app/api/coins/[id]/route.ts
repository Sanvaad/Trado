import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: coinId } = await params;
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch coin data from CoinGecko API');
    }

    const coinData = await response.json();
    
    // Transform the data to match your coin structure
    const coin = {
      id: coinData.id,
      symbol: coinData.symbol.toUpperCase(),
      name: coinData.name,
      price: coinData.market_data?.current_price?.usd || 0,
      change24h: coinData.market_data?.price_change_percentage_24h || 0,
      volume24h: coinData.market_data?.total_volume?.usd || 0,
      marketCap: coinData.market_data?.market_cap?.usd || 0,
      image: coinData.image?.large || coinData.image?.small || '',
      rank: coinData.market_cap_rank || 0,
      blockchain: 'multi-chain',
    };

    return NextResponse.json(coin);
  } catch (error) {
    console.error('Error fetching coin data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin data' },
      { status: 500 }
    );
  }
}