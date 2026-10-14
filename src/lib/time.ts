export const BLOCKS_PER_DAY = 48;
export const MINUTES_PER_BLOCK = 30;

export function emptyDay(): (string | null)[] {
  return Array.from({ length: BLOCKS_PER_DAY }, () => null);
}

export function normalizeBlocks(value: unknown): (string | null)[] {
  const next = emptyDay();
  if (!Array.isArray(value)) return next;
  for (let i = 0; i < BLOCKS_PER_DAY; i += 1) {
    const item = value[i];
    next[i] = typeof item === "string" && item.length > 0 ? item : null;
  }
  return next;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatMinutes12(totalMinutes: number): string {
  const minutesInDay = ((totalMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(minutesInDay / 60);
  const minute = minutesInDay % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${pad2(minute)} ${suffix}`;
}

export function blockRangeLabel(index: number): string {
  const start = index * MINUTES_PER_BLOCK;
  const end = start + MINUTES_PER_BLOCK;
  return `${formatMinutes12(start)} – ${formatMinutes12(end)}`;
}

export function hourHeader(hour: number): string {
  const suffix = hour < 12 ? "a" : "p";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}${suffix}`;
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function shiftDateKey(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function isFutureDateKey(key: string, today = localDateKey()): boolean {
  return key > today;
}

export function formatLongDate(key: string): string {
  return parseDateKey(key).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function hoursFromBlocks(count: number): number {
  return count * 0.5;
}

export function formatHours(hours: number): string {
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${hours.toFixed(1)}h`;
}
