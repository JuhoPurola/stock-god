# Stock Picker - Best Practices Guide

A comprehensive guide to using Stock Picker effectively and avoiding common pitfalls.

## Table of Contents

1. [Strategy Design Principles](#strategy-design-principles)
2. [Backtesting Best Practices](#backtesting-best-practices)
3. [Risk Management](#risk-management)
4. [Portfolio Optimization](#portfolio-optimization)
5. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
6. [Performance Monitoring](#performance-monitoring)
7. [Advanced Techniques](#advanced-techniques)

---

## Strategy Design Principles

### Start Simple, Add Complexity Gradually

**❌ Wrong Approach:**
```
First Strategy:
- 5 different factors
- Complex weighting scheme
- Aggressive parameters
- No testing
```

**✅ Right Approach:**
```
First Strategy:
- 1-2 proven factors (RSI + MA Crossover)
- Equal or simple weights (0.5 each)
- Conservative parameters (standard values)
- Thorough backtesting
```

**Why it matters:**
- Simple strategies are easier to understand and debug
- Fewer factors reduce overfitting risk
- Performance attribution is clearer
- Easier to identify what works and what doesn't

---

### Use Complementary Factors

**❌ Bad Combination:**
```
All momentum indicators:
- MACD (momentum)
- RSI (momentum-based)
- Rate of Change (momentum)

Problem: Redundant signals, no diversification
```

**✅ Good Combination:**
```
Mix of different signal types:
- MA Crossover (trend)
- RSI (mean reversion)
- MACD (momentum)

Benefit: Diversified signals, captures different market conditions
```

**Factor Categories:**

1. **Trend Indicators**: MA Crossover, ADX
2. **Momentum Indicators**: MACD, Momentum
3. **Mean Reversion**: RSI, Bollinger Bands
4. **Volatility**: ATR, Bollinger Band Width

**Best Practice**: Combine 2-3 factors from different categories.

---

### Choose Appropriate Timeframes

Match your factors to your trading style:

**Day Trading (Not Recommended for Beginners)**
- RSI Period: 5-10
- MA Periods: 5/10, 10/20
- Position Hold Time: Hours to 1 day

**Swing Trading (Recommended)**
- RSI Period: 10-14
- MA Periods: 20/50, 50/100
- Position Hold Time: Days to weeks

**Position Trading (Conservative)**
- RSI Period: 14-20
- MA Periods: 50/200, 100/300
- Position Hold Time: Weeks to months

**Rule of Thumb**: Longer timeframes = fewer trades but more stable signals.

---

### Factor Weight Distribution

**Equal Weighting (Simple & Effective)**
```
2 factors: 0.5 / 0.5
3 factors: 0.33 / 0.33 / 0.34
```
**Pros**: No bias, easy to understand
**Cons**: Doesn't prioritize best factors

**Performance-Based Weighting (Advanced)**
```
After backtesting individual factors:
- Best factor: 0.5
- Second best: 0.3
- Third best: 0.2
```
**Pros**: Leverages proven performance
**Cons**: Risk of overfitting to historical data

**Recommendation**: Start with equal weighting, adjust after 3+ months of live results.

---

## Backtesting Best Practices

### Data Quality First

**Before Every Backtest:**

✅ Check data completeness:
- Go to **Stock Data Dashboard**
- Verify price data exists for all stocks
- Ensure no large gaps in historical data
- Confirm data covers your backtest period

✅ Validate data accuracy:
- Check for price anomalies (spikes, zeros)
- Verify volume data is present
- Ensure adjusted prices (account for splits)

**Red Flags:**
- Backtest with < 30 trades (insufficient data)
- Large gaps in equity curve (missing data periods)
- Unrealistic returns (> 100% annually)

---

### Minimum Backtest Standards

**Time Period:**
- Minimum: 6 months
- Recommended: 1-2 years
- Ideal: 3+ years (includes different market conditions)

**Trade Count:**
- Minimum: 30 trades
- Recommended: 50+ trades
- Ideal: 100+ trades

**Why?** Statistical significance improves with more data points.

---

### Out-of-Sample Testing

**❌ Bad Practice:**
```
1. Backtest on 2023-2024 data
2. Optimize parameters for best 2023-2024 results
3. Deploy strategy
4. Poor performance (overfit to past)
```

**✅ Best Practice:**
```
1. Split data: Train (2022-2023), Test (2024)
2. Optimize on train data only
3. Validate on test data (unseen)
4. If test results good → deploy
5. If test results poor → revisit strategy
```

**Implementation:**
- Run backtest #1: Jan 2022 - Dec 2023 → optimize
- Run backtest #2: Jan 2024 - Dec 2024 → validate
- Compare results. Both should be positive.

---

### Walk-Forward Analysis

**Most Robust Approach:**

```
Step 1: Backtest Jan-Jun 2023, optimize
Step 2: Run Jul-Sep 2023 with those parameters
Step 3: Backtest Jan-Sep 2023, re-optimize
Step 4: Run Oct-Dec 2023 with new parameters
Step 5: Continue rolling window
```

**Benefits:**
- Adapts to changing market conditions
- Reduces overfitting
- More realistic performance estimate

**Stock Picker Pro Tip:**
Run quarterly backtests and adjust parameters if needed.

---

### Interpreting Backtest Metrics

**Key Metrics Explained:**

**Total Return**
- Raw profit/loss percentage
- Good: > 10% annually
- Great: > 20% annually
- Suspicious: > 50% annually (check for errors)

**Sharpe Ratio**
- Risk-adjusted return (return per unit of volatility)
- Good: > 1.0
- Great: > 1.5
- Excellent: > 2.0
- **Most important metric for comparing strategies**

**Max Drawdown**
- Largest peak-to-trough decline
- Conservative: < 10%
- Moderate: 10-20%
- Aggressive: > 20%
- **Key for understanding psychological impact**

**Win Rate**
- Percentage of profitable trades
- Acceptable: > 45%
- Good: > 50%
- Great: > 60%
- Note: High win rate doesn't always mean profitability

**Profit Factor**
- Gross profits / Gross losses
- Minimum: > 1.0 (profitable)
- Good: > 1.5
- Excellent: > 2.0

**What to Prioritize:**
1. Sharpe Ratio (risk-adjusted return)
2. Max Drawdown (risk management)
3. Total Return (absolute performance)
4. Win Rate & Profit Factor (consistency)

---

## Risk Management

### Position Sizing Rules

**Fixed Percentage (Recommended for Beginners)**
```
Conservative: 5% per position = 20 positions max
Moderate: 10% per position = 10 positions max
Aggressive: 15% per position = 6-7 positions max
```

**Kelly Criterion (Advanced)**
```
Formula: f = (bp - q) / b
where:
- f = fraction of portfolio to bet
- b = odds received (avg win / avg loss)
- p = probability of winning (win rate)
- q = probability of losing (1 - p)

Example with 55% win rate and 2:1 reward:risk:
f = (2 * 0.55 - 0.45) / 2 = 0.325
→ Use 32.5% of Kelly = ~10% position size
```

**Best Practice**: Use 25-50% of Kelly result to avoid overbetting.

---

### Stop Loss Strategy

**Fixed Percentage Stop (Simple & Effective)**
```
Conservative: 3% stop loss
Moderate: 5% stop loss
Aggressive: 7% stop loss
```

**ATR-Based Stop (Volatility-Adjusted)**
```
Stop = Entry Price - (2 × ATR)

Benefits:
- Adapts to stock volatility
- Tighter stops for calm stocks
- Wider stops for volatile stocks
```

**Trailing Stop (Lock in Profits)**
```
Initial stop: 5% below entry
As position profits, move stop up:
- Price up 5% → stop moves to breakeven
- Price up 10% → stop locks in 5% profit
- Price up 20% → stop locks in 15% profit
```

**Stock Picker Configuration:**
Set stop loss in strategy's risk management settings. Platform automatically monitors and executes stops.

---

### Portfolio-Level Risk Controls

**Maximum Simultaneous Positions**
```
Small Portfolio ($10k-$50k): 5-8 positions
Medium Portfolio ($50k-$200k): 8-12 positions
Large Portfolio (> $200k): 10-15 positions
```

**Why limit positions?**
- Over-diversification dilutes returns
- Harder to monitor many positions
- Transaction costs increase

**Sector Concentration**
```
Rule: No more than 30% in one sector

Example:
Tech: 25%
Healthcare: 20%
Finance: 20%
Consumer: 20%
Industrial: 15%
```

**Cash Reserve**
```
Minimum: 10% cash
Recommended: 20% cash
Conservative: 30% cash
```

**Purpose**: Capital for new opportunities, buffer for volatility.

---

### Circuit Breakers

Implement automatic strategy shutdowns:

**Daily Loss Limit**
```
If portfolio down > 3% in one day:
- Pause all strategies
- Close 50% of positions
- Review before resuming
```

**Consecutive Losing Days**
```
If portfolio down 3+ days in a row:
- Reduce position sizes by 50%
- Only take highest-conviction signals
- Re-evaluate strategy
```

**Drawdown Threshold**
```
If portfolio down > 15% from peak:
- Stop opening new positions
- Only manage existing positions
- Analyze what went wrong
```

**Stock Picker Setup:**
Configure alerts on **Alerts** page to notify you when thresholds are breached. Manual intervention required.

---

## Portfolio Optimization

### Diversification Strategies

**By Strategy**
```
Conservative Setup:
- Portfolio 1: Long-term trend following (50% capital)
- Portfolio 2: Mean reversion (30% capital)
- Portfolio 3: Momentum (20% capital)

Benefits: Different strategies perform in different markets
```

**By Timeframe**
```
Multi-Timeframe Setup:
- Portfolio 1: Short-term (20/50 MA, 10-day RSI)
- Portfolio 2: Medium-term (50/100 MA, 14-day RSI)
- Portfolio 3: Long-term (50/200 MA, 20-day RSI)

Benefits: Captures opportunities across timeframes
```

**By Asset Class**
```
Diversified Setup:
- Portfolio 1: Large-cap tech (AAPL, MSFT, GOOGL)
- Portfolio 2: Mid-cap growth
- Portfolio 3: Small-cap value

Benefits: Reduces correlation, smoother returns
```

---

### Rebalancing Frequency

**Portfolio Rebalancing:**

```
Weekly (Active Management):
- Review all positions
- Close underperformers (down > 15%)
- Rebalance to target allocation
Pros: Stay aligned with strategy
Cons: Higher transaction costs

Monthly (Recommended):
- Review portfolio drift
- Rebalance if allocation > 5% off target
- Adjust strategy parameters if needed
Pros: Balance between control and costs
Cons: May miss short-term opportunities

Quarterly (Passive Management):
- Major portfolio review
- Re-run backtests with new data
- Update strategies based on performance
Pros: Low cost, minimal time
Cons: Slow to adapt
```

**Best Practice**: Start with monthly, adjust based on strategy performance.

---

### Strategy Rotation

**When to Rotate Strategies:**

```
Scenario 1: Bear Market
- Pause momentum strategies (underperform in downtrends)
- Activate mean reversion (profits from oversold bounces)
- Reduce position sizes across the board

Scenario 2: Bull Market
- Increase momentum strategies
- Reduce mean reversion exposure
- Larger position sizes

Scenario 3: Sideways Market
- Favor range-bound strategies
- Shorter-term factors
- Tighter stops
```

**Implementation:**
- Monitor market conditions monthly
- Gradually shift allocations (don't go all-in)
- Keep core strategy always active

---

## Common Mistakes to Avoid

### 1. Overfitting (The Biggest Trap)

**❌ Classic Overfitting:**
```
"I backtested 100 parameter combinations and found the perfect one:
RSI period: 13.7
MACD fast: 11.3
Stop loss: 4.87%
→ 47% annual return in backtest!"
```

**Why It's Wrong:**
- Optimized to random noise, not real patterns
- Won't work on unseen data
- Performance degrades immediately in live trading

**✅ Avoiding Overfitting:**
```
Use standard parameter values:
RSI period: 14 (industry standard)
MACD: 12/26/9 (standard)
Stop loss: 5% (round number)

If optimizing, use buckets:
RSI period: 10, 14, or 20 (not 13.7)
Stop loss: 3%, 5%, or 7% (not 4.87%)
```

**Rules:**
- Fewer parameters > more parameters
- Round numbers > precise decimals
- Standard values > exotic optimizations
- Out-of-sample validation > in-sample perfection

---

### 2. Insufficient Testing

**❌ Common Mistakes:**
- Backtest only bull markets (2023-2024)
- Run single backtest and deploy
- Test on < 6 months of data
- Optimize until finding "perfect" parameters

**✅ Proper Testing:**
- Test across bull, bear, and sideways markets
- Minimum 1 year, ideally 2-3 years
- Run multiple backtests with slight variations
- Accept "good enough" rather than perfect

**Checklist Before Going Live:**
- [ ] Backtest ≥ 1 year
- [ ] ≥ 30 trades in backtest
- [ ] Sharpe ratio > 1.0
- [ ] Max drawdown < 20%
- [ ] Out-of-sample validation performed
- [ ] Results align with expectations (not too good)

---

### 3. Ignoring Transaction Costs

**❌ Mistake:**
```
Backtest shows:
- 200 trades per year
- 25% annual return
- Ignored: $1 commission per trade = $200
- Ignored: 0.1% slippage per trade = $50
- Real return: 22.5% (not 25%)
```

**✅ Best Practice:**
```
Always configure backtest with:
- Commission: $1-$2 per trade (realistic)
- Slippage: 0.05-0.1% (market orders)
- Higher values for large positions or illiquid stocks
```

**Impact by Strategy Type:**
- High-frequency (many trades): Big impact
- Low-frequency (few trades): Small impact

---

### 4. Chasing Performance

**❌ Common Behavior:**
```
Week 1: Strategy A returns +2% (good!)
Week 2: Strategy B returns +5% (amazing!)
Action: Switch all capital to Strategy B
Week 3: Strategy B returns -3% (oops)
Week 4: Back to Strategy A...
```

**✅ Disciplined Approach:**
```
Month 1: Strategy A returns +2%
Month 2: Strategy A returns -1%
Month 3: Strategy A returns +3%
Action: Stay the course (net +4% over 3 months)

Review quarterly:
If Strategy A consistently underperforms → adjust
If Strategy A has normal volatility → maintain
```

**Rule**: Don't change strategies based on < 3 months of performance.

---

### 5. Over-Leveraging

**❌ Risky Setup:**
```
Portfolio: $10,000
Position size: 20% ($2,000 per position)
Max positions: 10
Total exposure: $20,000 (200% of capital!)
```

**Why Dangerous:**
- One bad day can wipe out account
- Margin calls in live trading
- No cash for opportunities

**✅ Safe Setup:**
```
Portfolio: $10,000
Position size: 10% ($1,000 per position)
Max positions: 8
Cash reserve: 20% ($2,000)
Total exposure: $8,000 (80% of capital)
```

**Rule**: Total exposure should not exceed 90% of portfolio value.

---

### 6. Emotional Overrides

**❌ Emotional Trading:**
```
Strategy generates SELL signal for AAPL
You think: "But Apple is a great company!"
Action: Override strategy, hold position
Result: Stock drops 10%, strategy was right
```

**✅ Trust Your Strategy:**
```
Strategy generates SELL signal
You think: "I backtested this, I trust the system"
Action: Follow signal, sell position
Result: Win some, lose some, but overall profitable
```

**When to Override (Rarely):**
- Major news event (company bankruptcy announcement)
- Technical error (obvious data glitch)
- Regulatory issue (trading halt)

**When NOT to Override:**
- "Feeling" that signal is wrong
- Recent strategy loss (revenge trading)
- Fear of missing out (FOMO)
- News that's already priced in

---

## Performance Monitoring

### Daily Monitoring (5 minutes)

**Dashboard Quick Check:**
- [ ] Overall P&L (up or down?)
- [ ] New positions opened today
- [ ] Positions closed today
- [ ] Any alerts triggered

**Red Flags:**
- Daily loss > 2% (investigate causes)
- Multiple stops hit (market volatility?)
- No new positions in 3+ days (strategy generating signals?)

**Action Items:**
- Log any unusual activity
- Review stopped positions for patterns
- Check news for holdings

---

### Weekly Review (15-30 minutes)

**Performance Analysis:**

1. **Portfolio Returns**
   - Weekly P&L vs. expectation
   - Comparison to benchmark (S&P 500)
   - Best and worst performers

2. **Strategy Health**
   - Win rate this week
   - Average win vs. average loss
   - Number of signals generated

3. **Risk Check**
   - Current drawdown from peak
   - Position concentration
   - Sector allocation

4. **Trade Review**
   - Review 2-3 biggest winners (why?)
   - Review 2-3 biggest losers (why?)
   - Any patterns or lessons?

**Documentation:**
Keep a trading journal:
```
Week of Jan 15-19, 2024
- Portfolio: +2.3%
- S&P 500: +1.1% (outperformed)
- Best trade: AAPL +$150 (momentum)
- Worst trade: TSLA -$80 (stopped out)
- Observation: Tech sector strong
- Action: None (strategy working)
```

---

### Monthly Deep Dive (1-2 hours)

**Comprehensive Review:**

1. **Run Fresh Backtests**
   - Backtest current strategy with latest data
   - Compare to previous month's backtest
   - Are live results matching backtest?

2. **Strategy Performance**
   - Month returns vs. expectation
   - Sharpe ratio trend
   - Drawdown analysis
   - Win rate and profit factor

3. **Position Analysis**
   - Average hold time
   - Position size distribution
   - Stop loss hit rate
   - Take profit hit rate

4. **Factor Performance**
   - Which factors generating best signals?
   - Any factors consistently wrong?
   - Should factor weights be adjusted?

5. **Risk Assessment**
   - Current vs. maximum drawdown
   - Portfolio volatility
   - Correlation between positions

**Decision Points:**

✅ **Keep Strategy As-Is If:**
- Returns within expected range
- Sharpe ratio > 1.0
- Drawdown < 15%
- Win rate > 50%

🔧 **Adjust Parameters If:**
- Underperforming backtest by > 5%
- Win rate < 45%
- Too many stopped positions
- Market conditions changed

🛑 **Pause Strategy If:**
- Consecutive monthly losses (3+)
- Drawdown > 20%
- Win rate < 40%
- Major market regime change

---

## Advanced Techniques

### Factor Performance Attribution

**Goal**: Understand which factors drive performance.

**Method**:
1. Run backtest with all factors
2. Run backtest with Factor A only
3. Run backtest with Factor B only
4. Run backtest with Factor C only
5. Compare results

**Example Results:**
```
Full Strategy (RSI + MACD + MA): 18% return
RSI only: 12% return
MACD only: 15% return
MA only: 8% return

Conclusion:
- MACD is strongest factor (weight ↑)
- MA is weakest factor (weight ↓ or remove)
- Adjust weights: MACD 0.5, RSI 0.4, MA 0.1
```

---

### Correlation Analysis

**Goal**: Build portfolio with uncorrelated strategies.

**Implementation**:

1. Run Strategy A for 3 months → collect daily returns
2. Run Strategy B for 3 months → collect daily returns
3. Calculate correlation

**Correlation Interpretation:**
- 1.0: Perfect positive correlation (avoid)
- 0.5-0.8: High correlation (okay for similar styles)
- 0.0-0.5: Low correlation (ideal for diversification)
- < 0.0: Negative correlation (excellent for hedging)

**Best Portfolio Setup:**
- 3 strategies with correlations < 0.5
- Combines different approaches (trend + mean reversion + momentum)

---

### Dynamic Position Sizing

**Goal**: Scale position size based on confidence.

**Method**:

```
Base position size: 10%

Confidence adjustments:
- All 3 factors agree: 10% × 1.5 = 15%
- 2 factors agree: 10% × 1.0 = 10%
- Split signals: 10% × 0.5 = 5%
```

**Implementation** (manual for now):
- Monitor signal strength in Live Signals page
- Adjust positions manually based on conviction
- Track results to validate approach

---

### Regime Detection

**Goal**: Identify market conditions and adapt strategy.

**Market Regimes:**

1. **Bull Market**
   - S&P 500 above 200-day MA
   - New highs frequent
   - Strategy: Momentum, larger positions

2. **Bear Market**
   - S&P 500 below 200-day MA
   - New lows frequent
   - Strategy: Defensive, smaller positions, tight stops

3. **Sideways Market**
   - S&P 500 oscillating around 200-day MA
   - No clear trend
   - Strategy: Mean reversion, neutral sizing

**Implementation**:
- Track S&P 500 vs 200-day MA monthly
- Adjust strategy parameters quarterly based on regime
- Document regime changes in trading journal

---

## Conclusion

### Key Takeaways

1. **Start Simple**: Begin with basic strategies, add complexity slowly
2. **Test Thoroughly**: Backtest extensively before going live
3. **Manage Risk**: Always use stop losses and position sizing
4. **Stay Disciplined**: Trust your system, avoid emotional overrides
5. **Monitor Actively**: Regular review and adjustment
6. **Document Everything**: Keep trading journal for continuous improvement

### Continuous Improvement Cycle

```
1. Design Strategy → 2. Backtest → 3. Deploy → 4. Monitor
                            ↑                       ↓
                        7. Improve ← 6. Analyze ← 5. Review
```

**Never stop learning and adapting.**

---

## Quick Reference Checklist

### Before Deploying Strategy
- [ ] Backtested ≥ 1 year
- [ ] Sharpe ratio > 1.0
- [ ] ≥ 30 trades in backtest
- [ ] Max drawdown < 20%
- [ ] Out-of-sample validation done
- [ ] Transaction costs included
- [ ] Risk parameters set (stop loss, position size)
- [ ] Alerts configured

### Daily Routine
- [ ] Check dashboard P&L
- [ ] Review new positions
- [ ] Check for alerts
- [ ] Monitor drawdown

### Weekly Routine
- [ ] Review performance metrics
- [ ] Analyze best/worst trades
- [ ] Check strategy health
- [ ] Update trading journal

### Monthly Routine
- [ ] Run fresh backtests
- [ ] Deep performance review
- [ ] Adjust parameters if needed
- [ ] Rebalance portfolios
- [ ] Document lessons learned

---

**Remember**: Consistent, disciplined execution beats perfect strategy optimization every time.

Good luck and trade smart! 📈
