import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../lib/api-client';
import type { Backtest } from '@stock-picker/shared';
import { BacktestStatus } from '@stock-picker/shared';
import { formatPercent } from '@stock-picker/shared';
import {
  BarChart2,
  ArrowLeft,
  Award,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';

export function BacktestComparisonPage() {
  const navigate = useNavigate();
  const [backtests, setBacktests] = useState<Backtest[]>([]);
  const [selectedBacktests, setSelectedBacktests] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBacktests();
  }, []);

  const loadBacktests = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getBacktests(50);
      const completed = data.filter(b => b.status === BacktestStatus.COMPLETED && b.performance);
      setBacktests(completed);
    } catch (error) {
      console.error('Failed to load backtests:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBacktest = (id: string) => {
    const newSelected = new Set(selectedBacktests);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (newSelected.size >= 5) {
        alert('Maximum 5 backtests can be compared at once');
        return;
      }
      newSelected.add(id);
    }
    setSelectedBacktests(newSelected);
  };

  const selectedBacktestData = backtests.filter(b => selectedBacktests.has(b.id));

  // Prepare comparison data
  const getComparisonData = () => {
    return selectedBacktestData.map(b => ({
      name: b.name || 'Backtest',
      return: b.performance?.totalReturnPercent || 0,
      sharpe: b.performance?.sharpeRatio || 0,
      maxDD: b.performance?.maxDrawdown || 0,
      winRate: b.performance?.winRate || 0,
      trades: b.performance?.totalTrades || 0,
      profitFactor: b.performance?.profitFactor || 0,
    }));
  };

  // Risk-Return scatter data
  const getRiskReturnData = () => {
    return selectedBacktestData.map(b => ({
      risk: b.performance?.maxDrawdown || 0,
      return: b.performance?.totalReturnPercent || 0,
      name: b.name || 'Backtest',
      z: 200,
    }));
  };

  // Find best backtest overall
  const getBestBacktest = () => {
    if (selectedBacktestData.length === 0) return null;

    return selectedBacktestData.reduce((best, current) => {
      const currentScore = (current.performance?.sharpeRatio || 0) * 10 +
        (current.performance?.totalReturnPercent || 0);
      const bestScore = (best.performance?.sharpeRatio || 0) * 10 +
        (best.performance?.totalReturnPercent || 0);
      return currentScore > bestScore ? current : best;
    });
  };

  const bestBacktest = getBestBacktest();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading backtests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center mb-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(-1)}
              className="mr-3"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Backtest Comparison</h1>
          </div>
          <p className="text-gray-600">
            Compare performance of multiple backtest runs
          </p>
        </div>
        <Badge variant="default">
          {selectedBacktests.size} / 5 selected
        </Badge>
      </div>

      {/* Backtest Selector */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Select Backtests to Compare (max 5)</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {backtests.map((backtest) => {
              const isSelected = selectedBacktests.has(backtest.id);
              const isBest = bestBacktest?.id === backtest.id && selectedBacktests.size > 1;

              return (
                <button
                  key={backtest.id}
                  onClick={() => toggleBacktest(backtest.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-gray-900 flex-1">
                      {backtest.name || 'Backtest'}
                    </p>
                    {isBest && <Award className="w-4 h-4 text-warning-500 ml-2" />}
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-600 ml-2" />}
                  </div>
                  {backtest.performance && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Return:</span>
                        <span
                          className={`font-medium ${
                            (backtest.performance.totalReturnPercent || 0) >= 0
                              ? 'text-success-600'
                              : 'text-danger-600'
                          }`}
                        >
                          {formatPercent(backtest.performance.totalReturnPercent || 0, 1, true)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Sharpe:</span>
                        <span className="font-medium text-gray-900">
                          {backtest.performance.sharpeRatio.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Trades:</span>
                        <span className="font-medium text-gray-900">
                          {backtest.performance.totalTrades}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Charts */}
      {selectedBacktestData.length > 0 && (
        <>
          {/* Best Backtest Highlight */}
          {bestBacktest && selectedBacktests.size > 1 && (
            <Card>
              <CardContent>
                <div className="flex items-center">
                  <Award className="w-8 h-8 text-warning-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Best Overall Performance</p>
                    <p className="text-xl font-bold text-gray-900">
                      {bestBacktest.name || 'Backtest'}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Return</p>
                      <p className="text-lg font-bold text-success-600">
                        {formatPercent(bestBacktest.performance?.totalReturnPercent || 0, 1, true)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Sharpe</p>
                      <p className="text-lg font-bold text-gray-900">
                        {bestBacktest.performance?.sharpeRatio.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Returns Comparison */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Total Returns</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getComparisonData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="return" fill="#10b981" name="Return %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sharpe Ratio Comparison */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Sharpe Ratio</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getComparisonData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sharpe" fill="#3b82f6" name="Sharpe Ratio" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Max Drawdown Comparison */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Max Drawdown</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getComparisonData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="maxDD" fill="#ef4444" name="Max Drawdown %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk-Return Scatter */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Risk vs Return</h3>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="risk" name="Risk (Max DD %)" />
                    <YAxis dataKey="return" name="Return %" />
                    <ZAxis dataKey="z" range={[100, 500]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter
                      name="Backtests"
                      data={getRiskReturnData()}
                      fill="#8b5cf6"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics Table */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Detailed Metrics</h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Return</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Sharpe</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Max DD</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Win Rate</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Trades</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Profit Factor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedBacktestData.map((backtest) => {
                      const isBest = bestBacktest?.id === backtest.id && selectedBacktests.size > 1;
                      return (
                        <tr key={backtest.id} className={isBest ? 'bg-warning-50' : ''}>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <div className="flex items-center">
                              {isBest && <Award className="w-4 h-4 text-warning-500 mr-2" />}
                              {backtest.name || 'Backtest'}
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${
                            (backtest.performance?.totalReturnPercent || 0) >= 0
                              ? 'text-success-600'
                              : 'text-danger-600'
                          }`}>
                            {formatPercent(backtest.performance?.totalReturnPercent || 0, 2, true)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {backtest.performance?.sharpeRatio.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-danger-600">
                            -{backtest.performance?.maxDrawdown.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(backtest.performance?.winRate || 0).toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-right">
                            {backtest.performance?.totalTrades}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(backtest.performance?.profitFactor || 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedBacktestData.length === 0 && (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <BarChart2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No backtests selected
              </h3>
              <p className="text-gray-600">
                Select 2-5 backtests above to compare their performance
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
