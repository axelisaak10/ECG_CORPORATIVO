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
  const margin = 20;

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

  // --- Background Decoration ---
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(0, 40, pageWidth, 40);

  // --- Header & Logo ---
  if (logo) {
    doc.addImage(logo, 'PNG', margin, 8, 24, 24);
  }

  // Company Info
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont('helvetica', 'bold');
  doc.text('Centro de Ingeniería y Abastecimiento ECG', margin + 30, 18);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'normal');
  doc.text('Ingeniería que construye, gestión que respalda, y capacitación que transforma.', margin + 30, 23);
  doc.text('El Marqués, Querétaro, México | +52 442 773 4562 | centroecg@ecgcorporativo.com', margin + 30, 27);

  // Title "COTIZACIÓN"
  doc.setFontSize(24);
  doc.setTextColor(59, 130, 246); // blue-600
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', pageWidth - margin, 22, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Folio: ${cot.folio || 'S/N'}`, pageWidth - margin, 30, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${fmtDate(cot.created_at || new Date())}`, pageWidth - margin, 35, { align: 'right' });

  // --- Client Info Section ---
  let currentY = 55;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 25, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('DATOS DEL CLIENTE', margin + 5, currentY + 7);
  
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(cot.clientes?.nombre || '—', margin + 5, currentY + 14);
  
  if (cot.clientes?.empresa) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(cot.clientes.empresa, margin + 5, currentY + 19);
  }

  // --- Description ---
  currentY += 35;
  if (cot.descripcion) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246); // blue-600
    doc.text('DESCRIPCIÓN DEL PROYECTO', margin, currentY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85); // slate-700
    const splitDesc = doc.splitTextToSize(cot.descripcion, pageWidth - margin * 2);
    doc.text(splitDesc, margin, currentY + 6);
    currentY += (splitDesc.length * 5) + 12;
  }

  // --- Table: Artículos ---
  if (cot.articulos && cot.articulos.length > 0) {
    const grouped = cot.articulos.reduce((acc, a) => {
      const cat = a.categoria || 'Artículos Varios';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(a);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([categoria, items]) => {
      if (currentY > pageHeight - 40) { doc.addPage(); currentY = 20; }
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text(categoria.toUpperCase(), margin, currentY);
      currentY += 3;

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
        headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' }, 
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          1: { halign: 'center', cellWidth: 25 },
          2: { halign: 'right', cellWidth: 30 },
          3: { halign: 'right', cellWidth: 35 }
        },
        margin: { left: margin, right: margin }
      });
      currentY = doc.lastAutoTable.finalY + 8;
    });
  }

  // --- Table: Herramientas ---
  if (cot.herramientas && cot.herramientas.length > 0) {
    const totalDias = (cot.horas || 0) / 8 + (cot.dias || 0) + (cot.semanas || 0) * 7 + (cot.meses || 0) * 30;
    
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
      headStyles: { fillColor: [217, 119, 6], fontStyle: 'bold' }, 
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- Personnel & Time ---
  if (currentY > pageHeight - 60) { doc.addPage(); currentY = 20; }

  const hasTime = (cot.horas || 0) > 0 || (cot.dias || 0) > 0 || (cot.semanas || 0) > 0 || (cot.meses || 0) > 0;
  if (hasTime || (cot.empleados && cot.empleados.length > 0)) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('TIEMPO Y PERSONAL', margin, currentY);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    
    let timeParts = [];
    if (cot.horas) timeParts.push(`${cot.horas} h`);
    if (cot.dias) timeParts.push(`${cot.dias} d`);
    if (cot.semanas) timeParts.push(`${cot.semanas} sem`);
    if (cot.meses) timeParts.push(`${cot.meses} mes`);
    
    let timeStr = timeParts.length > 0 ? `Duración estimada: ${timeParts.join(', ')}` : '';
    let empStr = cot.empleados && cot.empleados.length > 0 ? `Personal: ${cot.empleados.map(e => e.nombre).join(', ')}` : '';
    
    doc.text(timeStr, margin, currentY + 6);
    doc.text(empStr, margin, currentY + 11);
    currentY += 20;
  }

  // --- Totals Section ---
  if (currentY > pageHeight - 80) { doc.addPage(); currentY = 20; }

  const totalsWidth = 80;
  const totalsX = pageWidth - margin - totalsWidth;
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(totalsX, currentY, totalsWidth, 40, 2, 2, 'F');
  
  const subtotalArt = cot.totales?.articulos || 0;
  const totalDiasCalc = (cot.horas || 0) / 8 + (cot.dias || 0) + (cot.semanas || 0) * 7 + (cot.meses || 0) * 30;
  const subtotalHer = (cot.herramientas || []).reduce((s, h) => s + (h.precio_renta_diaria || 0) * (1 + (h.margen || 0) / 100) * h.cantidad * totalDiasCalc, 0);
  const subtotalTime = cot.totales?.tiempo || 0;

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  
  doc.text('Subtotal Artículos:', totalsX + 5, currentY + 10);
  doc.text(fmt(subtotalArt), pageWidth - margin - 5, currentY + 10, { align: 'right' });
  
  doc.text('Subtotal Herramientas:', totalsX + 5, currentY + 16);
  doc.text(fmt(subtotalHer), pageWidth - margin - 5, currentY + 16, { align: 'right' });
  
  doc.text('Mano de Obra / Tiempo:', totalsX + 5, currentY + 22);
  doc.text(fmt(subtotalTime), pageWidth - margin - 5, currentY + 22, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(totalsX + 5, currentY + 26, pageWidth - margin - 5, currentY + 26);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL:', totalsX + 5, currentY + 34);
  doc.setTextColor(59, 130, 246);
  doc.text(fmt(cot.total), pageWidth - margin - 5, currentY + 34, { align: 'right' });

  // --- Signature Line ---
  const sigY = pageHeight - 50;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, sigY, margin + 60, sigY);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Firma de Autorización', margin, sigY + 5);

  // --- Footer ---
  const footerY = pageHeight - 15;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('Esta cotización tiene una vigencia de 15 días. Precios sujetos a cambios sin previo aviso.', pageWidth / 2, footerY, { align: 'center' });
  doc.text('© ECG Corporativo - El Marqués, Querétaro.', pageWidth / 2, footerY + 3, { align: 'center' });

  // Save the PDF
  const fileName = `Cotizacion_${cot.folio || cot.id}_${cot.clientes?.nombre?.replace(/\s+/g, '_') || 'Cliente'}.pdf`;
  doc.save(fileName);
};
