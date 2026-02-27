import { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Strategy } from '@stock-picker/shared';
import {
  Activity,
  Play,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  Legend,
} from 'recharts';

interface MonteCarloSimulationProps {
  strategy?: Strategy;
  initialCapital: number;
}

interface SimulationRun {
  path: number[];
  finalValue: number;
  maxDrawdown: number;
}

interface SimulationResults {
  runs: SimulationRun[];
  statistics: {
    meanReturn: number;
    medianReturn: number;
    stdDev: number;
    var95: number; // Value at Risk (95th percentile)
    var99: number;
    bestCase: number;
    worstCase: number;
    probabilityOfProfit: number;
  };
}

export function MonteCarloSimulation({ initialCapital }: MonteCarloSimulationProps) {
  const [numSimulations, setNumSimulations] = useState(1000);
  const [numDays, setNumDays] = useState(252); // 1 year
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runSimulation = async () => {
    setIsRunning(true);

    // Simulate strategy performance with randomness
    const runs: SimulationRun[] = [];

    // Estimated parameters (in production, derive from historical backtest data)
    const dailyReturn = 0.0005; // 0.05% daily expected return
    const dailyVolatility = 0.015; // 1.5% daily volatility

    for (let i = 0; i < numSimulations; i++) {
      const path: number[] = [initialCapital];
      let currentValue = initialCapital;
      let maxValue = initialCapital;
      let maxDrawdown = 0;

      for (let day = 1; day <= numDays; day++) {
        // Generate random return using normal distribution (Box-Muller transform)
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const dailyChange = dailyReturn + dailyVolatility * z;

        currentValue *= (1 + dailyChange);
        path.push(currentValue);

        // Track drawdown
        if (currentValue > maxValue) {
          maxValue = currentValue;
        }
        const drawdown = ((maxValue - currentValue) / maxValue) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }

      runs.push({
        path,
        finalValue: currentValue,
        maxDrawdown,
      });
    }

    // Calculate statistics
    const finalValues = runs.map(r => r.finalValue);
    const returns = finalValues.map(v => ((v - initialCapital) / initialCapital) * 100);

    returns.sort((a, b) => a - b);

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const median = returns[Math.floor(returns.length / 2)];
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const var95 = returns[Math.floor(returns.length * 0.05)];
    const var99 = returns[Math.floor(returns.length * 0.01)];
    const bestCase = returns[returns.length - 1];
    const worstCase = returns[0];
    const probabilityOfProfit = returns.filter(r => r > 0).length / returns.length;

    setResults({
      runs,
      statistics: {
        meanReturn: mean,
        medianReturn: median,
        stdDev,
        var95,
        var99,
        bestCase,
        worstCase,
        probabilityOfProfit,
      },
    });

    setIsRunning(false);
  };

  // Prepare chart data - show percentiles
  const getPercentileData = () => {
    if (!results) return [];

    const data: any[] = [];
    const percentiles = [5, 25, 50, 75, 95];

    for (let day = 0; day <= numDays; day++) {
      const dayValues = results.runs.map(r => r.path[day]).sort((a, b) => a - b);

      const point: any = { day };
      percentiles.forEach(p => {
        const index = Math.floor((p / 100) * dayValues.length);
        point[`p${p}`] = dayValues[index];
      });

      data.push(point);
    }

    return data;
  };

  // Distribution of final values
  const getDistributionData = () => {
    if (!results) return [];

    const bins = 20;
    const finalValues = results.runs.map(r => r.finalValue);
    const min = Math.min(...finalValues);
    const max = Math.max(...finalValues);
    const binSize = (max - min) / bins;

    const histogram: { range: string; count: number }[] = [];

    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binSize;
      const binEnd = binStart + binSize;
      const count = finalValues.filter(v => v >= binStart && v < binEnd).length;

      histogram.push({
        range: `${(binStart / 1000).toFixed(0)}k`,
        count,
      });
    }

    return histogram;
  };

  const percentileData = results ? getPercentileData() : [];
  const distributionData = results ? getDistributionData() : [];

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-600" />
            <h2 className="text-xl font-semibold">Monte Carlo Simulation</h2>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Run thousands of simulations to understand potential outcomes and risk
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Simulations
              </label>
              <input
                type="number"
                value={numSimulations}
                onChange={(e) => setNumSimulations(parseInt(e.target.value))}
                min="100"
                max="10000"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trading Days
              </label>
              <input
                type="number"
                value={numDays}
                onChange={(e) => setNumDays(parseInt(e.target.value))}
                min="21"
                max="1260"
                step="21"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(numDays / 21)} months
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Capital
              </label>
              <input
                type="text"
                value={`$${initialCapital.toLocaleString()}`}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          <Button
            onClick={runSimulation}
            loading={isRunning}
            disabled={isRunning}
          >
            <Play className="w-4 h-4 mr-2" />
            Run Simulation
          </Button>

          {isRunning && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Running {numSimulations.toLocaleString()} simulations...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Mean Return</p>
                <p className={`text-2xl font-bold ${results.statistics.meanReturn >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {results.statistics.meanReturn >= 0 ? '+' : ''}{results.statistics.meanReturn.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Median Return</p>
                <p className={`text-2xl font-bold ${results.statistics.medianReturn >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {results.statistics.medianReturn >= 0 ? '+' : ''}{results.statistics.medianReturn.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Volatility (σ)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.statistics.stdDev.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Win Probability</p>
                <p className="text-2xl font-bold text-success-600">
                  {(results.statistics.probabilityOfProfit * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Risk Metrics */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Risk Analysis</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-success-50 rounded-lg">
                  <div className="flex items-center mb-1">
                    <TrendingUp className="w-4 h-4 text-success-600 mr-2" />
                    <p className="text-sm text-gray-600">Best Case</p>
                  </div>
                  <p className="text-lg font-bold text-success-600">
                    +{results.statistics.bestCase.toFixed(2)}%
                  </p>
                </div>

                <div className="p-3 bg-danger-50 rounded-lg">
                  <div className="flex items-center mb-1">
                    <TrendingDown className="w-4 h-4 text-danger-600 mr-2" />
                    <p className="text-sm text-gray-600">Worst Case</p>
                  </div>
                  <p className="text-lg font-bold text-danger-600">
                    {results.statistics.worstCase.toFixed(2)}%
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">VaR 95%</p>
                  <p className="text-lg font-bold text-danger-600">
                    {results.statistics.var95.toFixed(2)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    5% chance of losing more
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">VaR 99%</p>
                  <p className="text-lg font-bold text-danger-600">
                    {results.statistics.var99.toFixed(2)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    1% chance of losing more
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Percentile Fan Chart */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Outcome Percentiles</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={percentileData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" label={{ value: 'Trading Days', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Portfolio Value ($)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="p95"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                    name="95th Percentile"
                  />
                  <Area
                    type="monotone"
                    dataKey="p75"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.4}
                    name="75th Percentile"
                  />
                  <Line
                    type="monotone"
                    dataKey="p50"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={false}
                    name="Median"
                  />
                  <Area
                    type="monotone"
                    dataKey="p25"
                    stackId="2"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.4}
                    name="25th Percentile"
                  />
                  <Area
                    type="monotone"
                    dataKey="p5"
                    stackId="2"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                    name="5th Percentile"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribution */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Final Value Distribution</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" name="Simulations" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
