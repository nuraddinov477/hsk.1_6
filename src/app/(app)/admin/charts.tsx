"use client";

// Theme-aware SVG chart primitives for the admin stats page. No chart lib —
// each chart is a small SVG so it stays crisp at any size and inherits the
// design tokens (border/muted/brand) used elsewhere in the app.

import { type ReactNode } from "react";

// ── Palette (HSL strings so we can fade with /15, /60 etc.) ───────────
export const PALETTE = [
  "#dc2626", // brand red
  "#ea580c", // orange
  "#eab308", // yellow
  "#16a34a", // green
  "#0891b2", // cyan
  "#2563eb", // blue
  "#7c3aed", // violet
  "#db2777", // pink
];

export function ChartCard({
  title,
  hint,
  children,
  span,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  span?: "full" | "half";
}) {
  const wide = span === "full" ? "lg:col-span-2" : "";
  return (
    <div className={`rounded-2xl border border-border bg-background p-5 ${wide}`}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-base font-bold tracking-tight">{title}</h3>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Area + line chart for the 30-day DAU series ────────────────────────
export function AreaChart({
  data,
  height = 160,
}: {
  data: { date: string; users: number; sessions: number }[];
  height?: number;
}) {
  const W = 600;
  const H = height;
  const padL = 28, padR = 8, padT = 8, padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxY = Math.max(1, ...data.map((d) => Math.max(d.users, d.sessions)));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const yFor = (v: number) => padT + innerH - (v / maxY) * innerH;
  const xFor = (i: number) => padL + i * stepX;

  const pointsUsers    = data.map((d, i) => `${xFor(i)},${yFor(d.users)}`).join(" ");
  const pointsSessions = data.map((d, i) => `${xFor(i)},${yFor(d.sessions)}`).join(" ");
  const areaUsers      = `${padL},${padT + innerH} ${pointsUsers} ${padL + (data.length - 1) * stepX},${padT + innerH}`;

  // 4 horizontal gridlines
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((p) => ({ y: padT + innerH * (1 - p), label: Math.round(maxY * p) }));

  // x-axis labels — first / mid / last
  const tickIdxs = data.length >= 3 ? [0, Math.floor((data.length - 1) / 2), data.length - 1] : [0];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      {gridYs.map((g, i) => (
        <g key={i}>
          <line x1={padL} y1={g.y} x2={W - padR} y2={g.y} stroke="var(--border)" strokeWidth="1" />
          <text x={padL - 6} y={g.y + 3} textAnchor="end" className="fill-muted-foreground" fontSize="11">{g.label}</text>
        </g>
      ))}
      <polygon points={areaUsers} fill="#dc2626" fillOpacity="0.12" />
      <polyline points={pointsUsers}    fill="none" stroke="#dc2626" strokeWidth="2" />
      <polyline points={pointsSessions} fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4 3" />
      {data.map((d, i) => (
        <circle key={i} cx={xFor(i)} cy={yFor(d.users)} r="1.8" fill="#dc2626">
          <title>{`${d.date}  •  ${d.users} foyd · ${d.sessions} sessiya`}</title>
        </circle>
      ))}
      {tickIdxs.map((i) => (
        <text key={i} x={xFor(i)} y={H - 6} textAnchor="middle" className="fill-muted-foreground" fontSize="11">
          {data[i]?.date.slice(5)}
        </text>
      ))}
      <g transform={`translate(${padL}, ${H - 4})`}>
        <rect x="0" y="-8" width="8" height="3" fill="#dc2626" /><text x="12" y="-5" fontSize="11" className="fill-muted-foreground">Foydalanuvchilar</text>
        <rect x="92" y="-8" width="8" height="3" fill="#2563eb" /><text x="104" y="-5" fontSize="11" className="fill-muted-foreground">Sessiyalar</text>
      </g>
    </svg>
  );
}

// ── Vertical bars (e.g. session count per hour 0..23) ─────────────────
export function BarsChart({
  data,
  height = 140,
  labelEvery = 3,
}: {
  data: { label: string; value: number }[];
  height?: number;
  labelEvery?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="group relative flex-1">
            <div
              className="w-full rounded-t bg-brand/30 transition group-hover:bg-brand"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs font-medium text-background group-hover:block">
              {d.label}: {d.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center">{i % labelEvery === 0 ? d.label : ""}</span>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal bars (e.g. top users, event types) ─────────────────────
export function HBarsChart({
  data,
  formatValue,
}: {
  data: { label: string; value: number; hint?: string; color?: string }[];
  formatValue?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2.5">
      {data.map((d, i) => {
        const w = (d.value / max) * 100;
        const color = d.color ?? PALETTE[i % PALETTE.length];
        return (
          <li key={i}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 truncate font-medium">{d.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                <b className="text-foreground">{formatValue ? formatValue(d.value) : d.value}</b>
                {d.hint && <span className="ml-1.5 text-xs">{d.hint}</span>}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, background: color }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ── Donut (pie) chart with right-side legend ──────────────────────────
export function DonutChart({
  data,
  size = 160,
  centerLabel,
}: {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  centerLabel?: { value: string | number; hint: string };
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = size / 2;
  const stroke = size * 0.18;
  const radius = R - stroke / 2;
  const C = 2 * Math.PI * radius;
  let offset = 0;
  const slices = data.map((d, i) => {
    const frac = total === 0 ? 0 : d.value / total;
    const len = frac * C;
    const color = d.color ?? PALETTE[i % PALETTE.length];
    const node = (
      <circle
        key={i}
        cx={R}
        cy={R}
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${len} ${C - len}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${R} ${R})`}
      >
        <title>{`${d.label}: ${d.value}`}</title>
      </circle>
    );
    offset += len;
    return node;
  });

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={R} cy={R} r={radius} fill="transparent" stroke="var(--muted)" strokeWidth={stroke} />
          {total > 0 && slices}
        </svg>
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold tabular-nums">{centerLabel.value}</div>
            <div className="text-xs text-muted-foreground">{centerLabel.hint}</div>
          </div>
        )}
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
        {data.map((d, i) => {
          const color = d.color ?? PALETTE[i % PALETTE.length];
          const pct = total === 0 ? 0 : Math.round((d.value / total) * 100);
          return (
            <li key={i} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: color }} />
                <span className="truncate font-medium">{d.label}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                <b className="text-foreground">{d.value}</b> <span className="text-xs">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Inline sparkline: tiny SVG trendline for KPI cards ───────────────
export function Sparkline({
  data,
  color = "#dc2626",
  width = 80,
  height = 24,
  showArea = true,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  showArea?: boolean;
}) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data);
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((v, i) => `${i * step},${height - (v / max) * (height - 2) - 1}`);
  const path = `M ${points.join(" L ")}`;
  const area = `M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {showArea && <path d={area} fill={color} fillOpacity="0.15" />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Funnel chart: stacked horizontal bars showing drop-off ───────────
export function Funnel({
  steps,
}: {
  steps: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <ul className="space-y-2.5">
      {steps.map((s, i) => {
        const w = (s.value / max) * 100;
        const prev = i === 0 ? s.value : steps[i - 1].value;
        const dropPct = prev === 0 ? 0 : Math.round(((prev - s.value) / prev) * 100);
        const color = PALETTE[i % PALETTE.length];
        return (
          <li key={i}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">
                <span className="mr-1 text-xs text-muted-foreground">{i + 1}.</span>{s.label}
              </span>
              <span className="shrink-0 tabular-nums">
                <b>{s.value}</b>
                {i > 0 && <span className={`ml-1.5 text-xs ${dropPct > 0 ? "text-red-500" : "text-muted-foreground"}`}>−{dropPct}%</span>}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, background: color }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ── Stacked bar (e.g. vocab + characters per HSK level) ───────────────
export function StackedBars({
  data,
  keys,
  height = 160,
}: {
  data: { label: string; values: Record<string, number> }[];
  keys: { key: string; label: string; color: string }[];
  height?: number;
}) {
  const totals = data.map((d) => keys.reduce((s, k) => s + (d.values[k.key] ?? 0), 0));
  const max = Math.max(1, ...totals);
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const total = totals[i];
          const totalH = (total / max) * 100;
          return (
            <div key={i} className="group flex flex-1 flex-col-reverse items-center">
              <div className="relative flex w-full max-w-12 flex-col-reverse overflow-hidden rounded-md" style={{ height: `${totalH}%`, minHeight: total > 0 ? 4 : 0 }}>
                {keys.map((k) => {
                  const v = d.values[k.key] ?? 0;
                  const h = total === 0 ? 0 : (v / total) * 100;
                  return <div key={k.key} style={{ height: `${h}%`, background: k.color }} title={`${k.label}: ${v}`} />;
                })}
              </div>
              <div className="pointer-events-none absolute mt-[-4px] hidden text-[10px] group-hover:block">{total}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-2 text-xs text-muted-foreground">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center font-medium">{d.label}</span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {keys.map((k) => (
          <span key={k.key} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="h-3 w-3 rounded-sm" style={{ background: k.color }} />
            {k.label}
          </span>
        ))}
      </div>
    </div>
  );
}
