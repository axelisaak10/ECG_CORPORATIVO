import React from 'react';
import { Shield } from 'lucide-react';
import { politicasData } from '../../data/politicas';

const accentColors = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  orange: 'bg-orange-600'
};

const PoliticasSection = ({ company }) => {
  return (
    <div className="animate-slideUp">
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
        <div className="flex items-center mb-8">
          <Shield className={`${accentColors[company.accentColor]} text-white p-3 rounded-xl mr-4`} size={48} />
          <h2 className="text-3xl md:text-4xl font-bold">Políticas Empresariales</h2>
        </div>

        <div className="space-y-6">
          {politicasData.map((politica, idx) => (
            <div
              key={idx}
              className={`border-l-4 pl-6 hover:border-current transition-colors duration-300 ${accentColors[company.accentColor].replace('bg-', 'border-')}`}
            >
              <h3 className="text-xl md:text-2xl font-bold mb-2">{politica.title}</h3>
              <p className="text-gray-600 leading-relaxed">{politica.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PoliticasSection;