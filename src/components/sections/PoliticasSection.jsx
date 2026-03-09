import { Shield } from 'lucide-react';

const accentMap = {
  blue:   { bg: 'bg-blue-600',   border: 'border-blue-600' },
  red:    { bg: 'bg-red-600',    border: 'border-red-600' },
  gray:   { bg: 'bg-gray-700',   border: 'border-gray-700' },
  green:  { bg: 'bg-green-600',  border: 'border-green-600' },
  orange: { bg: 'bg-orange-600', border: 'border-orange-600' }
};

const PoliticasSection = ({ company }) => {
  const accent = accentMap[company.accentColor] || accentMap.blue;
  const politicas = company.politicas || [];

  return (
    <div className="animate-slideUp">
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
        <div className="flex items-center mb-8">
          <Shield className={`${accent.bg} text-white p-3 rounded-xl mr-4`} size={48} />
          <h2 className="text-3xl md:text-4xl font-bold">Políticas Empresariales</h2>
        </div>

        <div className="space-y-6">
          {politicas.map((politica, idx) => (
            <div
              key={idx}
              className={`border-l-4 pl-6 transition-colors duration-300 ${accent.border}`}
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