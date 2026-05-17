import { Outlet } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Sidebar } from "./Sidebar";

const periodLabels: Record<string, string> = {
  Q1: "Q1 Check-in (July)",
  Q2: "Q2 Check-in (October)",
  Q3: "Q3 Check-in (January)",
  Q4Annual: "Q4 / Annual (March-April)",
};

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const currentUser = useAuthStore((s) => s.currentUser);
  const currentPeriod = "Q1";

  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        user={currentUser}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border shadow-subtle flex items-center justify-between px-6 py-3 flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Active Period
            </span>
            <span className="text-sm font-semibold text-foreground">
              {periodLabels[currentPeriod]}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Notifications"
              className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-smooth"
              data-ocid="header.notifications_button"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-medium text-foreground leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {currentUser.department}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto bg-background"
          data-ocid="main.content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
