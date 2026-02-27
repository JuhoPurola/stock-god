import { Plus, TrendingUp, Search, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QuickActions() {
  const actions = [
    {
      icon: Plus,
      label: 'New Portfolio',
      description: 'Create a portfolio',
      href: '/portfolios',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: Search,
      label: 'Browse Stocks',
      description: 'Find stocks to trade',
      href: '/stocks',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: TrendingUp,
      label: 'New Strategy',
      description: 'Create a strategy',
      href: '/strategies',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      icon: BarChart3,
      label: 'Run Backtest',
      description: 'Test your strategy',
      href: '/backtests',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            to={action.href}
            className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 text-center">
              {action.label}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">
              {action.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
