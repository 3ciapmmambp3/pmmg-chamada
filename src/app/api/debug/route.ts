import { NextResponse } from 'next/server'
import { getMilitares } from '@/lib/sheets'

// ROTA TEMPORÁRIA DE DIAGNÓSTICO — remover após confirmar login funcionando
export async function GET() {
  try {
    const militares = await getMilitares()
    const preview = militares.slice(0, 5).map(m => ({
      login_planilha: m.login,
      login_limpo: m.login.replace(/[^0-9]/g, ''),
      nome_guerra: m.nome_guerra,
      senha_status: m.senha ? `OK - "${m.senha}"` : '❌ VAZIA — adicione Mudar@123 na coluna H',
      trocar_senha: m.trocar_senha,
      ativo: m.ativo,
      linha: m.rowIndex,
    }))
    return NextResponse.json({ 
      total_militares: militares.length, 
      primeiros_5: preview,
      instrucao: 'Se senha_status mostrar VAZIA, adicione Mudar@123 na coluna H da planilha'
    })
  } catch (e: any) {
    return NextResponse.json({ erro: e.message }, { status: 500 })
  }
}
