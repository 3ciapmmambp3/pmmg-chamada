'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

// Formata 1463223 → 146.322-3
function formatNP(value: string): string {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 7)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0,3)}.${digits.slice(3)}`
  return `${digits.slice(0,3)}.${digits.slice(3,6)}-${digits.slice(6)}`
}

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleLoginChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLogin(formatNP(e.target.value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!login.trim() || !senha) { setErro('Preencha todos os campos.'); return }
    setLoading(true)
    setErro('')
    const res = await signIn('credentials', { login: login.trim(), senha, redirect: false })
    setLoading(false)
    if (res?.error) {
      setErro('Número de polícia ou senha inválidos.')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#2d2d2d',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        border: '1px solid #3a3a3a',
      }}>

        {/* ── Banner PMMG — sem gradiente, imagem viva ── */}
        <div style={{
          height: '190px',
          overflow: 'hidden',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src="/pmmg-banner.png"
            alt="PMMG"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
              display: 'block',
              // SEM filter, SEM gradiente — imagem original viva
            }}
          />
        </div>

        {/* ── Título ── */}
        <div style={{ textAlign: 'center', padding: '22px 28px 8px' }}>
          <div style={{ color: '#f0f0f0', fontSize: '22px', fontWeight: '700' }}>
            3ª Cia PM MAmb
          </div>
          <div style={{ color: '#888', fontSize: '13px', marginTop: '5px' }}>
            Polícia Militar de Minas Gerais
          </div>
        </div>

        {/* ── Formulário ── */}
        <div style={{ padding: '16px 28px 28px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Número de Polícia */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#9b8a5c', fontWeight: '600' }}>
                Número de Polícia
              </label>
              <input
                type="text"
                placeholder="000.000-0"
                value={login}
                onChange={handleLoginChange}
                maxLength={9}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#9b8a5c'; e.target.style.boxShadow='0 0 0 2px rgba(155,138,92,0.2)' }}
                onBlur={e => { e.target.style.borderColor='#4a4a4a'; e.target.style.boxShadow='none' }}
                required
              />
            </div>

            {/* Senha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: '#9b8a5c', fontWeight: '600' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  style={{ ...inputStyle, paddingRight: '42px' }}
                  onFocus={e => { e.target.style.borderColor='#9b8a5c'; e.target.style.boxShadow='0 0 0 2px rgba(155,138,92,0.2)' }}
                  onBlur={e => { e.target.style.borderColor='#4a4a4a'; e.target.style.boxShadow='none' }}
                  required
                />
                <button type="button" onClick={() => setShowSenha(!showSenha)} style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: '#666', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}>
                  {showSenha ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div style={{
                background: 'rgba(239,83,80,0.1)',
                border: '1px solid rgba(239,83,80,0.4)',
                borderRadius: '6px',
                padding: '10px 14px',
                color: '#ef5350',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>⚠</span> {erro}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#9b8a5c',
                color: '#1a1000',
                border: 'none',
                padding: '13px',
                borderRadius: '7px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { if(!loading)(e.currentTarget as any).style.background='#b3a06e' }}
              onMouseLeave={e => { if(!loading)(e.currentTarget as any).style.background='#9b8a5c' }}
            >
              {loading && <span style={{
                display:'inline-block', width:'15px', height:'15px',
                border:'2px solid rgba(26,16,0,0.3)', borderTopColor:'#1a1000',
                borderRadius:'50%', animation:'spin 0.8s linear infinite',
              }}/>}
              {loading ? 'Aguarde...' : 'Entrar'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button type="button" style={{
                background: 'none', border: 'none',
                color: '#9b8a5c', fontSize: '12px',
                cursor: 'pointer', textDecoration: 'underline',
              }}>
                Esqueci minha senha
              </button>
            </div>
          </form>

          <div style={{
            marginTop: '16px',
            padding: '12px 14px',
            background: '#1e1e1e',
            border: '1px solid #3a3a3a',
            borderRadius: '6px',
            textAlign: 'center',
          }}>
            <p style={{ color: '#666', fontSize: '11px', lineHeight: '1.7' }}>
              O cadastro de novos usuários é feito exclusivamente pelo administrador.<br/>
              Caso não possua acesso, entre em contato com o responsável.
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '11px 14px',
  background: '#1a1a1a',
  border: '1px solid #4a4a4a',
  borderRadius: '7px',
  color: '#f0f0f0',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  width: '100%',
  letterSpacing: '0.5px',
}
