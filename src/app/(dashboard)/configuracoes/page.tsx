'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Save, RefreshCw, CheckCircle, AlertCircle, Settings, Plus, Star, Clock } from 'lucide-react'

interface ConfigEntry {
  assunto: string
  data: string
  rowIndex: number
}

export default function ConfiguracoesPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [active, setActive]     = useState({ data: '', assunto: '' })
  const [history, setHistory]   = useState<ConfigEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [activating, setActivating] = useState<number | null>(null)
  const [form, setForm]         = useState({ data: '', assunto: '' })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [activeRes, histRes] = await Promise.all([
      fetch('/api/config').then(r => r.json()),
      fetch('/api/config?all=true').then(r => r.json()),
    ])
    setActive(activeRes)
    setHistory(histRes)
    setLoading(false)
  }

  async function handleSalvar() {
    if (!form.data || !form.assunto) return
    setSaving(true)
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
    setForm({ data: '', assunto: '' })
    setTimeout(() => setSaved(false), 3000)
    fetchAll()
  }

  async function handleActivate(entry: ConfigEntry) {
    setActivating(entry.rowIndex)
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    setActivating(null)
    fetchAll()
  }

  function isActive(entry: ConfigEntry) {
    return entry.data === active.data && entry.assunto === active.assunto
  }

  function formatDate(iso: string) {
    if (!iso) return '-'
    const d = new Date(iso + 'T12:00:00')
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR')
  }

  if (user?.perfil !== 'admin') {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#888', marginTop: '80px', fontFamily: 'Arial' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
        <p style={{ fontSize: '14px' }}>Acesso restrito ao administrador.</p>
      </div>
    )
  }

  const semConfig = !active.data || !active.assunto

  return (
    <div style={{ padding: '32px', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0f0f0' }}>Configurações</h1>
        <p style={{ color: '#888', marginTop: '4px', fontSize: '13px' }}>
          Gerencie o histórico de instruções. A instrução marcada com ★ é a ativa.
        </p>
      </div>

      {semConfig && (
        <div style={{
          background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.35)',
          borderRadius: '6px', padding: '12px 16px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '10px',
          color: '#ef5350', fontSize: '12px',
        }}>
          <AlertCircle size={16}/>
          <span><strong>Atenção:</strong> Nenhuma instrução está configurada. Adicione uma nova instrução abaixo.</span>
        </div>
      )}

      {/* Instrução Ativa */}
      {active.data && active.assunto && (
        <div className="military-card" style={{ padding: '16px 24px', maxWidth: '680px', marginBottom: '24px', borderLeft: '3px solid #9b8a5c' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Star size={14} style={{ color: '#f5c842', fill: '#f5c842' }}/>
            <span style={{ color: '#9b8a5c', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Instrução Ativa
            </span>
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div>
              <div style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data</div>
              <div style={{ color: '#e0e0e0', fontSize: '14px', fontWeight: '600' }}>{formatDate(active.data)}</div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assunto</div>
              <div style={{ color: '#e0e0e0', fontSize: '14px', fontWeight: '600' }}>{active.assunto}</div>
            </div>
          </div>
        </div>
      )}

      {/* Formulário nova instrução */}
      <div className="military-card" style={{ padding: '24px', maxWidth: '680px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Plus size={15} style={{ color: '#9b8a5c' }}/>
          <span style={{ color: '#9b8a5c', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Nova Instrução
          </span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 180px' }}>
            <label style={{ display: 'block', color: '#999', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Data *
            </label>
            <input
              type="date"
              className="military-input"
              value={form.data}
              onChange={e => setForm({ ...form, data: e.target.value })}
            />
          </div>
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', color: '#999', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Assunto *
            </label>
            <input
              className="military-input"
              placeholder="Ex: Uso Progressivo da Força"
              value={form.assunto}
              onChange={e => setForm({ ...form, assunto: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '2px' }}>
            {saved && (
              <span style={{ color: '#66bb6a', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14}/> Adicionado!
              </span>
            )}
            <button
              onClick={handleSalvar}
              disabled={saving || !form.data || !form.assunto}
              className="btn-gold"
              style={{ opacity: saving || !form.data || !form.assunto ? 0.5 : 1 }}
            >
              {saving
                ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }}/> Salvando...</>
                : <><Save size={14}/> Adicionar</>}
            </button>
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="military-card" style={{ padding: '24px', maxWidth: '680px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Clock size={15} style={{ color: '#9b8a5c' }}/>
          <span style={{ color: '#9b8a5c', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Histórico de Instruções
          </span>
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner"/>Carregando...</div>
        ) : history.length === 0 ? (
          <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
            Nenhuma instrução registrada ainda.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', padding: '6px 8px', fontWeight: '600' }}>#</th>
                <th style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', padding: '6px 8px', fontWeight: '600' }}>Data</th>
                <th style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', padding: '6px 8px', fontWeight: '600' }}>Assunto</th>
                <th style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', padding: '6px 8px', fontWeight: '600' }}>Status</th>
                <th style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', padding: '6px 8px', fontWeight: '600' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((entry, i) => {
                const ativa = isActive(entry)
                return (
                  <tr key={entry.rowIndex} style={{
                    borderBottom: '1px solid #222',
                    background: ativa ? 'rgba(155,138,92,0.08)' : 'transparent',
                  }}>
                    <td style={{ color: '#555', padding: '10px 8px' }}>{history.length - i}</td>
                    <td style={{ color: ativa ? '#f5c842' : '#ccc', padding: '10px 8px', fontWeight: ativa ? '600' : '400' }}>
                      {formatDate(entry.data)}
                    </td>
                    <td style={{ color: ativa ? '#f0f0f0' : '#aaa', padding: '10px 8px', fontWeight: ativa ? '600' : '400' }}>
                      {entry.assunto}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      {ativa
                        ? <span style={{ color: '#f5c842', fontSize: '16px' }} title="Instrução ativa">★</span>
                        : <span style={{ color: '#444', fontSize: '16px' }}>☆</span>}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      {ativa ? (
                        <span style={{ color: '#9b8a5c', fontSize: '11px' }}>Ativa</span>
                      ) : (
                        <button
                          onClick={() => handleActivate(entry)}
                          disabled={activating !== null}
                          style={{
                            background: 'transparent', border: '1px solid #9b8a5c',
                            color: '#9b8a5c', borderRadius: '4px', padding: '4px 10px',
                            fontSize: '11px', cursor: 'pointer', opacity: activating !== null ? 0.5 : 1,
                          }}
                        >
                          {activating === entry.rowIndex ? 'Ativando...' : 'Ativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
