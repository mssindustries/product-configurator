'use client';

import { useConfiguration } from '@/context/ConfigurationContext';

export default function ColorPicker() {
  const { configuration, setColor } = useConfiguration();

  return (
    <div className="space-y-2">
      <label htmlFor="color-picker" className="block text-sm font-medium text-gray-700">
        Color
      </label>
      <div className="flex items-center gap-3">
        <input
          id="color-picker"
          type="color"
          value={configuration.color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-20 cursor-pointer rounded border border-gray-300"
        />
        <span className="text-sm text-gray-600 font-mono">{configuration.color}</span>
      </div>
    </div>
  );
}
