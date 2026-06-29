'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'
interface Toast { id: string; type: ToastType; message: string }

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} className="text-emerald-400" />,
  error:   <XCircle    size={16} className="text-red-400" />,
  warning: <AlertCircle size={16} className="text-amber-400" />,
  info:    <Info       size={16} className="text-blue-400" />,
}

const styles: Record<ToastType, string> = {
  success: 'border-emerald-500/25',
  error:   'border-red-500/25',
  warning: 'border-amber-500/25',
  info:    'border-blue-500/25',
}

const ToastCtx = createContext<{ add: (type: ToastType, message: string) => void }>({
  add: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const add = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastCtx.Provider value={{ add }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'flex items-start gap-3 rounded-md border bg-[var(--nova-bg-elev)] px-4 py-3',
              'shadow-lg text-sm text-[var(--nova-text)] transition-nova',
              styles[t.type],
            )}
          >
            <span className="flex-shrink-0 mt-0.5">{icons[t.type]}</span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="text-[var(--nova-text-dim)] hover:text-[var(--nova-text)] transition-nova flex-shrink-0"
              aria-label="Fechar notificação"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
