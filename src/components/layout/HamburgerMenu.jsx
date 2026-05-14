import React from 'react';
import { LogIn, LogOut, User, X, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { navItems } from '../../data/navItems';

const accentColors = {
  'ecg-azul':   { pill: 'bg-ecg-azul',   glow: 'shadow-blue-500/40',  text: 'text-ecg-azul',   soft: 'bg-blue-50'   },
  'ecg-rojo1':    { pill: 'bg-ecg-rojo1',    glow: 'shadow-red-500/40',   text: 'text-ecg-rojo1',    soft: 'bg-red-50'    },
  'ecg-gris':   { pill: 'bg-ecg-gris',   glow: 'shadow-gray-500/40',  text: 'text-ecg-negro',   soft: 'bg-gray-100'  },
  green:  { pill: 'bg-green-600',  glow: 'shadow-green-500/40', text: 'text-green-600',  soft: 'bg-green-50'  },
  orange: { pill: 'bg-orange-500', glow: 'shadow-orange-500/40',text: 'text-orange-500', soft: 'bg-orange-50' },
};

const HamburgerMenu = ({
  company,
  activeSection,
  setActiveSection,
  menuOpen,
  setMenuOpen,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const accent = accentColors[company?.accentColor] ?? accentColors['ecg-azul'];
  const navigate = useNavigate();

  return (
    <div className={`fixed inset-0 z-[110] ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>

      {/* ── Backdrop ── */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`absolute inset-0 transition-all duration-280 ${
          menuOpen ? 'bg-black/60 opacity-100' : 'opacity-0'
        }`}
      />

      {/* ── Panel ── */}
      <aside
        className={`absolute right-0 top-0 bottom-0 w-80 flex flex-col bg-white shadow-2xl transform transition-transform duration-280 ease-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ borderLeft: '1px solid rgba(0,0,0,0.06)' }}
      >

        {/* ── Decorative top bar ── */}
        <div className={`h-1 w-full ${accent.pill}`} />

        {/* ── Header row ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-gray-400">Menú</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X size={14} className="text-ecg-gris" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8">

          {/* ── Auth block ── */}
          <div className="mb-6">
            {currentUser ? (
              <div
                className="rounded-2xl p-4 mb-2"
                style={{ background: 'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)', border: '1px solid #e2e8f0' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-full ${accent.pill} flex items-center justify-center shadow-md ${accent.glow}`}>
                    <User size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email ?? 'Usuario activo'}</p>
                  </div>
                </div>
                <button
                  onClick={() => { navigate(currentUser.role === 'admin' ? '/admin' : '/usuario'); setMenuOpen(false); }}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white text-sm font-semibold transition-all mb-2 ${accent.pill}`}
                >
                  <LayoutDashboard size={14} />
                  Ir al Panel
                </button>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-red-500 hover:bg-red-50 text-sm font-semibold transition-all border border-red-100"
                >
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-bold shadow-lg ${accent.pill} ${accent.glow} transition-transform hover:scale-[1.02] active:scale-[0.98]`}
                style={{ boxShadow: `0 8px 24px -6px var(--tw-shadow-color)` }}
              >
                <LogIn size={16} />
                Iniciar sesión
              </button>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-gray-400">Secciones</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* ── Nav items ── */}
          <nav className="space-y-1.5">
            {navItems.map((item, index) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setTimeout(() => setMenuOpen(false), 280);
                  }}
                  style={{
                    transitionDelay: menuOpen ? `${index * 45}ms` : '0ms',
                  }}
                  className={`group w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-[transform,opacity,background-color] duration-200 ${
                    menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                  } ${
                    isActive
                      ? `${accent.pill} text-white shadow-lg ${accent.glow}`
                      : 'text-ecg-gris hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {/* Icon bubble */}
                  <span
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-lg transition-transform duration-200 flex-shrink-0 ${
                      isActive
                        ? 'bg-white/20'
                        : `${accent.soft} group-hover:scale-110`
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span className="font-semibold text-[15px] leading-tight flex-1">
                    {item.label}
                  </span>

                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 py-5 border-t border-gray-100"
          style={{ background: 'linear-gradient(to top, #f8fafc, transparent)' }}
        >
          <p className="text-xs font-bold text-ecg-negro truncate">{company?.name}</p>
          <p className="text-[11px] text-gray-400 truncate mt-0.5">{company?.phone}</p>
          <p className="text-[11px] text-gray-400 truncate">{company?.email}</p>
        </div>
      </aside>
    </div>
  );
};

export default HamburgerMenu;