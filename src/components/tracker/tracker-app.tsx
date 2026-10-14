"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Eraser,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { BlockGrid } from "@/components/block-grid";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  adherenceScore,
  categoryDrift,
  efficiencyScore,
  hoursByKind,
  mappedHours,
  plannedBlockCount,
} from "@/lib/analytics";
import {
  DEFAULT_CATEGORIES,
  KIND_LABEL,
  createCategoryId,
} from "@/lib/categories";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import {
  deleteRemoteState,
  fetchRemoteState,
  mergeState,
  pushState,
  readLocal,
  writeLocal,
} from "@/lib/sync";
import {
  BLOCKS_PER_DAY,
  emptyDay,
  formatHours,
  formatLongDate,
  isFutureDateKey,
  localDateKey,
  shiftDateKey,
} from "@/lib/time";
import type {
  Category,
  DaysMap,
  DaySlice,
  SyncStatus,
  TimelineMode,
} from "@/lib/types";

type Props = {
  email: string | null;
  demo: boolean;
};

const SAVE_DEBOUNCE_MS = 600;

function ensureDay(days: DaysMap, key: string): DaysMap {
  if (days[key]) return days;
  return { ...days, [key]: { planned: emptyDay(), actual: emptyDay() } };
}

export function TrackerApp({ email, demo }: Props) {
  const router = useRouter();
  const db = useMemo(() => getFirebaseDb(), []);
  const auth = useMemo(() => getFirebaseAuth(), []);
  const [dateKey, setDateKey] = useState(localDateKey);
  const [mode, setMode] = useState<TimelineMode>("actual");
  const [brush, setBrush] = useState<string | null>(DEFAULT_CATEGORIES[1].id);
  const [cats, setCats] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [days, setDays] = useState<DaysMap>({});
  const [sync, setSync] = useState<SyncStatus>("idle");
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const saveTimer = useRef<number | null>(null);
  const skipFirstSave = useRef(true);
  const catsDirty = useRef(false);

  const today = localDateKey();
  const day: DaySlice = days[dateKey] ?? {
    planned: emptyDay(),
    actual: emptyDay(),
  };
  const activeBlocks = mode === "planned" ? day.planned : day.actual;

  /** Read-merge-write against the cloud copy, then persist the merged result. */
  const syncNow = useCallback(async () => {
    if (!db || demo || !userId) return;
    setSync("saving");
    try {
      const before = readLocal();
      const remote = await fetchRemoteState(db, userId);
      const merged = mergeState(before, remote);
      const changed =
        JSON.stringify(merged.days) !== JSON.stringify(before.days) ||
        JSON.stringify(merged.cats) !== JSON.stringify(before.cats);
      if (changed) {
        setDays(merged.days);
        setCats(merged.cats);
      }
      await pushState(db, userId, merged);
      if (merged.catsDirty) {
        catsDirty.current = false;
        writeLocal({ ...merged, catsDirty: false });
      }
      setSync("saved");
    } catch {
      setSync("error");
    }
  }, [demo, db, userId]);

  const persist = useCallback(
    (nextDays: DaysMap, nextCats: Category[]) => {
      writeLocal({
        days: nextDays,
        cats: nextCats,
        catsDirty: catsDirty.current,
      });
      if (!db || demo || !userId) {
        setSync("saved");
        return;
      }
      setSync("saving");
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        saveTimer.current = null;
        void syncNow();
      }, SAVE_DEBOUNCE_MS);
    },
    [demo, db, userId, syncNow],
  );

  // Load local state, then the cloud copy, before the grid becomes interactive.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = readLocal();
      let state = local;
      let signedInId: string | null = null;
      let failed = false;
      if (db && auth && !demo) {
        await auth.authStateReady();
        const user = auth.currentUser;
        if (cancelled) return;
        if (user) {
          signedInId = user.uid;
          try {
            const remote = await fetchRemoteState(db, user.uid);
            state = mergeState(local, remote);
          } catch {
            failed = true;
          }
        }
      }
      if (cancelled) return;
      catsDirty.current = state.catsDirty;
      setDays(state.days);
      setCats(state.cats);
      setUserId(signedInId);
      if (failed) setSync("error");
      // Signed-in users push the merged result once so both sides converge.
      skipFirstSave.current = signedInId === null;
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [demo, db, auth]);

  useEffect(() => {
    if (!ready) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    persist(days, cats);
  }, [days, cats, persist, ready]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  const paintBlock = (index: number) => {
    if (mode === "compare" || !ready) return;
    const now = Date.now();
    setDays((prev) => {
      const base = ensureDay(prev, dateKey);
      const current = base[dateKey];
      const planned = mode === "planned";
      const next: DaySlice = {
        ...current,
        planned: planned ? [...current.planned] : current.planned,
        actual: planned ? current.actual : [...current.actual],
        plannedAt: planned ? now : current.plannedAt,
        actualAt: planned ? current.actualAt : now,
      };
      (planned ? next.planned : next.actual)[index] = brush;
      return { ...base, [dateKey]: next };
    });
  };

  const clearMode = () => {
    if (!ready || mode === "compare") return;
    const planned = mode === "planned";
    if (
      !window.confirm(
        `Clear all ${mode} blocks for ${formatLongDate(dateKey)}?`,
      )
    ) {
      return;
    }
    const now = Date.now();
    setDays((prev) => {
      const base = ensureDay(prev, dateKey);
      const current = base[dateKey];
      return {
        ...base,
        [dateKey]: {
          ...current,
          planned: planned ? emptyDay() : current.planned,
          actual: planned ? current.actual : emptyDay(),
          plannedAt: planned ? now : current.plannedAt,
          actualAt: planned ? current.actualAt : now,
        },
      };
    });
  };

  const goDay = (delta: number) => {
    const next = shiftDateKey(dateKey, delta);
    if (isFutureDateKey(next, today)) return;
    setDateKey(next);
  };

  const mapped = mappedHours(day.actual);
  const productive = hoursByKind(day.actual, cats, "productive");
  const friction = hoursByKind(day.actual, cats, "friction");
  const efficiency = efficiencyScore(day.actual, cats);
  const adherence = adherenceScore(day.planned, day.actual);
  const plannedCount = plannedBlockCount(day.planned);
  const drift = categoryDrift(day.planned, day.actual, cats);
  const filled = cats
    .map((cat) => ({
      cat,
      count: day.actual.filter((id) => id === cat.id).length,
    }))
    .filter((row) => row.count > 0);

  const signOut = async () => {
    if (demo) {
      await fetch("/auth/demo", { method: "DELETE" });
      router.push("/");
      router.refresh();
      return;
    }
    await auth?.signOut();
    router.push("/");
    router.refresh();
  };

  const saveCategory = (cat: Category, isNew: boolean) => {
    const clean: Category = { ...cat, name: cat.name.trim() || "Untitled" };
    catsDirty.current = true;
    setCats((prev) =>
      isNew
        ? [...prev, clean]
        : prev.map((item) => (item.id === clean.id ? clean : item)),
    );
    setEditorOpen(false);
    setEditing(null);
  };

  const deleteCategory = (id: string) => {
    const now = Date.now();
    catsDirty.current = true;
    setCats((prev) => prev.filter((c) => c.id !== id));
    setDays((prev) => {
      const next: DaysMap = {};
      for (const [key, value] of Object.entries(prev)) {
        const plannedHit = value.planned.includes(id);
        const actualHit = value.actual.includes(id);
        next[key] = {
          ...value,
          planned: plannedHit
            ? value.planned.map((block) => (block === id ? null : block))
            : value.planned,
          actual: actualHit
            ? value.actual.map((block) => (block === id ? null : block))
            : value.actual,
          plannedAt: plannedHit ? now : value.plannedAt,
          actualAt: actualHit ? now : value.actualAt,
        };
      }
      return next;
    });
    if (brush === id) setBrush(null);
    setEditorOpen(false);
    setEditing(null);
  };

  const eraseAll = async () => {
    if (
      !window.confirm(
        "Erase every audited day and reset categories? This cannot be undone.",
      )
    ) {
      return;
    }
    if (db && !demo && userId) {
      setSync("saving");
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
      try {
        await deleteRemoteState(db, userId);
      } catch {
        setSync("error");
        return;
      }
    }
    catsDirty.current = false;
    setDays({});
    setCats(DEFAULT_CATEGORIES);
    setBrush(DEFAULT_CATEGORIES[1].id);
    setSync("saved");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Brand href="/app" compact />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <SyncPill status={sync} />
            <ThemeToggle />
            <span className="hidden max-w-[220px] truncate font-mono text-[11px] text-muted sm:inline">
              {email ?? "local workspace"}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted transition-colors hover:text-foreground"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goDay(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-card"
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={dateKey}
              max={today}
              onChange={(e) => {
                const value = e.target.value;
                if (!value || isFutureDateKey(value, today)) return;
                setDateKey(value);
              }}
              className="h-9 rounded-lg border border-border bg-card px-3 font-mono text-sm text-foreground"
            />
            <button
              type="button"
              onClick={() => goDay(1)}
              disabled={dateKey >= today}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-card disabled:opacity-30"
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
            <p className="ml-2 hidden text-sm text-muted md:block">
              {formatLongDate(dateKey)}
            </p>
          </div>
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            {(["planned", "actual", "compare"] as TimelineMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-full px-3.5 py-1.5 text-xs capitalize transition-colors ${
                  mode === item
                    ? "bg-foreground text-background"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                48-block timeline
              </p>
              <p className="text-sm text-foreground">
                {mode === "compare"
                  ? "Visual diff · planned left, actual right"
                  : `Painting ${mode} · 12:00 AM through 11:30 PM`}
              </p>
            </div>
            {mode === "compare" ? (
              <p className="font-mono text-sm">
                Adherence{" "}
                <span className="text-cyan-400">
                  {adherence == null ? "—" : `${adherence.toFixed(0)}%`}
                </span>
                <span className="ml-2 text-xs text-muted">
                  of {plannedCount} planned
                </span>
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted">
                  Drag, or focus a block: Enter paints, arrows move · {brush ? "brush armed" : "eraser"}
                </p>
                <button
                  type="button"
                  onClick={clearMode}
                  disabled={!ready}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-40"
                >
                  <RotateCcw size={12} />
                  Clear {mode}
                </button>
              </div>
            )}
          </div>
          <BlockGrid
            blocks={activeBlocks}
            cats={cats}
            interactive={mode !== "compare" && ready}
            onPaint={paintBlock}
            compare={
              mode === "compare"
                ? { planned: day.planned, actual: day.actual }
                : undefined
            }
          />
        </section>

        {mode !== "compare" ? (
          <section className="mt-4 rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Categories</p>
              <button
                type="button"
                onClick={() => {
                  setEditing({
                    id: createCategoryId(),
                    name: "New category",
                    color: "#22d3ee",
                    icon: "✦",
                    kind: "neutral",
                  });
                  setEditorOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-foreground"
              >
                <Plus size={12} />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {cats.map((cat) => {
                const active = brush === cat.id;
                return (
                  <div key={cat.id} className="group relative">
                    <button
                      type="button"
                      onClick={() =>
                        setBrush((current) => (current === cat.id ? null : cat.id))
                      }
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all ${
                        active
                          ? "border-foreground bg-foreground/5 text-foreground"
                          : "border-border text-muted hover:text-foreground"
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.icon}</span>
                      {cat.name}
                      <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                        {cat.kind[0]}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(cat);
                        setEditorOpen(true);
                      }}
                      className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-muted group-hover:flex"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Pencil size={10} />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setBrush(null)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                  brush === null
                    ? "border-foreground text-foreground"
                    : "border-border text-muted"
                }`}
              >
                <Eraser size={12} />
                Eraser
              </button>
            </div>
          </section>
        ) : (
          <section className="mt-4 rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-sm font-medium">Category drift</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="font-mono text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Planned</th>
                    <th className="pb-2 font-medium">Actual</th>
                    <th className="pb-2 font-medium">Drift</th>
                  </tr>
                </thead>
                <tbody>
                  {drift.map((row) => (
                    <tr key={row.cat.id} className="border-t border-border">
                      <td className="py-2">
                        {row.cat.icon} {row.cat.name}
                      </td>
                      <td className="font-mono">{formatHours(row.plannedHours)}</td>
                      <td className="font-mono">{formatHours(row.actualHours)}</td>
                      <td
                        className={`font-mono ${
                          row.drift > 0
                            ? "text-amber-400"
                            : row.drift < 0
                              ? "text-cyan-400"
                              : "text-muted"
                        }`}
                      >
                        {row.drift > 0 ? "+" : ""}
                        {formatHours(row.drift)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-medium">Day composition</p>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-surface">
              {filled.length === 0 ? (
                <div className="h-full w-full bg-border" />
              ) : (
                filled.map((row) => (
                  <div
                    key={row.cat.id}
                    className="h-full"
                    style={{
                      width: `${(row.count / BLOCKS_PER_DAY) * 100}%`,
                      backgroundColor: row.cat.color,
                    }}
                    title={`${row.cat.name} ${formatHours(row.count * 0.5)}`}
                  />
                ))
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Mapped" value={`${formatHours(mapped)} / 24h`} />
              <Stat label="Productive" value={formatHours(productive)} />
              <Stat label="Friction" value={formatHours(friction)} />
              <Stat
                label="Efficiency"
                value={efficiency == null ? "—" : `${efficiency.toFixed(0)}%`}
                hint={
                  efficiency == null
                    ? "No productive or friction time"
                    : `${formatHours(productive + friction)} scored`
                }
                tone={
                  efficiency == null
                    ? "muted"
                    : efficiency >= 70
                      ? "good"
                      : efficiency >= 40
                        ? "mid"
                        : "bad"
                }
              />
            </div>
            <p className="mt-3 font-mono text-[11px] leading-5 text-muted">
              Efficiency = productive hours / (productive + friction) × 100%.
              Neutral blocks are excluded.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-medium">Legend</p>
            <ul className="mt-3 space-y-2">
              {cats.map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 text-muted">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.icon} {cat.name}
                  </span>
                  <span className="font-mono text-[11px] uppercase text-muted">
                    {KIND_LABEL[cat.kind]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/20 bg-card p-4">
          <div>
            <p className="text-sm font-medium">Erase all data</p>
            <p className="text-xs text-muted">
              Removes every audited day and resets categories
              {demo ? " on this device." : " here and in your cloud row."}
            </p>
          </div>
          <button
            type="button"
            onClick={eraseAll}
            disabled={!ready}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-400/40 px-3 text-xs text-red-300 transition-colors hover:bg-red-400/10 disabled:opacity-40"
          >
            <Trash2 size={12} />
            Erase all data
          </button>
        </section>
      </main>

      {editorOpen && editing ? (
        <CategoryEditor
          cat={editing}
          isNew={!cats.some((c) => c.id === editing.id)}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
          onSave={saveCategory}
          onDelete={deleteCategory}
        />
      ) : null}
    </div>
  );
}

function SyncPill({ status }: { status: SyncStatus }) {
  const label =
    status === "saving"
      ? "Saving..."
      : status === "error"
        ? "Sync error"
        : status === "saved"
          ? "Saved"
          : "Idle";
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] ${
        status === "saving"
          ? "border-amber-400/40 text-amber-300"
          : status === "error"
            ? "border-red-400/40 text-red-300"
            : "border-emerald-400/30 text-emerald-300"
      }`}
    >
      {status === "saving" ? (
        <LoaderCircle size={10} className="animate-spin" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {label}
    </span>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "mid" | "bad" | "muted";
}) {
  const color =
    tone === "good"
      ? "text-emerald-400"
      : tone === "mid"
        ? "text-amber-400"
        : tone === "bad"
          ? "text-red-400"
          : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className={`mt-1 font-mono text-lg ${color}`}>{value}</p>
      {hint ? <p className="mt-0.5 font-mono text-[10px] text-muted">{hint}</p> : null}
    </div>
  );
}

function CategoryEditor({
  cat,
  isNew,
  onClose,
  onSave,
  onDelete,
}: {
  cat: Category;
  isNew: boolean;
  onClose: () => void;
  onSave: (cat: Category, isNew: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState(cat);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-medium">
            {isNew ? "New category" : "Edit category"}
          </h2>
          <button type="button" onClick={onClose} className="text-muted">
            Close
          </button>
        </div>
        <label className="block text-xs text-muted">
          Name
          <input
            value={draft.name}
            maxLength={40}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-xs text-muted">
            Icon
            <input
              value={draft.icon}
              maxLength={4}
              onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            />
          </label>
          <label className="block text-xs text-muted">
            Color
            <input
              type="color"
              value={draft.color}
              onChange={(e) => setDraft({ ...draft, color: e.target.value })}
              className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-border bg-surface"
            />
          </label>
        </div>
        <label className="mt-3 block text-xs text-muted">
          Kind
          <select
            value={draft.kind}
            onChange={(e) =>
              setDraft({
                ...draft,
                kind: e.target.value as Category["kind"],
              })
            }
            className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="productive">Productive</option>
            <option value="neutral">Neutral</option>
            <option value="friction">Friction</option>
          </select>
        </label>
        <div className="mt-5 flex items-center justify-between">
          {!isNew ? (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Delete "${draft.name}"? It will be removed from every day.`,
                  )
                ) {
                  onDelete(draft.id);
                }
              }}
              className="inline-flex items-center gap-1 text-xs text-red-400"
            >
              <Trash2 size={12} />
              Delete
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={!draft.name.trim()}
            onClick={() => onSave(draft, isNew)}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
