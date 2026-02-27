import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { apiClient } from '../lib/api-client';
import { StockDataCharts } from '../components/charts/StockDataCharts';
import { Database, TrendingUp, Calendar, BarChart3, RefreshCw, BarChart2 } from 'lucide-react';

interface StockDataStats {
  symbol: string;
  name: string;
  dataPoints: number;
  oldestDate: string;
  newestDate: string;
  daysCoverage: number;
}

export function StockDataDashboard() {
  const [loading, setLoading] = useState(true);
  const [stockStats, setStockStats] = useState<StockDataStats[]>([]);
  const [totalDataPoints, setTotalDataPoints] = useState(0);
  const [totalStocks, setTotalStocks] = useState(0);
  const [showCharts, setShowCharts] = useState(true);

  useEffect(() => {
    loadStockData();
  }, []);

  const loadStockData = async () => {
    setLoading(true);
    try {
      // Get all tradable stocks
      const stocks = await apiClient.listStocks(100);

      // For each stock, check if it has price data
      const statsPromises = stocks.map(async (stock) => {
        try {
          // Try to get last year of data
          const endDate = new Date();
          const startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 1);

          const prices = await apiClient.getPriceHistory(
            stock.symbol,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );

          if (prices.length > 0) {
            const dates = prices.map(p => new Date(p.timestamp));
            const oldest = new Date(Math.min(...dates.map(d => d.getTime())));
            const newest = new Date(Math.max(...dates.map(d => d.getTime())));
            const daysCoverage = Math.ceil(
              (newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
              symbol: stock.symbol,
              name: stock.name,
              dataPoints: prices.length,
              oldestDate: oldest.toISOString().split('T')[0],
              newestDate: newest.toISOString().split('T')[0],
              daysCoverage,
            };
          }
        } catch (error) {
          // Stock has no data, skip it
          return null;
        }
        return null;
      });

      const results = await Promise.all(statsPromises);
      const validStats: StockDataStats[] = results.filter((s): s is StockDataStats => s !== null);

      // Sort by data points descending
      validStats.sort((a, b) => b.dataPoints - a.dataPoints);

      setStockStats(validStats);
      setTotalStocks(validStats.length);
      setTotalDataPoints(validStats.reduce((sum, s) => sum + s.dataPoints, 0));
    } catch (error) {
      console.error('Failed to load stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const avgDataPoints = totalStocks > 0 ? Math.round(totalDataPoints / totalStocks) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto text-primary-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading stock data statistics...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a minute...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Data Dashboard</h1>
          <p className="text-gray-600 mt-1">
            View coverage and quality of loaded historical stock data
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowCharts(!showCharts)} variant="secondary">
            <BarChart2 className="w-4 h-4 mr-2" />
            {showCharts ? 'Hide' : 'Show'} Charts
          </Button>
          <Button onClick={loadStockData} variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center">
              <Database className="w-10 h-10 text-primary-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Stocks</p>
                <p className="text-2xl font-bold text-gray-900">{totalStocks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center">
              <BarChart3 className="w-10 h-10 text-success-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Data Points</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalDataPoints.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="w-10 h-10 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Avg Per Stock</p>
                <p className="text-2xl font-bold text-gray-900">{avgDataPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="w-10 h-10 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Avg Coverage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stockStats.length > 0
                    ? Math.round(
                        stockStats.reduce((sum, s) => sum + s.daysCoverage, 0) /
                          stockStats.length
                      )
                    : 0}{' '}
                  days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {showCharts && stockStats.length > 0 && (
        <StockDataCharts stockStats={stockStats} />
      )}

      {/* Stock List */}
      {stockStats.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Stocks with Loaded Data</h2>
              <Badge variant="success">{stockStats.length} stocks ready</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Symbol
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Name
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">
                      Data Points
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">
                      Coverage
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Date Range
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">
                      Quality
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stockStats.map((stock) => {
                    const quality =
                      stock.dataPoints >= 250
                        ? 'excellent'
                        : stock.dataPoints >= 100
                        ? 'good'
                        : stock.dataPoints >= 50
                        ? 'fair'
                        : 'poor';

                    return (
                      <tr key={stock.symbol} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900">
                            {stock.symbol}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{stock.name}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="default">{stock.dataPoints}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {stock.daysCoverage} days
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {stock.oldestDate} to {stock.newestDate}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={
                              quality === 'excellent'
                                ? 'success'
                                : quality === 'good'
                                ? 'default'
                                : quality === 'fair'
                                ? 'warning'
                                : 'danger'
                            }
                            size="sm"
                          >
                            {quality}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No stock data loaded yet
              </h3>
              <p className="text-gray-600 mb-4">
                Use the demo endpoints to load historical price data
              </p>
              <div className="bg-gray-50 p-4 rounded-lg text-left max-w-2xl mx-auto">
                <p className="text-sm font-mono text-gray-700">
                  curl -X POST "{API_URL}/demo/load-real-prices?force=true&batchSize=3"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const API_URL = import.meta.env.VITE_API_URL || '/api';
