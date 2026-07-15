import ExcelJS from 'exceljs';

export async function buildExcelReport(
  title: string,
  portfolioName: string,
  nit: string,
  dateRange: string,
  obligations: any[],
  startDate: string,
  endDate: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheetName = `Reporte ${startDate} - ${endDate}`.slice(0, 31); // Excel sheet name limit is 31 chars
  const sheet = workbook.addWorksheet(sheetName);

  // Title block (A1 to R1 to cover all 18 columns)
  sheet.mergeCells('A1:R1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'LexCobra — Reporte de Cartera';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 35;

  sheet.mergeCells('A2:R2');
  const subCell = sheet.getCell('A2');
  subCell.value = `${title} | Cartera: ${portfolioName} | NIT: ${nit || 'N/A'} | Período: ${dateRange}`;
  subCell.font = { size: 11, italic: true };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 25;

  sheet.addRow([]); // Blank row

  // Table Headers
  const headers = [
    'Deudor Principal',
    'Identificación Deudor',
    'Codeudores',
    'Teléfonos / Contactos',
    'Nro. Crédito',
    'Nro. Pagaré',
    'Capital Demandado',
    'Estado Obligación',
    'Nivel Recuperación',
    'Departamento',
    'Municipio',
    'Juzgado',
    'Radicado',
    'Medida Cautelar',
    'Fecha Demanda',
    'Fecha Mandamiento de Pago',
    'Recaudos en Período',
    'Historial Bitácora (Período)'
  ];
  
  const headerRow = sheet.addRow(headers);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  obligations.forEach((obs) => {
    const primaryDebtorActor = obs.actores?.find((a: any) => a.rolActor?.nombreRol === 'Deudor Principal');
    const primaryDebtor = primaryDebtorActor?.persona;
    const debtorName = primaryDebtor?.nombreCompleto || 'Sin Deudor Principal';
    const debtorDoc = primaryDebtor?.numeroIdentificacion || 'N/A';
    
    // Codeudores
    const codeudores = obs.actores
      ?.filter((a: any) => a.rolActor?.nombreRol === 'Codeudor' || a.rolActor?.nombreRol === 'Deudor Solidario')
      ?.map((a: any) => `${a.persona.nombreCompleto} (CC: ${a.persona.numeroIdentificacion})`)
      ?.join(', ') || 'N/A';

    // Contacts
    const contacts = primaryDebtor?.contactos?.map((c: any) => c.valor)?.join(', ') || 'N/A';

    // Total payments in range
    const totalPayments = obs.recaudos?.reduce((sum: number, r: any) => sum + Number(r.monto), 0) || 0;

    // Dates
    const lawsuitDate = obs.fechaPresentacionDemanda 
      ? new Date(obs.fechaPresentacionDemanda).toLocaleDateString('es-CO')
      : 'N/A';
    const paymentOrderDate = obs.mandamientoPagoFecha 
      ? new Date(obs.mandamientoPagoFecha).toLocaleDateString('es-CO')
      : 'N/A';

    // Combined timeline
    const bitacoraText = obs.historialTimeline || '';

    const row = sheet.addRow([
      debtorName,
      debtorDoc,
      codeudores,
      contacts,
      obs.numeroCredito || '',
      obs.numeroPagare || '',
      Number(obs.saldoCapitalDemandado),
      obs.estadoObligacion?.nombre || 'SIN ESTADO',
      obs.nivelRecuperacion?.nombre || 'N/A',
      obs.departamento?.nombre || obs.municipio?.departamento?.nombre || 'N/A',
      obs.municipio?.nombre || 'N/A',
      obs.juzgado?.nombre || 'N/A',
      obs.radicado || '',
      obs.medidaCautelar?.nombre || 'N/A',
      lawsuitDate,
      paymentOrderDate,
      totalPayments,
      bitacoraText
    ]);

    row.getCell(7).numFmt = '$#,##0';
    row.getCell(17).numFmt = '$#,##0';
    
    // Alignments
    row.getCell(1).alignment = { vertical: 'top' };
    row.getCell(2).alignment = { vertical: 'top', horizontal: 'center' };
    row.getCell(3).alignment = { vertical: 'top', wrapText: true };
    row.getCell(4).alignment = { vertical: 'top', wrapText: true };
    row.getCell(5).alignment = { vertical: 'top', horizontal: 'center' };
    row.getCell(6).alignment = { vertical: 'top', horizontal: 'center' };
    row.getCell(7).alignment = { vertical: 'top', horizontal: 'right' };
    row.getCell(8).alignment = { vertical: 'top', horizontal: 'center' };
    row.getCell(9).alignment = { vertical: 'top', horizontal: 'center' };
    row.getCell(10).alignment = { vertical: 'top', horizontal: 'center' };
    row.getCell(11).alignment = { vertical: 'top', horizontal: 'center' };
    row.getCell(12).alignment = { vertical: 'top' };
    row.getCell(13).alignment = { vertical: 'top', horizontal: 'center' };
    row.getCell(14).alignment = { vertical: 'top', horizontal: 'center' };
    row.getCell(15).alignment = { vertical: 'top', horizontal: 'center' };
    row.getCell(16).alignment = { vertical: 'top', horizontal: 'center' };
    row.getCell(17).alignment = { vertical: 'top', horizontal: 'right' };
    row.getCell(18).alignment = { vertical: 'top', wrapText: true };
  });

  // Set explicit professional column widths corresponding to header name/value lengths
  const columnWidths = [
    24, // Deudor Principal
    18, // Identificación Deudor
    22, // Codeudores
    20, // Teléfonos / Contactos
    14, // Nro. Crédito
    14, // Nro. Pagaré
    20, // Capital Demandado
    18, // Estado Obligación
    20, // Nivel Recuperación
    15, // Departamento
    15, // Municipio
    25, // Juzgado
    18, // Radicado
    18, // Medida Cautelar
    15, // Fecha Demanda
    26, // Fecha Mandamiento de Pago
    20, // Recaudos en Período
    50  // Historial Bitácora (Período)
  ];

  columnWidths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
