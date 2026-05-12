import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Chamada } from '@/types'

export function gerarRelatorioPDF(
  chamadas: Chamada[],
  instrucao: { data: string; assunto: string },
  grupamento?: string
) {
  const doc = new jsPDF()
  const goldColor: [number, number, number] = [184, 151, 62]
  const darkColor: [number, number, number] = [26, 26, 26]
  const grayColor: [number, number, number] = [100, 100, 100]

  // Header
  doc.setFillColor(...darkColor)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setTextColor(...goldColor)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('3ª CIA PM MAmb', 105, 12, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 200, 200)
  doc.text('Polícia Militar de Minas Gerais', 105, 19, { align: 'center' })
  doc.setFontSize(13)
  doc.setTextColor(...goldColor)
  doc.setFont('helvetica', 'bold')
  doc.text('RELATÓRIO DE CHAMADA DE INSTRUÇÃO', 105, 29, { align: 'center' })

  // Info box
  doc.setFillColor(240, 240, 240)
  doc.rect(10, 40, 190, 22, 'F')
  doc.setDrawColor(...goldColor)
  doc.setLineWidth(0.5)
  doc.rect(10, 40, 190, 22)
  doc.setTextColor(...darkColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Data: ${instrucao.data}`, 15, 48)
  doc.text(`Assunto: ${instrucao.assunto}`, 15, 56)
  if (grupamento) {
    doc.text(`Grupamento: ${grupamento}`, 130, 48)
  }

  const responsavel = chamadas[0]?.responsavel || '-'
  doc.text(`Responsável: ${responsavel}`, 130, 56)

  // Stats
  const presentes = chamadas.filter((c) => c.status === 'presente')
  const ausentes = chamadas.filter((c) => c.status === 'ausente')

  doc.setFillColor(...goldColor)
  doc.rect(10, 68, 58, 14, 'F')
  doc.setFillColor(60, 60, 60)
  doc.rect(76, 68, 58, 14, 'F')
  doc.setFillColor(80, 80, 80)
  doc.rect(142, 68, 58, 14, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL: ${chamadas.length}`, 39, 77, { align: 'center' })
  doc.text(`PRESENTES: ${presentes.length}`, 105, 77, { align: 'center' })
  doc.text(`AUSENTES: ${ausentes.length}`, 171, 77, { align: 'center' })

  // Table presentes
  doc.setTextColor(...darkColor)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('MILITARES PRESENTES', 10, 92)
  doc.setDrawColor(...goldColor)
  doc.setLineWidth(0.8)
  doc.line(10, 94, 80, 94)

  autoTable(doc, {
    startY: 97,
    head: [['#', 'Posto', 'Nome de Guerra', 'Grupamento', 'Status']],
    body: presentes.map((c, i) => [
      i + 1,
      c.posto || '-',
      c.nome_guerra || c.militar,
      c.grupamento,
      'PRESENTE',
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: darkColor, textColor: goldColor, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 4: { textColor: [0, 120, 0], fontStyle: 'bold' } },
  })

  // Table ausentes
  const finalY = (doc as any).lastAutoTable.finalY + 10
  doc.setTextColor(...darkColor)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('MILITARES AUSENTES', 10, finalY)
  doc.setDrawColor(...goldColor)
  doc.line(10, finalY + 2, 80, finalY + 2)

  autoTable(doc, {
    startY: finalY + 5,
    head: [['#', 'Posto', 'Nome de Guerra', 'Grupamento', 'Status', 'Justificativa']],
    body: ausentes.map((c, i) => [
      i + 1,
      c.posto || '-',
      c.nome_guerra || c.militar,
      c.grupamento,
      'AUSENTE',
      c.justificativa || '-',
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: darkColor, textColor: goldColor, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 4: { textColor: [180, 0, 0], fontStyle: 'bold' } },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...grayColor)
    doc.text(
      `© ${new Date().getFullYear()} 3ª Cia PM MAmb - Polícia Militar de Minas Gerais | Página ${i} de ${pageCount}`,
      105,
      290,
      { align: 'center' }
    )
  }

  const filename = `chamada_${instrucao.data.replace(/\//g, '-')}_${grupamento || 'geral'}.pdf`
  doc.save(filename)
}
