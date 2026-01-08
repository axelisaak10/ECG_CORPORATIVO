import React from 'react';
import { Briefcase } from 'lucide-react';

const accentColors = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  orange: 'bg-orange-600'
};

const ServiciosSection = ({ company }) => {
  return (
    <div className="space-y-6 animate-slideUp">
      <div className="flex items-center mb-8">
        <Briefcase className={`${accentColors[company.accentColor]} text-white p-3 rounded-xl mr-4`} size={48} />
        <h2 className="text-3xl md:text-4xl font-bold">Nuestros Servicios</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {company.services.map((service, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <h3 className={`text-xl md:text-2xl font-bold mb-3 bg-gradient-to-r ${company.color} bg-clip-text text-transparent`}>
              {service.title}
            </h3>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              {service.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiciosSection;