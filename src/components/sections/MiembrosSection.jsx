import React from 'react';
import { Users } from 'lucide-react';

const accentColors = {
  blue: 'bg-blue-600',
  red: 'bg-red-600',   
  gray: 'bg-gray-700', 
  green: 'bg-green-600',
  orange: 'bg-orange-600'
};

const MiembrosSection = ({ company }) => {
  if (!company || !company.team) return null;

  const currentAccent = accentColors[company.accentColor] || 'bg-blue-600';

  return (
    <div className="animate-slideUp p-4 max-w-7xl mx-auto">
      <div className="flex items-center mb-8">
        <div className={`${currentAccent} text-white p-3 rounded-xl mr-4 shadow-lg`}>
          <Users size={32} />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Nuestro Equipo</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {company.team.map((member, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
          >
            <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${company.color} mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-inner`}>
              {member.name ? member.name.charAt(0) : '?'}
            </div>

            <h3 className="text-xl font-bold text-center mb-1 text-gray-800">{member.name}</h3>
            <p className={`text-center font-semibold mb-2 ${currentAccent.replace('bg-', 'text-')}`}>
              {member.role}
            </p>
            <div className="w-12 h-1 bg-gray-100 mx-auto mb-3 rounded-full"></div>
            <p className="text-center text-gray-600 text-sm italic">{member.specialty}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiembrosSection;