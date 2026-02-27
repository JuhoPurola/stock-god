import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStrategyStore } from '../store/strategy-store';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Sliders, CheckCircle2, XCircle } from 'lucide-react';

export function StrategyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedStrategy, selectStrategy, loading } = useStrategyStore();

  useEffect(() => {
    if (id) {
      selectStrategy(id);
    }
  }, [id]);

  if (loading || !selectedStrategy) {
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
            {selectedStrategy.name}
          </h1>
          {selectedStrategy.description && (
            <p className="text-gray-600 mt-1">{selectedStrategy.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => navigate(`/strategy-optimizer?strategyId=${selectedStrategy.id}`)}
          >
            <Sliders className="w-4 h-4 mr-2" />
            Optimize Strategy
          </Button>
          <Badge variant={selectedStrategy.enabled ? 'success' : 'default'}>
            {selectedStrategy.enabled ? 'Active' : 'Disabled'}
          </Badge>
        </div>
      </div>

      {/* Factors */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Active Factors</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedStrategy.factors.map((factor) => (
              <div
                key={factor.type}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  {factor.enabled ? (
                    <CheckCircle2 className="w-5 h-5 text-success-600 mr-3" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400 mr-3" />
                  )}
                  <span
                    className={`font-medium ${
                      factor.enabled ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {factor.type}
                  </span>
                </div>
                <Badge variant={factor.enabled ? 'default' : 'default'}>
                  Weight: {(factor.weight * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stock Universe */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Stock Universe</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            {selectedStrategy.stockUniverse.length} stocks tracked by this strategy
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedStrategy.stockUniverse.map((symbol) => (
              <Badge key={symbol} variant="default">
                {symbol}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Management */}
      {selectedStrategy.riskManagement && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Risk Management</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Max Position Size</p>
                <p className="text-lg font-semibold">
                  {(selectedStrategy.riskManagement.maxPositionSize * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Max Positions</p>
                <p className="text-lg font-semibold">
                  {selectedStrategy.riskManagement.maxPositions}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Stop Loss</p>
                <p className="text-lg font-semibold text-danger-600">
                  {(selectedStrategy.riskManagement.stopLossPercent * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Take Profit</p>
                <p className="text-lg font-semibold text-success-600">
                  {selectedStrategy.riskManagement.takeProfitPercent
                    ? `${(selectedStrategy.riskManagement.takeProfitPercent * 100).toFixed(1)}%`
                    : 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
