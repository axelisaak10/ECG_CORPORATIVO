import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({ company, scrolled, menuOpen, setMenuOpen }) => {
  const navigate = useNavigate();

  return (
    <header className={`fixed top-0 w-full z-[100] transition-[background-color,box-shadow,height] duration-150 ${
      scrolled ? 'bg-white shadow-lg h-20' : 'bg-white h-24'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">

        {/* Logo — clic lleva a la sección Inicio */}
        <button
          onClick={() => navigate(`/empresa/${company.id}/inicio`)}
          className="flex items-center space-x-4 min-w-0 group"
          title="Ir al Inicio"
        >
          <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg p-1 group-hover:ring-2 group-hover:ring-offset-1 transition-all"
            style={{ ringColor: 'currentColor' }}
          >
            <img
              src={company.logo}
              alt={`Logo ${company.name}`}
              className="w-full h-full object-contain"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=ECG'; }}
            />
          </div>
          <div className="truncate text-left">
            <h1 className={`text-sm md:text-lg font-extrabold bg-gradient-to-r ${company.color} bg-clip-text text-transparent uppercase truncate`}>
              {company.name}
            </h1>
            <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Corporativo</span>
          </div>
        </button>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 border border-gray-100"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
    </header>
  );
};

export default Header;