import { Card } from '../components/ui/Card';

export function TradesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Trade History</h1>
        <p className="text-gray-600 mt-1">
          View your executed trades and order history
        </p>
      </div>

      <Card>
        <div className="text-center py-12 text-gray-500">
          Trade history view coming soon...
        </div>
      </Card>
    </div>
  );
}
