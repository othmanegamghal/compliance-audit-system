import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] tracking-wide',
    md: 'px-2.5 py-0.5 text-xs',
  };

  const variantStyles = {
    primary: 'bg-blue-50 text-blue-700 border border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/30',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/30',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/50 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/30',
    info: 'bg-indigo-50 text-indigo-700 border border-indigo-200/50 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/30',
    neutral: 'bg-slate-50 text-slate-700 border border-slate-200/50 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700/50',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
