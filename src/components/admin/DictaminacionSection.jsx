import React, { useState, useRef, useCallback } from 'react';
import {
  ClipboardList, Plus, Trash2, Eye, X, FileDown, Upload,
  Image as ImageIcon, ChevronDown, ChevronUp, Save, FileText,
  AlertCircle, CheckCircle, Camera, Award
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateDictamenWord } from '../../utils/dictamenWordGenerator';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2);
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const EMPTY_DICTAMEN = {
  id: '',
  // Header
  numero_carta: '',
  nombre_comercial_header: '',
  fecha_emision: '',
  fecha_vencimiento: '',
  lugar_emision: 'SANTIAGO DE QUERÉTARO, QRO.',
  lugar_vencimiento: 'SANTIAGO DE QUERÉTARO, QRO.',
  // Intro paragraph
  ing_nombre: 'ING. JUAN ERASMO CUAYA GRANADOS',
  cedula: '8101909',
  colegio: 'CIENQRO 002 2024 PERITO EN INSTALACIONES ELECTRICAS CIENQRO-ELEC-01/24/00002',
  domicilio_notificaciones: 'AV PASEO DE LA ALBORADA #1001 INT 45 COL. RANCHO SAN PEDRO CP.76113, SANTIAGO DE QUERÉTARO, QUERÉTARO',
  telefono_ing: '442 6767490',
  // Tabla datos
  tipo_instalacion: 'ELÉCTRICA',
  tipo_acometida: '',
  baja_tension: '',
  voltaje_alimentacion: '220V 3 FASES 5 H',
  clasificacion_riesgo: 'ALTO',
  giro_scian: '',
  scian_codigo: '',
  nombre_comercial: '',
  razon_social: '',
  rfc_curp: '',
  nombre_propietario: '',
  direccion: '',
  telefono: '',
  correo: '',
  // Estado
  estado: 'en_proceso',
  // Fotos (reporte fotográfico)
  fotos: ['', '', '', '', '', ''],
  // Acreditaciones
  acreditaciones: ['', '', '', '', '', ''],
  // Firma
  nombre_firma: 'ING JUAN ERASMO CUAYA GRANADOS',
  ced_firma: 'CED. PROF. 8101909 CIENQRO0022023 SUP DE STPS CUGJ790217IA7-005',
  seg_firma: 'SEGURIDAD INDUSTRIAL SC122275',
  firma_img: '',
  createdAt: '',
};

const STATUS_MAP = {
  en_proceso: { label: 'En proceso', cls: 'bg-blue-100 text-blue-700' },
  completado:  { label: 'Completado', cls: 'bg-green-100 text-green-700' },
  rechazado:   { label: 'Rechazado',  cls: 'bg-red-100 text-red-700' },
};

/* ─── ImageSlot ────────────────────────────────────────────────────────────── */
const ImageSlot = ({ value, onChange, label }) => {
  const inputRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  }, [onChange]);

  return (
    <div
      className="relative border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:border-amber-400 transition-all group cursor-pointer"
      style={{ aspectRatio: '4/3' }}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <>
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300">
          <Camera size={28} />
          <span className="text-xs font-semibold">{label || 'Subir foto'}</span>
        </div>
      )}
    </div>
  );
};

/* ─── FieldRow ─────────────────────────────────────────────────────────────── */
const FieldRow = ({ label, children, className = '' }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder, className = '' }) => (
  <input
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 placeholder-slate-300 ${className}`}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 2 }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 placeholder-slate-300 resize-none"
  />
);

/* ─── PDF Generator ────────────────────────────────────────────────────────── */
const generateDictamenPDF = async (dictamen) => {
  const logoUrl = '/assets/logos/Dictaminacion.png';
  const firmaCurva = `<path d="M 20,35 Q 40,10 60,35 T 100,25 T 140,40 T 170,30" fill="none" stroke="#333" stroke-width="1.5" opacity="0.8"/>`;

  const headerHtml = (numPagina, totalPaginas) => `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-family:Arial,sans-serif;">
      <img src="${logoUrl}" style="height:55px;object-fit:contain;" onerror="this.style.display='none'" />
      <div style="text-align:right;font-size:8pt;color:#444;">
        <div style="font-weight:bold;">CARTA DICTAMEN ${dictamen.numero_carta} ${dictamen.nombre_comercial_header}</div>
        <div style="color:#cc0000;font-weight:bold;">FECHA DE EMISION: ${dictamen.lugar_emision}, A ${dictamen.fecha_emision}</div>
        <div style="color:#cc0000;font-weight:bold;">FECHA DE VENCIMIENTO: ${dictamen.lugar_vencimiento}, A ${dictamen.fecha_vencimiento}</div>
      </div>
    </div>
    <div style="border-bottom:2.5px double #a91d22;margin:4px 0 10px 0;"></div>
  `;

  const footerHtml = `
    <div style="position:absolute;bottom:28px;left:50px;right:50px;border-top:1px solid #a91d22;padding-top:6px;font-size:7.5pt;font-family:Arial,sans-serif;display:flex;justify-content:space-between;align-items:center;color:#444;">
      <div style="display:flex;align-items:center;gap:4px;">
        <svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:#25d366;flex-shrink:0;"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.57a.98.98 0 0 0-1 .24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.2a.96.96 0 0 0 .25-1c-.37-1.11-.57-2.3-.57-3.53C8.37 3.6 7.77 3 7.05 3H3.6C2.88 3 2 3.6 2 4.6 2 14.21 9.79 22 19.4 22c.9 0 1.6-.88 1.6-1.6v-3.44c0-.72-.6-1.32-1.39-1.32z"/></svg>
        <span style="font-weight:bold;">${dictamen.telefono_ing || '44211 63 962'}</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px;">
        <svg viewBox="0 0 24 24" style="width:13px;height:13px;fill:#a91d22;flex-shrink:0;"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        <span style="font-weight:bold;">${dictamen.correo || 'adm.securus.consultotia@gmail.com'}</span>
      </div>
    </div>
  `;

  const watermark = `<img src="${logoUrl}" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:300px;height:300px;opacity:0.04;pointer-events:none;" onerror="this.style.display='none'" />`;

  const firmaBlock = `
    <div style="text-align:center;margin-top:40px;">
      <div style="font-size:11pt;font-weight:bold;font-family:'Times New Roman',serif;letter-spacing:1px;margin-bottom:4px;">ATENTAMENTE.</div>
      <svg viewBox="0 0 200 60" style="width:200px;height:60px;display:block;margin:0 auto;">
        ${firmaCurva}
      </svg>
      <div style="font-size:8.5pt;font-weight:bold;font-family:Arial,sans-serif;margin-top:2px;">${dictamen.nombre_firma}</div>
      <div style="font-size:7pt;font-family:Arial,sans-serif;color:#444;">${dictamen.ced_firma}</div>
      <div style="font-size:7pt;font-family:Arial,sans-serif;color:#444;">${dictamen.seg_firma}</div>
    </div>
  `;

  // ── Página 1: Datos Generales ──────────────────────────────────────────────
  const page1 = `
    ${headerHtml(1, 4)}
    <p style="font-size:8pt;font-family:Arial,sans-serif;text-align:justify;margin-bottom:14px;line-height:1.55;">
      Por medio del presente recibe un cordial saludo por parte del personal que laboramos en esta empresa. El que suscribe
      <strong>${dictamen.ing_nombre}</strong> con cedula profesional. <strong>${dictamen.cedula}</strong>,
      registro en el colegio <strong>${dictamen.colegio}</strong> y con domicilio para oír y recibir notificaciones en
      ${dictamen.domicilio_notificaciones}, con teléfono. ${dictamen.telefono_ing}
      Informo que he revisado las instalaciones cuyos datos se indican a continuación:
    </p>

    <!-- Tabla de datos -->
    <table style="width:100%;border-collapse:collapse;font-size:8pt;font-family:Arial,sans-serif;margin-bottom:14px;">
      <tr>
        <td style="background:#f5f5f5;border:1px solid #bbb;padding:5px 7px;font-weight:bold;color:#555;width:22%;">TIPO DE INSTALACIÓN</td>
        <td style="border:1px solid #bbb;padding:5px 7px;width:20%;font-weight:bold;">${dictamen.tipo_instalacion}</td>
        <td style="background:#f5f5f5;border:1px solid #bbb;padding:5px 7px;font-weight:bold;color:#555;width:20%;">TIPO DE ACOMETIDA</td>
        <td style="border:1px solid #bbb;padding:5px 7px;width:18%;">${dictamen.tipo_acometida}</td>
        <td style="background:#f5f5f5;border:1px solid #bbb;padding:5px 7px;font-weight:bold;color:#555;width:20%;">BAJA TENSION LINEAS DE CFE</td>
        <td style="border:1px solid #bbb;padding:5px 7px;width:20%;">${dictamen.baja_tension}</td>
        <td style="background:#f5f5f5;border:1px solid #bbb;padding:5px 7px;font-weight:bold;color:#555;width:20%;">VOLTAJE DE ALIMENTACION</td>
        <td style="border:1px solid #bbb;padding:5px 7px;font-weight:bold;">${dictamen.voltaje_alimentacion}</td>
      </tr>
      <tr>
        <td style="background:#f5f5f5;border:1px solid #bbb;padding:5px 7px;font-weight:bold;color:#555;">CLASIFICACION DE RIESGO</td>
        <td colspan="7" style="border:1px solid #bbb;padding:5px 7px;font-weight:bold;">${dictamen.clasificacion_riesgo}</td>
      </tr>
      <tr>
        <td style="background:#f5f5f5;border:1px solid #bbb;padding:5px 7px;font-weight:bold;color:#555;">GIRO SEGÚN SCIAN</td>
        <td colspan="5" style="border:1px solid #bbb;padding:5px 7px;">${dictamen.giro_scian}</td>
        <td style="background:#f5f5f5;border:1px solid #bbb;padding:5px 7px;font-weight:bold;color:#555;">SCIAN</td>
        <td style="border:1px solid #bbb;padding:5px 7px;">${dictamen.scian_codigo}</td>
      </tr>
      <tr>
        <td style="background:#f5f5f5;border:1px solid #bbb;padding:5px 7px;font-weight:bold;color:#555;">NOMBRE COMERCIAL</td>
        <td colspan="7" style="border:1px solid #bbb;padding:5px 7px;font-weight:bold;">${dictamen.nombre_comercial}</td>
      </tr>
      <tr>
        <td style="background:#f5f5f5;border:1px solid #bbb;padding:5px 7px;font-weight:bold;color:#555;">RAZON SOCIAL</td>
        <td colspan="7" style="border:1px solid #bbb;padding:5px 7px;">${dictamen.razon_social}</td>
      </tr>
      <tr>
        <td style="background:#f5f5f5;border:1px solid #bbb;padding:5px 7px;font-weight:bold;color:#555;">RFC e CURP</td>
        <td colspan="7" style="border:1px solid #bbb;padding:5px 7px;">${dictamen.rfc_curp}</td>
      </tr>
      <tr>
        <td style="background:#f5f5f5;border:1px solid #bbb;padding:5px 7px;font-weight:bold;color:#555;">NOMBRE DEL PROPIETARIO Y/O REPRESENTANTE LEGAL</td>
        <td colspan="7" style="border:1px solid #bbb;padding:5px 7px;">${dictamen.nombre_propietario}</td>
      </tr>
      <tr>
        <td style="background:#f5f5f5;border:1px solid #bbb;padding:5px 7px;font-weight:bold;color:#555;">DIRECCIÓN</td>
        <td colspan="7" style="border:1px solid #bbb;padding:5px 7px;">${dictamen.direccion}</td>
      </tr>
      <tr>
        <td style="background:#f5f5f5;border:1px solid #bbb;padding:5px 7px;font-weight:bold;color:#555;">TELEFONO</td>
        <td colspan="3" style="border:1px solid #bbb;padding:5px 7px;">${dictamen.telefono}</td>
        <td style="background:#f5f5f5;border:1px solid #bbb;padding:5px 7px;font-weight:bold;color:#555;">CORREO</td>
        <td colspan="3" style="border:1px solid #bbb;padding:5px 7px;">${dictamen.correo}</td>
      </tr>
    </table>

    <p style="font-size:8pt;font-family:Arial,sans-serif;text-align:justify;margin-bottom:10px;line-height:1.5;">
      Asimismo, declaro bajo protesta de decir verdad que las instalaciones eléctricas cumplen con las normas y reglamentos aplicables
      en materia de seguridad y que, al no haber encontrado fallas ni inconveniencias, considero que esta instalación puede funcionar
      bajo condiciones de riesgo en su operación normal por lo queda aprobada tal y como actualmente se encuentran.
    </p>
    <p style="font-size:8pt;font-family:Arial,sans-serif;text-align:justify;margin-bottom:10px;line-height:1.5;">
      También se informa que el usuario y/o sus representantes han sido enterados que el cuidado y mantenimiento es su
      responsabilidad y que <strong>cualquier cambio a las instalaciones aprobadas en este documento se me deberá notificar para su
      revisión y aprobación ANTES de hacer la modificación y que estas deberán ser realizadas por personal calificado y
      certificado.</strong> <span style="color:#cc0000;font-weight:bold;">La falta de cumplimiento de lo anterior invalida la presente aprobación.</span>
    </p>
    <p style="font-size:8pt;font-family:Arial,sans-serif;margin-bottom:20px;">Sin más por el momento y en espera de poder parte de su éxito, quedo a sus órdenes.</p>

    ${firmaBlock}
  `;

  // ── Página 2: Normatividad ─────────────────────────────────────────────────
  const page2 = `
    ${headerHtml(2, 4)}
    <div style="font-size:10pt;font-weight:bold;text-align:center;font-family:Arial,sans-serif;margin-bottom:10px;text-decoration:underline;">NORMATIVIDAD</div>
    <p style="font-size:8pt;font-family:Arial,sans-serif;text-align:justify;line-height:1.55;margin-bottom:12px;">
      Reglamento de Construcción para el Mpio. de Querétaro: Arts. 1, 3, 199 a 203 [aplicado supletoriamente a otros Municipios],
      y/o Reglamento de Construcción para el Mpio de San Juan del Río: Código Urbano para el Edo. De Querétaro: Art. 1, Fracción
      X; Art. 20 del Reglamento de Protección Civil del Municipio de Querétaro, (y demás aplicables del Estado y/o Municipios de
      Querétaro), basadas en la Normatividad de Referencia: NOM-001-SEDE-2012 y a lo estipulado en la "Ley Federal sobre
      Metrología y Normalización", en la "Ley del Servicio Público de Energía Eléctrica", en el "Reglamento de la Ley del Servicio
      Público de Energía Eléctrica", así como en las NOM´s y NMX´s que puedan ser aplicables (del sector Salud, Laboral, Ecológico,
      Agropecuario y/o Energético) y/o tratándose de instalaciones especiales y/o peligrosas.
    </p>

    <div style="font-size:10pt;font-weight:bold;text-align:center;font-family:Arial,sans-serif;margin-bottom:8px;text-decoration:underline;">COMPROMISOS DEL "USUARIO"</div>
    <p style="font-size:8pt;font-family:Arial,sans-serif;text-align:justify;line-height:1.55;margin-bottom:6px;">
      <strong>CONSTRUCCIÓN, AMPLIACIÓN O CORRECCIÓN</strong> - De acuerdo al Art. 28 de la "Ley del Servicio Público de Energía Eléctrica",
      corresponde al USUARIO realizar a su costa y bajo su responsabilidad, las obras e instalaciones destinadas al uso de la energía
      eléctrica, mismas que deberán satisfacer los requisitos técnicos y de seguridad que fijen las Normas Oficiales Mexicanas.
    </p>
    <p style="font-size:8pt;font-family:Arial,sans-serif;text-align:justify;line-height:1.55;margin-bottom:6px;">
      <strong>MANTENIMIENTO Y CONSERVACIÓN.</strong> - La obligación de conservar la instalación en condiciones de recibir en forma segura y
      permanente el suministro de energía eléctrica corresponde al USUARIO, a quien la CFE o terceros podrá imputar la
      responsabilidad de los daños que por defecto en sus instalaciones puedan ser causados según el Art. 34 del "Reglamento de la
      Ley del Servicio Público de Energía Eléctrica". USO EFICIENTE Y SEGURO - El cumplimiento de las disposiciones indicadas en la
      NOM-001-SEDE-2015 garantiza el uso de la energía eléctrica en forma segura, sin embargo la responsabilidad en el uso de la
      energía eléctrica es exclusiva del USUARIO y de su personal, el cual deberá estar capacitado para operar la instalación, según
      se establece en el Art. 5.1 de la citada NOM.
    </p>

    <div style="font-size:10pt;font-weight:bold;text-align:center;font-family:Arial,sans-serif;margin:12px 0 8px;text-decoration:underline;">COMPROMISOS DEL "DICTAMINADOR"</div>
    <p style="font-size:8pt;font-family:Arial,sans-serif;text-align:justify;line-height:1.55;margin-bottom:6px;">
      Brindar asesoría al USUARIO para que dé cumplimiento a la normatividad municipal y estatal en la materia. Otorgar si procede,
      el documento denominado dictamen de Seguridad y Operación, entregado por parte del DICTAMINADOR al USUARIO, donde de
      manera explícita y exclusiva se hace constar que las instalaciones eléctricas propiedad del USUARIO cumplen en esta fecha con
      la normatividad municipal y estatal en materia de protección civil acorde a la NOM-001-SEDE-2012 y demás aplicables, a fin de
      que ofrezcan condiciones adecuadas de seguridad para las personas y sus propiedades, en lo referente a protección contra
      choque eléctrico, efectos térmicos, sobre corrientes, corrientes de falla, sobretensiones y fenómenos atmosféricos en
      subestaciones de alta tensión y edificios con altura mayor a 12 mts.
    </p>
    <p style="font-size:8pt;font-family:Arial,sans-serif;text-align:justify;color:#cc0000;font-weight:bold;margin-bottom:8px;">
      Sin embargo, el DICTAMINADOR no se hace responsable de las siguientes acciones que pueda emprender el USUARIO a
      partir de la entrega del dictamen:
    </p>
    <ul style="font-size:8pt;font-family:Arial,sans-serif;list-style:none;padding-left:10px;margin-bottom:8px;">
      <li style="margin-bottom:4px;">○ Realizar ampliaciones, modificaciones o alteraciones a la instalación,</li>
      <li>○ Realizar sustituciones o conexiones de equipo de utilización que no esté especificado en los planos y/o memorias correspondientes a este proyecto</li>
    </ul>
    <p style="font-size:8pt;font-family:Arial,sans-serif;text-align:justify;color:#cc0000;font-weight:bold;font-style:italic;margin-bottom:6px;">
      Asimismo, se excluye al DICTAMINADOR de la responsabilidad derivada de cualquier otra acción que proviniendo de:
    </p>
    <ul style="font-size:8pt;font-family:Arial,sans-serif;list-style:none;padding-left:10px;">
      <li style="margin-bottom:3px;">○ Mal manejo de productos, herramientas o equipos.</li>
      <li style="margin-bottom:3px;">○ El mal uso que el usuario pueda darle a las instalaciones eléctricas</li>
      <li>○ Accidentes de trabajo provocados por imprudencias laborales, sabotaje, desórdenes sociales, vandalismo, guerra o terrorismo, fenómenos naturales, y cualquier otra causa ajena a la operación normal de la instalación, produzca un daño parcial o total, temporal o permanente a la instalación</li>
    </ul>

    ${firmaBlock}
  `;

  // ── Página 3: Reporte Fotográfico ─────────────────────────────────────────
  const makeFotoCell = (src) =>
    src
      ? `<td style="border:1px solid #bbb;padding:4px;width:33%;"><img src="${src}" style="width:100%;height:160px;object-fit:cover;display:block;" /></td>`
      : `<td style="border:1px solid #bbb;padding:4px;width:33%;height:168px;background:#f9f9f9;"></td>`;

  const fotos = dictamen.fotos || ['', '', '', '', '', ''];
  const page3 = `
    ${headerHtml(3, 4)}
    <div style="font-size:10pt;font-weight:bold;text-align:center;font-family:Arial,sans-serif;margin-bottom:12px;text-decoration:underline;">REPORTE FOTOGRAFICO</div>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        ${makeFotoCell(fotos[0])}
        ${makeFotoCell(fotos[1])}
        ${makeFotoCell(fotos[2])}
      </tr>
      <tr>
        ${makeFotoCell(fotos[3])}
        ${makeFotoCell(fotos[4])}
        ${makeFotoCell(fotos[5])}
      </tr>
    </table>
    ${firmaBlock}
  `;

  // ── Página 4: Acreditaciones ───────────────────────────────────────────────
  const acreds = dictamen.acreditaciones || ['', '', '', '', '', ''];
  const makeAcredCell = (src) =>
    src
      ? `<td style="border:1px solid #bbb;padding:6px;width:50%;"><img src="${src}" style="width:100%;height:175px;object-fit:contain;display:block;" /></td>`
      : `<td style="border:1px solid #bbb;padding:6px;width:50%;height:187px;background:#f9f9f9;"></td>`;

  const page4 = `
    ${headerHtml(4, 4)}
    <div style="font-size:10pt;font-weight:bold;text-align:center;font-family:Arial,sans-serif;margin-bottom:12px;text-decoration:underline;">ACREDITACIONES</div>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        ${makeAcredCell(acreds[0])}
        ${makeAcredCell(acreds[1])}
      </tr>
      <tr>
        ${makeAcredCell(acreds[2])}
        ${makeAcredCell(acreds[3])}
      </tr>
      <tr>
        ${makeAcredCell(acreds[4])}
        ${makeAcredCell(acreds[5])}
      </tr>
    </table>
    ${firmaBlock}
  `;

  const pages = [page1, page2, page3, page4];

  const wrapPage = (content, pageIdx) => `
    <div class="pdf-page" id="pdf-page-${pageIdx}" style="
      width:816px; height:1056px; box-sizing:border-box;
      padding:45px 50px 70px 50px; position:relative;
      background:#fff; overflow:hidden; font-family:Arial,sans-serif;
      float:left; border:1px solid #eee;
    ">
      ${watermark}
      <!-- Marca de agua lateral -->
      <div style="
        position:absolute; right:-38px; top:50%; transform:translateY(-50%) rotate(90deg);
        font-size:38pt; font-family:Arial,sans-serif; font-weight:900;
        color:#a91d22; opacity:0.07; letter-spacing:4px; white-space:nowrap;
        pointer-events:none;
      ">CONSULTORÍA</div>
      <div style="position:relative;z-index:10;height:946px;">${content}</div>
      ${footerHtml}
    </div>
  `;

  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:3400px;background:#f0f0f0;';
  document.body.appendChild(container);
  container.innerHTML = pages.map((p, i) => wrapPage(p, i)).join('');

  // Esperar imágenes
  const imgs = Array.from(container.querySelectorAll('img'));
  await Promise.all(imgs.map(img => new Promise(res => {
    if (img.complete) return res();
    img.onload = img.onerror = res;
  })));
  await new Promise(res => setTimeout(res, 400));

  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageNodes = container.querySelectorAll('.pdf-page');

  for (let i = 0; i < pageNodes.length; i++) {
    const canvas = await html2canvas(pageNodes[i], { scale: 2, useCORS: true, logging: false, backgroundColor: '#fff' });
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    if (i > 0) doc.addPage();
    doc.addImage(imgData, 'JPEG', 0, 0, 215.9, 279.4);
  }

  const nombre = (dictamen.nombre_comercial || 'Cliente').replace(/\s+/g, '_');
  doc.save(`Dictamen_${nombre}_${dictamen.numero_carta || 'SN'}.pdf`);
  document.body.removeChild(container);
};

/* ─── DictamenFormModal ─────────────────────────────────────────────────────── */
const DictamenFormModal = ({ initial, onSave, onClose }) => {
  const [d, setD] = useState(initial || { ...EMPTY_DICTAMEN });
  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }));
  const setFoto = (i, v) => setD(prev => { const f = [...(prev.fotos || Array(6).fill(''))]; f[i] = v; return { ...prev, fotos: f }; });
  const setAcred = (i, v) => setD(prev => { const a = [...(prev.acreditaciones || Array(6).fill(''))]; a[i] = v; return { ...prev, acreditaciones: a }; });

  const [tab, setTab] = useState('datos'); // 'datos' | 'fotos' | 'acreds'

  const TABS = [
    { id: 'datos', label: '📋 Datos Generales' },
    { id: 'fotos', label: '📷 Reporte Fotográfico' },
    { id: 'acreds', label: '🏆 Acreditaciones' },
  ];

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl z-10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="font-black text-slate-800 text-lg">
              {initial?.id ? 'Editar Dictamen' : 'Nuevo Dictamen'}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">Carta Dictamen de Instalaciones Eléctricas</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 flex-shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${tab === t.id ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {tab === 'datos' && (
            <div className="space-y-5">
              {/* Encabezado del documento */}
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Encabezado del Documento</p>
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="Número de carta">
                    <Input value={d.numero_carta} onChange={v => set('numero_carta', v)} placeholder="Ej. 409" />
                  </FieldRow>
                  <FieldRow label="Nombre comercial (header)">
                    <Input value={d.nombre_comercial_header} onChange={v => set('nombre_comercial_header', v)} placeholder="Ej. TIENDAS TRES B PUERTA REAL" />
                  </FieldRow>
                  <FieldRow label="Fecha de emisión">
                    <Input value={d.fecha_emision} onChange={v => set('fecha_emision', v)} placeholder="A 09 DE JULIO DEL 2026" />
                  </FieldRow>
                  <FieldRow label="Fecha de vencimiento">
                    <Input value={d.fecha_vencimiento} onChange={v => set('fecha_vencimiento', v)} placeholder="A 09 DE JULIO DE 2027" />
                  </FieldRow>
                  <FieldRow label="Lugar emisión">
                    <Input value={d.lugar_emision} onChange={v => set('lugar_emision', v)} placeholder="SANTIAGO DE QUERÉTARO, QRO." />
                  </FieldRow>
                  <FieldRow label="Lugar vencimiento">
                    <Input value={d.lugar_vencimiento} onChange={v => set('lugar_vencimiento', v)} placeholder="SANTIAGO DE QUERÉTARO, QRO." />
                  </FieldRow>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Datos técnicos */}
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Datos Técnicos de la Instalación</p>
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="Tipo de instalación">
                    <Input value={d.tipo_instalacion} onChange={v => set('tipo_instalacion', v)} placeholder="ELÉCTRICA" />
                  </FieldRow>
                  <FieldRow label="Tipo de acometida">
                    <Input value={d.tipo_acometida} onChange={v => set('tipo_acometida', v)} placeholder="" />
                  </FieldRow>
                  <FieldRow label="Baja tensión líneas CFE">
                    <Input value={d.baja_tension} onChange={v => set('baja_tension', v)} placeholder="" />
                  </FieldRow>
                  <FieldRow label="Voltaje de alimentación">
                    <Input value={d.voltaje_alimentacion} onChange={v => set('voltaje_alimentacion', v)} placeholder="220V 3 FASES 5 H" />
                  </FieldRow>
                  <FieldRow label="Clasificación de riesgo">
                    <select value={d.clasificacion_riesgo} onChange={e => set('clasificacion_riesgo', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                      <option>ALTO</option>
                      <option>MEDIO</option>
                      <option>BAJO</option>
                    </select>
                  </FieldRow>
                  <FieldRow label="Estado">
                    <select value={d.estado} onChange={e => set('estado', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-amber-400">
                      {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </FieldRow>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Datos del negocio */}
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Datos del Negocio / Cliente</p>
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="Giro según SCIAN" className="col-span-2">
                    <Textarea value={d.giro_scian} onChange={v => set('giro_scian', v)} placeholder="COMERCIO AL POR MAYOR DE ABARROTES..." rows={2} />
                  </FieldRow>
                  <FieldRow label="Código SCIAN">
                    <Input value={d.scian_codigo} onChange={v => set('scian_codigo', v)} placeholder="431" />
                  </FieldRow>
                  <FieldRow label="Nombre comercial">
                    <Input value={d.nombre_comercial} onChange={v => set('nombre_comercial', v)} placeholder="TIENDAS TRES B PUERTA REAL" />
                  </FieldRow>
                  <FieldRow label="Razón social" className="col-span-2">
                    <Input value={d.razon_social} onChange={v => set('razon_social', v)} placeholder="TIENDAS TRES B S.A. DE C.V." />
                  </FieldRow>
                  <FieldRow label="RFC e CURP">
                    <Input value={d.rfc_curp} onChange={v => set('rfc_curp', v)} placeholder="TTB040915CY9" />
                  </FieldRow>
                  <FieldRow label="Nombre del propietario / representante legal">
                    <Input value={d.nombre_propietario} onChange={v => set('nombre_propietario', v)} placeholder="ERIKA ORIHUELA LLAMPALLAS" />
                  </FieldRow>
                  <FieldRow label="Dirección" className="col-span-2">
                    <Textarea value={d.direccion} onChange={v => set('direccion', v)} placeholder="PUERTA REAL, AV. CAMINO REAL A VENEGAS, No. 232, CORREGIDORA, QUERETARO, QRO." rows={2} />
                  </FieldRow>
                  <FieldRow label="Teléfono">
                    <Input value={d.telefono} onChange={v => set('telefono', v)} placeholder="44211 63 962" />
                  </FieldRow>
                  <FieldRow label="Correo electrónico">
                    <Input value={d.correo} onChange={v => set('correo', v)} placeholder="adm.securus.consultotia@gmail.com" />
                  </FieldRow>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Datos del perito firmante */}
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Datos del Perito Firmante</p>
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="Nombre del ingeniero" className="col-span-2">
                    <Input value={d.ing_nombre} onChange={v => set('ing_nombre', v)} placeholder="ING. JUAN ERASMO CUAYA GRANADOS" />
                  </FieldRow>
                  <FieldRow label="Cédula profesional">
                    <Input value={d.cedula} onChange={v => set('cedula', v)} placeholder="8101909" />
                  </FieldRow>
                  <FieldRow label="Teléfono del perito">
                    <Input value={d.telefono_ing} onChange={v => set('telefono_ing', v)} placeholder="442 6767490" />
                  </FieldRow>
                  <FieldRow label="Registro colegio" className="col-span-2">
                    <Textarea value={d.colegio} onChange={v => set('colegio', v)} placeholder="CIENQRO 002 2024..." rows={2} />
                  </FieldRow>
                  <FieldRow label="Domicilio notificaciones" className="col-span-2">
                    <Textarea value={d.domicilio_notificaciones} onChange={v => set('domicilio_notificaciones', v)} placeholder="AV PASEO DE LA ALBORADA #1001..." rows={2} />
                  </FieldRow>
                  <FieldRow label="Nombre firma PDF" className="col-span-2">
                    <Input value={d.nombre_firma} onChange={v => set('nombre_firma', v)} placeholder="ING JUAN ERASMO CUAYA GRANADOS" />
                  </FieldRow>
                  <FieldRow label="Cédula firma PDF" className="col-span-2">
                    <Input value={d.ced_firma} onChange={v => set('ced_firma', v)} placeholder="CED. PROF. 8101909..." />
                  </FieldRow>
                  <FieldRow label="Seguridad industrial firma PDF" className="col-span-2">
                    <Input value={d.seg_firma} onChange={v => set('seg_firma', v)} placeholder="SEGURIDAD INDUSTRIAL SC122275" />
                  </FieldRow>
                </div>
              </div>
            </div>
          )}

          {tab === 'fotos' && (
            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">Reporte Fotográfico (6 imágenes)</p>
              <div className="grid grid-cols-3 gap-4">
                {(d.fotos || Array(6).fill('')).map((f, i) => (
                  <ImageSlot key={i} value={f} onChange={v => setFoto(i, v)} label={`Foto ${i + 1}`} />
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4 text-center">Haz clic o arrastra imágenes para subirlas. Se renderizarán en el PDF.</p>
            </div>
          )}

          {tab === 'acreds' && (
            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">Acreditaciones (6 imágenes)</p>
              <div className="grid grid-cols-2 gap-4">
                {(d.acreditaciones || Array(6).fill('')).map((a, i) => (
                  <ImageSlot key={i} value={a} onChange={v => setAcred(i, v)} label={`Acreditación ${i + 1}`} />
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4 text-center">Documentos, credenciales, cédulas u otras acreditaciones del perito.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end flex-shrink-0 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => { onSave(d); onClose(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold transition-all shadow-sm"
          >
            <Save size={15} />
            Guardar Dictamen
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── DictaminacionSection (main export) ──────────────────────────────────── */
const DictaminacionSection = ({ readOnly = false }) => {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ecg_dictamenes_v2') || '[]'); } catch { return []; }
  });
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [viewItem, setViewItem]     = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [generating, setGenerating] = useState(null);

  const persist = (updated) => {
    localStorage.setItem('ecg_dictamenes_v2', JSON.stringify(updated));
    setItems(updated);
  };

  const save = (data) => {
    if (data.id) {
      persist(items.map(i => i.id === data.id ? { ...data } : i));
    } else {
      persist([{ ...data, id: uid(), createdAt: new Date().toISOString() }, ...items]);
    }
  };

  const del = (id) => { persist(items.filter(i => i.id !== id)); setConfirmDel(null); };

  const handleGeneratePDF = async (dictamen) => {
    setGenerating(dictamen.id);
    try {
      await generateDictamenPDF(dictamen);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error al generar el PDF. Revisa la consola.');
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateWord = (dictamen) => {
    try {
      generateDictamenWord(dictamen);
    } catch (err) {
      console.error('Error generando Word:', err);
      alert('Error al generar el archivo Word.');
    }
  };

  const counts = Object.fromEntries(
    Object.keys(STATUS_MAP).map(k => [k, items.filter(i => i.estado === k).length])
  );

  return (
    <div>
      {showForm && (
        <DictamenFormModal
          initial={null}
          onSave={save}
          onClose={() => setShowForm(false)}
        />
      )}
      {editItem && (
        <DictamenFormModal
          initial={editItem}
          onSave={save}
          onClose={() => setEditItem(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dictaminación</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {readOnly ? 'Vista de dictámenes (solo lectura)' : 'Registro, edición y generación de cartas dictamen en PDF'}
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-sm text-sm transition-all"
          >
            <Plus size={16} /> Nuevo Dictamen
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <div key={k} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${v.cls}`}>{v.label}</span>
            <p className="text-3xl font-black text-slate-800 mt-1">{counts[k] || 0}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-800">Listado de Dictámenes</h2>
          <span className="text-xs bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full">{items.length} total</span>
        </div>

        {items.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <ClipboardList size={40} className="text-slate-200" />
            <p className="text-slate-400 font-medium">No hay dictámenes aún.</p>
            {!readOnly && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 font-bold rounded-xl text-sm hover:bg-amber-100 transition-colors"
              >
                <Plus size={14} /> Crear primer dictamen
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Carta</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nombre Comercial</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Riesgo</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded">
                        {item.numero_carta || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-800 text-sm">{item.nombre_comercial || '—'}</span>
                      <br />
                      <span className="text-xs text-slate-400">{item.razon_social || ''}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        item.clasificacion_riesgo === 'ALTO' ? 'bg-red-100 text-red-700' :
                        item.clasificacion_riesgo === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.clasificacion_riesgo || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {readOnly ? (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_MAP[item.estado]?.cls || 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_MAP[item.estado]?.label || item.estado}
                        </span>
                      ) : (
                        <select
                          value={item.estado}
                          onChange={e => persist(items.map(i => i.id === item.id ? { ...i, estado: e.target.value } : i))}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${STATUS_MAP[item.estado]?.cls || 'bg-slate-100 text-slate-600'}`}
                        >
                          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-sm">{fmtDate(item.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Generar PDF */}
                        <button
                          onClick={() => handleGeneratePDF(item)}
                          disabled={generating === item.id}
                          title="Generar PDF"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-50"
                        >
                          {generating === item.id
                            ? <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            : <FileDown size={15} />
                          }
                        </button>
                        {/* Generar Word (Editable) */}
                        <button
                          onClick={() => handleGenerateWord(item)}
                          title="Descargar Word (Editable)"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <FileText size={15} />
                        </button>
                        {/* Editar */}
                        {!readOnly && (
                          <button
                            onClick={() => setEditItem(item)}
                            title="Editar"
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        {/* Eliminar */}
                        {!readOnly && (confirmDel === item.id ? (
                          <>
                            <button onClick={() => del(item.id)} className="text-xs bg-red-600 text-white font-bold px-2.5 py-1 rounded-lg hover:bg-red-700">
                              Eliminar
                            </button>
                            <button onClick={() => setConfirmDel(null)} className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-lg">✕</button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDel(item.id)}
                            title="Eliminar"
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-amber-600" />
            <span className="text-xs font-black text-amber-700 uppercase tracking-wider">PDF con 4 páginas</span>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">El PDF generado incluye: <strong>Carta Dictamen</strong>, <strong>Normatividad</strong>, <strong>Reporte Fotográfico</strong> y <strong>Acreditaciones</strong>.</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Camera size={16} className="text-blue-600" />
            <span className="text-xs font-black text-blue-700 uppercase tracking-wider">Imágenes en PDF</span>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">Sube hasta <strong>6 fotos</strong> para el reporte fotográfico y <strong>6 imágenes</strong> de acreditaciones del perito.</p>
        </div>
      </div>
    </div>
  );
};

export default DictaminacionSection;
