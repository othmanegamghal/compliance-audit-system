export type UserRole = 'admin' | 'auditor' | 'manager' | 'direction';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  language?: string;
  timezone?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId: string;
  complianceRate: number; // calculated compliance rate %
}

export interface Question {
  id: string;
  text: string;
  category: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  createdAt: string;
  createdBy: string;
}

export type AuditStatus = 'draft' | 'in_progress' | 'in_review' | 'closed';

export interface AuditAnswer {
  questionId: string;
  value: 'yes' | 'no' | 'partial' | null;
  comment?: string;
  evidenceFileName?: string;
  evidenceUrl?: string;
}

export interface Audit {
  id: string;
  name: string;
  departmentId: string;
  templateId: string;
  auditorId: string;
  status: AuditStatus;
  createdAt: string;
  completedAt?: string;
  answers: AuditAnswer[];
  score: number; // overall compliance score %
}

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type NonConformityStatus = 'open' | 'action_pending' | 'action_completed' | 'resolved';

export interface NonConformity {
  id: string;
  auditId: string;
  questionId: string;
  description: string;
  severity: SeverityLevel;
  status: NonConformityStatus;
  assignedTo: string; // User ID (manager)
  correctiveActionText?: string;
  correctiveActionDueDate?: string;
  createdAt: string;
  resolvedAt?: string;
  evidenceUrl?: string;
}

export type CorrectiveActionStatus = 'todo' | 'in_progress' | 'in_review' | 'completed';

export interface CorrectiveAction {
  id: string;
  nonConformityId: string;
  text: string;
  status: CorrectiveActionStatus;
  assignee: string; // User ID (manager)
  dueDate: string;
  completedAt?: string;
}

export interface Project {
  id: string;
  departmentId: string;
  name: string;
  description?: string;
  startDate?: string;
  budget?: number;
  priority?: string;
  status?: string;
  objectivesCount: number;
}

export interface Objective {
  id: string;
  projectId: string;
  departmentId: string;
  name: string;
  description?: string;
  targetValue?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface ReferenceDocument {
  id: string;
  projectId: string;
  name: string;
  version?: string;
  type?: string;
  path?: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Risk {
  id: string;
  nonConformityId: string;
  name?: string;
  description?: string;
  impact: number;
  probability: number;
  criticality: number;
  level: RiskLevel;
  status?: string;
}

export interface MitigationPlan {
  id: string;
  riskId: string;
  description?: string;
  dueDate?: string;
  status?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  findingsCount: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  auditId?: string;
  findingId?: string;
  content: string;
  date: string;
}

export interface HistoryEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  description?: string;
  date: string;
  ip?: string;
  auditId?: string;
}

export interface Kpis {
  totalAudits: number;
  auditsInProgress: number;
  auditsClosed: number;
  auditsScheduled: number;
  complianceRate: number;
  totalFindings: number;
  openFindings: number;
  findingsByCategory: Record<string, number>;
  findingsBySeverity: Record<string, number>;
  actionsByStatus: Record<string, number>;
  risksByLevel: Record<string, number>;
  auditorPerformance: { name: string; audits: number }[];
  departmentPerformance: { name: string; compliance: number; audits: number }[];
}

export type NotificationType = 'info' | 'warning' | 'success' | 'danger';

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: NotificationType;
}
