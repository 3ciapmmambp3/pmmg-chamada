'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

export default function TrocarSenhaPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const user = session?.user as any

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showNova, setShowNova] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (session && !user?.trocar_senha) router.push('/dashboard')
  }, [session, user, router])

  const reqs = [
    { label: 'Mínimo 6 caracteres',              ok: novaSenha.length >= 6 },
    { label: 'Maiúsculas e minúsculas',           ok: /[a-z]/.test(novaSenha) && /[A-Z]/.test(novaSenha) },
    { label: 'Pelo menos um número',              ok: /\d/.test(novaSenha) },
    { label: 'Confirmação igual',                 ok: novaSenha === confirmar && confirmar.length > 0 },
  ]
  const valido = reqs.every(r => r.ok)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valido) return
    setLoading(true); setErro('')
    const res = await fetch('/api/auth/trocar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novaSenha }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setErro(data.error || 'Erro ao salvar.'); return }
    setOk(true)
    await update({ trocar_senha: false })
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (!session) return null

  return (
    <div style={{ minHeight:'100vh', background:'#1e1e1e', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', fontFamily:'Arial,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:'420px', background:'#2d2d2d', borderRadius:'12px', overflow:'hidden', border:'1px solid #3a3a3a', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ background:'#111', borderBottom:'3px solid #9b8a5c', padding:'20px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <span style={{ fontSize:'24px' }}>🔐</span>
            <div>
              <div style={{ color:'#9b8a5c', fontSize:'14px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                Troca de Senha Obrigatória
              </div>
              <div style={{ color:'#666', fontSize:'11px', marginTop:'3px' }}>
                Defina sua senha pessoal para continuar
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding:'24px' }}>
          {/* Aviso */}
          <div style={{ background:'rgba(155,138,92,0.1)', border:'1px solid rgba(155,138,92,0.3)', borderRadius:'6px', padding:'12px', marginBottom:'20px' }}>
            <div style={{ color:'#9b8a5c', fontSize:'12px', fontWeight:'700', marginBottom:'4px' }}>
              Olá, {user?.nome_guerra || user?.name}!
            </div>
            <div style={{ color:'#999', fontSize:'11px', lineHeight:'1.5' }}>
              Sua senha padrão precisa ser alterada. A nova senha será salva e usada em todos os próximos acessos.
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {/* Nova senha */}
            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
              <label style={{ fontSize:'11px', color:'#999', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px' }}>Nova Senha</label>
              <div style={{ position:'relative' }}>
                <input type={showNova ? 'text' : 'password'} placeholder="Digite sua nova senha"
                  value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                  style={{ padding:'10px 36px 10px 12px', background:'#1a1a1a', border:'1px solid #555', borderRadius:'6px', color:'#f0f0f0', fontSize:'13px', outline:'none', width:'100%' }}
                  onFocus={e => (e.target as any).style.borderColor='#9b8a5c'}
                  onBlur={e => (e.target as any).style.borderColor='#555'}
                  required />
                <button type="button" onClick={() => setShowNova(!showNova)}
                  style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#666', cursor:'pointer' }}>
                  {showNova ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {/* Confirmar */}
            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
              <label style={{ fontSize:'11px', color:'#999', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px' }}>Confirmar Nova Senha</label>
              <div style={{ position:'relative' }}>
                <input type={showConf ? 'text' : 'password'} placeholder="Repita a nova senha"
                  value={confirmar} onChange={e => setConfirmar(e.target.value)}
                  style={{ padding:'10px 36px 10px 12px', background:'#1a1a1a', border:'1px solid #555', borderRadius:'6px', color:'#f0f0f0', fontSize:'13px', outline:'none', width:'100%' }}
                  onFocus={e => (e.target as any).style.borderColor='#9b8a5c'}
                  onBlur={e => (e.target as any).style.borderColor='#555'}
                  required />
                <button type="button" onClick={() => setShowConf(!showConf)}
                  style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#666', cursor:'pointer' }}>
                  {showConf ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {/* Requisitos */}
            {novaSenha.length > 0 && (
              <div style={{ background:'#1a1a1a', borderRadius:'6px', padding:'12px', display:'flex', flexDirection:'column', gap:'6px' }}>
                {reqs.map(r => (
                  <div key={r.label} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'11px' }}>
                    <span style={{ color: r.ok ? '#66bb6a' : '#555', fontSize:'13px' }}>{r.ok ? '✓' : '○'}</span>
                    <span style={{ color: r.ok ? '#66bb6a' : '#666' }}>{r.label}</span>
                  </div>
                ))}
              </div>
            )}

            {erro && (
              <div style={{ background:'rgba(239,83,80,0.12)', border:'1px solid rgba(239,83,80,0.3)', borderRadius:'6px', padding:'10px 12px', color:'#ef5350', fontSize:'12px' }}>
                ⚠ {erro}
              </div>
            )}
            {ok && (
              <div style={{ background:'rgba(102,187,106,0.12)', border:'1px solid rgba(102,187,106,0.3)', borderRadius:'6px', padding:'10px 12px', color:'#66bb6a', fontSize:'12px' }}>
                ✓ Senha alterada! Redirecionando...
              </div>
            )}

            <button type="submit" disabled={!valido || loading || ok}
              style={{ background: valido && !loading && !ok ? '#9b8a5c' : '#3a3a3a', color: valido && !loading && !ok ? '#1a1000' : '#666', border:'none', padding:'11px', borderRadius:'6px', fontSize:'13px', fontWeight:'700', cursor: valido ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
              {loading && <span style={{ display:'inline-block', width:'14px', height:'14px', border:'2px solid #555', borderTopColor:'#1a1000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />}
              {loading ? 'Salvando...' : ok ? 'Redirecionando...' : 'Confirmar Nova Senha'}
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
