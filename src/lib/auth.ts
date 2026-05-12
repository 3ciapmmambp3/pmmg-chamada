import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getMilitarByLogin } from './sheets'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        login: { label: 'Número de Polícia', type: 'text' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.senha) return null
        try {
          const militar = await getMilitarByLogin(credentials.login)
          if (!militar) return null
          if (militar.senha !== credentials.senha) return null

          return {
            id: militar.login,
            name: `${militar.posto} ${militar.nome_guerra}`,
            email: militar.login,
            perfil: militar.perfil,
            grupamento: militar.grupamento,
            pelotao: militar.pelotao,
            lotacao: militar.lotacao,
            posto: militar.posto,
            nome: militar.nome,
            nome_guerra: militar.nome_guerra,
            funcao: militar.funcao,
            // flag de troca de senha — vem do Sheets em tempo real
            trocar_senha: militar.trocar_senha,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Primeira vez que o token é criado (login)
        token.perfil = (user as any).perfil
        token.grupamento = (user as any).grupamento
        token.pelotao = (user as any).pelotao
        token.lotacao = (user as any).lotacao
        token.posto = (user as any).posto
        token.nome = (user as any).nome
        token.nome_guerra = (user as any).nome_guerra
        token.funcao = (user as any).funcao
        token.trocar_senha = (user as any).trocar_senha
      }
      // Permite atualizar o token via useSession().update()
      // Chamado após a troca de senha para remover a flag
      if (trigger === 'update' && session) {
        if (session.trocar_senha !== undefined) {
          token.trocar_senha = session.trocar_senha
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).perfil = token.perfil
        ;(session.user as any).grupamento = token.grupamento
        ;(session.user as any).pelotao = token.pelotao
        ;(session.user as any).lotacao = token.lotacao
        ;(session.user as any).posto = token.posto
        ;(session.user as any).nome = token.nome
        ;(session.user as any).nome_guerra = token.nome_guerra
        ;(session.user as any).funcao = token.funcao
        ;(session.user as any).id = token.sub
        ;(session.user as any).login = token.sub
        ;(session.user as any).trocar_senha = token.trocar_senha
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas
  },
  secret: process.env.NEXTAUTH_SECRET,
}
