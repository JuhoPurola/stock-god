import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { apiClient } from '../lib/api-client';
import type { Strategy, Signal } from '@stock-picker/shared';
import {
  Radio,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Bell,
  BellOff,
} from 'lucide-react';

interface SignalWithStrategy extends Signal {
  strategyName: string;
  strategyId: string;
}

export function LiveSignalDashboard() {
  const [signals, setSignals] = useState<SignalWithStrategy[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    loadStrategiesAndSignals();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadStrategiesAndSignals();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadStrategiesAndSignals = async () => {
    setLoading(true);
    try {
      // Load all active strategies
      const portfolios = await apiClient.getPortfolios();
      const allStrategies: Strategy[] = [];

      for (const portfolio of portfolios) {
        const strategyList = await apiClient.getStrategies(portfolio.id);
        allStrategies.push(...strategyList.filter(s => s.enabled));
      }

      setStrategies(allStrategies);

      // Generate signals for each active strategy
      const allSignals: SignalWithStrategy[] = [];

      for (const strategy of allStrategies) {
        try {
          // Test signal generation for each stock in the universe (limit to avoid overload)
          const stocksToTest = strategy.stockUniverse.slice(0, 5);

          for (const symbol of stocksToTest) {
            try {
              const signal = await apiClient.testStrategy(strategy.id, symbol);

              // Only include non-HOLD signals
              if (signal.type !== 'HOLD') {
                allSignals.push({
                  ...signal,
                  strategyName: strategy.name,
                  strategyId: strategy.id,
                });
              }
            } catch (error) {
              // Skip failed signals
            }
          }
        } catch (error) {
          console.error(`Failed to test strategy ${strategy.name}:`, error);
        }
      }

      setSignals(allSignals);
      setLastUpdate(new Date());

      // Show notification for new BUY signals (if enabled)
      if (notifications && allSignals.some(s => s.type === 'BUY')) {
        showNotification('New trading signals detected!');
      }
    } catch (error) {
      console.error('Failed to load signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Stock Picker', {
        body: message,
        icon: '/icon.png',
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotifications(permission === 'granted');
    }
  };

  // Group signals by type
  const buySignals = signals.filter(s => s.type === 'BUY');
  const sellSignals = signals.filter(s => s.type === 'SELL');

  // Calculate signal strength distribution
  const strongSignals = signals.filter(s => s.strength >= 0.7).length;
  const mediumSignals = signals.filter(s => s.strength >= 0.4 && s.strength < 0.7).length;
  const weakSignals = signals.filter(s => s.strength < 0.4).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center mb-2">
            <Radio className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Live Signal Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Real-time trading signals from active strategies
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (notifications) {
                setNotifications(false);
              } else {
                requestNotificationPermission();
              }
            }}
          >
            {notifications ? (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Notifications On
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4 mr-2" />
                Notifications Off
              </>
            )}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <>
                <Radio className="w-4 h-4 mr-2 animate-pulse" />
                Live
              </>
            ) : (
              <>Auto-Refresh Off</>
            )}
          </Button>

          <Button
            variant="secondary"
            onClick={loadStrategiesAndSignals}
            loading={loading}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Strategies</p>
                <p className="text-3xl font-bold text-gray-900">{strategies.length}</p>
              </div>
              <Radio className="w-8 h-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Buy Signals</p>
                <p className="text-3xl font-bold text-success-600">{buySignals.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Sell Signals</p>
                <p className="text-3xl font-bold text-danger-600">{sellSignals.length}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-danger-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Strong Signals</p>
                <p className="text-3xl font-bold text-purple-600">{strongSignals}</p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>Medium: {mediumSignals}</div>
                <div>Weak: {weakSignals}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Update */}
      <div className="text-sm text-gray-600">
        Last updated: {lastUpdate.toLocaleTimeString()}
        {autoRefresh && (
          <span className="ml-2 text-primary-600">
            • Auto-refreshing every 30s
          </span>
        )}
      </div>

      {/* Buy Signals */}
      {buySignals.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-success-600" />
              <h3 className="text-lg font-semibold">Buy Signals ({buySignals.length})</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {buySignals
                .sort((a, b) => b.strength - a.strength)
                .map((signal, i) => (
                  <SignalCard key={i} signal={signal} />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sell Signals */}
      {sellSignals.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <TrendingDown className="w-5 h-5 mr-2 text-danger-600" />
              <h3 className="text-lg font-semibold">Sell Signals ({sellSignals.length})</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sellSignals
                .sort((a, b) => b.strength - a.strength)
                .map((signal, i) => (
                  <SignalCard key={i} signal={signal} />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {signals.length === 0 && !loading && (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Minus className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No active signals
              </h3>
              <p className="text-gray-600 mb-4">
                All strategies are currently generating HOLD signals
              </p>
              <Button variant="secondary" onClick={loadStrategiesAndSignals}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Signals
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SignalCardProps {
  signal: SignalWithStrategy;
}

function SignalCard({ signal }: SignalCardProps) {
  const strengthColor =
    signal.strength >= 0.7
      ? 'text-success-600'
      : signal.strength >= 0.4
      ? 'text-warning-600'
      : 'text-gray-600';

  const strengthLabel =
    signal.strength >= 0.7 ? 'Strong' : signal.strength >= 0.4 ? 'Medium' : 'Weak';

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
      <div className="flex items-center space-x-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            signal.type === 'BUY' ? 'bg-success-100' : 'bg-danger-100'
          }`}
        >
          {signal.type === 'BUY' ? (
            <TrendingUp className="w-6 h-6 text-success-600" />
          ) : (
            <TrendingDown className="w-6 h-6 text-danger-600" />
          )}
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg font-bold text-gray-900">{signal.symbol}</span>
            <Badge
              variant={signal.type === 'BUY' ? 'success' : 'danger'}
              size="sm"
            >
              {signal.type}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{signal.strategyName}</p>
        </div>
      </div>

      <div className="text-right">
        <div className="flex items-center justify-end space-x-2 mb-1">
          <span className="text-sm text-gray-600">Strength:</span>
          <span className={`text-lg font-bold ${strengthColor}`}>
            {(signal.strength * 100).toFixed(0)}%
          </span>
        </div>
        <Badge variant="default" size="sm">
          {strengthLabel}
        </Badge>
      </div>
    </div>
  );
}
