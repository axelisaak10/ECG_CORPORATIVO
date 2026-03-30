import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import SocialMediaButtons from '../shared/SocialMediaButtons';
import { apiSendContacto } from '../../utils/api';

const accentColors = {
  blue:   { bg: 'bg-blue-600',   hover: 'hover:bg-blue-700' },
  red:    { bg: 'bg-red-600',    hover: 'hover:bg-red-700' },
  gray:   { bg: 'bg-gray-700',   hover: 'hover:bg-gray-800' },
  green:  { bg: 'bg-green-600',  hover: 'hover:bg-green-700' },
  orange: { bg: 'bg-orange-600', hover: 'hover:bg-orange-700' }
};

const ContactoSection = ({ company }) => {
  const accent = accentColors[company.accentColor] || accentColors.blue;
  const [form, setForm]       = useState({ nombre: '', correo: '', mensaje: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await apiSendContacto(form.nombre, form.correo, form.mensaje, company.name);
      setSent(true);
      setForm({ nombre: '', correo: '', mensaje: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-slideUp">
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
        <div className="flex items-center mb-8">
          <Mail className={`${accent.bg} text-white p-3 rounded-xl mr-4`} size={48} />
          <h2 className="text-3xl md:text-4xl font-bold">Contáctanos</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Columna Izquierda: Información de contacto */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-gray-400" /> Dirección
              </h3>
              <p className="text-gray-600">{company.direccion}</p>
              {company.cobertura && (
                <p className="text-sm text-gray-500 mt-2">Cobertura: {company.cobertura}</p>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Phone size={20} className="text-gray-400" /> Teléfono y Correo
              </h3>
              <p className="text-gray-600">+{company.phone}</p>
              <p className="text-gray-600">{company.email}</p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Síguenos en nuestras redes</h3>
              <SocialMediaButtons socialMedia={company.socialMedia} variant="default" />
            </div>
          </div>

          {/* Columna Derecha: Formulario */}
          {sent ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Send size={28} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">¡Mensaje enviado!</h3>
              <p className="text-gray-500">Nos pondremos en contacto contigo pronto.</p>
              <button onClick={() => setSent(false)} className="text-sm text-gray-400 underline">Enviar otro mensaje</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-all"
                  placeholder="Tu nombre..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={form.correo}
                  onChange={e => set('correo', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-all"
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <textarea
                  rows="4"
                  required
                  value={form.mensaje}
                  onChange={e => set('mensaje', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-all"
                  placeholder="¿En qué podemos ayudarte?"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className={`w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${accent.bg} ${accent.hover}`}
              >
                <Send size={20} />
                {sending ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactoSection;