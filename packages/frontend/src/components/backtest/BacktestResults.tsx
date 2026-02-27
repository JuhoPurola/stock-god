import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { apiClient } from '../../lib/api-client';
import type { Backtest, BacktestTrade, Strategy } from '@stock-picker/shared';
import { BacktestStatus } from '@stock-picker/shared';
import { TrendingUp, TrendingDown, Activity, Trash2 } from 'lucide-react';
import { formatCurrency, formatPercent } from '@stock-picker/shared';
import { BacktestInsights } from './BacktestInsights';

interface BacktestResultsProps {
  backtest: Backtest;
  onDelete?: () => void;
}

export function BacktestResults({ backtest, onDelete }: BacktestResultsProps) {
  const [trades, setTrades] = useState<BacktestTrade[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [showTrades, setShowTrades] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (showTrades && trades.length === 0) {
      loadTrades();
    }
  }, [showTrades]);

  useEffect(() => {
    if (showInsights && !strategy && backtest.config.strategyId) {
      loadStrategy();
    }
  }, [showInsights]);

  const loadTrades = async () => {
    setLoadingTrades(true);
    try {
      const tradesData = await apiClient.getBacktestTrades(backtest.id);
      setTrades(tradesData);
    } catch (error) {
      console.error('Failed to load backtest trades:', error);
    } finally {
      setLoadingTrades(false);
    }
  };

  const loadStrategy = async () => {
    try {
      if (backtest.config.strategyId) {
        const strategyData = await apiClient.getStrategy(backtest.config.strategyId);
        setStrategy(strategyData);
      }
    } catch (error) {
      console.error('Failed to load strategy:', error);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${backtest.name}"?`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await apiClient.deleteBacktest(backtest.id);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Failed to delete backtest:', error);
      alert('Failed to delete backtest. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: BacktestStatus) => {
    switch (status) {
      case BacktestStatus.COMPLETED:
        return <Badge variant="success">Completed</Badge>;
      case BacktestStatus.RUNNING:
        return <Badge variant="warning">Running</Badge>;
      case BacktestStatus.FAILED:
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const performance = backtest.performance;
  const isPositive = performance && performance.totalReturnPercent ? performance.totalReturnPercent >= 0 : false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold">{backtest.name || 'Backtest'}</h3>
            {getStatusBadge(backtest.status)}
          </div>
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={deleting}
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Config Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Period</p>
              <p className="font-medium">
                {new Date(backtest.config.startDate).toLocaleDateString()} -{' '}
                {new Date(backtest.config.endDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Initial Cash</p>
              <p className="font-medium">{formatCurrency(backtest.config.initialCash)}</p>
            </div>
            <div>
              <p className="text-gray-600">Commission</p>
              <p className="font-medium">${backtest.config.commission}</p>
            </div>
            <div>
              <p className="text-gray-600">Slippage</p>
              <p className="font-medium">{(backtest.config.slippage * 100).toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {backtest.status === BacktestStatus.COMPLETED && performance && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 mr-1 text-success-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1 text-danger-600" />
                  )}
                  Total Return
                </div>
                <p
                  className={`text-xl font-bold ${
                    isPositive ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {formatPercent(performance.totalReturnPercent || 0, 2, true)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {formatCurrency(performance.totalReturn || 0)}
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Sharpe Ratio</p>
                <p className="text-xl font-bold text-gray-900">
                  {performance.sharpeRatio.toFixed(2)}
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Max Drawdown</p>
                <p className="text-xl font-bold text-danger-600">
                  -{performance.maxDrawdown.toFixed(2)}%
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Total Trades</p>
                <p className="text-xl font-bold text-gray-900">{performance.totalTrades}</p>
              </div>
            </div>
          </div>
        )}

        {/* Running Status */}
        {backtest.status === BacktestStatus.RUNNING && (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 mx-auto text-primary-600 animate-pulse mb-3" />
            <p className="text-gray-600">Backtest is running...</p>
            <p className="text-sm text-gray-500 mt-1">
              This may take a few minutes depending on the date range
            </p>
          </div>
        )}

        {/* Error Status */}
        {backtest.status === BacktestStatus.FAILED && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
            <p className="font-medium">Backtest failed</p>
            {backtest.error && <p className="text-sm mt-1">{backtest.error}</p>}
          </div>
        )}

        {/* Trades Section */}
        {backtest.status === BacktestStatus.COMPLETED && (
          <div className="mt-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowTrades(!showTrades)}
              >
                {showTrades ? 'Hide' : 'Show'} Trades ({performance?.totalTrades || 0})
              </Button>
              {performance?.totalTrades === 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowInsights(!showInsights)}
                >
                  {showInsights ? 'Hide' : 'Show'} Insights
                </Button>
              )}
            </div>

            {showInsights && performance?.totalTrades === 0 && (
              <div className="mt-4">
                <BacktestInsights backtest={backtest} strategy={strategy || undefined} />
              </div>
            )}

            {showTrades && (
              <div className="mt-4">
                {loadingTrades ? (
                  <p className="text-center text-gray-500 py-4">Loading trades...</p>
                ) : trades.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-3">No trades executed</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowInsights(true);
                        setShowTrades(false);
                      }}
                    >
                      View Insights
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Symbol</th>
                          <th className="px-3 py-2 text-center">Side</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-right">Price</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2 text-right">P&L</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {trades.map((trade) => (
                          <tr key={trade.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              {new Date(trade.timestamp).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 font-medium">{trade.symbol}</td>
                            <td className="px-3 py-2 text-center">
                              <Badge
                                variant={trade.side === 'buy' ? 'success' : 'danger'}
                                size="sm"
                              >
                                {trade.side.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-right">{trade.quantity}</td>
                            <td className="px-3 py-2 text-right">
                              ${trade.price.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              ${trade.amount.toFixed(2)}
                            </td>
                            <td
                              className={`px-3 py-2 text-right font-medium ${
                                trade.pnl && trade.pnl > 0
                                  ? 'text-success-600'
                                  : trade.pnl && trade.pnl < 0
                                  ? 'text-danger-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              {trade.pnl ? `$${trade.pnl.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Created: {new Date(backtest.createdAt).toLocaleString()}</span>
            {backtest.completedAt && (
              <span>Completed: {new Date(backtest.completedAt).toLocaleString()}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
