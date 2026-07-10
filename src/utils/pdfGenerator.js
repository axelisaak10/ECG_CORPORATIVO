import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a secured, flattened (rasterized image-only) PDF for a quotation matching the corporate ECG style.
 * This blocks any text selection, copying, or conversion to Word, while keeping printing/viewing perfect.
 * @param {Object} cot - Quotation data
 */
export const generateCotizacionPDF = async (cot, isEditable = false) => {
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

  // ── Build table rows (same logic as PDF) ──────────────────────────────────
  const tableBody = [];
  const catLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let grandTotal = 0;

  // Process articles grouped by category
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

  // Build rows array
  Object.entries(grouped).forEach(([catName, items], catIdx) => {
    const catLetter = catLetters[catIdx] || String(catIdx + 1);
    const catLetterLow = catLetter.toLowerCase();

    // Category header row
    tableBody.push({
      type: 'category',
      label: catName.toUpperCase(),
    });

    tableBody.push({
      type: 'catLetter',
      letter: catLetter + '.',
      label: catName.toUpperCase(),
    });

    items.forEach((a, itemIdx) => {
      const precioFinal = a.precio * (1 + (a.margen || 0) / 100);
      const subtotal = precioFinal * a.cantidad;
      grandTotal += subtotal;
      const hasQty = subtotal > 0;

      tableBody.push({
        type: 'item',
        item: a.codigo ? a.codigo.toUpperCase() : `${catLetterLow}. ${itemIdx + 1}`,
        desc: a.nombre,
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

    if (cot.herramientas && cot.herramientas.length > 0) {
      const nextOffset = (cot.empleados?.length || 0);
      cot.herramientas.forEach((h, hIdx) => {
        const rentaFinal = (h.precio_renta_diaria || 0) * (1 + (h.margen || 0) / 100);
        const subtotalH = rentaFinal * h.cantidad * totalDias;
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

  // ── Build delivery and commercial terms strings ──────────────────────────
  let totalDiasStr = '';
  if ((cot.horas || 0) > 0) totalDiasStr += `${cot.horas} horas `;
  if ((cot.dias || 0) > 0) totalDiasStr += `${cot.dias} día(s) `;
  if ((cot.semanas || 0) > 0) totalDiasStr += `${cot.semanas} semana(s) `;
  if ((cot.meses || 0) > 0) totalDiasStr += `${cot.meses} mes(es) `;

  const deliveryTimeText = `Materiales, equipo e insumos: ${totalDiasStr || '10 – 15 día(s)'} hábiles, a partir del cumplimiento de las condiciones comerciales`;

  // ── Terms Content ──────────────────────────────────────────────────────────
  const termsContent = [
    { bold: 'GENERAL. ', text: 'Estos términos y condiciones de venta (junto con cualquier cotización o especificación por escrito del Vendedor directamente asociada) gobernará exclusivamente la venta o licencia otorgada por el Vendedor de todos los productos y servicios (incluyendo sin limitación, productos para equipamiento, software y programas, capacitación, programación, mantenimiento, ingeniería, repuestos y servicios de reparación colectivamente los "Productos") otorgados bajo la presente. Ninguna adición o modificación a estos términos y condiciones será obligatoria para centro de ingeniería y abastecimiento e. (denominado en lo sucesivo como "CENTRO ECG") a menos que haya indicado su acuerdo por escrito firmado por su representante autorizado. El Vendedor no reconoce otro u otros términos y condiciones que puedan ser opuestos por el cliente que no sean de otra manera consistente con estos u otros términos y condiciones fijados en la cotización, especificación o aceptación del pedido del Vendedor.' },
    { bold: 'TÉRMINOS DE PAGO. ', text: 'Salvo que se disponga algo diferente por escrito por el Vendedor en una Cotización o en relación a una aceptación del Pedido, los términos de pago son 50% ANTICIPO desde la fecha de la factura con crédito continuo (PREVIA A PROBACIÓN DE CENTRO ECG) aprobado según lo determine CENTRO ECG, anticipadamente y/o contra la entrega del material en los casos en que no se tenga crédito. La liquidación de las facturas de venta se hará en la misma moneda en que se haya acordado la misma y que se haya aceptado el pedido el vendedor. En caso de pago de facturas en moneda nacional que hayan sido realizadas en otra moneda, el tipo de cambio a considerar será el libre bancario vigente a la fecha de pago y CENTRO ECG se reserva el derecho a determinar la institución que lo fije. ' },
    { bold: 'CENTRO ECG ', text: 'se reserva el derecho de suspender cualquier cumplimiento adicional bajo este contrato o de cualquier otra obligación para con el cliente en el caso de que el pago no sea realizado a término. No se permite ningún pago por compensación o penalización a menos que haya sido aprobado por CENTRO ECG.' },
    { bold: 'TÉRMINOS DE ENTREGA. ', text: 'Los términos de entrega son LAB en el almacén del cliente siempre y cuando se encuentre dentro del estado de Querétaro. En lo que respecta a los costos de envío, riesgo de pérdida y transferencia del título, excepto el título a todos los derechos a la propiedad intelectual asociados con los Productos, (por ejemplo, programas) siguen siendo determinados por CENTRO ECG (o sus proveedores y licenciantes), y dichos Productos son puestos a disposición o bajo licencia para ser usados por el cliente según este contrato u otro contrato de licencia del Vendedor o sus proveedores.' },
    { bold: 'GARANTÍAS. ', text: '' },
    { bold: 'A. EQUIPO: ', text: 'Salvo que se disponga algo diferente por escrito por el Vendedor en una Cotización o en la aceptación del Pedido, CENTRO ECG como intermediario, tramitará la garantía correspondiente de acuerdo con las condiciones otorgadas por el fabricante del equipo al asegurar que los Productos o Equipos entregados bajo la presente serán de calidad comercializable, libre de defectos de material, mano de obra o diseño. Igualmente se tramitará, los Productos o Equipos reparados o cambiados bajo la garantía.' },
    { bold: 'B. PROGRAMAS: ', text: 'A menos que se haya indicado lo contrario en el contrato de licencia del Vendedor o de terceros, el Vendedor garantiza por el período marcado por el Fabricante, que los Productos estándar de programas entregados bajo el presente, cuando se les usa con el equipo especificado por el Vendedor, funcionarán de acuerdo con las especificaciones publicadas, preparadas, aprobadas y emitidas por el Fabricante. El Vendedor no hace representación alguna o garantía, expresa o implícitamente, que el funcionamiento de los Productos de programas será ininterrumpido o sin errores, o que las funciones contenidas en el mismo cumplirán a satisfacción el uso o los requisitos especificados por el Cliente.' },
    { bold: 'C. REPARACIÓN EN FABRICA Y CAMBIO: ', text: 'El Vendedor garantiza que los Productos de equipamiento cobrables o fuera de garantía cambiados o reparados en fábrica por el fabricante y provistos bajo la presente estarán libres de defectos de material y mano de obra. Los Productos entregados como cambio pueden ser nuevos o reacondicionados.' },
    { bold: 'D. SERVICIO. ', text: 'El Vendedor garantiza que los Productos compuestos de servicios, incluyendo los servicios de programación de ingeniería y programas especiales, ya sean provistos a costo fijo o sobre la base de tiempo y materiales, serán provistos de acuerdo con las prácticas de la industria generalmente aceptadas, en la medida que dichos servicios estén sujetos a un criterio de aceptación por escrito que el Vendedor ha aceptado con anticipación. Se renuncia a todas las otras garantías relacionadas con los servicios provistos.' },
    { bold: 'E. ESPECIFICACIONES DEL CLIENTE: ', text: 'El Vendedor no garantiza y no será responsable por el diseño, materiales o criterio de construcción entregado o especificado por el Cliente e incorporado en los Productos o para Productos fabricados por o comprados de otros fabricantes o vendedores especificados por el Cliente. Cualquier garantía aplicable a dichos Productos especificados por el Cliente se limitará solamente a la garantía, si la hubiera, extendida por el fabricante o vendedor original que no sea el Vendedor en la medida permitida en dicha garantía.' },
  ];

  const termsContent2 = [
    { bold: 'H. LAS GARANTÍAS ANTERIORES SE OFRECEN EN LUGAR DE TODAS LAS OTRAS GARANTÍAS, YA SEAN EXPRESAS, IMPLÍCITAS O ESTATUTARIAS, INCLUYENDO GARANTÍAS IMPLÍCITAS DE COMERCIABILIDAD O APTITUD PARA UN USO PARTICULAR, O GARANTÍAS DE RENDIMIENTO O APLICACIÓN, Y SE EXTIENDE SOLAMENTE A CLIENTES QUE COMPRAN DEL VENDEDOR O SU DISTRIBUIDOR AUTORIZADO.', text: '' },
    { bold: 'LÍMITE DE LA RESPONSABILIDAD. ', text: 'EN NINGÚN CASO SERÁ EL VENDEDOR RESPONSABLE POR DAÑOS INCIDENTALES, INDIRECTOS O CONSECUENTES DE NINGÚN TIPO. LA RESPONSABILIDAD ACUMULATIVA MÁXIMA DEL VENDEDOR EN RELACIÓN CON TODOS LOS OTROS RECLAMOS Y RESPONSABILIDADES, INCLUYENDO LA RESPONSABILIDAD CON RESPECTO A DAÑOS Y OBLIGACIONES DIRECTAS BAJO CUALQUIER TEORÍA LEGAL O EQUITATIVA, SE ASEGURARÁ O NO, NO EXCEDERÁ EL COSTO DE LOS PRODUCTOS QUE DAN ORIGEN AL RECLAMO O RESPONSABILIDAD. CUALQUIER ACCIÓN EN CONTRA DEL VENDEDOR DEBE SER PRESENTADA DENTRO DE LOS DIECIOCHO (18) MESES DESPUÉS DE QUE OCURRA LA CAUSA DE LA ACCIÓN. ESTAS RENUNCIAS Y LIMITACIONES DE RESPONSABILIDAD SE APLICARÁN SOBRE CUALQUIER OTRA DISPOSICIÓN EN CONTRARIO EN EL CONTRATO Y SIN CUIDADO DE LA FORMA DE ACCIÓN, YA SEA CONTRACTUAL, POR DISPOSICIÓN DE LEY O DE CUALQUIER OTRA MANERA, Y SE EXTENDERÁ ADEMÁS PARA EL BENEFICIO DE LOS PROVEEDORES DEL VENDEDOR, DISTRIBUIDORES Y OTROS REVENDEDORES AUTORIZADOS COMO TERCEROS BENEFICIARIOS.' },
    { bold: 'PROGRAMAS BAJO LICENCIA. ', text: 'Los Productos compuestos por programas pueden estar sujetos a términos y condiciones adicionales indicadas en los contratos de licencia del Vendedor separados que controlarán en la medida necesaria la resolución de cualquier conflicto con los términos y condiciones indicados en el presente.' },
    { bold: 'EMPAQUETADO Y MARCADO. ', text: 'El empaquetado o marcado específico del cliente puede estar sujeto a disponibilidad y cargos adicionales no incluidos en el precio de los Productos.' },
    { bold: 'PESOS Y DIMENSIONES. ', text: 'Los pesos y dimensiones publicados son cálculos o aproximaciones solamente, no están garantizados y están sujetos a cambio por el fabricante sin previo aviso.' },
    { bold: 'COTIZACIONES. ', text: 'Las cotizaciones por escrito son válidas durante 15 días desde la fecha de emisión a menos que se indique lo contrario con excepción de las expresadas en dólares ya que tienen vigencia de 24 horas y si el tipo de cambio sufre una variación mayor al 2%, pierde su validez. Existencias especificadas en las mismas están sujetas a previo venta. Todos los errores especialmente los tipográficos están sujetos a corrección.' },
    { bold: 'PRECIOS. ', text: 'Los precios y cualquier otra información indicada en cualquier publicación del Vendedor (incluyendo los catálogos de productos y folletos), están sujetos a cambio sin notificación y serán confirmados por cotización específica. Será a cargo del cliente el Impuesto al Valor Agregado o cualquier otro impuesto similar.' },
    { bold: 'CAMBIOS. ', text: 'Los cambios en el pedido solicitados por el cliente, incluyendo los que afecten la identidad, alcance y entrega de los Productos deben de constar por escrito, están sujetos a la Política de Cambios y Devoluciones vigente para el cliente y están también a la aprobación previa del Vendedor, a los ajustes en los precios, programación y otros términos y condiciones que se afecten.' },
    { bold: 'DEVOLUCIONES. ', text: 'Todas las devoluciones de Productos estarán sujetas a la aprobación previa del Vendedor y a la Política de Cambios y Devoluciones del mismo. Las devoluciones de productos no garantizados sin usar y vendibles a cambio de crédito estarán sujetas a las políticas de devoluciones del Vendedor en efecto en dicho momento, incluyendo los cargos correspondientes de re almacenaje de dicha mercancía y otras condiciones de devolución.' },
    { bold: 'POLÍTICA DE CAMBIOS Y DEVOLUCIONES.', text: '' },
  ];

  const politicasItems = [
    'Toda devolución o cambio deberá notificarse al Vendedor en un plazo no mayor de 10 días después de la entrega del mismo.',
    'Todas las devoluciones autorizadas generarán la Nota de Crédito correspondiente después de su recepción y aprobación de la inspección en el Almacén.',
    'Se aplicará un cargo especificado por el Vendedor del valor del producto devuelto, cuando la causa de la devolución no sea imputable a CENTRO ECG y sea por solicitud del cliente.',
    'No procederá la devolución por causas no imputables a CENTRO ECG, de productos cuando estos corresponden a:',
    'Productos de clasificación "C" y "Z" (Productos de poco movimiento para CENTRO ECG o especiales).',
    'Productos Obsoletos.',
    'Productos cuya aprobación signifique a ECG INGENIERIA Y MANTENIMIENTO el tener más de 6 meses de inventario.',
  ];

  // ── Split items table if too many rows ────────────────────────────────────
  const page1Rows = [];
  const page1bRows = [];

  if (tableBody.length <= 15) {
    page1Rows.push(...tableBody);
  } else {
    page1Rows.push(...tableBody.slice(0, 12));
    page1bRows.push(...tableBody.slice(12));
  }

  const totalPages = page1bRows.length === 0 ? 4 : 5;

  const renderRowHTML = (row) => {
    if (row.type === 'category') {
      return `
        <tr style="background-color: #eeeeee; font-weight: bold; text-align: center;">
          <td colspan="6" style="border: 0.5px solid #d3d3d3; padding: 4px;">${row.label}</td>
        </tr>
      `;
    } else if (row.type === 'catLetter') {
      return `
        <tr style="font-weight: bold;">
          <td style="border: 0.5px solid #d3d3d3; padding: 4px; text-align: center; vertical-align: top;">${row.letter}</td>
          <td style="border: 0.5px solid #d3d3d3; padding: 4px; vertical-align: top;">
            ${row.label}
            ${row.desc ? `<br/><span style="font-size: 7.5pt; color: #555555; font-weight: normal;">${row.desc}</span>` : ''}
          </td>
          <td style="border: 0.5px solid #d3d3d3; padding: 4px; text-align: center; vertical-align: top;">${row.cant || ''}</td>
          <td style="border: 0.5px solid #d3d3d3; padding: 4px; text-align: center; vertical-align: top;">${row.unidad || ''}</td>
          <td style="border: 0.5px solid #d3d3d3; padding: 4px; text-align: right; vertical-align: top;">${row.costoUnit || ''}</td>
          <td style="border: 0.5px solid #d3d3d3; padding: 4px; text-align: right; vertical-align: top; font-weight: bold;">${row.importe || ''}</td>
        </tr>
      `;
    } else {
      return `
        <tr>
          <td style="border: 0.5px solid #d3d3d3; padding: 4px; text-align: center; color: #777777; vertical-align: top;">${row.item}</td>
          <td style="border: 0.5px solid #d3d3d3; padding: 4px; vertical-align: top;">${row.desc}</td>
          <td style="border: 0.5px solid #d3d3d3; padding: 4px; text-align: center; vertical-align: top;">${row.cant}</td>
          <td style="border: 0.5px solid #d3d3d3; padding: 4px; text-align: center; vertical-align: top;">${row.unidad}</td>
          <td style="border: 0.5px solid #d3d3d3; padding: 4px; text-align: right; vertical-align: top;">${row.costoUnit}</td>
          <td style="border: 0.5px solid #d3d3d3; padding: 4px; text-align: right; vertical-align: top;">${row.importe}</td>
        </tr>
      `;
    }
  };

  // ── Pages HTML Definition ─────────────────────────────────────────────────
  const page1Content = `
    <div style="font-size: 9pt; color: #333333; margin-bottom: 12px; text-align: justify; line-height: 1.3;">
      Por medio de la presente reciba un cordial saludo por parte del todo el personal que colabora en esta empresa, así mismo aprovecho este medio para enviarle la cotización; la cual consta de lo siguiente:
    </div>
    
    <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
      <thead>
        <tr style="background-color: #800020; color: #ffffff; font-weight: bold;">
          <th style="border: 0.5px solid #d3d3d3; padding: 4px; width: 8%; text-align: center;">ÍTEM</th>
          <th style="border: 0.5px solid #d3d3d3; padding: 4px; width: 48%; text-align: center;">DESCRIPCIÓN</th>
          <th style="border: 0.5px solid #d3d3d3; padding: 4px; width: 8%; text-align: center;">CANT</th>
          <th style="border: 0.5px solid #d3d3d3; padding: 4px; width: 10%; text-align: center;">UNIDAD</th>
          <th style="border: 0.5px solid #d3d3d3; padding: 4px; width: 13%; text-align: center;">P. UNITARIO</th>
          <th style="border: 0.5px solid #d3d3d3; padding: 4px; width: 13%; text-align: center;">IMPORTE</th>
        </tr>
      </thead>
      <tbody>
        ${page1Rows.map(renderRowHTML).join('')}
        ${page1bRows.length === 0 ? `
          <tr style="font-weight: bold; background-color: #fff5f5; color: #800020;">
            <td></td>
            <td style="text-align: right; padding: 5px;" colspan="4">TOTAL DE MATERIALES Y MANO DE OBRA</td>
            <td style="text-align: right; padding: 5px;">${fmt(grandTotal || cot.total || 0)}</td>
          </tr>
        ` : ''}
      </tbody>
    </table>
    
    ${page1bRows.length === 0 && cot.imagen_url ? `
      <div style="text-align: center; margin-top: 15px;">
        <span style="font-size: 8pt; color: #666; display: block; margin-bottom: 4px;">Imagen de referencia:</span>
        <img src="${cot.imagen_url}" style="max-height: 140px; max-width: 250px; border: 0.5px solid #d3d3d3; padding: 3px; border-radius: 4px;" />
      </div>
    ` : ''}
  `;

  const page1bContent = `
    <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
      <thead>
        <tr style="background-color: #800020; color: #ffffff; font-weight: bold;">
          <th style="border: 0.5px solid #d3d3d3; padding: 4px; width: 8%; text-align: center;">ÍTEM</th>
          <th style="border: 0.5px solid #d3d3d3; padding: 4px; width: 48%; text-align: center;">DESCRIPCIÓN</th>
          <th style="border: 0.5px solid #d3d3d3; padding: 4px; width: 8%; text-align: center;">CANT</th>
          <th style="border: 0.5px solid #d3d3d3; padding: 4px; width: 10%; text-align: center;">UNIDAD</th>
          <th style="border: 0.5px solid #d3d3d3; padding: 4px; width: 13%; text-align: center;">P. UNITARIO</th>
          <th style="border: 0.5px solid #d3d3d3; padding: 4px; width: 13%; text-align: center;">IMPORTE</th>
        </tr>
      </thead>
      <tbody>
        ${page1bRows.map(renderRowHTML).join('')}
        <tr style="font-weight: bold; background-color: #fff5f5; color: #800020;">
          <td></td>
          <td style="text-align: right; padding: 5px;" colspan="4">TOTAL DE MATERIALES Y MANO DE OBRA</td>
          <td style="text-align: right; padding: 5px;">${fmt(grandTotal || cot.total || 0)}</td>
        </tr>
      </tbody>
    </table>
    
    ${cot.imagen_url ? `
      <div style="text-align: center; margin-top: 15px;">
        <span style="font-size: 8pt; color: #666; display: block; margin-bottom: 4px;">Imagen de referencia:</span>
        <img src="${cot.imagen_url}" style="max-height: 140px; max-width: 250px; border: 0.5px solid #d3d3d3; padding: 3px; border-radius: 4px;" />
      </div>
    ` : ''}
  `;

  const page2Content = `
    <div style="text-align: center; margin-top: 5px; margin-bottom: 15px;">
      <h2 style="font-size: 13pt; margin: 0; font-weight: bold; color: #000000;">TIEMPOS DE ENTREGA Y CONDICIONES COMERCIALES</h2>
      <div style="border-bottom: 2px solid #000000; width: 420px; margin: 4px auto 0 auto;"></div>
    </div>
    
    <div style="color: #800020; font-size: 10pt; font-weight: bold; margin-top: 10px; margin-bottom: 5px; border-bottom: 0.5px solid #800020; padding-bottom: 2px;">
      TIEMPOS DE ENTREGA:
    </div>
    <ul style="margin: 0; padding-left: 15px; margin-bottom: 12px; font-size: 8.5pt; color: #333333;">
      <li style="list-style-type: circle; margin-bottom: 4px; text-align: justify;">${deliveryTimeText}</li>
    </ul>
    
    <div style="color: #800020; font-size: 10pt; font-weight: bold; margin-top: 10px; margin-bottom: 5px; border-bottom: 0.5px solid #800020; padding-bottom: 2px;">
      CONDICIONES COMERCIALES:
    </div>
    <ul style="margin: 0; padding-left: 15px; margin-bottom: 12px; font-size: 8.5pt; color: #333333; line-height: 1.35;">
      <li style="list-style-type: circle; margin-bottom: 3px; text-align: justify;">Los precios son expresados en PESOS MEXICANOS MNX</li>
      <li style="list-style-type: circle; margin-bottom: 3px; text-align: justify;">Los precios no incluyen el 16% I.V.A.</li>
      <li style="list-style-type: circle; margin-bottom: 3px; text-align: justify;">Se requiere Emisión de orden de compra a favor de centro de ingeniería y abastecimiento ECG</li>
      <li style="list-style-type: circle; margin-bottom: 3px; text-align: justify;">100 % del importe de materiales.</li>
      <li style="list-style-type: circle; margin-bottom: 3px; text-align: justify;">50% de anticipo del importe de mano de obra y 50% restante a los 15 días de haber entregado el equipo funcionando.</li>
      <li style="list-style-type: circle; margin-bottom: 3px; text-align: justify;">Vigencia de cotización: 10 días naturales.</li>
      <li style="list-style-type: circle; margin-bottom: 3px; text-align: justify;">La elaboración de esta cotización se basa en la información que nos proporciona el cliente.</li>
      <li style="list-style-type: circle; margin-bottom: 3px; text-align: justify;">Es obligación del cliente revisar y aprobar la presente cotización, si existiera algún faltante o diferencia de acuerdo con sus necesidades será necesaria una nueva cotización.</li>
    </ul>
    
    <div style="color: #800020; font-size: 10pt; font-weight: bold; margin-top: 10px; margin-bottom: 5px; border-bottom: 0.5px solid #800020; padding-bottom: 2px;">
      GARANTÍAS:
    </div>
    <ul style="margin: 0; padding-left: 15px; margin-bottom: 15px; font-size: 8.5pt; color: #333333;">
      <li style="list-style-type: circle; margin-bottom: 4px; text-align: justify;">1 AÑO DE GARANTÍA EN EQUIPO Y MATERIALES</li>
    </ul>
    
    <div style="font-size: 9pt; text-align: justify; margin-bottom: 20px; color: #333333; line-height: 1.3;">
      Sin más por el momento y en espera de poder ser parte de su éxito, quedamos a sus más apreciables órdenes.
    </div>
    
    <div style="text-align: center; font-weight: bold; font-size: 9pt; margin-bottom: 25px;">
      ATENTAMENTE
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <tr>
        <td style="text-align: center;">
          <div style="border-top: 1px solid #000000; width: 250px; margin: 0 auto; margin-bottom: 6px;"></div>
          <div style="font-size: 9.5pt; font-weight: bold; color: #800020;">ING. JUAN ERASMO CUAYA GRANADOS</div>
          <div style="font-size: 8.5pt; font-weight: bold; color: #333333; margin-top: 2px;">CED. PROF. 8101909</div>
          <div style="font-size: 8.5pt; font-weight: bold; color: #333333; margin-top: 2px; margin-bottom: 8px;">REPSE 576749</div>
          <div style="font-size: 9pt; font-weight: bold; color: #800020; font-style: italic;">NUESTRO ÉXITO DEPENDE DEL ÉXITO DE NUESTROS CLIENTES</div>
        </td>
      </tr>
    </table>
  `;

  const page3Content = `
    <div style="text-align: center; margin-top: 5px; margin-bottom: 12px;">
      <h3 style="font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 0; color: #000000;">TÉRMINOS DE VENTA CENTRO DE INGENIERÍA Y ABASTECIMIENTO ECG SA DE CV</h3>
      <div style="border-bottom: 1px solid #000000; width: 100%; margin-top: 4px;"></div>
    </div>
    
    <div style="font-size: 7.6pt; text-align: justify; color: #333333; line-height: 1.35;">
      <p style="margin: 0 0 6px 0;"><b>GENERAL.</b> ${termsContent[0].text}</p>
      <p style="margin: 0 0 6px 0;"><b>TÉRMINOS DE PAGO.</b> ${termsContent[1].text} ${termsContent[2].text}</p>
      <p style="margin: 0 0 6px 0;"><b>TÉRMINOS DE ENTREGA.</b> ${termsContent[3].text}</p>
      <p style="margin: 0 0 4px 0;"><b>GARANTÍAS.</b></p>
      <p style="margin: 0 0 4px 0; padding-left: 10px;"><b>A. EQUIPO:</b> ${termsContent[5].text}</p>
      <p style="margin: 0 0 4px 0; padding-left: 10px;"><b>B. PROGRAMAS:</b> ${termsContent[6].text}</p>
      <p style="margin: 0 0 4px 0; padding-left: 10px;"><b>C. REPARACIÓN EN FABRICA Y CAMBIO:</b> ${termsContent[7].text}</p>
      <p style="margin: 0 0 4px 0; padding-left: 10px;"><b>D. SERVICIO:</b> ${termsContent[8].text}</p>
      <p style="margin: 0 0 4px 0; padding-left: 10px;"><b>E. ESPECIFICACIONES DEL CLIENTE:</b> ${termsContent[9].text}</p>
    </div>
  `;

  const page4Content = `
    <div style="font-size: 7.6pt; text-align: justify; color: #333333; line-height: 1.35;">
      <p style="margin: 0 0 6px 0;"><b>H. LAS GARANTÍAS ANTERIORES SE OFRECEN EN LUGAR DE TODAS LAS OTRAS GARANTÍAS, YA SEAN EXPRESAS, IMPLÍCITAS O ESTATUTARIAS, INCLUYENDO GARANTÍAS IMPLÍCITAS DE COMERCIABILIDAD O APTITUD PARA UN USO PARTICULAR, O GARANTÍAS DE RENDIMIENTO O APLICACIÓN, Y SE EXTIENDE SOLAMENTE A CLIENTES QUE COMPRAN DEL VENDEDOR O SU DISTRIBUIDOR AUTORIZADO.</b></p>
      <p style="margin: 0 0 6px 0;"><b>LÍMITE DE LA RESPONSABILIDAD.</b> ${termsContent2[1].text}</p>
      <p style="margin: 0 0 6px 0;"><b>PROGRAMAS BAJO LICENCIA.</b> ${termsContent2[2].text}</p>
      <p style="margin: 0 0 6px 0;"><b>COTIZACIONES.</b> ${termsContent2[5].text}</p>
      <p style="margin: 0 0 6px 0;"><b>PRECIOS.</b> ${termsContent2[6].text}</p>
      <p style="margin: 0 0 6px 0;"><b>CAMBIOS.</b> ${termsContent2[7].text}</p>
      <p style="margin: 0 0 6px 0;"><b>DEVOLUCIONES.</b> ${termsContent2[8].text}</p>
    </div>
    
    <div style="color: #800020; font-size: 9pt; font-weight: bold; margin-top: 10px; margin-bottom: 5px; border-bottom: 0.5px solid #800020; padding-bottom: 2px;">
      POLÍTICA DE CAMBIOS Y DEVOLUCIONES
    </div>
    <ul style="margin: 0; padding-left: 15px; font-size: 7.6pt; color: #333333; line-height: 1.3;">
      ${politicasItems.map(item => `<li style="list-style-type: circle; margin-bottom: 3px; text-align: justify;">${item}</li>`).join('')}
    </ul>
  `;

  // Helper to wrap content with Page frame
  const renderPageHTML = (contentHTML, pageNum) => {
    return `
      <div class="page" id="page-${pageNum}" style="width: 816px; height: 1056px; box-sizing: border-box; padding: 50px 60px 70px 60px; position: relative; background-color: #ffffff; overflow: hidden; font-family: Arial, sans-serif; float: left;">
        <!-- Watermark logo -->
        <img src="/assets/logos/centro.png" style="position: absolute; left: 243px; top: 363px; width: 330px; height: 330px; opacity: 0.06; z-index: 0;" />
        
        <!-- Header -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; z-index: 10; position: relative; font-family: Arial, sans-serif;">
          <tr>
            <td style="width: 50%; text-align: left; vertical-align: top;">
              <div style="font-weight: bold; font-size: 9.5pt; color: #000000; line-height: 1.2;">${(cot.clientes?.nombre || '').toUpperCase()}</div>
              ${cot.clientes?.cargo ? `<div style="font-size: 8pt; color: #555555; margin-top: 2px;">${cot.clientes.cargo.toUpperCase()}</div>` : ''}
              ${cot.clientes?.empresa ? `<div style="font-weight: bold; font-size: 8pt; color: #000000; margin-top: 2px;">${cot.clientes.empresa.toUpperCase()}</div>` : ''}
            </td>
            <td style="width: 50%; text-align: right; vertical-align: top;">
              <div style="font-size: 8pt; color: #000000;">EL MARQUÉS, QRO A ${fmtDate(cot.created_at)}</div>
              <div style="font-weight: bold; font-size: 10.5pt; color: #800020; margin-top: 2px;">COTIZACION ${cot.folio || cot.id || 'S/N'}</div>
              ${cot.titulo ? `<div style="font-weight: bold; font-size: 9pt; color: #800020;">${cot.titulo.toUpperCase()}</div>` : ''}
              ${cot.descripcion ? `<div style="font-size: 7.5pt; color: #555555; max-width: 320px; display: inline-block; margin-top: 2px;">${cot.descripcion}</div>` : ''}
            </td>
          </tr>
        </table>
        
        <div style="border-bottom: 0.5px solid #d3d3d3; margin-bottom: 15px; width: 100%; z-index: 10; position: relative;"></div>
        
        <!-- Content Area -->
        <div style="height: 830px; z-index: 10; position: relative;">
          ${contentHTML}
        </div>
        
        <!-- Footer -->
        <div style="position: absolute; bottom: 30px; left: 60px; right: 60px; border-top: 0.3px solid #d3d3d3; padding-top: 6px; text-align: center; font-size: 7.5pt; color: #777777; font-family: Arial, sans-serif; z-index: 10;">
          Tel. (442) 773 4562 Y 6691732 correo: centroecging@gmail.com
          <div style="float: right; font-weight: bold; color: #555555;">Página ${pageNum} de ${totalPages}</div>
        </div>
      </div>
    `;
  };

  // ── Construct full pages wrapper HTML ─────────────────────────────────────
  let pagesHTML = '';
  if (page1bRows.length === 0) {
    pagesHTML += renderPageHTML(page1Content, 1);
    pagesHTML += renderPageHTML(page2Content, 2);
    pagesHTML += renderPageHTML(page3Content, 3);
    pagesHTML += renderPageHTML(page4Content, 4);
  } else {
    pagesHTML += renderPageHTML(page1Content, 1);
    pagesHTML += renderPageHTML(page1bContent, 2);
    pagesHTML += renderPageHTML(page2Content, 3);
    pagesHTML += renderPageHTML(page3Content, 4);
    pagesHTML += renderPageHTML(page4Content, 5);
  }

  if (isEditable) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cotización ${cot.folio || cot.id || 'S/N'}</title>
          <style>
            @media print {
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .page {
                box-shadow: none !important;
                border: none !important;
                float: none !important;
                page-break-after: always;
                page-break-inside: avoid;
                margin: 0 !important;
              }
            }
            body {
              margin: 0;
              background-color: #f3f4f6;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .page {
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              margin: 20px;
              border: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          ${pagesHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    return;
  }

  // ── Append hidden container to DOM ────────────────────────────────────────
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '816px';
  container.style.backgroundColor = '#f0f0f0';
  document.body.appendChild(container);
  container.innerHTML = pagesHTML;

  // Wait for all images inside container to load
  const images = container.querySelectorAll('img');
  const imgPromises = Array.from(images).map(img => {
    return new Promise(res => {
      if (img.complete) res();
      else {
        img.onload = res;
        img.onerror = res;
      }
    });
  });
  await Promise.all(imgPromises);

  // Wait a moment for browser layout recalculation
  await new Promise(res => setTimeout(res, 400));

  // ── Initialize and render JPEGs into jsPDF ────────────────────────────────
  const doc = new jsPDF({
    unit: 'mm',
    format: 'letter'
  });

  const pageNodes = container.querySelectorAll('.page');
  for (let i = 0; i < pageNodes.length; i++) {
    const pageNode = pageNodes[i];
    const canvas = await html2canvas(pageNode, {
      scale: 2, // Generates high-res image
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      doc.addPage();
    }
    // Letter format in mm is 215.9 x 279.4
    doc.addImage(imgData, 'JPEG', 0, 0, 215.9, 279.4);
  }

  // Save the PDF file
  const clientName = (cot.clientes?.nombre || 'Cliente').replace(/\s+/g, '_');
  const fileName = `Cotizacion_${cot.folio || cot.id}_${clientName}.pdf`;
  doc.save(fileName);

  // Clean up DOM
  document.body.removeChild(container);
};
