'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Minus, X, Trash2, Check, MessageCircle, ArrowLeft } from 'lucide-react';
import { api, errMsg } from '@/lib/cliente';
import { bs, qty, hoyBO, reciboTexto, waLink } from '@/lib/fmt';

const METODOS = [['efectivo', 'Efectivo'], ['qr', 'QR'], ['transferencia', 'Transf.'], ['fiado', 'Fiado']];
const n = (v) => Number(v) || 0;
const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
const paso = (u) => (String(u || '').toLowerCase() === 'kg' ? 0.5 : 1);
const precioDe = (p, tipo) => {
  const a = tipo === 'mayor' ? p.precio_mayor : p.precio_menor;
  const b = tipo === 'mayor' ? p.precio_menor : p.precio_mayor;
  const v = a ?? b;
  return v == null ? 0 : Number(v);
};
const formVacio = () => ({ metodo: 'efectivo', descuento: '', nombre: '', tel: '', pagado: '', nota: '', fecha: hoyBO(), recibe: '' });

export default function NuevaVenta() {
  const [productos, setProductos] = useState(null);
  const [negocio, setNegocio] = useState('');
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('menor');
  const [lineas, setLineas] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState(formVacio());
  const [libre, setLibre] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [hecho, setHecho] = useState(null);
  const [pedidoId, setPedidoId] = useState(null);

  useEffect(() => {
    (async () => {
      const [pr, ng] = await Promise.all([api('/api/admin/productos'), api('/api/admin/negocio')]);
      const lista = pr.data?.productos || [];
      setProductos(lista);
      setNegocio(ng.data?.nombre || '');
      const pid = new URLSearchParams(location.search).get('pedido');
      if (pid) {
        const pe = await api('/api/admin/pedidos?estado=pendiente');
        const p = (pe.data || []).find((x) => String(x.id) === pid);
        if (p) {
          setPedidoId(p.id);
          setF((x) => ({ ...x, nombre: p.cliente_nombre || '' }));
          setLineas(p.items.map((it) => {
            const prod = lista.find((x) => String(x.id) === String(it.producto_id));
            return {
              producto_id: String(it.producto_id), nombre: it.nombre, unidad: it.unidad,
              cantidad: String(it.cantidad), precio: String(prod ? precioDe(prod, 'menor') : it.precio ?? 0),
            };
          }));
        }
      }
    })();
  }, []);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (productos || []).filter((p) => !t || (p.nombre + ' ' + p.categoria).toLowerCase().includes(t)).slice(0, 60);
  }, [productos, q]);

  const enCarrito = (id) => lineas.find((l) => l.producto_id === String(id));

  function sumar(p, d) {
    setLineas((ls) => {
      const i = ls.findIndex((l) => l.producto_id === String(p.id));
      if (i < 0) {
        return d > 0 ? [...ls, { producto_id: String(p.id), nombre: p.nombre, unidad: p.unidad || 'kg', cantidad: String(paso(p.unidad)), precio: String(precioDe(p, tipo)) }] : ls;
      }
      const nueva = r2(n(ls[i].cantidad) + d);
      if (nueva <= 0) return ls.filter((_, x) => x !== i);
      return ls.map((l, x) => (x === i ? { ...l, cantidad: String(nueva) } : l));
    });
  }

  function cambiarTipo(t) {
    setTipo(t);
    setLineas((ls) => ls.map((l) => {
      const p = (productos || []).find((x) => String(x.id) === l.producto_id);
      return p ? { ...l, precio: String(precioDe(p, t)) } : l;
    }));
  }

  const setL = (i, k, v) => setLineas((ls) => ls.map((l, x) => (x === i ? { ...l, [k]: v } : l)));
  const bruto = r2(lineas.reduce((a, l) => a + n(l.cantidad) * n(l.precio), 0));
  const desc = Math.min(bruto, Math.max(0, n(f.descuento)));
  const total = r2(bruto - desc);
  const pagadoIni = f.metodo === 'fiado' ? Math.min(total, Math.max(0, n(f.pagado))) : total;
  const vuelto = f.metodo === 'efectivo' && n(f.recibe) > total ? r2(n(f.recibe) - total) : 0;

  async function confirmar() {
    setErr('');
    if (!lineas.length) return setErr('Agrega al menos un producto.');
    if (f.metodo === 'fiado' && !f.nombre.trim()) return setErr('Para fiado escribe el nombre del cliente.');
    setBusy(true);
    const body = {
      items: lineas.map((l) => ({ producto_id: l.producto_id || null, nombre: l.nombre, unidad: l.unidad, cantidad: n(l.cantidad), precio: n(l.precio) })),
      metodo: f.metodo, tipo, descuento: desc, pagado: f.pagado, cliente_nombre: f.nombre, cliente_tel: f.tel, nota: f.nota,
      fecha: f.fecha && f.fecha !== hoyBO() ? f.fecha : null, pedido_id: pedidoId,
    };
    const r = await api('/api/admin/ventas', 'POST', body);
    setBusy(false);
    if (!r.ok) return setErr(errMsg(r.data));
    setHecho({
      id: r.data.id, total: r.data.total, pagado: pagadoIni, descuento: desc, metodo: f.metodo,
      cliente_nombre: f.nombre, cliente_tel: f.tel, fecha: new Date().toISOString(),
      items: lineas.map((l) => ({ nombre: l.nombre, unidad: l.unidad, cantidad: n(l.cantidad), precio: n(l.precio), subtotal: r2(n(l.cantidad) * n(l.precio)) })),
    });
    setAbierto(false);
  }

  function otra() {
    setHecho(null); setLineas([]); setF(formVacio()); setPedidoId(null); setQ(''); setErr('');
    history.replaceState(null, '', '/admin/ventas/nueva');
  }

  if (!productos) return <p className="p-8 text-center text-stone-500">Cargando...</p>;

  if (hecho) {
    return (
      <main className="px-4 pt-10 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100 text-green-600"><Check size={40} /></span>
        <h1 className="mt-4 font-serif text-3xl font-extrabold text-vino-800">Venta #{hecho.id} registrada</h1>
        <p className="mt-1 text-4xl font-extrabold text-stone-900">{bs(hecho.total)}</p>
        {hecho.total - hecho.pagado > 0.001 && <p className="mt-1 font-semibold text-amber-700">Queda por cobrar {bs(hecho.total - hecho.pagado)}</p>}
        <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
          <a href={waLink(hecho.cliente_tel, reciboTexto(hecho, negocio))} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-green-500 py-3 font-bold text-white"><MessageCircle size={18} /> Enviar recibo por WhatsApp</a>
          <button onClick={otra} className="rounded-full bg-vino-800 py-3 font-bold text-white">Nueva venta</button>
          <Link href="/admin/ventas" className="rounded-full bg-white py-3 font-semibold text-stone-700 ring-1 ring-stone-200">Ver ventas</Link>
        </div>
      </main>
    );
  }

  const chip = (a) => `rounded-full px-4 py-1.5 text-sm font-semibold transition ${a ? 'bg-vino-800 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`;
  const items = lineas.length;

  return (
    <main className="px-4 pb-32 pt-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/ventas" aria-label="Volver" className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-card"><ArrowLeft size={18} /></Link>
        <h1 className="font-serif text-2xl font-extrabold text-vino-800">Nueva venta{pedidoId ? ` · pedido #${pedidoId}` : ''}</h1>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => cambiarTipo('menor')} className={chip(tipo === 'menor')}>Al menor</button>
        <button onClick={() => cambiarTipo('mayor')} className={chip(tipo === 'mayor')}>Al mayor</button>
        <button onClick={() => setLibre({ nombre: '', precio: '' })} className="ml-auto rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-stone-600 ring-1 ring-stone-200">+ Ítem libre</button>
      </div>

      {libre && (
        <div className="mb-3 flex gap-2 rounded-2xl bg-white p-3 shadow-card">
          <input placeholder="Descripción" value={libre.nombre} onChange={(e) => setLibre({ ...libre, nombre: e.target.value })} />
          <input type="number" inputMode="decimal" placeholder="Bs" value={libre.precio} onChange={(e) => setLibre({ ...libre, precio: e.target.value })} style={{ width: '6rem' }} />
          <button onClick={() => {
            if (!libre.nombre.trim() || n(libre.precio) < 0) return;
            setLineas((ls) => [...ls, { producto_id: '', nombre: libre.nombre.trim(), unidad: 'u', cantidad: '1', precio: String(n(libre.precio)) }]);
            setLibre(null);
          }} className="rounded-xl bg-vino-800 px-4 font-bold text-white">OK</button>
        </div>
      )}

      <div className="relative mb-3">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto..." style={{ paddingLeft: '2.75rem' }} />
      </div>

      <ul className="space-y-2">
        {lista.map((p) => {
          const l = enCarrito(p.id);
          const st = p.stock != null ? Number(p.stock) : null;
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.nombre}</p>
                <p className="text-xs text-stone-500">
                  {bs(precioDe(p, tipo))}/{p.unidad}
                  {st != null && <span className={st <= 0 ? ' font-semibold text-red-600' : ''}> · stock {qty(st)}</span>}
                </p>
              </div>
              {l ? (
                <div className="flex items-center gap-1 rounded-full bg-vino-800 p-1 text-white">
                  <button onClick={() => sumar(p, -paso(p.unidad))} aria-label="Quitar" className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/15"><Minus size={15} /></button>
                  <span className="min-w-[2.5rem] text-center text-sm font-bold">{qty(l.cantidad)}</span>
                  <button onClick={() => sumar(p, paso(p.unidad))} aria-label="Agregar" className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/15"><Plus size={15} /></button>
                </div>
              ) : (
                <button onClick={() => sumar(p, paso(p.unidad))} aria-label={'Agregar ' + p.nombre} className="grid h-10 w-10 place-items-center rounded-full bg-vino-800 text-white"><Plus size={18} /></button>
              )}
            </li>
          );
        })}
        {lista.length === 0 && <li className="py-10 text-center text-stone-500">No hay productos con esa búsqueda.</li>}
      </ul>

      <div className="fixed inset-x-0 bottom-16 z-40 px-4 md:bottom-4 md:left-64">
        <button disabled={!items} onClick={() => { setErr(''); setAbierto(true); }}
          className="mx-auto flex w-full max-w-4xl items-center justify-between rounded-full bg-vino-800 px-6 py-3.5 font-bold text-white shadow-lift disabled:bg-stone-400">
          <span>{items ? `${items} ${items === 1 ? 'producto' : 'productos'}` : 'Sin productos'}</span>
          <span>Cobrar {bs(bruto)}</span>
        </button>
      </div>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center" onClick={() => setAbierto(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[94vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-3xl bg-white p-5 md:rounded-3xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-extrabold text-vino-800">Cobrar</h2>
              <button onClick={() => setAbierto(false)} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full bg-stone-100"><X size={18} /></button>
            </div>

            <ul className="space-y-2">
              {lineas.map((l, i) => (
                <li key={l.producto_id + i} className="rounded-2xl bg-panel p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{l.nombre}</p>
                    <button onClick={() => setLineas((ls) => ls.filter((_, x) => x !== i))} aria-label="Quitar" className="text-red-600"><Trash2 size={16} /></button>
                  </div>
                  <div className="mt-2 grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                    <label className="text-xs text-stone-500">Cantidad ({l.unidad})
                      <input type="number" inputMode="decimal" step="any" min="0" value={l.cantidad} onChange={(e) => setL(i, 'cantidad', e.target.value)} />
                    </label>
                    <label className="text-xs text-stone-500">Precio Bs
                      <input type="number" inputMode="decimal" step="0.01" min="0" value={l.precio} onChange={(e) => setL(i, 'precio', e.target.value)} />
                    </label>
                    <p className="pt-4 text-right font-bold">{bs(n(l.cantidad) * n(l.precio))}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-4 gap-2">
              {METODOS.map(([v, t]) => (
                <button key={v} onClick={() => setF({ ...f, metodo: v })} className={`rounded-xl py-2.5 text-sm font-semibold ${f.metodo === v ? 'bg-vino-800 text-white' : 'bg-stone-100 text-stone-700'}`}>{t}</button>
              ))}
            </div>

            <label className="block text-xs text-stone-500">Descuento (Bs)
              <input type="number" inputMode="decimal" step="0.01" min="0" value={f.descuento} onChange={(e) => setF({ ...f, descuento: e.target.value })} placeholder="0" />
            </label>

            {f.metodo === 'efectivo' && (
              <label className="block text-xs text-stone-500">Recibe (opcional, para calcular el vuelto)
                <input type="number" inputMode="decimal" step="0.01" min="0" value={f.recibe} onChange={(e) => setF({ ...f, recibe: e.target.value })} />
              </label>
            )}
            {f.metodo === 'fiado' && (
              <label className="block text-xs text-stone-500">Entrega inicial (Bs, opcional)
                <input type="number" inputMode="decimal" step="0.01" min="0" value={f.pagado} onChange={(e) => setF({ ...f, pagado: e.target.value })} />
              </label>
            )}

            <div className="grid grid-cols-2 gap-2">
              <input placeholder={f.metodo === 'fiado' ? 'Cliente (obligatorio)' : 'Cliente (opcional)'} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
              <input type="tel" inputMode="tel" placeholder="WhatsApp (opcional)" value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} />
            </div>
            <input placeholder="Nota (opcional)" value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} />
            <label className="block text-xs text-stone-500">Fecha de la venta
              <input type="date" max={hoyBO()} value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} />
            </label>

            <div className="rounded-2xl bg-vino-50 p-4 text-center">
              {desc > 0 && <p className="text-sm text-stone-500">Subtotal {bs(bruto)} · descuento −{bs(desc)}</p>}
              <p className="text-3xl font-extrabold text-vino-800">{bs(total)}</p>
              {vuelto > 0 && <p className="mt-1 font-semibold text-green-700">Vuelto: {bs(vuelto)}</p>}
              {f.metodo === 'fiado' && <p className="mt-1 font-semibold text-amber-700">Queda por cobrar: {bs(total - pagadoIni)}</p>}
            </div>

            {err && <p className="text-center text-sm font-semibold text-red-600">{err}</p>}
            <button onClick={confirmar} disabled={busy} className="w-full rounded-full bg-vino-800 py-3.5 font-bold text-white disabled:opacity-50">
              {busy ? 'Guardando...' : 'Confirmar venta'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
