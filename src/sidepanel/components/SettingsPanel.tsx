import { useT } from '@/i18n'
import { LanguagePicker } from './LanguagePicker'
import { ThemePicker } from './ThemePicker'

function Toggle({
  checked,
  onChange,
  label,
  note,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  note?: string
}) {
  return (
    <label className="flex items-start gap-2 text-xs">
      <input
        type="checkbox"
        className="mt-0.5 shrink-0"
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked)
        }}
      />
      <span>
        {label}
        {note !== undefined && <span className="block text-[11px] text-subtle">{note}</span>}
      </span>
    </label>
  )
}

export function SettingsPanel({
  scopes,
  allTime,
  showHandled,
  diagnostics,
  storageLabel,
  canChooseAccount,
  onAllTime,
  onShowHandled,
  onDiagnostics,
  onSwitchAccount,
  onWipe,
}: {
  scopes: string
  allTime: boolean
  showHandled: boolean
  diagnostics: boolean
  storageLabel: string
  canChooseAccount: boolean
  onAllTime: (value: boolean) => void
  onShowHandled: (value: boolean) => void
  onDiagnostics: (value: boolean) => void
  onSwitchAccount: () => void
  onWipe: () => void
}) {
  const t = useT()

  return (
    <div className="space-y-3 border-b border-line bg-sunken px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ThemePicker />
        <LanguagePicker />
      </div>

      <Toggle
        checked={allTime}
        onChange={onAllTime}
        label={t('settingsFullScan')}
        note={t('settingsFullScanNote')}
      />
      <Toggle checked={showHandled} onChange={onShowHandled} label={t('settingsShowHandled')} />
      <Toggle checked={diagnostics} onChange={onDiagnostics} label={t('settingsDiagnostics')} />

      <div className="space-y-1 border-t border-line pt-3 text-[11px] text-subtle">
        <p>{t('settingsScope', { scopes })}</p>
        <p>{t('settingsStorage', { size: storageLabel })}</p>
      </div>

      {canChooseAccount && (
        <div className="border-t border-line pt-3">
          <button
            type="button"
            className="rounded-md border border-line-strong px-2.5 py-1.5 text-xs font-medium hover:bg-hovered"
            onClick={onSwitchAccount}
          >
            {t('switchAccount')}
          </button>
          <p className="mt-1 text-[11px] text-subtle">{t('switchAccountNote')}</p>
        </div>
      )}

      <div className="border-t border-line pt-3">
        <button
          type="button"
          className="rounded-md border border-danger px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft"
          onClick={onWipe}
        >
          {t('settingsWipe')}
        </button>
        <p className="mt-1 text-[11px] text-subtle">{t('settingsWipeNote')}</p>
      </div>
    </div>
  )
}
