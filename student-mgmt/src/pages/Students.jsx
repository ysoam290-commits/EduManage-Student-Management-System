import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiUserAddLine, RiLayoutGridLine, RiListCheck, RiSearchLine } from 'react-icons/ri'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import StudentForm from '../components/students/StudentForm'
import StudentTable from '../components/students/StudentTable'
import StudentCard from '../components/students/StudentCard'
import { Select } from '../components/common/Input'
import { studentService } from '../services/api'
import { classOptions, statusOptions } from '../data/mockData'
import { getSessionUser, getUserRole, isAdminUser } from '../utils/session'

export default function Students() {
  const navigate = useNavigate()
  const sessionUser = getSessionUser()
  const sessionRole = getUserRole(sessionUser)
  const canManageStudents = isAdminUser(sessionUser)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('table')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ class: '', status: '' })
  const [modal, setModal] = useState(null) // 'edit' | 'delete'
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await studentService.getAll({ search, ...filters })
      setStudents(data)
    } finally { setLoading(false) }
  }, [search, filters])

  useEffect(() => { load() }, [load])

  const paged = students

  const handleEdit = async (data) => {
    setSaving(true)
    try { await studentService.update(selected.id, data); await load(); setModal(null) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try { await studentService.delete(selected.id); await load(); setModal(null) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${canManageStudents ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          Signed in as {sessionRole === 'administrator' ? 'Admin' : sessionRole ? sessionRole.toUpperCase() : 'Unknown role'}
        </span>
        <div className="relative flex-1 min-w-[200px]">
          <RiSearchLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name, ID, or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filters.class} onChange={e => setFilters(f => ({ ...f, class: e.target.value }))} className="w-36 text-sm">
          <option value="">All classes</option>
          {classOptions.map(c => <option key={c}>{c}</option>)}
        </Select>
        <Select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="w-32 text-sm">
          <option value="">All status</option>
          {statusOptions.map(s => <option key={s}>{s}</option>)}
        </Select>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setView('table')} className={`px-3 py-2 text-sm transition-colors ${view === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><RiListCheck size={16} /></button>
          <button onClick={() => setView('grid')} className={`px-3 py-2 text-sm transition-colors ${view === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><RiLayoutGridLine size={16} /></button>
        </div>
        {canManageStudents && <Button icon={<RiUserAddLine size={15} />} onClick={() => navigate('/students/add')}>
          Add new student
        </Button>}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
          <p className="text-sm text-gray-500"><span className="font-semibold text-gray-800">{students.length}</span> students found</p>
        </div>

        {view === 'table' ? (
          <StudentTable
            students={paged}
            loading={loading}
            onEdit={s => { setSelected(s); setModal('edit') }}
            onDelete={s => { setSelected(s); setModal('delete') }}
            canManage={canManageStudents}
          />
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : paged.map(s => (
              <StudentCard
                key={s.id}
                student={s}
                onEdit={s => { setSelected(s); setModal('edit') }}
                onDelete={s => { setSelected(s); setModal('delete') }}
                canManage={canManageStudents}
              />
            ))}
          </div>
        )}

      </div>

      {canManageStudents && <Modal isOpen={modal === 'edit'} onClose={() => setModal(null)} title="Edit student" size="lg">
        <StudentForm initial={selected} onSubmit={handleEdit} onCancel={() => setModal(null)} loading={saving} />
      </Modal>}

      {canManageStudents && <Modal isOpen={modal === 'delete'} onClose={() => setModal(null)} title="Delete student" size="sm">
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete <span className="font-semibold text-gray-800">{selected?.name}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>Delete student</Button>
        </div>
      </Modal>}
    </div>
  )
}
