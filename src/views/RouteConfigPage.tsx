import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Copy,
  Plus,
  Search,
  Sparkles,
  Truck,
  UserPlus,
  Route as RouteIcon,
  X,
} from 'lucide-react'
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

interface DaySchedule {
  enabled: boolean
  leadTimeHours: number
  start: string
  end: string
}

type ScheduleMap = Record<DayKey, DaySchedule>

interface SelectedCustomer {
  id: string
  name: string
  tag: string
}

interface AiSuggestion {
  id: string
  kind: 'driver' | 'route' | 'tip'
  title: string
  detail: string
  actionLabel: string
  driverName?: string
  nextRouteLabel?: string
}

interface PlannedRoute {
  id: string
  label: string
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
      },
    ]),
  ) as ScheduleMap
}

function buildSuggestions(leg: BoardLeg): AiSuggestion[] {
  return [
    {
      id: 's1',
      kind: 'driver',
      title: 'JORGEI is available',
      detail: `Near ${leg.start.city} · can cover ${leg.start.kind} → ${leg.end.kind}`,
      actionLabel: 'Assign driver',
      driverName: 'JORGEI',
    },
    {
      id: 's2',
      kind: 'driver',
      title: 'MARTINEZ free after 14:00',
      detail: 'Same equipment · 92% on-time on this corridor',
      actionLabel: 'Assign driver',
      driverName: 'MARTINEZ',
    },
    {
      id: 's3',
      kind: 'route',
      title: 'Next route available',
      detail: `${leg.end.city} → Midwest Hub · empty mile opportunity`,
      actionLabel: 'Add to plan',
      nextRouteLabel: `${leg.end.city} → Midwest Hub`,
    },
    {
      id: 's4',
      kind: 'route',
      title: 'Backhaul match',
      detail: `Return ${leg.end.kind} load toward ${leg.start.city} within 6h`,
      actionLabel: 'Add to plan',
      nextRouteLabel: `${leg.end.kind} → ${leg.start.city}`,
    },
    {
      id: 's5',
      kind: 'tip',
      title: 'Tighten Friday lead time',
      detail: 'Similar lanes run better with 16h lead on Fridays',
      actionLabel: 'Apply tip',
    },
  ]
}

function formatCreated(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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
  const [assignedDriver, setAssignedDriver] = useState(leg.driver ?? 'Unassigned')
  const [plannedRoutes, setPlannedRoutes] = useState<PlannedRoute[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [applied, setApplied] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const board = BOARDS.find((b) => b.id === selectedBoardId) ?? BOARDS[0]
  const templates = templateStore[selectedBoardId] ?? createTemplatesForBoard(selectedBoardId)
  const activeTemplate = templates.find((t) => t.id === templateId) ?? templates[0]

  const suggestions = useMemo(() => buildSuggestions(leg), [leg])

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
    setApplied([])
    setPlannedRoutes([])
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
    setApplied([])
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

  function applySuggestion(s: AiSuggestion) {
    if (applied.includes(s.id)) return
    setApplied((prev) => [...prev, s.id])

    if (s.kind === 'driver' && s.driverName) {
      setAssignedDriver(s.driverName)
      setToast(`Assigned ${s.driverName}`)
    } else if (s.kind === 'route' && s.nextRouteLabel) {
      setPlannedRoutes((prev) =>
        prev.some((r) => r.id === s.id)
          ? prev
          : [...prev, { id: s.id, label: s.nextRouteLabel! }],
      )
      setToast(`Added ${s.nextRouteLabel} to plan`)
    } else if (s.kind === 'tip') {
      setSchedule((prev) => ({
        ...prev,
        fri: { ...prev.fri, enabled: true, leadTimeHours: 16 },
      }))
      setToast('Friday lead time set to 16 hrs')
    } else {
      setToast(`Applied: ${s.title}`)
    }
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
    setAssignedDriver(leg.driver ?? 'Unassigned')
    setPlannedRoutes([])
    setApplied([])
    setCustomers([{ id: leg.customerId, name: leg.customer, tag: leg.tag }])
    setDirty(false)
    setToast('Changes discarded')
  }

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
                <span>Selected customer</span>
                <div className="rc-add-wrap" ref={pickerRef}>
                  <button
                    type="button"
                    className="rc-add-btn"
                    onClick={() => setPickerOpen((v) => !v)}
                    title="Add customer"
                    aria-expanded={pickerOpen}
                  >
                    <Plus size={14} />
                    Add
                  </button>
                  {pickerOpen && (
                    <div className="rc-picker">
                      {availableToAdd.length === 0 ? (
                        <p className="rc-picker-empty">All customers added</p>
                      ) : (
                        availableToAdd.map((c) => (
                          <button key={c.id} type="button" onClick={() => addCustomer(c)}>
                            <strong>{c.name}</strong>
                            <em>{c.tag}</em>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="rc-customer-row">
                {customers.map((c, i) => (
                  <div key={c.id} className={`rc-customer ${i === 0 ? 'is-primary' : ''}`}>
                    <div className="rc-customer-text">
                      <strong>{c.name}</strong>
                      <span>
                        {c.id} · {c.tag}
                      </span>
                    </div>
                    {i === 0 && <em className="rc-primary-tag">Primary</em>}
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
                ))}
              </div>
            </div>

            <div className="rc-context-block rc-route-block">
              <div className="rc-label-row">
                <span>Selected route</span>
                <em>
                  {activeTemplate?.name ?? 'Template'} · {leg.miles.toFixed(1)} mi
                </em>
              </div>
              <div className="rc-route-visual">
                <div className="rc-stop">
                  <span className={`rc-badge kind-${leg.start.kind.toLowerCase()}`}>
                    {leg.start.kind}
                  </span>
                  <strong title={leg.start.name}>{leg.start.name}</strong>
                  <span>{leg.start.city}</span>
                  <span className="rc-when">{leg.start.when}</span>
                </div>
                <div className="rc-line">
                  <span className="rc-dot" />
                  <span className="rc-dash" />
                  <span className="rc-miles">{leg.miles.toFixed(1)} mi</span>
                  <span className="rc-dash" />
                  <span className="rc-dot" />
                </div>
                <div className="rc-stop end">
                  <div className="rc-end-top">
                    <strong title={leg.end.name}>{leg.end.name}</strong>
                    <span className={`rc-badge kind-${leg.end.kind.toLowerCase()}`}>
                      {leg.end.kind}
                    </span>
                  </div>
                  <span className="end-align">{leg.end.city}</span>
                  <span className="rc-when end-align">{leg.end.when}</span>
                </div>
              </div>
              <div className="rc-meta">
                <span>{leg.equipment}</span>
                <span>{leg.assigned}</span>
                <span className={assignedDriver !== 'Unassigned' ? 'is-assigned' : ''}>
                  {assignedDriver}
                </span>
              </div>
              {plannedRoutes.length > 0 && (
                <div className="rc-planned">
                  <span className="rc-planned-label">Added to plan</span>
                  {plannedRoutes.map((r) => (
                    <span key={r.id} className="rc-planned-chip">
                      <RouteIcon size={12} />
                      {r.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rc-panel">
            <div className="rc-panel-head">
              <div>
                <h2>Auto accept schedule</h2>
                <p>Set lead time and time of day for each weekday.</p>
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
                  </div>
                )
              })}
            </div>
          </section>
        </main>

        <aside className="rc-ai" aria-label="AI suggestions">
          <div className="rc-ai-head">
            <Sparkles size={14} />
            <h2>AI suggestions</h2>
          </div>
          <p className="rc-ai-sub">
            Actionable options for {leg.start.kind} → {leg.end.kind}
          </p>

          <div className="rc-ai-route">
            <RouteIcon size={13} />
            <span>
              {leg.start.kind} → {leg.end.kind}
            </span>
            <em>{leg.miles.toFixed(1)} mi</em>
          </div>

          <ul className="rc-ai-list">
            {suggestions.map((s) => {
              const done = applied.includes(s.id)
              return (
                <li key={s.id} className={`rc-ai-card kind-${s.kind} ${done ? 'is-done' : ''}`}>
                  <div className="rc-ai-icon">
                    {s.kind === 'driver' ? (
                      <UserPlus size={13} />
                    ) : s.kind === 'route' ? (
                      <Truck size={13} />
                    ) : (
                      <Sparkles size={13} />
                    )}
                  </div>
                  <div className="rc-ai-copy">
                    <strong>{s.title}</strong>
                    <span>{s.detail}</span>
                  </div>
                  <button
                    type="button"
                    className="rc-ai-action"
                    disabled={done}
                    onClick={() => applySuggestion(s)}
                  >
                    {done ? (
                      <>
                        <Check size={12} /> Done
                      </>
                    ) : (
                      s.actionLabel
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>
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
