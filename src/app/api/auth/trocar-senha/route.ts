import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMilitarByLogin, updateSenha } from '@/lib/sheets'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const { senhaAtual, novaSenha } = await req.json()

  if (!novaSenha || novaSenha.length < 6) {
    return NextResponse.json({ error: 'A nova senha deve ter ao menos 6 caracteres.' }, { status: 400 })
  }

  try {
    const login = user.login || user.email
    const militar = await getMilitarByLogin(login)
    if (!militar) return NextResponse.json({ error: 'Militar não encontrado.' }, { status: 404 })

    // Troca obrigatória (primeiro acesso) não exige senha atual
    if (!user.trocar_senha && militar.senha !== senhaAtual) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 400 })
    }

    // Salva nova senha E desmarca flag trocar_senha no Sheets
    await updateSenha(login, novaSenha)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao trocar senha:', error)
    return NextResponse.json({ error: 'Erro ao salvar nova senha.' }, { status: 500 })
  }
}
