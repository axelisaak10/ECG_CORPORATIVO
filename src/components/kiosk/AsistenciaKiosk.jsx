import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, CheckCircle2, ArrowLeft,
  User, RefreshCw, Home, Wifi, WifiOff, AlertTriangle,
  Download, UploadCloud, Calendar, LogIn, LogOut,
  Share2, PlusSquare, MoreVertical, Smartphone, X, Check, Sparkles
} from 'lucide-react';
import { apiGetEmpleados } from '../../utils/api';
import {
  getAsistenciaDelDia,
  getPasesEmpleadoHoy,
  registrarPaseAsistencia,
  sincronizarPendientesConServidor,
  getPendientesSync,
  getHistorialLocal,
  getFechaLocal
} from '../../utils/asistenciaStorage';

export default function AsistenciaKiosk() {
  const navigate = useNavigate();

  // Detección de plataforma móvil (Android / iOS)
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '');
  const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent || '');

  // Estados de conectividad y PWA
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSync, setPendingSync] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  });
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installTab, setInstallTab] = useState(isIOS ? 'ios' : 'android');

  // Estados de datos
  const [empleados, setEmpleados] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(null);
  const [countdown, setCountdown] = useState(4);

  // Reloj en tiempo real
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Detector de conectividad en tiempo real (PWA Offline / Online)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sincronizar registros guardados en cache cuando vuelve el internet
      triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Evento PWA para instalar la app en pantalla completa en la tablet
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Conteo inicial de registros pendientes de sincronizar
    setPendingSync(getPendientesSync().length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Sincronización de registros acumulados
  const triggerSync = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      const res = await sincronizarPendientesConServidor();
      setPendingSync(res.pendingCount);
    } catch {
      // Ignorar fallas temporales de sincronización
    } finally {
      setIsSyncing(false);
    }
  };

  // Carga de empleados
  const loadEmpleados = async () => {
    setLoading(true);
    try {
      const emps = await apiGetEmpleados();
      setEmpleados(emps);
    } catch {
      // Fallback ya controlado
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmpleados();
    const count = getPendientesSync().length;
    setPendingSync(count);
    if (count > 0 && typeof navigator !== 'undefined' && navigator.onLine) {
      triggerSync();
    }
  }, []);

  // Manejo del contador regresivo para auto-reinicio tras registrar
  useEffect(() => {
    let interval = null;
    if (registroExitoso) {
      setCountdown(4);
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setRegistroExitoso(null);
            setSelectedWorker(null);
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [registroExitoso]);

  // Abrir modal o flujo nativo de instalación estilo Xbox Cloud Gaming
  const handleOpenInstallModal = async () => {
    if (installPrompt && !isIOS) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstallPrompt(null);
          setIsStandalone(true);
          return;
        }
      } catch {}
    }
    setInstallTab(isIOS ? 'ios' : 'android');
    setShowInstallModal(true);
  };

  const handleInstallPWA = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setIsStandalone(true);
        setShowInstallModal(false);
      }
    } catch {}
  };

  // Registrar asistencia (entrada o salida) con protección de duplicados diarios y soporte offline
  const handleRegistrar = async (tipo = 'entrada') => {
    if (!selectedWorker || submitting) return;
    setSubmitting(true);

    try {
      const resultado = await registrarPaseAsistencia({
        empleadoId: selectedWorker.id,
        empleadoNombre: selectedWorker.nombre,
        tipo
      });

      if (!resultado.success && resultado.alreadyRegistered) {
        const vocativo = selectedWorker.apodo || selectedWorker.nombre.split(' ')[0];
        if ('speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(`Atención ${vocativo}. Ya registraste tu ${tipo} el día de hoy.`);
            utter.lang = 'es-MX';
            window.speechSynthesis.speak(utter);
          } catch {}
        }
        alert(resultado.mensaje);
        return;
      }

      // Registro exitoso (en caché local o sincronizado online)
      setRegistroExitoso(resultado.registro);
      setPendingSync(getPendientesSync().length);

      // Reproducir confirmación por voz personalizada según si es entrada o salida
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const vocativo = selectedWorker.apodo || selectedWorker.nombre.split(' ')[0];
          const mensajeVoz = tipo === 'salida'
            ? `¡Salida registrada con éxito! Buen descanso, ${vocativo}.`
            : `¡Entrada registrada con éxito! Bienvenido, ${vocativo}.`;
          const utter = new SpeechSynthesisUtterance(mensajeVoz);
          utter.lang = 'es-MX';
          utter.rate = 0.95;
          window.speechSynthesis.speak(utter);
        } catch {}
      }
    } catch {
      alert('Hubo un inconveniente al registrar. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // VISTA 1: PANTALLA DE ÉXITO (Confirmación gigante tras registrar Entrada o Salida)
  // ─────────────────────────────────────────────────────────────────────────────
  if (registroExitoso) {
    const vocativo = selectedWorker?.apodo || selectedWorker?.nombre?.split(' ')[0] || 'COMPAÑERO';
    const esSalida = registroExitoso.tipo === 'salida';

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className={`w-full max-w-lg border-4 rounded-[2.5rem] p-8 text-center shadow-[0_0_60px_rgba(0,0,0,0.5)] animate-fadeIn ${esSalida ? 'bg-amber-950/40 border-amber-500 shadow-amber-900/30' : 'bg-emerald-950/40 border-emerald-500 shadow-emerald-900/30'}`}>
          
          <div className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center mb-4 shadow-xl border-4 border-white animate-bounce ${esSalida ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'}`}>
            {esSalida ? <LogOut size={56} strokeWidth={2.5} /> : <LogIn size={56} strokeWidth={2.5} />}
          </div>

          <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border mb-3 ${esSalida ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}>
            ¡{esSalida ? 'SALIDA' : 'ENTRADA'} REGISTRADA!
          </span>

          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            ¡HOLA, {vocativo.toUpperCase()}! 👋
          </h1>

          <p className="text-xl font-bold text-slate-200 mb-2">
            {esSalida ? 'Salida guardada a las' : 'Entrada guardada a las'} <span className={`font-mono text-2xl font-black ${esSalida ? 'text-amber-400' : 'text-emerald-400'}`}>{registroExitoso.hora}</span>
          </p>

          {!isOnline && (
            <p className="text-xs text-amber-300 font-semibold mb-4 bg-amber-500/20 py-1.5 px-3 rounded-xl border border-amber-500/30 inline-block">
              💾 Guardado seguro en la memoria de la tablet (se subirá al volver el internet)
            </p>
          )}

          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 my-4">
            <p className="text-xs text-slate-400 font-medium">
              Siguiente compañero en: <span className="text-emerald-400 font-mono font-black text-base">{countdown}s</span>
            </p>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 4) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => { setRegistroExitoso(null); setSelectedWorker(null); }}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-sm rounded-2xl transition-all"
          >
            Siguiente Trabajador
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VISTA 3: PANTALLA DE REGISTRO CON 2 BOTONES GRANDES (ENTRADA Y SALIDA)
  // ─────────────────────────────────────────────────────────────────────────────
  if (selectedWorker) {
    const { entrada: entradaHoy, salida: salidaHoy } = getPasesEmpleadoHoy(selectedWorker.id);
    const ambosRegistrados = !!entradaHoy && !!salidaHoy;
    const vocativo = selectedWorker.apodo || selectedWorker.nombre.split(' ')[0];

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 select-none font-sans">
        
        {/* Cabecera */}
        <header className="flex items-center justify-between pb-4 border-b border-slate-800 max-w-4xl mx-auto w-full">
          <button
            onClick={() => setSelectedWorker(null)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all shadow-md active:scale-95"
          >
            <ArrowLeft size={18} />
            <span>Cambiar de Compañero</span>
          </button>

          <div className="text-right">
            <div className="text-2xl font-black font-mono tracking-tight text-white">
              {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
            <div className="text-[11px] text-slate-400 font-bold uppercase">
              {currentTime.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
          </div>
        </header>

        {/* Cuerpo central */}
        <main className="flex-1 flex flex-col items-center justify-center my-6 max-w-xl mx-auto w-full text-center">
          
          {/* Foto circular gigante */}
          <div className="relative mb-5">
            <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden border-4 shadow-2xl bg-slate-800 mx-auto ${ambosRegistrados ? 'border-emerald-500' : 'border-blue-500'}`}>
              <img
                src={selectedWorker.foto_url || '/assets/logos/Corporativo.png'}
                alt={selectedWorker.nombre}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&crop=face';
                }}
              />
            </div>
            <span className={`absolute bottom-1 right-2 p-2 rounded-full shadow-xl border-4 border-slate-950 ${ambosRegistrados ? 'bg-emerald-500 text-slate-950' : 'bg-blue-500 text-white'}`}>
              <CheckCircle2 size={20} strokeWidth={3} />
            </span>
          </div>

          {/* Nombre y Puesto */}
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1 uppercase">
            {selectedWorker.apodo ? `${selectedWorker.apodo} (${selectedWorker.nombre})` : selectedWorker.nombre}
          </h2>
          <p className="text-sm sm:text-base font-bold text-blue-400 uppercase tracking-wider mb-6">
            {selectedWorker.puesto || 'Colaborador ECG'}
          </p>

          {/* DOS BOTONES GRANDES IGUALES: ENTRADA Y SALIDA */}
          <div className="w-full max-w-md space-y-4">
            
            {/* BOTÓN 1: REGISTRAR ENTRADA */}
            {entradaHoy ? (
              <div className="w-full py-5 px-6 rounded-3xl bg-emerald-950/40 border-2 border-emerald-500/60 text-emerald-300 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3 text-left">
                  <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    ✓
                  </span>
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">Entrada Registrada Hoy</div>
                    <div className="text-xl font-black font-mono text-white">{entradaHoy.hora}</div>
                  </div>
                </div>
                <span className="text-xs font-black bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/30">
                  GUARDADA
                </span>
              </div>
            ) : (
              <button
                onClick={() => handleRegistrar('entrada')}
                disabled={submitting}
                className="w-full py-5 px-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-white font-black text-xl sm:text-2xl tracking-wide shadow-[0_0_35px_rgba(16,185,129,0.35)] active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-emerald-300/60 disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw size={28} className="animate-spin" />
                ) : (
                  <>
                    <LogIn size={32} strokeWidth={3} className="flex-shrink-0 animate-bounce" />
                    <span>REGISTRAR ENTRADA</span>
                  </>
                )}
              </button>
            )}

            {/* BOTÓN 2: REGISTRAR SALIDA */}
            {salidaHoy ? (
              <div className="w-full py-5 px-6 rounded-3xl bg-amber-950/40 border-2 border-amber-500/60 text-amber-300 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3 text-left">
                  <span className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    ✓
                  </span>
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">Salida Registrada Hoy</div>
                    <div className="text-xl font-black font-mono text-white">{salidaHoy.hora}</div>
                  </div>
                </div>
                <span className="text-xs font-black bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/30">
                  GUARDADA
                </span>
              </div>
            ) : (
              <button
                onClick={() => handleRegistrar('salida')}
                disabled={submitting}
                className="w-full py-5 px-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xl sm:text-2xl tracking-wide shadow-[0_0_35px_rgba(245,158,11,0.35)] active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-amber-300/60 disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw size={28} className="animate-spin" />
                ) : (
                  <>
                    <LogOut size={32} strokeWidth={3} className="flex-shrink-0 animate-bounce" />
                    <span>REGISTRAR SALIDA</span>
                  </>
                )}
              </button>
            )}

          </div>

          <p className="text-xs text-slate-400 mt-5 font-semibold">
            👉 Presiona con tu dedo el botón correspondiente (Entrada por la mañana, Salida al terminar).
          </p>

        </main>

        {/* Pie */}
        <footer className="text-center text-xs text-slate-500 max-w-4xl mx-auto w-full pt-4 border-t border-slate-800">
          ECG Corporativo • Sistema PWA con Registro de Entrada y Salida
        </footer>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VISTA 4: SELECTOR DE FOTOS DE EMPLEADOS
  // ─────────────────────────────────────────────────────────────────────────────
  const historialCompleto = getHistorialLocal();
  const asistenciasHoyCount = historialCompleto.filter(h => h.fecha === getFechaLocal()).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 select-none font-sans">
      
      {/* Barra superior de la estación con estado PWA y Conectividad */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800 max-w-6xl mx-auto w-full">
        
        {/* Identidad ECG + Estado Online/Offline */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center font-black text-white text-base shadow-lg">
            ECG
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              RELOJ CHECADOR
              {!isStandalone && (
                <button
                  onClick={handleOpenInstallModal}
                  className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-black border border-blue-400/40 shadow-md shadow-blue-900/30 active:scale-95 transition-all flex items-center gap-1.5"
                  title="Instalar en Celular (Android / iPhone) como acceso directo"
                >
                  <Smartphone size={12} className="text-blue-200" />
                  <span>Instalar App</span>
                </button>
              )}
            </h1>
            
            <div className="flex items-center gap-2 mt-0.5">
              {isOnline ? (
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <Wifi size={12} /> En Línea
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                  <WifiOff size={12} /> Modo Sin Internet (Cache PWA)
                </span>
              )}

              {pendingSync > 0 && (
                <button
                  onClick={triggerSync}
                  disabled={isSyncing || !isOnline}
                  className="text-[10px] bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1 transition-all"
                  title="Registros pendientes de subir al servidor"
                >
                  <UploadCloud size={11} className={isSyncing ? 'animate-bounce' : ''} />
                  {isSyncing ? 'Subiendo...' : `${pendingSync} pendiente(s)`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reloj Digital Grande */}
        <div className="text-right">
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
            {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase">
            {currentTime.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Selector de Trabajadores por Foto */}
      <main className="flex-1 max-w-6xl mx-auto w-full my-6 flex flex-col justify-center">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 font-extrabold text-xs uppercase tracking-widest border border-blue-500/30 mb-2">
            PASO 1 DE 2
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            ¿Quién eres? Toca tu foto con el dedo
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Toca tu foto para registrar tu Entrada o tu Salida.
          </p>
        </div>

        {/* Cuadrícula de fotos GRANDES */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {empleados.map((emp) => {
            const { entrada, salida } = getPasesEmpleadoHoy(emp.id);
            const tieneEntrada = !!entrada;
            const tieneSalida = !!salida;
            const jornadaCompleta = tieneEntrada && tieneSalida;

            return (
              <div
                key={emp.id}
                onClick={() => setSelectedWorker(emp)}
                className={`group bg-slate-900/90 hover:bg-slate-800/90 border-2 rounded-3xl p-4 flex flex-col items-center text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl active:scale-95 ${jornadaCompleta ? 'border-emerald-600/60 bg-emerald-950/15' : tieneEntrada ? 'border-blue-600/60 bg-blue-950/15' : 'border-slate-800 hover:border-blue-500'}`}
              >
                {/* Foto del empleado */}
                <div className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 shadow-xl mb-3 ${jornadaCompleta ? 'border-emerald-500' : tieneEntrada ? 'border-blue-500' : 'border-slate-700 group-hover:border-blue-400'}`}>
                  <img
                    src={emp.foto_url || '/assets/logos/Corporativo.png'}
                    alt={emp.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&crop=face';
                    }}
                  />
                  {jornadaCompleta && (
                    <span className="absolute bottom-1 right-1 bg-emerald-500 text-slate-950 p-1.5 rounded-full shadow-lg border-2 border-slate-950" title="Jornada completa registrada">
                      <CheckCircle2 size={16} strokeWidth={3} />
                    </span>
                  )}
                </div>

                {/* Nombre visible y apodo */}
                <h3 className="font-black text-white text-base sm:text-lg group-hover:text-blue-300 transition-colors uppercase leading-tight line-clamp-1">
                  {emp.apodo || emp.nombre.split(' ')[0]}
                </h3>
                <p className="text-xs font-semibold text-slate-400 line-clamp-1 mt-0.5">
                  {emp.nombre}
                </p>

                {/* Estatus */}
                <div className="mt-3 w-full">
                  {jornadaCompleta ? (
                    <span className="block w-full py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-500/30">
                      ✓ Completo
                    </span>
                  ) : tieneEntrada ? (
                    <span className="block w-full py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-500/30">
                      ✓ Entrada: {entrada.hora}
                    </span>
                  ) : (
                    <span className="block w-full py-1.5 rounded-xl bg-blue-600 group-hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-wider shadow">
                      Tocar aquí
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Pie de página con información de almacenamiento y días guardados */}
      <footer className="max-w-6xl mx-auto w-full pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Calendar size={13} className="text-blue-400" />
            {asistenciasHoyCount} asistencia(s) de hoy
          </span>
          <span>•</span>
          <span className="text-slate-400">
            {historialCompleto.length} registros totales guardados en cache
          </span>
        </div>

        <button
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-white flex items-center gap-1.5 font-bold transition-colors"
        >
          <Home size={14} /> Portal Principal
        </button>
      </footer>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL DE INSTALACIÓN ESTILO XBOX CLOUD (ACCESO DIRECTO / PWA)
      ───────────────────────────────────────────────────────────────────────────── */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.8)] relative text-left">
            {/* Botón cerrar */}
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Cabecera del modal */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0">
                ECG
              </div>
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-1.5">
                  Instalar Checador ECG <Sparkles size={16} className="text-amber-400" />
                </h3>
                <p className="text-xs text-slate-400">
                  Acceso directo sin barras de navegador (como Xbox Cloud Gaming)
                </p>
              </div>
            </div>

            {/* Selector de plataforma (iPhone / Android) */}
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-5">
              <button
                onClick={() => setInstallTab('ios')}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                  installTab === 'ios'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🍏 iPhone / iPad (iOS)</span>
              </button>
              <button
                onClick={() => setInstallTab('android')}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                  installTab === 'android'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🤖 Android (Chrome/Edge)</span>
              </button>
            </div>

            {/* Contenido pestaña iOS */}
            {installTab === 'ios' && (
              <div className="space-y-3.5">
                <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0 font-bold border border-blue-500/30">
                    <Share2 size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white uppercase tracking-wide">Paso 1: Abrir Compartir</div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      En el navegador <strong className="text-blue-400">Safari</strong>, presiona el botón <strong>Compartir</strong> (el ícono del cuadrado con la flecha hacia arriba <span className="font-mono text-blue-400">⎋</span> en la barra inferior).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0 font-bold border border-indigo-500/30">
                    <PlusSquare size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white uppercase tracking-wide">Paso 2: Agregar a Inicio</div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Baja en las opciones del menú y selecciona <strong className="text-indigo-400">"Agregar a pantalla de inicio"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold border border-emerald-500/30">
                    <Check size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white uppercase tracking-wide">Paso 3: Confirmar</div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Presiona <strong className="text-emerald-400">"Agregar"</strong> en la esquina superior derecha. ¡Listo! Se creará el ícono en tu pantalla como una app instalada.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contenido pestaña Android */}
            {installTab === 'android' && (
              <div className="space-y-3.5">
                {installPrompt && (
                  <button
                    onClick={handleInstallPWA}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mb-2 border border-emerald-400/40"
                  >
                    <Download size={18} />
                    <span>Instalar directamente en este Android</span>
                  </button>
                )}

                <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0 font-bold border border-blue-500/30">
                    <MoreVertical size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white uppercase tracking-wide">Paso 1: Menú del Navegador</div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      En <strong>Chrome</strong> o <strong>Edge</strong>, toca los <strong>tres puntos (⋮)</strong> en la esquina superior derecha.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center flex-shrink-0 font-bold border border-indigo-500/30">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white uppercase tracking-wide">Paso 2: Instalar / Acceso Directo</div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Selecciona <strong className="text-indigo-400">"Instalar aplicación"</strong> o <strong className="text-indigo-400">"Agregar a la pantalla principal"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold border border-emerald-500/30">
                    <Check size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white uppercase tracking-wide">Paso 3: Confirmar</div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Confirma tocando <strong className="text-emerald-400">"Instalar"</strong>. Se añadirá el acceso directo a tu cajón de aplicaciones.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pie del modal */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                🔒 Funciona offline y sin conexión
              </span>
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
