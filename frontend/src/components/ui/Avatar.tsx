import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
}) => {
  const getInitials = (n: string) => {
    const parts = n.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const sizeStyles = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm font-medium',
    lg: 'h-12 w-12 text-base font-medium',
    xl: 'h-16 w-16 text-xl font-semibold',
  };

  // Generate a soft background color based on name string hash
  const getBgColor = (n: string) => {
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeStyles[size]} rounded-full object-cover border border-slate-200 dark:border-slate-700 ${className}`}
        onError={(e) => {
          // If image fails to load, fallback to initials
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeStyles[size]} ${getBgColor(name)} flex items-center justify-center rounded-full border border-transparent select-none uppercase ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};
