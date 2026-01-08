export type MaterialType = 'wood' | 'metal' | 'glass' | 'plastic';

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ConfigurationState {
  color: string;
  material: MaterialType;
  dimensions: Dimensions;
}

export interface ConfigurationContextType {
  configuration: ConfigurationState;
  setColor: (color: string) => void;
  setMaterial: (material: MaterialType) => void;
  setDimensions: (dimensions: Dimensions) => void;
  setDimension: (axis: keyof Dimensions, value: number) => void;
}
