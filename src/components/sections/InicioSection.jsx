import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { featuresData } from '../../data/features';
import ImageGalleryModal from '../shared/ImageGalleryModal';

const InicioSection = ({ company }) => {
  const [selectedFeature, setSelectedFeature] = useState(null);

  return (
    <div className="space-y-8 animate-slideUp">
      {/* Hero Section */}
      <div className={`bg-gradient-to-r ${company.color} rounded-3xl p-8 md:p-12 text-white shadow-2xl transform hover:scale-[1.02] transition-all duration-500`}>
        <h2 className="text-3xl md:text-5xl font-bold mb-4">{company.name}</h2>
        <p className="text-xl md:text-2xl opacity-90 mb-8">{company.slogan}</p>
        <p className="text-base md:text-lg opacity-80">{company.description}</p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {featuresData.map((feature, i) => (
          <button
            key={i}
            onClick={() => setSelectedFeature(i)}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 text-left cursor-pointer"
          >
            <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${company.color} mb-4 flex items-center justify-center`}>
              <ChevronRight className="text-white" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">{feature.name}</h3>
            <p className="text-gray-600">{feature.desc}</p>
            <p className="text-sm mt-3 font-semibold text-blue-600">Ver galería →</p>
          </button>
        ))}
      </div>

      {/* Modal */}
      {selectedFeature !== null && (
        <ImageGalleryModal
          feature={featuresData[selectedFeature]}
          companyColor={company.color}
          onClose={() => setSelectedFeature(null)}
        />
      )}
    </div>
  );
};

export default InicioSection;