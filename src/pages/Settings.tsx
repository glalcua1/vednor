import { useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import { BankDetails, DepartmentInfo, Settings } from '../state/types'
import { v4 as uuid } from 'uuid'

function SettingsPage() {
  const { state, updateSettings } = useAppState() as any
  const settings = state.settings as Settings
  const [tab, setTab] = useState<'BANK' | 'DEPT' | 'FLOW'>('BANK')
  const [banks, setBanks] = useState<BankDetails[]>(settings?.banks ?? [])
  const [depts, setDepts] = useState<DepartmentInfo[]>(settings?.departments ?? [])
  const [makerChecker, setMakerChecker] = useState<boolean>(settings?.workflow?.makerCheckerEnabled ?? true)

  function saveAll() {
    updateSettings({
      banks,
      departments: depts,
      workflow: { makerCheckerEnabled: makerChecker }
    })
  }

  function addBank() {
    setBanks(prev => [...prev, { id: uuid(), accountName: '', accountNumber: '', bankName: '', ifscOrSwift: '', currency: 'USD' }])
  }
  function updateBank(id: string, patch: Partial<BankDetails>) {
    setBanks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
  }
  function removeBank(id: string) {
    setBanks(prev => prev.filter(b => b.id !== id))
  }

  function addDept() {
    setDepts(prev => [...prev, { id: uuid(), name: '', hod: '', budgetCode: '' }])
  }
  function updateDept(id: string, patch: Partial<DepartmentInfo>) {
    setDepts(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d))
  }
  function removeDept(id: string) {
    setDepts(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="grid cols-1">
      <div className="tabs">
        <button className={`tab ${tab === 'BANK' ? 'active' : ''}`} onClick={() => setTab('BANK')}>Bank Details</button>
        <button className={`tab ${tab === 'DEPT' ? 'active' : ''}`} onClick={() => setTab('DEPT')}>Departments</button>
        <button className={`tab ${tab === 'FLOW' ? 'active' : ''}`} onClick={() => setTab('FLOW')}>Workflow</button>
      </div>

      {tab === 'BANK' && (
        <div className="card">
          <div className="section-title">
            <h3>Bank Accounts</h3>
            <button className="btn ghost small" onClick={addBank}>Add Account</button>
          </div>
          <div className="grid cols-1">
            {banks.map(b => (
              <div key={b.id} className="card elevated">
                <div className="grid cols-3">
                  <div className="field">
                    <label>Account Name</label>
                    <input className="input" value={b.accountName} onChange={e => updateBank(b.id, { accountName: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Account Number</label>
                    <input className="input" value={b.accountNumber} onChange={e => updateBank(b.id, { accountNumber: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Bank Name</label>
                    <input className="input" value={b.bankName} onChange={e => updateBank(b.id, { bankName: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>IFSC/SWIFT</label>
                    <input className="input" value={b.ifscOrSwift ?? ''} onChange={e => updateBank(b.id, { ifscOrSwift: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Currency</label>
                    <select className="select" value={b.currency ?? 'USD'} onChange={e => updateBank(b.id, { currency: e.target.value })}>
                      <option>USD</option>
                      <option>EUR</option>
                      <option>INR</option>
                      <option>GBP</option>
                      <option>AED</option>
                      <option>SGD</option>
                    </select>
                  </div>
                  <div className="field" style={{ alignItems: 'end' as any }}>
                    <button className="btn ghost small" onClick={() => removeBank(b.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
            {banks.length === 0 && <div className="card">No bank accounts added.</div>}
          </div>
        </div>
      )}

      {tab === 'DEPT' && (
        <div className="card">
          <div className="section-title">
            <h3>Departments & HODs</h3>
            <button className="btn ghost small" onClick={addDept}>Add Department</button>
          </div>
          <div className="grid cols-1">
            {depts.map(d => (
              <div key={d.id} className="card elevated">
                <div className="grid cols-3">
                  <div className="field">
                    <label>Department</label>
                    <input className="input" value={d.name} onChange={e => updateDept(d.id, { name: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Head of Department (HOD)</label>
                    <input className="input" value={d.hod} onChange={e => updateDept(d.id, { hod: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>Budget Code</label>
                    <input className="input" value={d.budgetCode ?? ''} onChange={e => updateDept(d.id, { budgetCode: e.target.value })} />
                  </div>
                  <div className="field" style={{ alignItems: 'end' as any }}>
                    <button className="btn ghost small" onClick={() => removeDept(d.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
            {depts.length === 0 && <div className="card">No departments added.</div>}
          </div>
        </div>
      )}

      {tab === 'FLOW' && (
        <div className="card">
          <div className="section-title">
            <h3>Workflow</h3>
          </div>
          <div className="grid cols-1">
            <label className="row" style={{ alignItems: 'center' }}>
              <input type="checkbox" checked={makerChecker} onChange={e => setMakerChecker(e.target.checked)} />
              <span>Enable Maker-Checker workflow for approvals</span>
            </label>
          </div>
        </div>
      )}

      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn primary" onClick={saveAll}>Save Settings</button>
      </div>
    </div>
  )
}

export default SettingsPage


