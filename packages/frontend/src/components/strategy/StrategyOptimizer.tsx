import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiClient } from '../../lib/api-client';
import type { Strategy, FactorConfig, Signal } from '@stock-picker/shared';
import {
  Sliders,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  Save,
  RotateCcw,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface StrategyOptimizerProps {
  strategy: Strategy;
  onSave?: (updatedStrategy: Strategy) => void;
}

interface FactorWeight {
  type: string;
  weight: number;
  enabled: boolean;
}

interface TestResult {
  symbol: string;
  signal: Signal;
  score: number;
}

export function StrategyOptimizer({ strategy, onSave }: StrategyOptimizerProps) {
  const [factors, setFactors] = useState<FactorWeight[]>(
    strategy.factors.map((f) => ({
      type: f.type,
      weight: f.weight,
      enabled: f.enabled,
    }))
  );
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Check if there are changes
    const changed = factors.some((f, i) => {
      const original = strategy.factors[i];
      return f.weight !== original.weight || f.enabled !== original.enabled;
    });
    setHasChanges(changed);
  }, [factors, strategy.factors]);

  const handleWeightChange = (index: number, newWeight: number) => {
    const newFactors = [...factors];
    newFactors[index].weight = newWeight;
    setFactors(newFactors);
  };

  const handleToggleFactor = (index: number) => {
    const newFactors = [...factors];
    newFactors[index].enabled = !newFactors[index].enabled;
    setFactors(newFactors);
  };

  const handleReset = () => {
    setFactors(
      strategy.factors.map((f) => ({
        type: f.type,
        weight: f.weight,
        enabled: f.enabled,
      }))
    );
    setTestResults([]);
  };

  const handleTestSignals = async () => {
    setTesting(true);
    try {
      // Test on a few stocks from the universe
      const testSymbols = strategy.stockUniverse.slice(0, 5);
      const results: TestResult[] = [];

      for (const symbol of testSymbols) {
        try {
          const signal = await apiClient.testStrategy(strategy.id, symbol);
          results.push({
            symbol,
            signal,
            score: calculateOverallScore(signal),
          });
        } catch (error) {
          console.error(`Failed to test ${symbol}:`, error);
        }
      }

      setTestResults(results);
    } catch (error) {
      console.error('Failed to test signals:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedFactors: FactorConfig[] = strategy.factors.map((f, i) => ({
        ...f,
        weight: factors[i].weight,
        enabled: factors[i].enabled,
      }));

      const updatedStrategy = await apiClient.updateStrategy(strategy.id, {
        factors: updatedFactors,
      });

      if (onSave) {
        onSave(updatedStrategy);
      }

      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save strategy:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculateOverallScore = (signal: Signal): number => {
    // Calculate a weighted score based on signal strength
    return signal.strength * 100;
  };

  // Data for radar chart
  const radarData = factors.map((f) => ({
    factor: f.type,
    weight: f.enabled ? f.weight * 100 : 0,
    maxWeight: 100,
  }));

  // Calculate total weight
  const totalWeight = factors
    .filter((f) => f.enabled)
    .reduce((sum, f) => sum + f.weight, 0);
  const isBalanced = Math.abs(totalWeight - 1.0) < 0.01;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Sliders className="w-5 h-5 mr-2 text-primary-600" />
              <h2 className="text-xl font-semibold">Strategy Optimizer</h2>
            </div>
            <div className="flex items-center space-x-2">
              {hasChanges && (
                <Badge variant="warning" size="sm">
                  Unsaved Changes
                </Badge>
              )}
              {isBalanced ? (
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Balanced
                </Badge>
              ) : (
                <Badge variant="danger" size="sm">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Sum ≠ 1.0
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Adjust factor weights to optimize your strategy. Weights must sum to 1.0 for
            enabled factors.
          </p>
          <div className="mt-2 text-sm">
            <span className="font-medium">Current Total:</span>{' '}
            <span
              className={`font-bold ${
                isBalanced ? 'text-success-600' : 'text-danger-600'
              }`}
            >
              {totalWeight.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factor Controls */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Factor Weights</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {factors.map((factor, index) => (
                <div key={factor.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={factor.enabled}
                        onChange={() => handleToggleFactor(index)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label className="ml-2 text-sm font-medium text-gray-900">
                        {factor.type}
                      </label>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        factor.enabled ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {(factor.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={factor.weight * 100}
                    onChange={(e) =>
                      handleWeightChange(index, parseInt(e.target.value) / 100)
                    }
                    disabled={!factor.enabled}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: factor.enabled
                        ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                            factor.weight * 100
                          }%, #e5e7eb ${factor.weight * 100}%, #e5e7eb 100%)`
                        : '#e5e7eb',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Quick Presets */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Quick Presets:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const enabledCount = factors.filter((f) => f.enabled).length;
                    const equalWeight = enabledCount > 0 ? 1 / enabledCount : 0;
                    setFactors(
                      factors.map((f) => ({
                        ...f,
                        weight: f.enabled ? equalWeight : 0,
                      }))
                    );
                  }}
                >
                  Equal Weights
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setFactors(
                      factors.map((f) => ({
                        ...f,
                        enabled: true,
                        weight: 1 / factors.length,
                      }))
                    );
                  }}
                >
                  Enable All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visualization */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Factor Balance</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="factor" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Weight"
                  dataKey="weight"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Signal Test Results</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={testResults}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="symbol" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#10b981" name="Signal Score" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {testResults.map((result) => (
                <div
                  key={result.symbol}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-900 mr-3">
                      {result.symbol}
                    </span>
                    <Badge
                      variant={
                        result.signal.type === 'BUY'
                          ? 'success'
                          : result.signal.type === 'SELL'
                          ? 'danger'
                          : 'default'
                      }
                    >
                      {result.signal.type}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      Strength: {(result.signal.strength * 100).toFixed(1)}%
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      Score: {result.score.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button onClick={handleTestSignals} loading={testing} disabled={testing}>
                <PlayCircle className="w-4 h-4 mr-2" />
                Test Signals
              </Button>
              <Button variant="secondary" onClick={handleReset} disabled={!hasChanges}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleSave}
                loading={saving}
                disabled={!hasChanges || !isBalanced || saving}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>

          {!isBalanced && hasChanges && (
            <div className="mt-4 p-3 bg-warning-50 border border-warning-200 text-warning-900 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              <strong>Warning:</strong> Factor weights must sum to 1.0 before saving.
              Current total: {totalWeight.toFixed(2)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
