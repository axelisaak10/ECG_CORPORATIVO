import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { featuresData } from '../../data/features';
import ImageGalleryModal from '../shared/ImageGalleryModal';

const InicioSection = ({ company }) => {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Imágenes del carrusel según la empresa
  const carouselImages = {
    'Centro de Capacitación ECG': [
      { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200', caption: 'Capacitación Profesional' },
      { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200', caption: 'Trabajo en Equipo' },
      { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200', caption: 'Desarrollo Organizacional' },
      { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200', caption: 'Liderazgo Empresarial' }
    ],
    'JECG Proyectos de Sustentabilidad': [
      { url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200', caption: 'Energía Sostenible' },
      { url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200', caption: 'Paneles Solares' },
      { url: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1200', caption: 'Eficiencia Energética' },
      { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200', caption: 'Sustentabilidad' }
    ],
    'Centro de Ingeniería y Abastecimiento ECG': [
      { url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200', caption: 'Ingeniería Industrial' },
      { url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200', caption: 'Instalaciones Eléctricas' },
      { url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200', caption: 'Equipos Industriales' },
      { url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200', caption: 'Mantenimiento Especializado' }
    ]
  };

  const slides = carouselImages[company.name] || carouselImages['Centro de Ingeniería y Abastecimiento ECG'];

  // Auto-advance del carrusel cada 5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="space-y-8 animate-slideUp">
      {/* Carrusel de Imágenes */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl h-96 md:h-[500px] group">
        {/* Imágenes */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.url}
              alt={slide.caption}
              className="w-full h-full object-cover"
            />
            {/* Overlay con gradiente */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Texto sobre la imagen */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h3 className="text-3xl md:text-5xl font-bold mb-2">{company.name}</h3>
              <p className="text-xl md:text-2xl opacity-90">{slide.caption}</p>
            </div>
          </div>
        ))}

        {/* Botones de navegación */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
          aria-label="Anterior"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
          aria-label="Siguiente"
        >
          <ChevronRight size={24} />
        </button>

        {/* Indicadores (dots) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Hero Section con información */}
      <div className={`bg-gradient-to-r ${company.color} rounded-3xl p-8 md:p-12 text-white shadow-2xl transform hover:scale-[1.02] transition-all duration-500`}>
        <h2 className="text-2xl md:text-4xl font-bold mb-4">{company.slogan}</h2>
        <p className="text-base md:text-lg opacity-90">{company.description}</p>
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