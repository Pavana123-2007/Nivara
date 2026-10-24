
import { Navigate, Route, Routes } from 'react-router-dom'
import Calc from './pages/Calc.jsx'
import Nivara from './pages/Nivara.jsx'
import Verify from './pages/Verify.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/calc" replace />} />
      <Route path="/calc" element={<Calc />} />
      <Route path="/nivara" element={<Nivara />} />
      <Route path="/verify/:id" element={<Verify />} />
      <Route path="*" element={<Navigate to="/calc" replace />} />
    </Routes>
  )
}
