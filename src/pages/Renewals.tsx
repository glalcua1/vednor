import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import Drawer from '../components/Drawer'
import DepartmentSelect from '../components/DepartmentSelect'
import { useLocation } from 'react-router-dom'
import { showToast } from '../utils/toast'

function Renewals() {
  const { state, addAsset, updateAsset } = useAppState()
  const isEmployee = state.currentUser.role === 'Requestor'
  const location = useLocation() as any
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const highlightRef = useRef<HTMLTableRowElement | null>(null)
  const [query, setQuery] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [name, setName] = useState('')
  const [assignedTo, setAssignedTo] = useState(isEmployee ? (state.currentUser.name ?? '') : '')
  const [department, setDepartment] = useState('Engineering')
  const [renewalDate, setRenewalDate] = useState('')
  const [autoRenew, setAutoRenew] = useState(true)
  const [contractUrl, setContractUrl] = useState('')
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<{ id: string, department: string, assignedTo: string }>({ id: '', department: 'Engineering', assignedTo: '' })
  const [assetSortKey, setAssetSortKey] = useState<'asset' | 'vendor' | 'department' | 'assigned' | 'renewal' | 'auto'>('asset')
  const [assetSortDir, setAssetSortDir] = useState<'asc' | 'desc'>('asc')

  function add() {
    if (!vendorId || !name || !renewalDate) return alert('Vendor, Name, Renewal Date are required.')
    const assignTo = isEmployee ? (assignedTo || state.currentUser.name || '') : assignedTo
    const asset = addAsset({ vendorId, name, assignedTo: assignTo, department, renewalDate, autoRenew, contractUrl })
    setVendorId(''); setName(''); setAssignedTo(isEmployee ? (state.currentUser.name ?? '') : ''); setDepartment('Engineering'); setRenewalDate(''); setAutoRenew(true); setContractUrl(''); setSuccess(true)
    setHighlightId(asset.id)
    showToast('Asset added successfully.', 'success')
  }

  const filteredAssets = state.assets.filter(a => {
    if (state.currentUser.role === 'Requestor') {
      return (a.assignedTo ?? '').toLowerCase() === (state.currentUser.name ?? '').toLowerCase()
    }
    if (!query) return true
    const vendor = state.vendors.find(v => v.id === a.vendorId)
    const hay = [
      a.name,
      a.assignedTo ?? '',
      a.department ?? '',
      vendor?.name ?? ''
    ].join(' ').toLowerCase()
    return hay.includes(query.toLowerCase())
  })

  const groupedByDept = filteredAssets.reduce<Record<string, typeof filteredAssets>>((acc, a) => {
    const key = a.department || 'Unassigned'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleGroup = (deptKey: string) => {
    setCollapsed(prev => ({
      ...prev,
      [deptKey]: !prev[deptKey]
    }))
  }

  return (
    <div className="grid cols-1">
      <div className="section-title">
        <h3>Assets</h3>
        <div className="row">
          <input
            className="input small"
            style={{ width: 280 }}
            placeholder="Search assets, vendor, assigned..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn primary" onClick={() => { setOpen(true); setSuccess(false) }}>Add Asset</button>
        </div>
      </div>
      {Object.entries(groupedByDept).sort(([a], [b]) => a.localeCompare(b)).map(([deptKey, assets]) => {
        const isCollapsed = !!collapsed[deptKey]
        return (
          <div key={deptKey}>
            <div className="table-block">
              <div className="table-header" style={{ cursor: 'pointer' }} onClick={() => toggleGroup(deptKey)}>
                <div className="row" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <span>{isCollapsed ? '▸' : '▾'} {deptKey}</span>
                  <span className="badge blue">{assets.length}</span>
                </div>
              </div>
              {!isCollapsed && (
                <table className="table">
                  <thead>
                    <tr>
                      <th onClick={() => { setAssetSortKey('asset'); setAssetSortDir(assetSortKey === 'asset' && assetSortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Asset {assetSortKey === 'asset' ? (assetSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                      <th onClick={() => { setAssetSortKey('vendor'); setAssetSortDir(assetSortKey === 'vendor' && assetSortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Vendor {assetSortKey === 'vendor' ? (assetSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                      <th onClick={() => { setAssetSortKey('department'); setAssetSortDir(assetSortKey === 'department' && assetSortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Department {assetSortKey === 'department' ? (assetSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                      <th onClick={() => { setAssetSortKey('assigned'); setAssetSortDir(assetSortKey === 'assigned' && assetSortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Assigned To {assetSortKey === 'assigned' ? (assetSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                      <th onClick={() => { setAssetSortKey('renewal'); setAssetSortDir(assetSortKey === 'renewal' && assetSortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Renewal {assetSortKey === 'renewal' ? (assetSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                      <th onClick={() => { setAssetSortKey('auto'); setAssetSortDir(assetSortKey === 'auto' && assetSortDir === 'asc' ? 'desc' : 'asc') }} style={{ cursor: 'pointer' }}>Auto {assetSortKey === 'auto' ? (assetSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                      {!isEmployee && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {assets
                      .slice()
                      .sort((a, b) => {
                        const dir = assetSortDir === 'asc' ? 1 : -1
                        const vendorA = state.vendors.find(v => v.id === a.vendorId)?.name ?? ''
                        const vendorB = state.vendors.find(v => v.id === b.vendorId)?.name ?? ''
                        switch (assetSortKey) {
                          case 'asset': return (a.name ?? '').localeCompare(b.name ?? '') * dir
                          case 'vendor': return vendorA.localeCompare(vendorB) * dir
                          case 'department': return (a.department ?? '').localeCompare(b.department ?? '') * dir
                          case 'assigned': return (a.assignedTo ?? '').localeCompare(b.assignedTo ?? '') * dir
                          case 'renewal': return (new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()) * dir
                          case 'auto': return ((a.autoRenew ? 1 : 0) - (b.autoRenew ? 1 : 0)) * dir
                          default: return 0
                        }
                      })
                      .map(a => {
                    const vendor = state.vendors.find(v => v.id === a.vendorId)
                    const days = Math.ceil((new Date(a.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    return (
                      <tr key={a.id} ref={highlightId === a.id ? (el) => { highlightRef.current = el } : undefined} className={highlightId === a.id ? 'row-flash' : ''}>
                        <td>{a.name}</td>
                        <td>{vendor?.name ?? '-'}</td>
                        <td>{a.department ?? '-'}</td>
                        <td>{a.assignedTo ?? '-'}</td>
                        <td>{new Date(a.renewalDate).toLocaleDateString()} {days <= 30 ? <span className="badge red">Urgent</span> : days <= 90 ? <span className="badge orange">Soon</span> : <span className="badge blue">OK</span>}</td>
                        <td>{a.autoRenew ? 'Yes' : 'No'}</td>
                        {!isEmployee && (
                          <td className="actions">
                            <button className="btn ghost small" onClick={() => updateAsset({ ...a, autoRenew: !a.autoRenew })}>{a.autoRenew ? 'Disable Auto' : 'Enable Auto'}</button>
                            <button className="btn small" onClick={() => { setEditing({ id: a.id, department: a.department ?? 'Engineering', assignedTo: a.assignedTo ?? '' }); setEditOpen(true) }}>Edit</button>
                            {a.contractUrl && <a className="btn small" href={a.contractUrl} target="_blank" rel="noreferrer">Contract</a>}
                          </td>
                        )}
                      </tr>
                    )
                    })}
                    {assets.length === 0 && <tr><td colSpan={7}>No assets added.</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )
      })}

      <Drawer
        open={open}
        onClose={() => { setOpen(false); setSuccess(false) }}
        title="Add Asset / Subscription"
        footer={!success && (
          <>
            <button className="btn ghost" onClick={() => { setOpen(false); setSuccess(false) }}>Cancel</button>
            <button className="btn primary" onClick={add}>Add</button>
          </>
        )}
      >
        {success ? (
          <div className="victory">
            <div className="check">✓</div>
            <h2>Asset added</h2>
            <p>Your asset/subscription is now tracked. Renewal reminders will appear on the dashboard and within the Renewal Tracker.</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={() => { setOpen(false); setSuccess(false) }}>Close</button>
            </div>
          </div>
        ) : (
          <div className="grid cols-3">
            <div className="field">
              <label>Vendor</label>
              <select className="select" value={vendorId} onChange={e => setVendorId(e.target.value)}>
                <option value="">Select Vendor</option>
                {state.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Asset Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Adobe Creative Cloud (3 seats)" />
            </div>
            <div className="field">
              <label>Assigned To (optional)</label>
              <input className="input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} />
            </div>
            <div className="field">
              <label>Department</label>
              <DepartmentSelect value={department} onChange={setDepartment as any} />
            </div>
            <div className="field">
              <label>Renewal Date</label>
              <input type="date" className="input" value={renewalDate} onChange={e => setRenewalDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Contract URL</label>
              <input className="input" value={contractUrl} onChange={e => setContractUrl(e.target.value)} />
            </div>
            <div className="field">
              <label>Auto Renew</label>
              <select className="select" value={autoRenew ? 'Yes' : 'No'} onChange={e => setAutoRenew(e.target.value === 'Yes')}>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        open={editOpen}
        onClose={() => { setEditOpen(false) }}
        title="Edit Asset Allocation"
        footer={
          <>
            <button className="btn ghost" onClick={() => setEditOpen(false)}>Cancel</button>
            <button className="btn primary" onClick={() => {
              const asset = state.assets.find(a => a.id === editing.id)
              if (asset) {
                updateAsset({ ...asset, department: editing.department, assignedTo: editing.assignedTo })
              }
              setEditOpen(false)
            }}>Save</button>
          </>
        }
      >
        <div className="grid cols-2">
          <div className="field">
            <label>Department</label>
            <DepartmentSelect value={editing.department} onChange={(v) => setEditing(prev => ({ ...prev, department: v }))} />
          </div>
          <div className="field">
            <label>Assigned To</label>
            <input className="input" value={editing.assignedTo} onChange={(e) => setEditing(prev => ({ ...prev, assignedTo: e.target.value }))} />
          </div>
        </div>
      </Drawer>
    </div>
  )
}

export default Renewals


