import React from 'react';
import { navItems } from '../../data/navItems';

// Mapeo extendido para asegurar que JECG (red) e Ingeniería (gray) funcionen
const accentColors = {
  blue: 'bg-blue-600 text-white shadow-blue-200',
  red: 'bg-red-600 text-white shadow-red-200',
  gray: 'bg-gray-700 text-white shadow-gray-200',
  green: 'bg-green-600 text-white shadow-green-200',
  orange: 'bg-orange-600 text-white shadow-orange-200'
};

const HamburgerMenu = ({ company, activeSection, setActiveSection, menuOpen, setMenuOpen }) => {
  return (
    <div className={`fixed inset-0 z-[110] ${menuOpen ? 'visible' : 'invisible'}`}>
      {/* Overlay con desenfoque suave para cerrar el menú */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${
          menuOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => setMenuOpen(false)}
      />
      
      {/* Panel Lateral con desplazamiento (Scroll) habilitado */}
      <div className={`absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col ${
        menuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* LA CLAVE: 'overflow-y-auto' permite navegar si el zoom es alto y el contenido se sale de la pantalla */}
        <div className="flex-grow overflow-y-auto overflow-x-hidden pt-24 pb-8 px-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Navegación</h2>
          
          <nav className="space-y-4">
            {navItems.map((item, index) => {
              const isActive = activeSection === item.id;
              // Buscamos la clase según el accentColor de la empresa
              const activeClass = accentColors[company.accentColor] || accentColors.blue;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    // Retraso pequeño para cerrar después de la animación de clic
                    setTimeout(() => setMenuOpen(false), 250);
                  }}
                  style={{ transitionDelay: `${index * 50}ms` }}
                  className={`w-full text-left px-5 py-4 rounded-2xl flex items-center space-x-4 transition-all duration-300 transform ${
                    menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
                  } ${
                    isActive
                      ? `${activeClass} scale-105 shadow-lg font-bold`
                      : 'text-gray-700 hover:bg-gray-100 hover:translate-x-2'
                  }`}
                >
                  <span className={`text-2xl transition-transform ${isActive ? 'animate-bounce' : 'group-hover:rotate-12'}`}>
                    {item.icon}
                  </span>
                  <span className="text-lg font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Información de contacto dinámica al final del scroll */}
          <div className="mt-10 pt-6 border-t border-gray-100">
            <p className="text-sm font-bold text-gray-800 break-words">{company.phone}</p>
            <p className="text-xs text-gray-500 break-words">{company.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HamburgerMenu;