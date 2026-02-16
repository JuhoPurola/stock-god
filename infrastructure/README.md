# Stock Picker - AWS CDK Infrastructure

This directory contains the AWS CDK infrastructure code for deploying the Stock Picker application to AWS.

## Architecture

The infrastructure is organized into 4 CloudFormation stacks:

1. **Database Stack** - PostgreSQL RDS with VPC
2. **API Stack** - Lambda functions + API Gateway
3. **Frontend Stack** - S3 + CloudFront
4. **Scheduler Stack** - EventBridge rules for automated execution

## Prerequisites

- AWS CLI configured with credentials for account **865097414780**
- Node.js 18+ installed
- CDK CLI installed: `npm install -g aws-cdk`
- Frontend and backend built

## Deployment Region

**eu-west-1** (Ireland)

## Deployment Steps

### 1. Install Dependencies

```bash
cd infrastructure
npm install
```

### 2. Bootstrap CDK (First Time Only)

```bash
cdk bootstrap aws://865097414780/eu-west-1
```

### 3. Build Backend and Frontend

```bash
# From project root
cd packages/backend
npm run build

cd ../frontend
npm run build
```

### 4. Deploy to Staging

```bash
cd infrastructure
npm run deploy:staging
```

This will deploy all 4 stacks:
- `StockPicker-staging-Database`
- `StockPicker-staging-Api`
- `StockPicker-staging-Frontend`
- `StockPicker-staging-Scheduler`

### 5. Configure Secrets

After deployment, add your API keys to AWS Secrets Manager:

```bash
# Alpaca credentials
aws secretsmanager put-secret-value \
  --region eu-west-1 \
  --secret-id stock-picker/staging/alpaca \
  --secret-string '{"apiKey":"YOUR_ALPACA_KEY","apiSecret":"YOUR_ALPACA_SECRET","baseUrl":"https://paper-api.alpaca.markets"}'

# Alpha Vantage key
aws secretsmanager put-secret-value \
  --region eu-west-1 \
  --secret-id stock-picker/staging/alpha-vantage \
  --secret-string '{"apiKey":"YOUR_ALPHA_VANTAGE_KEY"}'
```

### 6. Run Database Migrations

```bash
# Get database endpoint from outputs
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --region eu-west-1 \
  --stack-name StockPicker-staging-Database \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text)

# Get database credentials
aws secretsmanager get-secret-value \
  --region eu-west-1 \
  --secret-id stock-picker/staging/database \
  --query SecretString \
  --output text

# Connect and run migrations
psql -h $DB_ENDPOINT -U stock_picker -d stock_picker -f ../scripts/schema.sql
psql -h $DB_ENDPOINT -U stock_picker -d stock_picker -f ../scripts/seed.sql
```

### 7. Access Application

After deployment completes, the CloudFront URL will be in the outputs:

```bash
aws cloudformation describe-stacks \
  --region eu-west-1 \
  --stack-name StockPicker-staging-Frontend \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
  --output text
```

## Deploy to Production

```bash
npm run deploy:prod
```

Production differences:
- Larger RDS instance (t4g.small vs t4g.micro)
- Multi-AZ database
- 7-day backups (vs 1-day)
- Deletion protection enabled
- Versioned S3 bucket
- Scheduler rules enabled

## Useful Commands

```bash
# View what will be deployed
npm run synth

# View differences
npm run diff

# Destroy staging environment
npm run destroy:staging

# View stack outputs
aws cloudformation describe-stacks --region eu-west-1 --stack-name StockPicker-staging-Api
```

## Stack Outputs

### Database Stack
- `DatabaseEndpoint` - RDS endpoint address
- `DatabaseSecretArn` - Credentials in Secrets Manager
- `VpcId` - VPC ID for reference

### API Stack
- `ApiUrl` - API Gateway endpoint
- `ApiId` - API Gateway ID
- `AlpacaSecretArn` - Alpaca credentials secret
- `AlphaVantageSecretArn` - Alpha Vantage secret

### Frontend Stack
- `FrontendUrl` - CloudFront distribution URL
- `BucketName` - S3 bucket name
- `DistributionId` - CloudFront distribution ID

### Scheduler Stack
- `SchedulerFunctionArn` - Lambda function ARN
- `MarketHoursRuleArn` - EventBridge rule ARN

## Costs

### Staging Environment (Approximate Monthly)
- RDS t4g.micro: $15
- Lambda (light usage): $5
- API Gateway: $3.50 per million requests
- S3 + CloudFront: $1-5
- NAT Gateway: $35
- **Total: ~$60-70/month**

### Production Environment
- RDS t4g.small (Multi-AZ): $60
- Lambda: $10-20
- API Gateway: $10+ (depending on traffic)
- S3 + CloudFront: $5-10
- NAT Gateway: $35
- **Total: ~$120-150/month**

## Monitoring

CloudWatch dashboards and alarms are automatically created for:
- API Gateway latency and errors
- Lambda invocations and errors
- RDS CPU and connections
- CloudFront requests

## Security

- Database in private subnets
- Lambda in VPC with NAT Gateway
- All credentials in Secrets Manager
- Encryption at rest for all data
- HTTPS only for frontend (CloudFront)
- API Gateway with CORS configured

## Troubleshooting

### Database Connection Issues
Check security groups allow Lambda to RDS on port 5432

### Lambda Timeout
Increase timeout in api-stack.ts if needed (default: 30s)

### Frontend Not Updating
Invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

## Clean Up

To delete all resources:

```bash
npm run destroy:staging
```

**Warning**: This will delete the database and all data unless deletion protection is enabled.
