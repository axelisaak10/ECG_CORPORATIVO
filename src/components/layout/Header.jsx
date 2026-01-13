import React from 'react';
import { Menu, X } from 'lucide-react';
import HamburgerMenu from './HamburgerMenu'; // Asegúrate de que la ruta sea correcta

const Header = ({ company, activeSection, setActiveSection, scrolled, menuOpen, setMenuOpen }) => {
  return (
    <>
      <header className={`fixed top-0 w-full z-[100] transition-all duration-300 ${
        scrolled ? 'bg-white shadow-lg h-20' : 'bg-white/90 backdrop-blur-md h-24'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            
            {/* Logo y Título */}
            <div className="flex items-center space-x-4">
              <img 
                src={company.logo} 
                alt={company.name} 
                className="h-12 w-auto object-contain transition-transform duration-500 hover:scale-110"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=ECG'; }} 
              />
              <div className="flex flex-col">
                <h1 className={`text-lg md:text-xl font-extrabold bg-gradient-to-r ${company.color} bg-clip-text text-transparent uppercase tracking-wider`}>
                  {company.name}
                </h1>
                <span className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">
                  Corporativo Industrial
                </span>
              </div>
            </div>

            {/* Botón Hamburguesa */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 rounded-2xl transition-all duration-300 text-gray-600 hover:bg-gray-100 border border-gray-100 shadow-sm"
            >
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {/* LLAMADA AL MENÚ LATERAL */}
      <HamburgerMenu 
        company={company}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />
    </>
  );
};

export default Header;