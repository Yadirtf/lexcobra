import PDFDocument from 'pdfkit';

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  primary:    '#0f4c81', // Dark navy blue
  accent:     '#1d6fad', // Lighter blue
  gold:       '#d97706', // Amber/Gold
  green:      '#16a34a', // Success green
  greenLight: '#22c55e',
  red:        '#dc2626',
  slate800:   '#1e293b',
  slate600:   '#475569',
  slate400:   '#94a3b8',
  slate200:   '#e2e8f0',
  slate100:   '#f1f5f9',
  slate50:    '#f8fafc',
  white:      '#ffffff',
  // Chart colors for distribution
  chartColors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'],
};

// ─── Number Formatters ────────────────────────────────────────────────────────
const fmtCOP = (n: number) =>
  `$${Math.round(n).toLocaleString('es-CO')} COP`;

const fmtShortCOP = (n: number): string => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString('es-CO')}`;
};

const fmtPct = (n: number) => `${Math.min(n, 100).toFixed(1)}%`;

// ─── Draw a rounded-corner rectangle (manual approximation via bezier) ─────────
function roundedRect(
  doc: PDFKit.PDFDocument,
  x: number, y: number, w: number, h: number,
  r: number,
  fillColor?: string,
  strokeColor?: string
) {
  doc.save();
  doc.moveTo(x + r, y)
    .lineTo(x + w - r, y)
    .quadraticCurveTo(x + w, y, x + w, y + r)
    .lineTo(x + w, y + h - r)
    .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    .lineTo(x + r, y + h)
    .quadraticCurveTo(x, y + h, x, y + h - r)
    .lineTo(x, y + r)
    .quadraticCurveTo(x, y, x + r, y);

  if (fillColor && strokeColor) {
    doc.fillAndStroke(fillColor, strokeColor);
  } else if (fillColor) {
    doc.fill(fillColor);
  } else if (strokeColor) {
    doc.stroke(strokeColor);
  }
  doc.restore();
}

// ─── Draw a KPI card ──────────────────────────────────────────────────────────
function drawKpiCard(
  doc: PDFKit.PDFDocument,
  x: number, y: number, w: number, h: number,
  label: string,
  value: string,
  accentColor: string,
  indicatorLabel?: string
) {
  // Card background
  roundedRect(doc, x, y, w, h, 6, C.slate50, C.slate200);

  // Left color accent bar
  doc.rect(x, y + 6, 4, h - 12).fill(accentColor);

  // Label
  doc.fillColor(C.slate600)
    .fontSize(7)
    .font('Helvetica-Bold')
    .text(label.toUpperCase(), x + 12, y + 12, { width: w - 16, characterSpacing: 0.3 });

  // Value
  doc.fillColor(C.slate800)
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(value, x + 12, y + 28, { width: w - 16 });

  // Optional sub-label
  if (indicatorLabel) {
    doc.fillColor(accentColor)
      .fontSize(7)
      .font('Helvetica')
      .text(indicatorLabel, x + 12, y + h - 16, { width: w - 16 });
  }
}

// ─── Draw horizontal bar chart ────────────────────────────────────────────────
function drawHorizontalBarChart(
  doc: PDFKit.PDFDocument,
  x: number, y: number, w: number, h: number,
  title: string,
  data: { label: string; value: number; color: string }[],
  maxValue: number
) {
  // Panel background
  roundedRect(doc, x, y, w, h, 6, C.slate50, C.slate200);

  // Title
  doc.fillColor(C.primary)
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), x + 10, y + 10, { width: w - 20, characterSpacing: 0.3 });

  const barAreaTop = y + 28;
  const barW = w - 100; // space for label and count
  const barH = 13;
  const spacing = 8;
  const maxItems = Math.min(data.length, Math.floor((h - 40) / (barH + spacing)));

  data.slice(0, maxItems).forEach((item, i) => {
    const barY = barAreaTop + i * (barH + spacing);
    const ratio = maxValue > 0 ? item.value / maxValue : 0;
    const filledW = Math.max(ratio * barW, 2);

    // Background bar
    roundedRect(doc, x + 72, barY, barW, barH, 3, C.slate200, '');

    // Filled bar
    if (filledW > 6) {
      roundedRect(doc, x + 72, barY, filledW, barH, 3, item.color, '');
    } else {
      doc.rect(x + 72, barY, filledW, barH).fill(item.color);
    }

    // Label (left)
    const shortLabel = item.label.length > 12 ? item.label.slice(0, 11) + '…' : item.label;
    doc.fillColor(C.slate600)
      .fontSize(7.5)
      .font('Helvetica')
      .text(shortLabel, x + 8, barY + 2, { width: 60, align: 'right' });

    // Count (right)
    doc.fillColor(C.slate800)
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text(String(item.value), x + 76 + filledW + 3, barY + 2, { width: 25 });
  });

  if (data.length === 0) {
    doc.fillColor(C.slate400).fontSize(8).font('Helvetica-Oblique')
      .text('Sin datos', x + 10, barAreaTop + 10, { width: w - 20, align: 'center' });
  }
}

// ─── Draw donut/pie chart ─────────────────────────────────────────────────────
function drawDonutChart(
  doc: PDFKit.PDFDocument,
  cx: number, cy: number, radius: number,
  segments: { value: number; color: string; label: string }[],
  centerLabel: string,
  centerSub: string
) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    doc.circle(cx, cy, radius).stroke(C.slate200);
    return;
  }

  const innerRadius = radius * 0.56;
  let startAngle = -Math.PI / 2; // start from top

  segments.forEach(seg => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sweep;

    // Draw arc segment using PDFKit path
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const ix1 = cx + innerRadius * Math.cos(endAngle);
    const iy1 = cy + innerRadius * Math.sin(endAngle);
    const ix2 = cx + innerRadius * Math.cos(startAngle);
    const iy2 = cy + innerRadius * Math.sin(startAngle);
    const largeArc = sweep > Math.PI ? 1 : 0;

    // Build the arc path manually via SVG-like commands
    doc.save();
    doc.path(
      `M ${x1} ${y1}` +
      ` A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}` +
      ` L ${ix1} ${iy1}` +
      ` A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}` +
      ` Z`
    ).fill(seg.color);
    doc.restore();

    startAngle = endAngle;
  });

  // Inner white circle (donut hole)
  doc.circle(cx, cy, innerRadius - 1).fill(C.white);

  // Center text
  const labelFontSize = centerLabel.length > 6 ? 9 : 11;
  doc.fillColor(C.slate800)
    .fontSize(labelFontSize)
    .font('Helvetica-Bold')
    .text(centerLabel, cx - innerRadius + 4, cy - 10, {
      width: (innerRadius - 4) * 2,
      align: 'center'
    });

  doc.fillColor(C.slate600)
    .fontSize(6.5)
    .font('Helvetica')
    .text(centerSub, cx - innerRadius + 4, cy + 4, {
      width: (innerRadius - 4) * 2,
      align: 'center'
    });
}

// ─── Draw legend item ─────────────────────────────────────────────────────────
function drawLegendItem(
  doc: PDFKit.PDFDocument,
  x: number, y: number,
  color: string,
  label: string,
  valueLabel: string
) {
  doc.rect(x, y + 1, 8, 8).fill(color);
  doc.fillColor(C.slate600)
    .fontSize(7.5)
    .font('Helvetica')
    .text(label, x + 12, y, { continued: true })
    .font('Helvetica-Bold')
    .fillColor(C.slate800)
    .text(` ${valueLabel}`);
}

// ─── Compute summary stats from obligations ───────────────────────────────────
function computeSummary(obligations: any[]) {
  const totalCapital = obligations.reduce(
    (s, o) => s + Number(o.saldoCapitalDemandado || 0), 0
  );

  const totalRecaudosPeriodo = obligations.reduce(
    (s, o) => s + (o.recaudos || []).reduce((rs: number, r: any) => rs + Number(r.monto || 0), 0), 0
  );

  const pctRecuperacion = totalCapital > 0
    ? (totalRecaudosPeriodo / totalCapital) * 100
    : 0;

  // Count obligations with at least one event in the period
  const obligacionesConActividad = obligations.filter(o =>
    (o.bitacora?.length || 0) +
    (o.recaudos?.length || 0) +
    (o.notificaciones?.length || 0) +
    (o.historialEstados?.length || 0) +
    (o.auditoria?.length || 0) > 0
  ).length;

  // Distribution by estado
  const estadosMap: Record<string, { count: number; color: string }> = {};
  obligations.forEach(o => {
    const nombre = o.estadoObligacion?.nombre || 'Sin Estado';
    const color  = o.estadoObligacion?.color  || C.slate400;
    if (!estadosMap[nombre]) estadosMap[nombre] = { count: 0, color };
    estadosMap[nombre].count++;
  });
  const estadosData = Object.entries(estadosMap)
    .map(([label, d]) => ({ label, value: d.count, color: d.color }))
    .sort((a, b) => b.value - a.value);

  // Distribution by nivel de recuperación
  const nivelesMap: Record<string, { count: number }> = {};
  obligations.forEach(o => {
    const nombre = o.nivelRecuperacion?.nombre || 'Sin Nivel';
    if (!nivelesMap[nombre]) nivelesMap[nombre] = { count: 0 };
    nivelesMap[nombre].count++;
  });
  const nivelesData = Object.entries(nivelesMap)
    .map(([label, d], i) => ({
      label,
      value: d.count,
      color: C.chartColors[i % C.chartColors.length]
    }))
    .sort((a, b) => b.value - a.value);

  // Activity counters
  const totalBitacora      = obligations.reduce((s, o) => s + (o.bitacora?.length || 0), 0);
  const totalAbonos        = obligations.reduce((s, o) => s + (o.recaudos?.length || 0), 0);
  const totalNotificaciones = obligations.reduce((s, o) => s + (o.notificaciones?.length || 0), 0);
  const totalCambiosEstado = obligations.reduce((s, o) => s + (o.historialEstados?.length || 0), 0);

  return {
    totalCapital,
    totalRecaudosPeriodo,
    pctRecuperacion,
    obligacionesConActividad,
    estadosData,
    nivelesData,
    totalBitacora,
    totalAbonos,
    totalNotificaciones,
    totalCambiosEstado,
  };
}

// ─── Draw the full summary cover page ────────────────────────────────────────
function drawSummaryPage(
  doc: PDFKit.PDFDocument,
  agencyName: string,
  portfolioName: string,
  nit: string,
  dateRange: string,
  title: string,
  obligations: any[]
) {
  const PAGE_W = 612; // Letter width pts
  const M = 30;       // margin
  const CONTENT_W = PAGE_W - M * 2; // 552

  const s = computeSummary(obligations);

  // ── HEADER BAR ─────────────────────────────────────────────────────────────
  // Main dark blue bar
  doc.rect(M, M, CONTENT_W, 40).fill(C.primary);

  // Agency name (casa de cobranza) - prominent, full width
  doc.fillColor(C.white)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(agencyName.toUpperCase(), M + 12, M + 13, { width: CONTENT_W - 24 });

  // ── SUBHEADER BAR ──────────────────────────────────────────────────────────
  doc.rect(M, M + 40, CONTENT_W, 20).fill(C.slate100);
  doc.fillColor(C.slate600)
    .fontSize(7.5)
    .font('Helvetica')
    .text(
      `Cartera: ${portfolioName}   |   NIT: ${nit || 'N/A'}   |   Período: ${dateRange}   |   ${title}`,
      M + 10, M + 46,
      { width: CONTENT_W - 20 }
    );

  // ── SECTION TITLE ──────────────────────────────────────────────────────────
  let currentY = M + 72;
  doc.fillColor(C.primary)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('RESUMEN EJECUTIVO DE CARTERA', M, currentY, { width: CONTENT_W, align: 'center', characterSpacing: 0.5 });

  // Thin divider
  currentY += 16;
  doc.lineWidth(0.5).strokeColor(C.slate200)
    .moveTo(M, currentY).lineTo(M + CONTENT_W, currentY).stroke();

  // ── KPI CARDS (4 cards, equal width) ───────────────────────────────────────
  currentY += 10;
  const kpiH = 60;
  const kpiGap = 8;
  const kpiW = (CONTENT_W - kpiGap * 3) / 4;

  drawKpiCard(doc, M,                              currentY, kpiW, kpiH,
    'Total Obligaciones', String(obligations.length), C.accent,
    `${s.obligacionesConActividad} con actividad en período`);

  drawKpiCard(doc, M + (kpiW + kpiGap),            currentY, kpiW, kpiH,
    'Capital Total Demandado', fmtShortCOP(s.totalCapital), C.primary,
    fmtCOP(s.totalCapital));

  drawKpiCard(doc, M + (kpiW + kpiGap) * 2,        currentY, kpiW, kpiH,
    'Recaudado en Período', fmtShortCOP(s.totalRecaudosPeriodo), C.green,
    `${s.totalAbonos} abono(s) registrado(s)`);

  drawKpiCard(doc, M + (kpiW + kpiGap) * 3,        currentY, kpiW, kpiH,
    '% Recuperación Período', fmtPct(s.pctRecuperacion), s.pctRecuperacion >= 20 ? C.green : C.gold,
    s.pctRecuperacion >= 20 ? 'Recuperación saludable' : 'Meta: incrementar recaudo');

  // ── CHARTS ROW ─────────────────────────────────────────────────────────────
  currentY += kpiH + 14;
  const chartH = 130;
  const chartGap = 10;
  const chartW = (CONTENT_W - chartGap) / 2;

  // LEFT: Horizontal bar chart — Estados de Obligación
  drawHorizontalBarChart(
    doc,
    M, currentY, chartW, chartH,
    'Distribución por Estado de Obligación',
    s.estadosData,
    s.estadosData[0]?.value || 1
  );

  // RIGHT: Donut chart — Capital vs Recaudado + Nivel de Recuperación
  const donutPanelX = M + chartW + chartGap;
  roundedRect(doc, donutPanelX, currentY, chartW, chartH, 6, C.slate50, C.slate200);

  doc.fillColor(C.primary)
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .text('CAPITAL VS RECAUDADO EN PERÍODO', donutPanelX + 10, currentY + 10, {
      width: chartW - 20,
      characterSpacing: 0.3
    });

  const donutCX = donutPanelX + 58;
  const donutCY = currentY + chartH / 2 + 10;
  const donutR  = 44;

  const remaining = Math.max(s.totalCapital - s.totalRecaudosPeriodo, 0);
  const donutSegments = [
    { value: s.totalRecaudosPeriodo, color: C.greenLight, label: 'Recaudado' },
    { value: remaining,               color: C.slate200,   label: 'Pendiente' },
  ];

  drawDonutChart(
    doc,
    donutCX, donutCY, donutR,
    donutSegments,
    fmtPct(s.pctRecuperacion),
    'recup.'
  );

  // Legend for donut
  const legendX = donutPanelX + 120;
  const legendY = currentY + 35;
  drawLegendItem(doc, legendX, legendY, C.greenLight, 'Recaudado:', fmtShortCOP(s.totalRecaudosPeriodo));
  drawLegendItem(doc, legendX, legendY + 16, C.slate200, 'Pendiente:', fmtShortCOP(remaining));
  drawLegendItem(doc, legendX, legendY + 32, C.primary, 'Capital Total:', fmtShortCOP(s.totalCapital));

  // Nivel recuperación mini legend below
  if (s.nivelesData.length > 0) {
    doc.fillColor(C.slate600)
      .fontSize(7)
      .font('Helvetica-Bold')
      .text('NIVELES DE RECUPERACIÓN:', legendX, legendY + 56, { width: chartW - 130 });

    s.nivelesData.slice(0, 4).forEach((nd, i) => {
      doc.rect(legendX, legendY + 68 + i * 13, 7, 7).fill(nd.color);
      doc.fillColor(C.slate600)
        .fontSize(7)
        .font('Helvetica')
        .text(`${nd.label}: ${nd.value}`, legendX + 11, legendY + 68 + i * 13, { width: chartW - 135 });
    });
  }



  // ── FOOTER ─────────────────────────────────────────────────────────────────
  const footerY = 740;
  doc.lineWidth(0.5).strokeColor(C.slate200)
    .moveTo(M, footerY).lineTo(M + CONTENT_W, footerY).stroke();

  doc.fillColor(C.slate400)
    .fontSize(7)
    .font('Helvetica')
    .text(
      `Generado el: ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}  •  ${agencyName}  •  Sistema LexCobra`,
      M, footerY + 6,
      { width: CONTENT_W / 2 }
    );

  doc.fillColor(C.slate400)
    .fontSize(7)
    .font('Helvetica')
    .text(
      `Página 1 de ${obligations.length + 1}  •  Reporte Confidencial`,
      M, footerY + 6,
      { width: CONTENT_W, align: 'right' }
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function buildPdfReport(
  title: string,
  portfolioName: string,
  nit: string,
  dateRange: string,
  obligations: any[],
  agencyName: string = 'Casa de Cobranza'
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'LETTER' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // ── PAGE 1: Executive Summary ────────────────────────────────────────────
    drawSummaryPage(doc, agencyName, portfolioName, nit, dateRange, title, obligations);

    // ── PAGES 2+N: One page per obligation ───────────────────────────────────
    obligations.forEach((obs, index) => {
      doc.addPage();

      // Header bar
      doc.rect(30, 30, 552, 35).fill(C.primary);
      doc.fillColor(C.white)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`${agencyName.toUpperCase()} — Reporte de Cartera`, 40, 37, { width: 350 });

      // Subheader
      doc.rect(30, 65, 552, 18).fill(C.slate100);
      doc.fillColor(C.slate600)
        .fontSize(7.5)
        .font('Helvetica')
        .text(
          `${title}  |  Cartera: ${portfolioName}  |  NIT: ${nit || 'N/A'}  |  Período: ${dateRange}  |  Proceso #${index + 1}`,
          40, 70
        );

      // Resumen financiero del proceso
      const totalPayments = obs.recaudos?.reduce(
        (sum: number, r: any) => sum + Number(r.monto || 0), 0
      ) || 0;

      doc.fillColor(C.primary)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Resumen Financiero', 30, 95);

      // Card 1: Capital Demandado
      doc.roundedRect(30, 112, 260, 75, 6).fill(C.slate50).strokeColor(C.slate200).stroke();
      doc.circle(48, 130, 10).fill(C.primary);
      doc.fillColor(C.white).fontSize(9).font('Helvetica-Bold').text('$', 45, 126);
      doc.fillColor(C.slate600).fontSize(9).font('Helvetica-Bold').text('Capital Demandado', 65, 125);
      doc.fillColor(C.primary)
        .fontSize(15)
        .font('Helvetica-Bold')
        .text(`$${Number(obs.saldoCapitalDemandado).toLocaleString('es-CO')} COP`, 45, 148);
      doc.roundedRect(45, 168, 160, 12, 3).fill('#fef3c7');
      doc.fillColor(C.gold)
        .fontSize(7)
        .font('Helvetica-Bold')
        .text(
          `ESTADO: ${(obs.estadoObligacion?.nombre || 'SIN ESTADO').toUpperCase()}`,
          50, 171
        );

      // Card 2: Recaudos en Período
      doc.roundedRect(322, 112, 260, 75, 6).fill(C.slate50).strokeColor(C.slate200).stroke();
      doc.circle(340, 130, 10).fill(C.greenLight);
      doc.lineWidth(1.5).strokeColor(C.white);
      doc.moveTo(336, 130).lineTo(339, 133).lineTo(344, 127).stroke();
      doc.fillColor(C.slate600).fontSize(9).font('Helvetica-Bold').text('Recaudos en Período', 357, 125);
      doc.fillColor(C.slate800)
        .fontSize(15)
        .font('Helvetica-Bold')
        .text(`$${Number(totalPayments).toLocaleString('es-CO')} COP`, 340, 148);

      // Separator
      doc.lineWidth(1).strokeColor(C.slate200).moveTo(30, 202).lineTo(582, 202).stroke();

      // ── Datos de identificación (Left column) ──
      const debtorActor = obs.actores?.find(
        (a: any) => a.rolActor?.nombreRol === 'Deudor Principal'
      );
      const debtorName = debtorActor?.persona?.nombreCompleto || 'Sin Deudor Principal';
      const debtorDoc  = debtorActor?.persona?.numeroIdentificacion || 'N/A';
      const codeudores = obs.actores
        ?.filter((a: any) => a.rolActor?.nombreRol === 'Codeudor' || a.rolActor?.nombreRol === 'Deudor Solidario')
        ?.map((a: any) => `${a.persona.nombreCompleto} (CC: ${a.persona.numeroIdentificacion})`)
        ?.join(', ') || 'Ninguno';
      const contacts = debtorActor?.persona?.contactos?.map((c: any) => c.valor)?.join(', ') || 'N/A';

      doc.fillColor(C.slate800).fontSize(9.5).font('Helvetica-Bold')
        .text('1. DATOS DE IDENTIFICACIÓN Y CONTACTO', 30, 212);

      let cy = 227;
      doc.fillColor(C.slate600).fontSize(8.5).font('Helvetica-Bold')
        .text('Deudor Principal: ', 30, cy, { continued: true })
        .font('Helvetica').fillColor(C.slate800).text(debtorName);
      cy += 14;
      doc.fillColor(C.slate600).font('Helvetica-Bold')
        .text('Identificación: ', 30, cy, { continued: true })
        .font('Helvetica').fillColor(C.slate800).text(`${debtorDoc} (CC)`);
      cy += 14;
      doc.fillColor(C.slate600).font('Helvetica-Bold').text('Codeudores: ', 30, cy);
      cy += 12;
      doc.font('Helvetica').fillColor(C.slate800).text(codeudores, 30, cy, { width: 260 });
      cy = doc.y + 5;
      doc.fillColor(C.slate600).font('Helvetica-Bold').text('Teléfonos: ', 30, cy);
      cy += 12;
      doc.font('Helvetica').fillColor(C.slate800).text(contacts, 30, cy, { width: 260 });
      const leftColEndY = doc.y;

      // ── Detalles procesales (Right column) ──
      doc.fillColor(C.slate800).fontSize(9.5).font('Helvetica-Bold')
        .text('2. DETALLES PROCESALES Y MEDIDAS', 322, 212);

      const lawsuitDate = obs.fechaPresentacionDemanda
        ? new Date(obs.fechaPresentacionDemanda).toLocaleDateString('es-CO') : 'N/A';
      const paymentOrderDate = obs.mandamientoPagoFecha
        ? new Date(obs.mandamientoPagoFecha).toLocaleDateString('es-CO') : 'N/A';

      let cyR = 227;
      doc.fillColor(C.slate600).fontSize(8.5).font('Helvetica-Bold')
        .text('Nro. Crédito: ', 322, cyR, { continued: true })
        .font('Helvetica').fillColor(C.slate800).text(obs.numeroCredito || 'N/A');
      cyR += 13;
      doc.fillColor(C.slate600).font('Helvetica-Bold')
        .text('Nro. Pagaré: ', 322, cyR, { continued: true })
        .font('Helvetica').fillColor(C.slate800).text(obs.numeroPagare || 'N/A');
      cyR += 13;
      doc.fillColor(C.slate600).font('Helvetica-Bold')
        .text('Nivel Recup.: ', 322, cyR, { continued: true })
        .font('Helvetica').fillColor(C.slate800).text(obs.nivelRecuperacion?.nombre || 'N/A');
      cyR += 13;
      doc.fillColor(C.slate600).font('Helvetica-Bold')
        .text('Departamento/Municipio: ', 322, cyR, { continued: true })
        .font('Helvetica').fillColor(C.slate800).text(
          `${obs.departamento?.nombre || obs.municipio?.departamento?.nombre || 'N/A'} / ${obs.municipio?.nombre || 'N/A'}`
        );
      cyR += 13;
      doc.fillColor(C.slate600).font('Helvetica-Bold').text('Juzgado: ', 322, cyR);
      cyR += 12;
      doc.font('Helvetica').fillColor(C.slate800).text(obs.juzgado?.nombre || 'N/A', 322, cyR, { width: 260 });
      cyR = doc.y + 4;
      doc.fillColor(C.slate600).font('Helvetica-Bold')
        .text('Radicado: ', 322, cyR, { continued: true })
        .font('Helvetica').fillColor(C.slate800).text(obs.radicado || 'N/A');
      cyR = doc.y + 4;
      doc.fillColor(C.slate600).font('Helvetica-Bold')
        .text('Medida Cautelar: ', 322, cyR, { continued: true })
        .font('Helvetica').fillColor(C.slate800).text(obs.medidaCautelar?.nombre || 'N/A');
      cyR = doc.y + 4;
      doc.fillColor(C.slate600).font('Helvetica-Bold')
        .text('Fecha Demanda/Mandamiento: ', 322, cyR, { continued: true })
        .font('Helvetica').fillColor(C.slate800).text(`${lawsuitDate} / ${paymentOrderDate}`);
      const rightColEndY = doc.y;

      const maxDetailsY = Math.max(leftColEndY, rightColEndY, cy, cyR);

      // Separator
      doc.lineWidth(1).strokeColor(C.slate200)
        .moveTo(30, maxDetailsY + 15).lineTo(582, maxDetailsY + 15).stroke();

      // ── Timeline ──
      const timelineHeaderY = maxDetailsY + 25;
      doc.fillColor(C.primary).fontSize(10).font('Helvetica-Bold')
        .text('3. LÍNEA DE TIEMPO DE BITÁCORA (CRONOLOGÍA)', 30, timelineHeaderY);

      let currentTimelineY = timelineHeaderY + 20;
      const timelineX = 92;

      if (!obs.timelineEvents || obs.timelineEvents.length === 0) {
        doc.font('Helvetica-Oblique').fillColor(C.slate400).fontSize(8.5)
          .text('No se registraron seguimientos ni gestiones en este período.', 40, currentTimelineY);
      } else {
        const todayStr = new Date().toLocaleDateString('es-CO');

        obs.timelineEvents.forEach((item: any, eventIdx: number) => {
          const textHeight = doc.heightOfString(item.text, { width: 440 });
          const itemHeight = Math.max(textHeight + 22, 32);

          if (currentTimelineY + itemHeight > 740) {
            doc.lineWidth(1.5).strokeColor('#cbd5e1')
              .moveTo(timelineX, currentTimelineY).lineTo(timelineX, 750).stroke();
            doc.addPage();
            doc.fillColor(C.primary).fontSize(9).font('Helvetica-Bold')
              .text(
                `${agencyName.toUpperCase()} — Continuación Caso: ${debtorName.toUpperCase()}`,
                30, 35
              );
            doc.lineWidth(1).strokeColor(C.slate200).moveTo(30, 48).lineTo(582, 48).stroke();
            currentTimelineY = 60;
            doc.lineWidth(1.5).strokeColor('#cbd5e1')
              .moveTo(timelineX, 48).lineTo(timelineX, currentTimelineY + 9).stroke();
          }

          if (eventIdx < obs.timelineEvents.length - 1) {
            doc.lineWidth(1.5).strokeColor('#cbd5e1')
              .moveTo(timelineX, currentTimelineY + 9)
              .lineTo(timelineX, currentTimelineY + itemHeight + 9)
              .stroke();
          }

          doc.circle(timelineX, currentTimelineY + 9, 5).fill(item.color);

          doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold')
            .text(`[${item.dateStr}]`, 30, currentTimelineY + 5, { width: 48, align: 'right' });

          doc.fillColor(item.color).fontSize(8.5).font('Helvetica-Bold')
            .text(item.title, 110, currentTimelineY + 4);
          doc.fillColor(C.slate600).fontSize(7.5).font('Helvetica')
            .text(item.text, 110, currentTimelineY + 15, { width: 440 });

          currentTimelineY += itemHeight;
        });
      }
    });

    doc.end();
  });
}
