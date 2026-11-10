'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, errMsg } from '@/lib/cliente';
import { bs, hoyBO } from '@/lib/fmt';

const METODO = { efectivo: 'Efectivo', qr: 'QR', transferencia: 'Transferencia' };
const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
const num = (v) => {
  const x = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(x) ? x : null;
};
const campo = 'w-full rounded-xl border-0 bg-white px-4 py-3 text-lg font-bold text-stone-900 shadow-card outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-vino-500';

export default function Cierre() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [contado, setContado] = useState('');
  const [fondo, setFondo] = useState('');
  const [fecha, setFecha] = useState('');

  const cargar = useCallback(async () => {
    setErr('');
    setD(null);
    const f = hoyBO();
    setFecha(f);
    const r = await api(`/api/admin/reportes?desde=${f}&hasta=${f}`);
    if (r.status === 401) return;
    if (!r.ok) return setErr(errMsg(r.data));
    setD(r.data);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const res = d?.resumen;
  const cobros = d?.metodos || [];
  const efectivo = cobros.find((m) => m.nombre === 'efectivo')?.total || 0;
  const esperado = r2((num(fondo) ?? 0) + efectivo);
  const c = num(contado);
  const dif = c == null ? null : r2(c - esperado);
  const cuadra = dif != null && Math.abs(dif) < 0.005;

  return (
    <main className="fade-in px-4 pb-6 pt-4">
      <h1 className="font-serif text-3xl font-extrabold text-vino-800">Cierre de caja</h1>
      <p className="mb-4 text-sm text-stone-500">{'Hoy' + (fecha ? ' · ' + fecha.split('-').reverse().join('/') : '')}</p>

      {err && <p className="mb-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</p>}

      {!d && !err && (
        <div className="space-y-3"><div className="skeleton h-24" /><div className="skeleton h-40" /></div>
      )}

      {d && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="text-xs text-stone-500">Vendido hoy</p>
              <p className="mt-0.5 text-xl font-extrabold text-green-700">{bs(res?.total || 0)}</p>
              <p className="text-[11px] text-stone-400">{(res?.n || 0) + ((res?.n || 0) === 1 ? ' venta' : ' ventas')}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="text-xs text-stone-500">Efectivo cobrado</p>
              <p className="mt-0.5 text-xl font-extrabold text-vino-800">{bs(efectivo)}</p>
              <p className="text-[11px] text-stone-400">lo que debe haber en caja</p>
            </div>
          </div>

          <div className="mt-3 rounded-3xl bg-white p-4 shadow-card">
            <h2 className="mb-3 font-serif text-lg font-extrabold text-vino-800">Cobros de hoy</h2>
            {cobros.length > 0 ? (
              <ul className="divide-y divide-stone-100">
                {cobros.map((m) => (
                  <li key={m.nombre} className="flex justify-between py-2 text-sm">
                    <span className="font-semibold">{METODO[m.nombre] || m.nombre}</span>
                    <span className="font-bold">{bs(m.total)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-3 text-center text-sm text-stone-500">Aún no hay cobros hoy.</p>
            )}
          </div>

          <div className="mt-3 rounded-3xl bg-white p-4 shadow-card">
            <h2 className="mb-3 font-serif text-lg font-extrabold text-vino-800">Cuenta el efectivo</h2>
            <label htmlFor="fondo" className="text-xs font-semibold text-stone-500">Fondo de cambio con el que abriste (opcional)</label>
            <input id="fondo" inputMode="decimal" value={fondo} onChange={(e) => setFondo(e.target.value)} placeholder="0" className={campo + ' mb-3 mt-1'} />
            <label htmlFor="contado" className="text-xs font-semibold text-stone-500">Efectivo que contaste ahora</label>
            <input id="contado" inputMode="decimal" value={contado} onChange={(e) => setContado(e.target.value)} placeholder="Escribe el total contado" className={campo + ' mt-1'} />
            <p className="mt-3 text-center text-sm text-stone-500">{'Debe haber: '}<b className="text-stone-800">{bs(esperado)}</b></p>
            {dif == null ? (
              <p className="mt-3 rounded-2xl bg-stone-50 p-4 text-center text-sm text-stone-500">Escribe lo que contaste y verás si cuadra.</p>
            ) : (
              <p className={`mt-3 rounded-2xl p-4 text-center text-2xl font-extrabold ${cuadra ? 'bg-green-50 text-green-700' : dif > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                {cuadra ? 'La caja cuadra' : dif > 0 ? 'Sobra ' + bs(dif) : 'Falta ' + bs(-dif)}
              </p>
            )}
          </div>

          {(res?.gastos || 0) > 0 && (
            <p className="mt-3 text-center text-xs text-stone-500">{'Hoy se registraron gastos por ' + bs(res.gastos) + '. No se restan del efectivo.'}</p>
          )}

          <button onClick={cargar} className="mt-4 w-full rounded-full bg-vino-800 py-3 text-sm font-bold text-white transition hover:bg-vino-700 active:scale-95">Actualizar ventas de hoy</button>
        </>
      )}
    </main>
  );
}
