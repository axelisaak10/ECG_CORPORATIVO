import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap, FileText, Megaphone, ListChecks, Star,
  ChevronRight, ChevronLeft, Lightbulb, AlertTriangle,
  Plus, Trash2, CheckCircle2, Eye, RotateCcw, Building2,
  User, DollarSign, Clock, Calendar, Tag, Link2, Image,
  PlayCircle, Sparkles, ArrowRight, Check, X, BarChart2,
  ClipboardList, Send, RefreshCw, BookOpen, Info,
  Wrench, Percent, Save, Download, Users, HelpCircle,
  Bell, Zap, Gift, AlertCircle, Lock, Shield
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Utilidades de Formato
   ───────────────────────────────────────────── */
const fmtPeso = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const Chip = ({ children, color = 'indigo' }) => {
  const map = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${map[color]}`}>
      {children}
    </span>
  );
};

const Tip = ({ children, title = "Consejo de Uso" }) => (
  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-xs text-amber-800">
    <Lightbulb size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
    <div>
      <strong className="block font-black mb-0.5">{title}</strong>
      <span className="leading-relaxed">{children}</span>
    </div>
  </div>
);

const Warning = ({ children, title = "Información Importante" }) => (
  <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 text-xs text-rose-800">
    <AlertTriangle size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
    <div>
      <strong className="block font-black mb-0.5">{title}</strong>
      <span className="leading-relaxed">{children}</span>
    </div>
  </div>
);

/* Barra de progreso de pasos */
const StepBar = ({ current, total, color }) => (
  <div className="flex items-center gap-1.5 mb-6">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
          i < current ? color : i === current ? `${color} opacity-60 animate-pulse` : 'bg-slate-100'
        }`}
      />
    ))}
    <span className="text-[11px] font-bold text-slate-400 ml-2 whitespace-nowrap">
      Paso {Math.min(current + 1, total)} de {total}
    </span>
  </div>
);

/* Botones de navegación */
const NavButtons = ({ step, total, onPrev, onNext, onReset, nextLabel, color, canNext }) => (
  <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
    <button
      onClick={onReset}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors font-bold"
    >
      <RotateCcw size={13} /> Reiniciar guía
    </button>
    <div className="flex gap-2">
      {step > 0 && (
        <button
          onClick={onPrev}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
        >
          <ChevronLeft size={14} /> Atrás
        </button>
      )}
      {step < total - 1 ? (
        <button
          onClick={onNext}
          disabled={!canNext}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${
            canNext
              ? `${color} hover:opacity-90 shadow-md`
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {nextLabel || 'Siguiente'} <ChevronRight size={14} />
        </button>
      ) : (
        <button
          onClick={onReset}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${color} hover:opacity-90 shadow-md`}
        >
          <RefreshCw size={14} /> Volver a practicar
        </button>
      )}
    </div>
  </div>
);

/* Campo de formulario helper */
const FL = ({ label, required, children, error, hint }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-baseline">
      <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {hint && <span className="text-[10px] text-slate-400 font-medium">{hint}</span>}
    </div>
    {children}
    {error && <p className="text-[10px] text-rose-500 font-bold">{error}</p>}
  </div>
);

const inputCls = "w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-100 focus:border-slate-400 outline-none transition-all bg-white font-medium text-slate-800 placeholder-slate-400";


/* ─────────────────────────────────────────────
   SIMULADOR 1: COTIZACIONES
   ───────────────────────────────────────────── */
const MOCK_CLIENTES = [
  { id: 'c1', nombre: 'Aceros Tepotzotlán S.A.', empresa: 'Grupo Metalúrgico' },
  { id: 'c2', nombre: 'Logística Express del Bajío', empresa: 'Fletes y Transportes' },
  { id: 'c3', nombre: 'Servicios Químicos del Norte', empresa: 'Planta de Residuos' },
];

const MOCK_CAT_ARTICULOS = [
  { id: 'a1', nombre: 'Abrazadera Omega Metálica 3/4"', precio: 18.50, categoria: 'Abrazaderas', codigo: 'ABR-34' },
  { id: 'a2', nombre: 'Cable Monopolar Calibre 10 AWG', precio: 45.00, categoria: 'Cables', codigo: 'CAB-10' },
  { id: 'a3', nombre: 'Caja Condulet Rectangular 3/4"', precio: 89.00, categoria: 'Cajas y Registros', codigo: 'BOX-34' },
  { id: 'a4', nombre: 'Tubo Galvanizado Pared Delgada 3/4"', precio: 120.00, categoria: 'Soportaría', codigo: 'TUB-34' },
];

const MOCK_CAT_HERRAMIENTAS = [
  { id: 'h1', nombre: 'Andamio Tubular Metálico', precio_renta_diaria: 150.00, unidad: 'pza' },
  { id: 'h2', nombre: 'Planta de Luz Gasolina 5500W', precio_renta_diaria: 650.00, unidad: 'pza' },
  { id: 'h3', nombre: 'Rotomartillo Industrial SDS', precio_renta_diaria: 300.00, unidad: 'pza' },
  { id: 'h4', nombre: 'Soldadora Inverter 200A', precio_renta_diaria: 450.00, unidad: 'pza' },
];

const MOCK_PERSONAL = [
  { id: 'u1', nombre: 'Carlos Mendoza', puesto: 'Ingeniero Electricista' },
  { id: 'u2', nombre: 'Felipe Torres', puesto: 'Técnico de Campo' },
  { id: 'u3', nombre: 'Ana Gómez', puesto: 'Supervisora HSE' },
];

const COSTOS_OPERATIVOS = [
  { key: 'oficina', nombre: 'Renta Oficina Proporcional', hr: 14.58, dia: 116.67, semana: 875.00, mes: 3500.00 },
  { key: 'bodega', nombre: 'Renta Bodega y Resguardo', hr: 25.00, dia: 600.00, semana: 4500.00, mes: 18000.00 },
  { key: 'luz_agua', nombre: 'Luz y Agua Operaciones', hr: 5.42, dia: 130.00, semana: 975.00, mes: 3900.00 },
];

const TutorialCotizaciones = () => {
  const TOTAL = 5;
  const [step, setStep] = useState(0);

  // Form states
  const [clienteId, setClienteId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [articulos, setArticulos] = useState([]);
  const [herramientas, setHerramientas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [horas, setHoras] = useState(0);
  const [dias, setDias] = useState(0);
  const [semanas, setSemanas] = useState(0);
  const [meses, setMeses] = useState(0);
  const [globalMargen, setGlobalMargen] = useState(15);
  const [iva, setIva] = useState(true);

  // Catalog Add states
  const [selArt, setSelArt] = useState('');
  const [qtyArt, setQtyArt] = useState(1);
  const [selHer, setSelHer] = useState('');
  const [qtyHer, setQtyHer] = useState(1);
  const [selEmp, setSelEmp] = useState('');

  // Notifications
  const [savedAction, setSavedAction] = useState(null); // 'draft' or 'official'

  // Calculations
  const totalDays = (horas / 8) + dias + (semanas * 5) + (meses * 20);

  const totalArticulos = articulos.reduce((s, a) => s + (a.precio * a.cantidad * (1 + a.margen / 100)), 0);
  const totalHerramientas = herramientas.reduce((s, h) => s + (h.precio_renta_diaria * h.cantidad * Math.max(1, totalDays) * (1 + h.margen / 100)), 0);
  
  const totalGastosFijos = COSTOS_OPERATIVOS.reduce((s, c) => {
    return s + (horas * c.hr) + (dias * c.dia) + (semanas * c.semana) + (meses * c.mes);
  }, 0);

  const subtotalGeneral = totalArticulos + totalHerramientas + totalGastosFijos;
  const totalConMargenGlobal = subtotalGeneral * (1 + globalMargen / 100);
  const totalGeneral = totalConMargenGlobal * (iva ? 1.16 : 1);

  // Actions
  const addArticulo = () => {
    const original = MOCK_CAT_ARTICULOS.find(a => a.id === selArt);
    if (!original) return;
    const exists = articulos.find(a => a.id === selArt);
    if (exists) {
      setArticulos(p => p.map(a => a.id === selArt ? { ...a, cantidad: a.cantidad + qtyArt } : a));
    } else {
      setArticulos(p => [...p, { ...original, cantidad: qtyArt, margen: 0 }]);
    }
    setSelArt('');
    setQtyArt(1);
  };

  const removeArticulo = (id) => setArticulos(p => p.filter(a => a.id !== id));
  
  const toggleMarginArt = (id, val) => {
    setArticulos(p => p.map(a => a.id === id ? { ...a, margen: a.margen === val ? 0 : val } : a));
  };

  const addHerramienta = () => {
    const original = MOCK_CAT_HERRAMIENTAS.find(h => h.id === selHer);
    if (!original) return;
    const exists = herramientas.find(h => h.id === selHer);
    if (exists) {
      setHerramientas(p => p.map(h => h.id === selHer ? { ...h, cantidad: h.cantidad + qtyHer } : h));
    } else {
      setHerramientas(p => [...p, { ...original, cantidad: qtyHer, margen: 0 }]);
    }
    setSelHer('');
    setQtyHer(1);
  };

  const removeHerramienta = (id) => setHerramientas(p => p.filter(h => h.id !== id));

  const toggleMarginHer = (id, val) => {
    setHerramientas(p => p.map(h => h.id === id ? { ...h, margen: h.margen === val ? 0 : val } : h));
  };

  const addEmpleado = () => {
    const emp = MOCK_PERSONAL.find(u => u.id === selEmp);
    if (!emp || empleados.find(e => e.id === emp.id)) return;
    setEmpleados(p => [...p, emp]);
    setSelEmp('');
  };

  const removeEmpleado = (id) => setEmpleados(p => p.filter(e => e.id !== id));

  const reset = () => {
    setStep(0);
    setClienteId('');
    setDescripcion('');
    setArticulos([]);
    setHerramientas([]);
    setEmpleados([]);
    setHoras(0);
    setDias(0);
    setSemanas(0);
    setMeses(0);
    setGlobalMargen(15);
    setIva(true);
    setSavedAction(null);
  };

  const canNext = [
    true, // Intro
    clienteId && descripcion.trim().length >= 10, // Info básica
    articulos.length > 0 || herramientas.length > 0, // Materiales/Renta
    totalDays > 0, // Tiempos
    true, // Resumen
  ][step];

  if (step === 5) {
    const folioStr = "COT-" + Math.floor(1000 + Math.random() * 9000);
    const clienteName = MOCK_CLIENTES.find(c => c.id === clienteId)?.nombre || 'Cliente Demo';

    return (
      <div className="flex flex-col items-center py-10 gap-5 animate-fade-in text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center shadow-inner">
          <CheckCircle2 size={44} className="text-emerald-500" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800">
            {savedAction === 'draft' ? '¡Borrador Guardado con Éxito!' : '¡Cotización Autorizada y Emitida!'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {savedAction === 'draft' 
              ? 'Los borradores se almacenan temporalmente en tu navegador. Puedes retomarlos en cualquier momento.' 
              : 'Se ha generado la clave de cotización y programado el envío automático del PDF al cliente.'}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 w-full max-w-md text-left text-xs space-y-3.5 shadow-sm">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Folio del sistema</span>
            <span className="font-mono font-black text-slate-700 text-sm">{folioStr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Cliente</span>
            <span className="font-bold text-slate-800">{clienteName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Personal Asignado</span>
            <span className="font-bold text-slate-800">
              {empleados.length > 0 ? `${empleados.length} colaboradores` : 'Ninguno'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Duración Estimada</span>
            <span className="font-bold text-slate-800">{totalDays} días operativos</span>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-100 space-y-2.5">
            <div className="flex justify-between text-slate-500">
              <span>Materiales y Artículos:</span>
              <span>{fmtPeso(totalArticulos)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Renta de Herramientas:</span>
              <span>{fmtPeso(totalHerramientas)}</span>
            </div>
            <div className="flex justify-between text-slate-500 border-b border-slate-100 pb-2">
              <span>Costos Fijos Operativos:</span>
              <span>{fmtPeso(totalGastosFijos)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-800 pt-1">
              <span>Total General ({iva ? 'Con IVA' : 'Sin IVA'}):</span>
              <span className="text-emerald-600">{fmtPeso(totalGeneral)}</span>
            </div>
          </div>
          {savedAction === 'official' && empleados.length > 0 && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 text-[11px] text-blue-800 rounded-xl p-3">
              <ClipboardList size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong>Acción Automática:</strong> Se han asignado tareas automáticamente a: {empleados.map(e => e.nombre).join(', ')}.
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {savedAction === 'official' && (
            <button 
              onClick={() => alert('Simulación: Descargando PDF generado con los datos de: ' + clienteName)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 text-white text-xs font-black hover:bg-slate-900 transition-all shadow-md shadow-slate-200"
            >
              <Download size={14} /> Descargar PDF Cotización
            </button>
          )}
          <button 
            onClick={reset} 
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100"
          >
            <RotateCcw size={14} /> Practicar otro presupuesto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepBar current={step} total={TOTAL} color="bg-emerald-500" />

      {/* PASO 0: INTRODUCCIÓN */}
      {step === 0 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6">
            <h3 className="font-black text-emerald-800 text-sm mb-2 flex items-center gap-2">
              <BookOpen size={16} /> Estructura de un Presupuesto Corporativo
            </h3>
            <p className="text-emerald-700 text-xs leading-relaxed">
              El módulo de cotizaciones es una calculadora de costos multifactorial. No solo suma materiales, sino que incorpora la renta temporal de maquinaria, los costos fijos proporcionales que gasta la oficina corporativa por operar el proyecto y los márgenes de utilidad para emitir un costo real competitivo.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-slate-100 rounded-2xl p-4.5 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-lg">📦</span>
                <h4 className="text-xs font-black text-slate-800 mt-1">1. Artículos y Materiales</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Artículos del catálogo cargados físicamente en inventario a los que les aplicas márgenes individuales.</p>
              </div>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-2 w-max">Ej. Cables, Tableros</span>
            </div>
            <div className="border border-slate-100 rounded-2xl p-4.5 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-lg">⚙️</span>
                <h4 className="text-xs font-black text-slate-800 mt-1">2. Renta de Herramientas</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Herramientas cotizadas por día de uso. Su renta total depende de la duración del proyecto.</p>
              </div>
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-2 w-max">Ej. Andamios, Planta luz</span>
            </div>
            <div className="border border-slate-100 rounded-2xl p-4.5 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-lg">⏱️</span>
                <h4 className="text-xs font-black text-slate-800 mt-1">3. Gastos Fijos (Tiempo)</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Cálculo proporcional de luz, bodega y administrativos de ECG consumidos durante el proyecto.</p>
              </div>
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-2 w-max">Ej. Renta proporcional</span>
            </div>
          </div>

          <div className="border border-dashed border-slate-200 rounded-3xl p-6 text-center">
            <p className="text-xs text-slate-500 mb-4 font-medium">Comencemos el simulador interactivo para construir un presupuesto real paso a paso:</p>
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
            >
              Iniciar Simulador <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* PASO 1: INFORMACIÓN BÁSICA */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <Info size={14} className="text-emerald-500" /> 1. Información General del Cliente
            </h3>

            <FL label="Cliente destinatario" required hint="Cargados del catálogo de clientes">
              <select 
                value={clienteId}
                onChange={e => setClienteId(e.target.value)}
                className={inputCls}
              >
                <option value="">-- Selecciona un cliente del catálogo --</option>
                {MOCK_CLIENTES.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} ({c.empresa})</option>
                ))}
              </select>
            </FL>

            <FL label="Descripción del proyecto" required hint="Ejemplo de alcance técnico">
              <textarea 
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Ej. Suministro e instalación eléctrica de tableros trifásicos para la nueva nave industrial de ensamble."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </FL>
          </div>

          <Tip title="Explicación Técnica">
            El <strong>Cliente</strong> define a quién se le facturará y vincula el PDF. La <strong>Descripción</strong> debe ser detallada, ya que aparecerá impresa en la carátula oficial del reporte de cotización final.
          </Tip>

          {!canNext && clienteId && (
            <Warning title="Campo Incompleto">La descripción debe detallar el trabajo (mínimo 10 caracteres) para avanzar.</Warning>
          )}
        </div>
      )}

      {/* PASO 2: MATERIALES Y EQUIPO */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-5">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <Package size={14} className="text-emerald-500" /> 2. Cargar Artículos y Renta de Equipos
            </h3>

            {/* ARTICULOS */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Cargar Materiales e Insumos</h4>
              <div className="flex gap-2">
                <select
                  value={selArt}
                  onChange={e => setSelArt(e.target.value)}
                  className={`${inputCls} flex-1`}
                >
                  <option value="">-- Seleccionar material del inventario --</option>
                  {MOCK_CAT_ARTICULOS.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre} ({fmtPeso(a.precio)})</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  min="1" 
                  value={qtyArt} 
                  onChange={e => setQtyArt(parseInt(e.target.value) || 1)}
                  className="w-16 text-center text-xs border border-slate-200 rounded-xl outline-none"
                />
                <button 
                  onClick={addArticulo}
                  disabled={!selArt}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-40"
                >
                  + Agregar
                </button>
              </div>

              {/* Lista Materiales */}
              {articulos.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {articulos.map(a => (
                    <div key={a.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 text-xs shadow-sm">
                      <div>
                        <div className="font-bold text-slate-800">{a.nombre}</div>
                        <div className="text-[10px] text-slate-400">
                          {a.cantidad} pza x {fmtPeso(a.precio)} | Código: {a.codigo}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Margen individual */}
                        <div className="flex items-center gap-1 border border-slate-100 rounded-lg p-0.5 bg-slate-50">
                          <span className="text-[9px] text-slate-400 font-bold px-1.5">Margen:</span>
                          {[5, 10, 15].map(pct => (
                            <button
                              key={pct}
                              onClick={() => toggleMarginArt(a.id, pct)}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-black transition-all ${
                                a.margen === pct ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              +{pct}%
                            </button>
                          ))}
                        </div>
                        <span className="font-black text-emerald-600 text-right w-20">
                          {fmtPeso(a.precio * a.cantidad * (1 + a.margen / 100))}
                        </span>
                        <button onClick={() => removeArticulo(a.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-xs font-black text-slate-500 pr-2">
                    Subtotal Materiales: {fmtPeso(totalArticulos)}
                  </div>
                </div>
              )}
            </div>

            {/* HERRAMIENTAS */}
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Renta de Herramientas y Maquinaria</h4>
              <div className="flex gap-2">
                <select
                  value={selHer}
                  onChange={e => setSelHer(e.target.value)}
                  className={`${inputCls} flex-1`}
                >
                  <option value="">-- Seleccionar herramienta en renta --</option>
                  {MOCK_CAT_HERRAMIENTAS.map(h => (
                    <option key={h.id} value={h.id}>{h.nombre} ({fmtPeso(h.precio_renta_diaria)}/día)</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  min="1" 
                  value={qtyHer} 
                  onChange={e => setQtyHer(parseInt(e.target.value) || 1)}
                  className="w-16 text-center text-xs border border-slate-200 rounded-xl outline-none"
                />
                <button 
                  onClick={addHerramienta}
                  disabled={!selHer}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-40"
                >
                  + Agregar
                </button>
              </div>

              {/* Lista Herramientas */}
              {herramientas.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {herramientas.map(h => (
                    <div key={h.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 text-xs shadow-sm">
                      <div>
                        <div className="font-bold text-slate-800">{h.nombre}</div>
                        <div className="text-[10px] text-slate-400">
                          {h.cantidad} unidades | Renta: {fmtPeso(h.precio_renta_diaria)}/día
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 border border-slate-100 rounded-lg p-0.5 bg-slate-50">
                          <span className="text-[9px] text-slate-400 font-bold px-1.5">Margen:</span>
                          {[5, 10, 15].map(pct => (
                            <button
                              key={pct}
                              onClick={() => toggleMarginHer(h.id, pct)}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-black transition-all ${
                                h.margen === pct ? 'bg-amber-500 text-white' : 'text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              +{pct}%
                            </button>
                          ))}
                        </div>
                        <span className="font-black text-amber-600 text-right w-20">
                          {fmtPeso(h.precio_renta_diaria * h.cantidad * Math.max(1, totalDays) * (1 + h.margen / 100))}
                        </span>
                        <button onClick={() => removeHerramienta(h.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-xs font-black text-slate-500 pr-2">
                    Subtotal Herramientas: {fmtPeso(totalHerramientas)} {totalDays > 0 ? `(Calculado para ${totalDays} días)` : '(Ingresa tiempos en el paso siguiente)'}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Tip title="Explicación de Márgenes Individuales">
            Cada partida de materiales o herramientas permite sumarle un <strong>margen de desvío individual</strong> (+5%, +10% o +15%). Esto protege el costo ante fletes especiales, inflación o mermas físicas de instalación.
          </Tip>

          {!canNext && (
            <Warning title="Agregar Conceptos">Debes agregar al menos un material o herramienta en renta para continuar.</Warning>
          )}
        </div>
      )}

      {/* PASO 3: TIEMPOS Y COSTOS FIJOS */}
      {step === 3 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <Clock size={14} className="text-emerald-500" /> 3. Tiempos, Costos Fijos y Personal
            </h3>

            {/* Duración */}
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Duración estimada del Proyecto</label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Horas</label>
                  <input type="number" min="0" value={horas} onChange={e => setHoras(parseFloat(e.target.value) || 0)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Días</label>
                  <input type="number" min="0" value={dias} onChange={e => setDias(parseFloat(e.target.value) || 0)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Semanas</label>
                  <input type="number" min="0" value={semanas} onChange={e => setSemanas(parseFloat(e.target.value) || 0)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Meses</label>
                  <input type="number" min="0" value={meses} onChange={e => setMeses(parseFloat(e.target.value) || 0)} className={inputCls} />
                </div>
              </div>
              <div className="text-[11px] text-emerald-600 font-bold mt-2">
                Días de renta totales calculados: {totalDays} día(s)
              </div>
            </div>

            {/* Costos fijos resultantes */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-baseline mb-1 border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Gastos Fijos ECG Proporcionales</span>
                <span className="text-[10px] text-slate-400 font-bold">Autocalculados</span>
              </div>
              {COSTOS_OPERATIVOS.map(c => {
                const sub = (horas * c.hr) + (dias * c.dia) + (semanas * c.semana) + (meses * c.mes);
                return (
                  <div key={c.key} className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>{c.nombre}</span>
                    <span>{fmtPeso(sub)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between text-xs font-black text-slate-700 pt-2 border-t border-slate-100">
                <span>Total Gastos de Operación</span>
                <span>{fmtPeso(totalGastosFijos)}</span>
              </div>
            </div>

            {/* Personal asignado */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <FL label="Asignar colaboradores" hint="Generará tareas en su tablero">
                <div className="flex gap-2">
                  <select
                    value={selEmp}
                    onChange={e => setSelEmp(e.target.value)}
                    className={`${inputCls} flex-1`}
                  >
                    <option value="">-- Seleccionar personal operativo --</option>
                    {MOCK_PERSONAL.filter(p => !empleados.find(e => e.id === p.id)).map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} ({p.puesto})</option>
                    ))}
                  </select>
                  <button 
                    onClick={addEmpleado}
                    disabled={!selEmp}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-40"
                  >
                    Asignar
                  </button>
                </div>
              </FL>

              {empleados.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {empleados.map(e => (
                    <span key={e.id} className="flex items-center gap-1.5 bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-200">
                      <User size={12} className="text-blue-500" />
                      {e.nombre}
                      <button onClick={() => removeEmpleado(e.id)} className="text-blue-400 hover:text-red-500 ml-1">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Tip title="Explicación Financiera">
            <strong>Gastos Proporcionales:</strong> Todo proyecto gasta recursos de la empresa (electricidad, bodega, salarios administrativos). Ingresar la duración permite cargar de forma automática la fracción exacta de estos gastos para proteger la rentabilidad general de la empresa.
          </Tip>

          {!canNext && (
            <Warning title="Duración Requerida">Ingresa al menos 1 día u 8 horas de duración para calcular la renta de equipos y los gastos fijos.</Warning>
          )}
        </div>
      )}

      {/* PASO 4: RESUMEN DE TOTALES */}
      {step === 4 && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Formulario/Resumen Izquierda */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-3">
                  <Percent size={14} className="text-emerald-500" /> 4. Margen Global y Configuración Fiscal
                </h3>

                <FL label="Margen de utilidad global" hint="Afecta a la cotización final">
                  <div className="flex gap-2">
                    {[10, 15, 20, 25, 30].map(pct => (
                      <button
                        key={pct}
                        onClick={() => setGlobalMargen(pct)}
                        className={`flex-1 text-xs font-bold py-2 rounded-xl border transition-all ${
                          globalMargen === pct 
                            ? 'bg-emerald-500 text-white border-transparent shadow-sm' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        +{pct}%
                      </button>
                    ))}
                  </div>
                </FL>

                <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div>
                    <span className="text-xs font-black text-slate-700 block">Agregar Impuestos (IVA 16%)</span>
                    <span className="text-[10px] text-slate-400">Actívalo para cotizaciones oficiales de ECG</span>
                  </div>
                  <button
                    onClick={() => setIva(!iva)}
                    className={`w-12 h-6 rounded-full transition-all relative ${iva ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${iva ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <Warning title="Última Verificación">
                Al hacer clic en <strong>Generar Cotización</strong>, se guardará en el catálogo general, se generará el PDF descargable e iniciará la asignación automática de tareas para los ingenieros asignados.
              </Warning>
            </div>

            {/* Sidebar de desglose */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest border-b border-white/10 pb-3">
                  Desglose de Costos
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-white/70">
                    <span>Subtotal Artículos</span>
                    <span>{fmtPeso(totalArticulos)}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Subtotal Renta</span>
                    <span>{fmtPeso(totalHerramientas)}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Subtotal Fijos</span>
                    <span>{fmtPeso(totalGastosFijos)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white border-t border-white/15 pt-2.5">
                    <span>Costo Directo</span>
                    <span>{fmtPeso(subtotalGeneral)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Utilidad (+{globalMargen}%)</span>
                    <span>{fmtPeso(subtotalGeneral * (globalMargen / 100))}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Subtotal</span>
                    <span>{fmtPeso(totalConMargenGlobal)}</span>
                  </div>
                  {iva && (
                    <div className="flex justify-between text-white/60 text-[11px]">
                      <span>IVA (16%)</span>
                      <span>{fmtPeso(totalConMargenGlobal * 0.16)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10 mt-6">
                <div>
                  <span className="text-[10px] text-white/50 block font-bold uppercase tracking-wider">Total Final</span>
                  <span className="text-2xl font-black text-emerald-400">{fmtPeso(totalGeneral)}</span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setSavedAction('draft'); setStep(5); }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all border border-white/10"
                  >
                    <Save size={13} /> Borrador
                  </button>
                  <button 
                    onClick={() => { setSavedAction('official'); setStep(5); }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-900/30"
                  >
                    <CheckCircle2 size={13} /> Generar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <NavButtons
        step={step} total={TOTAL}
        onPrev={() => setStep(s => s - 1)}
        onNext={() => setStep(s => s + 1)}
        onReset={reset}
        color="bg-emerald-500"
        canNext={canNext}
        nextLabel={step === 3 ? 'Desglose y Guardar' : 'Siguiente'}
      />
    </div>
  );
};


/* ─────────────────────────────────────────────
   SIMULADOR 2: ANUNCIOS Y POP-UPS
   ───────────────────────────────────────────── */
const TutorialAnuncios = () => {
  const TOTAL = 4;
  const [step, setStep] = useState(0);

  // States
  const [tipo, setTipo] = useState('aviso');
  const [destino, setDestino] = useState('portal');
  const [soloImagen, setSoloImagen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [activo, setActivo] = useState(true);
  const [icono, setIcono] = useState('Bell');
  const [badge, setBadge] = useState('');
  const [titulo, setTitulo] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [ctaTexto, setCtaTexto] = useState('');
  const [ctaLink, setCtaLink] = useState('');

  const [saved, setSaved] = useState(false);

  const reset = () => {
    setStep(0);
    setTipo('aviso');
    setDestino('portal');
    setSoloImagen(false);
    setImageUrl('');
    setFechaFin('');
    setActivo(true);
    setIcono('Bell');
    setBadge('');
    setTitulo('');
    setSubtitulo('');
    setCuerpo('');
    setCtaTexto('');
    setCtaLink('');
    setSaved(false);
  };

  const canNext = [
    true, // Intro
    true, // Tipo/Destino
    soloImagen 
      ? imageUrl.trim().length > 5 
      : titulo.trim().length >= 3 && cuerpo.trim().length >= 10, // Contenido
    fechaFin !== '', // Vigencia
  ][step];

  const handleSave = () => {
    setSaved(true);
    setStep(4);
  };

  const colorMap = {
    aviso: { border: 'border-blue-500', bg: 'from-blue-600 to-blue-700', text: 'text-blue-600', pill: 'blue' },
    oferta: { border: 'border-rose-500', bg: 'from-rose-600 to-rose-700', text: 'text-rose-600', pill: 'rose' },
    novedad: { border: 'border-violet-500', bg: 'from-violet-600 to-violet-700', text: 'text-violet-600', pill: 'violet' },
    evento: { border: 'border-amber-500', bg: 'from-amber-600 to-amber-700', text: 'text-amber-600', pill: 'amber' },
    promocion: { border: 'border-emerald-500', bg: 'from-emerald-600 to-emerald-700', text: 'text-emerald-600', pill: 'emerald' },
  };

  const IconMap = { Bell, Tag, Zap, Gift, Sparkles };
  const SelectedIcon = IconMap[icono] || Bell;

  if (step === 4 && saved) {
    return (
      <div className="flex flex-col items-center py-10 gap-5 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center shadow-inner">
          <CheckCircle2 size={44} className="text-indigo-500" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800">¡Anuncio Creado y Programado!</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            El pop-up se desplegará a los usuarios correspondientes en cuanto ingresen al portal.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 w-full max-w-md text-left text-xs space-y-3.5 shadow-sm">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Modo de Anuncio</span>
            <Chip color={soloImagen ? 'indigo' : colorMap[tipo].pill}>
              {soloImagen ? 'Solo Imagen (Flyer)' : `Estándar · ${tipo}`}
            </Chip>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Destino del Popup</span>
            <span className="font-bold text-slate-800">
              {destino === 'portal' ? 'Portal Principal (Todos)' : `Empresa Especializada`}
            </span>
          </div>
          {!soloImagen && titulo && (
            <div className="flex justify-between">
              <span className="text-slate-400">Título</span>
              <span className="font-bold text-slate-800 truncate max-w-xs">{titulo}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Expira el</span>
            <span className="font-bold text-slate-800">{fechaFin} (Desactivación automática)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Estado</span>
            <span className={`font-black ${activo ? 'text-emerald-600' : 'text-slate-400'}`}>
              {activo ? 'Activo e Visible' : 'Guardado inactivo'}
            </span>
          </div>
        </div>

        <button 
          onClick={reset}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-500 text-white text-xs font-black hover:bg-indigo-600 transition-all shadow-md shadow-indigo-100"
        >
          <RotateCcw size={14} /> Crear otro aviso / pop-up
        </button>
      </div>
    );
  }

  return (
    <div>
      <StepBar current={step} total={TOTAL} color="bg-indigo-500" />

      {/* PASO 0: INTRODUCCIÓN */}
      {step === 0 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6">
            <h3 className="font-black text-indigo-800 text-sm mb-2 flex items-center gap-2">
              <BookOpen size={16} /> Comunicación Directa con Pop-ups
            </h3>
            <p className="text-indigo-700 text-xs leading-relaxed">
              Los anuncios o pop-ups son ventanas de alerta emergentes de alta visibilidad. Aparecen en cuanto el personal de ECG o los clientes inician sesión. Permiten notificar cambios de políticas, emergencias, campañas, o eventos corporativos sin saturar el correo electrónico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all">
              <div>
                <span className="text-2xl">📢</span>
                <h4 className="text-sm font-black text-slate-800 mt-2">Formato Estándar (Recomendado)</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Contiene ícono seleccionable, título de color, texto explicativo, enlace opcional y un banner de imagen. Excelente para avisos de operaciones o normativas internas.
                </p>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mt-4 w-max">Cambio de horario, políticas</span>
            </div>

            <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all">
              <div>
                <span className="text-2xl">🖼️</span>
                <h4 className="text-sm font-black text-slate-800 mt-2">Formato Solo Imagen (Flyer)</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Despliega únicamente una imagen/flyer a pantalla completa con un contador animado al final. Excelente para publicidad directa, felicitaciones o avisos gráficos listos.
                </p>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mt-4 w-max">Felicitaciones, banners de eventos</span>
            </div>
          </div>

          <div className="text-center pt-3">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-500 text-white text-xs font-black hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100"
            >
              Crear Nuevo Anuncio <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* PASO 1: TIPO Y DESTINO */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <Tag size={14} className="text-indigo-500" /> 1. Segmentación y Estilo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FL label="Tipo de Anuncio (Estilo Visual)" required>
                <select 
                  value={tipo} 
                  onChange={e => setTipo(e.target.value)}
                  className={inputCls}
                >
                  <option value="aviso">📢 Aviso (Azul)</option>
                  <option value="novedad">✨ Novedad (Violeta)</option>
                  <option value="oferta">🔥 Oferta (Rosa)</option>
                  <option value="evento">📅 Evento (Naranja)</option>
                  <option value="promocion">🎁 Promoción (Verde)</option>
                </select>
              </FL>

              <FL label="Destinatarios / Canal" required>
                <select 
                  value={destino} 
                  onChange={e => setDestino(e.target.value)}
                  className={inputCls}
                >
                  <option value="portal">Portal Principal (Todos los colaboradores)</option>
                  <option value="empresa_1">Sólo usuarios de ECG Ambiental</option>
                  <option value="empresa_2">Sólo usuarios de ECG Ingeniería</option>
                  <option value="empresa_3">Sólo usuarios de ECG Capacitación</option>
                </select>
              </FL>
            </div>

            <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl px-4 py-3.5 shadow-sm mt-2">
              <div>
                <span className="text-xs font-black text-slate-700 block">Modo Solo Imagen</span>
                <span className="text-[10px] text-slate-400">Ignora los textos y muestra sólo un banner completo</span>
              </div>
              <button
                onClick={() => setSoloImagen(!soloImagen)}
                className={`w-12 h-6 rounded-full transition-all relative ${soloImagen ? 'bg-indigo-500' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${soloImagen ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          <Tip title="Explicación Técnica">
            El <strong>Tipo de Anuncio</strong> altera los colores del pop-up en el portal del usuario para jerarquizar la información. La segmentación evita enviar notificaciones de una empresa a colaboradores que pertenecen a otra división de ECG.
          </Tip>
        </div>
      )}

      {/* PASO 2: CONTENIDO CONDICIONAL */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <FileText size={14} className="text-indigo-500" /> 2. Formular Mensaje del Anuncio
            </h3>

            {soloImagen ? (
              // SOLO IMAGEN
              <div className="space-y-4">
                <FL label="URL de la imagen del Flyer *" required hint="Debe ser una dirección web válida">
                  <input 
                    type="url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="Ej. https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=800"
                    className={inputCls}
                  />
                </FL>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FL label="Badge Superior (Pill)" hint="Máximo 20 caracteres">
                    <input 
                      value={badge}
                      onChange={e => setBadge(e.target.value)}
                      placeholder="Ej. ¡URGENTE!"
                      className={inputCls}
                    />
                  </FL>
                  <FL label="Redirección al hacer clic (URL)" hint="Opcional">
                    <input 
                      type="url"
                      value={ctaLink}
                      onChange={e => setCtaLink(e.target.value)}
                      placeholder="Ej. https://wa.me/52..."
                      className={inputCls}
                    />
                  </FL>
                </div>
              </div>
            ) : (
              // MODO ESTÁNDAR
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FL label="Ícono Ilustrativo" required>
                    <div className="flex gap-1.5 justify-start bg-white p-1 rounded-xl border border-slate-200">
                      {['Bell', 'Tag', 'Zap', 'Gift', 'Sparkles'].map(icoName => {
                        const Ico = IconMap[icoName];
                        return (
                          <button
                            key={icoName}
                            onClick={() => setIcono(icoName)}
                            className={`flex-1 flex justify-center py-2 rounded-lg transition-all ${
                              icono === icoName 
                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' 
                                : 'text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            <Ico size={15} />
                          </button>
                        );
                      })}
                    </div>
                  </FL>
                  <FL label="Badge Superior (Pill)" hint="Máximo 20 caracteres">
                    <input 
                      value={badge}
                      onChange={e => setBadge(e.target.value)}
                      placeholder="Ej. NUEVO"
                      className={inputCls}
                    />
                  </FL>
                  <FL label="Título del Pop-up *" required>
                    <input 
                      value={titulo}
                      onChange={e => setTitulo(e.target.value)}
                      placeholder="Ej. Cierre de Bitácoras de Campo"
                      className={inputCls}
                    />
                  </FL>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FL label="Subtítulo Informativo">
                    <input 
                      value={subtitulo}
                      onChange={e => setSubtitulo(e.target.value)}
                      placeholder="Ej. Fecha límite de entrega de reportes"
                      className={inputCls}
                    />
                  </FL>
                  <FL label="URL de Imagen de Fondo (Banda)" hint="Opcional">
                    <input 
                      type="url"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="Ej. https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800"
                      className={inputCls}
                    />
                  </FL>
                </div>

                <FL label="Cuerpo del Aviso (Mensaje) *" required hint="Mínimo 10 caracteres">
                  <textarea 
                    value={cuerpo}
                    onChange={e => setCuerpo(e.target.value)}
                    placeholder="Ej. Se solicita a todos los ingenieros subir sus bitácoras de servicio de la semana a más tardar el viernes a las 18:00 hrs para proceder con facturación."
                    rows={3}
                    className={`${inputCls} resize-none`}
                  />
                </FL>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FL label="Texto de Botón de Acción (CTA)" hint="Opcional">
                    <input 
                      value={ctaTexto}
                      onChange={e => setCtaTexto(e.target.value)}
                      placeholder="Ej. Subir Reporte"
                      className={inputCls}
                    />
                  </FL>
                  <FL label="Enlace del Botón (URL)" hint="Opcional">
                    <input 
                      type="url"
                      value={ctaLink}
                      onChange={e => setCtaLink(e.target.value)}
                      placeholder="Ej. https://mi-portal.com/cargar-reporte"
                      className={inputCls}
                    />
                  </FL>
                </div>
              </div>
            )}
          </div>

          <Tip title="Ejemplos de URL de Imágenes">
            Puedes utilizar cualquier enlace de imagen público de internet. Si no tienes uno a la mano, copia este ejemplo: <br/>
            <code className="bg-slate-800 text-white font-mono px-1.5 py-0.5 rounded text-[10px] select-all">
              https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=800
            </code>
          </Tip>

          {!canNext && (
            <Warning title="Requisitos de Contenido">
              {soloImagen 
                ? 'Debes ingresar una URL de imagen para el flyer.' 
                : 'Debes completar el título (mín. 3 caracteres) y el cuerpo (mín. 10 caracteres) para continuar.'}
            </Warning>
          )}
        </div>
      )}

      {/* PASO 3: VIGENCIA Y PUBLICACIÓN */}
      {step === 3 && (
        <div className="space-y-5 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Formulario Vigencia */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-3">
                <Calendar size={14} className="text-indigo-500" /> 3. Vigencia del Anuncio
              </h3>

              <FL label="Fecha de Vencimiento" required hint="Requerido para cuenta atrás">
                <input 
                  type="date"
                  value={fechaFin}
                  onChange={e => setFechaFin(e.target.value)}
                  className={inputCls}
                />
              </FL>

              <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                <div>
                  <span className="text-xs font-black text-slate-700 block">Publicar inmediatamente</span>
                  <span className="text-[10px] text-slate-400">Si se apaga, se guardará como borrador oculto</span>
                </div>
                <button
                  onClick={() => setActivo(!activo)}
                  className={`w-12 h-6 rounded-full transition-all relative ${activo ? 'bg-indigo-500' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${activo ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>

              <Warning title="Desactivación por Vencimiento">
                Una vez llegada la fecha de vencimiento seleccionada, el pop-up se desactivará automáticamente a las 23:59:59 hrs del servidor, evitando avisos obsoletos en el sistema.
              </Warning>

              <button 
                onClick={handleSave}
                disabled={!fechaFin}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-500 text-white font-black text-xs hover:bg-indigo-600 transition-all shadow-md disabled:opacity-40"
              >
                <Save size={14} /> Guardar y Activar Pop-up
              </button>
            </div>

            {/* Vista Previa Pop-up */}
            <div className="border-2 border-dashed border-indigo-200 rounded-3xl p-5 bg-indigo-50/20 flex flex-col justify-center items-center">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">Previsualización del Pop-up Real</span>
              
              {soloImagen ? (
                // PREVIEW FLYER
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden w-full max-w-[280px]">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Flyer" className="w-full h-80 object-cover" />
                  ) : (
                    <div className="h-64 bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                      <Image size={32} />
                      <span className="text-[10px] font-bold mt-2">Sin imagen cargada</span>
                    </div>
                  )}
                  {badge && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2">
                      <span className="bg-yellow-400 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full shadow border border-yellow-300">
                        {badge}
                      </span>
                    </div>
                  )}
                  <div className="bg-slate-950 text-white text-[11px] font-black py-2.5 text-center flex items-center justify-center gap-1.5 border-t border-white/5">
                    <Clock size={12} className="text-indigo-400 animate-pulse" />
                    <span>Quedan 3 días, 4 horas y 12 mins</span>
                  </div>
                </div>
              ) : (
                // PREVIEW ESTÁNDAR
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden w-full max-w-[290px] relative">
                  {/* Gradiente cabecera */}
                  <div className={`bg-gradient-to-r ${colorMap[tipo].bg} p-4.5 text-white flex items-center gap-2.5`}>
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-sm">
                      <SelectedIcon size={16} />
                    </div>
                    <div>
                      {badge && <span className="text-[8px] font-extrabold bg-yellow-400 text-slate-900 px-1.5 py-0.5 rounded-full uppercase tracking-wider">{badge}</span>}
                      <h4 className="font-black text-xs mt-0.5 truncate max-w-[170px]">{titulo || 'Título del anuncio'}</h4>
                    </div>
                  </div>
                  {/* Cuerpo */}
                  <div className="p-4 space-y-2">
                    {subtitulo && <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{subtitulo}</p>}
                    {imageUrl && (
                      <img src={imageUrl} alt="Anuncio" className="rounded-xl w-full h-24 object-cover my-1" />
                    )}
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {cuerpo || 'Aquí se mostrará el cuerpo detallado de tu mensaje instructivo o de alerta.'}
                    </p>
                  </div>
                  {/* Botones */}
                  <div className="px-4 pb-4 pt-1 flex gap-2 justify-end border-t border-slate-50">
                    <button className="text-[10px] text-slate-400 font-bold px-3 py-1.5 rounded-lg hover:bg-slate-50">
                      Entendido
                    </button>
                    {ctaTexto && (
                      <button className={`text-[10px] text-white font-black px-3.5 py-1.5 rounded-lg bg-gradient-to-r ${colorMap[tipo].bg} shadow-md`}>
                        {ctaTexto}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <NavButtons
        step={step} total={TOTAL}
        onPrev={() => setStep(s => s - 1)}
        onNext={() => setStep(s => s + 1)}
        onReset={reset}
        color="bg-indigo-500"
        canNext={canNext}
      />
    </div>
  );
};


/* ─────────────────────────────────────────────
   SIMULADOR 3: GESTIÓN DE TAREAS (KANBAN)
   ───────────────────────────────────────────── */
const MOCK_TRABAJADORES = [
  { id: 'w1', nombre: 'Carlos Mendoza', grupo: 'Desarrollo' },
  { id: 'w2', nombre: 'Felipe Torres', grupo: 'Soporte' },
  { id: 'w3', nombre: 'Ana Gómez', grupo: 'IT' },
];

const TutorialTareas = () => {
  const TOTAL = 4;
  const [step, setStep] = useState(0);

  // States
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [responsable, setResponsable] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [grupo, setGrupo] = useState('IT');
  const [fechaLimite, setFechaLimite] = useState('');

  // Kanban simulator state
  const [kanbanEstado, setKanbanEstado] = useState('pendiente');

  const reset = () => {
    setStep(0);
    setTitulo('');
    setDescripcion('');
    setResponsable('');
    setPrioridad('media');
    setGrupo('IT');
    setFechaLimite('');
    setKanbanEstado('pendiente');
  };

  const canNext = [
    true, // Intro
    titulo.trim().length >= 3 && responsable !== '', // Datos
    fechaLimite !== '', // Priorización/Fecha
    true, // Kanban
  ][step];

  const priorityColors = {
    critica: { label: 'Crítica 🔴', color: 'text-red-700 bg-red-50 border-red-200' },
    urgente: { label: 'Urgente 🟠', color: 'text-orange-700 bg-orange-50 border-orange-200' },
    alta: { label: 'Alta 🟡', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    media: { label: 'Media 🔵', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    baja: { label: 'Baja 🟢', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    minima: { label: 'Mínima ⚪', color: 'text-slate-600 bg-slate-50 border-slate-200' },
    ninguna: { label: 'Ninguna ◽', color: 'text-slate-400 bg-slate-100 border-slate-200' },
  };

  const kanbanColumns = [
    { key: 'pendiente', label: 'Pendiente', bg: 'bg-slate-100/50' },
    { key: 'en-progreso', label: 'En Progreso', bg: 'bg-blue-50/50 border border-blue-100/30' },
    { key: 'revision', label: 'Revisión', bg: 'bg-amber-50/50 border border-amber-100/30' },
    { key: 'hecho', label: 'Hecho', bg: 'bg-emerald-50/50 border border-emerald-100/30' },
    { key: 'bloqueado', label: 'Bloqueado', bg: 'bg-red-50/50 border border-red-100/30' },
  ];

  return (
    <div>
      <StepBar current={step} total={TOTAL} color="bg-violet-500" />

      {/* PASO 0: INTRODUCCIÓN */}
      {step === 0 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-violet-50 border border-violet-100 rounded-3xl p-6">
            <h3 className="font-black text-violet-800 text-sm mb-2 flex items-center gap-2">
              <BookOpen size={16} /> Flujo de Tareas Kanban del Equipo
            </h3>
            <p className="text-violet-700 text-xs leading-relaxed">
              El módulo de tareas sirve para gestionar los pendientes operativos de ECG. Se basa en un tablero visual <strong>Kanban</strong>. Permite estructurar prioridades (de mínima a crítica), segmentar por grupos técnicos y programar fechas límites.
            </p>
          </div>

          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 space-y-3">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Reglas de Privacidad y Nivel de Acceso</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-white border border-slate-100 p-3 rounded-2xl">
                <strong className="text-violet-700 font-bold block mb-1">Para Administradores (Nivel ≥ 2)</strong>
                <p className="text-[11px] text-slate-400 leading-relaxed">Pueden crear cualquier tarea, eliminarla, asignarla a cualquier persona y moverla libremente entre columnas.</p>
              </div>
              <div className="bg-white border border-slate-100 p-3 rounded-2xl">
                <strong className="text-blue-700 font-bold block mb-1">Para Trabajadores (Nivel 1)</strong>
                <p className="text-[11px] text-slate-400 leading-relaxed">Solo pueden ver sus tareas asignadas y actualizar su estado para avisar de su avance.</p>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-500 text-white text-xs font-black hover:bg-violet-600 transition-all shadow-lg shadow-violet-100"
            >
              Crear Nueva Tarea <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* PASO 1: DATOS BÁSICOS */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <ClipboardList size={14} className="text-violet-500" /> 1. Datos Técnicos de la Tarea
            </h3>

            <FL label="Título de la tarea" required hint="Ejemplo de acción específica">
              <input 
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ej. Revisión y limpieza de filtros en el minisplit de dirección"
                className={inputCls}
              />
            </FL>

            <FL label="Descripción detallada" hint="Opcional">
              <textarea 
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Detalla los pasos para completar la tarea o herramientas necesarias..."
                rows={3.5}
                className={`${inputCls} resize-none`}
              />
            </FL>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FL label="Departamento / Grupo" required>
                <select 
                  value={grupo}
                  onChange={e => setGrupo(e.target.value)}
                  className={inputCls}
                >
                  <option value="IT">IT y Servidores</option>
                  <option value="Marketing">Marketing y Ventas</option>
                  <option value="Sistemas">Sistemas</option>
                  <option value="Desarrollo">Desarrollo Web</option>
                  <option value="Soporte">Soporte Técnico de Campo</option>
                  <option value="General">General</option>
                </select>
              </FL>

              <FL label="Colaborador Responsable" required>
                <select 
                  value={responsable}
                  onChange={e => setResponsable(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-- Selecciona un integrante --</option>
                  {MOCK_TRABAJADORES.map(w => (
                    <option key={w.id} value={w.nombre}>{w.nombre} ({w.grupo})</option>
                  ))}
                </select>
              </FL>
            </div>
          </div>

          <Tip title="Explicación Operativa">
            La correcta asignación de <strong>Grupo</strong> y <strong>Responsable</strong> permite organizar los tableros individuales de cada trabajador y agiliza la comunicación en el centro de trabajo de ECG.
          </Tip>

          {!canNext && titulo && (
            <Warning title="Campos Faltantes">Debes asignar un integrante responsable para continuar.</Warning>
          )}
        </div>
      )}

      {/* PASO 2: PRIORIZACIÓN Y VIGENCIA */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <AlertCircle size={14} className="text-violet-500" /> 2. Priorización y Fecha de Entrega
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FL label="Nivel de Prioridad" required>
                <select 
                  value={prioridad}
                  onChange={e => setPrioridad(e.target.value)}
                  className={inputCls}
                >
                  <option value="critica">Critica (Falla operativa general)</option>
                  <option value="urgente">Urgente (Atender hoy)</option>
                  <option value="alta">Alta (Prioridad regular)</option>
                  <option value="media">Media (Estándar)</option>
                  <option value="baja">Baja (Sin prisa)</option>
                  <option value="minima">Mínima (Archivo)</option>
                  <option value="ninguna">Ninguna</option>
                </select>
              </FL>

              <FL label="Fecha Límite (Entrega)" required hint="Evita que venza">
                <input 
                  type="date"
                  value={fechaLimite}
                  onChange={e => setFechaLimite(e.target.value)}
                  className={inputCls}
                />
              </FL>
            </div>

            <Warning title="Consecuencias de Vencimiento">
              En el módulo real, si una tarea supera la <strong>Fecha Límite</strong> sin haber sido marcada como "Hecho", el sistema bloqueará el registro y se requerirá la autorización de un administrador para modificarla.
            </Warning>
          </div>

          <Tip title="Cómo Elegir la Prioridad">
            Utiliza la prioridad <strong>Crítica</strong> sólo si la operación comercial del cliente se encuentra totalmente detenida (ej. sin luz, caída de red principal). Las tareas rutinarias corresponden a prioridad <strong>Media</strong> o <strong>Baja</strong>.
          </Tip>
        </div>
      )}

      {/* PASO 3: SIMULADOR DE TABLERO KANBAN */}
      {step === 3 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <ListChecks size={14} className="text-violet-500" /> 3. Simulación de Flujo en el Tablero Kanban
            </h3>
            <p className="text-xs text-slate-500">
              Haz clic en los botones de estado dentro de la tarjeta de la tarea para moverla en las columnas correspondientes del tablero:
            </p>

            {/* Kanban columns grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
              {kanbanColumns.map(col => {
                const isActive = kanbanEstado === col.key;
                return (
                  <div key={col.key} className={`rounded-2xl p-3 flex flex-col gap-2 min-h-48 transition-all ${col.bg}`}>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1.5 block">
                      {col.label}
                    </span>

                    {/* Simulación de la Card */}
                    {isActive && (
                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2.5 animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500" />
                        <div>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${priorityColors[prioridad].color}`}>
                            {priorityColors[prioridad].label}
                          </span>
                          <h4 className="font-black text-xs text-slate-800 mt-1.5 leading-snug">{titulo}</h4>
                          {descripcion && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{descripcion}</p>}
                        </div>

                        <div className="space-y-1.5 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                          <div className="flex items-center gap-1"><User size={10} /> {responsable}</div>
                          <div className="flex items-center gap-1"><Calendar size={10} /> Vence: {fechaLimite}</div>
                          <div className="flex items-center gap-1"><Building2 size={10} /> Grupo: {grupo}</div>
                        </div>

                        {/* Controles para cambiar estado en el simulador */}
                        <div className="border-t border-slate-100 pt-2 space-y-1">
                          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Mover estado</span>
                          <div className="flex flex-wrap gap-1">
                            {kanbanColumns.map(b => (
                              <button
                                key={b.key}
                                onClick={() => setKanbanEstado(b.key)}
                                className={`text-[8px] font-black px-1.5 py-0.5 rounded border transition-all ${
                                  kanbanEstado === b.key 
                                    ? 'bg-slate-900 text-white border-transparent' 
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-150'
                                }`}
                              >
                                {b.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {kanbanEstado === 'hecho' && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-2xl p-4.5 animate-bounce">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <span>
                  <strong>¡Enhorabuena!</strong> Al mover la tarea a la columna <strong>Hecho</strong>, esta se archiva del listado de pendientes activos de tu dashboard.
                </span>
              </div>
            )}
            
            {kanbanEstado === 'bloqueado' && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold rounded-2xl p-4.5">
                <Lock size={18} className="text-rose-500 shrink-0 animate-pulse" />
                <span>
                  <strong>Atención:</strong> Las tareas <strong>Bloqueadas</strong> alertan visualmente a los coordinadores de que existe un impedimento técnico o de recursos.
                </span>
              </div>
            )}
          </div>

          <button 
            onClick={() => setStep(4)} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-violet-500 text-white font-black text-xs hover:bg-violet-600 transition-all shadow-md shadow-violet-100"
          >
            <CheckCircle2 size={15} /> Finalizar Tarea y Guardar
          </button>
        </div>
      )}

      {step < 3 && (
        <NavButtons
          step={step} total={TOTAL}
          onPrev={() => setStep(s => s - 1)}
          onNext={() => setStep(s => s + 1)}
          onReset={reset}
          color="bg-violet-500"
          canNext={canNext}
        />
      )}
    </div>
  );
};


/* ─────────────────────────────────────────────
   SIMULADOR 4: ENCUESTAS DE SATISFACCIÓN
   ───────────────────────────────────────────── */
const TutorialEncuestas = () => {
  const TOTAL = 5;
  const [step, setStep] = useState(0);

  // States
  const [preguntaTexto, setPreguntaTexto] = useState('');
  const [preguntaTipo, setPreguntaTipo] = useState('abierta');
  const [preguntaOpciones, setPreguntaOpciones] = useState(['Excelente', 'Bueno']);
  const [preguntaOrden, setPreguntaOrden] = useState(0);
  const [preguntaActiva, setPreguntaActiva] = useState(true);

  // Cliente code states
  const [cliente, setCliente] = useState('');
  const [clienteDesc, setClienteDesc] = useState('');
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [copied, setCopied] = useState(false);

  // Survey answering simulator states
  const [answerInputCode, setAnswerInputCode] = useState('');
  const [answerCodeSuccess, setAnswerCodeSuccess] = useState(false);
  const [answerCodeError, setAnswerCodeError] = useState('');
  const [userSelectedOpt, setUserSelectedOpt] = useState('');
  const [userTextAnswer, setUserTextAnswer] = useState('');
  const [answeredCompleted, setAnsweredCompleted] = useState(false);

  // Stats mockup updated dynamically
  const [mockStats, setMockStats] = useState({
    generados: 5,
    respondidas: 2,
    respuestas: [
      { opcion: 'Excelente', count: 1 },
      { opcion: 'Bueno', count: 1 },
    ],
    abiertas: [
      "El servicio de recolección fue puntual.",
      "Excelente trato del técnico de campo.",
    ]
  });

  const addOptionInput = () => {
    setPreguntaOpciones(p => [...p, '']);
  };

  const editOptionValue = (index, val) => {
    setPreguntaOpciones(p => p.map((item, idx) => idx === index ? val : item));
  };

  const removeOptionInput = (index) => {
    if (preguntaOpciones.length <= 2) return;
    setPreguntaOpciones(p => p.filter((_, idx) => idx !== index));
  };

  const generateCode = () => {
    const code = 'SAT-' + Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
    setCodigoGenerado(code);
    setMockStats(p => ({ ...p, generados: p.generados + 1 }));
  };

  const copyToClipboardSim = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const verifyCode = () => {
    if (answerInputCode.trim().toUpperCase() === codigoGenerado.toUpperCase() || answerInputCode.trim().toUpperCase() === 'SAT-DEMO') {
      setAnswerCodeSuccess(true);
      setAnswerCodeError('');
    } else {
      setAnswerCodeError('El código es incorrecto o ya fue utilizado.');
    }
  };

  const submitAnswer = () => {
    if (preguntaTipo === 'multiple') {
      if (!userSelectedOpt) return;
      setMockStats(p => {
        const found = p.respuestas.find(r => r.opcion === userSelectedOpt);
        let list = [];
        if (found) {
          list = p.respuestas.map(r => r.opcion === userSelectedOpt ? { ...r, count: r.count + 1 } : r);
        } else {
          list = [...p.respuestas, { opcion: userSelectedOpt, count: 1 }];
        }
        return {
          ...p,
          respondidas: p.respondidas + 1,
          respuestas: list.sort((a, b) => b.count - a.count),
        };
      });
    } else {
      if (!userTextAnswer.trim()) return;
      setMockStats(p => ({
        ...p,
        respondidas: p.respondidas + 1,
        abiertas: [userTextAnswer, ...p.abiertas],
      }));
    }
    setAnsweredCompleted(true);
  };

  const reset = () => {
    setStep(0);
    setPreguntaTexto('');
    setPreguntaTipo('abierta');
    setPreguntaOpciones(['Excelente', 'Bueno']);
    setPreguntaOrden(0);
    setPreguntaActiva(true);
    setCliente('');
    setClienteDesc('');
    setCodigoGenerado('');
    setCopied(false);
    setAnswerInputCode('');
    setAnswerCodeSuccess(false);
    setAnswerCodeError('');
    setUserSelectedOpt('');
    setUserTextAnswer('');
    setAnsweredCompleted(false);
  };

  const canNext = [
    true, // Intro
    preguntaTexto.trim().length >= 5 && (preguntaTipo === 'abierta' || preguntaOpciones.every(o => o.trim().length > 0)), // Pregunta
    codigoGenerado !== '', // Código
    answeredCompleted, // Responder
    true, // Stats
  ][step];

  return (
    <div>
      <StepBar current={step} total={TOTAL} color="bg-amber-500" />

      {/* PASO 0: INTRODUCCIÓN */}
      {step === 0 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6">
            <h3 className="font-black text-amber-800 text-sm mb-2 flex items-center gap-2">
              <BookOpen size={16} /> Evaluación CSAT y Códigos de Seguridad
            </h3>
            <p className="text-amber-700 text-xs leading-relaxed">
              El sistema de encuestas de ECG recopila opiniones cualitativas de clientes y público general. Cuenta con un sistema de **puerta de enlace por códigos**. Cada cliente recibe un código único que se inutiliza al enviar las respuestas, asegurando una votación transparente sin votos duplicados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center text-xs">
            <div className="border border-slate-100 bg-white rounded-2xl p-4 flex flex-col items-center">
              <span className="text-xl">📝</span>
              <h4 className="font-bold text-slate-800 mt-1">1. Diseña Preguntas</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Crea preguntas de opción múltiple o abiertas para el portal.</p>
            </div>
            <div className="border border-slate-100 bg-white rounded-2xl p-4 flex flex-col items-center">
              <span className="text-xl">🔑</span>
              <h4 className="font-bold text-slate-800 mt-1">2. Genera Códigos</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Genera un token cifrado para cada cliente o proyecto cotizado.</p>
            </div>
            <div className="border border-slate-100 bg-white rounded-2xl p-4 flex flex-col items-center">
              <span className="text-xl">📊</span>
              <h4 className="font-bold text-slate-800 mt-1">3. Analiza Datos</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Obtén métricas visuales del nivel de satisfacción en tiempo real.</p>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 text-white text-xs font-black hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
            >
              Comenzar Configuración <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* PASO 1: CREAR PREGUNTA */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <FileText size={14} className="text-amber-500" /> 1. Estructura la Pregunta de la Encuesta
            </h3>

            <FL label="Texto de la Pregunta" required hint="Ejemplo de encuesta CSAT">
              <textarea 
                value={preguntaTexto}
                onChange={e => setPreguntaTexto(e.target.value)}
                placeholder="Ej. ¿Cómo calificarías la amabilidad del asesor ambiental que te atendió?"
                rows={2.5}
                className={`${inputCls} resize-none`}
              />
            </FL>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FL label="Tipo de Respuesta" required>
                <select
                  value={preguntaTipo}
                  onChange={e => setPreguntaTipo(e.target.value)}
                  className={inputCls}
                >
                  <option value="abierta">Abierta (Texto libre)</option>
                  <option value="multiple">Opción Múltiple (Gráfica de barras)</option>
                </select>
              </FL>

              <FL label="Orden de visualización" required>
                <input 
                  type="number"
                  min="0"
                  value={preguntaOrden}
                  onChange={e => setPreguntaOrden(parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
              </FL>

              <div className="flex flex-col justify-end">
                <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider block mb-2">Pregunta Activa</span>
                <button
                  onClick={() => setPreguntaActiva(!preguntaActiva)}
                  className={`w-12 h-6 rounded-full transition-all relative ${preguntaActiva ? 'bg-amber-400' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${preguntaActiva ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Opciones dinámicas para opción múltiple */}
            {preguntaTipo === 'multiple' && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Opciones de respuesta (Mínimo 2)</h4>
                  <button 
                    onClick={addOptionInput}
                    className="text-[10px] text-amber-600 hover:text-amber-700 font-black flex items-center gap-1"
                  >
                    + Agregar opción
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {preguntaOpciones.map((opt, i) => (
                    <div key={i} className="flex gap-1.5 items-center">
                      <span className="text-[10px] font-black text-slate-400 w-4">{i + 1}.</span>
                      <input 
                        value={opt}
                        onChange={e => editOptionValue(i, e.target.value)}
                        placeholder={`Ej. Opción ${i + 1}`}
                        className={inputCls}
                      />
                      {preguntaOpciones.length > 2 && (
                        <button 
                          onClick={() => removeOptionInput(i)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Tip title="Explicación Técnica">
            Las preguntas **Inactivas** no se muestran a los clientes finales. Si eliges **Opción Múltiple**, asegúrate de que las opciones no queden en blanco para poder avanzar.
          </Tip>

          {!canNext && preguntaTexto && (
            <Warning title="Opciones Incompletas">Llena todos los campos de opciones del formulario para poder continuar.</Warning>
          )}
        </div>
      )}

      {/* PASO 2: GENERAR CÓDIGO */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <Lock size={14} className="text-amber-500" /> 2. Generar Código de Acceso para Cliente
            </h3>

            <FL label="Nombre del Cliente / Empresa Destino" required hint="Crea un token único">
              <input 
                value={cliente}
                onChange={e => setCliente(e.target.value)}
                placeholder="Ej. Industrial Alimenticia del Centro S.A."
                className={inputCls}
              />
            </FL>

            <FL label="Descripción de entrega" hint="Opcional">
              <textarea 
                value={clienteDesc}
                onChange={e => setClienteDesc(e.target.value)}
                placeholder="Ej. Código para evaluar la auditoría de impacto ambiental del mes de mayo."
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </FL>

            <button 
              onClick={generateCode}
              disabled={!cliente}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all disabled:opacity-40 flex items-center gap-2"
            >
              <Sparkles size={14} /> Generar Código de Satisfacción
            </button>

            {codigoGenerado && (
              <div className="bg-white border-2 border-dashed border-amber-300 rounded-2xl p-5 text-center space-y-2 animate-fade-in">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Token Generado para el Cliente</span>
                <span className="text-3xl font-black text-amber-600 font-mono tracking-widest block">{codigoGenerado}</span>
                <button
                  onClick={copyToClipboardSim}
                  className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-800 font-bold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl transition-all"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  {copied ? '¡Copiado!' : 'Copiar Token'}
                </button>
              </div>
            )}
          </div>

          <Tip title="Uso Operativo">
            Envía este token por correo o WhatsApp al cliente final. Al responder, la encuesta se marcará como **"Usada"** en tu lista general para evitar re-envíos o suplantaciones.
          </Tip>
        </div>
      )}

      {/* PASO 3: SIMULACIÓN DE RESPUESTA DE CLIENTE */}
      {step === 3 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <Shield size={14} className="text-amber-500" /> 3. Simulación del Portal de Respuestas (Cliente)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ahora simularás ser el cliente ingresando al portal. Escribe el código generado <strong>({codigoGenerado || 'SAT-DEMO'})</strong> y responde la pregunta para ver cómo se suma a las gráficas:
            </p>

            {!answerCodeSuccess ? (
              // SOLICITAR CODIGO
              <div className="max-w-sm mx-auto bg-white border border-slate-200 p-6 rounded-3xl space-y-3.5 shadow-sm text-center">
                <span className="text-xl">🔑</span>
                <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider">Ingresar código de satisfacción</h4>
                <input 
                  value={answerInputCode}
                  onChange={e => setAnswerInputCode(e.target.value)}
                  placeholder="Ej. SAT-A4C8"
                  className={`${inputCls} text-center font-mono tracking-widest`}
                />
                <button 
                  onClick={verifyCode}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-950 transition-all"
                >
                  Acceder a Encuesta
                </button>
                {answerCodeError && <p className="text-[10px] text-rose-500 font-bold">{answerCodeError}</p>}
                <p className="text-[10px] text-slate-400 font-medium">Usa: {codigoGenerado || 'SAT-DEMO'} para pasar el filtro.</p>
              </div>
            ) : (
              // MOSTRAR ENCUESTA
              <div className="max-w-md mx-auto bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
                <div className="border-b border-slate-100 pb-2.5 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Encuesta de Satisfacción</span>
                  <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">Código: {answerInputCode.toUpperCase()}</span>
                </div>

                <div className="space-y-3.5">
                  <p className="text-xs font-black text-slate-700 leading-relaxed">
                    Pregunta: <span className="font-bold text-slate-600">{preguntaTexto || '¿Cómo calificarías nuestro servicio?'}</span>
                  </p>

                  {preguntaTipo === 'multiple' ? (
                    <div className="space-y-2">
                      {preguntaOpciones.map(opt => (
                        <label key={opt} className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2.5 rounded-xl cursor-pointer hover:border-amber-300 transition-all">
                          <input 
                            type="radio" 
                            name="mock_opt" 
                            value={opt} 
                            checked={userSelectedOpt === opt}
                            onChange={() => setUserSelectedOpt(opt)}
                            className="text-amber-500 focus:ring-amber-400"
                          />
                          <span className="text-xs text-slate-700 font-bold">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea 
                      value={userTextAnswer}
                      onChange={e => setUserTextAnswer(e.target.value)}
                      placeholder="Escribe aquí tu opinión detallada..."
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                  )}

                  {!answeredCompleted ? (
                    <button 
                      onClick={submitAnswer}
                      disabled={preguntaTipo === 'multiple' ? !userSelectedOpt : !userTextAnswer.trim()}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all disabled:opacity-40"
                    >
                      Enviar Respuestas
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl p-3 text-center justify-center animate-fade-in">
                      <CheckCircle2 size={15} className="text-emerald-500" />
                      <span>¡Respuestas enviadas! Código invalidado.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PASO 4: ESTADÍSTICAS */}
      {step === 4 && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <BarChart2 size={14} className="text-amber-500" /> 4. Resultados y Gráficas del Dashboard
            </h3>

            {/* Metricas */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Códigos creados</span>
                <span className="text-xl font-black text-slate-700">{mockStats.generados}</span>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Contestadas</span>
                <span className="text-xl font-black text-amber-500">{mockStats.respondidas}</span>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Tasa de respuesta</span>
                <span className="text-xl font-black text-emerald-500">
                  {Math.round((mockStats.respondidas / mockStats.generados) * 100)}%
                </span>
              </div>
            </div>

            {/* Resultados de la pregunta configurada */}
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm space-y-3">
              <div className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                <h4 className="font-black text-xs text-slate-700">{preguntaTexto || '¿Cómo calificarías nuestro servicio?'}</h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resultados CSAT</span>
              </div>

              {preguntaTipo === 'multiple' ? (
                // GRÁFICA DE OPCIÓN MULTIPLE
                <div className="space-y-3">
                  {mockStats.respuestas.map(item => {
                    const totalVotes = mockStats.respuestas.reduce((s, r) => s + r.count, 0) || 1;
                    const pct = Math.round((item.count / totalVotes) * 100);
                    return (
                      <div key={item.opcion} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span>{item.opcion}</span>
                          <span className="text-slate-400">{item.count} voto(s) ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // LISTADO DE ABIERTAS
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {mockStats.abiertas.map((txt, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 italic font-medium flex items-start gap-2">
                      <span className="text-amber-500 font-bold shrink-0">"</span>
                      <p className="flex-1">{txt}</p>
                      <span className="text-amber-500 font-bold shrink-0">"</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <button 
            onClick={reset} 
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 text-white text-xs font-black hover:bg-amber-600 transition-all shadow-md"
          >
            <RotateCcw size={14} /> Crear otra Encuesta / Código
          </button>
        </div>
      )}

      {step < 4 && (
        <NavButtons
          step={step} total={TOTAL}
          onPrev={() => setStep(s => s - 1)}
          onNext={() => setStep(s => s + 1)}
          onReset={reset}
          color="bg-amber-500"
          canNext={canNext}
          nextLabel={step === 2 ? 'Responder Encuesta' : 'Siguiente'}
        />
      )}
    </div>
  );
};


/* ─────────────────────────────────────────────
   TABS CONFIG
   ───────────────────────────────────────────── */
const TABS = [
  { id: 'cotizaciones', label: 'Cotizaciones',     icon: <FileText size={16} />,   gradient: 'from-emerald-500 to-teal-600',   accent: 'text-emerald-600', activeBg: 'bg-emerald-500' },
  { id: 'anuncios',     label: 'Anuncios / Pop-ups', icon: <Megaphone size={16} />, gradient: 'from-indigo-500 to-blue-600',    accent: 'text-indigo-600',  activeBg: 'bg-indigo-500'  },
  { id: 'tareas',       label: 'Tareas',            icon: <ListChecks size={16} />, gradient: 'from-violet-500 to-purple-600',  accent: 'text-violet-600',  activeBg: 'bg-violet-500'  },
  { id: 'encuestas',    label: 'Encuestas',         icon: <Star size={16} />,       gradient: 'from-amber-500 to-orange-600',   accent: 'text-amber-600',   activeBg: 'bg-amber-500'   },
];

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
   ───────────────────────────────────────────── */
const TutorialesSection = () => {
  const [activeTab, setActiveTab] = useState('cotizaciones');
  const [key, setKey] = useState(0);

  const handleTab = (id) => {
    setActiveTab(id);
    setKey(k => k + 1);
  };

  const current = TABS.find(t => t.id === activeTab);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-200 shrink-0">
          <GraduationCap size={26} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centro de Tutoriales Interactivos</h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">Practica en entornos simulados e interactivos exactamente iguales a los módulos reales de ECG.</p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-2xl text-xs font-black transition-all border ${
                active
                  ? `${tab.activeBg} text-white border-transparent shadow-lg shadow-slate-100`
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700 shadow-sm'
              }`}
            >
              <span className={active ? 'text-white' : tab.accent}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Card principal del simulador */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        {/* Banner de Cabecera */}
        <div className={`bg-gradient-to-r ${current.gradient} px-7 py-6 text-white relative overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/10" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm shadow-sm">{current.icon}</div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Módulo Simulado</span>
                <h2 className="text-lg font-black mt-0.5">Guía Interactiva de {current.label}</h2>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5">
              <PlayCircle size={14} className="text-white/80 animate-pulse" />
              <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">Modo Práctica Activo</span>
            </div>
          </div>
        </div>

        {/* Simulator body */}
        <div className="p-6 md:p-8" key={key}>
          {activeTab === 'cotizaciones' && <TutorialCotizaciones />}
          {activeTab === 'anuncios'     && <TutorialAnuncios />}
          {activeTab === 'tareas'       && <TutorialTareas />}
          {activeTab === 'encuestas'    && <TutorialEncuestas />}
        </div>
      </div>

      {/* Nota pie de pagina */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
        <Info size={13} className="text-slate-400" />
        <span>Los datos ingresados en estas simulaciones son 100% privados y no se guardan en la base de datos de producción.</span>
      </div>
    </div>
  );
};

export default TutorialesSection;
