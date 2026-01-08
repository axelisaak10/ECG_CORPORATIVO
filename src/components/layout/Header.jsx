import React from 'react';
import { Menu, X } from 'lucide-react';

const Header = ({ company, menuOpen, setMenuOpen, scrolled }) => {
  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-lg' : 'bg-white/90 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${company.color} bg-clip-text text-transparent transition-all duration-500`}>
            {company.name}
          </h1>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;