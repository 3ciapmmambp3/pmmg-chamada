'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RootPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard')
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  // Aguarda resolução da sessão sem piscar nenhuma página
  return (
    <div style={{
      minHeight: '100vh', background: '#1e1e1e',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          border: '3px solid #333', borderTopColor: '#9b8a5c',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ color: '#9b8a5c', fontSize: '13px', letterSpacing: '0.5px' }}>Carregando...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
