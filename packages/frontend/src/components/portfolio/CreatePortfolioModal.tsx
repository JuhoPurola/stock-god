import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { usePortfolioStore } from '../../store/portfolio-store';
import { TradingMode } from '@stock-picker/shared';

interface CreatePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePortfolioModal({
  isOpen,
  onClose,
}: CreatePortfolioModalProps) {
  const { createPortfolio, loading } = usePortfolioStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    initialCash: '10000',
    tradingMode: TradingMode.PAPER,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPortfolio({
        name: formData.name,
        description: formData.description || undefined,
        initialCash: parseFloat(formData.initialCash),
        tradingMode: formData.tradingMode,
      });
      onClose();
      setFormData({
        name: '',
        description: '',
        initialCash: '10000',
        tradingMode: TradingMode.PAPER,
      });
    } catch (error) {
      console.error('Failed to create portfolio:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Portfolio"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Create Portfolio
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Portfolio Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="My Trading Portfolio"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
            placeholder="Optional description..."
          />
        </div>

        <Input
          label="Initial Cash"
          type="number"
          value={formData.initialCash}
          onChange={(e) =>
            setFormData({ ...formData, initialCash: e.target.value })
          }
          min="0"
          step="0.01"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trading Mode
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="paper"
                checked={formData.tradingMode === 'paper'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tradingMode: e.target.value as TradingMode,
                  })
                }
                className="mr-2"
              />
              <span className="text-sm">Paper Trading (Simulated)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="live"
                checked={formData.tradingMode === 'live'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tradingMode: e.target.value as TradingMode,
                  })
                }
                className="mr-2"
              />
              <span className="text-sm">Live Trading (Real Money)</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
