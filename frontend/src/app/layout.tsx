'use client'
import './globals.css'
import { useEffect, useRef } from 'react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const ring = ringRef.current
    if (!cursor || !ring) return

    let ringX = 0, ringY = 0
    let mouseX = 0, mouseY = 0

    const move = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      cursor.style.left = `${mouseX}px`
      cursor.style.top = `${mouseY}px`
    }

    const animate = () => {
      ringX += (mouseX - ringX) * 0.12
      ringY += (mouseY - ringY) * 0.12
      ring.style.left = `${ringX}px`
      ring.style.top = `${ringY}px`
      requestAnimationFrame(animate)
    }

    document.addEventListener('mousemove', move)
    animate()
    return () => document.removeEventListener('mousemove', move)
  }, [])

  return (
    <html lang="en">
      <head>
        <title>DRIFT — See yourself from the outside</title>
        <meta name="description" content="A vector-space journal that reveals the hidden shape of how your mind moves." />
      </head>
      <body className="noise">
        <div ref={cursorRef} className="cursor" />
        <div ref={ringRef} className="cursor-ring" />
        {children}
      </body>
    </html>
  )
}
