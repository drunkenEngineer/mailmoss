import type { ReactNode } from 'react'

// Diagnostics are development instrumentation, not product UI. They are removed
// before release, so unlike everything else in the panel their strings are not
// translated. See CONTRIBUTING.md.
export function ProbeCard({
  title,
  summary,
  children,
}: {
  title: string
  summary: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-slate-200 px-4 py-3">
      <h2 className="text-xs font-semibold tracking-wide text-slate-700 uppercase">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{summary}</p>
      <div className="mt-2">{children}</div>
    </section>
  )
}

export function ProbeButton({
  children,
  onClick,
  disabled,
  tone = 'default',
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'danger'
}) {
  const palette =
    tone === 'danger'
      ? 'border-red-300 text-red-700 hover:bg-red-50'
      : 'border-slate-300 hover:bg-slate-50'

  return (
    <button
      type="button"
      className={`rounded border px-2 py-1 text-xs font-medium disabled:opacity-50 ${palette}`}
      disabled={disabled ?? false}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function Mono({ children }: { children: ReactNode }) {
  return <p className="mt-1 font-mono text-[11px] break-words text-slate-500">{children}</p>
}
