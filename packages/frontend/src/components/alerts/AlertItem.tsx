import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { Alert } from '@stock-picker/shared';
import { useAlertStore } from '../../store/alert-store';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

interface AlertItemProps {
  alert: Alert;
  onClick?: () => void;
}

export function AlertItem({ alert, onClick }: AlertItemProps) {
  const { markAsRead } = useAlertStore();

  const handleClick = async () => {
    if (!alert.read) {
      try {
        await markAsRead(alert.id);
      } catch (error) {
        console.error('Failed to mark alert as read:', error);
      }
    }
    onClick?.();
  };

  const icons = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const Icon = icons[alert.severity] || Info;

  const iconClasses = {
    info: 'text-primary-600 bg-primary-50',
    warning: 'text-warning-600 bg-warning-50',
    error: 'text-danger-600 bg-danger-50',
  };

  const timeAgo = formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true });

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'w-full p-4 text-left transition-colors',
        'hover:bg-gray-50 dark:hover:bg-gray-800',
        'focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800',
        !alert.read && 'bg-primary-50/30 dark:bg-primary-900/10'
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={clsx(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            iconClasses[alert.severity]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              className={clsx(
                'text-sm font-medium',
                alert.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'
              )}
            >
              {alert.title}
            </h4>
            {!alert.read && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-600" />
            )}
          </div>

          <p
            className={clsx(
              'text-sm mb-2 line-clamp-2',
              alert.read ? 'text-gray-500 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'
            )}
          >
            {alert.message}
          </p>

          <p className="text-xs text-gray-400 dark:text-gray-600">{timeAgo}</p>
        </div>
      </div>
    </button>
  );
}
