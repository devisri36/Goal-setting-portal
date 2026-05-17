import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  Minus,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  useLogAchievement,
  useMyAchievements,
  useMyGoals,
} from "../../hooks/useGoals";
import {
  AchievementStatus,
  CheckInPeriod,
  GoalStatus,
  UoMType,
} from "../../lib/types";
import type { Achievement, Goal } from "../../lib/types";

const PERIOD_LABELS: Record<CheckInPeriod, string> = {
  [CheckInPeriod.Q1]: "Q1 — July",
  [CheckInPeriod.Q2]: "Q2 — October",
  [CheckInPeriod.Q3]: "Q3 — January",
  [CheckInPeriod.Q4Annual]: "Q4 / Annual — March",
};

const ACHIEVEMENT_STATUS_OPTIONS = [
  {
    value: AchievementStatus.NotStarted,
    label: "Not Started",
    color: "bg-muted text-muted-foreground",
  },
  {
    value: AchievementStatus.OnTrack,
    label: "On Track",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: AchievementStatus.Completed,
    label: "Completed",
    color: "bg-green-100 text-green-700",
  },
];

function statusBadgeClass(s: AchievementStatus) {
  return (
    ACHIEVEMENT_STATUS_OPTIONS.find((o) => o.value === s)?.color ||
    "bg-muted text-muted-foreground"
  );
}

function progressColor(score: number) {
  if (score >= 0.9) return "text-green-600";
  if (score >= 0.6) return "text-yellow-600";
  return "text-red-500";
}

interface LogFormValues {
  actual: string;
  completionDate: string;
  achievementStatus: AchievementStatus;
}

function LogAchievementDialog({
  goal,
  period,
  existing,
}: {
  goal: Goal;
  period: CheckInPeriod;
  existing?: Achievement;
}) {
  const [open, setOpen] = useState(false);
  const logAchievement = useLogAchievement(period);
  const isTimeline = goal.uomType === UoMType.Timeline;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LogFormValues>({
    defaultValues: {
      actual: existing?.actual?.toString() ?? "",
      completionDate: "",
      achievementStatus:
        existing?.achievementStatus ?? AchievementStatus.NotStarted,
    },
  });

  const onSubmit = async (data: LogFormValues) => {
    let completionDate: bigint | null = null;
    if (isTimeline && data.completionDate) {
      completionDate =
        BigInt(new Date(data.completionDate).getTime()) * 1_000_000n;
    }
    await logAchievement.mutateAsync({
      goalId: goal.id,
      period,
      actual: Number.parseFloat(data.actual),
      completionDate,
      achievementStatus: data.achievementStatus,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={existing ? "outline" : "default"}
          data-ocid={`employee.checkin.log_button.${goal.id.slice(-4)}`}
        >
          {existing ? "Update" : "Log"}
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="employee.checkin.log_dialog">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {existing ? "Update" : "Log"} Achievement
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{goal.title}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="bg-muted/50 rounded-lg p-3 text-xs">
            <p className="font-medium text-foreground">
              Goal target: {goal.target}
            </p>
            <p className="text-muted-foreground mt-0.5">
              UoM: {goal.uomType}
              {goal.uomDirection ? ` (${goal.uomDirection})` : ""}
            </p>
          </div>

          {!isTimeline && (
            <div className="space-y-1.5">
              <Label htmlFor="actual" className="text-xs font-medium">
                Actual Achievement <span className="text-destructive">*</span>
              </Label>
              <Input
                id="actual"
                type="number"
                step="any"
                placeholder={`Enter actual value (target: ${goal.target})`}
                {...register("actual", {
                  required: "Actual value is required",
                  min: { value: 0, message: "Must be ≥ 0" },
                })}
                data-ocid="employee.checkin.actual_input"
              />
              {errors.actual && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="employee.checkin.actual_field_error"
                >
                  {errors.actual.message}
                </p>
              )}
            </div>
          )}

          {isTimeline && (
            <div className="space-y-1.5">
              <Label htmlFor="completionDate" className="text-xs font-medium">
                Completion Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="completionDate"
                type="date"
                {...register("completionDate", {
                  required: "Date is required",
                })}
                data-ocid="employee.checkin.date_input"
              />
              {errors.completionDate && (
                <p className="text-xs text-destructive">
                  {errors.completionDate.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Status <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="achievementStatus"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger data-ocid="employee.checkin.status_select">
                    <SelectValue placeholder="Select status…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACHIEVEMENT_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              data-ocid="employee.checkin.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || logAchievement.isPending}
              data-ocid="employee.checkin.submit_button"
            >
              Save Achievement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalCheckInRow({
  goal,
  achievement,
  period,
  index,
}: {
  goal: Goal;
  achievement?: Achievement;
  period: CheckInPeriod;
  index: number;
}) {
  const scorePercent = achievement
    ? Math.round(achievement.progressScore * 100)
    : null;

  return (
    <Card
      className="shadow-subtle"
      data-ocid={`employee.checkin.item.${index}`}
    >
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">
              {goal.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {goal.description}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {achievement && (
              <Badge
                className={`${statusBadgeClass(achievement.achievementStatus)} text-xs border-0`}
              >
                {
                  ACHIEVEMENT_STATUS_OPTIONS.find(
                    (o) => o.value === achievement.achievementStatus,
                  )?.label
                }
              </Badge>
            )}
            <LogAchievementDialog
              goal={goal}
              period={period}
              existing={achievement}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-muted-foreground">Target</p>
            <p className="font-semibold text-foreground">{goal.target}</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-muted-foreground">Actual</p>
            <p className="font-semibold text-foreground">
              {achievement?.actual ?? "—"}
            </p>
          </div>
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-muted-foreground">Score</p>
            <p
              className={`font-bold ${
                scorePercent !== null
                  ? progressColor(achievement!.progressScore)
                  : "text-muted-foreground"
              }`}
            >
              {scorePercent !== null ? `${scorePercent}%` : "—"}
            </p>
          </div>
        </div>

        {scorePercent !== null && (
          <div className="mt-2">
            <Progress value={Math.min(scorePercent, 100)} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CheckIns() {
  const [activePeriod, setActivePeriod] = useState<CheckInPeriod>(
    CheckInPeriod.Q1,
  );
  const { data: goals = [], isLoading: goalsLoading } = useMyGoals();
  const { data: achievements = [], isLoading: achLoading } =
    useMyAchievements(activePeriod);

  const approvedGoals = useMemo(
    () => goals.filter((g) => g.status === GoalStatus.ApprovedLocked),
    [goals],
  );

  const achievementMap = useMemo(() => {
    const map = new Map<string, Achievement>();
    for (const a of achievements) map.set(a.goalId, a);
    return map;
  }, [achievements]);

  const completedCount = useMemo(
    () => approvedGoals.filter((g) => achievementMap.has(g.id)).length,
    [approvedGoals, achievementMap],
  );

  const avgScore = useMemo(() => {
    const scored = achievements.filter((a) => a.progressScore > 0);
    if (!scored.length) return null;
    return Math.round(
      (scored.reduce((s, a) => s + a.progressScore, 0) / scored.length) * 100,
    );
  }, [achievements]);

  const isLoading = goalsLoading || achLoading;

  return (
    <div className="p-6 space-y-5" data-ocid="employee.checkins.page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Quarterly Check-ins
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Log your actual achievements against approved goals.
          </p>
        </div>
      </div>

      {/* Period tabs */}
      <Tabs
        value={activePeriod}
        onValueChange={(v) => setActivePeriod(v as CheckInPeriod)}
        data-ocid="employee.checkins.period_tabs"
      >
        <TabsList className="grid grid-cols-4 w-full">
          {Object.entries(PERIOD_LABELS).map(([key, _label]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="text-xs"
              data-ocid={`employee.checkins.period_tab.${key.toLowerCase()}`}
            >
              {key.replace("Q4Annual", "Q4")}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(PERIOD_LABELS).map((key) => (
          <TabsContent key={key} value={key} className="mt-4 space-y-4">
            {/* Period summary */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Card className="flex-1 shadow-subtle">
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Period</p>
                    <p className="font-semibold text-foreground text-sm">
                      {PERIOD_LABELS[key as CheckInPeriod]}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-1 shadow-subtle">
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Goals Updated
                    </p>
                    <p className="font-semibold text-foreground text-sm">
                      {completedCount} / {approvedGoals.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              {avgScore !== null && (
                <Card className="flex-1 shadow-subtle">
                  <CardContent className="py-3 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <BarChart3 className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Avg. Score
                      </p>
                      <p
                        className={`font-bold text-sm ${progressColor(avgScore / 100)}`}
                      >
                        {avgScore}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Goal rows */}
            {isLoading ? (
              <div className="space-y-3">
                {["s0", "s1", "s2"].map((k) => (
                  <Skeleton key={k} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : approvedGoals.length === 0 ? (
              <Card
                className="border-dashed shadow-subtle"
                data-ocid="employee.checkins.empty_state"
              >
                <CardContent className="py-12 flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-full bg-muted">
                    <Lock className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">
                      No approved goals
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Goals must be approved by your manager before you can log
                      check-ins.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {approvedGoals.map((goal, i) => (
                  <GoalCheckInRow
                    key={goal.id}
                    goal={goal}
                    achievement={achievementMap.get(goal.id)}
                    period={activePeriod}
                    index={i + 1}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
