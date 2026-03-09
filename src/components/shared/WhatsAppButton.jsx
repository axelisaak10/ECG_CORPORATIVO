import { MessageCircle } from 'lucide-react';

const WhatsAppButton = ({ phone, companyName }) => {
  const handleClick = () => {
    const message = encodeURIComponent(`Hola, me interesa conocer más sobre ${companyName}`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center group">
      {/* Label que aparece al hover */}
      <span className="mr-3 bg-white text-gray-800 text-sm font-semibold px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap">
        Escríbenos por WhatsApp
      </span>

      <button
        onClick={handleClick}
        className="relative bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300"
        title="Contáctanos por WhatsApp"
        aria-label="Contactar por WhatsApp"
      >
        {/* Anillo de pulso */}
        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-40" />
        <MessageCircle size={28} className="relative" />
      </button>
    </div>
  );
};

export default WhatsAppButton;