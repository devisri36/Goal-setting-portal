import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useCompletionDashboard } from "../../hooks/useAdmin";

function StatCard({
  title,
  value,
  sub,
  icon,
  accent,
  loading,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  loading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold font-display text-foreground">
                {value}
              </p>
            )}
            {sub && !loading && (
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            )}
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const quickLinks = [
  {
    title: "Completion Dashboard",
    description: "Track which employees and managers have completed check-ins",
    icon: <CheckCircle2 size={20} />,
    path: "/admin/cycles",
    color: "bg-chart-2/15 text-chart-2",
  },
  {
    title: "Achievement Report",
    description: "Export Planned vs. Actual achievement for all employees",
    icon: <FileText size={20} />,
    path: "/admin/reporting",
    color: "bg-primary/15 text-primary",
  },
  {
    title: "Audit Trail",
    description: "Field-level log of all post-lock changes",
    icon: <Shield size={20} />,
    path: "/admin/audit",
    color: "bg-destructive/15 text-destructive",
  },
  {
    title: "Analytics",
    description: "QoQ trends, heatmaps, goal distribution analysis",
    icon: <TrendingUp size={20} />,
    path: "/admin/analytics",
    color: "bg-chart-4/15 text-chart-4",
  },
];

export default function AdminDashboard() {
  const { data: rows, isLoading } = useCompletionDashboard();

  const stats = useMemo(() => {
    if (!rows || rows.length === 0)
      return { total: 0, submitted: 0, approved: 0, q1Done: 0, pending: 0 };
    const total = rows.length;
    const submitted = rows.filter((r) => r.submitted).length;
    const approved = rows.filter((r) => r.approved).length;
    const q1Done = rows.filter((r) => r.q1Done).length;
    const pending = total - approved;
    return { total, submitted, approved, q1Done, pending };
  }, [rows]);

  const pendingApproval = useMemo(
    () => (rows ?? []).filter((r) => r.submitted && !r.approved).slice(0, 5),
    [rows],
  );

  return (
    <div className="p-6 space-y-6" data-ocid="admin_dashboard.page">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organisation-wide goal progress overview
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-semibold">
          <Clock size={11} className="mr-1" />
          Q1 Active Period
        </Badge>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        data-ocid="admin_dashboard.stats"
      >
        <StatCard
          title="Total Employees"
          value={isLoading ? "—" : stats.total}
          sub="Active in system"
          icon={<Users size={18} />}
          accent="bg-primary/15 text-primary"
          loading={isLoading}
        />
        <StatCard
          title="Goals Submitted"
          value={isLoading ? "—" : stats.submitted}
          sub={`of ${stats.total} employees`}
          icon={<FileText size={18} />}
          accent="bg-chart-2/15 text-chart-2"
          loading={isLoading}
        />
        <StatCard
          title="Goals Approved"
          value={isLoading ? "—" : stats.approved}
          sub={`${stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% completion`}
          icon={<CheckCircle2 size={18} />}
          accent="bg-chart-3/15 text-chart-3"
          loading={isLoading}
        />
        <StatCard
          title="Q1 Check-ins Done"
          value={isLoading ? "—" : stats.q1Done}
          sub="Progress captured"
          icon={<BarChart3 size={18} />}
          accent="bg-chart-4/15 text-chart-4"
          loading={isLoading}
        />
      </div>

      {/* Pending approvals spotlight */}
      {pendingApproval.length > 0 && (
        <Card
          className="border-amber-200 bg-amber-50/50"
          data-ocid="admin_dashboard.pending_card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
              <AlertCircle size={16} />
              {pendingApproval.length} Employee
              {pendingApproval.length > 1 ? "s" : ""} Awaiting Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {pendingApproval.map((row, i) => (
                <div
                  key={row.user.id.toString()}
                  className="flex items-center justify-between text-sm"
                  data-ocid={`admin_dashboard.pending_item.${i + 1}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-[10px]">
                      {row.user.name.charAt(0)}
                    </div>
                    <span className="font-medium text-foreground">
                      {row.user.name}
                    </span>
                    <span className="text-muted-foreground">
                      · {row.user.department}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-amber-700 border-amber-300 text-[10px]"
                  >
                    Submitted
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick navigation */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Access
        </h2>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          data-ocid="admin_dashboard.quick_links"
        >
          {quickLinks.map((link, i) => (
            <Link
              key={link.path}
              to={link.path}
              data-ocid={`admin_dashboard.quick_link.${i + 1}`}
            >
              <Card className="hover:shadow-md transition-smooth group cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${link.color}`}
                    >
                      {link.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">
                        {link.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {link.description}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-muted-foreground group-hover:text-foreground transition-colors mt-1 flex-shrink-0"
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
