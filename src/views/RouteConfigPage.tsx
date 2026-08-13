import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, Eraser, Plus, Search, X } from 'lucide-react'
import type { BoardLeg } from '../data/boardSeed'
import { BOARDS, CUSTOMERS } from '../data/seed'
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

type StopDisplayMode = 'location' | 'city'

interface DaySchedule {
  enabled: boolean
  sameAsAbove: boolean
  leadUnconstrained: boolean
  leadTimeHours: number
  fromUnconstrained: boolean
  start: string
  toUnconstrained: boolean
  end: string
  dailyMaxUnconstrained: boolean
  dailyMax: number
}

type ScheduleMap = Record<DayKey, DaySchedule>

interface SelectedCustomer {
  id: string
  name: string
  tag: string
}

function emptyDay(enabled = false): DaySchedule {
  return {
    enabled,
    sameAsAbove: false,
    leadUnconstrained: false,
    leadTimeHours: 12,
    fromUnconstrained: false,
    start: '06:00',
    toUnconstrained: false,
    end: '18:00',
    dailyMaxUnconstrained: false,
    dailyMax: 6,
  }
}

function defaultSchedule(): ScheduleMap {
  const weekdays = new Set<DayKey>(['mon', 'tue', 'wed', 'thu', 'fri'])
  return Object.fromEntries(
    DAYS.map(({ key }) => [
      key,
      {
        ...emptyDay(weekdays.has(key)),
        leadTimeHours: key === 'fri' ? 16 : 12,
        dailyMax: key === 'fri' ? 4 : 6,
      },
    ]),
  ) as ScheduleMap
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

function copyDayValues(source: DaySchedule): DaySchedule {
  return {
    ...source,
    sameAsAbove: true,
  }
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
  const board = BOARDS.find((b) => b.id === boardId) ?? BOARDS[0]

  const [customers, setCustomers] = useState<SelectedCustomer[]>([
    { id: leg.customerId, name: leg.customer, tag: leg.tag },
  ])
  const [allCustomers, setAllCustomers] = useState(false)
  const [masterEnabled, setMasterEnabled] = useState(true)
  const [schedule, setSchedule] = useState<ScheduleMap>(() => defaultSchedule())
  const [stopMode, setStopMode] = useState<StopDisplayMode>('city')
  const [globalWeeklyMax, setGlobalWeeklyMax] = useState(30)
  const [customerQuery, setCustomerQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const listedCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase()
    const source = allCustomers ? CUSTOMERS : customers
    if (!q) return source
    return source.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.tag.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
    )
  }, [allCustomers, customers, customerQuery])

  const availableToAdd = CUSTOMERS.filter(
    (c) => !customers.some((s) => s.name === c.name || s.id === c.id),
  )

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

  function markDirty() {
    setDirty(true)
  }

  function updateDay(day: DayKey, patch: Partial<DaySchedule>, opts?: { skipCascade?: boolean }) {
    setSchedule((prev) => {
      const next = { ...prev, [day]: { ...prev[day], ...patch, sameAsAbove: false } }
      if (!opts?.skipCascade) {
        // Re-apply cascade for following days marked same-as-above
        const idx = DAYS.findIndex((d) => d.key === day)
        for (let i = idx + 1; i < DAYS.length; i++) {
          const key = DAYS[i].key
          if (!next[key].sameAsAbove) break
          next[key] = copyDayValues(next[DAYS[i - 1].key])
        }
      }
      return next
    })
    markDirty()
  }

  function setSameAsAbove(day: DayKey, checked: boolean) {
    const idx = DAYS.findIndex((d) => d.key === day)
    if (idx <= 0) return
    const prevKey = DAYS[idx - 1].key
    setSchedule((prev) => {
      const next = { ...prev }
      if (checked) {
        next[day] = copyDayValues(prev[prevKey])
      } else {
        next[day] = { ...prev[day], sameAsAbove: false }
      }
      for (let i = idx + 1; i < DAYS.length; i++) {
        const key = DAYS[i].key
        if (!next[key].sameAsAbove) break
        next[key] = copyDayValues(next[DAYS[i - 1].key])
      }
      return next
    })
    markDirty()
  }

  function clearDay(day: DayKey) {
    updateDay(day, {
      ...emptyDay(false),
      leadUnconstrained: true,
      fromUnconstrained: true,
      toUnconstrained: true,
      dailyMaxUnconstrained: true,
    })
    setToast(`Cleared ${DAYS.find((d) => d.key === day)?.label}`)
  }

  function clearAllDays() {
    setSchedule(
      Object.fromEntries(
        DAYS.map(({ key }) => [
          key,
          {
            ...emptyDay(false),
            leadUnconstrained: true,
            fromUnconstrained: true,
            toUnconstrained: true,
            dailyMaxUnconstrained: true,
          },
        ]),
      ) as ScheduleMap,
    )
    markDirty()
    setToast('Cleared all day configurations')
  }

  function toggleAllCustomers(next: boolean) {
    setAllCustomers(next)
    if (next) {
      setPickerOpen(false)
      setToast('Applies to all customers')
    } else if (customers.length === 0) {
      setCustomers([{ id: leg.customerId, name: leg.customer, tag: leg.tag }])
    }
    markDirty()
  }

  function addCustomer(c: { id: string; name: string; tag: string }) {
    setAllCustomers(false)
    setCustomers((prev) => [...prev, c])
    setPickerOpen(false)
    markDirty()
    setToast(`Added ${c.name}`)
  }

  function removeCustomer(id: string) {
    setCustomers((prev) => (prev.length <= 1 ? prev : prev.filter((c) => c.id !== id)))
    markDirty()
  }

  function save() {
    setDirty(false)
    setToast('Route configuration saved')
  }

  function discard() {
    setCustomers([{ id: leg.customerId, name: leg.customer, tag: leg.tag }])
    setAllCustomers(false)
    setMasterEnabled(true)
    setSchedule(defaultSchedule())
    setStopMode('city')
    setGlobalWeeklyMax(30)
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
        <aside className="rc-customers-pane" aria-label="Selected customers">
          <div className="rc-customers-card">
            <div className="rc-customers-card-head">
              <div>
                <h2>Customers</h2>
                <p>
                  {allCustomers
                    ? `${CUSTOMERS.length} customers`
                    : `${customers.length} selected`}
                </p>
              </div>
              <div className="rc-add-wrap" ref={pickerRef}>
                <button
                  type="button"
                  className="rc-add-btn"
                  disabled={allCustomers}
                  onClick={() => setPickerOpen((v) => !v)}
                  aria-expanded={pickerOpen}
                >
                  <Plus size={14} />
                </button>
                {pickerOpen && !allCustomers && (
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

            <label className="rc-all-switch">
              <span>
                <strong>All customers</strong>
                <em>Apply this config to every customer</em>
              </span>
              <input
                type="checkbox"
                checked={allCustomers}
                onChange={(e) => toggleAllCustomers(e.target.checked)}
              />
            </label>

            <div className="rc-customers-search">
              <Search size={14} />
              <input
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="Search customers"
              />
            </div>

            <ul className="rc-customers-list">
              {listedCustomers.map((c) => (
                <li key={c.id}>
                  <div className={`rc-customer-row ${allCustomers ? 'is-all' : 'is-selected'}`}>
                    <div className="rc-customer-text">
                      <strong>{c.name}</strong>
                      <span>
                        {c.tag} · {c.id}
                      </span>
                    </div>
                    {!allCustomers && customers.length > 1 && (
                      <button
                        type="button"
                        className="rc-remove"
                        aria-label={`Remove ${c.name}`}
                        onClick={() => removeCustomer(c.id)}
                      >
                        <X size={12} />
                      </button>
                    )}
                    {allCustomers && <Check size={14} className="rc-customer-check" />}
                  </div>
                </li>
              ))}
              {listedCustomers.length === 0 && (
                <li className="rc-customers-empty">No customers match</li>
              )}
            </ul>
          </div>
        </aside>

        <main className="rc-main">
          <section className="rc-context">
            <div className="rc-context-block rc-route-block">
              <div className="rc-label-row">
                <span>Selected route</span>
                <div className="rc-stop-mode" role="group" aria-label="Stop display">
                  <button
                    type="button"
                    className={stopMode === 'location' ? 'is-on' : ''}
                    onClick={() => {
                      setStopMode('location')
                      markDirty()
                    }}
                  >
                    Location
                  </button>
                  <button
                    type="button"
                    className={stopMode === 'city' ? 'is-on' : ''}
                    onClick={() => {
                      setStopMode('city')
                      markDirty()
                    }}
                  >
                    City / state
                  </button>
                </div>
              </div>

              <div className={`rc-leg-flow mode-${stopMode}`}>
                <article className={`rc-stop-card kind-${leg.start.kind.toLowerCase()}`}>
                  <div className="rc-stop-card-top">
                    <span className="rc-stop-kind">{leg.start.kind}</span>
                    <span className="rc-stop-time">{leg.start.when}</span>
                  </div>
                  <h3 title={stopMode === 'location' ? leg.start.name : leg.start.city}>
                    {stopMode === 'location' ? leg.start.name : leg.start.city}
                  </h3>
                  {stopMode === 'location' ? (
                    <p>{leg.start.city}</p>
                  ) : (
                    <p>{leg.start.name}</p>
                  )}
                  <span className="rc-stop-status">{leg.equipment}</span>
                </article>

                <div className="rc-leg-connector" aria-hidden="true">
                  <span className="rc-leg-line" />
                  <span className="rc-leg-miles">{leg.miles.toFixed(1)} mi</span>
                  <span className="rc-leg-line" />
                </div>

                <article className={`rc-stop-card kind-${leg.end.kind.toLowerCase()}`}>
                  <div className="rc-stop-card-top">
                    <span className="rc-stop-kind">{leg.end.kind}</span>
                    <span className="rc-stop-time">{leg.end.when}</span>
                  </div>
                  <h3 title={stopMode === 'location' ? leg.end.name : leg.end.city}>
                    {stopMode === 'location' ? leg.end.name : leg.end.city}
                  </h3>
                  {stopMode === 'location' ? <p>{leg.end.city}</p> : <p>{leg.end.name}</p>}
                  <span className="rc-stop-status end">{leg.assigned}</span>
                </article>
              </div>

              <div className="rc-driver-bar">
                <div className="rc-driver-info">
                  <span className="rc-driver-label">Driver</span>
                  <strong className={leg.driver ? '' : 'is-empty'}>
                    {leg.driver ?? 'Unassigned'}
                  </strong>
                </div>
                <div className="rc-driver-meta">
                  <span>{leg.equipment}</span>
                  <span>{leg.assigned}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rc-panel">
            <div className="rc-panel-head">
              <div>
                <h2>Auto accept schedule</h2>
                <p>Lead time, window, and daily max for each day.</p>
              </div>
              <div className="rc-panel-actions">
                <label className="rc-weekly-inline">
                  <span>Weekly max</span>
                  <div className="rc-input">
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={globalWeeklyMax}
                      disabled={!masterEnabled}
                      onChange={(e) => {
                        setGlobalWeeklyMax(
                          Math.max(1, Math.min(999, Number(e.target.value) || 1)),
                        )
                        markDirty()
                      }}
                    />
                    <em>loads</em>
                  </div>
                </label>
                <button type="button" className="rc-btn-light" onClick={clearAllDays}>
                  <Eraser size={13} />
                  Clear all
                </button>
                <div className="rc-seg" role="group" aria-label="Master auto accept">
                  <button
                    type="button"
                    className={masterEnabled ? 'is-on' : ''}
                    onClick={() => {
                      setMasterEnabled(true)
                      markDirty()
                    }}
                  >
                    Enable
                  </button>
                  <button
                    type="button"
                    className={!masterEnabled ? 'is-on muted' : ''}
                    onClick={() => {
                      setMasterEnabled(false)
                      markDirty()
                    }}
                  >
                    Disable
                  </button>
                </div>
              </div>
            </div>

            <div className={`rc-schedule ${masterEnabled ? '' : 'is-off'}`}>
              <div className="rc-schedule-head">
                <span>Day</span>
                <span>Status</span>
                <span>Same</span>
                <span>Lead</span>
                <span>From</span>
                <span>To</span>
                <span>Daily max</span>
                <span />
              </div>

              {DAYS.map(({ key, label }, index) => {
                const day = schedule[key]
                const lockedBySame = day.sameAsAbove
                return (
                  <div
                    key={key}
                    className={`rc-schedule-row ${day.enabled ? 'is-on' : ''} ${lockedBySame ? 'is-linked' : ''}`}
                  >
                    <strong className="rc-day-name">{label}</strong>

                    <div className="rc-day-status">
                      <button
                        type="button"
                        className={day.enabled ? 'is-on' : ''}
                        disabled={!masterEnabled}
                        onClick={() => updateDay(key, { enabled: true })}
                      >
                        On
                      </button>
                      <button
                        type="button"
                        className={!day.enabled ? 'is-off' : ''}
                        disabled={!masterEnabled}
                        onClick={() => updateDay(key, { enabled: false })}
                      >
                        Off
                      </button>
                    </div>

                    <label className={`rc-same ${index === 0 ? 'is-disabled' : ''}`}>
                      <input
                        type="checkbox"
                        checked={day.sameAsAbove}
                        disabled={!masterEnabled || index === 0 || !day.enabled}
                        onChange={(e) => setSameAsAbove(key, e.target.checked)}
                      />
                      <span>Above</span>
                    </label>

                    <div className={`rc-cell ${day.leadUnconstrained ? 'is-any' : ''}`}>
                      <label className="rc-any">
                        <input
                          type="checkbox"
                          checked={day.leadUnconstrained}
                          disabled={!masterEnabled || !day.enabled || lockedBySame}
                          onChange={(e) =>
                            updateDay(key, { leadUnconstrained: e.target.checked })
                          }
                        />
                        Any
                      </label>
                      <div className="rc-input">
                        <input
                          type="number"
                          min={1}
                          max={168}
                          value={day.leadTimeHours}
                          disabled={
                            !masterEnabled ||
                            !day.enabled ||
                            day.leadUnconstrained ||
                            lockedBySame
                          }
                          onChange={(e) =>
                            updateDay(key, {
                              leadTimeHours: Math.max(
                                1,
                                Math.min(168, Number(e.target.value) || 1),
                              ),
                            })
                          }
                        />
                        <em>hrs</em>
                      </div>
                    </div>

                    <div className={`rc-cell ${day.fromUnconstrained ? 'is-any' : ''}`}>
                      <label className="rc-any">
                        <input
                          type="checkbox"
                          checked={day.fromUnconstrained}
                          disabled={!masterEnabled || !day.enabled || lockedBySame}
                          onChange={(e) =>
                            updateDay(key, { fromUnconstrained: e.target.checked })
                          }
                        />
                        Any
                      </label>
                      <input
                        type="time"
                        value={day.start}
                        disabled={
                          !masterEnabled ||
                          !day.enabled ||
                          day.fromUnconstrained ||
                          lockedBySame
                        }
                        onChange={(e) => updateDay(key, { start: e.target.value })}
                      />
                    </div>

                    <div className={`rc-cell ${day.toUnconstrained ? 'is-any' : ''}`}>
                      <label className="rc-any">
                        <input
                          type="checkbox"
                          checked={day.toUnconstrained}
                          disabled={!masterEnabled || !day.enabled || lockedBySame}
                          onChange={(e) => updateDay(key, { toUnconstrained: e.target.checked })}
                        />
                        Any
                      </label>
                      <input
                        type="time"
                        value={day.end}
                        disabled={
                          !masterEnabled || !day.enabled || day.toUnconstrained || lockedBySame
                        }
                        onChange={(e) => updateDay(key, { end: e.target.value })}
                      />
                    </div>

                    <div className={`rc-cell ${day.dailyMaxUnconstrained ? 'is-any' : ''}`}>
                      <label className="rc-any">
                        <input
                          type="checkbox"
                          checked={day.dailyMaxUnconstrained}
                          disabled={!masterEnabled || !day.enabled || lockedBySame}
                          onChange={(e) =>
                            updateDay(key, { dailyMaxUnconstrained: e.target.checked })
                          }
                        />
                        Any
                      </label>
                      <div className="rc-loads">
                        <button
                          type="button"
                          disabled={
                            !masterEnabled ||
                            !day.enabled ||
                            lockedBySame ||
                            day.dailyMaxUnconstrained ||
                            day.dailyMax <= 1
                          }
                          onClick={() =>
                            updateDay(key, { dailyMax: Math.max(1, day.dailyMax - 1) })
                          }
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={day.dailyMax}
                          disabled={
                            !masterEnabled ||
                            !day.enabled ||
                            lockedBySame ||
                            day.dailyMaxUnconstrained
                          }
                          onChange={(e) =>
                            updateDay(key, {
                              dailyMax: Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                            })
                          }
                        />
                        <button
                          type="button"
                          disabled={
                            !masterEnabled ||
                            !day.enabled ||
                            lockedBySame ||
                            day.dailyMaxUnconstrained ||
                            day.dailyMax >= 99
                          }
                          onClick={() =>
                            updateDay(key, { dailyMax: Math.min(99, day.dailyMax + 1) })
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="rc-clear-row"
                      disabled={!masterEnabled}
                      onClick={() => clearDay(key)}
                    >
                      Clear
                    </button>
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
