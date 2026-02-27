# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stock Picker - A comprehensive stock picking and algorithmic trading platform with backtesting capabilities, multiple portfolio management, and automated trading via Alpaca broker integration.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Zustand (state management)
- **Backend**: AWS Lambda, API Gateway, Node.js, PostgreSQL (RDS)
- **Infrastructure**: AWS CDK for IaC
- **Algorithm Engine**: Composable factor-based trading strategies
- **Broker**: Alpaca (paper & live trading)
- **Market Data**: Alpha Vantage API

## Development Commands

### Setup
```bash
# Install dependencies
pnpm install

# Start local PostgreSQL database
docker-compose up -d

# Run database migrations
./scripts/migrate.sh
# Or directly: psql $DATABASE_URL -f scripts/schema.sql

# Seed sample data
./scripts/seed.sh
# Or directly: psql $DATABASE_URL -f scripts/seed.sql

# Create .env file from example
cp .env.example .env
# Then edit .env with your API keys
```

### Development
```bash
# Start all development servers
pnpm run dev

# Build all packages
pnpm run build

# Type check all packages
pnpm run typecheck

# Clean build artifacts
pnpm run clean
```

### Testing
```bash
# Run all tests
pnpm run test

# Run tests for specific package
pnpm --filter @stock-picker/algorithm-engine run test
```

### Deployment
```bash
# Deploy to staging
pnpm run deploy:staging

# Deploy to production
pnpm run deploy:prod
```

## Project Structure

```
stock-picker/
├── packages/
│   ├── shared/              # Shared types, utils, validation schemas
│   ├── algorithm-engine/    # Trading strategy engine with factors
│   ├── backend/             # Lambda functions, API, repositories
│   ├── backtesting/         # Backtesting system
│   └── frontend/            # React web application
├── infrastructure/          # AWS CDK stacks
├── scripts/                 # Database migrations and utilities
│   ├── schema.sql          # Database schema
│   ├── seed.sql            # Sample data
│   ├── migrate.sh          # Migration runner
│   └── seed.sh             # Seed runner
└── docker-compose.yml      # Local PostgreSQL for development
```

## Architecture

### Database (PostgreSQL)

Core tables:
- `users` - User accounts
- `portfolios` - User portfolios with cash balance
- `strategies` - Algorithm configurations (factors + risk management)
- `positions` - Current stock holdings
- `trades` - Historical trade records with signals
- `stock_prices` - Historical price data
- `portfolio_snapshots` - Daily performance tracking
- `backtests` - Backtest runs and results
- `alerts` - User notifications

### Algorithm Engine

**Composable Factor System:**
- `IFactor` interface: All factors implement this
- `BaseFactor`: Abstract base class with common functionality
- `Strategy`: Combines factors with weights to generate signals
- `FactorFactory`: Creates factor instances from configuration

**Available Factors:**
- `RSIFactor`: Relative Strength Index (oversold/overbought)
- `MACDFactor`: Moving Average Convergence Divergence (momentum)
- `MovingAverageCrossoverFactor`: Golden/death cross signals

**Signal Flow:**
1. Strategy evaluates all enabled factors for a symbol
2. Each factor returns a score (-1 to +1) with confidence (0 to 1)
3. Strategy combines scores using weighted average
4. Signal type determined: BUY, SELL, or HOLD
5. Risk management calculates stop-loss and take-profit

### Backend Architecture

**Lambda Functions:**
- Portfolio management CRUD
- Strategy configuration
- Trade execution (manual + automated)
- Backtesting runs
- Performance analytics
- Stock search and market data

**Scheduled Execution:**
- EventBridge triggers strategy evaluation during market hours
- Lambda fetches active strategies and generates signals
- Trades executed via Alpaca API
- Results logged and notifications sent

### Frontend Structure

**Key Pages:**
- Dashboard: Portfolio overview with positions and performance
- Strategy Builder: Visual factor configuration
- Stock Explorer: Search and analyze stocks
- Backtest Runner: Test strategies on historical data
- Trade History: All trades with signal reasoning

## Important Notes

### Type Safety
- All packages use strict TypeScript
- Shared types in `@stock-picker/shared` package
- Zod schemas for API validation

### Factor Development
To add a new factor:
1. Extend `BaseFactor` class
2. Implement `evaluate()` and `validateParams()` methods
3. Register in `FactorFactory`
4. Add tests

### Database Migrations
- Schema in `scripts/schema.sql`
- Run migrations with `./scripts/migrate.sh`
- Use `updated_at` triggers for timestamp management

### Testing Strategy
- Unit tests for factor calculations
- Integration tests for API handlers
- E2E tests for user workflows
- Run with `pnpm run test`

## Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `ALPACA_API_KEY` - Alpaca paper trading key
- `ALPACA_API_SECRET` - Alpaca secret
- `ALPHA_VANTAGE_API_KEY` - Alpha Vantage API key
- `AWS_REGION` - AWS region for deployment
- `AWS_ACCOUNT_ID` - AWS account ID

## Current Implementation Status

### ✅ Completed
- Monorepo structure with pnpm workspaces
- Shared types package with comprehensive type definitions
- Database schema with all core tables
- Algorithm engine core (Strategy, IFactor, BaseFactor)
- Technical indicator calculations (RSI, MACD, SMA, EMA, Bollinger Bands, ATR)
- Three technical factors implemented (RSI, MACD, MA Crossover)
- Factor factory for dynamic factor creation
- Migration and seed scripts

### 🚧 In Progress
- Alert system implementation (Phase 2)

### ⏳ Pending
- Automated trading background jobs
- Advanced performance analytics
- Frontend polish and settings page

### ✅ Recently Completed
- WebSocket real-time updates (Phase 1 - Feb 2026)
  - Auth0 JWT authentication
  - Auto-reconnect with exponential backoff
  - Real-time trade and portfolio updates
  - DynamoDB connection management
  - Broadcasting infrastructure
- Backtesting engine (fully functional)
- Backend API and repository layer
- Alpaca broker integration
- React frontend with Auth0
- AWS CDK infrastructure
