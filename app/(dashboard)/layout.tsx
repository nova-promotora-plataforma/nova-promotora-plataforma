'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--nova-bg)]">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </ToastProvider>
  )
}
