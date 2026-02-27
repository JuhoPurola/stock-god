import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardHeader, CardContent } from '../ui/Card';

interface StockDataStats {
  symbol: string;
  name: string;
  dataPoints: number;
  oldestDate: string;
  newestDate: string;
  daysCoverage: number;
}

interface StockDataChartsProps {
  stockStats: StockDataStats[];
}

export function StockDataCharts({ stockStats }: StockDataChartsProps) {
  // Data for bar chart - top 10 stocks by data points
  const topStocksData = stockStats.slice(0, 10).map((s) => ({
    symbol: s.symbol,
    dataPoints: s.dataPoints,
  }));

  // Data quality distribution
  const qualityDistribution = [
    {
      name: 'Excellent',
      value: stockStats.filter((s) => s.dataPoints >= 250).length,
      color: '#10b981',
    },
    {
      name: 'Good',
      value: stockStats.filter((s) => s.dataPoints >= 100 && s.dataPoints < 250).length,
      color: '#3b82f6',
    },
    {
      name: 'Fair',
      value: stockStats.filter((s) => s.dataPoints >= 50 && s.dataPoints < 100).length,
      color: '#f59e0b',
    },
    {
      name: 'Poor',
      value: stockStats.filter((s) => s.dataPoints < 50).length,
      color: '#ef4444',
    },
  ].filter((d) => d.value > 0);

  // Coverage distribution - group by coverage range
  const coverageRanges = [
    { range: '0-90 days', min: 0, max: 90 },
    { range: '91-180 days', min: 91, max: 180 },
    { range: '181-270 days', min: 181, max: 270 },
    { range: '271-365 days', min: 271, max: 365 },
    { range: '365+ days', min: 366, max: Infinity },
  ];

  const coverageDistribution = coverageRanges.map((r) => ({
    range: r.range,
    count: stockStats.filter((s) => s.daysCoverage >= r.min && s.daysCoverage <= r.max)
      .length,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Stocks by Data Points */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Top 10 Stocks by Data Points</h3>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topStocksData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="symbol" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="dataPoints" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Data Quality Distribution */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Data Quality Distribution</h3>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={qualityDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {qualityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Coverage Distribution */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <h3 className="text-lg font-semibold">Coverage Distribution</h3>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={coverageDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Data Points Timeline */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <h3 className="text-lg font-semibold">Data Points by Stock</h3>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stockStats.slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="symbol" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="dataPoints"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
