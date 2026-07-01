import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a secured, flattened (rasterized image-only) PDF for the Puesta a Tierra Report.
 * This prevents text editing, selection, and Word conversion, while maintaining corporate style.
 * @param {Object} reporte - The Earth Resistance Report data
 */
export const generateReportePuestaTierraPDF = async (reporte) => {
  const renderCheckbox = (checked) => {
    return checked
      ? `<span style="font-family: Arial, sans-serif; font-size: 8pt; color: #a91d22; font-weight: bold; border: 1.5px solid #a91d22; padding: 1px 3px; border-radius: 2px; background-color: #fdf2f2; margin-right: 4px; display: inline-block; width: 8px; height: 8px; line-height: 8px; text-align: center; vertical-align: middle;">✓</span>`
      : `<span style="font-family: Arial, sans-serif; font-size: 8pt; color: #d3d3d3; border: 1.5px solid #d3d3d3; padding: 1px 3px; border-radius: 2px; margin-right: 4px; background-color: #ffffff; display: inline-block; width: 8px; height: 8px; line-height: 8px; text-align: center; vertical-align: middle;">&nbsp;</span>`;
  };

  const page1Content = `
    <!-- Header -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; position: relative; font-family: Arial, sans-serif;">
      <tr>
        <td style="width: 50%; text-align: left; vertical-align: middle;">
          <img src="/assets/logos/Dictaminacion.png" style="height: 60px; object-fit: contain;" />
        </td>
        <td style="width: 50%; text-align: right; vertical-align: middle;">
          <div style="font-size: 9.5pt; font-weight: bold; color: #444444; letter-spacing: 0.5px;">DATOS GENERALES</div>
          <div style="font-size: 8.5pt; color: #555555; margin-top: 3px;">${reporte.lugar_fecha || ''}</div>
        </td>
      </tr>
    </table>
    
    <!-- Double red line -->
    <div style="border-bottom: 3.5px double #a91d22; margin: 4px 0 10px 0;"></div>
    
    <!-- Title and Doc Metadata -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-family: Arial, sans-serif;">
      <tr>
        <td style="width: 70%; text-align: left; vertical-align: middle;">
          <div style="font-size: 11.5pt; font-weight: bold; color: #a91d22; line-height: 1.25; letter-spacing: -0.2px;">REPORTE DE MEDICIÓN DE SISTEMA DE PUESTA A TIERRA</div>
          <div style="font-size: 8.5pt; font-style: italic; color: #555555; margin-top: 3px;">Cumplimiento Normativo NFPA 70 (NEC) Art. 250 & NFPA 70B</div>
        </td>
        <td style="width: 30%; text-align: right; vertical-align: middle; font-size: 7.5pt; color: #444444; line-height: 1.45;">
          <div><strong>Código:</strong> REG-ELC-01</div>
          <div><strong>Versión:</strong> 2026.1</div>
          <div><strong>Página:</strong> 1 de 2</div>
        </td>
      </tr>
    </table>
    
    <!-- Thin red line -->
    <div style="border-bottom: 1.5px solid #a91d22; margin: 6px 0 14px 0;"></div>
    
    <!-- Section 1 -->
    <div style="font-size: 9.5pt; font-weight: bold; color: #a91d22; margin-top: 4px; margin-bottom: 4px;">1. Datos Generales de la Instalación</div>
    <div style="border-bottom: 1px solid #a91d22; margin-bottom: 8px; width: 100%;"></div>
    
    <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 15px; font-family: Arial, sans-serif;">
      <tr>
        <td style="width: 25%; background-color: #fdf2f2; border: 0.5px solid #cc0000; padding: 5px; font-weight: bold; color: #8b0000; vertical-align: middle;">Empresa / Cliente:</td>
        <td style="width: 75%; border: 0.5px solid #cc0000; padding: 5px; color: #333333; font-weight: bold; vertical-align: middle;">${reporte.empresa_cliente || ''}</td>
      </tr>
      <tr>
        <td style="background-color: #fdf2f2; border: 0.5px solid #cc0000; padding: 5px; font-weight: bold; color: #8b0000; vertical-align: middle;">Ubicación / Sitio:</td>
        <td style="border: 0.5px solid #cc0000; padding: 5px; color: #333333; vertical-align: middle;">${reporte.ubicacion_sitio || ''}</td>
      </tr>
      <tr>
        <td style="background-color: #fdf2f2; border: 0.5px solid #cc0000; padding: 5px; font-weight: bold; color: #8b0000; vertical-align: middle;">Fecha de Medición:</td>
        <td style="border: 0.5px solid #cc0000; padding: 0; color: #333333; vertical-align: middle;">
          <table style="width: 100%; border-collapse: collapse; height: 100%;">
            <tr>
              <td style="width: 35%; padding: 5px; border-right: 0.5px solid #cc0000; vertical-align: middle;">${reporte.fecha_medicion || ''}</td>
              <td style="width: 30%; background-color: #fdf2f2; padding: 5px; font-weight: bold; color: #8b0000; border-right: 0.5px solid #cc0000; vertical-align: middle;">Hora Ejecución:</td>
              <td style="width: 35%; padding: 5px; vertical-align: middle;">${reporte.hora_ejecucion || ''}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="background-color: #fdf2f2; border: 0.5px solid #cc0000; padding: 5px; font-weight: bold; color: #8b0000; vertical-align: middle;">Técnico Responsable:</td>
        <td style="border: 0.5px solid #cc0000; padding: 5px; color: #333333; vertical-align: middle;">${reporte.tecnico_responsable || ''}</td>
      </tr>
      <tr>
        <td style="background-color: #fdf2f2; border: 0.5px solid #cc0000; padding: 5px; font-weight: bold; color: #8b0000; vertical-align: middle;">Tipo de Sistema:</td>
        <td style="border: 0.5px solid #cc0000; padding: 5px; color: #333333; vertical-align: middle; line-height: 1.6;">
          ${renderCheckbox(reporte.tipo_sistema === 'Varilla / Electrodo')} <span style="margin-right: 12px; vertical-align: middle;">Varilla / Electrodo</span>
          ${renderCheckbox(reporte.tipo_sistema === 'Malla de Tierra')} <span style="margin-right: 12px; vertical-align: middle;">Malla de Tierra</span>
          ${renderCheckbox(reporte.tipo_sistema === 'Placa')} <span style="margin-right: 12px; vertical-align: middle;">Placa</span>
          ${renderCheckbox(reporte.tipo_sistema === 'Otro')} <span style="vertical-align: middle;">Otro</span>
        </td>
      </tr>
      <tr>
        <td style="background-color: #fdf2f2; border: 0.5px solid #cc0000; padding: 5px; font-weight: bold; color: #8b0000; vertical-align: middle;">Uso del Sistema:</td>
        <td style="border: 0.5px solid #cc0000; padding: 5px; color: #333333; vertical-align: middle; line-height: 1.6;">
          ${renderCheckbox(reporte.uso_sistema === 'Fuerza / Potencia')} <span style="margin-right: 15px; vertical-align: middle;">Fuerza / Potencia</span>
          ${renderCheckbox(reporte.uso_sistema === 'Pararrayos (SAC)')} <span style="margin-right: 15px; vertical-align: middle;">Pararrayos (SAC)</span>
          ${renderCheckbox(reporte.uso_sistema === 'Telecomunicaciones')} <span style="vertical-align: middle;">Telecomunicaciones</span>
        </td>
      </tr>
    </table>
    
    <!-- Section 2 -->
    <div style="font-size: 9.5pt; font-weight: bold; color: #a91d22; margin-top: 10px; margin-bottom: 4px;">2. Condiciones Ambientales y del Terreno (NFPA 70B)</div>
    <div style="border-bottom: 1px solid #a91d22; margin-bottom: 8px; width: 100%;"></div>
    
    <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 15px; font-family: Arial, sans-serif;">
      <tr>
        <td style="width: 25%; background-color: #fdf2f2; border: 0.5px solid #cc0000; padding: 5px; font-weight: bold; color: #8b0000; vertical-align: middle;">Estado del Clima:</td>
        <td style="width: 75%; border: 0.5px solid #cc0000; padding: 0; color: #333333; vertical-align: middle;">
          <table style="width: 100%; border-collapse: collapse; height: 100%;">
            <tr>
              <td style="width: 45%; padding: 5px; border-right: 0.5px solid #cc0000; vertical-align: middle; line-height: 1.6;">
                ${renderCheckbox(reporte.estado_clima === 'Soleado')} <span style="margin-right: 8px; vertical-align: middle;">Soleado</span>
                ${renderCheckbox(reporte.estado_clima === 'Nublado')} <span style="margin-right: 8px; vertical-align: middle;">Nublado</span>
                ${renderCheckbox(reporte.estado_clima === 'Lluvia')} <span style="vertical-align: middle;">Lluvia</span>
              </td>
              <td style="width: 20%; background-color: #fdf2f2; padding: 5px; font-weight: bold; color: #8b0000; border-right: 0.5px solid #cc0000; vertical-align: middle;">Humedad Suelo:</td>
              <td style="width: 35%; padding: 5px; vertical-align: middle; line-height: 1.6;">
                ${renderCheckbox(reporte.humedad_suelo === 'Seco')} <span style="margin-right: 10px; vertical-align: middle;">Seco</span>
                ${renderCheckbox(reporte.humedad_suelo === 'Húmedo')} <span style="vertical-align: middle;">Húmedo</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="background-color: #fdf2f2; border: 0.5px solid #cc0000; padding: 5px; font-weight: bold; color: #8b0000; vertical-align: middle;">Tipo de Terreno:</td>
        <td style="border: 0.5px solid #cc0000; padding: 5px; color: #333333; vertical-align: middle;">${reporte.tipo_terreno || ''}</td>
      </tr>
    </table>
    
    <!-- Section 3 -->
    <div style="font-size: 9.5pt; font-weight: bold; color: #a91d22; margin-top: 10px; margin-bottom: 4px;">3. Datos del Instrumento de Medición (Telurómetro)</div>
    <div style="border-bottom: 1px solid #a91d22; margin-bottom: 8px; width: 100%;"></div>
    
    <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 15px; font-family: Arial, sans-serif;">
      <tr>
        <td style="width: 25%; background-color: #fdf2f2; border: 0.5px solid #cc0000; padding: 5px; font-weight: bold; color: #8b0000; vertical-align: middle;">Marca y Modelo:</td>
        <td style="width: 75%; border: 0.5px solid #cc0000; padding: 0; color: #333333; vertical-align: middle;">
          <table style="width: 100%; border-collapse: collapse; height: 100%;">
            <tr>
              <td style="width: 45%; padding: 5px; border-right: 0.5px solid #cc0000; vertical-align: middle;">${reporte.instrumento_marca_modelo || ''}</td>
              <td style="width: 20%; background-color: #fdf2f2; padding: 5px; font-weight: bold; color: #8b0000; border-right: 0.5px solid #cc0000; vertical-align: middle;">Número de Serie:</td>
              <td style="width: 35%; padding: 5px; vertical-align: middle;">${reporte.instrumento_serie || ''}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="background-color: #fdf2f2; border: 0.5px solid #cc0000; padding: 5px; font-weight: bold; color: #8b0000; vertical-align: middle;">Fecha Últ. Calibración:</td>
        <td style="border: 0.5px solid #cc0000; padding: 0; color: #333333; vertical-align: middle;">
          <table style="width: 100%; border-collapse: collapse; height: 100%;">
            <tr>
              <td style="width: 35%; padding: 5px; border-right: 0.5px solid #cc0000; vertical-align: middle;">${reporte.instrumento_calibracion || ''}</td>
              <td style="width: 20%; background-color: #fdf2f2; padding: 5px; font-weight: bold; color: #8b0000; border-right: 0.5px solid #cc0000; vertical-align: middle;">Método Aplicado:</td>
              <td style="width: 45%; padding: 5px; vertical-align: middle; line-height: 1.6;">
                ${renderCheckbox(reporte.instrumento_metodo === 'Caída de Potencial (62%)')} <span style="margin-right: 8px; vertical-align: middle;">Caída de Potencial (62%)</span><br/>
                ${renderCheckbox(reporte.instrumento_metodo === 'Doble Pinza / Resistencia')} <span style="vertical-align: middle;">Doble Pinza / Resistencia</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <!-- Section 4 (Part 1) -->
    <div style="font-size: 9.5pt; font-weight: bold; color: #a91d22; margin-top: 10px; margin-bottom: 4px;">4. Registro de Mediciones (Método de Caída de Potencial)</div>
    <div style="border-bottom: 1px solid #a91d22; margin-bottom: 8px; width: 100%;"></div>
    <div style="font-size: 8.5pt; font-style: italic; color: #444444; margin-bottom: 8px; font-family: Arial, sans-serif;">
      * Distancia Total al Electrodo de Corriente Auxiliar (Z): <span style="text-decoration: underline; font-weight: bold; color: #333333; padding: 0 10px;">${reporte.distancia_z || '___________'}</span> metros / pies.
    </div>
    
    <table style="width: 100%; border-collapse: collapse; font-size: 8pt; font-family: Arial, sans-serif; text-align: center; margin-top: 5px;">
      <thead>
        <tr style="background-color: #fdf2f2; color: #8b0000; font-weight: bold;">
          <th style="border: 0.5px solid #cc0000; padding: 7px; width: 40%; vertical-align: middle;">Porcentaje de Distancia</th>
          <th style="border: 0.5px solid #cc0000; padding: 7px; width: 30%; vertical-align: middle;">Distancia de Pica de Potencial (Y)</th>
          <th style="border: 0.5px solid #cc0000; padding: 7px; width: 30%; vertical-align: middle;">Resistencia Obtenida (Ω)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 0.5px solid #cc0000; padding: 7px; font-weight: bold; vertical-align: middle;">52%</td>
          <td style="border: 0.5px solid #cc0000; padding: 7px; vertical-align: middle;">${reporte.dist_52_y || ''}</td>
          <td style="border: 0.5px solid #cc0000; padding: 7px; font-weight: bold; color: #cc0000; vertical-align: middle;">${reporte.res_52 || '—'} Ω</td>
        </tr>
        <tr style="background-color: #fff5f5;">
          <td style="border: 0.5px solid #cc0000; padding: 7px; font-weight: bold; color: #8b0000; vertical-align: middle;">62% (Valor de Referencia)</td>
          <td style="border: 0.5px solid #cc0000; padding: 7px; vertical-align: middle;">${reporte.dist_62_y || ''}</td>
          <td style="border: 0.5px solid #cc0000; padding: 7px; font-weight: bold; color: #cc0000; vertical-align: middle;">${reporte.res_62 || '—'} Ω</td>
        </tr>
      </tbody>
    </table>
  `;

  const page2Content = `
    <!-- Header -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; position: relative; font-family: Arial, sans-serif;">
      <tr>
        <td style="width: 50%; text-align: left; vertical-align: middle;">
          <img src="/assets/logos/Dictaminacion.png" style="height: 60px; object-fit: contain;" />
        </td>
        <td style="width: 50%; text-align: right; vertical-align: middle;">
          <div style="font-size: 9.5pt; font-weight: bold; color: #444444; letter-spacing: 0.5px;">DATOS GENERALES</div>
          <div style="font-size: 8.5pt; color: #555555; margin-top: 3px;">${reporte.lugar_fecha || ''}</div>
        </td>
      </tr>
    </table>
    
    <!-- Double red line -->
    <div style="border-bottom: 3.5px double #a91d22; margin: 4px 0 10px 0;"></div>
    
    <!-- Title and Doc Metadata -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-family: Arial, sans-serif;">
      <tr>
        <td style="width: 70%; text-align: left; vertical-align: middle;">
          <div style="font-size: 11.5pt; font-weight: bold; color: #a91d22; line-height: 1.25; letter-spacing: -0.2px;">REPORTE DE MEDICIÓN DE SISTEMA DE PUESTA A TIERRA</div>
          <div style="font-size: 8.5pt; font-style: italic; color: #555555; margin-top: 3px;">Cumplimiento Normativo NFPA 70 (NEC) Art. 250 & NFPA 70B</div>
        </td>
        <td style="width: 30%; text-align: right; vertical-align: middle; font-size: 7.5pt; color: #444444; line-height: 1.45;">
          <div><strong>Código:</strong> REG-ELC-01</div>
          <div><strong>Versión:</strong> 2026.1</div>
          <div><strong>Página:</strong> 2 de 2</div>
        </td>
      </tr>
    </table>
    
    <!-- Thin red line -->
    <div style="border-bottom: 1.5px solid #a91d22; margin: 6px 0 14px 0;"></div>

    <!-- Section 4 (Part 2 - Continuation Table) -->
    <table style="width: 100%; border-collapse: collapse; font-size: 8pt; font-family: Arial, sans-serif; text-align: center; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #fdf2f2; color: #8b0000; font-weight: bold;">
          <th style="border: 0.5px solid #cc0000; padding: 7px; width: 40%; vertical-align: middle;">Porcentaje de Distancia</th>
          <th style="border: 0.5px solid #cc0000; padding: 7px; width: 30%; vertical-align: middle;">Distancia de Pica de Potencial (Y)</th>
          <th style="border: 0.5px solid #cc0000; padding: 7px; width: 30%; vertical-align: middle;">Resistencia Obtenida (Ω)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 0.5px solid #cc0000; padding: 7px; font-weight: bold; vertical-align: middle;">72%</td>
          <td style="border: 0.5px solid #cc0000; padding: 7px; vertical-align: middle;">${reporte.dist_72_y || ''}</td>
          <td style="border: 0.5px solid #cc0000; padding: 7px; font-weight: bold; color: #cc0000; vertical-align: middle;">${reporte.res_72 || '—'} Ω</td>
        </tr>
      </tbody>
    </table>
    
    <!-- Section 5 -->
    <div style="font-size: 9.5pt; font-weight: bold; color: #a91d22; margin-top: 10px; margin-bottom: 4px;">5. Evaluacion y Criterio de Aceptacion (NFPA 70 Art. 250.53)</div>
    <div style="border-bottom: 1px solid #a91d22; margin-bottom: 8px; width: 100%;"></div>
    
    <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 15px; font-family: Arial, sans-serif;">
      <tr>
        <td style="width: 35%; background-color: #fdf2f2; border: 0.5px solid #cc0000; padding: 6px; font-weight: bold; color: #8b0000; vertical-align: middle;">Resistencia Final Registrada (62%):</td>
        <td style="width: 65%; border: 0.5px solid #cc0000; padding: 6px; font-weight: bold; color: #cc0000; font-size: 9pt; vertical-align: middle;">${reporte.resistencia_final_registrada || '—'} Ω</td>
      </tr>
      <tr>
        <td style="background-color: #fdf2f2; border: 0.5px solid #cc0000; padding: 6px; font-weight: bold; color: #8b0000; vertical-align: middle;">Variación del Terreno (Sugerido Max 5% entre 52% y 72%):</td>
        <td style="border: 0.5px solid #cc0000; padding: 6px; color: #333333; vertical-align: middle; line-height: 1.6;">
          <strong style="margin-right: 15px;">${reporte.variacion_terreno || '0'} %</strong>
          ${renderCheckbox(reporte.terreno_estado === 'Estable')} <span style="margin-right: 10px; vertical-align: middle;">Estable</span>
          ${renderCheckbox(reporte.terreno_estado === 'Inestable')} <span style="vertical-align: middle;">Inestable</span>
        </td>
      </tr>
      <tr>
        <td style="background-color: #fdf2f2; border: 0.5px solid #cc0000; padding: 6px; font-weight: bold; color: #8b0000; vertical-align: middle;">Límite Solicitado / Aplicación:</td>
        <td style="border: 0.5px solid #cc0000; padding: 6px; color: #333333; vertical-align: middle; line-height: 1.6;">
          ${renderCheckbox(reporte.limite_solicitado === '25')} <span style="margin-right: 12px; vertical-align: middle;">≤ 25 Ω (Estándar NEC/NFPA 70)</span>
          ${renderCheckbox(reporte.limite_solicitado === '5')} <span style="margin-right: 12px; vertical-align: middle;">≤ 5 Ω (Industrial)</span>
          ${renderCheckbox(reporte.limite_solicitado === '1')} <span style="vertical-align: middle;">≤ 1 Ω (Crítico)</span>
        </td>
      </tr>
      <tr>
        <td style="background-color: #fdf2f2; border: 0.5px solid #cc0000; padding: 6px; font-weight: bold; color: #8b0000; vertical-align: middle;">Estado de Conformidad Final:</td>
        <td style="border: 0.5px solid #cc0000; padding: 6px; color: #333333; vertical-align: middle; line-height: 1.6;">
          <span style="font-weight: bold; color: #cc0000; margin-right: 25px; vertical-align: middle;">
            ${renderCheckbox(reporte.conformidad_final === 'APROBADO')} APROBADO CUMPLE
          </span>
          <span style="font-weight: bold; color: #8b0000; vertical-align: middle;">
            ${renderCheckbox(reporte.conformidad_final === 'NO_CUMPLE')} NO CUMPLE (Requiere Adecuación)
          </span>
        </td>
      </tr>
    </table>
    
    <!-- Section 6 -->
    <div style="font-size: 9.5pt; font-weight: bold; color: #a91d22; margin-top: 10px; margin-bottom: 4px;">6. Observaciones y Recomendaciones Técnicas</div>
    <div style="border-bottom: 1px solid #a91d22; margin-bottom: 8px; width: 100%;"></div>
    <div style="font-size: 7.5pt; color: #555555; margin-bottom: 8px; text-align: justify; font-family: Arial, sans-serif;">
      Notas sobre el estado físico de los electrodos, corrosión, sulfatación en conectores, soldaduras exotérmicas o necesidad de aplicar tratamiento químico al suelo:
    </div>
    
    <!-- observations container with writing lines -->
    <div style="position: relative; font-size: 8.5pt; line-height: 24px; color: #333333; margin-bottom: 25px; text-align: justify; padding: 2px 5px; font-family: Courier New, Courier, monospace; font-weight: bold; background: repeating-linear-gradient(transparent, transparent 23px, #cc0000 23px, #cc0000 24px); min-height: 72px;">
      ${reporte.observaciones || ''}
    </div>
    
    <!-- Signatures -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 40px; margin-bottom: 15px; font-family: Arial, sans-serif;">
      <tr>
        <td style="width: 45%; text-align: center; vertical-align: bottom; position: relative;">
          <!-- Digital Sign Stamp -->
          <div style="position: absolute; top: -50px; left: 50%; transform: translateX(-50%); width: 150px; height: 60px; opacity: 0.75; z-index: 1;">
            <svg viewBox="0 0 200 80" style="width: 100%; height: 100%;">
              <rect x="5" y="5" width="190" height="70" rx="4" fill="none" stroke="#1d4ed8" stroke-width="1.5" stroke-dasharray="3,2" />
              <text x="100" y="21" font-family="Courier New, monospace" font-size="7" font-weight="bold" fill="#1d4ed8" text-anchor="middle">DICTAMINACIÓN TÉCNICA ECG</text>
              <text x="100" y="32" font-family="Courier New, monospace" font-size="7" font-weight="bold" fill="#1d4ed8" text-anchor="middle">ING. JUAN ERASMO CUAYA G.</text>
              <text x="100" y="43" font-family="Courier New, monospace" font-size="7" fill="#1d4ed8" text-anchor="middle">CED. PROF. 8101909</text>
              <text x="100" y="54" font-family="Courier New, monospace" font-size="7" fill="#1d4ed8" text-anchor="middle">FIRMA AUTORIZADA DIGITAL</text>
              <text x="100" y="65" font-family="Courier New, monospace" font-size="6" fill="#1d4ed8" text-anchor="middle">REGISTRO SUPABASE CERTIFICADO</text>
              <path d="M 25,48 Q 55,18 75,48 T 115,38 T 155,58 T 175,43" fill="none" stroke="#2563eb" stroke-width="1.5" opacity="0.6" />
            </svg>
          </div>
          <div style="border-top: 1px solid #444444; width: 220px; margin: 0 auto 5px auto;"></div>
          <div style="font-size: 8pt; font-weight: bold; color: #333333;">${reporte.nombre_firma_tecnico || 'ING. JUAN ERASMO CUAYA GRANADOS'}</div>
          <div style="font-size: 7pt; color: #666666; margin-top: 2px;">Técnico Responsable</div>
        </td>
        <td style="width: 10%;"></td>
        <td style="width: 45%; text-align: center; vertical-align: bottom;">
          <div style="border-top: 1px solid #444444; width: 220px; margin: 0 auto 5px auto;"></div>
          <div style="font-size: 8pt; font-weight: bold; color: #333333;">Validó / Aprobó (Nombre y Firma)</div>
          <div style="font-size: 7pt; color: #666666; margin-top: 2px;">${reporte.nombre_firma_aprobador || 'Representante de la Empresa / Cliente'}</div>
        </td>
      </tr>
    </table>
    
    <!-- Base Domicilio -->
    <div style="font-size: 7.5pt; color: #444444; text-align: center; font-family: Arial, sans-serif; line-height: 1.4; margin-top: 30px; font-weight: bold; border-top: 0.5px solid #cccccc; padding-top: 8px;">
      DOMICILIO: PASEO LA ALBORADA 1001 INT 45, COL. RANCHO SAN PEDRO, C.P. 76113, QUERÉTARO, QRO.<br/>
      TELÉFONO: 442 669 1732 &nbsp;&nbsp;|&nbsp;&nbsp; CORREO ELECTRÓNICO: <span style="color: #a91d22;">erasmocuaya@gmail.com</span>
    </div>
  `;

  // Template to wrap page content inside Letter page dimensions (816x1056 px)
  const renderPageHTML = (contentHTML, pageNum) => {
    return `
      <div class="page" id="page-${pageNum}" style="width: 816px; height: 1056px; box-sizing: border-box; padding: 45px 55px 55px 55px; position: relative; background-color: #ffffff; overflow: hidden; font-family: Arial, sans-serif; float: left; border: 1px solid #eaeaea;">
        <!-- Watermark logo background -->
        <img src="/assets/logos/Dictaminacion.png" style="position: absolute; left: 243px; top: 363px; width: 330px; height: 330px; opacity: 0.05; z-index: 0;" />
        
        <!-- Content Area -->
        <div style="height: 900px; z-index: 10; position: relative;">
          ${contentHTML}
        </div>
        
        <!-- Footer contact lines -->
        <div style="position: absolute; bottom: 30px; left: 55px; right: 55px; border-top: 0.5px solid #a91d22; padding-top: 8px; font-size: 7.5pt; font-family: Arial, sans-serif; z-index: 10; display: flex; justify-content: space-between; align-items: center; color: #444444;">
          <div style="display: flex; align-items: center;">
            <!-- Envelope icon (Gmail representation) -->
            <svg viewBox="0 0 24 24" style="width: 13px; height: 13px; fill: #a91d22; margin-right: 4px; vertical-align: middle; display: inline-block;">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <span style="font-weight: bold;">dictaminacion.ecg@gmail.com</span>
          </div>
          <div style="display: flex; align-items: center;">
            <!-- Phone/WhatsApp representation -->
            <svg viewBox="0 0 24 24" style="width: 13px; height: 13px; fill: #25d366; margin-right: 4px; vertical-align: middle; display: inline-block;">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.57a.98.98 0 0 0-1 .24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.2a.96.96 0 0 0 .25-1c-.37-1.11-.57-2.3-.57-3.53C8.37 3.6 7.77 3 7.05 3H3.6C2.88 3 2 3.6 2 4.6 2 14.21 9.79 22 19.4 22c.9 0 1.6-.88 1.6-1.6v-3.44c0-.72-.6-1.32-1.39-1.32z"/>
            </svg>
            <span style="font-weight: bold;">(442) 773 4562 / 442 669 1732</span>
          </div>
          <div style="font-weight: bold; color: #555555;">Página ${pageNum} de 2</div>
        </div>
      </div>
    `;
  };

  const pagesHTML = renderPageHTML(page1Content, 1) + renderPageHTML(page2Content, 2);

  // Append container to body
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1650px'; // Room for float left
  container.style.backgroundColor = '#f0f0f0';
  document.body.appendChild(container);
  container.innerHTML = pagesHTML;

  // Wait for images inside container to load
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

  // Wait a short moment for browser layout recalculation
  await new Promise(res => setTimeout(res, 400));

  // Initialize jsPDF document (letter format: 215.9mm x 279.4mm)
  const doc = new jsPDF({
    unit: 'mm',
    format: 'letter'
  });

  const pageNodes = container.querySelectorAll('.page');
  for (let i = 0; i < pageNodes.length; i++) {
    const pageNode = pageNodes[i];
    const canvas = await html2canvas(pageNode, {
      scale: 2, // High resolution scale
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      doc.addPage();
    }
    doc.addImage(imgData, 'JPEG', 0, 0, 215.9, 279.4);
  }

  // Save the PDF
  const clientName = (reporte.empresa_cliente || 'Cliente').replace(/\s+/g, '_');
  const dateStr = (reporte.fecha_medicion || 'Reporte').replace(/\//g, '-');
  const fileName = `Reporte_Puesta_Tierra_${clientName}_${dateStr}.pdf`;
  doc.save(fileName);

  // Cleanup DOM
  document.body.removeChild(container);
};
