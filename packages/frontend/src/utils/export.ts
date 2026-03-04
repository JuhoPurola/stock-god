/**
 * Export Utilities
 * Functions to export data to CSV and PDF
 */

/**
 * Convert array of objects to CSV
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export trades to CSV
 */
export const exportTrades = (trades: any[]) => {
  const formattedTrades = trades.map(trade => ({
    Date: new Date(trade.executedAt || trade.createdAt).toLocaleDateString(),
    Symbol: trade.symbol,
    Side: trade.side,
    Quantity: trade.quantity,
    Price: trade.price.toFixed(2),
    Amount: trade.amount.toFixed(2),
    Status: trade.status,
  }));
  
  exportToCSV(formattedTrades, `trades_${new Date().toISOString().split('T')[0]}`);
};

/**
 * Export positions to CSV
 */
export const exportPositions = (positions: any[]) => {
  const formattedPositions = positions.map(pos => ({
    Symbol: pos.symbol,
    Quantity: pos.quantity,
    'Avg Price': pos.averagePrice.toFixed(2),
    'Current Price': pos.currentPrice?.toFixed(2) || 'N/A',
    'Market Value': pos.marketValue?.toFixed(2) || 'N/A',
    'Unrealized P&L': pos.unrealizedPnL?.toFixed(2) || 'N/A',
    'P&L %': pos.unrealizedPnLPercent?.toFixed(2) || 'N/A',
  }));
  
  exportToCSV(formattedPositions, `positions_${new Date().toISOString().split('T')[0]}`);
};

/**
 * Export portfolio performance to CSV
 */
export const exportPerformance = (snapshots: any[]) => {
  const formattedSnapshots = snapshots.map(snap => ({
    Date: new Date(snap.timestamp).toLocaleDateString(),
    'Total Value': snap.totalValue.toFixed(2),
    'Cash Balance': snap.cashBalance.toFixed(2),
    'Positions Value': snap.positionsValue.toFixed(2),
    'Daily Return': snap.dailyReturn?.toFixed(2) || '0.00',
    'Daily Return %': snap.dailyReturnPercent?.toFixed(2) || '0.00',
    'Total Return': snap.totalReturn?.toFixed(2) || '0.00',
    'Total Return %': snap.totalReturnPercent?.toFixed(2) || '0.00',
  }));
  
  exportToCSV(formattedSnapshots, `performance_${new Date().toISOString().split('T')[0]}`);
};

/**
 * Print current page (for PDF export via browser)
 */
export const exportToPDF = () => {
  window.print();
};
