import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, User, Building2, LayoutGrid, LogOut, Trash2, Shield,
  ChevronRight, GraduationCap, Leaf, Cog, FileText,
  ClipboardList, Plus, X, BarChart3, Eye, UserCog, Crown, Menu, LogIn,
  MessageSquare, CheckCheck, ListChecks, Home, ChevronLeft, Hammer, GanttChartSquare,
  KeyRound, Lock, CheckCircle, AlertCircle, EyeOff,
  RotateCcw, AlertTriangle, Clock, UserX, ShieldCheck, Star, Megaphone,
} from 'lucide-react';
import { companiesData } from '../../data/companies';
import { fmtDate, uid } from '../../utils/formatters';
import { authHeaders, apiGetMensajes, apiMarkMensajeLeido, apiDeleteMensaje, apiAdminChangePassword, apiGetDeletedUsers, apiRestoreUser, apiPermanentDeleteUser } from '../../utils/api';
import TareasSection from '../admin/TareasSection';
import TrabajosSection from '../admin/TrabajosSection';
import CotizacionesComplexSection from '../admin/CotizacionesComplexSection';
import GanttSection from '../admin/GanttSection';
import ProfileSection from '../shared/ProfileSection';
import EncuestasSection from '../admin/EncuestasSection';
import AnunciosSection from '../admin/AnunciosSection';
import TutorialesSection from '../admin/TutorialesSection';

/* ─── Status maps ─── */

const STATUS_DICTAMEN = {
  en_proceso: { label: 'En proceso', cls: 'bg-blue-100  text-blue-700'  },
  completado: { label: 'Completado', cls: 'bg-green-100 text-green-700' },
  rechazado:  { label: 'Rechazado',  cls: 'bg-red-100   text-red-700'   },
};

/* ─── Section configs ─── */
const DICTAMEN_FORM_FIELDS = [
  { name: 'cliente',     label: 'Cliente',               placeholder: 'Nombre del cliente' },
  { name: 'empresa',     label: 'Empresa ECG',            type: 'select', options: companiesData.map(c => ({ value: c.name, label: c.name })), default: companiesData[0].name },
  { name: 'tipo',        label: 'Tipo de dictamen',       type: 'select', options: ['Gestión Ambiental','Seguridad e Higiene','Instalación Eléctrica','Eficiencia Energética','Calidad de Energía','Cumplimiento NOM','Otro'].map(t => ({ value: t, label: t })), default: 'Gestión Ambiental' },
  { name: 'folio',       label: 'Folio / Referencia',     placeholder: 'Ej. DICT-2026-001' },
  { name: 'estado',      label: 'Estado',                 type: 'select', options: Object.entries(STATUS_DICTAMEN).map(([k, v]) => ({ value: k, label: v.label })), default: 'en_proceso' },
  { name: 'descripcion', label: 'Descripción',            type: 'textarea', placeholder: 'Detalles del dictamen...' },
  { name: 'resultado',   label: 'Resultado / Conclusión', type: 'textarea', placeholder: 'Conclusiones del dictamen...' },
];

const DICTAMEN_DETAIL_FIELDS = [
  { name: 'cliente',     label: 'Cliente'     },
  { name: 'empresa',     label: 'Empresa'     },
  { name: 'tipo',        label: 'Tipo'        },
  { name: 'folio',       label: 'Folio'       },
  { name: 'estado',      label: 'Estado'      },
  { name: 'descripcion', label: 'Descripción' },
  { name: 'resultado',   label: 'Resultado'   },
];

const DICTAMEN_TABLE_COLS = [
  { key: 'cliente', label: 'Cliente', render: v => <span className="font-semibold text-slate-800">{v}</span> },
  { key: 'tipo',    label: 'Tipo'   },
  { key: 'folio',   label: 'Folio',  render: v => <span className="font-mono text-slate-600 text-xs">{v || '—'}</span> },
];

/* ─── FormModal ─── */
const FormModal = ({ title, fields, onSave, onClose }) => {
  const [data, setData] = useState(Object.fromEntries(fields.map(f => [f.name, f.default || ''])));
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg z-10">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={16} className="text-slate-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {fields.map(f => (
            <div key={f.name}>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{f.label}</label>
              {f.type === 'select' ? (
                <select value={data[f.name]} onChange={e => set(f.name, e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                  {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea value={data[f.name]} onChange={e => set(f.name, e.target.value)} rows={3} placeholder={f.placeholder} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none placeholder-slate-300" />
              ) : (
                <input type={f.type || 'text'} value={data[f.name]} onChange={e => set(f.name, e.target.value)} placeholder={f.placeholder} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-slate-300" />
              )}
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end border-t border-slate-100 pt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">Cancelar</button>
          <button onClick={() => { onSave(data); onClose(); }} className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold hover:from-blue-700 hover:to-blue-800 transition-all">Guardar</button>
        </div>
      </div>
    </div>
  );
};

/* ─── DetailModal ─── */
const DetailModal = ({ item, fields, onClose }) => (
  <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg z-10">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800">Detalle</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={16} className="text-slate-500" /></button>
      </div>
      <div className="px-6 py-5 space-y-3 max-h-[60vh] overflow-y-auto">
        {fields.map(f => (
          <div key={f.name} className="flex gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-32 flex-shrink-0 pt-0.5">{f.label}</span>
            <span className="text-sm font-semibold text-slate-700 flex-1">{item[f.name] || '—'}</span>
          </div>
        ))}
        <div className="flex gap-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-32 flex-shrink-0 pt-0.5">Creado</span>
          <span className="text-sm font-semibold text-slate-700">{fmtDate(item.createdAt)}</span>
        </div>
      </div>
    </div>
  </div>
);

/* ─── ItemSection — componente genérico para Cotizaciones y Dictaminación ─── */
const ItemSection = ({ title, subtitle, storageKey, formFields, detailFields, statusEnum, tableColumns, emptyIcon, newLabel, readOnly = false }) => {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem(storageKey) || '[]'));
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const persist = (updated) => {
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setItems(updated);
  };

  const save = (data) => persist([{ id: uid(), ...data, createdAt: new Date().toISOString() }, ...items]);
  const del = (id) => { persist(items.filter(i => i.id !== id)); setConfirmDel(null); };
  const updateStatus = (id, estado) => persist(items.map(i => i.id === id ? { ...i, estado } : i));

  const counts = Object.fromEntries(Object.keys(statusEnum).map(k => [k, items.filter(i => i.estado === k).length]));

  return (
    <div>
      {showForm && <FormModal title={newLabel} fields={formFields} onSave={save} onClose={() => setShowForm(false)} />}
      {viewItem && <DetailModal item={viewItem} fields={detailFields} onClose={() => setViewItem(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
        </div>
        {!readOnly && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-sm text-sm transition-all">
            <Plus size={16} /> {newLabel}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(statusEnum).map(([k, v]) => (
          <div key={k} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 px-2 py-0.5 rounded-full inline-block ${v.cls}`}>{v.label}</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{counts[k] || 0}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-800">Listado</h2>
          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">{items.length} total</span>
        </div>
        {items.length === 0 ? (
          <div className="py-14 text-center text-slate-200 flex flex-col items-center gap-3">
            {emptyIcon}
            <p className="text-slate-400 font-medium">No hay registros aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {tableColumns.map(col => <th key={col.key} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{col.label}</th>)}
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    {tableColumns.map(col => (
                      <td key={col.key} className="px-5 py-3.5 text-sm">
                        {col.render ? col.render(item[col.key]) : <span className="text-slate-500">{item[col.key] || '—'}</span>}
                      </td>
                    ))}
                    <td className="px-5 py-3.5">
                      {readOnly ? (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusEnum[item.estado]?.cls || 'bg-slate-100 text-slate-600'}`}>
                          {statusEnum[item.estado]?.label || item.estado}
                        </span>
                      ) : (
                        <select value={item.estado} onChange={e => updateStatus(item.id, e.target.value)} className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${statusEnum[item.estado]?.cls || 'bg-slate-100 text-slate-600'}`}>
                          {Object.entries(statusEnum).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-sm">{fmtDate(item.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewItem(item)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Eye size={15} /></button>
                        {!readOnly && (confirmDel === item.id ? (
                          <>
                            <button onClick={() => del(item.id)} className="text-xs bg-red-600 text-white font-bold px-2.5 py-1 rounded-lg hover:bg-red-700">Eliminar</button>
                            <button onClick={() => setConfirmDel(null)} className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-lg">✕</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDel(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={15} /></button>
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
    </div>
  );
};

/* ─── Sección Resumen ─── */

/* Mini gráfica de barras SVG (sin librerías externas) */
const BarChart = ({ data, color = '#6366f1', height = 60 }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 8);
        return (
          <g key={i}>
            <rect
              x={i * w + w * 0.15}
              y={height - barH - 4}
              width={w * 0.7}
              height={barH + 4}
              rx="3"
              fill={color}
              opacity="0.15"
            />
            <rect
              x={i * w + w * 0.15}
              y={height - barH}
              width={w * 0.7}
              height={barH}
              rx="3"
              fill={color}
            />
          </g>
        );
      })}
    </svg>
  );
};

/* Mini gráfica de dona SVG */
const DonutChart = ({ segments, size = 80 }) => {
  const r = 30;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="10"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circumference / total}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        );
        offset += seg.value;
        return el;
      })}
    </svg>
  );
};

/* Tarjeta KPI con mini gráfica */
const KpiCard = ({ label, value, icon, iconBg, iconColor, chartData, chartColor, sub }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-black text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <span className={iconColor}>{icon}</span>
      </div>
    </div>
    {chartData && chartData.length > 0 && (
      <div className="h-10 mt-1">
        <BarChart data={chartData} color={chartColor} height={40} />
      </div>
    )}
  </div>
);

const ResumenSection = ({ onNavigate }) => {
  const [users]      = useState(() => JSON.parse(localStorage.getItem('ecg_users') || '[]'));
  const [cotizRaw]   = useState(() => JSON.parse(localStorage.getItem('ecg_cotizaciones') || '[]'));
  const [tareasRaw]  = useState(() => JSON.parse(localStorage.getItem('ecg_tareas') || '[]'));
  const [encRaw]     = useState(() => JSON.parse(localStorage.getItem('ecg_encuesta_respuestas') || '[]'));
  const [anunRaw]    = useState(() => JSON.parse(localStorage.getItem('ecg_anuncios') || '[]'));
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [usersList, setUsersList] = useState(users);

  const companyIcons = [<GraduationCap size={20} />, <Leaf size={20} />, <Cog size={20} />];

  /* ── Estadísticas derivadas ── */
  const cotizPorEstado = {
    en_proceso: cotizRaw.filter(c => c.estado === 'en_proceso').length,
    aceptada:   cotizRaw.filter(c => c.estado === 'aceptada').length,
    rechazada:  cotizRaw.filter(c => c.estado === 'rechazada').length,
  };
  const tareasPorEstado = {
    pendiente:      tareasRaw.filter(t => t.estado === 'pendiente').length,
    en_desarrollo:  tareasRaw.filter(t => t.estado === 'en_desarrollo').length,
    completado:     tareasRaw.filter(t => t.estado === 'completado').length,
  };
  const anunciosActivos = anunRaw.filter(a => a.publicado).length;

  /* Simulación de barras históricas con los datos reales */
  const barMonths = ['E', 'F', 'M', 'A', 'M', 'J'];
  const makeBars = (total) => barMonths.map((m, i) => ({
    label: m,
  value: i === barMonths.length - 1 ? total : Math.max(0, total - Math.round(Math.random() * 2)),
  }));

  const handleDelete = (id) => {
    const updated = usersList.filter(u => u.id !== id);
    localStorage.setItem('ecg_users', JSON.stringify(updated));
    setUsersList(updated);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-8">
      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Panel de Administración</h1>
        <p className="text-slate-500 mt-0.5 text-sm">Resumen general del portal ECG Corporativo</p>
      </div>

      {/* ── ACCESO RÁPIDO A TUTORIALES — primero ── */}
      <div
        onClick={() => onNavigate && onNavigate('tutoriales')}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 p-6 cursor-pointer group hover:shadow-2xl hover:shadow-pink-200 transition-all duration-300"
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute top-4 right-28 w-6 h-6 rounded-full bg-white/20" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <GraduationCap size={26} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Centro de aprendizaje</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white">Nuevo</span>
              </div>
              <h2 className="text-xl font-black text-white">Tutoriales Interactivos</h2>
              <p className="text-white/80 text-xs mt-0.5">Aprende a usar Cotizaciones, Anuncios, Tareas y Encuestas con simuladores paso a paso</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-bold px-5 py-3 rounded-2xl transition-all group-hover:translate-x-1 whitespace-nowrap flex-shrink-0">
            Ir a tutoriales <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2 mt-5">
          {['📋 Cotizaciones', '📣 Anuncios', '✅ Tareas', '⭐ Encuestas'].map(m => (
            <span key={m} className="text-[11px] font-bold text-white/90 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">{m}</span>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Usuarios"      value={usersList.length}  sub="en el sistema"         icon={<Users size={18} />}     iconBg="bg-sky-100"     iconColor="text-sky-600"     chartData={makeBars(usersList.length)}  chartColor="#0ea5e9" />
        <KpiCard label="Cotizaciones"  value={cotizRaw.length}   sub={`${cotizPorEstado.aceptada} aceptadas`} icon={<FileText size={18} />}  iconBg="bg-emerald-100" iconColor="text-emerald-600" chartData={makeBars(cotizRaw.length)}   chartColor="#10b981" />
        <KpiCard label="Tareas"        value={tareasRaw.length}  sub={`${tareasPorEstado.completado} completadas`} icon={<ListChecks size={18} />} iconBg="bg-violet-100"  iconColor="text-violet-600"  chartData={makeBars(tareasRaw.length)}  chartColor="#8b5cf6" />
        <KpiCard label="Encuestas"     value={encRaw.length}     sub="respuestas recibidas"  icon={<Star size={18} />}      iconBg="bg-amber-100"   iconColor="text-amber-600"   chartData={makeBars(encRaw.length)}     chartColor="#f59e0b" />
      </div>

      {/* ── Gráficas 2 × 2 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* 1. Cotizaciones por estado — dona */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-extrabold text-slate-700 mb-4 flex items-center gap-2">
            <FileText size={15} className="text-emerald-500" /> Cotizaciones por Estado
          </h3>
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <DonutChart size={110} segments={[
                { value: cotizPorEstado.en_proceso || 1, color: '#3b82f6' },
                { value: cotizPorEstado.aceptada   || 0, color: '#10b981' },
                { value: cotizPorEstado.rechazada  || 0, color: '#ef4444' },
              ]} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-slate-800">{cotizRaw.length}</span>
                <span className="text-[9px] text-slate-400 font-semibold">total</span>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { label: 'En proceso', value: cotizPorEstado.en_proceso, hex: '#3b82f6', bar: 'bg-blue-500'    },
                { label: 'Aceptadas',  value: cotizPorEstado.aceptada,   hex: '#10b981', bar: 'bg-emerald-500' },
                { label: 'Rechazadas', value: cotizPorEstado.rechazada,  hex: '#ef4444', bar: 'bg-red-500'     },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.hex }} /> {s.label}
                    </span>
                    <span className="font-black text-slate-700">{s.value}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.bar} rounded-full transition-all duration-700`}
                      style={{ width: `${cotizRaw.length ? Math.max((s.value / cotizRaw.length) * 100, s.value > 0 ? 6 : 0) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Usuarios por Rol — dona */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-extrabold text-slate-700 mb-4 flex items-center gap-2">
            <Users size={15} className="text-sky-500" /> Usuarios por Rol
          </h3>
          {(() => {
            const roles = {
              superadmin: usersList.filter(u => (u.nivel ?? u.nivelAcceso) >= 3).length,
              admin:      usersList.filter(u => (u.nivel ?? u.nivelAcceso) === 2).length,
              trabajador: usersList.filter(u => (u.nivel ?? u.nivelAcceso) === 1).length,
              usuario:    usersList.filter(u => !(u.nivel ?? u.nivelAcceso) || (u.nivel ?? u.nivelAcceso) === 0).length,
            };
            const totalU = usersList.length || 1;
            const segs = [
              { label: 'Superadmin', value: roles.superadmin, hex: '#8b5cf6', bar: 'bg-violet-500'  },
              { label: 'Admin',      value: roles.admin,      hex: '#3b82f6', bar: 'bg-blue-500'    },
              { label: 'Trabajador', value: roles.trabajador, hex: '#10b981', bar: 'bg-emerald-500' },
              { label: 'Usuario',    value: roles.usuario,    hex: '#94a3b8', bar: 'bg-slate-400'   },
            ];
            return (
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <DonutChart size={110} segments={segs.map(s => ({ value: s.value || (usersList.length === 0 ? 1 : 0), color: s.hex }))} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-black text-slate-800">{usersList.length}</span>
                    <span className="text-[9px] text-slate-400 font-semibold">usuarios</span>
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  {segs.map(s => (
                    <div key={s.label}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: s.hex }} /> {s.label}
                        </span>
                        <span className="font-black text-slate-700">{s.value}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${s.bar} rounded-full transition-all duration-700`}
                          style={{ width: `${Math.max((s.value / totalU) * 100, s.value > 0 ? 6 : 0)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* 3. Tareas por estado — barras verticales + horizontales */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-extrabold text-slate-700 mb-4 flex items-center gap-2">
            <ListChecks size={15} className="text-violet-500" /> Tareas por Estado
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Pendientes',    value: tareasPorEstado.pendiente,     hex: '#94a3b8', bar: 'bg-slate-400',   pct: tareasRaw.length ? tareasPorEstado.pendiente / tareasRaw.length * 100 : 0 },
              { label: 'En desarrollo', value: tareasPorEstado.en_desarrollo, hex: '#3b82f6', bar: 'bg-blue-500',    pct: tareasRaw.length ? tareasPorEstado.en_desarrollo / tareasRaw.length * 100 : 0 },
              { label: 'Completadas',   value: tareasPorEstado.completado,    hex: '#10b981', bar: 'bg-emerald-500', pct: tareasRaw.length ? tareasPorEstado.completado / tareasRaw.length * 100 : 0 },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.hex }} /> {s.label}
                  </span>
                  <span className="font-black text-slate-700">{s.value}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.max(s.pct, s.value > 0 ? 6 : 0)}%` }} />
                </div>
              </div>
            ))}
            {tareasRaw.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Sin tareas registradas aún</p>}
          </div>
          {tareasRaw.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <BarChart data={[
                { value: tareasPorEstado.pendiente },
                { value: tareasPorEstado.en_desarrollo },
                { value: tareasPorEstado.completado },
              ]} color="#8b5cf6" height={50} />
              <div className="flex mt-1">
                {['Pendientes', 'En desarrollo', 'Completadas'].map(l => (
                  <span key={l} className="text-[9px] text-slate-400 flex-1 text-center">{l}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Módulos — barras horizontales */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-extrabold text-slate-700 mb-4 flex items-center gap-2">
            <Megaphone size={15} className="text-indigo-500" /> Resumen Módulos
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Anuncios activos',    value: anunciosActivos,      total: Math.max(anunRaw.length, 1),  hex: '#6366f1', bar: 'bg-indigo-500'  },
              { label: 'Total anuncios',      value: anunRaw.length,       total: Math.max(anunRaw.length, 5),  hex: '#a5b4fc', bar: 'bg-indigo-300'  },
              { label: 'Respuestas encuesta', value: encRaw.length,        total: Math.max(encRaw.length, 10),  hex: '#f59e0b', bar: 'bg-amber-400'   },
              { label: 'Empresas activas',    value: companiesData.length, total: companiesData.length,         hex: '#10b981', bar: 'bg-emerald-500' },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.hex }} /> {s.label}
                  </span>
                  <span className="font-black text-slate-700">{s.value}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${s.total ? Math.max((s.value / s.total) * 100, s.value > 0 ? 6 : 0) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <BarChart data={[
              { value: anunciosActivos },
              { value: anunRaw.length },
              { value: encRaw.length },
              { value: companiesData.length },
            ]} color="#6366f1" height={50} />
            <div className="flex mt-1">
              {['Activos', 'Anuncios', 'Encuestas', 'Empresas'].map(l => (
                <span key={l} className="text-[9px] text-slate-400 flex-1 text-center">{l}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Empresas del Portal ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-800">Empresas del Portal</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {companiesData.map((company, idx) => (
            <div key={company.id} className="flex items-center gap-4 px-6 py-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white flex-shrink-0`}>{companyIcons[idx]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{company.name}</p>
                <p className="text-xs text-slate-400 truncate">{company.slogan}</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full">Activa</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Usuarios Registrados ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-800">Usuarios Registrados</h2>
          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">{usersList.length} total</span>
        </div>
        {usersList.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No hay usuarios registrados aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Correo</th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registro</th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usersList.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-black text-sm">{user.name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{fmtDate(user.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full capitalize">{user.role || 'user'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {confirmDelete === user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDelete(user.id)} className="text-xs bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-red-700">Confirmar</button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg hover:bg-slate-200">Cancelar</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(user.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Gestión de Usuarios (solo superadmin nivel >= 3) ─── */
const NIVEL_LABELS = {
  0: { label: 'Usuario',    cls: 'bg-slate-100  text-slate-600'  },
  1: { label: 'Trabajador', cls: 'bg-green-100  text-green-700'  },
  2: { label: 'Admin',      cls: 'bg-blue-100   text-blue-700'   },
  3: { label: 'Superadmin', cls: 'bg-purple-100 text-purple-700' },
};

/* ─── MensajesSection ─── */
const MensajesSection = ({ isAdmin }) => {
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetchMensajes = async () => {
    setLoading(true);
    try { const d = await apiGetMensajes(); setMensajes(d.mensajes || []); }
    catch { /* ignorar */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMensajes(); }, []);

  const handleLeido = async (id) => {
    await apiMarkMensajeLeido(id);
    setMensajes(ms => ms.map(m => m.id === id ? { ...m, leido: true } : m));
  };

  const handleDelete = async (id) => {
    await apiDeleteMensaje(id);
    setMensajes(ms => ms.filter(m => m.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const noLeidos = mensajes.filter(m => !m.leido).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800">Mensajes de Contacto</h1>
        <p className="text-slate-500 mt-1">Formularios enviados desde el portal</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <span className="font-bold text-slate-700">
            {loading ? 'Cargando...' : `${mensajes.length} total`}
          </span>
          {noLeidos > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">{noLeidos} sin leer</span>
          )}
        </div>
        {!loading && mensajes.length === 0 && (
          <div className="py-16 flex flex-col items-center text-slate-400 gap-3">
            <MessageSquare size={38} />
            <p>No hay mensajes aún.</p>
          </div>
        )}
        <ul className="divide-y divide-slate-100">
          {mensajes.map(m => (
            <li key={m.id} className={`px-6 py-4 ${!m.leido ? 'bg-blue-50/40' : ''}`}>
              <div
                className="flex items-start justify-between gap-4 cursor-pointer"
                onClick={() => { setExpanded(expanded === m.id ? null : m.id); if (!m.leido) handleLeido(m.id); }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!m.leido && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                    <span className="font-semibold text-slate-800 truncate">{m.nombre}</span>
                    <span className="text-slate-400 text-sm truncate">{m.correo}</span>
                    {m.empresa && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{m.empresa}</span>}
                  </div>
                  <p className="text-slate-500 text-sm mt-1 truncate">{m.mensaje}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-400 hidden sm:block">
                    {new Date(m.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  {m.leido && <CheckCheck size={15} className="text-green-500" />}
                  {isAdmin && (
                    <button onClick={e => { e.stopPropagation(); handleDelete(m.id); }} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
              {expanded === m.id && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-slate-700 text-sm whitespace-pre-wrap">
                  {m.mensaje}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/* ─── ChangePasswordModal (superadmin) ─── */
const pwdRulesCheck = (pwd) => [
  { label: 'Mínimo 6 caracteres',    ok: pwd.length >= 6           },
  { label: 'Al menos una mayúscula', ok: /[A-Z]/.test(pwd)         },
  { label: 'Al menos un número',     ok: /\d/.test(pwd)            },
  { label: 'Al menos un símbolo',    ok: /[^A-Za-z0-9]/.test(pwd) },
];

const pwdStrengthCalc = (pwd) => {
  const score = pwdRulesCheck(pwd).filter(r => r.ok).length;
  if (!pwd)        return null;
  if (score <= 1)  return { label: 'Muy débil', color: 'bg-red-500',    w: 'w-1/4'  };
  if (score === 2) return { label: 'Débil',     color: 'bg-orange-400', w: 'w-2/4'  };
  if (score === 3) return { label: 'Buena',     color: 'bg-yellow-400', w: 'w-3/4'  };
  return             { label: 'Fuerte',     color: 'bg-green-500',  w: 'w-full' };
};

const ChangePasswordModal = ({ user, onClose }) => {
  const [newPwd, setNewPwd]       = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const strength = useMemo(() => pwdStrengthCalc(newPwd), [newPwd]);
  const rules    = useMemo(() => pwdRulesCheck(newPwd),    [newPwd]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPwd.length < 6)    { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (newPwd !== confirm)   { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    try {
      await apiAdminChangePassword(user.id, newPwd);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md z-10">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <KeyRound size={18} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Cambiar Contraseña</h3>
              <p className="text-xs text-slate-400 font-medium">{user.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={16} className="text-slate-500" /></button>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200">
                <CheckCircle size={28} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h4 className="text-lg font-black text-slate-800 mb-1">¡Contraseña actualizada!</h4>
            <p className="text-sm text-slate-400 mb-6">La contraseña de <strong className="text-slate-600">{user.name}</strong> fue cambiada exitosamente.</p>
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold hover:from-blue-700 hover:to-blue-800 transition-all">Cerrar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-semibold border bg-red-50 border-red-100 text-red-600">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nueva contraseña</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)] transition-all">
                <Lock size={16} className="text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0 relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPwd}
                    onChange={e => { setNewPwd(e.target.value); setError(''); }}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full bg-transparent text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none pr-8"
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {newPwd && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength?.color} ${strength?.w}`} />
                    </div>
                    <span className={`text-[11px] font-bold ml-3 w-16 text-right ${strength?.color?.replace('bg-', 'text-')}`}>{strength?.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {rules.map(r => (
                      <div key={r.label} className={`flex items-center gap-1.5 text-[11px] font-medium ${r.ok ? 'text-green-500' : 'text-slate-400'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${r.ok ? 'bg-green-100' : 'bg-slate-100'}`}>
                          {r.ok ? <CheckCircle size={8} strokeWidth={3} /> : <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />}
                        </div>
                        {r.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirmar contraseña</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)] transition-all">
                <Lock size={16} className="text-slate-400 flex-shrink-0" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(''); }}
                  placeholder="Repite la contraseña"
                  required
                  className="w-full bg-transparent text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none"
                />
              </div>
              {confirm && newPwd && (
                <p className={`text-[11px] font-semibold mt-1 pl-1 ${newPwd === confirm ? 'text-green-500' : 'text-red-400'}`}>
                  {newPwd === confirm ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-bold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Cambiando…</span>
                ) : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const GestionUsuariosSection = ({ currentUser, onImpersonate }) => {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [confirmDel, setConfirmDel] = useState(null);
  const [impersonating, setImpersonating] = useState(null);
  const [changePwdUser, setChangePwdUser] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/users', { headers: authHeaders(false) })
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    await fetch('/api/users', {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ id }),
    });
    setConfirmDel(null);
    fetchUsers();
  };

  const handleNivel = async (id, nivel) => {
    await fetch('/api/users', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ id, nivel }),
    });
    fetchUsers();
  };

  const handleImpersonate = async (user) => {
    setImpersonating(user.id);
    try {
      const res = await fetch('/api/auth/impersonate?action=impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken: currentUser.sessionToken, targetUserId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onImpersonate(data.user);
    } catch (err) {
      alert(err.message || 'Error al iniciar sesión como usuario.');
    } finally {
      setImpersonating(null);
    }
  };

  return (
    <div>
      {changePwdUser && <ChangePasswordModal user={changePwdUser} onClose={() => setChangePwdUser(null)} />}

      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Usuarios</h1>
        <p className="text-slate-500 mt-0.5 text-sm">Administra roles y accesos de todos los usuarios</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-800">Usuarios del Sistema</h2>
          <span className="text-xs bg-purple-100 text-purple-700 font-bold px-3 py-1 rounded-full">{users.length} total</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            Cargando usuarios…
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No hay usuarios registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Correo</th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nivel / Rol</th>
                  <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => {
                  const isSelf = user.id === currentUser.id;
                  const nv = NIVEL_LABELS[user.nivel] ?? NIVEL_LABELS[0];
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-600 font-black text-sm">{user.name?.charAt(0)?.toUpperCase()}</span>
                          </div>
                          <span className="font-semibold text-slate-800 text-sm">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">{user.email}</td>
                      <td className="px-6 py-4">
                        {isSelf ? (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${nv.cls}`}>{nv.label} (tú)</span>
                        ) : (
                          <select
                            value={user.nivel}
                            onChange={e => handleNivel(user.id, e.target.value)}
                            className="text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none bg-slate-100 text-slate-700"
                          >
                            <option value={0}>Usuario</option>
                            <option value={1}>Trabajador</option>
                            <option value={2}>Admin</option>
                            <option value={3}>Superadmin</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isSelf ? (
                          <span className="text-xs text-slate-300 font-medium">—</span>
                        ) : confirmDel === user.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleDelete(user.id)} className="text-xs bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-red-700">Confirmar</button>
                            <button onClick={() => setConfirmDel(null)} className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg">Cancelar</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setChangePwdUser(user)}
                              title="Cambiar contraseña"
                              className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                            >
                              <KeyRound size={15} />
                            </button>
                            <button
                              onClick={() => handleImpersonate(user)}
                              disabled={impersonating === user.id}
                              title="Iniciar sesión como este usuario"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-all disabled:opacity-50"
                            >
                              <LogIn size={13} />
                              {impersonating === user.id ? 'Entrando…' : 'Iniciar como'}
                            </button>
                            <button onClick={() => setConfirmDel(user.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── RecuperacionCuentasSection (solo superadmin nivel >= 3) ─── */
const RecuperacionCuentasSection = () => {
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [confirmRestore, setConfirmRestore]     = useState(null);
  const [confirmPermDel, setConfirmPermDel]     = useState(null);
  const [restoring, setRestoring]       = useState(null);
  const [deleting, setDeleting]         = useState(null);
  const [successMsg, setSuccessMsg]     = useState('');
  const [errorMsg, setErrorMsg]         = useState('');

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const users = await apiGetDeletedUsers();
      setDeletedUsers(users || []);
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar usuarios eliminados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeleted(); }, []);

  const handleRestore = async (id) => {
    setRestoring(id);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await apiRestoreUser(id);
      setSuccessMsg('Usuario restaurado exitosamente.');
      setConfirmRestore(null);
      fetchDeleted();
    } catch (err) {
      setErrorMsg(err.message || 'Error al restaurar usuario.');
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (id) => {
    setDeleting(id);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await apiPermanentDeleteUser(id);
      setSuccessMsg('Usuario eliminado permanentemente.');
      setConfirmPermDel(null);
      fetchDeleted();
    } catch (err) {
      setErrorMsg(err.message || 'Error al eliminar usuario.');
    } finally {
      setDeleting(null);
    }
  };

  const fmtDeletedDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const timeSinceDeleted = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `hace ${days}d`;
    const months = Math.floor(days / 30);
    return `hace ${months} mes${months > 1 ? 'es' : ''}`;
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
            <RotateCcw size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recuperación de Cuentas</h1>
            <p className="text-slate-500 text-sm">Restaura cuentas eliminadas o elimínalas permanentemente</p>
          </div>
        </div>
      </div>

      {/* Mensajes de éxito/error */}
      {successMsg && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-semibold border bg-green-50 border-green-100 text-green-700 animate-fadeIn">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="ml-auto p-0.5 hover:bg-green-100 rounded transition-colors"><X size={14} /></button>
        </div>
      )}
      {errorMsg && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-semibold border bg-red-50 border-red-100 text-red-600 animate-fadeIn">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="ml-auto p-0.5 hover:bg-red-100 rounded transition-colors"><X size={14} /></button>
        </div>
      )}

      {/* Info card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/60 p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1">Solo para Super Administradores</p>
            <p className="text-xs text-amber-600 leading-relaxed">
              Aquí puedes ver y restaurar las cuentas de usuarios que han sido eliminadas. 
              Al restaurar una cuenta, el usuario recuperará su acceso con el mismo correo y nivel que tenía anteriormente. 
              También puedes eliminar cuentas de forma permanente si ya no son necesarias.
            </p>
          </div>
        </div>
      </div>

      {/* Contador */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cuentas eliminadas</p>
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <UserX size={17} className="text-red-500" />
            </div>
          </div>
          <p className="text-4xl font-black text-slate-800">{deletedUsers.length}</p>
          <p className="text-xs text-slate-400 mt-1">disponibles para recuperar</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</p>
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <ShieldCheck size={17} className="text-green-600" />
            </div>
          </div>
          <p className="text-sm font-bold text-green-600 mt-2">
            {deletedUsers.length === 0 ? 'Sin cuentas pendientes' : `${deletedUsers.length} cuenta${deletedUsers.length > 1 ? 's' : ''} por revisar`}
          </p>
          <p className="text-xs text-slate-400 mt-1">eliminación lógica activa</p>
        </div>
      </div>

      {/* Tabla de usuarios eliminados */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-800">Cuentas Eliminadas</h2>
          <button
            onClick={fetchDeleted}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all disabled:opacity-50"
          >
            <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-3" />
            Cargando cuentas eliminadas…
          </div>
        ) : deletedUsers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <CheckCircle size={28} className="text-green-500" />
              </div>
            </div>
            <p className="text-slate-700 font-bold mb-1">¡Todo en orden!</p>
            <p className="text-slate-400 text-sm font-medium">No hay cuentas eliminadas para recuperar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Correo</th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Eliminado</th>
                  <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {deletedUsers.map(user => {
                  const nv = NIVEL_LABELS[user.nivel] ?? NIVEL_LABELS[0];
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 relative">
                            <span className="text-red-500 font-black text-sm">{user.name?.charAt(0)?.toUpperCase()}</span>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                              <X size={7} className="text-white" strokeWidth={3} />
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 text-sm block">{user.name}</span>
                            {user.empresa && <span className="text-[11px] text-slate-400">{user.empresa}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${nv.cls}`}>{nv.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-600 font-medium">{fmtDeletedDate(user.deleted_at)}</p>
                            <p className="text-[11px] text-slate-400">{timeSinceDeleted(user.deleted_at)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {confirmRestore === user.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[11px] text-slate-400 font-medium mr-1">¿Restaurar?</span>
                            <button
                              onClick={() => handleRestore(user.id)}
                              disabled={restoring === user.id}
                              className="text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-sm"
                            >
                              {restoring === user.id ? (
                                <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />…</span>
                              ) : 'Sí, restaurar'}
                            </button>
                            <button onClick={() => setConfirmRestore(null)} className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">Cancelar</button>
                          </div>
                        ) : confirmPermDel === user.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[11px] text-red-500 font-medium mr-1">⚠ Irreversible</span>
                            <button
                              onClick={() => handlePermanentDelete(user.id)}
                              disabled={deleting === user.id}
                              className="text-xs bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                            >
                              {deleting === user.id ? (
                                <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />…</span>
                              ) : 'Eliminar para siempre'}
                            </button>
                            <button onClick={() => setConfirmPermDel(null)} className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">Cancelar</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setConfirmRestore(user.id); setConfirmPermDel(null); }}
                              title="Restaurar cuenta"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-all"
                            >
                              <RotateCcw size={13} />
                              Restaurar
                            </button>
                            <button
                              onClick={() => { setConfirmPermDel(user.id); setConfirmRestore(null); }}
                              title="Eliminar permanentemente"
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── AdminDashboard ─── */
const AdminDashboard = ({ currentUser, onGoToPortal, onLogout, onImpersonate }) => {
  const [activeTab, setActiveTab]   = useState(() => localStorage.getItem('admin_active_tab') || 'resumen');

  useEffect(() => {
    localStorage.setItem('admin_active_tab', activeTab);
  }, [activeTab]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badges, setBadges]         = useState({ mensajes: 0, tareas: 0 });

  const nivel        = currentUser.nivel ?? 0;
  const isSuperAdmin = nivel >= 3;
  const isAdmin      = nivel >= 2;
  const isTrabajador = nivel >= 1;

  // Etiqueta y color del rol en sidebar
  const rolLabel = isSuperAdmin ? 'Superadmin' : isAdmin ? 'Admin' : 'Trabajador';
  const rolColor = isSuperAdmin ? 'text-purple-400' : isAdmin ? 'text-blue-400' : 'text-green-400';
  const avatarBg = isSuperAdmin ? 'bg-purple-600' : isAdmin ? 'bg-blue-600' : 'bg-green-600';
  // Polling de badges cada 30 segundos
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [msgRes, tktRes] = await Promise.all([
          fetch('/api/contacto',  { headers: authHeaders(false) }),
          fetch('/api/tareas',    { headers: authHeaders(false) }),
        ]);
        const [msgData, tktData] = await Promise.all([msgRes.json(), tktRes.json()]);
        setBadges({
          mensajes: (msgData.mensajes || []).filter(m => !m.leido).length,
          tareas:   (tktData.tareas   || []).filter(t => t.estado === 'pendiente').length,
        });
      } catch { /* ignorar */ }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'resumen',       label: 'Resumen',             icon: <BarChart3 size={17} />,    color: 'text-sky-400'    },
    { id: 'cotizaciones',  label: 'Cotizaciones',        icon: <FileText size={17} />,     color: 'text-emerald-400'},
    { id: 'dictaminacion', label: 'Dictaminación',       icon: <ClipboardList size={17} />,color: 'text-amber-400'  },
    { id: 'trabajos',      label: 'Trabajos',            icon: <Hammer size={17} />,            color: 'text-orange-400'  },
    { id: 'gantt',         label: 'Gantt',               icon: <GanttChartSquare size={17} />, color: 'text-teal-400'    },
    { id: 'tareas',        label: 'Tareas',              icon: <ListChecks size={17} />,        color: 'text-violet-400', badge: badges.tareas   },
    { id: 'mensajes',      label: 'Mensajes',            icon: <MessageSquare size={17} />,color: 'text-rose-400',   badge: badges.mensajes },
    { id: 'encuestas',     label: 'Encuestas',           icon: <Star size={17} />,              color: 'text-yellow-400'  },
    { id: 'anuncios',      label: 'Anuncios / Pop-ups',  icon: <Megaphone size={17} />,         color: 'text-indigo-400'  },
    ...(isSuperAdmin ? [
      { id: 'usuarios', label: 'Gestión de Usuarios', icon: <UserCog size={17} />, color: 'text-purple-400' },
      { id: 'recuperacion', label: 'Recuperar Cuentas', icon: <RotateCcw size={17} />, color: 'text-amber-400' },
    ] : []),
    { id: 'tutoriales',    label: 'Tutoriales / Guías',  icon: <GraduationCap size={17} />,color: 'text-pink-400'   },
    { id: 'perfil', label: 'Mi Perfil', icon: <User size={17} />, color: 'text-cyan-400' },
  ];

  const handleNav = (id) => {
    setActiveTab(id);
    setSidebarOpen(false);
    // Limpiar badge al entrar a la sección
    if (id === 'mensajes') setBadges(b => ({ ...b, mensajes: 0 }));
    if (id === 'tareas')   setBadges(b => ({ ...b, tareas:   0 }));
  };

  return (
    <div className="min-h-screen bg-slate-50/80">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-slate-950 flex flex-col z-50 shadow-2xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

        {/* Brand */}
        <div className="px-5 pt-6 pb-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/40">
              <span className="text-white font-black text-xs tracking-tight">ECG</span>
            </div>
            <div>
              <p className="text-white font-extrabold text-sm leading-none">ECG Admin</p>
              <p className="text-slate-500 text-[10px] font-medium mt-0.5">Panel de Control</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* User profile */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-sm overflow-hidden ${avatarBg}`}>
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
              ) : null}
              <span style={{ display: currentUser.avatar_url ? 'none' : 'block' }}>
                {currentUser.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-xs truncate leading-tight">{currentUser.name}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${rolColor}`}>{rolLabel}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 pb-2">Módulos</p>
          {navItems.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative ${
                  active
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-blue-400" />}
                <span className={`relative flex-shrink-0 transition-colors ${active ? item.color : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center">
                      <span className="absolute inline-flex w-full h-full rounded-full bg-red-400 opacity-75 animate-ping" />
                      <span className="relative flex items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 px-1 leading-none">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    </span>
                  )}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
              </button>
            );
          })}

          <div className="pt-3 mt-1 border-t border-white/5">
            <button onClick={onGoToPortal} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all text-sm font-semibold">
              <Home size={16} />
              <span className="flex-1 text-left">Ver Portal</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500/80 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-semibold group">
            <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-slate-950 px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-slate-400 hover:text-white -ml-1 rounded-lg hover:bg-white/5 transition-colors">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white font-black text-[9px]">ECG</span>
          </div>
          <span className="text-white font-extrabold text-base">Admin</span>
        </div>
        <div className="ml-auto">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs overflow-hidden ${avatarBg}`}>
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
            ) : null}
            <span style={{ display: currentUser.avatar_url ? 'none' : 'block' }}>
              {currentUser.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="md:ml-64 pt-14 md:pt-0 min-h-screen">
        {/* Top bar (desktop) */}
        <div className="hidden md:flex items-center gap-4 px-8 py-4 bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <span className="text-slate-700 font-bold">
              {navItems.find(n => n.id === activeTab)?.label ?? 'Resumen'}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs overflow-hidden ${avatarBg}`}>
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
                ) : null}
                <span style={{ display: currentUser.avatar_url ? 'none' : 'block' }}>
                  {currentUser.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <span className="text-slate-600 font-semibold">{currentUser.name}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${rolColor}`}>{rolLabel}</span>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8">
          {activeTab === 'resumen' && <ResumenSection onNavigate={handleNav} />}
          {activeTab === 'cotizaciones' && (
            <CotizacionesComplexSection currentUser={currentUser} readOnly={!isAdmin} />
          )}
          {activeTab === 'dictaminacion' && (
            <ItemSection
              title="Dictaminación"
              subtitle={isAdmin ? 'Registro y seguimiento de dictámenes técnicos' : 'Vista de dictámenes (solo lectura)'}
              storageKey="ecg_dictamenes"
              formFields={DICTAMEN_FORM_FIELDS}
              detailFields={DICTAMEN_DETAIL_FIELDS}
              statusEnum={STATUS_DICTAMEN}
              tableColumns={DICTAMEN_TABLE_COLS}
              emptyIcon={<ClipboardList size={38} />}
              newLabel="Nuevo Dictamen"
              readOnly={!isAdmin}
            />
          )}
          {activeTab === 'trabajos' && (
            <TrabajosSection currentUser={currentUser} />
          )}
          {activeTab === 'gantt' && (
            <GanttSection currentUser={currentUser} />
          )}
          {activeTab === 'tareas' && (
            <TareasSection currentUser={currentUser} />
          )}
          {activeTab === 'mensajes' && (
            <MensajesSection isAdmin={isAdmin} />
          )}
          {activeTab === 'encuestas' && (
            <EncuestasSection currentUser={currentUser} />
          )}
          {activeTab === 'anuncios' && (
            <AnunciosSection currentUser={currentUser} />
          )}
          {activeTab === 'usuarios' && nivel >= 3 && (
            <GestionUsuariosSection currentUser={currentUser} onImpersonate={onImpersonate} />
          )}
          {activeTab === 'recuperacion' && nivel >= 3 && (
            <RecuperacionCuentasSection />
          )}
          {activeTab === 'tutoriales' && (
            <TutorialesSection />
          )}
          {activeTab === 'perfil' && (
            <ProfileSection
              currentUser={currentUser}
              onProfileUpdate={(updated) => {
                try {
                  const session = JSON.parse(localStorage.getItem('ecg_session') || '{}');
                  const newSession = { ...session, ...updated };
                  localStorage.setItem('ecg_session', JSON.stringify(newSession));
                } catch { /* ignorar */ }
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
