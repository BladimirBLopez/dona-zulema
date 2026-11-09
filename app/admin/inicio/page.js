'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Package, Tags, Megaphone, Store, KeyRound, Wallet, Inbox, ShoppingCart } from 'lucide-react';
import { api, errMsg } from '@/lib/cliente';
import { bs, qty, hoyBO } from '@/lib/fmt';

const ACCESOS = [
  ['/admin/ventas/nueva', 'Vender', Plus],
  ['/admin', 'Productos', Package],
  ['/admin/categorias', 'Categorías', Tags],
  ['/admin/banners', 'Ofertas', Megaphone],
  ['/admin/negocio', 'Negocio', Store],
  ['/admin/clave', 'Clave', KeyRound],
];

const dia3 = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-BO', { weekday: 'short' }).replace('.', '');

function cabecera() {
  const h = (new Date().getUTCHours() + 20) % 24;
  const s = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const f = new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/La_Paz' });
  return { s, f };
}

export default function Inicio() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [cab, setCab] = useState({ s: '', f: '' });

  useEffect(() => {
    setCab(cabecera());
    (async () => {
      const r = await api(`/api/admin/reportes?desde=${hoyBO(-6)}&hasta=${hoyBO()}`);
      if (r.status === 401) return;
      if (!r.ok) return setErr(errMsg(r.data));
      setD(r.data);
    })();
  }, []);

  const serie = d?.serie || [];
  const hoy = serie.find((x) => x.dia === hoyBO()) || { n: 0, total: 0, ganancia: 0 };
  const max = Math.max(1, ...serie.map((x) => x.total));
  const sem = serie.reduce((s, x) => s + x.total, 0);
  const g = d?.global || { por_cobrar: 0, pedidos: 0 };
  const bajo = d?.stock_bajo || [];
  const sinCosto = (d?.resumen?.sin_costo || 0) > 0;

  return (
    <main className="fade-in px-4 pb-6 pt-4">
      <p className="text-sm capitalize text-stone-500">{cab.f || '\u00a0'}</p>
      <h1 className="mb-4 font-serif text-3xl font-extrabold text-vino-800">{cab.s || '\u00a0'}</h1>

      {err && <p className="mb-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</p>}

      {!d && !err && (
        <div className="space-y-3">
          <div className="skeleton h-40" />
          <div className="grid grid-cols-3 gap-3"><div className="skeleton h-24" /><div className="skeleton h-24" /><div className="skeleton h-24" /></div>
          <div className="skeleton h-52" />
        </div>
      )}

      {d && (
        <>
          <div className="rounded-3xl bg-gradient-to-br from-vino-800 to-vino-950 p-5 text-white shadow-lift">
            <p className="text-sm text-vino-200">Vendido hoy</p>
            <p className="mt-1 text-4xl font-extrabold">{bs(hoy.total)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-vino-200">Ventas</p>
                <p className="text-lg font-bold">{hoy.n}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-vino-200">Ganancia</p>
                <p className="text-lg font-bold">{sinCosto ? '—' : bs(hoy.ganancia)}</p>
                {sinCosto && <p className="text-[11px] text-vino-200">Faltan costos</p>}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <Link href="/admin/ventas" className="rounded-2xl bg-white p-3 shadow-card">
              <Wallet size={18} className="mx-auto text-amber-600" />
              <p className="mt-1 text-base font-extrabold text-amber-700">{bs(g.por_cobrar)}</p>
              <p className="text-[11px] text-stone-500">Por cobrar</p>
            </Link>
            <Link href="/admin/ventas" className="rounded-2xl bg-white p-3 shadow-card">
              <Inbox size={18} className="mx-auto text-vino-700" />
              <p className="mt-1 text-base font-extrabold text-vino-800">{g.pedidos}</p>
              <p className="text-[11px] text-stone-500">Pedidos</p>
            </Link>
            <div className="rounded-2xl bg-white p-3 shadow-card">
              <ShoppingCart size={18} className="mx-auto text-green-700" />
              <p className="mt-1 text-base font-extrabold text-green-700">{bs(sem)}</p>
              <p className="text-[11px] text-stone-500">7 días</p>
            </div>
          </div>

          <div className="mt-3 rounded-3xl bg-white p-4 shadow-card">
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-lg font-extrabold text-vino-800">Últimos 7 días</h2>
              <p className="text-xs text-stone-500">{bs(sem)}</p>
            </div>
            <div className="mt-3 flex gap-2">
              {serie.map((x) => {
                const esHoy = x.dia === hoyBO();
                const pct = x.total > 0 ? Math.max(4, (x.total / max) * 100) : 2;
                return (
                  <div key={x.dia} className="flex flex-1 flex-col items-center gap-1">
                    <span className="h-4 text-[10px] font-semibold text-stone-500">{x.total > 0 ? Math.round(x.total) : ''}</span>
                    <div className="flex h-24 w-full items-end">
                      <div className={`w-full rounded-t-lg ${esHoy ? 'bg-vino-800' : 'bg-vino-200'}`} style={{ height: pct + '%' }} />
                    </div>
                    <span className={`text-[11px] font-semibold capitalize ${esHoy ? 'text-vino-800' : 'text-stone-500'}`}>{dia3(x.dia)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {bajo.length > 0 && (
            <div className="mt-3 rounded-3xl bg-white p-4 shadow-card">
              <h2 className="font-serif text-lg font-extrabold text-vino-800">Stock bajo</h2>
              <ul className="mt-1 divide-y divide-stone-100">
                {bajo.slice(0, 6).map((p, i) => (
                  <li key={p.nombre + i} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate pr-3 font-semibold">{p.nombre}</span>
                    <span className="shrink-0 font-bold text-red-600">{qty(p.stock)} {p.unidad}</span>
                  </li>
                ))}
              </ul>
              <Link href="/admin" className="mt-2 block text-center text-sm font-bold text-vino-800">Ver productos</Link>
            </div>
          )}
        </>
      )}

      <h2 className="mb-2 mt-6 font-serif text-lg font-extrabold text-vino-800">Accesos rápidos</h2>
      <div className="grid grid-cols-3 gap-3">
        {ACCESOS.map(([href, t, Icon]) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow-card transition active:scale-95">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-vino-50 text-vino-800"><Icon size={20} /></span>
            <span className="text-xs font-bold text-stone-700">{t}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
