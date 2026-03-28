import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AuthGate } from './components/AuthGate'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AuthGate>
  </StrictMode>,
)
