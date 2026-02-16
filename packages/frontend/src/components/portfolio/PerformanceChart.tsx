import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@stock-picker/shared';
import type { PortfolioSnapshot } from '@stock-picker/shared';
import { format } from 'date-fns';

interface PerformanceChartProps {
  snapshots: PortfolioSnapshot[];
  type?: 'line' | 'area';
}

export function PerformanceChart({
  snapshots,
  type = 'area',
}: PerformanceChartProps) {
  const chartData = useMemo(() => {
    return snapshots.map((snapshot) => ({
      date: format(new Date(snapshot.timestamp), 'MMM dd'),
      fullDate: format(new Date(snapshot.timestamp), 'MMM dd, yyyy'),
      value: snapshot.totalValue,
      cash: snapshot.cashBalance,
      positions: snapshot.positionsValue,
      return: snapshot.totalReturn || 0,
    }));
  }, [snapshots]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {payload[0].payload.fullDate}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Total Value:</span>{' '}
              {formatCurrency(payload[0].value)}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Cash:</span>{' '}
              {formatCurrency(payload[0].payload.cash)}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Positions:</span>{' '}
              {formatCurrency(payload[0].payload.positions)}
            </p>
            <p
              className={`text-sm font-medium ${
                payload[0].payload.return >= 0
                  ? 'text-success-600'
                  : 'text-danger-600'
              }`}
            >
              Return: {formatCurrency(payload[0].payload.return)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No performance data available
      </div>
    );
  }

  const ChartComponent = type === 'area' ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ChartComponent data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {type === 'area' ? (
          <Area
            type="monotone"
            dataKey="value"
            stroke="#0ea5e9"
            fill="#0ea5e9"
            fillOpacity={0.2}
            strokeWidth={2}
            name="Portfolio Value"
          />
        ) : (
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={false}
            name="Portfolio Value"
          />
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
}
