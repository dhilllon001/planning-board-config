import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  ALL_DAYS,
  BOARDS,
  CURRENT_USER,
  CUSTOMERS,
  LEG_META,
  REGIONS,
  createEmptyTemplate,
  createRouteLeg,
  createTemplatesForBoard,
} from '../data/seed'
import type {
  AutoAcceptSettings,
  ConfigHistoryEntry,
  ConfigMeta,
  ConfigTemplate,
  CustomerMode,
  CustomerSettings,
  DayKey,
  LegType,
  NotificationSettings,
  RegionRule,
  RegionSettings,
  RouteLegConfig,
  TemplateSettings,
  UserRef,
} from '../types'

import './config.css'

const LEG_TYPES: LegType[] = ['pickup', 'delivery', 'movement']

function clone<T>(value: T): T {
  return structuredClone(value)
}

function equal(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
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

function UserLine({ user, label, when }: { user: UserRef; label: string; when?: string }) {
  return (
    <div className="user-line">
      <span className="user-avatar" aria-hidden>
        {user.initials}
      </span>
      <div className="user-copy">
        <p className="user-label">{label}</p>
        <p className="user-name">{user.name}</p>
        {when && <p className="user-when">{formatWhen(when)}</p>}
      </div>
    </div>
  )
}

export default function ConfigPage({
  boardId: initialBoardId,
  legLabel,
  onBack,
}: {
  boardId?: string
  legLabel?: string
  onBack: () => void
}) {
  const startBoardId = initialBoardId && BOARDS.some((b) => b.id === initialBoardId)
    ? initialBoardId
    : BOARDS[0].id
  const [boardId, setBoardId] = useState(startBoardId)
  const [store, setStore] = useState<Record<string, ConfigTemplate[]>>(() => ({
    [startBoardId]: createTemplatesForBoard(startBoardId),
  }))
  const [templateId, setTemplateId] = useState(() => createTemplatesForBoard(startBoardId)[0].id)
  const [draft, setDraft] = useState<ConfigTemplate>(() =>
    clone(createTemplatesForBoard(startBoardId)[0]),
  )
  const [saveReason, setSaveReason] = useState('')
  const [boardQuery, setBoardQuery] = useState('')
  const [templateQuery, setTemplateQuery] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const board = BOARDS.find((b) => b.id === boardId) ?? BOARDS[0]
  const templates = store[boardId] ?? createTemplatesForBoard(boardId)
  const savedTemplate = templates.find((t) => t.id === templateId) ?? templates[0]
  const settingsDirty = !equal(draft.settings, savedTemplate.settings)
  const identityDirty = draft.name !== savedTemplate.name
  const dirty = settingsDirty || identityDirty || draft.active !== savedTemplate.active

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(t)
  }, [toast])

  function ensureBoard(id: string): ConfigTemplate[] {
    if (store[id]) return store[id]
    const created = createTemplatesForBoard(id)
    setStore((prev) => ({ ...prev, [id]: created }))
    return created
  }

  function loadTemplate(nextBoardId: string, nextTemplateId: string) {
    const list = ensureBoard(nextBoardId)
    const tmpl = list.find((t) => t.id === nextTemplateId) ?? list[0]
    setTemplateId(tmpl.id)
    setDraft(clone(tmpl))
    setSaveReason('')
    setCustomerQuery('')
    setTemplateQuery('')
  }

  function switchBoard(id: string) {
    if (id === boardId) return
    if (dirty && !window.confirm('Discard unsaved changes for this template?')) return
    const list = ensureBoard(id)
    setBoardId(id)
    loadTemplate(id, list[0].id)
  }

  function switchTemplate(id: string) {
    if (id === templateId) return
    if (dirty && !window.confirm('Discard unsaved changes for this template?')) return
    loadTemplate(boardId, id)
  }

  function reset() {
    setDraft(clone(savedTemplate))
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
      ...draft.meta,
      lastSavedBy: CURRENT_USER,
      lastSavedAt: now,
      reason,
      history: [...draft.meta.history, historyEntry],
    }
    const nextTemplate: ConfigTemplate = {
      ...draft,
      meta: nextMeta,
    }

    setStore((prev) => {
      const list = prev[boardId] ?? createTemplatesForBoard(boardId)
      return {
        ...prev,
        [boardId]: list.map((t) => {
          if (t.id !== nextTemplate.id) {
            return nextTemplate.active ? { ...t, active: false } : t
          }
          return nextTemplate
        }),
      }
    })
    setDraft(nextTemplate)
    setSaveReason('')
    setToast(`Saved “${nextTemplate.name}” for ${board.shortName}`)
  }

  function addTemplate() {
    if (dirty && !window.confirm('Discard unsaved changes for this template?')) return
    const created = createEmptyTemplate(boardId)
    setStore((prev) => ({
      ...prev,
      [boardId]: [...(prev[boardId] ?? createTemplatesForBoard(boardId)), created],
    }))
    setTemplateId(created.id)
    setDraft(clone(created))
    setSaveReason('')
    setToast('New template created — edit settings and save')
  }

  function duplicateTemplate() {
    if (dirty && !window.confirm('Discard unsaved changes for this template?')) return
    const copy: ConfigTemplate = {
      ...clone(savedTemplate),
      id: `${boardId}-tmpl-${Date.now()}`,
      name: `${savedTemplate.name} Copy`,
      active: false,
      meta: {
        ...clone(savedTemplate.meta),
        createdBy: CURRENT_USER,
        createdAt: new Date().toISOString(),
        lastSavedBy: CURRENT_USER,
        lastSavedAt: new Date().toISOString(),
        reason: `Duplicated from ${savedTemplate.name}`,
        history: [
          {
            id: `h-${Date.now()}`,
            savedBy: CURRENT_USER,
            savedAt: new Date().toISOString(),
            reason: `Duplicated from ${savedTemplate.name}`,
          },
        ],
      },
    }
    setStore((prev) => ({
      ...prev,
      [boardId]: [...(prev[boardId] ?? createTemplatesForBoard(boardId)), copy],
    }))
    setTemplateId(copy.id)
    setDraft(clone(copy))
    setSaveReason('')
    setToast(`Duplicated “${savedTemplate.name}”`)
  }

  function updateSettings<K extends keyof TemplateSettings>(
    key: K,
    updater: (prev: TemplateSettings[K]) => TemplateSettings[K],
  ) {
    setDraft((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: updater(prev.settings[key]),
      },
    }))
  }

  function formatCreated(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const filteredBoards = BOARDS.filter((b) => {
    const q = boardQuery.trim().toLowerCase()
    if (!q) return true
    return (
      b.name.toLowerCase().includes(q) ||
      b.shortName.toLowerCase().includes(q) ||
      b.region.toLowerCase().includes(q)
    )
  })

  const filteredTemplates = templates.filter((t) => {
    const q = templateQuery.trim().toLowerCase()
    if (!q) return true
    return t.name.toLowerCase().includes(q)
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
          <button type="button" className="icon-btn back-btn" onClick={onBack} aria-label="Back to board">
            <ArrowLeft size={16} />
          </button>
          <Settings2 size={18} />
          <div>
            <h1>Planning Board Config</h1>
            {legLabel && <p className="topbar-route-label">{legLabel}</p>}
          </div>
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
        <aside className="rail board-rail" aria-label="Planning boards">
          <div className="rail-section">
            <div className="rail-section-head">
              <h2>Boards</h2>
              <span>{BOARDS.length}</span>
            </div>
            <div className="rail-search">
              <Search size={13} />
              <input
                value={boardQuery}
                onChange={(e) => setBoardQuery(e.target.value)}
                placeholder="Search…"
              />
            </div>
            <ul className="rail-list">
              {filteredBoards.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className={b.id === boardId ? 'is-active' : ''}
                    onClick={() => switchBoard(b.id)}
                    title={b.name}
                  >
                    <span className="rail-row-top">
                      <strong>{b.shortName}</strong>
                      <span className="rail-count">{b.legCount}</span>
                    </span>
                    <span className="rail-row-meta">{b.region}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <aside className="rail template-rail" aria-label="Configuration templates">
          <div className="rail-section">
            <div className="rail-section-head">
              <div className="rail-section-titles">
                <p className="rail-kicker">Selected board</p>
                <h2>{board.shortName}</h2>
              </div>
              <div className="rail-section-actions">
                <span className="rail-badge">{templates.length}</span>
                <button type="button" className="rail-icon-btn" onClick={addTemplate} title="New template">
                  <Plus size={15} />
                </button>
                <button
                  type="button"
                  className="rail-icon-btn"
                  onClick={duplicateTemplate}
                  title="Duplicate selected"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="rail-search light">
              <Search size={13} />
              <input
                value={templateQuery}
                onChange={(e) => setTemplateQuery(e.target.value)}
                placeholder="Search…"
              />
            </div>

            <ul className="rail-list">
              {filteredTemplates.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={t.id === templateId ? 'is-active' : ''}
                    onClick={() => switchTemplate(t.id)}
                  >
                    <span className="rail-row-top">
                      <strong>{t.name}</strong>
                      {t.active ? (
                        <span className="status-pill is-active">Active</span>
                      ) : (
                        <span className="status-pill">Inactive</span>
                      )}
                    </span>
                    <span className="rail-row-meta">{formatCreated(t.meta.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

          <main className="main-pane">
          <div className="page-header">
            <div>
              <p className="eyebrow">Lane configuration</p>
              <h2>{draft.name}</h2>
              {legLabel && <p className="page-sub">{legLabel}</p>}
            </div>
            <div className="page-actions">
              {dirty && <span className="dirty-pill">Unsaved</span>}
              <button type="button" className="btn ghost" disabled={!dirty} onClick={reset}>
                Discard
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={!dirty || !saveReason.trim()}
                onClick={save}
              >
                Save
              </button>
            </div>
          </div>

          <div className="center-scroll workflow">
            <section className="flow-card">
              <div className="flow-card-head">
                <span className="flow-step">1</span>
                <div>
                  <h3>Template</h3>
                  <p>Simple name and active state for this lane config.</p>
                </div>
              </div>
              <div className="flow-card-body identity-simple">
                <label className="field">
                  <span className="field-label">Name</span>
                  <input
                    className="text-input"
                    value={draft.name}
                    onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </label>
                <div className="field">
                  <span className="field-label">Status</span>
                  <div className="seg-btns">
                    <button
                      type="button"
                      className={draft.active ? 'is-on positive' : ''}
                      onClick={() => setDraft((prev) => ({ ...prev, active: true }))}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      className={!draft.active ? 'is-on muted' : ''}
                      onClick={() => setDraft((prev) => ({ ...prev, active: false }))}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="flow-card">
              <div className="flow-card-head">
                <span className="flow-step">2</span>
                <div>
                  <h3>Auto Accept</h3>
                  <p>Enable rules, then build the route with pickup / delivery / movement legs.</p>
                </div>
              </div>
              <div className="flow-card-body">
                <AutoAcceptEditor
                  draft={draft.settings['auto-accept']}
                  setDraft={(fn) => updateSettings('auto-accept', fn)}
                  regionOptions={regionOptions}
                />
              </div>
            </section>

            <section className="flow-card">
              <div className="flow-card-head">
                <span className="flow-step">3</span>
                <div>
                  <h3>Customers</h3>
                  <p>Include or exclude customers for this lane config.</p>
                </div>
              </div>
              <div className="flow-card-body">
                <CustomersEditor
                  draft={draft.settings.customers}
                  setDraft={(fn) => updateSettings('customers', fn)}
                  customerQuery={customerQuery}
                  setCustomerQuery={setCustomerQuery}
                />
              </div>
            </section>

            <section className="flow-card">
              <div className="flow-card-head">
                <span className="flow-step">4</span>
                <div>
                  <h3>Regions</h3>
                  <p>Default start, finish, and allowed coverage regions.</p>
                </div>
              </div>
              <div className="flow-card-body">
                <RegionsEditor
                  draft={draft.settings.regions}
                  setDraft={(fn) => updateSettings('regions', fn)}
                  regionOptions={regionOptions}
                />
              </div>
            </section>

            <section className="flow-card">
              <div className="flow-card-head">
                <span className="flow-step">5</span>
                <div>
                  <h3>Notifications</h3>
                  <p>Email and Slack alerts when this config changes or fires.</p>
                </div>
              </div>
              <div className="flow-card-body">
                <NotificationsEditor
                  draft={draft.settings.notifications}
                  setDraft={(fn) => updateSettings('notifications', fn)}
                />
              </div>
            </section>
          </div>
        </main>

        <aside className="meta-sidebar" aria-label="Configuration details">
          <div className="meta-card">
            <label className="reason-field">
              <span>Reason for this save</span>
              <textarea
                value={saveReason}
                onChange={(e) => setSaveReason(e.target.value)}
                placeholder="Why are you changing this template?"
                rows={3}
              />
            </label>

            <div className="meta-people">
              <UserLine user={draft.meta.createdBy} label="Created by" when={draft.meta.createdAt} />
              <UserLine
                user={draft.meta.lastSavedBy}
                label="Last saved by"
                when={draft.meta.lastSavedAt}
              />
              <UserLine user={CURRENT_USER} label="Saving as" />
            </div>

            {draft.meta.reason && (
              <div className="current-reason">
                <p className="user-label">Last reason</p>
                <p className="reason-text">{draft.meta.reason}</p>
              </div>
            )}
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
  regionOptions,
}: {
  draft: AutoAcceptSettings
  setDraft: (fn: (prev: AutoAcceptSettings) => AutoAcceptSettings) => void
  regionOptions: { id: string; label: string; hint?: string }[]
}) {
  const [openId, setOpenId] = useState<string | null>(draft.routeLegs[0]?.id ?? null)
  const [addOpen, setAddOpen] = useState(false)
  const masterOff = !draft.autoAccept

  function updateLeg(id: string, patch: Partial<RouteLegConfig>) {
    setDraft((prev) => ({
      ...prev,
      routeLegs: prev.routeLegs.map((leg) => (leg.id === id ? { ...leg, ...patch } : leg)),
    }))
  }

  function updateRegions(id: string, key: keyof RegionRule, next: string[]) {
    const leg = draft.routeLegs.find((l) => l.id === id)
    if (!leg) return
    updateLeg(id, { regions: { ...leg.regions, [key]: next } })
  }

  function removeLeg(id: string) {
    setDraft((prev) => ({
      ...prev,
      routeLegs: prev.routeLegs.filter((leg) => leg.id !== id),
    }))
    if (openId === id) setOpenId(null)
  }

  function addLeg(type: LegType) {
    const leg = createRouteLeg(type)
    setDraft((prev) => ({
      ...prev,
      routeLegs: [...prev.routeLegs, leg],
    }))
    setOpenId(leg.id)
    setAddOpen(false)
  }

  return (
    <div className="aa-editor">
      <div className="field">
        <span className="field-label">Enable</span>
        <div className="seg-btns">
          <button
            type="button"
            className={draft.autoAccept ? 'is-on positive' : ''}
            onClick={() => setDraft((prev) => ({ ...prev, autoAccept: true }))}
          >
            Enable
          </button>
          <button
            type="button"
            className={!draft.autoAccept ? 'is-on muted' : ''}
            onClick={() => setDraft((prev) => ({ ...prev, autoAccept: false }))}
          >
            Disable
          </button>
        </div>
      </div>

      <div className={`route-builder ${masterOff ? 'is-dimmed' : ''}`}>
        <div className="route-builder-head">
          <div>
            <h4>Route legs</h4>
            <p className="field-help">Build the lane like a route — add pickup, delivery, or movement.</p>
          </div>
          <div className="add-leg-wrap">
            <button
              type="button"
              className="add-leg-btn"
              disabled={masterOff}
              onClick={() => setAddOpen((v) => !v)}
            >
              <Plus size={14} />
              Add leg
            </button>
            {addOpen && !masterOff && (
              <div className="add-leg-menu">
                {LEG_TYPES.map((type) => (
                  <button key={type} type="button" onClick={() => addLeg(type)}>
                    <span className={`mini-badge accent-${LEG_META[type].accent}`}>
                      {LEG_META[type].short}
                    </span>
                    {LEG_META[type].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {draft.routeLegs.length === 0 ? (
          <button
            type="button"
            className="empty-route"
            disabled={masterOff}
            onClick={() => setAddOpen(true)}
          >
            <Plus size={16} />
            Click to add the first route leg
          </button>
        ) : (
          <ul className="route-leg-list">
            {draft.routeLegs.map((leg, index) => {
              const meta = LEG_META[leg.type]
              const open = openId === leg.id
              return (
                <li key={leg.id} className={`route-leg-card accent-${meta.accent}`}>
                  {index > 0 && <div className="route-connector" aria-hidden />}
                  <button
                    type="button"
                    className="route-leg-summary"
                    disabled={masterOff}
                    onClick={() => setOpenId(open ? null : leg.id)}
                  >
                    <span className={`leg-type-pill accent-${meta.accent}`}>{meta.label}</span>
                    <span className="leg-summary-text">
                      {leg.enabled ? `${leg.leadTimeHours}h` : 'Off'} · {leg.timeOfDay.start}–
                      {leg.timeOfDay.end} · {leg.daysAllowed.length}d
                    </span>
                    <span className={`leg-onoff ${leg.enabled ? 'on' : 'off'}`}>
                      {leg.enabled ? 'On' : 'Off'}
                    </span>
                    <ChevronDown size={14} className={open ? 'is-open' : ''} />
                  </button>

                  {open && (
                    <div className="route-leg-body">
                      <div className="field">
                        <span className="field-label">Leg enable</span>
                        <div className="seg-btns compact">
                          <button
                            type="button"
                            className={leg.enabled ? 'is-on positive' : ''}
                            disabled={masterOff}
                            onClick={() => updateLeg(leg.id, { enabled: true })}
                          >
                            Enable
                          </button>
                          <button
                            type="button"
                            className={!leg.enabled ? 'is-on muted' : ''}
                            disabled={masterOff}
                            onClick={() => updateLeg(leg.id, { enabled: false })}
                          >
                            Disable
                          </button>
                        </div>
                      </div>

                      <div className={`leg-fields ${!leg.enabled || masterOff ? 'is-disabled' : ''}`}>
                        <label className="field">
                          <span className="field-label">Lead time (hrs)</span>
                          <div className="lead-input wide">
                            <input
                              type="number"
                              min={1}
                              max={168}
                              value={leg.leadTimeHours}
                              disabled={!leg.enabled || masterOff}
                              onChange={(e) =>
                                updateLeg(leg.id, {
                                  leadTimeHours: Math.max(
                                    1,
                                    Math.min(168, Number(e.target.value) || 1),
                                  ),
                                })
                              }
                            />
                            <span>hrs</span>
                          </div>
                        </label>

                        <div className="field">
                          <span className="field-label">Time of day</span>
                          <div className="time-row">
                            <label>
                              Start
                              <input
                                type="time"
                                value={leg.timeOfDay.start}
                                disabled={!leg.enabled || masterOff}
                                onChange={(e) =>
                                  updateLeg(leg.id, {
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
                                  updateLeg(leg.id, {
                                    timeOfDay: { ...leg.timeOfDay, end: e.target.value },
                                  })
                                }
                              />
                            </label>
                          </div>
                        </div>

                        <div className="field">
                          <span className="field-label">Days</span>
                          <DayPicker
                            value={leg.daysAllowed}
                            disabled={!leg.enabled || masterOff}
                            onChange={(daysAllowed) => updateLeg(leg.id, { daysAllowed })}
                          />
                        </div>

                        <div className="field">
                          <div className="field-label-row">
                            <MapPin size={14} />
                            <span className="field-label">Regions</span>
                          </div>
                          <div className="region-grid">
                            <label>
                              Start
                              <ChipSelect
                                options={regionOptions}
                                selected={leg.regions.start}
                                onChange={(next) => updateRegions(leg.id, 'start', next)}
                                placeholder="Any start"
                              />
                            </label>
                            <label>
                              Finish
                              <ChipSelect
                                options={regionOptions}
                                selected={leg.regions.finish}
                                onChange={(next) => updateRegions(leg.id, 'finish', next)}
                                placeholder="Any finish"
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="remove-leg-btn"
                        disabled={masterOff}
                        onClick={() => removeLeg(leg.id)}
                      >
                        <Trash2 size={13} />
                        Remove leg
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
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
    <div className="nested-editor">
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
      </div>
    </div>
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
    <div className="nested-editor region-grid">
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
    <div className="nested-editor">
      <div className="notify-rows">
        <div className="field-row between">
          <div>
            <h4>Email on save</h4>
            <p className="field-help">Notify watchers when this template is saved.</p>
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
  )
}
