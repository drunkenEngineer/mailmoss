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
    <section className="border-t border-line px-4 py-3">
      <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</h2>
      <p className="mt-1 text-xs text-subtle">{summary}</p>
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
      ? 'border-danger text-danger hover:bg-danger-soft'
      : 'border-line-strong hover:bg-hovered'

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
  return <p className="mt-1 font-mono text-[11px] break-words text-subtle">{children}</p>
}
