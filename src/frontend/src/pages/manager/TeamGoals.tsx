import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Target, Users } from "lucide-react";
import { useState } from "react";
import {
  useCompletionDashboard,
  useEmployeeGoals,
  useMyTeam,
} from "../../hooks/useManager";
import { GoalStatus } from "../../lib/types";
import type { CompletionDashboardRow, Goal, User } from "../../lib/types";

const statusConfig: Record<GoalStatus, { label: string; cls: string }> = {
  [GoalStatus.Draft]: {
    label: "Draft",
    cls: "bg-muted text-muted-foreground border-border",
  },
  [GoalStatus.Submitted]: {
    label: "Submitted",
    cls: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  },
  [GoalStatus.UnderReview]: {
    label: "Under Review",
    cls: "bg-chart-1/10 text-chart-1 border-chart-1/30",
  },
  [GoalStatus.ApprovedLocked]: {
    label: "Approved",
    cls: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  },
  [GoalStatus.ReturnedForRework]: {
    label: "Rework",
    cls: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

function GoalRow({ goal }: { goal: Goal }) {
  const s = statusConfig[goal.status];
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 text-sm">
      <Target size={13} className="text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{goal.title}</p>
        <p className="text-xs text-muted-foreground">{goal.description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-muted-foreground">
          W: {goal.weightage}%
        </span>
        <Badge variant="outline" className={`text-[10px] ${s.cls}`}>
          {s.label}
        </Badge>
      </div>
    </div>
  );
}

function MemberCard({
  member,
  row,
}: { member: User; row?: CompletionDashboardRow }) {
  const [open, setOpen] = useState(false);
  const { data: goals = [], isLoading } = useEmployeeGoals(
    open ? member.id : undefined,
  );

  const totalW = goals.reduce((s, g) => s + g.weightage, 0);
  const hasSubmitted = goals.some(
    (g) =>
      g.status === GoalStatus.Submitted || g.status === GoalStatus.UnderReview,
  );
  const isApproved = row?.approved ?? false;

  return (
    <Card className="overflow-hidden" data-ocid="team.member_card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-smooth text-left group"
        data-ocid="team.member.expand_button"
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
          {member.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{member.name}</p>
          <p className="text-xs text-muted-foreground">
            {member.email} · {member.department}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasSubmitted && !isApproved && (
            <Badge
              variant="outline"
              className="text-[10px] bg-chart-4/10 text-chart-4 border-chart-4/30"
            >
              Needs Approval
            </Badge>
          )}
          {isApproved && (
            <Badge
              variant="outline"
              className="text-[10px] bg-chart-2/10 text-chart-2 border-chart-2/30"
            >
              Approved
            </Badge>
          )}
          {hasSubmitted && !isApproved && (
            <Link
              to="/manager/approvals"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-primary font-medium hover:underline"
              data-ocid="team.member.review_link"
            >
              Review →
            </Link>
          )}
          {open ? (
            <ChevronDown size={16} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-muted/10">
          {isLoading ? (
            <div className="p-4 space-y-2" data-ocid="team.goals.loading_state">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div
              className="px-5 py-6 text-center"
              data-ocid="team.goals.empty_state"
            >
              <p className="text-sm text-muted-foreground">
                No goals created yet.
              </p>
            </div>
          ) : (
            <>
              {goals.map((g) => (
                <GoalRow key={g.id} goal={g} />
              ))}
              <div className="px-5 py-2.5 flex items-center justify-between bg-muted/20 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Total weightage
                </span>
                <span
                  className={`text-xs font-bold ${totalW === 100 ? "text-chart-2" : "text-destructive"}`}
                >
                  {totalW}%
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

export default function TeamGoals() {
  const { data: team = [], isLoading } = useMyTeam();
  const { data: completion = [] } = useCompletionDashboard();
  const [search, setSearch] = useState("");

  const filtered = team.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            My Team
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Goal submission status for all direct reports.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {team.length} members
        </Badge>
      </div>

      <input
        type="search"
        placeholder="Search team members…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm px-3 py-2 text-sm rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        data-ocid="team.search_input"
      />

      {isLoading ? (
        <div className="space-y-3" data-ocid="team.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card data-ocid="team.empty_state">
          <CardContent className="py-12 text-center">
            <Users
              size={36}
              className="text-muted-foreground/40 mx-auto mb-3"
            />
            <p className="text-sm text-muted-foreground">
              No team members found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3" data-ocid="team.member_list">
          {filtered.map((member) => (
            <MemberCard
              key={member.id.toString()}
              member={member}
              row={completion.find(
                (r) => r.user.id.toString() === member.id.toString(),
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
