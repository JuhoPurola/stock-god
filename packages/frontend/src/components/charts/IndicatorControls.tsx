import { useState } from 'react';
import type { Indicator } from './AdvancedStockChart';

interface IndicatorControlsProps {
  indicators: Indicator[];
  onChange: (indicators: Indicator[]) => void;
}

export default function IndicatorControls({ indicators, onChange }: IndicatorControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleIndicator = (type: Indicator['type']) => {
    const existing = indicators.find(ind => ind.type === type);
    if (existing) {
      onChange(indicators.map(ind =>
        ind.type === type ? { ...ind, enabled: !ind.enabled } : ind
      ));
    } else {
      const defaultPeriods: Record<Indicator['type'], number> = {
        SMA: 20,
        EMA: 12,
        BB: 20,
        RSI: 14,
      };
      const defaultColors: Record<Indicator['type'], string> = {
        SMA: '#2196F3',
        EMA: '#FF9800',
        BB: '#9C27B0',
        RSI: '#FF5252',
      };
      onChange([
        ...indicators,
        {
          type,
          period: defaultPeriods[type],
          color: defaultColors[type],
          lineWidth: 2,
          enabled: true,
        },
      ]);
    }
  };

  const updateIndicatorPeriod = (type: Indicator['type'], period: number) => {
    onChange(indicators.map(ind =>
      ind.type === type ? { ...ind, period } : ind
    ));
  };

  const getIndicatorState = (type: Indicator['type']) => {
    return indicators.find(ind => ind.type === type);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-300 hover:text-white"
      >
        <span>📊 Technical Indicators</span>
        <span className="text-xs">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {/* SMA */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={getIndicatorState('SMA')?.enabled || false}
                onChange={() => toggleIndicator('SMA')}
                className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">SMA</span>
            </label>
            {getIndicatorState('SMA')?.enabled && (
              <input
                type="number"
                min="1"
                max="200"
                value={getIndicatorState('SMA')?.period || 20}
                onChange={(e) => updateIndicatorPeriod('SMA', parseInt(e.target.value))}
                className="w-16 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
              />
            )}
          </div>

          {/* EMA */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={getIndicatorState('EMA')?.enabled || false}
                onChange={() => toggleIndicator('EMA')}
                className="rounded border-gray-600 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-300">EMA</span>
            </label>
            {getIndicatorState('EMA')?.enabled && (
              <input
                type="number"
                min="1"
                max="200"
                value={getIndicatorState('EMA')?.period || 12}
                onChange={(e) => updateIndicatorPeriod('EMA', parseInt(e.target.value))}
                className="w-16 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
              />
            )}
          </div>

          {/* Bollinger Bands */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={getIndicatorState('BB')?.enabled || false}
                onChange={() => toggleIndicator('BB')}
                className="rounded border-gray-600 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-300">Bollinger Bands</span>
            </label>
            {getIndicatorState('BB')?.enabled && (
              <input
                type="number"
                min="1"
                max="200"
                value={getIndicatorState('BB')?.period || 20}
                onChange={(e) => updateIndicatorPeriod('BB', parseInt(e.target.value))}
                className="w-16 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
              />
            )}
          </div>

          {/* RSI */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={getIndicatorState('RSI')?.enabled || false}
                onChange={() => toggleIndicator('RSI')}
                className="rounded border-gray-600 text-red-500 focus:ring-red-500"
              />
              <span className="text-sm text-gray-300">RSI</span>
            </label>
            {getIndicatorState('RSI')?.enabled && (
              <input
                type="number"
                min="1"
                max="200"
                value={getIndicatorState('RSI')?.period || 14}
                onChange={(e) => updateIndicatorPeriod('RSI', parseInt(e.target.value))}
                className="w-16 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
              />
            )}
          </div>

          <div className="pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Toggle indicators and adjust periods
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
