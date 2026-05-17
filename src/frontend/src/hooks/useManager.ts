import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createActor } from "../backend";
import { isOk } from "../lib/backend-helpers";
import type {
  Achievement,
  AchievementReportRow,
  CompletionDashboardRow,
  Goal,
  ManagerCheckIn,
  User,
} from "../lib/types";
import type { CheckInPeriod } from "../lib/types";

// ── Team ──────────────────────────────────────────────────────────────────────

export function useMyTeam() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<User[]>({
    queryKey: ["manager", "team"],
    queryFn: async () => {
      if (!actor) return [];
      const res = await actor.getMyTeam();
      return isOk(res) ? res.ok : [];
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Employee Goals ────────────────────────────────────────────────────────────

export function useEmployeeGoals(employeeId: Principal | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Goal[]>({
    queryKey: ["manager", "goals", employeeId?.toString()],
    queryFn: async () => {
      if (!actor || !employeeId) return [];
      const res = await actor.getEmployeeGoals(employeeId);
      return isOk(res) ? res.ok : [];
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });
}

// ── Approve goals ─────────────────────────────────────────────────────────────

export function useApproveGoals() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (employeeId: Principal) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.managerApproveGoals(employeeId);
      if (!isOk(res)) throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      toast.success("Goals approved and locked.");
      qc.invalidateQueries({ queryKey: ["manager"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Return for rework ─────────────────────────────────────────────────────────

export function useReturnGoals() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      reason,
    }: { employeeId: Principal; reason: string }) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.managerReturnGoals(employeeId, reason);
      if (!isOk(res)) throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      toast.success("Goals returned for rework.");
      qc.invalidateQueries({ queryKey: ["manager"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Inline edit goal ──────────────────────────────────────────────────────────

export function useManagerEditGoal() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      goalId,
      target,
      weightage,
    }: {
      goalId: string;
      target: number | null;
      weightage: number | null;
    }) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.managerEditGoal(goalId, target, weightage);
      if (!isOk(res)) throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      toast.success("Goal updated.");
      qc.invalidateQueries({ queryKey: ["manager", "goals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Achievements ─────────────────────────────────────────────────────────────

export function useEmployeeAchievements(
  employeeId: Principal | undefined,
  period: CheckInPeriod,
) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Achievement[]>({
    queryKey: ["manager", "achievements", employeeId?.toString(), period],
    queryFn: async () => {
      if (!actor || !employeeId) return [];
      const res = await actor.getEmployeeAchievements(employeeId, period);
      return isOk(res) ? res.ok : [];
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });
}

// ── Achievement report ────────────────────────────────────────────────────────

export function useAchievementReport(period: CheckInPeriod) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AchievementReportRow[]>({
    queryKey: ["manager", "report", period],
    queryFn: async () => {
      if (!actor) return [];
      const res = await actor.getAchievementReport(period);
      return isOk(res) ? res.ok : [];
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Completion dashboard ──────────────────────────────────────────────────────

export function useCompletionDashboard() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CompletionDashboardRow[]>({
    queryKey: ["manager", "completion"],
    queryFn: async () => {
      if (!actor) return [];
      const res = await actor.getCompletionDashboard();
      return isOk(res) ? res.ok : [];
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Check-in comments ─────────────────────────────────────────────────────────

export function useCheckInComments(
  employeeId: Principal | undefined,
  period: CheckInPeriod,
) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<ManagerCheckIn[]>({
    queryKey: ["manager", "checkins", employeeId?.toString(), period],
    queryFn: async () => {
      if (!actor || !employeeId) return [];
      const res = await actor.getCheckInComments(employeeId, period);
      return isOk(res) ? res.ok : [];
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });
}

// ── Add check-in comment ──────────────────────────────────────────────────────

export function useAddCheckInComment() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      goalId,
      employeeId,
      period,
      comment,
    }: {
      goalId: string;
      employeeId: Principal;
      period: CheckInPeriod;
      comment: string;
    }) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.addCheckInComment(
        goalId,
        employeeId,
        period,
        comment,
      );
      if (!isOk(res)) throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      toast.success("Check-in comment saved.");
      qc.invalidateQueries({ queryKey: ["manager", "checkins"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
