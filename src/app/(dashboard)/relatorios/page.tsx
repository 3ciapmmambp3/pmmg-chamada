'use client'
import { useState, useEffect } from 'react'
import { FileText, Download, RefreshCw } from 'lucide-react'

export default function RelatoriosPage() {
  const [data, setData]           = useState('')
  const [grupamento, setGrupamento] = useState('')
  const [lotacoes, setLotacoes]   = useState<string[]>([])
  const [loading, setLoading]     = useState(false)
  const [instrucao, setInstrucao] = useState<any>(null)
  const [chamadas, setChamadas]   = useState<any[]>([])
  const [fetched, setFetched]     = useState(false)

  useEffect(() => {
    fetch('/api/lotacoes')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setLotacoes(d) : setLotacoes([]))
      .catch(() => setLotacoes([]))
  }, [])

  async function fetchData() {
    if (!data) return
    setLoading(true)
    const [instrRes, chamadaRes] = await Promise.all([
      fetch('/api/config'),
      fetch(`/api/chamada?data=${data}${grupamento ? `&grupamento=${encodeURIComponent(grupamento)}` : ''}`),
    ])
    setInstrucao(await instrRes.json())
    setChamadas(await chamadaRes.json())
    setFetched(true)
    setLoading(false)
  }

  async function handleGerarPDF() {
    const { gerarRelatorioPDF } = await import('@/lib/pdf')
    gerarRelatorioPDF(chamadas, instrucao || { data, assunto: '' }, grupamento || undefined)
  }

  const presentes = chamadas.filter(c => c.status === 'presente')
  const ausentes  = chamadas.filter(c => c.status === 'ausente')

  return (
    <div style={{ padding: '32px', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f0f0' }}>Relatórios</h1>
        <p style={{ color: '#888', marginTop: '4px', fontSize: '13px' }}>Visualize e exporte relatórios de instruções.</p>
      </div>

      {/* Parâmetros */}
      <div className="military-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FileText size={14} style={{ color: '#9b8a5c' }}/>
          <span style={{ color: '#9b8a5c', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Parâmetros do Relatório
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Data da Instrução *</label>
            <input type="date" className="military-input" value={data}
              onChange={e => setData(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Grupamento (Lotação)</label>
            <select className="military-select" value={grupamento}
              onChange={e => setGrupamento(e.target.value)}>
              <option value="">Todos os grupamentos</option>
              {lotacoes.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <button onClick={fetchData} disabled={loading || !data} className="btn-gold"
          style={{ opacity: loading || !data ? 0.5 : 1 }}>
          {loading
            ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }}/> Carregando...</>
            : <><FileText size={14}/> Visualizar</>}
        </button>
      </div>

      {/* Preview */}
      {fetched && (
        <div className="military-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: '#9b8a5c', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Pré-visualização — {chamadas.length} registro(s)
            </span>
            <button onClick={handleGerarPDF} disabled={!chamadas.length} className="btn-gold"
              style={{ opacity: !chamadas.length ? 0.5 : 1 }}>
              <Download size={14}/> Gerar PDF
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Total', value: chamadas.length, color: '#9b8a5c' },
              { label: 'Presentes', value: presentes.length, color: '#66bb6a' },
              { label: 'Ausentes',  value: ausentes.length,  color: '#ef5350' },
            ].map(c => (
              <div key={c.label} style={{ background: '#1e1e1e', border: '1px solid #3a3a3a', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: c.color }}>{c.value}</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
              </div>
            ))}
          </div>

          {ausentes.length > 0 && (
            <>
              <div style={{ color: '#ef5350', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                Ausentes com justificativa
              </div>
              <table className="military-table">
                <thead>
                  <tr>
                    <th>Posto</th>
                    <th>Nome de Guerra</th>
                    <th>Grupamento</th>
                    <th>Justificativa</th>
                  </tr>
                </thead>
                <tbody>
                  {ausentes.map((c, i) => (
                    <tr key={i}>
                      <td>{c.posto}</td>
                      <td style={{ fontWeight: '600', color: '#f0f0f0' }}>{c.nome_guerra || c.militar}</td>
                      <td style={{ fontSize: '11px' }}>{c.grupamento}</td>
                      <td style={{ color: '#666' }}>{c.justificativa || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', color: '#999', fontSize: '11px',
  fontWeight: '600', textTransform: 'uppercase',
  letterSpacing: '0.5px', marginBottom: '5px',
}
