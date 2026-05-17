import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarRange,
  CheckCircle2,
  Search,
  Settings,
  Share2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { createActor } from "../../backend";
import {
  useAllUsers,
  useCompletionDashboard,
  usePushSharedGoal,
} from "../../hooks/useAdmin";
import { isOk } from "../../lib/backend-helpers";
import type { Goal, User } from "../../lib/types";
import { GoalStatus } from "../../lib/types";

// Cycle config data (static — actual dates from BRD)
const CYCLES = [
  {
    id: "goal-setting",
    label: "Goal Setting",
    window: "1st May",
    description: "Goal Creation, Submission & Approval",
    status: "active" as const,
  },
  {
    id: "q1",
    label: "Q1 Check-in",
    window: "July",
    description: "Progress Update — Planned vs. Actual",
    status: "upcoming" as const,
  },
  {
    id: "q2",
    label: "Q2 Check-in",
    window: "October",
    description: "Progress Update — Planned vs. Actual",
    status: "upcoming" as const,
  },
  {
    id: "q3",
    label: "Q3 Check-in",
    window: "January",
    description: "Progress Update — Planned vs. Actual",
    status: "upcoming" as const,
  },
  {
    id: "q4",
    label: "Q4 / Annual",
    window: "March / April",
    description: "Final Achievement Capture",
    status: "upcoming" as const,
  },
];

function CycleCard({ cycle }: { cycle: (typeof CYCLES)[number] }) {
  return (
    <Card
      className={`${cycle.status === "active" ? "ring-2 ring-primary/40" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-foreground">
                {cycle.label}
              </h3>
              {cycle.status === "active" && (
                <Badge className="bg-chart-2/15 text-chart-2 border-0 text-[10px]">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{cycle.description}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <CalendarRange size={12} />
            <span>{cycle.window}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function useApprovedGoals(employeeId?: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Goal[]>({
    queryKey: ["approvedGoals", employeeId],
    queryFn: async () => {
      if (!actor || !employeeId) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.getEmployeeGoals(
        Principal.fromText(employeeId),
      );
      if (!isOk(result)) return [];
      return result.ok.filter((g) => g.status === GoalStatus.ApprovedLocked);
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });
}

export default function GoalCycles() {
  const { data: dashRows, isLoading: dashLoading } = useCompletionDashboard();
  const { data: allUsers, isLoading: usersLoading } = useAllUsers();
  const pushMutation = usePushSharedGoal();

  // Push shared goal dialog state
  const [pushOpen, setPushOpen] = useState(false);
  const [sourceEmployeeId, setSourceEmployeeId] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [targetSearch, setTargetSearch] = useState("");
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

  const { data: sourceGoals, isLoading: goalsLoading } = useApprovedGoals(
    sourceEmployeeId || undefined,
  );

  const employees = useMemo(
    () =>
      (allUsers ?? []).filter(
        (u) => u.role === ("Employee" as unknown as User["role"]),
      ),
    [allUsers],
  );

  const filteredTargets = useMemo(() => {
    const q = targetSearch.toLowerCase();
    return employees.filter(
      (e) =>
        e.id.toString() !== sourceEmployeeId &&
        (e.name.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)),
    );
  }, [employees, sourceEmployeeId, targetSearch]);

  const handlePush = () => {
    if (!selectedGoalId || selectedTargets.length === 0) return;
    pushMutation.mutate(
      { sourceGoalId: selectedGoalId, employeeIds: selectedTargets },
      {
        onSuccess: () => {
          setPushOpen(false);
          setSourceEmployeeId("");
          setSelectedGoalId("");
          setSelectedTargets([]);
          setTargetSearch("");
        },
      },
    );
  };

  const toggleTarget = (id: string) => {
    setSelectedTargets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const stats = useMemo(() => {
    if (!dashRows) return { total: 0, approved: 0, submitted: 0 };
    return {
      total: dashRows.length,
      submitted: dashRows.filter((r) => r.submitted).length,
      approved: dashRows.filter((r) => r.approved).length,
    };
  }, [dashRows]);

  return (
    <div className="p-6 space-y-6" data-ocid="goal_cycles.page">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Goal Cycles & Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cycle schedule, completion status, and shared goal management
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setPushOpen(true)}
          className="gap-2"
          data-ocid="goal_cycles.push_goal_button"
        >
          <Share2 size={15} />
          Push Shared Goal
        </Button>
      </div>

      {/* Org stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Employees",
            value: stats.total,
            icon: <Users size={16} />,
            color: "bg-primary/15 text-primary",
          },
          {
            label: "Goals Submitted",
            value: stats.submitted,
            icon: <Settings size={16} />,
            color: "bg-chart-4/15 text-chart-4",
          },
          {
            label: "Goals Approved",
            value: stats.approved,
            icon: <CheckCircle2 size={16} />,
            color: "bg-chart-2/15 text-chart-2",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {s.label}
                </p>
                {dashLoading ? (
                  <Skeleton className="h-6 w-8 mt-1" />
                ) : (
                  <p className="text-xl font-bold font-display">{s.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cycle schedule */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Cycle Schedule
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CYCLES.map((c) => (
            <CycleCard key={c.id} cycle={c} />
          ))}
        </div>
      </div>

      {/* Push Shared Goal Dialog */}
      <Dialog open={pushOpen} onOpenChange={setPushOpen}>
        <DialogContent className="max-w-lg" data-ocid="goal_cycles.push_dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 size={18} className="text-primary" />
              Push Shared Goal
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Source employee */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Source Employee</Label>
              <select
                className="w-full h-9 border border-input rounded-lg px-3 text-sm bg-background text-foreground"
                value={sourceEmployeeId}
                onChange={(e) => {
                  setSourceEmployeeId(e.target.value);
                  setSelectedGoalId("");
                }}
                data-ocid="goal_cycles.source_employee_select"
              >
                <option value="">Select an employee…</option>
                {(usersLoading ? [] : employees).map((e) => (
                  <option key={e.id.toString()} value={e.id.toString()}>
                    {e.name} — {e.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Source goal */}
            {sourceEmployeeId && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Goal to Share</Label>
                {goalsLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (sourceGoals?.length ?? 0) === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    No approved goals found for this employee
                  </p>
                ) : (
                  <select
                    className="w-full h-9 border border-input rounded-lg px-3 text-sm bg-background text-foreground"
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    data-ocid="goal_cycles.source_goal_select"
                  >
                    <option value="">Select a goal…</option>
                    {(sourceGoals ?? []).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Target employees */}
            {selectedGoalId && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Push to Employees
                </Label>
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="Search employees…"
                    value={targetSearch}
                    onChange={(e) => setTargetSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                    data-ocid="goal_cycles.target_search"
                  />
                </div>
                <div className="border border-border rounded-lg overflow-y-auto max-h-44 divide-y divide-border">
                  {filteredTargets.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3 text-center">
                      No employees found
                    </p>
                  ) : (
                    filteredTargets.map((emp, i) => (
                      <label
                        key={emp.id.toString()}
                        htmlFor={`target-emp-${emp.id.toString()}`}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer"
                        data-ocid={`goal_cycles.target_employee.${i + 1}`}
                      >
                        <Checkbox
                          id={`target-emp-${emp.id.toString()}`}
                          checked={selectedTargets.includes(emp.id.toString())}
                          onCheckedChange={() =>
                            toggleTarget(emp.id.toString())
                          }
                        />
                        <span className="text-sm flex-1 min-w-0">
                          <span className="font-medium text-foreground">
                            {emp.name}
                          </span>
                          <span className="text-muted-foreground ml-1 text-xs">
                            · {emp.department}
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {selectedTargets.length > 0 && (
                  <p className="text-xs text-primary font-medium">
                    {selectedTargets.length} employee
                    {selectedTargets.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPushOpen(false)}
              data-ocid="goal_cycles.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                !selectedGoalId ||
                selectedTargets.length === 0 ||
                pushMutation.isPending
              }
              onClick={handlePush}
              data-ocid="goal_cycles.confirm_button"
            >
              {pushMutation.isPending
                ? "Pushing…"
                : `Push to ${selectedTargets.length || ""} Employee${selectedTargets.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
