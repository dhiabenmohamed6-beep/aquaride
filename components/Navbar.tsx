'use client'

import { useState, useEffect } from 'react'

const links = [
  { label: 'Home',     href: '#home'     },
  { label: 'Services', href: '#services' },
  { label: 'Booking',  href: '#booking'  },
  { label: 'Contact',  href: '#contact'  },
]

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [active, setActive]       = useState('home')
  const [menuOpen, setMenuOpen]   = useState(false)
  const [mounted, setMounted]     = useState(false)

  useEffect(() => {
    setMounted(true)

    const onScroll = () => {
      setScrolled(window.scrollY > 20)

      // highlight active section
      const sections = ['home','services','booking','contact']
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id)
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActive(id)
          break
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 nav-enter
          ${scrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-slate-200/60 border-b border-slate-100'
            : 'bg-white/80 backdrop-blur-md border-b border-slate-200/50'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

          {/* Logo */}
          <a href="#home" className="flex items-center group">
            <img
              src="/logo.png"
              alt="AQUA RIDE"
              className="object-contain h-14 w-auto transition-transform duration-300 group-hover:scale-105"
              style={{ mixBlendMode: 'multiply' }}
              onError={(e) => {
                const t = e.currentTarget as HTMLImageElement
                t.style.display = 'none'
                const fb = t.nextElementSibling as HTMLElement
                if (fb) fb.style.display = 'block'
              }}
            />
            <span className="text-3xl font-black" style={{ display: 'none' }}>
              AQUA <span className="text-cyan-500">RIDE</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            {links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setActive(l.href.slice(1))}
                className={`nav-link link-item px-4 py-2 text-sm font-semibold transition-colors duration-200
                  ${active === l.href.slice(1) ? 'text-cyan-500 active' : 'text-[#062B37] hover:text-cyan-500'}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <a
              href="/admin/login"
              className="hidden md:block text-xs text-slate-400 hover:text-cyan-500 font-semibold transition-colors px-3 py-2 rounded-xl hover:bg-slate-100"
            >
              Admin
            </a>

            <a
              href="#booking"
              className="relative overflow-hidden bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-cyan-300/40 active:scale-95"
            >
              Book Now
            </a>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden flex flex-col gap-1.5 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-[#062B37] rounded transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-[#062B37] rounded transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-[#062B37] rounded transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>

        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden mobile-menu bg-white border-t border-slate-100 px-6 py-4 flex flex-col gap-1 shadow-xl">
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => { setActive(l.href.slice(1)); setMenuOpen(false) }}
                className={`px-4 py-3 rounded-2xl font-semibold text-sm transition-colors
                  ${active === l.href.slice(1)
                    ? 'bg-cyan-50 text-cyan-500'
                    : 'text-[#062B37] hover:bg-slate-50 hover:text-cyan-500'
                  }`}
              >
                {l.label}
              </a>
            ))}
            <a
              href="/admin/login"
              className="px-4 py-3 rounded-2xl font-semibold text-sm text-slate-400 hover:bg-slate-50 transition-colors"
            >
              Admin
            </a>
          </div>
        )}
      </header>
    </>
  )
}
