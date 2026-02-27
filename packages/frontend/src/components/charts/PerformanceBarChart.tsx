import { formatPercent } from '@stock-picker/shared';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface PerformanceBarChartProps {
  data: BarData[];
  height?: number;
}

export default function PerformanceBarChart({ data, height = 300 }: PerformanceBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.abs(d.value)));
  const minValue = Math.min(...data.map(d => d.value));
  const hasNegative = minValue < 0;

  return (
    <div className="space-y-3" style={{ height }}>
      {data.map((item, index) => {
        const isPositive = item.value >= 0;
        const percentage = (Math.abs(item.value) / maxValue) * 100;
        const color = item.color || (isPositive ? '#10b981' : '#ef4444');

        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
              <span className={`font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPercent(item.value, 2, true)}
              </span>
            </div>
            <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              {hasNegative ? (
                // Show bars from center if there are negative values
                <div className="absolute inset-0 flex">
                  <div className="flex-1" />
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                      marginLeft: isPositive ? '0' : `-${percentage}%`,
                    }}
                  />
                  {!isPositive && <div className="flex-1" />}
                </div>
              ) : (
                // Show bars from left if all positive
                <div
                  className="h-full transition-all rounded-r-lg"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
