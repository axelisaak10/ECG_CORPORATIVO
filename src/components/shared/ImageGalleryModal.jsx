import React from 'react';
import { X } from 'lucide-react';

const ImageGalleryModal = ({ feature, companyColor, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors"
          aria-label="Cerrar galería"
        >
          <X size={24} />
        </button>

        {/* Título */}
        <h2 className={`text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r ${companyColor} bg-clip-text text-transparent`}>
          {feature.name}
        </h2>
        <p className="text-lg text-gray-600 mb-8">{feature.desc}</p>

        {/* Grid de imágenes */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feature.images.map((img, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <img
                src={img.url}
                alt={img.caption}
                className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <p className="text-white font-semibold p-4">{img.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryModal;