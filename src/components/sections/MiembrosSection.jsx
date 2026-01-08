import React from 'react';
import { Users } from 'lucide-react';

const accentColors = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  orange: 'bg-orange-600'
};

const MiembrosSection = ({ company }) => {
  return (
    <div className="animate-slideUp">
      <div className="flex items-center mb-8">
        <Users className={`${accentColors[company.accentColor]} text-white p-3 rounded-xl mr-4`} size={48} />
        <h2 className="text-3xl md:text-4xl font-bold">Nuestro Equipo</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {company.team.map((member, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
          >
            {/* Avatar */}
            <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${company.color} mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold`}>
              {member.name.charAt(0)}
            </div>

            {/* Información */}
            <h3 className="text-xl font-bold text-center mb-1">{member.name}</h3>
            <p className={`text-center font-semibold mb-2 ${accentColors[company.accentColor].replace('bg-', 'text-')}`}>
              {member.role}
            </p>
            <p className="text-center text-gray-600">{member.specialty}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiembrosSection;