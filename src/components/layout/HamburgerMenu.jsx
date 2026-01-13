import React from 'react';
import { navItems } from '../../data/navItems';

const accentColors = {
  blue: 'bg-blue-600 text-white shadow-blue-200',
  red: 'bg-red-600 text-white shadow-red-200', 
  gray: 'bg-gray-700 text-white shadow-gray-200'
};

const HamburgerMenu = ({ company, activeSection, setActiveSection, menuOpen, setMenuOpen }) => {
  return (
    <div className={`fixed inset-0 z-[110] ${menuOpen ? 'visible' : 'invisible'}`}>
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${
          menuOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => setMenuOpen(false)}
      />
      
      {/* Panel Lateral */}
      <div className={`absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl transform transition-transform duration-500 ease-in-out ${
        menuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 pt-24">
          <nav className="space-y-4">
            {navItems.map((item, index) => {
              const isActive = activeSection === item.id;
              const activeClass = accentColors[company.accentColor] || accentColors.blue;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setTimeout(() => setMenuOpen(false), 200);
                  }}
                  style={{ transitionDelay: `${index * 50}ms` }}
                  className={`w-full text-left px-5 py-4 rounded-xl flex items-center space-x-4 transition-all duration-300 transform ${
                    menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
                  } ${
                    isActive
                      ? `${activeClass} scale-105 shadow-lg font-bold`
                      : 'text-gray-700 hover:bg-gray-100 hover:translate-x-2'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-lg font-medium">{item.label}</span>
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