import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/shared/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1E293B',
            color: '#F1F5F9',
            border: '1px solid #334155',
          },
        }}
      />
    </ErrorBoundary>
  </StrictMode>
)
