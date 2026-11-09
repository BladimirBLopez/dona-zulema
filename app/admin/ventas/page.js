'use client';
import { confirmar } from '@/lib/avisos';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, ChevronDown, MessageCircle, Ban, Wallet, Inbox, ShoppingCart } from 'lucide-react';
import { api, errMsg } from '@/lib/cliente';
import { bs, qty, hoyBO, horaBO, diaBO, reciboTexto, waLink } from '@/lib/fmt';

const MET = { efectivo: 'Efectivo', qr: 'QR', transferencia: 'Transferencia', fiado: 'Fiado' };

function rango(p, a, b) {
  if (p === 'hoy') return [hoyBO(), hoyBO()];
  if (p === 'ayer') return [hoyBO(-1), hoyBO(-1)];
  if (p === '7d') return [hoyBO(-6), hoyBO()];
  if (p === 'mes') return [hoyBO().slice(0, 8) + '01', hoyBO()];
  return [a, b];
}

function VentaCard({ v, negocio, onChange, aviso }) {
  const [open, setOpen] = useState(false);
  const [monto, setMonto] = useState('');
  const [met, setMet] = useState('efectivo');
  const saldo = v.total - v.pagado;
  const anulada = v.estado === 'anulada';

  async function anular() {
    if (!(await confirmar({ titulo: `¿Anular la venta #${v.id}?`, texto: 'Se devuelve el stock y deja de contar en tus reportes.', ok: 'Sí, anular', cancelar: 'Volver', peligro: true }))) return;
    const r = await api('/api/admin/ventas', 'PATCH', { accion: 'anular', id: v.id });
    aviso(r.ok ? 'Venta anulada' : errMsg(r.data));
    onChange();
  }
  async function abonar() {
    const r = await api('/api/admin/ventas', 'PATCH', { accion: 'abonar', id: v.id, monto: monto || saldo, metodo: met });
    aviso(r.ok ? `Cobrado ${bs(r.data.aplicado)}` : errMsg(r.data));
    setMonto('');
    onChange();
  }

  return (
    <li className={`rounded-2xl bg-white shadow-card ${anulada ? 'opacity-60' : ''}`}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-3 text-left">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{v.cliente_nombre || 'Venta #' + v.id}</p>
          <p className="truncate text-xs text-stone-500">{diaBO(v.fecha)} {horaBO(v.fecha)} · {v.items.map((i) => i.nombre).join(', ')}</p>
          <div className="mt-1 flex flex-wrap gap-1 text-[11px] font-semibold">
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">{MET[v.metodo] || v.metodo}</span>
            {v.tipo === 'mayor' && <span className="rounded-full bg-oro-200/60 px-2 py-0.5 text-amber-900">Mayor</span>}
            {anulada && <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">Anulada</span>}
            {!anulada && saldo > 0.001 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Debe {bs(saldo)}</span>}
          </div>
        </div>
        <p className="shrink-0 text-lg font-extrabold text-vino-800">{bs(v.total)}</p>
        <ChevronDown size={18} className={`shrink-0 text-stone-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-stone-100 p-3">
          <ul className="space-y-1 text-sm">
            {v.items.map((i, x) => (
              <li key={x} className="flex justify-between gap-3"><span>{qty(i.cantidad)} {i.unidad} {i.nombre}</span><span className="shrink-0 font-semibold">{bs(i.subtotal)}</span></li>
            ))}
            {v.descuento > 0 && <li className="flex justify-between text-stone-500"><span>Descuento</span><span>−{bs(v.descuento)}</span></li>}
          </ul>
          {v.nota && <p className="rounded-xl bg-panel p-2 text-xs text-stone-600">{v.nota}</p>}
          <p className="text-xs text-stone-500">Venta #{v.id}{v.cliente_tel ? ' · ' + v.cliente_tel : ''}</p>

          {!anulada && saldo > 0.001 && (
            <div className="rounded-2xl bg-amber-50 p-3">
              <p className="mb-2 text-sm font-semibold text-amber-900">Registrar cobro (saldo {bs(saldo)})</p>
              <div className="flex gap-2">
                <input type="number" inputMode="decimal" step="0.01" min="0" placeholder={String(saldo)} value={monto} onChange={(e) => setMonto(e.target.value)} />
                <select value={met} onChange={(e) => setMet(e.target.value)} style={{ width: '9rem' }}>
                  <option value="efectivo">Efectivo</option><option value="qr">QR</option><option value="transferencia">Transf.</option>
                </select>
                <button onClick={abonar} className="shrink-0 rounded-xl bg-amber-600 px-4 font-bold text-white">Cobrar</button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <a href={waLink(v.cliente_tel, reciboTexto(v, negocio))} target="_blank" rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-green-500 py-2.5 text-sm font-bold text-white"><MessageCircle size={16} /> Recibo</a>
            {!anulada && <button onClick={anular} className="flex items-center gap-2 rounded-full bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600"><Ban size={16} /> Anular</button>}
          </div>
        </div>
      )}
    </li>
  );
}

export default function Ventas() {
  const [tab, setTab] = useState('ventas');
  const [per, setPer] = useState('hoy');
  const [a, setA] = useState(hoyBO(-6));
  const [b, setB] = useState(hoyBO());
  const [q, setQ] = useState('');
  const [ventas, setVentas] = useState(null);
  const [deudas, setDeudas] = useState(null);
  const [pedidos, setPedidos] = useState(null);
  const [negocio, setNegocio] = useState('');
  const [toast, setToast] = useState('');
  const [fallo, setFallo] = useState('');

  const aviso = (t) => { setToast(t); setTimeout(() => setToast(''), 2500); };

  const cargar = useCallback(async () => {
    const [d, h] = rango(per, a, b);
    const [v, de, pe] = await Promise.all([
      api(`/api/admin/ventas?desde=${d}&hasta=${h}&q=${encodeURIComponent(q)}`),
      api('/api/admin/ventas?solo=deuda'),
      api('/api/admin/pedidos?estado=pendiente'),
    ]);
    setFallo(!v.ok ? errMsg(v.data) : '');
    setVentas(v.ok ? v.data : []);
    setDeudas(de.ok ? de.data : []);
    setPedidos(pe.ok ? pe.data : []);
  }, [per, a, b, q]);

  useEffect(() => { const t = setTimeout(cargar, q ? 300 : 0); return () => clearTimeout(t); }, [cargar, q]);
  useEffect(() => { api('/api/admin/negocio').then((r) => setNegocio(r.data?.nombre || '')); }, []);

  const resumen = useMemo(() => {
    const act = (ventas || []).filter((v) => v.estado === 'activa');
    return { n: act.length, total: act.reduce((s, v) => s + Number(v.total), 0), cobrar: act.reduce((s, v) => s + (v.total - v.pagado), 0) };
  }, [ventas]);

  const porCliente = useMemo(() => {
    const m = new Map();
    for (const v of deudas || []) {
      const k = (v.cliente_nombre || 'Sin nombre').trim().toLowerCase();
      const g = m.get(k) || { nombre: v.cliente_nombre || 'Sin nombre', tel: v.cliente_tel, saldo: 0, ventas: [] };
      g.saldo += v.total - v.pagado;
      g.tel = g.tel || v.cliente_tel;
      g.ventas.push(v);
      m.set(k, g);
    }
    return [...m.values()].sort((x, y) => y.saldo - x.saldo);
  }, [deudas]);

  async function cancelar(p) {
    if (!(await confirmar({ titulo: '¿Cancelar este pedido?', ok: 'Sí, cancelar pedido', cancelar: 'Volver', peligro: true }))) return;
    const r = await api('/api/admin/pedidos', 'PATCH', { id: p.id });
    aviso(r.ok ? 'Pedido cancelado' : errMsg(r.data));
    cargar();
  }

  const chip = (act) => `shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${act ? 'bg-vino-800 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`;
  const tabBtn = (id, t, n) => (
    <button key={id} onClick={() => setTab(id)} className={`flex-1 rounded-full py-2 text-sm font-bold transition ${tab === id ? 'bg-vino-800 text-white' : 'text-stone-600'}`}>
      {t}{n > 0 && <span className={`ml-1.5 rounded-full px-2 py-0.5 text-[11px] ${tab === id ? 'bg-white/25' : 'bg-amber-100 text-amber-800'}`}>{n}</span>}
    </button>
  );

  return (
    <main className="px-4 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-extrabold text-vino-800">Ventas</h1>
          <p className="text-sm text-stone-500">Caja, pedidos de la tienda y deudas.</p>
        </div>
        <Link href="/admin/ventas/nueva" className="flex items-center gap-2 rounded-full bg-vino-800 px-5 py-2.5 text-sm font-bold text-white shadow"><Plus size={18} /> Vender</Link>
      </div>

      <div className="mb-4 flex rounded-full bg-white p-1 shadow-card">
        {tabBtn('ventas', 'Ventas', 0)}
        {tabBtn('pedidos', 'Pedidos', pedidos?.length || 0)}
        {tabBtn('deudas', 'Deudas', porCliente.length)}
      </div>

      {fallo && <p className="mb-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{fallo}</p>}

      {tab === 'ventas' && (
        <>
          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
            {[['hoy', 'Hoy'], ['ayer', 'Ayer'], ['7d', '7 días'], ['mes', 'Este mes'], ['rango', 'Fechas']].map(([v, t]) => <button key={v} onClick={() => setPer(v)} className={chip(per === v)}>{t}</button>)}
          </div>
          {per === 'rango' && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              <input type="date" value={a} max={b} onChange={(e) => setA(e.target.value)} />
              <input type="date" value={b} min={a} max={hoyBO()} onChange={(e) => setB(e.target.value)} />
            </div>
          )}
          <div className="relative mb-3">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente o producto..." style={{ paddingLeft: '2.75rem' }} />
          </div>
          <div className="mb-4 grid grid-cols-3 gap-3 text-center">
            {[['Ventas', resumen.n, 'text-vino-800'], ['Total', bs(resumen.total), 'text-green-700'], ['Por cobrar', bs(resumen.cobrar), 'text-amber-700']].map(([t, v, c]) => (
              <div key={t} className="rounded-2xl bg-white p-3 shadow-card"><p className={`text-lg font-extrabold ${c}`}>{v}</p><p className="text-xs text-stone-500">{t}</p></div>
            ))}
          </div>
          {ventas === null ? <p className="py-10 text-center text-stone-500">Cargando...</p> : (
            <ul className="space-y-3 pb-4">
              {ventas.map((v) => <VentaCard key={v.id} v={v} negocio={negocio} onChange={cargar} aviso={aviso} />)}
              {!ventas.length && !fallo && <li className="py-12 text-center text-stone-500"><ShoppingCart className="mx-auto mb-2 text-vino-300" /> No hay ventas en este período.</li>}
            </ul>
          )}
        </>
      )}

      {tab === 'pedidos' && (
        <ul className="space-y-3 pb-4">
          {(pedidos || []).map((p) => (
            <li key={p.id} className="rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-semibold">{p.cliente_nombre || 'Pedido #' + p.id}</p><p className="text-xs text-stone-500">{diaBO(p.creado)} {horaBO(p.creado)}</p></div>
                {p.total > 0 && <p className="font-extrabold text-vino-800">≈ {bs(p.total)}</p>}
              </div>
              <ul className="mt-2 space-y-0.5 text-sm text-stone-700">
                {p.items.map((i, x) => <li key={x}>{qty(i.cantidad)} {i.unidad} {i.nombre}</li>)}
              </ul>
              <div className="mt-3 flex gap-2">
                <Link href={`/admin/ventas/nueva?pedido=${p.id}`} className="flex-1 rounded-full bg-vino-800 py-2.5 text-center text-sm font-bold text-white">Convertir en venta</Link>
                <button onClick={() => cancelar(p)} className="rounded-full bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600">Cancelar</button>
              </div>
            </li>
          ))}
          {pedidos && !pedidos.length && <li className="py-12 text-center text-stone-500"><Inbox className="mx-auto mb-2 text-vino-300" /> No hay pedidos pendientes.</li>}
        </ul>
      )}

      {tab === 'deudas' && (
        <div className="space-y-5 pb-4">
          {porCliente.map((g) => (
            <section key={g.nombre}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-bold text-vino-800">{g.nombre} <span className="text-amber-700">· {bs(g.saldo)}</span></p>
                {g.tel && <a href={waLink(g.tel, `Hola ${g.nombre}, te recordamos tu saldo pendiente de ${bs(g.saldo)} en ${negocio || 'nuestra tienda'}. ¡Gracias!`)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white"><MessageCircle size={14} /> Recordar</a>}
              </div>
              <ul className="space-y-2">{g.ventas.map((v) => <VentaCard key={v.id} v={v} negocio={negocio} onChange={cargar} aviso={aviso} />)}</ul>
            </section>
          ))}
          {deudas && !porCliente.length && <p className="py-12 text-center text-stone-500"><Wallet className="mx-auto mb-2 text-vino-300" /> Nadie te debe nada.</p>}
        </div>
      )}

      {toast && <div className="fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-full bg-vino-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lift">{toast}</div>}
    </main>
  );
}
