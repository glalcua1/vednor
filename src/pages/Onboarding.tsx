import { useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import { Vendor } from '../state/types'

function Onboarding() {
  const { addVendor } = useAppState()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<{
    name: string
    category: Vendor['category']
    contactPerson: string
    email: string
    bank: string
    taxId: string
    documents: string[]
  }>({
    name: '',
    category: 'Software',
    contactPerson: '',
    email: '',
    bank: '',
    taxId: '',
    documents: [] as string[]
  })

  function next() { setStep(s => Math.min(3, s + 1)) }
  function prev() { setStep(s => Math.max(1, s - 1)) }
  function submit() {
    addVendor({ ...form, documents: form.documents, status: 'Pending Approval' })
    setStep(1)
    setForm({ name: '', category: 'Software', contactPerson: '', email: '', bank: '', taxId: '', documents: [] })
    alert('Vendor submitted for approval.')
  }

  return (
    <div className="grid cols-1">
      <div className="card">
        <div className="section-title">
          <h3>Vendor Onboarding</h3>
          <div className="row">
            <div className="badge blue">Step {step} of 3</div>
          </div>
        </div>

        {step === 1 && (
          <div className="grid cols-3">
            <div className="field">
              <label>Vendor Name</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Category</label>
              <select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as Vendor['category'] })}>
                <option>Software</option>
                <option>Hardware</option>
                <option>Office Supplies</option>
                <option>Services</option>
                <option>Other</option>
              </select>
            </div>
            <div className="field">
              <label>Contact Person</label>
              <input className="input" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid cols-3">
            <div className="field">
              <label>Bank Details</label>
              <input className="input" value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} />
            </div>
            <div className="field">
              <label>Tax ID</label>
              <input className="input" value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })} />
            </div>
            <div className="field">
              <label>Documents (enter URLs, comma-separated)</label>
              <input className="input" value={form.documents.join(', ')} onChange={e => setForm({ ...form, documents: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid cols-2">
            <div className="card elevated">
              <h3>Summary</h3>
              <div><strong>Name:</strong> {form.name}</div>
              <div><strong>Category:</strong> {form.category}</div>
              <div><strong>Contact:</strong> {form.contactPerson} ({form.email})</div>
              <div><strong>Bank:</strong> {form.bank || '-'}</div>
              <div><strong>Tax ID:</strong> {form.taxId || '-'}</div>
              <div><strong>Documents:</strong> {form.documents.length ? form.documents.join(', ') : '-'}</div>
            </div>
            <div className="card elevated">
              <h3>Approval Workflow</h3>
              <ul>
                <li>Procurement Review</li>
                <li>Finance Verification (bank/tax)</li>
                <li>Legal (if contracts attached)</li>
              </ul>
              <div className="badge orange">Will be marked Pending Approval</div>
            </div>
          </div>
        )}

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn ghost" onClick={prev} disabled={step === 1}>Back</button>
          <div className="spacer" />
          {step < 3 ? (
            <button className="btn primary" onClick={next}>Next</button>
          ) : (
            <button className="btn primary" onClick={submit}>Submit</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Onboarding


