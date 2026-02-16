# Alpaca Integration Setup

This guide explains how to configure Alpaca broker integration for paper and live trading.

## Overview

The Stock Picker application integrates with [Alpaca](https://alpaca.markets/) for:
- **Paper Trading**: Test strategies with simulated money (free)
- **Live Trading**: Execute real trades with your brokerage account
- **Market Data**: Real-time quotes and market information

## Prerequisites

- AWS CLI configured with appropriate credentials
- Alpaca account (free paper trading account)

## Step 1: Create Alpaca Account

1. Go to [Alpaca](https://alpaca.markets/) and sign up for a free account
2. Navigate to the [Dashboard](https://app.alpaca.markets/paper/dashboard/overview)
3. Go to "Your API Keys" section

## Step 2: Generate API Keys

### For Paper Trading (Recommended for Testing)

1. In the Alpaca dashboard, switch to **Paper Trading** mode (toggle in top right)
2. Go to "API Keys" section
3. Click "Generate New Key"
4. Save your:
   - **API Key ID**
   - **Secret Key** (shown only once!)

### For Live Trading (Production Only)

1. Complete Alpaca account verification
2. Fund your account
3. Switch to **Live Trading** mode in dashboard
4. Generate live API keys (same process as paper trading)

⚠️ **Important**: Live trading keys are different from paper trading keys. Never mix them up!

## Step 3: Configure AWS Secrets Manager

### Production Environment

**For Paper Trading:**
```bash
aws secretsmanager put-secret-value \
  --region eu-west-1 \
  --secret-id stock-picker/production/alpaca \
  --secret-string '{
    "apiKey":"YOUR_PAPER_API_KEY",
    "apiSecret":"YOUR_PAPER_SECRET_KEY",
    "baseUrl":"https://paper-api.alpaca.markets"
  }'
```

**For Live Trading** (⚠️ use with caution):
```bash
aws secretsmanager put-secret-value \
  --region eu-west-1 \
  --secret-id stock-picker/production/alpaca \
  --secret-string '{
    "apiKey":"YOUR_LIVE_API_KEY",
    "apiSecret":"YOUR_LIVE_SECRET_KEY",
    "baseUrl":"https://api.alpaca.markets"
  }'
```

### Staging Environment

```bash
aws secretsmanager put-secret-value \
  --region eu-west-1 \
  --secret-id stock-picker/staging/alpaca \
  --secret-string '{
    "apiKey":"YOUR_PAPER_API_KEY",
    "apiSecret":"YOUR_PAPER_SECRET_KEY",
    "baseUrl":"https://paper-api.alpaca.markets"
  }'
```

## Step 4: Verify Integration

The application will automatically:
- Detect Alpaca credentials at startup
- Switch from demo mode to live Alpaca integration
- Log connection status to CloudWatch

### Check Logs

```bash
# View recent API Lambda logs
aws logs tail --region eu-west-1 --follow /aws/lambda/StockPicker-production-Api-ApiFunction*
```

Look for:
- ✅ `Alpaca client initialized with live credentials`
- ❌ `Running in demo mode - using simulated prices`

## Demo Mode

If Alpaca credentials are not configured, the application runs in **demo mode**:
- Uses simulated prices based on symbol hash
- Executes "fake" trades that complete immediately
- Perfect for development and testing
- No external API calls

## API Endpoints Using Alpaca

- `POST /portfolios/{id}/trades` - Execute trades
- `GET /portfolios/{id}/positions` - Get current positions
- `GET /stocks/{symbol}/quote` - Get real-time quote
- `POST /orders` - Submit orders
- `DELETE /orders/{id}` - Cancel orders

## Rate Limits

### Alpaca API Limits
- **Paper Trading**: 200 requests/minute
- **Live Trading**: 200 requests/minute
- **Market Data**: 200 requests/minute

The application includes automatic retry logic with exponential backoff.

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use paper trading** for development and testing
3. **Rotate keys regularly** (every 90 days recommended)
4. **Monitor usage** in Alpaca dashboard
5. **Set up alerts** for unusual trading activity

## Troubleshooting

### Error: "Alpaca API error: Forbidden"
- Check that API keys are correct
- Verify keys match environment (paper vs live)
- Ensure account is not suspended

### Error: "Running in demo mode"
- Verify secret exists: `aws secretsmanager describe-secret --secret-id stock-picker/production/alpaca`
- Check Lambda has IAM permissions to read secret
- Verify environment variable `ALPACA_SECRET_ARN` is set

### Error: "Rate limit exceeded"
- Wait 1 minute and retry
- Review application logs for excessive API calls
- Consider implementing request queuing

## Additional Resources

- [Alpaca Documentation](https://alpaca.markets/docs/)
- [Alpaca API Reference](https://alpaca.markets/docs/api-references/trading-api/)
- [Paper Trading Guide](https://alpaca.markets/docs/trading/paper-trading/)
- [Market Data](https://alpaca.markets/docs/market-data/)

## Support

For Alpaca-specific issues:
- Email: support@alpaca.markets
- [Community Forum](https://forum.alpaca.markets/)

For Stock Picker application issues:
- Check CloudWatch logs
- Review backend logs for error details
