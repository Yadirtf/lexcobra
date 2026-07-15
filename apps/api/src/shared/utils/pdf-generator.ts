import PDFDocument from 'pdfkit';

export function buildPdfReport(
  title: string,
  portfolioName: string,
  nit: string,
  dateRange: string,
  obligations: any[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Set 30pt margins for max print area
    const doc = new PDFDocument({ margin: 30, size: 'LETTER' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const primaryColor = '#0f4c81'; // Classic dark blue
    const textColor = '#1e293b'; // Slate 800
    const subTextColor = '#475569'; // Slate 600

    obligations.forEach((obs, index) => {
      if (index > 0) {
        doc.addPage();
      }

      // ── 1. HEADER BAR ──
      doc.rect(30, 30, 552, 35).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold').text(
        'LexCobra — Reporte de Cartera - Caso Individual',
        40,
        42
      );

      // ── 2. SUBHEADER BAR ──
      doc.rect(30, 65, 552, 18).fill('#f1f5f9');
      doc.fillColor(subTextColor).fontSize(7.5).font('Helvetica').text(
        `${title} | Cartera: ${portfolioName} | NIT: ${nit || 'N/A'} | Período: ${dateRange}`,
        40,
        70
      );

      // ── 3. RESUMEN FINANCIERO ──
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('Resumen Financiero', 30, 95);

      // Total payments for this obligation
      const totalPayments = obs.recaudos?.reduce((sum: number, r: any) => sum + Number(r.monto), 0) || 0;

      // Card 1: Capital Demandado
      doc.roundedRect(30, 112, 260, 75, 6).fill('#f8fafc').strokeColor('#cbd5e1').stroke();
      
      // Coin icon circle
      doc.circle(48, 130, 10).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('$', 45, 126);
      
      doc.fillColor(subTextColor).fontSize(9).font('Helvetica-Bold').text('Capital Demandado', 65, 125);
      doc.fillColor(primaryColor).fontSize(15).font('Helvetica-Bold').text(
        `$${Number(obs.saldoCapitalDemandado).toLocaleString('es-CO')} COP`,
        45,
        148
      );
      
      // Badge (Estado Obligación)
      doc.roundedRect(45, 168, 160, 12, 3).fill('#fef3c7');
      doc.fillColor('#d97706').fontSize(7).font('Helvetica-Bold').text(
        `ESTADO OBLIGACIÓN: ${(obs.estadoObligacion?.nombre || 'SIN ESTADO').toUpperCase()}`,
        50,
        171
      );

      // Card 2: Recaudos en Período
      doc.roundedRect(322, 112, 260, 75, 6).fill('#f8fafc').strokeColor('#cbd5e1').stroke();
      
      // Checkmark icon circle
      doc.circle(340, 130, 10).fill('#22c55e');
      
      // Draw vector checkmark tick
      doc.lineWidth(1.5).strokeColor('#ffffff');
      doc.moveTo(336, 130).lineTo(339, 133).lineTo(344, 127).stroke();
      
      doc.fillColor(subTextColor).fontSize(9).font('Helvetica-Bold').text('Recaudos en Período', 357, 125);
      doc.fillColor('#1e293b').fontSize(15).font('Helvetica-Bold').text(
        `$${Number(totalPayments).toLocaleString('es-CO')} COP`,
        340,
        148
      );

      // Separator line
      doc.lineWidth(1).strokeColor('#e2e8f0').moveTo(30, 202).lineTo(582, 202).stroke();

      // ── 4. DETAILS SECTION (GRID) ──
      
      // Left Column
      doc.fillColor(textColor).fontSize(9.5).font('Helvetica-Bold').text('1. DATOS DE IDENTIFICACIÓN Y CONTACTO', 30, 212);
      
      const debtorActor = obs.actores?.find((a: any) => a.rolActor?.nombreRol === 'Deudor Principal');
      const debtorName = debtorActor?.persona?.nombreCompleto || 'Sin Deudor Principal';
      const debtorDoc = debtorActor?.persona?.numeroIdentificacion || 'N/A';
      
      const codeudores = obs.actores
        ?.filter((a: any) => a.rolActor?.nombreRol === 'Codeudor' || a.rolActor?.nombreRol === 'Deudor Solidario')
        ?.map((a: any) => `${a.persona.nombreCompleto} (CC: ${a.persona.numeroIdentificacion})`)
        ?.join(', ') || 'Ninguno';

      const contacts = debtorActor?.persona?.contactos?.map((c: any) => c.valor)?.join(', ') || 'N/A';

      let currentY = 227;
      doc.fillColor(subTextColor).fontSize(8.5).font('Helvetica-Bold').text('Deudor Principal: ', 30, currentY, { continued: true }).font('Helvetica').fillColor(textColor).text(debtorName);
      currentY += 14;
      doc.fillColor(subTextColor).font('Helvetica-Bold').text('Identificación: ', 30, currentY, { continued: true }).font('Helvetica').fillColor(textColor).text(`${debtorDoc} (CC)`);
      currentY += 14;
      doc.fillColor(subTextColor).font('Helvetica-Bold').text('Codeudores: ', 30, currentY);
      currentY += 12;
      doc.font('Helvetica').fillColor(textColor).text(codeudores, 30, currentY, { width: 260 });
      currentY = doc.y + 5;
      doc.fillColor(subTextColor).font('Helvetica-Bold').text('Teléfonos: ', 30, currentY);
      currentY += 12;
      doc.font('Helvetica').fillColor(textColor).text(contacts, 30, currentY, { width: 260 });
      const leftColEndY = doc.y;

      // Right Column
      doc.fillColor(textColor).fontSize(9.5).font('Helvetica-Bold').text('2. DETALLES PROCESALES Y MEDIDAS', 322, 212);
      
      const lawsuitDate = obs.fechaPresentacionDemanda 
        ? new Date(obs.fechaPresentacionDemanda).toLocaleDateString('es-CO')
        : 'N/A';
      const paymentOrderDate = obs.mandamientoPagoFecha 
        ? new Date(obs.mandamientoPagoFecha).toLocaleDateString('es-CO')
        : 'N/A';

      let currentYRight = 227;
      doc.fillColor(subTextColor).fontSize(8.5).font('Helvetica-Bold').text('Nro. Crédito: ', 322, currentYRight, { continued: true }).font('Helvetica').fillColor(textColor).text(obs.numeroCredito || 'N/A');
      currentYRight += 13;
      doc.fillColor(subTextColor).font('Helvetica-Bold').text('Nro. Pagaré: ', 322, currentYRight, { continued: true }).font('Helvetica').fillColor(textColor).text(obs.numeroPagare || 'N/A');
      currentYRight += 13;
      doc.fillColor(subTextColor).font('Helvetica-Bold').text('Nivel Recup.: ', 322, currentYRight, { continued: true }).font('Helvetica').fillColor(textColor).text(obs.nivelRecuperacion?.nombre || 'N/A');
      currentYRight += 13;
      doc.fillColor(subTextColor).font('Helvetica-Bold').text('Departamento/Municipio: ', 322, currentYRight, { continued: true }).font('Helvetica').fillColor(textColor).text(`${obs.departamento?.nombre || obs.municipio?.departamento?.nombre || 'N/A'} / ${obs.municipio?.nombre || 'N/A'}`);
      currentYRight += 13;
      doc.fillColor(subTextColor).font('Helvetica-Bold').text('Juzgado: ', 322, currentYRight);
      currentYRight += 12;
      doc.font('Helvetica').fillColor(textColor).text(obs.juzgado?.nombre || 'N/A', 322, currentYRight, { width: 260 });
      currentYRight = doc.y + 4;
      doc.fillColor(subTextColor).font('Helvetica-Bold').text('Radicado: ', 322, currentYRight, { continued: true }).font('Helvetica').fillColor(textColor).text(obs.radicado || 'N/A');
      currentYRight = doc.y + 4;
      doc.fillColor(subTextColor).font('Helvetica-Bold').text('Medida Cautelar: ', 322, currentYRight, { continued: true }).font('Helvetica').fillColor(textColor).text(obs.medidaCautelar?.nombre || 'N/A');
      currentYRight = doc.y + 4;
      doc.fillColor(subTextColor).font('Helvetica-Bold').text('Fecha Demanda/Mandamiento: ', 322, currentYRight, { continued: true }).font('Helvetica').fillColor(textColor).text(`${lawsuitDate} / ${paymentOrderDate}`);
      const rightColEndY = doc.y;

      const maxDetailsY = Math.max(leftColEndY, rightColEndY, currentY, currentYRight);

      // Separator line
      doc.lineWidth(1).strokeColor('#e2e8f0').moveTo(30, maxDetailsY + 15).lineTo(582, maxDetailsY + 15).stroke();

      // ── 5. TIMELINE SECTION ──
      const timelineHeaderY = maxDetailsY + 25;
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text(
        '3. LÍNEA DE TIEMPO DE BITÁCORA (CRONOLOGÍA)',
        30,
        timelineHeaderY
      );

      let currentTimelineY = timelineHeaderY + 20;
      const timelineX = 92;

      if (!obs.timelineEvents || obs.timelineEvents.length === 0) {
        doc.font('Helvetica-Oblique').fillColor('#94a3b8').fontSize(8.5).text(
          'No se registraron seguimientos ni gestiones en este período.',
          40,
          currentTimelineY
        );
      } else {
        const todayStr = new Date().toLocaleDateString('es-CO');

        obs.timelineEvents.forEach((item: any, eventIdx: number) => {
          const textHeight = doc.heightOfString(item.text, { width: 440 });
          const itemHeight = Math.max(textHeight + 22, 32);

          // Page overflow check
          if (currentTimelineY + itemHeight > 740) {
            // Draw line to the end of the page before breaking
            doc.lineWidth(1.5).strokeColor('#cbd5e1').moveTo(timelineX, currentTimelineY).lineTo(timelineX, 750).stroke();

            doc.addPage();

            // Continuity header on new page
            doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold').text(
              `LexCobra — Reporte de Cartera - Continuación Caso: ${debtorName.toUpperCase()}`,
              30,
              35
            );
            doc.lineWidth(1).strokeColor('#e2e8f0').moveTo(30, 48).lineTo(582, 48).stroke();

            currentTimelineY = 60;
            // Draw initial vertical line down to first node
            doc.lineWidth(1.5).strokeColor('#cbd5e1').moveTo(timelineX, 48).lineTo(timelineX, currentTimelineY + 9).stroke();
          }

          // Draw the connecting vertical line segment (if not the last item)
          if (eventIdx < obs.timelineEvents.length - 1) {
            doc.lineWidth(1.5).strokeColor('#cbd5e1').moveTo(timelineX, currentTimelineY + 9).lineTo(timelineX, currentTimelineY + itemHeight + 9).stroke();
          }

          // Node Circle
          doc.circle(timelineX, currentTimelineY + 9, 5).fill(item.color);

          // Date / HOY Badge
          const isToday = item.dateStr === todayStr;
          if (isToday) {
            // Draw blue pill badge
            doc.roundedRect(42, currentTimelineY + 3, 30, 11, 2).fill('#2563eb');
            doc.fillColor('#ffffff').fontSize(6.5).font('Helvetica-Bold').text(
              'HOY',
              43,
              currentTimelineY + 5,
              { width: 28, align: 'center' }
            );
          } else {
            doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text(
              `[${item.dateStr}]`,
              30,
              currentTimelineY + 5,
              { width: 48, align: 'right' }
            );
          }

          // Title & Detail description
          doc.fillColor(item.color).fontSize(8.5).font('Helvetica-Bold').text(item.title, 110, currentTimelineY + 4);
          doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(
            item.text,
            110,
            currentTimelineY + 15,
            { width: 440 }
          );

          currentTimelineY += itemHeight;
        });
      }
    });

    doc.end();
  });
}
