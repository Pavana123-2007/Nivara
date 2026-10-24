
import { Navigate, Route, Routes } from 'react-router-dom'
import Calc from './pages/Calc.jsx'
import Nivara from './pages/Nivara.jsx'
import Verify from './pages/Verify.jsx'
import Notes from './pages/Notes.jsx'
import RequireUnlock from './features/cover/RequireUnlock.jsx'
import Vault from './features/cover/Vault.jsx'
import Alert from './features/cover/Alert.jsx'

export default function App() { 
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/calc" replace />} />
      <Route path="/calc" element={<Calc />} />

      <Route element={<RequireUnlock />}>
        <Route path="/nivara" element={<Nivara />} />
        <Route path="/nivara/vault" element={<Vault />} />
        <Route path="/nivara/alert" element={<Alert />} />
      </Route>

      <Route path="/notes" element={<Notes />} />
      <Route path="/verify/:id" element={<Verify />} />

      <Route path="*" element={<Navigate to="/calc" replace />} />
    </Routes>
  )
}
