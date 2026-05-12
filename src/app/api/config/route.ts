import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getInstrucaoConfig,
  setInstrucaoConfig,
  getAllInstrucaoConfigs,
  activateInstrucaoConfig,
} from '@/lib/sheets'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const all = req.nextUrl.searchParams.get('all') === 'true'
    if (all) {
      const configs = await getAllInstrucaoConfigs()
      return NextResponse.json(configs)
    }
    const config = await getInstrucaoConfig()
    return NextResponse.json(config)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.perfil !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await req.json()
    await setInstrucaoConfig(body)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PUT /api/config — ativa uma instrução do histórico
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!session || user?.perfil !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const entry = await req.json()
    await activateInstrucaoConfig(entry)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
