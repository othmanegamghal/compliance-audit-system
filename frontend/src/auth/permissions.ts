import type { UserRole } from '../types';

// Single source of truth for role-based access on the frontend.
// Mirrors the backend require_roles(...) guards. Keep both in sync.

export type Action =
  | 'users.manage'
  | 'departments.manage'
  | 'templates.manage'
  | 'audits.create'
  | 'audits.execute'
  | 'findings.manage'
  | 'actions.manage'
  | 'risks.manage'
  | 'projects.manage'
  | 'documents.manage'
  | 'categories.manage'
  | 'history.view';

const ACTION_ROLES: Record<Action, UserRole[]> = {
  'users.manage': ['admin'],
  'departments.manage': ['admin'],
  'templates.manage': ['admin', 'auditor'],
  'audits.create': ['auditor'],
  'audits.execute': ['auditor'],
  'findings.manage': ['auditor', 'manager'],
  'actions.manage': ['auditor', 'manager'],
  'risks.manage': ['direction', 'auditor', 'manager'],
  'projects.manage': ['admin', 'direction'],
  'documents.manage': ['admin', 'direction', 'auditor'],
  'categories.manage': ['admin', 'direction', 'auditor'],
  'history.view': ['admin', 'direction'],
};

// Which roles can SEE a given nav route (view access, not necessarily edit).
export const NAV_ROLES: Record<string, UserRole[]> = {
  '/': ['admin', 'direction', 'auditor', 'manager'],
  '/audits': ['direction', 'auditor', 'manager'],
  '/templates': ['admin', 'auditor'],
  '/findings': ['direction', 'auditor', 'manager'],
  '/actions': ['direction', 'auditor', 'manager'],
  '/risks': ['direction', 'auditor', 'manager'],
  '/projects': ['admin', 'direction'],
  '/documents': ['admin', 'direction', 'auditor'],
  '/users': ['admin'],
  '/departments': ['admin'],
  '/history': ['admin', 'direction'],
  '/reports': ['admin', 'direction', 'auditor', 'manager'],
  '/settings': ['admin', 'direction', 'auditor', 'manager'],
};

export function can(role: UserRole | undefined, action: Action): boolean {
  if (!role) return false;
  return ACTION_ROLES[action].includes(role);
}

export function canView(role: UserRole | undefined, path: string): boolean {
  if (!role) return false;
  const allowed = NAV_ROLES[path];
  // Unknown/detail routes (e.g. /audits/:id) inherit their base segment.
  if (!allowed) {
    const base = '/' + path.split('/').filter(Boolean)[0];
    return NAV_ROLES[base] ? NAV_ROLES[base].includes(role) : true;
  }
  return allowed.includes(role);
}
