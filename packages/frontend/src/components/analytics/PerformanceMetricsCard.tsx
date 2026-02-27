/**
 * Performance Metrics Card
 * Displays key performance indicators in a card layout
 */

import React from 'react';

interface PerformanceMetricsCardProps {
  metrics: {
    totalReturnPercent: number;
    annualizedReturn: number;
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
    maxDrawdownPercent: number;
    volatility: number;
    winRate: number;
    profitFactor: number;
  } | null;
  loading?: boolean;
}

export const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({
  metrics,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">
          No performance data available. Generate a backtest or wait for live trading data.
        </p>
      </div>
    );
  }

  const formatPercent = (value: number) => {
    const formatted = (value * 100).toFixed(2);
    return value >= 0 ? `+${formatted}%` : `${formatted}%`;
  };

  const formatRatio = (value: number) => value.toFixed(2);

  const getColorClass = (value: number, inverse = false) => {
    if (inverse) {
      return value < 0 ? 'text-green-600' : 'text-red-600';
    }
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const MetricItem: React.FC<{
    label: string;
    value: string;
    colorClass?: string;
    tooltip?: string;
  }> = ({ label, value, colorClass, tooltip }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center">
        <span className="text-gray-600 text-sm">{label}</span>
        {tooltip && (
          <span className="ml-1 text-gray-400 cursor-help" title={tooltip}>
            ⓘ
          </span>
        )}
      </div>
      <span className={`font-semibold ${colorClass || 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Metrics
        </h3>

        <div className="space-y-1">
          {/* Returns */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Returns
            </h4>
            <MetricItem
              label="Total Return"
              value={formatPercent(metrics.totalReturnPercent / 100)}
              colorClass={getColorClass(metrics.totalReturnPercent)}
            />
            <MetricItem
              label="Annualized Return"
              value={formatPercent(metrics.annualizedReturn)}
              colorClass={getColorClass(metrics.annualizedReturn)}
              tooltip="Compound annual growth rate"
            />
          </div>

          {/* Risk-Adjusted Returns */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Risk-Adjusted Returns
            </h4>
            <MetricItem
              label="Sharpe Ratio"
              value={formatRatio(metrics.sharpeRatio)}
              colorClass={metrics.sharpeRatio >= 1 ? 'text-green-600' : 'text-yellow-600'}
              tooltip="Return per unit of total risk (>1 is good)"
            />
            <MetricItem
              label="Sortino Ratio"
              value={formatRatio(metrics.sortinoRatio)}
              colorClass={metrics.sortinoRatio >= 1 ? 'text-green-600' : 'text-yellow-600'}
              tooltip="Return per unit of downside risk"
            />
            <MetricItem
              label="Calmar Ratio"
              value={formatRatio(metrics.calmarRatio)}
              colorClass={metrics.calmarRatio >= 2 ? 'text-green-600' : 'text-yellow-600'}
              tooltip="Return per unit of max drawdown (>2 is good)"
            />
          </div>

          {/* Risk Metrics */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Risk Metrics
            </h4>
            <MetricItem
              label="Volatility"
              value={formatPercent(metrics.volatility)}
              tooltip="Annualized standard deviation of returns"
            />
            <MetricItem
              label="Max Drawdown"
              value={formatPercent(metrics.maxDrawdownPercent / 100)}
              colorClass={getColorClass(metrics.maxDrawdownPercent, true)}
              tooltip="Largest peak-to-trough decline"
            />
          </div>

          {/* Trading Performance */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Trading Performance
            </h4>
            <MetricItem
              label="Win Rate"
              value={formatPercent(metrics.winRate / 100)}
              colorClass={metrics.winRate >= 50 ? 'text-green-600' : 'text-yellow-600'}
            />
            <MetricItem
              label="Profit Factor"
              value={formatRatio(metrics.profitFactor)}
              colorClass={metrics.profitFactor >= 1.5 ? 'text-green-600' : 'text-yellow-600'}
              tooltip="Gross profit / gross loss (>1.5 is good)"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
