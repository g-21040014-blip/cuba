const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const renderModalCode = fs.readFileSync('test.ts', 'utf8');

const parts = code.split('  return (');
if (parts.length >= 2) {
  code = parts[0] + '\n' + renderModalCode + '\n  return (' + parts.slice(1).join('  return (');
}

const matchIndex = code.lastIndexOf('</div>\n  );\n};');
if (matchIndex !== -1) {
  code = code.substring(0, matchIndex) + '      {renderModal()}\n    </div>\n  );\n};';
} else {
  console.log("Could not find end div");
}

fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log("Done");
