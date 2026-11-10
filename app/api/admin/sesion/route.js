import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import {
  obtenerUsuarioSesion
} from '@/lib/usuarios';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const u = await obtenerUsuarioSesion(req);

    if (u?.rol === 'propietario') {
      return NextResponse.json({
        ok: true,
        usuario: {
          id: u.id,
          nombre: u.nombre,
          usuario: u.usuario,
          rol: u.rol
        }
      }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    // Compatibilidad temporal.
    if (await isAdmin(req)) {
      return NextResponse.json({
        ok: true,
        temporal: true,
        usuario: {
          nombre: 'Administrador anterior',
          rol: 'propietario'
        }
      }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    return NextResponse.json(
      { error: 'no_autorizado' },
      { status: 401 }
    );

  } catch (e) {
    console.error('sesion', e?.code || '');

    return NextResponse.json(
      { error: 'error_servidor' },
      { status: 500 }
    );
  }
}
