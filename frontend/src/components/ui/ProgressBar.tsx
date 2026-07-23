import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  showLabel = false,
  size = 'md',
  className = '',
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const getBarColor = (val: number) => {
    if (val < 50) return 'bg-danger';
    if (val < 80) return 'bg-warning';
    return 'bg-success';
  };

  const getTrackColor = () => {
    return 'bg-slate-100 dark:bg-slate-800';
  };

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-350">
            Compliance Score
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {clampedValue}%
          </span>
        </div>
      )}
      <div className={`w-full ${getTrackColor()} rounded-full overflow-hidden`}>
        <div
          className={`${sizeStyles[size]} ${getBarColor(clampedValue)} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
