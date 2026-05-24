'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Reservation, ReservationStatus } from '@/lib/reservations'
import type { Service } from '@/lib/services'
import type { BannerSettings } from '@/lib/banner'
import ImageCropper from '@/components/ImageCropper'

const PAYMENT_LABELS: Record<string, string> = { cash:'Cash', transfer:'Bank Transfer', edinar:'E-Dinar' }

const STATUS_META: Record<ReservationStatus, { bg:string; text:string; dot:string; light:string }> = {
  pending:   { bg:'bg-amber-500',  text:'text-amber-700',  dot:'bg-amber-400',  light:'bg-amber-50 text-amber-700 border-amber-200'  },
  confirmed: { bg:'bg-cyan-500',   text:'text-cyan-700',   dot:'bg-cyan-400',   light:'bg-cyan-50 text-cyan-700 border-cyan-200'     },
  waiting:   { bg:'bg-blue-500',   text:'text-blue-700',   dot:'bg-blue-400',   light:'bg-blue-50 text-blue-700 border-blue-200'     },
  cancelled: { bg:'bg-red-500',    text:'text-red-700',    dot:'bg-red-400',    light:'bg-red-50 text-red-600 border-red-200'        },
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const cols = ['bg-cyan-500','bg-teal-500','bg-sky-500','bg-indigo-500','bg-emerald-500']
  return <div className={`w-9 h-9 rounded-full ${cols[name.charCodeAt(0)%cols.length]} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>{initials}</div>
}

// ── Mini bar chart (CSS only) ─────────────────────────────────────────────────
function BarChart({ data, color='bg-cyan-500' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className={`w-full rounded-t-lg ${color} opacity-80 transition-all`} style={{ height:`${(v/max)*100}%`, minHeight: v>0?'4px':'0' }} />
        </div>
      ))}
    </div>
  )
}

// ── Donut chart (SVG) ─────────────────────────────────────────────────────────
function DonutChart({ segments }: { segments: { value:number; color:string; label:string }[] }) {
  const total = segments.reduce((s,x)=>s+x.value,0) || 1
  let offset = 0
  const r = 40, cx = 50, cy = 50, stroke = 14
  const circ = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-6">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {segments.map((seg, i) => {
          const pct = seg.value / total
          const dash = pct * circ
          const gap  = circ - dash
          const rot  = offset * 360 - 90
          offset += pct
          return (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={0}
              transform={`rotate(${rot} ${cx} ${cy})`}
              style={{ transition:'stroke-dasharray .6s ease' }} />
          )
        })}
        <circle cx={cx} cy={cy} r={r-stroke/2-2} fill="white" />
      </svg>
      <div className="flex flex-col gap-2">
        {segments.map((s,i)=>(
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:s.color }} />
            <span className="text-slate-500">{s.label}</span>
            <span className="font-bold text-slate-700 ml-auto pl-3">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Drawer ────────────────────────────────────────────────────────────────────
function Drawer({ res, onClose, onUpdate, onDelete }: {
  res: Reservation; onClose: ()=>void; onUpdate:(r:Reservation)=>void; onDelete:(id:string)=>void
}) {
  const [note, setNote]         = useState(res.adminNote)
  const [discount, setDiscount] = useState(res.discount)
  const [confirmDel, setConfirmDel]     = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailStatus, setEmailStatus]   = useState<'idle'|'sent'|'error'>('idle')
  const [emailError, setEmailError]     = useState('')
  const discountedTotal = Math.round(res.total * (1 - discount / 100))

  async function save(patch: Partial<Reservation>) {
    const updated = { ...res, ...patch }
    onUpdate(updated)
    if (patch.status === 'confirmed' && res.status !== 'confirmed') {
      setEmailSending(true); setEmailStatus('idle')
      try {
        const resp = await fetch('/api/send-confirmation', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ name:updated.name, email:updated.email, serviceLabel:updated.serviceLabel,
            date:updated.date, time:updated.time, people:updated.people, hours:updated.hours,
            payment:updated.payment, total:updated.total, discount:updated.discount, id:updated.id, adminNote:updated.adminNote }),
        })
        if (resp.ok) setEmailStatus('sent')
        else { const j=await resp.json().catch(()=>({})); setEmailError(j.error??`HTTP ${resp.status}`); setEmailStatus('error') }
      } catch(err) { setEmailError(err instanceof Error?err.message:'Network error'); setEmailStatus('error') }
      finally { setEmailSending(false) }
    }
  }

  const sm = STATUS_META[res.status]

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
        style={{ animation:'slideIn .3s ease both', borderLeft:'1px solid #e2e8f0' }}>

        <div className="sticky top-0 bg-white border-b px-7 py-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Avatar name={res.name} />
            <div>
              <p className="font-black text-slate-800 text-lg leading-tight">{res.name}</p>
              <p className="text-xs font-mono text-slate-400">{res.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xl transition-colors">×</button>
        </div>

        <div className="p-7 flex flex-col gap-5 flex-1">
          {/* Status */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status</p>
            <div className="grid grid-cols-2 gap-2">
              {(['pending','confirmed','waiting','cancelled'] as ReservationStatus[]).map(s => {
                const m = STATUS_META[s]
                return (
                  <button key={s} onClick={()=>save({status:s})} disabled={emailSending}
                    className={`py-2.5 rounded-xl text-sm font-bold capitalize transition-all border
                      ${res.status===s ? m.light+' border-current scale-[1.02] shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}
                      disabled:opacity-50`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${m.dot}`} />
                    {s==='confirmed'&&emailSending?'Sending…':s}
                  </button>
                )
              })}
            </div>
            {emailSending && <div className="mt-3 text-xs text-cyan-600 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 flex items-center gap-2"><span className="animate-spin">⏳</span>Sending email to {res.email}…</div>}
            {emailStatus==='sent' && <div className="mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">✅ Email sent to <strong>{res.email}</strong></div>}
            {emailStatus==='error' && <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">⚠️ {emailError}</div>}
          </div>

          {/* Client */}
          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Client</p>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              {[['Name',res.name],['Phone',res.phone],['Email',res.email]].map(([l,v])=>(
                <><span key={l+'l'} className="text-slate-500">{l}</span><span key={l+'v'} className="font-semibold text-slate-800 truncate">{v}</span></>
              ))}
            </div>
          </div>

          {/* Booking */}
          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Booking</p>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              {[['Service',res.serviceLabel],['Date',res.date],['Time',res.time],['People',String(res.people)],
                ['Payment',PAYMENT_LABELS[res.payment]??res.payment],['Submitted',new Date(res.createdAt).toLocaleDateString()],
                ...(res.hours>1?[['Duration',`${res.hours}h`]]:[])
              ].map(([l,v])=>(
                <><span key={l+'l'} className="text-slate-500">{l}</span><span key={l+'v'} className="font-semibold text-slate-800">{v}</span></>
              ))}
            </div>
          </div>

          {res.message && (
            <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-2">Client Message</p>
              <p className="text-slate-700 text-sm leading-relaxed">{res.message}</p>
            </div>
          )}

          {/* Discount */}
          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Discount</p>
            <div className="flex items-center gap-4 mb-3">
              <input type="range" min={0} max={100} step={5} value={discount} onChange={e=>setDiscount(Number(e.target.value))} className="flex-1 accent-cyan-500" />
              <span className="text-2xl font-black text-cyan-500 w-14 text-right">{discount}%</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-slate-500">Original: <s>{res.total} DT</s></span>
              <span className="font-black text-slate-800 text-lg">{discountedTotal} DT</span>
            </div>
            <button onClick={()=>save({discount})} className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-cyan-500 hover:bg-cyan-600 transition-colors">Apply Discount</button>
          </div>

          {/* Message */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Message to Client</p>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="Personal message included in confirmation email…"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400 resize-none" />
            <button onClick={()=>save({adminNote:note})} className="mt-2 w-full py-2.5 rounded-xl font-bold text-sm text-white bg-slate-800 hover:bg-slate-700 transition-colors">Save Message</button>
          </div>

          {/* Delete */}
          <div className="mt-auto pt-4 border-t">
            {!confirmDel ? (
              <button onClick={()=>setConfirmDel(true)} className="w-full border-2 border-red-200 text-red-500 hover:bg-red-50 font-bold py-2.5 rounded-xl transition-colors text-sm">Delete Reservation</button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-600 text-sm mb-3">Are you sure? This cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={()=>setConfirmDel(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-sm transition-colors">Cancel</button>
                  <button onClick={()=>onDelete(res.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-sm transition-colors">Delete</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Banner Modal ──────────────────────────────────────────────────────────────
function BannerModal({ current, onSave, onClose }: {
  current: BannerSettings; onSave:(b:BannerSettings)=>void; onClose:()=>void
}) {
  const [form, setForm]         = useState<BannerSettings>(current)
  const [cropSrc, setCropSrc]   = useState<string|null>(null)
  const fileRef                 = useRef<HTMLInputElement>(null)

  function f(k: keyof BannerSettings, v: string) { setForm(p=>({...p,[k]:v})) }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCropSrc(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleCropDone(dataUrl: string) {
    f('imageUrl', dataUrl)
    setCropSrc(null)
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-[28px] shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ animation:'popIn .3s cubic-bezier(.34,1.56,.64,1) both' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-black text-slate-800">Edit Banner</h3>
              <p className="text-slate-400 text-xs mt-0.5">Changes appear on the homepage instantly</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xl transition-colors">×</button>
          </div>

          {/* Live preview */}
          <div className="relative rounded-2xl overflow-hidden mb-6 h-36"
            style={{ backgroundImage:`url('${form.imageUrl||'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800'}')`, backgroundSize:'cover', backgroundPosition:'center' }}>
            <div className="absolute inset-0" style={{ background:'linear-gradient(to bottom,rgba(6,43,55,.6),rgba(6,43,55,.3))' }} />
            <div className="relative z-10 p-5">
              <p className="text-white font-black text-2xl leading-tight">{form.title||'Title'}</p>
              <p className="text-cyan-400 font-black text-xl">{form.subtitle||'Subtitle'}</p>
              <p className="text-white/70 text-xs mt-1 line-clamp-1">{form.description}</p>
            </div>
            <span className="absolute top-3 right-3 bg-black/40 text-white text-[10px] px-2 py-1 rounded-lg">Preview</span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Image upload + URL */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Background Image</label>
              <div className="flex gap-2 mb-2">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                <button onClick={()=>fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#062B37,#0a3d4f)' }}>
                  📁 Choose File
                </button>
                <input value={form.imageUrl.startsWith('data:') ? '(local image)' : form.imageUrl}
                  onChange={e=>{ if(!e.target.value.startsWith('data:')) f('imageUrl',e.target.value) }}
                  placeholder="or paste URL / /filename.jpg"
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400 min-w-0" />
              </div>
              {form.imageUrl.startsWith('data:') && (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  ✅ Local image loaded — click <strong>Choose File</strong> again to re-crop
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-1">Tip: put your photo in <code className="bg-slate-100 px-1 rounded">public/</code> and type <code className="bg-slate-100 px-1 rounded">/filename.jpg</code></p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Title (white)</label>
                <input value={form.title} onChange={e=>f('title',e.target.value)} placeholder="Discover"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Subtitle (cyan)</label>
                <input value={form.subtitle} onChange={e=>f('subtitle',e.target.value)} placeholder="the Sea"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Description</label>
              <textarea value={form.description} onChange={e=>f('description',e.target.value)} rows={2}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Primary Button</label>
                <input value={form.btnPrimary} onChange={e=>f('btnPrimary',e.target.value)} placeholder="Book Now"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Secondary Button</label>
                <input value={form.btnSecondary} onChange={e=>f('btnSecondary',e.target.value)} placeholder="Explore Services"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400" />
              </div>
            </div>
            <button onClick={()=>onSave(form)}
              className="w-full py-3 rounded-xl font-black text-white text-sm transition-all hover:opacity-90 mt-2"
              style={{ background:'linear-gradient(135deg,#06b6d4,#0891b2)' }}>
              Save Banner
            </button>
          </div>
        </div>
      </div>

      {/* Cropper overlay */}
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          aspectW={16} aspectH={9}
          onDone={handleCropDone}
          onCancel={()=>setCropSrc(null)}
        />
      )}
    </>
  )
}

// ── Service Form Modal ────────────────────────────────────────────────────────
function ServiceModal({ svc, onSave, onClose }: {
  svc: Partial<Service>|null; onSave:(s:Service)=>void; onClose:()=>void
}) {
  const blank: Service = { id:'', title:'', desc:'', price:'', basePrice:0, per:'per person', img:'', perPerson:true, hourly:false, visible:true }
  const [form, setForm] = useState<Service>(svc ? { ...blank, ...svc } : blank)
  function f(k: keyof Service, v: unknown) { setForm(p=>({...p,[k]:v})) }

  function handleSave() {
    if (!form.title.trim()) return
    const id = form.id || generateServiceId()
    const price = form.price || (form.basePrice + ' DT')
    onSave({ ...form, id, price })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[28px] shadow-2xl p-8 w-full max-w-lg" style={{ animation:'popIn .3s cubic-bezier(.34,1.56,.64,1) both' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-slate-800">{form.id ? 'Edit Service' : 'Add Service'}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xl transition-colors">×</button>
        </div>
        <div className="flex flex-col gap-4">
          <input value={form.title} onChange={e=>f('title',e.target.value)} placeholder="Service title *"
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400" />
          <textarea value={form.description} onChange={e=>f('description',e.target.value)} rows={2} placeholder="Description"
            className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400 resize-none" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Base Price (DT)</label>
              <input type="number" value={form.basePrice} onChange={e=>f('basePrice',Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Price Label</label>
              <input value={form.price} onChange={e=>f('price',e.target.value)} placeholder="e.g. 30 DT"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Per label</label>
              <input value={form.per} onChange={e=>f('per',e.target.value)} placeholder="per person"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Image URL</label>
              <input value={form.img} onChange={e=>f('img',e.target.value)} placeholder="https://…"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400" />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={form.perPerson} onChange={e=>f('perPerson',e.target.checked)} className="accent-cyan-500 w-4 h-4" />
              Price × people
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={form.hourly} onChange={e=>f('hourly',e.target.checked)} className="accent-cyan-500 w-4 h-4" />
              Price × hours
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={form.visible} onChange={e=>f('visible',e.target.checked)} className="accent-cyan-500 w-4 h-4" />
              Visible on site
            </label>
          </div>
          <button onClick={handleSave}
            className="w-full py-3 rounded-xl font-black text-white text-sm transition-all hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#06b6d4,#0891b2)' }}>
            {form.id ? 'Save Changes' : 'Add Service'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter()
  const [ready, setReady]               = useState(false)
  const [tab, setTab]                   = useState<'dashboard'|'reservations'|'services'>('dashboard')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [services, setServices]         = useState<Service[]>([])
  const [selected, setSelected]         = useState<Reservation|null>(null)
  const [filter, setFilter]             = useState<ReservationStatus|'all'>('all')
  const [search, setSearch]             = useState('')
  const [svcModal, setSvcModal]         = useState<Partial<Service>|null|false>(false)
  const [bannerModal, setBannerModal]   = useState(false)
  const [banner, setBannerState]        = useState<BannerSettings>(DEFAULT_BANNER)

  useEffect(() => {
    async function loadData() {
      if (localStorage.getItem('aqua_admin') !== 'true') { router.replace('/admin/login'); return }
      setReady(true)
      
      const [resRes, svcRes, banRes] = await Promise.all([
        fetch('/api/reservations'),
        fetch('/api/services'),
        fetch('/api/banner')
      ])
      
      const reservationsData = await resRes.json()
      const servicesData = await svcRes.json()
      const bannerData = await banRes.json()
      
      setReservations(reservationsData)
      setServices(servicesData)
      setBannerState(bannerData)
    }
    loadData()
  }, [router])

  async function refreshReservations() {
    const res = await fetch('/api/reservations')
    setReservations(await res.json())
  }
  
  async function refreshServices() {
    const res = await fetch('/api/services')
    setServices(await res.json())
  }

  async function handleUpdate(u: Reservation) {
    await fetch('/api/reservations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(u)
    })
    await refreshReservations()
    setSelected(u)
  }
  
  async function handleDelete(id: string) {
    await fetch(`/api/reservations?id=${id}`, { method: 'DELETE' })
    await refreshReservations()
    setSelected(null)
  }
  
  async function handleLogout() { 
    localStorage.removeItem('aqua_admin')
    router.push('/admin/login') 
  }
  
  async function handleSaveBanner(b: BannerSettings) {
    await fetch('/api/banner', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b)
    })
    setBannerState(b)
    setBannerModal(false)
  }
  
  async function handleSaveService(svc: Service) {
    const all = [...services]
    const idx = all.findIndex(s => s.id === svc.id)
    if (idx >= 0) all[idx] = svc; else all.push(svc)
    await fetch('/api/services', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(all)
    })
    setServices(all)
    setSvcModal(false)
  }
  
  async function handleDeleteService(id: string) {
    const all = services.filter(s => s.id !== id)
    await fetch('/api/services', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(all)
    })
    setServices(all)
  }
  
  async function handleToggleVisible(id: string) {
    const all = services.map(s => s.id===id ? {...s, visible:!s.visible} : s)
    await fetch('/api/services', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(all)
    })
    setServices(all)
  }

  if (!ready) return null

  const total     = reservations.length
  const pending   = reservations.filter(r=>r.status==='pending').length
  const confirmed = reservations.filter(r=>r.status==='confirmed').length
  const waiting   = reservations.filter(r=>r.status==='waiting').length
  const cancelled = reservations.filter(r=>r.status==='cancelled').length
  const revenue   = reservations.filter(r=>r.status==='confirmed').reduce((s,r)=>s+Math.round(r.total*(1-r.discount/100)),0)

  // last 7 days booking counts for bar chart
  const last7 = Array.from({length:7},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-6+i)
    const ds = d.toISOString().split('T')[0]
    return reservations.filter(r=>r.createdAt.startsWith(ds)).length
  })
  const dayLabels = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); return ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()] })

  const visible = reservations.filter(r => {
    const ms = filter==='all'||r.status===filter
    const q = search.toLowerCase()
    return ms && (!q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.phone.includes(q) || r.serviceLabel.toLowerCase().includes(q) || r.id.toLowerCase().includes(q))
  })

  const NAV = [
    { id:'dashboard',    icon:'⊞', label:'Dashboard'    },
    { id:'reservations', icon:'📋', label:'Reservations' },
    { id:'services',     icon:'🚤', label:'Services'     },
  ] as const

  return (
    <>
      <style>{`
        @keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes popIn   { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .card-anim { animation: fadeUp .4s cubic-bezier(.22,1,.36,1) both }
      `}</style>

      <div className="flex min-h-screen bg-slate-50" style={{ fontFamily:'Arial,sans-serif' }}>

        {/* ── SIDEBAR ── */}
        <aside className="w-56 flex-shrink-0 flex flex-col sticky top-0 h-screen bg-white border-r border-slate-100 shadow-sm">
          <div className="px-5 py-5 border-b border-slate-100">
            <img src="/logo.png" alt="AQUA RIDE" className="h-10 w-auto" style={{ mixBlendMode:'multiply' }}
              onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />
            <p className="text-slate-400 text-[10px] mt-1 tracking-widest uppercase">Admin Panel</p>
          </div>
          <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-3 mb-2">Menu</p>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setTab(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${tab===n.id ? 'bg-cyan-500 text-white shadow-md shadow-cyan-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                <span>{n.icon}</span>{n.label}
              </button>
            ))}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button onClick={()=>router.push('/')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all">
                <span>🌐</span>Public Site
              </button>
            </div>
          </nav>
          <div className="px-3 py-4 border-t border-slate-100">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-50 transition-all">
              <span>🚪</span>Sign Out
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
            <div>
              <h1 className="text-xl font-black text-slate-800 capitalize">{tab}</h1>
              <p className="text-slate-400 text-xs">Welcome back, Admin 👋</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                  className="pl-9 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-cyan-400 w-56" />
              </div>
              <button onClick={refresh} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-cyan-500 hover:border-cyan-300 transition-all">↻</button>
            </div>
          </header>

          <div className="flex-1 p-8 overflow-auto">

            {/* ══ DASHBOARD TAB ══ */}
            {tab === 'dashboard' && (
              <div className="flex flex-col gap-8">

                {/* Welcome banner */}
                <div className="relative rounded-[24px] overflow-hidden card-anim"
                  style={{ background:'linear-gradient(135deg,#062B37 0%,#06b6d4 100%)', minHeight:'130px' }}>
                  <div className="absolute inset-0 opacity-10 bg-cover bg-center"
                    style={{ backgroundImage:"url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070')" }} />
                  <div className="relative z-10 p-8">
                    <p className="text-cyan-200 text-sm mb-1">Welcome back 👋</p>
                    <h2 className="text-3xl font-black text-white">AQUA RIDE Dashboard</h2>
                    <p className="text-white/60 text-sm mt-1">Here's your overview for today.</p>
                  </div>
                  <div className="absolute right-8 bottom-2 text-6xl opacity-20 select-none">🚤</div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label:'Total',     value:total,        icon:'📋', color:'text-slate-800',   border:'border-slate-200' },
                    { label:'Pending',   value:pending,      icon:'⏳', color:'text-amber-500',   border:'border-amber-100' },
                    { label:'Confirmed', value:confirmed,    icon:'✅', color:'text-cyan-500',    border:'border-cyan-100'  },
                    { label:'Revenue',   value:revenue+' DT',icon:'💰', color:'text-emerald-500', border:'border-emerald-100'},
                  ].map((s,i)=>(
                    <div key={i} className={`bg-white rounded-[20px] p-6 shadow-sm border ${s.border} card-anim`} style={{ animationDelay:`${i*.07}s` }}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">{s.label}</p>
                        <span className="text-xl">{s.icon}</span>
                      </div>
                      <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid lg:grid-cols-3 gap-5">

                  {/* Bar chart — bookings last 7 days */}
                  <div className="lg:col-span-2 bg-white rounded-[20px] p-6 shadow-sm border border-slate-100 card-anim" style={{ animationDelay:'.28s' }}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-black text-slate-800">Bookings This Week</h3>
                        <p className="text-slate-400 text-xs mt-0.5">New reservations per day</p>
                      </div>
                      <span className="text-2xl font-black text-cyan-500">{last7.reduce((a,b)=>a+b,0)}</span>
                    </div>
                    <BarChart data={last7} color="bg-cyan-500" />
                    <div className="flex gap-1.5 mt-2">
                      {dayLabels.map((d,i)=><div key={i} className="flex-1 text-center text-[10px] text-slate-400">{d}</div>)}
                    </div>
                  </div>

                  {/* Donut — status breakdown */}
                  <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100 card-anim" style={{ animationDelay:'.35s' }}>
                    <h3 className="font-black text-slate-800 mb-1">Status Breakdown</h3>
                    <p className="text-slate-400 text-xs mb-5">All reservations</p>
                    <DonutChart segments={[
                      { value:pending,   color:'#f59e0b', label:'Pending'   },
                      { value:confirmed, color:'#06b6d4', label:'Confirmed' },
                      { value:waiting,   color:'#3b82f6', label:'Waiting'   },
                      { value:cancelled, color:'#ef4444', label:'Cancelled' },
                    ]} />
                  </div>
                </div>

                {/* Service popularity */}
                <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100 card-anim" style={{ animationDelay:'.42s' }}>
                  <h3 className="font-black text-slate-800 mb-1">Service Popularity</h3>
                  <p className="text-slate-400 text-xs mb-6">Bookings per service</p>
                  <div className="flex flex-col gap-3">
                    {services.map(svc => {
                      const count = reservations.filter(r=>r.service===svc.id).length
                      const pct = total ? Math.round((count/total)*100) : 0
                      return (
                        <div key={svc.id} className="flex items-center gap-4">
                          <span className="text-sm text-slate-600 w-40 truncate">{svc.title}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div className="h-full bg-cyan-500 rounded-full transition-all duration-700" style={{ width:`${pct}%` }} />
                          </div>
                          <span className="text-sm font-bold text-slate-700 w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                    {services.length === 0 && <p className="text-slate-400 text-sm">No services yet.</p>}
                  </div>
                </div>

                {/* Recent reservations mini table */}
                <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden card-anim" style={{ animationDelay:'.49s' }}>
                  <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <h3 className="font-black text-slate-800">Recent Reservations</h3>
                    <button onClick={()=>setTab('reservations')} className="text-xs text-cyan-500 font-bold hover:underline">View All →</button>
                  </div>
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>{['Client','Service','Date','Total','Status'].map(h=>(
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {reservations.slice(0,5).map(r=>{
                        const sm = STATUS_META[r.status]
                        return (
                          <tr key={r.id} onClick={()=>{setSelected(r);setTab('reservations')}}
                            className="border-t border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2"><Avatar name={r.name} /><span className="font-semibold text-slate-800 text-sm">{r.name}</span></div>
                            </td>
                            <td className="px-5 py-3 text-slate-500 text-sm">{r.serviceLabel}</td>
                            <td className="px-5 py-3 text-slate-500 text-sm">{r.date}</td>
                            <td className="px-5 py-3 font-bold text-slate-800 text-sm">{Math.round(r.total*(1-r.discount/100))} DT</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${sm.light}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`}/>{r.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                      {reservations.length===0 && (
                        <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">No reservations yet 🌊</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══ RESERVATIONS TAB ══ */}
            {tab === 'reservations' && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap gap-2">
                  {(['all','pending','confirmed','waiting','cancelled'] as const).map(f=>(
                    <button key={f} onClick={()=>setFilter(f)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all
                        ${filter===f ? 'bg-cyan-500 text-white shadow-md shadow-cyan-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                      {f==='all'?`All (${total})`:f}
                    </button>
                  ))}
                </div>
                <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
                  {visible.length===0 ? (
                    <div className="py-20 text-center"><p className="text-4xl mb-3">🌊</p><p className="text-slate-400 font-semibold">No reservations found</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>{['Client','Service','Date & Time','People','Total','Payment','Status',''].map(h=>(
                            <th key={h} className="px-5 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody>
                          {visible.map(r=>{
                            const sm = STATUS_META[r.status]
                            const disc = Math.round(r.total*(1-r.discount/100))
                            return (
                              <tr key={r.id} onClick={()=>setSelected(r)}
                                className="border-t border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3"><Avatar name={r.name} />
                                    <div><p className="font-bold text-slate-800 text-sm">{r.name}</p><p className="text-xs text-slate-400">{r.email}</p></div>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-slate-600 text-sm">{r.serviceLabel}</td>
                                <td className="px-5 py-4 text-sm whitespace-nowrap"><p className="text-slate-700">{r.date}</p><p className="text-slate-400 text-xs">{r.time}</p></td>
                                <td className="px-5 py-4 text-center font-bold text-slate-700 text-sm">{r.people}</td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span className="font-black text-slate-800">{disc} DT</span>
                                  {r.discount>0 && <span className="ml-1 text-xs text-cyan-500 font-bold">-{r.discount}%</span>}
                                </td>
                                <td className="px-5 py-4 text-slate-500 text-sm">{PAYMENT_LABELS[r.payment]??r.payment}</td>
                                <td className="px-5 py-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border capitalize ${sm.light}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`}/>{r.status}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  <button onClick={e=>{e.stopPropagation();setSelected(r)}}
                                    className="text-xs bg-slate-100 hover:bg-cyan-100 hover:text-cyan-600 text-slate-500 font-bold px-3 py-1.5 rounded-xl transition-colors">
                                    Manage →
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ SERVICES TAB ══ */}
            {tab === 'services' && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-800">Manage Services</h2>
                    <p className="text-slate-400 text-sm">Add, edit or hide services shown on the public site</p>
                  </div>
                <div className="flex items-center gap-3">
                  <button onClick={()=>setBannerModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                    style={{ background:'linear-gradient(135deg,#062B37,#0a3d4f)' }}>
                    🖼 Edit Banner
                  </button>
                  <button onClick={()=>setSvcModal({})}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                    style={{ background:'linear-gradient(135deg,#06b6d4,#0891b2)' }}>
                    + Add Service
                  </button>
                </div>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {services.map(svc=>(
                    <div key={svc.id} className={`bg-white rounded-[20px] shadow-sm border overflow-hidden transition-all ${svc.visible?'border-slate-100':'border-slate-200 opacity-60'}`}>
                      <div className="h-36 bg-cover bg-center relative" style={{ backgroundImage:`url('${svc.img||'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800'}')` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${svc.visible?'bg-cyan-500 text-white':'bg-slate-200 text-slate-500'}`}>
                            {svc.visible?'Visible':'Hidden'}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-4">
                          <p className="text-white font-black text-lg leading-tight">{svc.title}</p>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">{svc.description}</p>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-2xl font-black text-cyan-500">{svc.price}</p>
                            <p className="text-xs text-slate-400">{svc.per}</p>
                          </div>
                          <div className="text-xs text-slate-400 text-right">
                            {svc.perPerson && <p>× people</p>}
                            {svc.hourly && <p>× hours</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={()=>setSvcModal(svc)}
                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                            ✏️ Edit
                          </button>
                          <button onClick={()=>handleToggleVisible(svc.id)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${svc.visible?'bg-amber-50 hover:bg-amber-100 text-amber-600':'bg-cyan-50 hover:bg-cyan-100 text-cyan-600'}`}>
                            {svc.visible?'👁 Hide':'👁 Show'}
                          </button>
                          <button onClick={()=>handleDeleteService(svc.id)}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add new card */}
                  <button onClick={()=>setSvcModal({})}
                    className="bg-white rounded-[20px] border-2 border-dashed border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/30 transition-all flex flex-col items-center justify-center gap-3 p-10 text-slate-400 hover:text-cyan-500 min-h-[280px]">
                    <span className="text-4xl">+</span>
                    <span className="font-bold text-sm">Add New Service</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {selected && <Drawer res={selected} onClose={()=>setSelected(null)} onUpdate={handleUpdate} onDelete={handleDelete} />}
      {svcModal !== false && <ServiceModal svc={svcModal||null} onSave={handleSaveService} onClose={()=>setSvcModal(false)} />}
      {bannerModal && <BannerModal current={banner} onSave={handleSaveBanner} onClose={()=>setBannerModal(false)} />}
    </>
  )
}
