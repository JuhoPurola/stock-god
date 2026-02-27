/**
 * Risk Metrics Chart
 * Visualizes Value at Risk (VaR) and other risk metrics
 */

import React from 'react';

interface RiskMetricsChartProps {
  metrics: {
    var95: number;
    var99: number;
    cvar95: number;
    cvar99: number;
    volatility: number;
    downsideDeviation: number;
  } | null;
  loading?: boolean;
}

export const RiskMetricsChart: React.FC<RiskMetricsChartProps> = ({
  metrics,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h3>
        <p className="text-gray-500 text-center">
          No risk data available
        </p>
      </div>
    );
  }

  const formatPercent = (value: number) => {
    const formatted = (value * 100).toFixed(2);
    return `${formatted}%`;
  };

  const RiskBar: React.FC<{
    label: string;
    value: number;
    maxValue: number;
    color: string;
    description: string;
  }> = ({ label, value, maxValue, color, description }) => {
    const percentage = Math.min((Math.abs(value) / maxValue) * 100, 100);

    return (
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatPercent(value)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-6">
          <div
            className={`${color} h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
            style={{ width: `${percentage}%` }}
          >
            {percentage > 15 && (
              <span className="text-xs text-white font-medium">
                {formatPercent(value)}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    );
  };

  const maxRisk = Math.max(
    Math.abs(metrics.var95),
    Math.abs(metrics.var99),
    Math.abs(metrics.cvar95),
    Math.abs(metrics.cvar99)
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Risk Analysis
        </h3>

        <div className="space-y-6">
          {/* Value at Risk */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Value at Risk (VaR)
            </h4>
            <RiskBar
              label="VaR 95%"
              value={metrics.var95}
              maxValue={maxRisk}
              color="bg-yellow-500"
              description="Maximum expected loss in 95% of scenarios"
            />
            <RiskBar
              label="VaR 99%"
              value={metrics.var99}
              maxValue={maxRisk}
              color="bg-orange-500"
              description="Maximum expected loss in 99% of scenarios"
            />
          </div>

          {/* Conditional Value at Risk */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Conditional VaR (Expected Shortfall)
            </h4>
            <RiskBar
              label="CVaR 95%"
              value={metrics.cvar95}
              maxValue={maxRisk}
              color="bg-red-500"
              description="Average loss in worst 5% of scenarios"
            />
            <RiskBar
              label="CVaR 99%"
              value={metrics.cvar99}
              maxValue={maxRisk}
              color="bg-red-700"
              description="Average loss in worst 1% of scenarios"
            />
          </div>

          {/* Volatility Metrics */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Volatility Measures
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Volatility</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPercent(metrics.volatility)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Standard deviation of all returns
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Downside Volatility</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatPercent(metrics.downsideDeviation)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Volatility of negative returns only
                </div>
              </div>
            </div>
          </div>

          {/* Risk Interpretation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              💡 Risk Interpretation
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>VaR</strong>: Shows the threshold of maximum loss expected in normal conditions</li>
              <li>• <strong>CVaR</strong>: Shows average loss when things go worse than VaR threshold</li>
              <li>• <strong>Lower values</strong> indicate less risk exposure</li>
              <li>• Focus on CVaR for tail risk (extreme scenarios)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
