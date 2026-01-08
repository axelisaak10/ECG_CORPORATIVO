import React from 'react';
import { navItems } from '../../data/navItems';

const accentColors = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  orange: 'bg-orange-600'
};

const HamburgerMenu = ({ company, activeSection, setActiveSection, menuOpen, setMenuOpen }) => {
  return (
    <div className={`fixed inset-0 z-40 transition-all duration-300 ${
      menuOpen ? 'visible' : 'invisible'
    }`}>
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          menuOpen ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={() => setMenuOpen(false)}
      />
      
      {/* Menu */}
      <div className={`absolute right-0 top-16 bottom-0 w-64 bg-white shadow-2xl transform transition-transform duration-300 ${
        menuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 flex items-center space-x-3 ${
                activeSection === item.id
                  ? `${accentColors[company.accentColor]} text-white shadow-lg`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default HamburgerMenu;