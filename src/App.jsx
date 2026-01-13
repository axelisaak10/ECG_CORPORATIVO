import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import HamburgerMenu from './components/layout/HamburgerMenu';
import CompanySelector from './components/layout/CompanySelector';
import WhatsAppButton from './components/shared/WhatsAppButton';
import InicioSection from './components/sections/InicioSection';
import NosotrosSection from './components/sections/NosotrosSection';
import ServiciosSection from './components/sections/ServiciosSection';
import MiembrosSection from './components/sections/MiembrosSection';
import PoliticasSection from './components/sections/PoliticasSection';
import ContactoSection from './components/sections/ContactoSection';
import MainPortal from './components/layout/MainPortal'; // Importa el nuevo componente
import { Home } from 'lucide-react';
import { companiesData } from './data/companies';

function App() {
  const [viewMode, setViewMode] = useState('portal'); // 'portal' o 'empresa'
  const [activeCompany, setActiveCompany] = useState(0);
  const [activeSection, setActiveSection] = useState('inicio');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentCompany = companiesData[activeCompany];

  // Función para seleccionar empresa desde el Portal
  const handleSelectCompany = (index) => {
    setActiveCompany(index);
    setViewMode('empresa');
    setActiveSection('inicio');
    window.scrollTo(0, 0);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'inicio': return <InicioSection company={currentCompany} />;
      case 'nosotros': return <NosotrosSection company={currentCompany} />;
      case 'servicios': return <ServiciosSection company={currentCompany} />;
      case 'miembros': return <MiembrosSection company={currentCompany} />;
      case 'politicas': return <PoliticasSection company={currentCompany} />;
      case 'contacto': return <ContactoSection company={currentCompany} />;
      default: return <InicioSection company={currentCompany} />;
    }
  };

  // RENDERIZADO CONDICIONAL: Portal vs Empresa
  if (viewMode === 'portal') {
    return (
      <MainPortal 
        companies={companiesData} 
        onSelectCompany={handleSelectCompany} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 animate-fadeIn">
      <Header
        company={currentCompany}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        scrolled={scrolled}
      />

      <HamburgerMenu
        company={currentCompany}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* Botón flotante para regresar al Portal Principal */}
      <button
        onClick={() => setViewMode('portal')}
        className="fixed bottom-24 left-6 z-[150] bg-white text-gray-700 p-4 rounded-full shadow-2xl border border-gray-100 hover:scale-110 transition-all group"
        title="Regresar al Portal Central"
      >
        <Home size={24} className="group-hover:text-blue-600" />
      </button>

      <CompanySelector
        companies={companiesData}
        activeCompany={activeCompany}
        setActiveCompany={setActiveCompany}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="animate-fadeIn">
          {renderSection()}
        </div>
      </main>

      <WhatsAppButton
        phone={currentCompany.phone}
        companyName={currentCompany.name}
      />
    </div>
  );
}

export default App;