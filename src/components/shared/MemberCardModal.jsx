import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Phone, Linkedin, Briefcase, Award, ChevronRight } from 'lucide-react';

const MemberCardModal = ({ member, companyColor, accentBg, onClose }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!member) return null;

  const hasImage = member.image && member.image.trim() !== '';

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slideUp"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUpModal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        {/* Header con gradiente */}
        <div className={`relative h-36 bg-gradient-to-br ${companyColor}`}>
          {/* Patrón decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full" />
            <div className="absolute top-12 right-12 w-20 h-20 border-2 border-white rounded-full" />
            <div className="absolute bottom-2 left-6 w-16 h-16 border border-white rounded-full" />
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full p-2 transition-all duration-300 z-10"
            aria-label="Cerrar tarjeta"
          >
            <X size={18} />
          </button>
        </div>

        {/* Avatar / Foto — sobrepuesto */}
        <div className="flex justify-center -mt-16 relative z-10">
          {hasImage ? (
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100">
              <img
                src={member.image}
                alt={member.name}
                className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImgLoaded(true)}
              />
              {!imgLoaded && (
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${companyColor} flex items-center justify-center`}>
                  <span className="text-white text-4xl font-black">
                    {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${companyColor} flex items-center justify-center text-white text-4xl font-black border-4 border-white shadow-xl`}>
              {member.name ? member.name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="px-8 pb-8 pt-4 text-center">
          <h3 className="text-xl font-black text-gray-900 mb-1">{member.name}</h3>
          <span className={`inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full ${accentBg} mb-3`}>
            {member.role}
          </span>

          {/* Specialty */}
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-4">
            <Award size={14} className="text-gray-400" />
            <span>{member.specialty}</span>
          </div>

          {/* Bio */}
          {member.bio && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-left">
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{member.bio}</p>
            </div>
          )}

          {/* Info de contacto si la hay */}
          <div className="flex flex-col gap-2">
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-lg ${accentBg} flex items-center justify-center flex-shrink-0`}>
                  <Mail size={14} />
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">{member.email}</span>
                <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-gray-500" />
              </a>
            )}
            {member.phone && (
              <a
                href={`tel:${member.phone}`}
                className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-lg ${accentBg} flex items-center justify-center flex-shrink-0`}>
                  <Phone size={14} />
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">{member.phone}</span>
                <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-gray-500" />
              </a>
            )}
            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-lg ${accentBg} flex items-center justify-center flex-shrink-0`}>
                  <Linkedin size={14} />
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">LinkedIn</span>
                <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-gray-500" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MemberCardModal;
