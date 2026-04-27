import React, { useState, useEffect } from 'react';
import {
  Users, Building2, LayoutGrid, LogOut, Trash2, Shield,
  ChevronRight, GraduationCap, Leaf, Cog, FileText,
  ClipboardList, Plus, X, BarChart3, Eye, UserCog, Crown, Menu, LogIn,
  MessageSquare, CheckCheck, ListChecks, Home, ChevronLeft, Hammer, GanttChartSquare,
} from 'lucide-react';
import { companiesData } from '../../data/companies';
import { fmtDate, uid } from '../../utils/formatters';
import { authHeaders, apiGetMensajes, apiMarkMensajeLeido, apiDeleteMensaje } from '../../utils/api';
import TareasSection from '../admin/TareasSection';
import TrabajosSection from '../admin/TrabajosSection';
import CotizacionesComplexSection from '../admin/CotizacionesComplexSection';
import GanttSection from '../admin/GanttSection';

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
const ResumenSection = () => {
  // Self-contained: reads fresh state on every mount (happens on each tab switch)
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('ecg_users') || '[]'));
  const [cotizCount] = useState(() => JSON.parse(localStorage.getItem('ecg_cotizaciones') || '[]').length);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const companyIcons = [<GraduationCap size={20} />, <Leaf size={20} />, <Cog size={20} />];

  const handleDelete = (id) => {
    const updated = users.filter(u => u.id !== id);
    localStorage.setItem('ecg_users', JSON.stringify(updated));
    setUsers(updated);
    setConfirmDelete(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Panel de Administración</h1>
        <p className="text-slate-500 mt-0.5 text-sm">Resumen general del portal ECG Corporativo</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usuarios</p>
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center"><Users size={17} className="text-blue-600" /></div>
          </div>
          <p className="text-4xl font-black text-slate-800">{users.length}</p>
          <p className="text-xs text-slate-400 mt-1">registrados en el sistema</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Empresas</p>
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center"><Building2 size={17} className="text-green-600" /></div>
          </div>
          <p className="text-4xl font-black text-slate-800">{companiesData.length}</p>
          <p className="text-xs text-slate-400 mt-1">empresas en el portal</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cotizaciones</p>
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center"><FileText size={17} className="text-orange-500" /></div>
          </div>
          <p className="text-4xl font-black text-slate-800">{cotizCount}</p>
          <p className="text-xs text-slate-400 mt-1">cotizaciones registradas</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-8">
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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-800">Usuarios Registrados</h2>
          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">{users.length} total</span>
        </div>
        {users.length === 0 ? (
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
                {users.map(user => (
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

const GestionUsuariosSection = ({ currentUser, onImpersonate }) => {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [confirmDel, setConfirmDel] = useState(null);
  const [impersonating, setImpersonating] = useState(null);

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

/* ─── AdminDashboard ─── */
const AdminDashboard = ({ currentUser, onGoToPortal, onLogout, onImpersonate }) => {
  const [activeTab, setActiveTab]   = useState('resumen');
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
    ...(isSuperAdmin ? [{ id: 'usuarios', label: 'Gestión de Usuarios', icon: <UserCog size={17} />, color: 'text-purple-400' }] : []),
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-sm ${avatarBg}`}>
              {currentUser.name?.charAt(0)?.toUpperCase()}
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
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs ${avatarBg}`}>
            {currentUser.name?.charAt(0)?.toUpperCase()}
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
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs ${avatarBg}`}>
                {currentUser.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-slate-600 font-semibold">{currentUser.name}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${rolColor}`}>{rolLabel}</span>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8">
          {activeTab === 'resumen' && <ResumenSection />}
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
          {activeTab === 'usuarios' && nivel >= 3 && (
            <GestionUsuariosSection currentUser={currentUser} onImpersonate={onImpersonate} />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
