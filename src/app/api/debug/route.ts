import { NextResponse } from 'next/server'
import { getMilitares } from '@/lib/sheets'

// ROTA DE DIAGNÓSTICO — acesse /api/debug para verificar parsing
export async function GET() {
  try {
    const militares = await getMilitares()
    const ativos = militares.filter(m => m.ativo)

    // Resumo por pelotão
    const porPelotao: Record<string, number> = {}
    ativos.forEach(m => {
      if (!m.pelotao) return
      porPelotao[m.pelotao] = (porPelotao[m.pelotao] || 0) + 1
    })

    // Primeiros 10 para verificar parsing
    const preview = ativos.slice(0, 10).map(m => ({
      login:        m.login,
      nome_guerra:  m.nome_guerra,
      funcao:       m.funcao,
      lotacao_orig: m.lotacao,
      grupamento:   m.grupamento,
      pelotao:      m.pelotao,
    }))

    return NextResponse.json({
      total_ativos: ativos.length,
      pelotoes_encontrados: Object.keys(porPelotao).length,
      contagem_por_pelotao: porPelotao,
      preview_primeiros_10: preview,
    })
  } catch (e: any) {
    return NextResponse.json({ erro: e.message }, { status: 500 })
  }
}
