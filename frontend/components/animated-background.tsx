"use client"

export function AnimatedBackground() {
  return (
    <div 
      className="fixed inset-0 -z-10"
      style={{
        background: '#0a0a0a',
        width: '100vw',
        height: '100vh',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    />
  )
}
