import { useState, useEffect } from 'react';
import { CandlestickData, Time } from 'lightweight-charts';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface PriceData {
  timestamp: string;
  open: string | number;
  high: string | number;
  low: string | number;
  close: string | number;
}

interface UseStockChartDataResult {
  data: CandlestickData<Time>[];
  isLoading: boolean;
  error: string | null;
}

export function useStockChartData(symbol: string, days: number = 90): UseStockChartDataResult {
  const [data, setData] = useState<CandlestickData<Time>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!symbol) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch historical prices from API
        const response = await fetch(
          `${API_BASE_URL}/stocks/${symbol}/prices?` +
          `startDate=${startDate.toISOString().split('T')[0]}&` +
          `endDate=${endDate.toISOString().split('T')[0]}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch stock prices');
        }

        const result = await response.json();
        const prices: PriceData[] = result.prices || [];

        // Convert to TradingView format
        const chartData: CandlestickData<Time>[] = prices
          .map((price) => ({
            time: (new Date(price.timestamp).getTime() / 1000) as Time,
            open: parseFloat(String(price.open)),
            high: parseFloat(String(price.high)),
            low: parseFloat(String(price.low)),
            close: parseFloat(String(price.close)),
          }))
          .sort((a, b) => (a.time as number) - (b.time as number));

        setData(chartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching stock chart data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [symbol, days]);

  return { data, isLoading, error };
}
