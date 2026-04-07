import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, X, Package, Wrench, Users, Clock, Eye, FileText,
  Pencil, AlertCircle, Loader2,
} from 'lucide-react';
import {
  authHeaders,
  apiGetClientes, apiCreateCliente, apiUpdateCliente, apiDeleteCliente,
  apiGetArticulos, apiCreateArticulo, apiUpdateArticulo, apiDeleteArticulo,
  apiGetHerramientas, apiCreateHerramienta, apiUpdateHerramienta, apiDeleteHerramienta,
  apiGetCotizaciones, apiCreateCotizacion, apiUpdateCotizacion, apiDeleteCotizacion,
} from '../../utils/api';

// ── Costos de tiempo (hardcoded) ──────────────────────────────────────────────
const COSTOS_TIEMPO = {
  'Renta oficina':   { hr: 14.58,  dia: 116.67,  semana: 875.00,   mes: 3500.00   },
  'Renta de bodega': { hr: 25.00,  dia: 600.00,  semana: 4500.00,  mes: 18000.00  },
  'Luz':             { hr: 4.17,   dia: 100.00,  semana: 750.00,   mes: 3000.00   },
  'Agua':            { hr: 1.25,   dia: 30.00,   semana: 225.00,   mes: 900.00    },
  'Equipo':          { hr: 4.17,   dia: 100.00,  semana: 750.00,   mes: 3000.00   },
  'Insumos':         { hr: 0.69,   dia: 16.67,   semana: 125.00,   mes: 500.00    },
  'Sueldos':         { hr: 708.33, dia: 5666.67, semana: 34000.00, mes: 136000.00 },
  'Gasolina':        { hr: 6.94,   dia: 166.67,  semana: 1250.00,  mes: 5000.00   },
  'Seguro':          { hr: 114.58, dia: 916.67,  semana: 6875.00,  mes: 27500.00  },
  'Carro':           { hr: 33.33,  dia: 266.67,  semana: 2000.00,  mes: 8000.00   },
  'Varios':          { hr: 41.67,  dia: 333.33,  semana: 2500.00,  mes: 10000.00  },
};

const ESTADO_MAP = {
  pendiente: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700' },
  aprobada:  { label: 'Aprobada',  cls: 'bg-green-100  text-green-700'  },
  rechazada: { label: 'Rechazada', cls: 'bg-red-100    text-red-700'    },
};

const uid  = () => Math.random().toString(36).slice(2);
const fmt  = (n) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const inputCls = 'w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const Field = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

// ── Loading / Error helpers ───────────────────────────────────────────────────
const Spinner = () => <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-blue-500" /></div>;
const ErrorMsg = ({ msg }) => (
  <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold">
    <AlertCircle size={15} /> {msg}
  </div>
);

// ── Catálogo genérico CRUD ────────────────────────────────────────────────────
const CatalogoManager = ({ title, items, loading, error, columns, onAdd, onEdit, onDelete, addForm }) => {
  const [showAdd, setShowAdd]     = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-extrabold text-slate-800">{title}</h2>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all">
          <Plus size={14} /> Agregar
        </button>
      </div>

      {error && <ErrorMsg msg={error} />}

      {showAdd && addForm({
        onSave: async (data) => { await onAdd(data); setShowAdd(false); },
        onClose: () => setShowAdd(false),
      })}
      {editItem && addForm({
        initial: editItem,
        onSave: async (data) => { await onEdit(editItem.id, data); setEditItem(null); },
        onClose: () => setEditItem(null),
        isEdit: true,
      })}

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <p className="text-center text-slate-400 py-12 text-sm">Sin registros aún</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {columns.map(c => (
                    <th key={c.key} className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-5 py-3">{c.label}</th>
                  ))}
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    {columns.map(c => (
                      <td key={c.key} className="px-5 py-3 text-slate-700 font-medium">
                        {c.render ? c.render(item[c.key]) : item[c.key] || '—'}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      {confirmDel === item.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => { onDelete(item.id); setConfirmDel(null); }}
                            className="text-xs bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-red-700">Confirmar</button>
                          <button onClick={() => setConfirmDel(null)}
                            className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg">Cancelar</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setEditItem(item)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={13} /></button>
                          <button onClick={() => setConfirmDel(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

// ── Formulario simple en modal ────────────────────────────────────────────────
const SimpleModal = ({ title, fields, initial = {}, onSave, onClose }) => {
  const [data, setData] = useState(() => Object.fromEntries(fields.map(f => [f.key, initial[f.key] ?? ''])));
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {fields.map(f => (
            <Field key={f.key} label={f.label}>
              <input type={f.type || 'text'} className={inputCls}
                value={data[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder || ''} />
            </Field>
          ))}
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end border-t border-slate-100 pt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">Cancelar</button>
          <button onClick={() => onSave(data)} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">Guardar</button>
        </div>
      </div>
    </div>
  );
};

// ── Modal detalle cotización ───────────────────────────────────────────────────
const DetalleCotizacionModal = ({ cot, onClose }) => {
  const totalTiempo = Object.values(COSTOS_TIEMPO).reduce(
    (s, c) => s + c.hr * (cot.horas || 0) + c.dia * (cot.dias || 0) + c.semana * (cot.semanas || 0) + c.mes * (cot.meses || 0), 0
  );

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="font-extrabold text-slate-800">Cotización</h3>
            <p className="text-sm text-slate-400">{fmtDate(cot.created_at)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cliente</p>
              <p className="font-bold text-slate-800">{cot.clientes?.nombre || '—'}</p>
              {cot.clientes?.empresa && <p className="text-xs text-slate-500">{cot.clientes.empresa}</p>}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estado</p>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ESTADO_MAP[cot.estado]?.cls || ''}`}>
                {ESTADO_MAP[cot.estado]?.label || cot.estado}
              </span>
            </div>
          </div>
          {cot.descripcion && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descripción</p>
              <p className="text-sm text-slate-700">{cot.descripcion}</p>
            </div>
          )}

          {(cot.articulos || []).length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Artículos</p>
              <div className="space-y-1">
                {cot.articulos.map((a, i) => (
                  <div key={i} className="flex justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-slate-700">{a.nombre} × {a.cantidad}</span>
                    <span className="font-bold text-slate-800">{fmt(a.precio * a.cantidad)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(cot.herramientas || []).length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Herramientas</p>
              <div className="space-y-1">
                {cot.herramientas.map((h, i) => (
                  <div key={i} className="flex justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-slate-700">{h.nombre} × {h.cantidad} × {cot.dias || 0}d</span>
                    <span className="font-bold text-slate-800">{fmt((h.precio_renta_diaria || 0) * h.cantidad * (cot.dias || 0))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(cot.empleados || []).length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Empleados</p>
              <div className="flex flex-wrap gap-2">
                {cot.empleados.map((e, i) => (
                  <span key={i} className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">{e.nombre}</span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tiempo</p>
            {[['Horas', cot.horas], ['Días', cot.dias], ['Semanas', cot.semanas], ['Meses', cot.meses]].filter(([, v]) => v > 0).map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm text-slate-600"><span>{l}: {v}</span></div>
            ))}
            <div className="flex justify-between text-sm font-bold text-slate-700 pt-1 border-t border-slate-200">
              <span>Subtotal tiempo</span><span>{fmt(totalTiempo)}</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white space-y-1.5">
            {[
              { l: 'Artículos',    v: cot.totales?.articulos    || 0 },
              { l: 'Herramientas', v: cot.totales?.herramientas || 0 },
              { l: 'Tiempo',       v: cot.totales?.tiempo       || totalTiempo },
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between text-sm text-blue-100">
                <span>{l}</span><span className="font-bold text-white">{fmt(v)}</span>
              </div>
            ))}
            <div className="flex justify-between font-black text-lg border-t border-blue-500 pt-2 mt-1">
              <span>Total</span><span>{fmt(cot.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Formulario nueva cotización ───────────────────────────────────────────────
const NuevaCotizacionForm = ({ clientes, catalogoArticulos, catalogoHerramientas, trabajadores, onSave, onCancel }) => {
  const [clienteId,    setClienteId]    = useState('');
  const [descripcion,  setDescripcion]  = useState('');
  const [articulos,    setArticulos]    = useState([]);
  const [herramientas, setHerramientas] = useState([]);
  const [empleados,    setEmpleados]    = useState([]);
  const [horas,   setHoras]   = useState(0);
  const [dias,    setDias]    = useState(0);
  const [semanas, setSemanas] = useState(0);
  const [meses,   setMeses]   = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  // Selectores de catálogo
  const [selArt,  setSelArt]  = useState('');
  const [selHer,  setSelHer]  = useState('');
  const [selEmp,  setSelEmp]  = useState('');

  const totalArticulos    = articulos.reduce((s, a) => s + a.precio * a.cantidad, 0);
  const totalHerramientas = herramientas.reduce((s, h) => s + (h.precio_renta_diaria || 0) * h.cantidad * dias, 0);
  const totalTiempo       = Object.values(COSTOS_TIEMPO).reduce(
    (s, c) => s + c.hr * horas + c.dia * dias + c.semana * semanas + c.mes * meses, 0
  );
  const total = totalArticulos + totalHerramientas + totalTiempo;

  const addArticulo = () => {
    const cat = catalogoArticulos.find(a => a.id === selArt);
    if (!cat) return;
    if (articulos.find(a => a.catalogo_id === cat.id)) {
      setArticulos(p => p.map(a => a.catalogo_id === cat.id ? { ...a, cantidad: a.cantidad + 1 } : a));
    } else {
      setArticulos(p => [...p, { _id: uid(), catalogo_id: cat.id, nombre: cat.nombre, precio: cat.precio, cantidad: 1 }]);
    }
    setSelArt('');
  };

  const addHerramienta = () => {
    const cat = catalogoHerramientas.find(h => h.id === selHer);
    if (!cat) return;
    if (herramientas.find(h => h.catalogo_id === cat.id)) {
      setHerramientas(p => p.map(h => h.catalogo_id === cat.id ? { ...h, cantidad: h.cantidad + 1 } : h));
    } else {
      setHerramientas(p => [...p, { _id: uid(), catalogo_id: cat.id, nombre: cat.nombre, precio_renta_diaria: cat.precio_renta_diaria, cantidad: 1 }]);
    }
    setSelHer('');
  };

  const addEmpleado = () => {
    const emp = trabajadores.find(u => String(u.id) === selEmp);
    if (!emp || empleados.find(e => e.id === emp.id)) return;
    setEmpleados(p => [...p, { id: emp.id, nombre: emp.name }]);
    setSelEmp('');
  };

  const handleSave = async () => {
    if (!clienteId) { setError('Selecciona un cliente.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        cliente_id: clienteId,
        descripcion,
        articulos:    articulos.map(({ _id, ...rest }) => rest),
        herramientas: herramientas.map(({ _id, ...rest }) => rest),
        empleados,
        horas, dias, semanas, meses,
        totales: { articulos: totalArticulos, herramientas: totalHerramientas, tiempo: totalTiempo },
        total,
      });
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && <ErrorMsg msg={error} />}

      {/* Info básica */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-extrabold text-slate-800 border-b border-slate-100 pb-3">Información Básica</h2>
        <Field label="Cliente *">
          <select className={inputCls} value={clienteId} onChange={e => setClienteId(e.target.value)}>
            <option value="">— Selecciona un cliente —</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` — ${c.empresa}` : ''}</option>
            ))}
          </select>
        </Field>
        <Field label="Descripción">
          <textarea className={inputCls + ' resize-none'} rows={3} value={descripcion}
            onChange={e => setDescripcion(e.target.value)} placeholder="Describe el trabajo a realizar…" />
        </Field>
      </div>

      {/* Artículos */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
          <Package size={15} className="text-blue-500" /> Artículos
        </h2>
        <div className="flex gap-2 mb-3">
          <select className={inputCls} value={selArt} onChange={e => setSelArt(e.target.value)}>
            <option value="">— Selecciona del catálogo —</option>
            {catalogoArticulos.map(a => <option key={a.id} value={a.id}>{a.nombre} ({fmt(a.precio)}/{a.unidad})</option>)}
          </select>
          <button onClick={addArticulo} disabled={!selArt}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40 flex-shrink-0">
            <Plus size={14} /> Agregar
          </button>
        </div>
        {articulos.length > 0 && (
          <div className="space-y-1.5">
            {articulos.map(a => (
              <div key={a._id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{a.nombre}</p>
                  <p className="text-xs text-slate-400">{fmt(a.precio)} × {a.cantidad} = {fmt(a.precio * a.cantidad)}</p>
                </div>
                <input type="number" min="1" value={a.cantidad}
                  onChange={e => setArticulos(p => p.map(i => i._id === a._id ? { ...i, cantidad: +e.target.value || 1 } : i))}
                  className="w-16 text-center text-sm font-bold border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400 bg-white" />
                <button onClick={() => setArticulos(p => p.filter(i => i._id !== a._id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
              </div>
            ))}
            <div className="flex justify-end text-sm font-bold text-slate-700 pr-1">Total artículos: {fmt(totalArticulos)}</div>
          </div>
        )}
      </div>

      {/* Herramientas */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
          <Wrench size={15} className="text-amber-500" /> Herramientas
        </h2>
        <div className="flex gap-2 mb-3">
          <select className={inputCls} value={selHer} onChange={e => setSelHer(e.target.value)}>
            <option value="">— Selecciona del catálogo —</option>
            {catalogoHerramientas.map(h => <option key={h.id} value={h.id}>{h.nombre} ({fmt(h.precio_renta_diaria)}/día)</option>)}
          </select>
          <button onClick={addHerramienta} disabled={!selHer}
            className="flex items-center gap-1 px-3 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 disabled:opacity-40 flex-shrink-0">
            <Plus size={14} /> Agregar
          </button>
        </div>
        {herramientas.length > 0 && (
          <div className="space-y-1.5">
            {herramientas.map(h => (
              <div key={h._id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{h.nombre}</p>
                  <p className="text-xs text-slate-400">{fmt(h.precio_renta_diaria)}/día × {h.cantidad} × {dias}d = {fmt((h.precio_renta_diaria || 0) * h.cantidad * dias)}</p>
                </div>
                <input type="number" min="1" value={h.cantidad}
                  onChange={e => setHerramientas(p => p.map(i => i._id === h._id ? { ...i, cantidad: +e.target.value || 1 } : i))}
                  className="w-16 text-center text-sm font-bold border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400 bg-white" />
                <button onClick={() => setHerramientas(p => p.filter(i => i._id !== h._id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
              </div>
            ))}
            <div className="flex justify-end text-sm font-bold text-slate-700 pr-1">Total herramientas: {fmt(totalHerramientas)}</div>
          </div>
        )}
      </div>

      {/* Empleados */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
          <Users size={15} className="text-green-500" /> Empleados
        </h2>
        <div className="flex gap-2 mb-3">
          <select className={inputCls} value={selEmp} onChange={e => setSelEmp(e.target.value)}>
            <option value="">— Selecciona un trabajador —</option>
            {trabajadores.filter(u => !empleados.find(e => e.id === u.id)).map(u => (
              <option key={u.id} value={String(u.id)}>{u.name}</option>
            ))}
          </select>
          <button onClick={addEmpleado} disabled={!selEmp}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-40 flex-shrink-0">
            <Plus size={14} /> Agregar
          </button>
        </div>
        {empleados.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {empleados.map(e => (
              <span key={e.id} className="flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full">
                {e.nombre}
                <button onClick={() => setEmpleados(p => p.filter(i => i.id !== e.id))} className="text-green-600 hover:text-red-500"><X size={11} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tiempo */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
          <Clock size={15} className="text-blue-500" /> Tiempo de Trabajo
        </h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Horas',   value: horas,   set: setHoras,   key: 'hr'     },
            { label: 'Días',    value: dias,     set: setDias,    key: 'dia'    },
            { label: 'Semanas', value: semanas,  set: setSemanas, key: 'semana' },
            { label: 'Meses',   value: meses,    set: setMeses,   key: 'mes'    },
          ].map(({ label, value, set, key }) => {
            const sub = Object.values(COSTOS_TIEMPO).reduce((s, c) => s + c[key] * value, 0);
            return (
              <div key={label} className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
                <input type="number" min="0" value={value}
                  onChange={e => set(+e.target.value || 0)}
                  className="w-20 text-center text-xl font-black border border-slate-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-blue-400 bg-white mx-auto block mb-1.5" />
                <p className="text-xs font-bold text-slate-600">{fmt(sub)}</p>
              </div>
            );
          })}
        </div>
        <div className="bg-blue-50 rounded-xl px-5 py-3 flex justify-between">
          <span className="text-sm font-bold text-blue-700">Total por tiempo</span>
          <span className="text-base font-black text-blue-700">{fmt(totalTiempo)}</span>
        </div>
      </div>

      {/* Total y botones */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white space-y-2">
        {[
          { l: 'Artículos',    v: totalArticulos    },
          { l: 'Herramientas', v: totalHerramientas },
          { l: 'Tiempo',       v: totalTiempo       },
        ].map(({ l, v }) => (
          <div key={l} className="flex justify-between text-sm text-blue-100">
            <span>{l}</span><span className="font-bold text-white">{fmt(v)}</span>
          </div>
        ))}
        <div className="flex justify-between font-black text-xl border-t border-blue-500 pt-3 mt-1">
          <span>Total</span><span>{fmt(total)}</span>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-white text-blue-700 font-black rounded-xl hover:bg-blue-50 text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Guardando…' : 'Guardar Cotización'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Tab: Lista de cotizaciones ────────────────────────────────────────────────
const CotizacionesListTab = ({ cotizaciones, loading, error, readOnly, onView, onDelete, onEstado }) => {
  const [confirmDel, setConfirmDel] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const filtered = filtroEstado === 'todos' ? cotizaciones : cotizaciones.filter(c => c.estado === filtroEstado);
  const counts = { pendiente: 0, aprobada: 0, rechazada: 0 };
  cotizaciones.forEach(c => { if (counts[c.estado] !== undefined) counts[c.estado]++; });

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(ESTADO_MAP).map(([k, v]) => (
          <div key={k} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center cursor-pointer hover:border-slate-200 transition-all"
            onClick={() => setFiltroEstado(filtroEstado === k ? 'todos' : k)}>
            <p className="text-2xl font-black text-slate-800 mb-0.5">{counts[k]}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.cls}`}>{v.label}</span>
          </div>
        ))}
      </div>

      {/* Filtro */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['todos', ...Object.keys(ESTADO_MAP)].map(k => (
          <button key={k} onClick={() => setFiltroEstado(k)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filtroEstado === k ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {k === 'todos' ? 'Todos' : ESTADO_MAP[k].label}
          </button>
        ))}
      </div>

      {error && <ErrorMsg msg={error} />}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-slate-400 gap-3">
          <FileText size={38} />
          <p>No hay cotizaciones</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Cliente', 'Descripción', 'Total', 'Estado', 'Fecha', ''].map(h => (
                  <th key={h} className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(cot => (
                <tr key={cot.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <p className="font-bold text-slate-800">{cot.clientes?.nombre || '—'}</p>
                    {cot.clientes?.empresa && <p className="text-xs text-slate-400">{cot.clientes.empresa}</p>}
                  </td>
                  <td className="px-5 py-3 text-slate-500 max-w-[180px]">
                    <p className="truncate text-sm">{cot.descripcion || '—'}</p>
                  </td>
                  <td className="px-5 py-3 font-black text-slate-800">{fmt(cot.total)}</td>
                  <td className="px-5 py-3">
                    {readOnly ? (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ESTADO_MAP[cot.estado]?.cls}`}>
                        {ESTADO_MAP[cot.estado]?.label}
                      </span>
                    ) : (
                      <select value={cot.estado}
                        onChange={e => onEstado(cot.id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 ${ESTADO_MAP[cot.estado]?.cls}`}>
                        {Object.entries(ESTADO_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{fmtDate(cot.created_at)}</td>
                  <td className="px-5 py-3">
                    {confirmDel === cot.id ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => { onDelete(cot.id); setConfirmDel(null); }}
                          className="text-xs bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-red-700">Confirmar</button>
                        <button onClick={() => setConfirmDel(null)}
                          className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg">Cancelar</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => onView(cot)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Eye size={14} /></button>
                        {!readOnly && (
                          <button onClick={() => setConfirmDel(cot.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const CotizacionesComplexSection = ({ currentUser, readOnly = false }) => {
  const [activeTab, setActiveTab] = useState('cotizaciones');
  const [showForm,  setShowForm]  = useState(false);
  const [viewCot,   setViewCot]   = useState(null);

  // Data
  const [cotizaciones,   setCotizaciones]   = useState([]);
  const [clientes,       setClientes]       = useState([]);
  const [catArticulos,   setCatArticulos]   = useState([]);
  const [catHerramientas, setCatHerramientas] = useState([]);
  const [trabajadores,   setTrabajadores]   = useState([]);

  // Loading/error state per resource
  const [loadingCot, setLoadingCot] = useState(true);
  const [loadingCat, setLoadingCat] = useState(true);
  const [errorCot,   setErrorCot]   = useState('');
  const [errorCat,   setErrorCat]   = useState('');

  const fetchCotizaciones = useCallback(async () => {
    setLoadingCot(true); setErrorCot('');
    try { setCotizaciones(await apiGetCotizaciones()); }
    catch (e) { setErrorCot(e.message); }
    finally { setLoadingCot(false); }
  }, []);

  const fetchCatalogos = useCallback(async () => {
    setLoadingCat(true); setErrorCat('');
    try {
      const [cl, ar, he] = await Promise.all([apiGetClientes(), apiGetArticulos(), apiGetHerramientas()]);
      setClientes(cl); setCatArticulos(ar); setCatHerramientas(he);
    } catch (e) { setErrorCat(e.message); }
    finally { setLoadingCat(false); }
  }, []);

  const fetchTrabajadores = useCallback(async () => {
    try {
      const res  = await fetch('/api/users', { headers: authHeaders(false) });
      const data = await res.json();
      setTrabajadores((data.users || []).filter(u => u.nivel >= 1));
    } catch { /* ignorar */ }
  }, []);

  useEffect(() => {
    fetchCotizaciones();
    fetchCatalogos();
    fetchTrabajadores();
  }, [fetchCotizaciones, fetchCatalogos, fetchTrabajadores]);

  const handleSaveCot = async (fields) => {
    await apiCreateCotizacion(fields);
    await fetchCotizaciones();
    setShowForm(false);
  };

  const handleDeleteCot = async (id) => {
    await apiDeleteCotizacion(id);
    setCotizaciones(p => p.filter(c => c.id !== id));
  };

  const handleEstado = async (id, estado) => {
    const updated = await apiUpdateCotizacion(id, { estado });
    setCotizaciones(p => p.map(c => c.id === id ? updated : c));
  };

  const tabs = [
    { id: 'cotizaciones',  label: 'Cotizaciones',  icon: <FileText size={14} />  },
    ...(!readOnly ? [
      { id: 'clientes',    label: 'Clientes',      icon: <Users size={14} />    },
      { id: 'articulos',   label: 'Artículos',     icon: <Package size={14} />  },
      { id: 'herramientas',label: 'Herramientas',  icon: <Wrench size={14} />   },
    ] : []),
  ];

  return (
    <div>
      {viewCot && <DetalleCotizacionModal cot={viewCot} onClose={() => setViewCot(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cotizaciones</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {readOnly ? 'Vista de cotizaciones (solo lectura)' : 'Gestión completa de cotizaciones y catálogos'}
          </p>
        </div>
        {!readOnly && activeTab === 'cotizaciones' && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-sm text-sm transition-all">
            <Plus size={16} /> Nueva Cotización
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setShowForm(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'cotizaciones' && (
        showForm ? (
          <NuevaCotizacionForm
            clientes={clientes}
            catalogoArticulos={catArticulos}
            catalogoHerramientas={catHerramientas}
            trabajadores={trabajadores}
            onSave={handleSaveCot}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <CotizacionesListTab
            cotizaciones={cotizaciones}
            loading={loadingCot}
            error={errorCot}
            readOnly={readOnly}
            onView={setViewCot}
            onDelete={handleDeleteCot}
            onEstado={handleEstado}
          />
        )
      )}

      {activeTab === 'clientes' && (
        <CatalogoManager
          title="Clientes"
          items={clientes}
          loading={loadingCat}
          error={errorCat}
          columns={[
            { key: 'nombre',   label: 'Nombre'   },
            { key: 'empresa',  label: 'Empresa'  },
            { key: 'correo',   label: 'Correo'   },
            { key: 'telefono', label: 'Teléfono' },
          ]}
          onAdd={async (d) => { const c = await apiCreateCliente(d); setClientes(p => [...p, c].sort((a, b) => a.nombre.localeCompare(b.nombre))); }}
          onEdit={async (id, d) => { const c = await apiUpdateCliente(id, d); setClientes(p => p.map(i => i.id === id ? c : i)); }}
          onDelete={async (id) => { await apiDeleteCliente(id); setClientes(p => p.filter(i => i.id !== id)); }}
          addForm={({ initial, onSave, onClose, isEdit }) => (
            <SimpleModal
              title={isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
              fields={[
                { key: 'nombre',   label: 'Nombre *',   placeholder: 'Nombre completo' },
                { key: 'empresa',  label: 'Empresa',    placeholder: 'Empresa o razón social' },
                { key: 'correo',   label: 'Correo',     placeholder: 'correo@ejemplo.com', type: 'email' },
                { key: 'telefono', label: 'Teléfono',   placeholder: '+52 555 000 0000', type: 'tel' },
              ]}
              initial={initial || {}}
              onSave={onSave}
              onClose={onClose}
            />
          )}
        />
      )}

      {activeTab === 'articulos' && (
        <CatalogoManager
          title="Catálogo de Artículos"
          items={catArticulos}
          loading={loadingCat}
          error={errorCat}
          columns={[
            { key: 'nombre', label: 'Nombre' },
            { key: 'precio', label: 'Precio', render: v => <span className="font-bold">{fmt(v)}</span> },
            { key: 'unidad', label: 'Unidad' },
          ]}
          onAdd={async (d) => { const a = await apiCreateArticulo(d); setCatArticulos(p => [...p, a].sort((a, b) => a.nombre.localeCompare(b.nombre))); }}
          onEdit={async (id, d) => { const a = await apiUpdateArticulo(id, d); setCatArticulos(p => p.map(i => i.id === id ? a : i)); }}
          onDelete={async (id) => { await apiDeleteArticulo(id); setCatArticulos(p => p.filter(i => i.id !== id)); }}
          addForm={({ initial, onSave, onClose, isEdit }) => (
            <SimpleModal
              title={isEdit ? 'Editar Artículo' : 'Nuevo Artículo'}
              fields={[
                { key: 'nombre', label: 'Nombre *', placeholder: 'Nombre del artículo' },
                { key: 'precio', label: 'Precio ($)', placeholder: '0.00', type: 'number' },
                { key: 'unidad', label: 'Unidad',    placeholder: 'pza, kg, m, etc.' },
              ]}
              initial={initial || {}}
              onSave={onSave}
              onClose={onClose}
            />
          )}
        />
      )}

      {activeTab === 'herramientas' && (
        <CatalogoManager
          title="Catálogo de Herramientas"
          items={catHerramientas}
          loading={loadingCat}
          error={errorCat}
          columns={[
            { key: 'nombre',              label: 'Nombre' },
            { key: 'precio_renta_diaria', label: 'Precio/día', render: v => <span className="font-bold">{fmt(v)}</span> },
          ]}
          onAdd={async (d) => { const h = await apiCreateHerramienta(d); setCatHerramientas(p => [...p, h].sort((a, b) => a.nombre.localeCompare(b.nombre))); }}
          onEdit={async (id, d) => { const h = await apiUpdateHerramienta(id, d); setCatHerramientas(p => p.map(i => i.id === id ? h : i)); }}
          onDelete={async (id) => { await apiDeleteHerramienta(id); setCatHerramientas(p => p.filter(i => i.id !== id)); }}
          addForm={({ initial, onSave, onClose, isEdit }) => (
            <SimpleModal
              title={isEdit ? 'Editar Herramienta' : 'Nueva Herramienta'}
              fields={[
                { key: 'nombre',              label: 'Nombre *',        placeholder: 'Nombre de la herramienta' },
                { key: 'precio_renta_diaria', label: 'Precio renta/día', placeholder: '0.00', type: 'number' },
              ]}
              initial={initial || {}}
              onSave={onSave}
              onClose={onClose}
            />
          )}
        />
      )}
    </div>
  );
};

export default CotizacionesComplexSection;
