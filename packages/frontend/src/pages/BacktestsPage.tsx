import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BacktestRunner } from '../components/backtest/BacktestRunner';
import { BacktestResults } from '../components/backtest/BacktestResults';
import { apiClient } from '../lib/api-client';
import type { Backtest, Strategy } from '@stock-picker/shared';
import { BacktestStatus } from '@stock-picker/shared';
import { TrendingUp, Plus, RefreshCw, GitCompare } from 'lucide-react';

export function BacktestsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const strategyIdFromUrl = searchParams.get('strategyId');

  const [backtests, setBacktests] = useState<Backtest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRunner, setShowRunner] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load backtests and strategies in parallel
      const [backtestsData, strategiesData] = await Promise.all([
        apiClient.getBacktests(50),
        loadStrategies(),
      ]);

      setBacktests(backtestsData);
      setStrategies(strategiesData);

      // If strategyId in URL, pre-select that strategy
      if (strategyIdFromUrl && strategiesData.length > 0) {
        const strategy = strategiesData.find((s) => s.id === strategyIdFromUrl);
        if (strategy) {
          setSelectedStrategy(strategy);
          setShowRunner(true);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStrategies = async (): Promise<Strategy[]> => {
    // Load strategies from all portfolios
    // In a real app, might want to cache this or load per portfolio
    try {
      const portfolios = await apiClient.getPortfolios();
      const allStrategies: Strategy[] = [];

      for (const portfolio of portfolios) {
        const portfolioStrategies = await apiClient.getStrategies(portfolio.id);
        allStrategies.push(...portfolioStrategies);
      }

      return allStrategies;
    } catch (error) {
      console.error('Failed to load strategies:', error);
      return [];
    }
  };

  const handleBacktestComplete = (backtest: Backtest) => {
    setBacktests([backtest, ...backtests]);
    setShowRunner(false);
    setSelectedStrategy(null);
  };

  const handleBacktestDeleted = () => {
    loadData();
  };

  const handleNewBacktest = () => {
    if (strategies.length === 0) {
      alert('Please create a strategy first before running a backtest.');
      return;
    }
    setSelectedStrategy(strategies[0]);
    setShowRunner(true);
  };

  // Group backtests by status
  const runningBacktests = backtests.filter((b) => b.status === BacktestStatus.RUNNING);
  const completedBacktests = backtests.filter(
    (b) => b.status === BacktestStatus.COMPLETED
  );
  const failedBacktests = backtests.filter((b) => b.status === BacktestStatus.FAILED);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Backtests</h1>
          <p className="text-gray-600 mt-1">
            Test your strategies on historical data
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/backtests/compare')}
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare
          </Button>
          <Button variant="secondary" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleNewBacktest}>
            <Plus className="w-4 h-4 mr-2" />
            New Backtest
          </Button>
        </div>
      </div>

      {/* Backtest Runner */}
      {showRunner && selectedStrategy && (
        <div className="mb-6">
          <BacktestRunner
            strategy={selectedStrategy}
            onComplete={handleBacktestComplete}
            onCancel={() => {
              setShowRunner(false);
              setSelectedStrategy(null);
            }}
          />
        </div>
      )}

      {/* Strategy Selector for Runner */}
      {showRunner && !selectedStrategy && strategies.length > 0 && (
        <Card>
          <CardHeader>Select Strategy</CardHeader>
          <CardContent>
            <div className="space-y-2">
              {strategies.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => setSelectedStrategy(strategy)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <p className="font-medium">{strategy.name}</p>
                  <p className="text-sm text-gray-600">
                    {strategy.stockUniverse.length} stocks
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Running Backtests */}
      {runningBacktests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Running</h2>
          <div className="space-y-4">
            {runningBacktests.map((backtest) => (
              <BacktestResults
                key={backtest.id}
                backtest={backtest}
                onDelete={handleBacktestDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Backtests */}
      {completedBacktests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed</h2>
          <div className="space-y-4">
            {completedBacktests.map((backtest) => (
              <BacktestResults
                key={backtest.id}
                backtest={backtest}
                onDelete={handleBacktestDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Failed Backtests */}
      {failedBacktests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Failed</h2>
          <div className="space-y-4">
            {failedBacktests.map((backtest) => (
              <BacktestResults
                key={backtest.id}
                backtest={backtest}
                onDelete={handleBacktestDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {backtests.length === 0 && !showRunner && (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No backtests yet
              </h3>
              <p className="text-gray-600 mb-4">
                Run a backtest to see how your strategy would have performed
              </p>
              <Button onClick={handleNewBacktest}>
                <Plus className="w-4 h-4 mr-2" />
                Run Your First Backtest
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
