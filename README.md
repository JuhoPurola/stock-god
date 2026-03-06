# Stock Picker

A comprehensive stock picking and algorithmic trading platform with backtesting capabilities.

## 📚 Documentation

**→ [📑 Documentation Master Index](DOCUMENTATION_INDEX.md)** - Complete navigation guide

### Quick Access:

- **[⚡ Quick Start](QUICK_START.md)** - Get up and running in 10 minutes
- **[📖 User Guide](USER_GUIDE.md)** - Complete platform documentation
- **[✨ Best Practices](BEST_PRACTICES.md)** - Optimize your trading strategies
- **[❓ FAQ](FAQ.md)** - Quick answers to common questions
- **[🎬 Video Scripts](VIDEO_SCRIPTS.md)** - Tutorial scripts for content creators
- **[🔧 Development Guide](CLAUDE.md)** - For developers and contributors

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

## 📖 Documentation Overview

### For Users

**[Quick Start Guide](QUICK_START.md)**
- Create your first portfolio (2 min)
- Build a simple strategy (3 min)
- Run a backtest (2 min)
- Enable live trading (1 min)
- Pre-built strategy templates

**[Complete User Guide](USER_GUIDE.md)**
- Dashboard overview
- Portfolio management
- Strategy builder (factors, weights, risk management)
- Backtesting system
- Live trading operations
- Stock research & analysis
- Performance analytics
- Alerts & notifications
- Advanced features (optimizer, real-time updates)
- Troubleshooting

**[Best Practices Guide](BEST_PRACTICES.md)**
- Strategy design principles
- Backtesting methodologies
- Risk management techniques
- Portfolio optimization
- Common mistakes to avoid
- Performance monitoring
- Advanced techniques

**[FAQ](FAQ.md)**
- Getting started questions
- Strategy & backtesting
- Risk management
- Trading operations
- Technical issues
- Account settings
- Support & community

### For Developers

**[CLAUDE.md](CLAUDE.md)**
- Project architecture
- Development setup
- Package structure
- Algorithm engine details
- Database schema
- Deployment instructions
- Testing guidelines

## Contributing

We welcome contributions! Please:

1. Check existing [GitHub Issues](https://github.com/your-repo/stock-picker/issues)
2. Fork the repository
3. Create a feature branch
4. Follow code style guidelines in CLAUDE.md
5. Add tests for new features
6. Submit a pull request

## Support

- **Documentation**: Start with [User Guide](USER_GUIDE.md) or [FAQ](FAQ.md)
- **Bug Reports**: [GitHub Issues](https://github.com/your-repo/stock-picker/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/your-repo/stock-picker/discussions)
- **Questions**: Check [FAQ](FAQ.md) first, then GitHub Discussions

## License

MIT
