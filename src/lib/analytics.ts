import { hoursFromBlocks } from "./time";
import { categoryById } from "./categories";
import type { Category } from "./types";

export function mappedHours(blocks: (string | null)[]): number {
  return hoursFromBlocks(blocks.filter(Boolean).length);
}

export function hoursByKind(
  blocks: (string | null)[],
  cats: Category[],
  kind: Category["kind"],
): number {
  const count = blocks.filter((id) => categoryById(cats, id)?.kind === kind).length;
  return hoursFromBlocks(count);
}

/** Productive / (productive + friction). Null when nothing scoreable was logged. */
export function efficiencyScore(
  blocks: (string | null)[],
  cats: Category[],
): number | null {
  const productive = hoursByKind(blocks, cats, "productive");
  const friction = hoursByKind(blocks, cats, "friction");
  const denom = productive + friction;
  if (denom === 0) return null;
  return (productive / denom) * 100;
}

/**
 * Share of planned blocks that were actually done as planned.
 * Blocks that were not planned are not scored, so an empty plan yields null.
 */
export function adherenceScore(
  planned: (string | null)[],
  actual: (string | null)[],
): number | null {
  let plannedCount = 0;
  let matches = 0;
  for (let i = 0; i < planned.length; i += 1) {
    if (!planned[i]) continue;
    plannedCount += 1;
    if (planned[i] === actual[i]) matches += 1;
  }
  if (plannedCount === 0) return null;
  return (matches / plannedCount) * 100;
}

export function plannedBlockCount(planned: (string | null)[]): number {
  return planned.filter(Boolean).length;
}

export function categoryDrift(
  planned: (string | null)[],
  actual: (string | null)[],
  cats: Category[],
): { cat: Category; plannedHours: number; actualHours: number; drift: number }[] {
  return cats.map((cat) => {
    const plannedHours = hoursFromBlocks(
      planned.filter((id) => id === cat.id).length,
    );
    const actualHours = hoursFromBlocks(
      actual.filter((id) => id === cat.id).length,
    );
    return {
      cat,
      plannedHours,
      actualHours,
      drift: actualHours - plannedHours,
    };
  });
}
