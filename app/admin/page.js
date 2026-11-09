'use client';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Plus, Pencil, Trash2, X, ImagePlus, Lock } from 'lucide-react';

const vacio = { id: null, nombre: '', categoria_id: '', precio_menor: '', precio_mayor: '', unidad: 'kg', disponible: true, imagen_url: '', imagen_public_id: '' };
const bs = (v) => (v == null ? '—' : Number(v).toFixed(2));
const mini = (u) => u.replace('/upload/', '/upload/f_auto,q_auto,w_160,h_160,c_fill/');

function Switch({ on, onClick }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label="Mostrar en la tienda" onClick={onClick}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-green-500' : 'bg-stone-300'}`}>
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function Admin() {
  const [auth, setAuth] = useState(null);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [data, setData] = useState({ productos: [], categorias: [] });
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [toast, setToast] = useState('');

  const aviso = (t) => { setToast(t); setTimeout(() => setToast(''), 2500); };

  async function cargar() {
    try {
      const r = await fetch('/api/admin/productos');
      if (r.status === 401) return setAuth(false);
      setData(await r.json());
      setAuth(true);
    } catch { aviso('Sin conexión'); }
  }
  useEffect(() => { cargar(); }, []);

  async function login(e) {
    e.preventDefault();
    setErr('');
    const r = await fetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: pw }) });
    if (r.ok) { window.dispatchEvent(new Event('admin-auth')); cargar(); }
    else setErr(r.status === 429 ? 'Demasiados intentos. Espera unos minutos.' : 'Clave incorrecta');
  }

  async function subir(file) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return aviso('La foto pesa más de 8 MB');
    setBusy(true);
    try {
      const s = await (await fetch('/api/admin/upload', { method: 'POST' })).json();
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', s.apiKey);
      fd.append('timestamp', s.timestamp);
      fd.append('folder', s.folder);
      fd.append('signature', s.signature);
      const r = await (await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, { method: 'POST', body: fd })).json();
      if (r.secure_url) setF((x) => ({ ...x, imagen_url: r.secure_url, imagen_public_id: r.public_id }));
      else aviso('Error al subir la foto');
    } catch { aviso('Error al subir la foto'); }
    finally { setBusy(false); }
  }

  async function guardar(e) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch('/api/admin/productos', { method: 'POST', body: JSON.stringify(f) });
    setBusy(false);
    if (r.ok) { setF(null); aviso('Producto guardado'); cargar(); } else aviso('No se pudo guardar');
  }

  async function alternar(p) {
    await fetch('/api/admin/productos', { method: 'PUT', body: JSON.stringify({ id: p.id, disponible: !p.disponible }) });
    aviso(p.disponible ? 'Oculto en la tienda' : 'Visible en la tienda');
    cargar();
  }

  async function borrar(p) {
    if (!confirm('¿Borrar "' + p.nombre + '"?')) return;
    await fetch('/api/admin/productos?id=' + p.id, { method: 'DELETE' });
    aviso('Producto borrado');
    cargar();
  }

  const editar = (p) => setF({ ...p, precio_menor: p.precio_menor ?? '', precio_mayor: p.precio_mayor ?? '', imagen_url: p.imagen_url || '', imagen_public_id: p.imagen_public_id || '' });

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.productos.filter((p) =>
      (filtro === 'todos' || (filtro === 'visibles' ? p.disponible : !p.disponible)) &&
      (!t || (p.nombre + ' ' + p.categoria).toLowerCase().includes(t)));
  }, [data.productos, q, filtro]);

  if (auth === null) return <p className="p-8 text-center text-stone-500">Cargando...</p>;

  if (!auth) return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-vino-950 via-vino-900 to-vino-700 p-4">
      <form onSubmit={login} className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-7 shadow-lift">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-vino-800 text-oro-300"><Lock size={24} /></div>
        <div className="text-center">
          <h1 className="font-serif text-2xl font-extrabold text-vino-800">Panel de administración</h1>
          <p className="text-sm text-stone-500">Ingresa tu clave para continuar</p>
        </div>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Clave" autoFocus />
        <button className="w-full rounded-full bg-vino-800 py-3 font-bold text-white transition hover:bg-vino-700">Entrar</button>
        {err && <p className="text-center text-sm text-red-600">{err}</p>}
      </form>
    </div>
  );

  const vis = data.productos.filter((p) => p.disponible).length;
  const stats = [['Productos', data.productos.length, 'text-vino-800'], ['Visibles', vis, 'text-green-600'], ['Ocultos', data.productos.length - vis, 'text-stone-500']];
  const fl = (a) => `rounded-full px-4 py-1.5 text-sm font-semibold transition ${a ? 'bg-vino-800 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'}`;

  return (
    <main className="px-4 pt-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-extrabold text-vino-800">Productos</h1>
          <p className="text-sm text-stone-500">Lo que activas aquí aparece en la tienda al instante.</p>
        </div>
        <button onClick={() => setF({ ...vacio })} className="flex items-center gap-2 rounded-full bg-vino-800 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-vino-700">
          <Plus size={18} /> Nuevo
        </button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        {stats.map(([t, n, c]) => (
          <div key={t} className="rounded-2xl bg-white p-4 text-center shadow-card">
            <p className={`text-3xl font-extrabold ${c}`}>{n}</p>
            <p className="text-xs text-stone-500">{t}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto..." style={{ paddingLeft: '2.75rem' }} />
        </div>
        <div className="flex gap-2">
          {[['todos', 'Todos'], ['visibles', 'Visibles'], ['ocultos', 'Ocultos']].map(([v, t]) => (
            <button key={v} onClick={() => setFiltro(v)} className={fl(filtro === v)}>{t}</button>
          ))}
        </div>
      </div>

      <ul className="space-y-3">
        {lista.map((p) => (
          <li key={p.id} className={`flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card ${p.disponible ? '' : 'opacity-70'}`}>
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-vino-50">
              {p.imagen_url ? <img src={mini(p.imagen_url)} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-vino-300"><ImagePlus size={22} /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.nombre}</p>
              <p className="truncate text-xs text-stone-500">{p.categoria}</p>
              <p className="mt-0.5 text-xs"><span className="text-vino-800">Menor Bs {bs(p.precio_menor)}</span> · <span className="text-amber-700">Mayor Bs {bs(p.precio_mayor)}</span></p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Switch on={p.disponible} onClick={() => alternar(p)} />
              <div className="flex gap-1">
                <button onClick={() => editar(p)} aria-label="Editar" className="grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-stone-700"><Pencil size={15} /></button>
                <button onClick={() => borrar(p)} aria-label="Borrar" className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600"><Trash2 size={15} /></button>
              </div>
            </div>
          </li>
        ))}
        {lista.length === 0 && <li className="py-12 text-center text-stone-500">No hay productos con ese filtro.</li>}
      </ul>

      <AnimatePresence>
        {f && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setF(null)}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center">
            <motion.form onSubmit={guardar} onClick={(e) => e.stopPropagation()}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="max-h-[92vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-3xl bg-white p-5 md:rounded-3xl">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-extrabold text-vino-800">{f.id ? 'Editar producto' : 'Nuevo producto'}</h2>
                <button type="button" onClick={() => setF(null)} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full bg-stone-100"><X size={18} /></button>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-vino-200 p-3 hover:bg-vino-50">
                {f.imagen_url ? <img src={mini(f.imagen_url)} alt="" className="h-16 w-16 rounded-xl object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-xl bg-vino-50 text-vino-300"><ImagePlus size={24} /></span>}
                <span className="text-sm font-semibold text-vino-800">{busy ? 'Subiendo...' : f.imagen_url ? 'Cambiar foto' : 'Subir foto'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => subir(e.target.files?.[0])} />
              </label>

              <input placeholder="Nombre del producto" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required />
              <select value={f.categoria_id} onChange={(e) => setF({ ...f, categoria_id: e.target.value })} required>
                <option value="">Categoría...</option>
                {data.categorias.map((c) => <option key={c.id} value={c.id}>{c.linea} › {c.nombre}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" inputMode="decimal" step="0.01" min="0" placeholder="P. menor" value={f.precio_menor} onChange={(e) => setF({ ...f, precio_menor: e.target.value })} />
                <input type="number" inputMode="decimal" step="0.01" min="0" placeholder="P. mayor" value={f.precio_mayor} onChange={(e) => setF({ ...f, precio_mayor: e.target.value })} />
                <input placeholder="Unidad" value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value })} />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-crema p-3">
                <span className="text-sm font-semibold">Mostrar en la tienda</span>
                <Switch on={f.disponible} onClick={() => setF({ ...f, disponible: !f.disponible })} />
              </div>
              <button disabled={busy} className="w-full rounded-full bg-vino-800 py-3 font-bold text-white transition hover:bg-vino-700 disabled:opacity-50">
                {busy ? 'Espera...' : 'Guardar'}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}
            className="fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-full bg-vino-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lift">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
