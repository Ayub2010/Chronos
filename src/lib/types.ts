export type CategoryKind = "productive" | "neutral" | "friction";

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  kind: CategoryKind;
};

export type DaySlice = {
  planned: (string | null)[];
  actual: (string | null)[];
  /** Epoch ms of the last planned edit, used to merge with the cloud copy. */
  plannedAt?: number;
  /** Epoch ms of the last actual edit, used to merge with the cloud copy. */
  actualAt?: number;
};

export type DaysMap = Record<string, DaySlice>;

export type TimelineMode = "planned" | "actual" | "compare";

export type SyncStatus = "idle" | "saving" | "saved" | "error";
