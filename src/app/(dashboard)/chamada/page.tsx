'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { CheckCircle, XCircle, Save, RefreshCw } from 'lucide-react'

interface MilitarForm {
  login: string
  posto: string
  nome: string
  nome_guerra: string
  lotacao: string
  grupamento: string
  pelotao: string
  status: 'presente' | 'ausente'
  justificativa: string
  observacao: string
}

// Exibe a lotação completa
function labelGrupamento(lotacao: string): string {
  return (lotacao || '').trim()
}

export default function ChamadaPage() {
  const { data: session } = useSession()
  const user = session?.user as any

  const [instrucao, setInstrucao]           = useState<any>(null)
  const [militares, setMilitares]           = useState<MilitarForm[]>([])
  const [responsavel, setResponsavel]       = useState('')
  const [grupamentoSel, setGrupamentoSel]   = useState('')    // lotação completa
  const [allGrupamentos, setAllGrupamentos] = useState<string[]>([])  // lotações completas únicas
  const [todosMilitares, setTodosMilitares] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [erro, setErro]         = useState('')

  useEffect(() => { fetchData() }, [user])

  async function fetchData() {
    setLoading(true)
    const [instrRes, milRes] = await Promise.all([
      fetch('/api/config'),
      fetch('/api/militares'),
    ])
    const instrData = await instrRes.json()
    const milData: any[] = await milRes.json()

    setInstrucao(instrData)
    setTodosMilitares(milData)
    setResponsavel(user?.name || '')

    // Grupamentos únicos = lotações completas únicas, ordenadas pela aba LOTACOES
    const gpsRaw = [...new Set(
      milData.filter((m: any) => m.ativo).map((m: any) => m.grupamento)
    )].filter(Boolean) as string[]

    let gps = [...gpsRaw].sort()
    try {
      const lotRes = await fetch('/api/lotacoes')
      if (lotRes.ok) {
        const ordem: string[] = await lotRes.json()
        const normalize = (s: string) => s.trim().toUpperCase().replace(/\s+/g, ' ')
        const indexMap = new Map(ordem.map((l: string, i: number) => [normalize(l), i]))
        gps = [...gpsRaw].sort((a, b) => {
          const ia = indexMap.get(normalize(a)) ?? Infinity
          const ib = indexMap.get(normalize(b)) ?? Infinity
          if (ia !== ib) return ia - ib
          return a.localeCompare(b, 'pt-BR')
        })
      }
    } catch { /* fallback alfabético */ }

    setAllGrupamentos(gps)

    // Usuário operacional vê só o próprio grupamento
    const gpInicial = user?.perfil === 'admin'
      ? (gps[0] || '')
      : (user?.grupamento || gps[0] || '')
    setGrupamentoSel(gpInicial)
    carregarMilitares(milData, gpInicial)
    setLoading(false)
  }

  function carregarMilitares(milData: any[], gp: string) {
    const lista = milData
      .filter((m: any) => m.ativo && m.grupamento === gp)
      .map((m: any) => ({
        login:        m.login,
        posto:        m.posto,
        nome:         m.nome,
        nome_guerra:  m.nome_guerra,
        lotacao:      m.lotacao,
        grupamento:   m.grupamento,
        pelotao:      m.pelotao,
        status:       'presente' as const,
        justificativa: '',
        observacao:   '',
      }))
    setMilitares(lista)
  }

  function handleGrupamentoChange(gp: string) {
    setGrupamentoSel(gp)
    carregarMilitares(todosMilitares, gp)
    setSaved(false)
    setErro('')
  }

  function setAllStatus(status: 'presente' | 'ausente') {
    setMilitares(prev => prev.map(m => ({ ...m, status })))
  }

  function updateMilitar(login: string, field: string, value: string) {
    setMilitares(prev => prev.map(m => m.login === login ? { ...m, [field]: value } : m))
  }

  async function handleSalvar() {
    if (!instrucao?.data || !instrucao?.assunto) {
      setErro('Configure a instrução em Configurações antes de lançar chamada.')
      return
    }
    setSaving(true); setErro('')
    const rows = militares.map(m => ({
      data:         instrucao.data,
      assunto:      instrucao.assunto,
      grupamento:   m.grupamento,
      pelotao:      m.pelotao,
      militar:      m.login,
      posto:        m.posto,
      nome_guerra:  m.nome_guerra,
      status:       m.status,
      justificativa: m.justificativa,
      responsavel,
      observacao:   m.observacao,
    }))
    const res = await fetch('/api/chamada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 5000) }
    else setErro('Erro ao salvar. Tente novamente.')
  }

  const presentes = militares.filter(m => m.status === 'presente').length
  const ausentes  = militares.filter(m => m.status === 'ausente').length

  if (loading) return <div className="p-8 loading-state"><span className="spinner"/>Carregando...</div>

  return (
    <div style={{ padding: '32px', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f0f0' }}>Lançar Chamada</h1>
        <p style={{ color: '#888', marginTop: '4px', fontSize: '13px' }}>Preenchimento coletivo por grupamento — uma única tela.</p>
      </div>

      {/* Barra de info */}
      <div className="military-card" style={{ padding: '16px 20px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '140px 1fr 2fr 1fr', gap: '16px' }}>
        <div>
          <p style={{ color: '#9b8a5c', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>Data da Instrução</p>
          <p style={{ color: instrucao?.data ? '#f0f0f0' : '#ef5350', fontWeight: '600', fontSize: '13px' }}>
            {instrucao?.data || '⚠ Não configurada'}
          </p>
        </div>
        <div>
          <p style={{ color: '#9b8a5c', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>Assunto</p>
          <p style={{ color: instrucao?.assunto ? '#f0f0f0' : '#ef5350', fontWeight: '600', fontSize: '13px' }}>
            {instrucao?.assunto || '⚠ Não configurado'}
          </p>
        </div>
        <div>
          <p style={{ color: '#9b8a5c', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>Grupamento</p>
          {user?.perfil === 'admin' ? (
            <select
              value={grupamentoSel}
              onChange={e => handleGrupamentoChange(e.target.value)}
              className="military-select"
              style={{ padding: '6px 8px', fontSize: '11px', width: '100%' }}
            >
              {allGrupamentos.map(g => (
                <option key={g} value={g}>{labelGrupamento(g)}</option>
              ))}
            </select>
          ) : (
            <p style={{ color: '#f0f0f0', fontWeight: '600', fontSize: '11px', lineHeight: '1.4' }}>{labelGrupamento(grupamentoSel)}</p>
          )}
        </div>
        <div>
          <p style={{ color: '#9b8a5c', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>Responsável pelo Anúncio</p>
          <input className="military-input" style={{ padding: '6px 8px', fontSize: '12px' }}
            value={responsavel} onChange={e => setResponsavel(e.target.value)} />
        </div>
      </div>



      {/* Stats + ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(155,138,92,0.1)', border: '1px solid rgba(155,138,92,0.25)', borderRadius: '5px', padding: '6px 14px', fontSize: '12px' }}>
          <span style={{ color: '#9b8a5c', fontWeight: '700' }}>{militares.length}</span>
          <span style={{ color: '#888', marginLeft: '5px' }}>militares</span>
        </div>
        <div style={{ background: 'rgba(102,187,106,0.1)', border: '1px solid rgba(102,187,106,0.2)', borderRadius: '5px', padding: '6px 14px', fontSize: '12px' }}>
          <span style={{ color: '#66bb6a', fontWeight: '700' }}>{presentes}</span>
          <span style={{ color: '#888', marginLeft: '5px' }}>presentes</span>
        </div>
        <div style={{ background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.2)', borderRadius: '5px', padding: '6px 14px', fontSize: '12px' }}>
          <span style={{ color: '#ef5350', fontWeight: '700' }}>{ausentes}</span>
          <span style={{ color: '#888', marginLeft: '5px' }}>ausentes</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => setAllStatus('presente')} className="btn-ghost" style={{ fontSize: '11px', padding: '6px 12px' }}>
            <CheckCircle size={13} style={{ color: '#66bb6a' }} /> Todos Presentes
          </button>
          <button onClick={() => setAllStatus('ausente')} className="btn-ghost" style={{ fontSize: '11px', padding: '6px 12px' }}>
            <XCircle size={13} style={{ color: '#ef5350' }} /> Todos Ausentes
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="military-card" style={{ overflow: 'hidden', marginBottom: '16px' }}>
        <table className="military-table">
          <thead>
            <tr>
              <th style={{ width: '36px' }}>#</th>
              <th>Nº PM</th>
              <th>P/G</th>
              <th>Nome de Guerra</th>
              <th>Pelotão</th>
              <th>Status</th>
              <th>Justificativa (se ausente)</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            {militares.map((m, i) => (
              <tr key={m.login} style={{ background: m.status === 'ausente' ? 'rgba(239,83,80,0.05)' : undefined }}>
                <td style={{ color: '#555', fontSize: '11px' }}>{i + 1}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888' }}>{m.login}</td>
                <td style={{ fontSize: '11px', color: '#888' }}>{m.posto}</td>
                <td style={{ fontWeight: '600', color: '#f0f0f0', cursor: 'default' }} title={m.nome}>{m.nome_guerra}</td>
                <td style={{ fontSize: '11px', color: '#888' }}>{m.pelotao}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => updateMilitar(m.login, 'status', 'presente')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '4px', border: 'none',
                        fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                        background: m.status === 'presente' ? '#66bb6a' : '#3a3a3a',
                        color: m.status === 'presente' ? '#fff' : '#666',
                        transition: 'all 0.15s',
                      }}>
                      <CheckCircle size={11}/> P
                    </button>
                    <button onClick={() => updateMilitar(m.login, 'status', 'ausente')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '4px', border: 'none',
                        fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                        background: m.status === 'ausente' ? '#ef5350' : '#3a3a3a',
                        color: m.status === 'ausente' ? '#fff' : '#666',
                        transition: 'all 0.15s',
                      }}>
                      <XCircle size={11}/> A
                    </button>
                  </div>
                </td>
                <td>
                  {m.status === 'ausente' && (
                    <input className="military-input" style={{ padding: '4px 8px', fontSize: '11px' }}
                      placeholder="Motivo da ausência..."
                      value={m.justificativa}
                      onChange={e => updateMilitar(m.login, 'justificativa', e.target.value)} />
                  )}
                </td>
                <td>
                  <input className="military-input" style={{ padding: '4px 8px', fontSize: '11px' }}
                    placeholder="Observação..."
                    value={m.observacao}
                    onChange={e => updateMilitar(m.login, 'observacao', e.target.value)} />
                </td>
              </tr>
            ))}
            {!militares.length && (
              <tr><td colSpan={8} className="empty-state">Nenhum militar ativo encontrado para este grupamento.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
        {erro && <span style={{ color: '#ef5350', fontSize: '12px' }}>{erro}</span>}
        {saved && (
          <span style={{ color: '#66bb6a', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={14}/> Chamada salva com sucesso!
          </span>
        )}
        <button onClick={handleSalvar} disabled={saving || !militares.length} className="btn-gold"
          style={{ padding: '9px 20px', fontSize: '13px', opacity: saving || !militares.length ? 0.5 : 1 }}>
          {saving ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }}/> Salvando...</>
                  : <><Save size={14}/> Salvar Chamada</>}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
