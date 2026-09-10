const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const handleMarkKeluarLain = `  const handleMarkKeluarLain = (s: Student) => {
    const reason = window.prompt('Masukkan sebab keluar (Cth: Klinik, Kursus, Bengkel, dan lain-lain):');
    if (!reason) return;
    
    sounds.playActionChime('out');
    const newStatus: StudentStatus = { status: 'KELUAR', since: Date.now(), dest: reason };
    const log = recordLog(s, 'Keluar Asrama', reason);
    
    setHostelState(prev => {
      return {
        ...prev,
        statuses: {
          ...prev.statuses,
          [s.kp]: newStatus
        },
        logs: [log, ...prev.logs].slice(0, 1500)
      };
    });
    
    syncLogMovementToSheets(log, s, newStatus);
    import('./services/supabaseService').then(m => {
      m.syncStudentStatus(s.kp, 'KELUAR', newStatus.dest);
      m.syncHostelLog(log);
    });
    
    showToast(\`\${s.nama.split(' ')[0]} keluar atas urusan: \${reason}\`, 'info');
  };
`;
code = code.replace("const handleStartOuting = (s: Student, dest: string, expectedReturn: string, transport?: string) => {", handleMarkKeluarLain + "\n  const handleStartOuting = (s: Student, dest: string, expectedReturn: string, transport?: string) => {");

code = code.replace("else if (action === 'keluar') handleMarkKeluar(selectedStudentForModal);", "else if (action === 'keluar') handleMarkKeluar(selectedStudentForModal);\n          else if (action === 'keluar-lain') handleMarkKeluarLain(selectedStudentForModal);");

fs.writeFileSync('src/App.tsx', code);
