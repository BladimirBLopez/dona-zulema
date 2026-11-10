'use client';

import { useEffect, useState } from 'react';
import {
  UsersRound,
  UserPlus,
  Pencil,
  ShieldCheck,
  Save,
  X
} from 'lucide-react';

const ROLES = [
  ['administrador', 'Administrador'],
  ['cajero', 'Cajero'],
  ['inventario', 'Inventario'],
  ['contabilidad', 'Contabilidad']
];

const vacio = {
  nombre: '',
  usuario: '',
  clave: '',
  rol: 'cajero'
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nuevo, setNuevo] = useState(false);
  const [form, setForm] = useState(vacio);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [sinPermiso, setSinPermiso] = useState(false);

  async function cargar() {
    try {
      const r = await fetch(
        '/api/admin/usuarios',
        { cache: 'no-store' }
      );

      if (r.status === 403) {
        setSinPermiso(true);
        return;
      }

      if (!r.ok) throw new Error();

      const datos = await r.json();

      setUsuarios(datos.usuarios || []);
      setSinPermiso(false);

    } catch {
      setMensaje(
        'No se pudo cargar la lista de usuarios.'
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function enviar(body, metodo) {
    const r = await fetch(
      '/api/admin/usuarios',
      {
        method: metodo,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    const datos = await r.json()
      .catch(() => ({}));

    if (!r.ok) {
      const errores = {
        usuario_duplicado:
          'Ese nombre de usuario ya existe.',
        datos_invalidos:
          'Revisa los datos ingresados.',
        clave_invalida:
          'La contraseña debe tener entre 12 y 128 caracteres.',
        usuario_no_editable:
          'La cuenta del propietario no se puede modificar aquí.',
        sin_permiso:
          'No tienes permiso para administrar usuarios.'
      };

      throw new Error(
        errores[datos.error] ||
        'No se pudieron guardar los cambios.'
      );
    }

    return datos;
  }

  async function crear(e) {
    e.preventDefault();

    if (guardando) return;

    setGuardando(true);
    setMensaje('');

    try {
      await enviar(form, 'POST');

      setForm(vacio);
      setNuevo(false);
      setMensaje(
        'Usuario creado. Debe ser habilitado cuando se complete la seguridad de roles.'
      );

      await cargar();

    } catch (error) {
      setMensaje(error.message);
    } finally {
      setGuardando(false);
    }
  }

  async function guardar(e) {
    e.preventDefault();

    if (!editando || guardando) return;

    setGuardando(true);
    setMensaje('');

    try {
      await enviar(editando, 'PATCH');

      setEditando(null);
      setMensaje('Usuario actualizado correctamente.');

      await cargar();

    } catch (error) {
      setMensaje(error.message);
    } finally {
      setGuardando(false);
    }
  }

  function campo(valor, cambiar, etiqueta, tipo = 'text') {
    return (
      <label className="block space-y-1">
        <span className="text-sm font-semibold">
          {etiqueta}
        </span>

        <input
          type={tipo}
          required={tipo !== 'password' || !editando}
          minLength={tipo === 'password' ? 12 : undefined}
          maxLength={tipo === 'password' ? 128 : 120}
          value={valor}
          onChange={e => cambiar(e.target.value)}
          autoComplete="off"
          className="w-full rounded-xl border border-stone-300 px-4 py-3"
        />
      </label>
    );
  }

  const totalActivos = usuarios.filter(
    u => u.activo
  ).length;

  if (sinPermiso) {
    return (
      <main className="p-6">
        <p className="rounded-xl bg-red-50 p-5 text-red-700">
          Solo el propietario puede gestionar usuarios.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-6">

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-vino-800">
            Usuarios y permisos
          </h1>

          <p className="text-sm text-stone-500">
            Administra el personal del negocio.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNuevo(v => !v);
            setEditando(null);
            setMensaje('');
          }}
          className="flex items-center gap-2 rounded-xl bg-vino-800 px-4 py-3 text-sm font-bold text-white"
        >
          <UserPlus size={18} />
          Nuevo
        </button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Las cuentas de empleados se preparan aquí.
        El acceso de los trabajadores se habilitará
        cuando terminemos de proteger las API y
        configurar sus permisos.
      </div>

      {mensaje && (
        <div className="rounded-xl bg-stone-100 p-4 text-sm text-stone-700">
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-vino-800">
            {usuarios.length}
          </p>
          <p className="text-xs text-stone-500">
            Usuarios registrados
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-vino-800">
            {totalActivos}
          </p>
          <p className="text-xs text-stone-500">
            Cuentas activas
          </p>
        </div>
      </div>

      {nuevo && (
        <form
          onSubmit={crear}
          className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-bold text-vino-800">
            Crear nuevo usuario
          </h2>

          {campo(
            form.nombre,
            v => setForm(f => ({ ...f, nombre: v })),
            'Nombre completo'
          )}

          {campo(
            form.usuario,
            v => setForm(f => ({ ...f, usuario: v })),
            'Nombre de usuario'
          )}

          {campo(
            form.clave,
            v => setForm(f => ({ ...f, clave: v })),
            'Contraseña (mínimo 12 caracteres)',
            'password'
          )}

          <label className="block space-y-1">
            <span className="text-sm font-semibold">
              Rol
            </span>

            <select
              value={form.rol}
              onChange={e => setForm(f => ({
                ...f,
                rol: e.target.value
              }))}
              className="w-full rounded-xl border border-stone-300 p-3"
            >
              {ROLES.map(([valor, titulo]) => (
                <option key={valor} value={valor}>
                  {titulo}
                </option>
              ))}
            </select>
          </label>

          <button
            disabled={guardando}
            className="w-full rounded-xl bg-vino-800 p-3 font-bold text-white disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Crear usuario'}
          </button>
        </form>
      )}

      {cargando && (
        <p className="p-4 text-center text-stone-500">
          Cargando usuarios...
        </p>
      )}

      <section className="space-y-3">
        {usuarios.map(u => (
          <div
            key={u.id}
            className="rounded-2xl bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="rounded-full bg-vino-50 p-3 text-vino-800">
                  {u.rol === 'propietario'
                    ? <ShieldCheck size={20} />
                    : <UsersRound size={20} />}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate font-bold">
                    {u.nombre}
                  </h3>

                  <p className="text-sm text-stone-500">
                    @{u.usuario}
                  </p>

                  <p className="mt-1 text-xs capitalize text-vino-800">
                    {u.rol}
                  </p>

                  <p className={
                    'mt-1 text-xs font-semibold ' +
                    (u.activo
                      ? 'text-green-700'
                      : 'text-red-600')
                  }>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
              </div>

              {u.rol !== 'propietario' && (
                <button
                  type="button"
                  onClick={() => {
                    setEditando({
                      ...u,
                      clave: ''
                    });
                    setNuevo(false);
                    setMensaje('');
                  }}
                  aria-label={'Editar ' + u.usuario}
                  className="rounded-full bg-stone-100 p-3 text-stone-700"
                >
                  <Pencil size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {editando && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
          <div className="mx-auto my-8 max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold text-vino-800">
                Editar usuario
              </h2>

              <button
                type="button"
                onClick={() => setEditando(null)}
                aria-label="Cerrar"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-4">

              {campo(
                editando.nombre,
                v => setEditando(f => ({
                  ...f,
                  nombre: v
                })),
                'Nombre completo'
              )}

              {campo(
                editando.usuario,
                v => setEditando(f => ({
                  ...f,
                  usuario: v
                })),
                'Usuario'
              )}

              <label className="block space-y-1">
                <span className="text-sm font-semibold">
                  Rol asignado
                </span>

                <select
                  value={editando.rol}
                  onChange={e => setEditando(f => ({
                    ...f,
                    rol: e.target.value
                  }))}
                  className="w-full rounded-xl border border-stone-300 p-3"
                >
                  {ROLES.map(([valor, titulo]) => (
                    <option key={valor} value={valor}>
                      {titulo}
                    </option>
                  ))}
                </select>
              </label>

              {campo(
                editando.clave,
                v => setEditando(f => ({
                  ...f,
                  clave: v
                })),
                'Nueva contraseña (opcional)',
                'password'
              )}

              <label className="flex items-center gap-3 rounded-xl bg-stone-50 p-4">
                <input
                  type="checkbox"
                  checked={editando.activo}
                  onChange={e => setEditando(f => ({
                    ...f,
                    activo: e.target.checked
                  }))}
                  className="h-5 w-5"
                />

                <span className="text-sm font-semibold">
                  Usuario activo
                </span>
              </label>

              <button
                disabled={guardando}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-vino-800 p-3 font-bold text-white disabled:opacity-50"
              >
                <Save size={18} />
                {guardando
                  ? 'Guardando...'
                  : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
