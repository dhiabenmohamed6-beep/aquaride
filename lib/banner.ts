export interface BannerSettings {
  id: number
  imageUrl: string
  title: string
  subtitle: string
  description: string
  btnPrimary: string
  btnSecondary: string
}

export const DEFAULT_BANNER: BannerSettings = {
  id: 1,
  imageUrl:    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070',
  title:       'Discover',
  subtitle:    'the Sea',
  description: 'Hidden caves, crystal-clear waters, private tours, and unforgettable luxury moments on the Mediterranean.',
  btnPrimary:  'Book Now',
  btnSecondary:'Explore Services',
}
