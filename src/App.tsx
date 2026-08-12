import { useState } from 'react'
import type { BoardLeg } from './data/boardSeed'
import PlanningBoard from './views/PlanningBoard'
import ConfigPage from './views/ConfigPage'

type View =
  | { name: 'board' }
  | { name: 'config'; boardId: string; leg: BoardLeg }

export default function App() {
  const [view, setView] = useState<View>({ name: 'board' })

  if (view.name === 'config') {
    const label = `${view.leg.start.name} → ${view.leg.end.name} · ${view.leg.miles.toFixed(1)} mi`
    return (
      <ConfigPage
        boardId={view.boardId}
        legLabel={label}
        onBack={() => setView({ name: 'board' })}
      />
    )
  }

  return (
    <PlanningBoard
      onConfigureRoute={(leg, boardId) =>
        setView({
          name: 'config',
          boardId,
          leg,
        })
      }
    />
  )
}
