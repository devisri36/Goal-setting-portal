import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useAchievementReport,
  useAllUsers,
  useCompletionDashboard,
} from "../../hooks/useAdmin";
import { CheckInPeriod, GoalStatus, UoMType } from "../../lib/types";
import type { AchievementReportRow, Goal } from "../../lib/types";

// ─── Palette ─────────────────────────────────────────────────────────────────
const TEAL_PALETTE = [
  "#0d9488", // teal-600
  "#14b8a6", // teal-500
  "#2dd4bf", // teal-400
  "#5eead4", // teal-300
  "#99f6e4", // teal-200
  "#f59e0b", // amber
  "#6366f1", // indigo
  "#ec4899", // pink
];

const STATUS_COLORS: Record<string, string> = {
  Draft: "#94a3b8",
  Submitted: "#f59e0b",
  UnderReview: "#6366f1",
  ApprovedLocked: "#0d9488",
  ReturnedForRework: "#ef4444",
};

const UOM_COLORS: Record<string, string> = {
  Numeric: "#0d9488",
  Percent: "#14b8a6",
  Timeline: "#6366f1",
  ZeroBased: "#f59e0b",
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md text-xs">
      {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-primary" />
      </div>
      <div>
        <h2 className="font-display text-base font-semibold text-foreground">
          {title}
        </h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// ─── Helper: compute avg progress from achievement report ─────────────────────
function avgProgressFromReport(report: AchievementReportRow[]): number {
  if (!report.length) return 0;
  let total = 0;
  let count = 0;
  for (const row of report) {
    for (const ach of row.achievements) {
      total += ach.progressScore;
      count++;
    }
  }
  return count > 0 ? (total / count) * 100 : 0;
}

// ─── Helper: extract all goals from all period reports ────────────────────────
function goalsFromReport(report: AchievementReportRow[]): Goal[] {
  const seen = new Set<string>();
  const goals: Goal[] = [];
  for (const row of report) {
    for (const g of row.goals) {
      if (!seen.has(g.id)) {
        seen.add(g.id);
        goals.push(g);
      }
    }
  }
  return goals;
}

// ─── QoQ Trend Chart ─────────────────────────────────────────────────────────
function QoQTrendChart() {
  const q1 = useAchievementReport(CheckInPeriod.Q1);
  const q2 = useAchievementReport(CheckInPeriod.Q2);
  const q3 = useAchievementReport(CheckInPeriod.Q3);
  const q4 = useAchievementReport(CheckInPeriod.Q4Annual);

  const isLoading =
    q1.isLoading || q2.isLoading || q3.isLoading || q4.isLoading;

  // Per-department breakdown
  const chartData = useMemo(() => {
    const reports = [
      { period: "Q1 (Jul)", data: q1.data ?? [] },
      { period: "Q2 (Oct)", data: q2.data ?? [] },
      { period: "Q3 (Jan)", data: q3.data ?? [] },
      { period: "Q4 (Apr)", data: q4.data ?? [] },
    ];

    // Collect all departments
    const deptSet = new Set<string>();
    for (const { data } of reports) {
      for (const row of data) deptSet.add(row.user.department || "General");
    }
    const depts = Array.from(deptSet);

    return reports.map(({ period, data }) => {
      const entry: Record<string, string | number> = { period };
      if (depts.length === 0 || data.length === 0) {
        entry.Overall = +avgProgressFromReport(data).toFixed(1);
      } else {
        for (const dept of depts) {
          const rows = data.filter(
            (r) => (r.user.department || "General") === dept,
          );
          entry[dept] = +avgProgressFromReport(rows).toFixed(1);
        }
      }
      return entry;
    });
  }, [q1.data, q2.data, q3.data, q4.data]);

  const lines = useMemo(() => {
    if (!chartData.length) return ["Overall"];
    const keys = Object.keys(chartData[0]).filter((k) => k !== "period");
    return keys.length ? keys : ["Overall"];
  }, [chartData]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  const hasData = chartData.some((d) =>
    Object.entries(d).some(([k, v]) => k !== "period" && (v as number) > 0),
  );

  return (
    <Card data-ocid="analytics.qoq_chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Average Progress Score by Quarter
        </CardTitle>
        <CardDescription className="text-xs">
          Achievement ÷ Target × 100, averaged across employees per quarter
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-56 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <TrendingUp size={32} className="opacity-30" />
            <p className="text-sm font-medium">No achievement data yet</p>
            <p className="text-xs">
              Scores will appear once employees log quarterly check-ins
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {lines.map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={TEAL_PALETTE[i % TEAL_PALETTE.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Goal Distribution Charts ─────────────────────────────────────────────────
function GoalDistributionCharts() {
  const q1 = useAchievementReport(CheckInPeriod.Q1);
  const isLoading = q1.isLoading;

  const { byStatus, byUoM, byThrust } = useMemo(() => {
    const goals = goalsFromReport(q1.data ?? []);

    const statusCount: Record<string, number> = {};
    const uomCount: Record<string, number> = {};
    const thrustCount: Record<string, number> = {};

    for (const g of goals) {
      statusCount[g.status] = (statusCount[g.status] ?? 0) + 1;
      uomCount[g.uomType] = (uomCount[g.uomType] ?? 0) + 1;
      const thrustLabel = g.thrustAreaId || "Unassigned";
      thrustCount[thrustLabel] = (thrustCount[thrustLabel] ?? 0) + 1;
    }

    return {
      byStatus: Object.entries(statusCount).map(([name, value]) => ({
        name,
        value,
      })),
      byUoM: Object.entries(uomCount).map(([name, value]) => ({ name, value })),
      byThrust: Object.entries(thrustCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value })),
    };
  }, [q1.data]);

  // Sample data when no real data
  const sampleStatus = [
    { name: "Draft", value: 3 },
    { name: "Submitted", value: 5 },
    { name: "ApprovedLocked", value: 12 },
    { name: "UnderReview", value: 2 },
  ];
  const sampleUoM = [
    { name: "Numeric", value: 8 },
    { name: "Percent", value: 6 },
    { name: "Timeline", value: 4 },
    { name: "ZeroBased", value: 2 },
  ];

  const statusData = byStatus.length ? byStatus : sampleStatus;
  const uomData = byUoM.length ? byUoM : sampleUoM;
  const isSample = !byStatus.length;

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      data-ocid="analytics.goal_distribution"
    >
      {/* By Status — Pie */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Goals by Status
          </CardTitle>
          {isSample && (
            <Badge variant="outline" className="text-[10px] w-fit">
              Sample data
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-52 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] ?? TEAL_PALETTE[0]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* By UoM — Bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Goals by Measurement Type
          </CardTitle>
          {isSample && (
            <Badge variant="outline" className="text-[10px] w-fit">
              Sample data
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-52 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={uomData}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {uomData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={UOM_COLORS[entry.name] ?? TEAL_PALETTE[0]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* By Thrust Area — horizontal bar */}
      {byThrust.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Goals by Thrust Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer
              width="100%"
              height={Math.max(140, byThrust.length * 36)}
            >
              <BarChart
                data={byThrust}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  fill={TEAL_PALETTE[0]}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Completion Heatmap ───────────────────────────────────────────────────────
function CompletionHeatmap() {
  const { data: rows, isLoading } = useCompletionDashboard();

  const periods = [
    { key: "submitted", label: "Goal Set" },
    { key: "approved", label: "Approved" },
    { key: "q1Done", label: "Q1" },
    { key: "q2Done", label: "Q2" },
    { key: "q3Done", label: "Q3" },
    { key: "q4Done", label: "Q4" },
  ] as const;

  // Completion % per period
  // biome-ignore lint/correctness/useExhaustiveDependencies: periods is a stable const defined outside useMemo
  const summaryBars = useMemo(() => {
    if (!rows?.length) return [];
    return periods.map(({ key, label }) => ({
      label,
      pct: +((rows.filter((r) => r[key]).length / rows.length) * 100).toFixed(
        1,
      ),
    }));
  }, [rows]);

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-4" data-ocid="analytics.heatmap">
      {/* Progress bar summary */}
      {summaryBars.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Completion Rate by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={summaryBars}
                margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="pct"
                  name="Completion %"
                  fill={TEAL_PALETTE[0]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Heatmap grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Per-Employee Progress Heatmap
          </CardTitle>
          <CardDescription className="text-xs">
            <span className="inline-flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />{" "}
                Done
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />{" "}
                Partial / Submitted
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" />{" "}
                Not Started
              </span>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!rows?.length ? (
            <div
              className="py-12 text-center text-muted-foreground"
              data-ocid="analytics.heatmap.empty_state"
            >
              <Users size={32} className="mx-auto opacity-30 mb-2" />
              <p className="text-sm">No employee data available yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[140px]">
                      Employee
                    </th>
                    {periods.map(({ label }) => (
                      <th
                        key={label}
                        className="text-center px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.user.id.toString()}
                      className="border-b border-border hover:bg-muted/20 transition-colors"
                      data-ocid={`analytics.heatmap.row.${i + 1}`}
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-[10px] flex-shrink-0">
                            {row.user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {row.user.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {row.user.department}
                            </p>
                          </div>
                        </div>
                      </td>
                      {periods.map(({ key, label }) => {
                        const done = row[key];
                        const isApproved = key === "approved" && row.approved;
                        const isSubmitted =
                          key === "submitted" && row.submitted;
                        let bg = "bg-rose-100 text-rose-600";
                        let title = "Not started";
                        if (done) {
                          bg = "bg-emerald-100 text-emerald-700";
                          title = "Complete";
                        } else if (isSubmitted || isApproved) {
                          bg = "bg-amber-100 text-amber-700";
                          title = "In progress";
                        }
                        return (
                          <td key={label} className="text-center px-3 py-2">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-sm text-[9px] font-bold ${bg}`}
                              title={title}
                            >
                              {done ? "✓" : "–"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Manager Effectiveness ────────────────────────────────────────────────────
function ManagerEffectiveness() {
  const { data: rows, isLoading: loadingCompletion } = useCompletionDashboard();
  const { data: users, isLoading: loadingUsers } = useAllUsers();
  const isLoading = loadingCompletion || loadingUsers;

  const managerData = useMemo(() => {
    if (!rows?.length || !users?.length) return [];

    // Group employees by manager
    const managerMap = new Map<
      string,
      { name: string; total: number; approved: number; checkIns: number }
    >();

    for (const row of rows) {
      const emp = users.find((u) => u.id.toString() === row.user.id.toString());
      if (!emp?.managerId) continue;
      const managerId = emp.managerId.toString();
      const manager = users.find((u) => u.id.toString() === managerId);
      if (!manager) continue;

      if (!managerMap.has(managerId)) {
        managerMap.set(managerId, {
          name: manager.name,
          total: 0,
          approved: 0,
          checkIns: 0,
        });
      }
      const m = managerMap.get(managerId)!;
      m.total++;
      if (row.approved) m.approved++;
      const checkInsDone = [
        row.q1Done,
        row.q2Done,
        row.q3Done,
        row.q4Done,
      ].filter(Boolean).length;
      m.checkIns += checkInsDone;
    }

    return Array.from(managerMap.values()).map((m) => ({
      name: m.name,
      approvalRate: m.total ? +((m.approved / m.total) * 100).toFixed(1) : 0,
      checkInRate: m.total
        ? +((m.checkIns / (m.total * 4)) * 100).toFixed(1)
        : 0,
      teamSize: m.total,
    }));
  }, [rows, users]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  return (
    <Card data-ocid="analytics.manager_effectiveness">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Manager Effectiveness
        </CardTitle>
        <CardDescription className="text-xs">
          Approval rates and check-in completion rates per L1 manager
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!managerData.length ? (
          <div
            className="py-12 text-center text-muted-foreground"
            data-ocid="analytics.manager.empty_state"
          >
            <Users size={32} className="mx-auto opacity-30 mb-2" />
            <p className="text-sm font-medium">No manager data available</p>
            <p className="text-xs mt-1">
              Metrics appear once employees are assigned to managers
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer
              width="100%"
              height={Math.max(160, managerData.length * 52)}
            >
              <BarChart
                data={managerData}
                margin={{ top: 4, right: 16, left: -8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar
                  dataKey="approvalRate"
                  name="Approval Rate %"
                  fill={TEAL_PALETTE[0]}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="checkInRate"
                  name="Check-in Rate %"
                  fill={TEAL_PALETTE[2]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Summary table */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="text-left px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Manager
                    </th>
                    <th className="text-center px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Team Size
                    </th>
                    <th className="text-center px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Approval Rate
                    </th>
                    <th className="text-center px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Check-in Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {managerData.map((m, i) => (
                    <tr
                      key={m.name}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      data-ocid={`analytics.manager.row.${i + 1}`}
                    >
                      <td className="px-4 py-2 font-medium text-foreground">
                        {m.name}
                      </td>
                      <td className="px-3 py-2 text-center">{m.teamSize}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            m.approvalRate >= 80
                              ? "bg-emerald-100 text-emerald-700"
                              : m.approvalRate >= 50
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {m.approvalRate}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            m.checkInRate >= 80
                              ? "bg-emerald-100 text-emerald-700"
                              : m.checkInRate >= 40
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {m.checkInRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Analytics() {
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto" data-ocid="analytics.page">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Quarter-on-Quarter trends, goal distribution, and manager
          effectiveness insights
        </p>
      </div>

      {/* Section 1 — QoQ Trends */}
      <section data-ocid="analytics.qoq_section">
        <SectionHeader
          icon={TrendingUp}
          title="Quarter-on-Quarter Achievement Trends"
          description="Average progress scores per quarter, broken down by department"
        />
        <QoQTrendChart />
      </section>

      {/* Section 2 — Goal Distribution */}
      <section data-ocid="analytics.distribution_section">
        <SectionHeader
          icon={PieIcon}
          title="Goal Distribution Analysis"
          description="Breakdown of goals by status, measurement type, and thrust area"
        />
        <GoalDistributionCharts />
      </section>

      {/* Section 3 — Completion Heatmap */}
      <section data-ocid="analytics.heatmap_section">
        <SectionHeader
          icon={BarChart2}
          title="Completion Heatmap"
          description="Per-employee, per-period progress colour-coded by completion status"
        />
        <CompletionHeatmap />
      </section>

      {/* Section 4 — Manager Effectiveness */}
      <section data-ocid="analytics.manager_section">
        <SectionHeader
          icon={Users}
          title="Manager Effectiveness"
          description="Check-in completion rates and approval metrics per L1 manager"
        />
        <ManagerEffectiveness />
      </section>
    </div>
  );
}
