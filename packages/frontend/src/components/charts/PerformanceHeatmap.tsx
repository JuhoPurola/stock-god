import { formatPercent } from '@stock-picker/shared';

interface HeatmapCell {
  symbol: string;
  value: number; // P&L percentage
  weight: number; // Portfolio weight percentage
}

interface PerformanceHeatmapProps {
  data: HeatmapCell[];
}

export default function PerformanceHeatmap({ data }: PerformanceHeatmapProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No positions to display
      </div>
    );
  }

  // Sort by absolute value (biggest movers first)
  const sortedData = [...data].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  // Get color based on performance
  const getColor = (value: number) => {
    if (value > 10) return 'bg-green-700 text-white';
    if (value > 5) return 'bg-green-600 text-white';
    if (value > 2) return 'bg-green-500 text-white';
    if (value > 0) return 'bg-green-400 text-gray-900';
    if (value === 0) return 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    if (value > -2) return 'bg-red-400 text-gray-900';
    if (value > -5) return 'bg-red-500 text-white';
    if (value > -10) return 'bg-red-600 text-white';
    return 'bg-red-700 text-white';
  };

  // Calculate relative sizes based on weight
  const maxWeight = Math.max(...sortedData.map(d => d.weight));
  const getSize = (weight: number) => {
    const minSize = 60;
    const maxSize = 120;
    const normalized = weight / maxWeight;
    return minSize + normalized * (maxSize - minSize);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {sortedData.map((cell) => {
        const size = getSize(cell.weight);
        return (
          <div
            key={cell.symbol}
            className={`${getColor(cell.value)} rounded-lg flex flex-col items-center justify-center p-3 transition-transform hover:scale-105 cursor-pointer`}
            style={{ width: `${size}px`, height: `${size}px` }}
            title={`${cell.symbol}: ${formatPercent(cell.value, 2, true)} (${cell.weight.toFixed(1)}% of portfolio)`}
          >
            <div className="font-bold text-sm">{cell.symbol}</div>
            <div className="text-xs mt-1">{formatPercent(cell.value, 1, true)}</div>
            <div className="text-xs opacity-75">{cell.weight.toFixed(0)}%</div>
          </div>
        );
      })}
    </div>
  );
}
