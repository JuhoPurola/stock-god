import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthWrapper } from './components/AuthWrapper';
import { WebSocketProvider } from './components/WebSocketProvider';
import { Layout } from './components/layout/Layout';
import { ToastContainer } from './components/ui/Toast';
import { useToastStore } from './store/toast-store';
import { DashboardPage } from './pages/DashboardPage';
import { PortfoliosPage } from './pages/PortfoliosPage';
import { EnhancedPortfolioDetailPage } from './pages/EnhancedPortfolioDetailPage';
import { StrategiesPage } from './pages/StrategiesPage';
import { StrategyDetailPage } from './pages/StrategyDetailPage';
import { StocksPage } from './pages/StocksPage';
import { StockDetailPage } from './pages/StockDetailPage';
import { TradesPage } from './pages/TradesPage';
import { BacktestsPage } from './pages/BacktestsPage';
import { BacktestComparisonPage } from './pages/BacktestComparisonPage';
import { StockDataDashboard } from './pages/StockDataDashboard';
import { StrategyOptimizerPage } from './pages/StrategyOptimizerPage';
import { LiveSignalDashboard } from './pages/LiveSignalDashboard';
import AlertsPage from './pages/AlertsPage';

function App() {
  const { toasts, removeToast } = useToastStore();

  return (
    <ErrorBoundary>
      <AuthWrapper>
        <WebSocketProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/portfolios" element={<PortfoliosPage />} />
              <Route path="/portfolios/:id" element={<EnhancedPortfolioDetailPage />} />
              <Route path="/portfolios/:portfolioId/strategies" element={<StrategiesPage />} />
              <Route path="/strategies/:id" element={<StrategyDetailPage />} />
              <Route path="/strategy-optimizer" element={<StrategyOptimizerPage />} />
              <Route path="/live-signals" element={<LiveSignalDashboard />} />
              <Route path="/backtests" element={<BacktestsPage />} />
              <Route path="/backtests/compare" element={<BacktestComparisonPage />} />
              <Route path="/stocks" element={<StocksPage />} />
              <Route path="/stocks/:symbol" element={<StockDetailPage />} />
              <Route path="/stocks/data-dashboard" element={<StockDataDashboard />} />
              <Route path="/trades" element={<TradesPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
            </Routes>
          </Layout>
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </WebSocketProvider>
      </AuthWrapper>
    </ErrorBoundary>
  );
}

export default App;
