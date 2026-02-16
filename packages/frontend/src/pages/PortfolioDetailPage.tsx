import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePortfolioStore } from '../store/portfolio-store';
import { apiClient } from '../lib/api-client';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, formatPercent } from '@stock-picker/shared';
import type { PositionWithDetails } from '@stock-picker/shared';
import { TrendingUp, TrendingDown, Settings } from 'lucide-react';

export function PortfolioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { selectedPortfolio, selectPortfolio, loading } = usePortfolioStore();
  const [positions, setPositions] = useState<PositionWithDetails[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);

  useEffect(() => {
    if (id) {
      selectPortfolio(id);
      loadPositions(id);
    }
  }, [id]);

  const loadPositions = async (portfolioId: string) => {
    setLoadingPositions(true);
    try {
      const data = await apiClient.getPortfolioPositions(portfolioId);
      setPositions(data);
    } catch (error) {
      console.error('Failed to load positions:', error);
    } finally {
      setLoadingPositions(false);
    }
  };

  if (loading || !selectedPortfolio) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedPortfolio.name}
          </h1>
          {selectedPortfolio.description && (
            <p className="text-gray-600 mt-1">{selectedPortfolio.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <Badge
            variant={
              selectedPortfolio.tradingMode === 'paper' ? 'warning' : 'success'
            }
          >
            {selectedPortfolio.tradingMode}
          </Badge>
          <Link to={`/portfolios/${id}/strategies`}>
            <Button>
              <Settings className="w-4 h-4 mr-2" />
              Strategies
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <p className="text-sm font-medium text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(selectedPortfolio.totalValue)}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-gray-600">Cash Balance</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(selectedPortfolio.cashBalance)}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-gray-600">Positions Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(selectedPortfolio.positionsValue)}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-gray-600">Unrealized P&L</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              selectedPortfolio.unrealizedPnL >= 0
                ? 'text-success-600'
                : 'text-danger-600'
            }`}
          >
            {formatCurrency(selectedPortfolio.unrealizedPnL)}
          </p>
          <p
            className={`text-sm ${
              selectedPortfolio.unrealizedPnL >= 0
                ? 'text-success-600'
                : 'text-danger-600'
            }`}
          >
            {formatPercent(selectedPortfolio.unrealizedPnLPercent, 2, true)}
          </p>
        </Card>
      </div>

      {/* Positions */}
      <Card>
        <CardHeader>
          <span>Positions ({positions.length})</span>
        </CardHeader>
        <CardContent>
          {loadingPositions ? (
            <div className="text-center py-8 text-gray-500">Loading positions...</div>
          ) : positions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No positions yet. Execute trades to build your portfolio.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Market Value
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unrealized P&L
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {positions.map((position) => (
                    <tr key={position.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {position.symbol}
                          </p>
                          <p className="text-sm text-gray-600">
                            {position.stock.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-gray-900">
                        {position.quantity}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-900">
                        {formatCurrency(position.averagePrice)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-900">
                        {formatCurrency(position.currentPrice)}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(position.marketValue)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end">
                          {position.unrealizedPnL >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-danger-600 mr-1" />
                          )}
                          <span
                            className={`font-semibold ${
                              position.unrealizedPnL >= 0
                                ? 'text-success-600'
                                : 'text-danger-600'
                            }`}
                          >
                            {formatCurrency(position.unrealizedPnL)}
                          </span>
                        </div>
                        <p
                          className={`text-sm text-right ${
                            position.unrealizedPnL >= 0
                              ? 'text-success-600'
                              : 'text-danger-600'
                          }`}
                        >
                          {formatPercent(position.unrealizedPnLPercent, 2, true)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
