# Backend API Guide

This document describes the backend API implementation for the Stock Picker application.

## Architecture

### Tech Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Database**: PostgreSQL with pg driver
- **ORM**: None (raw SQL for performance and control)
- **Logging**: Winston
- **Validation**: Zod schemas from shared package
- **Broker**: Alpaca API with axios client
- **Development**: Express server for local testing
- **Production**: AWS Lambda + API Gateway

### Key Components

1. **Repositories** - Database access layer with clean abstractions
2. **Services** - Business logic layer (trading, strategy execution)
3. **Handlers** - Lambda handlers / API route handlers
4. **Integrations** - External service clients (Alpaca)
5. **Utils** - Shared utilities (logging, errors, API helpers)

## Repository Layer

All repositories follow a consistent pattern:

- `create()` - Insert new record
- `findById()` - Get by ID (returns null if not found)
- `findByIdOrThrow()` - Get by ID (throws NotFoundError)
- `update()` - Update existing record
- `delete()` - Delete record
- Custom query methods as needed

### Available Repositories

#### PortfolioRepository
- `create(userId, data)` - Create portfolio
- `findById(id)` - Get portfolio
- `findByIdWithStats(id)` - Get portfolio with calculated stats
- `findByUserId(userId)` - Get all user portfolios
- `findByUserIdWithStats(userId)` - Get all with stats
- `update(id, data)` - Update portfolio
- `updateCashBalance(id, amount)` - Adjust cash
- `delete(id)` - Delete portfolio
- `findActivePortfolios()` - Get portfolios with enabled strategies

#### StrategyRepository
- `create(data)` - Create strategy
- `findById(id)` - Get strategy
- `findByPortfolioId(portfolioId)` - Get all strategies for portfolio
- `findEnabledByPortfolioId(portfolioId)` - Get enabled strategies
- `update(id, data)` - Update strategy
- `delete(id)` - Delete strategy
- `toggleEnabled(id)` - Toggle enabled status

#### PositionRepository
- `upsert(portfolioId, symbol, quantity, avgPrice, currentPrice)` - Create or update
- `findByPortfolioAndSymbol(portfolioId, symbol)` - Get position
- `findByPortfolioId(portfolioId)` - Get all positions
- `findByPortfolioIdWithDetails(portfolioId)` - Get with stock details
- `updatePrices(portfolioId, symbol, currentPrice)` - Update prices
- `updateAfterTrade(portfolioId, symbol, quantityChange, price)` - After trade
- `delete(portfolioId, symbol)` - Delete position

#### TradeRepository
- `create(...)` - Create trade record
- `findById(id)` - Get trade
- `findByBrokerOrderId(brokerOrderId)` - Get by Alpaca order ID
- `findByPortfolioId(portfolioId, limit)` - Get portfolio trades
- `findByPortfolioIdWithDetails(portfolioId, limit)` - Get with details
- `findByStrategyId(strategyId, limit)` - Get strategy trades
- `findBySymbol(portfolioId, symbol, limit)` - Get symbol trades
- `updateStatus(id, status, executedAt)` - Update trade status
- `updateBrokerOrderId(id, brokerOrderId)` - Link to Alpaca order
- `findPending(portfolioId)` - Get pending trades

#### StockRepository
- `findBySymbol(symbol)` - Get stock
- `search(query, limit)` - Search by name or symbol
- `findTradable(limit)` - Get all tradable stocks
- `findBySector(sector, limit)` - Get by sector
- `upsert(stock)` - Create or update stock
- `getPriceHistory(symbol, startDate, endDate)` - Get price bars
- `getLatestPrice(symbol)` - Get latest price
- `insertPrice(priceBar)` - Insert single price
- `bulkInsertPrices(priceBars)` - Insert multiple prices

## Service Layer

### TradingService

Handles trade execution with Alpaca integration.

**Key Methods:**
- `executeTrade(portfolioId, symbol, side, quantity, orderType, ...)` - Execute single trade
- `executeSignals(portfolioId, strategyId, signals)` - Execute multiple trades from signals
- `syncPositions(portfolioId)` - Sync positions from Alpaca
- `checkOrderStatus(tradeId)` - Check and update order status

**Features:**
- Validates sufficient funds for buy orders
- Validates sufficient position for sell orders
- Executes trades in transactions (atomic)
- Updates positions and cash balance
- Links trades to broker orders
- Handles order status tracking

### StrategyService

Handles strategy execution and signal generation.

**Key Methods:**
- `generateSignals(strategyId)` - Generate signals for strategy
- `testStrategy(strategyId, symbol)` - Test on single symbol
- `executePortfolioStrategies(portfolioId)` - Execute all enabled strategies

**Features:**
- Creates strategy instances from configuration
- Fetches historical price data
- Generates evaluation contexts
- Combines factor scores
- Returns actionable signals

## Alpaca Integration

### AlpacaClient

Full-featured Alpaca API client.

**Order Methods:**
- `submitMarketOrder(symbol, side, quantity)` - Market order
- `submitLimitOrder(symbol, side, quantity, limitPrice)` - Limit order
- `submitStopOrder(symbol, side, quantity, stopPrice)` - Stop order
- `submitStopLimitOrder(symbol, side, quantity, stopPrice, limitPrice)` - Stop-limit

**Account Methods:**
- `getAccount()` - Get account info
- `getPositions()` - Get all positions
- `getPosition(symbol)` - Get single position
- `closePosition(symbol)` - Close position
- `closeAllPositions()` - Close all

**Order Management:**
- `getOrder(orderId)` - Get order by ID
- `getOrders(status)` - Get orders by status
- `cancelOrder(orderId)` - Cancel order
- `cancelAllOrders()` - Cancel all

**Market Data:**
- `getLatestQuote(symbol)` - Get latest quote
- `getLatestQuotes(symbols)` - Get multiple quotes

**Status Mapping:**
- Maps Alpaca statuses to internal OrderStatus enum
- Handles all Alpaca order states

## API Endpoints

### Portfolios

```
GET    /portfolios                  - List user portfolios
POST   /portfolios                  - Create portfolio
GET    /portfolios/:id              - Get portfolio
PUT    /portfolios/:id              - Update portfolio
DELETE /portfolios/:id              - Delete portfolio
GET    /portfolios/:id/positions    - Get positions
```

### Strategies

```
GET    /portfolios/:portfolioId/strategies  - List strategies
POST   /strategies                          - Create strategy
GET    /strategies/:id                      - Get strategy
PUT    /strategies/:id                      - Update strategy
DELETE /strategies/:id                      - Delete strategy
POST   /strategies/:id/toggle               - Toggle enabled
POST   /strategies/:id/test                 - Test on symbol
POST   /strategies/:id/execute              - Execute strategy
```

### Trades

```
GET    /portfolios/:portfolioId/trades  - List trades
POST   /trades                          - Execute manual trade
GET    /trades/:id                      - Get trade
POST   /trades/:id/check-status         - Check order status
```

### Stocks

```
GET    /stocks/search?q=AAPL           - Search stocks
GET    /stocks/:symbol                  - Get stock
GET    /stocks/:symbol/prices           - Get price history
```

## Local Development

### Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Start database
docker-compose up -d

# Run migrations
./scripts/migrate.sh

# Seed data
./scripts/seed.sh

# Build backend
pnpm --filter @stock-picker/backend run build

# Start development server
pnpm --filter @stock-picker/backend run dev
```

### Testing the API

```bash
# Health check
curl http://localhost:3000/health

# Get portfolios (using demo user)
curl http://localhost:3000/portfolios

# Create portfolio
curl -X POST http://localhost:3000/portfolios \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Portfolio",
    "initialCash": 10000,
    "tradingMode": "paper"
  }'

# Get portfolio positions
curl http://localhost:3000/portfolios/{id}/positions

# Search stocks
curl http://localhost:3000/stocks/search?q=AAPL

# Execute trade
curl -X POST http://localhost:3000/trades \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "...",
    "symbol": "AAPL",
    "side": "buy",
    "quantity": 10,
    "orderType": "market"
  }'
```

## Error Handling

Custom error classes in `utils/errors.ts`:

- `AppError` - Base error with status code
- `NotFoundError` - 404 errors
- `ValidationError` - 400 validation errors
- `UnauthorizedError` - 401 auth errors
- `ForbiddenError` - 403 permission errors
- `ConflictError` - 409 conflict errors
- `InternalServerError` - 500 server errors
- `ExternalServiceError` - 502 external service errors

All errors are properly logged and returned as JSON responses.

## Database Transactions

Use the `transaction()` helper for atomic operations:

```typescript
import { transaction } from './config/database.js';

await transaction(async (client) => {
  await tradeRepo.create(..., client);
  await positionRepo.updateAfterTrade(..., client);
  await portfolioRepo.updateCashBalance(..., client);
});
```

Automatically handles BEGIN, COMMIT, and ROLLBACK.

## Authentication

Currently uses a simplified auth mechanism for development:
- User ID from `x-user-id` header or demo user
- In production, would use AWS Cognito authorizer

## Logging

Winston logger configured with:
- JSON format for structured logging
- Console output with colors
- File output (error.log, combined.log)
- Request/response logging
- Error stack traces

Log levels: error, warn, info, debug

## Next Steps

1. Deploy backend to AWS Lambda
2. Set up API Gateway with Cognito authorizer
3. Configure EventBridge for scheduled execution
4. Add WebSocket support for real-time updates
5. Implement rate limiting and throttling
6. Add caching layer (Redis/ElastiCache)
7. Set up monitoring and alerts (CloudWatch)
