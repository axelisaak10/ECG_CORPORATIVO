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
import { companiesData } from './data/companies';

function App() {
  const [activeCompany, setActiveCompany] = useState(2); // Inicia en ECG principal
  const [activeSection, setActiveSection] = useState('inicio');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentCompany = companiesData[activeCompany];

  // Renderizar sección activa
  const renderSection = () => {
    switch (activeSection) {
      case 'inicio':
        return <InicioSection company={currentCompany} />;
      case 'nosotros':
        return <NosotrosSection company={currentCompany} />;
      case 'servicios':
        return <ServiciosSection company={currentCompany} />;
      case 'miembros':
        return <MiembrosSection company={currentCompany} />;
      case 'politicas':
        return <PoliticasSection company={currentCompany} />;
      case 'contacto':
        return <ContactoSection company={currentCompany} />;
      default:
        return <InicioSection company={currentCompany} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <Header
        company={currentCompany}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        scrolled={scrolled}
      />

      {/* Menu Hamburguesa */}
      <HamburgerMenu
        company={currentCompany}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* Selector de Empresas */}
      <CompanySelector
        companies={companiesData}
        activeCompany={activeCompany}
        setActiveCompany={setActiveCompany}
      />

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="animate-fadeIn">
          {renderSection()}
        </div>
      </main>

      {/* Botón de WhatsApp */}
      <WhatsAppButton
        phone={currentCompany.phone}
        companyName={currentCompany.name}
      />
    </div>
  );
}

export default App;