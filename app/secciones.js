const serif = { fontFamily: 'var(--font-serif), Georgia, serif' };
const H2 = ({ children, sub }) => (
  <div className="mb-8 text-center">
    <h2 className="text-3xl font-extrabold text-[#7a1414] md:text-4xl" style={serif}>{children}</h2>
    {sub && <p className="mx-auto mt-2 max-w-xl text-stone-600">{sub}</p>}
    <div className="mx-auto mt-3 h-1 w-16 rounded bg-amber-400" />
  </div>
);

const BENEFICIOS = [
  ['🧀', 'Variedad completa', 'Quesos, fiambres, lácteos, pollo y menudencias en un solo lugar.'],
  ['⚖️', 'Mayor y menor', 'Compra la cantidad que necesites, con precios especiales por mayor.'],
  ['❄️', 'Productos frescos', 'Mercadería en cadena de frío y rotación constante.'],
  ['💬', 'Pedido por WhatsApp', 'Escríbenos y te atendemos de forma rápida y directa.'],
];

const PASOS = [
  ['1', 'Elige tus productos', 'Mira el catálogo y toca “Pedir” en lo que necesites.'],
  ['2', 'Confirma por WhatsApp', 'Se abre el chat con tu pedido listo. Indica cantidad y si es por mayor o menor.'],
  ['3', 'Recibe o recoge', 'Coordinamos contigo la entrega o el recojo en el local.'],
];

export function Beneficios({ n }) {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-6xl px-4">
        <H2 sub="Atención cercana y productos de marcas reconocidas.">¿Por qué elegirnos?</H2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {BENEFICIOS.map(([e, t, d]) => (
            <div key={t} className="rounded-2xl border border-amber-100 bg-[#fbf6ec] p-5 text-center">
              <div className="mb-2 text-4xl">{e}</div>
              <h3 className="font-bold text-[#7a1414]">{t}</h3>
              <p className="mt-1 text-sm text-stone-600">{d}</p>
            </div>
          ))}
        </div>
        {n.marcas.length > 0 && (
          <div className="mt-10 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Trabajamos con</p>
            <div className="flex flex-wrap justify-center gap-3">
              {n.marcas.map((m) => (
                <span key={m} className="rounded-full border border-amber-300 bg-white px-5 py-2 text-sm font-bold text-[#7a1414] shadow-sm">{m}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function Info({ n, wa }) {
  const hayUbicacion = n.direccion || n.horarios.length || n.mapa;
  const redes = [['Facebook', n.facebook], ['Instagram', n.instagram], ['TikTok', n.tiktok]].filter(([, u]) => u);

  return (
    <>
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-4">
          <H2>Pedir es muy fácil</H2>
          <div className="grid gap-4 md:grid-cols-3">
            {PASOS.map(([num, t, d]) => (
              <div key={num} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7a1414] font-bold text-amber-300">{num}</span>
                <div><h3 className="font-bold">{t}</h3><p className="mt-1 text-sm text-stone-600">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {n.mayor_titulo && (
        <section className="bg-gradient-to-r from-[#5e0d0d] to-[#a52619] py-12 text-white">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 text-center md:flex-row md:text-left">
            <div className="flex-1">
              <h2 className="text-2xl font-extrabold md:text-3xl" style={serif}>{n.mayor_titulo}</h2>
              <p className="mt-1 text-amber-100">{n.mayor_texto}</p>
            </div>
            <a href={wa('Hola, quiero cotizar una compra al por mayor')} className="rounded-full bg-amber-400 px-7 py-3 font-bold text-red-900 shadow-lg">Cotizar por mayor</a>
          </div>
        </section>
      )}

      {n.faq.length > 0 && (
        <section className="py-14">
          <div className="mx-auto max-w-3xl px-4">
            <H2>Preguntas frecuentes</H2>
            <div className="space-y-3">
              {n.faq.map(([q, a]) => (
                <details key={q} className="group rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                    {q}<span className="text-xl text-amber-600 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm text-stone-600">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {hayUbicacion && (
        <section className="bg-white py-14">
          <div className="mx-auto max-w-5xl px-4">
            <H2>Visítanos</H2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                {n.direccion && <p className="flex gap-3"><span>📍</span><span>{n.direccion}</span></p>}
                {n.horarios.length > 0 && (
                  <div className="flex gap-3"><span>🕒</span>
                    <ul className="space-y-1 text-sm">{n.horarios.map(([d, h]) => <li key={d}><b>{d}:</b> {h}</li>)}</ul>
                  </div>
                )}
                {redes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {redes.map(([nombre, u]) => (
                      <a key={nombre} href={u} target="_blank" rel="noopener noreferrer" className="rounded-full border border-amber-300 px-4 py-1 text-sm font-semibold text-[#7a1414]">{nombre}</a>
                    ))}
                  </div>
                )}
              </div>
              {n.mapa && <iframe src={n.mapa} title="Mapa" loading="lazy" className="h-64 w-full rounded-2xl border-0 shadow" />}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
