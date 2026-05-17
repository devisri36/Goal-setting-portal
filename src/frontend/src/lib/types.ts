import type {
  Achievement,
  AchievementReportRow,
  AuditLog,
  CompletionDashboardRow,
  Goal,
  ManagerCheckIn,
  ThrustArea,
  User,
} from "../backend";
import {
  AchievementStatus,
  CheckInPeriod,
  GoalStatus,
  UoMDirection,
  UoMType,
  UserRole,
} from "../backend";

export type {
  User,
  Goal,
  Achievement,
  ManagerCheckIn,
  AuditLog,
  AchievementReportRow,
  CompletionDashboardRow,
  ThrustArea,
};
export {
  UserRole,
  UoMType,
  UoMDirection,
  GoalStatus,
  AchievementStatus,
  CheckInPeriod,
};

export type BackendResult<T> =
  | { __kind__: "ok"; ok: T }
  | { __kind__: "err"; err: string };

export type NavItem = {
  label: string;
  path: string;
  icon: string;
};

export type DemoUser = {
  key: string;
  name: string;
  role: UserRole;
  email: string;
  department: string;
  description: string;
};
