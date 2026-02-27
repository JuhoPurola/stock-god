import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { usePortfolioStore } from '../store/portfolio-store';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatPercent } from '@stock-picker/shared';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Activity, Zap } from 'lucide-react';
import PortfolioValueChart from '../components/dashboard/PortfolioValueChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import TopPerformers from '../components/dashboard/TopPerformers';
import QuickActions from '../components/dashboard/QuickActions';
import { DashboardSkeleton } from '../components/ui/Skeleton';

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

  // Generate mock portfolio value chart data (last 30 days)
  const portfolioValueData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Simulate value fluctuation
      const baseValue = totalValue > 0 ? totalValue : 10000;
      const randomChange = (Math.random() - 0.5) * 1000;
      const value = baseValue + randomChange;
      data.push({
        date: date.toISOString(),
        value: value > 0 ? value : baseValue,
      });
    }
    return data;
  }, [totalValue]);

  // Mock recent activity
  const recentActivity = useMemo(() => {
    return [
      {
        id: '1',
        type: 'trade' as const,
        title: 'Buy order executed',
        description: 'Bought 10 shares of AAPL',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'success' as const,
      },
      {
        id: '2',
        type: 'alert' as const,
        title: 'Price alert triggered',
        description: 'TSLA reached your target price',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: '3',
        type: 'strategy' as const,
        title: 'Strategy signal generated',
        description: 'Momentum strategy suggests BUY for MSFT',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        status: 'info' as const,
      },
    ];
  }, []);

  // Note: positions would need to be fetched separately
  // For now using empty array as placeholder
  const allPositions = useMemo(() => {
    return [];
  }, []);

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
    return <DashboardSkeleton />;
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

      {/* Charts and Widgets Row */}
      {portfolios.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Value Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Portfolio Value (30 Days)</span>
              </div>
            </CardHeader>
            <CardContent>
              <PortfolioValueChart data={portfolioValueData} />
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span>Top Performers</span>
              </div>
            </CardHeader>
            <CardContent>
              <TopPerformers positions={allPositions} limit={5} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions and Recent Activity */}
      {portfolios.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600" />
                <span>Quick Actions</span>
              </div>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span>Recent Activity</span>
              </div>
            </CardHeader>
            <CardContent>
              <RecentActivity activities={recentActivity} maxItems={5} />
            </CardContent>
          </Card>
        </div>
      )}

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
