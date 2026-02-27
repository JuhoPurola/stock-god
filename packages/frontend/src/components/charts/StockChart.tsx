import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  type CandlestickData,
  type Time,
  ColorType,
  CrosshairMode,
  LineStyle
} from 'lightweight-charts';

interface StockChartProps {
  symbol: string;
  data: CandlestickData<Time>[];
  height?: number;
  className?: string;
}

export default function StockChart({ symbol, data, height = 400, className = '' }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1e222d' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2b43' },
        horzLines: { color: '#2b2b43' },
      },
      width: chartContainerRef.current.clientWidth,
      height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#2b2b43',
      },
      rightPriceScale: {
        borderColor: '#2b2b43',
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: '#758696',
          style: LineStyle.LargeDashed,
        },
        horzLine: {
          width: 1,
          color: '#758696',
          style: LineStyle.LargeDashed,
        },
      },
    });

    // Add candlestick series
    const candlestickSeries = (chart as any).addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height]);

  // Update data when it changes
  useEffect(() => {
    if (candlestickSeriesRef.current && data.length > 0) {
      candlestickSeriesRef.current.setData(data);
      chartRef.current?.timeScale().fitContent();
      setIsLoading(false);
    }
  }, [data]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10">
          <div className="text-white">Loading chart...</div>
        </div>
      )}
      <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {symbol}
      </div>
      <div ref={chartContainerRef} className="rounded-lg overflow-hidden" />
    </div>
  );
}
