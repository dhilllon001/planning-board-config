import {
  Check,
  ChevronDown,
  MapPin,
  RefreshCw,
  Search,
  Settings2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  ALL_DAYS,
  BOARDS,
  CUSTOMERS,
  LEG_META,
  REGIONS,
  createDefaultConfig,
} from './data/seed'
import type {
  BoardConfig,
  CustomerMode,
  DayKey,
  LegType,
  RegionRule,
} from './types'

const LEG_TYPES: LegType[] = ['pickup', 'delivery', 'movement']

function cloneConfig(config: BoardConfig): BoardConfig {
  return structuredClone(config)
}

function configsEqual(a: BoardConfig, b: BoardConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function formatLead(hours: number): string {
  if (hours < 24) return `${hours} hrs`
  const days = Math.floor(hours / 24)
  const rem = hours % 24
  return rem ? `${days}d ${rem}h` : `${days} days`
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

export default function App() {
  const [boardId, setBoardId] = useState(BOARDS[0].id)
  const [activeLeg, setActiveLeg] = useState<LegType>('pickup')
  const [saved, setSaved] = useState(() => createDefaultConfig(BOARDS[0].id))
  const [draft, setDraft] = useState(() => cloneConfig(createDefaultConfig(BOARDS[0].id)))
  const [toast, setToast] = useState<string | null>(null)
  const [customerQuery, setCustomerQuery] = useState('')

  const dirty = !configsEqual(draft, saved)
  const board = BOARDS.find((b) => b.id === boardId) ?? BOARDS[0]
  const leg = draft.legs[activeLeg]
  const masterOff = !draft.autoAccept

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(t)
  }, [toast])

  function switchBoard(id: string) {
    if (dirty && !window.confirm('Discard unsaved changes for this board?')) return
    const next = createDefaultConfig(id)
    setBoardId(id)
    setSaved(next)
    setDraft(cloneConfig(next))
    setActiveLeg('pickup')
  }

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
    updateLeg({
      regions: { ...leg.regions, [key]: next },
    })
  }

  function save() {
    setSaved(cloneConfig(draft))
    setToast(`Saved Auto Accept settings for ${board.shortName}`)
  }

  function reset() {
    setDraft(cloneConfig(saved))
    setToast('Changes discarded')
  }

  const regionOptions = REGIONS.map((r) => ({
    id: r.id,
    label: r.name,
    hint: r.group,
  }))

  const visibleCustomers = CUSTOMERS.filter((c) => {
    const q = customerQuery.trim().toLowerCase()
    if (!q) return true
    return c.name.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q)
  })

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
          <span className="avatar">SD</span>
        </div>
      </header>

      <nav className="board-tabs" aria-label="Planning boards">
        {BOARDS.map((b) => (
          <button
            key={b.id}
            type="button"
            className={b.id === boardId ? 'is-active' : ''}
            onClick={() => switchBoard(b.id)}
          >
            {b.shortName}
          </button>
        ))}
      </nav>

      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Team-specific · Board config</p>
            <h2>Auto Accept Configuration</h2>
            <p className="page-sub">
              Rules for <strong>{board.name}</strong>. Legs that match these settings can be
              auto-accepted without manual ACK.
            </p>
          </div>
          <div className="page-actions">
            {dirty && <span className="dirty-pill">Unsaved changes</span>}
            <button type="button" className="btn ghost" disabled={!dirty} onClick={reset}>
              Discard
            </button>
            <button type="button" className="btn primary" disabled={!dirty} onClick={save}>
              Save configuration
            </button>
          </div>
        </div>

        <section className={`master-card ${draft.autoAccept ? 'is-on' : 'is-off'}`}>
          <div className="master-copy">
            <div className="master-badge">{draft.autoAccept ? 'ON' : 'OFF'}</div>
            <div>
              <h3>Auto Accept</h3>
              <p>Master toggle for this board. When off, all per-leg rules are ignored.</p>
            </div>
          </div>
          <Toggle
            id="auto-accept"
            checked={draft.autoAccept}
            onChange={(autoAccept) => setDraft((prev) => ({ ...prev, autoAccept }))}
          />
        </section>

        <div className={`config-grid ${masterOff ? 'is-dimmed' : ''}`}>
          <section className="panel leg-panel">
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
                          updateLeg({
                            timeOfDay: { ...leg.timeOfDay, start: e.target.value },
                          })
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
                          updateLeg({
                            timeOfDay: { ...leg.timeOfDay, end: e.target.value },
                          })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="field">
                  <span className="field-label">Days allowed</span>
                  <span className="field-help">Select which days of the week this leg type may auto-accept.</span>
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

          <aside className="side-stack">
            <section className="panel">
              <div className="panel-head">
                <Users size={15} />
                <h3>Customer include / exclude</h3>
              </div>
              <p className="field-help">
                Scope auto-accept to specific customers on this board.
              </p>

              <div className="mode-toggle" role="group" aria-label="Customer filter mode">
                {(['include', 'exclude'] as CustomerMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={draft.customerMode === mode ? 'is-active' : ''}
                    disabled={masterOff}
                    onClick={() => setDraft((prev) => ({ ...prev, customerMode: mode }))}
                  >
                    {mode === 'include' ? 'Include only' : 'Exclude listed'}
                  </button>
                ))}
              </div>

              <div className={`customer-box ${masterOff ? 'is-disabled' : ''}`}>
                <div className="customer-search">
                  <Search size={14} />
                  <input
                    value={customerQuery}
                    disabled={masterOff}
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
                            disabled={masterOff}
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
                  {draft.customers.length === 0 && draft.customerMode === 'include'
                    ? ' — none selected means no auto-accept'
                    : ''}
                  {draft.customers.length === 0 && draft.customerMode === 'exclude'
                    ? ' — all customers eligible'
                    : ''}
                </p>
              </div>
            </section>

            <section className="panel summary-panel">
              <div className="panel-head">
                <ChevronDown size={15} />
                <h3>Rule summary</h3>
              </div>
              <ul className="summary-list">
                <li>
                  <span>Board</span>
                  <strong>{board.shortName}</strong>
                </li>
                <li>
                  <span>Master</span>
                  <strong className={draft.autoAccept ? 'pos' : 'neg'}>
                    {draft.autoAccept ? 'Auto Accept ON' : 'Auto Accept OFF'}
                  </strong>
                </li>
                {LEG_TYPES.map((type) => {
                  const cfg = draft.legs[type]
                  return (
                    <li key={type}>
                      <span>{LEG_META[type].label}</span>
                      <strong className={cfg.enabled && draft.autoAccept ? 'pos' : 'muted'}>
                        {cfg.enabled
                          ? `${formatLead(cfg.leadTimeHours)} · ${cfg.timeOfDay.start}–${cfg.timeOfDay.end} · ${cfg.daysAllowed.length}d`
                          : 'Disabled'}
                      </strong>
                    </li>
                  )
                })}
                <li>
                  <span>Customers</span>
                  <strong>
                    {draft.customerMode === 'exclude' ? 'Exclude' : 'Include'}:{' '}
                    {draft.customers.length || 'none'}
                  </strong>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </main>

      {toast && (
        <div className="toast" role="status">
          <Check size={14} />
          {toast}
        </div>
      )}
    </div>
  )
}
