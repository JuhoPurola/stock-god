import { useNavigate } from 'react-router-dom';
import { CheckCheck, ExternalLink } from 'lucide-react';
import { useAlertStore } from '../../store/alert-store';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AlertItem } from './AlertItem';
import clsx from 'clsx';

interface AlertDropdownProps {
  onClose: () => void;
}

export function AlertDropdown({ onClose }: AlertDropdownProps) {
  const navigate = useNavigate();
  const { alerts, loading, markAllAsRead } = useAlertStore();

  const recentAlerts = alerts.slice(0, 5);
  const hasUnread = alerts.some((alert) => !alert.read);

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
        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
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
