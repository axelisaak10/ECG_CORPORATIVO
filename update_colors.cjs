const fs = require('fs');
const files = [
  'src/components/sections/ServiciosSection.jsx',
  'src/components/sections/PoliticasSection.jsx',
  'src/components/sections/NosotrosSection.jsx',
  'src/components/sections/MiembrosSection.jsx',
  'src/components/sections/ContactoSection.jsx',
  'src/components/layout/MainPortal.jsx',
  'src/components/layout/HamburgerMenu.jsx',
  'src/components/auth/UserDashboard.jsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    
    // Replace keys in maps
    content = content.replace(/blue:/g, "'ecg-azul':");
    content = content.replace(/red:/g, "'ecg-rojo1':");
    content = content.replace(/gray:/g, "'ecg-gris':");
    
    // Replace fallback keys and values
    content = content.replace(/accentColors\.blue/g, "accentColors['ecg-azul']");
    content = content.replace(/accentMap\.blue/g, "accentMap['ecg-azul']");
    content = content.replace(/accentBg\.blue/g, "accentBg['ecg-azul']");
    content = content.replace(/accentText\.blue/g, "accentText['ecg-azul']");

    // Replace class strings
    content = content.replace(/bg-blue-600/g, 'bg-ecg-azul');
    content = content.replace(/text-blue-600/g, 'text-ecg-azul');
    content = content.replace(/border-blue-500/g, 'border-ecg-azul');
    content = content.replace(/border-blue-600/g, 'border-ecg-azul');
    content = content.replace(/ring-blue-500/g, 'ring-ecg-azul');
    
    content = content.replace(/bg-red-600/g, 'bg-ecg-rojo1');
    content = content.replace(/text-red-600/g, 'text-ecg-rojo1');
    
    content = content.replace(/bg-gray-700/g, 'bg-ecg-gris');
    content = content.replace(/bg-gray-600/g, 'bg-ecg-gris');
    content = content.replace(/text-gray-600/g, 'text-ecg-gris');
    content = content.replace(/text-gray-700/g, 'text-ecg-negro');

    fs.writeFileSync(f, content);
    console.log('Updated', f);
  } else {
    console.log('Not found:', f);
  }
});
