/**
 * Date utility functions
 */

/**
 * Check if a date is a market trading day (weekday, not holiday)
 * Note: This is a simplified version - production should check against actual market holidays
 */
export function isTradingDay(date: Date): boolean {
  const day = date.getDay();
  // 0 = Sunday, 6 = Saturday
  return day !== 0 && day !== 6;
}

/**
 * Get next trading day
 */
export function getNextTradingDay(date: Date): Date {
  const next = new Date(date);
  do {
    next.setDate(next.getDate() + 1);
  } while (!isTradingDay(next));
  return next;
}

/**
 * Get previous trading day
 */
export function getPreviousTradingDay(date: Date): Date {
  const prev = new Date(date);
  do {
    prev.setDate(prev.getDate() - 1);
  } while (!isTradingDay(prev));
  return prev;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00Z');
}

/**
 * Get date N days ago
 */
export function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Get number of trading days between two dates
 */
export function getTradingDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    if (isTradingDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Check if market is currently open (simplified)
 * NYSE/NASDAQ: 9:30 AM - 4:00 PM ET, weekdays
 */
export function isMarketOpen(now: Date = new Date()): boolean {
  if (!isTradingDay(now)) {
    return false;
  }

  // Convert to ET (simplified - doesn't account for DST properly)
  const etHour = now.getUTCHours() - 5;
  const etMinute = now.getUTCMinutes();

  const isAfterOpen = etHour > 9 || (etHour === 9 && etMinute >= 30);
  const isBeforeClose = etHour < 16;

  return isAfterOpen && isBeforeClose;
}

/**
 * Get start of day (midnight)
 */
export function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of day (23:59:59.999)
 */
export function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}
