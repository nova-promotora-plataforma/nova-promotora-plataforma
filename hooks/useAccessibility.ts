'use client'

import { useEffect, useState } from 'react'

export type FontScale = 'A' | 'A+' | 'A++'

const SCALE_MAP: Record<FontScale, string> = {
  'A':   '100%',
  'A+':  '125%',
  'A++': '155%',
}

export function useAccessibility() {
  const [scale, setScale] = useState<FontScale>('A')

  useEffect(() => {
    const saved = (localStorage.getItem('nova-font-scale') as FontScale) ?? 'A'
    applyScale(saved)
    setScale(saved)
  }, [])

  function applyScale(s: FontScale) {
    document.documentElement.style.fontSize = SCALE_MAP[s]
  }

  function setFontScale(s: FontScale) {
    applyScale(s)
    setScale(s)
    localStorage.setItem('nova-font-scale', s)
  }

  return { scale, setFontScale, scales: ['A', 'A+', 'A++'] as FontScale[] }
}
