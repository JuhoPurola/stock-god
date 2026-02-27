import { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiClient } from '../../lib/api-client';
import type { Strategy, Backtest } from '@stock-picker/shared';
import { formatPercent } from '@stock-picker/shared';
import {
  GitCompare,
  Award,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface StrategyComparisonProps {
  strategies: Strategy[];
}

interface ComparisonResult {
  strategy: Strategy;
  backtest?: Backtest;
  loading: boolean;
}

export function StrategyComparison({ strategies: allStrategies }: StrategyComparisonProps) {
  const [strategyA, setStrategyA] = useState<Strategy | null>(null);
  const [strategyB, setStrategyB] = useState<Strategy | null>(null);
  const [resultA, setResultA] = useState<ComparisonResult | null>(null);
  const [resultB, setResultB] = useState<ComparisonResult | null>(null);
  const [comparing, setComparing] = useState(false);

  const runComparison = async () => {
    if (!strategyA || !strategyB) return;

    setComparing(true);
    setResultA({ strategy: strategyA, loading: true });
    setResultB({ strategy: strategyB, loading: true });

    try {
      // Run backtests in parallel
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1); // 1 year

      const [backtestA, backtestB] = await Promise.all([
        apiClient.createBacktest({
          name: `Comparison: ${strategyA.name}`,
          config: {
            strategyId: strategyA.id,
            portfolioId: strategyA.portfolioId,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            initialCash: 100000,
            commission: 1.0,
            slippage: 0.001,
          },
        }),
        apiClient.createBacktest({
          name: `Comparison: ${strategyB.name}`,
          config: {
            strategyId: strategyB.id,
            portfolioId: strategyB.portfolioId,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            initialCash: 100000,
            commission: 1.0,
            slippage: 0.001,
          },
        }),
      ]);

      // Wait for completion (simplified)
      await new Promise(resolve => setTimeout(resolve, 3000));

      const [completedA, completedB] = await Promise.all([
        apiClient.getBacktest(backtestA.id),
        apiClient.getBacktest(backtestB.id),
      ]);

      setResultA({ strategy: strategyA, backtest: completedA, loading: false });
      setResultB({ strategy: strategyB, backtest: completedB, loading: false });
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setComparing(false);
    }
  };

  const clearComparison = () => {
    setResultA(null);
    setResultB(null);
  };

  // Prepare radar chart data
  const getRadarData = () => {
    if (!resultA?.backtest?.performance || !resultB?.backtest?.performance) return [];

    const perfA = resultA.backtest.performance;
    const perfB = resultB.backtest.performance;

    return [
      {
        metric: 'Return %',
        A: Math.max(0, perfA.totalReturnPercent || 0),
        B: Math.max(0, perfB.totalReturnPercent || 0),
      },
      {
        metric: 'Sharpe',
        A: Math.max(0, perfA.sharpeRatio * 20), // Scale for visibility
        B: Math.max(0, perfB.sharpeRatio * 20),
      },
      {
        metric: 'Win Rate',
        A: perfA.winRate || 0,
        B: perfB.winRate || 0,
      },
      {
        metric: 'Profit Factor',
        A: Math.min(100, (perfA.profitFactor || 0) * 20), // Scale and cap
        B: Math.min(100, (perfB.profitFactor || 0) * 20),
      },
      {
        metric: 'Trades',
        A: Math.min(100, perfA.totalTrades || 0),
        B: Math.min(100, perfB.totalTrades || 0),
      },
    ];
  };

  // Prepare bar chart data
  const getBarChartData = () => {
    if (!resultA?.backtest?.performance || !resultB?.backtest?.performance) return [];

    const perfA = resultA.backtest.performance;
    const perfB = resultB.backtest.performance;

    return [
      {
        metric: 'Total Return',
        A: perfA.totalReturnPercent || 0,
        B: perfB.totalReturnPercent || 0,
      },
      {
        metric: 'Sharpe Ratio',
        A: perfA.sharpeRatio,
        B: perfB.sharpeRatio,
      },
      {
        metric: 'Max Drawdown',
        A: -perfA.maxDrawdown,
        B: -perfB.maxDrawdown,
      },
      {
        metric: 'Win Rate',
        A: perfA.winRate || 0,
        B: perfB.winRate || 0,
      },
    ];
  };

  const getWinner = (metricA?: number, metricB?: number, lowerIsBetter = false): 'A' | 'B' | 'tie' => {
    if (metricA === undefined || metricB === undefined) return 'tie';
    if (lowerIsBetter) {
      if (metricA < metricB) return 'A';
      if (metricB < metricA) return 'B';
    } else {
      if (metricA > metricB) return 'A';
      if (metricB > metricA) return 'B';
    }
    return 'tie';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <GitCompare className="w-5 h-5 mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold">Strategy A/B Comparison</h2>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Compare two strategies side-by-side on the same historical period
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strategy A Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strategy A
              </label>
              <select
                value={strategyA?.id || ''}
                onChange={(e) => {
                  const strategy = allStrategies.find(s => s.id === e.target.value);
                  setStrategyA(strategy || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Strategy A...</option>
                {allStrategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Strategy B Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strategy B
              </label>
              <select
                value={strategyB?.id || ''}
                onChange={(e) => {
                  const strategy = allStrategies.find(s => s.id === e.target.value);
                  setStrategyB(strategy || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Strategy B...</option>
                {allStrategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 mt-4">
            {(resultA || resultB) && (
              <Button variant="secondary" onClick={clearComparison}>
                Clear Results
              </Button>
            )}
            <Button
              onClick={runComparison}
              disabled={!strategyA || !strategyB || comparing}
              loading={comparing}
            >
              Run Comparison
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {(resultA || resultB) && (
        <>
          {/* Performance Metrics Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strategy A Results */}
            {resultA && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{resultA.strategy.name}</h3>
                    <Badge variant="default">Strategy A</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {resultA.loading ? (
                    <div className="text-center py-8 text-gray-500">Running backtest...</div>
                  ) : resultA.backtest?.performance ? (
                    <div className="space-y-3">
                      <MetricRow
                        label="Total Return"
                        value={formatPercent(resultA.backtest.performance.totalReturnPercent || 0, 2, true)}
                        winner={getWinner(
                          resultA.backtest.performance.totalReturnPercent,
                          resultB?.backtest?.performance?.totalReturnPercent
                        )}
                        position="A"
                      />
                      <MetricRow
                        label="Sharpe Ratio"
                        value={resultA.backtest.performance.sharpeRatio.toFixed(2)}
                        winner={getWinner(
                          resultA.backtest.performance.sharpeRatio,
                          resultB?.backtest?.performance?.sharpeRatio
                        )}
                        position="A"
                      />
                      <MetricRow
                        label="Max Drawdown"
                        value={`-${resultA.backtest.performance.maxDrawdown.toFixed(2)}%`}
                        winner={getWinner(
                          resultA.backtest.performance.maxDrawdown,
                          resultB?.backtest?.performance?.maxDrawdown,
                          true
                        )}
                        position="A"
                        danger
                      />
                      <MetricRow
                        label="Win Rate"
                        value={`${(resultA.backtest.performance.winRate || 0).toFixed(1)}%`}
                        winner={getWinner(
                          resultA.backtest.performance.winRate,
                          resultB?.backtest?.performance?.winRate
                        )}
                        position="A"
                      />
                      <MetricRow
                        label="Total Trades"
                        value={resultA.backtest.performance.totalTrades.toString()}
                        winner={getWinner(
                          resultA.backtest.performance.totalTrades,
                          resultB?.backtest?.performance?.totalTrades
                        )}
                        position="A"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No results</div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Strategy B Results */}
            {resultB && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{resultB.strategy.name}</h3>
                    <Badge variant="default">Strategy B</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {resultB.loading ? (
                    <div className="text-center py-8 text-gray-500">Running backtest...</div>
                  ) : resultB.backtest?.performance ? (
                    <div className="space-y-3">
                      <MetricRow
                        label="Total Return"
                        value={formatPercent(resultB.backtest.performance.totalReturnPercent || 0, 2, true)}
                        winner={getWinner(
                          resultA?.backtest?.performance?.totalReturnPercent,
                          resultB.backtest.performance.totalReturnPercent
                        )}
                        position="B"
                      />
                      <MetricRow
                        label="Sharpe Ratio"
                        value={resultB.backtest.performance.sharpeRatio.toFixed(2)}
                        winner={getWinner(
                          resultA?.backtest?.performance?.sharpeRatio,
                          resultB.backtest.performance.sharpeRatio
                        )}
                        position="B"
                      />
                      <MetricRow
                        label="Max Drawdown"
                        value={`-${resultB.backtest.performance.maxDrawdown.toFixed(2)}%`}
                        winner={getWinner(
                          resultA?.backtest?.performance?.maxDrawdown,
                          resultB.backtest.performance.maxDrawdown,
                          true
                        )}
                        position="B"
                        danger
                      />
                      <MetricRow
                        label="Win Rate"
                        value={`${(resultB.backtest.performance.winRate || 0).toFixed(1)}%`}
                        winner={getWinner(
                          resultA?.backtest?.performance?.winRate,
                          resultB.backtest.performance.winRate
                        )}
                        position="B"
                      />
                      <MetricRow
                        label="Total Trades"
                        value={resultB.backtest.performance.totalTrades.toString()}
                        winner={getWinner(
                          resultA?.backtest?.performance?.totalTrades,
                          resultB.backtest.performance.totalTrades
                        )}
                        position="B"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No results</div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Visual Comparisons */}
          {resultA?.backtest?.performance && resultB?.backtest?.performance && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Performance Radar</h3>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={getRadarData()}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis />
                      <Radar
                        name={strategyA?.name}
                        dataKey="A"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.5}
                      />
                      <Radar
                        name={strategyB?.name}
                        dataKey="B"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.5}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Side-by-Side Metrics</h3>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getBarChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="A" fill="#3b82f6" name={strategyA?.name} />
                      <Bar dataKey="B" fill="#10b981" name={strategyB?.name} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
  winner: 'A' | 'B' | 'tie';
  position: 'A' | 'B';
  danger?: boolean;
}

function MetricRow({ label, value, winner, position, danger }: MetricRowProps) {
  const isWinner = winner === position;
  const isTie = winner === 'tie';

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center space-x-2">
        <span
          className={`text-sm font-semibold ${
            danger
              ? 'text-danger-600'
              : isWinner
              ? 'text-success-600'
              : 'text-gray-900'
          }`}
        >
          {value}
        </span>
        {isWinner && !isTie && <Award className="w-4 h-4 text-warning-500" />}
      </div>
    </div>
  );
}
