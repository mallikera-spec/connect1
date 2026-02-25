import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')

    useEffect(() => {
        const root = document.documentElement
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
        } else {
            root.setAttribute('data-theme', theme)
        }
        localStorage.setItem('theme', theme)
    }, [theme])

    // Also respond to system preference changes when in 'system' mode
    useEffect(() => {
        if (theme !== 'system') return
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (e) => {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
        }
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [theme])

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
