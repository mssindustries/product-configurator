/**
 * Material selection dropdown component.
 * Renders a select dropdown for choosing from available materials.
 */

export interface MaterialSelectorProps {
  /** Field label */
  label: string;
  /** Available material options */
  options: string[];
  /** Currently selected material */
  value: string;
  /** Callback when material selection changes */
  onChange: (value: string) => void;
  /** Optional field name for identification */
  name?: string;
  /** Optional placeholder text */
  placeholder?: string;
}

/**
 * Material selector dropdown control.
 *
 * Usage:
 * ```tsx
 * <MaterialSelector
 *   label="Surface Material"
 *   options={["oak", "walnut", "maple"]}
 *   value="oak"
 *   onChange={(material) => console.log(material)}
 * />
 * ```
 */
export function MaterialSelector({
  label,
  options,
  value,
  onChange,
  name,
  placeholder = 'Select a material',
}: MaterialSelectorProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="mb-4">
      <label
        htmlFor={name ?? 'material-selector'}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
      <select
        id={name ?? 'material-selector'}
        name={name}
        value={value}
        onChange={handleChange}
        data-testid={name ? `${name}-select` : 'material-select'}
        className="
          block w-full rounded-lg border border-gray-300 bg-white
          px-4 py-2.5 text-gray-900
          focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none
          transition-colors duration-150
          cursor-pointer
          appearance-none
          bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M7%207l3%203%203-3%22%2F%3E%3C%2Fsvg%3E')]
          bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.5rem_1.5rem]
          pr-10
        "
      >
        {!value && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option} value={option}>
            {formatMaterialName(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Formats a material name for display (capitalizes first letter of each word).
 */
function formatMaterialName(name: string): string {
  return name
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
