import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  Search,
  History,
  Settings,
  Activity,
  Database,
  Sliders,
  Radio,
} from 'lucide-react';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Signals', href: '/live-signals', icon: Radio },
  { name: 'Portfolios', href: '/portfolios', icon: Briefcase },
  { name: 'Optimizer', href: '/strategy-optimizer', icon: Sliders },
  { name: 'Backtests', href: '/backtests', icon: Activity },
  { name: 'Stock Data', href: '/stocks/data-dashboard', icon: Database },
  { name: 'Stocks', href: '/stocks', icon: Search },
  { name: 'Trades', href: '/trades', icon: History },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <TrendingUp className="w-8 h-8 text-primary-600" />
        <span className="ml-2 text-xl font-bold text-gray-900">Stock Picker</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Link
          to="/settings"
          className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </Link>
      </div>
    </div>
  );
}
