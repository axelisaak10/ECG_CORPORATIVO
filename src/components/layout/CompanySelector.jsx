const CompanySelector = ({ companies, activeCompany, setActiveCompany }) => {
  return (
    <div className="pt-24 pb-3 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-center gap-3">
          {companies.map((company, idx) => (
            <button
              key={company.id}
              onClick={() => setActiveCompany(idx)}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm text-center ${
                activeCompany === idx
                  ? `bg-gradient-to-r ${company.color} text-white shadow-lg`
                  : 'bg-white text-gray-600 hover:shadow-md hover:bg-gray-50'
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