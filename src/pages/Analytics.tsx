import { useMemo } from 'react'
import { useAppState } from '../state/AppStateContext'

function Analytics() {
  const { state } = useAppState()

  const spendByVendor = useMemo(() => {
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
  }, [state.invoices, state.vendors])
  const vendorCurrency = useMemo(() => {
    const m = new Map<string, string>()
    state.pos.forEach(p => {
      const pr = p.fromPRId ? state.prs.find(pr => pr.id === p.fromPRId) : undefined
      if (pr) m.set(p.vendorId, pr.currency ?? 'USD')
    })
    return m
  }, [state.pos, state.prs])

  const prStatusCounts = useMemo(() => {
    const keys = ['Pending Approval','Approved','Rejected','Converted to RFQ','Converted to PO'] as const
    return keys.map(k => ({
      key: k,
      count: state.prs.filter(p => p.status === k).length
    }))
  }, [state.prs])

  return (
    <div className="grid cols-2">
      <div className="card">
        <h3>Top Vendor Spend</h3>
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
        <h3>PR Status</h3>
        <div className="grid cols-1">
          {prStatusCounts.map(s => (
            <div key={s.key} className="row">
              <div style={{ width: 160 }}>{s.key}</div>
              <div className="spacer" />
              <div className="elevated" style={{ width: '60%', height: 10, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, s.count * 20)}%`, height: 10, background: 'var(--blue-500)' }} />
              </div>
              <div style={{ width: 40, textAlign: 'right' }}>{s.count}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Renewals in 30/60/90 Days</h3>
        <div className="grid cols-1">
          {[30,60,90].map(days => {
            const count = state.assets.filter(a => {
              const diff = (new Date(a.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              return diff <= days
            }).length
            return (
              <div key={days} className="row">
                <div style={{ width: 160 }}>{days} days</div>
                <div className="spacer" />
                <div className="elevated" style={{ width: '60%', height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, count * 25)}%`, height: 10, background: 'var(--blue-400)' }} />
                </div>
                <div style={{ width: 40, textAlign: 'right' }}>{count}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="card">
        <h3>Invoice Status</h3>
        <div className="grid cols-1">
          {(['Submitted','Approved','Paid','Overdue'] as const).map(k => {
            const count = state.invoices.filter(i => i.status === k).length
            return (
              <div key={k} className="row">
                <div style={{ width: 160 }}>{k}</div>
                <div className="spacer" />
                <div className="elevated" style={{ width: '60%', height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, count * 20)}%`, height: 10, background: 'var(--blue-300)' }} />
                </div>
                <div style={{ width: 40, textAlign: 'right' }}>{count}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Analytics


