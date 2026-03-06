# Stock Picker - Video Tutorial Scripts

Ready-to-use scripts for creating video tutorials and walkthroughs.

## Table of Contents

1. [Getting Started (5 min)](#video-1-getting-started)
2. [Building Your First Strategy (8 min)](#video-2-building-your-first-strategy)
3. [Understanding Backtesting (10 min)](#video-3-understanding-backtesting)
4. [Risk Management Essentials (7 min)](#video-4-risk-management-essentials)
5. [Advanced Strategy Optimization (12 min)](#video-5-advanced-strategy-optimization)
6. [Live Trading & Monitoring (8 min)](#video-6-live-trading--monitoring)

---

## Video 1: Getting Started
**Duration**: 5 minutes
**Target Audience**: Complete beginners

### Script

**[0:00 - 0:30] Introduction**

Hi! Welcome to Stock Picker, a powerful algorithmic trading platform that lets you build, test, and deploy automated trading strategies.

In this 5-minute video, I'll show you how to:
- Navigate the platform
- Create your first portfolio
- Understand the dashboard
- Get ready to build strategies

Let's dive in!

**[0:30 - 1:00] Dashboard Tour**

When you first log in, you'll see the Dashboard. This is your mission control.

At the top, you'll see your total portfolio value, today's profit and loss, and overall return percentage.

Below that, you can see:
- Your active positions (stocks you currently own)
- Recent trades (buy and sell executions)
- Performance charts showing portfolio value over time

On the left sidebar, you have navigation to all major sections. Let's explore them.

**[1:00 - 2:00] Navigation Overview**

Click through these quickly:

**Portfolios**: Where you manage your capital and see all positions
*[Show portfolios page]*

**Strategies**: Your trading algorithms - the brains of the operation
*[Show strategies page]*

**Backtests**: Test strategies on historical data before going live
*[Show backtests page]*

**Stocks**: Research and analyze individual stocks
*[Show stocks page]*

**Trades**: Complete history of all executed trades
*[Show trades page]*

**Alerts**: Notifications about important events
*[Show alerts page]*

**[2:00 - 3:30] Creating Your First Portfolio**

Let's create your first portfolio. Click **"Portfolios"** in the sidebar, then **"Create Portfolio"**.

*[Click through interface]*

Give it a name - I'll call mine "My First Portfolio".

Set initial cash - let's start with $10,000 for paper trading.

Add a description if you want - something like "Learning algorithmic trading".

Click **"Create"**.

*[Show created portfolio]*

Great! You now have a portfolio. This is where your trades will happen and your positions will be held.

Click on the portfolio name to see details. Right now it's empty - just $10,000 in cash and no positions.

**[3:30 - 4:30] Quick Tips**

Before we end, here are three quick tips:

**Tip 1**: Press **Cmd+K** (or Ctrl+K on Windows) to open the Command Palette for instant navigation. Try it!
*[Demo command palette]*

**Tip 2**: The connection indicator in the top right shows real-time update status. Green means live data.
*[Point to indicator]*

**Tip 3**: Check out the Alerts page to configure notifications for trades, signals, and price movements.

**[4:30 - 5:00] Next Steps**

You're all set up! In the next video, we'll build your first trading strategy using technical indicators.

Here's what you'll learn:
- Understanding RSI and MACD factors
- Setting up factor weights
- Configuring risk management
- Running your first backtest

See you in the next video, and happy trading!

*[End screen with links to next video and documentation]*

---

## Video 2: Building Your First Strategy
**Duration**: 8 minutes
**Target Audience**: Users who completed Video 1

### Script

**[0:00 - 0:45] Introduction**

Welcome back! In this video, we're going to build your first trading strategy.

By the end of this video, you'll have created a momentum-based strategy using two proven technical indicators: RSI and MACD.

Here's what we'll cover:
- Understanding factors (what they are and how they work)
- Configuring RSI and MACD
- Setting factor weights
- Configuring risk management (stop loss, position sizing)
- Saving your strategy

Let's build something awesome!

**[0:45 - 2:00] What Are Factors?**

Before we start, let's understand factors.

**Factors** are technical indicators that analyze stock prices to generate buy and sell signals.

*[Show diagram or animation]*

Think of factors as different experts looking at the same stock:
- One expert (RSI) says "this stock is oversold, time to buy!"
- Another expert (MACD) says "momentum is building, I agree!"
- Your strategy combines their opinions to make final decisions

We'll use two factors today:

**RSI (Relative Strength Index)**:
- Measures if stock is oversold (too cheap) or overbought (too expensive)
- RSI below 30 = oversold = potential buy signal
- RSI above 70 = overbought = potential sell signal

**MACD (Moving Average Convergence Divergence)**:
- Tracks momentum and trend direction
- When MACD crosses above signal line = buy signal
- When MACD crosses below signal line = sell signal

Together, they create a powerful momentum strategy.

**[2:00 - 3:30] Creating the Strategy**

Let's build it! Click **"Strategies"** in the sidebar, then **"Create Strategy"**.

*[Navigate to create strategy page]*

**Step 1**: Basic configuration

Name: "Simple Momentum Strategy"
Portfolio: Select the portfolio we created (My First Portfolio)
Description: "RSI + MACD momentum strategy for learning"

**Step 2**: Add RSI Factor

Click **"Add Factor"**

*[Click button]*

Select factor type: **RSI**

Configure parameters:
- Period: 14 (standard)
- Oversold threshold: 30
- Overbought threshold: 70
- Weight: 0.5 (equal importance with MACD)

*[Enter values]*

**Step 3**: Add MACD Factor

Click **"Add Factor"** again

Select factor type: **MACD**

Configure parameters:
- Fast period: 12
- Slow period: 26
- Signal period: 9
- Weight: 0.5

*[Enter values]*

Notice the weights sum to 1.0 (0.5 + 0.5). This is required - weights must always total 1.0.

**[3:30 - 5:00] Understanding Factor Weights**

Quick explanation of weights:

The weight determines how much influence each factor has on the final decision.

*[Show visual]*

With equal weights (0.5 / 0.5):
- If RSI says "buy" with score 0.8
- And MACD says "hold" with score 0.0
- Final score = (0.5 × 0.8) + (0.5 × 0.0) = 0.4
- Result: BUY signal

If we changed weights to 0.7 RSI / 0.3 MACD:
- RSI would have more influence
- MACD's opinion matters less

For now, keep them equal. You can experiment with weights later after backtesting.

**[5:00 - 6:30] Risk Management Configuration**

Scroll down to **Risk Management** section. This is crucial!

**Stop Loss**: 5%
- If a position drops 5% from entry, automatically sell
- Protects you from large losses

**Take Profit**: 15% (optional)
- Lock in profits when position gains 15%
- Not required, but can secure wins

**Position Size**: 10%
- Invest 10% of portfolio in each trade
- With $10,000 portfolio, each position is $1,000

**Max Positions**: 8
- Hold maximum 8 stocks simultaneously
- Ensures diversification
- Leaves 20% cash reserve

**Max Portfolio Risk**: 80%
- Maximum 80% of portfolio can be invested at once
- Always keep some cash available

*[Enter all values]*

These are conservative settings perfect for learning.

**[6:30 - 7:30] Saving and What's Next**

Review your configuration:
- Two factors (RSI + MACD) with equal weights ✓
- Risk management configured ✓
- Portfolio selected ✓

Click **"Save Strategy"**!

*[Click save]*

Congratulations! You've created your first trading strategy!

*[Show strategy detail page]*

But don't activate it yet! In the next video, we'll backtest this strategy on historical data to see how it would have performed.

**[7:30 - 8:00] Closing**

Great job! You now understand:
- What factors are and how they work
- How to configure RSI and MACD
- How factor weights combine signals
- Essential risk management settings

Next up: **Backtesting** - we'll test this strategy on 1 year of historical data before risking any capital.

See you in the next video!

*[End screen]*

---

## Video 3: Understanding Backtesting
**Duration**: 10 minutes
**Target Audience**: Users who completed Video 2

### Script

**[0:00 - 0:45] Introduction**

Welcome back! You've built a strategy, now let's test it!

Backtesting is the process of simulating your strategy on historical data to see how it would have performed.

Think of it as a time machine for trading - you can see if your strategy would have made money last year without risking real capital.

In this video, we'll:
- Run our first backtest
- Understand key performance metrics
- Interpret results
- Decide if strategy is ready for live trading

Let's test our strategy!

**[0:45 - 1:45] Why Backtest?**

*[Show examples of good vs bad strategies]*

Backtesting helps you:

**1. Validate Strategy**
- Does it actually make money?
- Or does it lose money?

**2. Understand Risk**
- What's the maximum drawdown?
- How much could you lose?

**3. Set Expectations**
- Average return per year
- How often it trades
- Win rate

**4. Avoid Disasters**
- Find flaws before going live
- Prevent real losses

**Rule #1**: Never deploy a strategy without backtesting!

**[1:45 - 3:30] Running a Backtest**

Let's run our backtest! Go to **"Backtests"** page, click **"New Backtest"**.

*[Navigate and click]*

**Configuration:**

**Strategy**: Select "Simple Momentum Strategy" (the one we just built)

**Time Period**:
- Start Date: 1 year ago (I'll select January 1, 2023)
- End Date: Today (December 31, 2023)

One year is a good minimum for testing.

**Initial Capital**: $10,000
- Match our portfolio size

**Commission**: $1.00 per trade
- Realistic for most brokers (even though Alpaca is $0)
- Better to be conservative

**Slippage**: 0.1%
- Price difference between signal and execution
- Accounts for real-world market conditions

*[Enter all values]*

Double-check everything, then click **"Run Backtest"**.

*[Click]*

The backtest is now running! This might take 30-60 seconds as it simulates a full year of trading.

*[Show loading state]*

**[3:30 - 5:30] Understanding Results**

The backtest is complete! Let's analyze the results.

*[Show results dashboard]*

**Top Metrics Overview:**

**Total Return**: +18.5%
- Our strategy made 18.5% profit over the year
- This is good! S&P 500 averages ~10% annually

**Sharpe Ratio**: 1.35
- Risk-adjusted return
- Above 1.0 is good, above 1.5 is great
- Our 1.35 is solid

**Max Drawdown**: -12.3%
- Worst peak-to-trough decline
- At one point, portfolio was down 12.3% from its peak
- Under 20% is acceptable

**Win Rate**: 58%
- 58% of trades were profitable
- Above 50% is good

**Profit Factor**: 1.85
- Gross profits divided by gross losses
- Above 1.5 is healthy
- Our 1.85 is excellent

**Number of Trades**: 42
- Enough for statistical validity (>30)
- Not too many (low transaction costs)

**[5:30 - 7:00] Equity Curve Analysis**

Scroll down to see the **Equity Curve** chart.

*[Show equity curve]*

This shows portfolio value over time.

**What we're looking for:**

✓ **Upward trend**: Yes! Overall growth
✓ **Smoothness**: Pretty steady, no huge spikes
✓ **Drawdown recovery**: Bounces back after losses
⚠️ **Volatility**: Some ups and downs (expected)

**The drawdown section** shows where we lost money:
*[Point to drawdown areas]*

- Biggest drawdown was -12.3% in March
- But portfolio recovered within 2 months
- This is normal and acceptable

**[7:00 - 8:00] Trade Analysis**

Scroll further to see **Individual Trades**.

*[Show trade list]*

This table shows every trade the strategy made:
- Entry date and price
- Exit date and price
- Profit/loss
- Return percentage
- Signal that triggered it

**Let's look at a few:**

**Best trade**: AAPL, bought at $150, sold at $178, +18.7% profit
- RSI showed oversold, MACD confirmed momentum
- Held for 3 weeks, hit take profit

**Worst trade**: TSLA, bought at $240, sold at $228, -5% loss
- Hit stop loss quickly
- This is why stop losses are important!

**Average trade**: Held for 12 days, 2.3% return
- Typical performance

**[8:00 - 9:00] Decision Time**

Based on these results, should we deploy this strategy?

**✓ Yes, this strategy looks good:**

1. Positive returns (18.5%)
2. Good Sharpe ratio (1.35)
3. Acceptable drawdown (12.3%)
4. Healthy win rate (58%)
5. Sufficient trades (42)

**Things to watch:**
- Monitor live performance closely
- Expect some variation from backtest (70-80% of results)
- Be prepared for drawdowns

**If results were poor** (negative returns, Sharpe < 0.5, drawdown > 30%):
- Don't deploy!
- Adjust parameters
- Run new backtest
- Repeat until satisfied

**[9:00 - 10:00] Closing**

Excellent work! You've now:
- Run your first backtest
- Analyzed performance metrics
- Interpreted the equity curve
- Reviewed individual trades
- Made an informed go/no-go decision

In the next video, we'll **activate this strategy** for live paper trading and learn how to monitor it.

Before you go, here are two bonus tips:

**Tip 1**: Run backtests on different time periods
- Try 2022 data (different market conditions)
- Ensure strategy works in various environments

**Tip 2**: Compare multiple strategies
- Use "Compare Backtests" feature
- See which performs best
- Deploy the winner

See you in the next video where we go live!

*[End screen]*

---

## Video 4: Risk Management Essentials
**Duration**: 7 minutes
**Target Audience**: Intermediate users

### Script

**[0:00 - 0:30] Introduction**

Risk management can make or break your trading success.

You can have the best strategy in the world, but without proper risk management, one bad trade can wipe out months of profits.

In this video, I'll show you:
- The three pillars of risk management
- How to size positions correctly
- Setting effective stop losses
- Portfolio-level risk controls

Let's protect your capital!

**[0:30 - 2:00] The Three Pillars**

Risk management has three core components:

*[Show graphic with three pillars]*

**Pillar 1: Position Sizing**
- How much capital per trade
- Too large = excessive risk
- Too small = missing opportunities

**Pillar 2: Stop Losses**
- Automatic exit at loss threshold
- Prevents catastrophic losses
- Enforces discipline

**Pillar 3: Portfolio Limits**
- Maximum positions
- Total exposure cap
- Cash reserves

Let's explore each in detail.

**[2:00 - 3:30] Position Sizing**

Position sizing determines how much you invest in each trade.

*[Show calculator/examples]*

**Conservative**: 5-8% per position
- Example: $10,000 portfolio × 5% = $500 per position
- Can hold 10-12 positions comfortably
- Lower risk, steady growth

**Moderate**: 10-12% per position
- Example: $10,000 × 10% = $1,000 per position
- Can hold 8-10 positions
- Balanced risk/reward

**Aggressive**: 15% per position
- Example: $10,000 × 15% = $1,500 per position
- Can hold 6-7 positions
- Higher risk, higher potential

**Never exceed 20% in a single position!**

**The Kelly Criterion** (advanced):
- Mathematical formula for optimal sizing
- Use 25-50% of Kelly result to avoid overbetting
- Stock Picker can calculate this for you

**My recommendation**: Start with 10% per position.

**[3:30 - 5:00] Stop Losses**

Stop losses automatically close positions when they drop to a certain level.

*[Show chart with stop loss trigger]*

**Example**:
- Buy stock at $100
- Set 5% stop loss
- Stop triggers at $95
- Maximum loss: $5 per share

**Stop Loss Guidelines:**

**Conservative**: 3-5% stop
- Tighter protection
- More frequent exits
- Good for volatile stocks

**Moderate**: 5-7% stop
- Standard recommendation
- Balances protection and flexibility
- Good for most strategies

**Aggressive**: 7-10% stop
- More room for fluctuation
- Fewer false exits
- Only for high-conviction trades

**Trailing Stops** (advanced):
- Stop moves up as price increases
- Locks in profits
- Prevents giving back gains

*[Show trailing stop visualization]*

Entry at $100, 5% trailing stop:
- Price reaches $110 → stop moves to $104.50
- Price reaches $120 → stop moves to $114
- If price drops to $114, exit with $14 profit

**[5:00 - 6:00] Portfolio-Level Controls**

Beyond individual positions, manage total portfolio risk:

**Maximum Positions**:
- Limit simultaneous holdings
- Recommended: 5-12 positions
- Too many = dilution
- Too few = concentration risk

*[Show diversification chart]*

**Total Exposure Cap**:
- Maximum % of portfolio invested
- Recommended: 80-90%
- Always keep 10-20% cash
- Cash for new opportunities

**Sector Concentration**:
- Avoid too much in one sector
- Max 30% in any sector
- Diversify across industries
- Reduces correlation risk

**Daily Loss Limit**:
- If down X% in one day, stop trading
- Recommended: 3% daily loss limit
- Prevents emotional decisions
- Time to reassess

**Circuit Breakers**:
- Automatic strategy shutdown at threshold
- Example: Stop strategy if down 20% from peak
- Safety net for extreme losses

**[6:00 - 6:45] Configuring in Stock Picker**

Let me show you where to set these in Stock Picker.

*[Navigate to strategy configuration]*

**Position sizing**: Set in Risk Management → Position Size
**Stop loss**: Risk Management → Stop Loss Percentage
**Max positions**: Risk Management → Maximum Positions
**Portfolio exposure**: Risk Management → Max Portfolio Risk

**Alerts**: Set up on Alerts page for circuit breakers

*[Quick tour of settings]*

**[6:45 - 7:00] Closing**

Risk management isn't sexy, but it's essential.

Remember:
- Size positions appropriately (10% recommended)
- Always use stop losses (5% minimum)
- Limit total exposure (80-90% max)
- Monitor and adjust regularly

Protect your capital first, profits will follow.

In the next video: Advanced Strategy Optimization!

*[End screen]*

---

## Video 5: Advanced Strategy Optimization
**Duration**: 12 minutes
**Target Audience**: Experienced users

### Script

**[0:00 - 1:00] Introduction**

You've mastered the basics - now let's take your strategies to the next level!

In this video, we'll cover advanced optimization techniques:
- Factor performance attribution
- Parameter optimization
- Walk-forward analysis
- Strategy combination
- Regime detection

These techniques separate good traders from great traders.

Warning: This video moves fast. Pause as needed!

Let's optimize!

**[1:00 - 3:00] Factor Performance Attribution**

*(Continue with detailed walkthrough...)*

**[Remaining sections would follow similar detailed format]**

---

## Video 6: Live Trading & Monitoring
**Duration**: 8 minutes
**Target Audience**: Users ready to go live

### Script

**[0:00 - 0:45] Introduction**

The moment of truth - going live with your strategy!

You've built a strategy, backtested it thoroughly, and optimized parameters. Now it's time to deploy.

In this video:
- Enabling automated trading
- Understanding execution
- Monitoring performance
- When to intervene
- Troubleshooting common issues

Let's go live - carefully!

*(Continue with detailed walkthrough...)*

---

## Production Notes

### Equipment & Settings

**Screen Recording**:
- Resolution: 1920×1080 (Full HD)
- Frame rate: 30 fps minimum
- Recording software: OBS Studio / ScreenFlow / Camtasia

**Audio**:
- Use quality microphone (not laptop mic)
- Record in quiet environment
- Audio bitrate: 192 kbps minimum

**Editing**:
- Add text overlays for key points
- Use zoom/highlight for small UI elements
- Include chapter markers
- Add captions/subtitles

### Video Style Guide

**Pacing**:
- Speak clearly and not too fast
- Pause after important points
- Allow time for viewers to follow along

**Visuals**:
- Clean, uncluttered screen
- Close browser notifications
- Use consistent color theme
- Highlight cursor when clicking

**Annotations**:
- Circle or arrow for important UI elements
- Text box for key definitions
- Color code: green for good, red for warnings

**Transitions**:
- Simple fades between sections
- No flashy effects
- Maintain professional tone

### Thumbnail Templates

**Video 1**: "Getting Started" - Dashboard screenshot + "START HERE"
**Video 2**: "First Strategy" - Strategy builder + "BUILD THIS"
**Video 3**: "Backtesting" - Equity curve + "TEST IT"
**Video 4**: "Risk Management" - Stop loss chart + "STAY SAFE"
**Video 5**: "Optimization" - Multiple charts + "ADVANCED"
**Video 6**: "Go Live" - Trade execution + "DEPLOY NOW"

### Call to Action (End Screens)

Standard end screen for all videos:
- Link to next video in series
- Link to full playlist
- Link to documentation
- Subscribe prompt
- Comment prompt: "What strategies will you build?"

---

## Publishing Schedule

Recommended release sequence:

**Week 1**: Videos 1-3 (Basics & Backtesting)
**Week 2**: Video 4 (Risk Management)
**Week 3**: Videos 5-6 (Advanced & Live Trading)

Release schedule: Tuesday/Thursday at 10 AM ET

---

## Community Engagement

**Pin comment on each video** with:
- Link to written guide (USER_GUIDE.md)
- Timestamps for sections
- Common questions from FAQ
- Link to next video

**Respond to comments**:
- Answer questions within 24 hours
- Pin best questions to top
- Create FAQ update based on common questions

---

**Ready to record?** Use these scripts as starting points and adapt to your style. Good luck! 🎬
