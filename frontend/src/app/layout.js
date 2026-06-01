'use client'

import { Toaster } from 'react-hot-toast'
import Navigation from '../components/navigation'
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>ShopSphere - Shop Smart, Shop Fresh</title>
        <meta name="description" content="Shop the best products from trusted sellers" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navigation />  {/* ✅ Add Navigation here */}
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}