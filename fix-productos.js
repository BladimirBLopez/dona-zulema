const fs = require('fs');
const cambios = {};
const leer = (f) => (cambios[f] ??= fs.readFileSync(f, 'utf8'));
function una(f, a, b) {
  const s = leer(f);
  const c = s.split(a).length - 1;
  if (c !== 1) { console.error('NO SE APLICÓ en ' + f + ' (' + c + ' coincidencias): ' + a.slice(0, 70)); process.exit(1); }
  cambios[f] = s.replace(a, () => b);
}

const R = 'app/api/admin/productos/route.js';
una(R, "import { destroyImage } from '@/lib/cloudinary';", "import { destroyImage } from '@/lib/cloudinary';\nimport { validarProducto, numerosLimpios } from '@/lib/producto';");
una(R, "return NextResponse.json({ productos, categorias });", "return NextResponse.json({ productos: productos.map(numerosLimpios), categorias });");
una(R, "if (!nombre || !b.categoria_id) return NextResponse.json({ error: 'datos_invalidos' }, { status: 400 });",
  "if (!nombre || !b.categoria_id) return NextResponse.json({ error: 'datos_invalidos' }, { status: 400 });\n  const val = validarProducto(b, !b.id);\n  if (val.error) return NextResponse.json(val, { status: 400 });");
una(R, "const unidad = String(b.unidad || 'kg').slice(0, 20);", "const unidad = val.unidad;");

const F = 'components/ProductoForm.js';
una(F, "import { X, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react';", "import { X, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react';\nimport { admiteDecimales } from '@/lib/unidades';");
una(F, "const u = f.unidad || 'unidad';", "const u = f.unidad || 'unidad';\n  const dec = admiteDecimales(f.unidad);");
una(F, "if (esp && (pEsp == null || pEsp <= 0)) {",
`if (!String(f.unidad || '').trim()) {
      setTab(0);
      return setMsg('Elige cómo se vende: kilo, unidad, litro, paquete u otra.');
    }
    for (const [v, t, nombre] of [[precio, 1, 'El precio'], [pEsp, 1, 'El precio especial'], [costo, 2, 'El costo']]) {
      if (v != null && v < 0) { setTab(t); return setMsg(nombre + ' no puede ser negativo.'); }
    }
    for (const [v, t, nombre, aplica] of [[nz(f.stock), 2, 'El stock', nuevo], [nz(f.stock_min), 2, 'El aviso de stock bajo', true], [esp ? desde : null, 1, 'La cantidad del precio especial', true]]) {
      if (!aplica || v == null) continue;
      if (v < 0) { setTab(t); return setMsg(nombre + ' no puede ser negativo.'); }
      if (!dec && !Number.isInteger(v)) { setTab(t); return setMsg(nombre + ' debe ser un número entero: este producto se vende por ' + u + '.'); }
    }
    if (esp && (pEsp == null || pEsp <= 0)) {`);
const paso = "inputMode=\"decimal\" step=\"any\" min=\"0\" ";
const nuevo = "inputMode={dec ? 'decimal' : 'numeric'} step={dec ? 'any' : '1'} min=\"0\" ";
for (const marca of ['placeholder="5" value={f.mayor_desde}', 'placeholder="0" value={f.stock}', 'placeholder="Ej: 3" value={f.stock_min}']) {
  una(F, paso + marca, nuevo + marca);
}

const U = 'lib/unidades.js';
una(U, "const CON_DECIMALES = ['kg', 'kilo', 'kilos', 'litro', 'litros', 'lt', 'lts', 'l', 'lb', 'libra', 'libras'];",
  "const CON_DECIMALES = ['kg', 'kilo', 'kilos', 'litro', 'litros', 'lt', 'lts', 'l', 'lb', 'libra', 'libras', 'g', 'gr', 'gramo', 'gramos', 'ml', 'metro', 'metros'];");

for (const [f, t] of Object.entries(cambios)) fs.writeFileSync(f, t);
console.log('OK: productos, formulario y unidades');
