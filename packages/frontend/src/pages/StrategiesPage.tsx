import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStrategyStore } from '../store/strategy-store';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CreateStrategyModal } from '../components/CreateStrategyModal';
import { Plus, Play, Pause, Activity } from 'lucide-react';

export function StrategiesPage() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();
  const { strategies, fetchStrategies, toggleStrategy, loading } =
    useStrategyStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (portfolioId) {
      fetchStrategies(portfolioId);
    }
  }, [portfolioId]);

  const handleToggle = async (id: string) => {
    await toggleStrategy(id);
    if (portfolioId) {
      fetchStrategies(portfolioId);
    }
  };

  const handleCreateSuccess = () => {
    if (portfolioId) {
      fetchStrategies(portfolioId);
    }
  };

  if (loading && strategies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Strategies</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Strategy
        </Button>
      </div>

      {strategies.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No strategies yet</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create Your First Strategy
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {strategies.map((strategy) => (
            <Card key={strategy.id}>
              <CardHeader
                action={
                  <Button
                    size="sm"
                    variant={strategy.enabled ? 'danger' : 'success'}
                    onClick={() => handleToggle(strategy.id)}
                  >
                    {strategy.enabled ? (
                      <>
                        <Pause className="w-4 h-4 mr-1" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Enable
                      </>
                    )}
                  </Button>
                }
              >
                <div className="flex items-center space-x-2">
                  <span>{strategy.name}</span>
                  <Badge variant={strategy.enabled ? 'success' : 'default'}>
                    {strategy.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {strategy.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {strategy.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Factors</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {strategy.factors.map((factor, index) => (
                        <Badge key={index} variant="info" size="sm">
                          {factor.name} ({(factor.weight * 100).toFixed(0)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Stock Universe
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {strategy.stockUniverse.slice(0, 5).map((symbol) => (
                        <Badge key={symbol} size="sm">
                          {symbol}
                        </Badge>
                      ))}
                      {strategy.stockUniverse.length > 5 && (
                        <Badge size="sm">
                          +{strategy.stockUniverse.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Max Position Size:{' '}
                      {(strategy.riskManagement.maxPositionSize * 100).toFixed(0)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      Stop Loss:{' '}
                      {(strategy.riskManagement.stopLossPercent * 100).toFixed(1)}%
                    </p>
                  </div>

                  {/* Run Backtest Button */}
                  <div className="pt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => navigate(`/backtests?strategyId=${strategy.id}`)}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Run Backtest
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Strategy Modal */}
      {portfolioId && (
        <CreateStrategyModal
          portfolioId={portfolioId}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
