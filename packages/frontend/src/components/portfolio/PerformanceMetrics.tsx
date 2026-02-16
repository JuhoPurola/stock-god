import { Card } from '../ui/Card';
import { formatCurrency, formatPercent } from '@stock-picker/shared';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

interface PerformanceMetricsProps {
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayReturn: number;
  dayReturnPercent: number;
  bestDay?: number;
  worstDay?: number;
  sharpeRatio?: number;
}

export function PerformanceMetrics({
  totalValue,
  totalReturn,
  totalReturnPercent,
  dayReturn,
  dayReturnPercent,
  sharpeRatio,
}: PerformanceMetricsProps) {
  const metrics = [
    {
      label: 'Total Value',
      value: formatCurrency(totalValue),
      icon: DollarSign,
      color: 'bg-primary-100 text-primary-600',
    },
    {
      label: 'Total Return',
      value: formatCurrency(totalReturn),
      subValue: formatPercent(totalReturnPercent, 2, true),
      icon: totalReturn >= 0 ? TrendingUp : TrendingDown,
      color:
        totalReturn >= 0
          ? 'bg-success-100 text-success-600'
          : 'bg-danger-100 text-danger-600',
    },
    {
      label: 'Day Return',
      value: formatCurrency(dayReturn),
      subValue: formatPercent(dayReturnPercent, 2, true),
      icon: dayReturn >= 0 ? TrendingUp : TrendingDown,
      color:
        dayReturn >= 0
          ? 'bg-success-100 text-success-600'
          : 'bg-danger-100 text-danger-600',
    },
    {
      label: 'Sharpe Ratio',
      value: sharpeRatio !== undefined ? sharpeRatio.toFixed(2) : '—',
      icon: Percent,
      color: 'bg-gray-100 text-gray-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                {metric.subValue && (
                  <p className="text-sm text-gray-600 mt-1">{metric.subValue}</p>
                )}
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${metric.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
