import { createActor } from "../backend";
import type { BackendResult } from "./types";
import { UserRole } from "./types";

export { createActor };

export function unwrapResult<T>(result: BackendResult<T>): T {
  if (result.__kind__ === "ok") return result.ok;
  throw new Error(result.err);
}

export function isOk<T>(
  result: BackendResult<T>,
): result is { __kind__: "ok"; ok: T } {
  return result.__kind__ === "ok";
}

export function isErr<T>(
  result: BackendResult<T>,
): result is { __kind__: "err"; err: string } {
  return result.__kind__ === "err";
}

export const DEMO_USERS = [
  {
    key: "emp1",
    name: "Alice Johnson",
    role: UserRole.Employee,
    email: "alice.johnson@atomquest.com",
    department: "Engineering",
    description: "Software Engineer · Engineering dept · Q1 goals in progress",
  },
  {
    key: "emp2",
    name: "Bob Smith",
    role: UserRole.Employee,
    email: "bob.smith@atomquest.com",
    department: "Operations",
    description: "Operations Analyst · Ops dept · Goals pending approval",
  },
  {
    key: "mgr1",
    name: "Carol Davis",
    role: UserRole.Manager,
    email: "carol.davis@atomquest.com",
    department: "Engineering",
    description: "Engineering Manager · Reviews & approves team goals",
  },
  {
    key: "admin1",
    name: "David HR",
    role: UserRole.Admin,
    email: "david.hr@atomquest.com",
    department: "Human Resources",
    description: "HR Admin · Manages cycles, org hierarchy & audit trails",
  },
] as const;

export type DemoUserKey = (typeof DEMO_USERS)[number]["key"];

export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case UserRole.Employee:
      return "/employee";
    case UserRole.Manager:
      return "/manager";
    case UserRole.Admin:
      return "/admin";
  }
}
