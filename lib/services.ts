export interface Service {
  id: string
  title: string
  description: string
  price: string
  basePrice: number
  per: string
  img: string
  perPerson: boolean
  hourly: boolean
  visible: boolean
}

const KEY = 'aqua_services'

export const DEFAULT_SERVICES: Service[] = [
  { id:'balade',    title:'Balade en Mer',       description:'A relaxing sea stroll along the Tunisian coastline. Perfect for families and couples.',         price:'30 DT',   basePrice:30,   per:'per person',    img:'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070', perPerson:true,  hourly:false, visible:true },
  { id:'pack',      title:'Pack Complet',         description:'The full experience — sea tour, snorkeling, and a sunset cruise all in one package.',           price:'90 DT',   basePrice:90,   per:'per person',    img:'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?q=80&w=2070', perPerson:true,  hourly:false, visible:true },
  { id:'excursion', title:'Excursion Privée',     description:'Your own private boat, your own schedule. Explore hidden coves and secret beaches.',            price:'300 DT',  basePrice:300,  per:'per hour',      img:'https://images.unsplash.com/photo-1500514966906-fe245eea9344?q=80&w=2070', perPerson:false, hourly:true,  visible:true },
  { id:'mariage',   title:'Demande de Mariage',   description:'Propose on the open sea with a luxury setup, flowers, and a photographer.',                    price:'500 DT',  basePrice:500,  per:'full package',  img:'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070', perPerson:false, hourly:false, visible:true },
  { id:'anniv',     title:'Anniversaire',         description:'Celebrate your special day on the water with a custom decoration and cake.',                   price:'Custom',  basePrice:200,  per:'tailored',      img:'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=2070', perPerson:true,  hourly:false, visible:true },
  { id:'premium',   title:'Premium Private Tour', description:'The ultimate luxury experience — VIP boat, champagne, and a personal guide.',                  price:'1000 DT', basePrice:1000, per:'per hour',      img:'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?q=80&w=2070', perPerson:false, hourly:true,  visible:true },
]

export function getServices(): Service[] {
  if (typeof window === 'undefined') return DEFAULT_SERVICES
  try {
    const stored = localStorage.getItem(KEY)
    return stored ? JSON.parse(stored) : DEFAULT_SERVICES
  } catch { return DEFAULT_SERVICES }
}

export function saveServices(services: Service[]): void {
  localStorage.setItem(KEY, JSON.stringify(services))
}

export function generateServiceId(): string {
  return 'svc-' + Date.now().toString(36)
}
