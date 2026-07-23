import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center text-xs text-slate-500 dark:text-slate-400 select-none py-1">
      <ol className="flex items-center space-x-1.5 md:space-x-2">
        <li className="flex items-center">
          <Link
            to="/"
            className="flex items-center hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 flex-shrink-0" />
              {isLast || !item.path ? (
                <span className="ml-1.5 md:ml-2 font-medium text-slate-800 dark:text-slate-200 max-w-[120px] md:max-w-xs truncate">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="ml-1.5 md:ml-2 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
