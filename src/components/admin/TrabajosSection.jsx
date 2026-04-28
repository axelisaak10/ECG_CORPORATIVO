import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Hammer, Paintbrush, Wrench, Sparkles, CheckCircle2,
  Clock, Plus, X, AlertTriangle, ChevronRight,
  ClipboardList, Copy, Check, Loader2, User, Settings,
  ChevronUp, ChevronDown, Trash2, Save, Package, Zap,
  Star, Shield, Truck,
} from 'lucide-react';
import { authHeaders } from '../../utils/api';

// ── Defaults y mapas ─────────────────────────────────────────────────────────
const DEFAULT_ETAPAS = [
  { value: 'recibido',    label: 'Recibido',    color: '#94a3b8', bg: '#f1f5f9', icon_name: 'Clock'        },
  { value: 'armado',      label: 'Armado',      color: '#3b82f6', bg: '#eff6ff', icon_name: 'Hammer'       },
  { value: 'pintura',     label: 'Pintura',     color: '#f59e0b', bg: '#fffbeb', icon_name: 'Paintbrush'   },
  { value: 'instalacion', label: 'Instalación', color: '#f97316', bg: '#fff7ed', icon_name: 'Wrench'       },
  { value: 'detallado',   label: 'Detallado',   color: '#8b5cf6', bg: '#f5f3ff', icon_name: 'Sparkles'     },
  { value: 'completado',  label: 'Completado',  color: '#10b981', bg: '#f0fdf4', icon_name: 'CheckCircle2' },
];

const ICON_MAP = { Clock, Hammer, Paintbrush, Wrench, Sparkles, CheckCircle2, Settings, Package, Zap, Star, Shield, Truck };
const ICON_OPTS = Object.entries(ICON_MAP).map(([name, Icon]) => ({ name, Icon }));
const COLOR_OPTS = [
  { color: '#94a3b8', bg: '#f1f5f9' }, { color: '#3b82f6', bg: '#eff6ff' },
  { color: '#f59e0b', bg: '#fffbeb' }, { color: '#f97316', bg: '#fff7ed' },
  { color: '#8b5cf6', bg: '#f5f3ff' }, { color: '#10b981', bg: '#f0fdf4' },
  { color: '#ef4444', bg: '#fef2f2' }, { color: '#ec4899', bg: '#fdf2f8' },
  { color: '#06b6d4', bg: '#ecfeff' }, { color: '#84cc16', bg: '#f7fee7' },
  { color: '#6366f1', bg: '#eef2ff' }, { color: '#14b8a6', bg: '#f0fdfa' },
];

const getIcon = (name) => ICON_MAP[name] ?? Clock;
const getEtapaFrom = (etapas, v) => etapas.find(e => e.value === v) ?? etapas[0] ?? DEFAULT_ETAPAS[0];
const makeSlug = (label, existing) => {
  const base = label.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'etapa';
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base}_${n}`)) n++;
  return `${base}_${n}`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
};
const fmtDateShort = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

// ── Stepper ──────────────────────────────────────────────────────────────────
const Stepper = ({ etapaActual, onStepClick, selectedEtapa, etapas }) => {
  const idx = etapas.findIndex(e => e.value === etapaActual);
  const editable = !!onStepClick;
  return (
    <div className="flex items-center w-full">
      {etapas.map((e, i) => {
        const done = i < idx, current = i === idx;
        const selected = editable && e.value === selectedEtapa;
        const IconComp = getIcon(e.icon_name);
        return (
          <div key={e.value} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                onClick={() => onStepClick?.(e.value)}
                title={editable ? `Ir a: ${e.label}` : undefined}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all
                  ${current ? 'ring-2 ring-offset-1' : ''}
                  ${selected ? 'ring-2 ring-offset-2 scale-110 shadow-md' : ''}
                  ${editable ? 'cursor-pointer hover:scale-110 hover:shadow-md' : ''}`}
                style={{ background: done || current ? e.color : '#e2e8f0' }}>
                {done
                  ? <Check size={12} className="text-white" strokeWidth={3} />
                  : <IconComp size={12} className={done || current ? 'text-white' : 'text-slate-400'} />}
              </div>
              <span className={`text-[9px] font-bold mt-0.5 whitespace-nowrap transition-colors
                ${selected ? 'text-slate-900' : current ? 'text-slate-700' : done ? 'text-slate-400' : 'text-slate-300'}
                ${editable ? 'cursor-pointer' : ''}`}>
                {e.label}
              </span>
            </div>
            {i < etapas.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < idx ? 'bg-green-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── TrabajoCard ──────────────────────────────────────────────────────────────
const TrabajoCard = ({ trabajo, onClick, etapas }) => {
  const etapa = getEtapaFrom(etapas, trabajo.etapa_actual);
  const [copied, setCopied] = useState(false);
  const copyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(trabajo.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div onClick={onClick}
      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-extrabold text-slate-800 truncate text-sm">{trabajo.cliente}</p>
          {trabajo.folio && <p className="text-[11px] text-slate-400 font-medium mt-0.5">Folio: {trabajo.folio}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl"
            style={{ background: etapa.bg, color: etapa.color }}>
            {trabajo.codigo}
          </span>
          <button onClick={copyCode}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
            {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
          </button>
        </div>
      </div>
      <div className="mb-4 overflow-x-auto">
        <Stepper etapaActual={trabajo.etapa_actual} etapas={etapas} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-medium">Iniciado {fmtDateShort(trabajo.created_at)}</span>
        <span className="text-[10px] font-bold text-blue-500 group-hover:underline flex items-center gap-0.5">
          Ver detalle <ChevronRight size={11} />
        </span>
      </div>
    </div>
  );
};

// ── Form helpers ─────────────────────────────────────────────────────────────
const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-slate-300';
const FL = ({ label, req, children }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
      {label}{req && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

// ── EtapasModal ──────────────────────────────────────────────────────────────
const EtapasModal = ({ etapas, onClose, onSaved }) => {
  const [rows, setRows] = useState(() => etapas.map(e => ({ ...e })));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [colorOpen, setColorOpen] = useState(null);
  const [iconOpen, setIconOpen] = useState(null);

  const updateRow = (i, patch) => setRows(prev => prev.map((r, ri) => ri === i ? { ...r, ...patch } : r));

  const addRow = () => {
    const existing = rows.map(r => r.value);
    setRows(prev => [...prev, {
      _new: true,
      value: makeSlug('nueva', existing),
      label: 'Nueva Etapa',
      color: '#94a3b8', bg: '#f1f5f9', icon_name: 'Clock',
      orden: prev.length,
    }]);
  };

  const deleteRow = (i) => {
    setRows(prev => prev.map((r, ri) => ri === i ? { ...r, _deleted: true } : r));
    if (colorOpen === i) setColorOpen(null);
    if (iconOpen === i) setIconOpen(null);
  };

  const moveUp = (vi) => {
    const vis = rows.map((r, i) => ({ r, i })).filter(x => !x.r._deleted);
    if (vi === 0) return;
    const a = vis[vi].i, b = vis[vi - 1].i;
    setRows(prev => { const n = [...prev]; [n[a], n[b]] = [n[b], n[a]]; return n; });
    if (colorOpen === vi) setColorOpen(vi - 1);
    if (iconOpen === vi) setIconOpen(vi - 1);
  };

  const moveDown = (vi) => {
    const vis = rows.map((r, i) => ({ r, i })).filter(x => !x.r._deleted);
    if (vi === vis.length - 1) return;
    const a = vis[vi].i, b = vis[vi + 1].i;
    setRows(prev => { const n = [...prev]; [n[a], n[b]] = [n[b], n[a]]; return n; });
    if (colorOpen === vi) setColorOpen(vi + 1);
    if (iconOpen === vi) setIconOpen(vi + 1);
  };

  const handleSave = async () => {
    const visible = rows.filter(r => !r._deleted);
    if (visible.some(r => !r.label?.trim())) { setErr('Todas las etapas deben tener un nombre.'); return; }
    setSaving(true); setErr('');
    try {
      for (const r of rows.filter(r => r._deleted && r.id)) {
        const res = await fetch(`/api/catalogo?r=etapas&id=${r.id}`, { method: 'DELETE', headers: authHeaders() });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error al eliminar.'); }
      }
      for (const r of visible.filter(r => r._new)) {
        const res = await fetch('/api/catalogo?r=etapas', {
          method: 'POST', headers: authHeaders(),
          body: JSON.stringify({ value: r.value, label: r.label.trim(), color: r.color, bg: r.bg, icon_name: r.icon_name, orden: visible.indexOf(r) }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error al crear.'); }
      }
      for (const r of visible.filter(r => r.id && !r._new)) {
        const res = await fetch(`/api/catalogo?r=etapas&id=${r.id}`, {
          method: 'PUT', headers: authHeaders(),
          body: JSON.stringify({ label: r.label.trim(), color: r.color, bg: r.bg, icon_name: r.icon_name, orden: visible.indexOf(r) }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error al actualizar.'); }
      }
      const res = await fetch('/api/catalogo?r=etapas');
      const d = await res.json();
      onSaved(d.etapas?.length ? d.etapas : DEFAULT_ETAPAS);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const visible = rows.map((r, i) => ({ r, i })).filter(x => !x.r._deleted);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col z-10">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-slate-500" />
            <h2 className="font-extrabold text-slate-800">Configurar Etapas</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Guardar
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={16} className="text-slate-500" />
            </button>
          </div>
        </div>

        {err && (
          <div className="mx-6 mt-3 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-3 py-2 text-xs font-semibold flex-shrink-0">
            <AlertTriangle size={13} /> {err}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {visible.map(({ r, i }, vi) => {
            const IconComp = getIcon(r.icon_name);
            return (
              <div key={r.id ?? r.value} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <button
                    onClick={() => { setColorOpen(p => p === vi ? null : vi); setIconOpen(null); }}
                    className="w-7 h-7 rounded-full flex-shrink-0 shadow-sm ring-2 ring-white hover:ring-slate-300 transition-all"
                    style={{ background: r.color }} title="Cambiar color" />

                  <button
                    onClick={() => { setIconOpen(p => p === vi ? null : vi); setColorOpen(null); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 hover:opacity-75 transition-all"
                    style={{ background: r.bg }} title="Cambiar ícono">
                    <IconComp size={13} style={{ color: r.color }} />
                  </button>

                  <input value={r.label}
                    onChange={e => updateRow(i, { label: e.target.value })}
                    className="flex-1 bg-transparent text-sm font-bold text-slate-800 focus:outline-none min-w-0 placeholder-slate-300"
                    placeholder="Nombre de etapa" />

                  <button onClick={() => moveUp(vi)} disabled={vi === 0}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 transition-all">
                    <ChevronUp size={13} className="text-slate-500" />
                  </button>
                  <button onClick={() => moveDown(vi)} disabled={vi === visible.length - 1}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 transition-all">
                    <ChevronDown size={13} className="text-slate-500" />
                  </button>
                  <button onClick={() => deleteRow(i)}
                    className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>

                {colorOpen === vi && (
                  <div className="px-3 pb-3 pt-2 grid grid-cols-6 gap-1.5 border-t border-slate-100">
                    {COLOR_OPTS.map(c => (
                      <button key={c.color}
                        onClick={() => { updateRow(i, { color: c.color, bg: c.bg }); setColorOpen(null); }}
                        className={`w-7 h-7 rounded-full hover:scale-110 transition-all ${r.color === c.color ? 'ring-2 ring-offset-1 ring-slate-600' : ''}`}
                        style={{ background: c.color }} />
                    ))}
                  </div>
                )}

                {iconOpen === vi && (
                  <div className="px-3 pb-3 pt-2 grid grid-cols-6 gap-1.5 border-t border-slate-100">
                    {ICON_OPTS.map(({ name, Icon }) => (
                      <button key={name}
                        onClick={() => { updateRow(i, { icon_name: name }); setIconOpen(null); }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-all ${r.icon_name === name ? 'bg-slate-200 ring-2 ring-blue-400' : ''}`}>
                        <Icon size={15} className="text-slate-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button onClick={addRow}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 font-bold hover:border-blue-300 hover:text-blue-500 transition-all">
            <Plus size={14} /> Agregar etapa
          </button>
        </div>
      </div>
    </div>
  );
};

// ── DetallePanel ─────────────────────────────────────────────────────────────
const DetallePanel = ({ trabajo, currentUser, onClose, onUpdated, etapas }) => {
  const etapa = getEtapaFrom(etapas, trabajo.etapa_actual);
  const [form, setForm] = useState({ etapa: trabajo.etapa_actual, descripcion: '', inconveniente: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const descRef = useRef(null);
  const formRef = useRef(null);

  const handleStepClick = (etapaValue) => {
    setForm(f => ({ ...f, etapa: etapaValue }));
    setErr('');
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      descRef.current?.focus();
    }, 50);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(trabajo.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descripcion.trim()) { setErr('La descripción es requerida.'); return; }
    setSaving(true); setErr('');
    try {
      const res = await fetch(`/api/trabajos/${trabajo.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          etapa: form.etapa,
          descripcion: form.descripcion,
          inconveniente: form.inconveniente,
          usuario_nombre: currentUser.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar.');
      onUpdated(data.trabajo, data.actualizacion);
      setForm(f => ({ ...f, descripcion: '', inconveniente: '' }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const acts = useMemo(() =>
    [...(trabajo.trabajo_actualizaciones || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [trabajo.trabajo_actualizaciones]
  );

  return (
    <div className="fixed inset-0 z-[400] flex">
      <div className="flex-1 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full md:w-[520px] bg-white shadow-2xl flex flex-col overflow-hidden border-l border-slate-100">

        <div className="px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trabajo</p>
              <h3 className="font-extrabold text-slate-800 text-lg leading-tight mt-0.5">{trabajo.cliente}</h3>
              {trabajo.folio && <p className="text-xs text-slate-400 mt-0.5">Folio: {trabajo.folio}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 flex-shrink-0">
              <X size={16} className="text-slate-500" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-dashed"
              style={{ borderColor: etapa.color + '60', background: etapa.bg }}>
              <span className="font-mono font-black text-sm tracking-widest" style={{ color: etapa.color }}>
                {trabajo.codigo}
              </span>
              <button onClick={copyCode} style={{ color: etapa.color }}>
                {copied ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
              </button>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl"
              style={{ background: etapa.bg, color: etapa.color }}>
              {etapa.label}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <Stepper
              etapaActual={trabajo.etapa_actual}
              onStepClick={handleStepClick}
              selectedEtapa={form.etapa}
              etapas={etapas}
            />
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-1.5">
            Haz clic en una etapa para seleccionarla
          </p>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 border-b border-slate-50 space-y-3 flex-shrink-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registrar avance</p>
            {err && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-3 py-2 text-xs font-semibold">
                <AlertTriangle size={13} /> {err}
              </div>
            )}
            <FL label="Etapa actual" req>
              <select value={form.etapa} onChange={e => setForm(f => ({ ...f, etapa: e.target.value }))} className={inputCls}>
                {etapas.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </FL>
            <FL label="Descripción del avance" req>
              <textarea ref={descRef} value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                rows={2} placeholder="¿Qué se realizó en esta etapa?" className={inputCls + ' resize-none'} />
            </FL>
            <FL label="Inconveniente o atraso">
              <textarea value={form.inconveniente}
                onChange={e => setForm(f => ({ ...f, inconveniente: e.target.value }))}
                rows={2} placeholder="¿Hubo algún problema? (opcional)" className={inputCls + ' resize-none'} />
            </FL>
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando…</> : <><Plus size={14} /> Registrar avance</>}
            </button>
          </form>

          <div className="px-6 py-5 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Historial</p>
            {acts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin actualizaciones aún.</p>
            ) : (
              acts.map((a, i) => {
                const ae = getEtapaFrom(etapas, a.etapa);
                const AeIcon = getIcon(ae.icon_name);
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: ae.bg }}>
                        <AeIcon size={13} style={{ color: ae.color }} />
                      </div>
                      {i < acts.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black" style={{ color: ae.color }}>{ae.label}</span>
                        <span className="text-[10px] text-slate-400">{fmtDate(a.created_at)}</span>
                      </div>
                      {a.usuario_nombre && (
                        <div className="flex items-center gap-1 mb-1">
                          <User size={10} className="text-slate-300" />
                          <span className="text-[10px] text-slate-400 font-medium">{a.usuario_nombre}</span>
                        </div>
                      )}
                      {a.descripcion && <p className="text-sm text-slate-600 leading-relaxed">{a.descripcion}</p>}
                      {a.inconveniente && (
                        <div className="mt-1.5 flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                          <AlertTriangle size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 font-medium">{a.inconveniente}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── TrabajosSection ──────────────────────────────────────────────────────────
const TrabajosSection = ({ currentUser }) => {
  const [trabajos, setTrabajos]     = useState([]);
  const [etapas, setEtapas]         = useState(DEFAULT_ETAPAS);
  const [loading, setLoading]       = useState(true);
  const [apiError, setApiError]     = useState('');
  const [filtroEtapa, setFiltro]    = useState('todos');
  const [detalle, setDetalle]       = useState(null);
  const [showEtapas, setShowEtapas] = useState(false);
  const isAdmin = currentUser.nivel >= 2;

  const fetchEtapas = useCallback(async () => {
    try {
      const res = await fetch('/api/catalogo?r=etapas');
      const data = await res.json();
      if (res.ok && data.etapas?.length) setEtapas(data.etapas);
    } catch {}
  }, []);

  const fetchTrabajos = useCallback(async () => {
    setLoading(true); setApiError('');
    try {
      const res = await fetch('/api/trabajos', { headers: authHeaders(false) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTrabajos(data.trabajos || []);
    } catch (e) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEtapas(); fetchTrabajos(); }, [fetchEtapas, fetchTrabajos]);

  const filtered = useMemo(() =>
    filtroEtapa === 'todos' ? trabajos : trabajos.filter(t => t.etapa_actual === filtroEtapa),
    [trabajos, filtroEtapa]
  );

  const counts = useMemo(() => {
    const c = { todos: trabajos.length };
    etapas.forEach(e => { c[e.value] = trabajos.filter(t => t.etapa_actual === e.value).length; });
    return c;
  }, [trabajos, etapas]);

  const handleUpdated = (updatedTrabajo, newAct) => {
    setTrabajos(prev => prev.map(t =>
      t.id === updatedTrabajo.id
        ? { ...updatedTrabajo, trabajo_actualizaciones: [...(t.trabajo_actualizaciones || []), newAct] }
        : t
    ));
    setDetalle(prev => prev
      ? { ...updatedTrabajo, trabajo_actualizaciones: [...(prev.trabajo_actualizaciones || []), newAct] }
      : null
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Trabajos en Proceso</h1>
          <p className="text-slate-500 text-sm mt-0.5">Seguimiento de trabajos activos por etapa</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 font-medium">{trabajos.length} trabajos</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-green-600 font-bold">{counts['completado'] || 0} completados</span>
          </div>
          {isAdmin && (
            <button onClick={() => setShowEtapas(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all">
              <Settings size={13} /> Etapas
            </button>
          )}
        </div>
      </div>

      {apiError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold mb-4">
          <AlertTriangle size={15} /> {apiError}
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFiltro('todos')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filtroEtapa === 'todos' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          Todos ({counts.todos})
        </button>
        {etapas.map(e => (
          <button key={e.value} onClick={() => setFiltro(e.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filtroEtapa === e.value ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            style={filtroEtapa === e.value ? { background: e.color } : {}}>
            {e.label} {counts[e.value] > 0 && `(${counts[e.value]})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3" />
          Cargando trabajos…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
          <ClipboardList size={40} className="text-slate-200" />
          <p className="font-medium">
            {filtroEtapa === 'todos'
              ? 'No hay trabajos registrados.'
              : `No hay trabajos en etapa "${getEtapaFrom(etapas, filtroEtapa).label}".`}
          </p>
          <p className="text-xs">Los trabajos se crean automáticamente al aprobar una cotización.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => (
            <TrabajoCard key={t.id} trabajo={t} onClick={() => setDetalle(t)} etapas={etapas} />
          ))}
        </div>
      )}

      {detalle && (
        <DetallePanel
          trabajo={detalle}
          currentUser={currentUser}
          onClose={() => setDetalle(null)}
          onUpdated={handleUpdated}
          etapas={etapas}
        />
      )}

      {showEtapas && (
        <EtapasModal
          etapas={etapas}
          onClose={() => setShowEtapas(false)}
          onSaved={(newEtapas) => { setEtapas(newEtapas); setShowEtapas(false); }}
        />
      )}
    </div>
  );
};

export default TrabajosSection;
