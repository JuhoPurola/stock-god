# Testing the Backtesting System

## Overview

The backtesting system is now fully integrated with the algorithm-engine. It:
- Evaluates strategies using configured factors (RSI, MACD, etc.)
- Generates buy/sell signals based on historical data
- Tracks portfolio performance with win rate, profit factor, Sharpe ratio
- Calculates detailed performance metrics

## Why Local Testing Doesn't Work

The production database is in a private VPC subnet and cannot be accessed from outside AWS. To test backtests, you must use one of the following methods:

## Method 1: Test via API (Recommended)

### Prerequisites
1. Deploy the latest backend code to AWS
2. Have a user account in the system
3. Create a portfolio and strategy

### Steps

#### 1. Create a Portfolio
```bash
curl -X POST https://t8touk4lch.execute-api.eu-west-1.amazonaws.com/portfolios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Portfolio",
    "description": "For backtest testing",
    "initialCash": 100000,
    "tradingMode": "paper"
  }'
```

#### 2. Create a Strategy
```bash
curl -X POST https://t8touk4lch.execute-api.eu-west-1.amazonaws.com/portfolios/{portfolioId}/strategies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Momentum Test Strategy",
    "description": "Testing RSI and MACD factors",
    "factors": [
      {
        "name": "RSI",
        "type": "technical",
        "weight": 0.5,
        "enabled": true,
        "params": {
          "period": 14,
          "overbought": 70,
          "oversold": 30
        }
      },
      {
        "name": "MACD",
        "type": "technical",
        "weight": 0.5,
        "enabled": true,
        "params": {
          "fast": 12,
          "slow": 26,
          "signal": 9
        }
      }
    ],
    "riskManagement": {
      "maxPositionSize": 0.2,
      "maxPositions": 5,
      "stopLossPercent": 0.05,
      "takeProfitPercent": 0.15
    },
    "stockUniverse": ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
    "enabled": true
  }'
```

#### 3. Run a Backtest
```bash
curl -X POST https://t8touk4lch.execute-api.eu-west-1.amazonaws.com/backtests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "2024 Momentum Test",
    "config": {
      "strategyId": "YOUR_STRATEGY_ID",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "initialCash": 100000,
      "commission": 1.0,
      "slippage": 0.001
    }
  }'
```

#### 4. Check Backtest Results
```bash
# Get backtest status
curl https://t8touk4lch.execute-api.eu-west-1.amazonaws.com/backtests/{backtestId} \
  -H "Authorization: Bearer YOUR_TOKEN"

# List all backtests
curl https://t8touk4lch.execute-api.eu-west-1.amazonaws.com/backtests \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Method 2: Invoke Lambda Directly

If you have AWS CLI access:

```bash
# Deploy the latest code
pnpm deploy:prod

# Invoke via API Lambda (requires setup of API event payload)
aws lambda invoke \
  --region eu-west-1 \
  --function-name StockPicker-production-Api-ApiFunction \
  --payload '{...}' \
  output.json
```

## Method 3: Local PostgreSQL with Sample Data

For true local testing, you would need to:
1. Run a local PostgreSQL instance
2. Run migrations locally
3. Seed with test data
4. Point DATABASE_HOST to localhost
5. Run the test script

This is more complex but allows iteration without AWS deployments.

## Expected Performance Metrics

When a backtest completes successfully, you should see:
- **Total Return**: Dollar amount gained/lost
- **Total Return %**: Percentage return on initial capital
- **Sharpe Ratio**: Risk-adjusted returns (higher is better)
- **Max Drawdown**: Largest peak-to-trough decline
- **Total Trades**: Number of buy/sell executions
- **Win Rate**: Percentage of profitable trades
- **Profit Factor**: Ratio of gross wins to gross losses
- **Average Win/Loss**: Average profit per winning/losing trade

## Troubleshooting

### "Strategy not found"
- Ensure the strategy ID exists and belongs to your user

### "Insufficient historical data"
- Check that stock_prices table has data for the date range
- We currently have 365 days of data for 63 stocks

### "No signals generated"
- Factors may not be finding trading opportunities
- Try adjusting factor parameters (e.g., RSI thresholds)
- Check strategy logs for factor evaluation results

### "Database connection refused"
- Can only connect from within AWS VPC
- Use Method 1 or 2 above

## Next Steps

1. Deploy latest backend code: `pnpm deploy:prod`
2. Set up authentication (if not already done)
3. Create test portfolio and strategy via API
4. Run a backtest and verify results
5. View results in frontend (once UI is built)
