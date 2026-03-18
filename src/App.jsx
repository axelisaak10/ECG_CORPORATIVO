import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
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
import MainPortal from './components/layout/MainPortal';
import AuthModal from './components/auth/AuthModal';
import AdminDashboard from './components/auth/AdminDashboard';
import UserDashboard from './components/auth/UserDashboard';
import { Home, LogIn, LogOut, User, ArrowLeftRight } from 'lucide-react';
import { companiesData } from './data/companies';

// ── Shared auth state ────────────────────────────────────────────────────────
function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const session = localStorage.getItem('ecg_session');
      return session ? JSON.parse(session) : null;
    } catch {
      localStorage.removeItem('ecg_session');
      return null;
    }
  });

  const login = (user) => {
    localStorage.setItem('ecg_session', JSON.stringify(user));
    setCurrentUser(user);
  };

  const logout = async () => {
    const token = currentUser?.sessionToken;
    if (token) {
      try { await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }); }
      catch { /* ignorar errores de red al cerrar sesión */ }
    }
    localStorage.removeItem('ecg_session');
    setCurrentUser(null);
  };

  const impersonate = (targetUser) => {
    const impersonated = { ...targetUser, impersonatedBy: currentUser };
    localStorage.setItem('ecg_session', JSON.stringify(impersonated));
    setCurrentUser(impersonated);
  };

  const stopImpersonating = () => {
    const original = currentUser?.impersonatedBy;
    if (!original) return;
    localStorage.setItem('ecg_session', JSON.stringify(original));
    setCurrentUser(original);
  };

  return { currentUser, login, logout, impersonate, stopImpersonating };
}

// ── Portal principal ─────────────────────────────────────────────────────────
function PortalView({ currentUser, onLogin, onLogout }) {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  const handleLogin = (user) => {
    onLogin(user);
    if (user.role === 'admin') navigate('/admin');
    else navigate('/usuario');
  };

  const handleSelectCompany = (index) => {
    navigate(`/empresa/${companiesData[index].id}/inicio`);
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-[200] flex items-center gap-2">
        {currentUser ? (
          <>
            <button
              onClick={() => navigate(currentUser.role === 'admin' ? '/admin' : '/usuario')}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-all"
            >
              <User size={14} className="text-blue-500" />
              {currentUser.name}
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-2 shadow-sm text-sm font-semibold text-slate-500 hover:text-red-600 hover:border-red-200 transition-all"
              title="Cerrar sesión"
            >
              <LogOut size={14} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm text-sm font-semibold text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all"
          >
            <LogIn size={14} />
            Iniciar sesión
          </button>
        )}
      </div>

      <MainPortal companies={companiesData} onSelectCompany={handleSelectCompany} />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />}
    </>
  );
}

// ── Vista empresa ────────────────────────────────────────────────────────────
function EmpresaView({ currentUser, onLogin, onLogout }) {
  const navigate = useNavigate();
  const { id, seccion } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const companyIndex = companiesData.findIndex((c) => String(c.id) === String(id));
  const company = companiesData[companyIndex] ?? companiesData[0];
  const activeSection = seccion || 'inicio';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll al cambiar sección
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [seccion]);

  const handleLogin = (user) => {
    onLogin(user);
    if (user.role === 'admin') navigate('/admin');
    else navigate('/usuario');
  };

  const setActiveSection = (s) => {
    navigate(`/empresa/${id}/${s}`);
  };

  const setActiveCompany = (index) => {
    navigate(`/empresa/${companiesData[index].id}/${activeSection}`);
  };

  if (companyIndex === -1) return <Navigate to="/" replace />;

  const renderSection = () => {
    switch (activeSection) {
      case 'inicio':    return <InicioSection company={company} />;
      case 'nosotros':  return <NosotrosSection company={company} />;
      case 'servicios': return <ServiciosSection company={company} />;
      case 'miembros':  return <MiembrosSection company={company} />;
      case 'politicas': return <PoliticasSection company={company} />;
      case 'contacto':  return <ContactoSection company={company} />;
      default:          return <InicioSection company={company} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 animate-fadeIn">
      <Header
        company={company}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        scrolled={scrolled}
      />

      <HamburgerMenu
        company={company}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        currentUser={currentUser}
        onOpenAuth={() => { setMenuOpen(false); setShowAuth(true); }}
        onLogout={onLogout}
      />

      <button
        onClick={() => navigate('/')}
        className="fixed bottom-24 left-6 z-[150] bg-white text-gray-700 p-4 rounded-full shadow-2xl border border-gray-100 hover:scale-110 transition-all group"
        title="Regresar al Portal Central"
      >
        <Home size={24} className="group-hover:text-blue-600" />
      </button>

      <CompanySelector
        companies={companiesData}
        activeCompany={companyIndex}
        setActiveCompany={setActiveCompany}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="animate-fadeIn">
          {renderSection()}
        </div>
      </main>

      <WhatsAppButton
        phone={company.phone}
        companyName={company.name}
      />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />}
    </div>
  );
}

// ── Redirect /empresa/:id → /empresa/:id/inicio ─────────────────────────────
function EmpresaRedirect() {
  const { id } = useParams();
  return <Navigate to={`/empresa/${id}/inicio`} replace />;
}

// ── Banner de impersonación ───────────────────────────────────────────────────
function ImpersonationBanner({ currentUser, onStop }) {
  if (!currentUser?.impersonatedBy) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ArrowLeftRight size={16} />
        Viendo como: <span className="font-black">{currentUser.name}</span>
        <span className="opacity-75">({currentUser.email})</span>
      </div>
      <button
        onClick={onStop}
        className="bg-white text-amber-600 font-black text-xs px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
      >
        Volver a mi sesión
      </button>
    </div>
  );
}

// ── App raíz con rutas ───────────────────────────────────────────────────────
function App() {
  const navigate = useNavigate();
  const { currentUser, login, logout, impersonate, stopImpersonating } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleImpersonate = (targetUser) => {
    impersonate(targetUser);
    if (targetUser.role === 'admin') navigate('/admin');
    else navigate('/usuario');
  };

  const handleStopImpersonating = () => {
    stopImpersonating();
    navigate('/admin');
  };

  return (
    <>
    <ImpersonationBanner currentUser={currentUser} onStop={handleStopImpersonating} />
    <Routes>
      <Route
        path="/"
        element={<PortalView currentUser={currentUser} onLogin={login} onLogout={handleLogout} />}
      />
      <Route
        path="/empresa/:id/:seccion"
        element={<EmpresaView currentUser={currentUser} onLogin={login} onLogout={handleLogout} />}
      />
      <Route
        path="/empresa/:id"
        element={<EmpresaRedirect />}
      />
      <Route
        path="/admin"
        element={
          currentUser?.role === 'admin'
            ? <AdminDashboard currentUser={currentUser} onGoToPortal={() => navigate('/')} onLogout={handleLogout} onImpersonate={handleImpersonate} />
            : <Navigate to="/" replace />
        }
      />
      <Route
        path="/usuario"
        element={
          currentUser
            ? <UserDashboard
                currentUser={currentUser}
                onGoToPortal={() => navigate('/')}
                onSelectCompany={(index) => navigate(`/empresa/${companiesData[index].id}/inicio`)}
                onLogout={handleLogout}
              />
            : <Navigate to="/" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
