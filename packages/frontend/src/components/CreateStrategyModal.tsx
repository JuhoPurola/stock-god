import { useState } from 'react';
import { apiClient } from '../lib/api-client';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { StockSearchInput } from './StockSearchInput';
import type { Stock } from '@stock-picker/shared';
import { FactorType } from '@stock-picker/shared';
import { X, Plus, Trash2 } from 'lucide-react';

interface CreateStrategyModalProps {
  portfolioId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FactorInput {
  name: string;
  weight: number;
}

export function CreateStrategyModal({
  portfolioId,
  isOpen,
  onClose,
  onSuccess,
}: CreateStrategyModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStocks, setSelectedStocks] = useState<Stock[]>([]);
  const [factors, setFactors] = useState<FactorInput[]>([
    { name: 'RSI', weight: 0.5 },
    { name: 'MACD', weight: 0.5 },
  ]);
  const [maxPositionSize, setMaxPositionSize] = useState('10');
  const [stopLoss, setStopLoss] = useState('5');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddStock = (stock: Stock) => {
    if (!selectedStocks.find((s) => s.symbol === stock.symbol)) {
      setSelectedStocks([...selectedStocks, stock]);
    }
  };

  const handleRemoveStock = (symbol: string) => {
    setSelectedStocks(selectedStocks.filter((s) => s.symbol !== symbol));
  };

  const handleAddFactor = () => {
    setFactors([...factors, { name: '', weight: 0 }]);
  };

  const handleRemoveFactor = (index: number) => {
    setFactors(factors.filter((_, i) => i !== index));
  };

  const handleFactorChange = (
    index: number,
    field: 'name' | 'weight',
    value: string | number
  ) => {
    const updated = [...factors];
    updated[index] = { ...updated[index], [field]: value };
    setFactors(updated);
  };

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Strategy name is required');
      return;
    }

    if (selectedStocks.length === 0) {
      setError('Please select at least one stock');
      return;
    }

    if (factors.length === 0) {
      setError('Please add at least one factor');
      return;
    }

    if (Math.abs(totalWeight - 1) > 0.01) {
      setError('Factor weights must sum to 1.0 (100%)');
      return;
    }

    setCreating(true);
    try {
      await apiClient.createStrategy({
        portfolioId,
        name,
        description: description || undefined, // Convert empty string to undefined
        factors: factors.map((f) => ({
          name: f.name,
          type: FactorType.TECHNICAL,
          weight: f.weight,
          enabled: true,
          params: {},
        })),
        riskManagement: {
          maxPositionSize: parseFloat(maxPositionSize) / 100,
          maxPositions: 10,
          stopLossPercent: parseFloat(stopLoss) / 100,
        },
        stockUniverse: selectedStocks.map((s) => s.symbol),
        enabled: false,
      });

      onSuccess();
      onClose();

      // Reset form
      setName('');
      setDescription('');
      setSelectedStocks([]);
      setFactors([
        { name: 'RSI', weight: 0.5 },
        { name: 'MACD', weight: 0.5 },
      ]);
      setMaxPositionSize('10');
      setStopLoss('5');
    } catch (err: any) {
      console.error('Failed to create strategy:', err);
      setError(err.response?.data?.error || 'Failed to create strategy');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Strategy</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strategy Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Momentum RSI Strategy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your strategy..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Stock Universe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Universe * ({selectedStocks.length} selected)
            </label>
            <StockSearchInput
              onSelect={handleAddStock}
              onRemove={handleRemoveStock}
              selectedStocks={selectedStocks}
              multiple
              placeholder="Search and add stocks..."
            />
          </div>

          {/* Factors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Factors * (Total weight: {(totalWeight * 100).toFixed(0)}%)
              </label>
              <Button size="sm" variant="secondary" onClick={handleAddFactor}>
                <Plus className="w-4 h-4 mr-1" />
                Add Factor
              </Button>
            </div>

            <div className="space-y-2">
              {factors.map((factor, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={factor.name}
                    onChange={(e) =>
                      handleFactorChange(index, 'name', e.target.value)
                    }
                    placeholder="Factor name (e.g., RSI, MACD)"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={factor.weight}
                    onChange={(e) =>
                      handleFactorChange(index, 'weight', parseFloat(e.target.value))
                    }
                    placeholder="Weight"
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {(factor.weight * 100).toFixed(0)}%
                  </span>
                  {factors.length > 1 && (
                    <button
                      onClick={() => handleRemoveFactor(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {Math.abs(totalWeight - 1) > 0.01 && (
              <p className="text-sm text-orange-600 mt-1">
                ⚠️ Weights must sum to 100% (currently {(totalWeight * 100).toFixed(0)}%)
              </p>
            )}
          </div>

          {/* Risk Management */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Position Size (%)
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={maxPositionSize}
                onChange={(e) => setMaxPositionSize(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stop Loss (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={creating}>
            Create Strategy
          </Button>
        </div>
      </div>
    </div>
  );
}
