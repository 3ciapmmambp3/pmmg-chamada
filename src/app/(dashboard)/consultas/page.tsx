'use client'
import { useState, useEffect } from 'react'
import { Search, Filter, RefreshCw } from 'lucide-react'

export default function ConsultasPage() {
  const [filters, setFilters] = useState({
    dataInicio: '', dataFim: '', militar: '',
    grupamento: '', assunto: '', status: '', responsavel: '',
  })
  const [results, setResults]     = useState<any[]>([])
  const [loading, setLoading]     = useState(false)
  const [searched, setSearched]   = useState(false)
  const [lotacoes, setLotacoes]   = useState<string[]>([])

  useEffect(() => {
    fetch('/api/lotacoes')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setLotacoes(d) : setLotacoes([]))
      .catch(() => setLotacoes([]))
  }, [])

  function updateFilter(key: string, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  async function handleSearch() {
    setLoading(true); setSearched(true)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v) })
    const res = await fetch(`/api/chamada?${params.toString()}`)
    setResults(await res.json())
    setLoading(false)
  }

  function handleClear() {
    setFilters({ dataInicio: '', dataFim: '', militar: '', grupamento: '', assunto: '', status: '', responsavel: '' })
    setResults([]); setSearched(false)
  }

  return (
    <div style={{ padding: '32px', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f0f0' }}>Consultas</h1>
        <p style={{ color: '#888', marginTop: '4px', fontSize: '13px' }}>Pesquise chamadas por diversos filtros.</p>
      </div>

      {/* Filtros */}
      <div className="military-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter size={14} style={{ color: '#9b8a5c' }}/>
          <span style={{ color: '#9b8a5c', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Filtros</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Data Início</label>
            <input type="date" className="military-input" value={filters.dataInicio}
              onChange={e => updateFilter('dataInicio', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Data Fim</label>
            <input type="date" className="military-input" value={filters.dataFim}
              onChange={e => updateFilter('dataFim', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Militar</label>
            <input className="military-input" placeholder="Nome ou nome de guerra..."
              value={filters.militar} onChange={e => updateFilter('militar', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Grupamento (Lotação)</label>
            <select className="military-select" value={filters.grupamento}
              onChange={e => updateFilter('grupamento', e.target.value)}>
              <option value="">Todos</option>
              {lotacoes.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select className="military-select" value={filters.status}
              onChange={e => updateFilter('status', e.target.value)}>
              <option value="">Todos</option>
              <option value="presente">Presente</option>
              <option value="ausente">Ausente</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Assunto</label>
            <input className="military-input" placeholder="Assunto da instrução..."
              value={filters.assunto} onChange={e => updateFilter('assunto', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Responsável</label>
            <input className="military-input" placeholder="Responsável..."
              value={filters.responsavel} onChange={e => updateFilter('responsavel', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button onClick={handleSearch} disabled={loading} className="btn-gold"
            style={{ opacity: loading ? 0.6 : 1 }}>
            {loading ? <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }}/> : <Search size={14}/>}
            {loading ? 'Pesquisando...' : 'Pesquisar'}
          </button>
          <button onClick={handleClear} className="btn-ghost">Limpar</button>
        </div>
      </div>

      {/* Resultados */}
      {searched && (
        <div className="military-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #3a3a3a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#9b8a5c', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Resultados</span>
            <span style={{ color: '#666', fontSize: '12px' }}>{results.length} registro(s)</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="military-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Assunto</th>
                  <th>Grupamento</th>
                  <th>Posto</th>
                  <th>Nome de Guerra</th>
                  <th>Pelotão</th>
                  <th>Status</th>
                  <th>Justificativa</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: '11px' }}>{r.data}</td>
                    <td style={{ fontSize: '11px', maxWidth: '120px' }} title={r.assunto}>{r.assunto}</td>
                    <td style={{ fontSize: '11px', maxWidth: '160px' }} title={r.grupamento}>{r.grupamento}</td>
                    <td style={{ fontSize: '11px' }}>{r.posto}</td>
                    <td style={{ fontWeight: '600', color: '#f0f0f0' }}>{r.nome_guerra || r.militar}</td>
                    <td style={{ fontSize: '11px' }}>{r.pelotao}</td>
                    <td><span className={r.status === 'presente' ? 'badge-presente' : 'badge-ausente'}>{r.status}</span></td>
                    <td style={{ fontSize: '11px', color: '#666' }}>{r.justificativa || '-'}</td>
                    <td style={{ fontSize: '11px' }}>{r.responsavel}</td>
                  </tr>
                ))}
                {!results.length && (
                  <tr><td colSpan={9} className="empty-state">Nenhum resultado encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
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
