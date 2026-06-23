import React, { useState } from 'react';
import {
  GraduationCap, FileText, Megaphone, ListChecks, Star,
  HelpCircle, ChevronRight, BookOpen, Lightbulb, AlertTriangle,
  PlayCircle, Clock, CheckCircle2, UserCog, UserCheck, Settings,
  Link, Image, Plus, Check, Eye
} from 'lucide-react';

const TABS = [
  { id: 'cotizaciones', label: 'Cotizaciones', icon: <FileText size={18} />, color: 'from-emerald-500 to-teal-600', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'anuncios',     label: 'Anuncios / Pop-ups', icon: <Megaphone size={18} />, color: 'from-indigo-500 to-blue-600', text: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'tareas',       label: 'Tareas', icon: <ListChecks size={18} />, color: 'from-violet-500 to-purple-600', text: 'text-violet-600', bg: 'bg-violet-50' },
  { id: 'encuestas',     label: 'Encuestas', icon: <Star size={18} />, color: 'from-amber-500 to-orange-600', text: 'text-amber-600', bg: 'bg-amber-50' },
];

const Paso = ({ numero, titulo, descripcion, consejo, importante }) => (
  <div className="relative pl-10 border-l border-slate-100 pb-8 last:pb-2">
    <div className="absolute left-0 top-0 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-100">
      {numero}
    </div>
    <h4 className="font-extrabold text-slate-800 text-sm mb-1.5">{titulo}</h4>
    <p className="text-slate-500 text-xs leading-relaxed mb-3">{descripcion}</p>
    
    {consejo && (
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 text-xs text-amber-800 flex items-start gap-2.5 mb-2">
        <Lightbulb size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Consejo: </span>
          {consejo}
        </div>
      </div>
    )}

    {importante && (
      <div className="bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5 text-xs text-rose-800 flex items-start gap-2.5">
        <AlertTriangle size={14} className="text-rose-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Importante: </span>
          {importante}
        </div>
      </div>
    )}
  </div>
);

const TutorialesSection = () => {
  const [activeTab, setActiveTab] = useState('cotizaciones');

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-200">
          <GraduationCap size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Centro de Ayuda y Tutoriales</h1>
          <p className="text-slate-500 text-sm mt-0.5">Aprende a dominar los módulos clave de ECG Corporativo</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-2xl text-xs font-black transition-all border ${
                active
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              <span className={active ? 'text-white' : tab.text}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden transition-all duration-350">
        
        {/* Banner de la sección activa */}
        {TABS.map(tab => {
          if (tab.id !== activeTab) return null;
          return (
            <div key={tab.id} className={`bg-gradient-to-r ${tab.color} px-8 py-7 text-white relative overflow-hidden`}>
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10" />
              <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-white/10" />
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  {tab.icon}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Guía paso a paso</span>
                  <h2 className="text-lg font-black mt-0.5">Cómo crear y gestionar {tab.label}</h2>
                </div>
              </div>
            </div>
          );
        })}

        <div className="p-6 md:p-8">
          {/* ─── TUTORIAL: COTIZACIONES ─── */}
          {activeTab === 'cotizaciones' && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-2">
                <h3 className="font-extrabold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-500" />
                  Acerca de las Cotizaciones
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Las cotizaciones te permiten registrar presupuestos para los clientes. Un administrador o trabajador puede crearlas con partidas personalizadas y montos individuales, asociándolas a una empresa específica de la corporación.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-4">Pasos para crear una Cotización:</h3>
                
                <Paso
                  numero={1}
                  titulo="Entrar al módulo y presionar nuevo"
                  descripcion="Navega a la pestaña 'Cotizaciones' en el menú lateral y haz clic en el botón '+ Nueva Cotización' en la parte superior derecha."
                />
                
                <Paso
                  numero={2}
                  titulo="Completar los datos generales de la cotización"
                  descripcion="Define el Cliente (nombre de la empresa o persona), la Empresa ECG (el área o filial encargada) y el Tipo de servicio/dictamen a cotizar."
                  consejo="Escribe un Folio o Referencia descriptivo (ej. COT-2026-XYZ) para identificar la propuesta rápidamente."
                />

                <Paso
                  numero={3}
                  titulo="Agregar partidas y montos"
                  descripcion="Escribe el nombre del servicio o concepto, el costo de este y haz clic en '+ Agregar Partida' para sumarlo a la cotización. Puedes añadir tantas partidas como requiera la propuesta."
                  consejo="El sistema calculará automáticamente el monto total sumando todas las partidas añadidas en tiempo real."
                />

                <Paso
                  numero={4}
                  titulo="Guardar y definir estado inicial"
                  descripcion="Define el estado inicial (En proceso, Aceptada o Rechazada) y presiona 'Crear Cotización'. La cotización aparecerá en el listado general."
                  importante="Las cotizaciones guardadas se almacenan de forma local y/o en la base de datos de Supabase para su consulta. Solo los Administradores tienen permisos para editarlas o eliminarlas."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><PlayCircle size={14} className="text-emerald-500" /> Nivel requerido: Trabajador, Admin o Super Admin</span>
              </div>
            </div>
          )}

          {/* ─── TUTORIAL: ANUNCIOS ─── */}
          {activeTab === 'anuncios' && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-2">
                <h3 className="font-extrabold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-500" />
                  Acerca de los Anuncios / Pop-ups
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Los anuncios se muestran como pop-ups emergentes al inicio del portal principal o en las empresas específicas. Son ideales para captar atención mediante promociones con cuentas atrás.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-4">Pasos para crear un Anuncio / Pop-up:</h3>
                
                <Paso
                  numero={1}
                  titulo="Iniciar el formulario"
                  descripcion="Ve a la pestaña 'Anuncios / Pop-ups' y haz clic en '+ Nuevo Anuncio'."
                />

                <Paso
                  numero={2}
                  titulo="Elegir el Modo de Visualización (¡CRÍTICO!)"
                  descripcion="Tienes dos modos de visualización:"
                  consejo="A) Modo Estándar: Muestra títulos, descripción de texto e imagen opcional. B) Modo Solo Imagen: Oculta los textos y muestra un flyer promocional a pantalla completa de gran tamaño (max-w-xl) con un contador de tiempo colocado limpiamente en la parte inferior para no tapar los datos de la foto."
                />

                <Paso
                  numero={3}
                  titulo="Configurar Vigencia, URL e Interactividad"
                  descripcion="Ingresa el URL público de tu imagen y define una Fecha de vencimiento obligatoria (para alimentar el reloj de cuenta atrás). Opcionalmente ingresa un Link de clic (ej. tu enlace de WhatsApp) para que al pinchar el anuncio redirija al usuario."
                  importante="La fecha de vencimiento es requerida. Al cumplirse ese día, el anuncio dejará de mostrarse automáticamente en el portal."
                />

                <Paso
                  numero={4}
                  titulo="Probar con Vista Previa y Publicar"
                  descripcion="Antes de guardar, puedes hacer clic en el botón de Vista Previa (icono de ojo 👁️) para ver exactamente cómo se visualizará el pop-up para los usuarios finales. Finalmente activa el interruptor 'Publicar ya' y presiona Guardar."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><PlayCircle size={14} className="text-indigo-500" /> Nivel requerido: Trabajador, Admin o Super Admin</span>
              </div>
            </div>
          )}

          {/* ─── TUTORIAL: TAREAS ─── */}
          {activeTab === 'tareas' && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-2">
                <h3 className="font-extrabold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-500" />
                  Acerca de las Tareas
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Las tareas permiten organizar el trabajo diario de la corporación. Se pueden asignar a colaboradores específicos, categorizar por prioridad (Baja, Media, Alta), definirles fecha de entrega y llevar un registro de su avance.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-4">Pasos para gestionar Tareas:</h3>
                
                <Paso
                  numero={1}
                  titulo="Crear una nueva tarea"
                  descripcion="Haz clic en '+ Nueva Tarea'. Rellena el Título, Descripción, define el responsable (miembro del personal) y selecciona la prioridad."
                  consejo="Usa prioridades adecuadas para ayudar a tu equipo a enfocar su tiempo en lo más crítico primero."
                />

                <Paso
                  numero={2}
                  titulo="Establecer fecha de entrega"
                  descripcion="Define la fecha límite de vencimiento de la tarea para calcular el tiempo restante."
                  importante="Las tareas vencidas se señalarán automáticamente con una alerta en el panel para llamar la atención del equipo."
                />

                <Paso
                  numero={3}
                  titulo="Actualizar avance y completar"
                  descripcion="Los responsables de la tarea pueden cambiar el estado del flujo ('Pendiente', 'En desarrollo' o 'Completado') directamente desde el tablero."
                  consejo="Una vez completada la tarea, márcala como Completado para liberar la carga del tablero y mantener limpias las estadísticas del resumen."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><PlayCircle size={14} className="text-violet-500" /> Nivel requerido: Todos (Trabajador, Admin, Super Admin)</span>
              </div>
            </div>
          )}

          {/* ─── TUTORIAL: ENCUESTAS ─── */}
          {activeTab === 'encuestas' && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-2">
                <h3 className="font-extrabold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-500" />
                  Acerca de las Encuestas
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  El módulo de encuestas recopila retroalimentación sobre la calidad del servicio. Las preguntas son configurables y las respuestas se recolectan mediante códigos de cliente o de forma abierta para el público general.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-4">Pasos para gestionar Encuestas:</h3>
                
                <Paso
                  numero={1}
                  titulo="Configurar las Preguntas del Sistema"
                  descripcion="Accede a la subsección 'Preguntas'. Puedes añadir preguntas de tipo 'Respuesta abierta' o 'Opción Múltiple' (añadiendo las opciones separadas por comas)."
                  importante="Solo las preguntas marcadas como 'Activas' se mostrarán en la encuesta de satisfacción del portal."
                />

                <Paso
                  numero={2}
                  titulo="Generar códigos de satisfacción para Clientes"
                  descripcion="En la subsección 'Códigos', haz clic en '+ Generar Código'. Ingresa el nombre del cliente y una breve descripción del servicio realizado."
                  consejo="El sistema creará un código único (ej: ENC-2F9A3). Cópialo y envíaselo a tu cliente para que responda la encuesta de forma personalizada (un solo uso)."
                />

                <Paso
                  numero={3}
                  titulo="Encuesta para el Público General (Sin Código)"
                  descripcion="El portal también permite la participación del público en general sin código de invitación. Al acceder, el portal creará un código dinámico transparente (ej: PUB-XXXXXX) para guardar sus respuestas sin mezclar sus métricas con las de clientes exclusivos."
                />

                <Paso
                  numero={4}
                  titulo="Analizar estadísticas cualitativas"
                  descripcion="En la parte inferior de la sección de encuestas del dashboard podrás visualizar los porcentajes de respuestas por pregunta, así como los comentarios registrados por clientes y el público general."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><PlayCircle size={14} className="text-amber-500" /> Nivel requerido: Trabajador, Admin o Super Admin</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TutorialesSection;
