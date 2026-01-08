import React from 'react';
import { Users } from 'lucide-react';

const accentColors = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  orange: 'bg-orange-600'
};

const NosotrosSection = ({ company }) => {
  const isECG = company.name === 'Centro de Ingeniería y Abastecimiento ECG';
  
  const misionVision = isECG ? {
    mision: 'Ofrecer soluciones integrales e inteligentes en ingeniería, capacitación, mantenimiento y abastecimiento para los sectores industrial, comercial, institucional y gubernamental, impulsadas por la innovación y el compromiso con la sustentabilidad.',
    vision: 'Ser el socio estratégico de referencia en soluciones integrales de ingeniería, sustentabilidad, suministro y mantenimiento, destacando por nuestra experiencia, capacidad técnica y equipamiento de vanguardia.'
  } : {
    mision: `En ${company.name}, nos dedicamos a proporcionar servicios de excelencia que transformen y mejoren las operaciones de nuestros clientes, con los más altos estándares de calidad.`,
    vision: 'Ser reconocidos como líderes en nuestro sector, estableciendo nuevos estándares de innovación y excelencia en cada proyecto que emprendemos.'
  };

  return (
    <div className="animate-slideUp">
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
        <div className="flex items-center mb-6">
          <Users className={`${accentColors[company.accentColor]} text-white p-3 rounded-xl mr-4`} size={48} />
          <h2 className="text-3xl md:text-4xl font-bold">Sobre Nosotros</h2>
        </div>

        {/* Historia de ECG */}
        {isECG && (
          <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
            <p className="text-lg text-gray-700 leading-relaxed">
              <strong>Fundada en 2000</strong> en Querétaro, México, por el <strong>Ing. Juan Erasmo Cuaya G.</strong>, 
              quien aporta más de 20 años de experiencia en el sector del mantenimiento eléctrico. 
              Nos hemos consolidado como un socio confiable y experto en soluciones integrales de ingeniería industrial y comercial.
            </p>
          </div>
        )}

        {/* Misión y Visión */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-4">Nuestra Misión</h3>
            <p className="text-gray-600 leading-relaxed">{misionVision.mision}</p>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-4">Nuestra Visión</h3>
            <p className="text-gray-600 leading-relaxed">{misionVision.vision}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NosotrosSection;