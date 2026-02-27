import { useMemo } from 'react';
import AdvancedChartContainer from '../charts/AdvancedChartContainer';
import type { BacktestTrade } from '@stock-picker/shared';

interface BacktestChartProps {
  symbol: string;
  trades: BacktestTrade[];
  className?: string;
}

export default function BacktestChart({ symbol, trades, className = '' }: BacktestChartProps) {
  // Convert BacktestTrade to chart-compatible format
  const chartTrades = useMemo(() => {
    return trades.map(trade => ({
      timestamp: typeof trade.timestamp === 'string' ? trade.timestamp : new Date(trade.timestamp).toISOString(),
      side: trade.side as 'buy' | 'sell',
      price: trade.price,
      quantity: trade.quantity,
    }));
  }, [trades]);

  // Calculate P&L for each trade
  const tradesWithPnL = useMemo(() => {
    const results: Array<{
      trade: typeof chartTrades[0];
      pnl: number | null;
      pnlPercent: number | null;
    }> = [];

    let buyPrice: number | null = null;
    let buyQuantity: number = 0;

    chartTrades.forEach(trade => {
      if (trade.side === 'buy') {
        buyPrice = trade.price;
        buyQuantity = trade.quantity;
        results.push({ trade, pnl: null, pnlPercent: null });
      } else if (trade.side === 'sell' && buyPrice !== null) {
        const pnl = (trade.price - buyPrice) * Math.min(trade.quantity, buyQuantity);
        const pnlPercent = ((trade.price - buyPrice) / buyPrice) * 100;
        results.push({ trade, pnl, pnlPercent });
        buyQuantity -= trade.quantity;
        if (buyQuantity <= 0) {
          buyPrice = null;
        }
      } else {
        results.push({ trade, pnl: null, pnlPercent: null });
      }
    });

    return results;
  }, [chartTrades]);

  const totalPnL = useMemo(() => {
    return tradesWithPnL.reduce((sum, item) => sum + (item.pnl || 0), 0);
  }, [tradesWithPnL]);

  const winRate = useMemo(() => {
    const closedTrades = tradesWithPnL.filter(item => item.pnl !== null);
    if (closedTrades.length === 0) return 0;
    const wins = closedTrades.filter(item => item.pnl! > 0).length;
    return (wins / closedTrades.length) * 100;
  }, [tradesWithPnL]);

  return (
    <div className={className}>
      {/* Performance Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total P&L</div>
          <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${totalPnL.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Win Rate</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {winRate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Trades</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {trades.length}
          </div>
        </div>
      </div>

      {/* Chart with Trade Markers */}
      <AdvancedChartContainer
        symbol={symbol}
        backtestTrades={chartTrades}
        showIndicators={true}
      />

      {/* Trade List */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Trade History
        </h4>
        <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Time
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Side
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Price
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Quantity
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  P&L
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tradesWithPnL.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {new Date(item.trade.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                        item.trade.side === 'buy'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {item.trade.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                    ${item.trade.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100">
                    {item.trade.quantity}
                  </td>
                  <td className="px-4 py-2 text-sm text-right">
                    {item.pnl !== null ? (
                      <span className={item.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${item.pnl.toFixed(2)}
                        {item.pnlPercent !== null && (
                          <span className="text-xs ml-1">
                            ({item.pnlPercent.toFixed(1)}%)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
