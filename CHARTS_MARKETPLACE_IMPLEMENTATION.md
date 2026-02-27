# Implementation Plan: Advanced Charts + Strategy Marketplace

## Overview

This plan implements two complementary features that transform Stock God into a premium platform with professional-grade tools and a thriving creator economy.

**Combined Timeline**: 10-12 weeks
**Estimated Cost**: ~$75/month additional (Stripe fees, TradingView data)
**Revenue Potential**: High (20% of all marketplace sales)

---

## Phase 1: Advanced Charts (Weeks 1-3)

### Week 1: Foundation & Core Charts

**Task 20: TradingView Integration**

**Setup**:
```bash
# Install dependencies
pnpm add lightweight-charts
pnpm add -D @types/lightweight-charts

# Create chart components directory
mkdir -p packages/frontend/src/components/charts
```

**Implementation**:
```typescript
// packages/frontend/src/components/charts/StockChart.tsx
import { createChart, IChartApi } from 'lightweight-charts';

interface StockChartProps {
  symbol: string;
  data: CandlestickData[];
  indicators?: Indicator[];
  trades?: Trade[];
  timeframe: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
}

export function StockChart({ symbol, data, indicators, trades }: StockChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Create chart
    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 600,
      layout: {
        background: { color: '#1e222d' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2b43' },
        horzLines: { color: '#363c4e' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candlestickSeries.setData(data);

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });
    volumeSeries.setData(volumeData);

    chartInstance.current = chart;

    return () => {
      chart.remove();
    };
  }, [data]);

  return (
    <div className="chart-container">
      <div ref={chartRef} />
      <ChartControls onIndicatorAdd={handleAddIndicator} />
    </div>
  );
}
```

**Deliverables**:
- ✅ Basic candlestick chart with volume
- ✅ Responsive design
- ✅ Zoom and pan controls
- ✅ Crosshair with OHLCV tooltip
- ✅ Timeframe selector

**Testing**:
- Chart renders correctly with price data
- Performance with 1000+ candles
- Responsive behavior on resize

---

### Week 2: Technical Indicators

**Task 21: Indicators Library**

**Implementation**:
```typescript
// packages/frontend/src/lib/indicators/index.ts

export class TechnicalIndicators {
  // Moving Averages
  static SMA(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }

  static EMA(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const ema: number[] = [data[0]];

    for (let i = 1; i < data.length; i++) {
      ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
  }

  // RSI
  static RSI(data: number[], period: number = 14): number[] {
    const changes = data.slice(1).map((price, i) => price - data[i]);
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

    const avgGains = this.SMA(gains, period);
    const avgLosses = this.SMA(losses, period);

    const rsi = avgGains.map((gain, i) => {
      const rs = gain / avgLosses[i];
      return 100 - (100 / (1 + rs));
    });

    return rsi;
  }

  // MACD
  static MACD(data: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const emaFast = this.EMA(data, fastPeriod);
    const emaSlow = this.EMA(data, slowPeriod);

    const macdLine = emaFast.map((fast, i) => fast - emaSlow[i]);
    const signalLine = this.EMA(macdLine, signalPeriod);
    const histogram = macdLine.map((macd, i) => macd - signalLine[i]);

    return { macdLine, signalLine, histogram };
  }

  // Bollinger Bands
  static BollingerBands(data: number[], period = 20, stdDev = 2) {
    const sma = this.SMA(data, period);
    const bands = sma.map((avg, i) => {
      const slice = data.slice(i, i + period);
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / period;
      const sd = Math.sqrt(variance);

      return {
        upper: avg + (sd * stdDev),
        middle: avg,
        lower: avg - (sd * stdDev),
      };
    });

    return bands;
  }

  // ATR (Average True Range)
  static ATR(high: number[], low: number[], close: number[], period = 14): number[] {
    const tr: number[] = [];

    for (let i = 1; i < high.length; i++) {
      const hl = high[i] - low[i];
      const hc = Math.abs(high[i] - close[i - 1]);
      const lc = Math.abs(low[i] - close[i - 1]);
      tr.push(Math.max(hl, hc, lc));
    }

    return this.EMA(tr, period);
  }

  // Stochastic Oscillator
  static Stochastic(high: number[], low: number[], close: number[], period = 14) {
    const stochastic: number[] = [];

    for (let i = period - 1; i < close.length; i++) {
      const highestHigh = Math.max(...high.slice(i - period + 1, i + 1));
      const lowestLow = Math.min(...low.slice(i - period + 1, i + 1));
      const k = ((close[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
      stochastic.push(k);
    }

    return stochastic;
  }

  // VWAP (Volume Weighted Average Price)
  static VWAP(high: number[], low: number[], close: number[], volume: number[]): number[] {
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;
    const vwap: number[] = [];

    for (let i = 0; i < close.length; i++) {
      const typicalPrice = (high[i] + low[i] + close[i]) / 3;
      cumulativeTPV += typicalPrice * volume[i];
      cumulativeVolume += volume[i];
      vwap.push(cumulativeTPV / cumulativeVolume);
    }

    return vwap;
  }
}
```

**Indicator Components**:
```typescript
// packages/frontend/src/components/charts/indicators/IndicatorPanel.tsx

interface IndicatorConfig {
  type: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB' | 'ATR' | 'STOCH' | 'VWAP';
  params: Record<string, number>;
  color: string;
  visible: boolean;
}

export function IndicatorPanel({ chart, data }: IndicatorPanelProps) {
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([]);

  const addIndicator = (type: IndicatorConfig['type']) => {
    const newIndicator: IndicatorConfig = {
      type,
      params: getDefaultParams(type),
      color: getNextColor(),
      visible: true,
    };

    setIndicators([...indicators, newIndicator]);
    renderIndicator(chart, data, newIndicator);
  };

  const renderIndicator = (chart: IChartApi, data: any, config: IndicatorConfig) => {
    switch (config.type) {
      case 'SMA':
      case 'EMA': {
        const values = config.type === 'SMA'
          ? TechnicalIndicators.SMA(data.close, config.params.period)
          : TechnicalIndicators.EMA(data.close, config.params.period);

        const lineSeries = chart.addLineSeries({
          color: config.color,
          lineWidth: 2,
          title: `${config.type}(${config.params.period})`,
        });
        lineSeries.setData(formatLineData(values, data.time));
        break;
      }

      case 'RSI': {
        // Create separate pane for RSI
        const rsiPane = chart.addPane();
        const rsiSeries = rsiPane.addLineSeries({
          color: config.color,
          title: 'RSI(14)',
        });

        const rsi = TechnicalIndicators.RSI(data.close, config.params.period);
        rsiSeries.setData(formatLineData(rsi, data.time));

        // Add overbought/oversold lines
        rsiPane.addHorizontalLine(70, { color: 'red', style: 'dashed' });
        rsiPane.addHorizontalLine(30, { color: 'green', style: 'dashed' });
        break;
      }

      case 'MACD': {
        const macdPane = chart.addPane();
        const { macdLine, signalLine, histogram } = TechnicalIndicators.MACD(data.close);

        const macdSeries = macdPane.addLineSeries({
          color: 'blue',
          title: 'MACD',
        });
        macdSeries.setData(formatLineData(macdLine, data.time));

        const signalSeries = macdPane.addLineSeries({
          color: 'red',
          title: 'Signal',
        });
        signalSeries.setData(formatLineData(signalLine, data.time));

        const histogramSeries = macdPane.addHistogramSeries({
          color: 'gray',
          title: 'Histogram',
        });
        histogramSeries.setData(formatHistogramData(histogram, data.time));
        break;
      }

      case 'BB': {
        const bands = TechnicalIndicators.BollingerBands(data.close, config.params.period);

        ['upper', 'middle', 'lower'].forEach((band) => {
          const series = chart.addLineSeries({
            color: band === 'middle' ? config.color : adjustAlpha(config.color, 0.5),
            lineWidth: band === 'middle' ? 2 : 1,
            title: `BB ${band}`,
          });
          series.setData(formatLineData(bands.map(b => b[band]), data.time));
        });
        break;
      }
    }
  };

  return (
    <div className="indicator-panel">
      <button onClick={() => setShowMenu(!showMenu)}>
        Add Indicator
      </button>

      {showMenu && (
        <IndicatorMenu onSelect={addIndicator} />
      )}

      <div className="active-indicators">
        {indicators.map((indicator, i) => (
          <IndicatorTag
            key={i}
            indicator={indicator}
            onRemove={() => removeIndicator(i)}
            onToggle={() => toggleIndicator(i)}
            onEdit={() => editIndicator(i)}
          />
        ))}
      </div>
    </div>
  );
}
```

**Deliverables**:
- ✅ 8+ technical indicators
- ✅ Indicator overlay on main chart
- ✅ Separate panes for oscillators
- ✅ Add/remove/configure indicators
- ✅ Color customization

---

### Week 3: Strategy Overlay & Advanced Features

**Task 22: Strategy Overlay**

**Implementation**:
```typescript
// packages/frontend/src/components/charts/StrategyOverlay.tsx

interface StrategyOverlayProps {
  chart: IChartApi;
  trades: Trade[];
  signals: Signal[];
  backtest?: BacktestResult;
}

export function StrategyOverlay({ chart, trades, signals, backtest }: StrategyOverlayProps) {
  // Add trade markers
  const markers = trades.map(trade => ({
    time: trade.timestamp,
    position: trade.side === 'buy' ? 'belowBar' : 'aboveBar',
    color: trade.side === 'buy' ? '#26a69a' : '#ef5350',
    shape: trade.side === 'buy' ? 'arrowUp' : 'arrowDown',
    text: `${trade.side.toUpperCase()} @ $${trade.price.toFixed(2)}`,
    size: 2,
  }));

  candlestickSeries.setMarkers(markers);

  // Add P&L lines
  trades.forEach((trade, i) => {
    if (i === 0) return;

    const prevTrade = trades[i - 1];
    if (prevTrade.side === 'buy' && trade.side === 'sell') {
      const pnl = (trade.price - prevTrade.price) * trade.quantity;
      const color = pnl > 0 ? '#26a69a' : '#ef5350';

      // Draw line between buy and sell
      const line = chart.addLineSeries({
        color,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
      });

      line.setData([
        { time: prevTrade.timestamp, value: prevTrade.price },
        { time: trade.timestamp, value: trade.price },
      ]);
    }
  });

  // Performance metrics panel
  return (
    <div className="strategy-overlay">
      <PerformancePanel
        totalTrades={trades.length}
        winRate={calculateWinRate(trades)}
        profitFactor={calculateProfitFactor(trades)}
        totalPnL={calculateTotalPnL(trades)}
      />

      {backtest && (
        <BacktestComparison
          backtest={backtest}
          live={trades}
        />
      )}
    </div>
  );
}
```

**Drawing Tools**:
```typescript
// packages/frontend/src/components/charts/DrawingTools.tsx

export function DrawingTools({ chart }: DrawingToolsProps) {
  const [tool, setTool] = useState<'line' | 'horizontal' | 'fibonacci' | null>(null);

  const handleChartClick = (param: MouseEventParams) => {
    if (!tool) return;

    switch (tool) {
      case 'line':
        drawTrendline(param.point);
        break;
      case 'horizontal':
        drawHorizontalLine(param.value);
        break;
      case 'fibonacci':
        drawFibonacci(param.point);
        break;
    }
  };

  return (
    <div className="drawing-tools">
      <button
        className={tool === 'line' ? 'active' : ''}
        onClick={() => setTool('line')}
      >
        Trendline
      </button>
      <button
        className={tool === 'horizontal' ? 'active' : ''}
        onClick={() => setTool('horizontal')}
      >
        Horizontal
      </button>
      <button
        className={tool === 'fibonacci' ? 'active' : ''}
        onClick={() => setTool('fibonacci')}
      >
        Fibonacci
      </button>
    </div>
  );
}
```

**Deliverables**:
- ✅ Trade markers on chart
- ✅ P&L lines between trades
- ✅ Performance metrics panel
- ✅ Backtest vs live comparison
- ✅ Drawing tools (trendlines, support/resistance)

**Phase 1 Complete**: Professional-grade charting system! 🎉

---

## Phase 2: Strategy Marketplace (Weeks 4-12)

### Week 4-5: Database & Backend Foundation

**Task 23: Marketplace Schema**

**Database Migration**:
```sql
-- packages/backend/src/migrations/006_marketplace.sql

-- Strategy shares (marketplace listings)
CREATE TABLE strategy_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id UUID NOT NULL REFERENCES strategies(id),
  creator_id UUID NOT NULL REFERENCES users(id),

  -- Listing info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  tags VARCHAR(50)[],

  -- Pricing
  pricing_model VARCHAR(20) NOT NULL, -- 'free', 'one_time', 'subscription', 'performance_fee'
  price DECIMAL(10, 2),
  subscription_period VARCHAR(20), -- 'monthly', 'yearly'
  performance_fee_percent DECIMAL(5, 2),

  -- Stats
  clone_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Status
  visibility VARCHAR(20) DEFAULT 'public', -- 'public', 'unlisted', 'private'
  verified BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'deleted'

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Verified performance stats (tracked separately from strategy stats)
CREATE TABLE strategy_verified_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_share_id UUID NOT NULL REFERENCES strategy_shares(id),

  -- Performance metrics
  total_return DECIMAL(10, 4),
  sharpe_ratio DECIMAL(10, 4),
  max_drawdown DECIMAL(10, 4),
  win_rate DECIMAL(5, 2),
  total_trades INTEGER,
  avg_trade_return DECIMAL(10, 4),

  -- Period
  start_date DATE,
  end_date DATE,
  days_active INTEGER,

  -- Assets under management (for performance fee strategies)
  aum DECIMAL(15, 2),

  calculated_at TIMESTAMP DEFAULT NOW()
);

-- Purchases
CREATE TABLE marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_share_id UUID NOT NULL REFERENCES strategy_shares(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  creator_id UUID NOT NULL REFERENCES users(id),

  -- Transaction
  pricing_model VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL, -- 20%
  creator_payout DECIMAL(10, 2) NOT NULL, -- 80%

  stripe_payment_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255), -- for subscriptions

  -- Status
  status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'refunded', 'cancelled'

  purchased_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- for subscriptions
);

-- Performance fee tracking
CREATE TABLE performance_fee_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES marketplace_purchases(id),
  user_id UUID NOT NULL REFERENCES users(id),
  strategy_share_id UUID NOT NULL REFERENCES strategy_shares(id),

  -- Performance
  portfolio_value_start DECIMAL(15, 2),
  portfolio_value_end DECIMAL(15, 2),
  profit DECIMAL(15, 2),
  fee_percent DECIMAL(5, 2),
  fee_amount DECIMAL(10, 2),

  -- Payout
  creator_payout DECIMAL(10, 2),
  platform_fee DECIMAL(10, 2),

  period_start DATE,
  period_end DATE,
  calculated_at TIMESTAMP DEFAULT NOW(),
  paid_out BOOLEAN DEFAULT false
);

-- Reviews and ratings
CREATE TABLE strategy_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_share_id UUID NOT NULL REFERENCES strategy_shares(id),
  user_id UUID NOT NULL REFERENCES users(id),
  purchase_id UUID REFERENCES marketplace_purchases(id),

  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  review TEXT,

  helpful_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(strategy_share_id, user_id) -- One review per user per strategy
);

-- Creator payouts
CREATE TABLE creator_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id),

  amount DECIMAL(10, 2) NOT NULL,
  stripe_payout_id VARCHAR(255),

  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'failed'

  period_start DATE,
  period_end DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_strategy_shares_creator ON strategy_shares(creator_id);
CREATE INDEX idx_strategy_shares_category ON strategy_shares(category);
CREATE INDEX idx_strategy_shares_status ON strategy_shares(status) WHERE status = 'active';
CREATE INDEX idx_marketplace_purchases_buyer ON marketplace_purchases(buyer_id);
CREATE INDEX idx_marketplace_purchases_creator ON marketplace_purchases(creator_id);
CREATE INDEX idx_strategy_reviews_share ON strategy_reviews(strategy_share_id);
CREATE INDEX idx_creator_payouts_creator ON creator_payouts(creator_id);
```

**Backend Services**:
```typescript
// packages/backend/src/services/marketplace.service.ts

export class MarketplaceService {
  constructor(
    private strategyShareRepo: StrategyShareRepository,
    private purchaseRepo: PurchaseRepository,
    private stripeService: StripeService,
    private verificationService: VerificationService
  ) {}

  // List strategy in marketplace
  async createListing(creatorId: string, data: CreateListingRequest): Promise<StrategyShare> {
    // Verify creator owns the strategy
    const strategy = await this.strategyRepo.findById(data.strategyId);
    if (strategy.userId !== creatorId) {
      throw new Error('Unauthorized');
    }

    // Verify strategy has sufficient history
    if (!this.hasEnoughHistory(strategy)) {
      throw new Error('Strategy needs at least 30 days of history');
    }

    // Calculate verified stats
    const stats = await this.verificationService.calculateStats(data.strategyId);

    // Create listing
    const listing = await this.strategyShareRepo.create({
      strategyId: data.strategyId,
      creatorId,
      ...data,
    });

    // Save verified stats
    await this.saveVerifiedStats(listing.id, stats);

    return listing;
  }

  // Purchase strategy
  async purchaseStrategy(
    buyerId: string,
    strategyShareId: string
  ): Promise<Purchase> {
    const listing = await this.strategyShareRepo.findById(strategyShareId);

    // Check if already purchased
    const existing = await this.purchaseRepo.findByBuyerAndStrategy(
      buyerId,
      strategyShareId
    );
    if (existing) {
      throw new Error('Strategy already purchased');
    }

    // Process payment based on pricing model
    let payment;
    switch (listing.pricingModel) {
      case 'one_time':
        payment = await this.stripeService.createPayment({
          amount: listing.price * 100, // cents
          customerId: buyerId,
          description: `Purchase: ${listing.name}`,
        });
        break;

      case 'subscription':
        payment = await this.stripeService.createSubscription({
          customerId: buyerId,
          priceId: listing.stripePriceId,
          description: `Subscription: ${listing.name}`,
        });
        break;

      case 'performance_fee':
        // No upfront payment, tracked monthly
        payment = { id: null, amount: 0 };
        break;
    }

    // Create purchase record
    const purchase = await this.purchaseRepo.create({
      strategyShareId,
      buyerId,
      creatorId: listing.creatorId,
      pricingModel: listing.pricingModel,
      amount: listing.price || 0,
      platformFee: (listing.price || 0) * 0.2,
      creatorPayout: (listing.price || 0) * 0.8,
      stripePaymentId: payment.id,
    });

    // Clone strategy to buyer's account
    await this.cloneStrategy(listing.strategyId, buyerId, purchase.id);

    // Update counters
    await this.strategyShareRepo.incrementPurchaseCount(strategyShareId);

    // Queue creator payout
    await this.queueCreatorPayout(listing.creatorId, purchase);

    return purchase;
  }

  // Calculate and charge performance fees (run monthly)
  async calculatePerformanceFees(): Promise<void> {
    const activeSubs = await this.purchaseRepo.findActivePerformanceFee();

    for (const purchase of activeSubs) {
      const portfolio = await this.getStrategyPortfolio(purchase.buyerId, purchase.strategyShareId);

      // Calculate profit since last calculation
      const lastCalc = await this.getLastFeeCalculation(purchase.id);
      const profit = portfolio.value - (lastCalc?.portfolioValueEnd || portfolio.initialValue);

      if (profit > 0) {
        const feePercent = purchase.performanceFeePercent;
        const feeAmount = profit * (feePercent / 100);

        // Charge fee
        const payment = await this.stripeService.createPayment({
          amount: feeAmount * 100,
          customerId: purchase.buyerId,
          description: `Performance fee: ${purchase.strategyName}`,
        });

        // Record calculation
        await this.saveFeeCalculation({
          purchaseId: purchase.id,
          userId: purchase.buyerId,
          strategyShareId: purchase.strategyShareId,
          portfolioValueStart: lastCalc?.portfolioValueEnd || portfolio.initialValue,
          portfolioValueEnd: portfolio.value,
          profit,
          feePercent,
          feeAmount,
          creatorPayout: feeAmount * 0.8,
          platformFee: feeAmount * 0.2,
        });
      }
    }
  }

  // Creator payouts (run weekly)
  async processCreatorPayouts(): Promise<void> {
    const pendingPayouts = await this.calculatePendingPayouts();

    for (const payout of pendingPayouts) {
      if (payout.amount < 50) {
        // Minimum $50 for payout
        continue;
      }

      try {
        const stripePayout = await this.stripeService.createPayout({
          amount: payout.amount * 100,
          destination: payout.stripeAccountId,
        });

        await this.creatorPayoutRepo.create({
          creatorId: payout.creatorId,
          amount: payout.amount,
          stripePayoutId: stripePayout.id,
          status: 'paid',
          periodStart: payout.periodStart,
          periodEnd: payout.periodEnd,
          paidAt: new Date(),
        });
      } catch (error) {
        logger.error('Payout failed', { creatorId: payout.creatorId, error });
      }
    }
  }
}
```

**Deliverables**:
- ✅ Complete database schema
- ✅ Repository classes for all tables
- ✅ Marketplace service with purchase logic
- ✅ Performance fee calculation
- ✅ Creator payout system

---

### Week 6-7: Stripe Integration

**Task 24: Payment Processing**

**Setup**:
```bash
pnpm add stripe @stripe/stripe-js @stripe/react-stripe-js
```

**Backend Integration**:
```typescript
// packages/backend/src/integrations/stripe/stripe.service.ts

import Stripe from 'stripe';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  // Create customer
  async createCustomer(userId: string, email: string): Promise<Stripe.Customer> {
    return await this.stripe.customers.create({
      email,
      metadata: { userId },
    });
  }

  // One-time payment
  async createPayment(params: {
    amount: number;
    customerId: string;
    description: string;
  }): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.create({
      amount: params.amount,
      currency: 'usd',
      customer: params.customerId,
      description: params.description,
      automatic_payment_methods: { enabled: true },
    });
  }

  // Subscription
  async createSubscription(params: {
    customerId: string;
    priceId: string;
    description: string;
  }): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      description: params.description,
      metadata: {
        type: 'strategy_subscription',
      },
    });
  }

  // Create Stripe Connect account for creator
  async createConnectAccount(creatorId: string, email: string): Promise<Stripe.Account> {
    return await this.stripe.accounts.create({
      type: 'express',
      email,
      metadata: { creatorId },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
  }

  // Payout to creator
  async createPayout(params: {
    amount: number;
    destination: string;
  }): Promise<Stripe.Payout> {
    return await this.stripe.payouts.create({
      amount: params.amount,
      currency: 'usd',
      destination: params.destination,
    });
  }

  // Refund
  async refund(paymentIntentId: string): Promise<Stripe.Refund> {
    return await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
  }

  // Webhook handler
  async handleWebhook(payload: string, signature: string): Promise<void> {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object);
        break;
    }
  }
}
```

**Frontend Integration**:
```typescript
// packages/frontend/src/components/marketplace/CheckoutForm.tsx

import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function CheckoutForm({ strategyShare }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    try {
      // Create payment intent on backend
      const { clientSecret } = await apiClient.createPaymentIntent({
        strategyShareId: strategyShare.id,
      });

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (error) {
        showError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        showSuccess('Purchase successful!');
        // Redirect to purchased strategy
        navigate(`/strategies/${strategyShare.strategyId}`);
      }
    } catch (error) {
      showError('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Elements stripe={stripePromise}>
      <form onSubmit={handleSubmit}>
        <div className="strategy-summary">
          <h3>{strategyShare.name}</h3>
          <p className="price">${strategyShare.price}</p>
        </div>

        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />

        <button
          type="submit"
          disabled={!stripe || loading}
          className="checkout-button"
        >
          {loading ? 'Processing...' : `Pay $${strategyShare.price}`}
        </button>

        <p className="security-note">
          🔒 Secure payment powered by Stripe
        </p>
      </form>
    </Elements>
  );
}
```

**Deliverables**:
- ✅ Stripe integration (payments, subscriptions, payouts)
- ✅ Webhook handling
- ✅ Checkout UI
- ✅ Creator Connect onboarding
- ✅ Refund handling

---

### Week 8-10: Marketplace Frontend

**Task 25: Marketplace UI**

**Pages to Build**:

1. **Marketplace Browse** (`/marketplace`)
2. **Strategy Detail** (`/marketplace/:id`)
3. **Creator Dashboard** (`/creator/dashboard`)
4. **My Purchases** (`/purchases`)

**Implementation** (abbreviated - full code available on request):

```typescript
// Marketplace browse page with filters, search, and strategy cards
// Strategy detail page with performance charts, reviews, purchase button
// Creator dashboard with analytics, earnings, and buyer management
// Purchases library for buyers to access their purchased strategies
```

**Key Features**:
- Search and filters (category, price, performance, rating)
- Strategy cards with performance metrics
- Purchase flow with Stripe integration
- Review and rating system
- Creator profile pages
- Earnings dashboard for creators

**Deliverables**:
- ✅ Marketplace browse page
- ✅ Strategy detail pages
- ✅ Purchase flow
- ✅ Creator dashboard
- ✅ Purchases library
- ✅ Review system

---

### Week 11-12: Verification & Polish

**Task 26: Strategy Verification**

**Automated Verification**:
```typescript
// Verify strategy before listing
// Monitor live performance
// Flag underperforming strategies
// Anti-fraud detection
```

**Final Polish**:
- Error handling
- Loading states
- Empty states
- Success confirmations
- Email notifications
- Performance optimization

**Deliverables**:
- ✅ Verification system
- ✅ Monitoring dashboard
- ✅ Email notifications
- ✅ Performance testing
- ✅ Security audit

---

## Success Metrics

**Advanced Charts**:
- [ ] 95%+ of users engage with charts
- [ ] Average 5+ indicators used per user
- [ ] Chart load time < 1s

**Strategy Marketplace**:
- [ ] 10+ strategies listed (month 1)
- [ ] 100+ strategies (month 3)
- [ ] $1000+ GMV (month 1)
- [ ] $10,000+ GMV (month 3)
- [ ] 4.5+ average strategy rating
- [ ] <2% refund rate

---

## Revenue Projection

**Month 1**:
- Strategies listed: 10
- Average price: $20
- Sales: 50
- GMV: $1,000
- Platform revenue (20%): $200

**Month 3**:
- Strategies listed: 100
- Average price: $30
- Sales: 300
- GMV: $9,000
- Platform revenue (20%): $1,800

**Month 6**:
- Strategies listed: 300
- Average price: $35
- Sales: 800
- GMV: $28,000
- Platform revenue (20%): $5,600

**Year 1 Target**: $50,000+ platform revenue

---

## Next Steps

Ready to start implementation!

**Week 1 begins with**:
- Installing TradingView Lightweight Charts
- Building basic candlestick chart component
- Integrating with existing stock data

**Should I start now?**
