# Stock Picker - Frequently Asked Questions

Quick answers to common questions about using Stock Picker.

## Getting Started

### Q: I'm completely new. Where should I start?

**A:** Follow this path:
1. Read [QUICK_START.md](QUICK_START.md) (10 minutes)
2. Create your first portfolio and strategy
3. Run a backtest to validate
4. Once comfortable, read [USER_GUIDE.md](USER_GUIDE.md) for complete features

### Q: Do I need coding experience to use Stock Picker?

**A:** No! The web interface is designed for non-technical users. You only need coding knowledge if you want to:
- Add custom factors to the algorithm engine
- Modify the backend infrastructure
- Deploy your own instance

### Q: Is this real money trading or paper trading?

**A:** By default, Stock Picker connects to Alpaca's paper trading (simulated). To use real money:
- Upgrade your Alpaca account to live trading
- Update API keys in settings
- **Important**: Test thoroughly with paper trading first!

---

## Strategy & Backtesting

### Q: What's a good Sharpe ratio?

**A:**
- **< 0.5**: Poor (not worth the risk)
- **0.5 - 1.0**: Acceptable
- **1.0 - 2.0**: Good (target range)
- **> 2.0**: Excellent (or potential overfitting)

For reference, S&P 500 long-term Sharpe ratio is around 0.5-0.7.

### Q: My backtest shows amazing returns (50%+). Why should I be skeptical?

**A:** Very high returns usually indicate:
1. **Overfitting**: Strategy tuned too specifically to historical data
2. **Data errors**: Missing or incorrect price data
3. **Insufficient trades**: Few lucky trades skewing results
4. **No transaction costs**: Forgot to include commissions and slippage

**What to do:**
- Run out-of-sample test on different time period
- Verify data quality
- Ensure ≥30 trades
- Include realistic costs (commission: $1, slippage: 0.1%)

### Q: How many trades should a backtest have?

**A:**
- **Minimum**: 30 trades (basic statistical validity)
- **Good**: 50+ trades (more reliable)
- **Ideal**: 100+ trades (high confidence)

Fewer trades = less reliable results. Increase backtest period or relax factor thresholds to generate more signals.

### Q: What timeframe should I backtest?

**A:**
- **Minimum**: 6 months (captures some volatility)
- **Recommended**: 1-2 years (includes multiple market conditions)
- **Ideal**: 3+ years (bull, bear, and sideways markets)

More history = more robust validation, but ensure data quality for older periods.

### Q: My strategy isn't generating any signals. What's wrong?

**A:** Common causes:
1. **Factor thresholds too strict**: Lower RSI oversold (try 35), raise overbought (try 65)
2. **Conflicting factors**: Factors giving opposite signals, canceling each other
3. **Wrong timeframe**: MA periods too long for backtest window
4. **No matching stocks**: Try expanding stock universe

**Quick fix**: Start with single factor (RSI only) to verify signals, then add others.

---

## Risk Management

### Q: What position size should I use?

**A:** Depends on risk tolerance:
- **Conservative**: 5-8% per position
- **Moderate**: 10-12% per position
- **Aggressive**: 15% per position

**Never** exceed 20% in a single position.

**Rule of thumb**: If losing this position would stress you out, it's too large.

### Q: Should I use stop losses?

**A:** **Yes, always!** Stop losses are essential:
- Limit losses on individual positions
- Prevent catastrophic drawdowns
- Enforce disciplined exits

**Recommended stop loss**: 5% for most strategies. Adjust based on:
- **More volatile stocks**: 7-10% stop
- **Less volatile stocks**: 3-5% stop
- **Your risk tolerance**: Lower = tighter stops

### Q: What's a safe maximum drawdown?

**A:**
- **10-15%**: Conservative (typical for low-risk strategies)
- **15-20%**: Moderate (acceptable for most traders)
- **20-30%**: Aggressive (requires strong risk tolerance)
- **>30%**: Dangerous (difficult to recover psychologically and mathematically)

**Important**: A 50% drawdown requires 100% gain to recover!

### Q: How much cash should I keep in reserve?

**A:**
- **Minimum**: 10% (emergency buffer)
- **Recommended**: 20% (new opportunities + safety)
- **Conservative**: 30%+ (maximum flexibility)

Cash reserve purposes:
- Enter new positions when signals appear
- Cushion against temporary losses
- Reduce need to sell at bad times

---

## Trading Operations

### Q: When does automated trading run?

**A:**
- **During**: US market hours (9:30 AM - 4:00 PM ET)
- **Frequency**: Every 15 minutes by default
- **Days**: Monday-Friday (excludes holidays)
- **Overnight**: No trading (positions held)

### Q: Can I trade after hours?

**A:** Not currently supported. The platform only trades during regular market hours.

### Q: How long does it take for trades to execute?

**A:**
1. Strategy generates signal
2. Order submitted to Alpaca (< 1 second)
3. Order filled by market (seconds to minutes)
4. Confirmation received (< 1 second)

**Total time**: Usually < 1 minute for liquid stocks.

### Q: Can I manually close a position opened by automated trading?

**A:** Yes! Two ways:
1. **Portfolio page**: Click position → "Close Position"
2. **Stock detail page**: Click "Sell" → Enter quantity

Manual closes are fine and won't break the strategy.

### Q: What happens if I disable a strategy? Will open positions close?

**A:** No. Disabling a strategy:
- ✅ Stops opening new positions
- ✅ Stops generating new signals
- ❌ Does NOT close existing positions

You must manually close positions or wait for stop loss/take profit triggers.

---

## Factors & Technical Indicators

### Q: Which factors should I use?

**A:** For beginners, start with:
1. **RSI** (0.5 weight): Catches oversold/overbought
2. **MACD** (0.5 weight): Identifies momentum

As you gain experience, add:
3. **MA Crossover**: Confirms trend direction

**Avoid**: Using >3 factors at first (complexity without clear benefit).

### Q: What's the difference between RSI and MACD?

**A:**
**RSI (Relative Strength Index)**:
- **Type**: Mean reversion
- **Signal**: Oversold (< 30) = buy, Overbought (> 70) = sell
- **Best for**: Range-bound markets
- **Strength**: Catches extreme moves

**MACD (Moving Average Convergence Divergence)**:
- **Type**: Momentum
- **Signal**: MACD crosses above signal = buy, below = sell
- **Best for**: Trending markets
- **Strength**: Identifies trend changes early

**Use both**: They complement each other (one for trends, one for extremes).

### Q: Should I use default parameters or optimize them?

**A:** **Start with defaults**:
- RSI: 14 period, 30/70 thresholds
- MACD: 12/26/9
- MA Crossover: 50/200

**Why?**
- Industry-standard values
- Proven over decades
- Less risk of overfitting

**When to optimize**: After 3+ months of live trading, if underperforming.

### Q: What do factor weights mean?

**A:** Weights determine each factor's influence on the final signal:

**Example**:
```
RSI: 0.6 weight, score = +0.8 (buy signal)
MACD: 0.4 weight, score = -0.2 (weak sell signal)

Final score = (0.6 × 0.8) + (0.4 × -0.2) = 0.48 - 0.08 = 0.40
→ BUY signal (positive final score)
```

**Higher weight = more influence**. Weights must sum to 1.0.

---

## Performance & Analytics

### Q: How do I know if my strategy is working?

**A:** Check these metrics weekly:

✅ **Good signs**:
- Cumulative profit trend upward
- Win rate ≥ 50%
- Sharpe ratio ≥ 1.0
- Following backtest expectations
- Max drawdown < 20%

⚠️ **Warning signs**:
- 3+ consecutive losing weeks
- Win rate < 45%
- Actual returns < 50% of backtest returns
- Drawdown > 20%

### Q: My live results are worse than backtest. Why?

**A:** Common reasons:

1. **Overfitting**: Strategy optimized for historical data
   - *Fix*: Re-run backtest on different period

2. **Market regime change**: Current market different from backtest period
   - *Fix*: Adjust parameters or pause strategy

3. **Transaction costs**: Real costs higher than backtest assumption
   - *Fix*: Reduce trading frequency

4. **Execution slippage**: Actual fill prices worse than expected
   - *Fix*: Use limit orders or increase slippage assumption

5. **Insufficient time**: Need 3+ months to evaluate properly
   - *Fix*: Be patient, short-term randomness is normal

**Rule**: If live results are 70%+ of backtest after 3 months, strategy is working.

### Q: How often should I check my portfolio?

**A:**
- **Minimum**: Daily (5-minute check)
- **Recommended**: Daily + weekly review (15 min)
- **Deep dive**: Monthly (1-2 hours)

**Don't**: Check every hour. Over-monitoring leads to emotional decisions.

### Q: Should I compare my returns to S&P 500?

**A:** Yes! Benchmarking is important:

**If you're beating S&P 500**:
- Your strategy adds value ✅
- Continue current approach

**If you're underperforming S&P 500**:
- Question why you're taking active risk ⚠️
- Consider adjusting strategy or passive investing

**Realistic goal**: Beat S&P 500 by 2-5% annually after costs.

---

## Technical Issues

### Q: Real-time updates aren't working. What should I do?

**A:**
1. Check connection indicator (top right of navbar)
2. Refresh browser page (reconnects WebSocket)
3. Clear browser cache
4. Re-login to refresh authentication
5. Check browser console for errors (F12)

### Q: I got an error when running backtest. How do I fix it?

**A:** Common solutions:
1. **"Insufficient data"**: Shorten backtest period or check stock data
2. **"Invalid parameters"**: Verify factor settings (positive numbers, weights sum to 1.0)
3. **"Strategy not found"**: Refresh page and try again
4. **Database timeout**: Wait 1 minute and retry

If persistent, report issue on GitHub.

### Q: My trades aren't showing up. Where are they?

**A:** Check:
1. **Trades page**: All historical trades
2. **Portfolio detail page**: Trades for specific portfolio
3. **Filter settings**: May be filtering out your trades
4. **Date range**: Adjust to include recent dates

If still missing, check Alpaca dashboard directly to verify execution.

### Q: How do I export my data?

**A:** Currently manual export:
1. **Trade history**: View trades page, copy/paste to spreadsheet
2. **Portfolio performance**: Take screenshots of charts
3. **Backtest results**: Copy metrics from backtest detail page

*Note*: CSV export feature coming in future update.

---

## Account & Settings

### Q: Can I use Stock Picker with multiple broker accounts?

**A:** One Alpaca account per Stock Picker instance. To use multiple accounts:
- Deploy separate Stock Picker instances
- Each with different Alpaca API keys

*Note*: Multi-account support planned for future release.

### Q: How do I change my risk settings?

**A:**
1. Go to **Strategy detail page**
2. Click **"Edit Strategy"**
3. Adjust **Risk Management** section
4. Save changes

Changes apply to new positions only (existing positions unaffected).

### Q: Can I clone/copy a strategy?

**A:** Yes!
1. Go to **Strategy detail page**
2. Click **"Clone Strategy"** (if available)
3. Modify cloned strategy as needed

Useful for testing parameter variations without affecting original.

### Q: How do I delete a strategy?

**A:**
1. **First**: Disable automated trading
2. **Then**: Close all positions using that strategy
3. **Finally**: Strategy detail page → "Delete"

**Warning**: Deletion is permanent and cannot be undone!

---

## Best Practices

### Q: What's the #1 mistake beginners make?

**A:** **Overfitting strategies to historical data.**

Beginners often:
1. Backtest with many parameters
2. Find "perfect" settings (50%+ returns)
3. Deploy strategy
4. Get disappointed when live results are poor

**Better approach**:
- Use simple, standard parameters
- Accept "good enough" (15-20% returns)
- Validate on multiple time periods
- Expect live results to be 70-80% of backtest

### Q: How much capital should I start with?

**A:**
- **Paper trading**: Start with simulated $10,000
- **Real money**: Minimum $5,000 (allows proper diversification)
- **Comfortable amount**: $10,000 - $50,000

**Important**: Only invest capital you can afford to lose.

### Q: Should I run multiple strategies or focus on one?

**A:**
**Beginners**: One strategy
- Easier to understand
- Clearer performance attribution
- Simpler to debug

**Intermediate**: 2-3 strategies
- Diversification benefits
- Different market conditions
- Smooth out volatility

**Advanced**: 5+ strategies
- Maximum diversification
- Strategy rotation
- Complex portfolio management

### Q: How long before I should expect profits?

**A:** **Timeline expectations**:

- **Week 1-4**: Learning period, likely breakeven or small losses
- **Month 2-3**: Strategy stabilizes, seeing if approach works
- **Month 3-6**: Pattern emerges, evaluate profitability
- **Month 6-12**: Sufficient data to confirm strategy edge

**Be patient**: 3 months minimum before judging strategy success.

**Red flag**: If losing money after 6 months, strategy likely not working.

---

## Advanced Topics

### Q: Can I build custom factors?

**A:** Yes, if you're a developer:

1. Create new factor class in `packages/algorithm-engine/src/factors/`
2. Extend `BaseFactor` class
3. Implement `evaluate()` and `validateParams()` methods
4. Register in `FactorFactory`
5. Add tests
6. Rebuild and redeploy

See [CLAUDE.md](CLAUDE.md) for development guide.

### Q: How does factor weighting actually work internally?

**A:** The strategy:
1. Evaluates each factor for a stock
2. Each factor returns score (-1 to +1) and confidence (0 to 1)
3. Multiplies score by factor weight
4. Sums weighted scores
5. Applies threshold to determine signal:
   - Sum > 0.3 → BUY
   - Sum < -0.3 → SELL
   - Otherwise → HOLD

**Example**:
```
RSI: score = 0.8, weight = 0.6 → 0.48
MACD: score = 0.4, weight = 0.4 → 0.16
Total: 0.64 → BUY (> 0.3 threshold)
```

### Q: Can I use fundamental data (P/E ratios, earnings, etc.)?

**A:** Not currently. Stock Picker focuses on technical analysis.

**Workaround**: Manually filter stocks by fundamentals, then apply technical strategy.

**Future**: Fundamental factors may be added in later releases.

### Q: How can I test strategies on specific stocks only?

**A:** Currently, strategies evaluate all available stocks.

**Workaround**:
1. Create strategy
2. Run backtest
3. Review individual trades
4. Manually note which stocks performed well
5. Create focused portfolio

**Future**: Stock filtering feature planned.

---

## Support & Community

### Q: Where can I get help?

**A:**
1. **This FAQ**: Quick answers
2. **USER_GUIDE.md**: Comprehensive documentation
3. **BEST_PRACTICES.md**: Strategy optimization
4. **GitHub Issues**: Bug reports and feature requests
5. **GitHub Discussions**: Community Q&A

### Q: I found a bug. How do I report it?

**A:**
1. Go to GitHub repository
2. Click "Issues" tab
3. Click "New Issue"
4. Describe bug with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - Browser/OS info

### Q: Can I request new features?

**A:** Yes!
1. Check existing GitHub issues first
2. If not already requested, create new issue
3. Tag as "Feature Request"
4. Describe use case and benefit

### Q: Is there a community forum or Discord?

**A:** Check the GitHub repository for links to:
- Discussions (Q&A, ideas, general chat)
- Community channels (if available)

---

## Miscellaneous

### Q: What happens if the market crashes?

**A:**
- Strategies will generate SELL signals
- Stop losses will trigger (limiting losses)
- Positions will close automatically
- Cash reserves preserved

**Your action**: Monitor drawdown, consider pausing strategies if volatility extreme.

### Q: Can I backtest on crypto or forex?

**A:** No, Stock Picker currently supports US stocks only.

**Data provider**: Alpha Vantage (stocks only)
**Broker**: Alpaca (stocks only)

### Q: Does Stock Picker work internationally?

**A:**
- ✅ Platform accessible worldwide
- ✅ Trades US stocks (NYSE, NASDAQ)
- ⚠️ Need US broker account (Alpaca supports international)
- ⚠️ Check local regulations regarding US stock trading

### Q: What's the cost to use Stock Picker?

**A:**
- **Platform**: Open source, free to use
- **Alpaca broker**: $0 commission stock trades (paper & live)
- **Alpha Vantage**: Free tier available (500 API calls/day)
- **AWS costs** (if self-hosting): ~$50-100/month depending on usage

### Q: Can I use this for day trading?

**A:** Not recommended:
- Stock Picker designed for swing/position trading
- Evaluates every 15 minutes (too slow for day trading)
- Factors use daily data (not intraday)

**Better use cases**: Swing trading (days-weeks) or position trading (weeks-months).

---

## Quick Links

- **[Quick Start Guide](QUICK_START.md)**: Get started in 10 minutes
- **[User Guide](USER_GUIDE.md)**: Complete documentation
- **[Best Practices](BEST_PRACTICES.md)**: Optimize your strategies
- **[Development Guide](CLAUDE.md)**: For developers
- **[Main README](README.md)**: Project overview

---

**Still have questions?** Check the full [User Guide](USER_GUIDE.md) or ask on GitHub Discussions.

Last updated: March 2026
