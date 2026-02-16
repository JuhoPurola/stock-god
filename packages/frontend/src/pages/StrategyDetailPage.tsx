import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStrategyStore } from '../store/strategy-store';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function StrategyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { selectedStrategy, selectStrategy, loading } = useStrategyStore();

  useEffect(() => {
    if (id) {
      selectStrategy(id);
    }
  }, [id]);

  if (loading || !selectedStrategy) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedStrategy.name}
          </h1>
          {selectedStrategy.description && (
            <p className="text-gray-600 mt-1">{selectedStrategy.description}</p>
          )}
        </div>
        <Badge variant={selectedStrategy.enabled ? 'success' : 'default'}>
          {selectedStrategy.enabled ? 'Active' : 'Disabled'}
        </Badge>
      </div>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Strategy Details</h3>
        <p className="text-gray-600">Strategy details coming soon...</p>
      </Card>
    </div>
  );
}
