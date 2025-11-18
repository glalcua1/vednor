import { PropsWithChildren } from 'react'

interface DrawerProps {
  open: boolean
  title?: string
  onClose: () => void
  footer?: React.ReactNode
  width?: number | string
}

function Drawer({ open, title, onClose, footer, width, children }: PropsWithChildren<DrawerProps>) {
  return (
    <>
      <div className={`drawer-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside
        className={`drawer ${open ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined}
      >
        <div className="drawer-header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn ghost small" onClick={onClose}>Close</button>
        </div>
        <div className="drawer-body">
          {children}
        </div>
        {footer && <div className="drawer-footer">{footer}</div>}
      </aside>
    </>
  )
}

export default Drawer


