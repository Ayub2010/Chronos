"use client";

import { useCallback, useRef } from "react";
import { categoryById } from "@/lib/categories";
import { blockRangeLabel, hourHeader } from "@/lib/time";
import type { Category } from "@/lib/types";

type Props = {
  blocks: (string | null)[];
  cats: Category[];
  interactive?: boolean;
  onPaint?: (index: number) => void;
  compact?: boolean;
  compare?: {
    planned: (string | null)[];
    actual: (string | null)[];
  };
};

export function BlockGrid({
  blocks,
  cats,
  interactive = false,
  onPaint,
  compact = false,
  compare,
}: Props) {
  const painting = useRef(false);
  const lastIndex = useRef<number | null>(null);

  const paintAt = useCallback(
    (clientX: number, clientY: number) => {
      if (!onPaint) return;
      const el = document.elementFromPoint(clientX, clientY);
      const cell = el?.closest("[data-block-index]") as HTMLElement | null;
      if (!cell) return;
      const index = Number(cell.dataset.blockIndex);
      if (Number.isNaN(index) || lastIndex.current === index) return;
      lastIndex.current = index;
      onPaint(index);
    },
    [onPaint],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    painting.current = true;
    lastIndex.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
    paintAt(event.clientX, event.clientY);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!painting.current) return;
    paintAt(event.clientX, event.clientY);
  };

  const stopPaint = () => {
    painting.current = false;
    lastIndex.current = null;
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div
      data-grid
      className="select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopPaint}
      onPointerCancel={stopPaint}
      onContextMenu={(e) => interactive && e.preventDefault()}
    >
      <div className="grid grid-cols-6 gap-1.5 md:grid-cols-12 md:gap-2">
        {hours.map((hour) => (
          <div key={hour} className="min-w-0">
            <div
              className={`mb-1 font-mono tracking-wide text-muted ${
                compact ? "text-[9px]" : "text-[10px] md:text-[11px]"
              }`}
            >
              {hourHeader(hour)}
            </div>
            <div className={`flex flex-col ${compact ? "gap-0.5" : "gap-1"}`}>
              {[0, 1].map((half) => {
                const index = hour * 2 + half;
                if (compare) {
                  return (
                    <CompareCell
                      key={index}
                      index={index}
                      plannedId={compare.planned[index]}
                      actualId={compare.actual[index]}
                      cats={cats}
                      compact={compact}
                    />
                  );
                }
                const id = blocks[index];
                const cat = categoryById(cats, id);
                return (
                  <div key={index} className="group relative min-w-0">
                    <button
                      type="button"
                      data-block-index={index}
                      className={`block-cell relative w-full overflow-hidden rounded-md border transition-transform duration-150 ${
                        compact ? "h-4 md:h-5" : "h-7 md:h-9"
                      } ${
                        cat
                          ? "border-transparent shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]"
                          : "border-border bg-surface hover:border-zinc-500/60"
                      } ${interactive ? "cursor-crosshair active:scale-[0.97]" : ""}`}
                      style={cat ? { backgroundColor: cat.color } : undefined}
                      aria-label={`${blockRangeLabel(index)}${cat ? `, ${cat.name}` : ", empty"}`}
                      onKeyDown={(event) => {
                        if (!interactive) return;
                        const moves: Record<string, number> = {
                          ArrowDown: 1,
                          ArrowUp: -1,
                          ArrowRight: 2,
                          ArrowLeft: -2,
                        };
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onPaint?.(index);
                          return;
                        }
                        const step = moves[event.key];
                        if (step === undefined) return;
                        event.preventDefault();
                        const target = index + step;
                        if (target < 0 || target >= blocks.length) return;
                        event.currentTarget
                          .closest<HTMLElement>("[data-grid]")
                          ?.querySelector<HTMLElement>(`[data-block-index="${target}"]`)
                          ?.focus();
                      }}
                    />
                    <span className={`pointer-events-none absolute bottom-[calc(100%+6px)] ${tooltipPosition(index)} z-20 hidden whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] text-foreground shadow-xl group-hover:block group-focus-within:block`}>
                      {blockRangeLabel(index)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tooltips stay centered over their cell, except in the first and last hour
// columns, which anchor to the cell's edge so they don't run off-screen.
function tooltipPosition(index: number): string {
  const hour = Math.floor(index / 2);
  if (hour === 0) return "left-0";
  if (hour === 23) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

function CompareCell({
  index,
  plannedId,
  actualId,
  cats,
  compact,
}: {
  index: number;
  plannedId: string | null;
  actualId: string | null;
  cats: Category[];
  compact: boolean;
}) {
  const planned = categoryById(cats, plannedId);
  const actual = categoryById(cats, actualId);
  const match = plannedId === actualId;

  return (
    <div className="group relative" data-block-index={index}>
      <div
        className={`relative overflow-hidden rounded-md border ${
          compact ? "h-4 md:h-5" : "h-7 md:h-9"
        } ${match ? "border-transparent" : "border-amber-400/40"}`}
      >
        {match ? (
          <div
            className="h-full w-full"
            style={{
              backgroundColor: actual?.color ?? "transparent",
              backgroundImage: actual
                ? undefined
                : "linear-gradient(135deg, var(--border) 25%, transparent 25%, transparent 50%, var(--border) 50%, var(--border) 75%, transparent 75%)",
              backgroundSize: actual ? undefined : "6px 6px",
            }}
          />
        ) : (
          <div className="flex h-full w-full">
            <div
              className="h-full w-1/2"
              style={{ backgroundColor: planned?.color ?? "var(--border)" }}
              title="Planned"
            />
            <div
              className="h-full w-1/2"
              style={{ backgroundColor: actual?.color ?? "var(--border)" }}
              title="Actual"
            />
          </div>
        )}
      </div>
      <span className={`pointer-events-none absolute bottom-[calc(100%+6px)] ${tooltipPosition(index)} z-20 hidden whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px] text-foreground shadow-xl group-hover:block`}>
        {blockRangeLabel(index)} · {match ? "aligned" : "drift"}
      </span>
    </div>
  );
}
