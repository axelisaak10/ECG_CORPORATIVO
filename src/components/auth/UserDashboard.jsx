import React from 'react';
import {
  User, LogOut, ArrowRight, GraduationCap, Leaf, Cog, LayoutGrid,
} from 'lucide-react';
import { companiesData } from '../../data/companies';
import ProfileSection from '../shared/ProfileSection';
import Chatbot from '../shared/Chatbot';

const UserDashboard = ({ currentUser, onGoToPortal, onSelectCompany, onLogout }) => {
  const companyIcons = [<GraduationCap size={28} />, <Leaf size={28} />, <Cog size={28} />];
  const accentText = ['text-ecg-azul', 'text-ecg-rojo1', 'text-ecg-gris'];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <span className="text-white font-black text-xs">ECG</span>
            </div>
            <div>
              <span className="text-sm font-black text-slate-800 tracking-tight">ECG</span>
              <span className="text-sm font-black text-ecg-azul tracking-tight"> CORPORATIVO</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm font-semibold text-slate-700">
              <User size={14} className="text-blue-500" />
              {currentUser.name}
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 border border-slate-200 rounded-full px-4 py-2 text-sm font-semibold text-slate-500 hover:text-ecg-rojo1 hover:border-red-200 transition-all"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-16 max-w-6xl mx-auto px-6 py-10">
        {/* Welcome hero */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-[2rem] p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute -right-6 -bottom-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="relative">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.25em] mb-2">Bienvenido de nuevo</p>
            <h1 className="text-3xl font-black tracking-tight mb-3">{currentUser.name} 👋</h1>
            <p className="text-blue-100 font-medium mb-6 max-w-lg">
              Accede a las empresas del grupo ECG Corporativo y consulta toda la información que necesitas.
            </p>
            <button
              onClick={onGoToPortal}
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm"
            >
              <LayoutGrid size={15} />
              Ir al Portal Principal
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Acceso a empresas */}
        <h2 className="text-lg font-extrabold text-slate-800 mb-4">Acceso Rápido a Empresas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {companiesData.map((company, idx) => (
            <div
              key={company.id}
              onClick={() => onSelectCompany(idx)}
              className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-4"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:rotate-6 transition-transform`}>
                {companyIcons[idx]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-slate-800 text-sm truncate">{company.name}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">{company.slogan}</p>
              </div>
              <div className={`flex items-center gap-1 font-bold text-xs uppercase tracking-wider ${accentText[idx]} flex-shrink-0`}>
                Entrar <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Perfil del usuario */}
        <ProfileSection
          currentUser={currentUser}
          onProfileUpdate={(updated) => {
            try {
              const session = JSON.parse(localStorage.getItem('ecg_session') || '{}');
              const newSession = { ...session, ...updated };
              localStorage.setItem('ecg_session', JSON.stringify(newSession));
            } catch { /* ignorar */ }
          }}
        />
      </main>

      <Chatbot userName={currentUser.name} />
    </div>
  );
};

export default UserDashboard;
