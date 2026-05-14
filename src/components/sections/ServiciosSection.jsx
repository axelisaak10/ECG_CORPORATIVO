import { Briefcase } from 'lucide-react';

const accentColors = {
  'ecg-azul':  { bg: 'bg-ecg-azul',  text: 'text-ecg-azul',  badge: 'bg-blue-50 text-ecg-azul',   bar: 'from-ecg-azul to-ecg-celeste'  },
  'ecg-rojo1': { bg: 'bg-ecg-rojo1', text: 'text-ecg-rojo1', badge: 'bg-red-50 text-ecg-rojo1',   bar: 'from-ecg-rojo2 to-ecg-rojo1'   },
  'ecg-gris':  { bg: 'bg-ecg-negro', text: 'text-ecg-negro', badge: 'bg-gray-100 text-ecg-negro', bar: 'from-ecg-negro to-ecg-gris'    },
};

const ServiciosSection = ({ company }) => {
  const accent = accentColors[company.accentColor] || accentColors['ecg-azul'];

  return (
    <div className="animate-slideUp space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 flex-shrink-0 ${accent.bg} text-white rounded-xl flex items-center justify-center shadow-md`}>
          <Briefcase size={22} />
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">
            {company.services?.length} servicios disponibles
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">Nuestros Servicios</h2>
        </div>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {company.services?.map((service, idx) => (
          <div
            key={idx}
            className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-gray-100 hover:border-gray-200 transition-[box-shadow,border-color] duration-200 flex gap-4 items-start"
          >
            {/* Número */}
            <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${accent.bg} flex items-center justify-center text-white font-black text-xs shadow-sm`}>
              {String(idx + 1).padStart(2, '0')}
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm font-black mb-1.5 leading-snug ${accent.text}`}>
                {service.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {service.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiciosSection;