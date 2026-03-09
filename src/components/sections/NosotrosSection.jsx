import { Users } from 'lucide-react';

const accentColors = {
  blue: 'bg-blue-600',
  red: 'bg-red-600',
  gray: 'bg-gray-700',
  green: 'bg-green-600',
  orange: 'bg-orange-600'
};

const NosotrosSection = ({ company }) => {
  const accentBg = accentColors[company.accentColor] || 'bg-blue-600';

  return (
    <div className="animate-slideUp">
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
        <div className="flex items-center mb-6">
          <Users className={`${accentBg} text-white p-3 rounded-xl mr-4`} size={48} />
          <h2 className="text-3xl md:text-4xl font-bold">Sobre Nosotros</h2>
        </div>

        {/* Historia */}
        {company.historia && (
          <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
            <p className="text-lg text-gray-700 leading-relaxed">{company.historia}</p>
          </div>
        )}

        {/* Misión y Visión */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-4">Nuestra Misión</h3>
            <p className="text-gray-600 leading-relaxed">{company.mision}</p>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-4">Nuestra Visión</h3>
            <p className="text-gray-600 leading-relaxed">{company.vision}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NosotrosSection;