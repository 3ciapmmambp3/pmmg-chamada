import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Chamada } from '@/types'

export function gerarRelatorioPDF(
  chamadas: Chamada[],
  instrucao: { data: string; assunto: string },
  grupamento?: string
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const gold:    [number, number, number] = [155, 130, 70]
  const black:   [number, number, number] = [20,  20,  20]
  const gray:    [number, number, number] = [110, 110, 110]
  const lgray:   [number, number, number] = [245, 245, 245]
  const white:   [number, number, number] = [255, 255, 255]
  const green:   [number, number, number] = [0,   130, 0  ]
  const red:     [number, number, number] = [180, 0,   0  ]

  const PAGE_W  = 210
  const MARGIN  = 12
  const COL_W   = PAGE_W - MARGIN * 2   // 186mm usável

  // ── CABEÇALHO ──────────────────────────────────────────────
  // Linha dourada fina no topo
  doc.setFillColor(...gold)
  doc.rect(0, 0, PAGE_W, 1.5, 'F')

  doc.setTextColor(...gold)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('3ª CIA PM MAmb', PAGE_W / 2, 10, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gray)
  doc.text('Polícia Militar de Minas Gerais', PAGE_W / 2, 16, { align: 'center' })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...gold)
  doc.text('RELATÓRIO DE CHAMADA DE INSTRUÇÃO', PAGE_W / 2, 24, { align: 'center' })

  // Linha dourada separadora
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.4)
  doc.line(MARGIN, 27, PAGE_W - MARGIN, 27)

  // ── BOX DE INFORMAÇÕES ─────────────────────────────────────
  const boxY = 30
  const boxH = 18
  doc.setFillColor(...lgray)
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.4)
  doc.roundedRect(MARGIN, boxY, COL_W, boxH, 1.5, 1.5, 'FD')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...black)

  const col1X = MARGIN + 4
  const col2X = MARGIN + COL_W / 2 + 2
  const row1Y = boxY + 6
  const row2Y = boxY + 13

  doc.text(`Data: ${instrucao.data}`, col1X, row1Y)
  doc.text(`Assunto: ${instrucao.assunto}`, col1X, row2Y)

  const responsavel = chamadas[0]?.responsavel || '-'
  // Grupamento — texto longo: quebra se necessário dentro da coluna disponível
  const maxGrupW = (COL_W / 2) - 6  // largura disponível lado direito em mm
  if (grupamento) {
    const gpLines = doc.splitTextToSize(`Grupamento: ${grupamento}`, maxGrupW)
    doc.text(gpLines, col2X, row1Y)
  }
  doc.text(`Responsável: ${responsavel}`, col2X, row2Y)

  // ── ESTATÍSTICAS ───────────────────────────────────────────
  const presentes = chamadas.filter(c => c.status === 'presente')
  const ausentes  = chamadas.filter(c => c.status === 'ausente')

  const statsY  = boxY + boxH + 5
  const statW   = (COL_W - 8) / 3
  const statH   = 10
  const labels  = [`TOTAL: ${chamadas.length}`, `PRESENTES: ${presentes.length}`, `AUSENTES: ${ausentes.length}`]
  const statColors: [number,number,number][] = [gold, [60,120,60], [160,50,50]]

  labels.forEach((lbl, i) => {
    const sx = MARGIN + i * (statW + 4)
    doc.setFillColor(...statColors[i])
    doc.roundedRect(sx, statsY, statW, statH, 1.5, 1.5, 'F')
    doc.setTextColor(...white)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.text(lbl, sx + statW / 2, statsY + 6.5, { align: 'center' })
  })

  // ── TABELA PRESENTES ───────────────────────────────────────
  let cursorY = statsY + statH + 6

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...black)
  doc.text('MILITARES PRESENTES', MARGIN, cursorY + 1)
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.6)
  doc.line(MARGIN, cursorY + 3, MARGIN + 55, cursorY + 3)

  autoTable(doc, {
    startY: cursorY + 6,
    margin: { left: MARGIN, right: MARGIN },
    head: [['#', 'Nº PM', 'Posto', 'Nome de Guerra', 'Grupamento', 'Status']],
    body: presentes.map((c, i) => [
      i + 1,
      c.militar || '-',
      c.posto   || '-',
      c.nome_guerra || c.militar,
      c.grupamento,
      'PRESENTE',
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: 'linebreak',
      textColor: black,
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [230, 220, 195],
      textColor: black,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: lgray },
    bodyStyles: { fillColor: white },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 26 },
      3: { cellWidth: 32 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 22, halign: 'center', textColor: green, fontStyle: 'bold' },
    },
    didDrawPage: (data) => {
      // Linha dourada fina no topo de cada página de continuação
      doc.setFillColor(...gold)
      doc.rect(0, 0, PAGE_W, 1.5, 'F')
    },
  })

  // ── TABELA AUSENTES ────────────────────────────────────────
  if (ausentes.length > 0) {
    cursorY = (doc as any).lastAutoTable.finalY + 7

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...black)
    doc.text('MILITARES AUSENTES', MARGIN, cursorY + 1)
    doc.setDrawColor(...gold)
    doc.setLineWidth(0.6)
    doc.line(MARGIN, cursorY + 3, MARGIN + 55, cursorY + 3)

    autoTable(doc, {
      startY: cursorY + 6,
      margin: { left: MARGIN, right: MARGIN },
      head: [['#', 'Nº PM', 'Posto', 'Nome de Guerra', 'Grupamento', 'Status', 'Justificativa']],
      body: ausentes.map((c, i) => [
        i + 1,
        c.militar || '-',
        c.posto   || '-',
        c.nome_guerra || c.militar,
        c.grupamento,
        'AUSENTE',
        c.justificativa || '-',
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        overflow: 'linebreak',
        textColor: black,
        lineColor: [220, 220, 220],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [230, 220, 195],
        textColor: black,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: lgray },
      bodyStyles: { fillColor: white },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' },
        1: { cellWidth: 24 },
        2: { cellWidth: 22 },
        3: { cellWidth: 28 },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 20, halign: 'center', textColor: red, fontStyle: 'bold' },
        6: { cellWidth: 28 },
      },
      didDrawPage: () => {
        doc.setFillColor(...gold)
        doc.rect(0, 0, PAGE_W, 1.5, 'F')
      },
    })
  }

  // ── RODAPÉ ─────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    // Linha dourada no rodapé
    doc.setDrawColor(...gold)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, 287, PAGE_W - MARGIN, 287)
    doc.setFontSize(7.5)
    doc.setTextColor(...gray)
    doc.text(
      `© ${new Date().getFullYear()} 3ª Cia PM MAmb — Polícia Militar de Minas Gerais  |  Página ${i} de ${pageCount}`,
      PAGE_W / 2, 291, { align: 'center' }
    )
  }

  const filename = `chamada_${instrucao.data.replace(/\//g, '-')}_${grupamento ? grupamento.replace(/\s*\/\s*/g, '-') : 'geral'}.pdf`
  doc.save(filename)
}
