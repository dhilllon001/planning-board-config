import { useMemo, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import {
  BOARD_CUSTOMERS,
  BOARD_LEGS,
  BOARD_TABS,
  STATUS_FILTERS,
  TIME_FILTERS,
  TYPE_FILTERS,
  type BoardLeg,
} from '../data/boardSeed'
import { RouteLine } from '../components/RouteLine'
import './board.css'

export default function PlanningBoard({
  onConfigureRoute,
}: {
  onConfigureRoute: (leg: BoardLeg, boardId: string) => void
}) {
  const [boardId, setBoardId] = useState<string>(BOARD_TABS[0].id)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customerQuery, setCustomerQuery] = useState('')
  const [boardQuery, setBoardQuery] = useState('')
  const [globalQuery, setGlobalQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const pageSize = 20

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase()
    if (!q) return BOARD_CUSTOMERS
    return BOARD_CUSTOMERS.filter((c) => c.name.toLowerCase().includes(q))
  }, [customerQuery])

  const visibleTabs = useMemo(() => {
    const q = boardQuery.trim().toLowerCase()
    if (!q) return BOARD_TABS
    return BOARD_TABS.filter(
      (t) => t.name.toLowerCase().includes(q) || t.short.toLowerCase().includes(q),
    )
  }, [boardQuery])

  const legs = useMemo(() => {
    let rows = [...BOARD_LEGS]
    if (customerId) {
      const name = BOARD_CUSTOMERS.find((c) => c.id === customerId)?.name
      if (name) rows = rows.filter((l) => l.customer === name)
    }
    const q = globalQuery.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (l) =>
          l.customer.toLowerCase().includes(q) ||
          l.customerId.includes(q) ||
          l.start.name.toLowerCase().includes(q) ||
          l.end.name.toLowerCase().includes(q) ||
          l.driver?.toLowerCase().includes(q),
      )
    }
    return rows
  }, [customerId, globalQuery])

  const pageCount = Math.max(1, Math.ceil(legs.length / pageSize))
  const pageLegs = legs.slice((page - 1) * pageSize, page * pageSize)

  function toggleAll() {
    if (selected.length === pageLegs.length) setSelected([])
    else setSelected(pageLegs.map((l) => l.id))
  }

  function toggleOne(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="pb">
      <header className="pb-topbar">
        <h1>Planning Board</h1>
        <div className="pb-search">
          <Search size={15} />
          <input
            value={globalQuery}
            onChange={(e) => {
              setGlobalQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search..."
          />
        </div>
        <div className="pb-top-actions">
          <button type="button" className="pb-icon" aria-label="Export">
            <Download size={16} />
          </button>
          <button type="button" className="pb-icon" aria-label="Refresh">
            <RefreshCw size={16} />
          </button>
          <span className="pb-avatar">SD</span>
        </div>
      </header>

      <div className="pb-tabs-row">
        <nav className="pb-tabs" aria-label="Planning boards">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={tab.id === boardId ? 'is-active' : ''}
              onClick={() => {
                setBoardId(tab.id)
                setPage(1)
                setCustomerId(null)
              }}
              title={tab.name}
            >
              {tab.short}
            </button>
          ))}
        </nav>
        <div className="pb-find-board">
          <Search size={13} />
          <input
            value={boardQuery}
            onChange={(e) => setBoardQuery(e.target.value)}
            placeholder="Find board"
          />
        </div>
      </div>

      <div className="pb-filters">
        <FilterGroup title="STATUS" chips={STATUS_FILTERS} />
        <FilterGroup title="TYPE" chips={TYPE_FILTERS} />
        <FilterGroup title="PICKUP" chips={TIME_FILTERS} />
        <FilterGroup title="DELIVERY" chips={TIME_FILTERS} />
        <FilterGroup title="ORDER" chips={TIME_FILTERS} />
      </div>

      <div className="pb-body">
        <aside className="pb-customers">
          <div className="pb-customers-head">
            <Users size={14} />
            <h2>Customers</h2>
          </div>
          <div className="pb-customers-search">
            <Search size={13} />
            <input
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="Search..."
            />
          </div>
          <ul>
            {filteredCustomers.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={customerId === c.id ? 'is-active' : ''}
                  onClick={() => {
                    setCustomerId((prev) => (prev === c.id ? null : c.id))
                    setPage(1)
                  }}
                >
                  <span title={c.name}>{c.name}</span>
                  <em>{c.count}</em>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="pb-table-wrap">
          <div className="pb-table-scroll">
            <table className="pb-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <input
                      type="checkbox"
                      checked={pageLegs.length > 0 && selected.length === pageLegs.length}
                      onChange={toggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="col-ack">ACK</th>
                  <th className="col-customer">Customer</th>
                  <th className="col-time">Time</th>
                  <th className="col-route">Route</th>
                  <th className="col-equip">Equipment</th>
                  <th className="col-driver">Driver</th>
                  <th className="col-action">Configure</th>
                  <th className="col-assigned">Assigned</th>
                  <th className="col-tender">Tender By</th>
                </tr>
              </thead>
              <tbody>
                {pageLegs.map((leg) => (
                  <tr key={leg.id} className={selected.includes(leg.id) ? 'is-selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(leg.id)}
                        onChange={() => toggleOne(leg.id)}
                        aria-label={`Select ${leg.customerId}`}
                      />
                    </td>
                    <td>
                      <div className="ack-cell">
                        <button
                          type="button"
                          className={`ack-btn ok ${leg.ack === 'accepted' ? 'is-on' : ''}`}
                          aria-label="Accept"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          className={`ack-btn no ${leg.ack === 'rejected' ? 'is-on' : ''}`}
                          aria-label="Reject"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <strong>{leg.customer}</strong>
                        <div className="customer-meta">
                          <button type="button" className="leg-id">
                            {leg.customerId}
                          </button>
                          <span className="tag">{leg.tag}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`time-pill tone-${leg.timeTone}`}>{leg.timeLabel}</span>
                    </td>
                    <td className="route-td">
                      <RouteLine leg={leg} onConfigure={(l) => onConfigureRoute(l, boardId)} />
                    </td>
                    <td>{leg.equipment}</td>
                    <td>
                      {leg.driver ? (
                        <span className="driver-name">{leg.driver}</span>
                      ) : (
                        <button type="button" className="assign-link">
                          <UserPlus size={13} />
                          Assign Driver
                        </button>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="configure-btn"
                        onClick={() => onConfigureRoute(leg, boardId)}
                      >
                        Configure
                      </button>
                    </td>
                    <td>
                      <span className="assigned-pill">{leg.assigned}</span>
                    </td>
                    <td>
                      <div className="tender-cell">
                        <strong>{leg.tenderBy}</strong>
                        <span>{leg.tenderAt}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="pb-footer">
            <span>
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, legs.length)} of{' '}
              {legs.length} legs
            </span>
            <div className="pb-pager">
              <label>
                Rows per page
                <select value={pageSize} disabled>
                  <option value={20}>20</option>
                </select>
              </label>
              <button
                type="button"
                className="pb-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`pb-page-btn ${n === page ? 'is-active' : ''}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className="pb-page-btn"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  )
}

function FilterGroup({ title, chips }: { title: string; chips: { id: string; label: string; count: number; tone?: string }[] }) {
  const [active, setActive] = useState<string | null>(null)
  return (
    <div className="pb-filter-group">
      <p>{title}</p>
      <div className="pb-filter-chips">
        {chips.map((chip) => (
          <button
            key={`${title}-${chip.id}`}
            type="button"
            className={`pb-chip tone-${chip.tone ?? 'muted'} ${active === chip.id ? 'is-active' : ''}`}
            onClick={() => setActive((prev) => (prev === chip.id ? null : chip.id))}
          >
            {chip.label}
            <span>{chip.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
