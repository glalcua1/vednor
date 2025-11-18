import { PropsWithChildren } from 'react'
import Sidebar from './Sidebar'
import Assistant from './Assistant'
import { useAppState } from '../state/AppStateContext'

function Layout({ children }: PropsWithChildren) {
  const { state } = useAppState()
  return (
    <div className={`app-shell theme-blue ${state.uiCollapsed ? 'collapsed' : ''}`}>
      <aside className={`sidebar ${state.uiCollapsed ? 'collapsed' : ''}`}>
        <Sidebar />
      </aside>
      <main className="content">
        {children}
      </main>
      <Assistant />
    </div>
  )
}

export default Layout


