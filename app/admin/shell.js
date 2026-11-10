'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, ShoppingCart, Tags, Megaphone, Store, KeyRound, LogOut, ExternalLink, Wallet, X, Plus, Menu as MenuIcon } from 'lucide-react';
import Marca from '@/components/Marca';
import Avisos from '@/components/Avisos';
import NotificationBell from '@/components/NotificationBell';

const Svg = ({ size = 20, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const Inicio = (p) => <Svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></Svg>;
const Reportes = (p) => <Svg {...p}><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></Svg>;
const Costos = (p) => <Svg {...p}><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></Svg>;

const Cierre = (p) => <Svg {...p}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8" /><path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" /><path d="M8 16h.01" /><path d="M12 16h.01" /><path d="M16 16h.01" /></Svg>;

const GRUPOS = [
  ['Principal', [['/admin/inicio', 'Inicio', Inicio]]],
  ['Ventas', [['/admin/ventas/nueva', 'Nueva venta', Plus], ['/admin/ventas', 'Ventas', ShoppingCart]]],
  ['Inventario', [['/admin/productos', 'Productos', Package], ['/admin/categorias', 'Categorías', Tags]]],
  ['Contabilidad', [['/admin/gastos', 'Gastos', Wallet], ['/admin/costos', 'Costos', Costos], ['/admin/reportes', 'Reportes', Reportes], ['/admin/cierre', 'Cierre de caja', Cierre]]],
  ['Tienda web', [['/admin/banners', 'Ofertas', Megaphone], ['/admin/negocio', 'Negocio', Store]]],
];
const CLAVE = ['/admin/clave', 'Clave', KeyRound];
const LINKS = [...GRUPOS.flatMap(([, l]) => l), CLAVE];
const PRINCIPAL = ['/admin/inicio', '/admin/ventas/nueva', '/admin/ventas', '/admin/productos'].map((h) => LINKS.find(([x]) => x === h));

export default function Shell({ children }) {
  const path = usePathname();
  const [ok, setOk] = useState(false);
  const [N, setN] = useState(null);
  const [mas, setMas] = useState(false);
  const exacto = ['/admin', '/admin/ventas'];
  const on = (href) => (exacto.includes(href) ? path === href : path.startsWith(href));
  const actual = LINKS.find(([h]) => on(h));
  const marca = N || { nombre: 'Doña Zulema', logo: '' };

  useEffect(() => {
    const check = () =>
      fetch('/api/admin/negocio')
        .then(async (r) => {
          setOk(r.ok);
          if (r.ok) setN(await r.json());
        })
        .catch(() => setOk(false));
    check();
    window.addEventListener('admin-auth', check);
    return () => window.removeEventListener('admin-auth', check);
  }, [path]);

  useEffect(() => { setMas(false); }, [path]);

  useEffect(() => {
    if (!mas) return;
    const esc = (e) => e.key === 'Escape' && setMas(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc); };
  }, [mas]);

  if (!ok) return <div className="admin min-h-screen bg-panel">{children}<Avisos /></div>;

  const tab = (a) => `flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-semibold ${a ? 'text-vino-800' : 'text-stone-500'}`;
  const pill = (a) => `grid h-7 w-12 place-items-center rounded-full transition ${a ? 'bg-vino-100' : ''}`;
  const item = (a) => `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${a ? 'bg-oro-400 text-vino-950 shadow-sm' : 'text-vino-100 hover:bg-white/10'}`;

  return (
    <div className="admin min-h-screen bg-panel">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col overflow-y-auto bg-vino-950 p-5 text-white md:flex">
        <div className="mb-7 flex items-center gap-3">
          <Marca N={marca} />
          <div className="min-w-0">
            <p className="truncate font-brand text-lg font-extrabold leading-none">{marca.nombre}</p>
            <p className="mt-1 text-xs text-vino-200">Panel de administración</p>
          </div>
        </div>
        <div className="space-y-5">
          {GRUPOS.map(([g, links]) => (
            <div key={g}>
              <p className="mb-1.5 px-4 text-[11px] font-bold uppercase tracking-widest text-vino-300">{g}</p>
              <nav className="space-y-0.5">
                {links.map(([href, t, Icon]) => (
                  <Link key={href} href={href} aria-current={on(href) ? 'page' : undefined} className={item(on(href))}>
                    <Icon size={18} /> {t}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="mt-auto space-y-0.5 border-t border-white/10 pt-3">
          <Link href={CLAVE[0]} className={item(on(CLAVE[0]))}><KeyRound size={18} /> Clave</Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className={item(false)}><ExternalLink size={18} /> Ver sitio</a>
          <a href="/api/admin/logout" className={item(false)}><LogOut size={18} /> Salir</a>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-vino-950 px-4 py-2.5 text-white md:fixed md:right-5 md:top-3 md:z-40 md:w-auto md:border-0 md:bg-transparent md:p-0">
        <div className="flex min-w-0 items-center gap-2.5 md:hidden">
          <button type="button" onClick={() => setMas(true)} aria-label="Abrir menú" className="-ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-white/10"><MenuIcon size={22} /></button>
          <span className="shrink-0 [&>*]:!h-8 [&>*]:!w-8 [&>*]:!text-base"><Marca N={marca} /></span>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-serif text-base font-extrabold">{actual ? actual[1] : 'Admin'}</p>
            <p className="truncate text-[11px] text-vino-200">{marca.nombre}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <a href="/" target="_blank" rel="noopener noreferrer" aria-label="Ver sitio" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10 md:hidden"><ExternalLink size={18} /></a>
          <a href="/api/admin/logout" aria-label="Salir" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10 md:hidden"><LogOut size={18} /></a>
        </div>
      </header>

      <div className="md:pl-64">
        <div className="mx-auto max-w-5xl pb-28 pt-2 md:pb-10">{children}</div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
        {PRINCIPAL.map(([href, t, Icon]) => (
          <Link key={href} href={href} aria-current={on(href) ? 'page' : undefined} className={tab(on(href))}>
            <span className={pill(on(href))}><Icon size={20} /></span>
            {t}
          </Link>
        ))}
        
      </nav>

      <Avisos />

      {mas && (
        <div className="fade-in fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMas(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto bg-vino-950 p-5 text-white shadow-lift">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Marca N={marca} />
                <p className="truncate font-brand text-lg font-extrabold leading-none">{marca.nombre}</p>
              </div>
              <button type="button" onClick={() => setMas(false)} aria-label="Cerrar menú" className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-white/10"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              {GRUPOS.map(([g, links]) => (
                <div key={g}>
                  <p className="mb-1.5 px-4 text-[11px] font-bold uppercase tracking-widest text-vino-300">{g}</p>
                  <nav className="space-y-0.5">
                    {links.map(([href, t, Icon]) => (
                      <Link key={href} href={href} aria-current={on(href) ? 'page' : undefined} className={item(on(href))}>
                        <Icon size={18} /> {t}
                      </Link>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-0.5 border-t border-white/10 pt-3">
              <Link href={CLAVE[0]} className={item(on(CLAVE[0]))}><KeyRound size={18} /> Clave</Link>
              <a href="/" target="_blank" rel="noopener noreferrer" className={item(false)}><ExternalLink size={18} /> Ver sitio</a>
              <a href="/api/admin/logout" className={item(false)}><LogOut size={18} /> Salir</a>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
