import { useAppState } from '../state/AppStateContext'
const fallbackDepartments = ['HR','Finance','Product','UXD','Engineering','Admin','Security'] as const

export function DepartmentSelect({
  value,
  onChange,
  placeholder
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const { state } = useAppState() as any
  const configured = (state?.settings?.departments ?? []).map((d: any) => d.name).filter(Boolean)
  const departments: string[] = configured.length ? configured : [...fallbackDepartments]
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {departments.map(d => <option key={d} value={d}>{d}</option>)}
    </select>
  )
}

export default DepartmentSelect


