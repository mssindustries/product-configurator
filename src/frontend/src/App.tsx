// Test PR preview URL comment
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import AdminPage from './pages/AdminPage'
import ClientsPage from './pages/ClientsPage'
import NotFoundPage from './pages/NotFoundPage'
import StyleGuidePage from './pages/StyleGuidePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AdminPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="style-guide" element={<StyleGuidePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
