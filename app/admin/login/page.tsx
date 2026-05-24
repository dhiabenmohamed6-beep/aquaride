'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    // Simple hardcoded credentials — replace with real auth when ready
    if (username === 'flouuka69' && password === 'flouuka_hinda18vip20') {
      localStorage.setItem('aqua_admin', 'true')
      router.push('/admin/dashboard')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
      {/* Back to site button */}
      <a
        href="/"
        className="fixed top-6 left-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-cyan-500 bg-white px-4 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all"
      >
        ← Back to Site
      </a>

      <div className="bg-white rounded-[35px] shadow-2xl p-12 w-full max-w-md">
        <h1 className="text-4xl font-black mb-2">
          AQUA <span className="text-cyan-500">RIDE</span>
        </h1>
        <p className="text-slate-500 mb-10">Admin access only</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}

          <button
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 rounded-2xl transition-colors mt-2"
          >
            Sign In
          </button>
        </form>
      </div>
    </main>
  )
}
