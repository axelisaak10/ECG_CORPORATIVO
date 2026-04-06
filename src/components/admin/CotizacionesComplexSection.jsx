import { useState } from 'react';
import { Plus, Trash2, X, Package, Wrench, Users, Clock, Eye, FileText } from 'lucide-react';

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

const uid  = () => Math.random().toString(36).slice(2);
const fmt  = (n) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

const STORAGE_KEY = 'ecg_cotizaciones_v2';

const load  = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const save  = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

// ── Input con label ───────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);
const inputCls = 'w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

// ── Modal añadir item ─────────────────────────────────────────────────────────
const AddItemModal = ({ tipo, onAdd, onClose }) => {
  const [nombre,    setNombre]    = useState('');
  const [precio,    setPrecio]    = useState('');
  const [precioDia, setPrecioDia] = useState('');
  const [cantidad,  setCantidad]  = useState('1');

  const submit = () => {
    if (!nombre.trim()) return;
    if (tipo === 'articulo')    onAdd({ id: uid(), nombre: nombre.trim(), precio: +precio || 0, cantidad: +cantidad || 1 });
    if (tipo === 'herramienta') onAdd({ id: uid(), nombre: nombre.trim(), precio_renta_diaria: +precioDia || 0, cantidad: +cantidad || 1 });
    if (tipo === 'empleado')    onAdd({ id: uid(), nombre: nombre.trim() });
  };

  const titles = { articulo: 'Agregar Artículo', herramienta: 'Agregar Herramienta', empleado: 'Agregar Empleado' };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800">{titles[tipo]}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={15} /></button>
        </div>

        <Field label="Nombre">
          <input className={inputCls} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del item…" autoFocus />
        </Field>

        {tipo === 'articulo' && (
          <>
            <Field label="Precio unitario ($)">
              <input className={inputCls} type="number" min="0" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Cantidad">
              <input className={inputCls} type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)} />
            </Field>
          </>
        )}

        {tipo === 'herramienta' && (
          <>
            <Field label="Precio renta/día ($)">
              <input className={inputCls} type="number" min="0" value={precioDia} onChange={e => setPrecioDia(e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Cantidad">
              <input className={inputCls} type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)} />
            </Field>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">Cancelar</button>
          <button onClick={submit} className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all">Agregar</button>
        </div>
      </div>
    </div>
  );
};

// ── Modal detalle cotización ──────────────────────────────────────────────────
const DetalleModal = ({ cotizacion: c, onClose }) => (
  <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 flex flex-col max-h-[85vh]">
      <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cotización</p>
          <h3 className="font-extrabold text-slate-800 text-lg">{c.cliente}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{fmtDate(c.createdAt)}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 flex-shrink-0"><X size={16} /></button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
        {c.descripcion && (
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descripción</p>
            <p className="text-sm text-slate-600">{c.descripcion}</p>
          </div>
        )}
        {c.articulos?.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Artículos</p>
            {c.articulos.map(a => (
              <div key={a.id} className="flex justify-between text-sm py-1 border-b border-slate-50">
                <span className="text-slate-700">{a.nombre} × {a.cantidad}</span>
                <span className="font-bold text-slate-800">{fmt(a.precio * a.cantidad)}</span>
              </div>
            ))}
          </div>
        )}
        {c.herramientas?.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Herramientas</p>
            {c.herramientas.map(h => (
              <div key={h.id} className="flex justify-between text-sm py-1 border-b border-slate-50">
                <span className="text-slate-700">{h.nombre} × {h.cantidad} × {c.dias}d</span>
                <span className="font-bold text-slate-800">{fmt((h.precio_renta_diaria || 0) * h.cantidad * c.dias)}</span>
              </div>
            ))}
          </div>
        )}
        {c.empleados?.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Empleados</p>
            {c.empleados.map(e => (
              <div key={e.id} className="text-sm text-slate-700 py-1 border-b border-slate-50">{e.nombre}</div>
            ))}
          </div>
        )}
        <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
          {[
            { l: 'Artículos',    v: c.totales?.articulos    },
            { l: 'Herramientas', v: c.totales?.herramientas },
            { l: 'Tiempo',       v: c.totales?.tiempo       },
          ].map(({ l, v }) => (
            <div key={l} className="flex justify-between text-sm">
              <span className="text-slate-500">{l}</span>
              <span className="font-semibold text-slate-700">{fmt(v)}</span>
            </div>
          ))}
          <div className="flex justify-between font-extrabold text-base border-t border-slate-200 pt-2 mt-2">
            <span>Total</span><span className="text-blue-600">{fmt(c.total)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── Formulario nueva cotización ───────────────────────────────────────────────
const NuevaCotizacionForm = ({ onSave, onCancel }) => {
  const [cliente,    setCliente]    = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [articulos,   setArticulos]   = useState([]);
  const [herramientas, setHerramientas] = useState([]);
  const [empleados,   setEmpleados]   = useState([]);
  const [horas,   setHoras]   = useState(0);
  const [dias,    setDias]    = useState(0);
  const [semanas, setSemanas] = useState(0);
  const [meses,   setMeses]   = useState(0);
  const [modal,   setModal]   = useState(null); // 'articulo' | 'herramienta' | 'empleado'
  const [error,   setError]   = useState('');

  const totalTiempo      = Object.values(COSTOS_TIEMPO).reduce((s, c) => s + c.hr * horas + c.dia * dias + c.semana * semanas + c.mes * meses, 0);
  const totalArticulos    = articulos.reduce((s, a) => s + a.precio * a.cantidad, 0);
  const totalHerramientas = herramientas.reduce((s, h) => s + (h.precio_renta_diaria || 0) * h.cantidad * dias, 0);
  const total             = totalArticulos + totalHerramientas + totalTiempo;

  const handleSave = () => {
    if (!cliente.trim()) { setError('El nombre del cliente es requerido.'); return; }
    onSave({
      id: uid(),
      cliente: cliente.trim(),
      descripcion,
      articulos,
      herramientas,
      empleados,
      horas, dias, semanas, meses,
      totales: { articulos: totalArticulos, herramientas: totalHerramientas, tiempo: totalTiempo },
      total,
      createdAt: new Date().toISOString(),
      estado: 'pendiente',
    });
  };

  return (
    <div className="space-y-5">
      {error && <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold">{error}</div>}

      {/* Info básica */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-extrabold text-slate-800 border-b border-slate-100 pb-3">Información Básica</h2>
        <Field label="Cliente">
          <input className={inputCls} value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nombre del cliente…" />
        </Field>
        <Field label="Descripción">
          <textarea className={inputCls + ' resize-none'} rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Describe el trabajo a realizar…" />
        </Field>
      </div>

      {/* Materiales */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4">Materiales y Recursos</h2>

        <div className="flex gap-2 flex-wrap mb-4">
          {[
            { tipo: 'articulo',    label: 'Artículo',     Icon: Package, cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100'   },
            { tipo: 'herramienta', label: 'Herramienta',  Icon: Wrench,  cls: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
            { tipo: 'empleado',    label: 'Empleado',     Icon: Users,   cls: 'bg-green-50 text-green-700 hover:bg-green-100'  },
          ].map(({ tipo, label, Icon, cls }) => (
            <button key={tipo} onClick={() => setModal(tipo)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${cls}`}>
              <Icon size={14} /> Agregar {label}
            </button>
          ))}
        </div>

        {/* Artículos */}
        {articulos.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Artículos</p>
            <div className="space-y-1.5">
              {articulos.map(a => (
                <div key={a.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{a.nombre}</p>
                    <p className="text-xs text-slate-400">{fmt(a.precio)} × {a.cantidad} = {fmt(a.precio * a.cantidad)}</p>
                  </div>
                  <input type="number" min="1" value={a.cantidad}
                    onChange={e => setArticulos(p => p.map(i => i.id === a.id ? { ...i, cantidad: +e.target.value || 1 } : i))}
                    className="w-16 text-center text-sm font-bold border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400 bg-white" />
                  <button onClick={() => setArticulos(p => p.filter(i => i.id !== a.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Herramientas */}
        {herramientas.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Herramientas</p>
            <div className="space-y-1.5">
              {herramientas.map(h => (
                <div key={h.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{h.nombre}</p>
                    <p className="text-xs text-slate-400">{fmt(h.precio_renta_diaria)}/día × {h.cantidad} × {dias}d = {fmt((h.precio_renta_diaria || 0) * h.cantidad * dias)}</p>
                  </div>
                  <input type="number" min="1" value={h.cantidad}
                    onChange={e => setHerramientas(p => p.map(i => i.id === h.id ? { ...i, cantidad: +e.target.value || 1 } : i))}
                    className="w-16 text-center text-sm font-bold border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400 bg-white" />
                  <button onClick={() => setHerramientas(p => p.filter(i => i.id !== h.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empleados */}
        {empleados.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Empleados</p>
            <div className="space-y-1.5">
              {empleados.map(e => (
                <div key={e.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                  <p className="flex-1 text-sm font-semibold text-slate-800">{e.nombre}</p>
                  <button onClick={() => setEmpleados(p => p.filter(i => i.id !== e.id))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {articulos.length === 0 && herramientas.length === 0 && empleados.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-3">Sin items agregados aún</p>
        )}
      </div>

      {/* Tiempo */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-blue-500" /> Tiempo de Trabajo
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
          <button onClick={onCancel} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all">Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-2.5 bg-white text-blue-700 font-black rounded-xl hover:bg-blue-50 transition-all text-sm">Guardar Cotización</button>
        </div>
      </div>

      {modal && (
        <AddItemModal
          tipo={modal}
          onAdd={(item) => {
            if (modal === 'articulo')    setArticulos(p => [...p, item]);
            if (modal === 'herramienta') setHerramientas(p => [...p, item]);
            if (modal === 'empleado')    setEmpleados(p => [...p, item]);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

// ── Sección principal ─────────────────────────────────────────────────────────
const CotizacionesComplexSection = ({ readOnly = false }) => {
  const [cotizaciones, setCotizaciones] = useState(load);
  const [showForm,     setShowForm]     = useState(false);
  const [viewing,      setViewing]      = useState(null);
  const [confirmDel,   setConfirmDel]   = useState(null);

  const guardar = (cotizacion) => {
    const updated = [cotizacion, ...cotizaciones];
    save(updated);
    setCotizaciones(updated);
    setShowForm(false);
  };

  const eliminar = (id) => {
    const updated = cotizaciones.filter(c => c.id !== id);
    save(updated);
    setCotizaciones(updated);
    setConfirmDel(null);
  };

  const STATUS = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobada:  'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
  };

  if (showForm) return <NuevaCotizacionForm onSave={guardar} onCancel={() => setShowForm(false)} />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cotizaciones</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {readOnly ? 'Vista de cotizaciones (solo lectura)' : 'Gestión de propuestas y cotizaciones'}
          </p>
        </div>
        {!readOnly && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-sm text-sm transition-all">
            <Plus size={16} /> Nueva Cotización
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total',      count: cotizaciones.length,                                    cls: 'bg-blue-100 text-blue-700'    },
          { label: 'Pendientes', count: cotizaciones.filter(c => c.estado === 'pendiente').length, cls: 'bg-yellow-100 text-yellow-700' },
          { label: 'Aprobadas',  count: cotizaciones.filter(c => c.estado === 'aprobada').length,  cls: 'bg-green-100 text-green-700'   },
        ].map(({ label, count, cls }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 px-2 py-0.5 rounded-full inline-block ${cls}`}>{label}</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{count}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-800">Listado</h2>
          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">{cotizaciones.length} total</span>
        </div>

        {cotizaciones.length === 0 ? (
          <div className="py-16 text-center text-slate-200 flex flex-col items-center gap-3">
            <FileText size={40} />
            <p className="font-medium text-slate-400">No hay cotizaciones aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {['Cliente', 'Total', 'Estado', 'Fecha', 'Acciones'].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cotizaciones.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-800 text-sm">{c.cliente}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 text-sm">{fmt(c.total)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS[c.estado] || STATUS.pendiente}`}>{c.estado}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-sm">{fmtDate(c.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewing(c)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Eye size={15} /></button>
                        {!readOnly && (
                          confirmDel === c.id ? (
                            <>
                              <button onClick={() => eliminar(c.id)} className="text-xs bg-red-600 text-white font-bold px-2.5 py-1 rounded-lg hover:bg-red-700">Eliminar</button>
                              <button onClick={() => setConfirmDel(null)} className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-lg">✕</button>
                            </>
                          ) : (
                            <button onClick={() => setConfirmDel(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={15} /></button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewing && <DetalleModal cotizacion={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
};

export default CotizacionesComplexSection;
