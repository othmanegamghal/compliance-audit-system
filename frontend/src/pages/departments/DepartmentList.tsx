import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Avatar } from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Modal } from '../../components/ui/Modal';
import { useNotifications } from '../../context/NotificationContext';
import {
  Building2,
  Plus,
  User,
  Hash,
  ChevronRight,
} from 'lucide-react';

export const DepartmentList: React.FC = () => {
  const { departments, users, addDepartment } = useData();
  const { addToast } = useNotifications();

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [managerId, setManagerId] = useState('');

  // Managers dropdown list (users with 'manager' or 'admin' roles)
  const managerUsers = users.filter((u) => u.role === 'manager' || u.role === 'admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !managerId) {
      addToast('All fields are required.', 'danger');
      return;
    }

    addDepartment({
      name,
      code: code.toUpperCase(),
      managerId,
    });

    setIsAddModalOpen(false);
    setName('');
    setCode('');
    setManagerId('');
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Corporate Departments</h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage organizational departments and check their individual compliance levels</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Department
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const manager = users.find((u) => u.id === dept.managerId);

          return (
            <div
              key={dept.id}
              className="bg-white dark:bg-darkbg-card border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover-card-effect space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-primary dark:text-primary-light flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight block">
                        {dept.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mt-0.5">
                        {dept.code}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/80 space-y-3.5">
                  {/* Manager section */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Dept Manager</span>
                    {manager ? (
                      <div className="flex items-center gap-2">
                        <Avatar src={manager.avatar} name={manager.name} size="xs" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{manager.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </div>

                  {/* Compliance Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">Department Compliance</span>
                      <span className={`font-bold ${dept.complianceRate >= 80 ? 'text-success' : dept.complianceRate >= 50 ? 'text-warning' : 'text-danger'}`}>
                        {dept.complianceRate}%
                      </span>
                    </div>
                    <ProgressBar value={dept.complianceRate} size="sm" />
                  </div>
                </div>
              </div>

              <div className="pt-2 text-right">
                <span className="text-[10px] font-bold text-primary dark:text-primary-light hover:underline inline-flex items-center gap-0.5 cursor-pointer">
                  View Audits History
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD DEPARTMENT MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Department">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">Department Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. IT Operations & Security"
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">Department Code</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. IT-SEC"
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block">Dept Manager</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="">Select Manager...</option>
                  {managerUsers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl shadow-sm"
            >
              Create Department
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
