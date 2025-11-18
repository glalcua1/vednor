import { NavLink } from 'react-router-dom'
import Acronym from './Acronym'
import { useAppState } from '../state/AppStateContext'
import { IconDashboard, IconVendors, IconPRs, IconAssets, IconAdmin, IconHelp, IconChevronLeft, IconChevronRight, IconSettings } from './icons'

// removed unused items list

function Sidebar() {
  const { state, logout, setNavCollapsed } = useAppState() as any
  const isEmployee = state.currentUser.role === 'Requestor'
  const navItems = isEmployee ? [
    { label: 'Dashboard', to: '/dashboard', title: 'Overview', icon: <IconDashboard /> },
    { label: 'Purchase Requisitions', to: '/prs', short: <Acronym text="PRs" />, title: 'Purchase Requisitions', icon: <IconPRs /> },
    { label: 'Assets', to: '/renewals', title: 'Assets & Renewals', icon: <IconAssets /> },
    { label: 'Help & FAQs', to: '/help', title: 'Help', icon: <IconHelp /> }
  ] : [
    { label: 'Dashboard', to: '/dashboard', title: 'Overview', icon: <IconDashboard /> },
    { label: 'Vendors', to: '/vendors', title: 'Vendors', icon: <IconVendors /> },
    { label: 'Purchase Requisitions', to: '/prs', short: <Acronym text="PRs" />, title: 'Purchase Requisitions', icon: <IconPRs /> },
    { label: 'Assets', to: '/renewals', title: 'Assets & Renewals', icon: <IconAssets /> }
  ]
  return (
    <>
      <div className="sidebar-content">
        <div className="brand" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <img src="/Vivid-Lavender.png" alt="Vendor Management" style={{ height: 20 }} />
            <div style={{ fontSize: 12, opacity: .7, color: 'var(--text-700)' }}>Vendor Management</div>
          </div>
        </div>
        <nav>
          <div className="nav-section">
            <div className="nav-label">Navigation</div>
            {navItems.map(i => (
              <NavLink key={i.to} to={i.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={i.title}>
                <span className="icon">{i.icon}</span>
                <span>{state.uiCollapsed && i.short ? i.short : i.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <div className="nav-section">
            <div className="nav-label">Help & Support</div>
            <NavLink to="/help" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Help & FAQs">
              <span className="icon"><IconHelp /></span>
              <span>{state.uiCollapsed ? 'Help' : 'Help & FAQs'}</span>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Settings">
              <span className="icon"><IconSettings /></span>
              <span>Settings</span>
            </NavLink>
            {!isEmployee && (
              <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="User Management">
                <span className="icon"><IconAdmin /></span>
                <span>{state.uiCollapsed ? 'Users' : 'User Management'}</span>
              </NavLink>
            )}
          </div>
          <div className="nav-section">
            <button
              className="nav-item collapse-toggle"
              onClick={() => setNavCollapsed(!state.uiCollapsed)}
              title={state.uiCollapsed ? 'Expand menu' : 'Collapse menu'}
              style={{ width: '100%', background: 'transparent', border: 'none' }}
            >
              <span className="icon">{state.uiCollapsed ? <IconChevronRight /> : <IconChevronLeft />}</span>
              <span>{state.uiCollapsed ? 'Expand menu' : 'Collapse menu'}</span>
            </button>
          </div>
        </div>
      </div>
      <div
        className="sidebar-footer"
        role="button"
        tabIndex={0}
        title="Click to logout"
        onClick={() => logout()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); logout() } }}
        style={{ cursor: 'pointer' }}
      >
        <div className="avatar">{state.currentUser.name.slice(0,1).toUpperCase()}</div>
        <div className="sidebar-user">
          <div style={{ fontSize: 13, fontWeight: 700 }}>{state.currentUser.name}</div>
          <div className="badge blue">{state.currentUser.role}</div>
        </div>
      </div>
    </>
  )
}

export default Sidebar


