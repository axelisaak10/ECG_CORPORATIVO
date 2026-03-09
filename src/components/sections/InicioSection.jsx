import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import ImageGalleryModal from '../shared/ImageGalleryModal';

const InicioSection = ({ company }) => {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = company.carouselImages || [];

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Reinicia el carrusel al cambiar de empresa
  useEffect(() => {
    setCurrentSlide(0);
  }, [company.id]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="space-y-8 animate-slideUp">

      {/* Carrusel */}
      {slides.length > 0 && (
        <div className="relative rounded-3xl overflow-hidden shadow-2xl h-96 md:h-[500px] group">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={slide.url} alt={slide.caption} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-3xl md:text-5xl font-bold mb-2">{company.name}</h3>
                <p className="text-xl md:text-2xl opacity-90">{slide.caption}</p>
              </div>
            </div>
          ))}

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

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white w-8' : 'w-3 bg-white/50 hover:bg-white/75'}`}
                aria-label={`Ir a slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hero */}
      <div className={`bg-gradient-to-r ${company.color} rounded-3xl p-8 md:p-12 text-white shadow-2xl transform hover:scale-[1.02] transition-all duration-500`}>
        <h2 className="text-2xl md:text-4xl font-bold mb-4">{company.slogan}</h2>
        <p className="text-base md:text-lg opacity-90">{company.description}</p>
      </div>

      {/* Features */}
      {company.features && (
        <div className="grid md:grid-cols-3 gap-6">
          {company.features.map((feature, i) => (
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
      )}

      {/* Modal galería */}
      {selectedFeature !== null && (
        <ImageGalleryModal
          feature={company.features[selectedFeature]}
          companyColor={company.color}
          onClose={() => setSelectedFeature(null)}
        />
      )}
    </div>
  );
};

export default InicioSection;