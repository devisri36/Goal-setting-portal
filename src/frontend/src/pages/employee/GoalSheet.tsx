import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Target,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useMyGoals, useSubmitGoals } from "../../hooks/useGoals";
import { GoalStatus, UoMType } from "../../lib/types";
import type { Goal } from "../../lib/types";

const STATUS_CONFIG: Record<
  GoalStatus,
  { label: string; color: string; Icon: React.ElementType }
> = {
  [GoalStatus.Draft]: {
    label: "Draft",
    color: "bg-muted text-muted-foreground border-border",
    Icon: Pencil,
  },
  [GoalStatus.Submitted]: {
    label: "Submitted",
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
    Icon: Send,
  },
  [GoalStatus.UnderReview]: {
    label: "Under Review",
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
    Icon: Clock,
  },
  [GoalStatus.ApprovedLocked]: {
    label: "Approved",
    color: "bg-green-500/10 text-green-700 border-green-200",
    Icon: CheckCircle2,
  },
  [GoalStatus.ReturnedForRework]: {
    label: "Returned",
    color: "bg-red-500/10 text-red-700 border-red-200",
    Icon: XCircle,
  },
};

const UOM_LABELS: Record<UoMType, string> = {
  [UoMType.Numeric]: "Numeric",
  [UoMType.Percent]: "Percent (%)",
  [UoMType.Timeline]: "Timeline",
  [UoMType.ZeroBased]: "Zero-based",
};

function GoalCard({
  goal,
  index,
  onEdit,
}: { goal: Goal; index: number; onEdit?: (goal: Goal) => void }) {
  const statusCfg = STATUS_CONFIG[goal.status];
  const StatusIcon = statusCfg.Icon;
  const canEdit =
    goal.status === GoalStatus.Draft ||
    goal.status === GoalStatus.ReturnedForRework;
  const isLocked = goal.status === GoalStatus.ApprovedLocked;

  return (
    <Card
      className="shadow-subtle transition-smooth hover:shadow-md"
      data-ocid={`employee.goals.item.${index}`}
    >
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground text-sm truncate">
                {goal.title}
              </h3>
              {goal.isShared && (
                <Badge variant="outline" className="text-xs shrink-0">
                  Shared
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {goal.description}
            </p>
          </div>
          <Badge
            className={`${statusCfg.color} shrink-0 flex items-center gap-1 text-xs border`}
          >
            <StatusIcon className="w-3 h-3" />
            {statusCfg.label}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-muted-foreground">Weightage</p>
            <p className="font-bold text-foreground text-base mt-0.5">
              {goal.weightage}%
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-muted-foreground">Target</p>
            <p className="font-bold text-foreground text-base mt-0.5">
              {goal.target}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-muted-foreground">UoM</p>
            <p className="font-semibold text-foreground mt-0.5 truncate">
              {UOM_LABELS[goal.uomType]}
            </p>
          </div>
        </div>

        {isLocked && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>Locked after manager approval — contact admin to edit</span>
          </div>
        )}

        {canEdit && onEdit && (
          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(goal)}
              data-ocid={`employee.goals.edit_button.${index}`}
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function GoalSheet() {
  const { data: goals = [], isLoading } = useMyGoals();
  const submitGoals = useSubmitGoals();
  const [showNewForm, setShowNewForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);

  const totalWeightage = useMemo(
    () => goals.reduce((s, g) => s + g.weightage, 0),
    [goals],
  );

  const canSubmit = useMemo(() => {
    const hasDraft = goals.some(
      (g) =>
        g.status === GoalStatus.Draft ||
        g.status === GoalStatus.ReturnedForRework,
    );
    return (
      hasDraft &&
      totalWeightage === 100 &&
      goals.length >= 1 &&
      goals.length <= 8
    );
  }, [goals, totalWeightage]);

  const allApproved =
    goals.length > 0 &&
    goals.every((g) => g.status === GoalStatus.ApprovedLocked);
  const hasEditable = goals.some(
    (g) =>
      g.status === GoalStatus.Draft ||
      g.status === GoalStatus.ReturnedForRework,
  );

  const handleSubmit = async () => {
    await submitGoals.mutateAsync();
  };

  // Dynamically import GoalForm to avoid circular deps
  const GoalFormSection = showNewForm ? (
    <div data-ocid="employee.goals.new_form">
      <GoalFormInline onClose={() => setShowNewForm(false)} />
    </div>
  ) : editGoal ? (
    <div data-ocid="employee.goals.edit_form">
      <GoalFormInline editGoal={editGoal} onClose={() => setEditGoal(null)} />
    </div>
  ) : null;

  return (
    <div className="p-6 space-y-5" data-ocid="employee.goals.page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Goal Sheet</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {goals.length} of 8 goals &middot; {totalWeightage}% allocated
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasEditable && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canSubmit || submitGoals.isPending}
                  data-ocid="employee.goals.submit_button"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Approval
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="employee.goals.submit_dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Submit Goals for Approval?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Once submitted, your goals will be sent to your manager for
                    review. You won't be able to edit them until the manager
                    returns them or approves them.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="employee.goals.submit_cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSubmit}
                    data-ocid="employee.goals.submit_confirm_button"
                  >
                    Submit Goals
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {!allApproved && goals.length < 8 && (
            <Button
              size="sm"
              onClick={() => setShowNewForm(true)}
              disabled={showNewForm}
              data-ocid="employee.goals.add_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          )}
        </div>
      </div>

      {/* Weightage bar */}
      <Card className="shadow-subtle">
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">
              Weightage total (must equal 100%)
            </span>
            <span
              className={`font-bold ${
                totalWeightage === 100
                  ? "text-green-600"
                  : totalWeightage > 100
                    ? "text-red-500"
                    : "text-orange-500"
              }`}
            >
              {totalWeightage}%
            </span>
          </div>
          <Progress value={Math.min(totalWeightage, 100)} className="h-2" />
          {!canSubmit && hasEditable && totalWeightage !== 100 && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-500">
              <AlertTriangle className="w-3.5 h-3.5" />
              Adjust weightages so they add up to exactly 100% before
              submitting.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Returned notice */}
      {goals.some((g) => g.status === GoalStatus.ReturnedForRework) && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          <RotateCcw className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-700">
              Goals returned for rework
            </p>
            <p className="text-red-600 text-xs mt-1">
              Your manager has returned your goals. Please edit and resubmit.
            </p>
          </div>
        </div>
      )}

      {/* New goal form */}
      {GoalFormSection}

      {/* Goal list */}
      {isLoading ? (
        <div className="space-y-3">
          {["s0", "s1", "s2"].map((k) => (
            <Skeleton key={k} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : goals.length === 0 && !showNewForm ? (
        <Card
          className="border-dashed shadow-subtle"
          data-ocid="employee.goals.empty_state"
        >
          <CardContent className="py-14 flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                No goals created yet
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create up to 8 goals with a total weightage of 100%.
              </p>
            </div>
            <Button
              onClick={() => setShowNewForm(true)}
              data-ocid="employee.goals.create_first_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {goals.map((goal, i) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={i + 1}
              onEdit={setEditGoal}
            />
          ))}
        </div>
      )}

      {/* Approved locked banner */}
      {allApproved && (
        <Card className="bg-green-50 border-green-200 shadow-subtle">
          <CardContent className="py-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800 text-sm">
                All goals approved!
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                Your goals are locked. Head to Check-ins to log your quarterly
                achievements.
              </p>
            </div>
            <Button asChild size="sm" className="ml-auto" variant="outline">
              <Link to="/employee/checkins">Go to Check-ins</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { Link } from "@tanstack/react-router";
// Inline shim — the full form is in GoalForm.tsx, but we import it here lazily
import GoalFormInline from "./GoalForm";
