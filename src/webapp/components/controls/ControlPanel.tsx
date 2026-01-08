'use client';

import { useConfiguration } from '@/context/ConfigurationContext';
import ColorPicker from './ColorPicker';
import MaterialSelector from './MaterialSelector';
import DimensionSlider from './DimensionSlider';

export default function ControlPanel() {
  const { configuration, setDimension } = useConfiguration();

  return (
    <div className="h-full overflow-y-auto bg-white p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Configurator</h2>
        <p className="text-sm text-gray-600">Customize your cabinet in real-time</p>
      </div>

      <div className="space-y-6">
        <section className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Appearance</h3>
          <div className="space-y-4">
            <ColorPicker />
            <MaterialSelector />
          </div>
        </section>

        <section className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Dimensions</h3>
          <div className="space-y-4">
            <DimensionSlider
              label="Width"
              axis="width"
              value={configuration.dimensions.width}
              onChange={(value) => setDimension('width', value)}
            />
            <DimensionSlider
              label="Height"
              axis="height"
              value={configuration.dimensions.height}
              onChange={(value) => setDimension('height', value)}
            />
            <DimensionSlider
              label="Depth"
              axis="depth"
              value={configuration.dimensions.depth}
              onChange={(value) => setDimension('depth', value)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
