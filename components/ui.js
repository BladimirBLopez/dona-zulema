const TONOS = {
  vino: 'bg-vino-50 text-vino-800',
  verde: 'bg-green-50 text-green-700',
  ambar: 'bg-oro-200/50 text-amber-900',
  rojo: 'bg-red-50 text-red-700',
  gris: 'bg-stone-100 text-stone-600',
};

export function Page({ children, className = '' }) {
  return <main className={`fade-in px-4 pt-4 md:px-6 ${className}`}>{children}</main>;
}

export function PageHeader({ title, sub, children }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-extrabold leading-tight text-vino-800 md:text-3xl">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-stone-500">{sub}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return <section className={`rounded-3xl bg-white p-4 shadow-card ring-1 ring-vino-900/5 ${className}`}>{children}</section>;
}

export function Stat({ label, value, hint, tone = 'vino', icon: Icon }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-vino-900/5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
        {Icon && <span className={`grid h-8 w-8 place-items-center rounded-xl ${TONOS[tone]}`}><Icon size={16} /></span>}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-stone-900 md:text-3xl">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

export function Badge({ children, tone = 'gris' }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONOS[tone]}`}>{children}</span>;
}

export function Empty({ icon: Icon, title, text, children }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-vino-200 bg-white/60 px-6 py-12 text-center">
      {Icon && <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-vino-50 text-vino-400"><Icon size={22} /></span>}
      <p className="font-bold text-stone-800">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-xs text-sm text-stone-500">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function Skeleton({ className = 'h-20' }) {
  return <div className={`skeleton ${className}`} />;
}

const BTN = {
  primary: 'bg-vino-800 text-white shadow hover:bg-vino-700',
  soft: 'bg-vino-50 text-vino-800 hover:bg-vino-100',
  ghost: 'bg-stone-100 text-stone-700 hover:bg-stone-200',
  danger: 'bg-red-50 text-red-700 hover:bg-red-100',
};

export function Btn({ variant = 'primary', href, className = '', children, ...rest }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition disabled:opacity-50 ${BTN[variant]} ${className}`;
  if (href) return <a href={href} className={cls} {...rest}>{children}</a>;
  return <button type="button" className={cls} {...rest}>{children}</button>;
}
