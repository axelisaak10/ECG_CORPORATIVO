import React from 'react';
import { navItems } from '../../data/navItems';

// Definimos clases completas para que Tailwind las detecte correctamente
const accentColors = {
  blue: 'bg-blue-600 text-white shadow-blue-200',
  green: 'bg-green-600 text-white shadow-green-200',
  orange: 'bg-orange-600 text-white shadow-orange-200'
};

const HamburgerMenu = ({ company, activeSection, setActiveSection, menuOpen, setMenuOpen }) => {
  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${
      menuOpen ? 'visible' : 'invisible'
    }`}>
      {/* Overlay con desenfoque suave */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${
          menuOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => setMenuOpen(false)}
      />
      
      {/* Panel Lateral del Menú */}
      <div className={`absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl transform transition-transform duration-500 ease-in-out ${
        menuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 pt-24">
          <nav className="space-y-4">
            {navItems.map((item, index) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    // Pequeño retraso para que el usuario vea la animación de selección
                    setTimeout(() => setMenuOpen(false), 200);
                  }}
                  style={{ transitionDelay: `${index * 50}ms` }}
                  className={`w-full text-left px-5 py-4 rounded-xl flex items-center space-x-4 transition-all duration-300 transform ${
                    menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
                  } ${
                    isActive
                      ? `${accentColors[company.accentColor]} scale-105 shadow-lg font-bold`
                      : 'text-gray-700 hover:bg-gray-100 hover:translate-x-2'
                  }`}
                >
                  <span className={`text-2xl ${isActive ? 'animate-bounce' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="text-lg font-medium">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default HamburgerMenu;