import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { I18nProvider } from '@/i18n'
import { ThemeProvider, applyTheme, prefersDarkNow } from '@/theme'
import './index.css'

// Applied before the first paint so the panel does not flash white in a dark
// browser. The stored choice, if any, corrects it a moment later.
applyTheme(prefersDarkNow() ? 'dark' : 'light')

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root')

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)
