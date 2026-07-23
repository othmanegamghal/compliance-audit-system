import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  User,
  Department,
  ChecklistTemplate,
  Audit,
  AuditAnswer,
  NonConformity,
  CorrectiveAction,
  NonConformityStatus,
  CorrectiveActionStatus,
} from '../types';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';
import { usersApi, type NewUser } from '../api/users';
import { departmentsApi } from '../api/departments';
import { templatesApi } from '../api/templates';
import { auditsApi } from '../api/audits';
import { findingsApi } from '../api/findings';
import { actionsApi } from '../api/actions';
import { apiErrorMessage } from '../api/client';

interface DataContextType {
  users: User[];
  departments: Department[];
  templates: ChecklistTemplate[];
  audits: Audit[];
  findings: NonConformity[];
  actions: CorrectiveAction[];
  loading: boolean;

  // Data actions
  refresh: () => Promise<void>;
  addUser: (user: NewUser) => Promise<void>;
  editUser: (id: string, user: Partial<User>) => Promise<void>;
  addDepartment: (dept: Omit<Department, 'id' | 'complianceRate'>) => Promise<void>;
  createTemplate: (template: Omit<ChecklistTemplate, 'id' | 'createdAt'>) => Promise<void>;
  createAudit: (audit: Omit<Audit, 'id' | 'createdAt' | 'score' | 'answers'>) => Promise<Audit>;
  saveAuditAnswers: (auditId: string, answers: AuditAnswer[], isFinalSubmit?: boolean) => Promise<void>;
  updateFindingStatus: (id: string, status: NonConformityStatus, correctiveActionText?: string, correctiveActionDueDate?: string) => Promise<void>;
  updateActionStatus: (id: string, status: CorrectiveActionStatus) => Promise<void>;
  createCorrectiveAction: (action: Omit<CorrectiveAction, 'id'>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { addToast, refreshNotifications } = useNotifications();

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [findings, setFindings] = useState<NonConformity[]>([]);
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [u, d, t, a, f, ac] = await Promise.all([
        usersApi.list(),
        departmentsApi.list(),
        templatesApi.list(),
        auditsApi.list(),
        findingsApi.list(),
        actionsApi.list(),
      ]);
      setUsers(u);
      setDepartments(d);
      setTemplates(t);
      setAudits(a);
      setFindings(f);
      setActions(ac);
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to load data from the server.'), 'danger');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Load everything once the user is authenticated.
  useEffect(() => {
    if (currentUser) {
      refresh();
    } else {
      setUsers([]);
      setDepartments([]);
      setTemplates([]);
      setAudits([]);
      setFindings([]);
      setActions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const addUser = async (newUser: NewUser) => {
    try {
      const user = await usersApi.create(newUser);
      setUsers((prev) => [...prev, user]);
      addToast(`User ${user.name} has been added successfully.`, 'success', 'User Added');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to add user.'), 'danger');
    }
  };

  const editUser = async (id: string, updatedFields: Partial<User>) => {
    try {
      const user = await usersApi.update(id, updatedFields);
      setUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
      addToast('User profile updated.', 'info', 'User Updated');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to update user.'), 'danger');
    }
  };

  const addDepartment = async (newDept: Omit<Department, 'id' | 'complianceRate'>) => {
    try {
      const dept = await departmentsApi.create(newDept);
      setDepartments((prev) => [...prev, dept]);
      addToast(`${dept.name} department added.`, 'success', 'Department Created');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to create department.'), 'danger');
    }
  };

  const createTemplate = async (newTemplate: Omit<ChecklistTemplate, 'id' | 'createdAt'>) => {
    try {
      const template = await templatesApi.create(newTemplate);
      setTemplates((prev) => [...prev, template]);
      addToast(`Template "${template.name}" is now available.`, 'success', 'Template Created');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to create template.'), 'danger');
    }
  };

  const createAudit = async (newAudit: Omit<Audit, 'id' | 'createdAt' | 'score' | 'answers'>): Promise<Audit> => {
    const audit = await auditsApi.create(newAudit);
    setAudits((prev) => [audit, ...prev]);
    addToast(`New audit "${audit.name}" initialized.`, 'info', 'Audit Created');
    return audit;
  };

  const saveAuditAnswers = async (auditId: string, answers: AuditAnswer[], isFinalSubmit?: boolean) => {
    try {
      const updatedAudit = await auditsApi.saveAnswers(auditId, answers, isFinalSubmit);
      setAudits((prev) => prev.map((a) => (a.id === auditId ? updatedAudit : a)));

      if (isFinalSubmit) {
        // Findings / department rates may have changed server-side — reload them.
        const [f, d] = await Promise.all([findingsApi.list(), departmentsApi.list()]);
        setFindings(f);
        setDepartments(d);
        await refreshNotifications();

        const raisedCount = f.filter((finding) => finding.auditId === auditId).length;
        if (raisedCount > 0) {
          addToast(
            `${raisedCount} Non-Conformities were automatically raised for this audit.`,
            'warning',
            'Findings Raised'
          );
        } else {
          addToast('Audit completed with 100% compliance. Great work!', 'success', 'Audit Completed');
        }
      } else {
        addToast('Draft audit answers saved successfully.', 'info');
      }
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to save audit answers.'), 'danger');
    }
  };

  const updateFindingStatus = async (
    id: string,
    status: NonConformityStatus,
    correctiveActionText?: string,
    correctiveActionDueDate?: string
  ) => {
    try {
      const finding = await findingsApi.updateStatus(id, status, correctiveActionText, correctiveActionDueDate);
      setFindings((prev) => prev.map((f) => (f.id === id ? finding : f)));

      // A corrective action may have been auto-created server-side.
      if (status === 'action_pending' && correctiveActionText) {
        const refreshed = await actionsApi.list();
        setActions(refreshed);
      }
      addToast(`Non-Conformity status updated to ${status}.`, 'info', 'Finding Updated');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to update finding.'), 'danger');
    }
  };

  const updateActionStatus = async (id: string, status: CorrectiveActionStatus) => {
    try {
      const action = await actionsApi.updateStatus(id, status);
      setActions((prev) => prev.map((a) => (a.id === id ? action : a)));

      // Completing an action may cascade to the finding status.
      if (status === 'completed') {
        const refreshed = await findingsApi.list();
        setFindings(refreshed);
        await refreshNotifications();
      }
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to update action.'), 'danger');
    }
  };

  const createCorrectiveAction = async (newAction: Omit<CorrectiveAction, 'id'>) => {
    try {
      const action = await actionsApi.create(newAction);
      setActions((prev) => [...prev, action]);
      addToast('New corrective action successfully created.', 'success', 'Action Assigned');
    } catch (err) {
      addToast(apiErrorMessage(err, 'Failed to create corrective action.'), 'danger');
    }
  };

  return (
    <DataContext.Provider
      value={{
        users,
        departments,
        templates,
        audits,
        findings,
        actions,
        loading,
        refresh,
        addUser,
        editUser,
        addDepartment,
        createTemplate,
        createAudit,
        saveAuditAnswers,
        updateFindingStatus,
        updateActionStatus,
        createCorrectiveAction,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
