# Phase 3 Deployment Guide

**Date:** February 27, 2026
**Status:** ✅ Code Complete - Ready for Deployment

---

## 📦 What's Been Built

### Backend (1,800+ LOC)
- ✅ Job Monitoring Service (290 lines)
- ✅ 6 Scheduled Handlers (1,180 lines)
- ✅ Service Method Extensions (330 lines)
- ✅ Database Schema (2 tables, 3 enums)
- ✅ Infrastructure Stack (250 lines)

### Key Features
1. **Strategy Execution** - Auto-trade every 15 min
2. **Order Polling** - Track fills every 1 min
3. **Position Sync** - Prevent discrepancies every 5 min
4. **Price Updates** - Live market data every 5 min
5. **Daily Snapshots** - End-of-day performance tracking
6. **Price Alerts** - Check watchlist every 5 min

---

## 🚀 Deployment Steps

### Step 1: Database Migration

Update migration Lambda and run Phase 3 migration:

```bash
# 1. Bundle migration Lambda with updated schema
cd /Users/juhopurola/Documents/repos/stock-picker
npx esbuild packages/backend/src/migrate.ts --bundle --platform=node --target=node20 --format=cjs --external:'@aws-sdk/*' --external:pg-native --loader:.sql=text --minify --outfile=/tmp/migration-lambda-phase3.js

# 2. Create zip
cd /tmp && cp migration-lambda-phase3.js index.js && zip migration-lambda-phase3.zip index.js

# 3. Update Lambda
aws lambda update-function-code \
  --function-name StockPicker-production-Da-MigrationFunction1060F2E-atQOGHFS1DsU \
  --region eu-west-1 \
  --zip-file fileb:///tmp/migration-lambda-phase3.zip

# 4. Wait for update to complete
sleep 10

# 5. Run migration
aws lambda invoke \
  --function-name StockPicker-production-Da-MigrationFunction1060F2E-atQOGHFS1DsU \
  --region eu-west-1 \
  --payload '{"action":"migrate"}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/migration-phase3-response.json && cat /tmp/migration-phase3-response.json
```

**Expected Result:** `{"statusCode":200,"body":"{\"message\":\"Migration completed successfully\",\"tables_created\":18}"}`

### Step 2: Update Infrastructure

Replace old scheduler stack with new one:

```bash
# 1. Update app.ts to use SchedulerStackV2
cd infrastructure

# Edit bin/app.ts:
# - Import: import { SchedulerStackV2 } from '../lib/stacks/scheduler-stack-v2';
# - Replace SchedulerStack with SchedulerStackV2
# - Pass required props from database and websocket stacks

# 2. Deploy scheduler stack
pnpm cdk deploy StockPicker-production-SchedulerV2 \
  --require-approval never \
  -c environment=production
```

### Step 3: Verify Deployment

Check that all 6 Lambda functions were created:

```bash
aws lambda list-functions --region eu-west-1 \
  --query "Functions[?contains(FunctionName, 'Strategy') || contains(FunctionName, 'Order') || contains(FunctionName, 'Position') || contains(FunctionName, 'Price') || contains(FunctionName, 'Portfolio') || contains(FunctionName, 'Alert')].FunctionName"
```

**Expected:** 6 function names containing the job types

Check EventBridge rules:

```bash
aws events list-rules --region eu-west-1 \
  --query "Rules[?contains(Name, 'Strategy') || contains(Name, 'Order') || contains(Name, 'Position') || contains(Name, 'Price') || contains(Name, 'Portfolio') || contains(Name, 'Alert')].{Name:Name,State:State,ScheduleExpression:ScheduleExpression}"
```

**Expected:** 6 rules with ENABLED state

---

## 🧪 Testing

### Manual Function Invocation

Test each function individually before enabling scheduled execution:

```bash
# 1. Strategy Execution
aws lambda invoke \
  --function-name StockPicker-production-SchedulerV2-StrategyExecution-XXXXXX \
  --region eu-west-1 \
  /tmp/strategy-exec-test.json && cat /tmp/strategy-exec-test.json

# 2. Order Status Check
aws lambda invoke \
  --function-name StockPicker-production-SchedulerV2-OrderStatus-XXXXXX \
  --region eu-west-1 \
  /tmp/order-status-test.json && cat /tmp/order-status-test.json

# 3. Position Sync
aws lambda invoke \
  --function-name StockPicker-production-SchedulerV2-PositionSync-XXXXXX \
  --region eu-west-1 \
  /tmp/position-sync-test.json && cat /tmp/position-sync-test.json

# 4. Price Update
aws lambda invoke \
  --function-name StockPicker-production-SchedulerV2-PriceUpdate-XXXXXX \
  --region eu-west-1 \
  /tmp/price-update-test.json && cat /tmp/price-update-test.json

# 5. Portfolio Snapshot
aws lambda invoke \
  --function-name StockPicker-production-SchedulerV2-PortfolioSnapshot-XXXXXX \
  --region eu-west-1 \
  /tmp/portfolio-snapshot-test.json && cat /tmp/portfolio-snapshot-test.json

# 6. Alert Price Check
aws lambda invoke \
  --function-name StockPicker-production-SchedulerV2-AlertPriceCheck-XXXXXX \
  --region eu-west-1 \
  /tmp/alert-price-check-test.json && cat /tmp/alert-price-check-test.json
```

### Check Logs

```bash
# View recent logs for any function
aws logs tail /aws/lambda/StockPicker-production-SchedulerV2-StrategyExecution-XXXXXX \
  --region eu-west-1 \
  --since 10m \
  --follow
```

### Check Job Execution History

Query the database to see job execution records:

```sql
-- Get recent job executions
SELECT
  job_type,
  status,
  started_at,
  duration_ms,
  error_message,
  metadata
FROM job_executions
ORDER BY started_at DESC
LIMIT 20;

-- Get job stats
SELECT
  job_type,
  enabled,
  last_execution_at,
  execution_count,
  failure_count,
  average_duration_ms
FROM scheduled_jobs
ORDER BY job_type;
```

---

## 📊 Monitoring

### CloudWatch Metrics to Watch

1. **Function Invocations** - Should match schedule (15 min, 1 min, 5 min intervals)
2. **Function Errors** - Should be 0 or very low
3. **Function Duration** - Should be < 30 seconds for most jobs
4. **DynamoDB ConsumedReadCapacity** - Monitor WebSocket table access

### Alarms to Create

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name stock-picker-scheduler-errors \
  --alarm-description "Alert when scheduler functions have high error rate" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

### Job Monitoring Dashboard

Create a CloudWatch dashboard to visualize:
- Job execution counts
- Success/failure rates
- Average duration trends
- Trades executed per hour
- Orders filled/canceled/rejected

---

## 🔧 Troubleshooting

### Common Issues

**1. "Job disabled or in error state"**
- Check `scheduled_jobs` table - job may be disabled due to too many failures
- Reset failure count: `UPDATE scheduled_jobs SET failure_count = 0, last_execution_status = 'enabled' WHERE job_type = 'strategy_execution'`

**2. "No enabled strategies found"**
- Verify strategies are enabled in database
- Check portfolios have `trading_mode` set to 'paper' or 'live'

**3. "Failed to fetch batch quotes"**
- Check FMP API key in Secrets Manager
- Verify FMP rate limits (250 requests/day free tier)
- Consider upgrading FMP plan or caching quotes

**4. "Order not found at broker"**
- Order may have been manually canceled
- Check broker_order_id matches Alpaca order ID
- Verify Alpaca API credentials

**5. Circuit breaker triggered**
- Job has >10 consecutive failures
- Check CloudWatch logs for root cause
- Fix issue, then reset failure count in database

### Debug Mode

Enable detailed logging for a specific job:

```bash
# Add LOG_LEVEL environment variable
aws lambda update-function-configuration \
  --function-name StockPicker-production-SchedulerV2-StrategyExecution-XXXXXX \
  --region eu-west-1 \
  --environment "Variables={...,LOG_LEVEL=debug}"
```

---

## 🎯 Production Readiness Checklist

### Before Go-Live

- [ ] All 6 Lambda functions deployed and tested
- [ ] Database migration completed (18 tables total)
- [ ] EventBridge rules created and enabled
- [ ] CloudWatch alarms configured
- [ ] Test during market hours with paper trading
- [ ] Monitor for at least 1 full trading day
- [ ] Verify no data discrepancies between DB and broker
- [ ] Confirm alerts are being created and sent
- [ ] Check WebSocket broadcasts working
- [ ] Review CloudWatch logs for errors

### Safety Measures

- [ ] All jobs start in paper trading mode
- [ ] Circuit breakers active (disabled after 10 failures)
- [ ] Position sync prevents data loss
- [ ] Order polling ensures fills are tracked
- [ ] Comprehensive error logging
- [ ] Job execution history retained

### Performance Targets

- Strategy Execution: < 30s (evaluate 10-20 stocks)
- Order Status Check: < 10s (check 10-50 orders)
- Position Sync: < 15s (sync 10-30 positions)
- Price Update: < 20s (fetch 20-50 quotes)
- Portfolio Snapshot: < 5s (snapshot 10-20 portfolios)
- Alert Price Check: < 15s (check 20-50 alerts)

---

## 📈 Next Steps After Deployment

### Phase 3 Enhancements (Optional)

1. **Smart Scheduling**
   - Disable jobs outside market hours automatically
   - Adjust frequency based on volatility
   - Pre-market and after-hours trading support

2. **Advanced Monitoring**
   - Grafana dashboard for real-time metrics
   - Slack/email alerts for critical failures
   - Performance analytics and trends

3. **Optimization**
   - Batch operations for better performance
   - Caching for frequently accessed data
   - Parallel processing for large portfolios

4. **Testing**
   - Automated integration tests
   - Load testing with many portfolios
   - Failure recovery testing

### Move to Phase 4

Once Phase 3 is stable in production:
- **Phase 4:** Enhanced Performance Analytics
- **Phase 5:** Frontend Polish and Settings

---

## 💰 Cost Impact

### Additional AWS Costs (Phase 3)

- **Lambda Invocations:**
  - Strategy Execution: ~26/day × 30 days = 780/month
  - Order Status: ~390/day × 30 days = 11,700/month
  - Position Sync: ~78/day × 30 days = 2,340/month
  - Price Update: ~78/day × 30 days = 2,340/month
  - Portfolio Snapshot: ~1/day × 30 days = 30/month
  - Alert Price Check: ~78/day × 30 days = 2,340/month
  - **Total: ~19,530 invocations/month**
  - **Cost: $0** (within 1M free tier)

- **Lambda Duration:**
  - Average: 15 seconds per invocation
  - Total: 19,530 × 15s = 292,950 seconds = ~81 GB-seconds
  - **Cost: $0** (within 400,000 GB-second free tier)

- **EventBridge Rules:**
  - 6 rules × $1/month = $6/month

**Total Phase 3 Cost: ~$6/month** 🎉

**Cumulative All Phases: $11-16/month**
- WebSocket: $0
- Alerts/SES: $0-5
- Scheduler: $6

---

**Status:** ✅ Ready for Deployment
**Risk Level:** Low (all jobs have circuit breakers and comprehensive error handling)
**Estimated Deployment Time:** 30-45 minutes

Let me know when you're ready to deploy!
