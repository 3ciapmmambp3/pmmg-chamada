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
//
// CASO 1 — Operacional (com GP):
//   "1 GP / 1 PEL / 3 CIA PM MAMB / GOVERNADOR VALADARES"
//   grupamento = lotação completa
//   pelotao    = "1 PEL / 3 CIA PM MAMB / GOVERNADOR VALADARES"
//               (tudo a partir da parte que contém PEL)
//
// CASO 2 — Cmt Pelotão (sem GP, começa direto no PEL):
//   "1 PEL / 3 CIA PM MAMB / GOVERNADOR VALADARES"
//   grupamento = lotação completa
//   pelotao    = "1 PEL / 3 CIA PM MAMB / GOVERNADOR VALADARES" (igual)
//
// CASO 3 — ADM (sem barra):
//   "ADM"
//   grupamento = "ADM", pelotao = "ADM"
//
// REGRA DO PELOTÃO:
//   Encontra a primeira parte que termina em "PEL" ou "PEL QPF" etc.
//   e usa "N PEL / CIA / CIDADE" como chave de pelotão.
//   Assim Cmt e Operacionais do mesmo pelotão ficam agrupados.
// ============================================================
function parseLotacao(lotacao: string): { grupamento: string; pelotao: string } {
  if (!lotacao) return { grupamento: '', pelotao: '' }
  const lotacaoTrim = lotacao.trim()

  // Sem barra → ADM ou similar
  if (!lotacaoTrim.includes('/')) {
    return { grupamento: lotacaoTrim, pelotao: lotacaoTrim }
  }

  const partes = lotacaoTrim.split('/').map(p => p.trim())

  // Encontra o índice da parte que contém "PEL" (ex: "1 PEL", "2 PEL QPF")
  const idxPel = partes.findIndex(p => /\bPEL\b/i.test(p))

  let pelotao: string
  if (idxPel >= 0) {
    // Pelotão = "N PEL / CIA / CIDADE" (a partir da parte PEL)
    pelotao = partes.slice(idxPel).join(' / ')
  } else {
    // Sem PEL identificado → usa tudo
    pelotao = lotacaoTrim
  }

  return {
    grupamento: lotacaoTrim,  // chave única por grupamento completo
    pelotao,                  // chave de agrupamento por pelotão (sem o GP)
  }
}

// Rótulo curto para exibir no dropdown
// "1 GP / 1 PEL / 3 CIA PM MAMB / GOVERNADOR VALADARES" → "1 GP · GOVERNADOR VALADARES"
// "1 PEL / 3 CIA PM MAMB / GOVERNADOR VALADARES"         → "Cmt · GOVERNADOR VALADARES"
export function labelGrupamento(lotacao: string): string {
  if (!lotacao) return ''
  if (!lotacao.includes('/')) return lotacao
  const partes = lotacao.split('/').map(p => p.trim())
  const primeiro = partes[0]   // "1 GP" ou "1 PEL"
  const cidade   = partes[partes.length - 1]  // última parte = cidade

  // Se a primeira parte é um GP → "1 GP · CIDADE"
  if (/\bGP\b/i.test(primeiro)) {
    return `${primeiro} · ${cidade}`
  }
  // Se começa direto no PEL (Cmt Pelotão) → "Cmt 1 PEL · CIDADE"
  if (/\bPEL\b/i.test(primeiro)) {
    return `Cmt ${primeiro} · ${cidade}`
  }
  return primeiro === cidade ? primeiro : `${primeiro} · ${cidade}`
}

// ============================================================
// MILITARES — aba MILITARES, linha MILITARES_START_ROW em diante
// A: Nº PM | B: P/G | C: NOME COMPLETO | D: NOME DE GUERRA
// E: FUNÇÃO | F: LOTAÇÃO | G: PERFIL | H: SENHA | I: TROCAR_SENHA | J: ATIVO
// ============================================================
const MILITARES_START_ROW = parseInt(process.env.MILITARES_START_ROW || '8', 10)

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
    .filter((m) => m.login !== '')
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
// CONFIG — aba CONFIG (histórico de instruções)
// Linha 1: cabeçalhos (ASSUNTO | DATA | ATIVA)
// Linha 2+: cada instrução. A ativa tem "SIM" na coluna C
//           ou se nenhuma tiver, usa a última linha.
// ============================================================
export interface InstrucaoHistorico {
  assunto: string
  data: string
  ativa: boolean
  responsavel_instrucao: string
  rowIndex: number
}

export async function getTodasInstrucoes(): Promise<InstrucaoHistorico[]> {
  const sheets = await getSheetsClient()
  // Coluna D = RESPONSAVEL_INSTRUCAO
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'CONFIG!A2:D',
  })
  const rows = res.data.values || []
  const lista = rows
    .map((row, idx) => ({
      assunto:               (row[0] || '').toString().trim(),
      data:                  (row[1] || '').toString().trim(),
      ativa:                 row[2] === 'SIM' || row[2] === 'sim' || row[2] === 'TRUE',
      responsavel_instrucao: (row[3] || '').toString().trim(),
      rowIndex:              idx + 2,
    }))
    .filter(r => r.assunto || r.data)

  if (lista.length > 0 && !lista.some(r => r.ativa)) {
    lista[lista.length - 1].ativa = true
  }

  return lista
}

export async function getInstrucaoConfig(): Promise<InstrucaoConfig> {
  const todas = await getTodasInstrucoes()
  if (!todas.length) return { data: '', assunto: '', responsavel_instrucao: '' }
  const ativa = todas.find(r => r.ativa) || todas[todas.length - 1]
  return {
    data:                  ativa.data,
    assunto:               ativa.assunto,
    responsavel_instrucao: ativa.responsavel_instrucao || '',
  }
}

// Adiciona nova instrução e a marca como ativa (desmarca as outras)
export async function setInstrucaoConfig(config: InstrucaoConfig): Promise<void> {
  const sheets = await getSheetsClient()
  const todas = await getTodasInstrucoes()

  // Desmarca todas as anteriores
  if (todas.length > 0) {
    const clearValues = todas.map(() => ['', '', ''])
    // Só atualiza coluna C (ATIVA) das existentes
    for (const t of todas) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `CONFIG!C${t.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['']] },
      })
    }
  }

  // Verifica se já existe a mesma instrução (mesma data + assunto)
  const existente = todas.find(
    t => t.data === config.data && t.assunto === config.assunto
  )

  if (existente) {
    // Marca como ativa e atualiza responsavel se informado
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `CONFIG!C${existente.rowIndex}:D${existente.rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['SIM', config.responsavel_instrucao || existente.responsavel_instrucao || '']] },
    })
  } else {
    // Adiciona nova linha e marca como ativa
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'CONFIG!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[config.assunto, config.data, 'SIM', config.responsavel_instrucao || '']] },
    })
  }
}

// Ativa uma instrução existente pelo rowIndex
export async function ativarInstrucao(rowIndex: number): Promise<void> {
  const sheets = await getSheetsClient()
  const todas = await getTodasInstrucoes()
  for (const t of todas) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `CONFIG!C${t.rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[t.rowIndex === rowIndex ? 'SIM' : '']] },
    })
  }
}

// ============================================================
// CHAMADAS — aba DADOS
// A: data | B: assunto | C: grupamento | D: pelotao | E: Nº PM
// F: posto | G: nome_guerra | H: status | I: justificativa | J: responsavel | K: observacao
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
    pelotao:      row[3] || '',
    militar:      row[4] || '',
    posto:        row[5] || '',
    nome_guerra:  row[6] || '',
    status:       (row[7] || 'ausente') as 'presente' | 'ausente',
    justificativa: row[8] || '',
    responsavel:  row[9] || '',
    observacao:   row[10] || '',
  }))

  if (!filters) return chamadas
  return chamadas.filter((c) => {
    if (filters.data       && c.data !== filters.data) return false
    if (filters.grupamento && c.grupamento !== filters.grupamento) return false
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

  // Busca lançamentos já existentes para esta data + assunto
  const data    = rows[0]?.data    || ''
  const assunto = rows[0]?.assunto || ''

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'DADOS!A:K',
  })
  const existingRows = existing.data.values || []

  // Monta mapa: "data|assunto|militar" → índice real da linha (1-based, linha 1 = cabeçalho)
  const rowMap: Record<string, number> = {}
  existingRows.forEach((row, idx) => {
    if (idx === 0) return // pula cabeçalho se houver
    const key = `${(row[0]||'').trim()}|${(row[1]||'').trim()}|${(row[4]||'').trim()}`
    rowMap[key] = idx + 1 // linha real na planilha (1-based)
  })

  const toInsert: any[][] = []

  for (const r of rows) {
    const key = `${r.data}|${r.assunto}|${r.militar}`
    const existingRowIdx = rowMap[key]

    const rowValues = [
      r.data, r.assunto, r.grupamento, r.pelotao,
      r.militar, r.posto, r.nome_guerra,
      r.status, r.justificativa || '', r.responsavel, r.observacao || '',
    ]

    if (existingRowIdx) {
      // Atualiza linha existente
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `DADOS!A${existingRowIdx}:K${existingRowIdx}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowValues] },
      })
    } else {
      // Novo lançamento
      toInsert.push(rowValues)
    }
  }

  // Insere novos de uma vez
  if (toInsert.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'DADOS!A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: toInsert },
    })
  }
}

// ============================================================
// DASHBOARD STATS
// ============================================================
export async function getDashboardStats() {
  const config = await getInstrucaoConfig()
  const [militares, chamadas] = await Promise.all([
    getMilitares(),
    getChamadas({ data: config.data }),
  ])

  const ativos = militares.filter((m) => m.ativo)

  // Grupamentos na ordem da aba LOTACOES (igual ao dropdown)
  let grupamentos: string[] = []
  try {
    const sheetsClient = await getSheetsClient()
    const lotRes = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'LOTACOES!A2:A',
    })
    grupamentos = (lotRes.data.values || [])
      .map(r => (r[0] || '').toString().trim())
      .filter(Boolean)
  } catch {
    grupamentos = Array.from(new Set(ativos.map((m) => m.grupamento))).filter(Boolean).sort()
  }
  const grupamentosConcluidos = Array.from(new Set(chamadas.map((c) => c.grupamento))).filter(Boolean)
  const grupamentosPendentes = grupamentos.filter((g) => !grupamentosConcluidos.includes(g))

  const presentes = chamadas.filter((c) => c.status === 'presente').length
  const ausentes  = chamadas.filter((c) => c.status === 'ausente').length
  const adm       = ativos.filter((m) => m.grupamento === 'ADM').length

  // ── Resumo por Pelotão ──────────────────────────────────────
  // Agrupa todos os grupamentos pelo NÚMERO DO PELOTÃO pai:
  //   "1 PEL / ..." → "1º Pelotão"
  //   "2 PEL / ..." → "2º Pelotão"
  //   "ADM"         → "ADM"
  // Assim soma Cmt + Operacionais de todas as cidades do mesmo pelotão.
  // ─────────────────────────────────────────────────────────────

  function numeroPelotao(pelotao: string): string {
    if (!pelotao) return 'Outros'
    // ADM sem barra
    if (!pelotao.includes('/')) return pelotao.toUpperCase()
    // Extrai o número do PEL: "1 PEL / ..." → "1"
    const match = pelotao.match(/^(\d+)\s*PEL/i)
    if (match) return `${match[1]}º Pelotão`
    return pelotao.split('/')[0].trim()
  }

  // Cria mapa: "1º Pelotão" → { militares, presentes, ausentes }
  const mapaAgrupado: Record<string, { militares: number; presentes: number; ausentes: number }> = {}

  ativos.forEach((m) => {
    const chave = numeroPelotao(m.pelotao)
    if (!mapaAgrupado[chave]) mapaAgrupado[chave] = { militares: 0, presentes: 0, ausentes: 0 }
    mapaAgrupado[chave].militares++
  })

  chamadas.forEach((c) => {
    const chave = numeroPelotao(c.pelotao)
    if (!mapaAgrupado[chave]) return
    if (c.status === 'presente') mapaAgrupado[chave].presentes++
    else mapaAgrupado[chave].ausentes++
  })

  // Ordena: ADM por último, pelotões em ordem numérica
  const resumoPorPelotao = Object.entries(mapaAgrupado)
    .sort(([a], [b]) => {
      if (a === 'ADM') return 1
      if (b === 'ADM') return -1
      const na = parseInt(a) || 0
      const nb = parseInt(b) || 0
      return na - nb
    })
    .map(([pelotao, dados]) => ({
      pelotao,
      militares: dados.militares,
      presentes: dados.presentes,
      ausentes:  dados.ausentes,
      percentual: dados.militares > 0
        ? Math.round((dados.presentes / dados.militares) * 10000) / 100
        : 0,
    }))

  // Responsável por grupamento:
  // 1ª prioridade: quem lançou a chamada (campo responsavel da aba DADOS)
  // 2ª prioridade: primeiro militar da lista do grupamento na aba MILITARES
  const responsaveisLancamento: Record<string, string> = {}
  chamadas.forEach((c) => {
    if (c.grupamento && c.responsavel) responsaveisLancamento[c.grupamento] = c.responsavel
  })

  // Monta mapa: grupamento → primeiro militar (posto + nome_guerra)
  const primeiroPorGrupamento: Record<string, string> = {}
  grupamentos.forEach((g) => {
    const milsDoGrupo = ativos.filter((m) => m.grupamento === g)
    if (milsDoGrupo.length > 0) {
      const primeiro = milsDoGrupo[0]
      primeiroPorGrupamento[g] = `${primeiro.posto} ${primeiro.nome_guerra}`.trim()
    }
  })

  const pendenciasPorGrupamento = grupamentos.map((g) => ({
    grupamento: g,
    grupamentoFull: g,
    responsavel: responsaveisLancamento[g] || primeiroPorGrupamento[g] || '-',
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
