import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IconContext } from 'react-icons'
import './css/index.css'
import App from './App.jsx'

// apply saved theme before first paint to avoid a flash
document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light')

createRoot(document.getElementById('root')).render(
  <IconContext.Provider value={{ attr: { strokeWidth: 1.5 } }}>
    <App />
  </IconContext.Provider>
  ,
)
