import {
  Bell,
  Check,
  Clock3,
  FileText,
  MapPin,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  ALL_DAYS,
  BOARDS,
  CONFIG_TYPES,
  CURRENT_USER,
  CUSTOMERS,
  LEG_META,
  REGIONS,
  configTypeLabel,
  createBoardConfigs,
} from './data/seed'
import type {
  AutoAcceptSettings,
  BoardConfigs,
  ConfigHistoryEntry,
  ConfigMeta,
  ConfigPayloadMap,
  ConfigTypeId,
  CustomerMode,
  CustomerSettings,
  DayKey,
  LegType,
  NotificationSettings,
  RegionRule,
  RegionSettings,
  UserRef,
} from './types'

type AnySettings = ConfigPayloadMap[ConfigTypeId]

const LEG_TYPES: LegType[] = ['pickup', 'delivery', 'movement']

function clone<T>(value: T): T {
  return structuredClone(value)
}

function equal(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function formatLead(hours: number): string {
  if (hours < 24) return `${hours} hrs`
  const days = Math.floor(hours / 24)
  const rem = hours % 24
  return rem ? `${days}d ${rem}h` : `${days} days`
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function Toggle({
  checked,
  onChange,
  disabled,
  id,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  id?: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`toggle ${checked ? 'is-on' : ''} ${disabled ? 'is-disabled' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-thumb" />
    </button>
  )
}

function ChipSelect({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: { id: string; label: string; hint?: string }[]
  selected: string[]
  onChange: (next: string[]) => void
  placeholder: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.hint?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q),
    )
  }, [options, query])

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  return (
    <div className="chip-select">
      <div className="chip-select-field" onClick={() => setOpen(true)}>
        {selected.length === 0 ? (
          <span className="chip-select-placeholder">{placeholder}</span>
        ) : (
          selected.map((id) => {
            const opt = options.find((o) => o.id === id)
            return (
              <span key={id} className="chip">
                {opt?.label ?? id}
                <button
                  type="button"
                  aria-label={`Remove ${opt?.label ?? id}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(id)
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )
          })
        )}
      </div>
      {open && (
        <>
          <button type="button" className="chip-select-backdrop" onClick={() => setOpen(false)} />
          <div className="chip-select-menu">
            <div className="chip-select-search">
              <Search size={14} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
              />
            </div>
            <ul>
              {filtered.map((opt) => {
                const active = selected.includes(opt.id)
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      className={active ? 'is-active' : ''}
                      onClick={() => toggle(opt.id)}
                    >
                      <span>
                        <strong>{opt.label}</strong>
                        {opt.hint && <em>{opt.hint}</em>}
                      </span>
                      {active && <Check size={14} />}
                    </button>
                  </li>
                )
              })}
              {filtered.length === 0 && <li className="chip-select-empty">No matches</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

function DayPicker({
  value,
  onChange,
  disabled,
}: {
  value: DayKey[]
  onChange: (next: DayKey[]) => void
  disabled?: boolean
}) {
  function toggle(day: DayKey) {
    if (disabled) return
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day])
  }

  return (
    <div className={`day-picker ${disabled ? 'is-disabled' : ''}`}>
      {ALL_DAYS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={value.includes(key) ? 'is-on' : ''}
          disabled={disabled}
          onClick={() => toggle(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function UserCard({ user, label, when }: { user: UserRef; label: string; when?: string }) {
  return (
    <div className="user-card">
      <div className="user-avatar" aria-hidden>
        {user.initials}
      </div>
      <div className="user-copy">
        <p className="user-label">{label}</p>
        <p className="user-name">{user.name}</p>
        <p className="user-meta">
          {user.role} · {user.email}
        </p>
        {when && (
          <p className="user-when">
            <Clock3 size={12} />
            {formatWhen(when)}
          </p>
        )}
      </div>
    </div>
  )
}

function HistoryList({ entries }: { entries: ConfigHistoryEntry[] }) {
  const sorted = [...entries].sort((a, b) => +new Date(b.savedAt) - +new Date(a.savedAt))
  return (
    <ul className="history-list">
      {sorted.slice(0, 5).map((entry) => (
        <li key={entry.id}>
          <div className="history-avatar">{entry.savedBy.initials}</div>
          <div>
            <p className="history-name">{entry.savedBy.name}</p>
            <p className="history-reason">{entry.reason}</p>
            <p className="history-when">{formatWhen(entry.savedAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function App() {
  const [boardId, setBoardId] = useState(BOARDS[0].id)
  const [configType, setConfigType] = useState<ConfigTypeId>('auto-accept')
  const [store, setStore] = useState<Record<string, BoardConfigs>>(() => ({
    [BOARDS[0].id]: createBoardConfigs(BOARDS[0].id),
  }))
  const [draft, setDraft] = useState<AnySettings>(() =>
    clone(createBoardConfigs(BOARDS[0].id)['auto-accept'].data),
  )
  const [draftMeta, setDraftMeta] = useState<ConfigMeta>(
    () => clone(createBoardConfigs(BOARDS[0].id)['auto-accept'].meta),
  )
  const [saveReason, setSaveReason] = useState('')
  const [activeLeg, setActiveLeg] = useState<LegType>('pickup')
  const [boardQuery, setBoardQuery] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const board = BOARDS.find((b) => b.id === boardId) ?? BOARDS[0]
  const boardConfigs = store[boardId] ?? createBoardConfigs(boardId)
  const savedBundle = boardConfigs[configType]
  const dirty = !equal(draft, savedBundle.data)
  const typeMeta = CONFIG_TYPES.find((c) => c.id === configType)!

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(t)
  }, [toast])

  function ensureBoard(id: string): BoardConfigs {
    if (store[id]) return store[id]
    const created = createBoardConfigs(id)
    setStore((prev) => ({ ...prev, [id]: created }))
    return created
  }

  function loadBundle(nextBoardId: string, nextType: ConfigTypeId) {
    const configs = ensureBoard(nextBoardId)
    const bundle = configs[nextType]
    setDraft(clone(bundle.data))
    setDraftMeta(clone(bundle.meta))
    setSaveReason('')
    setActiveLeg('pickup')
    setCustomerQuery('')
  }

  function switchBoard(id: string) {
    if (id === boardId) return
    if (dirty && !window.confirm('Discard unsaved changes for this configuration?')) return
    setBoardId(id)
    loadBundle(id, configType)
  }

  function switchConfigType(id: ConfigTypeId) {
    if (id === configType) return
    if (dirty && !window.confirm('Discard unsaved changes for this configuration?')) return
    setConfigType(id)
    loadBundle(boardId, id)
  }

  function reset() {
    setDraft(clone(savedBundle.data))
    setSaveReason('')
    setToast('Changes discarded')
  }

  function save() {
    const reason = saveReason.trim()
    if (!reason) {
      setToast('Add a save reason before saving')
      return
    }
    if (!dirty) return

    const now = new Date().toISOString()
    const historyEntry: ConfigHistoryEntry = {
      id: `h-${Date.now()}`,
      savedBy: CURRENT_USER,
      savedAt: now,
      reason,
    }

    const nextMeta: ConfigMeta = {
      ...draftMeta,
      lastSavedBy: CURRENT_USER,
      lastSavedAt: now,
      reason,
      history: [...draftMeta.history, historyEntry],
    }

    setStore((prev) => {
      const current = prev[boardId] ?? createBoardConfigs(boardId)
      return {
        ...prev,
        [boardId]: {
          ...current,
          [configType]: {
            ...current[configType],
            data: clone(draft) as never,
            meta: nextMeta,
          },
        },
      }
    })
    setDraftMeta(nextMeta)
    setSaveReason('')
    setToast(`Saved ${configTypeLabel(configType)} for ${board.shortName}`)
  }

  const filteredBoards = BOARDS.filter((b) => {
    const q = boardQuery.trim().toLowerCase()
    if (!q) return true
    return b.name.toLowerCase().includes(q) || b.shortName.toLowerCase().includes(q)
  })

  const regionOptions = REGIONS.map((r) => ({
    id: r.id,
    label: r.name,
    hint: r.group,
  }))

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <Settings2 size={18} />
          <div>
            <p className="topbar-eyebrow">Charger Logistics</p>
            <h1>Planning Board</h1>
          </div>
        </div>
        <div className="topbar-search">
          <Search size={15} />
          <input placeholder="Search boards, customers, lanes…" />
        </div>
        <div className="topbar-actions">
          <button type="button" className="icon-btn" aria-label="Refresh">
            <RefreshCw size={16} />
          </button>
          <span className="avatar" title={CURRENT_USER.name}>
            {CURRENT_USER.initials}
          </span>
        </div>
      </header>

      <div className="shell">
        <aside className="board-sidebar" aria-label="Planning boards">
          <div className="sidebar-head">
            <p>Boards</p>
            <span>{BOARDS.length}</span>
          </div>
          <div className="sidebar-search">
            <Search size={13} />
            <input
              value={boardQuery}
              onChange={(e) => setBoardQuery(e.target.value)}
              placeholder="Search boards…"
            />
          </div>
          <ul className="board-list">
            {filteredBoards.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  className={b.id === boardId ? 'is-active' : ''}
                  onClick={() => switchBoard(b.id)}
                  title={b.name}
                >
                  <span className="board-list-name">{b.shortName}</span>
                  <span className="board-list-count">{b.legCount}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="main-pane">
          <div className="page-header">
            <div>
              <p className="eyebrow">Team-specific · Board configuration</p>
              <h2>{board.name}</h2>
              <p className="page-sub">
                Manage multiple saved configuration types for this planning board.
              </p>
            </div>
            <div className="page-actions">
              {dirty && <span className="dirty-pill">Unsaved changes</span>}
              <button type="button" className="btn ghost" disabled={!dirty} onClick={reset}>
                Discard
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={!dirty || !saveReason.trim()}
                onClick={save}
              >
                Save configuration
              </button>
            </div>
          </div>

          <div className="config-type-bar" role="tablist" aria-label="Configuration types">
            {CONFIG_TYPES.map((type) => {
              const Icon =
                type.id === 'auto-accept'
                  ? ShieldCheck
                  : type.id === 'customers'
                    ? Users
                    : type.id === 'regions'
                      ? MapPin
                      : Bell
              return (
                <button
                  key={type.id}
                  type="button"
                  role="tab"
                  aria-selected={configType === type.id}
                  className={configType === type.id ? 'is-active' : ''}
                  onClick={() => switchConfigType(type.id)}
                >
                  <Icon size={14} />
                  {type.label}
                </button>
              )
            })}
          </div>

          <p className="type-blurb">{typeMeta.description}</p>

          <div className="center-scroll">
            {configType === 'auto-accept' && (
              <AutoAcceptEditor
                draft={draft as AutoAcceptSettings}
                setDraft={(fn) => setDraft((prev) => fn(prev as AutoAcceptSettings))}
                activeLeg={activeLeg}
                setActiveLeg={setActiveLeg}
                regionOptions={regionOptions}
              />
            )}

            {configType === 'customers' && (
              <CustomersEditor
                draft={draft as CustomerSettings}
                setDraft={(fn) => setDraft((prev) => fn(prev as CustomerSettings))}
                customerQuery={customerQuery}
                setCustomerQuery={setCustomerQuery}
              />
            )}

            {configType === 'regions' && (
              <RegionsEditor
                draft={draft as RegionSettings}
                setDraft={(fn) => setDraft((prev) => fn(prev as RegionSettings))}
                regionOptions={regionOptions}
              />
            )}

            {configType === 'notifications' && (
              <NotificationsEditor
                draft={draft as NotificationSettings}
                setDraft={(fn) => setDraft((prev) => fn(prev as NotificationSettings))}
              />
            )}
          </div>
        </main>

        <aside className="meta-sidebar" aria-label="Configuration details">
          <div className="meta-card">
            <div className="meta-card-head">
              <FileText size={15} />
              <h3>Save details</h3>
            </div>

            <label className="reason-field">
              <span>Reason for this save</span>
              <textarea
                value={saveReason}
                onChange={(e) => setSaveReason(e.target.value)}
                placeholder="Why are you changing this configuration?"
                rows={3}
              />
              <em>Required before saving. Stored with your user details.</em>
            </label>

            <div className="meta-divider" />

            <UserCard user={draftMeta.createdBy} label="Created by" when={draftMeta.createdAt} />
            <UserCard
              user={draftMeta.lastSavedBy}
              label="Last saved by"
              when={draftMeta.lastSavedAt}
            />

            <div className="current-reason">
              <p className="user-label">Last save reason</p>
              <p className="reason-text">{draftMeta.reason || '—'}</p>
            </div>

            <div className="saving-as">
              <p className="user-label">Saving as</p>
              <div className="saving-as-row">
                <span className="user-avatar sm">{CURRENT_USER.initials}</span>
                <div>
                  <strong>{CURRENT_USER.name}</strong>
                  <span>
                    {CURRENT_USER.role} · {CURRENT_USER.email}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="meta-card">
            <div className="meta-card-head">
              <Clock3 size={15} />
              <h3>Save history</h3>
            </div>
            <HistoryList entries={draftMeta.history} />
          </div>
        </aside>
      </div>

      {toast && (
        <div className="toast" role="status">
          <Check size={14} />
          {toast}
        </div>
      )}
    </div>
  )
}

function AutoAcceptEditor({
  draft,
  setDraft,
  activeLeg,
  setActiveLeg,
  regionOptions,
}: {
  draft: AutoAcceptSettings
  setDraft: (fn: (prev: AutoAcceptSettings) => AutoAcceptSettings) => void
  activeLeg: LegType
  setActiveLeg: (leg: LegType) => void
  regionOptions: { id: string; label: string; hint?: string }[]
}) {
  const leg = draft.legs[activeLeg]
  const masterOff = !draft.autoAccept

  function updateLeg(patch: Partial<typeof leg>) {
    setDraft((prev) => ({
      ...prev,
      legs: {
        ...prev.legs,
        [activeLeg]: { ...prev.legs[activeLeg], ...patch },
      },
    }))
  }

  function updateRegions(key: keyof RegionRule, next: string[]) {
    updateLeg({ regions: { ...leg.regions, [key]: next } })
  }

  return (
    <>
      <section className={`master-card ${draft.autoAccept ? 'is-on' : 'is-off'}`}>
        <div className="master-copy">
          <div className="master-badge">{draft.autoAccept ? 'ON' : 'OFF'}</div>
          <div>
            <h3>Auto Accept</h3>
            <p>Master toggle for this board. When off, all per-leg rules are ignored.</p>
          </div>
        </div>
        <Toggle
          checked={draft.autoAccept}
          onChange={(autoAccept) => setDraft((prev) => ({ ...prev, autoAccept }))}
        />
      </section>

      <section className={`panel leg-panel ${masterOff ? 'is-dimmed' : ''}`}>
        <div className="leg-tabs" role="tablist">
          {LEG_TYPES.map((type) => {
            const meta = LEG_META[type]
            const cfg = draft.legs[type]
            return (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={activeLeg === type}
                className={`leg-tab accent-${meta.accent} ${activeLeg === type ? 'is-active' : ''}`}
                onClick={() => setActiveLeg(type)}
                disabled={masterOff}
              >
                <span className="leg-tab-code">{meta.short}</span>
                <span className="leg-tab-label">{meta.label}</span>
                <span className={`leg-tab-state ${cfg.enabled ? 'on' : 'off'}`}>
                  {cfg.enabled ? 'ON' : 'OFF'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="panel-body">
          <div className="field-row between">
            <div>
              <h4>{LEG_META[activeLeg].label} auto accept</h4>
              <p className="field-help">{LEG_META[activeLeg].description}</p>
            </div>
            <Toggle
              checked={leg.enabled}
              disabled={masterOff}
              onChange={(enabled) => updateLeg({ enabled })}
            />
          </div>

          <div className={`leg-fields ${!leg.enabled || masterOff ? 'is-disabled' : ''}`}>
            <label className="field">
              <span className="field-label">Lead time</span>
              <span className="field-help">
                Only auto-accept when the leg is at least this far out. Example:{' '}
                {formatLead(leg.leadTimeHours)}.
              </span>
              <div className="lead-row">
                <input
                  type="range"
                  min={1}
                  max={72}
                  value={leg.leadTimeHours}
                  disabled={!leg.enabled || masterOff}
                  onChange={(e) => updateLeg({ leadTimeHours: Number(e.target.value) })}
                />
                <div className="lead-input">
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={leg.leadTimeHours}
                    disabled={!leg.enabled || masterOff}
                    onChange={(e) =>
                      updateLeg({
                        leadTimeHours: Math.max(1, Math.min(168, Number(e.target.value) || 1)),
                      })
                    }
                  />
                  <span>hrs</span>
                </div>
              </div>
            </label>

            <div className="field">
              <span className="field-label">Time of day window</span>
              <span className="field-help">
                Auto-accept only when the scheduled time falls in this window.
              </span>
              <div className="time-row">
                <label>
                  Start
                  <input
                    type="time"
                    value={leg.timeOfDay.start}
                    disabled={!leg.enabled || masterOff}
                    onChange={(e) =>
                      updateLeg({ timeOfDay: { ...leg.timeOfDay, start: e.target.value } })
                    }
                  />
                </label>
                <span className="time-sep">to</span>
                <label>
                  End
                  <input
                    type="time"
                    value={leg.timeOfDay.end}
                    disabled={!leg.enabled || masterOff}
                    onChange={(e) =>
                      updateLeg({ timeOfDay: { ...leg.timeOfDay, end: e.target.value } })
                    }
                  />
                </label>
              </div>
            </div>

            <div className="field">
              <span className="field-label">Days allowed</span>
              <span className="field-help">
                Select which days of the week this leg type may auto-accept.
              </span>
              <DayPicker
                value={leg.daysAllowed}
                disabled={!leg.enabled || masterOff}
                onChange={(daysAllowed) => updateLeg({ daysAllowed })}
              />
            </div>

            <div className="field region-field">
              <div className="field-label-row">
                <MapPin size={14} />
                <span className="field-label">Regions</span>
              </div>
              <span className="field-help">
                Match start, finish, and optional intermediate stop regions for this leg type.
              </span>
              <div className="region-grid">
                <label>
                  Start
                  <ChipSelect
                    options={regionOptions}
                    selected={leg.regions.start}
                    onChange={(next) => updateRegions('start', next)}
                    placeholder="Any start region"
                  />
                </label>
                <label>
                  Finish
                  <ChipSelect
                    options={regionOptions}
                    selected={leg.regions.finish}
                    onChange={(next) => updateRegions('finish', next)}
                    placeholder="Any finish region"
                  />
                </label>
                <label>
                  Intermediate stops
                  <ChipSelect
                    options={regionOptions}
                    selected={leg.regions.intermediate}
                    onChange={(next) => updateRegions('intermediate', next)}
                    placeholder="Optional mid regions"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function CustomersEditor({
  draft,
  setDraft,
  customerQuery,
  setCustomerQuery,
}: {
  draft: CustomerSettings
  setDraft: (fn: (prev: CustomerSettings) => CustomerSettings) => void
  customerQuery: string
  setCustomerQuery: (q: string) => void
}) {
  const visibleCustomers = CUSTOMERS.filter((c) => {
    const q = customerQuery.trim().toLowerCase()
    if (!q) return true
    return c.name.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q)
  })

  return (
    <section className="panel editor-panel">
      <div className="panel-body">
        <h3>Customer include / exclude</h3>
        <p className="field-help">Scope this board configuration to specific customers.</p>

        <div className="mode-toggle" role="group" aria-label="Customer filter mode">
          {(['include', 'exclude'] as CustomerMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={draft.customerMode === mode ? 'is-active' : ''}
              onClick={() => setDraft((prev) => ({ ...prev, customerMode: mode }))}
            >
              {mode === 'include' ? 'Include only' : 'Exclude listed'}
            </button>
          ))}
        </div>

        <div className="customer-box flush">
          <div className="customer-search">
            <Search size={14} />
            <input
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="Search customers…"
            />
          </div>
          <ul className="customer-list">
            {visibleCustomers.map((c) => {
              const checked = draft.customers.includes(c.id)
              return (
                <li key={c.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setDraft((prev) => ({
                          ...prev,
                          customers: checked
                            ? prev.customers.filter((id) => id !== c.id)
                            : [...prev.customers, c.id],
                        }))
                      }
                    />
                    <span className="customer-name">{c.name}</span>
                    <span className="customer-tag">{c.tag}</span>
                  </label>
                </li>
              )
            })}
          </ul>
          <p className="customer-summary">
            {draft.customerMode === 'exclude' ? 'Excluding' : 'Including'}{' '}
            <strong>{draft.customers.length}</strong> customer
            {draft.customers.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>
    </section>
  )
}

function RegionsEditor({
  draft,
  setDraft,
  regionOptions,
}: {
  draft: RegionSettings
  setDraft: (fn: (prev: RegionSettings) => RegionSettings) => void
  regionOptions: { id: string; label: string; hint?: string }[]
}) {
  return (
    <section className="panel editor-panel">
      <div className="panel-body">
        <h3>Board region defaults</h3>
        <p className="field-help">
          Configure default and allowed regions used across this planning board.
        </p>
        <div className="region-grid">
          <label>
            Default start regions
            <ChipSelect
              options={regionOptions}
              selected={draft.defaultStart}
              onChange={(defaultStart) => setDraft((prev) => ({ ...prev, defaultStart }))}
              placeholder="Select start regions"
            />
          </label>
          <label>
            Default finish regions
            <ChipSelect
              options={regionOptions}
              selected={draft.defaultFinish}
              onChange={(defaultFinish) => setDraft((prev) => ({ ...prev, defaultFinish }))}
              placeholder="Select finish regions"
            />
          </label>
          <label>
            Allowed regions
            <ChipSelect
              options={regionOptions}
              selected={draft.allowedRegions}
              onChange={(allowedRegions) => setDraft((prev) => ({ ...prev, allowedRegions }))}
              placeholder="Select allowed regions"
            />
          </label>
        </div>
      </div>
    </section>
  )
}

function NotificationsEditor({
  draft,
  setDraft,
}: {
  draft: NotificationSettings
  setDraft: (fn: (prev: NotificationSettings) => NotificationSettings) => void
}) {
  const roles = ['Ops Admin', 'Dispatch Lead', 'Planner', 'Board Owner']

  return (
    <section className="panel editor-panel">
      <div className="panel-body">
        <h3>Notification preferences</h3>
        <p className="field-help">Choose how the team is notified when this board config changes.</p>

        <div className="notify-rows">
          <div className="field-row between">
            <div>
              <h4>Email on save</h4>
              <p className="field-help">Notify watchers when this configuration is saved.</p>
            </div>
            <Toggle
              checked={draft.emailOnSave}
              onChange={(emailOnSave) => setDraft((prev) => ({ ...prev, emailOnSave }))}
            />
          </div>
          <div className="field-row between">
            <div>
              <h4>Email on auto accept</h4>
              <p className="field-help">Send an email when a leg is auto-accepted.</p>
            </div>
            <Toggle
              checked={draft.emailOnAutoAccept}
              onChange={(emailOnAutoAccept) => setDraft((prev) => ({ ...prev, emailOnAutoAccept }))}
            />
          </div>
        </div>

        <label className="field">
          <span className="field-label">Slack channel</span>
          <input
            className="text-input"
            value={draft.slackChannel}
            onChange={(e) => setDraft((prev) => ({ ...prev, slackChannel: e.target.value }))}
            placeholder="#channel"
          />
        </label>

        <div className="field">
          <span className="field-label">Notify roles</span>
          <div className="role-chips">
            {roles.map((role) => {
              const on = draft.notifyRoles.includes(role)
              return (
                <button
                  key={role}
                  type="button"
                  className={on ? 'is-on' : ''}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      notifyRoles: on
                        ? prev.notifyRoles.filter((r) => r !== role)
                        : [...prev.notifyRoles, role],
                    }))
                  }
                >
                  {role}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
