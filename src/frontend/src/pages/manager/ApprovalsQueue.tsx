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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  PenLine,
  Target,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import {
  useApproveGoals,
  useEmployeeGoals,
  useManagerEditGoal,
  useMyTeam,
  useReturnGoals,
} from "../../hooks/useManager";
import { GoalStatus, UoMType } from "../../lib/types";
import type { Goal, User } from "../../lib/types";

const uomLabels: Record<UoMType, string> = {
  [UoMType.Numeric]: "Numeric",
  [UoMType.Percent]: "%",
  [UoMType.Timeline]: "Date",
  [UoMType.ZeroBased]: "Zero",
};

// Editable cell ─────────────────────────────────────────────────────────────
function EditableCell({
  value,
  onSave,
  suffix,
}: {
  value: number;
  onSave: (v: number) => void;
  suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toString());

  const commit = () => {
    const n = Number.parseFloat(draft);
    if (!Number.isNaN(n) && n !== value) onSave(n);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-20 px-2 py-1 text-sm border border-ring rounded bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        data-ocid="goal.edit_input"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-smooth group"
      data-ocid="goal.edit_cell"
    >
      <span>
        {value}
        {suffix}
      </span>
      <PenLine
        size={11}
        className="text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-smooth"
      />
    </button>
  );
}

// Goal row ───────────────────────────────────────────────────────────────────
function GoalReviewRow({
  goal,
  editable,
  onEditTarget,
  onEditWeightage,
}: {
  goal: Goal;
  editable: boolean;
  onEditTarget: (goalId: string, val: number) => void;
  onEditWeightage: (goalId: string, val: number) => void;
}) {
  return (
    <tr
      className="border-b border-border last:border-0 hover:bg-muted/20 transition-smooth"
      data-ocid="goal.review_row"
    >
      <td className="px-4 py-3 text-sm">
        <p className="font-medium text-foreground">{goal.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {goal.description}
        </p>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        <Badge
          variant="outline"
          className="text-[10px] bg-muted text-muted-foreground"
        >
          {uomLabels[goal.uomType]}
        </Badge>
      </td>
      <td className="px-4 py-3">
        {editable ? (
          <EditableCell
            value={goal.target}
            onSave={(v) => onEditTarget(goal.id, v)}
          />
        ) : (
          <span className="text-sm text-foreground">{goal.target}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {editable ? (
          <EditableCell
            value={goal.weightage}
            onSave={(v) => onEditWeightage(goal.id, v)}
            suffix="%"
          />
        ) : (
          <span className="text-sm text-foreground">{goal.weightage}%</span>
        )}
      </td>
    </tr>
  );
}

// Employee approval card ─────────────────────────────────────────────────────
function EmployeeApprovalCard({ employee }: { employee: User }) {
  const { data: goals = [], isLoading } = useEmployeeGoals(employee.id);
  const approveMutation = useApproveGoals();
  const returnMutation = useReturnGoals();
  const editMutation = useManagerEditGoal();

  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");

  const pending = goals.filter(
    (g) =>
      g.status === GoalStatus.Submitted || g.status === GoalStatus.UnderReview,
  );

  const handleApprove = () => approveMutation.mutate(employee.id);
  const handleReturn = () => {
    if (!returnReason.trim()) return;
    returnMutation.mutate(
      { employeeId: employee.id, reason: returnReason },
      {
        onSuccess: () => {
          setReturnDialogOpen(false);
          setReturnReason("");
        },
      },
    );
  };

  const handleEditTarget = useCallback(
    (goalId: string, target: number) =>
      editMutation.mutate({ goalId, target, weightage: null }),
    [editMutation],
  );
  const handleEditWeightage = useCallback(
    (goalId: string, weightage: number) =>
      editMutation.mutate({ goalId, target: null, weightage }),
    [editMutation],
  );

  if (isLoading)
    return (
      <Skeleton
        className="h-32 w-full rounded-xl"
        data-ocid="approval.loading_state"
      />
    );
  if (pending.length === 0) return null;

  const totalW = pending.reduce((s, g) => s + g.weightage, 0);
  const weightageOk = totalW === 100;

  return (
    <Card className="overflow-hidden" data-ocid="approval.employee_card">
      <CardHeader className="px-5 pt-4 pb-3 border-b border-border flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
            {employee.name.charAt(0)}
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              {employee.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {employee.department} · {pending.length} goal
              {pending.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!weightageOk && (
            <div
              className="flex items-center gap-1 text-xs text-destructive"
              data-ocid="approval.weightage_error"
            >
              <AlertTriangle size={12} />
              <span>Weightage: {totalW}%</span>
            </div>
          )}
          {weightageOk && (
            <Badge
              variant="outline"
              className="text-[10px] bg-chart-2/10 text-chart-2 border-chart-2/30"
            >
              Total: 100%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Goal
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  UoM
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Target
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Weightage
                </th>
              </tr>
            </thead>
            <tbody>
              {pending.map((goal) => (
                <GoalReviewRow
                  key={goal.id}
                  goal={goal}
                  editable={true}
                  onEditTarget={handleEditTarget}
                  onEditWeightage={handleEditWeightage}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 bg-muted/10 border-t border-border gap-3">
          <p className="text-xs text-muted-foreground">
            Click any target or weightage to edit inline before approving.
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReturnDialogOpen(true)}
              disabled={returnMutation.isPending}
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
              data-ocid="approval.return_button"
            >
              <XCircle size={14} className="mr-1" /> Return
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApprove}
              disabled={!weightageOk || approveMutation.isPending}
              className="bg-chart-2 hover:bg-chart-2/90 text-white"
              data-ocid="approval.approve_button"
            >
              <CheckCircle2 size={14} className="mr-1" /> Approve
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Return dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent data-ocid="approval.return_dialog">
          <DialogHeader>
            <DialogTitle>Return Goals for Rework</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="return-reason">Reason / Feedback</Label>
            <Textarea
              id="return-reason"
              placeholder="Explain what needs to be corrected…"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              rows={4}
              data-ocid="approval.return_reason_textarea"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReturnDialogOpen(false)}
              data-ocid="approval.return_cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReturn}
              disabled={!returnReason.trim() || returnMutation.isPending}
              data-ocid="approval.return_confirm_button"
            >
              Return for Rework
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function ApprovalsQueue() {
  const { data: team = [], isLoading } = useMyTeam();

  const pendingMembers = team; // we render null for members with no pending goals

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Goal Approvals
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review, edit inline, and approve or return each employee's goal
            sheet.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4" data-ocid="approvals.loading_state">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : pendingMembers.length === 0 ? (
        <Card data-ocid="approvals.empty_state">
          <CardContent className="py-16 text-center">
            <ClipboardCheck
              size={40}
              className="text-muted-foreground/30 mx-auto mb-3"
            />
            <p className="text-base font-medium text-foreground">
              No team members found.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Assign team members to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4" data-ocid="approvals.list">
          {pendingMembers.map((emp) => (
            <EmployeeApprovalCard key={emp.id.toString()} employee={emp} />
          ))}
        </div>
      )}
    </div>
  );
}
