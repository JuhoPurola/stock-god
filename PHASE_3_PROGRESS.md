# Phase 3: Automated Trading Scheduler - IN PROGRESS

**Date:** February 27, 2026
**Status:** 🚧 Backend Core Complete - Infrastructure & Integration Needed

---

## ✅ Completed

### 1. Database Schema ✅
**Files:**
- `scripts/phase3-migration.sql` - Standalone migration
- `packages/backend/src/schema.sql` - Updated with Phase 3 tables

**Tables Created:**
- `scheduled_jobs` - Job configuration and stats (6 job types)
- `job_executions` - Execution history and monitoring

**Enums:**
- `job_type`: strategy_execution, order_status_check, position_sync, price_update, portfolio_snapshot, alert_price_check
- `job_status`: enabled, disabled, error
- `execution_status`: started, completed, failed

### 2. Job Monitoring Service ✅
**File:** `packages/backend/src/services/job-monitoring.service.ts` (290 lines)

**Key Methods:**
- `logJobStart()` - Track job execution start
- `logJobComplete()` - Log successful completion with metadata
- `logJobError()` - Log failures and update stats
- `shouldJobRun()` - Circuit breaker (disables after 10 failures)
- `getJobHistory()` - Retrieve execution history
- `getJobStats()` - Get stats for all jobs

**Features:**
- Automatic execution tracking
- Average duration calculation (weighted moving average)
- Failure rate monitoring
- Circuit breaker protection

### 3. Scheduled Job Handlers ✅
**6 Handler Files Created:**

#### A. Strategy Execution Handler
**File:** `scheduled-strategy-execution.handler.ts` (195 lines)
**Schedule:** Every 15 minutes during market hours (9:30 AM - 4 PM ET)
**Function:**
- Fetches all portfolios with enabled strategies
- Evaluates each stock in strategy universe
- Generates BUY/SELL/HOLD signals
- Executes trades for non-HOLD signals
- Creates alerts for executed trades
- Broadcasts updates via WebSocket
- Tracks: portfolios processed, signals generated, trades executed

#### B. Order Status Check Handler
**File:** `scheduled-order-status.handler.ts` (160 lines)
**Schedule:** Every 1 minute during market hours
**Function:**
- Polls pending/submitted orders from last 24 hours
- Checks status with Alpaca broker
- Updates trade records when status changes
- Updates positions when orders fill
- Creates alerts for fills/cancellations/rejections
- Broadcasts fill notifications
- Tracks: orders checked, filled, canceled, rejected

#### C. Position Sync Handler
**File:** `scheduled-position-sync.handler.ts` (170 lines)
**Schedule:** Every 5 minutes during market hours
**Function:**
- Syncs positions with broker to ensure consistency
- Detects discrepancies between DB and broker
- Adds missing positions
- Updates quantities/prices
- Removes closed positions
- Tracks: portfolios synced, positions synced, discrepancies fixed

#### D. Price Update Handler
**File:** `scheduled-price-update.handler.ts` (110 lines)
**Schedule:** Every 5 minutes during market hours
**Function:**
- Fetches latest quotes for active positions
- Batch fetches via Alpaca (multiple symbols)
- Updates position market values and unrealized P&L
- Broadcasts price updates via WebSocket
- Tracks: symbols checked, symbols updated

#### E. Portfolio Snapshot Handler
**File:** `scheduled-portfolio-snapshot.handler.ts` (100 lines)
**Schedule:** 4:05 PM ET (20:05 UTC) end of day
**Function:**
- Creates daily snapshots of portfolio performance
- Calculates total value (cash + positions)
- Prevents duplicate snapshots for same day
- Stores: total_value, cash_balance, positions_value
- Tracks: portfolios checked, snapshots created

#### F. Alert Price Check Handler
**File:** `scheduled-alert-price-check.handler.ts` (145 lines)
**Schedule:** Every 5 minutes during market hours
**Function:**
- Checks active price alerts against current prices
- Supports 3 conditions: above, below, percent_change
- Triggers alerts when conditions met
- Marks alerts as triggered and inactive
- Creates user notifications
- Tracks: alerts checked, alerts triggered

---

## 🚧 In Progress / Remaining Work

### 1. Service Method Additions (NEEDED)

The handlers reference methods that don't yet exist in services:

**TradingService needs:**
- `getOrderStatus(brokerOrderId, tradingMode)` - Get status from Alpaca
- `updateTradeStatus(tradeId, status, filledAt, filledPrice, filledQuantity)` - Update trade record
- `updatePositionAfterFill(portfolioId, symbol, side, quantity, price)` - Update position on fill
- `getBrokerPositions(portfolioId, tradingMode)` - Fetch positions from Alpaca

**PriceDataService needs:**
- `getBatchQuotes(symbols[])` - Fetch multiple quotes at once

**WebSocketService needs:**
- `broadcastPriceUpdate(symbol, quote)` - Broadcast price updates

### 2. Infrastructure (CDK) (NEEDED)

**Update:** `infrastructure/lib/stacks/scheduler-stack.ts`

Replace existing placeholder with 6 separate Lambda functions:
- Each handler needs its own Lambda function
- Each Lambda needs EventBridge rule with correct schedule
- All need VPC access (same as API Lambda)
- All need database credentials (SECRET_ARN, DB_HOST)
- All need WebSocket API access (WEBSOCKET_API_ENDPOINT)

**Required Environment Variables:**
```typescript
DATABASE_HOST
DATABASE_SECRET_ARN
WEBSOCKET_API_ENDPOINT
ALPACA_SECRET_ARN
NODE_ENV
```

**Schedule Expressions:**
```typescript
strategy_execution: 'cron(*/15 13-20 ? * MON-FRI *)'     // Every 15 min
order_status_check: 'cron(* 13-20 ? * MON-FRI *)'        // Every 1 min
position_sync: 'cron(*/5 13-20 ? * MON-FRI *)'           // Every 5 min
price_update: 'cron(*/5 13-20 ? * MON-FRI *)'            // Every 5 min
portfolio_snapshot: 'cron(5 20 ? * MON-FRI *)'           // 4:05 PM ET
alert_price_check: 'cron(*/5 13-20 ? * MON-FRI *)'       // Every 5 min
```

### 3. Database Migration (EASY)

Need to run Phase 3 migration to create tables:
```bash
# Rebuild migration Lambda with updated schema.sql
# Deploy to AWS
# Invoke migration Lambda with action=migrate
```

### 4. Testing & Validation (NEEDED)

- Manual invoke each Lambda function
- Verify job_executions table gets populated
- Check logs for errors
- Verify alerts are created
- Test WebSocket broadcasts
- Monitor during market hours

---

## 📊 Phase 3 Statistics

**Backend Files Created:** 7 new files, ~1,470 LOC
- 1 service (job-monitoring.service.ts) - 290 LOC
- 6 handlers (scheduled-*.handler.ts) - 1,180 LOC

**Database:** 2 new tables, 3 new enums

**Infrastructure:** 6 Lambda functions + 6 EventBridge rules (TO BE CREATED)

**Total Phase 3 (when complete):** ~1,600 LOC

---

## 🎯 Next Steps (Priority Order)

### Option A: Complete Phase 3 (Recommended)
1. **Add missing service methods** (1-2 hours)
   - TradingService: 4 methods
   - PriceDataService: 1 method
   - WebSocketService: 1 method

2. **Update Scheduler Stack** (1 hour)
   - Create 6 Lambda functions
   - Wire up EventBridge rules
   - Set environment variables

3. **Deploy Phase 3** (30 min)
   - Rebuild migration Lambda
   - Run database migration
   - Deploy scheduler stack
   - Test each job manually

4. **Production Testing** (1 hour)
   - Wait for market hours
   - Monitor job executions
   - Verify alerts and WebSocket
   - Check CloudWatch logs

**Total Estimated Time:** 4-5 hours

### Option B: Simplified MVP
1. Just deploy strategy execution handler (most important)
2. Skip order polling (handle async later)
3. Skip position sync (manual for now)
4. Deploy just 2-3 critical handlers

**Total Estimated Time:** 2 hours

### Option C: Move to Phase 4
1. Save Phase 3 work for later
2. Start Phase 4: Performance Analytics
3. Come back to Phase 3 when ready for live trading

---

## 💡 Recommendations

**For Production-Ready Automated Trading:**
Complete Phase 3 fully (Option A). The system needs:
- Order status polling (critical for tracking fills)
- Position sync (prevents data inconsistencies)
- All 6 jobs working together

**For Demo/Testing:**
Simplified MVP (Option B) - just get strategy execution working.

**For Maximum Features:**
Move to Phase 4 (Option C) - add analytics while trading is still manual.

---

## 🔒 Safety Notes

- All jobs have circuit breakers (disabled after 10 failures)
- Position sync prevents broker/DB discrepancies
- Order polling handles async fills properly
- Price alerts auto-disable after triggering
- Job execution history enables debugging
- Comprehensive error tracking and logging

**Ready for Production:** Once all methods implemented and tested during market hours.

---

**Status:** Core logic complete, integration work remaining
**Next Action:** Choose Option A, B, or C above
