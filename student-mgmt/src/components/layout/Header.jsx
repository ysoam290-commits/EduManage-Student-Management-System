import React from 'react'
import { useLocation } from 'react-router-dom'
import { RiMenuLine } from 'react-icons/ri'
import { getDisplayName, getSessionUser, getUserRole } from '../../utils/session'

const titles = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/classes': 'Classes',
  '/attendance': 'Attendance',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

export default function Header({ collapsed, onMobileOpen }) {
  const location = useLocation()
  const title = Object.entries(titles).find(([path]) => location.pathname.startsWith(path))?.[1] || 'EduManage'
  const user = getSessionUser()
  const name = getDisplayName(user)
  const initials = name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()
  const role = getUserRole(user)
  const roleLabel = role === 'admin' || role === 'administrator' ? 'Admin' : role === 'user' ? 'User' : 'Unknown role'

  return (
    <header className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-100 z-30 flex items-center px-4 sm:px-6 gap-4 transition-all duration-300 ${collapsed ? 'md:left-16' : 'md:left-60'} left-0`}>
      <button onClick={onMobileOpen} className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
        <RiMenuLine size={20} />
      </button>
      <div>
        <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
        <p className="text-xs text-gray-400">
          {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">{initials}</div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-tight max-w-36 truncate">{name}</p>
            <p className="text-xs text-gray-400">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
