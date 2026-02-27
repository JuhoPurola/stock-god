import { useEffect, useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useAlertStore } from '../../store/alert-store';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CreatePriceAlertModal } from './CreatePriceAlertModal';
import { useToast } from '../../hooks/useToast';
import { formatDistanceToNow } from 'date-fns';

export function PriceAlertList() {
  const { priceAlerts, fetchPriceAlerts, deactivatePriceAlert } = useAlertStore();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadPriceAlerts = async () => {
      setLoading(true);
      try {
        await fetchPriceAlerts();
      } catch (error) {
        showError('Failed to load price alerts');
      } finally {
        setLoading(false);
      }
    };

    loadPriceAlerts();
  }, [fetchPriceAlerts, showError]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deactivatePriceAlert(id);
      showSuccess('Price alert removed');
    } catch (error) {
      showError('Failed to remove price alert');
    } finally {
      setDeletingId(null);
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'above':
        return TrendingUp;
      case 'below':
        return TrendingDown;
      case 'percent_change':
        return Activity;
      default:
        return Activity;
    }
  };

  const getConditionText = (alert: any) => {
    switch (alert.condition) {
      case 'above':
        return `Above $${alert.targetPrice?.toFixed(2)}`;
      case 'below':
        return `Below $${alert.targetPrice?.toFixed(2)}`;
      case 'percent_change':
        return `Change ${alert.percentChange}%`;
      default:
        return alert.condition;
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Price Alert
        </Button>
      </div>

      <Card>
        {priceAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No price alerts yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm mb-4">
              Create price alerts to get notified when stocks reach your target prices.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Alert
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {priceAlerts.map((alert) => {
              const Icon = getConditionIcon(alert.condition);
              const conditionText = getConditionText(alert);
              const timeAgo = formatDistanceToNow(new Date(alert.createdAt), {
                addSuffix: true,
              });

              return (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {alert.symbol}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {conditionText}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        Created {timeAgo}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(alert.id)}
                    loading={deletingId === alert.id}
                    className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showCreateModal && (
        <CreatePriceAlertModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
}
