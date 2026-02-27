import { useEffect, useState } from 'react';
import { Settings, CheckCheck } from 'lucide-react';
import { useAlertStore } from '../store/alert-store';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { AlertItem } from '../components/alerts/AlertItem';
import { AlertPreferences } from '../components/alerts/AlertPreferences';
import { PriceAlertList } from '../components/alerts/PriceAlertList';
import clsx from 'clsx';

type Tab = 'all' | 'unread' | 'preferences' | 'watchlist';

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const { alerts, loading, fetchAlerts, markAllAsRead } = useAlertStore();

  useEffect(() => {
    if (activeTab === 'all') {
      fetchAlerts({ unreadOnly: false });
    } else if (activeTab === 'unread') {
      fetchAlerts({ unreadOnly: true });
    }
  }, [activeTab, fetchAlerts]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const unreadAlerts = alerts.filter((alert) => !alert.read);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your alerts and notification preferences
          </p>
        </div>

        {unreadAlerts.length > 0 && activeTab !== 'preferences' && activeTab !== 'watchlist' && (
          <Button variant="secondary" onClick={handleMarkAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('all')}
          className={clsx(
            'px-4 py-2 font-medium transition-colors border-b-2',
            activeTab === 'all'
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
          )}
        >
          All
          {alerts.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700">
              {alerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={clsx(
            'px-4 py-2 font-medium transition-colors border-b-2',
            activeTab === 'unread'
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
          )}
        >
          Unread
          {unreadAlerts.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
              {unreadAlerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          className={clsx(
            'px-4 py-2 font-medium transition-colors border-b-2',
            activeTab === 'watchlist'
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
          )}
        >
          Price Watchlist
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={clsx(
            'px-4 py-2 font-medium transition-colors border-b-2',
            activeTab === 'preferences'
              ? 'text-primary-600 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <Settings className="w-4 h-4 inline mr-1" />
          Settings
        </button>
      </div>

      {/* Content */}
      {activeTab === 'preferences' ? (
        <AlertPreferences />
      ) : activeTab === 'watchlist' ? (
        <PriceAlertList />
      ) : (
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <CheckCheck className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                {activeTab === 'unread'
                  ? 'All caught up! Check back later for new notifications.'
                  : "You'll see notifications here when something important happens with your portfolios."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {alerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
