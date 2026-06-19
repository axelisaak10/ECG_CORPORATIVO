import { useState, useEffect } from 'react';
import { Star, TrendingUp, CheckCircle2, Key } from 'lucide-react';
import { apiEncuestaGetEstadisticas } from '../../utils/api';

const EncuestaStatsWidget = ({ onOpenEncuesta }) => {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiEncuestaGetEstadisticas()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return null;
  if (stats.total_completados === 0 && stats.total_codigos === 0) return null;

  const pct = stats.total_codigos > 0
    ? Math.round((stats.total_completados / stats.total_codigos) * 100)
    : 0;

  // Buscar la pregunta de opción múltiple más respondida para mostrar una stat destacada
  const topMultiple = stats.stats_por_pregunta?.find(p => p.tipo === 'multiple' && p.total > 0);
  let topOpcion = null;
  if (topMultiple?.conteo) {
    const entries = Object.entries(topMultiple.conteo);
    if (entries.length > 0) {
      topOpcion = entries.sort((a, b) => b[1] - a[1])[0];
    }
  }

  return (
    <div className="mt-20 max-w-5xl w-full animate-slideUp">
      <div className="text-center mb-8">
        <p className="text-xs font-bold tracking-[0.25em] uppercase text-slate-400 mb-2">La opinión de nuestros clientes</p>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
          Satisfacción del <span className="text-ecg-azul">Cliente</span>
        </h2>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Banda superior */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full" />

        <div className="p-8">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={18} className="text-white" />
              </div>
              <p className="text-3xl font-black text-slate-800">{stats.total_completados}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Encuestas completadas</p>
            </div>

            <div className="text-center p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={18} className="text-white" />
              </div>
              <p className="text-3xl font-black text-slate-800">{pct}%</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Tasa de respuesta</p>
            </div>

            {topOpcion ? (
              <div className="text-center p-5 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 md:block hidden">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Star size={18} className="text-white" />
                </div>
                <p className="text-sm font-black text-slate-800 leading-tight mb-1">"{topOpcion[0]}"</p>
                <p className="text-xs text-slate-500 font-semibold">Respuesta más frecuente</p>
              </div>
            ) : (
              <div className="text-center p-5 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 md:block hidden">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Key size={18} className="text-white" />
                </div>
                <p className="text-3xl font-black text-slate-800">{stats.total_codigos}</p>
                <p className="text-xs text-slate-500 font-semibold mt-1">Clientes invitados</p>
              </div>
            )}
          </div>

          {/* Barra de satisfacción */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Participación global</span>
              <span className="text-indigo-600">{pct}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
            <div className="flex-1">
              <p className="font-black text-slate-800 text-sm">¿Nos conoces o trabajaste con nosotros?</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Comparte tu experiencia con nosotros, tengas o no un código de cliente.
              </p>
            </div>
            <button
              onClick={onOpenEncuesta}
              id="portal-encuesta-btn"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-200 whitespace-nowrap flex-shrink-0"
            >
              <Star size={15} />
              Responder encuesta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncuestaStatsWidget;
