import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Lock, Search, Unlock, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useAdminUnlockGoals,
  useCompletionDashboard,
} from "../../hooks/useAdmin";
import type { CompletionDashboardRow } from "../../lib/types";

function StatusDot({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {done ? (
        <CheckCircle2 size={16} className="text-chart-2" />
      ) : (
        <XCircle size={16} className="text-muted-foreground/40" />
      )}
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function EmployeeRow({
  row,
  index,
  onUnlock,
}: {
  row: CompletionDashboardRow;
  index: number;
  onUnlock: (row: CompletionDashboardRow) => void;
}) {
  const isFullyDone =
    row.approved && row.q1Done && row.q2Done && row.q3Done && row.q4Done;
  return (
    <tr
      className="border-b border-border hover:bg-muted/40 transition-colors"
      data-ocid={`completion.row.${index}`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
            {row.user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {row.user.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.user.department}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <StatusDot done={row.submitted} label="Submitted" />
      </td>
      <td className="px-4 py-3 text-center">
        <StatusDot done={row.approved} label="Approved" />
      </td>
      <td className="px-4 py-3 text-center">
        <StatusDot done={row.q1Done} label="Q1" />
      </td>
      <td className="px-4 py-3 text-center">
        <StatusDot done={row.q2Done} label="Q2" />
      </td>
      <td className="px-4 py-3 text-center">
        <StatusDot done={row.q3Done} label="Q3" />
      </td>
      <td className="px-4 py-3 text-center">
        <StatusDot done={row.q4Done} label="Q4" />
      </td>
      <td className="px-4 py-3 text-center">
        {isFullyDone ? (
          <Badge className="bg-chart-2/15 text-chart-2 border-0 text-[10px]">
            Complete
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-muted-foreground text-[10px]"
          >
            In Progress
          </Badge>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {row.approved && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
            onClick={() => onUnlock(row)}
            data-ocid={`completion.unlock_button.${index}`}
          >
            <Unlock size={12} className="mr-1" />
            Unlock
          </Button>
        )}
      </td>
    </tr>
  );
}

export default function CompletionDashboard() {
  const { data: rows, isLoading } = useCompletionDashboard();
  const unlockMutation = useAdminUnlockGoals();
  const [search, setSearch] = useState("");
  const [unlockTarget, setUnlockTarget] =
    useState<CompletionDashboardRow | null>(null);
  const [unlockReason, setUnlockReason] = useState("");

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.user.name.toLowerCase().includes(q) ||
        r.user.department.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const summary = useMemo(() => {
    if (!rows || rows.length === 0)
      return { total: 0, approved: 0, q1: 0, complete: 0 };
    return {
      total: rows.length,
      approved: rows.filter((r) => r.approved).length,
      q1: rows.filter((r) => r.q1Done).length,
      complete: rows.filter(
        (r) => r.approved && r.q1Done && r.q2Done && r.q3Done && r.q4Done,
      ).length,
    };
  }, [rows]);

  const handleUnlock = () => {
    if (!unlockTarget || !unlockReason.trim()) return;
    unlockMutation.mutate(
      { employeeId: unlockTarget.user.id.toString(), reason: unlockReason },
      {
        onSuccess: () => {
          setUnlockTarget(null);
          setUnlockReason("");
        },
      },
    );
  };

  return (
    <div className="p-6 space-y-6" data-ocid="completion_dashboard.page">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Completion Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time view of goal submission, approval, and check-in status
          </p>
        </div>
      </div>

      {/* Summary tiles */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        data-ocid="completion_dashboard.summary"
      >
        {[
          {
            label: "Total Employees",
            value: summary.total,
            color: "bg-primary/15 text-primary",
          },
          {
            label: "Goals Approved",
            value: summary.approved,
            color: "bg-chart-2/15 text-chart-2",
          },
          {
            label: "Q1 Check-ins",
            value: summary.q1,
            color: "bg-chart-3/15 text-chart-3",
          },
          {
            label: "Fully Complete",
            value: summary.complete,
            color: "bg-chart-4/15 text-chart-4",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}
              >
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {s.label}
                </p>
                {isLoading ? (
                  <Skeleton className="h-6 w-10 mt-1" />
                ) : (
                  <p className="text-xl font-bold font-display text-foreground">
                    {s.value}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Employee Progress</CardTitle>
          <div className="relative w-60">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search employee…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
              data-ocid="completion_dashboard.search_input"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="p-6 space-y-2"
              data-ocid="completion_dashboard.loading_state"
            >
              {["s0", "s1", "s2", "s3", "s4"].map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="py-16 text-center"
              data-ocid="completion_dashboard.empty_state"
            >
              <CheckCircle2
                size={36}
                className="mx-auto text-muted-foreground/40 mb-2"
              />
              <p className="text-sm text-muted-foreground">
                No employees found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Approved
                    </th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Q1
                    </th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Q2
                    </th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Q3
                    </th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Q4
                    </th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <EmployeeRow
                      key={row.user.id.toString()}
                      row={row}
                      index={i + 1}
                      onUnlock={setUnlockTarget}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unlock dialog */}
      <Dialog
        open={!!unlockTarget}
        onOpenChange={(open) => !open && setUnlockTarget(null)}
      >
        <DialogContent data-ocid="completion_dashboard.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock size={18} className="text-destructive" />
              Unlock Goals — {unlockTarget?.user.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Unlocking will allow this employee to edit their approved goals.
              This action is logged in the audit trail.
            </p>
            <div className="space-y-1">
              <Label htmlFor="unlock-reason" className="text-xs font-semibold">
                Reason for unlock <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="unlock-reason"
                placeholder="Enter a clear reason for unlocking these goals…"
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                className="text-sm resize-none"
                rows={3}
                data-ocid="completion_dashboard.unlock_reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setUnlockTarget(null)}
              data-ocid="completion_dashboard.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!unlockReason.trim() || unlockMutation.isPending}
              onClick={handleUnlock}
              data-ocid="completion_dashboard.confirm_button"
            >
              {unlockMutation.isPending ? "Unlocking…" : "Unlock Goals"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
