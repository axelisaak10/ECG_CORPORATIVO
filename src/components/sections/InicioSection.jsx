import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Eye } from 'lucide-react';
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

  useEffect(() => {
    setCurrentSlide(0);
  }, [company.id]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="space-y-8 animate-slideUp">

      {/* Carrusel */}
      {slides.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden shadow-xl h-72 md:h-[440px] group">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={slide.url} alt={slide.caption} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/60 mb-1">{company.shortName}</p>
                <h3 className="text-2xl md:text-4xl font-black leading-tight">{company.name}</h3>
                <p className="text-sm md:text-base text-white/80 mt-1">{slide.caption}</p>
              </div>
            </div>
          ))}

          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
            aria-label="Anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
            aria-label="Siguiente"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 right-6 flex space-x-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white w-6' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                aria-label={`Ir a slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Slogan Banner */}
      <div className={`bg-gradient-to-r ${company.color} rounded-2xl p-6 md:p-8 text-white shadow-lg`}>
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/60 mb-2">
          {company.shortName} — ECG Corporativo
        </p>
        <h2 className="text-xl md:text-3xl font-black leading-snug">{company.slogan}</h2>
      </div>

      {/* Features */}
      {company.features && company.features.length > 0 && (
        <div>
          <h2 className="text-lg font-black uppercase tracking-widest text-gray-400 mb-4">
            Nuestros pilares
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {company.features.map((feature, i) => (
              <button
                key={i}
                onClick={() => setSelectedFeature(i)}
                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg border border-gray-100 hover:border-gray-200 transition-all duration-300 text-left flex flex-col h-full"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${company.color} mb-4 flex items-center justify-center flex-shrink-0`}>
                  <ChevronRight className="text-white" size={18} />
                </div>
                <h3 className="text-base font-black text-gray-800 mb-2 leading-snug">{feature.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1 line-clamp-4">{feature.desc}</p>
                <div className="flex items-center gap-1 mt-4 text-xs font-bold text-gray-400 group-hover:text-gray-600 transition-colors">
                  <Eye size={13} />
                  <span>Ver galería</span>
                </div>
              </button>
            ))}
          </div>
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