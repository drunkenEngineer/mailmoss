import { useT } from '@/i18n'

export function SettingsPanel({
  scopes,
  allTime,
  showHandled,
  diagnostics,
  storageLabel,
  onAllTime,
  onShowHandled,
  onDiagnostics,
  onWipe,
}: {
  scopes: string
  allTime: boolean
  showHandled: boolean
  diagnostics: boolean
  storageLabel: string
  onAllTime: (value: boolean) => void
  onShowHandled: (value: boolean) => void
  onDiagnostics: (value: boolean) => void
  onWipe: () => void
}) {
  const t = useT()

  return (
    <div className="space-y-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] text-slate-500">{t('settingsScope', { scopes })}</p>
      <p className="text-[11px] text-slate-500">{t('settingsStorage', { size: storageLabel })}</p>

      <label className="flex items-start gap-2 text-xs">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={allTime}
          onChange={(event) => {
            onAllTime(event.target.checked)
          }}
        />
        <span>
          {t('settingsFullScan')}
          <span className="block text-[11px] text-slate-500">{t('settingsFullScanNote')}</span>
        </span>
      </label>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={showHandled}
          onChange={(event) => {
            onShowHandled(event.target.checked)
          }}
        />
        {t('settingsShowHandled')}
      </label>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={diagnostics}
          onChange={(event) => {
            onDiagnostics(event.target.checked)
          }}
        />
        {t('settingsDiagnostics')}
      </label>

      <div>
        <button
          type="button"
          className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
          onClick={onWipe}
        >
          {t('settingsWipe')}
        </button>
        <p className="mt-1 text-[11px] text-slate-500">{t('settingsWipeNote')}</p>
      </div>
    </div>
  )
}
