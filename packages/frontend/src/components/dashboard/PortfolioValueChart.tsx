import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { Time } from 'lightweight-charts';

interface PortfolioValueChartProps {
  data: Array<{ date: string; value: number }>;
  height?: number;
}

export default function PortfolioValueChart({ data, height = 250 }: PortfolioValueChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b7280',
      },
      grid: {
        vertLines: { color: '#f3f4f6' },
        horzLines: { color: '#f3f4f6' },
      },
      width: chartContainerRef.current.clientWidth,
      height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#e5e7eb',
      },
      rightPriceScale: {
        borderColor: '#e5e7eb',
      },
    });

    const lineSeries = (chart as any).addAreaSeries({
      lineColor: '#2563eb',
      topColor: 'rgba(37, 99, 235, 0.3)',
      bottomColor: 'rgba(37, 99, 235, 0.0)',
      lineWidth: 2,
    });

    const chartData = data.map(d => ({
      time: (new Date(d.date).getTime() / 1000) as Time,
      value: d.value,
    }));

    lineSeries.setData(chartData);
    chart.timeScale().fitContent();

    chartRef.current = chart;

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
  }, [data, height]);

  return <div ref={chartContainerRef} />;
}
