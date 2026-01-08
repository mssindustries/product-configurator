'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ConfigurationState, ConfigurationContextType, MaterialType, Dimensions } from '@/types/configurator';

const ConfigurationContext = createContext<ConfigurationContextType | undefined>(undefined);

const defaultConfiguration: ConfigurationState = {
  color: '#8b4513',
  material: 'wood',
  dimensions: {
    width: 1,
    height: 1,
    depth: 1,
  },
};

export function ConfigurationProvider({ children }: { children: ReactNode }) {
  const [configuration, setConfiguration] = useState<ConfigurationState>(defaultConfiguration);

  const setColor = (color: string) => {
    setConfiguration(prev => ({ ...prev, color }));
  };

  const setMaterial = (material: MaterialType) => {
    setConfiguration(prev => ({ ...prev, material }));
  };

  const setDimensions = (dimensions: Dimensions) => {
    setConfiguration(prev => ({ ...prev, dimensions }));
  };

  const setDimension = (axis: keyof Dimensions, value: number) => {
    setConfiguration(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [axis]: value,
      },
    }));
  };

  const value: ConfigurationContextType = {
    configuration,
    setColor,
    setMaterial,
    setDimensions,
    setDimension,
  };

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
}

export function useConfiguration() {
  const context = useContext(ConfigurationContext);
  if (context === undefined) {
    throw new Error('useConfiguration must be used within a ConfigurationProvider');
  }
  return context;
}
