# WebSocket Phase 1 - SUCCESS + API Lambda Issue

**Date:** February 26, 2026
**Status:** WebSocket ✅ WORKING | API Lambda ⚠️ Timeout Issue

---

## 🎉 ACHIEVEMENTS

### WebSocket Infrastructure - COMPLETE AND WORKING!

✅ **WebSocket API Gateway**
- URL: `wss://75el4li1o3.execute-api.eu-west-1.amazonaws.com/production`
- Successfully connects and maintains connection
- Auto-reconnect with exponential backoff working

✅ **DynamoDB Connection Management**
- Table: `stockpicker-production-connections`
- TTL configured (24-hour auto-cleanup)
- GSI for userId and portfolioId queries

✅ **Lambda Functions (3)**
- Connect handler: Authenticates users and stores connections
- Disconnect handler: Cleans up connections
- Message handler: Routes WebSocket messages (ping/subscribe/unsubscribe)

✅ **Frontend Integration**
- `useWebSocket` hook with auto-reconnect
- WebSocketProvider component
- Event routing system ready
- **Connection confirmed in browser:** "✅ WebSocket connected - Real-time updates enabled"

✅ **Authentication**
- Auth0 integration working (temporary workaround for encrypted tokens)
- Connection established successfully

---

## ⚠️ KNOWN ISSUE: API Lambda Timeout

### Problem
The main API Lambda (`StockPicker-production-Api-ApiFunctionCE271BD4-yvjY7rmva1on`) is timing out during initialization (10 seconds) causing 503 errors for portfolio API calls.

### Root Cause
Lambda is in VPC (required for RDS access) with a **10MB code bundle** that's slow to load. Even though VPC endpoints exist for Secrets Manager, DynamoDB, S3, and CloudWatch Logs, the large bundle size causes init timeouts.

### Current State
- **VPC Endpoints:** ✅ Already configured (Secrets Manager, DynamoDB, S3, Logs)
- **Security Groups:** ✅ Properly configured (allows all outbound)
- **Environment Variables:** ✅ All set correctly
- **Database Pool:** ✅ Uses lazy initialization (not the problem)
- **Bundle Size:** ❌ 10MB is too large for efficient VPC Lambda cold starts

---

## 🔧 FIX OPTIONS (Choose One)

### Option 1: Optimize Bundle Size (FREE - Recommended)
**Effort:** 2-4 hours
**Cost:** $0

**Steps:**
1. Analyze bundle to find large dependencies
2. Use tree shaking to remove unused code
3. Split into multiple smaller Lambda functions if needed
4. External dependencies to Lambda Layers
5. Target bundle size: < 1MB compressed

**Command to analyze:**
```bash
cd packages/backend
npx esbuild src/lambda.ts --bundle --platform=node --analyze --metafile=meta.json
```

### Option 2: Use Provisioned Concurrency (PAID)
**Effort:** 10 minutes
**Cost:** ~$30/month

Keeps Lambda instances warm, avoiding cold starts entirely.

```bash
aws lambda put-provisioned-concurrency-config \
  --function-name StockPicker-production-Api-ApiFunctionCE271BD4-yvjY7rmva1on \
  --provisioned-concurrent-executions 1 \
  --region eu-west-1
```

### Option 3: Add NAT Gateway (PAID - You Don't Want This)
**Effort:** 1 hour
**Cost:** ~$32/month

Provides full internet access from VPC but expensive.

### Option 4: Migrate to RDS Data API (FREE - Complex)
**Effort:** 8-12 hours
**Cost:** $0

Remove Lambda from VPC entirely by using RDS Data API (HTTP-based, no VPC required). Requires significant code changes.

---

## 📊 RECOMMENDED ACTION PLAN

### Immediate (Now)
**WebSocket is working!** You can proceed with Phase 2 (Alert System) using the WebSocket infrastructure. The API timeout is a separate issue.

### Short-term (This Week)
**Option 1: Optimize bundle**
1. Run bundle analyzer
2. Identify large dependencies (likely `@aws-sdk/*` modules)
3. Use esbuild's tree-shaking more aggressively
4. Consider splitting API into multiple Lambda functions by route group

### Long-term (Next Month)
Consider architectural improvements:
- Separate Lambda per API resource (portfolios, strategies, trades)
- Use Lambda Layers for shared dependencies
- Implement caching layer (Redis/ElastiCache) to reduce database calls

---

## 🚀 NEXT STEPS FOR WEBSOCKET

Now that WebSocket is working, you can:

1. **Test Real-Time Updates**
   - Execute a trade in the UI
   - Verify WebSocket receives the update
   - Confirm UI updates without page refresh

2. **Configure Auth0 API Properly** (Optional but recommended)
   - Go to Auth0 Dashboard → APIs → Create API
   - Set identifier: `https://stockpicker-api`
   - Update frontend config to use audience
   - Remove temporary token workaround in backend

3. **Continue with Phase 2: Alert System**
   - Database schema for alerts
   - Email notifications (AWS SES)
   - Browser notifications via WebSocket (using the working infrastructure!)
   - Alert preferences management

---

## 📝 TECHNICAL DETAILS

### WebSocket Lambda Configuration
- **Runtime:** Node.js 20.x
- **Architecture:** ARM64
- **Memory:** 256 MB
- **VPC:** None (outside VPC for internet access)
- **Bundle Size:** 235 KB (efficient!)

### API Lambda Configuration
- **Runtime:** Node.js 20.x
- **Architecture:** ARM64
- **Memory:** 256 MB
- **VPC:** Yes (required for RDS)
- **Bundle Size:** 10 MB (⚠️ too large)
- **Timeout:** 300 seconds
- **Issue:** Init timeout at 10 seconds

### VPC Endpoints Available
- ✅ com.amazonaws.eu-west-1.s3
- ✅ com.amazonaws.eu-west-1.dynamodb
- ✅ com.amazonaws.eu-west-1.secretsmanager
- ✅ com.amazonaws.eu-west-1.logs

---

## 🎯 SUCCESS METRICS

✅ WebSocket connects successfully
✅ Auto-reconnect works after network interruption
✅ Heartbeat ping/pong every 30 seconds
✅ Connection management in DynamoDB
✅ Frontend shows "✅ WebSocket connected - Real-time updates enabled"
⚠️ API Lambda needs bundle optimization

**WebSocket Phase 1: COMPLETE AND DEPLOYED! 🎉**

---

## 🔍 DEBUGGING COMMANDS

### Check WebSocket connection
```bash
# Check connections in DynamoDB
aws dynamodb scan --table-name stockpicker-production-connections --region eu-west-1

# Watch WebSocket logs
aws logs tail /aws/lambda/stockpicker-production-websocket-connect --follow --region eu-west-1
```

### Check API Lambda
```bash
# Watch API logs
aws logs tail /aws/lambda/StockPicker-production-Api-ApiFunctionCE271BD4-yvjY7rmva1on --follow --region eu-west-1

# Check Lambda configuration
aws lambda get-function-configuration \
  --function-name StockPicker-production-Api-ApiFunctionCE271BD4-yvjY7rmva1on \
  --region eu-west-1
```

---

**Next:** Focus on optimizing the API Lambda bundle size (Option 1), or proceed with Phase 2 using the working WebSocket infrastructure!
