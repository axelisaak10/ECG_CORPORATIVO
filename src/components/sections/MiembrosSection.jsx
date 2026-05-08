import { useState } from 'react';
import { Users } from 'lucide-react';
import MemberCardModal from '../shared/MemberCardModal';

const accentColors = {
  'ecg-azul':  { bg: 'bg-ecg-azul',  text: 'text-ecg-azul',  badge: 'bg-blue-50 text-ecg-azul'   },
  'ecg-rojo1': { bg: 'bg-ecg-rojo1', text: 'text-ecg-rojo1', badge: 'bg-red-50 text-ecg-rojo1'   },
  'ecg-gris':  { bg: 'bg-ecg-negro', text: 'text-ecg-negro', badge: 'bg-gray-100 text-ecg-negro' },
};

const MiembrosSection = ({ company }) => {
  const [selectedMember, setSelectedMember] = useState(null);

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

      {/* Subtitle */}
      <p className="text-gray-500 text-sm max-w-2xl">
        Conoce a los profesionales que hacen posible cada proyecto. Haz clic en un miembro para ver su tarjeta de presentación.
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {company.team.map((member, idx) => {
          const hasImage = member.image && member.image.trim() !== '';

          return (
            <button
              key={idx}
              onClick={() => setSelectedMember(member)}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 flex flex-col text-left group cursor-pointer"
            >
              {/* Barra color */}
              <div className={`h-1.5 bg-gradient-to-r ${company.color} group-hover:h-2 transition-all duration-300`} />

              <div className="p-6 flex flex-col items-center text-center flex-1">
                {/* Avatar / Foto */}
                {hasImage ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100 shadow-md mb-4 group-hover:shadow-lg group-hover:border-gray-200 transition-all duration-300">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${company.color} flex items-center justify-center text-white text-2xl font-black shadow-md mb-4 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300`}>
                    {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                  </div>
                )}

                <h3 className="text-base font-black text-gray-800 mb-1 leading-snug group-hover:text-gray-900">{member.name}</h3>
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${accent.badge} mb-3`}>
                  {member.role}
                </span>
                <p className="text-gray-400 text-sm leading-relaxed">{member.specialty}</p>

                {/* CTA */}
                <div className="mt-4 text-xs font-bold text-gray-300 group-hover:text-gray-500 transition-colors flex items-center gap-1">
                  <span>Ver perfil</span>
                  <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal de tarjeta de presentación */}
      {selectedMember && (
        <MemberCardModal
          member={selectedMember}
          companyColor={company.color}
          accentBg={accent.badge}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
};

export default MiembrosSection;