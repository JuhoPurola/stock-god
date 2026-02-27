import { TrendingUp, TrendingDown, Bell, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'trade' | 'alert' | 'strategy';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'info';
}

interface RecentActivityProps {
  activities: ActivityItem[];
  maxItems?: number;
}

export default function RecentActivity({ activities, maxItems = 10 }: RecentActivityProps) {
  const displayActivities = activities.slice(0, maxItems);

  const getIcon = (type: ActivityItem['type'], status?: ActivityItem['status']) => {
    switch (type) {
      case 'trade':
        return status === 'success' ? (
          <TrendingUp className="w-4 h-4 text-green-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-600" />
        );
      case 'alert':
        return <Bell className="w-4 h-4 text-yellow-600" />;
      case 'strategy':
        return <Activity className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (displayActivities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="mt-0.5">{getIcon(activity.type, activity.status)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {activity.title}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {activity.description}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
