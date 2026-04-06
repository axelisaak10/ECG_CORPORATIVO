import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, X, ChevronDown, Users, Wrench, Package, Clock } from 'lucide-react';

const API_BASE_URL = 'http://192.168.0.180/api';

const COSTOS_TIEMPO = {
  'Renta oficina':  { dia: 116.67,  semana: 875.00,   mes: 3500.00  },
  'Renta bodega':   { dia: 66.67,   semana: 500.00,   mes: 2000.00  },
  'Luz':            { dia: 100.00,  semana: 750.00,   mes: 3000.00  },
  'Agua':           { dia: 30.00,   semana: 225.00,   mes: 900.00   },
  'Equipo':         { dia: 100.00,  semana: 750.00,   mes: 3000.00  },
  'Insumos':        { dia: 16.67,   semana: 125.00,   mes: 500.00   },
  'Sueldos':        { dia: 7583.33, semana: 45500.00, mes: 182000.00 },
  'Gasolina':       { dia: 166.67,  semana: 1250.00,  mes: 5000.00  },
  'Seguro':         { dia: 1000.00, semana: 7500.00,  mes: 30000.00 },
  'Carro':          { dia: 266.67,  semana: 2000.00,  mes: 8000.00  },
  'Varios':         { dia: 333.33,  semana: 2500.00,  mes: 10000.00 },
};

const fmt = (n) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Modal genérico ────────────────────────────────────────────────────────────
const Modal = ({ title, open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-extrabold text-slate-800 text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">{children}</div>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const CotizacionesComplexSection = () => {
  // Datos del servidor
  const [categorias,  setCategorias]  = useState([]);
  const [articulos,   setArticulos]   = useState([]);
  const [herramientas, setHerramientas] = useState([]);
  const [clientes,    setClientes]    = useState([]);
  const [empleados,   setEmpleados]   = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError,   setDataError]   = useState('');

  // Formulario
  const [clienteId,  setClienteId]  = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Carritos
  const [carritoArticulos,    setCarritoArticulos]    = useState([]);
  const [carritoHerramientas, setCarritoHerramientas] = useState([]);
  const [carritoEmpleados,    setCarritoEmpleados]    = useState([]);

  // Tiempo
  const [dias,    setDias]    = useState(0);
  const [semanas, setSemanas] = useState(0);
  const [meses,   setMeses]   = useState(0);

  // Modales
  const [modalArt,  setModalArt]  = useState(false);
  const [modalHerr, setModalHerr] = useState(false);
  const [modalEmp,  setModalEmp]  = useState(false);
  const [catFiltro, setCatFiltro] = useState('');

  // Estado guardado
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');
  const [saveError,  setSaveError]  = useState('');

  // ── Cargar datos ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    setDataError('');
    try {
      const endpoints = [
        { url: `${API_BASE_URL}/categorias.php`,  key: 'categorias'   },
        { url: `${API_BASE_URL}/articulos.php`,   key: 'articulos'    },
        { url: `${API_BASE_URL}/herramientas.php`,key: 'herramientas' },
        { url: `${API_BASE_URL}/clientes.php`,    key: 'clientes'     },
        { url: `${API_BASE_URL}/empleados.php`,   key: 'empleados'    },
      ];
      const results = {};
      await Promise.all(endpoints.map(async ({ url, key }) => {
        try {
          const r = await fetch(url);
          if (r.ok) results[key] = await r.json();
        } catch { /* ignorar errores individuales */ }
      }));
      setCategorias(results.categorias   || []);
      setArticulos(results.articulos     || []);
      setHerramientas(results.herramientas || []);
      setClientes(results.clientes       || []);
      setEmpleados(results.empleados     || []);
    } catch {
      setDataError('No se pudieron cargar los datos. Verifica la conexión con el servidor.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Cálculos ───────────────────────────────────────────────────────────────
  const totalTiempo = Object.values(COSTOS_TIEMPO).reduce((sum, s) =>
    sum + s.dia * dias + s.semana * semanas + s.mes * meses, 0);

  const totalArticulos    = carritoArticulos.reduce((s, i) => s + i.precio * (i.cantidad || 0), 0);
  const totalHerramientas = carritoHerramientas.reduce((s, i) => s + (i.precio_renta_diaria || 0) * (i.cantidad || 0) * dias, 0);
  const totalEmpleados    = carritoEmpleados.reduce((s, i) => s + (i.horas || 0) * 100, 0);
  const total             = totalArticulos + totalHerramientas + totalTiempo + totalEmpleados;

  // ── Carrito acciones ──────────────────────────────────────────────────────
  const addArticulo = (item) => {
    setCarritoArticulos(p => [...p, { ...item, _uid: Date.now(), cantidad: 1 }]);
    setModalArt(false);
  };
  const addHerramienta = (item) => {
    setCarritoHerramientas(p => [...p, { ...item, _uid: Date.now(), cantidad: 1 }]);
    setModalHerr(false);
  };
  const addEmpleado = (item) => {
    setCarritoEmpleados(p => [...p, { ...item, _uid: Date.now() }]);
    setModalEmp(false);
  };

  const updCantArt  = (_uid, val) => setCarritoArticulos(p => p.map(i => i._uid === _uid ? { ...i, cantidad: +val || 0 } : i));
  const updCantHerr = (_uid, val) => setCarritoHerramientas(p => p.map(i => i._uid === _uid ? { ...i, cantidad: +val || 0 } : i));
  const delArt      = (_uid) => setCarritoArticulos(p => p.filter(i => i._uid !== _uid));
  const delHerr     = (_uid) => setCarritoHerramientas(p => p.filter(i => i._uid !== _uid));
  const delEmp      = (_uid) => setCarritoEmpleados(p => p.filter(i => i._uid !== _uid));

  // ── Guardar ────────────────────────────────────────────────────────────────
  const guardar = async () => {
    if (!clienteId) { setSaveError('Selecciona un cliente.'); return; }
    setSaving(true); setSaveMsg(''); setSaveError('');
    try {
      const body = new FormData();
      body.append('cliente_id',  clienteId);
      body.append('descripcion', descripcion);
      body.append('articulos',   JSON.stringify(carritoArticulos));
      body.append('herramientas', JSON.stringify(carritoHerramientas));
      body.append('empleados',   JSON.stringify(carritoEmpleados));
      body.append('dias',    dias);
      body.append('semanas', semanas);
      body.append('meses',   meses);
      body.append('costo_total', total);

      const r = await fetch(`${API_BASE_URL}/guardar_cotizacion.php`, { method: 'POST', body });
      const data = await r.json();
      if (data.success) {
        setSaveMsg('Cotización guardada exitosamente.');
        setCarritoArticulos([]); setCarritoHerramientas([]); setCarritoEmpleados([]);
        setDias(0); setSemanas(0); setMeses(0); setDescripcion(''); setClienteId('');
      } else {
        setSaveError(data.message || 'Error al guardar.');
      }
    } catch {
      setSaveError('No se pudo conectar con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loadingData) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3" />
      Cargando datos…
    </div>
  );

  if (dataError) return (
    <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-5 py-4 text-sm font-semibold">
      {dataError}
    </div>
  );

  const artFiltrados = catFiltro
    ? articulos.filter(a => String(a.categoria_id) === catFiltro)
    : articulos;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Nueva Cotización</h1>
        <p className="text-slate-500 text-sm mt-0.5">Arma una cotización con artículos, herramientas, empleados y tiempo</p>
      </div>

      {/* Mensajes */}
      {saveMsg   && <div className="bg-green-50 border border-green-100 text-green-700 rounded-xl px-4 py-3 text-sm font-semibold">{saveMsg}</div>}
      {saveError && <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold">{saveError}</div>}

      {/* ── Info básica ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3">Información Básica</h2>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cliente</label>
          <select value={clienteId} onChange={e => setClienteId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
            <option value="">Selecciona un cliente…</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción</label>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3}
            placeholder="Describe el trabajo a realizar…"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none" />
        </div>
      </div>

      {/* ── Materiales y recursos ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3 mb-4">Materiales y Recursos</h2>

        <div className="flex gap-3 mb-5 flex-wrap">
          <button onClick={() => setModalArt(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-sm transition-all">
            <Package size={15} /> Agregar Artículo
          </button>
          <button onClick={() => setModalHerr(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-sm transition-all">
            <Wrench size={15} /> Agregar Herramienta
          </button>
          <button onClick={() => setModalEmp(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-xl text-sm transition-all">
            <Users size={15} /> Agregar Empleado
          </button>
        </div>

        {/* Artículos en carrito */}
        {carritoArticulos.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Artículos</p>
            <div className="space-y-2">
              {carritoArticulos.map(item => (
                <div key={item._uid} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.nombre}</p>
                    <p className="text-xs text-slate-400">{fmt(item.precio)} c/u → {fmt(item.precio * (item.cantidad || 0))}</p>
                  </div>
                  <input type="number" min="0" value={item.cantidad}
                    onChange={e => updCantArt(item._uid, e.target.value)}
                    className="w-16 text-center text-sm font-bold border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400" />
                  <button onClick={() => delArt(item._uid)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Herramientas en carrito */}
        {carritoHerramientas.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Herramientas</p>
            <div className="space-y-2">
              {carritoHerramientas.map(item => (
                <div key={item._uid} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.nombre}</p>
                    <p className="text-xs text-slate-400">{fmt(item.precio_renta_diaria)}/día × {item.cantidad || 0} × {dias} días = {fmt((item.precio_renta_diaria || 0) * (item.cantidad || 0) * dias)}</p>
                  </div>
                  <input type="number" min="0" value={item.cantidad}
                    onChange={e => updCantHerr(item._uid, e.target.value)}
                    className="w-16 text-center text-sm font-bold border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400" />
                  <button onClick={() => delHerr(item._uid)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empleados en carrito */}
        {carritoEmpleados.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Empleados</p>
            <div className="space-y-2">
              {carritoEmpleados.map(item => (
                <div key={item._uid} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.nombre_completo}</p>
                    <p className="text-xs text-slate-400">{item.puesto || 'Sin puesto'}</p>
                  </div>
                  <button onClick={() => delEmp(item._uid)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {carritoArticulos.length === 0 && carritoHerramientas.length === 0 && carritoEmpleados.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Sin items agregados aún</p>
        )}
      </div>

      {/* ── Tiempo de trabajo ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-blue-500" /> Tiempo de Trabajo
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: 'Días',    value: dias,    set: setDias,    key: 'dia'    },
            { label: 'Semanas', value: semanas, set: setSemanas, key: 'semana' },
            { label: 'Meses',   value: meses,   set: setMeses,   key: 'mes'    },
          ].map(({ label, value, set, key }) => {
            const subtotal = Object.values(COSTOS_TIEMPO).reduce((s, c) => s + c[key] * value, 0);
            return (
              <div key={label} className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
                <input type="number" min="0" value={value}
                  onChange={e => set(+e.target.value || 0)}
                  className="w-20 text-center text-lg font-black border border-slate-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-blue-400 bg-white mx-auto block mb-2" />
                <p className="text-xs font-bold text-slate-600">{fmt(subtotal)}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 rounded-xl px-5 py-3 flex justify-between items-center">
          <span className="text-sm font-bold text-blue-700">Total por tiempo</span>
          <span className="text-lg font-black text-blue-700">{fmt(totalTiempo)}</span>
        </div>
      </div>

      {/* ── Resumen y guardar ── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-sm p-6 text-white">
        <div className="space-y-2 mb-5">
          {[
            { label: 'Artículos',    value: totalArticulos    },
            { label: 'Herramientas', value: totalHerramientas },
            { label: 'Tiempo',       value: totalTiempo       },
            { label: 'Empleados',    value: totalEmpleados    },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm text-blue-100">
              <span>{label}</span><span className="font-bold text-white">{fmt(value)}</span>
            </div>
          ))}
          <div className="border-t border-blue-500 pt-3 flex justify-between">
            <span className="text-base font-bold">Total cotización</span>
            <span className="text-2xl font-black">{fmt(total)}</span>
          </div>
        </div>

        <button onClick={guardar} disabled={saving}
          className="w-full py-3 bg-white text-blue-700 font-black rounded-xl hover:bg-blue-50 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
          {saving && <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" />}
          {saving ? 'Guardando…' : 'Guardar Cotización'}
        </button>
      </div>

      {/* ── Modal Artículos ── */}
      <Modal title="Seleccionar Artículo" open={modalArt} onClose={() => setModalArt(false)}>
        <div className="mb-3">
          <select value={catFiltro} onChange={e => setCatFiltro(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none">
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          {artFiltrados.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Sin artículos</p>}
          {artFiltrados.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{item.nombre}</p>
                <p className="text-xs text-slate-400">{item.marca} · {fmt(item.precio)}</p>
              </div>
              <button onClick={() => addArticulo(item)}
                className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0">
                <Plus size={14} />
              </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── Modal Herramientas ── */}
      <Modal title="Seleccionar Herramienta" open={modalHerr} onClose={() => setModalHerr(false)}>
        <div className="space-y-2">
          {herramientas.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Sin herramientas</p>}
          {herramientas.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-amber-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{item.nombre}</p>
                <p className="text-xs text-slate-400">{item.marca} · {fmt(item.precio_renta_diaria || 0)}/día</p>
              </div>
              <button onClick={() => addHerramienta(item)}
                className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex-shrink-0">
                <Plus size={14} />
              </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* ── Modal Empleados ── */}
      <Modal title="Seleccionar Empleado" open={modalEmp} onClose={() => setModalEmp(false)}>
        <div className="space-y-2">
          {empleados.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Sin empleados</p>}
          {empleados.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-green-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{item.nombre_completo}</p>
                <p className="text-xs text-slate-400">{item.puesto || 'Sin puesto'}</p>
              </div>
              <button onClick={() => addEmpleado(item)}
                className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-shrink-0">
                <Plus size={14} />
              </button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default CotizacionesComplexSection;
