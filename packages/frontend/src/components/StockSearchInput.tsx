import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../lib/api-client';
import { Input } from './ui/Input';
import type { Stock } from '@stock-picker/shared';
import { Search, X } from 'lucide-react';

interface StockSearchInputProps {
  onSelect: (stock: Stock) => void;
  placeholder?: string;
  selectedStocks?: Stock[];
  onRemove?: (symbol: string) => void;
  multiple?: boolean;
}

export function StockSearchInput({
  onSelect,
  placeholder = 'Search stocks...',
  selectedStocks = [],
  onRemove,
  multiple = false,
}: StockSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchStocks = async () => {
      if (query.length < 1) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const stocks = await apiClient.searchStocks(query, 10);
        setResults(stocks);
        setIsOpen(true);
      } catch (error) {
        console.error('Stock search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchStocks, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = (stock: Stock) => {
    onSelect(stock);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleRemove = (symbol: string) => {
    if (onRemove) {
      onRemove(symbol);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Selected stocks (for multiple mode) */}
      {multiple && selectedStocks.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedStocks.map((stock) => (
            <div
              key={stock.symbol}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
            >
              <span className="font-semibold">{stock.symbol}</span>
              <span className="text-blue-600">-</span>
              <span>{stock.name}</span>
              <button
                onClick={() => handleRemove(stock.symbol)}
                className="ml-1 hover:bg-blue-200 rounded p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
      </div>

      {/* Search results dropdown */}
      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : (
            <ul>
              {results.map((stock) => {
                const isSelected = selectedStocks.some((s) => s.symbol === stock.symbol);

                return (
                  <li key={stock.symbol}>
                    <button
                      onClick={() => !isSelected && handleSelect(stock)}
                      disabled={isSelected}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        isSelected ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {stock.symbol}
                          </div>
                          <div className="text-sm text-gray-600">{stock.name}</div>
                          <div className="text-xs text-gray-500">
                            {stock.exchange} • {stock.sector}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-xs text-gray-500">Selected</span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
