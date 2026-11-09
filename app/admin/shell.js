'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Tags, Megaphone, Store, KeyRound, LogOut, ExternalLink } from 'lucide-react';

const LINKS = [
  ['/admin', 'Productos', Package],
  ['/admin/categorias', 'Categorías', Tags],
  ['/admin/banners', 'Ofertas', Megaphone],
  ['/admin/negocio', 'Negocio', Store],
  ['/admin/clave', 'Clave', KeyRound],
];

export default function Shell({ children }) {
  const path = usePathname();
  const [ok, setOk] = useState(false);

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
          <span className="grid h-10 w-10 place-items-center rounded-full bg-oro-400 font-serif text-lg font-extrabold text-vino-950">D</span>
          <div><p className="font-serif text-lg font-extrabold leading-none">Doña Zulema</p><p className="text-xs text-vino-200">Panel de administración</p></div>
        </div>
        <nav className="space-y-1">
          {LINKS.map(([href, t, Icon]) => (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${path === href ? 'bg-oro-400 text-vino-950' : 'text-vino-100 hover:bg-white/10'}`}>
              <Icon size={18} /> {t}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-1">
          <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-vino-100 hover:bg-white/10"><ExternalLink size={18} /> Ver sitio</a>
          <a href="/api/admin/logout" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-vino-100 hover:bg-white/10"><LogOut size={18} /> Salir</a>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-vino-950 px-4 py-3 text-white md:hidden">
        <span className="font-serif text-lg font-extrabold">Doña Zulema</span>
        <div className="flex gap-1">
          <a href="/" target="_blank" aria-label="Ver sitio" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"><ExternalLink size={18} /></a>
          <a href="/api/admin/logout" aria-label="Salir" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"><LogOut size={18} /></a>
        </div>
      </header>

      <div className="md:pl-64">
        <div className="mx-auto max-w-4xl pb-28 pt-2 md:pb-10">{children}</div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
        {LINKS.map(([href, t, Icon]) => (
          <Link key={href} href={href} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${path === href ? 'text-vino-800' : 'text-stone-500'}`}>
            <Icon size={20} /> {t}
          </Link>
        ))}
      </nav>
    </div>
  );
}
