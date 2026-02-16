import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { apiClient } from '../../lib/api-client';
import { OrderSide, OrderType, formatCurrency } from '@stock-picker/shared';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
  symbol?: string;
  onSuccess?: () => void;
}

export function TradeModal({
  isOpen,
  onClose,
  portfolioId,
  symbol: initialSymbol = '',
  onSuccess,
}: TradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    symbol: initialSymbol,
    side: OrderSide.BUY,
    quantity: '1',
    orderType: OrderType.MARKET,
    limitPrice: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiClient.executeTrade({
        portfolioId,
        symbol: formData.symbol.toUpperCase(),
        side: formData.side,
        quantity: parseInt(formData.quantity),
        orderType: formData.orderType,
        limitPrice: formData.limitPrice ? parseFloat(formData.limitPrice) : undefined,
      });

      // Reset form
      setFormData({
        symbol: '',
        side: OrderSide.BUY,
        quantity: '1',
        orderType: OrderType.MARKET,
        limitPrice: '',
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || 'Failed to execute trade'
      );
    } finally {
      setLoading(false);
    }
  };

  const estimatedCost =
    formData.orderType === 'market'
      ? 'Market price'
      : formData.limitPrice
      ? formatCurrency(parseFloat(formData.limitPrice) * parseInt(formData.quantity || '0'))
      : '—';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Execute Trade"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={formData.side === 'buy' ? 'success' : 'danger'}
            onClick={handleSubmit}
            loading={loading}
          >
            {formData.side === 'buy' ? 'Buy' : 'Sell'} {formData.symbol || 'Stock'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
            <p className="text-sm text-danger-700">{error}</p>
          </div>
        )}

        <Input
          label="Symbol"
          value={formData.symbol}
          onChange={(e) =>
            setFormData({ ...formData, symbol: e.target.value.toUpperCase() })
          }
          placeholder="AAPL"
          required
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Side
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, side: OrderSide.BUY })}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                formData.side === OrderSide.BUY
                  ? 'bg-success-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, side: OrderSide.SELL })}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                formData.side === OrderSide.SELL
                  ? 'bg-danger-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        <Input
          label="Quantity"
          type="number"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          min="1"
          step="1"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Type
          </label>
          <select
            value={formData.orderType}
            onChange={(e) =>
              setFormData({
                ...formData,
                orderType: e.target.value as OrderType,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="market">Market Order</option>
            <option value="limit">Limit Order</option>
          </select>
        </div>

        {formData.orderType === 'limit' && (
          <Input
            label="Limit Price"
            type="number"
            value={formData.limitPrice}
            onChange={(e) =>
              setFormData({ ...formData, limitPrice: e.target.value })
            }
            min="0"
            step="0.01"
            placeholder="0.00"
            required
          />
        )}

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Estimated Cost:</span>
            <span className="font-semibold text-gray-900">{estimatedCost}</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
