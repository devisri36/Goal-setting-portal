import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createActor } from "../backend";
import type {
  AchievementStatus,
  CheckInPeriod,
  UoMDirection,
  UoMType,
} from "../lib/types";
import type { Achievement, Goal, ThrustArea } from "../lib/types";

// ─── Keys ───────────────────────────────────────────────────────────────────
export const goalKeys = {
  myGoals: ["myGoals"] as const,
  thrustAreas: ["thrustAreas"] as const,
  achievements: (period: CheckInPeriod) => ["achievements", period] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────
export function useMyGoals() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Goal[]>({
    queryKey: goalKeys.myGoals,
    queryFn: async () => {
      if (!actor) return [];
      const res = await actor.getMyGoals();
      if (res.__kind__ === "ok") return res.ok;
      throw new Error(res.err);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useThrustAreas() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<ThrustArea[]>({
    queryKey: goalKeys.thrustAreas,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getThrustAreas();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyAchievements(period: CheckInPeriod) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Achievement[]>({
    queryKey: goalKeys.achievements(period),
    queryFn: async () => {
      if (!actor) return [];
      const res = await actor.getMyAchievements(period);
      if (res.__kind__ === "ok") return res.ok;
      throw new Error(res.err);
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────
export interface CreateGoalInput {
  thrustAreaId: string;
  title: string;
  description: string;
  uomType: UoMType;
  uomDirection: UoMDirection | null;
  target: number;
  weightage: number;
}

export function useCreateGoal() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      if (!actor) throw new Error("Not connected");
      const res = await actor.createGoal(
        input.thrustAreaId,
        input.title,
        input.description,
        input.uomType,
        input.uomDirection,
        input.target,
        input.weightage,
      );
      if (res.__kind__ === "ok") return res.ok;
      throw new Error(res.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalKeys.myGoals });
      toast.success("Goal created successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface UpdateGoalInput {
  goalId: string;
  title: string;
  description: string;
  uomType: UoMType;
  uomDirection: UoMDirection | null;
  target: number;
  weightage: number;
}

export function useUpdateGoal() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateGoalInput) => {
      if (!actor) throw new Error("Not connected");
      const res = await actor.updateGoal(
        input.goalId,
        input.title,
        input.description,
        input.uomType,
        input.uomDirection,
        input.target,
        input.weightage,
      );
      if (res.__kind__ === "ok") return res.ok;
      throw new Error(res.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalKeys.myGoals });
      toast.success("Goal updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitGoals() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const res = await actor.submitGoalsForApproval();
      if (res.__kind__ === "ok") return res.ok;
      throw new Error(res.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalKeys.myGoals });
      toast.success("Goals submitted for manager approval!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface LogAchievementInput {
  goalId: string;
  period: CheckInPeriod;
  actual: number;
  completionDate: bigint | null;
  achievementStatus: AchievementStatus;
}

export function useLogAchievement(period: CheckInPeriod) {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LogAchievementInput) => {
      if (!actor) throw new Error("Not connected");
      const res = await actor.logAchievement(
        input.goalId,
        input.period,
        input.actual,
        input.completionDate,
        input.achievementStatus,
      );
      if (res.__kind__ === "ok") return res.ok;
      throw new Error(res.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalKeys.achievements(period) });
      toast.success("Achievement logged!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSharedGoalWeightage() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      goalId,
      weightage,
    }: { goalId: string; weightage: number }) => {
      if (!actor) throw new Error("Not connected");
      const res = await actor.updateSharedGoalWeightage(goalId, weightage);
      if (res.__kind__ === "ok") return res.ok;
      throw new Error(res.err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: goalKeys.myGoals });
      toast.success("Weightage updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
