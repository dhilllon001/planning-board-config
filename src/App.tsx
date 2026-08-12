import { useState } from 'react'
import type { BoardLeg } from './data/boardSeed'
import PlanningBoard from './views/PlanningBoard'
import RouteConfigPage from './views/RouteConfigPage'

type View =
  | { name: 'board' }
  | { name: 'config'; boardId: string; leg: BoardLeg }

export default function App() {
  const [view, setView] = useState<View>({ name: 'board' })

  if (view.name === 'config') {
    return (
      <RouteConfigPage
        leg={view.leg}
        boardId={view.boardId}
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
