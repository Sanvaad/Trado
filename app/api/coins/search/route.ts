import { NextRequest, NextResponse } from 'next/server'
import { memeCoinAPI } from '@/lib/meme-coin-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const blockchain = searchParams.get('blockchain')

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const coins = await memeCoinAPI.searchPairs(query, blockchain || undefined)

    return NextResponse.json({
      success: true,
      data: coins,
      query,
      blockchain: blockchain || 'all',
      count: coins.length
    })
  } catch (error) {
    console.error('Search API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search coins',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}