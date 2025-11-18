import { useState } from 'react'
import { useAppState } from '../state/AppStateContext'
import { Role } from '../state/types'

function Admin() {
  const { state, setRole, setUser } = useAppState()
  const [name, setName] = useState('')
  const [role, setRoleLocal] = useState<Role>('Requestor')

  function addUser() {
    if (!name) return
    setUser({ name })
    setRole(role)
    setName('')
  }

  return (
    <div className="grid cols-2">
      <div className="card">
        <h3>Users</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>Role</th></tr></thead>
          <tbody>
            {state.users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="row" style={{ marginTop: 12 }}>
          <input className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
          <select className="select" value={role} onChange={e => setRoleLocal(e.target.value as Role)}>
            <option>Admin</option>
            <option>Procurement</option>
            <option>Finance</option>
            <option>Requestor</option>
          </select>
          <button className="btn primary" onClick={addUser}>Add User</button>
        </div>
      </div>
      <div className="card">
        <h3>Settings</h3>
        <div className="grid cols-1">
          <div className="row">
            <div>Current Role</div>
            <div className="spacer" />
            <select className="select" value={state.currentUser.role} onChange={(e) => setRole(e.target.value as Role)}>
              <option>Admin</option>
              <option>Procurement</option>
              <option>Finance</option>
              <option>Requestor</option>
            </select>
          </div>
          <div className="row">
            <div>Current User</div>
            <div className="spacer" />
            <input className="input" value={state.currentUser.name} onChange={(e) => setUser({ name: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin


