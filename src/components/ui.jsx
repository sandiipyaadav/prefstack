import { useId } from 'react';
import { Inbox, Info } from 'lucide-react';

const cx = (...classes) => classes.filter(Boolean).join(' ');

export function Tooltip({ children, label }) {
  const id = useId();
  if (!label) return children;
  return (
    <span className="tooltip">
      <span tabIndex="0" aria-describedby={id} className="tooltip-trigger">
        {children || <Info size={12} aria-hidden="true" />}
      </span>
      <span id={id} role="tooltip" className="tooltip-content">{label}</span>
    </span>
  );
}

// Small shared UI primitives.
export function Field({ label, children, className = '', tip, description }) {
  return (
    <div className={cx('field', className)}>
      <span className="label">
        {label}
        {tip && <Tooltip label={tip}><Info size={11} aria-hidden="true" /></Tooltip>}
      </span>
      {children}
      {description && <span className="field-description">{description}</span>}
    </div>
  );
}

/** Numeric input that stores numbers, not strings. */
export function Num({ value, onChange, ...rest }) {
  return <input type="number" className="input" value={value} onChange={(e) => onChange(Number(e.target.value))} {...rest} />;
}

export function Stat({ label, value, accent, sub, tip, tone }) {
  return (
    <div className={cx('stat', tone && `stat-${tone}`)}>
      <div className="stat-label">
        {label}
        {tip && <Tooltip label={tip}><Info size={11} aria-hidden="true" /></Tooltip>}
      </div>
      <div className={cx('stat-value', accent && 'text-positive')}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function Card({ title, children, right, description, className = '' }) {
  return (
    <section className={cx('card', className)}>
      {(title || right) && (
        <div className="card-header">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {description && <p className="card-description">{description}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Button({ children, onClick, primary, variant, className = '', ...rest }) {
  const style = variant || (primary ? 'primary' : 'secondary');
  return (
    <button type="button" onClick={onClick} {...rest}
      className={cx('button', `button-${style}`, className)}>
      {children}
    </button>
  );
}

export function Dot({ color }) {
  return <span className="mr-2 inline-block h-2 w-2 shrink-0 rounded-full ring-2 ring-white/5" style={{ background: color }} />;
}

export function EmptyState({ title, description, action, icon: Icon = Inbox }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon"><Icon size={19} aria-hidden="true" /></span>
      <p className="font-medium text-zinc-200">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  return <span className={cx('badge', `badge-${tone}`)}>{children}</span>;
}
