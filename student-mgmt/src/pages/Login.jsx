import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { RiEyeLine, RiEyeOffLine, RiGraduationCapLine, RiMailLine, RiLockLine } from 'react-icons/ri'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import { authService } from '../services/api'

export default function Login() {
  const stored = typeof window !== 'undefined' && localStorage.getItem('creds')
  const initialCreds = stored ? JSON.parse(stored) : { email: '' }
  const [form, setForm] = useState({ email: initialCreds.email, password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetStage, setResetStage] = useState('request') // 'request' or 'set'
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [resetMsg, setResetMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email?.trim() || !form.password?.trim()) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try {
      const result = await authService.login(form)
      localStorage.setItem('token', result.token)
      localStorage.setItem('auth', 'true')
      const sessionUser = {
        ...(result.user || {}),
        fullName: result.user?.fullName || result.user?.full_name || result.fullName || result.name || form.email.trim().split('@')[0],
        email: result.user?.email || result.email || form.email.trim(),
        role: result.user?.role || result.role || result.user?.userType || result.user?.user_type,
      }
      localStorage.setItem('user', JSON.stringify(sessionUser))
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Unable to sign in. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  const openReset = () => {
    setResetEmail('')
    setResetStage('request')
    setResetMsg('')
    setNewPw('')
    setConfirmPw('')
    setIsModalOpen(true)
  }

  const handleRequestReset = async () => {
    setResetMsg('')
    if (!resetEmail.trim()) { setResetMsg('Please enter your email'); return }
    // Validate email domain
    if (!resetEmail.toLowerCase().endsWith('@school.edu')) {
      setResetMsg('Email must end with @school.edu')
      return
    }
    await new Promise(r => setTimeout(r, 600))
    // Accept any email with @school.edu domain
    // prefill login email so user doesn't have to re-type it
    setForm(f => ({ ...f, email: resetEmail }))
    setResetStage('set')
  }

  const handleSetNewPassword = async () => {
    setResetMsg('')
    if (!newPw.trim() || !confirmPw.trim()) { setResetMsg('Please fill in both fields'); return }
    if (newPw !== confirmPw) { setResetMsg('Passwords do not match'); return }
    if (newPw.length < 3) { setResetMsg('Password must be at least 3 characters'); return }
    await new Promise(r => setTimeout(r, 600))
    // Store new credentials
    const updatedCreds = { email: resetEmail, password: newPw }
    localStorage.setItem('creds', JSON.stringify(updatedCreds))
    // prefill login form so user can immediately sign in
    setForm({ email: updatedCreds.email, password: updatedCreds.password })
    setResetMsg('✓ Password updated! Closing modal...')
    setTimeout(() => {
      setIsModalOpen(false)
    }, 1200)
  }

  return (
    <div className="M1 min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="M2 w-full max-w-sm">
        <div className="M3 text-center mb-8">
          <div className="M4 inline-flex items-center justify-center w-14 h-14 bg-blue-500 rounded-2xl mb-4 shadow-lg">
            <RiGraduationCapLine size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">EduManage</h1>
          <p className="text-blue-200/70 text-sm mt-1">Student Management System</p>
        </div>

        <div className="M5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-7 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-1">Sign in</h2>
          <p className="text-sm text-slate-400 mb-6">Welcome back. Sign in to continue.</p>

          {location.state?.message && <div role="status" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm rounded-lg px-4 py-2.5 mb-4">{location.state.message}</div>}

          {/* Info Box */}
          <div className="M6 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 mb-6">
            <p className="text-xs text-blue-200">Sign in with an account registered in the school management system.</p>
          </div>

          {error && (
            <div className="M7 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-2.5 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="M8 space-y-4">
            <div className="M9 flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <RiMailLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  className="w-full bg-white/10 border border-white/10 text-white placeholder:text-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@school.edu"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="M10 flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <RiLockLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="w-full bg-white/10 border border-white/10 text-white placeholder:text-slate-500 rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPw ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs mt-1">
              <button type="button" onClick={openReset} className="text-blue-300 hover:underline">Forgot password?</button>
            </div>

            <Button type="submit" loading={loading} className="w-full justify-center mt-2">
              Sign in to dashboard
            </Button>
          </form>

          <p className="M11 text-center text-xs text-slate-500 mt-5">
            Need help? Click <span className="text-blue-300">"Forgot password?"</span> to reset your credentials
          </p>
          <p className="text-center text-sm text-slate-400 mt-4">New to EduManage? <Link to="/register" className="text-blue-300 hover:underline">Create an account</Link></p>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={resetStage === 'request' ? 'Reset password' : 'Set new password'}>
        {resetStage === 'request' ? (
          <div className="space-y-4">
            {resetMsg && <div className="text-sm text-red-500">{resetMsg}</div>}
            <Input label="Email" placeholder="you@school.edu" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button className="ml-2" onClick={handleRequestReset}>Continue</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {resetMsg && <div className="text-sm text-emerald-600">{resetMsg}</div>}
            <Input label="New password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} />
            <Input label="Confirm password" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button className="ml-2" onClick={handleSetNewPassword}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
