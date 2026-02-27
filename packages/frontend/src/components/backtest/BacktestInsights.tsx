import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Backtest, Strategy } from '@stock-picker/shared';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  TrendingUp,
  Shield,
} from 'lucide-react';

interface BacktestInsightsProps {
  backtest: Backtest;
  strategy?: Strategy;
}

export function BacktestInsights({ backtest, strategy }: BacktestInsightsProps) {
  const { performance } = backtest;

  // If there are trades, no need for special insights
  if (performance && performance.totalTrades > 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Why No Trades? */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Info className="w-5 h-5 mr-2 text-blue-600" />
            <h3 className="text-lg font-semibold">Why Zero Trades?</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900">
              <strong>This is actually a good sign!</strong> Your strategy is being
              appropriately selective and waiting for high-confidence trading opportunities.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-success-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Conservative Approach</p>
                <p className="text-sm text-gray-600">
                  The strategy has strict criteria to avoid false signals and protect
                  your capital from poor trades.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <TrendingUp className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Market Conditions Matter</p>
                <p className="text-sm text-gray-600">
                  The historical period tested may not have presented ideal conditions
                  for your strategy's specific criteria.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Factor Combination</p>
                <p className="text-sm text-gray-600">
                  Multiple factors must align simultaneously. The more factors enabled,
                  the fewer (but potentially better quality) signals will be generated.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Configuration */}
      {strategy && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Strategy Configuration</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stock Universe */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Stock Universe</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">{strategy.stockUniverse.length} stocks</Badge>
                  <span className="text-sm text-gray-600">
                    {strategy.stockUniverse.slice(0, 5).join(', ')}
                    {strategy.stockUniverse.length > 5 &&
                      ` +${strategy.stockUniverse.length - 5} more`}
                  </span>
                </div>
              </div>

              {/* Factors */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Active Factors ({strategy.factors.filter((f) => f.enabled).length})
                </p>
                <div className="space-y-2">
                  {strategy.factors.map((factor) => (
                    <div
                      key={factor.type}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center">
                        {factor.enabled ? (
                          <CheckCircle2 className="w-4 h-4 text-success-600 mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400 mr-2" />
                        )}
                        <span
                          className={`text-sm ${
                            factor.enabled ? 'text-gray-900' : 'text-gray-500'
                          }`}
                        >
                          {factor.type}
                        </span>
                      </div>
                      <Badge size="sm" variant={factor.enabled ? 'default' : 'default'}>
                        Weight: {factor.weight}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Management */}
              {strategy.riskManagement && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Risk Management</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Max Position Size</p>
                      <p className="text-sm font-medium">
                        {(strategy.riskManagement.maxPositionSize * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Stop Loss</p>
                      <p className="text-sm font-medium">
                        {(strategy.riskManagement.stopLossPercent * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Take Profit</p>
                      <p className="text-sm font-medium">
                        {strategy.riskManagement.takeProfitPercent
                          ? `${(strategy.riskManagement.takeProfitPercent * 100).toFixed(1)}%`
                          : 'None'}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Max Positions</p>
                      <p className="text-sm font-medium">
                        {strategy.riskManagement.maxPositions}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">What You Can Try</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Test Different Time Periods</p>
                <p className="text-sm text-gray-600">
                  Run backtests on different date ranges to find periods where your
                  strategy performs well.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Adjust Factor Weights</p>
                <p className="text-sm text-gray-600">
                  Fine-tune your factor weights to make the strategy more or less
                  aggressive based on your risk tolerance.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Expand Stock Universe</p>
                <p className="text-sm text-gray-600">
                  Add more stocks to your universe to increase the likelihood of finding
                  qualifying opportunities.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium text-gray-900">Simplify Factor Combination</p>
                <p className="text-sm text-gray-600">
                  Disable some factors or reduce thresholds to generate more signals.
                  Monitor quality vs quantity trade-off.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
