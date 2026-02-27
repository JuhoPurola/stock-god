import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useAlertStore } from '../../store/alert-store';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../../hooks/useToast';

export function AlertPreferences() {
  const { preferences, fetchPreferences, updatePreferences } = useAlertStore();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    emailNotifications: true,
    browserNotifications: true,
    tradeAlerts: true,
    priceAlerts: true,
    strategyAlerts: true,
    riskAlerts: true,
  });

  useEffect(() => {
    const loadPreferences = async () => {
      setLoading(true);
      try {
        await fetchPreferences();
      } catch (error) {
        showError('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [fetchPreferences, showError]);

  useEffect(() => {
    if (preferences) {
      setFormData({
        emailNotifications: preferences.emailNotifications,
        browserNotifications: preferences.browserNotifications,
        tradeAlerts: preferences.tradeAlerts,
        priceAlerts: preferences.priceAlerts,
        strategyAlerts: preferences.strategyAlerts,
        riskAlerts: preferences.riskAlerts,
      });
    }
  }, [preferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updatePreferences(formData);
      showSuccess('Preferences saved successfully');
    } catch (error) {
      showError('Failed to save preferences');
    } finally {
      setSaving(false);
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
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Delivery Methods */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Delivery Methods
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Email Notifications
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Receive alerts via email
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.emailNotifications}
                onChange={(e) =>
                  setFormData({ ...formData, emailNotifications: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Browser Notifications
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Receive real-time alerts in the app
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.browserNotifications}
                onChange={(e) =>
                  setFormData({ ...formData, browserNotifications: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* Alert Types */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Alert Types
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Trade Alerts
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Notifications for successful and failed trades
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.tradeAlerts}
                onChange={(e) =>
                  setFormData({ ...formData, tradeAlerts: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Price Alerts
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Notifications when watchlist prices are reached
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.priceAlerts}
                onChange={(e) =>
                  setFormData({ ...formData, priceAlerts: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Strategy Alerts
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Notifications for strategy errors and signals
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.strategyAlerts}
                onChange={(e) =>
                  setFormData({ ...formData, strategyAlerts: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Risk Alerts
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Notifications for stop-loss, take-profit, and loss limits
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.riskAlerts}
                onChange={(e) =>
                  setFormData({ ...formData, riskAlerts: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button type="submit" loading={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </Button>
        </div>
      </form>
    </Card>
  );
}
