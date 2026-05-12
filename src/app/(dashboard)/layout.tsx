'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { LayoutDashboard, ClipboardList, Search, FileText, Users, Settings, LogOut } from 'lucide-react'

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/chamada',       label: 'Lançar Chamada',  icon: ClipboardList },
  { href: '/consultas',     label: 'Consultas',       icon: Search },
  { href: '/relatorios',    label: 'Relatórios',      icon: FileText },
  { href: '/militares',     label: 'Militares',       icon: Users },
  { href: '/configuracoes', label: 'Configurações',   icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const user = session?.user as any

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated' && user?.trocar_senha) { router.push('/trocar-senha') }
  }, [status, user, router])

  if (status === 'loading') {
    return (
      <div style={{ minHeight:'100vh', background:'#1e1e1e', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Arial,sans-serif' }}>
        <span className="spinner" />
        <span style={{ color:'#9b8a5c', fontSize:'14px' }}>Carregando...</span>
      </div>
    )
  }

  const adminOnly = ['/militares', '/configuracoes', '/consultas', '/relatorios']
  const menuItems = navItems.filter(item => {
    if (adminOnly.includes(item.href)) return user?.perfil === 'admin'
    return true
  })

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#1e1e1e', fontFamily:'Arial,sans-serif' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '220px', minHeight: '100vh',
        background: '#111',
        borderRight: '1px solid #3a3a3a',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', left: 0, top: 0, zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{
          background: '#111',
          borderBottom: '3px solid #9b8a5c',
          padding: '20px 16px 16px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: '#1e1e1e', border: '2px solid #9b8a5c',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/pmmg-banner.png" alt="PMMG" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#9b8a5c', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>3ª Cia PM MAmb</div>
            <div style={{ color: '#555', fontSize: '10px', marginTop: '2px' }}>Controle de Chamada</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {menuItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid #3a3a3a', padding: '12px 8px' }}>
          <div style={{ padding: '8px 12px', marginBottom: '4px' }}>
            <div style={{ color: '#f0f0f0', fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ color: '#555', fontSize: '10px', marginTop: '2px', textTransform: 'capitalize' }}>
              {user?.perfil}
            </div>
            <div style={{ color: '#555', fontSize: '10px', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user?.lotacao}>
              {user?.lotacao || ''}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="sidebar-link"
            style={{ width: '100%', background: 'none', border: 'none', color: '#ef5350', cursor: 'pointer', justifyContent: 'center' }}
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ marginLeft: '220px', flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}

function PMMGShieldSmall() {
  return (
    <svg viewBox="0 0 50 50" width="36" height="36" fill="none">
      <path d="M25 4 L44 11 L44 27 C44 36 35 43 25 47 C15 43 6 36 6 27 L6 11 Z"
        fill="#111" stroke="#9b8a5c" strokeWidth="1.5" />
      <text x="25" y="20" textAnchor="middle" fill="#9b8a5c" fontSize="7"
        fontWeight="bold" fontFamily="Arial">PMMG</text>
      <line x1="11" y1="24" x2="39" y2="24" stroke="#9b8a5c" strokeWidth="1" />
      <path d="M17 27 L33 27 L33 37 L25 41 L17 37 Z"
        fill="none" stroke="#9b8a5c" strokeWidth="1" />
    </svg>
  )
}
