import { Users } from 'lucide-react';

const accentBg = {
  blue:   'bg-blue-600',
  red:    'bg-red-600',
  gray:   'bg-gray-700',
  green:  'bg-green-600',
  orange: 'bg-orange-600',
};

const accentText = {
  blue:   'text-blue-600',
  red:    'text-red-600',
  gray:   'text-gray-700',
  green:  'text-green-600',
  orange: 'text-orange-600',
};

const MiembrosSection = ({ company }) => {
  if (!company || !company.team) return null;

  const bg   = accentBg[company.accentColor]   || 'bg-blue-600';
  const text = accentText[company.accentColor] || 'text-blue-600';

  return (
    <div className="animate-slideUp">
      <div className="flex items-center mb-8">
        <div className={`${bg} text-white p-3 rounded-xl mr-4 shadow-lg`}>
          <Users size={32} />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Nuestro Equipo</h2>
          <p className="text-gray-400 text-sm mt-1">{company.team.length} integrantes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {company.team.map((member, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-50 hover:-translate-y-1"
          >
            {/* Barra de color superior */}
            <div className={`h-2 bg-gradient-to-r ${company.color}`} />

            <div className="p-7 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${company.color} flex items-center justify-center text-white text-2xl font-black shadow-lg mb-4`}>
                {member.name ? member.name.charAt(0).toUpperCase() : '?'}
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-1 leading-tight">{member.name}</h3>
              <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-gray-50 ${text} mb-3`}>
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