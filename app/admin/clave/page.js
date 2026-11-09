'use client';
import { useState } from 'react';

export default function Clave() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [msg, setMsg] = useState('');

  async function enviar(e) {
    e.preventDefault();
    const r = await fetch('/api/admin/clave', { method: 'POST', body: JSON.stringify({ actual, nueva }) });
    const d = await r.json();
    setMsg(d.ok ? 'Clave cambiada. Vuelve a entrar.' : 'Error: ' + (d.error || ''));
  }

  return (
    <form onSubmit={enviar} className="mx-auto mt-16 max-w-xs space-y-3 p-4">
      <h1 className="text-xl font-bold">Cambiar clave</h1>
      <input type="password" placeholder="Clave actual" value={actual} onChange={(e) => setActual(e.target.value)} className="w-full rounded border p-2" />
      <input type="password" placeholder="Nueva (mín. 12 caracteres)" value={nueva} onChange={(e) => setNueva(e.target.value)} className="w-full rounded border p-2" />
      <button className="w-full rounded bg-red-800 py-2 font-bold text-white">Cambiar</button>
      {msg && <p className="text-sm">{msg}</p>}
      <a href="/admin" className="block text-sm text-blue-700">← Volver al panel</a>
    </form>
  );
}
