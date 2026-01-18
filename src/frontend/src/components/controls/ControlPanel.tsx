/**
 * Control panel that dynamically renders controls based on a JSON Schema.
 */

import { ColorPicker } from './ColorPicker';
import { MaterialSelector } from './MaterialSelector';
import { DimensionSlider } from './DimensionSlider';

/**
 * JSON Schema property definition for a configuration field.
 */
export interface SchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean';
  enum?: string[];
  minimum?: number;
  maximum?: number;
  default?: string | number | boolean;
  title?: string;
  description?: string;
}

/**
 * JSON Schema format for configuration.
 */
export interface ConfigSchema {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

/**
 * Configuration values object.
 */
export type ConfigValues = Record<string, string | number | boolean>;

export interface ControlPanelProps {
  /** JSON Schema defining the configuration fields */
  config_schema: ConfigSchema;
  /** Current configuration values */
  values: ConfigValues;
  /** Callback when any value changes */
  onChange: (values: ConfigValues) => void;
  /** Optional title for the panel */
  title?: string;
  /** Optional CSS class for the container */
  className?: string;
}

/**
 * Keywords that indicate a field should use ColorPicker.
 */
const COLOR_KEYWORDS = ['color', 'colour', 'tint', 'hue', 'shade'];

/**
 * Checks if a field name suggests it's a color field.
 */
function isColorField(fieldName: string): boolean {
  const lowerName = fieldName.toLowerCase();
  return COLOR_KEYWORDS.some((keyword) => lowerName.includes(keyword));
}

/**
 * Formats a field name into a human-readable label.
 */
function formatLabel(fieldName: string, title?: string): string {
  if (title) return title;
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
    .replace(/^\s+/, '') // Trim leading space
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Control panel that renders appropriate controls based on JSON Schema.
 *
 * Field type mapping:
 * - `type: "string"` with `enum` and color in name -> ColorPicker
 * - `type: "string"` with `enum` -> MaterialSelector
 * - `type: "number"` with `minimum`/`maximum` -> DimensionSlider
 *
 * Usage:
 * ```tsx
 * const schema = {
 *   type: "object",
 *   properties: {
 *     width: { type: "number", minimum: 10, maximum: 100 },
 *     color: { type: "string", enum: ["white", "black", "oak"] }
 *   }
 * };
 *
 * <ControlPanel
 *   config_schema={schema}
 *   values={{ width: 50, color: "white" }}
 *   onChange={(newValues) => console.log(newValues)}
 * />
 * ```
 */
export function ControlPanel({
  config_schema,
  values,
  onChange,
  title,
  className = '',
}: ControlPanelProps) {
  const handleFieldChange = (fieldName: string, value: string | number | boolean) => {
    onChange({
      ...values,
      [fieldName]: value,
    });
  };

  const renderControl = (fieldName: string, property: SchemaProperty) => {
    const label = formatLabel(fieldName, property.title);
    const currentValue = values[fieldName];

    // String type with enum - either ColorPicker or MaterialSelector
    if (property.type === 'string' && property.enum) {
      if (isColorField(fieldName)) {
        return (
          <ColorPicker
            key={fieldName}
            name={fieldName}
            label={label}
            options={property.enum}
            value={(currentValue as string) ?? property.enum[0]}
            onChange={(value) => handleFieldChange(fieldName, value)}
          />
        );
      }

      return (
        <MaterialSelector
          key={fieldName}
          name={fieldName}
          label={label}
          options={property.enum}
          value={(currentValue as string) ?? property.enum[0]}
          onChange={(value) => handleFieldChange(fieldName, value)}
        />
      );
    }

    // Number type with min/max - DimensionSlider
    if (
      (property.type === 'number' || property.type === 'integer') &&
      property.minimum !== undefined &&
      property.maximum !== undefined
    ) {
      return (
        <DimensionSlider
          key={fieldName}
          name={fieldName}
          label={label}
          min={property.minimum}
          max={property.maximum}
          value={(currentValue as number) ?? property.minimum}
          step={property.type === 'integer' ? 1 : 0.1}
          onChange={(value) => handleFieldChange(fieldName, value)}
        />
      );
    }

    // Unsupported field type - render nothing or a placeholder
    return (
      <div key={fieldName} className="mb-4 p-3 bg-gray-100 rounded-lg">
        <span className="text-sm text-gray-500">
          Unsupported field: {label} ({property.type})
        </span>
      </div>
    );
  };

  const propertyEntries = Object.entries(config_schema.properties ?? {});

  if (propertyEntries.length === 0) {
    return (
      <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
        <p className="text-gray-500 text-sm">No configuration options available.</p>
      </div>
    );
  }

  return (
    <div
      className={`p-4 bg-white rounded-lg shadow ${className}`}
      data-testid="control-panel"
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          {title}
        </h3>
      )}
      <div className="space-y-2">
        {propertyEntries.map(([fieldName, property]) =>
          renderControl(fieldName, property)
        )}
      </div>
    </div>
  );
}
