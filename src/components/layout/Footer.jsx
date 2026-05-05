import { companiesData } from '../../data/companies';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from 'lucide-react';

// TikTok icon (no está en lucide)
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.29 6.29 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </svg>
);

const Footer = ({ company }) => {
  const year = new Date().getFullYear();
  const navLinks = [
    { id: 'inicio',    label: 'Inicio' },
    { id: 'nosotros',  label: 'Nosotros' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'miembros',  label: 'Miembros' },
    { id: 'politicas', label: 'Políticas' },
    { id: 'contacto',  label: 'Contacto' },
  ];

  return (
    <footer className="bg-white text-slate-800 mt-12 border-t border-slate-100">
      {/* Banda de color superior */}
      <div className={`h-1 w-full bg-gradient-to-r ${company.color}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Columna 1 — Logo y descripción */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={company.logo}
                alt={company.name}
                className="w-12 h-12 object-contain rounded-lg bg-slate-100 p-1"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div>
                <p className="font-black text-sm leading-tight text-slate-800">{company.name}</p>
                <p className="text-slate-400 text-xs">ECG Corporativo</p>
              </div>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              "Ingeniería que construye, gestión que respalda, y capacitación que transforma."
            </p>

            {/* Redes sociales */}
            <div className="flex gap-3 mt-5">
              {company.socialMedia?.facebook && (
                <a href={company.socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors">
                  <Facebook size={15} />
                </a>
              )}
              {company.socialMedia?.instagram && (
                <a href={company.socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors">
                  <Instagram size={15} />
                </a>
              )}
              {company.socialMedia?.tiktok && (
                <a href={company.socialMedia.tiktok} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors">
                  <TikTokIcon />
                </a>
              )}
            </div>
          </div>

          {/* Columna 2 — Secciones */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Secciones</p>
            <ul className="space-y-2">
              {navLinks.map(link => (
                <li key={link.id}>
                  <a
                    href={`/empresa/${company.id}/${link.id}`}
                    className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3 — Contacto */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Contacto</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-slate-500">
                <MapPin size={14} className="mt-0.5 flex-shrink-0 text-slate-400" />
                <span>{company.direccion}</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-500">
                <Phone size={14} className="flex-shrink-0 text-slate-400" />
                <span>+{company.phone}</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-500">
                <Mail size={14} className="flex-shrink-0 text-slate-400" />
                <span>{company.email}</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-slate-500">
                <Clock size={14} className="mt-0.5 flex-shrink-0 text-slate-400" />
                <span>Lun–Vie · 08:00–18:00 hrs</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-slate-400 text-xs">
            © {year} ECG Corporativo · Todos los derechos reservados
          </p>
          <p className="text-slate-300 text-xs">
            Querétaro, México
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
