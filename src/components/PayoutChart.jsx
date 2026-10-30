import { money } from '../utils/format.js';

/** Lightweight SVG line chart of payout per class across exit values. */
export default function PayoutChart({ data, holders, colors, exit, maxExit }) {
  const W = 640, H = 240, P = 36;
  const maxY = Math.max(1, ...data.flatMap((d) => Object.values(d.byId)));
  const x = (v) => P + (v / maxExit) * (W - P * 1.5);
  const y = (v) => H - P + 4 - (v / maxY) * (H - P * 1.5);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Payout by exit value">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={P} x2={W - P / 2} y1={y(maxY * t)} y2={y(maxY * t)} stroke="#1f242b" />
          <text x={4} y={y(maxY * t) + 3} fill="#71717a" fontSize="9" fontFamily="monospace">{money(maxY * t)}</text>
        </g>
      ))}
      {[0, 0.5, 1].map((t) => (
        <text key={t} x={x(maxExit * t)} y={H - 6} fill="#71717a" fontSize="9" textAnchor="middle" fontFamily="monospace">{money(maxExit * t)}</text>
      ))}
      <line x1={x(exit)} x2={x(exit)} y1={10} y2={H - P + 4} stroke="#c6ff3d" strokeDasharray="3 3" opacity="0.6" />
      {holders.map((h) => (
        <polyline key={h.id} fill="none" stroke={colors[h.id]} strokeWidth="1.8"
          points={data.map((d) => `${x(d.exit)},${y(d.byId[h.id] || 0)}`).join(' ')} />
      ))}
    </svg>
  );
}
