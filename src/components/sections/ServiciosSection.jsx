import { Briefcase } from 'lucide-react';

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

const ServiciosSection = ({ company }) => {
  const bg   = accentBg[company.accentColor]   || accentBg.blue;
  const text = accentText[company.accentColor] || accentText.blue;

  return (
    <div className="space-y-6 animate-slideUp">
      <div className="flex items-center mb-8">
        <Briefcase className={`${bg} text-white p-3 rounded-xl mr-4`} size={48} />
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">Nuestros Servicios</h2>
          <p className="text-gray-400 text-sm mt-1">{company.services.length} servicios disponibles</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {company.services.map((service, idx) => (
          <div
            key={idx}
            className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-50 hover:border-gray-100 flex gap-5"
          >
            {/* Badge numérico */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${bg} flex items-center justify-center text-white font-black text-sm shadow-md`}>
              {String(idx + 1).padStart(2, '0')}
            </div>
            <div>
              <h3 className={`text-lg font-bold mb-2 ${text} group-hover:opacity-80 transition-opacity`}>
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