import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Briefcase, BarChart3, X } from 'lucide-react';
import { usePortfolioStore } from '../../store/portfolio-store';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: any;
  action: () => void;
  category: 'portfolio' | 'stock' | 'strategy' | 'action';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { portfolios } = usePortfolioStore();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const allCommands: CommandItem[] = [
    // Quick Actions
    {
      id: 'new-portfolio',
      title: 'Create New Portfolio',
      description: 'Start a new investment portfolio',
      icon: Briefcase,
      category: 'action',
      action: () => {
        navigate('/portfolios');
        onClose();
      },
    },
    {
      id: 'run-backtest',
      title: 'Run Backtest',
      description: 'Test your strategy on historical data',
      icon: BarChart3,
      category: 'action',
      action: () => {
        navigate('/backtests');
        onClose();
      },
    },
    {
      id: 'browse-stocks',
      title: 'Browse Stocks',
      description: 'Search and explore stocks',
      icon: TrendingUp,
      category: 'action',
      action: () => {
        navigate('/stocks');
        onClose();
      },
    },
    // Portfolios
    ...portfolios.map(p => ({
      id: `portfolio-${p.id}`,
      title: p.name,
      description: `${p.positionCount} positions`,
      icon: Briefcase,
      category: 'portfolio' as const,
      action: () => {
        navigate(`/portfolios/${p.id}`);
        onClose();
      },
    })),
  ];

  const filteredCommands = query
    ? allCommands.filter(
        cmd =>
          cmd.title.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search portfolios, stocks, or actions..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none text-lg"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No results found
            </div>
          ) : (
            <div>
              {filteredCommands.map((cmd, index) => {
                const Icon = cmd.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-100 dark:bg-blue-900/40'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isSelected
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cmd.title}
                      </p>
                      {cmd.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {cmd.description}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 uppercase">
                      {cmd.category}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Cmd+K to open</span>
        </div>
      </div>
    </div>
  );
}
