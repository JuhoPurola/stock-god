import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAlertStore } from '../../store/alert-store';
import { useToast } from '../../hooks/useToast';

interface CreatePriceAlertModalProps {
  onClose: () => void;
}

export function CreatePriceAlertModal({ onClose }: CreatePriceAlertModalProps) {
  const { createPriceAlert } = useAlertStore();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    symbol: '',
    condition: 'above' as 'above' | 'below' | 'percent_change',
    targetPrice: '',
    percentChange: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data: any = {
        symbol: formData.symbol.toUpperCase().trim(),
        condition: formData.condition,
      };

      if (formData.condition === 'percent_change') {
        data.percentChange = parseFloat(formData.percentChange);
        if (isNaN(data.percentChange)) {
          showError('Please enter a valid percentage');
          setLoading(false);
          return;
        }
      } else {
        data.targetPrice = parseFloat(formData.targetPrice);
        if (isNaN(data.targetPrice) || data.targetPrice <= 0) {
          showError('Please enter a valid price');
          setLoading(false);
          return;
        }
      }

      await createPriceAlert(data);
      showSuccess(`Price alert created for ${data.symbol}`);
      onClose();
    } catch (error) {
      showError('Failed to create price alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Create Price Alert">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Symbol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Stock Symbol
          </label>
          <Input
            type="text"
            value={formData.symbol}
            onChange={(e) =>
              setFormData({ ...formData, symbol: e.target.value.toUpperCase() })
            }
            placeholder="AAPL"
            required
            autoFocus
          />
        </div>

        {/* Condition Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Condition
          </label>
          <select
            value={formData.condition}
            onChange={(e) =>
              setFormData({
                ...formData,
                condition: e.target.value as any,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="above">Price above</option>
            <option value="below">Price below</option>
            <option value="percent_change">Percent change</option>
          </select>
        </div>

        {/* Target Value */}
        {formData.condition === 'percent_change' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Percent Change (%)
            </label>
            <Input
              type="number"
              step="0.1"
              value={formData.percentChange}
              onChange={(e) =>
                setFormData({ ...formData, percentChange: e.target.value })
              }
              placeholder="5.0"
              required
            />
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Alert will trigger when price changes by this percentage in either direction
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Price ($)
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.targetPrice}
              onChange={(e) =>
                setFormData({ ...formData, targetPrice: e.target.value })
              }
              placeholder="150.00"
              required
            />
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Alert will trigger when price goes {formData.condition} this value
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Alert
          </Button>
        </div>
      </form>
    </Modal>
  );
}
