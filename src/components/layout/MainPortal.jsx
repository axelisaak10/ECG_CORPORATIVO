import { ArrowRight } from 'lucide-react';

const accentText = {
  blue:   'text-blue-600',
  red:    'text-red-600',
  gray:   'text-gray-700',
  green:  'text-green-600',
  orange: 'text-orange-600',
};

const MainPortal = ({ companies, onSelectCompany }) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 lg:p-12 overflow-x-hidden">

      {/* Hero */}
      <div className="text-center mb-16 max-w-3xl animate-slideDown">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400 mb-4">Grupo Empresarial</p>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter">
          ECG <span className="text-blue-600">CORPORATIVO</span>
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed">
          Impulsando la excelencia industrial a través de la formación técnica,
          la ingeniería avanzada y la sustentabilidad energética.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full animate-slideUp">
        {companies.map((company, idx) => {
          const text = accentText[company.accentColor] || accentText.blue;
          return (
            <button
              key={company.id}
              onClick={() => onSelectCompany(idx)}
              className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-400 border border-slate-100 overflow-hidden text-left hover:-translate-y-2"
            >
              {/* Banda de color superior */}
              <div className={`h-1.5 bg-gradient-to-r ${company.color} w-full`} />

              {/* Decoración de fondo */}
              <div className={`absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br ${company.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />

              <div className="p-8">
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

                <div className={`inline-flex items-center font-bold text-xs uppercase tracking-widest ${text}`}>
                  Ver empresa
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1.5 transition-transform duration-300" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-16 text-slate-300 font-bold text-xs uppercase tracking-[0.3em]">
        © {new Date().getFullYear()} ECG Corporativo Industrial
      </p>
    </div>
  );
};

export default MainPortal;