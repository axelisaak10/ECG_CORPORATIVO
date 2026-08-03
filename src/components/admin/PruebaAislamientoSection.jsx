import React, { useState } from 'react';
import {
  Plus, Trash2, X, FileDown, Save,
  Zap, CheckCircle, XCircle, Activity
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2);
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ─── Combinaciones de prueba fijas ───────────────────────────────────────── */
const COMBINACIONES = [
  'Fase A – Fase B (L1 – L2)',
  'Fase A – Fase C (L1 – L3)',
  'Fase A – Fase C (L1 – L3)',
  'Fase B – Fase C (L2 – L3)',
  'Fase A – Neutro (L1 – N)',
  'Fase B – Neutro (L2 – N)',
  'Fase C – Neutro (L3 – N)',
  'Fase A – Tierra (L1 – PE/GND)',
  'Fase B – Tierra (L2 – PE/GND)',
  'Fase C – Tierra (L3 – PE/GND)',
  'Neutro – Tierra (N – PE/GND)',
];

const MEDICION_VACIA = (comb) => ({
  combinacion: comb,
  voltaje: '500V',
  tiempo: '1 min',
  resistencia_medida: '',
  resistencia_corregida: '',
  resultado: 'pasa',
});

const EMPTY_PRUEBA = {
  id: '',
  folio: '',
  empresa_cliente: '',
  planta_ubicacion: '',
  area_subestacion: '',
  id_circuito: '',
  equipo_origen: '',
  equipo_carga: '',
  calibre_calibracion: '',
  tension_nominal: '\u2264 600V',
  alimentador_tipo: 'THW / RHW',
  longitud_aprox: '',
  n_conductores: '',
  temp_ambiente: '',
  humedad_relativa: '',
  factor_correccion: '',
  estado_conduccion: [],
  marca_equipo: 'Megger / Fluke',
  modelo_equipo: '',
  numero_serie: '',
  fecha_calibracion: '',
  mediciones: COMBINACIONES.map(MEDICION_VACIA),
  observaciones: '',
  tecnico_nombre: '',
  tecnico_cargo: '',
  tecnico_empresa: '',
  tecnico_certificacion: '',
  supervisor_nombre: '',
  supervisor_cargo: '',
  supervisor_empresa: '',
  supervisor_certificacion: '',
  estado: 'en_proceso',
  createdAt: '',
};

const STATUS_MAP = {
  en_proceso: { label: 'En proceso', cls: 'bg-blue-100 text-blue-700' },
  aprobado:   { label: 'Aprobado',   cls: 'bg-green-100 text-green-700' },
  rechazado:  { label: 'Rechazado',  cls: 'bg-red-100 text-red-700' },
};

/* ─── Primitivos UI ──────────────────────────────────────────────────────── */
const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-slate-300';
const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5';

const Field = ({ label, children, col = '' }) => (
  <div className={col}>
    <label className={labelCls}>{label}</label>
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder, type = 'text' }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} className={inputCls} />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    rows={rows} className={inputCls + ' resize-none'} />
);

const SectionTitle = ({ number, title }) => (
  <div className="flex items-center gap-3 py-2 px-4 rounded-xl mb-4 bg-slate-700">
    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-xs font-black flex-shrink-0">{number}</span>
    <span className="text-white text-xs font-black uppercase tracking-widest">{title}</span>
  </div>
);

/* ─── PDF Generator ──────────────────────────────────────────────────────── */
const generatePruebaAislamientoPDF = async (p) => {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const W = 215.9;
  const logoUrl = '/assets/logos/centro.png';

  const loadImage = (url) => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
  });

  const logo = await loadImage(logoUrl);

  const drawHeader = () => {
    if (logo) doc.addImage(logo, 'PNG', 13, 8, 26, 15);
    doc.setFillColor(20, 30, 70);
    doc.rect(41, 8, W - 54, 8, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(255, 255, 255);
    doc.text('PRUEBA DE RESISTENCIA DE AISLAMIENTO', 43, 13.5);
    doc.setFillColor(180, 0, 30); doc.rect(41, 16, W - 54, 5.5, 'F');
    doc.setFontSize(6.5);
    doc.text('Conductores de Baja Tensi\u00f3n  \u2022  Basado en NFPA 70B / ANSI NETA MTS', 43, 19.5);
    doc.setFillColor(240, 240, 240); doc.rect(41, 21.5, W - 54, 6, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(60, 60, 60);
    const d = p.createdAt ? new Date(p.createdAt) : new Date();
    const ds = `${String(d.getDate()).padStart(2,'0')} / ${String(d.getMonth()+1).padStart(2,'0')} / ${d.getFullYear()}`;
    doc.text(`FOLIO N\u00b0: REG-ANTE: AI-${p.folio || '0001'}    FECHA DE PRUEBA: ${ds}    NORMA REF.: NFPA 70B (Cap. 11)/79`, 43, 25.5);
    doc.setLineWidth(0.5); doc.setDrawColor(180, 0, 30);
    doc.line(13, 28, W - 13, 28);
  };

  drawHeader();
  let y = 33;

  const cell = (label, value, x, cy, w) => {
    doc.setFillColor(245, 245, 245); doc.rect(x, cy, w, 9, 'F');
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2); doc.rect(x, cy, w, 9, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(100, 100, 100);
    doc.text(label, x + 1.5, cy + 3);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(30, 30, 30);
    doc.text(String(value || ''), x + 1.5, cy + 7, { maxWidth: w - 3 });
  };

  // Secci\u00f3n 1
  doc.setFillColor(20, 30, 70); doc.rect(13, y, W - 26, 6, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255,255,255);
  doc.text('1. INFORMACI\u00d3N DEL PROYECTO E INSTALACI\u00d3N', 15, y + 4);
  y += 7;
  const c3 = (W - 26) / 3;
  cell('Empresa / Cliente:', p.empresa_cliente, 13, y, c3);
  cell('Planta / Ubicaci\u00f3n:', p.planta_ubicacion, 13 + c3, y, c3);
  cell('\u00c1rea / Subestaci\u00f3n:', p.area_subestacion, 13 + c3*2, y, c3);
  y += 10;
  cell('Identificaci\u00f3n del Circuito / Alimentadores:', p.id_circuito, 13, y, c3);
  cell('Equipo de Origen / Tablero:', p.equipo_origen, 13 + c3, y, c3);
  cell('Equipo Carga / Destino:', p.equipo_carga, 13 + c3*2, y, c3);
  y += 11;

  // Secci\u00f3n 2
  doc.setFillColor(20, 30, 70); doc.rect(13, y, W - 26, 6, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255,255,255);
  doc.text('2. ESPECIFICACIONES DEL CONDUCTOR Y CONDICIONES AMBIENTALES', 15, y + 4);
  y += 7;
  const c4 = (W - 26) / 4;
  cell('Calibre / Calibraci\u00f3n:', p.calibre_calibracion, 13, y, c4);
  cell('Tensi\u00f3n Nominal Cable:', p.tension_nominal, 13+c4, y, c4);
  cell('Alimentador / Tipo:', p.alimentador_tipo, 13+c4*2, y, c4);
  cell('Longitud Aprox.:', p.longitud_aprox ? p.longitud_aprox + ' m' : '', 13+c4*3, y, c4);
  y += 10;
  cell('N\u00b0 Conductores/Fase:', p.n_conductores, 13, y, c4);
  cell('Temp. Ambiente (\u00b0C):', p.temp_ambiente, 13+c4, y, c4);
  cell('Humedad Relativa (%):', p.humedad_relativa, 13+c4*2, y, c4);
  cell('Factor Correc. Temp. (\u00b0C):', p.factor_correccion, 13+c4*3, y, c4);
  y += 11;

  // Secci\u00f3n 3
  doc.setFillColor(20, 30, 70); doc.rect(13, y, W - 26, 6, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255,255,255);
  doc.text('3. DATOS DEL EQUIPO DE MEDICI\u00d3N (MEG\u00d3HMETRO / MEDIDOR DE AISLAMIENTO)', 15, y + 4);
  y += 7;
  cell('Marca del Equipo:', p.marca_equipo, 13, y, c4);
  cell('Modelo:', p.modelo_equipo, 13+c4, y, c4);
  cell('N\u00famero de Serie:', p.numero_serie, 13+c4*2, y, c4);
  cell('Fecha de Calibraci\u00f3n:', p.fecha_calibracion, 13+c4*3, y, c4);
  y += 11;

  // Secci\u00f3n 4 — Tabla
  doc.setFillColor(20, 30, 70); doc.rect(13, y, W - 26, 6, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255,255,255);
  doc.text('4. REGISTRO DE MEDICIONES DE RESISTENCIA DE AISLAMIENTO', 15, y + 4);
  y += 7;

  const tableBody = (p.mediciones || []).map(m => [
    m.combinacion,
    m.voltaje,
    m.tiempo,
    m.resistencia_medida ? m.resistencia_medida + ' M\u03a9' : '',
    m.resistencia_corregida ? m.resistencia_corregida + ' M\u03a9' : '',
    '100 M\u03a9 *',
    m.resultado === 'pasa' ? 'PASA' : 'NO PASA',
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: 13, right: 13 },
    head: [['Combinaci\u00f3n de Prueba', 'Voltaje (V DC)', 'Tiempo', 'Resistencia Medida', 'Resistencia Corregida @ 20\u00b0C', 'M\u00ednimo Requerido', 'Resultado']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [20, 30, 70], textColor: 255, fontSize: 7, fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 7, cellPadding: 1.8, textColor: 40, lineColor: [200, 200, 200], lineWidth: 0.15 },
    columnStyles: {
      0: { cellWidth: 48 },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 33, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 'auto', halign: 'center' },
    },
    didDrawCell: (data) => {
      if (data.column.index === 6 && data.section === 'body') {
        const isPass = data.cell.raw === 'PASA';
        doc.setFillColor(isPass ? 220 : 255, isPass ? 255 : 220, isPass ? 220 : 220);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
        doc.setTextColor(isPass ? 0 : 160, isPass ? 130 : 0, 0);
        doc.text(data.cell.raw, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1.5, { align: 'center' });
      }
    },
  });

  y = doc.lastAutoTable.finalY + 4;

  // Gu\u00eda
  doc.setFillColor(255, 252, 230); doc.rect(13, y, W - 26, 16, 'F');
  doc.setDrawColor(220, 180, 0); doc.setLineWidth(0.3); doc.rect(13, y, W - 26, 16, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(80, 60, 0);
  doc.text('GU\u00cdA DE VOLTAJE DE PRUEBA Y VALORES M\u00cdNIMOS DE AISLAMIENTO (NFPA 70B / NETA MTS TABLE 10.1):', 15, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.text('\u2022 Tensi\u00f3n Nominal del Cable (0 \u2013 600 V): Voltaje Recomendado = 500 V DC. De 601 V a 5000 V: Voltaje Recomendado = 1000 V DC.', 15, y + 8.5);
  doc.text('\u2022 Resistencia al Valores Aceptable (NFPA 70B): \u2265 25 M\u03a9 y 100 M\u03a9 (valores corregidos a 20\u00b0C). Para instalaciones nuevas: \u2265 100 M\u03a9.', 15, y + 12.5);
  y += 18;

  // Secci\u00f3n 5
  if (y > 215) { doc.addPage(); drawHeader(); y = 35; }
  doc.setFillColor(20, 30, 70); doc.rect(13, y, W - 26, 6, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255,255,255);
  doc.text('5. OBSERVACIONES, DIAGN\u00d3STICO Y RECOMENDACIONES', 15, y + 4);
  y += 7;
  doc.setFillColor(250, 250, 250); doc.rect(13, y, W - 26, 22, 'F');
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2); doc.rect(13, y, W - 26, 22, 'S');
  doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(80, 80, 80);
  const obsLines = doc.splitTextToSize(p.observaciones || 'Sin observaciones.', W - 30);
  doc.text(obsLines, 15, y + 5);
  y += 24;

  // Secci\u00f3n 6
  if (y > 215) { doc.addPage(); drawHeader(); y = 35; }
  doc.setFillColor(20, 30, 70); doc.rect(13, y, W - 26, 6, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255,255,255);
  doc.text('6. VALIDACIONES Y FIRMAS DE CONFORMIDAD', 15, y + 4);
  y += 8;
  const hw = (W - 30) / 2;
  const signBox = (label, nombre, cargo, empresa, cert, x) => {
    doc.setFillColor(250, 250, 250); doc.rect(x, y, hw, 34, 'F');
    doc.setDrawColor(180, 0, 30); doc.setLineWidth(0.3); doc.rect(x, y, hw, 34, 'S');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(180, 0, 30);
    doc.text(label, x + hw / 2, y + 6, { align: 'center' });
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.15);
    doc.line(x + 4, y + 17, x + hw - 4, y + 17);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(60, 60, 60);
    doc.text('Nombre: ' + (nombre || ''), x + 3, y + 22);
    doc.text('Cargo / Empresa / Certificaci\u00f3n:', x + 3, y + 27);
    doc.text([cargo, empresa, cert].filter(Boolean).join(' / '), x + 3, y + 31, { maxWidth: hw - 6 });
  };
  signBox('T\u00c9CNICO / EVALUADOR RESPONSABLE', p.tecnico_nombre, p.tecnico_cargo, p.tecnico_empresa, p.tecnico_certificacion, 13);
  signBox('SUPERVISOR / CLIENTE / REPRESENTANTE', p.supervisor_nombre, p.supervisor_cargo, p.supervisor_empresa, p.supervisor_certificacion, 13 + hw + 4);

  // Footer
  doc.setFillColor(20, 30, 70); doc.rect(13, 263, W - 26, 6, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(255, 255, 255);
  doc.text('Tel. (442) 773 4562 \u2014 centroecging@gmail.com  |  NFPA 70B / ANSI NETA MTS', W / 2, 266.5, { align: 'center' });

  doc.save(`Prueba_Aislamiento_${p.folio || 'SN'}_${(p.empresa_cliente || 'ECG').replace(/\s+/g,'_')}.pdf`);
};

/* ─── Modal del formulario ───────────────────────────────────────────────── */
const PruebaFormModal = ({ initial, onSave, onClose }) => {
  const [d, setD] = useState(() => ({ ...EMPTY_PRUEBA, ...initial }));
  const [tab, setTab] = useState('info');
  const set = (k, v) => setD(prev => ({ ...prev, [k]: v }));
  const setMed = (i, k, v) => setD(prev => {
    const meds = [...prev.mediciones];
    meds[i] = { ...meds[i], [k]: v };
    return { ...prev, mediciones: meds };
  });

  const tabs = [
    { id: 'info', label: '1–3 Datos Generales' },
    { id: 'meds', label: '4 Mediciones' },
    { id: 'obs',  label: '5–6 Obs. y Firmas' },
  ];

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl z-10 max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Zap size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Prueba de Resistencia de Aislamiento</h3>
              <p className="text-[11px] text-slate-400">NFPA 70B / ANSI NETA MTS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0 px-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                tab === t.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* ── TAB 1: Datos generales ──────────────────────────────────── */}
          {tab === 'info' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Folio / N° de Prueba">
                  <Input value={d.folio} onChange={v => set('folio', v)} placeholder="AI-0001" />
                </Field>
                <Field label="Estado">
                  <select value={d.estado} onChange={e => set('estado', e.target.value)} className={inputCls}>
                    {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </Field>
              </div>

              {/* Sección 1 */}
              <div>
                <SectionTitle number="1" title="Información del Proyecto e Instalación" />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Empresa / Cliente"><Input value={d.empresa_cliente} onChange={v => set('empresa_cliente', v)} placeholder="ECG Corporativo" /></Field>
                  <Field label="Planta / Ubicación"><Input value={d.planta_ubicacion} onChange={v => set('planta_ubicacion', v)} placeholder="Planta Norte" /></Field>
                  <Field label="Área / Subestación"><Input value={d.area_subestacion} onChange={v => set('area_subestacion', v)} placeholder="Sub-E3" /></Field>
                  <Field label="Identificación del Circuito / Alimentadores"><Input value={d.id_circuito} onChange={v => set('id_circuito', v)} placeholder="ALM-3 / 4x0 AWG" /></Field>
                  <Field label="Equipo de Origen / Tablero"><Input value={d.equipo_origen} onChange={v => set('equipo_origen', v)} placeholder="Tablero General TG-01" /></Field>
                  <Field label="Equipo Carga / Destino"><Input value={d.equipo_carga} onChange={v => set('equipo_carga', v)} placeholder="Motor Bomba MB-05" /></Field>
                </div>
              </div>

              {/* Sección 2 */}
              <div>
                <SectionTitle number="2" title="Especificaciones del Conductor y Condiciones Ambientales" />
                <div className="grid grid-cols-4 gap-3">
                  <Field label="Calibre / Calibración"><Input value={d.calibre_calibracion} onChange={v => set('calibre_calibracion', v)} placeholder="____ AWG / kcmil" /></Field>
                  <Field label="Tensión Nominal Cable">
                    <select value={d.tension_nominal} onChange={e => set('tension_nominal', e.target.value)} className={inputCls}>
                      {['\u2264 600V', '601V \u2013 1000V', '1001V \u2013 2500V', '2501V \u2013 5000V', '5001V \u2013 15000V'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Alimentador / Tipo"><Input value={d.alimentador_tipo} onChange={v => set('alimentador_tipo', v)} placeholder="THW / RHW" /></Field>
                  <Field label="Longitud Aprox. (m)"><Input value={d.longitud_aprox} onChange={v => set('longitud_aprox', v)} placeholder="_____ m" /></Field>
                  <Field label="N° Conductores/Fase"><Input value={d.n_conductores} onChange={v => set('n_conductores', v)} placeholder="1 / 2 / 3..." /></Field>
                  <Field label="Temp. Ambiente (°C)"><Input value={d.temp_ambiente} onChange={v => set('temp_ambiente', v)} placeholder="______ °C" /></Field>
                  <Field label="Humedad Relativa (%)"><Input value={d.humedad_relativa} onChange={v => set('humedad_relativa', v)} placeholder="______ %" /></Field>
                  <Field label="Factor Correc. Temp. (°C)"><Input value={d.factor_correccion} onChange={v => set('factor_correccion', v)} placeholder="p. ej., 25°C" /></Field>
                  <Field label="Estado de Conducción / Datos" col="col-span-2">
                    <div className="flex gap-4 mt-1">
                      {['Seco', 'H\u00famedo', 'Limpio'].map(e => (
                        <label key={e} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                          <input type="checkbox"
                            checked={(d.estado_conduccion || []).includes(e)}
                            onChange={ev => {
                              const arr = d.estado_conduccion || [];
                              set('estado_conduccion', ev.target.checked ? [...arr, e] : arr.filter(x => x !== e));
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                          {e}
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>

              {/* Sección 3 */}
              <div>
                <SectionTitle number="3" title="Datos del Equipo de Medición (Megóhmetro / Medidor de Aislamiento)" />
                <div className="grid grid-cols-4 gap-3">
                  <Field label="Marca del Equipo"><Input value={d.marca_equipo} onChange={v => set('marca_equipo', v)} placeholder="Megger / Fluke" /></Field>
                  <Field label="Modelo"><Input value={d.modelo_equipo} onChange={v => set('modelo_equipo', v)} placeholder="MIT430-2" /></Field>
                  <Field label="Número de Serie"><Input value={d.numero_serie} onChange={v => set('numero_serie', v)} placeholder="SN-XXXXXXXX" /></Field>
                  <Field label="Fecha de Calibración"><Input type="date" value={d.fecha_calibracion} onChange={v => set('fecha_calibracion', v)} /></Field>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: Mediciones ───────────────────────────────────────── */}
          {tab === 'meds' && (
            <div>
              <SectionTitle number="4" title="Registro de Mediciones de Resistencia de Aislamiento" />
              <p className="text-xs text-slate-400 mb-4">
                Ingresa los valores medidos. La resistencia mínima requerida es <strong>100 MΩ</strong> (NFPA 70B / NETA MTS).
                Al ingresar la Resistencia Corregida el resultado se actualiza automáticamente. También puedes cambiarlo haciendo clic.
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-700 text-white">
                      {['Combinación de Prueba','Voltaje (V DC)','Tiempo','Resist. Medida (MΩ)','Resist. Corregida @ 20°C (MΩ)','Mín. Req.','Resultado'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-[11px] font-bold text-center first:text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(d.mediciones || []).map((m, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-2 font-medium text-slate-700 text-[11px]">{m.combinacion}</td>
                        <td className="px-2 py-2">
                          <select value={m.voltaje} onChange={e => setMed(i, 'voltaje', e.target.value)}
                            className="w-full text-center text-[11px] border border-slate-200 rounded-lg px-1 py-1.5 bg-white focus:outline-none focus:border-blue-400">
                            {['500V','1000V'].map(v => <option key={v}>{v}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <select value={m.tiempo} onChange={e => setMed(i, 'tiempo', e.target.value)}
                            className="w-full text-center text-[11px] border border-slate-200 rounded-lg px-1 py-1.5 bg-white focus:outline-none focus:border-blue-400">
                            {['1 min','10 min'].map(v => <option key={v}>{v}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" min="0" step="0.1" value={m.resistencia_medida}
                            onChange={e => setMed(i, 'resistencia_medida', e.target.value)}
                            placeholder="MΩ"
                            className="w-full text-center text-[11px] border border-slate-200 rounded-lg px-1 py-1.5 bg-white focus:outline-none focus:border-blue-400" />
                        </td>
                        <td className="px-2 py-2">
                          <input type="number" min="0" step="0.1" value={m.resistencia_corregida}
                            onChange={e => {
                              const val = e.target.value;
                              setMed(i, 'resistencia_corregida', val);
                              if (val !== '') setMed(i, 'resultado', parseFloat(val) >= 100 ? 'pasa' : 'no_pasa');
                            }}
                            placeholder="MΩ"
                            className="w-full text-center text-[11px] border border-slate-200 rounded-lg px-1 py-1.5 bg-white focus:outline-none focus:border-blue-400" />
                        </td>
                        <td className="px-2 py-2 text-center font-bold text-slate-500 text-[11px]">100 MΩ</td>
                        <td className="px-2 py-2">
                          <div
                            onClick={() => setMed(i, 'resultado', m.resultado === 'pasa' ? 'no_pasa' : 'pasa')}
                            className={`flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black cursor-pointer select-none transition-colors ${
                              m.resultado === 'pasa' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {m.resultado === 'pasa'
                              ? <><CheckCircle size={11} /> PASA</>
                              : <><XCircle size={11} /> NO PASA</>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 3: Observaciones y Firmas ───────────────────────────── */}
          {tab === 'obs' && (
            <div className="space-y-5">
              <div>
                <SectionTitle number="5" title="Observaciones, Diagnóstico y Recomendaciones" />
                <Textarea value={d.observaciones} onChange={v => set('observaciones', v)}
                  placeholder="Indicar cualquier anomalía en el aislamiento, discusión entre fases (porcentaje > 100), humedad detectada o acciones correctivas requeridas…"
                  rows={5} />
              </div>
              <div>
                <SectionTitle number="6" title="Validaciones y Firmas de Conformidad" />
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { title: 'Técnico / Evaluador Responsable', prefix: 'tecnico' },
                    { title: 'Supervisor / Cliente / Representante', prefix: 'supervisor' },
                  ].map(({ title, prefix }) => (
                    <div key={prefix} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">{title}</p>
                      <div className="border-b border-slate-300 pb-2" />
                      <Field label="Nombre"><Input value={d[prefix + '_nombre']} onChange={v => set(prefix + '_nombre', v)} placeholder="Nombre completo" /></Field>
                      <Field label="Cargo"><Input value={d[prefix + '_cargo']} onChange={v => set(prefix + '_cargo', v)} placeholder="Cargo" /></Field>
                      <Field label="Empresa"><Input value={d[prefix + '_empresa']} onChange={v => set(prefix + '_empresa', v)} placeholder="Empresa" /></Field>
                      <Field label="Certificación"><Input value={d[prefix + '_certificacion']} onChange={v => set(prefix + '_certificacion', v)} placeholder="Cédula / Certificación" /></Field>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end flex-shrink-0 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button onClick={() => { onSave(d); onClose(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold shadow-sm transition-all">
            <Save size={15} /> Guardar Prueba
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Export ────────────────────────────────────────────────────────── */
const PruebaAislamientoSection = ({ readOnly = false }) => {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ecg_pruebas_aislamiento_v1') || '[]'); } catch { return []; }
  });
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [generating, setGenerating] = useState(null);

  const persist = (updated) => {
    localStorage.setItem('ecg_pruebas_aislamiento_v1', JSON.stringify(updated));
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

  const handlePDF = async (item) => {
    setGenerating(item.id);
    try { await generatePruebaAislamientoPDF(item); }
    catch (e) { console.error(e); alert('Error al generar PDF'); }
    finally { setGenerating(null); }
  };

  const counts = Object.fromEntries(
    Object.keys(STATUS_MAP).map(k => [k, items.filter(i => i.estado === k).length])
  );

  return (
    <div>
      {showForm && <PruebaFormModal initial={null} onSave={save} onClose={() => setShowForm(false)} />}
      {editItem  && <PruebaFormModal initial={editItem} onSave={save} onClose={() => setEditItem(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Prueba de Resistencia de Aislamiento</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {readOnly ? 'Vista de pruebas (solo lectura)' : 'Registro de mediciones de megóhmetro — NFPA 70B / ANSI NETA MTS'}
          </p>
        </div>
        {!readOnly && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-sm text-sm transition-all">
            <Plus size={16} /> Nueva Prueba
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
          <h2 className="font-extrabold text-slate-800">Registro de Pruebas de Aislamiento</h2>
          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">{items.length} total</span>
        </div>

        {items.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <Zap size={40} className="text-slate-200" />
            <p className="text-slate-400 font-medium">No hay pruebas registradas aún.</p>
            {!readOnly && (
              <button onClick={() => setShowForm(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl text-sm hover:bg-blue-100 transition-colors">
                <Plus size={14} /> Registrar primera prueba
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {['Folio','Empresa / Circuito','Equipo','Resultados','Estado','Fecha','Acciones'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map(item => {
                  const pasas   = (item.mediciones || []).filter(m => m.resultado === 'pasa').length;
                  const noPasas = (item.mediciones || []).filter(m => m.resultado === 'no_pasa').length;
                  return (
                    <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">{item.folio || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800 text-sm">{item.empresa_cliente || '—'}</span>
                        <br /><span className="text-xs text-slate-400">{item.id_circuito || ''}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{item.equipo_origen || '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {pasas > 0 && (
                            <span className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              <CheckCircle size={10} /> {pasas} Pasa
                            </span>
                          )}
                          {noPasas > 0 && (
                            <span className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              <XCircle size={10} /> {noPasas} No pasa
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {readOnly ? (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_MAP[item.estado]?.cls || 'bg-slate-100 text-slate-600'}`}>
                            {STATUS_MAP[item.estado]?.label || item.estado}
                          </span>
                        ) : (
                          <select value={item.estado}
                            onChange={e => persist(items.map(i => i.id === item.id ? { ...i, estado: e.target.value } : i))}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${STATUS_MAP[item.estado]?.cls || 'bg-slate-100 text-slate-600'}`}>
                            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-sm">{fmtDate(item.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => handlePDF(item)} disabled={generating === item.id} title="Descargar PDF"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50">
                            {generating === item.id
                              ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              : <FileDown size={15} />}
                          </button>
                          {!readOnly && (
                            <button onClick={() => setEditItem(item)} title="Editar"
                              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                              <Activity size={15} />
                            </button>
                          )}
                          {!readOnly && (confirmDel === item.id ? (
                            <>
                              <button onClick={() => del(item.id)} className="text-xs bg-red-600 text-white font-bold px-2.5 py-1 rounded-lg hover:bg-red-700">Eliminar</button>
                              <button onClick={() => setConfirmDel(null)} className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-lg">✕</button>
                            </>
                          ) : (
                            <button onClick={() => setConfirmDel(item.id)} title="Eliminar"
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                              <Trash2 size={15} />
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-blue-600" />
            <span className="text-xs font-black text-blue-700 uppercase tracking-wider">PDF Automático</span>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">El PDF incluye las <strong>6 secciones</strong> del formulario con la tabla de mediciones resaltando en <strong>verde (PASA)</strong> y <strong>rojo (NO PASA)</strong>.</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-xs font-black text-green-700 uppercase tracking-wider">Norma de referencia</span>
          </div>
          <p className="text-xs text-green-700 leading-relaxed">Basado en <strong>NFPA 70B</strong> / <strong>ANSI NETA MTS Table 10.1</strong>. Resistencia mínima requerida: <strong>100 MΩ</strong> (instalaciones nuevas).</p>
        </div>
      </div>
    </div>
  );
};

export default PruebaAislamientoSection;
