import { Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Home from '../pages/Home'
import Users from '../pages/admin/Users'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
  <Route path="/admin/users" element={<Users />} />
      </Route>
    </Routes>
  )
}
