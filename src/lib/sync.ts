import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_CATEGORIES } from "./categories";
import { normalizeBlocks } from "./time";
import type { Category, DaySlice, DaysMap } from "./types";

export const STORAGE_KEY = "chronos-state-v1";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = new Set<string>(["productive", "neutral", "friction"]);

export type LocalState = {
  days: DaysMap;
  cats: Category[];
  /** True when categories changed locally and have not been confirmed by the cloud. */
  catsDirty: boolean;
};

export type RemoteState = {
  days: DaysMap;
  /** Empty when the cloud row has no categories yet. */
  cats: Category[];
};

function timestamp(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.color === "string" &&
    typeof c.icon === "string" &&
    typeof c.kind === "string" &&
    KINDS.has(c.kind)
  );
}

/** Returns null when the input is not an array at all; an empty array is valid. */
export function normalizeCats(raw: unknown): Category[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter(isCategory);
}

export function normalizeDays(raw: unknown): DaysMap {
  const out: DaysMap = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!DATE_KEY.test(key) || !value || typeof value !== "object") continue;
    const slice = value as Record<string, unknown>;
    out[key] = {
      planned: normalizeBlocks(slice.planned),
      actual: normalizeBlocks(slice.actual),
      plannedAt: timestamp(slice.plannedAt),
      actualAt: timestamp(slice.actualAt),
    };
  }
  return out;
}

export function readLocal(): LocalState {
  const fallback: LocalState = {
    days: {},
    cats: DEFAULT_CATEGORIES,
    catsDirty: false,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      days: normalizeDays(parsed.days),
      cats: normalizeCats(parsed.cats) ?? DEFAULT_CATEGORIES,
      catsDirty: parsed.catsDirty === true,
    };
  } catch {
    return fallback;
  }
}

export function writeLocal(state: LocalState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable; cloud sync still runs */
  }
}

/**
 * Merges two day maps. Planned and actual are resolved independently: whichever
 * side edited that mode most recently wins, so edits from two devices are kept.
 */
export function mergeDays(local: DaysMap, remote: DaysMap): DaysMap {
  const out: DaysMap = { ...remote };
  for (const [key, mine] of Object.entries(local)) {
    const theirs = remote[key];
    if (!theirs) {
      out[key] = mine;
      continue;
    }
    const plannedMine = timestamp(mine.plannedAt) >= timestamp(theirs.plannedAt);
    const actualMine = timestamp(mine.actualAt) >= timestamp(theirs.actualAt);
    const merged: DaySlice = {
      planned: plannedMine ? mine.planned : theirs.planned,
      actual: actualMine ? mine.actual : theirs.actual,
      plannedAt: Math.max(timestamp(mine.plannedAt), timestamp(theirs.plannedAt)),
      actualAt: Math.max(timestamp(mine.actualAt), timestamp(theirs.actualAt)),
    };
    out[key] = merged;
  }
  return out;
}

/**
 * Combines local state with the cloud copy. Local categories win while they are
 * dirty (unsynced edits); otherwise the cloud categories are used when present.
 */
export function mergeState(local: LocalState, remote: RemoteState | null): LocalState {
  if (!remote) return local;
  const useLocalCats = local.catsDirty || remote.cats.length === 0;
  return {
    days: mergeDays(local.days, remote.days),
    cats: useLocalCats ? local.cats : remote.cats,
    catsDirty: local.catsDirty,
  };
}

export async function fetchRemoteState(
  supabase: SupabaseClient,
  userId: string,
): Promise<RemoteState | null> {
  const { data, error } = await supabase
    .from("chronos_state")
    .select("days, cats")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    days: normalizeDays(data.days),
    cats: normalizeCats(data.cats) ?? [],
  };
}

export async function pushState(
  supabase: SupabaseClient,
  userId: string,
  state: LocalState,
): Promise<void> {
  const { error } = await supabase.from("chronos_state").upsert({
    user_id: userId,
    days: state.days,
    cats: state.cats,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
