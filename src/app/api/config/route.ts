import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getInstrucaoConfig, setInstrucaoConfig, getTodasInstrucoes, ativarInstrucao } from '@/lib/sheets'

// GET /api/config          → instrução ativa
// GET /api/config?todas=1  → histórico completo
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const todas = req.nextUrl.searchParams.get('todas')
    if (todas) {
      const hist = await getTodasInstrucoes()
      return NextResponse.json(hist)
    }
    const config = await getInstrucaoConfig()
    return NextResponse.json(config)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/config  { assunto, data }         → nova instrução + ativa
// POST /api/config  { ativar: rowIndex }       → ativa instrução existente
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.perfil !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await req.json()
    if (body.ativar !== undefined) {
      await ativarInstrucao(Number(body.ativar))
    } else {
      await setInstrucaoConfig({ assunto: body.assunto, data: body.data, responsavel_instrucao: body.responsavel_instrucao || '' })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
