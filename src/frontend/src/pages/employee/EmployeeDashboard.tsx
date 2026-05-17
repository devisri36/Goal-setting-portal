import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { useMyGoals } from "../../hooks/useGoals";
import { CheckInPeriod, GoalStatus } from "../../lib/types";
import { useAuthStore } from "../../store/authStore";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="shadow-subtle">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmployeeDashboard() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { data: goals = [], isLoading } = useMyGoals();

  const stats = useMemo(() => {
    const total = goals.length;
    const approved = goals.filter(
      (g) => g.status === GoalStatus.ApprovedLocked,
    ).length;
    const submitted = goals.filter(
      (g) =>
        g.status === GoalStatus.Submitted ||
        g.status === GoalStatus.UnderReview,
    ).length;
    const draft = goals.filter(
      (g) =>
        g.status === GoalStatus.Draft ||
        g.status === GoalStatus.ReturnedForRework,
    ).length;
    const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
    return { total, approved, submitted, draft, totalWeightage };
  }, [goals]);

  const currentPeriod = CheckInPeriod.Q1;

  const periodLabels: Record<CheckInPeriod, string> = {
    [CheckInPeriod.Q1]: "Q1 (July)",
    [CheckInPeriod.Q2]: "Q2 (October)",
    [CheckInPeriod.Q3]: "Q3 (January)",
    [CheckInPeriod.Q4Annual]: "Q4 / Annual (March)",
  };

  const approvedGoals = goals
    .filter((g) => g.status === GoalStatus.ApprovedLocked)
    .slice(0, 3);

  return (
    <div className="p-6 space-y-6" data-ocid="employee.dashboard.page">
      {/* Welcome banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Welcome back, {currentUser?.name ?? "Employee"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentUser?.department} &middot; Active period:{" "}
            <span className="font-medium text-primary">
              {periodLabels[currentPeriod]}
            </span>
          </p>
        </div>
        <div className="hidden sm:flex gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            data-ocid="employee.dashboard.goals_link"
          >
            <Link to="/employee/goals">
              <ClipboardList className="w-4 h-4 mr-2" />
              My Goals
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            data-ocid="employee.dashboard.checkins_link"
          >
            <Link to="/employee/checkins">
              <BarChart3 className="w-4 h-4 mr-2" />
              Check-ins
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["s0", "s1", "s2", "s3"].map((k) => (
            <Skeleton key={k} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          data-ocid="employee.stats.section"
        >
          <StatCard
            label="Total Goals"
            value={stats.total}
            icon={Target}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            label="Approved"
            value={stats.approved}
            icon={CheckCircle2}
            color="bg-green-500/10 text-green-600"
          />
          <StatCard
            label="Pending Review"
            value={stats.submitted}
            icon={Clock}
            color="bg-yellow-500/10 text-yellow-600"
          />
          <StatCard
            label="Draft / Rework"
            value={stats.draft}
            icon={AlertCircle}
            color="bg-orange-500/10 text-orange-600"
          />
        </div>
      )}

      {/* Weightage gauge */}
      {!isLoading && goals.length > 0 && (
        <Card className="shadow-subtle" data-ocid="employee.weightage.card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Goal Weightage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Total allocated</span>
              <span
                className={`font-bold text-sm ${
                  stats.totalWeightage === 100
                    ? "text-green-600"
                    : "text-orange-500"
                }`}
              >
                {stats.totalWeightage}%
              </span>
            </div>
            <Progress
              value={Math.min(stats.totalWeightage, 100)}
              className="h-3"
            />
            {stats.totalWeightage !== 100 && (
              <p className="text-xs text-orange-500 mt-2">
                Total weightage must equal 100% before submission. Currently:{" "}
                {stats.totalWeightage}%
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approved goals preview */}
      {!isLoading && approvedGoals.length > 0 && (
        <div data-ocid="employee.approved_goals.section">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground text-sm">
              Active Approved Goals
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/employee/goals">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-2">
            {approvedGoals.map((goal, i) => (
              <Card
                key={goal.id}
                className="shadow-subtle"
                data-ocid={`employee.approved_goals.item.${i + 1}`}
              >
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {goal.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {goal.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {goal.weightage}%
                    </Badge>
                    <Badge className="bg-green-500/15 text-green-700 border-green-200 text-xs">
                      Approved
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && goals.length === 0 && (
        <Card
          className="shadow-subtle border-dashed"
          data-ocid="employee.dashboard.empty_state"
        >
          <CardContent className="py-12 flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">No goals yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Start by creating your first goal for this cycle.
              </p>
            </div>
            <Button asChild data-ocid="employee.dashboard.create_goal_button">
              <Link to="/employee/goals">
                <Target className="w-4 h-4 mr-2" />
                Create My First Goal
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
