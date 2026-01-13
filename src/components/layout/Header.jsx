import React from 'react';
import { Menu, X } from 'lucide-react';
import HamburgerMenu from './HamburgerMenu'; 

const Header = ({ company, activeSection, setActiveSection, scrolled, menuOpen, setMenuOpen }) => {
  return (
    <>
      <header className={`fixed top-0 w-full z-[100] transition-all duration-300 ${
        scrolled ? 'bg-white shadow-lg h-20' : 'bg-white/90 backdrop-blur-md h-24'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
          
          {/* Logo y Texto */}
          <div className="flex items-center space-x-4 min-w-0">
            <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-lg p-1">
              <img 
                src={company.logo} 
                alt="Logo" 
                className="w-full h-full object-contain"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=ECG'; }}
              />
            </div>
            <div className="truncate">
              <h1 className={`text-sm md:text-lg font-extrabold bg-gradient-to-r ${company.color} bg-clip-text text-transparent uppercase truncate`}>
                {company.name}
              </h1>
              <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Corporativo</span>
            </div>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 border border-gray-100"
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

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