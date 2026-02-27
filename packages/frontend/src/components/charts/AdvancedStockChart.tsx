import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  type CandlestickData,
  type Time,
  ColorType,
  CrosshairMode,
  LineStyle,
  LineWidth
} from 'lightweight-charts';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI
} from '../../lib/indicators';

export interface TradeMarker {
  time: Time;
  position: 'belowBar' | 'aboveBar';
  color: string;
  shape: 'arrowUp' | 'arrowDown' | 'circle';
  text: string;
  size: number;
}

export interface Indicator {
  type: 'SMA' | 'EMA' | 'BB' | 'RSI';
  period: number;
  color?: string;
  lineWidth?: number;
  enabled: boolean;
}

interface AdvancedStockChartProps {
  symbol: string;
  data: CandlestickData<Time>[];
  indicators?: Indicator[];
  tradeMarkers?: TradeMarker[];
  height?: number;
  className?: string;
  onCrosshairMove?: (time: Time | null, price: number | null) => void;
}

export default function AdvancedStockChart({
  symbol,
  data,
  indicators = [],
  tradeMarkers = [],
  height = 400,
  className = '',
  onCrosshairMove
}: AdvancedStockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const rsiChartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const indicatorSeriesRefs = useRef<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize main chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

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
      height: height - 120, // Leave room for RSI
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
          width: 1 as LineWidth,
          color: '#758696',
          style: LineStyle.LargeDashed,
        },
        horzLine: {
          width: 1 as LineWidth,
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
      if (rsiContainerRef.current && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({
          width: rsiContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Crosshair move handler
    if (onCrosshairMove) {
      chart.subscribeCrosshairMove((param: any) => {
        if (param.time) {
          const price = param.seriesData?.get(candlestickSeries)?.close;
          onCrosshairMove(param.time, price || null);
        } else {
          onCrosshairMove(null, null);
        }
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height, onCrosshairMove]);

  // Initialize RSI chart
  useEffect(() => {
    if (!rsiContainerRef.current) return;

    const rsiChart = createChart(rsiContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1e222d' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2b43' },
        horzLines: { color: '#2b2b43' },
      },
      width: rsiContainerRef.current.clientWidth,
      height: 120,
      timeScale: {
        visible: false,
        borderColor: '#2b2b43',
      },
      rightPriceScale: {
        borderColor: '#2b2b43',
      },
    });

    rsiChartRef.current = rsiChart;

    return () => {
      rsiChart.remove();
    };
  }, []);

  // Update candlestick data
  useEffect(() => {
    if (candlestickSeriesRef.current && data.length > 0) {
      candlestickSeriesRef.current.setData(data);
      chartRef.current?.timeScale().fitContent();
      setIsLoading(false);
    }
  }, [data]);

  // Update trade markers
  useEffect(() => {
    if (candlestickSeriesRef.current && tradeMarkers.length > 0) {
      candlestickSeriesRef.current.setMarkers(tradeMarkers);
    }
  }, [tradeMarkers]);

  // Update indicators
  useEffect(() => {
    if (!chartRef.current || !rsiChartRef.current || data.length === 0) return;

    // Clear existing indicator series
    indicatorSeriesRefs.current.forEach(series => {
      try {
        chartRef.current.removeSeries(series);
      } catch (e) {
        // Series might already be removed
      }
    });
    indicatorSeriesRefs.current.clear();

    indicators.forEach(indicator => {
      if (!indicator.enabled) return;

      const key = `${indicator.type}-${indicator.period}`;

      if (indicator.type === 'SMA') {
        const smaData = calculateSMA(data, indicator.period);
        const series = (chartRef.current as any).addLineSeries({
          color: indicator.color || '#2196F3',
          lineWidth: (indicator.lineWidth || 2) as LineWidth,
          title: `SMA(${indicator.period})`,
        });
        series.setData(smaData);
        indicatorSeriesRefs.current.set(key, series);
      } else if (indicator.type === 'EMA') {
        const emaData = calculateEMA(data, indicator.period);
        const series = (chartRef.current as any).addLineSeries({
          color: indicator.color || '#FF9800',
          lineWidth: (indicator.lineWidth || 2) as LineWidth,
          title: `EMA(${indicator.period})`,
        });
        series.setData(emaData);
        indicatorSeriesRefs.current.set(key, series);
      } else if (indicator.type === 'BB') {
        const bbData = calculateBollingerBands(data, indicator.period);

        // Upper band
        const upperSeries = (chartRef.current as any).addLineSeries({
          color: indicator.color || '#9C27B0',
          lineWidth: 1 as LineWidth,
          lineStyle: LineStyle.Dashed,
          title: `BB Upper(${indicator.period})`,
        });
        upperSeries.setData(bbData.upper);

        // Middle band
        const middleSeries = (chartRef.current as any).addLineSeries({
          color: indicator.color || '#9C27B0',
          lineWidth: (indicator.lineWidth || 2) as LineWidth,
          title: `BB Middle(${indicator.period})`,
        });
        middleSeries.setData(bbData.middle);

        // Lower band
        const lowerSeries = (chartRef.current as any).addLineSeries({
          color: indicator.color || '#9C27B0',
          lineWidth: 1 as LineWidth,
          lineStyle: LineStyle.Dashed,
          title: `BB Lower(${indicator.period})`,
        });
        lowerSeries.setData(bbData.lower);

        indicatorSeriesRefs.current.set(`${key}-upper`, upperSeries);
        indicatorSeriesRefs.current.set(`${key}-middle`, middleSeries);
        indicatorSeriesRefs.current.set(`${key}-lower`, lowerSeries);
      } else if (indicator.type === 'RSI') {
        const rsiData = calculateRSI(data, indicator.period);
        const series = (rsiChartRef.current as any).addLineSeries({
          color: indicator.color || '#FF5252',
          lineWidth: (indicator.lineWidth || 2) as LineWidth,
          title: `RSI(${indicator.period})`,
        });
        series.setData(rsiData);

        // Add overbought/oversold lines
        const overboughtLine = (rsiChartRef.current as any).addLineSeries({
          color: '#666',
          lineWidth: 1 as LineWidth,
          lineStyle: LineStyle.Dotted,
        });
        overboughtLine.setData(data.map(d => ({ time: d.time, value: 70 })));

        const oversoldLine = (rsiChartRef.current as any).addLineSeries({
          color: '#666',
          lineWidth: 1 as LineWidth,
          lineStyle: LineStyle.Dotted,
        });
        oversoldLine.setData(data.map(d => ({ time: d.time, value: 30 })));

        indicatorSeriesRefs.current.set(key, series);
      }
    });

    // Synchronize time scales
    if (rsiChartRef.current) {
      chartRef.current.timeScale().subscribeVisibleTimeRangeChange((timeRange: any) => {
        rsiChartRef.current.timeScale().setVisibleRange(timeRange);
      });
    }
  }, [indicators, data]);

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
      <div ref={chartContainerRef} className="rounded-t-lg overflow-hidden" />
      <div ref={rsiContainerRef} className="rounded-b-lg overflow-hidden" />
    </div>
  );
}
