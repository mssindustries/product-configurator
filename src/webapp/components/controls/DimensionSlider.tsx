'use client';

import type { Dimensions } from '@/types/configurator';

interface DimensionSliderProps {
  label: string;
  axis: keyof Dimensions;
  value: number;
  onChange: (value: number) => void;
}

export default function DimensionSlider({ label, axis, value, onChange }: DimensionSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label htmlFor={`dimension-${axis}`} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <span className="text-sm text-gray-600 font-mono">{value.toFixed(2)}x</span>
      </div>
      <input
        id={`dimension-${axis}`}
        type="range"
        min="0.5"
        max="2.0"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );
}
