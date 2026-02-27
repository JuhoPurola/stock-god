import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StrategyOptimizer } from '../components/strategy/StrategyOptimizer';
import { GeneticOptimizer } from '../components/strategy/GeneticOptimizer';
import { StrategyComparison } from '../components/strategy/StrategyComparison';
import { StrategyPresetManager } from '../components/strategy/StrategyPresetManager';
import { MonteCarloSimulation } from '../components/analysis/MonteCarloSimulation';
import { WalkForwardAnalysis } from '../components/analysis/WalkForwardAnalysis';
import { apiClient } from '../lib/api-client';
import type { Strategy, Portfolio, FactorConfig } from '@stock-picker/shared';
import { ArrowLeft, Zap, Sliders, Dna, GitCompare, Activity, FastForward, Save } from 'lucide-react';

type OptimizerMode = 'manual' | 'genetic' | 'compare' | 'montecarlo' | 'walkforward' | 'presets';

export function StrategyOptimizerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const strategyId = searchParams.get('strategyId');

  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(strategyId || '');
  const [mode, setMode] = useState<OptimizerMode>('manual');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStrategyId) {
      loadStrategy(selectedStrategyId);
    }
  }, [selectedStrategyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all portfolios and their strategies
      const portfolios = await apiClient.getPortfolios();
      const allStrategies: Strategy[] = [];

      for (const p of portfolios) {
        const strategyList = await apiClient.getStrategies(p.id);
        allStrategies.push(...strategyList);
      }

      setStrategies(allStrategies);

      // If strategyId provided, load that strategy
      if (strategyId) {
        setSelectedStrategyId(strategyId);
      } else if (allStrategies.length > 0) {
        setSelectedStrategyId(allStrategies[0].id);
      }
    } catch (error) {
      console.error('Failed to load strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStrategy = async (id: string) => {
    try {
      const strategyData = await apiClient.getStrategy(id);
      setStrategy(strategyData);

      // Load portfolio info
      const portfolioData = await apiClient.getPortfolio(strategyData.portfolioId);
      setPortfolio(portfolioData);
    } catch (error) {
      console.error('Failed to load strategy:', error);
    }
  };

  const handleStrategySaved = (updatedStrategy: Strategy) => {
    setStrategy(updatedStrategy);
    // Update in list
    setStrategies(strategies.map((s) => (s.id === updatedStrategy.id ? updatedStrategy : s)));
  };

  const handleGeneticOptimizationComplete = async (bestFactors: FactorConfig[]) => {
    if (!strategy) return;

    try {
      const updatedStrategy = await apiClient.updateStrategy(strategy.id, {
        factors: bestFactors,
      });
      handleStrategySaved(updatedStrategy);
    } catch (error) {
      console.error('Failed to save optimized strategy:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-12">
            <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No strategies found
            </h3>
            <p className="text-gray-600 mb-4">
              Create a strategy first to optimize its parameters
            </p>
            <Button onClick={() => navigate('/portfolios')}>Go to Portfolios</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center mb-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(-1)}
              className="mr-3"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Strategy Optimizer</h1>
          </div>
          <p className="text-gray-600">
            Fine-tune factor weights and test signal generation
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap items-center gap-2 bg-gray-100 rounded-lg p-1">
          <Button
            size="sm"
            variant={mode === 'manual' ? 'primary' : 'secondary'}
            onClick={() => setMode('manual')}
          >
            <Sliders className="w-4 h-4 mr-1" />
            Manual
          </Button>
          <Button
            size="sm"
            variant={mode === 'genetic' ? 'primary' : 'secondary'}
            onClick={() => setMode('genetic')}
          >
            <Dna className="w-4 h-4 mr-1" />
            Genetic
          </Button>
          <Button
            size="sm"
            variant={mode === 'compare' ? 'primary' : 'secondary'}
            onClick={() => setMode('compare')}
          >
            <GitCompare className="w-4 h-4 mr-1" />
            Compare
          </Button>
          <Button
            size="sm"
            variant={mode === 'montecarlo' ? 'primary' : 'secondary'}
            onClick={() => setMode('montecarlo')}
          >
            <Activity className="w-4 h-4 mr-1" />
            Monte Carlo
          </Button>
          <Button
            size="sm"
            variant={mode === 'walkforward' ? 'primary' : 'secondary'}
            onClick={() => setMode('walkforward')}
          >
            <FastForward className="w-4 h-4 mr-1" />
            Walk-Forward
          </Button>
          <Button
            size="sm"
            variant={mode === 'presets' ? 'primary' : 'secondary'}
            onClick={() => setMode('presets')}
          >
            <Save className="w-4 h-4 mr-1" />
            Presets
          </Button>
        </div>
      </div>

      {/* Strategy Selector */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Select Strategy</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {strategies.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStrategyId(s.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedStrategyId === s.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <p className="font-semibold text-gray-900">{s.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {s.factors.filter((f) => f.enabled).length} active factors
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {s.stockUniverse.length} stocks
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mode-specific Content */}
      {mode === 'compare' ? (
        <StrategyComparison strategies={strategies} />
      ) : strategy && portfolio ? (
        <div>
          {/* Strategy Info Card - show for all modes except compare */}
          <Card className="mb-4">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{strategy.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Portfolio: {portfolio.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Stock Universe</p>
                  <p className="text-lg font-semibold">
                    {strategy.stockUniverse.length} stocks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Render based on mode */}
          {mode === 'manual' && (
            <StrategyOptimizer strategy={strategy} onSave={handleStrategySaved} />
          )}
          {mode === 'genetic' && (
            <GeneticOptimizer
              strategy={strategy}
              onOptimizationComplete={handleGeneticOptimizationComplete}
            />
          )}
          {mode === 'montecarlo' && (
            <MonteCarloSimulation strategy={strategy} initialCapital={100000} />
          )}
          {mode === 'walkforward' && (
            <WalkForwardAnalysis strategy={strategy} />
          )}
          {mode === 'presets' && (
            <StrategyPresetManager
              strategy={strategy}
              onApplyPreset={async (factors) => {
                try {
                  const updatedStrategy = await apiClient.updateStrategy(strategy.id, {
                    factors,
                  });
                  handleStrategySaved(updatedStrategy);
                  alert('Preset applied successfully!');
                } catch (error) {
                  console.error('Failed to apply preset:', error);
                  alert('Failed to apply preset. Please try again.');
                }
              }}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
