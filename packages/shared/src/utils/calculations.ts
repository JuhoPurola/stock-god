/**
 * Common calculation utilities for financial metrics
 */

/**
 * Calculate percentage change between two values
 */
export function percentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate profit/loss
 */
export function calculatePnL(
  quantity: number,
  buyPrice: number,
  sellPrice: number
): number {
  return quantity * (sellPrice - buyPrice);
}

/**
 * Calculate unrealized P&L for a position
 */
export function calculateUnrealizedPnL(
  quantity: number,
  averagePrice: number,
  currentPrice: number
): number {
  return quantity * (currentPrice - averagePrice);
}

/**
 * Calculate Sharpe Ratio
 * @param returns Array of period returns
 * @param riskFreeRate Annual risk-free rate (default 0.02 for 2%)
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0.02
): number {
  if (returns.length === 0) return 0;

  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    returns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  // Assuming daily returns, annualize
  const annualizedReturn = avgReturn * 252;
  const annualizedStdDev = stdDev * Math.sqrt(252);

  return (annualizedReturn - riskFreeRate) / annualizedStdDev;
}

/**
 * Calculate Maximum Drawdown
 * @param equityCurve Array of portfolio values over time
 */
export function calculateMaxDrawdown(equityCurve: number[]): {
  maxDrawdown: number;
  maxDrawdownPercent: number;
} {
  if (equityCurve.length === 0) {
    return { maxDrawdown: 0, maxDrawdownPercent: 0 };
  }

  let peak = equityCurve[0]!;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;

  for (const value of equityCurve) {
    if (value > peak) {
      peak = value;
    }

    const drawdown = peak - value;
    const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = drawdownPercent;
    }
  }

  return { maxDrawdown, maxDrawdownPercent };
}

/**
 * Calculate Win Rate
 */
export function calculateWinRate(
  winningTrades: number,
  totalTrades: number
): number {
  if (totalTrades === 0) return 0;
  return (winningTrades / totalTrades) * 100;
}

/**
 * Calculate Profit Factor
 */
export function calculateProfitFactor(
  totalWins: number,
  totalLosses: number
): number {
  if (totalLosses === 0) return totalWins > 0 ? Infinity : 0;
  return totalWins / Math.abs(totalLosses);
}

/**
 * Calculate annualized return
 */
export function calculateAnnualizedReturn(
  totalReturn: number,
  days: number
): number {
  if (days === 0) return 0;
  const years = days / 365;
  return Math.pow(1 + totalReturn, 1 / years) - 1;
}

/**
 * Calculate position size based on risk management rules
 */
export function calculatePositionSize(
  portfolioValue: number,
  maxPositionSizePercent: number,
  stockPrice: number
): number {
  const maxPositionValue = portfolioValue * maxPositionSizePercent;
  return Math.floor(maxPositionValue / stockPrice);
}

/**
 * Calculate stop loss price
 */
export function calculateStopLoss(
  entryPrice: number,
  stopLossPercent: number,
  side: 'buy' | 'sell'
): number {
  if (side === 'buy') {
    return entryPrice * (1 - stopLossPercent);
  } else {
    return entryPrice * (1 + stopLossPercent);
  }
}

/**
 * Calculate take profit price
 */
export function calculateTakeProfit(
  entryPrice: number,
  takeProfitPercent: number,
  side: 'buy' | 'sell'
): number {
  if (side === 'buy') {
    return entryPrice * (1 + takeProfitPercent);
  } else {
    return entryPrice * (1 - takeProfitPercent);
  }
}

/**
 * Normalize a score to -1 to +1 range
 */
export function normalizeScore(
  value: number,
  min: number,
  max: number
): number {
  if (max === min) return 0;
  // Map [min, max] to [-1, 1]
  return ((value - min) / (max - min)) * 2 - 1;
}

/**
 * Combine multiple factor scores with weights
 */
export function combineFactorScores(
  scores: Array<{ score: number; weight: number }>
): number {
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = scores.reduce(
    (sum, s) => sum + s.score * s.weight,
    0
  );
  return weightedSum / totalWeight;
}
