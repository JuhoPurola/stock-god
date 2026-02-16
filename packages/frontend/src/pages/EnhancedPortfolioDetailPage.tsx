import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '../store/portfolio-store';
import { apiClient } from '../lib/api-client';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PerformanceChart } from '../components/portfolio/PerformanceChart';
import { PerformanceMetrics } from '../components/portfolio/PerformanceMetrics';
import { PortfolioAllocation } from '../components/portfolio/PortfolioAllocation';
import { PositionCard } from '../components/portfolio/PositionCard';
import { TradeModal } from '../components/portfolio/TradeModal';
import type { PositionWithDetails, PortfolioSnapshot } from '@stock-picker/shared';
import { Plus, Settings, TrendingUp, BarChart3, PieChart as PieChartIcon, Trash2 } from 'lucide-react';

export function EnhancedPortfolioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedPortfolio, selectPortfolio, loading } = usePortfolioStore();
  const [positions, setPositions] = useState<PositionWithDetails[]>([]);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadPortfolioData(id);
    }
  }, [id]);

  const loadPortfolioData = async (portfolioId: string) => {
    setLoadingData(true);
    try {
      await selectPortfolio(portfolioId);
      const [positionsData, snapshotsData] = await Promise.all([
        apiClient.getPortfolioPositions(portfolioId),
        // In real implementation, fetch snapshots from API
        // For now, generate sample data
        generateSampleSnapshots(portfolioId),
      ]);
      setPositions(positionsData);
      setSnapshots(snapshotsData);
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !selectedPortfolio) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${selectedPortfolio.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await apiClient.deletePortfolio(id);
      navigate('/portfolios');
    } catch (error) {
      console.error('Failed to delete portfolio:', error);
      alert('Failed to delete portfolio. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletePosition = async (symbol: string) => {
    if (!id) return;

    const position = positions.find((p) => p.symbol === symbol);
    if (!position) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete your ${symbol} position (${position.quantity} shares)?`
    );

    if (!confirmed) return;

    try {
      await apiClient.deletePosition(id, symbol);
      // Reload portfolio data to refresh positions
      await loadPortfolioData(id);
    } catch (error) {
      console.error('Failed to delete position:', error);
      alert('Failed to delete position. Please try again.');
    }
  };

  // Generate sample snapshots for demo (replace with API call)
  const generateSampleSnapshots = async (
    portfolioId: string
  ): Promise<PortfolioSnapshot[]> => {
    const snapshots: PortfolioSnapshot[] = [];
    const now = new Date();
    let value = 100000;

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Random walk
      value += (Math.random() - 0.48) * 1000;

      snapshots.push({
        id: `${i}`,
        portfolioId,
        timestamp: date,
        totalValue: value,
        cashBalance: value * 0.2,
        positionsValue: value * 0.8,
        dailyReturn: (Math.random() - 0.5) * 500,
        totalReturn: value - 100000,
        totalReturnPercent: ((value - 100000) / 100000) * 100,
      });
    }

    return snapshots;
  };

  const handleTradeClick = (symbol?: string) => {
    setSelectedSymbol(symbol);
    setShowTradeModal(true);
  };

  const handleTradeSuccess = () => {
    if (id) {
      loadPortfolioData(id);
    }
  };

  if (loading || !selectedPortfolio) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const latestSnapshot = snapshots[snapshots.length - 1];
  const performanceData = {
    totalValue: selectedPortfolio.totalValue,
    totalReturn: latestSnapshot?.totalReturn || 0,
    totalReturnPercent: latestSnapshot?.totalReturnPercent || 0,
    dayReturn: selectedPortfolio.dayReturn,
    dayReturnPercent: selectedPortfolio.dayReturnPercent,
    sharpeRatio: 1.2, // Would be calculated from actual data
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <Button variant="secondary" onClick={() => handleTradeClick()}>
            <Plus className="w-4 h-4 mr-2" />
            New Trade
          </Button>
          <Link to={`/portfolios/${id}/strategies`}>
            <Button>
              <Settings className="w-4 h-4 mr-2" />
              Strategies
            </Button>
          </Link>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleting}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <PerformanceMetrics {...performanceData} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                Performance
              </div>
            </CardHeader>
            <CardContent>
              <PerformanceChart snapshots={snapshots} type="area" />
            </CardContent>
          </Card>
        </div>

        {/* Allocation Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2 text-primary-600" />
              Allocation
            </div>
          </CardHeader>
          <CardContent>
            <PortfolioAllocation
              positions={positions}
              cashBalance={selectedPortfolio.cashBalance}
            />
          </CardContent>
        </Card>
      </div>

      {/* Positions Section */}
      <Card>
        <CardHeader
          action={
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded ${
                  viewMode === 'table'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          }
        >
          <span>Positions ({positions.length})</span>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-8 text-gray-500">
              Loading positions...
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                No positions yet. Execute trades to build your portfolio.
              </p>
              <Button onClick={() => handleTradeClick()}>
                <Plus className="w-4 h-4 mr-2" />
                Execute First Trade
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {positions.map((position) => (
                <PositionCard
                  key={position.id}
                  position={position}
                  onTrade={handleTradeClick}
                  onDelete={handleDeletePosition}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Symbol
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Avg Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Current
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Value
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      P&L
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
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
                      <td className="px-4 py-4 text-right">{position.quantity}</td>
                      <td className="px-4 py-4 text-right">
                        ${position.averagePrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        ${position.currentPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right font-medium">
                        ${position.marketValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={`font-medium ${
                            position.unrealizedPnL >= 0
                              ? 'text-success-600'
                              : 'text-danger-600'
                          }`}
                        >
                          ${position.unrealizedPnL.toFixed(2)}
                        </span>
                        <br />
                        <span className="text-xs text-gray-600">
                          {position.unrealizedPnLPercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleTradeClick(position.symbol)}
                          >
                            Trade
                          </Button>
                          <button
                            onClick={() => handleDeletePosition(position.symbol)}
                            className="p-2 text-gray-400 hover:text-danger-600 transition-colors"
                            title="Delete position"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade Modal */}
      <TradeModal
        isOpen={showTradeModal}
        onClose={() => {
          setShowTradeModal(false);
          setSelectedSymbol(undefined);
        }}
        portfolioId={id!}
        symbol={selectedSymbol}
        onSuccess={handleTradeSuccess}
      />
    </div>
  );
}
