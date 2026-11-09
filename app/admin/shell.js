'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, ShoppingCart, Tags, Megaphone, Store, KeyRound, LogOut, ExternalLink } from 'lucide-react';

const Inicio = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" />
  </svg>
);

const LINKS = [
  ['/admin/inicio', 'Inicio', Inicio],
  ['/admin', 'Productos', Package],
  ['/admin/ventas', 'Ventas', ShoppingCart],
  ['/admin/categorias', 'Categorías', Tags],
  ['/admin/banners', 'Ofertas', Megaphone],
  ['/admin/negocio', 'Negocio', Store],
  ['/admin/clave', 'Clave', KeyRound],
];
const MOVIL = LINKS.slice(0, 5);

export default function Shell({ children }) {
  const path = usePathname();
  const [ok, setOk] = useState(false);
  const on = (href) => (href === '/admin' ? path === href : path.startsWith(href));

  useEffect(() => {
    const check = () => fetch('/api/admin/negocio').then((r) => setOk(r.ok)).catch(() => setOk(false));
    check();
    window.addEventListener('admin-auth', check);
    return () => window.removeEventListener('admin-auth', check);
  }, [path]);

  if (!ok) return <div className="admin min-h-screen bg-crema">{children}</div>;

  return (
    <div className="admin min-h-screen bg-crema">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-vino-950 p-5 text-white md:flex">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-oro-400 font-serif text-xl font-extrabold text-vino-950 shadow-lift">D</span>
          <div>
            <p className="font-serif text-lg font-extrabold leading-none">Doña Zulema</p>
            <p className="mt-1 text-xs text-vino-200">Panel de administración</p>
          </div>
        </div>
        <p className="mb-2 px-4 text-[11px] font-bold uppercase tracking-widest text-vino-300">Menú</p>
        <nav className="space-y-1">
          {LINKS.map(([href, t, Icon]) => (
            <Link key={href} href={href} aria-current={on(href) ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${on(href) ? 'bg-oro-400 text-vino-950 shadow-sm' : 'text-vino-100 hover:bg-white/10'}`}>
              <Icon size={18} /> {t}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-white/10 pt-3">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-vino-100 hover:bg-white/10"><ExternalLink size={18} /> Ver sitio</a>
          <a href="/api/admin/logout" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-vino-100 hover:bg-white/10"><LogOut size={18} /> Salir</a>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-vino-950 px-4 py-2.5 text-white md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-oro-400 font-serif text-base font-extrabold text-vino-950">D</span>
          <span className="font-serif text-lg font-extrabold">Doña Zulema</span>
        </div>
        <div className="flex gap-1">
          <a href="/" target="_blank" rel="noopener noreferrer" aria-label="Ver sitio" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"><ExternalLink size={18} /></a>
          <Link href="/admin/clave" aria-label="Clave" className={`grid h-9 w-9 place-items-center rounded-full ${on('/admin/clave') ? 'bg-white/20' : 'hover:bg-white/10'}`}><KeyRound size={18} /></Link>
          <a href="/api/admin/logout" aria-label="Salir" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"><LogOut size={18} /></a>
        </div>
      </header>

      <div className="md:pl-64">
        <div className="mx-auto max-w-4xl pb-28 pt-2 md:pb-10">{children}</div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
        {MOVIL.map(([href, t, Icon]) => (
          <Link key={href} href={href} aria-current={on(href) ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-semibold ${on(href) ? 'text-vino-800' : 'text-stone-500'}`}>
            <span className={`grid h-7 w-12 place-items-center rounded-full transition ${on(href) ? 'bg-vino-100' : ''}`}><Icon size={20} /></span>
            {t}
          </Link>
        ))}
      </nav>
    </div>
  );
}
