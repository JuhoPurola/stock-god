interface SectorData {
  sector: string;
  value: number;
  percentage: number;
  count: number; // Number of positions in this sector
}

interface SectorDistributionChartProps {
  data: SectorData[];
}

const SECTOR_COLORS: Record<string, string> = {
  'Technology': '#3b82f6',
  'Healthcare': '#10b981',
  'Financial': '#8b5cf6',
  'Consumer': '#f59e0b',
  'Industrial': '#6366f1',
  'Energy': '#ef4444',
  'Materials': '#14b8a6',
  'Utilities': '#06b6d4',
  'Real Estate': '#ec4899',
  'Communication': '#84cc16',
  'Other': '#6b7280',
};

export default function SectorDistributionChart({ data }: SectorDistributionChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No sector data available
      </div>
    );
  }

  // Sort by value descending
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  const maxValue = Math.max(...sortedData.map(d => d.value));

  return (
    <div className="space-y-4">
      {sortedData.map((sector) => {
        const widthPercent = (sector.value / maxValue) * 100;
        const color = SECTOR_COLORS[sector.sector] || SECTOR_COLORS['Other'];

        return (
          <div key={sector.sector} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {sector.sector}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  ({sector.count} {sector.count === 1 ? 'position' : 'positions'})
                </span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {sector.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="relative h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: color,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-20" />
              </div>
              <div className="absolute inset-0 flex items-center justify-end pr-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  ${sector.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
