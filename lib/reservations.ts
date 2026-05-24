// ─── Shared reservation types & Supabase helpers ───────────────────────────

export type ReservationStatus = 'pending' | 'confirmed' | 'waiting' | 'cancelled'

export interface Reservation {
  id: string
  createdAt: string
  name: string
  phone: string
  email: string
  service: string
  serviceLabel: string
  date: string
  time: string
  people: number
  hours: number
  message: string
  payment: string
  total: number
  status: ReservationStatus
  adminNote: string
  discount: number
}

export function generateId(): string {
  return 'RES-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase()
}
