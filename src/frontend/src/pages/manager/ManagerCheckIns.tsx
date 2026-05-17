import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarCheck,
  MessageSquarePlus,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  useAddCheckInComment,
  useCheckInComments,
  useEmployeeAchievements,
  useEmployeeGoals,
  useMyTeam,
} from "../../hooks/useManager";
import { AchievementStatus, CheckInPeriod, GoalStatus } from "../../lib/types";
import type { Achievement, Goal, ManagerCheckIn, User } from "../../lib/types";

const periodLabels: Record<CheckInPeriod, string> = {
  [CheckInPeriod.Q1]: "Q1 (July)",
  [CheckInPeriod.Q2]: "Q2 (October)",
  [CheckInPeriod.Q3]: "Q3 (January)",
  [CheckInPeriod.Q4Annual]: "Q4 / Annual",
};

const statusConfig: Record<AchievementStatus, { label: string; cls: string }> =
  {
    [AchievementStatus.NotStarted]: {
      label: "Not Started",
      cls: "bg-muted text-muted-foreground border-border",
    },
    [AchievementStatus.OnTrack]: {
      label: "On Track",
      cls: "bg-chart-4/10 text-chart-4 border-chart-4/30",
    },
    [AchievementStatus.Completed]: {
      label: "Completed",
      cls: "bg-chart-2/10 text-chart-2 border-chart-2/30",
    },
  };

// Progress bar ───────────────────────────────────────────────────────────────
function ProgressBar({ score }: { score: number }) {
  const pct = Math.min(Math.max(score * 100, 0), 100);
  const color =
    pct >= 80 ? "bg-chart-2" : pct >= 50 ? "bg-chart-4" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-foreground w-9 text-right">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

// Goal achievement row ────────────────────────────────────────────────────────
function GoalAchievementRow({
  goal,
  achievement,
}: {
  goal: Goal;
  achievement?: Achievement;
}) {
  const status = achievement?.achievementStatus ?? AchievementStatus.NotStarted;
  const sc = statusConfig[status];
  return (
    <div className="grid grid-cols-[1fr_80px_80px_120px_1fr] gap-2 items-center px-4 py-3 border-b border-border last:border-0 text-sm hover:bg-muted/20 transition-smooth">
      <div className="min-w-0">
        <p className="font-medium text-foreground truncate">{goal.title}</p>
        <p className="text-xs text-muted-foreground">{goal.description}</p>
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground">{goal.target}</p>
        <p className="text-[10px] text-muted-foreground">Target</p>
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground">
          {achievement?.actual ?? "—"}
        </p>
        <p className="text-[10px] text-muted-foreground">Actual</p>
      </div>
      <Badge
        variant="outline"
        className={`text-[10px] justify-center ${sc.cls}`}
      >
        {sc.label}
      </Badge>
      <div className="min-w-0">
        {achievement ? (
          <ProgressBar score={achievement.progressScore} />
        ) : (
          <span className="text-xs text-muted-foreground">No data</span>
        )}
      </div>
    </div>
  );
}

// Comment thread ─────────────────────────────────────────────────────────────
function CommentThread({
  comments,
  goalId,
  employeeId,
  period,
}: {
  comments: ManagerCheckIn[];
  goalId: string;
  employeeId: User["id"];
  period: CheckInPeriod;
}) {
  const { register, handleSubmit, reset } = useForm<{ comment: string }>();
  const addComment = useAddCheckInComment();

  const onSubmit = (data: { comment: string }) => {
    addComment.mutate(
      { goalId, employeeId, period, comment: data.comment },
      { onSuccess: () => reset() },
    );
  };

  return (
    <div className="border-t border-border bg-muted/10 px-4 py-3 space-y-3">
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((c) => (
            <div
              key={c.id}
              className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
            >
              <p className="text-foreground">{c.comment}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(Number(c.createdAt) / 1_000_000).toLocaleDateString()}{" "}
                · {periodLabels[c.period]}
              </p>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
        <Textarea
          {...register("comment", { required: true })}
          placeholder="Add a check-in comment…"
          rows={2}
          className="resize-none text-sm flex-1"
          data-ocid="checkin.comment_textarea"
        />
        <Button
          type="submit"
          size="sm"
          disabled={addComment.isPending}
          className="self-end"
          data-ocid="checkin.comment_submit_button"
        >
          <MessageSquarePlus size={14} className="mr-1" /> Save
        </Button>
      </form>
    </div>
  );
}

// Employee check-in card ──────────────────────────────────────────────────────
function EmployeeCheckInCard({
  employee,
  period,
}: {
  employee: User;
  period: CheckInPeriod;
}) {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const { data: goals = [] } = useEmployeeGoals(employee.id);
  const { data: achievements = [], isLoading } = useEmployeeAchievements(
    employee.id,
    period,
  );
  const { data: comments = [] } = useCheckInComments(employee.id, period);

  const approvedGoals = goals.filter(
    (g) => g.status === GoalStatus.ApprovedLocked,
  );
  const achMap = new Map(achievements.map((a) => [a.goalId, a]));
  const commentGoalId = selectedGoalId ?? approvedGoals[0]?.id ?? null;
  const filteredComments = comments.filter((c) => c.goalId === commentGoalId);

  if (approvedGoals.length === 0) return null;

  return (
    <Card className="overflow-hidden" data-ocid="checkin.employee_card">
      <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {employee.name.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {employee.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {employee.department} · {approvedGoals.length} approved goals
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {periodLabels[period]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Planned vs Actual table */}
        {isLoading ? (
          <div className="p-4" data-ocid="checkin.loading_state">
            <Skeleton className="h-24 w-full rounded" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_80px_80px_120px_1fr] gap-2 px-4 py-2 bg-muted/30 border-b border-border">
              {["Goal", "Target", "Actual", "Status", "Progress"].map((h) => (
                <span
                  key={h}
                  className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  {h}
                </span>
              ))}
            </div>
            {approvedGoals.map((goal) => (
              <GoalAchievementRow
                key={goal.id}
                goal={goal}
                achievement={achMap.get(goal.id)}
              />
            ))}
          </>
        )}

        {/* Comment section */}
        {approvedGoals.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Check-in Comment
              </p>
              {approvedGoals.length > 1 && (
                <Select
                  value={commentGoalId ?? ""}
                  onValueChange={setSelectedGoalId}
                >
                  <SelectTrigger
                    className="h-7 text-xs w-44"
                    data-ocid="checkin.goal_select"
                  >
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedGoals.map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-xs">
                        {g.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}
        {commentGoalId && (
          <CommentThread
            comments={filteredComments}
            goalId={commentGoalId}
            employeeId={employee.id}
            period={period}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function ManagerCheckIns() {
  const { data: team = [], isLoading } = useMyTeam();
  const [period, setPeriod] = useState<CheckInPeriod>(CheckInPeriod.Q1);

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Team Check-ins
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review planned vs. actual achievement and log feedback.
          </p>
        </div>
      </div>

      {/* Period selector */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as CheckInPeriod)}>
        <TabsList className="bg-muted" data-ocid="checkin.period_tabs">
          {Object.entries(periodLabels).map(([k, label]) => (
            <TabsTrigger
              key={k}
              value={k}
              className="text-xs"
              data-ocid={`checkin.period_tab.${k.toLowerCase()}`}
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(periodLabels).map((k) => (
          <TabsContent key={k} value={k} className="mt-5 space-y-4">
            {isLoading ? (
              <div className="space-y-4" data-ocid="checkin.loading_state">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))}
              </div>
            ) : team.length === 0 ? (
              <Card data-ocid="checkin.empty_state">
                <CardContent className="py-16 text-center">
                  <Users
                    size={40}
                    className="text-muted-foreground/30 mx-auto mb-3"
                  />
                  <p className="text-sm text-muted-foreground">
                    No team members assigned.
                  </p>
                </CardContent>
              </Card>
            ) : (
              team.map((emp) => (
                <EmployeeCheckInCard
                  key={emp.id.toString()}
                  employee={emp}
                  period={k as CheckInPeriod}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
