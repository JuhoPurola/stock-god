import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { usePortfolioStore } from '../store/portfolio-store';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatPercent } from '@stock-picker/shared';
import { TrendingUp, TrendingDown, DollarSign, Briefcase } from 'lucide-react';

export function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();
  const { portfolios, fetchPortfolios, loading } = usePortfolioStore();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchPortfolios();
    }
  }, [isAuthenticated, authLoading]);

  const totalValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0);
  const totalPnL = portfolios.reduce((sum, p) => sum + p.unrealizedPnL, 0);
  const totalPnLPercent = totalValue > 0 ? (totalPnL / totalValue) * 100 : 0;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Stock Picker</h2>
              <p className="text-gray-600 mb-6">Please log in to view your dashboard and manage portfolios</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && portfolios.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading portfolios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/portfolios">
          <Button>View All Portfolios</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total P&L</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  totalPnL >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {formatCurrency(totalPnL)}
              </p>
              <p
                className={`text-sm ${
                  totalPnL >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {formatPercent(totalPnLPercent, 2, true)}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                totalPnL >= 0 ? 'bg-success-100' : 'bg-danger-100'
              }`}
            >
              {totalPnL >= 0 ? (
                <TrendingUp className="w-6 h-6 text-success-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-danger-600" />
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Portfolios</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {portfolios.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Portfolios List */}
      <Card>
        <CardHeader>
          <span>Your Portfolios</span>
        </CardHeader>
        <CardContent>
          {portfolios.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No portfolios yet</p>
              <Link to="/portfolios">
                <Button>Create Your First Portfolio</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {portfolios.map((portfolio) => (
                <Link
                  key={portfolio.id}
                  to={`/portfolios/${portfolio.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {portfolio.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {portfolio.positionCount} positions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(portfolio.totalValue)}
                      </p>
                      <p
                        className={`text-sm ${
                          portfolio.unrealizedPnL >= 0
                            ? 'text-success-600'
                            : 'text-danger-600'
                        }`}
                      >
                        {formatCurrency(portfolio.unrealizedPnL)} (
                        {formatPercent(portfolio.unrealizedPnLPercent, 2, true)})
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
