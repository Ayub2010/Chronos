"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Cloud,
  Lock,
  MousePointer2,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { BlockGrid } from "@/components/block-grid";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import {
  adherenceScore,
  efficiencyScore,
  hoursByKind,
} from "@/lib/analytics";
import { emptyDay, formatHours } from "@/lib/time";
import type { Category } from "@/lib/types";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#compare", label: "Compare" },
  { href: "#faq", label: "FAQ" },
];

const FAQS = [
  {
    q: "What is a 48-block day?",
    a: "Chronos divides 24 hours into forty-eight 30-minute blocks, from 12:00 AM through 11:30 PM. That granularity is enough to see drift without drowning in minutes.",
  },
  {
    q: "How is the efficiency score calculated?",
    a: "Productive hours divided by productive plus friction hours, times 100%. Neutral time — sleep, recovery, downtime — is excluded so rest does not penalize the score.",
  },
  {
    q: "Can I log days that already happened?",
    a: "Yes. Move backward with the date controls or pick any past day. Future dates are disabled so audits stay honest.",
  },
  {
    q: "What is the difference between Planned and Actual?",
    a: "Planned is the day you intend. Actual is what took place. Compare overlays both, then reports adherence and category-level drift.",
  },
  {
    q: "Does Chronos work on a phone?",
    a: "The grid uses pointer events and elementFromPoint, so click-and-drag painting works with a mouse or a finger.",
  },
  {
    q: "Is my data private?",
    a: "Each account stores one row that is served over HTTPS and protected by row-level security, so other users cannot read or write your days or categories.",
  },
];

function buildSample(paints: [number, number, string][]): (string | null)[] {
  const blocks = emptyDay();
  for (const [start, count, id] of paints) {
    for (let i = 0; i < count; i += 1) blocks[start + i] = id;
  }
  return blocks;
}

/** Fixed sample plan. The live preview is compared against it. */
const SAMPLE_PLAN = buildSample([
  [0, 14, "sleep"],
  [14, 2, "gym"],
  [18, 8, "deep-work"],
  [28, 6, "learning"],
  [44, 4, "sleep"],
]);

const SAMPLE_ACTUAL = buildSample([
  [0, 14, "sleep"],
  [14, 2, "gym"],
  [18, 6, "deep-work"],
  [24, 2, "gaming"],
  [28, 4, "learning"],
  [36, 4, "friction"],
  [44, 4, "sleep"],
]);

export function LandingPage() {
  const [preview, setPreview] = useState<(string | null)[]>(() => [
    ...SAMPLE_ACTUAL,
  ]);
  const adherence = adherenceScore(SAMPLE_PLAN, preview);
  const efficiency = efficiencyScore(preview, DEFAULT_CATEGORIES);
  const frictionDrift =
    hoursByKind(preview, DEFAULT_CATEGORIES, "friction") -
    hoursByKind(SAMPLE_PLAN, DEFAULT_CATEGORIES, "friction");
  const [brush, setBrush] = useState<string | null>("deep-work");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/auth"
              className="hidden rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:text-foreground sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Open App
              <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
            >
              ☰
            </button>
          </div>
        </div>
        {menuOpen ? (
          <div className="border-t border-border px-4 py-3 md:hidden">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-2 text-sm text-muted"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        ) : null}
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-fine opacity-40" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-[0.22em] text-muted">
              <Sparkles size={12} className="text-cyan-400" />
              Visual time audit
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              See where your 24 hours actually go.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
              Map intention against reality in forty-eight luminous blocks.
              Chronos shows the drift between the day you planned and the day
              you lived — then scores the gap.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Start auditing your time
                <ArrowRight size={16} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm text-muted transition-colors hover:text-foreground"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-[0_0_80px_-32px_rgba(34,211,238,0.55)] sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                  Live preview
                </p>
                <p className="text-sm text-foreground">Paint a sample day</p>
              </div>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 font-mono text-[10px] text-cyan-300">
                48 blocks
              </span>
            </div>
            <BlockGrid
              blocks={preview}
              cats={DEFAULT_CATEGORIES}
              interactive
              compact
              onPaint={(index) => {
                setPreview((prev) => {
                  const next = [...prev];
                  next[index] = brush;
                  return next;
                });
              }}
            />
            <div className="mt-4 flex flex-wrap gap-1.5">
              {DEFAULT_CATEGORIES.map((cat) => (
                <LegendChip
                  key={cat.id}
                  cat={cat}
                  active={brush === cat.id}
                  onClick={() => setBrush(cat.id)}
                />
              ))}
              <button
                type="button"
                onClick={() => setBrush(null)}
                className={`rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors ${
                  brush === null
                    ? "border-foreground text-foreground"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                Eraser
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-border px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6">
          {[
            ["48", "blocks per day"],
            ["30-min", "granularity"],
            ["100%", "cloud sync"],
          ].map(([stat, label]) => (
            <div key={label} className="px-2 py-8 text-center">
              <p className="font-mono text-3xl text-foreground">{stat}</p>
              <p className="mt-1 text-sm text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
          How it works
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Three moves. A clearer day.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Plan your ideal day",
              body: "Sketch the 24 hours you intend — deep work, training, recovery — before the clock starts.",
            },
            {
              n: "02",
              title: "Paint your reality",
              body: "Hold and drag across 30-minute blocks. What actually happened becomes visible in color.",
            },
            {
              n: "03",
              title: "Audit drift and efficiency",
              body: "Compare views highlight mismatches. The efficiency formula ignores rest and taxes friction.",
            },
          ].map((step) => (
            <article
              key={step.n}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-zinc-500/50"
            >
              <p className="font-mono text-xs text-cyan-400">{step.n}</p>
              <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="compare" className="border-y border-border bg-card/30">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
              Plan vs. reality
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Adherence, not vibes.
            </h2>
            <p className="mt-4 text-muted">
              Split cells show planned on the left and actual on the right.
              Matching blocks stay solid. Drift lights an amber edge so you can
              see exactly where the day diverged.
            </p>
            <div className="mt-8 flex gap-6">
              <Metric
                label="Adherence"
                value={adherence == null ? "—" : `${adherence.toFixed(0)}%`}
              />
              <Metric
                label="Efficiency"
                value={efficiency == null ? "—" : `${efficiency.toFixed(0)}%`}
              />
              <Metric
                label="Friction drift"
                value={`${frictionDrift > 0 ? "+" : ""}${formatHours(frictionDrift)}`}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="mb-3 flex items-center justify-between text-xs text-muted">
              <span>Planned | Actual</span>
              <span className="font-mono">Tue · sample</span>
            </div>
            <BlockGrid
              blocks={preview}
              cats={DEFAULT_CATEGORIES}
              compact
              compare={{
                planned: SAMPLE_PLAN,
                actual: preview,
              }}
            />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
          Capabilities
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Built for forensic calendars.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Timer,
              title: "48-Block Precision",
              body: "Every half hour of the day has a coordinate, a color, and a category.",
            },
            {
              icon: Paintbrush,
              title: "Paint & Drag UX",
              body: "Equip a brush and sweep across the grid. Touch and mouse share the same pointer path.",
            },
            {
              icon: MousePointer2,
              title: "Past Day Logging",
              body: "Yesterday still counts. Each date stores its own planned and actual maps.",
            },
            {
              icon: Sparkles,
              title: "Efficiency Score Formula",
              body: "Productive ÷ (productive + friction). Neutral hours stay out of the penalty box.",
            },
            {
              icon: Cloud,
              title: "Multi-device Cloud Sync",
              body: "Debounced upserts keep your timeline current across machines in under a second.",
            },
            {
              icon: ShieldCheck,
              title: "Private & Secure",
              body: "Row-level security means your audit never leaks into someone else’s account.",
            },
          ].map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <feature.icon size={18} className="text-cyan-400" />
              <h3 className="mt-4 font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">FAQ</h2>
          <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
            {FAQS.map((item, index) => (
              <div key={item.q}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium"
                  onClick={() =>
                    setOpenFaq((current) => (current === index ? null : index))
                  }
                >
                  {item.q}
                  <span className="font-mono text-muted">
                    {openFaq === index ? "–" : "+"}
                  </span>
                </button>
                {openFaq === index ? (
                  <p className="px-5 pb-5 text-sm leading-6 text-muted">
                    {item.a}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Brand compact />
          <div className="flex gap-5 text-sm text-muted">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </a>
            ))}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Lock size={12} />
            © {new Date().getFullYear()} Chronos. Time, visualized.
          </p>
        </div>
      </footer>
    </div>
  );
}

function LegendChip({
  cat,
  active,
  onClick,
}: {
  cat: Category;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
        active
          ? "border-foreground text-foreground"
          : "border-border text-muted hover:text-foreground"
      }`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: cat.color }}
      />
      {cat.icon} {cat.name.split(" / ")[0]}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-2xl text-foreground">{value}</p>
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
    </div>
  );
}
