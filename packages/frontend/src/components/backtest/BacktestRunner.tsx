import { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { apiClient } from '../../lib/api-client';
import type { Strategy, Backtest, CreateBacktestRequest } from '@stock-picker/shared';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface BacktestRunnerProps {
  strategy: Strategy;
  onComplete?: (backtest: Backtest) => void;
  onCancel?: () => void;
}

export function BacktestRunner({ strategy, onComplete, onCancel }: BacktestRunnerProps) {
  const [name, setName] = useState(`${strategy.name} Backtest`);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  ); // 1 year ago
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [initialCash, setInitialCash] = useState('100000');
  const [commission, setCommission] = useState('1.00');
  const [slippage, setSlippage] = useState('0.001');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date');
      return;
    }

    if (parseFloat(initialCash) <= 0) {
      setError('Initial cash must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const request: CreateBacktestRequest = {
        name,
        config: {
          strategyId: strategy.id,
          portfolioId: strategy.portfolioId,
          startDate,
          endDate,
          initialCash: parseFloat(initialCash),
          commission: parseFloat(commission),
          slippage: parseFloat(slippage),
        },
      };

      const backtest = await apiClient.createBacktest(request);

      if (onComplete) {
        onComplete(backtest);
      }
    } catch (err: any) {
      console.error('Failed to create backtest:', err);
      setError(err.response?.data?.error || 'Failed to create backtest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
          Run Backtest
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Backtest Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Initial Cash */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Initial Cash ($)
            </label>
            <input
              type="number"
              value={initialCash}
              onChange={(e) => setInitialCash(e.target.value)}
              min="0"
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Commission */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission ($ per trade)
              </label>
              <input
                type="number"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slippage (%)
              </label>
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                min="0"
                step="0.001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Strategy Info */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium text-gray-700">Strategy: {strategy.name}</p>
            <p className="text-xs text-gray-600 mt-1">
              {strategy.stockUniverse.length} stocks in universe
            </p>
          </div>

          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={loading} disabled={loading}>
              Run Backtest
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
