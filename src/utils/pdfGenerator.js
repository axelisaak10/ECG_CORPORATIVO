import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a PDF for a quotation
 * @param {Object} cot - Quotation data
 */
export const generateCotizacionPDF = async (cot) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;

  // --- Brand Colors ---
  const blue      = [22,  96, 195];   // primary blue
  const blueDark  = [15,  60, 130];   // darker blue
  const blueLight = [219, 234, 254];  // light blue tint
  const slate800  = [30,  41,  59];
  const slate600  = [71,  85, 105];
  const slate400  = [148, 163, 184];
  const slate100  = [241, 245, 249];
  const white     = [255, 255, 255];
  const amber     = [180, 100,  10];

  // --- Helpers ---
  const fmt = (n) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  // --- Function to load image ---
  const loadImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  };

  const logo = await loadImage('/assets/logos/centro.png');

  // =========================================================
  // HEADER
  // =========================================================

  // Top blue banner
  doc.setFillColor(...blue);
  doc.rect(0, 0, pageWidth, 44, 'F');

  // Subtle dark accent strip on left
  doc.setFillColor(...blueDark);
  doc.rect(0, 0, 5, 44, 'F');

  // Logo
  if (logo) {
    // White circle backdrop for logo
    doc.setFillColor(...white);
    doc.circle(margin + 13, 22, 14, 'F');
    doc.addImage(logo, 'PNG', margin + 1, 9, 24, 24);
  }

  // Company name
  doc.setFontSize(13);
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.text('Centro de Ingeniería y Abastecimiento ECG', margin + 31, 17);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 210, 250); // lighter blue text
  doc.text('Ingeniería que construye, gestión que respalda, y capacitación que transforma.', margin + 31, 23);
  doc.text('El Marqués, Querétaro, México  |  +52 442 773 4562  |  centroecg@ecgcorporativo.com', margin + 31, 29);

  // "COTIZACIÓN" label - right side of header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);
  doc.text('COTIZACIÓN', pageWidth - margin, 20, { align: 'right' });

  // Folio & date below the banner (on white background)
  doc.setFillColor(...white);
  doc.rect(0, 44, pageWidth, 14, 'F');
  doc.setDrawColor(...blueLight);
  doc.setLineWidth(0.4);
  doc.line(0, 58, pageWidth, 58);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...blue);
  doc.text(`Folio: ${cot.folio || 'S/N'}`, pageWidth - margin, 52, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slate600);
  doc.text(`Fecha: ${fmtDate(cot.created_at || new Date())}`, pageWidth - margin, 57, { align: 'right' });

  // =========================================================
  // CLIENT INFO SECTION
  // =========================================================
  let currentY = 66;

  // Card background
  doc.setFillColor(...slate100);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 28, 3, 3, 'F');

  // Left accent bar
  doc.setFillColor(...blue);
  doc.roundedRect(margin, currentY, 4, 28, 2, 2, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...slate600);
  doc.text('DATOS DEL CLIENTE', margin + 9, currentY + 7);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...slate800);
  doc.text(cot.clientes?.nombre || '—', margin + 9, currentY + 15);

  if (cot.clientes?.empresa) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slate600);
    doc.text(cot.clientes.empresa, margin + 9, currentY + 22);
  }

  // =========================================================
  // PROJECT DESCRIPTION
  // =========================================================
  currentY += 36;

  if (cot.descripcion) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...blue);
    doc.text('DESCRIPCIÓN DEL PROYECTO', margin, currentY);

    // Underline
    doc.setDrawColor(...blue);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + 1.5, margin + 65, currentY + 1.5);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slate800);
    const splitDesc = doc.splitTextToSize(cot.descripcion, pageWidth - margin * 2);
    doc.text(splitDesc, margin, currentY + 8);
    currentY += (splitDesc.length * 5.5) + 14;
  } else {
    currentY += 6;
  }

  // =========================================================
  // ITEMS TABLES
  // =========================================================
  if (cot.articulos && cot.articulos.length > 0) {
    const grouped = cot.articulos.reduce((acc, a) => {
      const cat = a.categoria || 'Artículos Varios';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([categoria, items]) => {
      if (currentY > pageHeight - 50) { doc.addPage(); currentY = 20; }

      // Category label
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...blue);
      doc.text(categoria.toUpperCase(), margin, currentY);

      // Underline
      doc.setDrawColor(...blue);
      doc.setLineWidth(0.4);
      doc.line(margin, currentY + 1.5, margin + doc.getTextWidth(categoria.toUpperCase()), currentY + 1.5);

      currentY += 4;

      autoTable(doc, {
        startY: currentY,
        head: [['Material / Descripción', 'Cantidad', 'Precio Unit.', 'Subtotal']],
        body: items.map(a => {
          const precioFinal = a.precio * (1 + (a.margen || 0) / 100);
          const nombreCompleto = a.codigo ? `[${a.codigo}] ${a.nombre}` : a.nombre;
          return [
            nombreCompleto,
            `${a.cantidad} ${a.unidad || 'pza'}`,
            fmt(precioFinal),
            fmt(precioFinal * a.cantidad)
          ];
        }),
        theme: 'grid',
        headStyles: {
          fillColor: blue,
          textColor: white,
          fontStyle: 'bold',
          fontSize: 8.5,
          cellPadding: 4,
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [236, 243, 255],
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          textColor: slate800,
          lineColor: [203, 213, 225],
          lineWidth: 0.3,
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { halign: 'center', cellWidth: 26 },
          2: { halign: 'right',  cellWidth: 32 },
          3: { halign: 'right',  cellWidth: 36, fontStyle: 'bold' },
        },
        margin: { left: margin, right: margin },
      });
      currentY = doc.lastAutoTable.finalY + 10;
    });
  }

  // =========================================================
  // TOOLS TABLE
  // =========================================================
  if (cot.herramientas && cot.herramientas.length > 0) {
    if (currentY > pageHeight - 50) { doc.addPage(); currentY = 20; }

    const totalDias = (cot.horas || 0) / 8 + (cot.dias || 0) + (cot.semanas || 0) * 7 + (cot.meses || 0) * 30;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...amber);
    doc.text('HERRAMIENTAS / EQUIPO', margin, currentY);
    doc.setDrawColor(...amber);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY + 1.5, margin + 60, currentY + 1.5);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [['Herramientas / Equipo (Renta)', 'Cant.', 'Días', 'Precio Día', 'Subtotal']],
      body: cot.herramientas.map(h => {
        const rentaFinal = (h.precio_renta_diaria || 0) * (1 + (h.margen || 0) / 100);
        return [
          h.nombre,
          h.cantidad,
          totalDias.toFixed(1),
          fmt(rentaFinal),
          fmt(rentaFinal * h.cantidad * totalDias)
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [180, 100, 10], textColor: white, fontStyle: 'bold', fontSize: 8.5, cellPadding: 4 },
      alternateRowStyles: { fillColor: [255, 247, 230] },
      styles: { fontSize: 8, cellPadding: 3, textColor: slate800, lineColor: [203, 213, 225], lineWidth: 0.3 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin }
    });
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // =========================================================
  // TIME & PERSONNEL
  // =========================================================
  if (currentY > pageHeight - 70) { doc.addPage(); currentY = 20; }

  const hasTime = (cot.horas || 0) > 0 || (cot.dias || 0) > 0 || (cot.semanas || 0) > 0 || (cot.meses || 0) > 0;
  if (hasTime || (cot.empleados && cot.empleados.length > 0)) {
    doc.setFillColor(...blueLight);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 22, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...blue);
    doc.text('TIEMPO Y PERSONAL', margin + 5, currentY + 7);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slate600);

    let timeParts = [];
    if (cot.horas)   timeParts.push(`${cot.horas} h`);
    if (cot.dias)    timeParts.push(`${cot.dias} días`);
    if (cot.semanas) timeParts.push(`${cot.semanas} sem`);
    if (cot.meses)   timeParts.push(`${cot.meses} mes`);

    const timeStr = timeParts.length > 0 ? `Duración estimada: ${timeParts.join(', ')}` : '';
    const empStr  = cot.empleados && cot.empleados.length > 0
      ? `Personal asignado: ${cot.empleados.map(e => e.nombre).join(', ')}`
      : '';

    if (timeStr) doc.text(timeStr, margin + 5, currentY + 14);
    if (empStr)  doc.text(empStr,  margin + 5, currentY + (timeStr ? 19 : 14));
    currentY += 30;
  }

  // =========================================================
  // TOTALS
  // =========================================================
  if (currentY > pageHeight - 80) { doc.addPage(); currentY = 20; }

  const totalsW = 90;
  const totalsX = pageWidth - margin - totalsW;

  const subtotalArt  = cot.totales?.articulos || 0;
  const totalDiasCalc = (cot.horas || 0) / 8 + (cot.dias || 0) + (cot.semanas || 0) * 7 + (cot.meses || 0) * 30;
  const subtotalHer  = (cot.herramientas || []).reduce((s, h) =>
    s + (h.precio_renta_diaria || 0) * (1 + (h.margen || 0) / 100) * h.cantidad * totalDiasCalc, 0);
  const subtotalTime = cot.totales?.tiempo || 0;

  // Card background
  doc.setFillColor(...slate100);
  doc.roundedRect(totalsX, currentY, totalsW, 52, 3, 3, 'F');

  // Top accent
  doc.setFillColor(...blue);
  doc.roundedRect(totalsX, currentY, totalsW, 6, 3, 3, 'F');
  doc.rect(totalsX, currentY + 3, totalsW, 3, 'F'); // fill bottom corners of top bar

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);
  doc.text('RESUMEN', totalsX + totalsW / 2, currentY + 4.5, { align: 'center' });

  // Rows
  const rowData = [
    ['Subtotal Artículos:', fmt(subtotalArt)],
    ['Subtotal Herramientas:', fmt(subtotalHer)],
    ['Mano de Obra / Tiempo:', fmt(subtotalTime)],
  ];

  let ry = currentY + 13;
  rowData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...slate600);
    doc.text(label, totalsX + 5, ry);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...slate800);
    doc.text(value, totalsX + totalsW - 5, ry, { align: 'right' });
    ry += 8;
  });

  // Divider
  doc.setDrawColor(...slate400);
  doc.setLineWidth(0.4);
  doc.line(totalsX + 4, ry - 1, totalsX + totalsW - 4, ry - 1);

  // Total row — highlighted box
  doc.setFillColor(...blue);
  doc.roundedRect(totalsX, ry + 1, totalsW, 12, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);
  doc.text('TOTAL:', totalsX + 5, ry + 9);
  doc.text(fmt(cot.total), totalsX + totalsW - 5, ry + 9, { align: 'right' });

  // =========================================================
  // SIGNATURE LINES
  // =========================================================
  const sigY = pageHeight - 48;
  doc.setDrawColor(190, 200, 215);
  doc.setLineWidth(0.5);

  // Left signature
  doc.line(margin, sigY, margin + 62, sigY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slate600);
  doc.text('Nombre y Firma — ECG', margin + 1, sigY + 4.5);
  doc.setFontSize(7);
  doc.setTextColor(...slate400);
  doc.text('Elaboró / Autorizó', margin + 1, sigY + 8.5);

  // Right signature
  const sigRX = pageWidth - margin - 62;
  doc.line(sigRX, sigY, sigRX + 62, sigY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slate600);
  doc.text('Nombre y Firma — Cliente', sigRX + 1, sigY + 4.5);
  doc.setFontSize(7);
  doc.setTextColor(...slate400);
  doc.text('Acepta / Autoriza', sigRX + 1, sigY + 8.5);

  // =========================================================
  // FOOTER
  // =========================================================
  const footerY = pageHeight - 14;

  // Footer band
  doc.setFillColor(...blueDark);
  doc.rect(0, footerY - 2, pageWidth, 16, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(186, 210, 250);
  doc.text(
    'Esta cotización tiene una vigencia de 15 días. Precios sujetos a cambios sin previo aviso.',
    pageWidth / 2, footerY + 4, { align: 'center' }
  );
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...white);
  doc.text('© ECG Corporativo — El Marqués, Querétaro.', pageWidth / 2, footerY + 9, { align: 'center' });

  // Save the PDF
  const fileName = `Cotizacion_${cot.folio || cot.id}_${cot.clientes?.nombre?.replace(/\s+/g, '_') || 'Cliente'}.pdf`;
  doc.save(fileName);
};
