import Link from "next/link";

export function ChronosMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="url(#chronos-grad)" />
      <path
        d="M16 7.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Z"
        stroke="#09090b"
        strokeWidth="1.4"
        opacity="0.85"
      />
      <path
        d="M16 11.2v5.1l3.4 2"
        stroke="#09090b"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="chronos-grad" x1="4" y1="2" x2="28" y2="30">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Brand({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <ChronosMark size={compact ? 28 : 32} />
      <span className="font-sans text-[13px] font-semibold tracking-[0.32em] text-foreground">
        CHRONOS
      </span>
    </Link>
  );
}
