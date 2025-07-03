import { NextRequest, NextResponse } from 'next/server'
import { tradingPlatform } from '@/lib/trading-platform'
import { blockchainPriceFeeds } from '@/lib/blockchain-price-feeds'
import { dexMonitor } from '@/lib/dex-monitor'
import { feeCollectionSystem } from '@/lib/fee-collection'

// Initialize platform on first request
let platformInitialized = false

async function ensurePlatformInitialized() {
  if (!platformInitialized) {
    console.log('🚀 Initializing trading platform...')
    await tradingPlatform.initialize()
    await tradingPlatform.startPopularTokenMonitoring()
    platformInitialized = true
  }
}

// GET /api/platform - Get platform status
export async function GET(request: NextRequest) {
  try {
    await ensurePlatformInitialized()
    
    const url = new URL(request.url)
    const endpoint = url.searchParams.get('endpoint')

    switch (endpoint) {
      case 'status':
        const status = await tradingPlatform.getStatus()
        return NextResponse.json({ success: true, data: status })

      case 'metrics':
        const metrics = tradingPlatform.getMetrics()
        return NextResponse.json({ success: true, data: metrics })

      case 'prices':
        const allPrices = Array.from(blockchainPriceFeeds.getAllPrices().entries()).map(([key, data]) => ({
          key,
          ...data
        }))
        return NextResponse.json({ success: true, data: allPrices })

      case 'revenue':
        const revenueMetrics = feeCollectionSystem.getRevenueMetrics()
        const revenueReport = feeCollectionSystem.generateRevenueReport()
        return NextResponse.json({ 
          success: true, 
          data: { 
            metrics: revenueMetrics, 
            report: revenueReport 
          } 
        })

      case 'new-pairs':
        const recentPairs = dexMonitor.getRecentPairs(20)
        return NextResponse.json({ success: true, data: recentPairs })

      case 'health':
        return NextResponse.json({ 
          success: true, 
          data: { 
            status: 'healthy',
            timestamp: Date.now(),
            uptime: tradingPlatform.getMetrics().uptime,
            services: {
              priceFeeds: blockchainPriceFeeds.getAllPrices().size > 0,
              dexMonitor: dexMonitor.getStatus().isMonitoring,
              feeCollection: true,
              swapEngine: true
            }
          } 
        })

      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'Trado Trading Platform API',
            version: '1.0.0',
            endpoints: [
              '/api/platform?endpoint=status',
              '/api/platform?endpoint=metrics', 
              '/api/platform?endpoint=prices',
              '/api/platform?endpoint=revenue',
              '/api/platform?endpoint=new-pairs',
              '/api/platform?endpoint=health'
            ],
            features: [
              'Real-time blockchain price feeds',
              'DEX monitoring for new meme coins',
              'Telegram trading bot',
              'Automated fee collection',
              'Multi-chain swap engine',
              'Revenue analytics'
            ]
          }
        })
    }
  } catch (error) {
    console.error('Platform API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/platform - Platform actions
export async function POST(request: NextRequest) {
  try {
    await ensurePlatformInitialized()
    
    const body = await request.json()
    const { action, params } = body

    switch (action) {
      case 'start-monitoring':
        if (params?.tokenAddress && params?.blockchain) {
          await blockchainPriceFeeds.startPriceMonitoring(params.tokenAddress, params.blockchain)
          return NextResponse.json({ 
            success: true, 
            message: `Started monitoring ${params.tokenAddress} on ${params.blockchain}` 
          })
        }
        return NextResponse.json({ success: false, error: 'Missing tokenAddress or blockchain' }, { status: 400 })

      case 'stop-monitoring':
        if (params?.tokenAddress && params?.blockchain) {
          blockchainPriceFeeds.stopMonitoring(params.tokenAddress, params.blockchain)
          return NextResponse.json({ 
            success: true, 
            message: `Stopped monitoring ${params.tokenAddress} on ${params.blockchain}` 
          })
        }
        return NextResponse.json({ success: false, error: 'Missing tokenAddress or blockchain' }, { status: 400 })

      case 'update-fees':
        if (params?.feeStructure) {
          feeCollectionSystem.updateFeeStructure(params.feeStructure)
          return NextResponse.json({ 
            success: true, 
            message: 'Fee structure updated' 
          })
        }
        return NextResponse.json({ success: false, error: 'Missing feeStructure' }, { status: 400 })

      case 'pause-fees':
        feeCollectionSystem.pauseFeeCollection()
        return NextResponse.json({ 
          success: true, 
          message: 'Fee collection paused' 
        })

      case 'resume-fees':
        feeCollectionSystem.resumeFeeCollection()
        return NextResponse.json({ 
          success: true, 
          message: 'Fee collection resumed' 
        })

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Unknown action',
          availableActions: [
            'start-monitoring',
            'stop-monitoring', 
            'update-fees',
            'pause-fees',
            'resume-fees'
          ]
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Platform action error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}