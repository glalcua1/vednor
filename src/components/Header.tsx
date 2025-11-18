import { useAppState } from '../state/AppStateContext'
import { useLocation } from 'react-router-dom'

function Header() {
  const { state, setNavCollapsed } = useAppState()
  const location = useLocation()
  const titleMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/vendors': 'Vendors',
    '/prs': 'Purchase Requisitions',
    '/rfqs': 'RFQs',
    '/pos': 'Purchase Orders',
    '/invoices': 'Invoices',
    '/renewals': 'Assets',
    '/analytics': 'Analytics',
    '/admin': 'Admin'
  }
  const title = titleMap[location.pathname] ?? 'RateGain | Vendor Management'
  return (
    <div className="header">
      <div className="row" style={{ width: '100%' }}>
        <div className="left">
          <div className="header-title">{title}</div>
        </div>
        <div className="right" />
      </div>
    </div>
  )
}

export default Header


