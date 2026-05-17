import { useActor } from "@caffeineai/core-infrastructure";
import { create } from "zustand";
import { createActor } from "../backend";
import { isOk } from "../lib/backend-helpers";
import type { User } from "../lib/types";

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ currentUser: user, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  logout: () => set({ currentUser: null, error: null }),
}));

// Hook that provides login action via actor
export function useAuth() {
  const { actor, isFetching } = useActor(createActor);
  const {
    currentUser,
    isLoading,
    error,
    setUser,
    setLoading,
    setError,
    logout,
  } = useAuthStore();

  const loginAsDemo = async (demoKey: string): Promise<User | null> => {
    if (!actor) return null;
    setLoading(true);
    setError(null);
    try {
      const result = await actor.loginAsDemo(demoKey);
      if (isOk(result)) {
        setUser(result.ok);
        return result.ok;
      }
      setError(result.err);
      return null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async (): Promise<void> => {
    if (!actor || isFetching) return;
    setLoading(true);
    try {
      const result = await actor.getCurrentUser();
      if (isOk(result)) {
        setUser(result.ok);
        return;
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    currentUser,
    isLoading: isLoading || isFetching,
    error,
    loginAsDemo,
    loadCurrentUser,
    logout,
  };
}
