import { Users, Target, Eye as EyeIcon } from 'lucide-react';

const accentColors = {
  'ecg-azul':  { bg: 'bg-ecg-azul',  text: 'text-ecg-azul',  bar: 'from-ecg-azul to-ecg-celeste',   softBg: 'bg-blue-50'  },
  'ecg-rojo1': { bg: 'bg-ecg-rojo1', text: 'text-ecg-rojo1', bar: 'from-ecg-rojo2 to-ecg-rojo1',    softBg: 'bg-red-50'   },
  'ecg-gris':  { bg: 'bg-ecg-negro', text: 'text-ecg-negro', bar: 'from-ecg-negro to-ecg-gris',     softBg: 'bg-gray-100' },
};

const NosotrosSection = ({ company }) => {
  const accent = accentColors[company.accentColor] || accentColors['ecg-azul'];

  return (
    <div className="animate-slideUp space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 flex-shrink-0 ${accent.bg} text-white rounded-xl flex items-center justify-center shadow-md`}>
          <Users size={22} />
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Empresa</p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">Sobre Nosotros</h2>
        </div>
      </div>

      {/* Historia */}
      {company.historia && (
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className={`h-1 w-16 rounded-full bg-gradient-to-r ${accent.bar} mb-5`} />
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-3">Nuestra Historia</h3>
          <p className="text-gray-700 leading-relaxed text-base">{company.historia}</p>
        </div>
      )}

      {/* Misión y Visión */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className={`w-10 h-10 flex-shrink-0 ${accent.softBg} rounded-xl flex items-center justify-center mb-4`}>
            <Target size={20} className={accent.text} />
          </div>
          <h3 className="text-base font-black text-gray-900 mb-3 uppercase tracking-wide">Nuestra Misión</h3>
          <p className="text-gray-600 leading-relaxed text-sm flex-1">{company.mision}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className={`w-10 h-10 flex-shrink-0 ${accent.softBg} rounded-xl flex items-center justify-center mb-4`}>
            <EyeIcon size={20} className={accent.text} />
          </div>
          <h3 className="text-base font-black text-gray-900 mb-3 uppercase tracking-wide">Nuestra Visión</h3>
          <p className="text-gray-600 leading-relaxed text-sm flex-1">{company.vision}</p>
        </div>
      </div>

    </div>
  );
};

export default NosotrosSection;