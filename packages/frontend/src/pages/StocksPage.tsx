import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api-client';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatCompactNumber } from '@stock-picker/shared';
import type { Stock } from '@stock-picker/shared';
import { Search } from 'lucide-react';

export function StocksPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 1) {
      setStocks([]);
      return;
    }

    setLoading(true);
    try {
      const results = await apiClient.searchStocks(searchQuery, 20);
      setStocks(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    handleSearch(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Stock Explorer</h1>
        <p className="text-gray-600 mt-1">
          Search for stocks to analyze and trade
        </p>
      </div>

      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by symbol or name (e.g., AAPL, Apple)..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {loading && (
        <div className="text-center py-8 text-gray-500">Searching...</div>
      )}

      {!loading && query && stocks.length === 0 && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            No stocks found matching "{query}"
          </div>
        </Card>
      )}

      {stocks.length > 0 && (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exchange
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sector
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market Cap
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stocks.map((stock) => (
                  <tr
                    key={stock.symbol}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/stocks/${stock.symbol}`)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">
                        {stock.symbol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{stock.name}</td>
                    <td className="px-6 py-4 text-gray-600">{stock.exchange}</td>
                    <td className="px-6 py-4">
                      {stock.sector && (
                        <Badge size="sm">{stock.sector}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">
                      {stock.marketCap
                        ? `$${formatCompactNumber(stock.marketCap)}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge
                        variant={stock.tradable ? 'success' : 'default'}
                        size="sm"
                      >
                        {stock.tradable ? 'Tradable' : 'Not Tradable'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
