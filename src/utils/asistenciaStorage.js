// ─────────────────────────────────────────────────────────────────────────────
// Gestor de Asistencias Offline / Cache (PWA) con Regla de Registro Único Diario
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY_HISTORIAL = 'ecg_asistencias_historial_pwa';
const STORAGE_KEY_PENDIENTES = 'ecg_asistencias_pendientes_sync';

/**
 * Obtiene la fecha actual en formato local YYYY-MM-DD
 */
export function getFechaLocal(d = new Date()) {
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Obtiene la hora actual formateada en 12 horas con segundos
 */
export function getHoraLocal(d = new Date()) {
  return d.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Carga todo el historial acumulado en el almacenamiento local del dispositivo
 * (Guarda múltiples registros de diferentes días sin límite de retención local)
 */
export function getHistorialLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORIAL);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Guarda el historial en el almacenamiento local
 */
function saveHistorialLocal(historial) {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORIAL, JSON.stringify(historial));
  } catch (e) {
    console.error('[PWA Asistencia] Error al guardar historial local:', e);
  }
}

/**
 * Carga la cola de registros pendientes de sincronizar con el servidor
 */
export function getPendientesSync() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDIENTES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Guarda los pendientes de sincronizar
 */
function savePendientesSync(pendientes) {
  try {
    localStorage.setItem(STORAGE_KEY_PENDIENTES, JSON.stringify(pendientes));
  } catch (e) {
    console.error('[PWA Asistencia] Error al guardar pendientes:', e);
  }
}

/**
 * Verifica si un empleado ya tiene una asistencia registrada en una fecha específica (opcionalmente por tipo: entrada o salida).
 * Cumple con la regla: solo se guarda el primer registro de entrada y el primer registro de salida del día.
 */
export function getAsistenciaDelDia(empleadoId, fecha = getFechaLocal(), tipo = null) {
  const historial = getHistorialLocal();
  return historial.find((item) => {
    const matchEmp = String(item.usuario_id || item.empleado_id) === String(empleadoId);
    const matchFecha = item.fecha === fecha;
    if (tipo) return matchEmp && matchFecha && item.tipo === tipo;
    return matchEmp && matchFecha;
  }) || null;
}

/**
 * Retorna los registros de entrada y salida del día para un empleado
 */
export function getPasesEmpleadoHoy(empleadoId, fecha = getFechaLocal()) {
  const historial = getHistorialLocal();
  const entrada = historial.find(
    (item) => String(item.usuario_id || item.empleado_id) === String(empleadoId) && item.fecha === fecha && item.tipo === 'entrada'
  ) || null;
  const salida = historial.find(
    (item) => String(item.usuario_id || item.empleado_id) === String(empleadoId) && item.fecha === fecha && item.tipo === 'salida'
  ) || null;
  return { entrada, salida };
}

/**
 * Registra un pase de asistencia ('entrada' o 'salida') con protección contra duplicados.
 * Solo guarda el primer pase de entrada y el primer pase de salida del día.
 */
export async function registrarPaseAsistencia({ empleadoId, empleadoNombre, tipo = 'entrada' }) {
  const fechaHoy = getFechaLocal();
  const horaHoy = getHoraLocal();

  // 1. REGLA ESTRICTA: Solo el primer registro de este tipo en el día
  const registroPrevio = getAsistenciaDelDia(empleadoId, fechaHoy, tipo);
  if (registroPrevio) {
    return {
      success: false,
      alreadyRegistered: true,
      mensaje: `Ya registraste tu ${tipo.toUpperCase()} hoy a las ${registroPrevio.hora}. Solo se guarda el primer registro de ${tipo} del día.`,
      registro: registroPrevio
    };
  }

  // 2. Crear el nuevo registro único del día para este tipo
  const nuevoRegistro = {
    id: `asist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    usuario_id: empleadoId,
    empleado_id: String(empleadoId),
    usuario_nombre: empleadoNombre,
    empleado_nombre: empleadoNombre,
    tipo,
    fecha: fechaHoy,
    hora: horaHoy,
    timestamp: Date.now(),
    synced: false
  };

  // 3. Guardar en historial acumulado local de inmediato (garantiza persistencia offline de múltiples días)
  const historial = getHistorialLocal();
  historial.unshift(nuevoRegistro);
  saveHistorialLocal(historial);

  // 4. Intentar sincronizar con el servidor o encolar como pendiente
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

  if (isOnline) {
    try {
      const res = await fetch('/api/catalogo?r=asistencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoRegistro)
      });
      if (res.ok || res.status === 409) {
        nuevoRegistro.synced = true;
        saveHistorialLocal(historial); // actualizar con flag synced = true
        return {
          success: true,
          alreadyRegistered: false,
          synced: true,
          registro: nuevoRegistro
        };
      }
    } catch {
      // Si la petición falla aunque haya bandera online, continuar a encolar
    }
  }

  // Si no hay internet o falló el envío al servidor, queda encolado para sincronizar después
  const pendientes = getPendientesSync();
  pendientes.push(nuevoRegistro);
  savePendientesSync(pendientes);

  return {
    success: true,
    alreadyRegistered: false,
    synced: false,
    offlineSaved: true,
    registro: nuevoRegistro
  };
}

/**
 * Sincroniza todos los registros pendientes acumulados de diferentes días
 * cuando se restablece la conexión a internet.
 */
export async function sincronizarPendientesConServidor() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, pendingCount: getPendientesSync().length };
  }

  const pendientes = getPendientesSync();
  if (pendientes.length === 0) return { syncedCount: 0, pendingCount: 0 };

  const noSincronizados = [];
  let sincronizadosExitosos = 0;
  const historial = getHistorialLocal();

  for (const item of pendientes) {
    try {
      const res = await fetch('/api/catalogo?r=asistencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });

      if (res.ok || res.status === 409) {
        sincronizadosExitosos++;
        // Marcar como sincronizado en el historial local
        const histItem = historial.find((h) => h.id === item.id);
        if (histItem) histItem.synced = true;
      } else {
        noSincronizados.push(item);
      }
    } catch {
      noSincronizados.push(item);
    }
  }

  savePendientesSync(noSincronizados);
  saveHistorialLocal(historial);

  return {
    syncedCount: sincronizadosExitosos,
    pendingCount: noSincronizados.length
  };
}
