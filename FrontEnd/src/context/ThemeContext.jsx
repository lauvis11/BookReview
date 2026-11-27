import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'bookreview-theme'
const ThemeContext = createContext(null)

function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    // ignore storage errors
  }
  return null
}

function getInitialTheme() {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'dark'
  }
  return getStoredTheme() || getSystemTheme()
}

function applyThemeToDocument(nextTheme, suppressTransitions = false) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  if (suppressTransitions) {
    root.classList.add('disable-theme-transitions')
  }

  const dark = nextTheme === 'dark'
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'

  if (suppressTransitions) {
    // Force synchronous style flush so new colors commit while transitions are disabled
    void root.offsetHeight
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('disable-theme-transitions')
      })
    })
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)

  // Keep DOM synchronized on mount without triggering transition smear
  useEffect(() => {
    applyThemeToDocument(theme, false)
  }, [theme])

  // Follow OS theme changes when the user hasn't explicitly chosen a theme
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemChange = (event) => {
      if (getStoredTheme() !== null) return
      const nextTheme = event.matches ? 'dark' : 'light'
      applyThemeToDocument(nextTheme, true)
      setThemeState(nextTheme)
    }

    mql.addEventListener('change', handleSystemChange)
    return () => mql.removeEventListener('change', handleSystemChange)
  }, [])

  const setTheme = useCallback((nextTheme) => {
    const resolved = nextTheme === 'dark' ? 'dark' : 'light'
    try {
      localStorage.setItem(STORAGE_KEY, resolved)
    } catch {
      // ignore storage errors
    }
    applyThemeToDocument(resolved, true)
    setThemeState(resolved)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // ignore storage errors
      }
      applyThemeToDocument(next, true)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}
