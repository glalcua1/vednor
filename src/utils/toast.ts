export type ToastVariant = 'success' | 'info' | 'error'

export function showToast(message: string, variant: ToastVariant = 'success', timeoutMs = 3000) {
  let container = document.getElementById('toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    container.style.position = 'fixed'
    container.style.right = '16px'
    container.style.bottom = '16px'
    container.style.display = 'flex'
    container.style.flexDirection = 'column'
    container.style.gap = '10px'
    container.style.zIndex = '9999'
    document.body.appendChild(container)
  }
  const toast = document.createElement('div')
  toast.className = `toast ${variant}`
  toast.textContent = message
  toast.style.minWidth = '240px'
  toast.style.maxWidth = '420px'
  toast.style.padding = '10px 12px'
  toast.style.borderRadius = '10px'
  toast.style.border = '1px solid var(--border)'
  toast.style.boxShadow = 'var(--shadow-sm)'
  toast.style.background = '#fff'
  toast.style.fontSize = '14px'
  toast.style.color = 'var(--text-900)'
  toast.style.opacity = '0'
  toast.style.transform = 'translateY(8px)'
  toast.style.transition = 'opacity .2s ease, transform .2s ease'
  if (variant === 'success') {
    toast.style.borderColor = '#c8ead4'
    toast.style.background = '#f0fbf4'
  } else if (variant === 'error') {
    toast.style.borderColor = '#f6c5ca'
    toast.style.background = '#fdecef'
  } else {
    toast.style.borderColor = 'var(--border)'
    toast.style.background = '#ffffff'
  }
  container.appendChild(toast)
  requestAnimationFrame(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translateY(0)'
  })
  window.setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateY(8px)'
    toast.addEventListener('transitionend', () => {
      toast.remove()
      if (container && container.childElementCount === 0) {
        container.remove()
      }
    }, { once: true })
  }, timeoutMs)
}


