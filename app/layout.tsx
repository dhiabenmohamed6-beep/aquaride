import './globals.css'

export const metadata = {
  title: 'AQUA RIDE',
  description: 'Luxury Sea Experiences in Tunisia',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
