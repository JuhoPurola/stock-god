# Stock Picker

A comprehensive stock picking and algorithmic trading platform with backtesting capabilities.

## Features

- 🤖 **Algorithmic Trading Engine**: Composable factor-based strategies
- 📊 **Multiple Portfolios**: Manage different strategies simultaneously
- 📈 **Backtesting**: Test strategies on historical data
- 🎯 **Performance Analytics**: Track and visualize portfolio performance
- 🔄 **Paper Trading**: Test with Alpaca paper trading
- 🔔 **Alerts & Notifications**: Stay informed of trading activities
- 🛡️ **Risk Management**: Stop-loss, position sizing, and circuit breakers

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Zustand
- **Backend**: AWS Lambda, API Gateway, Node.js
- **Database**: PostgreSQL (AWS RDS)
- **Infrastructure**: AWS CDK
- **Broker API**: Alpaca (paper & live trading)
- **Market Data**: Alpha Vantage

## Project Structure

```
stock-picker/
├── packages/
│   ├── frontend/              # React web application
│   ├── backend/               # Lambda functions & API
│   ├── algorithm-engine/      # Trading strategy engine
│   ├── backtesting/           # Backtesting system
│   └── shared/                # Shared types and utilities
├── infrastructure/            # AWS CDK deployment
└── scripts/                   # Utilities and migrations
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker (for local PostgreSQL)
- AWS CLI configured
- Alpaca API keys (paper trading account)
- Alpha Vantage API key (free tier)

### Installation

```bash
# Install dependencies
pnpm install

# Start local database
docker-compose up -d

# Run database migrations
pnpm run migrate

# Seed sample data
pnpm run seed

# Start development servers
pnpm run dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:3000`.

### Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/stock_picker

# Alpaca API
ALPACA_API_KEY=your_api_key
ALPACA_API_SECRET=your_api_secret
ALPACA_BASE_URL=https://paper-api.alpaca.markets

# Alpha Vantage
ALPHA_VANTAGE_API_KEY=your_api_key

# AWS (for deployment)
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your_account_id
```

## Development

### Running Tests

```bash
# Run all tests
pnpm run test

# Run tests for specific package
pnpm --filter @stock-picker/algorithm-engine run test
```

### Building

```bash
# Build all packages
pnpm run build

# Build specific package
pnpm --filter @stock-picker/frontend run build
```

### Deployment

```bash
# Deploy to staging
pnpm run deploy:staging

# Deploy to production
pnpm run deploy:prod
```

## Architecture

### Algorithm Engine

The algorithm engine uses a composable factor-based system where strategies are built by combining multiple factors (RSI, MACD, moving averages, etc.) with custom weights.

```typescript
// Example strategy configuration
{
  factors: [
    { type: 'RSI', weight: 0.3, params: { period: 14, oversold: 30, overbought: 70 } },
    { type: 'MACD', weight: 0.4, params: { fast: 12, slow: 26, signal: 9 } },
    { type: 'MA_Crossover', weight: 0.3, params: { short: 50, long: 200 } }
  ],
  riskManagement: {
    stopLoss: 0.05,
    positionSize: 0.1,
    maxPositions: 10
  }
}
```

### Database Schema

- **portfolios**: User portfolios with cash balance
- **strategies**: Algorithm configurations
- **positions**: Current stock holdings
- **trades**: Historical trade records
- **backtests**: Backtest results and metrics

### Scheduled Execution

EventBridge triggers Lambda functions during market hours to:
1. Fetch active strategies
2. Generate buy/sell signals
3. Execute trades via Alpaca
4. Log results and send notifications

## Contributing

_Contribution guidelines will be added as the project matures_

## License

MIT
