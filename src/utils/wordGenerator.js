/**
 * Generates an editable Word (.doc) document for a quotation matching the corporate ECG style.
 * @param {Object} cot - Quotation data
 */
export const generateCotizacionWord = (cot) => {
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

  // ── Generate HTML Content ──────────────────────────────────────────────────
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Cotización</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body {
          font-family: 'Arial', sans-serif;
          font-size: 10pt;
          color: #333333;
          line-height: 1.3;
          margin: 20mm 15mm 20mm 15mm;
        }
        h1, h2, h3, h4 {
          color: #000000;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .header-left {
          width: 50%;
          text-align: left;
          vertical-align: top;
        }
        .header-right {
          width: 50%;
          text-align: right;
          vertical-align: top;
        }
        .title-red {
          color: #cc0000;
          font-size: 11pt;
          font-weight: bold;
        }
        .line-gray {
          border-bottom: 1.5px solid #d3d3d3;
          margin: 10px 0 20px 0;
        }
        .intro-text {
          font-size: 9.5pt;
          color: #333333;
          margin-bottom: 20px;
          text-align: justify;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 9pt;
        }
        .items-table th {
          background-color: #cc0000;
          color: #ffffff;
          font-weight: bold;
          text-align: center;
          padding: 6px;
          border: 1px solid #d3d3d3;
        }
        .items-table td {
          padding: 6px;
          border: 1px solid #d3d3d3;
          vertical-align: top;
        }
        .row-category {
          background-color: #eeeeee;
          font-weight: bold;
          text-align: center;
        }
        .row-cat-letter {
          font-weight: bold;
        }
        .row-total {
          font-weight: bold;
          background-color: #fff0f0;
          color: #cc0000;
        }
        .section-title {
          color: #cc0000;
          font-size: 11pt;
          font-weight: bold;
          margin-top: 15px;
          margin-bottom: 8px;
          border-bottom: 1px solid #cc0000;
          padding-bottom: 2px;
        }
        .bullet-list {
          margin-left: 15px;
          padding-left: 0;
          margin-bottom: 15px;
        }
        .bullet-item {
          list-style-type: circle;
          font-size: 9.5pt;
          margin-bottom: 4px;
          text-align: justify;
        }
        .signature-table {
          width: 100%;
          margin-top: 30px;
          border-collapse: collapse;
        }
        .signature-line {
          border-top: 1px solid #000000;
          width: 250px;
          margin: 0 auto;
        }
        .text-center {
          text-align: center;
        }
        .page-break {
          page-break-before: always;
          clear: both;
        }
        .footer-info {
          text-align: center;
          font-size: 8pt;
          color: #888888;
          border-top: 0.5px solid #d3d3d3;
          padding-top: 5px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>

      <!-- PÁGINA 1: DETALLE DE COTIZACIÓN -->
      <table class="header-table">
        <tr>
          <td class="header-left">
            <div style="font-size: 11pt; font-weight: bold;">${(cot.clientes?.nombre || '').toUpperCase()}</div>
            ${cot.clientes?.cargo ? `<div style="font-size: 9.5pt; color: #555555;">${cot.clientes.cargo.toUpperCase()}</div>` : ''}
            ${cot.clientes?.empresa ? `<div style="font-size: 10pt; font-weight: bold;">${cot.clientes.empresa.toUpperCase()}</div>` : ''}
          </td>
          <td class="header-right">
            <div style="font-size: 9.5pt;">EL MARQUÉS, QRO A ${fmtDate(cot.created_at)}</div>
            <div class="title-red">COTIZACIÓN ${cot.folio || cot.id || 'S/N'}</div>
            ${cot.titulo ? `<div style="font-size: 10pt; font-weight: bold; color: #cc0000;">${cot.titulo.toUpperCase()}</div>` : ''}
            ${cot.descripcion ? `<div style="font-size: 8.5pt; color: #555555; max-width: 300px; display: inline-block;">${cot.descripcion}</div>` : ''}
          </td>
        </tr>
      </table>

      <div class="line-gray"></div>

      <div class="intro-text">
        Por medio de la presente reciba un cordial saludo por parte del todo el personal que colabora en esta empresa, así mismo aprovecho este medio para enviarle la cotización; la cual consta de lo siguiente:
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 8%;">ÍTEM</th>
            <th style="width: 48%;">DESCRIPCIÓN</th>
            <th style="width: 8%;">CANT</th>
            <th style="width: 10%;">UNIDAD</th>
            <th style="width: 13%;">P. UNITARIO</th>
            <th style="width: 13%;">IMPORTE</th>
          </tr>
        </thead>
        <tbody>
          ${tableBody.map(row => {
            if (row.type === 'category') {
              return `
                <tr class="row-category">
                  <td colspan="6">${row.label}</td>
                </tr>
              `;
            } else if (row.type === 'catLetter') {
              return `
                <tr class="row-cat-letter">
                  <td style="text-align: center;">${row.letter}</td>
                  <td><b>${row.label}</b>${row.desc ? `<br/><span style="font-size: 8pt; color: #555555; font-weight: normal;">${row.desc}</span>` : ''}</td>
                  <td style="text-align: center;">${row.cant || ''}</td>
                  <td style="text-align: center;">${row.unidad || ''}</td>
                  <td style="text-align: right;">${row.costoUnit || ''}</td>
                  <td style="text-align: right; font-weight: bold;">${row.importe || ''}</td>
                </tr>
              `;
            } else {
              return `
                <tr>
                  <td style="text-align: center; color: #777777;">${row.item}</td>
                  <td>${row.desc}</td>
                  <td style="text-align: center;">${row.cant}</td>
                  <td style="text-align: center;">${row.unidad}</td>
                  <td style="text-align: right;">${row.costoUnit}</td>
                  <td style="text-align: right;">${row.importe}</td>
                </tr>
              `;
            }
          }).join('')}
          <tr class="row-total">
            <td></td>
            <td style="text-align: right;">TOTAL DE MATERIALES Y MANO DE OBRA</td>
            <td></td>
            <td></td>
            <td></td>
            <td style="text-align: right;">${fmt(grandTotal || cot.total || 0)}</td>
          </tr>
        </tbody>
      </table>

      ${cot.imagen_url ? `
        <div style="text-align: center; margin: 20px 0;">
          <p style="font-size: 8.5pt; color: #777777; margin-bottom: 5px;">Imagen de referencia técnica:</p>
          <img src="${cot.imagen_url}" style="max-width: 250px; max-height: 180px; border: 1px solid #d3d3d3; padding: 4px; border-radius: 4px;" />
        </div>
      ` : ''}

      <div class="footer-info">
        Tel. (442) 773 4562 Y 6691732 correo: centroecging@gmail.com
      </div>


      <!-- PÁGINA 2: CONDICIONES COMERCIALES -->
      <div class="page-break"></div>

      <div class="text-center" style="margin-top: 10px;">
        <h2 style="font-size: 14pt; margin-bottom: 2px;">TIEMPOS DE ENTREGA Y CONDICIONES COMERCIALES</h2>
        <div style="border-bottom: 2px solid #000000; width: 420px; margin: 0 auto; margin-bottom: 25px;"></div>
      </div>

      <div class="section-title">TIEMPOS DE ENTREGA</div>
      <ul class="bullet-list">
        <li class="bullet-item">${deliveryTimeText}</li>
      </ul>

      <div class="section-title">CONDICIONES COMERCIALES</div>
      <ul class="bullet-list">
        <li class="bullet-item">Los precios son expresados en PESOS MEXICANOS MNX</li>
        <li class="bullet-item">Los precios no incluyen el 16% I.V.A.</li>
        <li class="bullet-item">Se requiere Emisión de orden de compra a favor de centro de ingeniería y abastecimiento ECG</li>
        <li class="bullet-item">100 % del importe de materiales.</li>
        <li class="bullet-item">50% de anticipo del importe de mano de obra y 50% restante a los 15 días de haber entregado el equipo funcionando.</li>
        <li class="bullet-item">Vigencia de cotización: 10 días naturales.</li>
        <li class="bullet-item">La elaboración de esta cotización se basa en la información que nos proporciona el cliente.</li>
        <li class="bullet-item">Es obligación del cliente revisar y aprobar la presente cotización, si existiera algún faltante o diferencia de acuerdo con sus necesidades será necesaria una nueva cotización.</li>
      </ul>

      <div class="section-title">GARANTÍAS</div>
      <ul class="bullet-list">
        <li class="bullet-item">1 AÑO DE GARANTÍA EN EQUIPO Y MATERIALES</li>
      </ul>

      <div style="font-size: 9.5pt; text-align: justify; margin: 25px 0 35px 0; color: #333333;">
        Sin más por el momento y en espera de poder ser parte de su éxito, quedamos a sus más apreciables órdenes.
      </div>

      <div class="text-center" style="margin-bottom: 30px;">
        <b>ATENTAMENTE</b>
      </div>

      <table class="signature-table">
        <tr>
          <td class="text-center">
            <div class="signature-line"></div>
            <div style="font-size: 10pt; font-weight: bold; color: #cc0000; margin-top: 6px;">ING. JUAN ERASMO CUAYA GRANADOS</div>
            <div style="font-size: 9pt; font-weight: bold; color: #333333;">CED. PROF. 8101909</div>
            <div style="font-size: 9pt; font-weight: bold; color: #333333; margin-bottom: 10px;">REPSE 576749</div>
            <div style="font-size: 9.5pt; font-weight: bold; color: #cc0000; font-style: italic;">NUESTRO ÉXITO DEPENDE DEL ÉXITO DE NUESTROS CLIENTES</div>
          </td>
        </tr>
      </table>

      <div class="footer-info" style="margin-top: 40px;">
        Tel. (442) 773 4562 Y 6691732 correo: centroecging@gmail.com
      </div>


      <!-- PÁGINA 3: TÉRMINOS DE VENTA -->
      <div class="page-break"></div>

      <div class="text-center" style="margin-top: 10px; margin-bottom: 15px;">
        <h3 style="font-size: 12pt; text-transform: uppercase;">TÉRMINOS DE VENTA CENTRO DE INGENIERIA Y ABASTECIMIENTO ECG SA DE CV</h3>
        <div style="border-bottom: 1px solid #000000; width: 100%; margin-top: 4px;"></div>
      </div>

      <div style="font-size: 8pt; text-align: justify; space-y: 8px;">
        <p><b>GENERAL.</b> Estos términos y condiciones de venta (junto con cualquier cotización o especificación por escrito del Vendedor directamente asociada) gobernará exclusivamente la venta o licencia otorgada por el Vendedor de todos los productos y servicios (incluyendo sin limitación, productos para equipamiento, software y programas, capacitación, programación, mantenimiento, ingeniería, repuestos y servicios de reparación colectivamente los "Productos") otorgados bajo la presente. Ninguna adición o modificación a estos términos y condiciones será obligatoria para centro de ingeniería y abastecimiento e. (denominado en lo sucesivo como "CENTRO ECG") a menos que haya indicado su acuerdo por escrito firmado por su representante autorizado. El Vendedor no reconoce otro u otros términos y condiciones que puedan ser opuestos por el cliente que no sean de otra manera consistente con estos u otros términos y condiciones fijados en la cotización, especificación o aceptación del pedido del Vendedor.</p>
        
        <p><b>TÉRMINOS DE PAGO.</b> Salvo que se disponga algo diferente por escrito por el Vendedor en una Cotización o en relación a una aceptación del Pedido, los términos de pago son 50% ANTICIPO desde la fecha de la factura con crédito continuo (PREVIA A PROBACIÓN DE CENTRO ECG) aprobado según lo determine CENTRO ECG, anticipadamente y/o contra la entrega del material en los casos en que no se tenga crédito. La liquidación de las facturas de venta se hará en la misma moneda en que se haya acordado la misma y que se haya aceptado el pedido el vendedor. En caso de pago de facturas en moneda nacional que hayan sido realizadas en otra moneda, el tipo de cambio a considerar será el libre bancario vigente a la fecha de pago y CENTRO ECG se reserva el derecho a determinar la institución que lo fije. CENTRO ECG se reserva el derecho de suspender cualquier cumplimiento adicional bajo este contrato o de cualquier otra obligación para con el cliente en el caso de que el pago no sea realizado a término. No se permite ningún pago por compensación o penalización a menos que haya sido aprobado por CENTRO ECG.</p>
        
        <p><b>TÉRMINOS DE ENTREGA.</b> Los términos de entrega son LAB en el almacén del cliente siempre y cuando se encuentre dentro del estado de Querétaro. En lo que respecta a los costos de envío, riesgo de pérdida y transferencia del título, excepto el título a todos los derechos a la propiedad intelectual asociados con los Productos, (por ejemplo, programas) siguen siendo determinados por CENTRO ECG (o sus proveedores y licenciantes), y dichos Productos son puestos a disposición o bajo licencia para ser usados por el cliente según este contrato u otro contrato de licencia del Vendedor o sus proveedores.</p>
        
        <p><b>GARANTÍAS.</b></p>
        <p><b>A. EQUIPO:</b> Salvo que se disponga algo diferente por escrito por el Vendedor en una Cotización o en la aceptación del Pedido, CENTRO ECG como intermediario, tramitará la garantía correspondiente de acuerdo con las condiciones otorgadas por el fabricante del equipo al asegurar que los Productos o Equipos entregados bajo la presente serán de calidad comercializable, libre de defectos de material, mano de obra o diseño. Igualmente se tramitará, los Productos o Equipos reparados o cambiados bajo la garantía.</p>
        <p><b>B. PROGRAMAS:</b> A menos que se haya indicado lo contrario en el contrato de licencia del Vendedor o de terceros, el Vendedor garantiza por el período marcado por el Fabricante, que los Productos estándar de programas entregados bajo el presente, cuando se les usa con el equipo especificado por el Vendedor, funcionarán de acuerdo con las especificaciones publicadas, preparadas, aprobadas y emitidas por el Fabricante. El Vendedor no hace representación alguna o garantía, expresa o implícitamente, que el funcionamiento de los Productos de programas será ininterrumpido o sin errores, o que las funciones contenidas en el mismo cumplirán a satisfacción el uso o los requisitos especificados por el Cliente.</p>
        <p><b>C. REPARACIÓN EN FABRICA Y CAMBIO:</b> El Vendedor garantiza que los Productos de equipamiento cobrables o fuera de garantía cambiados o reparados en fábrica por el fabricante y provistos bajo la presente estarán libres de defectos de material y mano de obra. Los Productos entregados como cambio pueden ser nuevos o reacondicionados.</p>
        <p><b>D. SERVICIO:</b> El Vendedor garantiza que los Productos compuestos de servicios, incluyendo los servicios de programación de ingeniería y programas especiales, ya sean provistos a costo fijo o sobre la base de tiempo y materiales, serán provistos de acuerdo con las prácticas de la industria generalmente aceptadas, en la medida que dichos servicios estén sujetos a un criterio de aceptación por escrito que el Vendedor ha aceptado con anticipación. Se renuncia a todas las otras garantías relacionadas con los servicios provistos.</p>
        <p><b>E. ESPECIFICACIONES DEL CLIENTE:</b> El Vendedor no garantiza y no será responsable por el diseño, materiales o criterio de construcción entregado o especificado por el Cliente e incorporado en los Productos o para Productos fabricados por o comprados de otros fabricantes o vendedores especificados por el Cliente. Cualquier garantía aplicable a dichos Productos especificados por el Cliente se limitará solamente a la garantía, si la hubiera, extendida por el fabricante o vendedor original que no sea el Vendedor en la medida permitida en dicha garantía.</p>
      </div>

      <div class="footer-info">
        Tel. (442) 773 4562 Y 6691732 correo: centroecging@gmail.com
      </div>


      <!-- PÁGINA 4: GARANTÍAS Y DEVOLUCIONES -->
      <div class="page-break"></div>

      <div style="font-size: 8pt; text-align: justify; space-y: 8px; margin-top: 10px;">
        <p><b>H. LAS GARANTÍAS ANTERIORES SE OFRECEN EN LUGAR DE TODAS LAS OTRAS GARANTÍAS, YA SEAN EXPRESAS, IMPLÍCITAS O ESTATUTARIAS, INCLUYENDO GARANTÍAS IMPLÍCITAS DE COMERCIABILIDAD O APTITUD PARA UN USO PARTICULAR, O GARANTÍAS DE RENDIMIENTO O APLICACIÓN, Y SE EXTIENDE SOLAMENTE A CLIENTES QUE COMPRAN DEL VENDEDOR O SU DISTRIBUIDOR AUTORIZADO.</b></p>
        
        <p><b>LÍMITE DE LA RESPONSABILIDAD.</b> EN NINGÚN CASO SERÁ EL VENDEDOR RESPONSABLE POR DAÑOS INCIDENTALES, INDIRECTOS O CONSECUENTES DE NINGÚN TIPO. LA RESPONSABILIDAD ACUMULATIVA MÁXIMA DEL VENDEDOR EN RELACIÓN CON TODOS LOS OTROS RECLAMOS Y RESPONSABILIDADES, INCLUYENDO LA RESPONSABILIDAD CON RESPECTO A DAÑOS Y OBLIGACIONES DIRECTAS BAJO CUALQUIER TEORÍA LEGAL O EQUITATIVA, SE ASEGURARÁ O NO, NO EXCEDERÁ EL COSTO DE LOS PRODUCTOS QUE DAN ORIGEN AL RECLAMO O RESPONSABILIDAD. CUALQUIER ACCIÓN EN CONTRA DEL VENDEDOR DEBE SER PRESENTADA DENTRO DE LOS DIECIOCHO (18) MESES DESPUÉS DE QUE OCURRA LA CAUSA DE LA ACCIÓN. ESTAS RENUNCIAS Y LIMITACIONES DE RESPONSABILIDAD SE APLICARÁN SOBRE CUALQUIER OTRA DISPOSICIÓN EN CONTRARIO INCLUIDAS EN ESTE CONTRATO Y SIN CUIDADO DE LA FORMA DE ACCIÓN, YA SEA CONTRACTUAL, POR DISPOSICIÓN DE LEY O DE CUALQUIER OTRA MANERA, Y SE EXTENDERÁ ADEMÁS PARA EL BENEFICIO DE LOS PROVEEDORES DEL VENDEDOR, DISTRIBUIDORES Y OTROS REVENDEDORES AUTORIZADOS COMO TERCEROS BENEFICIARIOS.</p>
        
        <p><b>PROGRAMAS BAJO LICENCIA.</b> Los Productos compuestos por programas pueden estar sujetos a términos y condiciones adicionales indicadas en los contratos de licencia del Vendedor separados que controlarán en la medida necesaria la resolución de cualquier conflicto con los términos y condiciones indicados en el presente.</p>
        
        <p><b>COTIZACIONES.</b> Las cotizaciones por escrito son válidas durante 15 días desde la fecha de emisión a menos que se indique lo contrario con excepción de las expresadas en dólares ya que tienen vigencia de 24 horas y si el tipo de cambio sufre una variación mayor al 2%, pierde su validez. Las existencias especificadas en las mismas están sujetas a previo. Todos los errores especialmente los tipográficos están sujetos a corrección.</p>
        
        <p><b>PRECIOS.</b> Los precios y cualquier otra información indicada en cualquier publicación del Vendedor están sujetos a cambio sin notificación y serán confirmados por cotización específica. Será a cargo del cliente el Impuesto al Valor Agregado o cualquier otro impuesto similar.</p>
        
        <p><b>CAMBIOS.</b> Los cambios en el pedido solicitados por el cliente, incluyendo los que afecten la identidad, alcance y entrega de los Productos deben de constar por escrito, están sujetos a la Política de Cambios y Devoluciones vigente para el cliente y están también a la aprobación previa del Vendedor, a los ajustes en los precios, programación y otros términos y condiciones que se afecten.</p>
        
        <p><b>DEVOLUCIONES.</b> Todas las devoluciones de Productos estarán sujetas a la aprobación previa del Vendedor y a la Política de Cambios y Devoluciones del mismo. Las devoluciones de productos no garantizados sin usar y vendibles a cambio de crédito estarán sujetas a las políticas de devoluciones del Vendedor en efecto en dicho momento, incluyendo los cargos correspondientes de re almacenaje de dicha mercancía y otras condiciones de devolución.</p>

        <div class="section-title">POLÍTICA DE CAMBIOS Y DEVOLUCIONES</div>
        <ul class="bullet-list" style="font-size: 8pt;">
          <li class="bullet-item">Toda devolución o cambio deberá notificarse al Vendedor en un plazo no mayor de 10 días después de la entrega del mismo.</li>
          <li class="bullet-item">Todas las devoluciones autorizadas generarán la Nota de Crédito correspondiente después de su recepción y aprobación de la inspección en el Almacén.</li>
          <li class="bullet-item">Se aplicará un cargo especificado por el Vendedor del valor del producto devuelto, cuando la causa de la devolución no sea imputable a CENTRO ECG y sea por solicitud del cliente.</li>
          <li class="bullet-item">No procederá la devolución por causas no imputables a CENTRO ECG, de productos cuando estos corresponden a:</li>
          <li class="bullet-item">Productos de clasificación "C" y "Z" (Productos de poco movimiento para CENTRO ECG o especiales).</li>
          <li class="bullet-item">Productos Obsoletos.</li>
          <li class="bullet-item">Productos cuya aprobación signifique a ECG INGENIERIA Y MANTENIMIENTO el tener más de 6 meses de inventario.</li>
        </ul>
      </div>

      <div class="footer-info">
        Tel. (442) 773 4562 Y 6691732 correo: centroecging@gmail.com
      </div>

    </body>
    </html>
  `;

  // ── Trigger Download ───────────────────────────────────────────────────────
  const clientName = (cot.clientes?.nombre || 'Cliente').replace(/\s+/g, '_');
  const fileName = `Cotizacion_${cot.folio || cot.id}_${clientName}.doc`;
  
  const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
