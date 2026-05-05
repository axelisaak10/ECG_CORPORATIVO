import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import SocialMediaButtons from '../shared/SocialMediaButtons';
import { apiSendContacto } from '../../utils/api';

const accentColors = {
  'ecg-azul': { bg: 'bg-ecg-azul', hover: 'hover:opacity-90', icon: 'text-ecg-azul', soft: 'bg-blue-50' },
  'ecg-rojo1': { bg: 'bg-ecg-rojo1', hover: 'hover:opacity-90', icon: 'text-ecg-rojo1', soft: 'bg-red-50' },
  'ecg-gris': { bg: 'bg-ecg-negro', hover: 'hover:opacity-90', icon: 'text-ecg-negro', soft: 'bg-gray-100' },
};

const InfoRow = ({ icon, label, children }) => (
  <div className="flex gap-3 items-start">
    <div className="w-8 h-8 flex-shrink-0 bg-gray-50 rounded-lg flex items-center justify-center">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
      <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  </div>
);

const ContactoSection = ({ company }) => {
  const accent = accentColors[company.accentColor] || accentColors['ecg-azul'];
  const [form, setForm] = useState({ nombre: '', correo: '', mensaje: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

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
    <div className="animate-slideUp space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 flex-shrink-0 ${accent.bg} text-white rounded-xl flex items-center justify-center shadow-md`}>
          <Mail size={22} />
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">Estamos aquí para ayudarte</p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">Contáctanos</h2>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">

        {/* Columna izquierda: Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Información de contacto</h3>

          <InfoRow icon={<MapPin size={15} className="text-gray-400" />} label="Dirección">
            <p>{company.direccion}</p>
            {company.cobertura && (
              <p className="text-gray-400 text-xs mt-1">Cobertura: {company.cobertura}</p>
            )}
          </InfoRow>

          <InfoRow icon={<Phone size={15} className="text-gray-400" />} label="Teléfono y Correo">
            <p>+{company.phone}</p>
            <p className="text-gray-500">{company.email}</p>
          </InfoRow>

          <InfoRow icon={<Clock size={15} className="text-gray-400" />} label="Horario">
            <p>Lunes a Viernes</p>
            <p className="text-gray-500">09:00 am – 17:00 hrs</p>
          </InfoRow>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Redes sociales</p>
            <SocialMediaButtons socialMedia={company.socialMedia} variant="default" />
          </div>
        </div>

        {/* Columna derecha: Formulario */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {sent ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-10">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                <Send size={24} className="text-green-500" />
              </div>
              <h3 className="text-lg font-black text-gray-800">¡Mensaje enviado!</h3>
              <p className="text-gray-400 text-sm">Nos pondremos en contacto contigo pronto.</p>
              <button onClick={() => setSent(false)} className="text-xs text-gray-400 underline underline-offset-2">
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 h-full flex flex-col">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Envíanos un mensaje</h3>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="Tu nombre..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={form.correo}
                  onChange={e => set('correo', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="tu@email.com"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Mensaje</label>
                <textarea
                  rows="4"
                  required
                  value={form.mensaje}
                  onChange={e => set('mensaje', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none transition-all resize-none bg-gray-50 focus:bg-white flex-1"
                  placeholder="¿En qué podemos ayudarte?"
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className={`w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm ${accent.bg} ${accent.hover}`}
              >
                <Send size={16} />
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