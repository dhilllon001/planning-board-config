import { useEffect, useRef, useState } from 'react'
import { Settings2, XCircle } from 'lucide-react'
import type { BoardLeg } from '../data/boardSeed'

export function RouteLine({
  leg,
  onConfigure,
}: {
  leg: BoardLeg
  onConfigure: (leg: BoardLeg) => void
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) return
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenu(null)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])

  function openConfig() {
    setMenu(null)
    onConfigure(leg)
  }

  return (
    <div className="route-cell">
      <div className="route-stop start">
        <span className={`stop-badge kind-${leg.start.kind.toLowerCase()}`}>{leg.start.kind}</span>
        <strong className="stop-name" title={leg.start.name}>
          {leg.start.name}
        </strong>
        <span className="stop-city">{leg.start.city}</span>
        <span className="stop-when">{leg.start.when}</span>
      </div>

      <button
        type="button"
        className="route-line-btn"
        title="Click or right-click to configure this route"
        onClick={openConfig}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setMenu({ x: e.clientX, y: e.clientY })
        }}
      >
        <span className="route-dot" />
        <span className="route-dash" />
        <span className="route-miles">{leg.miles.toFixed(1)} mi</span>
        <span className="route-dash" />
        <span className="route-dot" />
        {leg.routeStatus && <span className="route-status">{leg.routeStatus}</span>}
      </button>

      <div className="route-stop end">
        <div className="end-top">
          <strong className="stop-name" title={leg.end.name}>
            {leg.end.name}
          </strong>
          <span className={`stop-badge kind-${leg.end.kind.toLowerCase()}`}>{leg.end.kind}</span>
        </div>
        <span className="stop-city end-align">{leg.end.city}</span>
        <span className="stop-when end-align">{leg.end.when}</span>
      </div>

      {menu && (
        <div
          ref={menuRef}
          className="route-context-menu"
          style={{ left: menu.x, top: menu.y }}
          role="menu"
        >
          <button type="button" role="menuitem" onClick={openConfig}>
            <Settings2 size={14} />
            Configure Route
          </button>
          <button type="button" role="menuitem" className="danger" onClick={() => setMenu(null)}>
            <XCircle size={14} />
            Reject Leg
          </button>
        </div>
      )}
    </div>
  )
}
