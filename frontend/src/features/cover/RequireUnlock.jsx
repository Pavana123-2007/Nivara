import { Navigate, Outlet } from 'react-router-dom'
import { isUnlocked } from './session.js'

export default function RequireUnlock() {
  return isUnlocked() ? <Outlet /> : <Navigate to="/calc" replace />
}