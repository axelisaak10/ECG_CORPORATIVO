import { Users } from 'lucide-react';

const accentColors = {
  'ecg-azul':  { bg: 'bg-ecg-azul',  text: 'text-ecg-azul',  badge: 'bg-blue-50 text-ecg-azul'   },
  'ecg-rojo1': { bg: 'bg-ecg-rojo1', text: 'text-ecg-rojo1', badge: 'bg-red-50 text-ecg-rojo1'   },
  'ecg-gris':  { bg: 'bg-ecg-negro', text: 'text-ecg-negro', badge: 'bg-gray-100 text-ecg-negro' },
};

const MiembrosSection = ({ company }) => {
  if (!company || !company.team) return null;
  const accent = accentColors[company.accentColor] || accentColors['ecg-azul'];

  return (
    <div className="animate-slideUp space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 flex-shrink-0 ${accent.bg} text-white rounded-xl flex items-center justify-center shadow-md`}>
          <Users size={22} />
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">
            {company.team.length} integrantes
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">Nuestro Equipo</h2>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {company.team.map((member, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 flex flex-col"
          >
            {/* Barra color */}
            <div className={`h-1.5 bg-gradient-to-r ${company.color}`} />

            <div className="p-6 flex flex-col items-center text-center flex-1">
              {/* Avatar */}
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${company.color} flex items-center justify-center text-white text-2xl font-black shadow-md mb-4`}>
                {member.name ? member.name.charAt(0).toUpperCase() : '?'}
              </div>

              <h3 className="text-base font-black text-gray-800 mb-1 leading-snug">{member.name}</h3>
              <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${accent.badge} mb-3`}>
                {member.role}
              </span>
              <p className="text-gray-400 text-sm leading-relaxed">{member.specialty}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiembrosSection;