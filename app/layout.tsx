import React from 'react'
import './globals.css'

export const metadata = {
  title: 'Super Hexagon Clone',
  description: 'A web-based Super Hexagon game clone',
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
