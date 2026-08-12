import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, Copy, Plus, Search, X } from 'lucide-react'
import type { BoardLeg } from '../data/boardSeed'
import {
  BOARDS,
  CUSTOMERS,
  createEmptyTemplate,
  createTemplatesForBoard,
} from '../data/seed'
import type { ConfigTemplate, DayKey } from '../types'
import './route-config.css'

const DAYS: { key: DayKey; label: string; full: string }[] = [
  { key: 'mon', label: 'Mon', full: 'Monday' },
  { key: 'tue', label: 'Tue', full: 'Tuesday' },
  { key: 'wed', label: 'Wed', full: 'Wednesday' },
  { key: 'thu', label: 'Thu', full: 'Thursday' },
  { key: 'fri', label: 'Fri', full: 'Friday' },
  { key: 'sat', label: 'Sat', full: 'Saturday' },
  { key: 'sun', label: 'Sun', full: 'Sunday' },
]

type StopDisplayMode = 'location' | 'city'

interface DaySchedule {
  enabled: boolean
  leadTimeHours: number
  start: string
  end: string
  maxLoads: number
}

type ScheduleMap = Record<DayKey, DaySchedule>

interface SelectedCustomer {
  id: string
  name: string
  tag: string
}

function defaultSchedule(): ScheduleMap {
  const weekdays = new Set<DayKey>(['mon', 'tue', 'wed', 'thu', 'fri'])
  return Object.fromEntries(
    DAYS.map(({ key }) => [
      key,
      {
        enabled: weekdays.has(key),
        leadTimeHours: key === 'fri' ? 16 : 12,
        start: '06:00',
        end: '18:00',
        maxLoads: key === 'fri' ? 4 : 6,
      },
    ]),
  ) as ScheduleMap
}

function scheduleFromTemplate(template: ConfigTemplate): ScheduleMap {
  const base = defaultSchedule()
  const legs = template.settings['auto-accept'].routeLegs
  const primary = legs.find((l) => l.enabled) ?? legs[0]
  if (!primary) return base

  const allowed = new Set(primary.daysAllowed)
  return Object.fromEntries(
    DAYS.map(({ key }) => [
      key,
      {
        enabled: allowed.has(key),
        leadTimeHours: primary.leadTimeHours,
        start: primary.timeOfDay.start,
        end: primary.timeOfDay.end,
        maxLoads: base[key].maxLoads,
      },
    ]),
  ) as ScheduleMap
}

function formatCreated(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function customerInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function RouteConfigPage({
  leg,
  boardId: initialBoardId,
  onBack,
}: {
  leg: BoardLeg
  boardId: string
  onBack: () => void
}) {
  const [selectedBoardId, setSelectedBoardId] = useState(initialBoardId)
  const [templateStore, setTemplateStore] = useState<Record<string, ConfigTemplate[]>>(() => ({
    [initialBoardId]: createTemplatesForBoard(initialBoardId),
  }))
  const [templateId, setTemplateId] = useState(
    () => createTemplatesForBoard(initialBoardId)[0]?.id ?? '',
  )
  const [boardQuery, setBoardQuery] = useState('')
  const [templateQuery, setTemplateQuery] = useState('')

  const [customers, setCustomers] = useState<SelectedCustomer[]>([
    { id: leg.customerId, name: leg.customer, tag: leg.tag },
  ])
  const [enabled, setEnabled] = useState(true)
  const [schedule, setSchedule] = useState<ScheduleMap>(() => defaultSchedule())
  const [stopMode, setStopMode] = useState<StopDisplayMode>('location')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const board = BOARDS.find((b) => b.id === selectedBoardId) ?? BOARDS[0]
  const templates = templateStore[selectedBoardId] ?? createTemplatesForBoard(selectedBoardId)
  const activeTemplate = templates.find((t) => t.id === templateId) ?? templates[0]

  const filteredBoards = useMemo(() => {
    const q = boardQuery.trim().toLowerCase()
    if (!q) return BOARDS
    return BOARDS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.shortName.toLowerCase().includes(q) ||
        b.region.toLowerCase().includes(q),
    )
  }, [boardQuery])

  const filteredTemplates = useMemo(() => {
    const q = templateQuery.trim().toLowerCase()
    if (!q) return templates
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    )
  }, [templateQuery, templates])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!pickerOpen) return
    function onDoc(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [pickerOpen])

  const availableToAdd = CUSTOMERS.filter(
    (c) => !customers.some((s) => s.name === c.name || s.id === c.id),
  )

  function ensureTemplates(boardKey: string) {
    setTemplateStore((prev) => {
      if (prev[boardKey]) return prev
      return { ...prev, [boardKey]: createTemplatesForBoard(boardKey) }
    })
  }

  function switchBoard(nextId: string) {
    if (nextId === selectedBoardId) return
    ensureTemplates(nextId)
    const nextTemplates = templateStore[nextId] ?? createTemplatesForBoard(nextId)
    const nextTemplate = nextTemplates[0]
    setSelectedBoardId(nextId)
    setTemplateId(nextTemplate?.id ?? '')
    setTemplateQuery('')
    if (nextTemplate) {
      setEnabled(nextTemplate.settings['auto-accept'].autoAccept)
      setSchedule(scheduleFromTemplate(nextTemplate))
    }
    setDirty(false)
    setToast(`Switched to ${BOARDS.find((b) => b.id === nextId)?.shortName ?? nextId}`)
  }

  function switchTemplate(nextId: string) {
    if (nextId === templateId) return
    const next = templates.find((t) => t.id === nextId)
    if (!next) return
    setTemplateId(nextId)
    setEnabled(next.settings['auto-accept'].autoAccept)
    setSchedule(scheduleFromTemplate(next))
    setDirty(false)
    setToast(`Loaded ${next.name}`)
  }

  function addTemplate() {
    const created = createEmptyTemplate(selectedBoardId)
    setTemplateStore((prev) => ({
      ...prev,
      [selectedBoardId]: [...(prev[selectedBoardId] ?? templates), created],
    }))
    setTemplateId(created.id)
    setEnabled(created.settings['auto-accept'].autoAccept)
    setSchedule(scheduleFromTemplate(created))
    setDirty(true)
    setToast('New template created')
  }

  function duplicateTemplate() {
    if (!activeTemplate) return
    const copy: ConfigTemplate = {
      ...structuredClone(activeTemplate),
      id: `${selectedBoardId}-tmpl-${Date.now()}`,
      name: `${activeTemplate.name} Copy`,
      active: false,
    }
    setTemplateStore((prev) => ({
      ...prev,
      [selectedBoardId]: [...(prev[selectedBoardId] ?? templates), copy],
    }))
    setTemplateId(copy.id)
    setDirty(true)
    setToast('Template duplicated')
  }

  function updateDay(day: DayKey, patch: Partial<DaySchedule>) {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }))
    setDirty(true)
  }

  function addCustomer(c: { id: string; name: string; tag: string }) {
    setCustomers((prev) => [...prev, c])
    setPickerOpen(false)
    setDirty(true)
    setToast(`Added ${c.name}`)
  }

  function removeCustomer(id: string) {
    setCustomers((prev) => (prev.length <= 1 ? prev : prev.filter((c) => c.id !== id)))
    setDirty(true)
  }

  function setPrimaryCustomer(id: string) {
    setCustomers((prev) => {
      const next = prev.find((c) => c.id === id)
      if (!next || prev[0]?.id === id) return prev
      return [next, ...prev.filter((c) => c.id !== id)]
    })
    setDirty(true)
  }

  function save() {
    setDirty(false)
    setToast('Route configuration saved')
  }

  function discard() {
    if (!activeTemplate) {
      setDirty(false)
      return
    }
    setEnabled(activeTemplate.settings['auto-accept'].autoAccept)
    setSchedule(scheduleFromTemplate(activeTemplate))
    setStopMode('location')
    setCustomers([{ id: leg.customerId, name: leg.customer, tag: leg.tag }])
    setDirty(false)
    setToast('Changes discarded')
  }

  const startLabel = stopMode === 'city' ? leg.start.city : leg.start.name
  const endLabel = stopMode === 'city' ? leg.end.city : leg.end.name

  return (
    <div className="rc">
      <header className="rc-topbar">
        <div className="rc-top-left">
          <button type="button" className="rc-icon-btn" onClick={onBack} aria-label="Back">
            <ArrowLeft size={16} />
          </button>
          <h1>Route configuration</h1>
          <span className="rc-top-sep" />
          <p className="rc-top-context">
            {board.shortName}
            <em>
              {leg.start.kind} → {leg.end.kind}
            </em>
          </p>
        </div>
        <div className="rc-top-actions">
          {dirty && <span className="rc-dirty">Unsaved</span>}
          <button type="button" className="rc-btn ghost" disabled={!dirty} onClick={discard}>
            Discard
          </button>
          <button type="button" className="rc-btn primary" disabled={!dirty} onClick={save}>
            Save
          </button>
        </div>
      </header>

      <div className="rc-shell">
        <aside className="rc-board-rail" aria-label="Planning boards">
          <div className="rc-rail-panel dark">
            <div className="rc-rail-head">
              <h2>Boards</h2>
              <span>{BOARDS.length}</span>
            </div>
            <div className="rc-rail-search dark">
              <Search size={13} />
              <input
                value={boardQuery}
                onChange={(e) => setBoardQuery(e.target.value)}
                placeholder="Search…"
              />
            </div>
            <ul className="rc-rail-list">
              {filteredBoards.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className={b.id === selectedBoardId ? 'is-active' : ''}
                    onClick={() => switchBoard(b.id)}
                    title={b.name}
                  >
                    <span className="rc-rail-top">
                      <strong>{b.shortName}</strong>
                      <em>{b.legCount}</em>
                    </span>
                    <span className="rc-rail-meta">{b.region}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <aside className="rc-template-rail" aria-label="Configuration templates">
          <div className="rc-rail-panel">
            <div className="rc-rail-head">
              <div>
                <p className="rc-rail-kicker">Selected board</p>
                <h2>{board.shortName}</h2>
              </div>
              <div className="rc-rail-actions">
                <span className="rc-rail-badge">{templates.length}</span>
                <button type="button" className="rc-rail-icon" onClick={addTemplate} title="New template">
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  className="rc-rail-icon"
                  onClick={duplicateTemplate}
                  title="Duplicate selected"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
            <div className="rc-rail-search">
              <Search size={13} />
              <input
                value={templateQuery}
                onChange={(e) => setTemplateQuery(e.target.value)}
                placeholder="Search…"
              />
            </div>
            <ul className="rc-rail-list">
              {filteredTemplates.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={t.id === activeTemplate?.id ? 'is-active' : ''}
                    onClick={() => switchTemplate(t.id)}
                  >
                    <span className="rc-rail-top">
                      <strong>{t.name}</strong>
                      <span className={`rc-status ${t.active ? 'is-active' : ''}`}>
                        {t.active ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                    <span className="rc-rail-meta">{formatCreated(t.meta.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="rc-main">
          <section className="rc-context">
            <div className="rc-context-block">
              <div className="rc-label-row">
                <span>Selected customers</span>
                <div className="rc-add-wrap" ref={pickerRef}>
                  <button
                    type="button"
                    className="rc-add-btn"
                    onClick={() => setPickerOpen((v) => !v)}
                    title="Add customer"
                    aria-expanded={pickerOpen}
                  >
                    <Plus size={14} />
                    Add customer
                  </button>
                  {pickerOpen && (
                    <div className="rc-picker">
                      {availableToAdd.length === 0 ? (
                        <p className="rc-picker-empty">All customers added</p>
                      ) : (
                        availableToAdd.map((c) => (
                          <button key={c.id} type="button" onClick={() => addCustomer(c)}>
                            <span className="rc-picker-avatar">{customerInitials(c.name)}</span>
                            <span className="rc-picker-copy">
                              <strong>{c.name}</strong>
                              <em>{c.tag}</em>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="rc-customer-list">
                {customers.map((c, i) => (
                  <div key={c.id} className={`rc-customer-card ${i === 0 ? 'is-primary' : ''}`}>
                    <span className="rc-customer-avatar">{customerInitials(c.name)}</span>
                    <div className="rc-customer-text">
                      <strong>{c.name}</strong>
                      <span>
                        {c.id} · {c.tag}
                      </span>
                    </div>
                    <div className="rc-customer-actions">
                      {i === 0 ? (
                        <em className="rc-primary-tag">Primary</em>
                      ) : (
                        <button
                          type="button"
                          className="rc-make-primary"
                          onClick={() => setPrimaryCustomer(c.id)}
                        >
                          Make primary
                        </button>
                      )}
                      {customers.length > 1 && (
                        <button
                          type="button"
                          className="rc-remove"
                          aria-label={`Remove ${c.name}`}
                          onClick={() => removeCustomer(c.id)}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rc-context-block rc-route-block">
              <div className="rc-label-row">
                <span>Selected route</span>
                <div className="rc-stop-mode" role="group" aria-label="Stop display">
                  <button
                    type="button"
                    className={stopMode === 'location' ? 'is-on' : ''}
                    onClick={() => {
                      setStopMode('location')
                      setDirty(true)
                    }}
                  >
                    Location
                  </button>
                  <button
                    type="button"
                    className={stopMode === 'city' ? 'is-on' : ''}
                    onClick={() => {
                      setStopMode('city')
                      setDirty(true)
                    }}
                  >
                    City / state
                  </button>
                </div>
              </div>

              <div className={`rc-route-card mode-${stopMode}`}>
                <div className="rc-route-stop start">
                  <span className={`rc-badge kind-${leg.start.kind.toLowerCase()}`}>
                    {leg.start.kind}
                  </span>
                  <strong title={startLabel}>{startLabel}</strong>
                  {stopMode === 'location' && (
                    <span className="rc-stop-sub">{leg.start.city}</span>
                  )}
                  <span className="rc-when">{leg.start.when}</span>
                </div>

                <div className="rc-route-path" aria-hidden="true">
                  <span className="rc-lamp start" />
                  <span className="rc-road">
                    <span className="rc-road-glow" />
                    <span className="rc-road-light" />
                    <span className="rc-road-light" />
                    <span className="rc-road-light" />
                  </span>
                  <span className="rc-miles">{leg.miles.toFixed(1)} mi</span>
                  <span className="rc-road">
                    <span className="rc-road-glow" />
                    <span className="rc-road-light" />
                    <span className="rc-road-light" />
                    <span className="rc-road-light" />
                  </span>
                  <span className="rc-lamp end" />
                </div>

                <div className="rc-route-stop end">
                  <span className={`rc-badge kind-${leg.end.kind.toLowerCase()}`}>
                    {leg.end.kind}
                  </span>
                  <strong title={endLabel}>{endLabel}</strong>
                  {stopMode === 'location' && (
                    <span className="rc-stop-sub">{leg.end.city}</span>
                  )}
                  <span className="rc-when">{leg.end.when}</span>
                </div>
              </div>

              <div className="rc-meta">
                <span>{leg.equipment}</span>
                <span>{leg.assigned}</span>
                <span>{leg.driver ?? 'Unassigned'}</span>
                <span>{activeTemplate?.name ?? 'Template'}</span>
              </div>
            </div>
          </section>

          <section className="rc-panel">
            <div className="rc-panel-head">
              <div>
                <h2>Auto accept schedule</h2>
                <p>Lead time, time window, and max loads per day.</p>
              </div>
              <div className="rc-seg" role="group" aria-label="Auto accept">
                <button
                  type="button"
                  className={enabled ? 'is-on' : ''}
                  onClick={() => {
                    setEnabled(true)
                    setDirty(true)
                  }}
                >
                  Enable
                </button>
                <button
                  type="button"
                  className={!enabled ? 'is-on muted' : ''}
                  onClick={() => {
                    setEnabled(false)
                    setDirty(true)
                  }}
                >
                  Disable
                </button>
              </div>
            </div>

            <div className={`rc-day-table ${enabled ? '' : 'is-off'}`}>
              <div className="rc-day-head">
                <span>Day</span>
                <span>Lead time</span>
                <span>From</span>
                <span>To</span>
                <span>Max loads</span>
              </div>
              {DAYS.map(({ key, label, full }) => {
                const day = schedule[key]
                return (
                  <div key={key} className={`rc-day-row ${day.enabled ? 'is-enabled' : ''}`}>
                    <button
                      type="button"
                      className={`rc-day-toggle ${day.enabled ? 'is-on' : ''}`}
                      disabled={!enabled}
                      onClick={() => updateDay(key, { enabled: !day.enabled })}
                    >
                      <strong>{label}</strong>
                      <span>{full}</span>
                    </button>
                    <div className="rc-input">
                      <input
                        type="number"
                        min={1}
                        max={168}
                        aria-label={`${full} lead time`}
                        value={day.leadTimeHours}
                        disabled={!enabled || !day.enabled}
                        onChange={(e) =>
                          updateDay(key, {
                            leadTimeHours: Math.max(1, Math.min(168, Number(e.target.value) || 1)),
                          })
                        }
                      />
                      <em>hrs</em>
                    </div>
                    <input
                      type="time"
                      aria-label={`${full} start time`}
                      value={day.start}
                      disabled={!enabled || !day.enabled}
                      onChange={(e) => updateDay(key, { start: e.target.value })}
                    />
                    <input
                      type="time"
                      aria-label={`${full} end time`}
                      value={day.end}
                      disabled={!enabled || !day.enabled}
                      onChange={(e) => updateDay(key, { end: e.target.value })}
                    />
                    <div className="rc-input">
                      <input
                        type="number"
                        min={1}
                        max={99}
                        aria-label={`${full} max loads`}
                        value={day.maxLoads}
                        disabled={!enabled || !day.enabled}
                        onChange={(e) =>
                          updateDay(key, {
                            maxLoads: Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                          })
                        }
                      />
                      <em>loads</em>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </main>
      </div>

      {toast && (
        <div className="rc-toast" role="status">
          <Check size={14} />
          {toast}
        </div>
      )}
    </div>
  )
}
