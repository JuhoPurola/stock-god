/**
 * Performance Analytics Page
 * Comprehensive portfolio analytics with advanced metrics
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PerformanceMetricsCard } from '../components/analytics/PerformanceMetricsCard';
import { RiskMetricsChart } from '../components/analytics/RiskMetricsChart';

interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  volatility: number;
  downsideDeviation: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  var95: number;
  var99: number;
  cvar95: number;
  cvar99: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  averageTrade: number;
}

export const PerformanceAnalyticsPage: React.FC = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [period, setPeriod] = useState<string>('3M');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [portfolioId, period]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = import.meta.env.VITE_API_URL || 'https://t8touk4lch.execute-api.eu-west-1.amazonaws.com';
      const response = await fetch(
        `${apiUrl}/portfolios/${portfolioId}/analytics/performance?period=${period}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const periods = [
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '6M', label: '6 Months' },
    { value: '1Y', label: '1 Year' },
    { value: 'YTD', label: 'Year to Date' },
    { value: 'ALL', label: 'All Time' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="mt-2 text-gray-600">
          Comprehensive performance and risk analysis
        </p>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Time Period:</label>
          <div className="flex space-x-2">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  period === p.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchMetrics}
            className="ml-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics Card */}
        <PerformanceMetricsCard metrics={metrics} loading={loading} />

        {/* Risk Metrics Chart */}
        <RiskMetricsChart metrics={metrics} loading={loading} />
      </div>

      {/* Additional Insights */}
      {metrics && !loading && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Insights
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Risk Assessment
              </h4>
              <div className="space-y-2 text-sm">
                {metrics.sharpeRatio > 1 ? (
                  <p className="text-green-700">
                    ✓ Good risk-adjusted returns (Sharpe &gt; 1)
                  </p>
                ) : (
                  <p className="text-yellow-700">
                    ⚠ Low risk-adjusted returns (Sharpe &lt; 1)
                  </p>
                )}

                {metrics.maxDrawdownPercent < 20 ? (
                  <p className="text-green-700">
                    ✓ Controlled drawdown (&lt; 20%)
                  </p>
                ) : (
                  <p className="text-red-700">
                    ⚠ Significant drawdown (&gt; 20%)
                  </p>
                )}

                {metrics.volatility < 0.25 ? (
                  <p className="text-green-700">
                    ✓ Low volatility (&lt; 25%)
                  </p>
                ) : (
                  <p className="text-yellow-700">
                    ⚠ High volatility (&gt; 25%)
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Trading Performance
              </h4>
              <div className="space-y-2 text-sm">
                {metrics.winRate > 50 ? (
                  <p className="text-green-700">
                    ✓ Positive win rate ({metrics.winRate.toFixed(1)}%)
                  </p>
                ) : (
                  <p className="text-yellow-700">
                    ⚠ Win rate below 50% ({metrics.winRate.toFixed(1)}%)
                  </p>
                )}

                {metrics.profitFactor > 1.5 ? (
                  <p className="text-green-700">
                    ✓ Strong profit factor ({metrics.profitFactor.toFixed(2)})
                  </p>
                ) : (
                  <p className="text-yellow-700">
                    ⚠ Low profit factor ({metrics.profitFactor.toFixed(2)})
                  </p>
                )}

                <p className="text-gray-700">
                  Total trades: {metrics.totalTrades}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Performance metrics are calculated from historical data.
              Past performance does not guarantee future results. These metrics should be used
              as part of a comprehensive investment analysis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
