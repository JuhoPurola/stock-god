import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api-client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { formatCompactNumber, OrderSide } from '@stock-picker/shared';
import type { Stock, StockQuote, PortfolioWithStats } from '@stock-picker/shared';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';

export function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();

  const [stock, setStock] = useState<Stock | null>(null);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [portfolios, setPortfolios] = useState<PortfolioWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Trade form state
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [side, setSide] = useState<OrderSide>(OrderSide.BUY);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (symbol) {
      loadStockData();
    }
  }, [symbol]);

  const loadStockData = async () => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    try {
      const [stockData, quoteData, portfolioData] = await Promise.all([
        apiClient.getStock(symbol),
        apiClient.getStockQuote(symbol),
        apiClient.getPortfolios(),
      ]);

      setStock(stockData);
      setQuote(quoteData);
      setPortfolios(portfolioData);

      // Select first portfolio by default
      if (portfolioData.length > 0 && !selectedPortfolioId) {
        setSelectedPortfolioId(portfolioData[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load stock data:', err);
      setError(err.response?.data?.error || 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async () => {
    if (!selectedPortfolioId || !symbol || !quantity) {
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    setExecuting(true);
    try {
      await apiClient.executeTrade({
        portfolioId: selectedPortfolioId,
        symbol,
        side,
        quantity: qty,
      });

      alert(`${side} order for ${qty} shares of ${symbol} executed successfully!`);
      navigate(`/portfolios/${selectedPortfolioId}`);
    } catch (err: any) {
      console.error('Trade execution failed:', err);
      alert(err.response?.data?.error || 'Failed to execute trade');
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading stock data..." />
  }

  if (error || !stock) {
    return (
      <div className="space-y-6">
        <Button
          variant="secondary"
          onClick={() => navigate('/stocks')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Stocks
        </Button>
        <Card>
          <div className="text-center py-8 text-red-600">
            {error || 'Stock not found'}
          </div>
        </Card>
      </div>
    );
  }

  const estimatedCost = quote && quantity ? parseFloat(quantity) * quote.currentPrice : 0;
  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);
  const canAffordTrade = selectedPortfolio && side === OrderSide.BUY
    ? selectedPortfolio.cashBalance >= estimatedCost
    : true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => navigate('/stocks')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Stocks
        </Button>

        <Badge variant={stock.tradable ? 'success' : 'default'}>
          {stock.tradable ? 'Tradable' : 'Not Tradable'}
        </Badge>
      </div>

      {/* Stock Info */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{stock.symbol}</h1>
              <p className="text-lg text-gray-600 mt-1">{stock.name}</p>
            </div>
            {quote && (
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  ${quote.currentPrice.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Bid: ${quote.bidPrice.toFixed(2)} / Ask: ${quote.askPrice.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-sm text-gray-500">Exchange</div>
              <div className="font-medium text-gray-900">{stock.exchange}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Sector</div>
              <div className="font-medium text-gray-900">{stock.sector || '—'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Industry</div>
              <div className="font-medium text-gray-900">{stock.industry || '—'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Market Cap</div>
              <div className="font-medium text-gray-900">
                {stock.marketCap ? `$${formatCompactNumber(stock.marketCap)}` : '—'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Trade Form */}
      {stock.tradable && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Execute Trade</h2>

          <div className="space-y-4">
            {/* Buy/Sell Toggle */}
            <div className="flex gap-2">
              <Button
                variant={side === OrderSide.BUY ? 'primary' : 'secondary'}
                onClick={() => setSide(OrderSide.BUY)}
                className="flex-1"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Buy
              </Button>
              <Button
                variant={side === OrderSide.SELL ? 'primary' : 'secondary'}
                onClick={() => setSide(OrderSide.SELL)}
                className="flex-1"
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Sell
              </Button>
            </div>

            {/* Portfolio Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Portfolio
              </label>
              <select
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select portfolio</option>
                {portfolios.map((portfolio) => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name} (${portfolio.cashBalance.toFixed(2)} available)
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>

            {/* Estimated Cost */}
            {quote && quantity && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated {side === OrderSide.BUY ? 'Cost' : 'Proceeds'}:</span>
                  <span className="font-semibold text-gray-900">
                    ${estimatedCost.toFixed(2)}
                  </span>
                </div>
                {selectedPortfolio && side === OrderSide.BUY && (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Available Cash:</span>
                    <span className={`font-semibold ${canAffordTrade ? 'text-green-600' : 'text-red-600'}`}>
                      ${selectedPortfolio.cashBalance.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Execute Button */}
            <Button
              onClick={handleTrade}
              disabled={!selectedPortfolioId || !quantity || executing || !canAffordTrade}
              loading={executing}
              className="w-full"
            >
              {executing ? 'Executing...' : `Execute ${side} Order`}
            </Button>

            {!canAffordTrade && side === OrderSide.BUY && (
              <p className="text-sm text-red-600 text-center">
                Insufficient funds in selected portfolio
              </p>
            )}
          </div>
        </Card>
      )}

      {!stock.tradable && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            This stock is not currently tradable
          </div>
        </Card>
      )}
    </div>
  );
}
