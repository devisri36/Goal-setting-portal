import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  FileBarChart,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAchievementReport } from "../../hooks/useAdmin";
import { CheckInPeriod, type UoMType } from "../../lib/types";
import type { Achievement, AchievementReportRow, Goal } from "../../lib/types";

const PERIOD_LABELS: Record<CheckInPeriod, string> = {
  [CheckInPeriod.Q1]: "Q1 (July)",
  [CheckInPeriod.Q2]: "Q2 (October)",
  [CheckInPeriod.Q3]: "Q3 (January)",
  [CheckInPeriod.Q4Annual]: "Q4 / Annual (March-April)",
};

interface FlatRow {
  employeeName: string;
  department: string;
  goalTitle: string;
  uomType: UoMType;
  target: number;
  actual: number;
  progressScore: number;
  status: string;
}

function flattenRows(rows: AchievementReportRow[]): FlatRow[] {
  const flat: FlatRow[] = [];
  for (const row of rows) {
    const { user, goals, achievements } = row;
    for (const goal of goals) {
      const ach = achievements.find((a) => a.goalId === goal.id);
      flat.push({
        employeeName: user.name,
        department: user.department,
        goalTitle: goal.title,
        uomType: goal.uomType,
        target: goal.target,
        actual: ach?.actual ?? 0,
        progressScore: ach?.progressScore ?? 0,
        status: ach?.achievementStatus ?? "NotStarted",
      });
    }
  }
  return flat;
}

function downloadCSV(rows: FlatRow[], period: string) {
  const headers = [
    "Employee",
    "Department",
    "Goal",
    "UoM",
    "Target",
    "Actual",
    "Progress Score (%)",
    "Status",
  ];
  const lines = rows.map((r) =>
    [
      `"${r.employeeName}"`,
      `"${r.department}"`,
      `"${r.goalTitle}"`,
      r.uomType,
      r.target,
      r.actual,
      (r.progressScore * 100).toFixed(1),
      r.status,
    ].join(","),
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `achievement_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ScorePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 90
      ? "bg-chart-2/15 text-chart-2"
      : pct >= 60
        ? "bg-chart-4/15 text-chart-4"
        : "bg-destructive/15 text-destructive";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}
    >
      {pct >= 60 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {pct}%
    </span>
  );
}

const STATUS_LABELS: Record<string, string> = {
  OnTrack: "On Track",
  Completed: "Completed",
  NotStarted: "Not Started",
};

export default function AchievementReport() {
  const [period, setPeriod] = useState<CheckInPeriod>(CheckInPeriod.Q1);
  const [search, setSearch] = useState("");
  const { data: rows, isLoading } = useAchievementReport(period);

  const flat = useMemo(() => flattenRows(rows ?? []), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? flat.filter(
          (r) =>
            r.employeeName.toLowerCase().includes(q) ||
            r.goalTitle.toLowerCase().includes(q) ||
            r.department.toLowerCase().includes(q),
        )
      : flat;
  }, [flat, search]);

  const avgScore = useMemo(() => {
    if (filtered.length === 0) return 0;
    return filtered.reduce((s, r) => s + r.progressScore, 0) / filtered.length;
  }, [filtered]);

  return (
    <div className="p-6 space-y-6" data-ocid="achievement_report.page">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Achievement Report
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Planned vs. Actual achievement across all employees
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as CheckInPeriod)}
          >
            <SelectTrigger
              className="w-44 h-9 text-sm"
              data-ocid="achievement_report.period_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={() => downloadCSV(filtered, period)}
            disabled={filtered.length === 0}
            className="h-9 gap-2"
            data-ocid="achievement_report.export_button"
          >
            <Download size={15} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div
        className="grid grid-cols-3 gap-4"
        data-ocid="achievement_report.summary"
      >
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Total Goals
            </p>
            <p className="text-2xl font-bold font-display mt-1">
              {isLoading ? "—" : filtered.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Avg. Progress
            </p>
            <p className="text-2xl font-bold font-display mt-1">
              {isLoading ? "—" : `${Math.round(avgScore * 100)}%`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Completed
            </p>
            <p className="text-2xl font-bold font-display mt-1">
              {isLoading
                ? "—"
                : filtered.filter((r) => r.status === "Completed").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Goal Details — {PERIOD_LABELS[period]}
          </CardTitle>
          <div className="relative w-60">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search employee, goal…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
              data-ocid="achievement_report.search_input"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="p-6 space-y-2"
              data-ocid="achievement_report.loading_state"
            >
              {["s0", "s1", "s2", "s3", "s4", "s5"].map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="py-16 text-center"
              data-ocid="achievement_report.empty_state"
            >
              <FileBarChart
                size={36}
                className="mx-auto text-muted-foreground/40 mb-2"
              />
              <p className="text-sm text-muted-foreground">
                No data for this period
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Select a different quarter or wait for employees to log
                achievements
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {[
                      "Employee",
                      "Department",
                      "Goal",
                      "UoM",
                      "Target",
                      "Actual",
                      "Progress",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider first:pl-4"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr
                      key={`${row.employeeName}-${row.goalTitle}-${i}`}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                      data-ocid={`achievement_report.row.${i + 1}`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {row.employeeName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.department}
                      </td>
                      <td
                        className="px-4 py-3 max-w-[200px] truncate"
                        title={row.goalTitle}
                      >
                        {row.goalTitle}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]">
                          {row.uomType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {row.target}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {row.actual}
                      </td>
                      <td className="px-4 py-3">
                        <ScorePill score={row.progressScore} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${
                            row.status === "Completed"
                              ? "text-chart-2"
                              : row.status === "OnTrack"
                                ? "text-chart-4"
                                : "text-muted-foreground"
                          }`}
                        >
                          {STATUS_LABELS[row.status] ?? row.status}
                        </span>
                      </td>
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
