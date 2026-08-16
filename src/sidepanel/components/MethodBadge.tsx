import type { UnsubscribeMethod } from '@/core/parse/unsubscribe'
import { useT } from '@/i18n'
import type { MessageKey } from '@/i18n'

const STYLES: Record<UnsubscribeMethod, { key: MessageKey; className: string }> = {
  'one-click': { key: 'methodOneClick', className: 'bg-emerald-50 text-emerald-700' },
  http: { key: 'methodLink', className: 'bg-sky-50 text-sky-700' },
  mailto: { key: 'methodEmail', className: 'bg-slate-100 text-slate-600' },
  none: { key: 'methodNone', className: 'bg-slate-50 text-slate-400' },
}

export function MethodBadge({ method }: { method: UnsubscribeMethod }) {
  const t = useT()
  const style = STYLES[method]

  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${style.className}`}>
      {t(style.key)}
    </span>
  )
}
