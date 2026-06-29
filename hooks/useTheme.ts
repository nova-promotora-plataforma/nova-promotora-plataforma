'use client'

import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('nova-theme') as Theme) ?? 'dark'
    applyTheme(saved)
    setTheme(saved)
  }, [])

  function applyTheme(t: Theme) {
    const html = document.documentElement
    html.classList.remove('dark', 'light')
    html.classList.add(t)
  }

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
    localStorage.setItem('nova-theme', next)
  }

  return { theme, toggle }
}
