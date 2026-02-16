import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { PortfoliosPage } from './pages/PortfoliosPage';
import { EnhancedPortfolioDetailPage } from './pages/EnhancedPortfolioDetailPage';
import { StrategiesPage } from './pages/StrategiesPage';
import { StrategyDetailPage } from './pages/StrategyDetailPage';
import { StocksPage } from './pages/StocksPage';
import { StockDetailPage } from './pages/StockDetailPage';
import { TradesPage } from './pages/TradesPage';
import { BacktestsPage } from './pages/BacktestsPage';

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/portfolios" element={<PortfoliosPage />} />
          <Route path="/portfolios/:id" element={<EnhancedPortfolioDetailPage />} />
          <Route path="/portfolios/:portfolioId/strategies" element={<StrategiesPage />} />
          <Route path="/strategies/:id" element={<StrategyDetailPage />} />
          <Route path="/backtests" element={<BacktestsPage />} />
          <Route path="/stocks" element={<StocksPage />} />
          <Route path="/stocks/:symbol" element={<StockDetailPage />} />
          <Route path="/trades" element={<TradesPage />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
