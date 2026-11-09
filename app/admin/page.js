'use client';
import { useEffect, useState } from 'react';

const vacio = { id: null, nombre: '', categoria_id: '', precio_menor: '', precio_mayor: '', unidad: 'kg', disponible: true, imagen_url: '', imagen_public_id: '' };

export default function Admin() {
  const [auth, setAuth] = useState(null);
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [data, setData] = useState({ productos: [], categorias: [] });
  const [f, setF] = useState(vacio);
  const [busy, setBusy] = useState(false);

  async function cargar() {
    const r = await fetch('/api/admin/productos');
    if (r.status === 401) return setAuth(false);
    setData(await r.json());
    setAuth(true);
  }
  useEffect(() => { cargar(); }, []);

  async function login(e) {
    e.preventDefault();
    const r = await fetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: pw }) });
    if (r.ok) { setMsg(''); cargar(); } else setMsg('Clave incorrecta');
  }

  async function subir(file) {
    if (!file) return;
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
      else setMsg('Error al subir la foto');
    } finally { setBusy(false); }
  }

  async function guardar(e) {
    e.preventDefault();
    const r = await fetch('/api/admin/productos', { method: 'POST', body: JSON.stringify(f) });
    if (r.ok) { setF(vacio); setMsg('Guardado'); cargar(); } else setMsg('Error al guardar');
  }

  async function alternar(p) {
    await fetch("/api/admin/productos", { method: "PUT", body: JSON.stringify({ id: p.id, disponible: !p.disponible }) });
    cargar();
  }

  async function borrar(id) {
    if (!confirm('¿Borrar este producto?')) return;
    await fetch('/api/admin/productos?id=' + id, { method: 'DELETE' });
    cargar();
  }

  if (auth === null) return <p className="p-6">Cargando...</p>;

  if (!auth) return (
    <form onSubmit={login} className="mx-auto mt-20 max-w-xs space-y-3 p-4">
      <h1 className="text-xl font-bold">Admin Doña Zulema</h1>
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Clave" className="w-full rounded border p-2" />
      <button className="w-full rounded bg-red-800 py-2 font-bold text-white">Entrar</button>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </form>
  );

  const inp = 'w-full rounded border p-2';
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-2xl font-bold text-red-800">Panel de productos</h1>
      <form onSubmit={guardar} className="mb-8 space-y-2 rounded-xl bg-white p-4 shadow">
        <h2 className="font-semibold">{f.id ? 'Editar producto' : 'Nuevo producto'}</h2>
        <input className={inp} placeholder="Nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required />
        <select className={inp} value={f.categoria_id} onChange={(e) => setF({ ...f, categoria_id: e.target.value })} required>
          <option value="">Categoría...</option>
          {data.categorias.map((c) => <option key={c.id} value={c.id}>{c.linea} › {c.nombre}</option>)}
        </select>
        <div className="grid grid-cols-3 gap-2">
          <input className={inp} type="number" step="0.01" placeholder="Precio menor" value={f.precio_menor ?? ''} onChange={(e) => setF({ ...f, precio_menor: e.target.value })} />
          <input className={inp} type="number" step="0.01" placeholder="Precio mayor" value={f.precio_mayor ?? ''} onChange={(e) => setF({ ...f, precio_mayor: e.target.value })} />
          <input className={inp} placeholder="Unidad" value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value })} />
        </div>
        <input type="file" accept="image/*" onChange={(e) => subir(e.target.files[0])} />
        {busy && <p className="text-sm">Subiendo foto...</p>}
        {f.imagen_url && <img src={f.imagen_url} alt="" className="h-24 rounded" />}
        <label className="flex items-center gap-2"><input type="checkbox" checked={f.disponible} onChange={(e) => setF({ ...f, disponible: e.target.checked })} /> Disponible</label>
        <div className="flex gap-2">
          <button disabled={busy} className="rounded bg-red-800 px-4 py-2 font-bold text-white">Guardar</button>
          {f.id && <button type="button" onClick={() => setF(vacio)} className="rounded border px-4 py-2">Cancelar</button>}
        </div>
        {msg && <p className="text-sm text-green-700">{msg}</p>}
      </form>

      <ul className="space-y-2">
        {data.productos.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded bg-white p-3 shadow">
            <div>
              <b>{p.nombre}</b> {!p.disponible && <span className="text-xs text-red-600">(oculto en la tienda)</span>}
              <div className="text-xs text-stone-500">{p.linea} › {p.categoria} · Bs {p.precio_menor ?? '-'} / {p.precio_mayor ?? '-'}</div>
            </div>
            <div className="flex gap-2 text-sm"><button onClick={() => alternar(p)} className={p.disponible ? "text-amber-700" : "font-bold text-green-700"}>{p.disponible ? "Ocultar" : "Mostrar"}</button>
              <button onClick={() => { setF({ ...p, precio_menor: p.precio_menor ?? '', precio_mayor: p.precio_mayor ?? '' }); window.scrollTo(0, 0); }} className="text-blue-700">Editar</button>
              <button onClick={() => borrar(p.id)} className="text-red-700">Borrar</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
