import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Plus,
  Sparkles,
  Truck,
  UserPlus,
  Route as RouteIcon,
  X,
} from 'lucide-react'
import type { BoardLeg } from '../data/boardSeed'
import { CUSTOMERS } from '../data/seed'
import type { DayKey } from '../types'
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

function buildSuggestions(leg: BoardLeg): AiSuggestion[] {
  return [
    {
      id: 's1',
      kind: 'driver',
      title: 'JORGEI is available',
      detail: `Near ${leg.start.city} · can cover ${leg.start.kind} → ${leg.end.kind}`,
      actionLabel: 'Assign driver',
    },
    {
      id: 's2',
      kind: 'driver',
      title: 'MARTINEZ free after 14:00',
      detail: 'Same equipment · 92% on-time on this corridor',
      actionLabel: 'Assign driver',
    },
    {
      id: 's3',
      kind: 'route',
      title: 'Next route available',
      detail: `${leg.end.city} → Midwest Hub · empty mile opportunity`,
      actionLabel: 'Add to plan',
    },
    {
      id: 's4',
      kind: 'route',
      title: 'Backhaul match',
      detail: `Return ${leg.end.kind} load toward ${leg.start.city} within 6h`,
      actionLabel: 'Add to plan',
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

export default function RouteConfigPage({
  leg,
  boardId,
  onBack,
}: {
  leg: BoardLeg
  boardId: string
  onBack: () => void
}) {
  const [customers, setCustomers] = useState<SelectedCustomer[]>([
    { id: leg.customerId, name: leg.customer, tag: leg.tag },
  ])
  const [enabled, setEnabled] = useState(true)
  const [schedule, setSchedule] = useState<ScheduleMap>(() => defaultSchedule())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [applied, setApplied] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => buildSuggestions(leg), [leg])
  const primary = customers[0]

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
    setApplied((prev) => (prev.includes(s.id) ? prev : [...prev, s.id]))
    if (s.kind === 'tip') {
      updateDay('fri', { leadTimeHours: 16 })
    }
    setToast(s.actionLabel === 'Assign driver' ? 'Assigned from suggestion' : `Applied: ${s.title}`)
    setDirty(true)
  }

  function save() {
    setDirty(false)
    setToast('Route configuration saved')
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
            {primary?.name}
            <em>
              {leg.start.kind} → {leg.end.kind}
            </em>
          </p>
        </div>
        <div className="rc-top-actions">
          {dirty && <span className="rc-dirty">Unsaved</span>}
          <button type="button" className="rc-btn ghost" disabled={!dirty} onClick={() => setDirty(false)}>
            Discard
          </button>
          <button type="button" className="rc-btn primary" disabled={!dirty} onClick={save}>
            Save
          </button>
        </div>
      </header>

      <div className="rc-shell">
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
                  {boardId} · {leg.miles.toFixed(1)} mi
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
                <span>{leg.driver ?? 'Unassigned'}</span>
              </div>
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
