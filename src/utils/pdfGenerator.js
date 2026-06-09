import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a PDF for a quotation matching the corporate ECG style.
 * @param {Object} cot - Quotation data
 */
export const generateCotizacionPDF = async (cot) => {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageWidth  = doc.internal.pageSize.getWidth();   // 215.9 mm
  const pageHeight = doc.internal.pageSize.getHeight();  // 279.4 mm
  const marginL = 16;
  const marginR = 16;
  const contentWidth = pageWidth - marginL - marginR;

  // ── Colors ──────────────────────────────────────────────────────────────────
  const red       = [204, 0, 0];
  const black     = [0, 0, 0];
  const darkGray  = [50, 50, 50];
  const midGray   = [120, 120, 120];
  const lightGray = [210, 210, 210];
  const white     = [255, 255, 255];

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const fmt = (n) =>
    `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fmtDate = (d) => {
    const date = d ? new Date(d) : new Date();
    const months = [
      'ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
      'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'
    ];
    return `${date.getDate()} DE ${months[date.getMonth()]} DE ${date.getFullYear()}`;
  };

  const loadImage = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });

  // ── Load assets ─────────────────────────────────────────────────────────────
  const logo = await loadImage('/assets/logos/centro.png');

  // ============================================================
  //  HELPER: draw logo watermark centered on current page
  // ============================================================
  const drawWatermark = () => {
    if (!logo) return;
    // Logo watermark: centered, large, very low opacity
    const wmW = 130; // mm wide
    const wmH = 130; // mm tall (adjust if logo is not square)
    const wmX = (pageWidth  - wmW) / 2;
    const wmY = (pageHeight - wmH) / 2;
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.08 }));
    doc.addImage(logo, 'PNG', wmX, wmY, wmW, wmH);
    doc.restoreGraphicsState();
  };

  // ============================================================
  //  HELPER: draw header (used on every page)
  // ============================================================
  const drawHeader = () => {
    const hL = marginL;
    const hR = pageWidth / 2 + 2;
    const lineH = 5;
    let y = 14;

    // Left col – client info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text((cot.clientes?.nombre || '').toUpperCase(), hL, y);
    y += lineH;

    if (cot.clientes?.cargo) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...darkGray);
      doc.text(cot.clientes.cargo.toUpperCase(), hL, y);
      y += lineH;
    }

    if (cot.clientes?.empresa) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...black);
      doc.text(cot.clientes.empresa.toUpperCase(), hL, y);
      y += lineH;
    }

    // Right col – location, date, quotation title & description
    const rAlign = { align: 'right' };
    const rX = pageWidth - marginR;
    let ry = 14;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...black);
    const fecha = fmtDate(cot.created_at);
    doc.text(`EL MARQUÉS, QRO A ${fecha}`, rX, ry, rAlign);
    ry += lineH;

    // Quotation number & title in red bold
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...red);
    const folio = cot.folio || cot.id || 'S/N';
    const titleLine = `COTIZACION ${folio} ${(cot.titulo || '').toUpperCase()}`;
    const splitTitle = doc.splitTextToSize(titleLine, contentWidth / 2);
    splitTitle.forEach((line) => {
      doc.text(line, rX, ry, rAlign);
      ry += lineH;
    });

    // Subtitle / description in normal black
    if (cot.descripcion) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkGray);
      doc.setFontSize(8);
      const splitDesc = doc.splitTextToSize(cot.descripcion, contentWidth / 2);
      splitDesc.forEach((line) => {
        doc.text(line, rX, ry, rAlign);
        ry += 4.5;
      });
    }

    // Horizontal rule
    const ruleY = Math.max(y, ry) + 2;
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.5);
    doc.line(marginL, ruleY, pageWidth - marginR, ruleY);

    return ruleY + 4; // next Y position after header
  };

  // ============================================================
  //  HELPER: draw footer
  // ============================================================
  const drawFooter = () => {
    const fy = pageHeight - 10;
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.3);
    doc.line(marginL, fy - 3, pageWidth - marginR, fy - 3);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...midGray);
    doc.text(
      'Tel. (442) 773 4562 Y 6691732 correo: centroecging@gmail.com',
      pageWidth / 2, fy + 1, { align: 'center' }
    );
  };

  // ============================================================
  //  PAGE 1 — Quotation Table
  // ============================================================
  drawWatermark();
  let currentY = drawHeader();

  // Intro paragraph
  const introPara =
    'Por medio de la presente reciba un cordial saludo por parte del todo el personal que colabora en esta empresa, así mismo aprovecho este medio para enviarle la cotización; la cual consta de lo siguiente';
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  const splitIntro = doc.splitTextToSize(introPara, contentWidth);
  doc.text(splitIntro, marginL, currentY);
  currentY += splitIntro.length * 5 + 4;

  // ── Build table rows ───────────────────────────────────────────────────────
  // We build a flat list with category rows and item rows, numbered A, B, C…
  // and sub-items a.1, a.2 / b.1, b.2…

  const tableBody = [];
  const catLetters  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Totals we need
  let grandTotal = 0;

  // Process articulos grouped by categoria
  const grouped = {};
  if (cot.articulos && cot.articulos.length > 0) {
    cot.articulos.forEach((a) => {
      const cat = a.categoria || 'Artículos Varios';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(a);
    });
  }

  // Labour / mano de obra as its own category if defined
  const hasManoObra = (cot.horas || 0) > 0 || (cot.dias || 0) > 0 ||
                      (cot.semanas || 0) > 0 || (cot.meses || 0) > 0;

  Object.entries(grouped).forEach(([catName, items], catIdx) => {
    const catLetter = catLetters[catIdx] || String(catIdx + 1);
    const catLetterLow = catLetter.toLowerCase();

    // Category header row (merged-style, centered grey)
    tableBody.push({
      type: 'category',
      label: catName.toUpperCase(),
    });

    // Sub-letter row for the category label
    tableBody.push({
      type: 'catLetter',
      letter: catLetter + '.',
      label: catName.toUpperCase(),
    });

    items.forEach((a, itemIdx) => {
      const precioFinal = a.precio * (1 + (a.margen || 0) / 100);
      const subtotal    = precioFinal * a.cantidad;
      grandTotal += subtotal;
      const hasQty = subtotal > 0;

      tableBody.push({
        type: 'item',
        item: `${catLetterLow}. ${itemIdx + 1}`,
        desc: a.nombre + (a.codigo ? ` [${a.codigo}]` : ''),
        cant: hasQty ? String(a.cantidad) : '',
        unidad: hasQty ? (a.unidad || 'pza') : '',
        costoUnit: hasQty ? fmt(precioFinal) : '',
        importe: hasQty ? fmt(subtotal) : '',
      });
    });
  });

  // Mano de obra block
  if (hasManoObra || (cot.empleados && cot.empleados.length > 0)) {
    const moIdx = Object.keys(grouped).length;
    const moLetter = catLetters[moIdx] || 'B';
    const moLetterLow = moLetter.toLowerCase();
    const totalDias = (cot.horas || 0) / 8 + (cot.dias || 0) +
                      (cot.semanas || 0) * 7 + (cot.meses || 0) * 30;
    const subtotalMO = cot.totales?.tiempo || 0;
    grandTotal += subtotalMO;

    tableBody.push({
      type: 'catLetter',
      letter: moLetter + '.',
      label: 'MANO DE OBRA PARA LA REALIZACIÓN DE LOS TRABAJOS; LO QUE INCLUYE:',
      desc: 'suministro de mano de obra calificada, equipo y herramienta especializada, equipo de protección, equipo de limpieza, viáticos y todo lo necesario para ejecución de los siguientes trabajos:',
      cant: totalDias > 0 ? String(totalDias % 1 === 0 ? totalDias : totalDias.toFixed(1)) : '',
      unidad: 'jgo',
      costoUnit: subtotalMO > 0 && totalDias > 0 ? fmt(subtotalMO / Math.max(totalDias, 1)) : '',
      importe: subtotalMO > 0 ? fmt(subtotalMO) : '',
    });

    if (cot.empleados && cot.empleados.length > 0) {
      cot.empleados.forEach((e, eIdx) => {
        tableBody.push({
          type: 'item',
          item: `${moLetterLow}. ${eIdx + 1}`,
          desc: e.nombre || e.puesto || '',
          cant: '', unidad: '', costoUnit: '', importe: '',
        });
      });
    }

    // Tools as sub-items
    if (cot.herramientas && cot.herramientas.length > 0) {
      const nextOffset = (cot.empleados?.length || 0);
      cot.herramientas.forEach((h, hIdx) => {
        const rentaFinal = (h.precio_renta_diaria || 0) * (1 + (h.margen || 0) / 100);
        const subtotalH  = rentaFinal * h.cantidad * totalDias;
        grandTotal += subtotalH;
        tableBody.push({
          type: 'item',
          item: `${moLetterLow}. ${nextOffset + hIdx + 1}`,
          desc: h.nombre,
          cant: String(h.cantidad),
          unidad: 'renta',
          costoUnit: fmt(rentaFinal),
          importe: fmt(subtotalH),
        });
      });
    }
  }

  // ── Render main table ──────────────────────────────────────────────────────
  // Convert our logical rows into autoTable body
  const atHead = [['ÍTEM', 'DESCRIPCIÓN', 'CANT', 'UNIDAD', 'COSTO UNITARIO', 'IMPORTE']];
  const atBody = [];
  const rowMeta = []; // track row type for didParseCell

  tableBody.forEach((row) => {
    if (row.type === 'category') {
      atBody.push(['', row.label, '', '', 'INSTALACIÓN DE ' + row.label, '']);
      rowMeta.push('category');
    } else if (row.type === 'catLetter') {
      atBody.push([
        row.letter,
        (row.label || '') + (row.desc ? '\n' + row.desc : ''),
        row.cant || '',
        row.unidad || '',
        row.costoUnit || '',
        row.importe || '',
      ]);
      rowMeta.push('catLetter');
    } else {
      atBody.push([row.item, row.desc, row.cant, row.unidad, row.costoUnit, row.importe]);
      rowMeta.push('item');
    }
  });

  // Total row
  atBody.push(['', 'TOTAL, DE MAT Y MO', '', '', '', fmt(grandTotal || cot.total || 0)]);
  rowMeta.push('total');

  autoTable(doc, {
    startY: currentY,
    head: atHead,
    body: atBody,
    theme: 'grid',
    headStyles: {
      fillColor: red,
      textColor: white,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
      textColor: black,
      lineColor: lightGray,
      lineWidth: 0.3,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 14,  halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 14,  halign: 'center' },
      3: { cellWidth: 18,  halign: 'center' },
      4: { cellWidth: 28,  halign: 'right' },
      5: { cellWidth: 28,  halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: marginL, right: marginR },
    didParseCell: (data) => {
      const ri = data.row.index;
      const meta = rowMeta[ri];
      if (meta === 'category') {
        // Merge-style: center all cells, gray background
        data.cell.styles.fillColor = [230, 230, 230];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = 'center';
        data.cell.styles.fontSize = 7.5;
      } else if (meta === 'catLetter') {
        data.cell.styles.fontStyle = 'bold';
      } else if (meta === 'total') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [255, 245, 245];
        if (data.column.index === 1) {
          data.cell.styles.textColor = red;
          data.cell.styles.halign = 'right';
        }
        if (data.column.index === 5) {
          data.cell.styles.textColor = red;
        }
      }
    },
    // Draw watermark & footer on each new page created by table overflow
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawWatermark();
        drawHeader();
      }
      drawFooter();
    },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // ── Optional product image ─────────────────────────────────────────────────
  if (cot.imagen_url) {
    const prodImg = await loadImage(cot.imagen_url);
    if (prodImg) {
      const imgW = 70;
      const imgH = 50;
      const imgX = (pageWidth - imgW) / 2;
      if (currentY + imgH > pageHeight - 20) {
        doc.addPage();
        drawWatermark();
        drawHeader();
        currentY = 46;
      }
      doc.addImage(prodImg, 'JPEG', imgX, currentY, imgW, imgH);
      currentY += imgH + 6;
    }
  }

  drawFooter();

  // ============================================================
  //  PAGE 2 — Tiempos de Entrega y Condiciones Comerciales
  // ============================================================
  doc.addPage();
  drawWatermark();
  const p2StartY = drawHeader();

  // Big title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text('TIEMPOS DE ENTREGA Y CONDICIONES COMERCIALES', pageWidth / 2, p2StartY + 10, { align: 'center' });

  // Underline title
  const titleText = 'TIEMPOS DE ENTREGA Y CONDICIONES COMERCIALES';
  const titleW = doc.getTextWidth(titleText);
  doc.setDrawColor(...black);
  doc.setLineWidth(0.5);
  doc.line((pageWidth - titleW) / 2, p2StartY + 12, (pageWidth + titleW) / 2, p2StartY + 12);

  let p2Y = p2StartY + 22;

  const drawSection = (title, items) => {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...red);
    doc.text(title + ':', marginL, p2Y);
    p2Y += 6;

    items.forEach((item) => {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkGray);
      // Bullet circle
      doc.setDrawColor(...midGray);
      doc.setLineWidth(0.4);
      doc.circle(marginL + 3, p2Y - 1.5, 1.5, 'S');
      const splitItem = doc.splitTextToSize(item, contentWidth - 10);
      doc.text(splitItem, marginL + 8, p2Y);
      p2Y += splitItem.length * 4.8 + 1;
    });
    p2Y += 4;
  };

  // Tiempos de entrega
  const tiemposItems = [];
  let totalDiasStr = '';
  if ((cot.horas || 0) > 0)   totalDiasStr += `${cot.horas} horas `;
  if ((cot.dias || 0) > 0)    totalDiasStr += `${cot.dias} día(s) `;
  if ((cot.semanas || 0) > 0) totalDiasStr += `${cot.semanas} semana(s) `;
  if ((cot.meses || 0) > 0)   totalDiasStr += `${cot.meses} mes(es) `;

  tiemposItems.push(
    `Materiales, equipo e insumos: ${totalDiasStr || '10 – 15 día(s)'} hábiles, a partir del cumplimiento de las condiciones comerciales`
  );
  drawSection('TIEMPOS DE ENTREGA', tiemposItems);

  drawSection('CONDICIONES COMERCIALES', [
    'Los precios son expresados en PESOS MEXICANOS MNX',
    'Los precios no incluyen el 16% I.V.A.',
    'Se requiere Emisión de orden de compra a favor de centro de ingeniería y abastecimiento ECG',
    '100 % del importe de materiales.',
    '50% de anticipo del importe de mano de obra y 50% restante a los 15 días de haber entregado el equipo funcionando.',
    'Vigencia de cotización: 10 días naturales.',
    'La elaboración de esta cotización se basa en la información que nos proporciona el cliente.',
    'Es obligación del cliente revisar y aprobar la presente cotización, si existiera algún faltante o diferencia de acuerdo con sus necesidades será necesaria una nueva cotización.',
  ]);

  drawSection('GARANTÍAS', [
    '1 AÑO DE GARANTÍA EN EQUIPO Y MATERIALES',
  ]);

  // Closing text
  p2Y += 4;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text(
    'Sin más por el momento y en espera de poder ser parte de su éxito, quedamos a sus más apreciables órdenes.',
    marginL, p2Y
  );
  p2Y += 14;

  // "Atentamente"
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text('ATENTAMENTE', pageWidth / 2, p2Y, { align: 'center' });
  p2Y += 16;

  // Signature line
  const sigLineW = 70;
  const sigLineX = (pageWidth - sigLineW) / 2;
  doc.setDrawColor(...black);
  doc.setLineWidth(0.5);
  doc.line(sigLineX, p2Y, sigLineX + sigLineW, p2Y);
  p2Y += 6;

  // Engineer name
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...red);
  doc.text('ING, JUAN ERASMO CUAYA GRANADOS', pageWidth / 2, p2Y, { align: 'center' });
  p2Y += 5;
  doc.setTextColor(...black);
  doc.text('CED. PROF. 8101909', pageWidth / 2, p2Y, { align: 'center' });
  p2Y += 5;
  doc.text('REPSE  576749', pageWidth / 2, p2Y, { align: 'center' });
  p2Y += 6;
  doc.setTextColor(...red);
  doc.text('NUESTRO ÉXITO DEPENDE DEL ÉXITO DE NUESTROS CLIENTES', pageWidth / 2, p2Y, { align: 'center' });

  drawFooter();

  // ============================================================
  //  PAGE 3 — Términos de Venta
  // ============================================================
  doc.addPage();
  drawWatermark();
  const p3StartY = drawHeader();
  let p3Y = p3StartY + 4;

  // Big title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  const termsTitle = 'TÉRMINOS DE VENTA CENTRO DE INGENIERIA Y ABASTECIMIENTO ECG SA DE CV';
  const splitTermsTitle = doc.splitTextToSize(termsTitle, contentWidth);
  doc.text(splitTermsTitle, pageWidth / 2, p3Y, { align: 'center' });
  p3Y += splitTermsTitle.length * 6 + 2;

  // Underline
  doc.setDrawColor(...black);
  doc.setLineWidth(0.5);
  doc.line(marginL, p3Y, pageWidth - marginR, p3Y);
  p3Y += 5;

  const termsContent = [
    { bold: 'GENERAL. ', text: 'Estos términos y condiciones de venta (junto con cualquier cotización o especificación por escrito del Vendedor directamente asociada) gobernará exclusivamente la venta o licencia otorgada por el Vendedor de todos los productos y servicios (incluyendo sin limitación, productos para equipamiento, software y programas, capacitación, programación, mantenimiento, ingeniería, repuestos y servicios de reparación colectivamente los "Productos") otorgados bajo la presente. Ninguna adición o modificación a estos términos y condiciones será obligatoria para centro de ingeniería y abastecimiento e. (denominado en lo sucesivo como "CENTRO ECG") a menos que haya indicado su acuerdo por escrito firmado por su representante autorizado. El Vendedor no reconoce otro u otros términos y condiciones que puedan ser opuestos por el cliente que no sean de otra manera consistente con estos u otros términos y condiciones fijados en la cotización, especificación o aceptación del pedido del Vendedor.' },
    { bold: 'TÉRMINOS DE PAGO. ', text: 'Salvo que se disponga algo diferente por escrito por el Vendedor en una Cotización o en relación a una aceptación del Pedido, los términos de pago son 50% ANTICIPO desde la fecha de la factura con crédito continuo (PREVIA A PROBACIÓN DE CENTRO ECG) aprobado según lo determine CENTRO ECG, anticipadamente y/o contra la entrega del material en los casos en que no se tenga crédito. La liquidación de las facturas de venta se hará en la misma moneda en que se haya acordado la misma y que se haya aceptado el pedido el vendedor. En caso de pago de facturas en moneda nacional que hayan sido realizadas en otra moneda, el tipo de cambio a considerar será el libre bancario vigente a la fecha de pago y CENTRO ECG se reserva el derecho a determinar la institución que lo fije.' },
    { bold: 'CENTRO ECG ', text: 'se reserva el derecho de suspender cualquier cumplimiento adicional bajo este contrato o de cualquier otra obligación para con el cliente en el caso de que el pago no sea realizado a término. No se permite ningún pago por compensación o penalización a menos que haya sido aprobado por CENTRO ECG.' },
    { bold: 'TÉRMINOS DE ENTREGA. ', text: 'Los términos de entrega son LAB en el almacén del cliente siempre y cuando se encuentre dentro del estado de Querétaro. En lo que respecta a los costos de envío, riesgo de pérdida y transferencia del título, excepto el título a todos los derechos a la propiedad intelectual asociados con los Productos, (por ejemplo, programas) siguen siendo determinados por CENTRO ECG (o sus proveedores y licenciantes), y dichos Productos son puestos a disposición o bajo licencia para ser usados por el cliente según este contrato u otro contrato de licencia del Vendedor o sus proveedores.' },
    { bold: 'GARANTÍAS. ', text: '' },
    { bold: 'A. EQUIPO: ', text: 'Salvo que se disponga algo diferente por escrito por el Vendedor en una Cotización o en la aceptación del Pedido, CENTRO ECG como intermediario, tramitará la garantía correspondiente de acuerdo con las condiciones otorgadas por el fabricante del equipo al asegurar que los Productos o Equipos entregados bajo la presente serán de calidad comercializable, libre de defectos de material, mano de obra o diseño. Igualmente se tramitará, los Productos o Equipos reparados o cambiados bajo la garantía.' },
    { bold: 'B. PROGRAMAS: ', text: 'A menos que se haya indicado lo contrario en el contrato de licencia del Vendedor o de terceros, el Vendedor garantiza por el período marcado por el Fabricante, que los Productos estándar de programas entregados bajo el presente, cuando se les usa con el equipo especificado por el Vendedor, funcionarán de acuerdo con las especificaciones publicadas, preparadas, aprobadas y emitidas por el Fabricante. El Vendedor no hace representación alguna o garantía, expresa o implícitamente, que el funcionamiento de los Productos de programas será ininterrumpido o sin errores, o que las funciones contenidas en el mismo cumplirán a satisfacción el uso o los requisitos especificados por el Cliente.' },
    { bold: 'C. REPARACIÓN EN FABRICA Y CAMBIO: ', text: 'El Vendedor garantiza que los Productos de equipamiento cobrables o fuera de garantía cambiados o reparados en fábrica por el fabricante y provistos bajo la presente estarán libres de defectos de material y mano de obra. Los Productos entregados como cambio pueden ser nuevos o reacondicionados.' },
    { bold: 'D. SERVICIO. ', text: 'El Vendedor garantiza que los Productos compuestos de servicios, incluyendo los servicios de programación de ingeniería y programas especiales, ya sean provistos a costo fijo o sobre la base de tiempo y materiales, serán provistos de acuerdo con las prácticas de la industria generalmente aceptadas, en la medida que dichos servicios estén sujetos a un criterio de aceptación por escrito que el Vendedor ha aceptado con anticipación. Se renuncia a todas las otras garantías relacionadas con los servicios provistos.' },
    { bold: 'E. ESPECIFICACIONES DEL CLIENTE: ', text: 'El Vendedor no garantiza y no será responsable por el diseño, materiales o criterio de construcción entregado o especificado por el Cliente e incorporado en los Productos o para Productos fabricados por o comprados de otros fabricantes o vendedores especificados por el Cliente. Cualquier garantía aplicable a dichos Productos especificados por el Cliente se limitará solamente a la garantía, si la hubiera, extendida por el fabricante o vendedor original que no sea el Vendedor en la medida permitida en dicha garantía.' },
  ];

  // Render terms paragraphs
  termsContent.forEach(({ bold, text }) => {
    if (p3Y > pageHeight - 25) {
      drawFooter();
      doc.addPage();
      drawWatermark();
      drawHeader();
      p3Y = 46;
    }
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    const boldWidth = doc.getTextWidth(bold);

    const combined = bold + text;
    const splitLines = doc.splitTextToSize(combined, contentWidth);

    // Render with bold on the first portion
    splitLines.forEach((line, lineIdx) => {
      if (lineIdx === 0) {
        // bold part
        const boldPart = bold.length <= line.length ? bold : line;
        doc.setFont('helvetica', 'bold');
        doc.text(boldPart, marginL, p3Y);
        if (bold.length < line.length) {
          doc.setFont('helvetica', 'normal');
          doc.text(line.substring(bold.length), marginL + doc.getTextWidth(boldPart), p3Y);
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.text(line, marginL, p3Y);
      }
      p3Y += 4.5;
    });
    p3Y += 1;
  });

  drawFooter();

  // ============================================================
  //  PAGE(S) — Additional Terms (continued)
  // ============================================================
  const termsContent2 = [
    { bold: 'H. LAS GARANTÍAS ANTERIORES SE OFRECEN EN LUGAR DE TODAS LAS OTRAS GARANTÍAS, YA SEAN EXPRESAS, IMPLÍCITAS O ESTATUTARIAS, INCLUYENDO GARANTÍAS IMPLÍCITAS DE COMERCIABILIDAD O APTITUD PARA UN USO PARTICULAR, O GARANTÍAS DE RENDIMIENTO O APLICACIÓN, Y SE EXTIENDE SOLAMENTE A CLIENTES QUE COMPRAN DEL VENDEDOR O SU DISTRIBUIDOR AUTORIZADO.', text: '' },
    { bold: 'LÍMITE DE LA RESPONSABILIDAD. ', text: 'EN NINGÚN CASO SERÁ EL VENDEDOR RESPONSABLE POR DAÑOS INCIDENTALES, INDIRECTOS O CONSECUENTES DE NINGÚN TIPO. LA RESPONSABILIDAD ACUMULATIVA MÁXIMA DEL VENDEDOR EN RELACIÓN CON TODOS LOS OTROS RECLAMOS Y RESPONSABILIDADES, INCLUYENDO LA RESPONSABILIDAD CON RESPECTO A DAÑOS Y OBLIGACIONES DIRECTAS BAJO CUALQUIER TEORÍA LEGAL O EQUITATIVA, SE ASEGURARÁ O NO, NO EXCEDERÁ EL COSTO DE LOS PRODUCTOS QUE DAN ORIGEN AL RECLAMO O RESPONSABILIDAD. CUALQUIER ACCIÓN EN CONTRA DEL VENDEDOR DEBE SER PRESENTADA DENTRO DE LOS DIECIOCHO (18) MESES DESPUÉS DE QUE OCURRA LA CAUSA DE LA ACCIÓN. ESTAS RENUNCIAS Y LIMITACIONES DE RESPONSABILIDAD SE APLICARÁN SOBRE CUALQUIER OTRA DISPOSICIÓN EN CONTRARIO EN EL CONTRATO Y SIN CUIDADO DE LA FORMA DE ACCIÓN, YA SEA CONTRACTUAL, POR DISPOSICIÓN DE LEY O DE CUALQUIER OTRA MANERA, Y SE EXTENDERÁ ADEMÁS PARA EL BENEFICIO DE LOS PROVEEDORES DEL VENDEDOR, DISTRIBUIDORES Y OTROS REVENDEDORES AUTORIZADOS COMO TERCEROS BENEFICIARIOS. CADA DISPOSICIÓN DEL CONTRATO QUE INDICA UNA LIMITACIÓN DE LA RESPONSABILIDAD, RENUNCIA A LA GARANTÍA, O CONDICIÓN O EXCLUSIÓN DE DAÑOS ES DIVISIBLE E INDEPENDIENTE DE CUALQUIER OTRA DISPOSICIÓN Y SERÁ EJECUTADA COMO TAL. EL VENDEDOR POR SER ÚNICAMENTE DISTRIBUIDOR DE LOS PRODUCTOS, NO PUEDE ACEPTAR NINGÚN JUICIO O DEMANDA POR LOS PRODUCTOS QUE VENDE Y SE LIMITARÁ A HACER EXTENSIVA LA RESPONSABILIDAD DE ESTOS AL FABRICANTE DEL PRODUCTO.' },
    { bold: 'PROGRAMAS BAJO LICENCIA. ', text: 'Los Productos compuestos por programas pueden estar sujetos a términos y condiciones adicionales indicadas en los contratos de licencia del Vendedor separados que controlarán en la medida necesaria la resolución de cualquier conflicto con los términos y condiciones indicados en el presente. Dichos Productos no serán entregados ni puestos a disposición hasta que el cliente esté de acuerdo con el contrato, términos y condiciones de dichos contratos de licencia separados.' },
    { bold: 'EMPAQUETADO Y MARCADO. ', text: 'El empaquetado o marcado específico del cliente puede estar sujeto a disponibilidad y cargos adicionales no incluidos en el precio de los Productos.' },
    { bold: 'PESOS Y DIMENSIONES. ', text: 'Los pesos y dimensiones publicados son cálculos o aproximaciones solamente, no están garantizados y están sujetos a cambio por el fabricante sin previo aviso.' },
    { bold: 'COTIZACIONES. ', text: 'Las cotizaciones por escrito son válidas durante 15 días desde la fecha de emisión a menos que se indique lo contrario con excepción de las expresadas en dólares ya que tienen vigencia de 24 horas y si el tipo de cambio sufre una variación mayor al 2%, pierde su validez. Las cotizaciones verbales vencen el mismo día en que son hechas. Las existencias especificadas en las mismas están sujetas a previo. Todos los errores especialmente los tipográficos están sujetos a corrección.' },
    { bold: 'PRECIOS. ', text: 'Los precios y cualquier otra información indicada en cualquier publicación del Vendedor (incluyendo los catálogos de productos y folletos), están sujetos a cambio sin notificación y serán confirmados por cotización específica. Dichas publicaciones no son ofertas de ventas y se mantienen solamente como fuente de información general. Será a cargo del cliente el Impuesto al Valor Agregado o cualquier otro impuesto similar. Los productos compuestos por servicios de tiempo y material serán provistos de acuerdo con las tarifas de servicio especificadas por el Vendedor (más los gastos de viaje y horas extras correspondientes) en efecto en la fecha en que se presten dichos servicios, a menos de que sea confirmado de otra manera en la cotización por escrito del Vendedor o la aceptación del pedido correspondiente. El tiempo de servicio cobrable incluye el tiempo de viaje desde y hasta al lugar de trabajo y todo el tiempo que los representantes del Vendedor están disponibles para trabajar y el tiempo de espera (en el lugar de trabajo o no) para prestar los servicios.' },
    { bold: 'CAMBIOS. ', text: 'Los cambios en el pedido solicitados por el cliente, incluyendo los que afecten la identidad, alcance y entrega de los Productos deben de constar por escrito, están sujetos a la Política de Cambios y Devoluciones vigente para el cliente y están también a la aprobación previa del Vendedor, a los ajustes en los precios, programación y otros términos y condiciones que se afecten. En cualquier caso, el Vendedor se reserva el derecho de rechazar cualquier cambio que considere inseguro, técnicamente no aconsejable o inconsistente con las pautas y normas de calidad e ingeniería establecidas, o sea incompatible con la capacidad de diseño o fabricación del Vendedor.' },
    { bold: 'DEVOLUCIONES. ', text: 'Todas las devoluciones de Productos estarán sujetas a la aprobación previa del Vendedor y a la Política de Cambios y Devoluciones del mismo. Las devoluciones de productos no garantizados sin usar y vendibles a cambio de crédito estarán sujetas a las políticas de devoluciones del Vendedor en efecto en dicho momento, incluyendo los cargos correspondientes de re almacenaje de dicha mercancía y otras condiciones de devolución. Los productos devueltos bajo la garantía deben estar debidamente empaquetados y despachados a la dirección especificada por el Vendedor. Los paquetes de despacho deben estar claramente marcados según las instrucciones del Vendedor y despachados con flete prepagado por el cliente.' },
    { bold: 'POLÍTICA DE CAMBIOS Y DEVOLUCIONES.', text: '' },
  ];

  doc.addPage();
  drawWatermark();
  drawHeader();
  let p4Y = 46;

  termsContent2.forEach(({ bold, text }) => {
    if (p4Y > pageHeight - 25) {
      drawFooter();
      doc.addPage();
      drawWatermark();
      drawHeader();
      p4Y = 46;
    }
    const combined = bold + text;
    const splitLines = doc.splitTextToSize(combined, contentWidth);
    splitLines.forEach((line, lineIdx) => {
      if (lineIdx === 0) {
        const boldPart = bold.length <= line.length ? bold : line;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...black);
        doc.text(boldPart, marginL, p4Y);
        if (bold.length < line.length) {
          doc.setFont('helvetica', 'normal');
          doc.text(line.substring(bold.length), marginL + doc.getTextWidth(boldPart), p4Y);
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(line, marginL, p4Y);
      }
      p4Y += 4.5;
    });
    p4Y += 1;
  });

  // Políticas bullet list
  const politicasItems = [
    'Toda devolución o cambio deberá notificarse al Vendedor en un plazo no mayor de 10 días después de la entrega del mismo.',
    'Todas las devoluciones autorizadas generarán la Nota de Crédito correspondiente después de su recepción y aprobación de la inspección en el Almacén.',
    'Se aplicará un cargo especificado por el Vendedor del valor del producto devuelto, cuando la causa de la devolución no sea imputable a CENTRO ECG y sea por solicitud del cliente.',
    'No procederá la devolución por causas no imputables a CENTRO ECG, de productos cuando estos corresponden a:',
    'Productos de clasificación "C" y "Z" (Productos de poco movimiento para CENTRO ECG o especiales).',
    'Productos Obsoletos.',
    'Productos cuya aprobación signifique a ECG INGENIERIA Y MANTENIMIENTO el tener más de 6 meses de inventario.',
  ];

  if (p4Y > pageHeight - 60) {
    drawFooter();
    doc.addPage();
    drawWatermark();
    drawHeader();
    p4Y = 46;
  }

  politicasItems.forEach((item) => {
    if (p4Y > pageHeight - 25) {
      drawFooter();
      doc.addPage();
      drawWatermark();
      drawHeader();
      p4Y = 46;
    }
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.setDrawColor(...midGray);
    doc.setLineWidth(0.4);
    doc.circle(marginL + 3, p4Y - 1.5, 1.5, 'S');
    const splitItem = doc.splitTextToSize(item, contentWidth - 10);
    doc.text(splitItem, marginL + 8, p4Y);
    p4Y += splitItem.length * 4.5 + 1;
  });

  drawFooter();

  // ============================================================
  //  SAVE
  // ============================================================
  const clientName = (cot.clientes?.nombre || 'Cliente').replace(/\s+/g, '_');
  const fileName = `Cotizacion_${cot.folio || cot.id}_${clientName}.pdf`;
  doc.save(fileName);
};
