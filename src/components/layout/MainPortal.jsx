import { ArrowRight } from 'lucide-react';

const accentText = {
  'ecg-azul': 'text-ecg-azul',
  'ecg-rojo1': 'text-ecg-rojo1',
  'ecg-gris': 'text-ecg-negro',
  green: 'text-green-600',
  orange: 'text-orange-600',
};

const MainPortal = ({ companies, onSelectCompany }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 lg:p-12 overflow-x-hidden">

      {/* Hero */}
      <div className="text-center mb-16 max-w-3xl animate-slideDown">
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter">
          <span className="text-slate-400">E</span><span className="text-ecg-azul">C</span><span className="text-ecg-rojo1">G</span> <span className="text-slate-900">CORPORATIVO</span>
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed italic">
          "Ingeniería que construye, gestión que respalda, y capacitación que transforma."
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full animate-slideUp items-stretch">
        {companies.map((company, idx) => {
          const text = accentText[company.accentColor] || accentText['ecg-azul'];
          return (
            <button
              key={company.id}
              onClick={() => onSelectCompany(idx)}
              className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-400 border border-slate-100 overflow-hidden text-left hover:-translate-y-2 flex flex-col h-full"
            >
              {/* Banda de color superior */}
              <div className={`h-1.5 bg-gradient-to-r ${company.color} w-full`} />

              {/* Decoración de fondo */}
              <div className={`absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br ${company.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />

              <div className="p-8 flex flex-col flex-1">
                {/* Logo */}
                <div className="w-24 h-24 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-6 overflow-hidden">
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-20 h-20 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<span class="text-2xl font-black text-gray-300">${company.shortName?.[0] || 'E'}</span>`;
                    }}
                  />
                </div>

                <h3 className="text-xl font-extrabold text-slate-800 mb-2 leading-snug">
                  {company.name}
                </h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  {company.slogan}
                </p>
                <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-6">
                  {company.description}
                </p>

                <div className={`inline-flex items-center font-bold text-xs uppercase tracking-widest mt-auto ${text}`}>
                  Ver empresa
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1.5 transition-transform duration-300" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Video corporativo */}
      <div className="mt-20 max-w-4xl w-full animate-slideUp">
        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-slate-400 mb-2">Conoce más sobre nosotros</p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            Video <span className="text-ecg-azul">Corporativo</span>
          </h2>
        </div>

        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-100 bg-slate-900">
          {/* Banda de color superior */}
          <div className="h-1.5 bg-gradient-to-r from-slate-400 via-ecg-azul to-ecg-rojo1 w-full" />

          <iframe
            className="w-full aspect-video"
            src="https://www.youtube-nocookie.com/embed/9nbg3xo-TgA"
            title="Video Corporativo ECG"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>

      <p className="mt-16 text-slate-300 font-bold text-xs uppercase tracking-[0.3em]">
        © {new Date().getFullYear()} ECG Corporativo Industrial
      </p>
    </div>
  );
};

export default MainPortal;