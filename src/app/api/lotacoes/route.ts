import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLotacoesOrdem } from '@/lib/sheets'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const ordem = await getLotacoesOrdem()
    return NextResponse.json(ordem)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
