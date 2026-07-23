import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'text':
        return 'h-3 rounded-md w-3/4';
      default:
        return 'rounded-xl';
    }
  };

  return (
    <div
      className={`animate-shimmer bg-slate-200/60 dark:bg-slate-800/60 ${getStyles()} ${className}`}
    />
  );
};
