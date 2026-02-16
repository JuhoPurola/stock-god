import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatPercent } from '@stock-picker/shared';
import type { PositionWithDetails } from '@stock-picker/shared';
import { TrendingUp, TrendingDown, Trash2 } from 'lucide-react';

interface PositionCardProps {
  position: PositionWithDetails;
  onTrade?: (symbol: string) => void;
  onDelete?: (symbol: string) => void;
}

export function PositionCard({ position, onTrade, onDelete }: PositionCardProps) {
  const isGain = position.unrealizedPnL >= 0;

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {position.symbol}
          </h3>
          <p className="text-sm text-gray-600">{position.stock.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isGain ? 'success' : 'danger'} size="sm">
            {isGain ? 'Gain' : 'Loss'}
          </Badge>
          {onDelete && (
            <button
              onClick={() => onDelete(position.symbol)}
              className="p-1 text-gray-400 hover:text-danger-600 transition-colors"
              title="Delete position"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-600">Quantity</p>
          <p className="text-lg font-semibold text-gray-900">
            {position.quantity} shares
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Market Value</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(position.marketValue)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-600">Avg Price</p>
          <p className="text-sm text-gray-900">
            {formatCurrency(position.averagePrice)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Current Price</p>
          <p className="text-sm text-gray-900">
            {formatCurrency(position.currentPrice)}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Unrealized P&L</span>
          <div className="text-right">
            <div className="flex items-center justify-end">
              {isGain ? (
                <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger-600 mr-1" />
              )}
              <span
                className={`font-semibold ${
                  isGain ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {formatCurrency(position.unrealizedPnL)}
              </span>
            </div>
            <p
              className={`text-sm ${
                isGain ? 'text-success-600' : 'text-danger-600'
              }`}
            >
              {formatPercent(position.unrealizedPnLPercent, 2, true)}
            </p>
          </div>
        </div>
      </div>

      {onTrade && (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => onTrade(position.symbol)}
          >
            Buy More
          </Button>
          <Button
            variant="danger"
            size="sm"
            fullWidth
            onClick={() => onTrade(position.symbol)}
          >
            Sell
          </Button>
        </div>
      )}
    </Card>
  );
}
