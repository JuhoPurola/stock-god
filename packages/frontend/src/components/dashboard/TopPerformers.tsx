import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatPercent, formatCurrency } from '@stock-picker/shared';

interface Position {
  symbol: string;
  quantity: number;
  currentPrice: number;
  costBasis: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

interface TopPerformersProps {
  positions: Position[];
  limit?: number;
}

export default function TopPerformers({ positions, limit = 5 }: TopPerformersProps) {
  // Sort by P&L percentage (descending)
  const topPerformers = [...positions]
    .sort((a, b) => b.unrealizedPnLPercent - a.unrealizedPnLPercent)
    .slice(0, limit);

  if (topPerformers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
        <p>No positions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topPerformers.map((position) => {
        const isPositive = position.unrealizedPnL >= 0;
        return (
          <div
            key={position.symbol}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {position.symbol}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {position.quantity} shares @ {formatCurrency(position.currentPrice)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-bold ${
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatPercent(position.unrealizedPnLPercent, 2, true)}
              </p>
              <p
                className={`text-xs ${
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(position.unrealizedPnL)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
