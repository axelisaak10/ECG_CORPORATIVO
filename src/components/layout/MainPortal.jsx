import React from 'react';
import { ArrowRight, GraduationCap, Leaf, Cog } from 'lucide-react';

const MainPortal = ({ companies, onSelectCompany }) => {
  const icons = [<GraduationCap size={40} />, <Leaf size={40} />, <Cog size={40} />];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 lg:p-12 overflow-x-hidden">
      {/* Hero Central */}
      <div className="text-center mb-16 max-w-4xl animate-slideDown">
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter">
          ECG <span className="text-blue-600">CORPORATIVO</span>
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed font-medium">
          Impulsando la excelencia industrial a través de la formación técnica, 
          la ingeniería avanzada y la sustentabilidad energética.
        </p>
      </div>

      {/* Grid de Acceso Directo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full animate-slideUp">
        {companies.map((company, idx) => (
          <div 
            key={company.id}
            onClick={() => onSelectCompany(idx)}
            className="group relative bg-white rounded-[2.5rem] p-10 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer border border-slate-100 overflow-hidden transform hover:-translate-y-3"
          >
            {/* Decoración de fondo con el color de la empresa */}
            <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${company.color} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`} />

            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white mb-8 shadow-lg shadow-current/20 group-hover:rotate-6 transition-transform`}>
              {icons[idx]}
            </div>

            <h3 className="text-2xl font-extrabold text-slate-800 mb-4 tracking-tight leading-snug">
              {company.name}
            </h3>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed">
              {company.slogan}
            </p>

            <div className={`inline-flex items-center font-bold text-sm uppercase tracking-widest ${idx === 0 ? 'text-blue-600' : idx === 1 ? 'text-red-600' : 'text-gray-600'}`}>
              Entrar <ArrowRight size={20} className="ml-2 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">
        © 2026 ECG Corporativo Industrial
      </div>
    </div>
  );
};

export default MainPortal;