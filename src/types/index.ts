// =====================================================
// ESTRUTURA REAL DA PLANILHA
// Aba MILITARES — colunas:
// A: Nº PM | B: P/G | C: NOME COMPLETO | D: NOME DE GUERRA
// E: FUNÇÃO | F: LOTAÇÃO | G: PERFIL | H: SENHA | I: TROCAR_SENHA | J: ATIVO
//
// LOTAÇÃO formato: "1 GP / 1 PEL / 3 CIA PM MAMB / GOVERNADOR VALADARES"
// → grupamento = "1 GP", pelotao = "1 PEL"
//
// Aba DADOS — colunas:
// A: data | B: assunto | C: grupamento | D: pelotao | E: nome_pm
// F: posto | G: nome_guerra | H: status | I: justificativa | J: responsavel | K: observacao
//
// Aba CONFIG — A: data | B: assunto
// =====================================================

export interface Militar {
  login: string         // Nº PM  (coluna A)
  posto: string         // P/G    (coluna B)
  nome: string          // NOME COMPLETO (coluna C)
  nome_guerra: string   // NOME DE GUERRA (coluna D)
  funcao: string        // FUNÇÃO (coluna E)
  lotacao: string       // LOTAÇÃO completa (coluna F)
  grupamento: string    // extraído da LOTAÇÃO (parte antes do primeiro /)
  pelotao: string       // extraído da LOTAÇÃO (segunda parte)
  perfil: 'admin' | 'operacional'
  senha: string         // coluna H
  trocar_senha: boolean // coluna I — TRUE = obriga troca no login
  ativo: boolean        // coluna J
  rowIndex?: number     // linha real na planilha (uso interno)
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

export interface InstrucaoConfig {
  data: string
  assunto: string
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
