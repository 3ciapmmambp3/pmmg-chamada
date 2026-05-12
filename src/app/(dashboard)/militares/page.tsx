'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Edit2, UserX, RefreshCw, Search, KeyRound } from 'lucide-react'

const POSTOS = ['Cel PM','Ten Cel PM','Maj PM','Cap PM','1º Ten PM','2º Ten PM','Asp Of PM','Sub Ten PM','1º Sgt PM','2º Sgt PM','3º Sgt PM','Cb PM','SD PM']
const PERFIS = ['operacional', 'admin']

const EMPTY_FORM = {
  login: '', posto: '', nome: '', nome_guerra: '',
  funcao: '', lotacao: '', perfil: 'operacional' as const,
  senha: 'Mudar@123', trocar_senha: true, ativo: true,
}

export default function MilitaresPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [militares, setMilitares] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editLogin, setEditLogin] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchMilitares() }, [])

  useEffect(() => {
    const s = search.toLowerCase()
    setFiltered(militares.filter((m) =>
      m.nome.toLowerCase().includes(s) ||
      m.nome_guerra.toLowerCase().includes(s) ||
      m.login.includes(s) ||
      m.lotacao.toLowerCase().includes(s) ||
      m.posto.toLowerCase().includes(s)
    ))
  }, [search, militares])

  async function fetchMilitares() {
    setLoading(true)
    const res = await fetch('/api/militares')
    setMilitares(await res.json())
    setLoading(false)
  }

  function openNew() {
    setForm({ ...EMPTY_FORM })
    setEditLogin(null)
    setShowForm(true)
    setMsg('')
  }

  function openEdit(m: any) {
    setForm({ login: m.login, posto: m.posto, nome: m.nome, nome_guerra: m.nome_guerra,
      funcao: m.funcao, lotacao: m.lotacao, perfil: m.perfil,
      senha: m.senha, trocar_senha: m.trocar_senha, ativo: m.ativo })
    setEditLogin(m.login)
    setShowForm(true)
    setMsg('')
  }

  async function handleSalvar() {
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/militares', {
      method: editLogin ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editLogin ? { ...form, login: editLogin } : form),
    })
    setSaving(false)
    if (res.ok) {
      setShowForm(false)
      fetchMilitares()
    } else {
      const d = await res.json()
      setMsg(d.error || 'Erro ao salvar.')
    }
  }

  async function handleResetSenha(login: string) {
    if (!confirm(`Resetar senha de ${login} para Mudar@123?`)) return
    await fetch('/api/militares', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, senha: 'Mudar@123', trocar_senha: true }),
    })
    fetchMilitares()
  }

  async function handleDesativar(login: string) {
    if (!confirm('Desativar este militar?')) return
    await fetch('/api/militares', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, ativo: false }),
    })
    fetchMilitares()
  }

  if (user?.perfil !== 'admin') {
    return <div className="p-8 text-center text-gray-400 mt-20"><p className="text-lg">Acesso restrito ao administrador.</p></div>
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Militares</h1>
          <p className="text-gray-400 mt-1">Gestão do efetivo — {militares.filter(m=>m.ativo).length} ativos de {militares.length}</p>
        </div>
        <button onClick={openNew} className="btn-gold flex items-center gap-2">
          <Plus size={16} /> Novo Militar
        </button>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input className="military-input pl-10" placeholder="Buscar por nome, Nº PM, posto, lotação..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="military-card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-[#B8973E] font-bold text-lg uppercase tracking-wider mb-5">
              {editLogin ? 'Editar Militar' : 'Novo Militar'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Nº PM (Login)</label>
                <input className="military-input" value={form.login}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                  disabled={!!editLogin} placeholder="138.988-1" />
              </div>
              <div>
                <label className="form-label">Posto / Graduação</label>
                <select className="military-select" value={form.posto} onChange={(e) => setForm({ ...form, posto: e.target.value })}>
                  <option value="">Selecione...</option>
                  {POSTOS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Nome Completo</label>
                <input className="military-input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Nome de Guerra</label>
                <input className="military-input" value={form.nome_guerra} onChange={(e) => setForm({ ...form, nome_guerra: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Função</label>
                <input className="military-input" value={form.funcao} onChange={(e) => setForm({ ...form, funcao: e.target.value })}
                  placeholder="Ex: Operacional, Cmt Cia" />
              </div>
              <div>
                <label className="form-label">Lotação</label>
                <input className="military-input" value={form.lotacao} onChange={(e) => setForm({ ...form, lotacao: e.target.value })}
                  placeholder="1 GP / 1 PEL / 3 CIA PM MAMB / GV" />
              </div>
              <div>
                <label className="form-label">Perfil</label>
                <select className="military-select" value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value as any })}>
                  {PERFIS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Senha inicial</label>
                <input className="military-input" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
              </div>
              <div className="flex items-center gap-6 col-span-2">
                <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.trocar_senha} onChange={(e) => setForm({ ...form, trocar_senha: e.target.checked })}
                    className="w-4 h-4 accent-[#B8973E]" />
                  Obrigar troca de senha no próximo login
                </label>
                <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                    className="w-4 h-4 accent-[#B8973E]" />
                  Ativo
                </label>
              </div>
            </div>
            {msg && <p className="text-red-400 text-sm mt-3">{msg}</p>}
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
              <button onClick={handleSalvar} disabled={saving} className="btn-gold flex items-center gap-2">
                {saving && <RefreshCw size={14} className="animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="military-card overflow-hidden">
        <table className="military-table">
          <thead>
            <tr>
              <th>Nº PM</th>
              <th>P/G</th>
              <th>Nome de Guerra</th>
              <th>Função</th>
              <th>Lotação</th>
              <th>Perfil</th>
              <th>Senha</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-[#B8973E] animate-pulse">Carregando...</td></tr>
            ) : filtered.map((m) => (
              <tr key={m.login} className={!m.ativo ? 'opacity-40' : ''}>
                <td className="font-mono text-xs text-gray-400">{m.login}</td>
                <td className="text-xs">{m.posto}</td>
                <td className="font-semibold text-white">{m.nome_guerra}</td>
                <td className="text-xs text-gray-400">{m.funcao}</td>
                <td className="text-xs text-gray-400 max-w-[160px] truncate" title={m.lotacao}>{m.lotacao}</td>
                <td>
                  <span className={`text-xs font-semibold uppercase ${m.perfil === 'admin' ? 'text-[#B8973E]' : 'text-gray-500'}`}>
                    {m.perfil}
                  </span>
                </td>
                <td>
                  {m.trocar_senha ? (
                    <span className="text-yellow-500 text-xs font-semibold">⚠ Trocar</span>
                  ) : (
                    <span className="text-green-500 text-xs">✓ Definida</span>
                  )}
                </td>
                <td>
                  <span className={m.ativo ? 'badge-presente' : 'badge-ausente'}>
                    {m.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(m)} title="Editar" className="text-gray-400 hover:text-[#B8973E] transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleResetSenha(m.login)} title="Resetar senha" className="text-gray-400 hover:text-yellow-400 transition-colors">
                      <KeyRound size={14} />
                    </button>
                    {m.ativo && (
                      <button onClick={() => handleDesativar(m.login)} title="Desativar" className="text-gray-400 hover:text-red-400 transition-colors">
                        <UserX size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !filtered.length && (
              <tr><td colSpan={9} className="text-center text-gray-500 py-8">Nenhum militar encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <style jsx>{`.form-label{display:block;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}`}</style>
    </div>
  )
}
