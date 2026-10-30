// Small shared UI primitives.
export function Field({ label, children, className = '' }) {
  return <div className={className}><span className="label">{label}</span>{children}</div>;
}

/** Numeric input that stores numbers, not strings. */
export function Num({ value, onChange, ...rest }) {
  return <input type="number" className="input" value={value} onChange={(e) => onChange(Number(e.target.value))} {...rest} />;
}

export function Stat({ label, value, accent, sub }) {
  return (
    <div className="rounded-lg bg-ink-900 px-3 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`font-mono text-lg ${accent ? 'text-accent' : 'text-zinc-100'}`}>{value}</div>
      {sub && <div className="text-[10px] text-zinc-500">{sub}</div>}
    </div>
  );
}

export function Card({ title, children, right }) {
  return (
    <div className="card">
      {(title || right) && <div className="mb-3 flex items-center justify-between"><h3 className="label !mb-0">{title}</h3>{right}</div>}
      {children}
    </div>
  );
}

export function Button({ children, onClick, primary, ...rest }) {
  return (
    <button onClick={onClick} {...rest}
      className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition ${primary ? 'bg-accent font-medium text-ink-950 hover:brightness-110' : 'border border-ink-600 hover:border-accent hover:text-accent'}`}>
      {children}
    </button>
  );
}

export function Dot({ color }) {
  return <span className="mr-2 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />;
}
