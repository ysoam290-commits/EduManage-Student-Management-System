import { mockStudents, mockClasses, mockAttendance, mockActivities } from '../data/mockData'

const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8081"
).replace(/\/$/, "");

const readApiError = async (response) => {
  let message = `Request failed (${response.status})`
  try {
    const raw = await response.text()
    if (!raw) return new Error(message)
    try {
      const body = JSON.parse(raw)
      message = typeof body === 'string' ? body : body.message || body.error || message
    } catch {
      message = raw
    }
  } catch {
    // Keep the status based message when the backend returns no readable body.
  }
  return new Error(message)
}

export const authService = {
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    if (!response.ok) throw await readApiError(response)
    return response.json()
  },
  register: async (details) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    })
    if (!response.ok) throw await readApiError(response)
    const body = await response.text()
    if (!body) return {}
    try {
      return JSON.parse(body)
    } catch {
      return { message: body }
    }
  },
}

// Simple in-memory pub/sub for UI notifications
const createPubSub = () => {
  const listeners = {}
  return {
    on: (evt, fn) => { listeners[evt] = listeners[evt] || []; listeners[evt].push(fn); return () => { listeners[evt] = (listeners[evt] || []).filter(f => f !== fn) } },
    off: (evt, fn) => { if (!listeners[evt]) return; listeners[evt] = listeners[evt].filter(f => f !== fn) },
    emit: (evt, payload) => { (listeners[evt] || []).slice().forEach(f => { try { f(payload) } catch (e) {} }) }
  }
}

export const events = createPubSub()

const STORAGE_KEYS = {
  students: 'student-mgmt-students',
  classes: 'student-mgmt-classes',
  attendance: 'student-mgmt-attendance',
  activities: 'student-mgmt-activities',
}

const loadStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (error) {
    return fallback
  }
}

const saveStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    // ignore storage failures
  }
}

let students = loadStorage(STORAGE_KEYS.students, [...mockStudents])
let classes = loadStorage(STORAGE_KEYS.classes, [...mockClasses])
let attendance = loadStorage(STORAGE_KEYS.attendance, [...mockAttendance])
let activities = loadStorage(STORAGE_KEYS.activities, [...mockActivities])

const persistStudents = () => saveStorage(STORAGE_KEYS.students, students)
const persistClasses = () => saveStorage(STORAGE_KEYS.classes, classes)
const persistAttendance = () => saveStorage(STORAGE_KEYS.attendance, attendance)
const persistActivities = () => saveStorage(STORAGE_KEYS.activities, activities)

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms))

export const studentService = {
  getAll: async (filters = {}) => {
    await delay()
    let result = [...students]
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
    }
    if (filters.class) result = result.filter(s => s.class === filters.class)
    if (filters.status) result = result.filter(s => s.status === filters.status)
    if (filters.gender) result = result.filter(s => s.gender === filters.gender)
    return result
  },
  getById: async (id) => { await delay(); return students.find(s => s.id === id) },
  create: async (data) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/api/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...data, class: data.class, gpa: data.gpa === '' ? null : Number(data.gpa) }),
    })
    if (!response.ok) throw await readApiError(response)
    const student = await response.json()
    students.unshift(student)
    persistStudents()

    const activity = {
      id: Date.now(),
      type: 'add',
      message: `New student ${student.name} enrolled in ${student.class}`,
      time: 'just now',
      icon: 'student',
    }
    activities.unshift(activity)
    activities = activities.slice(0, 10)
    persistActivities()
    events.emit('activity', activity)

    return student
  },
  update: async (id, data) => {
    await delay()
    const idx = students.findIndex(s => s.id === id)
    if (idx === -1) throw new Error('Not found')
    const existing = students[idx]
    students[idx] = { ...existing, ...data }

    if (data.class && data.class !== existing.class) {
      const prevClassIdx = classes.findIndex(c => c.name === existing.class)
      if (prevClassIdx !== -1) {
        const current = Number(classes[prevClassIdx].students) || 0
        classes[prevClassIdx] = { ...classes[prevClassIdx], students: Math.max(0, current - 1) }
      }
      const nextClassIdx = classes.findIndex(c => c.name === data.class)
      if (nextClassIdx !== -1) {
        const current = Number(classes[nextClassIdx].students) || 0
        classes[nextClassIdx] = { ...classes[nextClassIdx], students: current + 1 }
      }
      persistClasses()
    }

    persistStudents()

    const activity = { id: Date.now(), type: 'edit', message: `${students[idx].name} profile updated`, time: new Date().toLocaleString(), icon: 'edit' }
    activities.unshift(activity)
    activities = activities.slice(0, 10)
    persistActivities()
    try { events.emit('activity', activity) } catch (e) {}

    return students[idx]
  },
  delete: async (id) => {
    await delay()
    const idx = students.findIndex(s => s.id === id)
    if (idx !== -1) {
      const removed = students.splice(idx, 1)[0]
      const clsIdx = classes.findIndex(c => c.name === removed.class)
      if (clsIdx !== -1) {
        const current = Number(classes[clsIdx].students) || 0
        classes[clsIdx] = { ...classes[clsIdx], students: Math.max(0, current - 1) }
        persistClasses()
      }
      persistStudents()

      const activity = { id: Date.now(), type: 'delete', message: `${removed.name} was removed`, time: new Date().toLocaleString(), icon: 'student' }
      activities.unshift(activity)
      activities = activities.slice(0, 10)
      persistActivities()
      try { events.emit('activity', activity) } catch (e) {}
    }
  },
}

export const activityService = {
  getAll: async () => { await delay(); return [...activities] },
}

export const classService = {
  getAll: async () => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/api/classes`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) throw await readApiError(response)
    return response.json()
  },
}

export const attendanceService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.date) params.set('date', filters.date)
    if (filters.class || filters.className) params.set('className', filters.class || filters.className)
    const query = params.toString()
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/api/attendance${query ? `?${query}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) throw await readApiError(response)
    return response.json()
  },
  getStudentsByClass: async (className) => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams({ class: className })
    const response = await fetch(`${API_BASE_URL}/api/students?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) throw await readApiError(response)
    return response.json()
  },
  saveBulk: async ({ className, date, records }) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/api/attendance/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ className, date, records }),
    })
    if (!response.ok) throw await readApiError(response)
    return response.json()
  },
}
