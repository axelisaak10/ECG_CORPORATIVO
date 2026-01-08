// src/components/sections/ServiciosSection.jsx
import React from 'react';
import { Briefcase } from 'lucide-react';

// OBJETO ACTUALIZADO
const accentColors = {
  blue: 'bg-blue-600',
  red: 'bg-red-600',   // Sustituye a green
  gray: 'bg-gray-600'  // Sustituye a orange
};

const ServiciosSection = ({ company }) => {
  return (
    <div className="space-y-6 animate-slideUp">
      <div className="flex items-center mb-8">
        {/* El icono ahora usará el color rojo o gris según la empresa */}
        <Briefcase className={`${accentColors[company.accentColor]} text-white p-3 rounded-xl mr-4`} size={48} />
        <h2 className="text-3xl md:text-4xl font-bold">Nuestros Servicios</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {company.services.map((service, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            {/* El degradado del título se ajusta automáticamente mediante company.color */}
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