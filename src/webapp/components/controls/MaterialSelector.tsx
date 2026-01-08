'use client';

import { useConfiguration } from '@/context/ConfigurationContext';
import type { MaterialType } from '@/types/configurator';

const materials: { value: MaterialType; label: string; description: string }[] = [
  { value: 'wood', label: 'Wood', description: 'Natural wood finish' },
  { value: 'metal', label: 'Metal', description: 'Brushed metal finish' },
  { value: 'glass', label: 'Glass', description: 'Transparent glass' },
  { value: 'plastic', label: 'Plastic', description: 'Matte plastic finish' },
];

export default function MaterialSelector() {
  const { configuration, setMaterial } = useConfiguration();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Material</label>
      <div className="grid grid-cols-2 gap-2">
        {materials.map(({ value, label, description }) => (
          <button
            key={value}
            onClick={() => setMaterial(value)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              configuration.material === value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <div className="font-medium text-sm">{label}</div>
            <div className="text-xs text-gray-500">{description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
