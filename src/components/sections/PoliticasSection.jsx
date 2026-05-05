import { Shield } from 'lucide-react';

const accentColors = {
  'ecg-azul':  { bg: 'bg-ecg-azul',  bar: 'border-ecg-azul',  num: 'bg-blue-50 text-ecg-azul'   },
  'ecg-rojo1': { bg: 'bg-ecg-rojo1', bar: 'border-ecg-rojo1', num: 'bg-red-50 text-ecg-rojo1'   },
  'ecg-gris':  { bg: 'bg-ecg-negro', bar: 'border-ecg-negro', num: 'bg-gray-100 text-ecg-negro' },
};

const PoliticasSection = ({ company }) => {
  const accent = accentColors[company.accentColor] || accentColors['ecg-azul'];
  const politicas = company.politicas || [];

  return (
    <div className="animate-slideUp space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 flex-shrink-0 ${accent.bg} text-white rounded-xl flex items-center justify-center shadow-md`}>
          <Shield size={22} />
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">
            {politicas.length} políticas
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">Políticas Empresariales</h2>
        </div>
      </div>

      {/* Lista de políticas */}
      <div className="space-y-4">
        {politicas.map((politica, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex gap-5 items-start border-l-4 ${accent.bar}`}
          >
            {/* Número */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${accent.num} flex items-center justify-center font-black text-xs`}>
              {String(idx + 1).padStart(2, '0')}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-gray-800 mb-1.5 leading-snug">{politica.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{politica.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PoliticasSection;