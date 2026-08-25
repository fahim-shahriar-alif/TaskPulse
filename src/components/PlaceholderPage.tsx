type PlaceholderPageProps = {
  eyebrow: string
  title: string
  description: string
}

export function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return (
    <section className="mx-auto max-w-3xl">
      <p className="font-mono text-xs tracking-[0.18em] text-indigo-300/80 uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">{description}</p>
      <div className="glass mt-8 rounded-3xl p-6">
        <p className="text-sm text-slate-300">This module is scaffolded and ready to build next.</p>
        <p className="mt-2 font-mono text-xs text-slate-500">Shared state will sync across every tab.</p>
      </div>
    </section>
  )
}
