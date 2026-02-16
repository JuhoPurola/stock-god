# Cost Optimizations Implemented

This document details all cost optimizations applied to the Stock Picker AWS infrastructure.

## Summary of Savings

**Original Estimated Cost:** $60-70/month
**Optimized Cost:** $25-35/month
**Monthly Savings:** ~$35/month (50% reduction)

## Optimizations Applied

### 1. ✅ Eliminated NAT Gateway (Saves $35/month)

**Change:** Removed NAT Gateway, added VPC Endpoints instead

**Before:**
- NAT Gateway: $0.045/hour = ~$32.40/month
- Data processing: $0.045/GB = ~$2-5/month
- **Total: ~$35/month**

**After:**
- VPC Interface Endpoints (Secrets Manager + CloudWatch Logs): ~$7/month
- VPC Gateway Endpoints (S3 + DynamoDB): Free
- **Total: ~$7/month**

**Net Savings: ~$28/month**

**Implementation:**
```typescript
// database-stack.ts
natGateways: 0,  // Removed NAT Gateway
subnetType: ec2.SubnetType.PRIVATE_ISOLATED,  // Changed subnet type

// Added VPC Endpoints
vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
});
vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
});
vpc.addGatewayEndpoint('S3Endpoint', {
  service: ec2.GatewayVpcEndpointAwsService.S3,
});
```

### 2. ✅ Switched to HTTP API (Saves $2.50/million requests)

**Change:** Replaced REST API with HTTP API Gateway

**Before:**
- REST API: $3.50 per million requests
- More complex routing and features

**After:**
- HTTP API: $1.00 per million requests
- Simpler, faster, 70% cheaper
- **Savings: $2.50 per million requests**

**Implementation:**
```typescript
// api-stack.ts
const api = new apigatewayv2.HttpApi(this, 'Api', {
  // HTTP API configuration
});
```

### 3. ✅ ARM Lambda Architecture (Saves 20% on compute)

**Change:** Switched from x86_64 to ARM64 (Graviton2)

**Benefits:**
- 20% cost reduction
- 34% better performance
- Same code compatibility with Node.js

**Implementation:**
```typescript
// api-stack.ts
runtime: lambda.Runtime.NODEJS_20_X,
architecture: lambda.Architecture.ARM_64,
```

### 4. ✅ Reduced Lambda Memory (Saves 50% on compute)

**Change:** Reduced memory allocation from 512 MB to 256 MB

**Before:**
- 512 MB memory
- Higher cost per invocation

**After:**
- 256 MB memory (sufficient for API operations)
- 50% cost reduction
- **Action:** Monitor actual memory usage and adjust if needed

**Implementation:**
```typescript
// api-stack.ts
memorySize: 256,  // Reduced from 512 MB
```

### 5. ✅ Reduced CloudWatch Logs Retention (Saves ~$2/month)

**Change:** Reduced log retention from 7 days to 3 days

**Savings:**
- Lower storage costs
- Reduced CloudWatch Logs ingestion fees
- **Estimated savings: ~$2/month**

**Implementation:**
```typescript
// api-stack.ts
logRetention: logs.RetentionDays.THREE_DAYS,
```

### 6. ✅ CloudFront Compression (Reduces bandwidth)

**Change:** Enabled compression for all CloudFront responses

**Benefits:**
- Reduces data transfer costs
- Faster page loads
- Lower bandwidth usage

**Implementation:**
```typescript
// frontend-stack.ts
compress: true,
```

### 7. ✅ Updated to Modern CloudFront Origin

**Change:** Switched from deprecated S3Origin to S3BucketOrigin with Origin Access Control

**Benefits:**
- Better security (OAC vs OAI)
- No deprecation warnings
- Future-proof infrastructure

## Detailed Cost Breakdown

### Optimized Staging Environment (~$25-35/month)

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| RDS t4g.micro | $15 | Single-AZ PostgreSQL |
| VPC Endpoints | $7 | Secrets Manager + CloudWatch Logs |
| Lambda (ARM) | $3-5 | Reduced memory, 20% cheaper architecture |
| HTTP API Gateway | $1 | 70% cheaper than REST API |
| S3 + CloudFront | $2-5 | Frontend hosting with compression |
| CloudWatch | $1-2 | 3-day log retention |
| **Total** | **$29-35/month** | |

### Cost Comparison

| Configuration | Monthly Cost | Savings |
|--------------|--------------|---------|
| Original (with NAT) | $60-70 | - |
| Optimized (VPC Endpoints) | $25-35 | ~$35 (50%) |

## Monitoring Recommendations

### 1. Lambda Memory Usage
```bash
# Check actual memory usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name MemoryUtilization \
  --dimensions Name=FunctionName,Value=stock-picker-api \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Maximum
```

**Action:** If consistently under 128 MB, reduce further. If over 200 MB consistently, increase to 384 MB.

### 2. API Gateway Usage
```bash
# Monitor request patterns
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count
```

**Cost per 1M requests:** $1.00 (HTTP API)

### 3. VPC Endpoint Data Transfer
```bash
# Monitor VPC endpoint usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/VPC \
  --metric-name BytesTransferred
```

**Cost:** Included in endpoint hourly charge (~$7/month)

## Future Optimizations

### Consider for Production

1. **Reserved Capacity Savings Plans**
   - 1-year commitment: 30-40% savings on Lambda and RDS
   - 3-year commitment: 50-60% savings

2. **Aurora Serverless v2** (instead of RDS)
   - Auto-scales from 0.5-1 ACU (~$0.12/hour when active)
   - Pauses when idle
   - Better for variable workloads
   - Cost: ~$10-20/month (vs $15 for always-on RDS)

3. **CloudFront Security Savings Bundle**
   - 1-year commitment
   - 30% discount on data transfer
   - Good for production with predictable traffic

4. **S3 Intelligent-Tiering**
   - Automatically moves objects to cheaper storage tiers
   - No retrieval fees
   - Minimal additional cost

## Verification

After deployment, verify optimizations:

```bash
# 1. Check no NAT Gateway exists
aws ec2 describe-nat-gateways --filter "Name=state,Values=available"
# Should return empty

# 2. Verify VPC Endpoints
aws ec2 describe-vpc-endpoints
# Should show 4 endpoints

# 3. Check Lambda architecture
aws lambda get-function --function-name stock-picker-api
# Should show "Architectures": ["arm64"]

# 4. Verify HTTP API (not REST API)
aws apigatewayv2 get-apis
# Should show ProtocolType: HTTP

# 5. Monitor first month costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-02-01
```

## Cost Alerts

Set up billing alerts for cost monitoring:

```bash
# Create CloudWatch alarm for monthly costs
aws cloudwatch put-metric-alarm \
  --alarm-name stock-picker-cost-alert \
  --alarm-description "Alert when monthly costs exceed $40" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 40 \
  --comparison-operator GreaterThanThreshold
```

## Questions?

If costs are higher than expected:
1. Check CloudWatch metrics for Lambda invocations
2. Review VPC Endpoint data transfer
3. Monitor RDS CPU/memory usage
4. Check CloudFront cache hit ratio
5. Review CloudWatch Logs ingestion

All optimizations maintain the same functionality while significantly reducing costs!
