import { google } from 'googleapis'
import { Militar, Chamada, InstrucaoConfig } from '@/types'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

export async function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}')
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES })
  return google.sheets({ version: 'v4', auth })
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!

// ============================================================
// PARSER DE LOTAÇÃO
// Formato: "1 GP / 4 PEL / 3 CIA PM MAMB / TEOFILO OTONI"
// O GRUPAMENTO = lotação COMPLETA (sem repetir militares de cidades diferentes)
// O PELOTÃO    = segunda parte (ex: "4 PEL")
// ADM          = "ADM" (sem barras)
// ============================================================
function parseLotacao(lotacao: string): { grupamento: string; pelotao: string } {
  if (!lotacao) return { grupamento: '', pelotao: '' }
  const lotacaoTrim = lotacao.trim()

  // ADM sem barra
  if (!lotacaoTrim.includes('/')) {
    return { grupamento: lotacaoTrim, pelotao: 'ADM' }
  }

  const partes = lotacaoTrim.split('/').map((p) => p.trim())

  // Estrutura da 3ª CIA PM MAMB:
  // ADM
  // X PEL / 3 CIA PM MAMB / CIDADE          → pelotao = "X PEL"
  // X GP / X PEL / 3 CIA PM MAMB / CIDADE   → pelotao = "X PEL"

  // Busca a parte que contém "PEL"
  const pelParte = partes.find((p) => /PEL/i.test(p))

  return {
    grupamento: lotacaoTrim,   // lotação completa
    pelotao: pelParte || 'ADM',
  }
}

// Exibe a lotação completa como está (ex: "1 GP / 4 PEL / 3 CIA PM MAMB / TEOFILO OTONI")
export function labelGrupamento(lotacao: string): string {
  return (lotacao || '').trim()
}

// ============================================================
// MILITARES — aba MILITARES, linha MILITARES_START_ROW em diante
// A: Nº PM | B: P/G | C: NOME COMPLETO | D: NOME DE GUERRA
// E: FUNÇÃO | F: LOTAÇÃO | G: PERFIL | H: SENHA | I: TROCAR_SENHA | J: ATIVO
// ============================================================
const MILITARES_START_ROW = parseInt(process.env.MILITARES_START_ROW || '3', 10)

export async function getMilitares(): Promise<Militar[]> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `MILITARES!A${MILITARES_START_ROW}:J`,
  })
  const rows = res.data.values || []
  return rows
    .map((row, idx) => {
      const lotacao = (row[5] || '').toString().trim()
      const { grupamento, pelotao } = parseLotacao(lotacao)
      return {
        login:       (row[0] || '').toString().trim(),
        posto:       (row[1] || '').toString().trim(),
        nome:        (row[2] || '').toString().trim(),
        nome_guerra: (row[3] || '').toString().trim(),
        funcao:      (row[4] || '').toString().trim(),
        lotacao,
        grupamento,
        pelotao,
        perfil: (row[6] || 'operacional').toString().toLowerCase() === 'admin' ? 'admin' : 'operacional',
        senha:       (row[7] || '').toString().trim(),
        trocar_senha: row[8] === 'TRUE' || row[8] === 'true' || row[8] === '1' || row[8] === 'SIM',
        ativo: row[9] !== 'FALSE' && row[9] !== 'false' && row[9] !== '0'
            && row[9] !== 'NÃO'  && row[9] !== 'NAO'  && row[9] !== '',
        rowIndex: idx + MILITARES_START_ROW,
      } as Militar
    })
    .filter((m) => m.login !== '' && /^[0-9]/.test(m.login))
}

// Remove formatação do Nº PM para comparação
function cleanNP(np: string): string {
  return np.replace(/[^0-9]/g, '')
}

export async function getMilitarByLogin(login: string): Promise<Militar | null> {
  const militares = await getMilitares()
  return militares.find((m) => cleanNP(m.login) === cleanNP(login) && m.ativo) || null
}

// Salva nova senha e desmarca flag trocar_senha (colunas H e I)
export async function updateSenha(login: string, novaSenha: string): Promise<void> {
  const sheets = await getSheetsClient()
  const militares = await getMilitares()
  const militar = militares.find((m) => cleanNP(m.login) === cleanNP(login))
  if (!militar || !militar.rowIndex) throw new Error('Militar não encontrado')
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `MILITARES!H${militar.rowIndex}:I${militar.rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[novaSenha, 'FALSE']] },
  })
}

// Adiciona novo militar
export async function addMilitar(data: Omit<Militar, 'rowIndex' | 'grupamento' | 'pelotao'>): Promise<void> {
  const sheets = await getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'MILITARES!A:J',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        data.login, data.posto, data.nome, data.nome_guerra,
        data.funcao, data.lotacao, data.perfil, data.senha,
        data.trocar_senha ? 'TRUE' : 'FALSE',
        data.ativo ? 'TRUE' : 'FALSE',
      ]],
    },
  })
}

// Atualiza militar pela linha real
export async function updateMilitar(login: string, upd: Partial<Militar>): Promise<void> {
  const sheets = await getSheetsClient()
  const militares = await getMilitares()
  const militar = militares.find((m) => cleanNP(m.login) === cleanNP(login))
  if (!militar || !militar.rowIndex) throw new Error('Militar não encontrado')
  const merged = { ...militar, ...upd }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `MILITARES!A${militar.rowIndex}:J${militar.rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        merged.login, merged.posto, merged.nome, merged.nome_guerra,
        merged.funcao, merged.lotacao, merged.perfil, merged.senha,
        merged.trocar_senha ? 'TRUE' : 'FALSE',
        merged.ativo ? 'TRUE' : 'FALSE',
      ]],
    },
  })
}

// ============================================================
// CONFIG — aba CONFIG
// Linha 1: cabeçalho (ASSUNTO | DATA)
// Linhas 2+: histórico de instruções — a ÚLTIMA linha é a ativa
// ============================================================

export interface InstrucaoConfigEntry extends InstrucaoConfig {
  rowIndex: number   // linha real na planilha (1-based)
}

// Retorna TODAS as instruções do histórico (sem cabeçalho), mais recente por último
export async function getAllInstrucaoConfigs(): Promise<InstrucaoConfigEntry[]> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'CONFIG!A2:B',
  })
  const rows = res.data.values || []
  return rows
    .map((row, idx) => ({
      assunto:  (row[0] || '').toString().trim(),
      data:     (row[1] || '').toString().trim(),
      rowIndex: idx + 2,
    }))
    .filter((r) => r.assunto || r.data)
}

// Retorna a instrução ATIVA (última linha preenchida)
export async function getInstrucaoConfig(): Promise<InstrucaoConfig> {
  const all = await getAllInstrucaoConfigs()
  if (all.length === 0) return { data: '', assunto: '' }
  const last = all[all.length - 1]
  return { data: last.data, assunto: last.assunto }
}

// Adiciona uma NOVA instrução ao histórico (append)
export async function setInstrucaoConfig(config: InstrucaoConfig): Promise<void> {
  const sheets = await getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'CONFIG!A:B',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[config.assunto, config.data]] },
  })
}

// Ativa uma instrução existente movendo-a para a última posição (append + opcional delete da origem)
// Estratégia simples: apenas faz append da linha selecionada como nova linha ativa
export async function activateInstrucaoConfig(entry: InstrucaoConfigEntry): Promise<void> {
  const sheets = await getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'CONFIG!A:B',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[entry.assunto, entry.data]] },
  })
}

// ============================================================
// CHAMADAS — aba DADOS
// A: data | B: assunto | C: grupamento | D: Nº PM (militar)
// E: posto | F: nome_guerra | G: pelotao | H: status | I: justificativa | J: responsavel | K: observacao
// ============================================================
export async function getChamadas(filters?: {
  data?: string
  grupamento?: string
  assunto?: string
  militar?: string
  status?: string
  dataInicio?: string
  dataFim?: string
  responsavel?: string
}): Promise<Chamada[]> {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'DADOS!A2:K',
  })
  const rows = (res.data.values || []).filter((r) => r[0])

  const chamadas: Chamada[] = rows.map((row) => ({
    data:         row[0] || '',
    assunto:      row[1] || '',
    grupamento:   row[2] || '',
    militar:      row[3] || '',
    posto:        row[4] || '',
    nome_guerra:  row[5] || '',
    pelotao:      row[6] || '',
    status:       (row[7] || 'ausente') as 'presente' | 'ausente',
    justificativa: row[8] || '',
    responsavel:  row[9] || '',
    observacao:   row[10] || '',
  }))

  if (!filters) return chamadas

  // Normaliza data para comparação: aceita DD/MM/YYYY ou YYYY-MM-DD
  function normDate(d: string): string {
    if (!d) return ''
    d = d.trim()
    if (d.includes('/')) {
      const [dd, mm, yyyy] = d.split('/')
      return `${yyyy}-${mm}-${dd}`   // converte para ISO
    }
    return d  // já é ISO
  }

  const filterDataNorm = normDate(filters.data || '')

  return chamadas.filter((c) => {
    if (filters.data       && normDate(c.data) !== filterDataNorm) return false
    if (filters.grupamento && c.grupamento.trim() !== filters.grupamento.trim()) return false
    if (filters.assunto    && !c.assunto.toLowerCase().includes(filters.assunto.toLowerCase())) return false
    if (filters.status     && c.status !== filters.status) return false
    if (filters.responsavel && !c.responsavel.toLowerCase().includes(filters.responsavel.toLowerCase())) return false
    if (filters.militar) {
      const q = filters.militar.toLowerCase()
      if (!c.militar.toLowerCase().includes(q) && !c.nome_guerra.toLowerCase().includes(q)) return false
    }
    if (filters.dataInicio && c.data < filters.dataInicio) return false
    if (filters.dataFim    && c.data > filters.dataFim)    return false
    return true
  })
}

export async function saveChamada(rows: Chamada[]): Promise<void> {
  const sheets = await getSheetsClient()
  const values = rows.map((r) => [
    r.data, r.assunto, r.grupamento,
    r.militar, r.posto, r.nome_guerra, r.pelotao,
    r.status, r.justificativa || '', r.responsavel, r.observacao || '',
  ])
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'DADOS!A:K',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  })
}

// ============================================================
// DASHBOARD STATS
// ============================================================
// ============================================================
// LOTACOES — ordem canônica de exibição de grupamentos
// Lê a aba LOTACOES!A2:A (ignora cabeçalho na linha 1)
// Fallback: ordenação alfabética se a aba não existir
// ============================================================
export async function getLotacoesOrdem(): Promise<string[]> {
  try {
    const sheets = await getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'LOTACOES!A2:A',
    })
    return (res.data.values || [])
      .map((r) => (r[0] || '').toString().trim())
      .filter(v => v && !v.toLowerCase().includes('lotac') && !v.toLowerCase().includes('não altere'))
  } catch {
    return []
  }
}

// Ordena uma lista de lotações/grupamentos pela ordem canônica da aba LOTACOES.
// Itens não encontrados na lista canônica vão ao final em ordem alfabética.
export function sortByLotacao(items: string[], ordem: string[]): string[] {
  const normalize = (s: string) => s.trim().toUpperCase().replace(/\s+/g, ' ')
  const indexMap = new Map<string, number>()
  ordem.forEach((lot, i) => indexMap.set(normalize(lot), i))

  return [...items].sort((a, b) => {
    const ia = indexMap.get(normalize(a)) ?? Infinity
    const ib = indexMap.get(normalize(b)) ?? Infinity
    if (ia !== ib) return ia - ib
    return a.localeCompare(b, 'pt-BR')
  })
}

export async function getDashboardStats() {
  const config = await getInstrucaoConfig()
  const [militares, chamadas, lotacoesOrdem] = await Promise.all([
    getMilitares(),
    getChamadas({ data: config.data }),
    getLotacoesOrdem(),
  ])

  const ativos = militares.filter((m) => m.ativo)
  const grupamentosRaw = [...new Set(ativos.map((m) => m.grupamento))].filter(Boolean)
  const grupamentos = sortByLotacao(grupamentosRaw, lotacoesOrdem)
  const grupamentosConcluidos = [...new Set(chamadas.map((c) => c.grupamento))].filter(Boolean)
  const grupamentosPendentes = grupamentos.filter((g) => !grupamentosConcluidos.includes(g))

  const presentes = chamadas.filter((c) => c.status === 'presente').length
  const ausentes  = chamadas.filter((c) => c.status === 'ausente').length
  const adm       = ativos.filter((m) => m.grupamento === 'ADM').length

  // Pelotões: apenas entradas com "PEL" + ADM separado, ordenados canonicamente
  const pelotoesRaw = [...new Set(ativos.map((m) => m.pelotao))]
    .filter((p) => p && (p === 'ADM' || /PEL/i.test(p)))
  // Ordem fixa: ADM primeiro, depois 1 PEL .. 5 PEL
  const pelotoes = ['ADM', '1 PEL', '2 PEL', '3 PEL', '4 PEL', '5 PEL']
    .filter((p) => pelotoesRaw.includes(p))
  const resumoPorPelotao = pelotoes.map((pelotao) => {
    const mils = ativos.filter((m) => m.pelotao === pelotao)
    const pres = chamadas.filter((c) => c.pelotao === pelotao && c.status === 'presente').length
    const aus  = chamadas.filter((c) => c.pelotao === pelotao && c.status === 'ausente').length
    return {
      pelotao,
      militares: mils.length,
      presentes: pres,
      ausentes:  aus,
      percentual: mils.length > 0 ? Math.round((pres / mils.length) * 10000) / 100 : 0,
    }
  })

  const responsaveis: Record<string, string> = {}
  chamadas.forEach((c) => { if (c.grupamento && c.responsavel) responsaveis[c.grupamento] = c.responsavel })

  const pendenciasPorGrupamento = grupamentos.map((g) => ({
    grupamento: labelGrupamento(g),   // exibe o rótulo curto no dashboard
    grupamentoFull: g,
    responsavel: responsaveis[g] || '-',
    status: grupamentosConcluidos.includes(g) ? 'CONCLUÍDO' as const : 'PENDENTE' as const,
  }))

  return {
    totalMilitares: ativos.length,
    presentes,
    ausentes,
    adm,
    pendentes: grupamentosPendentes.length,
    percentualPresentes: ativos.length > 0 ? Math.round((presentes / ativos.length) * 10000) / 100 : 0,
    percentualAusentes:  ativos.length > 0 ? Math.round((ausentes  / ativos.length) * 10000) / 100 : 0,
    percentualAdm:       ativos.length > 0 ? Math.round((adm       / ativos.length) * 10000) / 100 : 0,
    grupamentosPendentes,
    grupamentosConcluidos,
    resumoPorPelotao,
    pendenciasPorGrupamento,
    instrucaoAtual: config,
  }
}
