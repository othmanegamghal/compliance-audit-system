import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-darkbg text-slate-800 dark:text-slate-100">
      {/* Left side panel - decorative details */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-700 via-primary to-indigo-900 justify-center items-center overflow-hidden p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_40%)]" />
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        
        <div className="relative z-10 max-w-md text-white">
          <div className="flex items-center gap-3 mb-6 bg-white/10 w-fit px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
            <ShieldCheck className="h-7 w-7 text-blue-200" />
            <span className="font-bold tracking-tight text-lg">Compliance.io</span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-4">
            Compliance & Audit Management System
          </h1>
          <p className="text-sm text-blue-100 leading-relaxed font-light mb-8">
            A premium, end-to-end enterprise solution for orchestrating audits, managing corporate compliance risk, and validating corrective actions instantly.
          </p>
          
          <div className="border-t border-white/10 pt-6 flex gap-8">
            <div>
              <p className="text-2xl font-bold text-white">99.8%</p>
              <p className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">Audit Reliability</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">10k+</p>
              <p className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">Controls Verified</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">&lt; 1hr</p>
              <p className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">Resolution SLA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Forms container */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-16 py-12 relative">
        <div className="absolute top-8 left-8 flex lg:hidden items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-bold tracking-tight text-slate-900 dark:text-white">Compliance.io</span>
        </div>
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
};
