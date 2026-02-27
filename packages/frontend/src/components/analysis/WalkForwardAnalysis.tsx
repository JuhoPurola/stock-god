import { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiClient } from '../../lib/api-client';
import type { Strategy, Backtest } from '@stock-picker/shared';
import {
  FastForward,
  Play,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  ComposedChart,
} from 'recharts';

interface WalkForwardAnalysisProps {
  strategy: Strategy;
}

interface WalkForwardWindow {
  id: number;
  inSampleStart: string;
  inSampleEnd: string;
  outOfSampleStart: string;
  outOfSampleEnd: string;
  inSampleBacktest?: Backtest;
  outOfSampleBacktest?: Backtest;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface WalkForwardResults {
  windows: WalkForwardWindow[];
  summary: {
    avgInSampleReturn: number;
    avgOutOfSampleReturn: number;
    consistency: number; // % of OOS periods that were profitable
    efficiency: number; // OOS return / IS return
  };
}

export function WalkForwardAnalysis({ strategy }: WalkForwardAnalysisProps) {
  const [inSampleMonths, setInSampleMonths] = useState(6);
  const [outOfSampleMonths, setOutOfSampleMonths] = useState(3);
  const [numWindows, setNumWindows] = useState(4);
  const [results, setResults] = useState<WalkForwardResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentWindow, setCurrentWindow] = useState(0);

  const runWalkForward = async () => {
    setIsRunning(true);
    setCurrentWindow(0);

    const windows: WalkForwardWindow[] = [];
    const endDate = new Date();

    // Generate windows going backwards in time
    for (let i = 0; i < numWindows; i++) {
      const outOfSampleEnd = new Date(endDate);
      outOfSampleEnd.setMonth(outOfSampleEnd.getMonth() - (i * outOfSampleMonths));

      const outOfSampleStart = new Date(outOfSampleEnd);
      outOfSampleStart.setMonth(outOfSampleStart.getMonth() - outOfSampleMonths);

      const inSampleEnd = new Date(outOfSampleStart);
      inSampleEnd.setDate(inSampleEnd.getDate() - 1);

      const inSampleStart = new Date(inSampleEnd);
      inSampleStart.setMonth(inSampleStart.getMonth() - inSampleMonths);

      windows.push({
        id: i + 1,
        inSampleStart: inSampleStart.toISOString().split('T')[0],
        inSampleEnd: inSampleEnd.toISOString().split('T')[0],
        outOfSampleStart: outOfSampleStart.toISOString().split('T')[0],
        outOfSampleEnd: outOfSampleEnd.toISOString().split('T')[0],
        status: 'pending',
      });
    }

    // Reverse so we go chronologically forward
    windows.reverse();

    // Run each window
    for (let i = 0; i < windows.length; i++) {
      setCurrentWindow(i + 1);
      const window = windows[i];
      window.status = 'running';

      try {
        // Run in-sample backtest
        const inSampleBacktest = await apiClient.createBacktest({
          name: `WF W${window.id} In-Sample`,
          config: {
            strategyId: strategy.id,
            portfolioId: strategy.portfolioId,
            startDate: window.inSampleStart,
            endDate: window.inSampleEnd,
            initialCash: 100000,
            commission: 1.0,
            slippage: 0.001,
          },
        });

        // Wait for completion
        await new Promise(resolve => setTimeout(resolve, 2000));
        const completedIS = await apiClient.getBacktest(inSampleBacktest.id);
        window.inSampleBacktest = completedIS;

        // Run out-of-sample backtest
        const outOfSampleBacktest = await apiClient.createBacktest({
          name: `WF W${window.id} Out-of-Sample`,
          config: {
            strategyId: strategy.id,
            portfolioId: strategy.portfolioId,
            startDate: window.outOfSampleStart,
            endDate: window.outOfSampleEnd,
            initialCash: 100000,
            commission: 1.0,
            slippage: 0.001,
          },
        });

        await new Promise(resolve => setTimeout(resolve, 2000));
        const completedOOS = await apiClient.getBacktest(outOfSampleBacktest.id);
        window.outOfSampleBacktest = completedOOS;

        window.status = 'completed';
      } catch (error) {
        console.error(`Window ${window.id} failed:`, error);
        window.status = 'failed';
      }
    }

    // Calculate summary statistics
    const completedWindows = windows.filter(w => w.status === 'completed');

    if (completedWindows.length > 0) {
      const avgInSample = completedWindows.reduce((sum, w) =>
        sum + (w.inSampleBacktest?.performance?.totalReturnPercent || 0), 0
      ) / completedWindows.length;

      const avgOutOfSample = completedWindows.reduce((sum, w) =>
        sum + (w.outOfSampleBacktest?.performance?.totalReturnPercent || 0), 0
      ) / completedWindows.length;

      const profitableOOS = completedWindows.filter(w =>
        (w.outOfSampleBacktest?.performance?.totalReturnPercent || 0) > 0
      ).length;

      const consistency = (profitableOOS / completedWindows.length) * 100;
      const efficiency = avgInSample !== 0 ? (avgOutOfSample / avgInSample) : 0;

      setResults({
        windows,
        summary: {
          avgInSampleReturn: avgInSample,
          avgOutOfSampleReturn: avgOutOfSample,
          consistency,
          efficiency,
        },
      });
    }

    setIsRunning(false);
  };

  // Prepare chart data
  const getChartData = () => {
    if (!results) return [];

    return results.windows
      .filter(w => w.status === 'completed')
      .map(w => ({
        window: `W${w.id}`,
        inSample: w.inSampleBacktest?.performance?.totalReturnPercent || 0,
        outOfSample: w.outOfSampleBacktest?.performance?.totalReturnPercent || 0,
      }));
  };

  const chartData = results ? getChartData() : [];

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <FastForward className="w-5 h-5 mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold">Walk-Forward Analysis</h2>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Test strategy robustness by optimizing on in-sample data and validating on
            out-of-sample periods
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                In-Sample Period (months)
              </label>
              <input
                type="number"
                value={inSampleMonths}
                onChange={(e) => setInSampleMonths(parseInt(e.target.value))}
                min="3"
                max="12"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Training period</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Out-of-Sample Period (months)
              </label>
              <input
                type="number"
                value={outOfSampleMonths}
                onChange={(e) => setOutOfSampleMonths(parseInt(e.target.value))}
                min="1"
                max="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Testing period</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Windows
              </label>
              <input
                type="number"
                value={numWindows}
                onChange={(e) => setNumWindows(parseInt(e.target.value))}
                min="2"
                max="8"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Total: {(inSampleMonths + outOfSampleMonths) * numWindows} months
              </p>
            </div>
          </div>

          <Button
            onClick={runWalkForward}
            loading={isRunning}
            disabled={isRunning}
          >
            <Play className="w-4 h-4 mr-2" />
            Run Walk-Forward Analysis
          </Button>

          {isRunning && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Processing Window {currentWindow} of {numWindows}
                </span>
                <span className="text-sm font-medium">
                  {Math.round((currentWindow / numWindows) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(currentWindow / numWindows) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Avg In-Sample</p>
                <p className="text-2xl font-bold text-blue-600">
                  {results.summary.avgInSampleReturn >= 0 ? '+' : ''}
                  {results.summary.avgInSampleReturn.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Avg Out-of-Sample</p>
                <p className={`text-2xl font-bold ${
                  results.summary.avgOutOfSampleReturn >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {results.summary.avgOutOfSampleReturn >= 0 ? '+' : ''}
                  {results.summary.avgOutOfSampleReturn.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Consistency</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.summary.consistency.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(results.summary.consistency / 100 * numWindows)}/{numWindows} profitable
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Efficiency</p>
                <p className={`text-2xl font-bold ${
                  results.summary.efficiency >= 0.7 ? 'text-success-600' : 'text-warning-600'
                }`}>
                  {(results.summary.efficiency * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">OOS vs IS</p>
              </CardContent>
            </Card>
          </div>

          {/* Interpretation */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Interpretation</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.summary.efficiency >= 0.7 ? (
                  <div className="flex items-start p-3 bg-success-50 border border-success-200 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-success-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-success-900">Good Robustness</p>
                      <p className="text-sm text-success-700">
                        Out-of-sample performance is {(results.summary.efficiency * 100).toFixed(0)}% of
                        in-sample, indicating the strategy generalizes well.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-warning-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-warning-900">Potential Overfitting</p>
                      <p className="text-sm text-warning-700">
                        Out-of-sample performance significantly lower than in-sample. Strategy may be
                        overfitted to historical data.
                      </p>
                    </div>
                  </div>
                )}

                {results.summary.consistency >= 75 ? (
                  <div className="flex items-start p-3 bg-success-50 border border-success-200 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-success-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-success-900">Consistent Performance</p>
                      <p className="text-sm text-success-700">
                        Strategy was profitable in {results.summary.consistency.toFixed(0)}% of
                        out-of-sample periods, showing good consistency.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-warning-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-warning-900">Inconsistent Results</p>
                      <p className="text-sm text-warning-700">
                        Strategy was only profitable in {results.summary.consistency.toFixed(0)}% of
                        out-of-sample periods. Consider adjusting parameters.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">In-Sample vs Out-of-Sample Returns</h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="window" />
                  <YAxis label={{ value: 'Return %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inSample" fill="#3b82f6" name="In-Sample" />
                  <Bar dataKey="outOfSample" fill="#10b981" name="Out-of-Sample" />
                  <Line
                    type="monotone"
                    dataKey="inSample"
                    stroke="#1e40af"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="outOfSample"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Window Details */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Window Details</h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Window</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">In-Sample Period</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">IS Return</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">OOS Period</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">OOS Return</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.windows.map(w => (
                      <tr key={w.id}>
                        <td className="px-4 py-3 font-medium">W{w.id}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {w.inSampleStart} to {w.inSampleEnd}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-blue-600">
                          {w.inSampleBacktest?.performance && w.inSampleBacktest.performance.totalReturnPercent !== undefined
                            ? `${w.inSampleBacktest.performance.totalReturnPercent >= 0 ? '+' : ''}${w.inSampleBacktest.performance.totalReturnPercent.toFixed(2)}%`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {w.outOfSampleStart} to {w.outOfSampleEnd}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${
                          w.outOfSampleBacktest?.performance &&
                          w.outOfSampleBacktest.performance.totalReturnPercent !== undefined &&
                          w.outOfSampleBacktest.performance.totalReturnPercent >= 0
                            ? 'text-success-600'
                            : 'text-danger-600'
                        }`}>
                          {w.outOfSampleBacktest?.performance && w.outOfSampleBacktest.performance.totalReturnPercent !== undefined
                            ? `${w.outOfSampleBacktest.performance.totalReturnPercent >= 0 ? '+' : ''}${w.outOfSampleBacktest.performance.totalReturnPercent.toFixed(2)}%`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={
                              w.status === 'completed'
                                ? 'success'
                                : w.status === 'running'
                                ? 'warning'
                                : w.status === 'failed'
                                ? 'danger'
                                : 'default'
                            }
                            size="sm"
                          >
                            {w.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
