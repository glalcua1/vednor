import { Link } from 'react-router-dom'
import { useAppState } from '../state/AppStateContext'
import Acronym from '../components/Acronym'

function Dashboard() {
  const { state } = useAppState()
  const isEmployee = state.currentUser.role === 'Requestor'
  const now = Date.now()
  const myAssets = state.assets.filter(a => (a.assignedTo ?? '').toLowerCase() === (state.currentUser.name ?? '').toLowerCase())
  const assetSource = isEmployee ? myAssets : state.assets
  const upcomingRenewals = assetSource
    .filter(a => {
      const days = (new Date(a.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return days <= 90
    })
    .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime())
    .slice(0, 8)

  const overdueInvoices = state.invoices
    .filter(i => i.status !== 'Paid' && new Date(i.dueDate).getTime() < Date.now())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 8)
  const openRFQs = state.rfqs.filter(r => r.status === 'Open').length
  const awardedRFQs = state.rfqs.filter(r => r.status === 'Awarded').length
  const pendingApprovals = state.prs.filter(p => p.status === 'Pending Dept Approval' || p.status === 'Pending Procurement Approval').length
  const assetsCount = isEmployee ? myAssets.length : state.assets.length
  const spendLast30 = state.invoices.filter(i => i.status === 'Paid' && (now - new Date(i.createdAt).getTime()) <= 1000*60*60*24*30).reduce((s, i) => s + i.amount, 0)
  const spendCurrency = (() => {
    const recent = state.invoices.find(i => i.status === 'Paid' && (now - new Date(i.createdAt).getTime()) <= 1000*60*60*24*30)
    const po = recent ? state.pos.find(p => p.id === recent.poId) : undefined
    const pr = po ? state.prs.find(p => p.id === po.fromPRId) : undefined
    return pr?.currency ?? 'USD'
  })()

  const spendByVendor = (() => {
    const map = new Map<string, number>()
    state.invoices.forEach(i => {
      const prev = map.get(i.vendorId) ?? 0
      map.set(i.vendorId, prev + i.amount)
    })
    return [...map.entries()].map(([vendorId, amount]) => ({
      vendorId,
      name: state.vendors.find(v => v.id === vendorId)?.name ?? 'Unknown',
      amount
    })).sort((a, b) => b.amount - a.amount).slice(0, 8)
  })()
  const vendorCurrency = (() => {
    const m = new Map<string, string>()
    state.pos.forEach(p => {
      const pr = p.fromPRId ? state.prs.find(pr => pr.id === p.fromPRId) : undefined
      if (pr) m.set(p.vendorId, pr.currency ?? 'USD')
    })
    return m
  })()

  return (
    <div className="dashboard grid cols-1">
      {!isEmployee ? (
        <div className="grid cols-4">
          <div className="card">
            <div className="stat">
              <div className="value">{state.vendors.length}</div>
              <div className="sub">Vendors</div>
            </div>
            <div><Link className="link" to="/vendors">Manage Vendors</Link></div>
          </div>
          <div className="card">
            <div className="stat">
              <div className="value">{state.prs.length}</div>
              <div className="sub"><Acronym text="PRs" /></div>
            </div>
            <div><Link className="link" to="/prs?tab=PR">View PRs</Link></div>
          </div>
          <div className="card">
            <div className="stat">
              <div className="value">{state.pos.length}</div>
              <div className="sub"><Acronym text="POs" /></div>
            </div>
            <div><Link className="link" to="/prs?tab=PO">View POs</Link></div>
          </div>
          <div className="card">
            <div className="stat">
              <div className="value">{state.invoices.filter(i => i.status !== 'Paid').length}</div>
              <div className="sub">Open Invoices</div>
            </div>
            <div><Link className="link" to="/prs?tab=INV">Invoices</Link></div>
          </div>
        </div>
      ) : (
        <div className="grid cols-4">
          <div className="card">
            <div className="stat">
              <div className="value">{assetsCount}</div>
              <div className="sub">Allocated Assets</div>
            </div>
            <div><Link className="link" to="/renewals">My Assets</Link></div>
          </div>
        </div>
      )}

      {!isEmployee && (
        <div className="grid cols-4">
          <div className="card">
            <div className="stat">
              <div className="value">{openRFQs}</div>
              <div className="sub">Open RFQs</div>
            </div>
            <div><Link className="link" to="/prs?tab=RFQ">Go to RFQs</Link></div>
          </div>
          <div className="card">
            <div className="stat">
              <div className="value">{awardedRFQs}</div>
              <div className="sub">Awarded RFQs</div>
            </div>
            <div><Link className="link" to="/prs?tab=RFQ">Review RFQs</Link></div>
          </div>
          <div className="card">
            <div className="stat">
              <div className="value">{pendingApprovals}</div>
              <div className="sub">Pending Approvals</div>
            </div>
            <div><Link className="link" to="/prs">Review PRs</Link></div>
          </div>
          <div className="card">
            <div className="stat">
              <div className="value">{assetsCount}</div>
              <div className="sub">Assets Tracked</div>
            </div>
            <div><Link className="link" to="/renewals">Assets</Link></div>
          </div>
        </div>
      )}

      {!isEmployee && (
        <div className="grid cols-2">
          <div className="card">
            <div className="section-title">
              <h3>Top Vendors by Spend</h3>
              <div className="badge blue">Last 12 months</div>
            </div>
            <table className="table">
              <thead><tr><th>Vendor</th><th>Amount</th></tr></thead>
              <tbody>
                {spendByVendor.map(r => (
                  <tr key={r.vendorId}>
                    <td>{r.name}</td>
                    <td>{vendorCurrency.get(r.vendorId) ?? 'USD'} {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {spendByVendor.length === 0 && <tr><td colSpan={2}>No spend yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="card">
            <div className="section-title">
              <h3>Spend (last 30 days)</h3>
              <div className="badge green">Paid</div>
            </div>
            <div className="stat">
              <div className="value">{spendCurrency} {spendLast30.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="sub">Total Paid</div>
            </div>
            <div className="grid cols-1" style={{ marginTop: 8 }}>
              {['Software','Services','Other'].map(cat => {
                const amount = state.invoices
                  .filter(i => i.status === 'Paid' && (now - new Date(i.createdAt).getTime()) <= 1000*60*60*24*30)
                  .reduce((s, i) => {
                    const po = state.pos.find(p => p.id === i.poId)
                    const firstItem = po?.items[0]
                    const isCat = firstItem ? (cat === 'Software' ? /license|subscription|rms|pms|channel|gds/i.test(firstItem.description)
                      : cat === 'Services' ? /maintenance|integration|service/i.test(firstItem.description)
                      : true) : false
                    return s + (isCat ? i.amount : 0)
                  }, 0)
                const pct = spendLast30 ? Math.min(100, (amount / spendLast30) * 100) : 0
                return (
                  <div key={cat} className="metric-row" style={{ fontSize: 14 }}>
                    <div className="metric-label" style={{ fontSize: 14 }}>{cat}</div>
                    <div className="metric-bar elevated">
                      <div style={{ width: `${pct}%`, height: 10, background: 'var(--blue-500)' }} />
                    </div>
                    <div className="metric-amount" style={{ fontSize: 14 }}>{spendCurrency} {Math.round(amount).toLocaleString()}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid cols-2">
        <div className="card">
          <div className="section-title">
            <h3>Upcoming Renewals (90 days)</h3>
            <Link to="/renewals" className="btn ghost small">View all</Link>
          </div>
          <table className="table">
            <thead><tr><th>Asset</th><th>Vendor</th><th>Renewal</th><th>Auto</th></tr></thead>
            <tbody>
              {upcomingRenewals.map(a => {
                const vendor = state.vendors.find(v => v.id === a.vendorId)
                return (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{vendor?.name ?? '-'}</td>
                    <td>{new Date(a.renewalDate).toLocaleDateString()}</td>
                    <td><span className={`badge ${a.autoRenew ? 'green' : 'orange'}`}>{a.autoRenew ? 'Yes' : 'No'}</span></td>
                  </tr>
                )
              })}
              {upcomingRenewals.length === 0 && <tr><td colSpan={4}>No upcoming renewals.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="section-title">
            <h3>Overdue Invoices</h3>
            <Link to="/invoices" className="btn ghost small">Review</Link>
          </div>
          <table className="table">
            <thead><tr><th>Invoice</th><th>Vendor</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>
              {overdueInvoices.map(i => {
                const vendor = state.vendors.find(v => v.id === i.vendorId)
                return (
                  <tr key={i.id}>
                    <td>INV-{i.id.slice(0,6)}</td>
                    <td>{vendor?.name ?? '-'}</td>
                    <td>{new Date(i.dueDate).toLocaleDateString()}</td>
                    <td><span className="badge red">Overdue</span></td>
                  </tr>
                )
              })}
              {overdueInvoices.length === 0 && <tr><td colSpan={4}>No overdue invoices.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard


