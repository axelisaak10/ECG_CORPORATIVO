import React from 'react';
import { Mail } from 'lucide-react';

const accentColors = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  orange: 'bg-orange-600'
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
          {/* Información de contacto */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Dirección</h3>
              <p className="text-gray-600">Querétaro, Querétaro, México</p>
              <p className="text-sm text-gray-500 mt-2">
                Cobertura: Zona Centro y Bajío (Aguascalientes, Guanajuato, Jalisco, Michoacán, Querétaro, San Luis Potosí y Zacatecas)
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Email</h3>
              <p className="text-gray-600">{company.email}</p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Teléfono</h3>
              <p className="text-gray-600">+52 442 676 7490</p>
              {company.name === 'Centro de Ingeniería y Abastecimiento ECG' && (
                <p className="text-gray-600">Ing. Erasmo Cuaya: +52 442 669 1732</p>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Horario de Atención</h3>
              <p className="text-gray-600">Lunes a Viernes</p>
              <p className="text-gray-600">08:00 am - 18:00 hrs</p>
            </div>
          </div>

          {/* Formulario de contacto */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-current focus:outline-none transition-all"
              />
              <input
                type="email"
                placeholder="Email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-current focus:outline-none transition-all"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-current focus:outline-none transition-all"
              />
              <textarea
                placeholder="Mensaje"
                rows={4}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-current focus:outline-none transition-all"
              />
              <button
                type="submit"
                className={`w-full py-3 rounded-lg bg-gradient-to-r ${company.color} text-white font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300`}
              >
                Enviar Mensaje
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactoSection;