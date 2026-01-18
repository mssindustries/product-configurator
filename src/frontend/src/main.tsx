import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: StrictMode disabled due to incompatibility with React Three Fiber
// R3F doesn't handle double-invocation of lifecycle methods well
createRoot(document.getElementById('root')!).render(<App />)
