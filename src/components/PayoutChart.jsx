import { money } from '../utils/format.js';

/** Lightweight SVG line chart of payout per class across exit values. */
export default function PayoutChart({ data, holders, colors, exit, maxExit }) {
  const W = 680, H = 260, P = 44;
  const maxY = Math.max(1, ...data.flatMap((d) => Object.values(d.byId)));
  const x = (v) => P + (v / maxExit) * (W - P * 1.5);
  const y = (v) => H - P + 4 - (v / maxY) * (H - P * 1.5);
  const selected = data.reduce((best, point) => (Math.abs(point.exit - exit) < Math.abs(best.exit - exit) ? point : best), data[0] || { exit: 0, byId: {} });
  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-ink-950/55 p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Payout by exit value">
          <defs>
            <linearGradient id="chartFade" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8b9cff" stopOpacity=".08" />
              <stop offset="100%" stopColor="#8b9cff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x={P} y="10" width={W - P * 1.5} height={H - P - 6} rx="8" fill="url(#chartFade)" />
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line x1={P} x2={W - P / 2} y1={y(maxY * t)} y2={y(maxY * t)} stroke="#252c3a" strokeDasharray={t === 0 ? undefined : '2 4'} />
              <text x={4} y={y(maxY * t) + 3} fill="#6b7280" fontSize="9" fontFamily="monospace">{money(maxY * t)}</text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line x1={x(maxExit * t)} x2={x(maxExit * t)} y1="10" y2={H - P + 4} stroke="#202633" strokeDasharray="2 6" />
              <text x={x(maxExit * t)} y={H - 8} fill="#6b7280" fontSize="9" textAnchor="middle" fontFamily="monospace">{money(maxExit * t)}</text>
            </g>
          ))}
          <line x1={x(Math.min(exit, maxExit))} x2={x(Math.min(exit, maxExit))} y1={10} y2={H - P + 4} stroke="#8b9cff" strokeDasharray="4 4" opacity="0.8" />
          <text x={x(Math.min(exit, maxExit))} y="9" fill="#a6b2ff" fontSize="9" textAnchor="middle" fontFamily="sans-serif">Selected</text>
          {holders.map((h) => (
            <g key={h.id}>
              <polyline fill="none" stroke={colors[h.id]} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                points={data.map((d) => `${x(d.exit)},${y(d.byId[h.id] || 0)}`).join(' ')} />
              <circle cx={x(Math.min(selected.exit, maxExit))} cy={y(selected.byId[h.id] || 0)} r="3" fill={colors[h.id]} stroke="#0c0f16" strokeWidth="2" />
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2" aria-label="Chart legend">
        {holders.map((h) => (
          <div key={h.id} className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <span className="h-2 w-2 rounded-full" style={{ background: colors[h.id] }} />
            {h.name}
          </div>
        ))}
      </div>
    </div>
  );
}
