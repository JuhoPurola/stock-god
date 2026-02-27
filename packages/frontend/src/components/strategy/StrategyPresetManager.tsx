import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { Strategy, FactorConfig } from '@stock-picker/shared';
import {
  Save,
  Download,
  Upload,
  Trash2,
  Copy,
  Check,
  Star,
  StarOff,
} from 'lucide-react';

interface StrategyPreset {
  id: string;
  name: string;
  description: string;
  factors: FactorConfig[];
  createdAt: Date;
  isFavorite: boolean;
}

interface StrategyPresetManagerProps {
  strategy: Strategy;
  onApplyPreset: (factors: FactorConfig[]) => void;
}

export function StrategyPresetManager({
  strategy,
  onApplyPreset,
}: StrategyPresetManagerProps) {
  const [presets, setPresets] = useState<StrategyPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = () => {
    // Load from localStorage
    const stored = localStorage.getItem(`presets_${strategy.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setPresets(
        parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
        }))
      );
    }
  };

  const savePresets = (updatedPresets: StrategyPreset[]) => {
    localStorage.setItem(`presets_${strategy.id}`, JSON.stringify(updatedPresets));
    setPresets(updatedPresets);
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    const newPreset: StrategyPreset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      description: newPresetDescription.trim(),
      factors: strategy.factors,
      createdAt: new Date(),
      isFavorite: false,
    };

    savePresets([...presets, newPreset]);
    setShowSaveDialog(false);
    setNewPresetName('');
    setNewPresetDescription('');
  };

  const handleDeletePreset = (id: string) => {
    if (confirm('Delete this preset?')) {
      savePresets(presets.filter(p => p.id !== id));
    }
  };

  const handleToggleFavorite = (id: string) => {
    savePresets(
      presets.map(p => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  };

  const handleExportPreset = (preset: StrategyPreset) => {
    const dataStr = JSON.stringify(preset, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${preset.name.replace(/\s+/g, '_')}_preset.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPreset = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported: StrategyPreset = JSON.parse(text);

        // Validate structure
        if (!imported.name || !imported.factors) {
          throw new Error('Invalid preset file');
        }

        // Add with new ID to avoid conflicts
        const newPreset: StrategyPreset = {
          ...imported,
          id: Date.now().toString(),
          createdAt: new Date(),
        };

        savePresets([...presets, newPreset]);
        alert(`Preset "${newPreset.name}" imported successfully!`);
      } catch (error) {
        alert('Failed to import preset. Please check the file format.');
      }
    };

    input.click();
  };

  const handleCopyConfiguration = (preset: StrategyPreset) => {
    const config = JSON.stringify(preset.factors, null, 2);
    navigator.clipboard.writeText(config);
    setCopiedId(preset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sort: favorites first, then by date
  const sortedPresets = [...presets].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Strategy Presets</h3>
              <p className="text-sm text-gray-600 mt-1">
                Save and load factor weight configurations
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleImportPreset}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button
                size="sm"
                onClick={() => setShowSaveDialog(true)}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Current
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Save Dialog */}
      {showSaveDialog && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Save Preset</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preset Name *
                </label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g., Aggressive Growth, Conservative Value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  placeholder="Describe when to use this preset..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Current Configuration Preview */}
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Current Configuration:
                </p>
                <div className="space-y-1">
                  {strategy.factors.map(f => (
                    <div
                      key={f.type}
                      className="text-sm flex items-center justify-between"
                    >
                      <span className={f.enabled ? 'text-gray-900' : 'text-gray-400'}>
                        {f.type}
                      </span>
                      <span className="font-medium">
                        {(f.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setNewPresetName('');
                    setNewPresetDescription('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSavePreset}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Presets List */}
      {sortedPresets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedPresets.map(preset => (
            <Card key={preset.id}>
              <CardContent>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {preset.name}
                        </h4>
                        {preset.isFavorite && (
                          <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
                        )}
                      </div>
                      {preset.description && (
                        <p className="text-sm text-gray-600">
                          {preset.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {preset.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Factor Preview */}
                  <div className="p-2 bg-gray-50 rounded space-y-1">
                    {preset.factors
                      .filter(f => f.enabled)
                      .map(f => (
                        <div
                          key={f.type}
                          className="text-xs flex items-center justify-between"
                        >
                          <span className="text-gray-700">{f.type}</span>
                          <Badge variant="default" size="sm">
                            {(f.weight * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleToggleFavorite(preset.id)}
                      >
                        {preset.isFavorite ? (
                          <StarOff className="w-4 h-4" />
                        ) : (
                          <Star className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopyConfiguration(preset)}
                      >
                        {copiedId === preset.id ? (
                          <Check className="w-4 h-4 text-success-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleExportPreset(preset)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeletePreset(preset.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => onApplyPreset(preset.factors)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Save className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No presets saved yet
              </h3>
              <p className="text-gray-600 mb-4">
                Save your factor weight configurations for quick access later
              </p>
              <Button onClick={() => setShowSaveDialog(true)}>
                <Save className="w-4 h-4 mr-2" />
                Save Your First Preset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
