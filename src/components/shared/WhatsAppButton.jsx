import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = ({ phone, companyName }) => {
  const handleClick = () => {
    const message = encodeURIComponent(`Hola, me interesa conocer más sobre ${companyName}`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 z-50 animate-bounce"
      title="Contáctanos por WhatsApp"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle size={28} />
    </button>
  );
};

export default WhatsAppButton;