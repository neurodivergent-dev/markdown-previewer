import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { AIProviderProvider } from './contexts/AIProviderContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AIProviderProvider>
        <App />
      </AIProviderProvider>
    </AuthProvider>
  </StrictMode>,
)
