import React, { useState } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import Students from '../pages/Students'
import AddStudent from '../pages/AddStudent'
import StudentDetails from '../pages/StudentDetails'
import Classes from '../pages/Classes'
import Attendance from '../pages/Attendance'
import Reports from '../pages/Reports'
import Settings from '../pages/Settings'
import { getSessionUser, isAdminUser } from '../utils/session'

function ProtectedLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isAuth = localStorage.getItem('auth') === 'true'
  if (!isAuth) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        collapsed={collapsed}
        sidebarOpen={sidebarOpen}
        onToggle={() => setCollapsed(c => !c)}
        onClose={() => setSidebarOpen(false)}
      />
      <Header collapsed={collapsed} onMobileOpen={() => setSidebarOpen(true)} />
      <main className={`pt-16 transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-60'} ml-0`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default function AppRoutes() {
  // Re-read the signed-in role after navigation, including after login updates storage.
  useLocation()
  const isAdmin = isAdminUser(getSessionUser())
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/students/add" element={isAdmin ? <AddStudent /> : <Navigate to="/students" replace />} />
        <Route path="/students/:id" element={<StudentDetails />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={isAdmin ? <Settings /> : <Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
