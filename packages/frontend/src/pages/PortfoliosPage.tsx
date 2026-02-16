import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortfolioStore } from '../store/portfolio-store';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CreatePortfolioModal } from '../components/portfolio/CreatePortfolioModal';
import { formatCurrency, formatPercent } from '@stock-picker/shared';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';

export function PortfoliosPage() {
  const { portfolios, fetchPortfolios, loading } = usePortfolioStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  if (loading && portfolios.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Portfolios</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Portfolio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolios.map((portfolio) => (
          <Link key={portfolio.id} to={`/portfolios/${portfolio.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {portfolio.name}
                  </h3>
                  {portfolio.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {portfolio.description}
                    </p>
                  )}
                </div>
                <Badge variant={portfolio.tradingMode === 'paper' ? 'warning' : 'success'}>
                  {portfolio.tradingMode}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(portfolio.totalValue)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Unrealized P&L</p>
                    <div className="flex items-center mt-1">
                      {portfolio.unrealizedPnL >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-danger-600 mr-1" />
                      )}
                      <span
                        className={`font-semibold ${
                          portfolio.unrealizedPnL >= 0
                            ? 'text-success-600'
                            : 'text-danger-600'
                        }`}
                      >
                        {formatCurrency(portfolio.unrealizedPnL)}
                      </span>
                      <span
                        className={`text-sm ml-2 ${
                          portfolio.unrealizedPnL >= 0
                            ? 'text-success-600'
                            : 'text-danger-600'
                        }`}
                      >
                        ({formatPercent(portfolio.unrealizedPnLPercent, 2, true)})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{portfolio.positionCount} positions</span>
                  <span>Cash: {formatCurrency(portfolio.cashBalance)}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {portfolios.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No portfolios yet</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First Portfolio
            </Button>
          </div>
        </Card>
      )}

      <CreatePortfolioModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
