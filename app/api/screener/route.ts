import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const blockchain = searchParams.get('blockchain') || '';
    const sortBy = searchParams.get('sortBy') || 'rank';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    // Map frontend sort values to CoinGecko API values
    const sortMap: { [key: string]: string } = {
      'rank': 'market_cap',
      'price': 'current_price',
      'change24h': 'price_change_percentage_24h',
      'volume24h': 'total_volume',
      'marketCap': 'market_cap'
    };
    
    const mappedSort = sortMap[sortBy] || 'market_cap';
    const orderSuffix = sortOrder === 'desc' ? '_desc' : '_asc';
    
    // Build CoinGecko API URL
    let apiUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=${mappedSort}${orderSuffix}&per_page=${limit}&page=${page}&sparkline=false`;
    
    // Add category filter if blockchain is specified
    if (blockchain) {
      // Map blockchain names to CoinGecko categories
      const categoryMap: { [key: string]: string } = {
        'ethereum': 'ethereum-ecosystem',
        'solana': 'solana-ecosystem',
        'binance': 'binance-smart-chain',
        'polygon': 'polygon-ecosystem',
        'avalanche': 'avalanche-ecosystem',
        'arbitrum': 'arbitrum-ecosystem',
        'optimism': 'optimism-ecosystem',
      };
      
      const category = categoryMap[blockchain.toLowerCase()];
      if (category) {
        apiUrl += `&category=${category}`;
      }
    }
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data from CoinGecko API');
    }

    const coinsData = await response.json();
    
    // Transform the data to match your screener structure
    const coins = coinsData.map((coin: { id: string; symbol: string; name: string; current_price: number; price_change_percentage_24h: number; total_volume: number; market_cap: number; image: string; market_cap_rank: number }) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h || 0,
      volume24h: coin.total_volume || 0,
      marketCap: coin.market_cap || 0,
      image: coin.image,
      rank: coin.market_cap_rank || 0,
      blockchain: blockchain || 'multi-chain',
    }));

    return NextResponse.json({
      coins,
      totalCoins: coins.length,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching screener data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch screener data' },
      { status: 500 }
    );
  }
}