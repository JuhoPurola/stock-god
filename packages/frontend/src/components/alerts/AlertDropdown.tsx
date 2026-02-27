import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, ExternalLink, Settings, Volume2, VolumeX } from 'lucide-react';
import { useAlertStore } from '../../store/alert-store';
import { AlertType } from '@stock-picker/shared';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AlertItem } from './AlertItem';
import clsx from 'clsx';

interface AlertDropdownProps {
  onClose: () => void;
}

type AlertCategory = 'all' | 'trades' | 'alerts' | 'system';

const TRADE_TYPES = [
  AlertType.TRADE_EXECUTED,
  AlertType.TRADE_FAILED,
  AlertType.STOP_LOSS_TRIGGERED,
  AlertType.TAKE_PROFIT_TRIGGERED,
];

const ALERT_TYPES = [
  AlertType.PRICE_ALERT,
  AlertType.DAILY_LOSS_LIMIT,
];

const SYSTEM_TYPES = [
  AlertType.STRATEGY_ERROR,
];

export function AlertDropdown({ onClose }: AlertDropdownProps) {
  const navigate = useNavigate();
  const { alerts, loading, markAllAsRead, soundEnabled, toggleSound } = useAlertStore();
  const [activeCategory, setActiveCategory] = useState<AlertCategory>('all');

  // Filter alerts by category
  const filteredAlerts = alerts.filter((alert) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'trades') return TRADE_TYPES.includes(alert.type);
    if (activeCategory === 'alerts') return ALERT_TYPES.includes(alert.type);
    if (activeCategory === 'system') return SYSTEM_TYPES.includes(alert.type);
    return true;
  });

  const recentAlerts = filteredAlerts.slice(0, 5);
  const hasUnread = alerts.some((alert) => !alert.read);

  // Count alerts by category
  const counts = {
    all: alerts.length,
    trades: alerts.filter((a) => TRADE_TYPES.includes(a.type)).length,
    alerts: alerts.filter((a) => ALERT_TYPES.includes(a.type)).length,
    system: alerts.filter((a) => SYSTEM_TYPES.includes(a.type)).length,
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleViewAll = () => {
    navigate('/alerts');
    onClose();
  };

  const handleSettings = () => {
    navigate('/settings?tab=notifications');
    onClose();
  };

  const categories: { id: AlertCategory; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'trades', label: 'Trades', count: counts.trades },
    { id: 'alerts', label: 'Alerts', count: counts.alerts },
    { id: 'system', label: 'System', count: counts.system },
  ];

  return (
    <div
      className={clsx(
        'absolute right-0 top-full mt-2 w-96',
        'bg-white dark:bg-gray-900 rounded-lg shadow-xl',
        'border border-gray-200 dark:border-gray-700',
        'max-h-[600px] flex flex-col',
        'animate-slide-down'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notifications
        </h3>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          <button
            onClick={toggleSound}
            className={clsx(
              'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
              soundEnabled
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 dark:text-gray-600'
            )}
            aria-label={soundEnabled ? 'Disable notification sounds' : 'Enable notification sounds'}
            title={soundEnabled ? 'Disable notification sounds' : 'Enable notification sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={handleSettings}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            aria-label="Notification settings"
            title="Notification settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              activeCategory === category.id
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            {category.label}
            {category.count > 0 && (
              <span
                className={clsx(
                  'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                  activeCategory === category.id
                    ? 'bg-primary-200 text-primary-800 dark:bg-primary-800 dark:text-primary-200'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                )}
              >
                {category.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="md" />
          </div>
        ) : recentAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <CheckCheck className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              You're all caught up!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              No new notifications
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onClick={() => {
                  // Navigate to relevant page based on alert type or portfolio
                  if (alert.portfolioId) {
                    navigate(`/portfolios/${alert.portfolioId}`);
                  }
                  onClose();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {recentAlerts.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={handleViewAll}
            className="justify-center"
          >
            View all notifications
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
