/**
 * Portfolio Comparison Page
 * Compare performance of multiple portfolios side-by-side
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../lib/api-client';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Plus, X } from 'lucide-react';
import type { Portfolio } from '@stock-picker/shared';

interface ComparisonMetrics {
  portfolioId: string;
  name: string;
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  winRate?: number;
}

export const PortfolioComparisonPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<ComparisonMetrics[]>([]);

  useEffect(() => {
    loadPortfolios();
    
    // Load selected portfolios from URL params
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    if (ids.length > 0) {
      setSelectedIds(ids);
      loadMetrics(ids);
    }
  }, []);

  const loadPortfolios = async () => {
    try {
      const data = await apiClient.getPortfolios();
      setPortfolios(data);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
    }
  };

  const loadMetrics = async (ids: string[]) => {
    try {
      const metricsData = await Promise.all(
        ids.map(async (id) => {
          const portfolio = await apiClient.getPortfolio(id);
          // In real app, fetch actual metrics from analytics API
          return {
            portfolioId: id,
            name: portfolio.name,
            totalValue: portfolio.totalValue,
            totalReturn: portfolio.totalValue - portfolio.cashBalance,
            totalReturnPercent: ((portfolio.totalValue - portfolio.cashBalance) / portfolio.cashBalance) * 100,
            sharpeRatio: Math.random() * 2, // Mock data
            maxDrawdown: -(Math.random() * 10),
            winRate: Math.random() * 100,
          };
        })
      );
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const handleTogglePortfolio = (id: string) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    
    setSelectedIds(newIds);
    setSearchParams({ ids: newIds.join(',') });
    
    if (newIds.length > 0) {
      loadMetrics(newIds);
    } else {
      setMetrics([]);
    }
  };

  const comparisonData = metrics.map((m) => ({
    name: m.name.substring(0, 15) + (m.name.length > 15 ? '...' : ''),
    'Total Value': m.totalValue,
    'Return %': m.totalReturnPercent,
    'Sharpe': m.sharpeRatio || 0,
    'Win Rate': m.winRate || 0,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Comparison</h1>
          <p className="mt-2 text-gray-600">Compare performance of multiple portfolios</p>
        </div>
        <Button variant="secondary" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Portfolio Selection */}
      <Card>
        <CardHeader>Select Portfolios to Compare (max 4)</CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {portfolios.map((portfolio) => (
              <button
                key={portfolio.id}
                onClick={() => handleTogglePortfolio(portfolio.id)}
                disabled={!selectedIds.includes(portfolio.id) && selectedIds.length >= 4}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  selectedIds.includes(portfolio.id)
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {selectedIds.includes(portfolio.id) && (
                  <X className="w-4 h-4 inline mr-1" />
                )}
                {portfolio.name}
              </button>
            ))}
          </div>
          {selectedIds.length === 0 && (
            <p className="mt-4 text-gray-500 text-sm">
              Select 2-4 portfolios to see comparison
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {metrics.length >= 2 && (
        <>
          {/* Summary Table */}
          <Card>
            <CardHeader>Performance Summary</CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Portfolio
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Total Value
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Return %
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Sharpe Ratio
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Max Drawdown
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Win Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {metrics.map((metric) => (
                      <tr key={metric.portfolioId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {metric.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          ${metric.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          metric.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {metric.totalReturnPercent >= 0 ? '+' : ''}
                          {metric.totalReturnPercent.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {metric.sharpeRatio?.toFixed(2) || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                          {metric.maxDrawdown?.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {metric.winRate?.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Total Value Comparison */}
            <Card>
              <CardHeader>Total Value</CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Total Value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Return Comparison */}
            <Card>
              <CardHeader>Return %</CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Return %" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sharpe Ratio */}
            <Card>
              <CardHeader>Sharpe Ratio</CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Sharpe" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Win Rate */}
            <Card>
              <CardHeader>Win Rate %</CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Win Rate" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Empty State */}
      {metrics.length < 2 && selectedIds.length > 0 && (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Plus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                Select at least 2 portfolios to compare
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
