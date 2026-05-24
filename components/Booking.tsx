'use client'

import { useState, useEffect } from 'react'
import { generateId } from '@/lib/reservations'

// ─── Service catalogue — loaded from API ─────────────
const TIME_SLOTS = [
  '08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00',
]

const PAYMENT_METHODS = [
  { id: 'cash',     label: 'Cash',          icon: '💵' },
  { id: 'transfer', label: 'Bank Transfer', icon: '🏦' },
  { id: 'edinar',   label: 'E-Dinar',       icon: '📱' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
type ServiceEntry = { id: string; label: string; basePrice: number; perPerson: boolean; hourly: boolean; description: string }

function calcPrice(serviceId: string, people: number, hours: number, services: ServiceEntry[]): number {
  const svc = services.find(s => s.id === serviceId)
  if (!svc) return 0
  let price = svc.basePrice
  if (svc.perPerson) price *= Math.max(1, people)
  if (svc.hourly)    price *= Math.max(1, hours)
  return price
}

// ─── Confirmation popup ───────────────────────────────────────────────────────
function ConfirmationPopup({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* card */}
      <div
        className="relative bg-white rounded-[40px] p-12 max-w-md w-full text-center shadow-2xl"
        style={{ animation: 'popIn .4s cubic-bezier(.34,1.56,.64,1) both' }}
      >
        {/* success ring */}
        <div className="relative mx-auto mb-8 w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-cyan-100 animate-ping opacity-60" />
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-cyan-500 text-white text-5xl">
            ✓
          </div>
        </div>

        <h2 className="text-4xl font-black mb-3">Booking Confirmed!</h2>
        <p className="text-slate-500 text-lg mb-8">
          Thank you, <span className="font-bold text-cyan-500">{name || 'Guest'}</span>!<br />
          We'll contact you shortly to finalise your experience.
        </p>

        <button
          onClick={onClose}
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-10 py-4 rounded-2xl transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Booking() {
  const [SERVICES, setSERVICES] = useState<ServiceEntry[]>([])
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    service: '',
    date: '', time: '',
    people: 1, hours: 1,
    message: '',
    payment: 'cash',
  })

  useEffect(() => {
    async function loadServices() {
      const res = await fetch('/api/services')
      const data = await res.json()
      const visible = data.filter((s: ServiceEntry) => s.visible)
      setSERVICES(visible.map((s: ServiceEntry) => ({ id: s.id, label: s.title, basePrice: s.basePrice, perPerson: s.perPerson, hourly: s.hourly, description: s.description })))
      if (visible.length > 0) setForm(f => ({ ...f, service: visible[0].id }))
    }
    loadServices()
  }, [])

  const [total, setTotal]       = useState(0)
  const [showBadge, setShowBadge] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [errors, setErrors]     = useState<Record<string, string>>({})

  // recalculate whenever relevant fields change
  useEffect(() => {
    setTotal(calcPrice(form.service, form.people, form.hours, SERVICES))
  }, [form.service, form.people, form.hours, SERVICES])

  // show discount badge after 2 s
  useEffect(() => {
    const t = setTimeout(() => setShowBadge(true), 2000)
    return () => clearTimeout(t)
  }, [])

  function set(field: string, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim())  e.name  = 'Full name is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email is required'
    if (!form.date)         e.date  = 'Please select a date'
    if (!form.time)         e.time  = 'Please select a time'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    // persist to API
    fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: generateId(),
        createdAt: new Date().toISOString(),
        name: form.name,
        phone: form.phone,
        email: form.email,
        service: form.service,
        serviceLabel: svc.label,
        date: form.date,
        time: form.time,
        people: form.people,
        hours: form.hours,
        message: form.message,
        payment: form.payment,
        total,
        status: 'pending',
        adminNote: '',
        discount: 0,
      })
    })

    setConfirmed(true)
  }

  const svc = SERVICES.find(s => s.id === form.service) ?? SERVICES[0]

  return (
    <>
      <style>{`
        @keyframes popIn {
          from { opacity:0; transform:scale(.7) }
          to   { opacity:1; transform:scale(1)  }
        }
        @keyframes floatY {
          0%,100% { transform:translateY(0)   }
          50%      { transform:translateY(-8px) }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow:0 0 12px 2px rgba(6,182,212,.5) }
          50%      { box-shadow:0 0 28px 8px rgba(6,182,212,.9) }
        }
        @keyframes badgeIn {
          from { opacity:0; transform:translateX(20px) scale(.8) }
          to   { opacity:1; transform:translateX(0)    scale(1)  }
        }
        .float-card  { animation:floatY 4s ease-in-out infinite }
        .glow-badge  { animation:glowPulse 2s ease-in-out infinite }
        .badge-enter { animation:badgeIn .5s cubic-bezier(.34,1.56,.64,1) both }
      `}</style>

      <section id="booking" className="relative py-28 px-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#062B37 0%,#0a3d4f 50%,#062B37 100%)' }}
      >
        {/* decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#06b6d4,transparent)', filter:'blur(60px)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background:'radial-gradient(circle,#06b6d4,transparent)', filter:'blur(60px)' }} />

        <div className="max-w-7xl mx-auto relative z-10">

          {/* heading */}
          <div className="text-center mb-16">
            <p className="uppercase tracking-[5px] text-cyan-400 mb-4 text-sm">Reserve Your Experience</p>
            <h2 className="text-6xl font-black text-white">
              Book Your <span className="text-cyan-400">Luxury</span> Journey
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-10 items-start">

            {/* ── FORM ── */}
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-2 rounded-[40px] p-10"
              style={{
                background: 'rgba(255,255,255,.07)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,.12)',
              }}
            >
              <h3 className="text-3xl font-bold text-white mb-8">Your Details</h3>

              {/* row 1 */}
              <div className="grid md:grid-cols-2 gap-5 mb-5">
                <div>
                  <input
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1 ml-1">{errors.name}</p>}
                </div>
                <div>
                  <input
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="Phone Number"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  {errors.phone && <p className="text-red-400 text-xs mt-1 ml-1">{errors.phone}</p>}
                </div>
              </div>

              {/* email */}
              <div className="mb-5">
                <input
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="Email Address"
                  type="email"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-cyan-400 transition-colors"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1 ml-1">{errors.email}</p>}
              </div>

              {/* service */}
              <div className="mb-5">
                <label className="block text-white/60 text-sm mb-2 ml-1">Select Service</label>
                <select
                  value={form.service}
                  onChange={e => set('service', e.target.value)}
                  className="w-full bg-[#062B37] border border-white/20 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-cyan-400 transition-colors"
                >
                  {SERVICES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* date + time */}
              <div className="grid md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-white/60 text-sm mb-2 ml-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => set('date', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  {errors.date && <p className="text-red-400 text-xs mt-1 ml-1">{errors.date}</p>}
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2 ml-1">Time</label>
                  <select
                    value={form.time}
                    onChange={e => set('time', e.target.value)}
                    className="w-full bg-[#062B37] border border-white/20 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-cyan-400 transition-colors"
                  >
                    <option value="">Choose a time</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.time && <p className="text-red-400 text-xs mt-1 ml-1">{errors.time}</p>}
                </div>
              </div>

              {/* people + hours */}
              <div className="grid md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-white/60 text-sm mb-2 ml-1">Number of People</label>
                  <div className="flex items-center gap-3">
                    <button type="button"
                      onClick={() => set('people', Math.max(1, form.people - 1))}
                      className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white text-xl font-bold hover:bg-cyan-500/30 transition-colors"
                    >−</button>
                    <span className="flex-1 text-center text-white text-2xl font-black">{form.people}</span>
                    <button type="button"
                      onClick={() => set('people', Math.min(20, form.people + 1))}
                      className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white text-xl font-bold hover:bg-cyan-500/30 transition-colors"
                    >+</button>
                  </div>
                </div>

                {svc.hourly && (
                  <div>
                    <label className="block text-white/60 text-sm mb-2 ml-1">Duration (hours)</label>
                    <div className="flex items-center gap-3">
                      <button type="button"
                        onClick={() => set('hours', Math.max(1, form.hours - 1))}
                        className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white text-xl font-bold hover:bg-cyan-500/30 transition-colors"
                      >−</button>
                      <span className="flex-1 text-center text-white text-2xl font-black">{form.hours}h</span>
                      <button type="button"
                        onClick={() => set('hours', Math.min(12, form.hours + 1))}
                        className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white text-xl font-bold hover:bg-cyan-500/30 transition-colors"
                      >+</button>
                    </div>
                  </div>
                )}
              </div>

              {/* message */}
              <div className="mb-8">
                <label className="block text-white/60 text-sm mb-2 ml-1">Special Requests (optional)</label>
                <textarea
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  rows={3}
                  placeholder="Any special requests or notes..."
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-2xl px-5 py-4 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                />
              </div>

              {/* payment */}
              <div className="mb-10">
                <label className="block text-white/60 text-sm mb-3 ml-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-4">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => set('payment', pm.id)}
                      className={`flex flex-col items-center gap-2 py-5 rounded-2xl border transition-all font-semibold text-sm
                        ${form.payment === pm.id
                          ? 'bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/30'
                          : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                        }`}
                    >
                      <span className="text-2xl">{pm.icon}</span>
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* submit */}
              <button
                type="submit"
                className="w-full py-5 rounded-2xl font-black text-xl text-white transition-all hover:scale-[1.02] active:scale-[.98]"
                style={{
                  background: 'linear-gradient(135deg,#06b6d4,#0891b2)',
                  boxShadow: '0 8px 32px rgba(6,182,212,.4)',
                }}
              >
                Confirm Reservation →
              </button>
            </form>

            {/* ── PRICE SUMMARY CARD ── */}
            <div className="lg:sticky lg:top-28 float-card">
              <div
                className="rounded-[35px] p-8"
                style={{
                  background: 'rgba(255,255,255,.08)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,.15)',
                }}
              >
                <h3 className="text-white font-bold text-xl mb-6">Price Summary</h3>

                {/* service line */}
                <div className="flex justify-between text-white/70 text-sm mb-3">
                  <span>Service</span>
                  <span className="text-white font-semibold">{svc.label}</span>
                </div>

                {/* people line */}
                <div className="flex justify-between text-white/70 text-sm mb-3">
                  <span>People</span>
                  <span className="text-white font-semibold">{form.people}</span>
                </div>

                {/* hours line (only for hourly services) */}
                {svc.hourly && (
                  <div className="flex justify-between text-white/70 text-sm mb-3">
                    <span>Duration</span>
                    <span className="text-white font-semibold">{form.hours}h</span>
                  </div>
                )}

                {/* date + time */}
                {form.date && (
                  <div className="flex justify-between text-white/70 text-sm mb-3">
                    <span>Date</span>
                    <span className="text-white font-semibold">{form.date}</span>
                  </div>
                )}
                {form.time && (
                  <div className="flex justify-between text-white/70 text-sm mb-3">
                    <span>Time</span>
                    <span className="text-white font-semibold">{form.time}</span>
                  </div>
                )}

                {/* payment */}
                <div className="flex justify-between text-white/70 text-sm mb-6">
                  <span>Payment</span>
                  <span className="text-white font-semibold">
                    {PAYMENT_METHODS.find(p => p.id === form.payment)?.label}
                  </span>
                </div>

                <div className="border-t border-white/15 pt-6 mb-4">
                  <div className="flex justify-between items-end">
                    <span className="text-white/70">Total</span>
                    <span
                      className="text-5xl font-black text-cyan-400"
                      style={{ transition: 'all .3s ease' }}
                    >
                      {total} <span className="text-2xl">DT</span>
                    </span>
                  </div>
                </div>

                {/* discount badge */}
                {showBadge && (
                  <div
                    className="badge-enter glow-badge mt-4 rounded-2xl px-4 py-3 text-center text-sm font-bold text-white"
                    style={{
                      background: 'linear-gradient(135deg,rgba(6,182,212,.3),rgba(8,145,178,.3))',
                      border: '1px solid rgba(6,182,212,.5)',
                    }}
                  >
                    ✨ We can offer discounts anytime
                  </div>
                )}

                {/* base price note */}
                <p className="text-white/40 text-xs text-center mt-4">
                  Base price: {svc.basePrice} DT
                  {svc.perPerson ? ' × people' : ''}
                  {svc.hourly ? ' × hours' : ''}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CONFIRMATION POPUP ── */}
      {confirmed && (
        <ConfirmationPopup
          name={form.name}
          onClose={() => {
            setConfirmed(false)
            setForm({
              name:'', phone:'', email:'',
              service: SERVICES[0].id,
              date:'', time:'',
              people:1, hours:1,
              message:'',
              payment:'cash',
            })
          }}
        />
      )}
    </>
  )
}
