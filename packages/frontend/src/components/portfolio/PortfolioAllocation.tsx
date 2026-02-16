import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, formatPercent } from '@stock-picker/shared';
import type { PositionWithDetails } from '@stock-picker/shared';

interface PortfolioAllocationProps {
  positions: PositionWithDetails[];
  cashBalance: number;
}

const COLORS = [
  '#0ea5e9', // primary
  '#22c55e', // success
  '#ef4444', // danger
  '#f59e0b', // warning
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export function PortfolioAllocation({
  positions,
  cashBalance,
}: PortfolioAllocationProps) {
  const data = [
    ...positions.map((position, index) => ({
      name: position.symbol,
      value: position.marketValue,
      color: COLORS[index % COLORS.length],
    })),
    {
      name: 'Cash',
      value: cashBalance,
      color: '#9ca3af', // gray
    },
  ];

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {item.name}
          </p>
          <p className="text-sm text-gray-700">
            {formatCurrency(item.value)}
          </p>
          <p className="text-xs text-gray-600">
            {formatPercent((item.value / totalValue) * 100, 1)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700">{item.name}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(item.value)}
              </p>
              <p className="text-xs text-gray-600">
                {formatPercent((item.value / totalValue) * 100, 1)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
