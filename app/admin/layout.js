export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default function AdminLayout({ children }) {
  const l = 'whitespace-nowrap rounded-full border border-amber-300 px-3 py-1 text-sm font-semibold text-[#7a1414]';
  return (
    <>
      <nav className="sticky top-0 z-20 flex gap-2 overflow-x-auto border-b bg-[#fbf6ec] px-4 py-3">
        <a href="/admin" className={l}>Productos</a>
        <a href="/admin/categorias" className={l}>Categorías</a>
        <a href="/admin/negocio" className={l}>Datos del negocio</a>
        <a href="/admin/clave" className={l}>Clave</a>
        <a href="/" target="_blank" className={l}>Ver sitio</a>
        <a href="/api/admin/logout" className={l}>Salir</a>
      </nav>
      {children}
    </>
  );
}
