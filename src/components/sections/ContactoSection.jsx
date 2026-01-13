import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import SocialMediaButtons from '../shared/SocialMediaButtons';

const accentColors = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  orange: 'bg-orange-600',
  hover: {
    blue: 'hover:bg-blue-700',
    green: 'hover:bg-green-700',
    orange: 'hover:bg-orange-700'
  }
};

const ContactoSection = ({ company }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Mensaje enviado. Nos pondremos en contacto contigo pronto.');
  };

  return (
    <div className="animate-slideUp">
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
        <div className="flex items-center mb-8">
          <Mail className={`${accentColors[company.accentColor]} text-white p-3 rounded-xl mr-4`} size={48} />
          <h2 className="text-3xl md:text-4xl font-bold">Contáctanos</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Columna Izquierda: Información de contacto */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-gray-400" /> Dirección
              </h3>
              <p className="text-gray-600">Querétaro, Querétaro, México</p>
              <p className="text-sm text-gray-500 mt-2">
                Cobertura: Zona Centro y Bajío (Aguascalientes, Guanajuato, Jalisco, Michoacán, Querétaro, San Luis Potosí y Zacatecas)
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Phone size={20} className="text-gray-400" /> Teléfono y Correo
              </h3>
              <p className="text-gray-600">+{company.phone}</p>
              <p className="text-gray-600">{company.email}</p>
            </div>

            {/* INTEGRACIÓN DE REDES SOCIALES */}
            <div>
              <h3 className="text-xl font-bold mb-4">Síguenos en nuestras redes</h3>
              <SocialMediaButtons socialMedia={company.socialMedia} variant="default" />
            </div>
          </div>

          {/* Columna Derecha: Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-all"
                placeholder="Tu nombre..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-all"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
              <article>
                <textarea 
                  rows="4" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-all"
                  placeholder="¿En qué podemos ayudarte?"
                ></textarea>
              </article>
            </div>
            <button
              type="submit"
              className={`w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-95 transition-all shadow-lg ${accentColors[company.accentColor]} ${accentColors.hover[company.accentColor]}`}
            >
              <Send size={20} />
              Enviar Mensaje
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactoSection;