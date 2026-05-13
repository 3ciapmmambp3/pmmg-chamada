// Aba CONFIG — A: ASSUNTO | B: DATA | C: ATIVA | D: RESPONSAVEL_INSTRUCAO
export interface InstrucaoConfig {
  data: string
  assunto: string
  responsavel_instrucao: string
}

export interface Militar {
  login: string
  posto: string
  nome: string
  nome_guerra: string
  funcao: string
  lotacao: string
  grupamento: string
  pelotao: string
  perfil: 'admin' | 'operacional'
  senha: string
  trocar_senha: boolean
  ativo: boolean
  rowIndex?: number
}

export interface Chamada {
  data: string
  assunto: string
  grupamento: string
  pelotao: string
  militar: string
  posto: string
  nome_guerra: string
  status: 'presente' | 'ausente'
  justificativa: string
  responsavel: string
  observacao: string
}

export interface PelotaoStats {
  pelotao: string
  militares: number
  presentes: number
  ausentes: number
  percentual: number
}

export interface GrupamentoStatus {
  grupamento: string
  responsavel: string
  status: 'PENDENTE' | 'CONCLUÍDO'
}

export interface InstrucaoHistorico {
  assunto: string
  data: string
  ativa: boolean
  responsavel_instrucao: string
  rowIndex: number
}
