import { useState } from 'react';
import StockChart from './StockChart';
import { useStockChartData } from '../../hooks/useStockChartData';

interface ChartContainerProps {
  symbol: string;
  className?: string;
}

type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';

const timeframeToDays: Record<Timeframe, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  'YTD': Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)),
  'ALL': 1825, // 5 years
};

export default function ChartContainer({ symbol, className = '' }: ChartContainerProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('3M');
  const { data, isLoading, error } = useStockChartData(symbol, timeframeToDays[timeframe]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {symbol} Price Chart
        </h3>

        {/* Timeframe selector */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Chart */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading chart data...</p>
          </div>
        </div>
      ) : (
        <StockChart symbol={symbol} data={data} height={400} />
      )}

      {/* Chart info */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div>
          {data.length > 0 && (
            <span>{data.length} data points</span>
          )}
        </div>
        <div>
          Powered by TradingView Lightweight Charts
        </div>
      </div>
    </div>
  );
}
