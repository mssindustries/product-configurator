'use client';

import { ConfigurationProvider } from '@/context/ConfigurationContext';
import Scene3D from '@/components/scene/Scene3D';
import ControlPanel from '@/components/controls/ControlPanel';

export default function ConfiguratorContainer() {
  return (
    <ConfigurationProvider>
      <div className="flex flex-col md:flex-row h-screen w-full">
        <div className="w-full md:w-3/5 h-1/2 md:h-full">
          <Scene3D />
        </div>
        <div className="w-full md:w-2/5 h-1/2 md:h-full">
          <ControlPanel />
        </div>
      </div>
    </ConfigurationProvider>
  );
}
