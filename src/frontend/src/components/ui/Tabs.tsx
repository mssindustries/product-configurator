import { createContext, useContext, useState, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Tabs component for tabbed navigation within a container.
 */

// Tab context
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be used within Tabs');
  }
  return context;
}

// Root Tabs component
interface TabsProps {
  defaultTab?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultTab, value, onValueChange, children, className = '' }: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || '');

  // Determine if controlled or uncontrolled
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalActiveTab;

  const setActiveTab = (tab: string) => {
    if (isControlled) {
      // Controlled mode: call the parent's callback
      onValueChange?.(tab);
    } else {
      // Uncontrolled mode: update internal state
      setInternalActiveTab(tab);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// TabsList component (container for tab buttons)
interface TabsListProps {
  children: ReactNode;
  className?: string;
}

function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={`flex border-b border-neutral-200 ${className}`}
    >
      {children}
    </div>
  );
}

// Tab button variants
const tabVariants = cva(
  'px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  {
    variants: {
      active: {
        true: 'border-primary-500 text-primary-600',
        false: 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300',
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

// Tab button component
interface TabProps extends VariantProps<typeof tabVariants> {
  value: string;
  children: ReactNode;
}

function Tab({ value, children }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      id={`tab-${value}`}
      onClick={() => setActiveTab(value)}
      className={tabVariants({ active: isActive })}
    >
      {children}
    </button>
  );
}

// TabPanel component (content for each tab)
interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

function TabPanel({ value, children, className = '' }: TabPanelProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={className}
    >
      {children}
    </div>
  );
}

// Export compound component
Tabs.List = TabsList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;
