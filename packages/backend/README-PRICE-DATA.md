# Historical Price Data Loading

This guide explains how to load historical price data for backtesting.

## Overview

The price data loader supports two modes:
1. **Alpha Vantage Mode**: Load real historical data from Alpha Vantage API
2. **Sample Data Mode**: Generate synthetic price data for testing

## Prerequisites

- Database is running and accessible
- For Alpha Vantage mode: API key configured in AWS Secrets Manager

## Usage

### Generate Sample Data (Recommended for Testing)

Generate sample price data for a single symbol:
```bash
pnpm run load-prices -- --sample AAPL
```

Generate sample data for all symbols in the database:
```bash
pnpm run load-prices -- --sample-all
```

This generates 365 days of realistic-looking price data using a random walk algorithm.

### Load Real Data from Alpha Vantage

**Important**: Alpha Vantage free tier limits:
- 5 API calls per minute
- 500 API calls per day

Load recent data (100 days) for a single symbol:
```bash
pnpm run load-prices -- --symbol AAPL
```

Load full history (20+ years) for a single symbol:
```bash
pnpm run load-prices -- --symbol AAPL --full
```

Load multiple symbols:
```bash
pnpm run load-prices -- --symbols AAPL,GOOGL,MSFT
```

Load all symbols (WARNING: Rate limits apply):
```bash
pnpm run load-prices -- --all
```

## Setup Alpha Vantage (Optional)

1. Get a free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)

2. Store it in AWS Secrets Manager:
```bash
aws secretsmanager put-secret-value \
  --secret-id stock-picker/production/alpha-vantage \
  --secret-string '{"apiKey":"YOUR_API_KEY_HERE"}'
```

3. Set environment variable in Lambda:
```
ALPHA_VANTAGE_SECRET_ARN=arn:aws:secretsmanager:region:account:secret:stock-picker/production/alpha-vantage
```

## Database Schema

Price data is stored in the `stock_prices` table:

```sql
CREATE TABLE stock_prices (
    symbol VARCHAR(10) NOT NULL REFERENCES stocks(symbol),
    date DATE NOT NULL,
    open DECIMAL(12, 4) NOT NULL,
    high DECIMAL(12, 4) NOT NULL,
    low DECIMAL(12, 4) NOT NULL,
    close DECIMAL(12, 4) NOT NULL,
    volume BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (symbol, date)
);
```

## Example Workflow

1. **Initial Setup** - Generate sample data for testing:
```bash
pnpm run load-prices -- --sample-all
```

2. **Run Backtests** - Use the UI to create and run backtests with sample data

3. **Load Real Data** (Optional) - When ready for production:
```bash
# Load recent data for your stock universe
pnpm run load-prices -- --symbols AAPL,GOOGL,MSFT,TSLA,NVDA
```

4. **Keep Data Fresh** - Run periodically to update prices:
```bash
pnpm run load-prices -- --all
```

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED
```
**Solution**: Check DATABASE_URL environment variable and ensure database is running

### Rate Limit Exceeded
```
Error: Rate limit exceeded
```
**Solution**: Wait 1 minute and try again. Consider loading fewer symbols at once.

### Symbol Not Found
```
Error: Symbol XXXX not found in database
```
**Solution**: Add the symbol to the `stocks` table first using the seed script

## Technical Details

- **Alpha Vantage Client**: `/src/integrations/alpha-vantage/client.ts`
- **Price Data Service**: `/src/services/price-data.service.ts`
- **Load Script**: `/src/scripts/load-prices.ts`

The service includes:
- Automatic rate limiting (5 calls/minute)
- Batch inserts for performance
- Upsert logic (updates existing data)
- Error handling and retry logic
- Progress tracking

## Next Steps

After loading price data, you can:
1. Run backtests through the UI at `/backtests`
2. View available date ranges for each symbol
3. Configure strategies and test them on historical data
