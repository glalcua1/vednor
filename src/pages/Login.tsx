import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppStateContext'
import { Role, User } from '../state/types'

function Login() {
  const { state, login, setRole, setUser } = useAppState()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const demos = [
    { label: 'Employee (Requestor)', email: 'demo.employee@company.com', password: 'demo123', role: 'Requestor' as Role, name: 'Demo Employee' },
    { label: 'Procurement / Finance', email: 'procurement@company.com', password: 'demo123', role: 'Procurement' as Role, name: 'Priya Singh' }
  ]

  function doLogin(e: React.FormEvent) {
    e.preventDefault()
    const match = demos.find(d => d.email === email && d.password === password)
    if (!match) { setError('Invalid credentials. Use the demo credentials listed below.'); return }
    const existing = state.users.find(u => u.name === match.name) as User | undefined
    const user: User = existing ?? { id: crypto.randomUUID(), name: match.name, role: match.role }
    login(user)
    setRole(match.role)
    setUser({ name: match.name })
    navigate('/dashboard', { replace: true })
  }

  function quickLogin(demo: typeof demos[number]) {
    setEmail(demo.email); setPassword(demo.password)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18, marginBottom: 32 }}>
          <img src="/Vivid-Lavender.png" alt="RateGain" style={{ height: 18 }} />
          <div className="login-welcome"><span className="welcome-big">Welcome to</span> <span className="welcome-medium">Vendor Management</span></div>
        </div>
        <form onSubmit={doLogin} className="grid cols-1">
          <div className="field">
            <label>Email</label>
            <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="demo.employee@company.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="demo123"
                style={{ paddingRight: 36 }}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(v => !v)}
                title={showPassword ? 'Hide' : 'Show'}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', height: 28, width: 28, border: 'none', background: 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3l18 18" stroke="currentColor"/>
                    <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" stroke="currentColor" fill="none"/>
                    <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c7 0 10 7 10 7a13.6 13.6 0 0 1-3.3 4.4M6.6 6.6A13.4 13.4 0 0 0 2 12s3 7 10 7c1.1 0 2.2-.2 3.2-.6" stroke="currentColor" fill="none"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" fill="none" stroke="currentColor"/>
                    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <div style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</div>}
          <button className="btn primary" type="submit">Login</button>
        </form>
      </div>
      <div className="login-credentials">
        <div className="table-block">
          <div className="table-header">Demo credentials</div>
          <table className="table">
            <thead><tr><th>User</th><th>Email</th><th>Password</th><th></th></tr></thead>
            <tbody>
              {demos.map(d => (
                <tr key={d.email}>
                  <td>{d.label}</td>
                  <td>{d.email}</td>
                  <td>{d.password}</td>
                  <td className="actions"><button className="btn ghost small" onClick={() => quickLogin(d)}>Use</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Login


