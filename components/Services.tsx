'use client'

import { useState, useEffect } from 'react'
import { getServices, DEFAULT_SERVICES, type Service } from '@/lib/services'

export default function Services() {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES)

  useEffect(() => {
    setServices(getServices().filter(s => s.visible))
  }, [])

  return (
    <section id="services" className="bg-[#f7f4ef] relative">
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-20">
        <div className="grid md:grid-cols-2 gap-8 items-end mb-20">
          <div>
            <p className="uppercase tracking-[5px] text-cyan-500 text-sm font-semibold mb-4">What We Offer</p>
            <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-black text-[#062B37] leading-tight" style={{ fontFamily:'Georgia,serif' }}>
              Premium<br />Services
            </h2>
          </div>
          <p className="text-slate-500 text-lg leading-relaxed md:text-right">
            From romantic proposals to adrenaline-filled private tours —
            every experience is crafted for the extraordinary.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((svc, i) => (
            <div key={svc.id || i}
              className="group bg-white rounded-[32px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="relative h-56 overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage:`url('${svc.img}')` }} />
                <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/20 transition-all duration-500" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 text-center">
                  <p className="text-xl font-black text-cyan-500 leading-none">{svc.price}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{svc.per}</p>
                </div>
              </div>
              <div className="p-7">
                <h3 className="text-2xl font-black text-[#062B37] mb-3" style={{ fontFamily:'Georgia,serif' }}>{svc.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">{svc.description}</p>
                <a href="#booking"
                  className="inline-flex items-center gap-2 bg-[#062B37] hover:bg-cyan-500 text-white font-bold px-6 py-3 rounded-full text-sm transition-all duration-300 hover:scale-105">
                  Book Experience <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teal banner */}
      <div className="relative mt-10">
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="w-full h-16 md:h-24 block">
          <path d="M0,50 C200,100 400,0 600,50 C800,100 1000,10 1200,55 C1320,80 1400,30 1440,50 L1440,0 L0,0 Z" fill="#f7f4ef" />
        </svg>
        <div className="relative py-28 px-6 text-center"
          style={{ background:'linear-gradient(135deg,#0a3d4f 0%,#06b6d4 50%,#0a3d4f 100%)' }}>
          <div className="hidden lg:block absolute left-12 top-1/2 -translate-y-1/2 w-64 h-44 rounded-[24px] overflow-hidden shadow-2xl rotate-[-4deg]">
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800')" }} />
          </div>
          <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 w-64 h-44 rounded-[24px] overflow-hidden shadow-2xl rotate-[4deg]">
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage:"url('https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?q=80&w=800')" }} />
          </div>
          <p className="uppercase tracking-[5px] text-cyan-200 text-sm mb-4">The Mediterranean Awaits</p>
          <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-black text-white mb-6" style={{ fontFamily:'Georgia,serif' }}>Sea, Sun & Luxury!</h2>
          <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">Every trip is a story. Let us write yours on the crystal-clear waters of Tunisia.</p>
          <a href="#booking" className="inline-block border-2 border-white text-white font-bold px-10 py-4 rounded-full hover:bg-white hover:text-cyan-600 transition-all duration-300 hover:scale-105">
            Reserve Your Experience
          </a>
        </div>
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="w-full h-16 md:h-24 block">
          <path d="M0,50 C180,0 360,100 540,50 C720,0 900,90 1080,45 C1260,0 1380,70 1440,50 L1440,100 L0,100 Z" fill="#f7f4ef" />
        </svg>
      </div>
    </section>
  )
}
