import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createActor } from "../backend";
import { isOk } from "../lib/backend-helpers";
import type {
  AchievementReportRow,
  AuditLog,
  CompletionDashboardRow,
} from "../lib/types";
import type { CheckInPeriod } from "../lib/types";

export function useCompletionDashboard() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CompletionDashboardRow[]>({
    queryKey: ["completionDashboard"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getCompletionDashboard();
      return isOk(result) ? result.ok : [];
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useAchievementReport(period: CheckInPeriod) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AchievementReportRow[]>({
    queryKey: ["achievementReport", period],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getAchievementReport(period);
      return isOk(result) ? result.ok : [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAuditLog(goalId?: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AuditLog[]>({
    queryKey: ["auditLog", goalId ?? "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAuditLog(goalId ?? null);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllUsers() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminUnlockGoals() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      reason,
    }: { employeeId: string; reason: string }) => {
      if (!actor) throw new Error("Actor not ready");
      // employeeId is a string principal
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.adminUnlockGoals(
        Principal.fromText(employeeId),
        reason,
      );
      if (!isOk(result)) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      toast.success("Goals unlocked successfully");
      qc.invalidateQueries({ queryKey: ["completionDashboard"] });
      qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePushSharedGoal() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sourceGoalId,
      employeeIds,
    }: { sourceGoalId: string; employeeIds: string[] }) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      const principals = employeeIds.map((id) => Principal.fromText(id));
      const result = await actor.pushSharedGoal(sourceGoalId, principals);
      if (!isOk(result)) throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      toast.success("Shared goal pushed to selected employees");
      qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
