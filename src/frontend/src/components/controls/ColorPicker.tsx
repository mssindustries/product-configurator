/**
 * Color selection control component.
 * Renders a set of color options as clickable swatches.
 */

export interface ColorPickerProps {
  /** Field label */
  label: string;
  /** Available color options */
  options: string[];
  /** Currently selected color */
  value: string;
  /** Callback when color selection changes */
  onChange: (value: string) => void;
  /** Optional field name for identification */
  name?: string;
}

/** Map of color names to their display colors */
const COLOR_MAP: Record<string, string> = {
  white: '#ffffff',
  black: '#000000',
  oak: '#c19a6b',
  walnut: '#5d432c',
  mahogany: '#c04000',
  cherry: '#de3163',
  maple: '#ffd28c',
  gray: '#808080',
  grey: '#808080',
  red: '#ff0000',
  blue: '#0000ff',
  green: '#008000',
  brown: '#8b4513',
  beige: '#f5f5dc',
  cream: '#fffdd0',
  silver: '#c0c0c0',
  gold: '#ffd700',
  bronze: '#cd7f32',
  copper: '#b87333',
};

/**
 * Resolves a color name to a CSS color value.
 * Returns the input if it's already a valid CSS color.
 */
function resolveColor(color: string): string {
  const lowerColor = color.toLowerCase();
  return COLOR_MAP[lowerColor] ?? color;
}

/**
 * Color picker control with visual swatches.
 *
 * Usage:
 * ```tsx
 * <ColorPicker
 *   label="Panel Color"
 *   options={["white", "black", "oak"]}
 *   value="white"
 *   onChange={(color) => console.log(color)}
 * />
 * ```
 */
export function ColorPicker({
  label,
  options,
  value,
  onChange,
  name,
}: ColorPickerProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const isSelected = option === value;
          const displayColor = resolveColor(option);
          const isLightColor = isLightColorValue(displayColor);

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={option}
              data-testid={name ? `${name}-${option}` : `color-${option}`}
              onClick={() => onChange(option)}
              className={`
                w-10 h-10 rounded-lg border-2 transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-1'
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${isLightColor ? 'shadow-sm' : ''}
              `}
              style={{ backgroundColor: displayColor }}
              title={option}
            />
          );
        })}
      </div>
      {value && (
        <p className="mt-1 text-xs text-gray-500 capitalize">
          Selected: {value}
        </p>
      )}
    </div>
  );
}

/**
 * Determines if a color is light (for contrast purposes).
 */
function isLightColorValue(color: string): boolean {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    // Using relative luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.7;
  }
  return false;
}
