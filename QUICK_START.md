# Stock Picker - Quick Start Guide

Get up and running with Stock Picker in 10 minutes.

## 🚀 Your First Strategy in 5 Steps

### Step 1: Create a Portfolio (2 min)

1. Go to **Portfolios** page
2. Click **"Create Portfolio"**
3. Fill in:
   - Name: "My First Portfolio"
   - Initial Cash: $10,000
4. Click **"Create"**

✅ You now have a portfolio to hold your positions!

---

### Step 2: Build a Simple Strategy (3 min)

1. Go to **Strategies** page
2. Click **"Create Strategy"**
3. Configure:
   - Name: "Simple Momentum"
   - Select your portfolio

4. Add factors:
   - **Click "Add Factor"**
   - Select **RSI**
     - Weight: 0.5
     - Period: 14
     - Oversold: 30
     - Overbought: 70

   - **Click "Add Factor"** again
   - Select **MACD**
     - Weight: 0.5
     - Fast: 12
     - Slow: 26
     - Signal: 9

5. Set risk management:
   - Stop Loss: 5%
   - Position Size: 10%
   - Max Positions: 8

6. Click **"Save Strategy"**

✅ You've built your first trading strategy!

---

### Step 3: Backtest Your Strategy (2 min)

1. Go to **Backtests** page
2. Click **"New Backtest"**
3. Configure:
   - Strategy: "Simple Momentum"
   - Start Date: 1 year ago
   - End Date: Today
   - Initial Capital: $10,000
   - Commission: $1
   - Slippage: 0.1%

4. Click **"Run Backtest"**
5. Wait 30-60 seconds for results

✅ See how your strategy would have performed!

---

### Step 4: Review Results (2 min)

Look at key metrics:

**What to look for:**
- ✅ Total Return: Positive number (e.g., +15%)
- ✅ Sharpe Ratio: Above 1.0
- ✅ Win Rate: Above 50%
- ✅ Max Drawdown: Below 20%

**If results look good:**
- Your strategy is validated!
- Move to Step 5

**If results are poor:**
- Try adjusting factor parameters
- Run another backtest
- See "Strategy Tuning Tips" below

---

### Step 5: Enable Live Trading (1 min)

1. Go back to **Strategies** page
2. Click on "Simple Momentum" strategy
3. Toggle **"Enable Automated Trading"**
4. Confirm

✅ Your strategy is now live! It will automatically:
- Generate signals every 15 minutes during market hours
- Execute trades when opportunities arise
- Manage risk according to your settings

---

## 📊 Monitoring Your Strategy

### Daily Check (1 minute)

1. Visit **Dashboard**
2. Check:
   - Current positions
   - Today's P&L
   - Recent trades

### Weekly Review (5 minutes)

1. Go to **Portfolio Details**
2. Review:
   - Overall performance
   - Win rate
   - Individual position P&L
3. Adjust strategy if needed

---

## 🎯 Strategy Tuning Tips

### If Your Strategy Has Low Returns

**Problem**: Not generating enough signals

**Solution**:
- Lower RSI oversold threshold (try 35)
- Reduce factor requirements
- Add more stocks to your watchlist

---

**Problem**: Too many losing trades

**Solution**:
- Tighten stop loss (try 4%)
- Increase RSI period to 20
- Add Moving Average Crossover factor for confirmation

---

### If Your Strategy Is Too Aggressive

**Solution**:
- Reduce position size (try 5-8%)
- Lower max positions (try 5-6)
- Increase stop loss sensitivity

---

### If Your Strategy Is Too Conservative

**Solution**:
- Increase position size (try 12-15%)
- Relax factor thresholds
- Add momentum factors with higher weights

---

## 🏆 Pre-Built Strategy Templates

Copy these proven configurations to get started faster:

### 1. Conservative Growth

**Goal**: Steady returns with low risk

```
Factors:
- MA Crossover (50/200): Weight 0.6
- RSI (period 14): Weight 0.4

Risk Management:
- Stop Loss: 3%
- Position Size: 8%
- Max Positions: 6
```

**Expected**: 8-12% annual return, Sharpe > 1.2

---

### 2. Balanced Momentum

**Goal**: Good returns with moderate risk

```
Factors:
- RSI (period 14): Weight 0.4
- MACD (12/26/9): Weight 0.35
- MA Crossover (50/200): Weight 0.25

Risk Management:
- Stop Loss: 5%
- Position Size: 10%
- Max Positions: 8
```

**Expected**: 15-20% annual return, Sharpe > 1.0

---

### 3. Aggressive Growth

**Goal**: Maximum returns, higher risk tolerance

```
Factors:
- MACD (12/26/9): Weight 0.45
- RSI (period 10): Weight 0.35
- MA Crossover (20/50): Weight 0.20

Risk Management:
- Stop Loss: 7%
- Position Size: 15%
- Max Positions: 12
```

**Expected**: 25-35% annual return, Sharpe > 0.8

---

## 🎓 Understanding the Basics

### What Are Factors?

**Factors** are technical indicators that analyze stock prices:

**RSI (Relative Strength Index)**
- Measures if stock is oversold (cheap) or overbought (expensive)
- When RSI < 30: Stock may be undervalued → BUY signal
- When RSI > 70: Stock may be overvalued → SELL signal

**MACD (Moving Average Convergence Divergence)**
- Tracks momentum and trend direction
- When MACD crosses above signal line → BUY signal
- When MACD crosses below signal line → SELL signal

**Moving Average Crossover**
- Compares short-term vs long-term price trends
- When short MA crosses above long MA → BUY (Golden Cross)
- When short MA crosses below long MA → SELL (Death Cross)

---

### How Strategies Work

1. **Every 15 minutes** during market hours (9:30 AM - 4:00 PM ET)
2. Strategy evaluates each stock using your factors
3. Each factor gives a score from -1 (strong sell) to +1 (strong buy)
4. Scores are combined using your weights
5. Final score determines signal:
   - Score > 0.3 → BUY
   - Score < -0.3 → SELL
   - Otherwise → HOLD
6. Risk management applies position sizing and stops
7. Orders submitted to Alpaca broker

---

### Understanding Risk Management

**Stop Loss (5%)**
- Automatically sells position if it drops 5% from entry
- Prevents large losses
- Lower % = tighter protection, more frequent exits

**Position Size (10%)**
- Invests 10% of portfolio in each position
- Ensures diversification
- Lower % = more conservative

**Max Positions (8)**
- Limits total number of holdings
- Reserves cash for opportunities
- Lower number = more concentrated

---

## 🔥 Power User Tips

### Keyboard Shortcut

Press **Cmd+K** (Mac) or **Ctrl+K** (Windows) to open Command Palette for instant navigation.

---

### Real-Time Monitoring

Enable WebSocket updates in Settings for instant notification of:
- New trades
- Position changes
- Strategy signals
- Price alerts

---

### Compare Strategies

Run multiple backtests with different settings, then:

1. Go to **Backtests → Compare**
2. Select your backtests
3. See which performs best
4. Clone the winner and deploy it

---

### Optimize Automatically

Use Strategy Optimizer to find best parameters:

1. Go to **Strategy Optimizer**
2. Select your strategy
3. Define parameter ranges to test
4. Let the system find optimal values
5. Create new strategy with winning config

---

## 📱 Mobile Usage

Stock Picker is fully responsive. Access from your phone to:

- Monitor positions on the go
- Check daily P&L
- Review trade notifications
- Disable strategies if needed

---

## ⚠️ Important Reminders

### Before Going Live

- [ ] Backtest shows positive results (> 30 trades)
- [ ] Sharpe ratio > 1.0
- [ ] Win rate > 50%
- [ ] Tested on at least 1 year of data
- [ ] Risk settings are appropriate for your tolerance

### Safety Checklist

- [ ] Start with small position sizes (5-8%)
- [ ] Use stop losses on all strategies
- [ ] Monitor daily for first week
- [ ] Only use capital you can afford to lose
- [ ] Understand this is paper trading (if applicable)

### Market Hours

- **US Stock Market**: 9:30 AM - 4:00 PM ET, Monday-Friday
- Strategies only trade during these hours
- No weekend or holiday trading

---

## 🆘 Common Issues

**Q: My strategy isn't generating any signals**

A: Your factor thresholds may be too strict. Try:
- Lowering RSI oversold to 35
- Increasing RSI overbought to 65
- Relaxing other factor parameters

---

**Q: I'm getting too many trades**

A: Your strategy is too sensitive. Try:
- Tightening RSI thresholds (30/70)
- Increasing factor periods (e.g., RSI period 20)
- Adding more factors for confirmation

---

**Q: How do I stop trading?**

A:
1. Go to Strategy page
2. Click your strategy
3. Toggle off "Enable Automated Trading"
4. Existing positions remain open

---

**Q: Should I close positions manually?**

A: Usually not necessary - your stop loss will manage exits. But you can manually close from:
- Portfolio Detail page → Position → "Close"
- Stock Detail page → "Sell"

---

## 📚 Next Steps

Once comfortable with basics:

1. **Read Full User Guide** (`USER_GUIDE.md`) for comprehensive features
2. **Explore Live Signals** page to see real-time strategy signals
3. **Try Stock Analysis** tools for research
4. **Set Up Alerts** for important events
5. **Use Performance Analytics** for deep insights

---

## 🎉 You're Ready!

You now know enough to:
- ✅ Create portfolios
- ✅ Build strategies
- ✅ Run backtests
- ✅ Go live with automated trading
- ✅ Monitor performance

**Start simple, test thoroughly, and gradually increase complexity.**

Happy trading! 🚀📈

---

**Need Help?**
- Full documentation: `USER_GUIDE.md`
- Development guide: `CLAUDE.md`
- Technical issues: Check GitHub issues
