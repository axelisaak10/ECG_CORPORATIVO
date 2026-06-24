import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap, FileText, Megaphone, ListChecks, Star,
  ChevronRight, ChevronLeft, Lightbulb, AlertTriangle,
  Plus, Trash2, CheckCircle2, Eye, RotateCcw, Building2,
  User, DollarSign, Clock, Calendar, Tag, Link2, Image,
  PlayCircle, Sparkles, ArrowRight, Check, X, BarChart2,
  ClipboardList, Send, RefreshCw, BookOpen, Info,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Utilidades
───────────────────────────────────────────── */
const fmtPeso = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

const Chip = ({ children, color = 'indigo' }) => {
  const map = {
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    rose: 'bg-rose-100 text-rose-700 border-rose-200',
    violet: 'bg-violet-100 text-violet-700 border-violet-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${map[color]}`}>
      {children}
    </span>
  );
};

const Tip = ({ children }) => (
  <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 text-xs text-amber-800">
    <Lightbulb size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
    <span>{children}</span>
  </div>
);

const Warning = ({ children }) => (
  <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5 text-xs text-rose-800">
    <AlertTriangle size={14} className="text-rose-500 mt-0.5 flex-shrink-0" />
    <span>{children}</span>
  </div>
);

/* Barra de progreso de pasos */
const StepBar = ({ current, total, color }) => (
  <div className="flex items-center gap-1.5 mb-6">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
          i < current ? color : i === current ? `${color} opacity-60` : 'bg-slate-100'
        }`}
      />
    ))}
    <span className="text-[11px] font-bold text-slate-400 ml-2 whitespace-nowrap">
      Paso {Math.min(current + 1, total)} / {total}
    </span>
  </div>
);

/* Botones de navegación */
const NavButtons = ({ step, total, onPrev, onNext, onReset, nextLabel, color, canNext }) => (
  <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
    <button
      onClick={onReset}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
    >
      <RotateCcw size={13} /> Reiniciar
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

/* ─────────────────────────────────────────────
   SIMULADOR 1: COTIZACIONES
───────────────────────────────────────────── */
const TutorialCotizaciones = () => {
  const TOTAL = 4;
  const init = {
    cliente: '', empresa: 'ECG Ambiental', tipo: '', folio: '',
    partidas: [], nueva: '', monto: '', estado: 'en_proceso',
  };
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(init);
  const [saved, setSaved] = useState(false);
  const [addedNow, setAddedNow] = useState(false);

  const total = form.partidas.reduce((s, p) => s + p.monto, 0);

  const addPartida = () => {
    if (!form.nueva.trim() || !form.monto) return;
    setForm(f => ({
      ...f,
      partidas: [...f.partidas, { concepto: f.nueva, monto: parseFloat(f.monto) }],
      nueva: '', monto: '',
    }));
    setAddedNow(true);
    setTimeout(() => setAddedNow(false), 1200);
  };

  const removePartida = (i) =>
    setForm(f => ({ ...f, partidas: f.partidas.filter((_, idx) => idx !== i) }));

  const reset = () => { setStep(0); setForm(init); setSaved(false); };

  const canNext = [
    true,
    form.cliente.trim().length >= 2 && form.tipo.trim().length >= 2,
    form.partidas.length > 0,
    true,
  ][step];

  const handleSave = () => { setSaved(true); setTimeout(() => setStep(4), 800); };

  if (step === 4 && saved) return (
    <div className="flex flex-col items-center py-10 gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 size={36} className="text-emerald-500" />
      </div>
      <h3 className="text-lg font-black text-slate-800">¡Cotización Creada!</h3>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 w-full max-w-sm text-xs space-y-2">
        <div className="flex justify-between"><span className="text-slate-500">Folio</span><span className="font-bold">{form.folio || 'COT-' + Date.now().toString().slice(-5)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Cliente</span><span className="font-bold">{form.cliente}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Empresa ECG</span><span className="font-bold">{form.empresa}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Tipo</span><span className="font-bold">{form.tipo}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Partidas</span><span className="font-bold">{form.partidas.length}</span></div>
        <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
          <span className="text-slate-500 font-semibold">Total</span>
          <span className="font-black text-emerald-600">{fmtPeso(total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Estado</span>
          <Chip color="amber">En proceso</Chip>
        </div>
      </div>
      <p className="text-xs text-slate-400 text-center max-w-xs">
        La cotización aparece ahora en el listado general y puede ser editada por Administradores.
      </p>
      <button onClick={reset} className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all">
        <RotateCcw size={13} /> Practicar de nuevo
      </button>
    </div>
  );

  return (
    <div>
      <StepBar current={step} total={TOTAL} color="bg-emerald-500" />

      {/* PASO 0: Intro + abrir formulario */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
            <h3 className="font-black text-emerald-800 text-sm mb-2 flex items-center gap-2">
              <BookOpen size={15} /> ¿Qué es una Cotización?
            </h3>
            <p className="text-emerald-700 text-xs leading-relaxed">
              Las cotizaciones son presupuestos que creas para tus clientes. Puedes agregar múltiples <strong>partidas</strong> (conceptos de servicio con su costo), definir la empresa ECG responsable y hacer seguimiento del estado de la propuesta.
            </p>
          </div>
          <div className="border border-dashed border-slate-200 rounded-2xl p-5 text-center">
            <p className="text-xs text-slate-500 mb-3">Así se ve el módulo real. Haz clic para comenzar:</p>
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
            >
              <Plus size={14} /> + Nueva Cotización
            </button>
          </div>
          <Tip>Ubica el botón «+ Nueva Cotización» en la esquina superior derecha del módulo real.</Tip>
        </div>
      )}

      {/* PASO 1: Datos generales */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider mb-1">Datos generales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Cliente / Empresa *</label>
                <input
                  value={form.cliente}
                  onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))}
                  placeholder="Ej. Constructora Alfa S.A."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Empresa ECG *</label>
                <select
                  value={form.empresa}
                  onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white"
                >
                  <option>ECG Ambiental</option>
                  <option>ECG Ingeniería</option>
                  <option>ECG Consultoría</option>
                  <option>ECG Capacitación</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Tipo de servicio *</label>
                <input
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  placeholder="Ej. Auditoría ambiental"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Folio / Referencia</label>
                <input
                  value={form.folio}
                  onChange={e => setForm(f => ({ ...f, folio: e.target.value }))}
                  placeholder="Ej. COT-2026-001"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white"
                />
              </div>
            </div>
          </div>
          <Tip>El folio es opcional pero muy recomendable para identificar rápidamente la cotización (ej. COT-2026-ABC).</Tip>
          {!canNext && form.cliente && <Warning>Completa también el tipo de servicio para continuar.</Warning>}
        </div>
      )}

      {/* PASO 2: Partidas */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider mb-2">Agregar partidas</h3>
            <div className="flex gap-2">
              <input
                value={form.nueva}
                onChange={e => setForm(f => ({ ...f, nueva: e.target.value }))}
                placeholder="Concepto del servicio"
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white"
                onKeyDown={e => e.key === 'Enter' && addPartida()}
              />
              <input
                value={form.monto}
                onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                placeholder="$ Monto"
                type="number"
                min="0"
                className="w-28 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all bg-white"
                onKeyDown={e => e.key === 'Enter' && addPartida()}
              />
              <button
                onClick={addPartida}
                disabled={!form.nueva.trim() || !form.monto}
                className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all disabled:opacity-40 flex items-center gap-1 shrink-0"
              >
                <Plus size={13} /> Agregar
              </button>
            </div>

            {form.partidas.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                Aún no hay partidas. ¡Agrega al menos una!
              </div>
            ) : (
              <div className="space-y-1.5">
                {form.partidas.map((p, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2.5 transition-all ${addedNow && i === form.partidas.length - 1 ? 'border-emerald-300 bg-emerald-50' : ''}`}
                  >
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                      <Check size={12} className="text-emerald-500" /> {p.concepto}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-600">{fmtPeso(p.monto)}</span>
                      <button onClick={() => removePartida(i)} className="text-slate-300 hover:text-rose-400 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-slate-200 px-3">
                  <span className="text-xs font-bold text-slate-500">Total estimado</span>
                  <span className="text-sm font-black text-emerald-600">{fmtPeso(total)}</span>
                </div>
              </div>
            )}
          </div>
          <Tip>Puedes agregar tantas partidas como necesites. El total se calcula automáticamente.</Tip>
          {!canNext && <Warning>Agrega al menos una partida para poder continuar.</Warning>}
        </div>
      )}

      {/* PASO 3: Estado y guardar */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider">Estado inicial y guardar</h3>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-2">Estado de la cotización</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { v: 'en_proceso', label: 'En proceso', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                  { v: 'aceptada', label: 'Aceptada', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                  { v: 'rechazada', label: 'Rechazada', color: 'bg-rose-100 text-rose-700 border-rose-200' },
                ].map(s => (
                  <button
                    key={s.v}
                    onClick={() => setForm(f => ({ ...f, estado: s.v }))}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      form.estado === s.v ? s.color + ' shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vista previa resumen */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <p className="font-black text-slate-600 uppercase tracking-wider text-[10px] mb-2">Resumen de cotización</p>
              <div className="flex justify-between"><span className="text-slate-400">Cliente</span><span className="font-bold">{form.cliente}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Empresa</span><span className="font-bold">{form.empresa}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Servicio</span><span className="font-bold">{form.tipo}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Partidas</span><span className="font-bold">{form.partidas.length}</span></div>
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-500">TOTAL</span>
                <span className="font-black text-emerald-600 text-sm">{fmtPeso(total)}</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
            >
              <CheckCircle2 size={16} /> Crear Cotización
            </button>
          </div>
          <Warning>Solo Administradores pueden editar o eliminar cotizaciones una vez guardadas.</Warning>
        </div>
      )}

      <NavButtons
        step={step} total={TOTAL}
        onPrev={() => setStep(s => s - 1)}
        onNext={() => setStep(s => s + 1)}
        onReset={reset}
        color="bg-emerald-500"
        canNext={canNext}
        nextLabel={step === 2 ? 'Revisar y guardar' : 'Siguiente'}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────
   SIMULADOR 2: ANUNCIOS
───────────────────────────────────────────── */
const TutorialAnuncios = () => {
  const TOTAL = 4;
  const init = {
    titulo: '', descripcion: '', modo: 'estandar',
    imageUrl: '', linkClic: '', vencimiento: '', publicar: false,
  };
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(init);
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  const reset = () => { setStep(0); setForm(init); setPreview(false); setSaved(false); };

  const canNext = [
    true,
    form.modo === 'solo_imagen' ? form.imageUrl.trim().length > 5 : (form.titulo.trim().length >= 2),
    form.vencimiento.trim().length > 0,
    true,
  ][step];

  const handleSave = () => { setSaved(true); setTimeout(() => setStep(4), 800); };

  if (step === 4 && saved) return (
    <div className="flex flex-col items-center py-10 gap-4">
      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
        <CheckCircle2 size={36} className="text-indigo-500" />
      </div>
      <h3 className="text-lg font-black text-slate-800">¡Anuncio Publicado!</h3>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 w-full max-w-sm text-xs space-y-2">
        <div className="flex justify-between"><span className="text-slate-500">Modo</span><Chip color="indigo">{form.modo === 'solo_imagen' ? 'Solo imagen' : 'Estándar'}</Chip></div>
        {form.titulo && <div className="flex justify-between"><span className="text-slate-500">Título</span><span className="font-bold">{form.titulo}</span></div>}
        <div className="flex justify-between"><span className="text-slate-500">Vence</span><span className="font-bold">{form.vencimiento}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Publicado</span><Chip color="emerald">Sí</Chip></div>
      </div>
      <p className="text-xs text-slate-400 text-center max-w-xs">El pop-up ya es visible en el portal para los usuarios. Se desactivará automáticamente al vencer.</p>
      <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-all">
        <RotateCcw size={13} /> Practicar de nuevo
      </button>
    </div>
  );

  return (
    <div>
      <StepBar current={step} total={TOTAL} color="bg-indigo-500" />

      {step === 0 && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
            <h3 className="font-black text-indigo-800 text-sm mb-2 flex items-center gap-2">
              <BookOpen size={15} /> ¿Qué son los Anuncios / Pop-ups?
            </h3>
            <p className="text-indigo-700 text-xs leading-relaxed">
              Los anuncios aparecen como ventanas emergentes en el portal. Puedes mostrar texto con imagen (<strong>Modo Estándar</strong>) o un flyer promocional completo (<strong>Modo Solo Imagen</strong>) con un contador de cuenta atrás automático.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-xl p-4 text-center bg-white hover:border-indigo-200 transition-all cursor-default">
              <div className="text-2xl mb-2">📢</div>
              <p className="text-xs font-bold text-slate-700">Modo Estándar</p>
              <p className="text-[10px] text-slate-400 mt-1">Título + texto + imagen opcional</p>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 text-center bg-white hover:border-indigo-200 transition-all cursor-default">
              <div className="text-2xl mb-2">🖼️</div>
              <p className="text-xs font-bold text-slate-700">Modo Solo Imagen</p>
              <p className="text-[10px] text-slate-400 mt-1">Flyer grande con contador abajo</p>
            </div>
          </div>
          <div className="text-center pt-2">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100">
              <Plus size={14} /> + Nuevo Anuncio
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider mb-1">Modo de visualización</h3>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: 'estandar', label: 'Estándar', icon: '📢' }, { v: 'solo_imagen', label: 'Solo Imagen', icon: '🖼️' }].map(m => (
                <button
                  key={m.v}
                  onClick={() => setForm(f => ({ ...f, modo: m.v }))}
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-bold transition-all ${
                    form.modo === m.v ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl">{m.icon}</span> {m.label}
                </button>
              ))}
            </div>

            {form.modo === 'estandar' && (
              <div className="space-y-2 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Título del anuncio *</label>
                  <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                    placeholder="Ej. ¡Oferta especial de verano!" className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Descripción</label>
                  <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Breve descripción del anuncio..." rows={2}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white resize-none" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">URL de imagen (opcional)</label>
                  <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://ejemplo.com/imagen.jpg" className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white" />
                </div>
              </div>
            )}

            {form.modo === 'solo_imagen' && (
              <div className="space-y-2 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">URL del flyer / imagen *</label>
                  <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://ejemplo.com/mi-flyer.jpg" className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white" />
                </div>
                <Tip>El contador de tiempo se mostrará debajo de la imagen, sin tapar el contenido del flyer.</Tip>
              </div>
            )}
          </div>
          {!canNext && <Warning>Completa los campos obligatorios (*) para continuar.</Warning>}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider mb-1">Vigencia y configuración</h3>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Fecha de vencimiento *</label>
              <input type="date" value={form.vencimiento} onChange={e => setForm(f => ({ ...f, vencimiento: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Link de clic (opcional)</label>
              <input value={form.linkClic} onChange={e => setForm(f => ({ ...f, linkClic: e.target.value }))}
                placeholder="https://wa.me/52..." className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white" />
              <p className="text-[10px] text-slate-400 mt-1">Al hacer clic en el pop-up, el usuario será redirigido a esta URL.</p>
            </div>
          </div>
          <Warning>La fecha de vencimiento es obligatoria. Al llegar esa fecha, el anuncio se desactivará automáticamente.</Warning>
          {!canNext && <div className="text-xs text-rose-500 font-semibold text-center">Selecciona una fecha de vencimiento para continuar.</div>}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider">Vista previa y publicación</h3>

            {/* Mini preview del popup */}
            <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-4 bg-indigo-50/30">
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-3 text-center">Vista previa del pop-up</p>
              {form.modo === 'estandar' ? (
                <div className="bg-white rounded-xl shadow-lg p-4 max-w-xs mx-auto">
                  {form.imageUrl && <img src={form.imageUrl} alt="preview" className="rounded-lg w-full h-28 object-cover mb-3" onError={e => { e.target.style.display='none'; }} />}
                  <p className="font-black text-slate-800 text-sm">{form.titulo || 'Título del anuncio'}</p>
                  {form.descripcion && <p className="text-xs text-slate-500 mt-1">{form.descripcion}</p>}
                  <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock size={10} /> Vence: {form.vencimiento || '---'}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-xs mx-auto">
                  {form.imageUrl
                    ? <img src={form.imageUrl} alt="flyer" className="w-full object-cover" onError={e => { e.target.style.display='none'; }} />
                    : <div className="h-32 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">Tu imagen aquí</div>
                  }
                  <div className="bg-slate-900 text-white text-center py-2 text-xs font-bold">
                    ⏳ Cuenta atrás activa...
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-xs font-bold text-slate-700">Publicar ahora</span>
              <button
                onClick={() => setForm(f => ({ ...f, publicar: !f.publicar }))}
                className={`w-12 h-6 rounded-full transition-all relative ${form.publicar ? 'bg-indigo-500' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.publicar ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100">
              <Send size={15} /> Guardar y publicar
            </button>
          </div>
        </div>
      )}

      <NavButtons step={step} total={TOTAL} onPrev={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)}
        onReset={reset} color="bg-indigo-500" canNext={canNext} />
    </div>
  );
};

/* ─────────────────────────────────────────────
   SIMULADOR 3: TAREAS
───────────────────────────────────────────── */
const TutorialTareas = () => {
  const TOTAL = 3;
  const init = { titulo: '', descripcion: '', responsable: '', prioridad: 'media', fecha: '', estado: 'pendiente' };
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(init);
  const [saved, setSaved] = useState(false);
  const [estadoActual, setEstadoActual] = useState('pendiente');

  const reset = () => { setStep(0); setForm(init); setSaved(false); setEstadoActual('pendiente'); };

  const canNext = [
    true,
    form.titulo.trim().length >= 2 && form.responsable.trim().length >= 2,
    form.fecha.trim().length > 0,
  ][step] ?? true;

  const priorityMap = {
    baja: { label: 'Baja', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    media: { label: 'Media', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    alta: { label: 'Alta', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  };
  const estadoMap = {
    pendiente: { label: 'Pendiente', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    en_desarrollo: { label: 'En desarrollo', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    completado: { label: 'Completado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  };

  if (step === 3) return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-violet-500 mb-3">Tu tarea en el tablero</p>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-black text-slate-800 text-sm">{form.titulo}</p>
              <p className="text-xs text-slate-400 mt-0.5">{form.descripcion || 'Sin descripción'}</p>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${priorityMap[form.prioridad].color}`}>
              {priorityMap[form.prioridad].label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 mb-4">
            <span className="flex items-center gap-1"><User size={10} /> {form.responsable}</span>
            <span className="flex items-center gap-1"><Calendar size={10} /> {form.fecha}</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 mb-2">Actualizar estado:</p>
            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(estadoMap).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setEstadoActual(k)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all ${estadoActual === k ? v.color + ' shadow-sm' : 'bg-white text-slate-300 border-slate-200 hover:border-slate-300'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          {estadoActual === 'completado' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 rounded-xl p-2.5">
              <CheckCircle2 size={14} /> ¡Tarea completada! Ya no aparece en tareas pendientes.
            </div>
          )}
        </div>
      </div>
      <Tip>Marca la tarea como "Completado" cuando termines para mantener limpio el tablero del equipo.</Tip>
      <div className="text-center pt-2">
        <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 text-white text-xs font-bold hover:bg-violet-600 transition-all mx-auto">
          <RotateCcw size={13} /> Practicar de nuevo
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <StepBar current={step} total={TOTAL} color="bg-violet-500" />

      {step === 0 && (
        <div className="space-y-4">
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
            <h3 className="font-black text-violet-800 text-sm mb-2 flex items-center gap-2">
              <BookOpen size={15} /> ¿Qué son las Tareas?
            </h3>
            <p className="text-violet-700 text-xs leading-relaxed">
              Las tareas organizan el trabajo diario del equipo. Puedes asignarlas a miembros del personal, definir prioridades y fechas límite, y llevar seguimiento del avance desde <strong>Pendiente</strong> → <strong>En desarrollo</strong> → <strong>Completado</strong>.
            </p>
          </div>
          <div className="text-center pt-2">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 text-white text-xs font-bold hover:bg-violet-600 transition-all shadow-lg shadow-violet-100">
              <Plus size={14} /> + Nueva Tarea
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider mb-1">Datos de la tarea</h3>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Título *</label>
              <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ej. Enviar informe mensual de calidad" className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all bg-white" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Detalles de la tarea..." rows={2}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all bg-white resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Responsable *</label>
                <input value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
                  placeholder="Nombre del colaborador" className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all bg-white" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Prioridad</label>
                <select value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all bg-white">
                  <option value="baja">🟢 Baja</option>
                  <option value="media">🟡 Media</option>
                  <option value="alta">🔴 Alta</option>
                </select>
              </div>
            </div>
          </div>
          <Tip>Elige la prioridad correcta para ayudar al equipo a enfocarse en lo más urgente primero.</Tip>
          {!canNext && <Warning>Completa el título y el responsable para continuar.</Warning>}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider">Fecha límite y guardar</h3>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Fecha de entrega *</label>
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all bg-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-1.5">
              <p className="font-black text-slate-600 uppercase tracking-wider text-[10px] mb-2">Resumen de tarea</p>
              <div className="flex justify-between"><span className="text-slate-400">Título</span><span className="font-bold">{form.titulo}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Responsable</span><span className="font-bold">{form.responsable}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Prioridad</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityMap[form.prioridad].color}`}>{priorityMap[form.prioridad].label}</span>
              </div>
              <div className="flex justify-between"><span className="text-slate-400">Vencimiento</span><span className="font-bold">{form.fecha || '---'}</span></div>
            </div>
            <button onClick={() => setStep(3)} disabled={!form.fecha}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-sm transition-all ${form.fecha ? 'bg-violet-500 hover:bg-violet-600 shadow-lg shadow-violet-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              <CheckCircle2 size={16} /> Crear Tarea
            </button>
          </div>
          <Warning>Las tareas vencidas se resaltan automáticamente en rojo en el tablero.</Warning>
        </div>
      )}

      {step < 3 && (
        <NavButtons step={step} total={TOTAL} onPrev={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)}
          onReset={reset} color="bg-violet-500" canNext={canNext} />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   SIMULADOR 4: ENCUESTAS
───────────────────────────────────────────── */
const TutorialEncuestas = () => {
  const TOTAL = 4;
  const initPregunta = { texto: '', tipo: 'abierta', opciones: '', activa: true };
  const [step, setStep] = useState(0);
  const [pregunta, setPregunta] = useState(initPregunta);
  const [preguntas, setPreguntas] = useState([]);
  const [clienteNombre, setClienteNombre] = useState('');
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [addedTip, setAddedTip] = useState(false);

  const reset = () => {
    setStep(0); setPregunta(initPregunta); setPreguntas([]);
    setClienteNombre(''); setCodigoGenerado(''); setAddedTip(false);
  };

  const canNext = [
    true,
    pregunta.texto.trim().length >= 5 || preguntas.length > 0,
    true,
    clienteNombre.trim().length >= 2,
  ][step] ?? true;

  const addPregunta = () => {
    if (!pregunta.texto.trim()) return;
    setPreguntas(p => [...p, { ...pregunta, id: Date.now() }]);
    setPregunta(initPregunta);
    setAddedTip(true);
    setTimeout(() => setAddedTip(false), 1500);
  };

  const generateCode = () => {
    const code = 'ENC-' + Math.random().toString(36).toUpperCase().slice(2, 7);
    setCodigoGenerado(code);
  };

  return (
    <div>
      <StepBar current={step} total={TOTAL} color="bg-amber-500" />

      {step === 0 && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <h3 className="font-black text-amber-800 text-sm mb-2 flex items-center gap-2">
              <BookOpen size={15} /> ¿Qué son las Encuestas?
            </h3>
            <p className="text-amber-700 text-xs leading-relaxed">
              El módulo de encuestas recopila retroalimentación de tus clientes y del público general. Tú configuras las preguntas, generas códigos únicos para cada cliente y analizas los resultados desde el dashboard.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[{ icon: '📝', label: 'Configura preguntas' }, { icon: '🔑', label: 'Genera códigos' }, { icon: '📊', label: 'Analiza resultados' }].map((c, i) => (
              <div key={i} className="border border-slate-200 bg-white rounded-xl p-3">
                <div className="text-xl mb-1">{c.icon}</div>
                <p className="text-[10px] font-bold text-slate-600">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="text-center pt-2">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-100">
              <Plus size={14} /> Comenzar configuración
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider mb-1">Añadir pregunta</h3>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Texto de la pregunta *</label>
              <input value={pregunta.texto} onChange={e => setPregunta(p => ({ ...p, texto: e.target.value }))}
                placeholder="Ej. ¿Cómo calificarías nuestro servicio?" className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Tipo</label>
                <select value={pregunta.tipo} onChange={e => setPregunta(p => ({ ...p, tipo: e.target.value }))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-400 outline-none transition-all bg-white">
                  <option value="abierta">Respuesta abierta</option>
                  <option value="multiple">Opción múltiple</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">¿Activa?</label>
                <button onClick={() => setPregunta(p => ({ ...p, activa: !p.activa }))}
                  className={`mt-0.5 w-12 h-6 rounded-full transition-all relative self-start ${pregunta.activa ? 'bg-amber-400' : 'bg-slate-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${pregunta.activa ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            {pregunta.tipo === 'multiple' && (
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Opciones (separadas por comas)</label>
                <input value={pregunta.opciones} onChange={e => setPregunta(p => ({ ...p, opciones: e.target.value }))}
                  placeholder="Excelente, Bueno, Regular, Malo" className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all bg-white" />
              </div>
            )}
            <button onClick={addPregunta} disabled={!pregunta.texto.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all disabled:opacity-40">
              <Plus size={13} /> Agregar pregunta
            </button>
          </div>

          {preguntas.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Preguntas configuradas ({preguntas.length})</p>
              {preguntas.map((q, i) => (
                <div key={q.id} className={`flex items-start gap-2.5 bg-white border border-slate-200 rounded-xl px-3 py-2.5 transition-all ${addedTip && i === preguntas.length - 1 ? 'border-amber-300 bg-amber-50' : ''}`}>
                  <span className="text-amber-400 mt-0.5 font-black text-xs">Q{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{q.texto}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Chip color={q.activa ? 'amber' : 'slate'}>{q.activa ? 'Activa' : 'Inactiva'}</Chip>
                      <span className="text-[10px] text-slate-400">{q.tipo === 'multiple' ? 'Opción múltiple' : 'Abierta'}</span>
                    </div>
                  </div>
                  <button onClick={() => setPreguntas(p => p.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-400 transition-colors mt-0.5">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Tip>Solo las preguntas "Activas" se mostrarán en la encuesta del portal.</Tip>
          {!canNext && preguntas.length === 0 && <Warning>Agrega al menos una pregunta para continuar.</Warning>}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider">Generar código para cliente</h3>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Nombre del cliente *</label>
              <input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)}
                placeholder="Ej. Constructora Alfa S.A." className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all bg-white" />
            </div>
            <button onClick={generateCode} disabled={!clienteNombre.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all disabled:opacity-40">
              <Sparkles size={13} /> Generar código único
            </button>

            {codigoGenerado && (
              <div className="bg-white border-2 border-amber-300 rounded-xl p-4 text-center">
                <p className="text-[10px] text-slate-500 mb-1">Código generado para <strong>{clienteNombre}</strong>:</p>
                <p className="text-3xl font-black text-amber-600 tracking-widest">{codigoGenerado}</p>
                <p className="text-[10px] text-slate-400 mt-2">Copia este código y envíaselo al cliente por correo o WhatsApp. Solo puede usarse una vez.</p>
              </div>
            )}
          </div>
          <Tip>El público general puede responder sin código — el sistema asigna automáticamente un código "PUB-XXXXXX".</Tip>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider mb-4">Estadísticas de ejemplo</h3>
            <div className="space-y-4">
              {[
                { label: '¿Cómo calificarías nuestro servicio?', data: [{ opt: 'Excelente', pct: 64, color: 'bg-emerald-400' }, { opt: 'Bueno', pct: 27, color: 'bg-amber-400' }, { opt: 'Regular', pct: 9, color: 'bg-rose-400' }] },
                { label: '¿Recomendarías ECG Corporativo?', data: [{ opt: 'Sí', pct: 82, color: 'bg-emerald-400' }, { opt: 'No', pct: 18, color: 'bg-rose-400' }] },
              ].map((q, qi) => (
                <div key={qi}>
                  <p className="text-xs font-bold text-slate-700 mb-2">{q.label}</p>
                  <div className="space-y-1.5">
                    {q.data.map((d, di) => (
                      <div key={di} className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-16 shrink-0 text-right">{d.opt}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div className={`h-full ${d.color} rounded-full transition-all duration-1000`} style={{ width: `${d.pct}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 w-8 shrink-0">{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
            <p className="text-xs font-black text-amber-700 mb-1">¡Encuesta configurada con éxito!</p>
            <p className="text-[10px] text-amber-600 leading-relaxed">
              Tienes {preguntas.length > 0 ? preguntas.length : 2} preguntas activas, un código para <strong>{clienteNombre || 'el cliente'}</strong> y puedes ver las estadísticas en tiempo real desde aquí.
            </p>
          </div>
          <div className="text-center">
            <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all mx-auto">
              <RotateCcw size={13} /> Practicar de nuevo
            </button>
          </div>
        </div>
      )}

      {step < 3 && (
        <NavButtons step={step} total={TOTAL} onPrev={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)}
          onReset={reset} color="bg-amber-500" canNext={canNext} />
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

  const handleTab = (id) => { setActiveTab(id); setKey(k => k + 1); };

  const current = TABS.find(t => t.id === activeTab);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-200">
          <GraduationCap size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centro de Tutoriales Interactivos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Practica cada módulo como si lo usaras de verdad — sin guardar datos reales</p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-3 rounded-2xl text-xs font-black transition-all border ${
                active
                  ? `${tab.activeBg} text-white border-transparent shadow-lg`
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <span className={active ? 'text-white' : tab.accent}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        {/* Banner */}
        <div className={`bg-gradient-to-r ${current.gradient} px-7 py-6 text-white relative overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">{current.icon}</div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Simulador interactivo</span>
                <h2 className="text-base font-black mt-0.5">Tutorial: {current.label}</h2>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5">
              <PlayCircle size={13} className="text-white/80" />
              <span className="text-[10px] font-bold text-white/90">Modo práctica</span>
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

      {/* Footer note */}
      <p className="text-center text-[11px] text-slate-400 mt-5 flex items-center justify-center gap-1.5">
        <Info size={12} /> Los datos ingresados en este simulador no se guardan en la base de datos real.
      </p>
    </div>
  );
};

export default TutorialesSection;
