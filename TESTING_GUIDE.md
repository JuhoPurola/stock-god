# WebSocket Testing Guide - Step by Step

**Status:** ✅ All infrastructure verified and ready
**WebSocket URL:** `wss://75el4li1o3.execute-api.eu-west-1.amazonaws.com/production`
**Frontend URL:** `https://d18x5273m9nt2k.cloudfront.net`

---

## 🎯 Test 1: Basic WebSocket Connection

### Steps:

1. **Open the frontend in your browser:**
   ```
   https://d18x5273m9nt2k.cloudfront.net
   ```

2. **Open Developer Tools (F12):**
   - Go to **Console** tab
   - Go to **Network** tab → **WS** (WebSocket) filter

3. **Login with Auth0**
   - Use your Auth0 credentials
   - Watch the console during login

### ✅ Expected Results:

**In Console:**
```
✅ WebSocket connected - Real-time updates enabled
```

**In Network → WS Tab:**
- You should see a WebSocket connection to `wss://75el4li1o3.execute-api.eu-west-1.amazonaws.com/production`
- Status: `101 Switching Protocols`
- State: `Connected`

**In DynamoDB (verify via command line):**
```bash
aws dynamodb scan \
  --table-name stockpicker-production-connections \
  --region eu-west-1
```

Should show 1 connection with your userId.

### ❌ If Connection Fails:

**Check Console for errors:**
- "No token provided" → Auth0 token issue, try logout/login
- "Invalid token" → Token expired, refresh page
- "WebSocket disconnected" immediately → Check Lambda logs

**Check Lambda logs:**
```bash
aws logs tail /aws/lambda/stockpicker-production-websocket-connect --follow --region eu-west-1
```

Look for error messages about authentication or permissions.

---

## 🎯 Test 2: Real-Time Trade Updates

### Steps:

1. **Navigate to a portfolio:**
   - Click "Portfolios" in sidebar
   - Select or create a portfolio

2. **Keep Network → WS tab visible in DevTools**

3. **Execute a trade:**
   - Click "Execute Trade" or "New Trade" button
   - Enter stock symbol: `AAPL`
   - Quantity: `10`
   - Click "Buy" (Market Order)

4. **Watch the WebSocket frames WITHOUT refreshing the page**

### ✅ Expected Results:

**In Network → WS Tab, you should see a new message:**
```json
{
  "type": "trade_executed",
  "timestamp": "2026-02-26T11:45:00.000Z",
  "data": {
    "portfolioId": "your-portfolio-id",
    "trade": {
      "id": "trade-id",
      "symbol": "AAPL",
      "side": "buy",
      "quantity": 10,
      "status": "filled",
      "executedPrice": 150.25,
      ...
    }
  }
}
```

**In the UI:**
- Trade appears in trades list immediately
- Portfolio value updates
- Position updates
- **NO PAGE REFRESH REQUIRED!**

**In Console:**
```
Trade executed event: {portfolioId, trade}
```

### ❌ If No Real-Time Update:

**Check if WebSocket is still connected:**
- Network → WS tab should show "Connected"
- If disconnected, auto-reconnect should happen within 30s

**Check API Lambda logs:**
```bash
aws logs tail /aws/lambda/StockPicker-production-Api-ApiFunctionCE271BD4-yvjY7rmva1on --follow --region eu-west-1
```

Look for:
- "Broadcasting to X connections for portfolio [portfolioId]"
- Any errors about WebSocket endpoint or permissions

**Verify environment variables are set:**
```bash
aws lambda get-function-configuration \
  --function-name StockPicker-production-Api-ApiFunctionCE271BD4-yvjY7rmva1on \
  --region eu-west-1 \
  --query 'Environment.Variables.{WebSocket:WEBSOCKET_API_ENDPOINT,Table:CONNECTIONS_TABLE_NAME}'
```

Should show both values.

---

## 🎯 Test 3: Auto-Reconnect

### Steps:

1. **With frontend open and connected:**
   - Verify "✅ WebSocket connected" in console

2. **Simulate network interruption:**
   - **Option A:** Turn off Wi-Fi for 5 seconds
   - **Option B:** In DevTools Network tab, set throttling to "Offline"

3. **Wait 5 seconds**

4. **Restore network:**
   - Turn Wi-Fi back on
   - Set throttling back to "No throttling"

5. **Watch the console**

### ✅ Expected Results:

**Console output:**
```
🔴 WebSocket disconnected
Reconnecting in 1000ms (attempt 1/10)
Connecting to WebSocket...
✅ WebSocket connected - Real-time updates enabled
```

**In Network → WS tab:**
- Old connection should show "Closed"
- New connection should appear and show "Connected"

**Timing:**
- First reconnect attempt: 1 second
- If that fails, 2nd attempt: 2 seconds (exponential backoff)
- Max delay: 30 seconds
- Max attempts: 10

### ❌ If Auto-Reconnect Fails:

**Check console for errors:**
- Look for "Max reconnection attempts reached"
- Check if token expired (logout/login)

**Manual reconnect:**
- Refresh the page (Ctrl+R / Cmd+R)
- Should connect immediately

---

## 🎯 Test 4: Multiple Concurrent Connections

### Steps:

1. **Open 3 browser tabs** (same browser)
   - All pointing to `https://d18x5273m9nt2k.cloudfront.net`

2. **Login in all tabs** (may auto-login if already logged in)

3. **Open DevTools in each tab:**
   - Check Console for "WebSocket connected"
   - Check Network → WS for connection

4. **In ONE tab, execute a trade**

5. **Watch ALL tabs for updates**

### ✅ Expected Results:

**All 3 tabs should:**
- Show independent WebSocket connections (different connectionIds)
- All receive the same trade execution event
- All update UI simultaneously
- No interference between tabs

**In DynamoDB:**
```bash
aws dynamodb scan --table-name stockpicker-production-connections --region eu-west-1
```

Should show 3 connections, all with same userId but different connectionIds.

### ❌ If Only One Tab Connects:

This would indicate a client-side issue:
- Check for JavaScript errors in console
- Verify useWebSocket hook is initializing correctly
- Check if Auth0 token is being shared correctly

---

## 🎯 Test 5: Portfolio Subscription

### Steps:

1. **Open frontend and connect**

2. **Navigate to Portfolio A**
   - Should auto-subscribe to Portfolio A updates

3. **In DynamoDB, verify subscription:**
```bash
aws dynamodb query \
  --table-name stockpicker-production-connections \
  --index-name PortfolioIdIndex \
  --key-condition-expression "portfolioId = :pid" \
  --expression-attribute-values '{":pid":{"S":"YOUR_PORTFOLIO_ID"}}' \
  --region eu-west-1
```

4. **Navigate to Portfolio B**
   - Should automatically unsubscribe from A and subscribe to B

5. **Execute a trade in Portfolio B**

6. **Verify update received**

### ✅ Expected Results:

- Only receive updates for the portfolio you're currently viewing
- Subscription changes automatically when navigating between portfolios
- No updates received for other portfolios

---

## 🎯 Test 6: Heartbeat / Ping-Pong

### Steps:

1. **Open frontend and connect**

2. **Leave the page open for 2-3 minutes**

3. **Watch Network → WS tab:**
   - Look for periodic messages every ~30 seconds

### ✅ Expected Results:

**Every 30 seconds, you should see:**

**Outgoing (from browser):**
```json
{
  "action": "ping"
}
```

**Incoming (from server):**
```json
{
  "success": true,
  "message": "pong"
}
```

This keeps the connection alive and prevents idle timeouts.

### ❌ If No Heartbeat:

- Connection may timeout after ~10 minutes
- Check if `startPingInterval()` is being called in useWebSocket hook
- Verify default handler is processing ping messages

---

## 🎯 Test 7: Connection Cleanup (TTL)

### Steps:

1. **Connect to WebSocket**

2. **Note the current time**

3. **Close browser tab** (don't logout, just close)

4. **Check DynamoDB immediately:**
```bash
aws dynamodb scan --table-name stockpicker-production-connections --region eu-west-1
```

Connection should still exist (for up to a few minutes until disconnect handler runs).

5. **Check again in 24 hours:**

Connection should be automatically removed by DynamoDB TTL.

### ✅ Expected Results:

- Connections are cleaned up automatically
- TTL is set to 24 hours from connection time
- Stale connections don't accumulate

---

## 📊 Monitoring Commands

### Real-time Connection Count:
```bash
aws dynamodb scan \
  --table-name stockpicker-production-connections \
  --select COUNT \
  --region eu-west-1 \
  --query 'Count'
```

### List All Connections:
```bash
aws dynamodb scan \
  --table-name stockpicker-production-connections \
  --region eu-west-1 \
  --output table
```

### Watch Connect Logs:
```bash
aws logs tail /aws/lambda/stockpicker-production-websocket-connect --follow --region eu-west-1
```

### Watch Disconnect Logs:
```bash
aws logs tail /aws/lambda/stockpicker-production-websocket-disconnect --follow --region eu-west-1
```

### Watch Message Logs:
```bash
aws logs tail /aws/lambda/stockpicker-production-websocket-default --follow --region eu-west-1
```

### Watch API Broadcasting Logs:
```bash
aws logs tail /aws/lambda/StockPicker-production-Api-ApiFunctionCE271BD4-yvjY7rmva1on --follow --region eu-west-1
```

---

## ✅ Success Checklist

After completing all tests, verify:

- [ ] WebSocket connects automatically on login
- [ ] Console shows "✅ WebSocket connected"
- [ ] Trade execution triggers real-time UI update (no refresh)
- [ ] Auto-reconnect works after network interruption
- [ ] Multiple tabs can connect simultaneously
- [ ] Portfolio subscription changes automatically
- [ ] Heartbeat ping-pong happens every 30 seconds
- [ ] No JavaScript errors in console
- [ ] No Lambda errors in CloudWatch logs

---

## 🐛 Common Issues & Solutions

### Issue: "No token provided"
**Solution:** Logout and login again to refresh Auth0 token

### Issue: "WebSocket disconnected" immediately
**Solution:**
- Check Lambda logs for auth errors
- Verify token is valid: Check localStorage in DevTools
- Try incognito mode to rule out cached token issues

### Issue: No real-time updates
**Solution:**
- Verify WEBSOCKET_API_ENDPOINT is set in API Lambda
- Check API Lambda has permissions to DynamoDB and API Gateway Management API
- Look for "Broadcasting" messages in API Lambda logs

### Issue: Auto-reconnect not working
**Solution:**
- Check console for reconnection attempts
- Verify exponential backoff is happening (1s, 2s, 4s, etc.)
- If max attempts reached, manually refresh page

### Issue: Multiple tabs interfering
**Solution:**
- Each tab should have independent connection
- Check connectionIds are different in DynamoDB
- Verify Auth0 tokens are separate per tab

---

## 🎉 When Everything Works

You should see:
- ✅ Instant trade updates without page refresh
- ✅ Smooth reconnection after network issues
- ✅ Multiple portfolios/tabs working independently
- ✅ Console showing clean connection messages
- ✅ No errors in CloudWatch logs

**Next step:** Move to Phase 2 (Alert System) to build on this WebSocket foundation!

---

**Created:** February 26, 2026
**Environment:** Production
**WebSocket URL:** wss://75el4li1o3.execute-api.eu-west-1.amazonaws.com/production
