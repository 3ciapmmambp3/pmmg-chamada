'use client'
import { useState, useEffect } from 'react'
import { FileText, Download, RefreshCw, CheckCircle, AlertCircle, Info } from 'lucide-react'

export default function RelatoriosPage() {
  const [data, setData]           = useState('')
  const [grupamento, setGrupamento] = useState('')
  const [loading, setLoading]     = useState(false)
  const [instrucao, setInstrucao] = useState<any>(null)
  const [chamadas, setChamadas]   = useState<any[]>([])
  const [fetched, setFetched]     = useState(false)
  const [lotacoes, setLotacoes]   = useState<string[]>([])

  useEffect(() => {
    fetch('/api/lotacoes')
      .then(r => r.ok ? r.json() : [])
      .then(setLotacoes)
      .catch(() => {})
  }, [])

  async function fetchData() {
    if (!data) return
    setLoading(true)
    setFetched(false)

    const url = grupamento
      ? `/api/chamada?data=${data}&grupamento=${encodeURIComponent(grupamento)}`
      : `/api/chamada?data=${data}`

    const [instrRes, chamadaRes] = await Promise.all([
      fetch('/api/config'),
      fetch(url),
    ])
    setInstrucao(await instrRes.json())
    const result = await chamadaRes.json()
    setChamadas(Array.isArray(result) ? result : [])
    setFetched(true)
    setLoading(false)
  }

  async function handleGerarPDF() {
    const { gerarRelatorioPDF } = await import('@/lib/pdf')
    gerarRelatorioPDF(chamadas, instrucao || { data, assunto: '' }, grupamento || undefined)
  }

  const presentes = chamadas.filter(c => c.status === 'presente')
  const ausentes  = chamadas.filter(c => c.status === 'ausente')

  // Formatação de data para exibição
  function fmtDate(iso: string) {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return y && m && d ? `${d}/${m}/${y}` : iso
  }

  return (
    <div style={{ padding: '32px', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f0f0' }}>Relatórios</h1>
        <p style={{ color: '#888', marginTop: '4px', fontSize: '13px' }}>Visualize e exporte relatórios de instruções.</p>
      </div>

      {/* Filtros */}
      <div className="military-card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <FileText size={15} style={{ color: '#9b8a5c' }} />
          <span style={{ color: '#9b8a5c', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Parâmetros do Relatório
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', color: '#999', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Data da Instrução *
            </label>
            <input
              type="date"
              className="military-input"
              value={data}
              onChange={e => { setData(e.target.value); setFetched(false) }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#999', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Grupamento
            </label>
            <select
              className="military-select"
              value={grupamento}
              onChange={e => { setGrupamento(e.target.value); setFetched(false) }}
              style={{ width: '100%', fontSize: '12px' }}
            >
              <option value="">Todos os grupamentos</option>
              {lotacoes.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={fetchData}
            disabled={loading || !data}
            className="btn-gold"
            style={{ opacity: loading || !data ? 0.5 : 1 }}
          >
            {loading
              ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Buscando...</>
              : <><FileText size={14} /> Visualizar</>}
          </button>
        </div>
      </div>

      {/* Alerta de resultado */}
      {fetched && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', borderRadius: '6px', marginBottom: '16px',
          background: chamadas.length > 0 ? 'rgba(102,187,106,0.1)' : 'rgba(239,83,80,0.1)',
          border: `1px solid ${chamadas.length > 0 ? 'rgba(102,187,106,0.35)' : 'rgba(239,83,80,0.35)'}`,
          color: chamadas.length > 0 ? '#66bb6a' : '#ef5350',
          fontSize: '13px',
        }}>
          {chamadas.length > 0
            ? <CheckCircle size={16} />
            : <AlertCircle size={16} />}
          <span>
            {chamadas.length > 0
              ? <>Foram encontrados <strong>{chamadas.length}</strong> registro(s) para {fmtDate(data)}{grupamento ? ` — ${grupamento}` : ' (todos os grupamentos)'}</>
              : <>Nenhum registro encontrado para <strong>{fmtDate(data)}</strong>{grupamento ? ` no grupamento "${grupamento}"` : ''}. Verifique se a chamada foi lançada para essa data.</>
            }
          </span>
        </div>
      )}

      {/* Resultado */}
      {fetched && chamadas.length > 0 && (
        <div className="military-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ color: '#9b8a5c', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Pré-visualização
            </span>
            <button
              onClick={handleGerarPDF}
              className="btn-gold"
              style={{ fontSize: '12px', padding: '7px 14px' }}
            >
              <Download size={13} /> Gerar PDF
            </button>
          </div>

          {/* Totais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(155,138,92,0.1)', border: '1px solid rgba(155,138,92,0.25)', borderRadius: '6px', padding: '14px', textAlign: 'center' }}>
              <div style={{ color: '#9b8a5c', fontSize: '28px', fontWeight: '700' }}>{chamadas.length}</div>
              <div style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Total</div>
            </div>
            <div style={{ background: 'rgba(102,187,106,0.1)', border: '1px solid rgba(102,187,106,0.25)', borderRadius: '6px', padding: '14px', textAlign: 'center' }}>
              <div style={{ color: '#66bb6a', fontSize: '28px', fontWeight: '700' }}>{presentes.length}</div>
              <div style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Presentes</div>
            </div>
            <div style={{ background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.25)', borderRadius: '6px', padding: '14px', textAlign: 'center' }}>
              <div style={{ color: '#ef5350', fontSize: '28px', fontWeight: '700' }}>{ausentes.length}</div>
              <div style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Ausentes</div>
            </div>
          </div>

          {/* Tabela completa */}
          <div style={{ overflowX: 'auto' }}>
            <table className="military-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Posto</th>
                  <th>Nome de Guerra</th>
                  <th>Grupamento</th>
                  <th>Status</th>
                  <th>Justificativa</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                {chamadas.map((c, i) => (
                  <tr key={i} style={{ background: c.status === 'ausente' ? 'rgba(239,83,80,0.04)' : undefined }}>
                    <td style={{ color: '#555', fontSize: '11px' }}>{i + 1}</td>
                    <td style={{ fontSize: '11px', color: '#888' }}>{c.posto}</td>
                    <td style={{ fontWeight: '600', color: '#f0f0f0' }}>{c.nome_guerra || c.militar}</td>
                    <td style={{ fontSize: '11px', color: '#777' }}>{c.grupamento}</td>
                    <td>
                      <span style={{
                        fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '3px',
                        background: c.status === 'presente' ? 'rgba(102,187,106,0.2)' : 'rgba(239,83,80,0.2)',
                        color: c.status === 'presente' ? '#66bb6a' : '#ef5350',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', color: '#666' }}>{c.justificativa || '-'}</td>
                    <td style={{ fontSize: '11px', color: '#666' }}>{c.responsavel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
