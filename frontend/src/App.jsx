import { Navigate, Route, Routes } from 'react-router-dom'
import Calc from './pages/Calc.jsx'
import Nivara from './pages/Nivara.jsx'
import Verify from './pages/Verify.jsx'
import Notes from './pages/Notes.jsx'
import RequireUnlock from './features/cover/RequireUnlock.jsx'
import ShakeGuard from './features/cover/ShakeGuard.jsx'
import Vault from './features/cover/Vault.jsx'
import Alert from './features/cover/Alert.jsx'
import Settings from './pages/Settings.jsx'
import ProveFake from './features/unmask/ProveFake.jsx'
import Report from './features/unmask/Report.jsx'
import HelpFinder from './features/unmask/HelpFinder.jsx'
import SafeShareScan from './features/unmask/SafeShareScan.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/calc" replace />} />
      <Route path="/calc" element={<Calc />} />
      <Route path="/notes" element={<Notes />} />
      <Route path="/verify/:id" element={<Verify />} />

      <Route element={<RequireUnlock />}>
        <Route element={<ShakeGuard />}>
          <Route path="/nivara" element={<Nivara />} />
          <Route path="/nivara/vault" element={<Vault />} />
          <Route path="/nivara/alert" element={<Alert />} />
          <Route path="/nivara/settings" element={<Settings />} />
          <Route path="/nivara/prove" element={<ProveFake />} />
          <Route path="/nivara/report" element={<Report />} />
          <Route path="/nivara/help" element={<HelpFinder />} />
          <Route path="/nivara/safeshare-scan" element={<SafeShareScan />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/calc" replace />} />
    </Routes>
  )
}