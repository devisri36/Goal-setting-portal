import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { Layout } from "./components/layout/Layout";
import { UserRole } from "./lib/types";
import LandingPage from "./pages/LandingPage";
import AchievementReport from "./pages/admin/AchievementReport";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Analytics from "./pages/admin/Analytics";
import AuditTrail from "./pages/admin/AuditTrail";
import CompletionDashboard from "./pages/admin/CompletionDashboard";
import GoalCycles from "./pages/admin/GoalCycles";
import CheckIns from "./pages/employee/CheckIns";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import GoalSheet from "./pages/employee/GoalSheet";
import ApprovalsQueue from "./pages/manager/ApprovalsQueue";
import ManagerCheckIns from "./pages/manager/ManagerCheckIns";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import TeamGoals from "./pages/manager/TeamGoals";
import { useAuth, useAuthStore } from "./store/authStore";

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { loadCurrentUser } = useAuth();
  // biome-ignore lint/correctness/useExhaustiveDependencies: load once on mount
  useEffect(() => {
    loadCurrentUser();
  }, []);
  return <>{children}</>;
}

function requireAuth(requiredRole?: UserRole) {
  const currentUser = useAuthStore.getState().currentUser;
  if (!currentUser) {
    throw redirect({ to: "/" });
  }
  if (requiredRole && currentUser.role !== requiredRole) {
    const paths: Record<UserRole, string> = {
      [UserRole.Employee]: "/employee/goals",
      [UserRole.Manager]: "/manager/team",
      [UserRole.Admin]: "/admin/dashboard",
    };
    throw redirect({ to: paths[currentUser.role] });
  }
}

// Root
const rootRoute = createRootRoute({
  component: () => (
    <AppInitializer>
      <Outlet />
      <Toaster position="top-right" richColors />
    </AppInitializer>
  ),
});

// Public
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

// Employee layout route
const employeeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/employee",
  beforeLoad: () => requireAuth(UserRole.Employee),
  component: Layout,
});

const employeeIndexRoute = createRoute({
  getParentRoute: () => employeeRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/employee/dashboard" });
  },
  component: () => null,
});

const employeeDashboardRoute = createRoute({
  getParentRoute: () => employeeRoute,
  path: "dashboard",
  component: EmployeeDashboard,
});

const employeeGoalsRoute = createRoute({
  getParentRoute: () => employeeRoute,
  path: "goals",
  component: GoalSheet,
});

const employeeCheckinsRoute = createRoute({
  getParentRoute: () => employeeRoute,
  path: "checkins",
  component: CheckIns,
});

// Manager layout route
const managerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/manager",
  beforeLoad: () => requireAuth(UserRole.Manager),
  component: Layout,
});

const managerIndexRoute = createRoute({
  getParentRoute: () => managerRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/manager/team" });
  },
  component: () => null,
});

const managerTeamRoute = createRoute({
  getParentRoute: () => managerRoute,
  path: "team",
  component: TeamGoals,
});

const managerApprovalsRoute = createRoute({
  getParentRoute: () => managerRoute,
  path: "approvals",
  component: ApprovalsQueue,
});

const managerCheckinsRoute = createRoute({
  getParentRoute: () => managerRoute,
  path: "checkins",
  component: ManagerCheckIns,
});

// Admin layout route
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: () => requireAuth(UserRole.Admin),
  component: Layout,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard" });
  },
  component: () => null,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "dashboard",
  component: AdminDashboard,
});

const adminCyclesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "cycles",
  component: GoalCycles,
});

const adminReportingRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "reporting",
  component: AchievementReport,
});

const adminAuditRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "audit",
  component: AuditTrail,
});

const adminAnalyticsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "analytics",
  component: Analytics,
});

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  employeeRoute.addChildren([
    employeeIndexRoute,
    employeeDashboardRoute,
    employeeGoalsRoute,
    employeeCheckinsRoute,
  ]),
  managerRoute.addChildren([
    managerIndexRoute,
    managerTeamRoute,
    managerApprovalsRoute,
    managerCheckinsRoute,
  ]),
  adminRoute.addChildren([
    adminIndexRoute,
    adminDashboardRoute,
    adminCyclesRoute,
    adminReportingRoute,
    adminAuditRoute,
    adminAnalyticsRoute,
  ]),
  catchAllRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
