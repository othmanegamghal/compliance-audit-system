import React from 'react';
import { motion } from 'framer-motion';

export interface TabOption {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface TabsProps {
  tabs: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex border-b border-slate-200 dark:border-slate-800 ${className}`}>
      <nav className="flex gap-6 -mb-px" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative pb-3 text-sm font-semibold flex items-center gap-2 transition-colors focus:outline-none ${
                isActive
                  ? 'text-primary dark:text-primary-light'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              {Icon && <Icon className="h-4.5 w-4.5" />}
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabBorder"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-primary-light"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
