import type { Category } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "gym",
    name: "Gym / Physical",
    color: "#22c55e",
    icon: "🏋️",
    kind: "productive",
  },
  {
    id: "deep-work",
    name: "Deep Work / Coding",
    color: "#3b82f6",
    icon: "💻",
    kind: "productive",
  },
  {
    id: "learning",
    name: "Learning / School",
    color: "#a855f7",
    icon: "📚",
    kind: "productive",
  },
  {
    id: "gaming",
    name: "Gaming / Fun",
    color: "#f59e0b",
    icon: "🎮",
    kind: "neutral",
  },
  {
    id: "friction",
    name: "Friction / Wasted",
    color: "#ef4444",
    icon: "⚠️",
    kind: "friction",
  },
  {
    id: "sleep",
    name: "Sleep / Recovery",
    color: "#64748b",
    icon: "😴",
    kind: "neutral",
  },
];

export function categoryById(
  cats: Category[],
  id: string | null,
): Category | undefined {
  if (!id) return undefined;
  return cats.find((c) => c.id === id);
}

export function createCategoryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const KIND_LABEL: Record<Category["kind"], string> = {
  productive: "Productive",
  neutral: "Neutral",
  friction: "Friction",
};
