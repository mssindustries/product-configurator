/**
 * Dimension slider control component.
 * Renders a range slider for adjusting numeric dimensions.
 */

export interface DimensionSliderProps {
  /** Field label */
  label: string;
  /** Minimum allowed value */
  min: number;
  /** Maximum allowed value */
  max: number;
  /** Current value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Optional field name for identification */
  name?: string;
  /** Step increment (default: 1) */
  step?: number;
  /** Unit label (e.g., "cm", "in") */
  unit?: string;
}

/**
 * Dimension slider control with numeric input.
 *
 * Usage:
 * ```tsx
 * <DimensionSlider
 *   label="Width"
 *   min={10}
 *   max={100}
 *   value={50}
 *   onChange={(width) => console.log(width)}
 *   unit="cm"
 * />
 * ```
 */
export function DimensionSlider({
  label,
  min,
  max,
  value,
  onChange,
  name,
  step = 1,
  unit,
}: DimensionSliderProps) {
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(event.target.value);
    if (!isNaN(newValue)) {
      // Clamp the value to min/max bounds
      const clampedValue = Math.min(max, Math.max(min, newValue));
      onChange(clampedValue);
    }
  };

  // Calculate percentage for slider fill styling
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor={name ? `${name}-slider` : 'dimension-slider'}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            id={name ? `${name}-input` : 'dimension-input'}
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            data-testid={name ? `${name}-input` : 'dimension-input'}
            className="
              w-20 rounded-md border border-gray-300 bg-white
              px-2 py-1 text-sm text-gray-900 text-right
              focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            "
          />
          {unit && (
            <span className="text-sm text-gray-500 min-w-[2rem]">{unit}</span>
          )}
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          id={name ? `${name}-slider` : 'dimension-slider'}
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          data-testid={name ? `${name}-slider` : 'dimension-slider'}
          className="
            w-full h-2 rounded-full appearance-none cursor-pointer
            bg-gray-200
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-blue-500
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-blue-500
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-white
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
          }}
        />
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>{min}{unit ? ` ${unit}` : ''}</span>
          <span>{max}{unit ? ` ${unit}` : ''}</span>
        </div>
      </div>
    </div>
  );
}
