import { useState } from 'react';
import AdvancedStockChart, { type Indicator, type TradeMarker } from './AdvancedStockChart';
import IndicatorControls from './IndicatorControls';
import { useStockChartData } from '../../hooks/useStockChartData';
import type { Time } from 'lightweight-charts';

interface AdvancedChartContainerProps {
  symbol: string;
  className?: string;
  backtestTrades?: Array<{
    timestamp: string;
    side: 'buy' | 'sell';
    price: number;
    quantity: number;
  }>;
  showIndicators?: boolean;
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
  'ALL': 1825,
};

export default function AdvancedChartContainer({
  symbol,
  className = '',
  backtestTrades = [],
  showIndicators = true
}: AdvancedChartContainerProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('3M');
  const [indicators, setIndicators] = useState<Indicator[]>([
    { type: 'SMA', period: 20, color: '#2196F3', lineWidth: 2, enabled: false },
    { type: 'EMA', period: 12, color: '#FF9800', lineWidth: 2, enabled: false },
  ]);
  const [crosshairInfo, setCrosshairInfo] = useState<{
    time: Time | null;
    price: number | null;
  }>({ time: null, price: null });

  const { data, isLoading, error } = useStockChartData(symbol, timeframeToDays[timeframe]);

  // Convert backtest trades to chart markers
  const tradeMarkers: TradeMarker[] = backtestTrades.map(trade => ({
    time: (new Date(trade.timestamp).getTime() / 1000) as Time,
    position: trade.side === 'buy' ? 'belowBar' : 'aboveBar',
    color: trade.side === 'buy' ? '#26a69a' : '#ef5350',
    shape: trade.side === 'buy' ? 'arrowUp' : 'arrowDown',
    text: `${trade.side.toUpperCase()} ${trade.quantity}@${trade.price.toFixed(2)}`,
    size: 1,
  }));

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {symbol} Price Chart
          </h3>
          {crosshairInfo.price && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Price: ${crosshairInfo.price.toFixed(2)}
            </div>
          )}
        </div>

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

      {/* Indicator Controls */}
      {showIndicators && (
        <div className="mb-4">
          <IndicatorControls indicators={indicators} onChange={setIndicators} />
        </div>
      )}

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
        <AdvancedStockChart
          symbol={symbol}
          data={data}
          indicators={indicators}
          tradeMarkers={tradeMarkers}
          height={500}
          onCrosshairMove={(time, price) => setCrosshairInfo({ time, price })}
        />
      )}

      {/* Chart info */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-4">
          {data.length > 0 && (
            <span>{data.length} data points</span>
          )}
          {backtestTrades.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              {backtestTrades.filter(t => t.side === 'buy').length} buys
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 ml-2"></span>
              {backtestTrades.filter(t => t.side === 'sell').length} sells
            </span>
          )}
        </div>
        <div>
          Powered by TradingView Lightweight Charts
        </div>
      </div>
    </div>
  );
}
