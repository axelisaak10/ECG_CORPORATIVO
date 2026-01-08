import React from 'react';

const CompanySelector = ({ companies, activeCompany, setActiveCompany }) => {
  return (
    <div className="pt-24 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-center gap-4">
          {companies.map((company, idx) => (
            <button
              key={company.id}
              onClick={() => setActiveCompany(idx)}
              className={`px-4 md:px-6 py-3 rounded-xl font-semibold transition-all duration-500 transform hover:scale-105 text-sm md:text-base ${
                activeCompany === idx
                  ? `bg-gradient-to-r ${company.color} text-white shadow-2xl`
                  : 'bg-white text-gray-600 hover:shadow-lg'
              }`}
            >
              {company.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanySelector;