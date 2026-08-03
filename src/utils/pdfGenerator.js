import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Loads an image from a URL and converts it to a Base64 data URI.
 * @param {string} url - Image URL
 * @returns {Promise<string|null>} - Base64 Data URI or null if failed
 */
const loadImage = (url) => new Promise((resolve) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = url;
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    } catch (e) {
      resolve(null);
    }
  };
  img.onerror = () => resolve(null);
});

/**
 * Generates an editable, selectable vector PDF for a quotation matching the corporate ECG style.
 * This directly downloads the PDF without opening print popups or dialogs.
 * @param {Object} cot - Quotation data
 */
export const generateCotizacionPDF = async (cot) => {
  const fmt = (n) =>
    `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fmtDate = (d) => {
    const date = d ? new Date(d) : new Date();
    const months = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    return `${date.getDate()} DE ${months[date.getMonth()]} DE ${date.getFullYear()}`;
  };

  const logoBase64 = await loadImage('/assets/logos/centro.png');

  // Create jsPDF document in letter format (portrait, mm)
  const doc = new jsPDF({
    unit: 'mm',
    format: 'letter'
  });

  const totalPages = 4; // Standard document length

  // Helper to draw headers, footers and watermark on each page
  const drawPageDecorations = (pageNumber) => {
    // Watermark
    if (logoBase64) {
      doc.saveGraphicsState();
      // Set low opacity state (GState)
      doc.setGState(new doc.GState({ opacity: 0.05 }));
      doc.addImage(logoBase64, 'PNG', (215.9 - 95) / 2, (279.4 - 95) / 2, 95, 95);
      doc.restoreGraphicsState();
    }

    // Top Header: Client Info Left
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.text((cot.clientes?.nombre || 'CLIENTE').toUpperCase(), 15, 17);
    
    if (cot.clientes?.empresa) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      doc.text(cot.clientes.empresa.toUpperCase(), 15, 21.5);
    }

    // Top Header: Date and Folio Right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const dateStr = `EL MARQUÉS, QRO A ${fmtDate(cot.created_at)}`;
    doc.text(dateStr, 200.9, 16.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(128, 0, 32); // Rojo vino (#800020)
    const folioStr = `COTIZACION ${cot.folio || cot.id || 'S/N'}`;
    doc.text(folioStr, 200.9, 21.5, { align: 'right' });

    if (cot.titulo) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(cot.titulo.toUpperCase(), 200.9, 26, { align: 'right' });
    }

    // Double divider line in Red Wine color
    doc.setDrawColor(128, 0, 32);
    doc.setLineWidth(0.4);
    doc.line(15, 29.5, 200.9, 29.5);
    doc.setLineWidth(0.15);
    doc.line(15, 30.7, 200.9, 30.7);

    // Footer divider line
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.15);
    doc.line(15, 268, 200.9, 268);

    // Footer Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text('Tel. (442) 773 4562 Y 6691732 correo: centroecging@gmail.com', 215.9 / 2, 273, { align: 'center' });
    doc.text(`Página ${pageNumber} de ${totalPages}`, 200.9, 273, { align: 'right' });
  };

  // ── PAGE 1: DETALLE DE COTIZACIÓN ──────────────────────────────────────────
  drawPageDecorations(1);

  // Intro text paragraph
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  const introText = 'Por medio de la presente reciba un cordial saludo por parte del todo el personal que colabora en esta empresa, así mismo aprovecho este medio para enviarle la cotización; la cual consta de lo siguiente:';
  doc.text(introText, 15, 36.5, { maxWidth: 185.9, align: 'justify' });

  // Build Autotable Rows
  const tableRows = [];
  const catLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let grandTotal = 0;

  // Process grouped items
  const grouped = {};
  if (cot.articulos && cot.articulos.length > 0) {
    cot.articulos.forEach((a) => {
      const cat = a.categoria || 'Artículos Varios';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(a);
    });
  }

  const hasManoObra = (cot.horas || 0) > 0 || (cot.dias || 0) > 0 ||
                      (cot.semanas || 0) > 0 || (cot.meses || 0) > 0;

  const totalDias = (cot.horas || 0) / 8 + (cot.dias || 0) +
                    (cot.semanas || 0) * 7 + (cot.meses || 0) * 30;

  Object.entries(grouped).forEach(([catName, items], catIdx) => {
    const catLetter = catLetters[catIdx] || String(catIdx + 1);
    const catLetterLow = catLetter.toLowerCase();

    // Category title row spanned
    tableRows.push([
      {
        content: catName.toUpperCase(),
        colSpan: 6,
        styles: { halign: 'center', fillColor: '#eeeeee', fontStyle: 'bold', fontSize: 8.5, textColor: 50 }
      }
    ]);

    // Sub-title row spanned
    tableRows.push([
      {
        content: `${catLetter}.  ${catName.toUpperCase()}`,
        colSpan: 6,
        styles: { fontStyle: 'bold', fontSize: 8.2, fillColor: '#ffffff', textColor: 0 }
      }
    ]);

    items.forEach((a, itemIdx) => {
      const precioFinal = a.precio * (1 + (a.margen || 0) / 100);
      const subtotal = precioFinal * a.cantidad;
      grandTotal += subtotal;
      const hasQty = subtotal > 0;

      tableRows.push([
        a.codigo ? a.codigo.toUpperCase() : `${catLetterLow}. ${itemIdx + 1}`,
        a.nombre,
        hasQty ? String(a.cantidad) : '',
        hasQty ? (a.unidad || 'pza') : '',
        hasQty ? fmt(precioFinal) : '',
        hasQty ? fmt(subtotal) : ''
      ]);
    });
  });

  // Mano de obra block
  if (hasManoObra || (cot.empleados && cot.empleados.length > 0)) {
    const moIdx = Object.keys(grouped).length;
    const moLetter = catLetters[moIdx] || 'B';
    const moLetterLow = moLetter.toLowerCase();
    const subtotalMO = cot.totales?.tiempo || 0;
    grandTotal += subtotalMO;

    tableRows.push([
      moLetter + '.',
      {
        content: 'MANO DE OBRA PARA LA REALIZACIÓN DE LOS TRABAJOS; LO QUE INCLUYE:\nsuministro de mano de obra calificada, equipo y herramienta especializada, equipo de protección, equipo de limpieza, viáticos y todo lo necesario para ejecución de los siguientes trabajos:',
        styles: { fontStyle: 'bold', textColor: 0 }
      },
      totalDias > 0 ? String(totalDias % 1 === 0 ? totalDias : totalDias.toFixed(1)) : '',
      'jgo',
      subtotalMO > 0 && totalDias > 0 ? fmt(subtotalMO / Math.max(totalDias, 1)) : '',
      subtotalMO > 0 ? fmt(subtotalMO) : ''
    ]);

    if (cot.empleados && cot.empleados.length > 0) {
      cot.empleados.forEach((e, eIdx) => {
        tableRows.push([
          `${moLetterLow}. ${eIdx + 1}`,
          e.nombre || e.puesto || '',
          '', '', '', ''
        ]);
      });
    }

    if (cot.herramientas && cot.herramientas.length > 0) {
      const nextOffset = (cot.empleados?.length || 0);
      cot.herramientas.forEach((h, hIdx) => {
        const rentaFinal = (h.precio_renta_diaria || 0) * (1 + (h.margen || 0) / 100);
        const subtotalH = rentaFinal * h.cantidad * totalDias;
        grandTotal += subtotalH;
        tableRows.push([
          `${moLetterLow}. ${nextOffset + hIdx + 1}`,
          h.nombre,
          String(h.cantidad),
          'renta',
          fmt(rentaFinal),
          fmt(subtotalH)
        ]);
      });
    }
  }

  // M² row
  const totalM2PDF = (cot.metros_cuadrados || 0) * (cot.precio_m2 || 0);
  if (totalM2PDF > 0) {
    grandTotal += totalM2PDF;
    const m2Letter = catLetters[Object.keys(grouped).length + (hasManoObra || (cot.empleados?.length > 0) ? 1 : 0)] || 'Z';
    tableRows.push([
      m2Letter + '.',
      {
        content: `TRABAJOS POR METRO CUADRADO (${(cot.metros_cuadrados || 0).toLocaleString('es-MX')} m²)`,
        styles: { fontStyle: 'bold', textColor: 0 }
      },
      String(cot.metros_cuadrados || 0),
      'm²',
      fmt(cot.precio_m2 || 0),
      fmt(totalM2PDF)
    ]);
  }

  // Grand total row
  tableRows.push([
    '',
    {
      content: 'TOTAL DE MATERIALES Y MANO DE OBRA',
      colSpan: 4,
      styles: { halign: 'right', fontStyle: 'bold', fillColor: '#fff5f5', textColor: '#800020' }
    },
    {
      content: fmt(grandTotal || cot.total || 0),
      styles: { halign: 'right', fontStyle: 'bold', fillColor: '#fff5f5', textColor: '#800020' }
    }
  ]);

  // Render Table
  autoTable(doc, {
    startY: 44,
    margin: { left: 15, right: 15 },
    head: [['ÍTEM', 'DESCRIPCIÓN', 'CANT', 'UNIDAD', 'P. UNITARIO', 'IMPORTE']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: '#800020',
      textColor: '#ffffff',
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: '#d3d3d3',
      lineWidth: 0.15,
      textColor: 50
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center', valign: 'middle' },
      1: { cellWidth: 'auto', halign: 'left', valign: 'middle' },
      2: { cellWidth: 14, halign: 'center', valign: 'middle' },
      3: { cellWidth: 16, halign: 'center', valign: 'middle' },
      4: { cellWidth: 22, halign: 'right', valign: 'middle' },
      5: { cellWidth: 22, halign: 'right', valign: 'middle' }
    }
  });

  // Reference Image (optional bottom of page 1)
  if (cot.imagen_url) {
    const finalY = doc.lastAutoTable.finalY || 100;
    if (finalY < 200) {
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text('Imagen de referencia técnica:', 215.9 / 2, finalY + 8, { align: 'center' });
      try {
        const base64Img = await loadImage(cot.imagen_url);
        if (base64Img) {
          doc.addImage(base64Img, 'JPEG', (215.9 - 60) / 2, finalY + 11, 60, 42);
        }
      } catch (e) {
        console.warn('Could not render reference image', e);
      }
    }
  }


  // ── PAGE 2: TIEMPOS DE ENTREGA Y CONDICIONES COMERCIALES ─────────────────────
  doc.addPage();
  drawPageDecorations(2);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('TIEMPOS DE ENTREGA Y CONDICIONES COMERCIALES', 215.9 / 2, 40, { align: 'center' });
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(45, 42, 170.9, 42);

  let currentY = 50;

  // Delivery Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(128, 0, 32);
  doc.text('TIEMPOS DE ENTREGA:', 15, currentY);
  doc.setLineWidth(0.15);
  doc.setDrawColor(128, 0, 32);
  doc.line(15, currentY + 1.5, 200.9, currentY + 1.5);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  
  let totalDiasStr = '';
  if ((cot.horas || 0) > 0) totalDiasStr += `${cot.horas} horas `;
  if ((cot.dias || 0) > 0) totalDiasStr += `${cot.dias} día(s) `;
  if ((cot.semanas || 0) > 0) totalDiasStr += `${cot.semanas} semana(s) `;
  if ((cot.meses || 0) > 0) totalDiasStr += `${cot.meses} mes(es) `;
  const deliveryTimeText = `Materiales, equipo e insumos: ${totalDiasStr || '10 – 15 día(s)'} hábiles, a partir del cumplimiento de las condiciones comerciales`;
  
  doc.text(`* ${deliveryTimeText}`, 17, currentY, { maxWidth: 180 });

  // Commercial Conditions Section
  currentY += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(128, 0, 32);
  doc.text('CONDICIONES COMERCIALES:', 15, currentY);
  doc.line(15, currentY + 1.5, 200.9, currentY + 1.5);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);

  const condiciones = [
    'Los precios son expresados en PESOS MEXICANOS MNX',
    'Los precios no incluyen el 16% I.V.A.',
    'Se requiere Emisión de orden de compra a favor de centro de ingeniería y abastecimiento ECG',
    '100 % del importe de materiales.',
    '50% de anticipo del importe de mano de obra y 50% restante a los 15 días de haber entregado el equipo funcionando.',
    'Vigencia de cotización: 10 días naturales.',
    'La elaboración de esta cotización se basa en la información que nos proporciona el cliente.',
    'Es obligación del cliente revisar y aprobar la presente cotización, si existiera algún faltante o diferencia de acuerdo con sus necesidades será necesaria una nueva cotización.'
  ];

  condiciones.forEach((cond) => {
    const lines = doc.splitTextToSize(`* ${cond}`, 180);
    doc.text(lines, 17, currentY);
    currentY += (lines.length * 4) + 1.5;
  });

  // Warranties Section
  currentY += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(128, 0, 32);
  doc.text('GARANTÍAS:', 15, currentY);
  doc.line(15, currentY + 1.5, 200.9, currentY + 1.5);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('* 1 AÑO DE GARANTÍA EN EQUIPO Y MATERIALES', 17, currentY);

  // Atentamente Section
  currentY += 12;
  const closingText = 'Sin más por el momento y en espera de poder ser parte de su éxito, quedamos a sus más apreciables órdenes.';
  const closingLines = doc.splitTextToSize(closingText, 185.9);
  doc.text(closingLines, 15, currentY, { align: 'justify' });

  currentY += (closingLines.length * 4) + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('ATENTAMENTE', 215.9 / 2, currentY, { align: 'center' });

  currentY += 18;
  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 0, 0);
  doc.line((215.9 - 70) / 2, currentY, (215.9 + 70) / 2, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(128, 0, 32);
  doc.text('ING. JUAN ERASMO CUAYA GRANADOS', 215.9 / 2, currentY, { align: 'center' });

  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('CED. PROF. 8101909', 215.9 / 2, currentY, { align: 'center' });

  currentY += 3.5;
  doc.text('REPSE 576749', 215.9 / 2, currentY, { align: 'center' });

  currentY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(128, 0, 32);
  doc.text('NUESTRO ÉXITO DEPENDE DEL ÉXITO DE NUESTROS CLIENTES', 215.9 / 2, currentY, { align: 'center' });


  // ── PAGE 3: TÉRMINOS DE VENTA (PARTE 1) ──────────────────────────────────────
  doc.addPage();
  drawPageDecorations(3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('TÉRMINOS DE VENTA CENTRO DE INGENIERÍA Y ABASTECIMIENTO ECG SA DE CV', 215.9 / 2, 40, { align: 'center' });
  doc.setLineWidth(0.3);
  doc.line(15, 42.5, 200.9, 42.5);

  currentY = 49;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(60, 60, 60);

  const termsList = [
    {
      bold: 'GENERAL. ',
      text: 'Estos términos y condiciones de venta (junto con cualquier cotización o especificación por escrito del Vendedor directamente asociada) gobernará exclusivamente la venta o licencia otorgada por el Vendedor de todos los productos y servicios (incluyendo sin limitación, productos para equipamiento, software y programas, capacitación, programación, mantenimiento, ingeniería, repuestos y servicios de reparación colectivamente los "Productos") otorgados bajo la presente. Ninguna adición o modificación a estos términos y condiciones será obligatoria para centro de ingeniería y abastecimiento e. (denominado en lo sucesivo como "CENTRO ECG") a menos que haya indicado su acuerdo por escrito firmado por su representante autorizado. El Vendedor no reconoce otro u otros términos y condiciones que puedan ser opuestos por el cliente que no sean de otra manera consistente con estos u otros términos y condiciones fijados en la cotización, especificación o aceptación del pedido del Vendedor.'
    },
    {
      bold: 'TÉRMINOS DE PAGO. ',
      text: 'Salvo que se disponga algo diferente por escrito por el Vendedor en una Cotización o en relación a una aceptación del Pedido, los términos de pago son 50% ANTICIPO desde la fecha de la factura con crédito continuo (PREVIA A PROBACIÓN DE CENTRO ECG) aprobado según lo determine CENTRO ECG, anticipadamente y/o contra la entrega del material en los casos en que no se tenga crédito. La liquidación de las facturas de venta se hará en la misma moneda en que se haya acordado la misma y que se haya aceptado el pedido el vendedor. En caso de pago de facturas en moneda nacional que hayan sido realizadas en otra moneda, el tipo de cambio a considerar será el libre bancario vigente a la fecha de pago y CENTRO ECG se reserva el derecho a determinar la institución que lo fije. CENTRO ECG se reserva el derecho de suspender cualquier cumplimiento adicional bajo este contrato o de cualquier otra obligación para con el cliente en el caso de que el pago no sea realizado a término. No se permite ningún pago por compensación o penalización a menos que haya sido aprobado por CENTRO ECG.'
    },
    {
      bold: 'TÉRMINOS DE ENTREGA. ',
      text: 'Los términos de entrega son LAB en el almacén del cliente siempre y cuando se encuentre dentro del estado de Querétaro. En lo que respecta a los costos de envío, riesgo de pérdida y transferencia del título, excepto el título a todos los derechos a la propiedad intelectual asociados con los Productos, (por ejemplo, programas) siguen siendo determinados por CENTRO ECG (o sus proveedores y licenciantes), y dichos Productos son puestos a disposición o bajo licencia para ser usados por el cliente según este contrato u otro contrato de licencia del Vendedor o sus proveedores.'
    },
    {
      bold: 'GARANTÍAS. ',
      text: ''
    },
    {
      bold: 'A. EQUIPO: ',
      text: 'Salvo que se disponga algo diferente por escrito por el Vendedor en una Cotización o en la aceptación del Pedido, CENTRO ECG como intermediario, tramitará la garantía correspondiente de acuerdo con las condiciones otorgadas por el fabricante del equipo al asegurar que los Productos o Equipos entregados bajo la presente serán de calidad comercializable, libre de defectos de material, mano de obra o diseño. Igualmente se tramitará, los Productos o Equipos reparados o cambiados bajo la garantía.'
    },
    {
      bold: 'B. PROGRAMAS: ',
      text: 'A menos que se haya indicado lo contrario en el contrato de licencia del Vendedor o de terceros, el Vendedor garantiza por el período marcado por el Fabricante, que los Productos estándar de programas entregados bajo el presente, cuando se les usa con el equipo especificado por el Vendedor, funcionarán de acuerdo con las especificaciones publicadas, preparadas, aprobadas y emitidas por el Fabricante. El Vendedor no hace representación alguna o garantía, expresa o implícitamente, que el funcionamiento de los Productos de programas será ininterrumpido o sin errores, o que las funciones contenidas en el mismo cumplirán a satisfacción el uso o los requisitos especificados por el Cliente.'
    },
    {
      bold: 'C. REPARACIÓN EN FABRICA Y CAMBIO: ',
      text: 'El Vendedor garantiza que los Productos de equipamiento cobrables o fuera de garantía cambiados o reparados en fábrica por el fabricante y provistos bajo la presente estarán libres de defectos de material y mano de obra. Los Productos entregados como cambio pueden ser nuevos o reacondicionados.'
    },
    {
      bold: 'D. SERVICIO: ',
      text: 'El Vendedor garantiza que los Productos compuesto de servicios, incluyendo los servicios de programación de ingeniería y programas especiales, ya sean provistos a costo fijo o sobre la base de tiempo y materiales, serán provistos de acuerdo con las prácticas de la industria generalmente aceptadas, en la medida que dichos servicios estén sujetos a un criterio de aceptación por escrito que el Vendedor ha aceptado con anticipación. Se renuncia a todas las otras garantías relacionadas con los servicios provistos.'
    },
    {
      bold: 'E. ESPECIFICACIONES DEL CLIENTE: ',
      text: 'El Vendedor no garantiza y no será responsable por el diseño, materiales o criterio de construcción entregado o especificado por el Cliente e incorporado en los Productos o para Productos fabricados por o comprados de otros fabricantes o vendedores especificados por el Cliente. Cualquier garantía aplicable a dichos Productos especificados por el Cliente se limitará solamente a la garantía, si la hubiera, extendida por el fabricante o vendedor original que no sea el Vendedor en la medida permitida en dicha garantía.'
    }
  ];

  termsList.forEach((term) => {
    doc.setFont('helvetica', 'bold');
    doc.text(term.bold, 15, currentY);
    const startX = 15 + doc.getTextWidth(term.bold);
    
    doc.setFont('helvetica', 'normal');
    
    if (term.text) {
      // Draw first inline snippet of the text
      const inlineSpace = 185.9 - (startX - 15);
      const words = term.text.split(' ');
      let inlineText = '';
      let wordIdx = 0;
      
      while (wordIdx < words.length) {
        const testText = inlineText + (inlineText ? ' ' : '') + words[wordIdx];
        if (doc.getTextWidth(testText) > inlineSpace) break;
        inlineText = testText;
        wordIdx++;
      }
      
      doc.text(inlineText, startX, currentY);
      currentY += 4;
      
      // Draw remaining text wrapped under left margin 15
      const remainingText = words.slice(wordIdx).join(' ');
      if (remainingText) {
        const wrappedLines = doc.splitTextToSize(remainingText, 185.9);
        doc.text(wrappedLines, 15, currentY, { align: 'justify' });
        currentY += (wrappedLines.length * 4);
      }
    }
    currentY += 1.5;
  });


  // ── PAGE 4: TÉRMINOS DE VENTA CONTINUED / POLÍTICAS ──────────────────────────
  doc.addPage();
  drawPageDecorations(4);

  currentY = 38;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(60, 60, 60);

  const terms2List = [
    {
      bold: 'H. LAS GARANTÍAS ANTERIORES SE OFRECEN EN LUGAR DE TODAS LAS OTRAS GARANTÍAS, YA SEAN EXPRESAS, IMPLÍCITAS O ESTATUTARIAS, INCLUYENDO GARANTÍAS IMPLÍCITAS DE COMERCIABILIDAD O APTITUD PARA UN USO PARTICULAR, O GARANTÍAS DE RENDIMIENTO O APLICACIÓN, Y SE EXTIENDE SOLAMENTE A CLIENTES QUE COMPRAN DEL VENDEDOR O SU DISTRIBUIDOR AUTORIZADO.',
      text: ''
    },
    {
      bold: 'LÍMITE DE LA RESPONSABILIDAD. ',
      text: 'EN NINGÚN CASO SERÁ EL VENDEDOR RESPONSABLE POR DAÑOS INCIDENTALES, INDIRECTOS O CONSECUENTES DE NINGÚN TIPO. LA RESPONSABILIDAD ACUMULATIVA MÁXIMA DEL VENDEDOR EN RELACIÓN CON TODOS LOS OTROS RECLAMOS Y RESPONSABILIDADES, INCLUYENDO LA RESPONSABILIDAD CON RESPECTO A DAÑOS Y OBLIGACIONES DIRECTAS BAJO CUALQUIER TEORÍA LEGAL O EQUITATIVA, SE ASEGURARÁ O NO, NO EXCEDERÁ EL COSTO DE LOS PRODUCTOS QUE DAN ORIGEN AL RECLAMO O RESPONSABILIDAD. CUALQUIER ACCIÓN EN CONTRA DEL VENDEDOR DEBE SER PRESENTADA DENTRO DE LOS DIECIOCHO (18) MESES DESPUÉS DE QUE OCURRA LA CAUSA DE LA ACCIÓN. ESTAS RENUNCIAS Y LIMITACIONES DE RESPONSABILIDAD SE APLICARÁN SOBRE CUALQUIER OTRA DISPOSICIÓN EN CONTRARIO INCLUIDAS EN ESTE CONTRATO Y SIN CUIDADO DE LA FORMA DE ACCIÓN, YA SEA CONTRACTUAL, POR DISPOSICIÓN DE LEY O DE CUALQUIER OTRA MANERA, Y SE EXTENDERÁ ADEMÁS PARA EL BENEFICIO DE LOS PROVEEDORES DEL VENDEDOR, DISTRIBUIDORES Y OTROS REVENDEDORES AUTORIZADOS COMO TERCEROS BENEFICIARIOS.'
    },
    {
      bold: 'PROGRAMAS BAJO LICENCIA. ',
      text: 'Los Productos compuestos por programas pueden estar sujetos a términos y condiciones adicionales indicadas en los contratos de licencia del Vendedor separados que controlarán en la medida necesaria la resolución de cualquier conflicto con los términos y condiciones indicados en el presente.'
    },
    {
      bold: 'COTIZACIONES. ',
      text: 'Las cotizaciones por escrito son válidas durante 15 días desde la fecha de emisión a menos que se indique lo contrario con excepción de las expresadas en dólares ya que tienen vigencia de 24 horas y si el tipo de cambio sufre una variación mayor al 2%, pierde su validez. Existencias especificadas en las mismas están sujetas a previo venta. Todos los errores especialmente los tipográficos están sujetos a corrección.'
    },
    {
      bold: 'PRECIOS. ',
      text: 'Los precios y cualquier otra información indicada en cualquier publicación del Vendedor están sujetos a cambio sin notificación y serán confirmados por cotización específica. Será a cargo del cliente el Impuesto al Valor Agregado o cualquier otro impuesto similar.'
    },
    {
      bold: 'CAMBIOS. ',
      text: 'Los cambios en el pedido solicitados por el cliente, incluyendo los que afecten la identidad, alcance y entrega de los Productos deben de constar por escrito, están sujetos a la Política de Cambios y Devoluciones vigente para el cliente y están también a la aprobación previa del Vendedor, a los ajustes en los precios, programación y otros términos y condiciones que se afecten.'
    },
    {
      bold: 'DEVOLUCIONES. ',
      text: 'Todas las devoluciones de Productos estarán sujetas a la aprobación previa del Vendedor y a la Política de Cambios y Devoluciones del mismo. Las devoluciones de productos no garantizados sin usar y vendibles a cambio de crédito estarán sujetas a las políticas de devoluciones del Vendedor en efecto en dicho momento, incluyendo los cargos correspondientes de re almacenaje de dicha mercancía y otras condiciones de devolución.'
    }
  ];

  terms2List.forEach((term) => {
    doc.setFont('helvetica', 'bold');
    
    // For item H., draw completely bolded without standard split
    if (term.bold.startsWith('H. ')) {
      const wrappedBold = doc.splitTextToSize(term.bold, 185.9);
      doc.text(wrappedBold, 15, currentY, { align: 'justify' });
      currentY += (wrappedBold.length * 4) + 1.5;
      return;
    }

    doc.text(term.bold, 15, currentY);
    const startX = 15 + doc.getTextWidth(term.bold);
    
    doc.setFont('helvetica', 'normal');
    
    if (term.text) {
      const inlineSpace = 185.9 - (startX - 15);
      const words = term.text.split(' ');
      let inlineText = '';
      let wordIdx = 0;
      
      while (wordIdx < words.length) {
        const testText = inlineText + (inlineText ? ' ' : '') + words[wordIdx];
        if (doc.getTextWidth(testText) > inlineSpace) break;
        inlineText = testText;
        wordIdx++;
      }
      
      doc.text(inlineText, startX, currentY);
      currentY += 4;
      
      const remainingText = words.slice(wordIdx).join(' ');
      if (remainingText) {
        const wrappedLines = doc.splitTextToSize(remainingText, 185.9);
        doc.text(wrappedLines, 15, currentY, { align: 'justify' });
        currentY += (wrappedLines.length * 4);
      }
    }
    currentY += 1.5;
  });

  // Policies Section
  currentY += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(128, 0, 32);
  doc.text('POLÍTICA DE CAMBIOS Y DEVOLUCIONES', 15, currentY);
  doc.setLineWidth(0.15);
  doc.setDrawColor(128, 0, 32);
  doc.line(15, currentY + 1.5, 200.9, currentY + 1.5);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(60, 60, 60);

  const politicas = [
    'Toda devolución o cambio deberá notificarse al Vendedor en un plazo no mayor de 10 días después de la entrega del mismo.',
    'Todas las devoluciones autorizadas generarán la Nota de Crédito correspondiente después de su recepción y aprobación de la inspección en el Almacén.',
    'Se aplicará un cargo especificado por el Vendedor del valor del producto devuelto, cuando la causa de la devolución no sea imputable a CENTRO ECG y sea por solicitud del cliente.',
    'No procederá la devolución por causas no imputables a CENTRO ECG, de productos cuando estos corresponden a:',
    'Productos de clasificación "C" y "Z" (Productos de poco movimiento para CENTRO ECG o especiales).',
    'Productos Obsoletos.',
    'Productos cuya aprobación signifique a ECG INGENIERIA Y MANTENIMIENTO el tener más de 6 meses de inventario.'
  ];

  politicas.forEach((pol) => {
    const isSubBullet = pol.startsWith('Productos ');
    const bulletPrefix = isSubBullet ? '  - ' : '* ';
    const wrappedPol = doc.splitTextToSize(bulletPrefix + pol, 180);
    doc.text(wrappedPol, 17, currentY);
    currentY += (wrappedPol.length * 4) + 0.5;
  });


  // ── SAVE AND DOWNLOAD DIRECTLY ─────────────────────────────────────────────
  const clientName = (cot.clientes?.nombre || 'Cliente').replace(/\s+/g, '_');
  const fileName = `Cotizacion_${cot.folio || cot.id || 'SN'}_${clientName}.pdf`;
  doc.save(fileName);
};
