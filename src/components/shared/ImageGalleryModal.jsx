import React from 'react';
import { X, Play } from 'lucide-react';

/**
 * Detecta si una URL es un video
 */
const isVideoItem = (item) => {
  if (item.type === 'video') return true;
  const url = item.url || '';
  return /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(url);
};

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

        {/* Grid de imágenes y videos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feature.images.map((item, idx) => {
            const isVideo = isVideoItem(item);

            return (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {isVideo ? (
                  <div className="relative">
                    <video
                      src={item.url}
                      className="w-full h-64 object-cover"
                      controls
                      playsInline
                      poster={item.poster || undefined}
                    />
                    {/* Badge de video */}
                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none">
                      <Play size={10} fill="white" />
                      Video
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      src={item.url}
                      alt={item.caption}
                      className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <p className="text-white font-semibold p-4">{item.caption}</p>
                    </div>
                  </>
                )}

                {/* Caption para videos */}
                {isVideo && item.caption && (
                  <div className="bg-gray-50 px-4 py-2">
                    <p className="text-gray-600 text-sm font-medium">{item.caption}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryModal;