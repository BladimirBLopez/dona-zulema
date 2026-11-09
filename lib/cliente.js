export async function api(url, method = 'GET', body) {
  try {
    const r = await fetch(url, { method, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401) { location.href = '/admin'; return { ok: false, status: 401, data: null }; }
    const data = await r.json().catch(() => null);
    return { ok: r.ok, status: r.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'sin_conexion' } };
  }
}

const MSG = {
  falta_tabla: 'Faltan las tablas en Neon. Ejecuta el SQL del Paso 1.',
  fiado_sin_cliente: 'Para fiado escribe el nombre del cliente.',
  sin_items: 'Agrega al menos un producto.',
  items_invalidos: 'Revisa cantidades y precios.',
  producto_repetido: 'Hay un producto repetido.',
  sin_conexion: 'Sin conexión.',
  sin_deuda: 'Esa venta ya no tiene saldo.',
  monto_invalido: 'Monto inválido.',
  stock_insuficiente: 'Stock insuficiente. Revisa las cantidades disponibles antes de completar la venta.',
  producto_inexistente: 'Un producto ya no existe en el catálogo. Actualiza la lista antes de vender.',
  pedido_invalido: 'El número de pedido no es válido.',
  pedido_no_pendiente: 'El pedido ya fue entregado, cancelado o no existe. Actualiza la lista.',
};
export const errMsg = (d) => MSG[d?.error] || 'No se pudo completar. Intenta de nuevo.';
