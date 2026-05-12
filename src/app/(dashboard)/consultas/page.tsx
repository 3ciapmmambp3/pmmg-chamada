'use client'
import { useState } from 'react'
import { Search, Filter, RefreshCw } from 'lucide-react'
import { GRUPAMENTOS } from '@/lib/utils'

export default function ConsultasPage() {
  const [filters, setFilters] = useState({
    dataInicio: '',
    dataFim: '',
    militar: '',
    grupamento: '',
    assunto: '',
    status: '',
    responsavel: '',
  })
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  function updateFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSearch() {
    setLoading(true)
    setSearched(true)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v) })
    const res = await fetch(`/api/chamada?${params.toString()}`)
    const data = await res.json()
    setResults(data)
    setLoading(false)
  }

  function handleClear() {
    setFilters({ dataInicio: '', dataFim: '', militar: '', grupamento: '', assunto: '', status: '', responsavel: '' })
    setResults([])
    setSearched(false)
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Consultas</h1>
        <p className="text-gray-400 mt-1">Pesquise chamadas por diversos filtros.</p>
      </div>

      {/* Filters */}
      <div className="military-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-[#B8973E]" />
          <h2 className="text-[#B8973E] font-bold uppercase tracking-wider text-sm">Filtros</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">Data Início</label>
            <input type="date" className="military-input" value={filters.dataInicio} onChange={(e) => updateFilter('dataInicio', e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">Data Fim</label>
            <input type="date" className="military-input" value={filters.dataFim} onChange={(e) => updateFilter('dataFim', e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">Militar</label>
            <input className="military-input" placeholder="Nome ou nome de guerra..." value={filters.militar} onChange={(e) => updateFilter('militar', e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">Grupamento</label>
            <select className="military-select" value={filters.grupamento} onChange={(e) => updateFilter('grupamento', e.target.value)}>
              <option value="">Todos</option>
              {GRUPAMENTOS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">Status</label>
            <select className="military-select" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
              <option value="">Todos</option>
              <option value="presente">Presente</option>
              <option value="ausente">Ausente</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">Assunto</label>
            <input className="military-input" placeholder="Assunto da instrução..." value={filters.assunto} onChange={(e) => updateFilter('assunto', e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wide">Responsável</label>
            <input className="military-input" placeholder="Responsável..." value={filters.responsavel} onChange={(e) => updateFilter('responsavel', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={handleSearch} disabled={loading} className="btn-gold flex items-center gap-2">
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
            Pesquisar
          </button>
          <button onClick={handleClear} className="btn-ghost flex items-center gap-2">
            Limpar
          </button>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="military-card overflow-hidden">
          <div className="p-4 border-b border-[#333] flex items-center justify-between">
            <span className="text-[#B8973E] font-bold text-sm uppercase tracking-wider">Resultados</span>
            <span className="text-gray-400 text-sm">{results.length} registro(s)</span>
          </div>
          <div className="overflow-x-auto">
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
                    <td className="text-xs">{r.data}</td>
                    <td className="text-xs max-w-[120px] truncate">{r.assunto}</td>
                    <td>{r.grupamento}</td>
                    <td className="text-xs">{r.posto}</td>
                    <td className="font-semibold text-white">{r.nome_guerra || r.militar}</td>
                    <td className="text-xs">{r.pelotao}</td>
                    <td>
                      <span className={r.status === 'presente' ? 'badge-presente' : 'badge-ausente'}>
                        {r.status}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">{r.justificativa || '-'}</td>
                    <td className="text-xs">{r.responsavel}</td>
                  </tr>
                ))}
                {!results.length && (
                  <tr><td colSpan={9} className="text-center text-gray-500 py-8">Nenhum resultado encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
