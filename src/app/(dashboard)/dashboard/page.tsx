'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Users, UserCheck, UserX, Shield, Clock, Calendar } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)
    const res = await fetch('/api/dashboard')
    const data = await res.json()
    setStats(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-[#B8973E] animate-pulse text-lg">Carregando dashboard...</div>
      </div>
    )
  }

  const instrucao = stats?.instrucaoAtual
  const pieData = [
    { name: 'Presentes', value: stats?.presentes || 0, color: '#B8973E' },
    { name: 'Ausentes', value: stats?.ausentes || 0, color: '#555' },
    { name: 'Pendentes', value: (stats?.totalMilitares || 0) - (stats?.presentes || 0) - (stats?.ausentes || 0), color: '#444' },
  ].filter(d => d.value > 0)

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">Visão geral das instruções e presença dos militares.</p>
          </div>
        </div>
        {instrucao?.assunto && (
          <div style={{ marginTop: "24px", textAlign: "center", borderTop: "1px solid #2a2a2a", borderBottom: "1px solid #2a2a2a", padding: "20px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
              <Calendar size={20} className="text-[#B8973E]" style={{ flexShrink: 0 }} />
              <span style={{ color: "#9b8a5c", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", flexShrink: 0 }}>
                {instrucao.data}
              </span>
              <span style={{ color: "#444", fontSize: "18px" }}>|</span>
              <span style={{ color: "#f0f0f0", fontSize: "22px", fontWeight: "700", letterSpacing: "0.3px" }}>
                {instrucao.assunto}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={<Users size={32} className="text-[#B8973E]" />}
          label="Total de Militares"
          value={stats?.totalMilitares || 0}
          sub=""
          subColor=""
        />
        <StatCard
          icon={<UserCheck size={32} className="text-[#B8973E]" />}
          label="Presentes"
          value={stats?.presentes || 0}
          sub={stats?.percentualPresentes ? `${stats.percentualPresentes.toFixed(2)}%` : ''}
          subColor="text-green-400"
        />
        <StatCard
          icon={<UserX size={32} className="text-[#B8973E]" />}
          label="Ausentes"
          value={stats?.ausentes || 0}
          sub={stats?.percentualAusentes ? `${stats.percentualAusentes.toFixed(2)}%` : ''}
          subColor="text-red-400"
        />
        <StatCard
          icon={<Shield size={32} className="text-[#B8973E]" />}
          label="ADM"
          value={stats?.adm || 0}
          sub={stats?.percentualAdm ? `${stats.percentualAdm.toFixed(2)}%` : ''}
          subColor="text-gray-400"
        />
        <StatCard
          icon={<Clock size={32} className="text-[#B8973E]" />}
          label="Pendentes"
          value={stats?.pendentes || 0}
          sub="Grupamentos"
          subColor="text-yellow-400"
        />
      </div>

      {/* Charts & Tables Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Pie Chart */}
        <div className="military-card p-6">
          <h2 className="text-[#B8973E] font-bold uppercase tracking-wider text-sm mb-5">
            Presença por Grupamento
          </h2>
          <div className="flex items-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#242424', border: '1px solid #444', borderRadius: 6 }}
                    labelStyle={{ color: '#B8973E' }}
                    itemStyle={{ color: '#ccc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1">
              <LegendItem color="#B8973E" label="Presentes" value={`${stats?.presentes || 0} (${stats?.percentualPresentes?.toFixed(2) || '0.00'}%)`} />
              <LegendItem color="#555" label="Ausentes" value={`${stats?.ausentes || 0} (${stats?.percentualAusentes?.toFixed(2) || '0.00'}%)`} />
              <LegendItem color="#444" label="Pendentes" value={`${((stats?.totalMilitares || 0) - (stats?.presentes || 0) - (stats?.ausentes || 0))} (${stats?.pendentes || 0} grupos)`} />
            </div>
          </div>
        </div>

        {/* Pendências */}
        <div className="military-card p-6">
          <h2 className="text-[#B8973E] font-bold uppercase tracking-wider text-sm mb-5">
            Pendências por Grupamento
          </h2>
          <table className="military-table">
            <thead>
              <tr>
                <th>Grupamento</th>
                <th>Responsável</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.pendenciasPorGrupamento || []).map((g: any) => (
                <tr key={g.grupamento}>
                  <td className="font-semibold text-white" style={{ fontSize: "11px" }}>{g.grupamento}</td>
                  <td>{g.responsavel}</td>
                  <td>
                    <span className={g.status === 'PENDENTE' ? 'badge-pendente' : 'badge-concluido'}>
                      {g.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats?.pendenciasPorGrupamento?.length) && (
                <tr><td colSpan={3} className="text-center text-gray-500 py-4">Nenhum dado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumo por Pelotão */}
      <div className="military-card p-6">
        <h2 className="text-[#B8973E] font-bold uppercase tracking-wider text-sm mb-5">
          Resumo por Pelotão
        </h2>
        <table className="military-table">
          <thead>
            <tr>
              <th>Pelotão</th>
              <th>Militares</th>
              <th>Presentes</th>
              <th>Ausentes</th>
              <th>Percentual</th>
            </tr>
          </thead>
          <tbody>
            {(stats?.resumoPorPelotao || []).map((p: any) => (
              <tr key={p.pelotao}>
                <td className="font-semibold text-white">{p.pelotao}</td>
                <td>{p.militares}</td>
                <td>{p.presentes}</td>
                <td>{p.ausentes}</td>
                <td className="text-green-400 font-semibold">{p.percentual?.toFixed(2)}%</td>
              </tr>
            ))}
            {(!stats?.resumoPorPelotao?.length) && (
              <tr><td colSpan={5} className="text-center text-gray-500 py-4">Nenhum dado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-center mt-10 pt-6 border-t border-[#2a2a2a]">
        <p className="text-[#B8973E] text-sm font-semibold">3ª Cia PM MAmb - Polícia Militar de Minas Gerais</p>
        <p className="text-gray-500 text-xs mt-1">© 2026 – Todos os direitos reservados.</p>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, subColor }: any) {
  return (
    <div className="stat-card">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-[#B8973E] text-xs font-bold uppercase tracking-wider">{label}</p>
        <p className="text-white text-3xl font-bold leading-none mt-1">{value}</p>
        {sub && <p className={`text-sm font-semibold mt-0.5 ${subColor}`}>{sub}</p>}
      </div>
    </div>
  )
}

function LegendItem({ color, label, value }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ background: color }} />
      <div>
        <span className="text-gray-300 text-sm">{label}</span>
        <span className="text-gray-500 text-xs ml-2">{value}</span>
      </div>
    </div>
  )
}
