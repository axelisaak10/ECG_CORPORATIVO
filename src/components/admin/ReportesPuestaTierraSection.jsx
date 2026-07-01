import { useState, useEffect, useMemo } from 'react';
import {
  Plus, X, Trash2, Edit2, Download, Search, FileText, CheckCircle2,
  AlertTriangle, Calendar, Clock, Activity, FileCheck, Copy
} from 'lucide-react';
import {
  apiGetReportesPuestaTierra,
  apiCreateReportePuestaTierra,
  apiUpdateReportePuestaTierra,
  apiDeleteReportePuestaTierra
} from '../../utils/api';
import { generateReportePuestaTierraPDF } from '../../utils/dictamenPdfGenerator';

const getFechaEsp = (d) => {
  const date = d ? new Date(d) : new Date();
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return `${date.getDate()} de ${months[date.getMonth()]} del ${date.getFullYear()}`;
};

const initialFormState = {
  lugar_fecha: '',
  empresa_cliente: '',
  ubicacion_sitio: '',
  fecha_medicion: '',
  hora_ejecucion: '',
  tecnico_responsable: 'ING. JUAN ERASMO CUAYA GRANADOS',
  tipo_sistema: 'Varilla / Electrodo',
  uso_sistema: 'Fuerza / Potencia',
  estado_clima: 'Soleado',
  humedad_suelo: 'Seco',
  tipo_terreno: '',
  instrumento_marca_modelo: '',
  instrumento_serie: '',
  instrumento_calibracion: '',
  instrumento_metodo: 'Caída de Potencial (62%)',
  distancia_z: '',
  dist_52_y: '',
  res_52: '',
  dist_62_y: '',
  res_62: '',
  dist_72_y: '',
  res_72: '',
  resistencia_final_registrada: '',
  variacion_terreno: '',
  terreno_estado: 'Estable',
  limite_solicitado: '25',
  conformidad_final: 'APROBADO',
  observaciones: '',
  nombre_firma_tecnico: 'ING. JUAN ERASMO CUAYA GRANADOS',
  nombre_firma_aprobador: 'Representante de la Empresa / Cliente'
};

export default function ReportesPuestaTierraSection({ currentUser, readOnly = false }) {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState(null); // 'create' | 'edit' | null
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [form, setForm] = useState(initialFormState);
  const [modalTab, setModalTab] = useState('instalacion'); // 'instalacion' | 'clima' | 'instrumento' | 'mediciones' | 'evaluacion'
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch reports
  const fetchReportes = async () => {
    setLoading(true);
    try {
      const data = await apiGetReportesPuestaTierra();
      setReportes(data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudieron cargar los reportes de puesta a tierra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportes();
  }, []);

  // Filtered reports
  const filteredReportes = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return reportes;
    return reportes.filter(r => 
      (r.empresa_cliente || '').toLowerCase().includes(q) ||
      (r.ubicacion_sitio || '').toLowerCase().includes(q) ||
      (r.tecnico_responsable || '').toLowerCase().includes(q)
    );
  }, [reportes, search]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setForm({
      ...initialFormState,
      lugar_fecha: `El Marques, Querétaro, a ${getFechaEsp()}`,
      fecha_medicion: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora_ejecucion: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
    });
    setModalTab('instalacion');
    setErrorMsg('');
    setActiveModal('create');
  };

  // Open Edit Modal
  const handleOpenEdit = (reporte) => {
    setSelectedReporte(reporte);
    setForm({ ...initialFormState, ...reporte });
    setModalTab('instalacion');
    setErrorMsg('');
    setActiveModal('edit');
  };

  // Open Duplicate Modal
  const handleDuplicate = (reporte) => {
    setForm({
      ...initialFormState,
      ...reporte,
      id: undefined, // Remove ID to create a new one
      lugar_fecha: `El Marques, Querétaro, a ${getFechaEsp()}`,
      fecha_medicion: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora_ejecucion: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
    });
    setModalTab('instalacion');
    setErrorMsg('');
    setActiveModal('create');
  };

  // Save report
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.empresa_cliente?.trim()) {
      setErrorMsg('El nombre de la empresa / cliente es obligatorio.');
      setModalTab('instalacion');
      return;
    }

    try {
      if (activeModal === 'create') {
        const newReporte = await apiCreateReportePuestaTierra(form);
        setReportes([newReporte, ...reportes]);
      } else if (activeModal === 'edit') {
        const updated = await apiUpdateReportePuestaTierra(selectedReporte.id, form);
        setReportes(reportes.map(r => r.id === selectedReporte.id ? updated : r));
      }
      setActiveModal(null);
      setSelectedReporte(null);
      setForm(initialFormState);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error al guardar el reporte.');
    }
  };

  // Delete report
  const handleDelete = async (id) => {
    try {
      await apiDeleteReportePuestaTierra(id);
      setReportes(reportes.filter(r => r.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el reporte.');
    }
  };

  // Download secured PDF
  const handleDownloadPDF = async (reporte) => {
    setDownloadingId(reporte.id);
    try {
      await generateReportePuestaTierraPDF(reporte);
    } catch (err) {
      console.error(err);
      alert('Error al generar el PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Auto Calculations when measurements change
  const handleFieldChange = (field, val) => {
    setForm(prev => {
      const next = { ...prev, [field]: val };
      
      // Auto prefill resistencia_final_registrada when res_62 changes
      if (field === 'res_62') {
        next.resistencia_final_registrada = val;
      }

      // Auto-evaluate variations between 52% and 72%
      if (field === 'res_52' || field === 'res_62' || field === 'res_72') {
        const r52 = parseFloat(next.res_52);
        const r62 = parseFloat(next.res_62);
        const r72 = parseFloat(next.res_72);

        if (!isNaN(r52) && !isNaN(r62) && !isNaN(r72) && r62 > 0) {
          const maxDiff = Math.max(Math.abs(r62 - r52), Math.abs(r72 - r62));
          const pct = ((maxDiff / r62) * 100).toFixed(1);
          next.variacion_terreno = pct;
          next.terreno_estado = parseFloat(pct) <= 5.0 ? 'Estable' : 'Inestable';
        }
      }

      // Auto-evaluate compliance final
      if (field === 'res_62' || field === 'limite_solicitado') {
        const r62 = parseFloat(next.res_62);
        const limit = parseFloat(next.limite_solicitado);
        if (!isNaN(r62) && !isNaN(limit)) {
          next.conformidad_final = r62 <= limit ? 'APROBADO' : 'NO_CUMPLE';
        }
      }

      return next;
    });
  };

  return (
    <div className="animate-fadeIn">
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm">
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="ml-auto hover:text-red-900 font-bold">✖</button>
        </div>
      )}

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Reportes de Medición de Puesta a Tierra</h2>
          <p className="text-slate-500 text-xs mt-0.5">Control de registros y certificados de grounding bajo normativa REG-ELC-01</p>
        </div>
        {!readOnly && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-ecg-rojo1 to-red-600 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl shadow-md shadow-red-900/10 text-sm transition-all"
          >
            <Plus size={16} />
            Nuevo Reporte
          </button>
        )}
      </div>

      {/* Filter and search */}
      <div className="mb-6 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por cliente, sitio, técnico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
        </div>
        <div className="text-xs text-slate-400 font-semibold md:ml-auto">
          Mostrando {filteredReportes.length} de {reportes.length} reportes
        </div>
      </div>

      {/* Grounding reports listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-ecg-rojo1 rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500 mt-4">Cargando reportes de Supabase...</span>
        </div>
      ) : filteredReportes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 text-center px-4">
          <FileText size={48} className="text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No se encontraron reportes</h3>
          <p className="text-slate-400 text-sm max-w-sm mt-1">Registra tu primer reporte de puesta a tierra presionando el botón "Nuevo Reporte" superior.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Empresa / Cliente</th>
                  <th className="px-6 py-4">Ubicación / Sitio</th>
                  <th className="px-6 py-4">Fecha Medición</th>
                  <th className="px-6 py-4 text-center">Resistencia (62%)</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredReportes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-800">{r.empresa_cliente}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Técnico: {r.tecnico_responsable}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{r.ubicacion_sitio || '—'}</td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        {r.fecha_medicion || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-black text-ecg-rojo1 text-base">
                      {r.res_62 ? `${r.res_62} Ω` : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {r.conformidad_final === 'APROBADO' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle2 size={12} /> CUMPLE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle size={12} /> NO CUMPLE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleDownloadPDF(r)}
                        disabled={downloadingId === r.id}
                        className="inline-flex items-center justify-center p-2 text-slate-500 hover:text-ecg-rojo1 hover:bg-red-50 rounded-xl transition-all"
                        title="Descargar PDF Seguro"
                      >
                        {downloadingId === r.id ? (
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-ecg-rojo1 rounded-full animate-spin"></div>
                        ) : (
                          <Download size={16} />
                        )}
                      </button>
                      
                      {!readOnly && (
                        <>
                          <button
                            onClick={() => handleDuplicate(r)}
                            className="inline-flex items-center justify-center p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Duplicar Reporte"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="inline-flex items-center justify-center p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          {confirmDeleteId === r.id ? (
                            <div className="inline-flex items-center gap-1.5 ml-2">
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1 text-xs border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-lg transition-all"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(r.id)}
                              className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl z-10 flex flex-col max-h-[90vh] animate-slideUp overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <Activity className="text-ecg-rojo1" size={20} />
                  {activeModal === 'create' ? 'Nuevo Reporte de Puesta a Tierra' : 'Editar Reporte de Puesta a Tierra'}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">REG-ELC-01 | Cumplimiento NFPA 70 / 70B</p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Tabs Selector */}
            <div className="flex border-b border-slate-100 bg-slate-50/30 overflow-x-auto">
              {[
                { id: 'instalacion', label: '1. Instalación' },
                { id: 'clima', label: '2. Clima y Terreno' },
                { id: 'instrumento', label: '3. Instrumento' },
                { id: 'mediciones', label: '4. Mediciones' },
                { id: 'evaluacion', label: '5 y 6. Evaluación' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id)}
                  className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all
                    ${modalTab === tab.id
                      ? 'border-ecg-rojo1 text-ecg-rojo1 bg-white'
                      : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              
              {/* TAB 1: INSTALACION */}
              {modalTab === 'instalacion' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lugar y Fecha del Reporte (Encabezado)</label>
                    <input
                      type="text"
                      value={form.lugar_fecha}
                      onChange={(e) => handleFieldChange('lugar_fecha', e.target.value)}
                      placeholder="Ej. El Marques, Querétaro, a 06 de abril del 2026"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Empresa / Cliente *</label>
                    <input
                      type="text"
                      required
                      value={form.empresa_cliente}
                      onChange={(e) => handleFieldChange('empresa_cliente', e.target.value)}
                      placeholder="Nombre del cliente o razón social"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ubicación / Sitio</label>
                    <input
                      type="text"
                      value={form.ubicacion_sitio}
                      onChange={(e) => handleFieldChange('ubicacion_sitio', e.target.value)}
                      placeholder="Sitio o nave industrial"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha Medición</label>
                    <input
                      type="text"
                      value={form.fecha_medicion}
                      onChange={(e) => handleFieldChange('fecha_medicion', e.target.value)}
                      placeholder="DD/MM/AAAA"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hora Ejecución</label>
                    <input
                      type="text"
                      value={form.hora_ejecucion}
                      onChange={(e) => handleFieldChange('hora_ejecucion', e.target.value)}
                      placeholder="HH:MM"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Técnico Responsable</label>
                    <input
                      type="text"
                      value={form.tecnico_responsable}
                      onChange={(e) => handleFieldChange('tecnico_responsable', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Sistema</label>
                    <select
                      value={form.tipo_sistema}
                      onChange={(e) => handleFieldChange('tipo_sistema', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    >
                      <option value="Varilla / Electrodo">Varilla / Electrodo</option>
                      <option value="Malla de Tierra">Malla de Tierra</option>
                      <option value="Placa">Placa</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Uso del Sistema</label>
                    <select
                      value={form.uso_sistema}
                      onChange={(e) => handleFieldChange('uso_sistema', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    >
                      <option value="Fuerza / Potencia">Fuerza / Potencia</option>
                      <option value="Pararrayos (SAC)">Pararrayos (SAC)</option>
                      <option value="Telecomunicaciones">Telecomunicaciones</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 2: CLIMA Y TERRENO */}
              {modalTab === 'clima' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estado del Clima</label>
                    <div className="flex gap-4 mt-2">
                      {['Soleado', 'Nublado', 'Lluvia'].map(c => (
                        <label key={c} className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="estado_clima"
                            value={c}
                            checked={form.estado_clima === c}
                            onChange={(e) => handleFieldChange('estado_clima', e.target.value)}
                            className="w-4 h-4 text-ecg-rojo1 focus:ring-red-500 border-slate-300"
                          />
                          {c}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Humedad del Suelo</label>
                    <div className="flex gap-4 mt-2">
                      {['Seco', 'Húmedo'].map(h => (
                        <label key={h} className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="humedad_suelo"
                            value={h}
                            checked={form.humedad_suelo === h}
                            onChange={(e) => handleFieldChange('humedad_suelo', e.target.value)}
                            className="w-4 h-4 text-ecg-rojo1 focus:ring-red-500 border-slate-300"
                          />
                          {h}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Terreno</label>
                    <input
                      type="text"
                      value={form.tipo_terreno}
                      onChange={(e) => handleFieldChange('tipo_terreno', e.target.value)}
                      placeholder="Ej. Arcilloso, Rocoso, Tierra vegetal, etc."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: INSTRUMENTO */}
              {modalTab === 'instrumento' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Marca y Modelo (Telurómetro)</label>
                    <input
                      type="text"
                      value={form.instrumento_marca_modelo}
                      onChange={(e) => handleFieldChange('instrumento_marca_modelo', e.target.value)}
                      placeholder="Ej. Megger DET4TC"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Número de Serie</label>
                    <input
                      type="text"
                      value={form.instrumento_serie}
                      onChange={(e) => handleFieldChange('instrumento_serie', e.target.value)}
                      placeholder="Ej. S/N 123456"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha Última Calibración</label>
                    <input
                      type="text"
                      value={form.instrumento_calibracion}
                      onChange={(e) => handleFieldChange('instrumento_calibracion', e.target.value)}
                      placeholder="DD/MM/AAAA"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Método Aplicado</label>
                    <select
                      value={form.instrumento_metodo}
                      onChange={(e) => handleFieldChange('instrumento_metodo', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    >
                      <option value="Caída de Potencial (62%)">Caída de Potencial (62%)</option>
                      <option value="Doble Pinza / Resistencia">Doble Pinza / Resistencia</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 4: MEDICIONES */}
              {modalTab === 'mediciones' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Distancia Total al Electrodo Corriente Auxiliar (Z)</label>
                    <input
                      type="text"
                      value={form.distancia_z}
                      onChange={(e) => handleFieldChange('distancia_z', e.target.value)}
                      placeholder="Ej. 30 metros o 100 pies"
                      className="w-full md:w-80 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-bold focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* 52% */}
                    <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-4">
                      <div className="font-extrabold text-slate-700 border-b border-slate-200 pb-2 text-xs uppercase tracking-wider">Medición al 52%</div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Distancia Y</label>
                        <input
                          type="text"
                          value={form.dist_52_y}
                          onChange={(e) => handleFieldChange('dist_52_y', e.target.value)}
                          placeholder="Ej. 15.6m"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Resistencia (Ω)</label>
                        <input
                          type="text"
                          value={form.res_52}
                          onChange={(e) => handleFieldChange('res_52', e.target.value)}
                          placeholder="Ej. 4.8"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-bold focus:outline-none focus:border-red-400"
                        />
                      </div>
                    </div>

                    {/* 62% */}
                    <div className="p-5 border-2 border-red-200 bg-red-50/20 rounded-2xl space-y-4 shadow-sm">
                      <div className="font-black text-ecg-rojo1 border-b border-red-200 pb-2 text-xs uppercase tracking-wider">62% (Referencia)</div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Distancia Y</label>
                        <input
                          type="text"
                          value={form.dist_62_y}
                          onChange={(e) => handleFieldChange('dist_62_y', e.target.value)}
                          placeholder="Ej. 18.6m"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Resistencia (Ω)</label>
                        <input
                          type="text"
                          value={form.res_62}
                          onChange={(e) => handleFieldChange('res_62', e.target.value)}
                          placeholder="Ej. 5.1"
                          className="w-full px-3.5 py-2 rounded-xl border border-red-300 bg-white text-slate-800 text-sm font-black text-ecg-rojo1 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    {/* 72% */}
                    <div className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-4">
                      <div className="font-extrabold text-slate-700 border-b border-slate-200 pb-2 text-xs uppercase tracking-wider">Medición al 72%</div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Distancia Y</label>
                        <input
                          type="text"
                          value={form.dist_72_y}
                          onChange={(e) => handleFieldChange('dist_72_y', e.target.value)}
                          placeholder="Ej. 21.6m"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Resistencia (Ω)</label>
                        <input
                          type="text"
                          value={form.res_72}
                          onChange={(e) => handleFieldChange('res_72', e.target.value)}
                          placeholder="Ej. 5.3"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-bold focus:outline-none focus:border-red-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: EVALUACION Y OBSERVACIONES */}
              {modalTab === 'evaluacion' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Resistencia Final Registrada (Ω)</label>
                    <input
                      type="text"
                      value={form.resistencia_final_registrada}
                      onChange={(e) => handleFieldChange('resistencia_final_registrada', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-bold focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Variación del Terreno (%)</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={form.variacion_terreno}
                        onChange={(e) => handleFieldChange('variacion_terreno', e.target.value)}
                        placeholder="Calculado automáticamente"
                        className="w-1/2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      />
                      <select
                        value={form.terreno_estado}
                        onChange={(e) => handleFieldChange('terreno_estado', e.target.value)}
                        className="w-1/2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="Estable">Estable (≤ 5%)</option>
                        <option value="Inestable">Inestable (&gt; 5%)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Límite Solicitado / Aplicación</label>
                    <select
                      value={form.limite_solicitado}
                      onChange={(e) => handleFieldChange('limite_solicitado', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    >
                      <option value="25">≤ 25 Ω (Estándar NEC/NFPA 70)</option>
                      <option value="5">≤ 5 Ω (Industrial)</option>
                      <option value="1">≤ 1 Ω (Crítico)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estado de Conformidad Final</label>
                    <select
                      value={form.conformidad_final}
                      onChange={(e) => handleFieldChange('conformidad_final', e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-red-100
                        ${form.conformidad_final === 'APROBADO' 
                          ? 'border-green-200 bg-green-50 text-green-700' 
                          : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                    >
                      <option value="APROBADO">APROBADO CUMPLE</option>
                      <option value="NO_CUMPLE">NO CUMPLE (Requiere Adecuación)</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Observaciones y Recomendaciones Técnicas</label>
                    <textarea
                      rows={4}
                      value={form.observaciones}
                      onChange={(e) => handleFieldChange('observaciones', e.target.value)}
                      placeholder="Detalles sobre corrosión, estado de soldaduras exotérmicas, electrodos, etc..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Firma Lado Izquierdo (Técnico)</label>
                    <input
                      type="text"
                      value={form.nombre_firma_tecnico}
                      onChange={(e) => handleFieldChange('nombre_firma_tecnico', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Firma Lado Derecho (Aprobador)</label>
                    <input
                      type="text"
                      value={form.nombre_firma_aprobador}
                      onChange={(e) => handleFieldChange('nombre_firma_aprobador', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-red-400"
                    />
                  </div>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-between">
              <div>
                {modalTab !== 'instalacion' && (
                  <button
                    type="button"
                    onClick={() => {
                      const tabs = ['instalacion', 'clima', 'instrumento', 'mediciones', 'evaluacion'];
                      const idx = tabs.indexOf(modalTab);
                      if (idx > 0) setModalTab(tabs[idx - 1]);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-white hover:border-slate-300 transition-all"
                  >
                    Anterior
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setActiveModal(null); setSelectedReporte(null); }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-white hover:border-slate-300 transition-all"
                >
                  Cancelar
                </button>
                {modalTab !== 'evaluacion' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const tabs = ['instalacion', 'clima', 'instrumento', 'mediciones', 'evaluacion'];
                      const idx = tabs.indexOf(modalTab);
                      if (idx < tabs.length - 1) setModalTab(tabs[idx + 1]);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold transition-all"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-ecg-rojo1 to-red-600 hover:from-red-700 hover:to-red-800 text-white text-sm font-bold shadow-md shadow-red-900/10 transition-all flex items-center gap-1.5"
                  >
                    <FileCheck size={16} />
                    {activeModal === 'create' ? 'Crear Reporte' : 'Guardar Cambios'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
