/**
 * Generates an editable Word (.doc) document for a Dictamen matching the corporate ECG style.
 * @param {Object} dictamen - Dictamen data
 */
export const generateDictamenWord = (dictamen) => {
  const fmtDate = (iso) => {
    if (!iso) return '—';
    const date = new Date(iso);
    const months = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    return `${date.getDate()} DE ${months[date.getMonth()]} DE ${date.getFullYear()}`;
  };

  const logoUrl = '/assets/logos/Dictaminacion.png';

  const watermark = `<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);opacity:0.04;z-index:-1;pointer-events:none;"><img src="${logoUrl}" style="width:300px;height:300px;" /></div>`;

  const headerHtml = (numPagina) => `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-family: Arial, sans-serif;">
      <tr>
        <td style="width: 50%; text-align: left; vertical-align: middle;">
          <div style="font-size: 11pt; font-weight: bold; color: #800020;">CENTRO DE INGENIERÍA ECG</div>
        </td>
        <td style="width: 50%; text-align: right; vertical-align: middle; font-size: 8pt; color: #444;">
          <div style="font-weight: bold;">CARTA DICTAMEN ${dictamen.numero_carta || 'S/N'} ${dictamen.nombre_comercial_header || ''}</div>
          <div style="color: #800020; font-weight: bold; margin-top: 2px;">FECHA DE EMISIÓN: ${dictamen.lugar_emision || ''}, A ${dictamen.fecha_emision || ''}</div>
          <div style="color: #800020; font-weight: bold; margin-top: 1px;">FECHA DE VENCIMIENTO: ${dictamen.lugar_vencimiento || ''}, A ${dictamen.fecha_vencimiento || ''}</div>
        </td>
      </tr>
    </table>
    <div style="border-bottom: 2.5px double #800020; margin: 4px 0 10px 0;"></div>
  `;

  const footerHtml = `
    <div style="margin-top: 30px; border-top: 1px solid #800020; padding-top: 6px; font-size: 7.5pt; font-family: Arial, sans-serif; color: #444;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; text-align: left;">
            <b>Teléfono:</b> ${dictamen.telefono_ing || '442 6767490'}
          </td>
          <td style="width: 50%; text-align: right;">
            <b>Correo:</b> ${dictamen.correo || 'adm.securus.consultoria@gmail.com'}
          </td>
        </tr>
      </table>
    </div>
  `;

  const signatureBlock = `
    <div style="text-align: center; margin-top: 40px; font-family: Arial, sans-serif;">
      <div style="font-size: 11pt; font-weight: bold; font-family: 'Times New Roman', serif; letter-spacing: 1px; margin-bottom: 25px;">ATENTAMENTE.</div>
      <div style="border-top: 1px solid #444; width: 250px; margin: 0 auto 5px auto;"></div>
      <div style="font-size: 9pt; font-weight: bold;">${dictamen.nombre_firma || ''}</div>
      <div style="font-size: 7.5pt; color: #444;">${dictamen.ced_firma || ''}</div>
      <div style="font-size: 7.5pt; color: #444;">${dictamen.seg_firma || ''}</div>
    </div>
  `;

  // Photo cell helper
  const makeFotoCell = (src, idx) => {
    if (src) {
      return `<td style="border: 1px solid #bbb; padding: 4px; width: 33%; text-align: center; vertical-align: middle;">
        <img src="${src}" style="width: 180px; height: 135px; object-fit: cover;" />
        <div style="font-size: 7pt; color: #666; margin-top: 2px;">Foto ${idx + 1}</div>
      </td>`;
    }
    return `<td style="border: 1px solid #bbb; padding: 4px; width: 33%; height: 140px; background: #f9f9f9; text-align: center; color: #999; font-size: 8pt; vertical-align: middle;">[Sin Foto]</td>`;
  };

  // Accreditation cell helper
  const makeAcredCell = (src, idx) => {
    if (src) {
      return `<td style="border: 1px solid #bbb; padding: 6px; width: 50%; text-align: center; vertical-align: middle;">
        <img src="${src}" style="width: 250px; height: 185px; object-fit: contain;" />
        <div style="font-size: 7pt; color: #666; margin-top: 2px;">Documento ${idx + 1}</div>
      </td>`;
    }
    return `<td style="border: 1px solid #bbb; padding: 6px; width: 50%; height: 190px; background: #f9f9f9; text-align: center; color: #999; font-size: 8pt; vertical-align: middle;">[Sin Documento]</td>`;
  };

  const fotos = dictamen.fotos || ['', '', '', '', '', ''];
  const acreds = dictamen.acreditaciones || ['', '', '', '', '', ''];

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Carta Dictamen</title>
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
          font-size: 9.5pt;
          color: #333333;
          line-height: 1.4;
          margin: 20mm 15mm 20mm 15mm;
        }
        h1, h2, h3, h4 {
          color: #000000;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .text-justify {
          text-align: justify;
        }
        .font-bold {
          font-weight: bold;
        }
        .page-break {
          page-break-before: always;
          clear: both;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5pt;
          margin: 15px 0;
        }
        .data-table td {
          border: 1px solid #bbbbbb;
          padding: 6px 8px;
          vertical-align: middle;
        }
        .bg-light {
          background-color: #f5f5f5;
          font-weight: bold;
          color: #555555;
        }
        .title-section {
          font-size: 11pt;
          font-weight: bold;
          text-align: center;
          text-decoration: underline;
          margin: 15px 0 10px 0;
        }
      </style>
    </head>
    <body>

      <!-- PÁGINA 1: CARTA DICTAMEN -->
      ${headerHtml(1)}
      
      <p class="text-justify" style="margin-bottom: 15px;">
        Por medio del presente recibe un cordial saludo por parte del personal que laboramos en esta empresa. El que suscribe
        <strong>${dictamen.ing_nombre || ''}</strong> con cédula profesional. <strong>${dictamen.cedula || ''}</strong>,
        registro en el colegio <strong>${dictamen.colegio || ''}</strong> y con domicilio para oír y recibir notificaciones en
        <strong>${dictamen.domicilio_notificaciones || ''}</strong>, con teléfono. <strong>${dictamen.telefono_ing || ''}</strong>
        Informo que he revisado las instalaciones cuyos datos se indican a continuación:
      </p>

      <table class="data-table">
        <tr>
          <td class="bg-light" style="width: 22%;">TIPO DE INSTALACIÓN</td>
          <td style="width: 20%; font-weight: bold;">${dictamen.tipo_instalacion || ''}</td>
          <td class="bg-light" style="width: 20%;">TIPO DE ACOMETIDA</td>
          <td style="width: 18%;">${dictamen.tipo_acometida || ''}</td>
          <td class="bg-light" style="width: 20%;">BAJA TENSIÓN LÍNEAS CFE</td>
          <td style="width: 20%;">${dictamen.baja_tension || ''}</td>
          <td class="bg-light" style="width: 20%;">VOLTAJE DE ALIMENTACIÓN</td>
          <td style="font-weight: bold;">${dictamen.voltaje_alimentacion || ''}</td>
        </tr>
        <tr>
          <td class="bg-light">CLASIFICACIÓN DE RIESGO</td>
          <td colspan="7" style="font-weight: bold;">${dictamen.clasificacion_riesgo || ''}</td>
        </tr>
        <tr>
          <td class="bg-light">GIRO SEGÚN SCIAN</td>
          <td colspan="5">${dictamen.giro_scian || ''}</td>
          <td class="bg-light">SCIAN</td>
          <td>${dictamen.scian_codigo || ''}</td>
        </tr>
        <tr>
          <td class="bg-light">NOMBRE COMERCIAL</td>
          <td colspan="7" style="font-weight: bold;">${dictamen.nombre_comercial || ''}</td>
        </tr>
        <tr>
          <td class="bg-light">RAZÓN SOCIAL</td>
          <td colspan="7">${dictamen.razon_social || ''}</td>
        </tr>
        <tr>
          <td class="bg-light">RFC / CURP</td>
          <td colspan="7">${dictamen.rfc_curp || ''}</td>
        </tr>
        <tr>
          <td class="bg-light">NOMBRE PROPIETARIO / REP. LEGAL</td>
          <td colspan="7">${dictamen.nombre_propietario || ''}</td>
        </tr>
        <tr>
          <td class="bg-light">DIRECCIÓN</td>
          <td colspan="7">${dictamen.direccion || ''}</td>
        </tr>
        <tr>
          <td class="bg-light">TELÉFONO</td>
          <td colspan="3">${dictamen.telefono || ''}</td>
          <td class="bg-light">CORREO</td>
          <td colspan="3">${dictamen.correo || ''}</td>
        </tr>
      </table>

      <p class="text-justify" style="margin-bottom: 12px;">
        Asimismo, declaro bajo protesta de decir verdad que las instalaciones eléctricas cumplen con las normas y reglamentos aplicables
        en materia de seguridad y que, al no haber encontrado fallas ni inconveniencias, considero que esta instalación puede funcionar
        bajo condiciones de riesgo en su operación normal por lo queda aprobada tal y como actualmente se encuentran.
      </p>
      
      <p class="text-justify" style="margin-bottom: 15px;">
        También se informa que el usuario y/o sus representantes han sido enterados que el cuidado y mantenimiento es su
        responsabilidad y que <strong>cualquier cambio a las instalaciones aprobadas en este documento se me deberá notificar para su
        revisión y aprobación ANTES de hacer la modificación y que estas deberán ser realizadas por personal calificado y
        certificado.</strong> <span style="color: #800020; font-weight: bold;">La falta de cumplimiento de lo anterior invalida la presente aprobación.</span>
      </p>
      
      <p style="margin-bottom: 25px;">Sin más por el momento y en espera de poder parte de su éxito, quedo a sus órdenes.</p>

      ${signatureBlock}
      ${footerHtml}


      <!-- PÁGINA 2: NORMATIVIDAD -->
      <div class="page-break"></div>
      ${headerHtml(2)}
      
      <div class="title-section">NORMATIVIDAD</div>
      <p class="text-justify" style="margin-bottom: 15px;">
        Reglamento de Construcción para el Mpio. de Querétaro: Arts. 1, 3, 199 a 203 [aplicado supletoriamente a otros Municipios],
        y/o Reglamento de Construcción para el Mpio de San Juan del Río: Código Urbano para el Edo. De Querétaro: Art. 1, Fracción
        X; Art. 20 del Reglamento de Protección Civil del Municipio de Querétaro, (y demás aplicables del Estado y/o Municipios de
        Querétaro), basadas en la Normatividad de Referencia: NOM-001-SEDE-2012 y a lo estipulado en la "Ley Federal sobre
        Metrología y Normalización", en la "Ley del Servicio Público de Energía Eléctrica", en el "Reglamento de la Ley del Servicio
        Público de Energía Eléctrica", así como en las NOM´s y NMX´s que puedan ser aplicables (del sector Salud, Laboral, Ecológico,
        Agropecuario y/o Energético) y/o tratándose de instalaciones especiales y/o peligrosas.
      </p>

      <div class="title-section">COMPROMISOS DEL "USUARIO"</div>
      <p class="text-justify" style="margin-bottom: 10px;">
        <strong>CONSTRUCCIÓN, AMPLIACIÓN O CORRECCIÓN</strong> - De acuerdo al Art. 28 de la "Ley del Servicio Público de Energía Eléctrica",
        corresponde al USUARIO realizar a su costa y bajo su responsabilidad, las obras e instalaciones destinadas al uso de la energía
        eléctrica, mismas que deberán satisfacer los requisitos técnicos y de seguridad que fijen las Normas Oficiales Mexicanas.
      </p>
      <p class="text-justify" style="margin-bottom: 15px;">
        <strong>MANTENIMIENTO Y CONSERVACIÓN.</strong> - La obligación de conservar la instalación en condiciones de recibir en forma segura y
        permanente el suministro de energía eléctrica corresponde al USUARIO, a quien la CFE o terceros podrá imputar la
        responsabilidad de los daños que por defecto en sus instalaciones puedan ser causados según el Art. 34 del "Reglamento de la
        Ley del Servicio Público de Energía Eléctrica". USO EFICIENTE Y SEGURO - El cumplimiento de las disposiciones indicadas en la
        NOM-001-SEDE-2015 garantiza el uso de la energía eléctrica en forma segura, sin embargo la responsabilidad en el uso de la
        energía eléctrica es exclusiva del USUARIO y de su personal, el cual deberá estar capacitado para operar la instalación, según
        se establece en el Art. 5.1 de la citada NOM.
      </p>

      <div class="title-section">COMPROMISOS DEL "DICTAMINADOR"</div>
      <p class="text-justify" style="margin-bottom: 10px;">
        Brindar asesoría al USUARIO para que dé cumplimiento a la normatividad municipal y estatal en la materia. Otorgar si procede,
        el documento denominado dictamen de Seguridad y Operación, entregado por parte del DICTAMINADOR al USUARIO, donde de
        manera explícita y exclusiva se hace constar que las instalaciones eléctricas propiedad del USUARIO cumplen en esta fecha con
        la normatividad municipal y estatal en materia de protección civil acorde a la NOM-001-SEDE-2012 y demás aplicables, a fin de
        que ofrezcan condiciones adecuadas de seguridad para las personas y sus propiedades, en lo referente a protección contra
        choque eléctrico, efectos térmicos, sobre corrientes, corrientes de falla, sobretensiones y fenómenos atmosféricos en
        subestaciones de alta tensión y edificios con altura mayor a 12 mts.
      </p>
      
      <p class="text-justify" style="color: #800020; font-weight: bold; margin-bottom: 8px;">
        Sin embargo, el DICTAMINADOR no se hace responsable de las siguientes acciones que pueda emprender el USUARIO a
        partir de la entrega del dictamen:
      </p>
      <ul style="list-style: none; padding-left: 10px; margin-bottom: 12px;">
        <li style="margin-bottom: 4px;">○ Realizar ampliaciones, modificaciones o alteraciones a la instalación.</li>
        <li style="margin-bottom: 4px;">○ Realizar sustituciones o conexiones de equipo de utilización que no esté especificado en los planos y/o memorias correspondientes a este proyecto.</li>
      </ul>
      
      <p class="text-justify" style="color: #800020; font-weight: bold; font-style: italic; margin-bottom: 8px;">
        Asimismo, se excluye al DICTAMINADOR de la responsabilidad derivada de cualquier otra acción que proviniendo de:
      </p>
      <ul style="list-style: none; padding-left: 10px; margin-bottom: 25px;">
        <li style="margin-bottom: 4px;">○ Mal manejo de productos, herramientas o equipos.</li>
        <li style="margin-bottom: 4px;">○ El mal uso que el usuario pueda darle a las instalaciones eléctricas.</li>
        <li style="margin-bottom: 4px;">○ Accidentes de trabajo provocados por imprudencias laborales, sabotaje, desórdenes sociales, vandalismo, guerra o terrorismo, fenómenos naturales, y cualquier otra causa ajena a la operación normal de la instalación, produzca un daño parcial o total, temporal o permanente a la instalación.</li>
      </ul>

      ${signatureBlock}
      ${footerHtml}


      <!-- PÁGINA 3: REPORTE FOTOGRÁFICO -->
      <div class="page-break"></div>
      ${headerHtml(3)}
      
      <div class="title-section">REPORTE FOTOGRÁFICO</div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
          ${makeFotoCell(fotos[0], 0)}
          ${makeFotoCell(fotos[1], 1)}
          ${makeFotoCell(fotos[2], 2)}
        </tr>
        <tr>
          ${makeFotoCell(fotos[3], 3)}
          ${makeFotoCell(fotos[4], 4)}
          ${makeFotoCell(fotos[5], 5)}
        </tr>
      </table>
      
      <div style="margin-top: 40px;">
        ${signatureBlock}
      </div>
      ${footerHtml}


      <!-- PÁGINA 4: ACREDITACIONES -->
      <div class="page-break"></div>
      ${headerHtml(4)}
      
      <div class="title-section">ACREDITACIONES</div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
          ${makeAcredCell(acreds[0], 0)}
          ${makeAcredCell(acreds[1], 1)}
        </tr>
        <tr>
          ${makeAcredCell(acreds[2], 2)}
          ${makeAcredCell(acreds[3], 3)}
        </tr>
        <tr>
          ${makeAcredCell(acreds[4], 4)}
          ${makeAcredCell(acreds[5], 5)}
        </tr>
      </table>
      
      <div style="margin-top: 45px;">
        ${signatureBlock}
      </div>
      ${footerHtml}

    </body>
    </html>
  `;

  // Trigger Download
  const clientName = (dictamen.nombre_comercial || 'Cliente').replace(/\s+/g, '_');
  const fileName = `Dictamen_${dictamen.numero_carta || 'SN'}_${clientName}.doc`;
  
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
