
import { Navigate, Route, Routes } from 'react-router-dom'
import Calc from './pages/Calc.jsx'
import Nivara from './pages/Nivara.jsx'
import Verify from './pages/Verify.jsx'
import ProveFake from './features/unmask/ProveFake.jsx'
import Report from './features/unmask/Report.jsx'
import Takedown from './features/unmask/Takedown.jsx'
import HelpFinder from './features/unmask/HelpFinder.jsx'
import SafeShareScan from './features/unmask/SafeShareScan.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/nivara/prove" element={<ProveFake />} />
      <Route path="/nivara/report" element={<Report />} />
      <Route path="/nivara/takedown" element={<Takedown />} />
      <Route path="/nivara/help" element={<HelpFinder />} />
      <Route path="/" element={<Navigate to="/calc" replace />} />
      <Route path="/calc" element={<Calc />} />
      <Route path="/nivara" element={<Nivara />} />
      <Route path="/verify/:id" element={<Verify />} />
      <Route path="*" element={<Navigate to="/calc" replace />} />
      <Route path="/nivara/safeshare-scan" element={<SafeShareScan />} />
    </Routes>
  )
}
