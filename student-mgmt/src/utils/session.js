export function getSessionUser() {
  try {
    const raw = localStorage.getItem('user')
    const user = raw ? JSON.parse(raw) : {}
    // The backend issues a fresh JWT at login with the role read from the
    // database. Prefer that claim so stale user data cannot hide admin UI.
    const token = localStorage.getItem('token')
    const payload = token?.split('.')?.[1]
    if (payload) {
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
      const claims = JSON.parse(atob(normalizedPayload))
      const tokenRole = claims.role || claims.roles?.[0] || claims.authorities?.[0]
      if (tokenRole) return { ...user, role: tokenRole }
    }
    return user
  } catch {
    return null
  }
}

export function getDisplayName(user) {
  return user?.fullName || user?.full_name || user?.name || user?.email?.split('@')[0] || 'School user'
}

export function getUserRole(user) {
  const rawRole = user?.role ?? user?.userType ?? user?.user_type ?? user?.roles?.[0] ?? user?.authorities?.[0] ?? ''
  const role = typeof rawRole === 'object'
    ? rawRole.name || rawRole.role || rawRole.authority || ''
    : rawRole

  return String(role)
    .trim()
    .toLowerCase()
    .replace(/^role_/, '')
}

export function isAdminUser(user) {
  const role = getUserRole(user)
  return role === 'admin' || role === 'administrator'
}
