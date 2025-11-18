import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Vendors from './pages/Vendors'
import Onboarding from './pages/Onboarding'
import PRs from './pages/PRs'
import RFQs from './pages/RFQs'
import POs from './pages/POs'
import Invoices from './pages/Invoices'
import Renewals from './pages/Renewals'
import Analytics from './pages/Analytics'
import Admin from './pages/Admin'
import Help from './pages/Help'
import Login from './pages/Login'
import { useAppState } from './state/AppStateContext'
import SettingsPage from './pages/Settings'

function App() {
  const { state } = useAppState()
  const authed = !!state.isAuthenticated
  if (!authed) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/prs" element={<PRs />} />
        <Route path="/rfqs" element={<RFQs />} />
        <Route path="/pos" element={<POs />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/renewals" element={<Renewals />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/help" element={<Help />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App


