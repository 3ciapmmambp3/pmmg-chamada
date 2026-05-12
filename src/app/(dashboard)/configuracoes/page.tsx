'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Save, RefreshCw, CheckCircle, AlertCircle, Plus, Zap, Clock } from 'lucide-react'

interface InstrucaoHist {
  assunto: string
  data: string
  ativa: boolean
  rowIndex: number
}

export default function ConfiguracoesPage() {
  const { data: session } = useSession()
  const user = session?.user as any

  const [historico, setHistorico]   = useState<InstrucaoHist[]>([])
  const [novaData, setNovaData]     = useState('')
  const [novoAssunto, setNovoAssunto] = useState('')
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [ativando, setAtivando]     = useState<number | null>(null)
  const [msg, setMsg]               = useState('')

  useEffect(() => { fetchHistorico() }, [])

  async function fetchHistorico() {
    setLoading(true)
    try {
      const res = await fetch('/api/config?todas=1')
      if (!res.ok) { setHistorico([]); setLoading(false); return }
      const data = await res.json()
      setHistorico(Array.isArray(data) ? data : [])
    } catch (e) {
      setHistorico([])
    }
    setLoading(false)
  }

  function showMsg(texto: string) {
    setMsg(texto)
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleAdicionar() {
    if (!novaData || !novoAssunto.trim()) return
    setSaving(true)
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: novaData, assunto: novoAssunto.trim() }),
    })
    setSaving(false)
    setNovaData('')
    setNovoAssunto('')
    await fetchHistorico()
    showMsg('Instrução adicionada e ativada!')
  }

  async function handleAtivar(rowIndex: number) {
    setAtivando(rowIndex)
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativar: rowIndex }),
    })
    setAtivando(null)
    await fetchHistorico()
    showMsg('Instrução ativada com sucesso!')
  }

  function formatarData(data: string): string {
    if (!data) return '—'
    // Se vier como DD/MM/AAAA, retorna direto
    if (data.includes('/')) return data
    // Se vier como AAAA-MM-DD (date input)
    if (data.includes('-')) {
      const [y, m, d] = data.split('-')
      return `${d}/${m}/${y}`
    }
    return data
  }

  if (user?.perfil !== 'admin') {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#888', marginTop: '80px', fontFamily: 'Arial' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
        <p>Acesso restrito ao administrador.</p>
      </div>
    )
  }

  const ativa = historico.find(h => h.ativa)

  return (
    <div style={{ padding: '32px', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f0f0' }}>Configurações</h1>
        <p style={{ color: '#888', marginTop: '4px', fontSize: '13px' }}>
          Gerencie o histórico de instruções. A instrução <strong style={{ color: '#9b8a5c' }}>ATIVA</strong> é usada em todos os lançamentos de chamada.
        </p>
      </div>

      {/* Instrução ativa atual */}
      <div style={{
        background: ativa ? 'rgba(155,138,92,0.1)' : 'rgba(239,83,80,0.08)',
        border: `1px solid ${ativa ? 'rgba(155,138,92,0.35)' : 'rgba(239,83,80,0.3)'}`,
        borderRadius: '8px', padding: '14px 18px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        {ativa
          ? <Zap size={18} style={{ color: '#9b8a5c', flexShrink: 0 }} />
          : <AlertCircle size={18} style={{ color: '#ef5350', flexShrink: 0 }} />
        }
        <div>
          <div style={{ fontSize: '11px', color: ativa ? '#9b8a5c' : '#ef5350', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
            {ativa ? 'Instrução Ativa' : '⚠ Nenhuma instrução ativa'}
          </div>
          {ativa
            ? <div style={{ color: '#f0f0f0', fontSize: '13px' }}>
                <strong>{ativa.assunto}</strong>
                <span style={{ color: '#888', marginLeft: '12px' }}>{formatarData(ativa.data)}</span>
              </div>
            : <div style={{ color: '#888', fontSize: '12px' }}>Adicione uma instrução abaixo e ela será ativada automaticamente.</div>
          }
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* ── Adicionar nova instrução ── */}
        <div className="military-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Plus size={14} style={{ color: '#9b8a5c' }}/>
            <span style={{ color: '#9b8a5c', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Nova Instrução
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', color: '#999', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
                Data *
              </label>
              <input
                type="date"
                className="military-input"
                value={novaData}
                onChange={e => setNovaData(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#999', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
                Assunto *
              </label>
              <input
                className="military-input"
                placeholder="Ex: Uso Progressivo da Força"
                value={novoAssunto}
                onChange={e => setNovoAssunto(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdicionar()}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
              {msg && (
                <span style={{ color: '#66bb6a', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
                  <CheckCircle size={13}/> {msg}
                </span>
              )}
              <button
                onClick={handleAdicionar}
                disabled={saving || !novaData || !novoAssunto.trim()}
                className="btn-gold"
                style={{ marginLeft: 'auto', opacity: saving || !novaData || !novoAssunto.trim() ? 0.5 : 1 }}
              >
                {saving
                  ? <><RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }}/> Salvando...</>
                  : <><Plus size={13}/> Adicionar e Ativar</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── Histórico ── */}
        <div className="military-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Clock size={14} style={{ color: '#9b8a5c' }}/>
            <span style={{ color: '#9b8a5c', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Histórico de Instruções
            </span>
            <span style={{ marginLeft: 'auto', background: 'rgba(155,138,92,0.15)', color: '#9b8a5c', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px' }}>
              {historico.length} registro{historico.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="loading-state"><span className="spinner"/>Carregando...</div>
          ) : historico.length === 0 ? (
            <div className="empty-state">Nenhuma instrução cadastrada ainda.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '360px', overflowY: 'auto' }}>
              {/* Mostra do mais recente para o mais antigo */}
              {[...historico].reverse().map((h) => (
                <div key={h.rowIndex} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '6px',
                  background: h.ativa ? 'rgba(155,138,92,0.12)' : '#1e1e1e',
                  border: `1px solid ${h.ativa ? 'rgba(155,138,92,0.4)' : '#3a3a3a'}`,
                  transition: 'all 0.15s',
                }}>
                  {/* Indicador ativo */}
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: h.ativa ? '#9b8a5c' : '#3a3a3a',
                    boxShadow: h.ativa ? '0 0 6px #9b8a5c' : 'none',
                  }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: h.ativa ? '#f0f0f0' : '#ccc', fontSize: '12px', fontWeight: h.ativa ? '700' : '400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.assunto}
                    </div>
                    <div style={{ color: '#666', fontSize: '10px', marginTop: '2px' }}>
                      {formatarData(h.data)}
                    </div>
                  </div>
                  {h.ativa ? (
                    <span style={{ fontSize: '10px', color: '#9b8a5c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0 }}>
                      ✓ Ativa
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAtivar(h.rowIndex)}
                      disabled={ativando === h.rowIndex}
                      style={{
                        background: 'none', border: '1px solid #4a4a4a',
                        color: '#888', fontSize: '10px', fontWeight: '600',
                        padding: '3px 10px', borderRadius: '4px', cursor: 'pointer',
                        flexShrink: 0, transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                      onMouseEnter={e => { (e.currentTarget as any).style.borderColor = '#9b8a5c'; (e.currentTarget as any).style.color = '#9b8a5c' }}
                      onMouseLeave={e => { (e.currentTarget as any).style.borderColor = '#4a4a4a'; (e.currentTarget as any).style.color = '#888' }}
                    >
                      {ativando === h.rowIndex
                        ? <RefreshCw size={10} style={{ animation: 'spin 0.8s linear infinite' }}/>
                        : <Zap size={10}/>
                      }
                      Ativar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
