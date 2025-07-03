'use client'

import { useState, useEffect } from 'react'
import { useTradingStore } from '@/stores/trading-store'
import { useWalletStore } from '@/stores/wallet-store'
import { riskManager, RiskMetrics } from '@/lib/risk-management'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Target,
  Activity
} from 'lucide-react'

export function RiskDashboard() {
  const { positions, orders } = useTradingStore()
  const { usdBalance } = useWalletStore()
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)

  useEffect(() => {
    const accountBalance = usdBalance || 10000 // Mock balance
    const metrics = riskManager.calculateRiskMetrics(positions, orders, accountBalance)
    setRiskMetrics(metrics)
  }, [positions, orders, usdBalance])

  if (!riskMetrics) {
    return null
  }

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-400'
    if (score < 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-600'
      case 'medium':
        return 'bg-yellow-600'
      case 'high':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Risk Score Overview */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Overall Risk Score</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getRiskColor(riskMetrics.riskScore)}`}>
                {riskMetrics.riskScore.toFixed(1)}
              </span>
              <span className="text-gray-400">/100</span>
            </div>
          </div>
          <Progress 
            value={riskMetrics.riskScore} 
            className="h-3"
          />
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Liquidation Risk</span>
            <Badge className={getRiskBadgeColor(riskMetrics.liquidationRisk)}>
              {riskMetrics.liquidationRisk.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Financial Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-sm text-gray-400">Available Margin</span>
            </div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(riskMetrics.availableMargin)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-400">Margin Used</span>
            </div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(riskMetrics.marginUsed)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {(riskMetrics.marginUtilization * 100).toFixed(1)}% utilization
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {riskMetrics.totalUnrealizedPnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <span className="text-sm text-gray-400">Unrealized P&L</span>
            </div>
            <div className={`text-xl font-bold ${
              riskMetrics.totalUnrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(riskMetrics.totalUnrealizedPnl)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-gray-400">Total Exposure</span>
            </div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(riskMetrics.totalExposure)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Margin Utilization Progress */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Margin Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Used: {formatCurrency(riskMetrics.marginUsed)}</span>
              <span className="text-gray-400">Available: {formatCurrency(riskMetrics.availableMargin)}</span>
            </div>
            <Progress 
              value={riskMetrics.marginUtilization * 100} 
              className="h-4"
            />
            <div className="text-center text-sm text-gray-400">
              {(riskMetrics.marginUtilization * 100).toFixed(1)}% of total margin
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Warnings */}
      {riskMetrics.warnings.length > 0 && (
        <Card className="bg-gray-900 border-red-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Risk Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {riskMetrics.warnings.map((warning, index) => (
              <Alert key={index} className="border-red-600 bg-red-950/50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-200">
                  {warning}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Position Recommendations */}
      {positions.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">Position Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {positions.map((position) => {
              const recommendations = riskManager.getPositionRecommendations(
                position, 
                position.markPrice
              )
              
              if (recommendations.length === 0) return null

              return (
                <div key={position.id} className="border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{position.symbol}</span>
                    <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                      {position.side.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {recommendations.map((rec, index) => (
                    <Alert 
                      key={index} 
                      className={`mt-2 ${
                        rec.urgency === 'high' 
                          ? 'border-red-600 bg-red-950/50' 
                          : rec.urgency === 'medium'
                          ? 'border-yellow-600 bg-yellow-950/50'
                          : 'border-blue-600 bg-blue-950/50'
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className={
                        rec.urgency === 'high' 
                          ? 'text-red-200' 
                          : rec.urgency === 'medium'
                          ? 'text-yellow-200'
                          : 'text-blue-200'
                      }>
                        <strong>{rec.action}</strong> - {rec.reason}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}