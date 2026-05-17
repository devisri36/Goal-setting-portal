import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarCheck,
  ChevronLeft,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { UserRole } from "../../lib/types";
import type { User } from "../../lib/types";
import { useAuth } from "../../store/authStore";

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

const employeeNav: NavItem[] = [
  { label: "My Goals", path: "/employee/goals", icon: <Target size={18} /> },
  {
    label: "Check-ins",
    path: "/employee/checkins",
    icon: <CalendarCheck size={18} />,
  },
];

const managerNav: NavItem[] = [
  { label: "My Team", path: "/manager/team", icon: <Users size={18} /> },
  {
    label: "Approvals",
    path: "/manager/approvals",
    icon: <ClipboardCheck size={18} />,
  },
  {
    label: "Check-ins",
    path: "/manager/checkins",
    icon: <CalendarCheck size={18} />,
  },
];

const adminNav: NavItem[] = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  { label: "Goal Cycles", path: "/admin/cycles", icon: <Settings size={18} /> },
  {
    label: "Reporting",
    path: "/admin/reporting",
    icon: <FileText size={18} />,
  },
  { label: "Audit Trail", path: "/admin/audit", icon: <Shield size={18} /> },
  {
    label: "Analytics",
    path: "/admin/analytics",
    icon: <TrendingUp size={18} />,
  },
];

function getRoleNav(role: UserRole): NavItem[] {
  if (role === UserRole.Employee) return employeeNav;
  if (role === UserRole.Manager) return managerNav;
  return adminNav;
}

const roleBadgeConfig: Record<UserRole, { label: string; color: string }> = {
  [UserRole.Employee]: {
    label: "Employee",
    color: "bg-chart-2/20 text-chart-2",
  },
  [UserRole.Manager]: { label: "Manager", color: "bg-chart-4/20 text-chart-4" },
  [UserRole.Admin]: {
    label: "Admin / HR",
    color: "bg-destructive/20 text-destructive",
  },
};

interface SidebarProps {
  user: User;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ user, collapsed, onToggle }: SidebarProps) {
  const navItems = getRoleNav(user.role);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const badge = roleBadgeConfig[user.role];

  return (
    <aside
      className={`flex flex-col h-full bg-sidebar transition-smooth ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header / Branding */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sidebar-primary font-display font-bold text-sm leading-tight truncate">
              ATOMQUEST
            </span>
            <span className="text-sidebar-foreground/60 text-[10px] font-medium uppercase tracking-widest">
              Goal Portal
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-smooth p-1 rounded-md hover:bg-sidebar-accent ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-ocid="sidebar.toggle"
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold text-xs flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sidebar-foreground text-sm font-medium truncate">
                {user.name}
              </p>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.color}`}
              >
                {badge.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPath.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              data-ocid={`sidebar.nav.${item.label.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 border-t border-sidebar-border pt-3">
        <button
          type="button"
          onClick={handleLogout}
          data-ocid="sidebar.logout_button"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-destructive transition-smooth"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
