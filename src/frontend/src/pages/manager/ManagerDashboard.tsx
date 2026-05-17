import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CalendarCheck,
  ChevronRight,
  ClipboardCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMyTeam } from "../../hooks/useManager";
import { useCompletionDashboard } from "../../hooks/useManager";
import { useEmployeeGoals } from "../../hooks/useManager";
import { GoalStatus } from "../../lib/types";
import type { CompletionDashboardRow, User } from "../../lib/types";

function TeamMemberRow({
  member,
  row,
}: { member: User; row?: CompletionDashboardRow }) {
  const { data: goals = [] } = useEmployeeGoals(member.id);
  const pendingApproval = goals.some(
    (g) =>
      g.status === GoalStatus.Submitted || g.status === GoalStatus.UnderReview,
  );
  const approvedCount = goals.filter(
    (g) => g.status === GoalStatus.ApprovedLocked,
  ).length;
  const totalGoals = goals.length;

  return (
    <Link
      to="/manager/approvals"
      data-ocid="team.member.row"
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-smooth border-b border-border last:border-0 cursor-pointer group"
    >
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
        {member.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {member.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {member.department}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {pendingApproval && (
          <Badge
            variant="outline"
            className="text-[10px] bg-chart-4/10 text-chart-4 border-chart-4/30"
          >
            Needs Review
          </Badge>
        )}
        {row?.approved && (
          <Badge
            variant="outline"
            className="text-[10px] bg-chart-2/10 text-chart-2 border-chart-2/30"
          >
            Approved
          </Badge>
        )}
        {totalGoals > 0 && (
          <span className="text-xs text-muted-foreground">
            {approvedCount}/{totalGoals} goals
          </span>
        )}
        <ChevronRight
          size={14}
          className="text-muted-foreground group-hover:text-primary transition-smooth"
        />
      </div>
    </Link>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  href,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  href: string;
  accent: string;
}) {
  return (
    <Link to={href} data-ocid="dashboard.stat_card">
      <Card className="hover:shadow-md transition-smooth cursor-pointer border-border group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-lg ${accent}`}>{icon}</div>
            <ChevronRight
              size={16}
              className="text-muted-foreground group-hover:text-primary transition-smooth mt-1"
            />
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          {sub && (
            <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function ManagerDashboard() {
  const { data: team = [], isLoading: teamLoading } = useMyTeam();
  const { data: completion = [] } = useCompletionDashboard();

  const pendingCount = completion.filter(
    (r) => r.submitted && !r.approved,
  ).length;
  const approvedCount = completion.filter((r) => r.approved).length;
  const q1Done = completion.filter((r) => r.q1Done).length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Manager Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overview of your team's goal progress.
          </p>
        </div>
        {pendingCount > 0 && (
          <div
            className="flex items-center gap-2 bg-chart-4/10 text-chart-4 border border-chart-4/30 rounded-lg px-3 py-2 text-sm font-medium"
            data-ocid="dashboard.pending_alert"
          >
            <AlertCircle size={15} />
            <span>
              {pendingCount} pending approval{pendingCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        data-ocid="dashboard.stats_section"
      >
        <StatCard
          icon={<Users size={18} className="text-primary" />}
          label="Team Members"
          value={team.length}
          href="/manager/team"
          accent="bg-primary/10"
        />
        <StatCard
          icon={<ClipboardCheck size={18} className="text-chart-4" />}
          label="Pending Approvals"
          value={pendingCount}
          sub="awaiting your review"
          href="/manager/approvals"
          accent="bg-chart-4/10"
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-chart-2" />}
          label="Goals Approved"
          value={approvedCount}
          sub={`of ${team.length} team members`}
          href="/manager/approvals"
          accent="bg-chart-2/10"
        />
        <StatCard
          icon={<CalendarCheck size={18} className="text-chart-3" />}
          label="Q1 Check-ins Done"
          value={q1Done}
          sub={`of ${team.length} team members`}
          href="/manager/checkins"
          accent="bg-chart-3/10"
        />
      </div>

      {/* Team list */}
      <Card data-ocid="dashboard.team_card">
        <CardHeader className="pb-2 px-5 pt-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            Direct Reports
          </CardTitle>
          <Link
            to="/manager/team"
            className="text-xs text-primary hover:underline font-medium"
            data-ocid="dashboard.view_team_link"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {teamLoading ? (
            <div className="p-5 space-y-3" data-ocid="team.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : team.length === 0 ? (
            <div
              className="px-5 py-10 text-center"
              data-ocid="team.empty_state"
            >
              <Users
                size={32}
                className="text-muted-foreground/40 mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">
                No team members assigned yet.
              </p>
            </div>
          ) : (
            <div data-ocid="team.member_list">
              {team.map((member, _i) => (
                <TeamMemberRow
                  key={member.id.toString()}
                  member={member}
                  row={completion.find(
                    (r) => r.user.id.toString() === member.id.toString(),
                  )}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-in schedule */}
      <Card data-ocid="dashboard.schedule_card">
        <CardHeader className="pb-2 px-5 pt-4">
          <CardTitle className="text-base font-semibold text-foreground">
            Check-in Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { period: "Goal Setting", window: "1st May", active: true },
              { period: "Q1 Check-in", window: "July", active: true },
              { period: "Q2 Check-in", window: "October", active: false },
              { period: "Q3 Check-in", window: "January", active: false },
            ].map((s) => (
              <div
                key={s.period}
                className={`rounded-lg border px-3 py-3 text-sm ${s.active ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"}`}
              >
                <p
                  className={`font-semibold text-xs uppercase tracking-wide ${s.active ? "text-primary" : "text-muted-foreground"}`}
                >
                  {s.period}
                </p>
                <p className="text-foreground mt-1 font-medium">{s.window}</p>
                {s.active && (
                  <span className="text-[10px] text-primary font-semibold">
                    ● ACTIVE
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
