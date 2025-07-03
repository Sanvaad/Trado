import { NextRequest, NextResponse } from 'next/server'
import { memeCoinAPI } from '@/lib/meme-coin-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blockchain: string }> }
) {
  try {
    const { blockchain } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const query = searchParams.get('q')

    let coins
    if (query) {
      coins = await memeCoinAPI.searchPairs(query, blockchain)
    } else {
      coins = await memeCoinAPI.getTopPairsByChain(blockchain, limit)
    }

    return NextResponse.json({
      success: true,
      data: coins,
      blockchain,
      count: coins.length
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch coin data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}