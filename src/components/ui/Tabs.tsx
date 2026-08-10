import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

interface TabsContextProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextProps | undefined>(undefined);

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}) => {
  const [selected, setSelected] = useState(defaultValue);
  const activeTab = value !== undefined ? value : selected;

  const handleSelect = (id: string) => {
    if (value === undefined) {
      setSelected(id);
    }
    onValueChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleSelect }}>
      <div className={cn('w-full flex flex-col gap-4 text-left', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      'inline-flex items-center gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800',
      className
    )}
    role="tablist"
    {...props}
  >
    {children}
  </div>
);

export interface TabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabTrigger: React.FC<TabTriggerProps> = ({ value, className, children, ...props }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabTrigger must be used within Tabs');

  const isActive = ctx.activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.setActiveTab(value)}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer select-none',
        isActive
          ? 'bg-indigo-600 text-white shadow-subtle'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ value, className, children, ...props }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabPanel must be used within Tabs');

  if (ctx.activeTab !== value) return null;

  return (
    <div role="tabpanel" className={cn('animate-in fade-in duration-150', className)} {...props}>
      {children}
    </div>
  );
};
