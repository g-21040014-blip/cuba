import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { fetchStudentsFromSheets } from '../lib/sheets-api';
import { getAccessToken } from '../lib/google-auth';
// We will need to log to a new tab "Log Pergerakan" in Sheets

export function NfcScannerView() {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [scannedId, setScannedId] = useState('');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    student?: any;
    action?: string;
    message: string;
    timestamp?: string;
  } | null>(null);
  const [isNfcSupported, setIsNfcSupported] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ('NDEFReader' in window) {
      setIsNfcSupported(true);
    }
    loadData();
    
    // Auto-focus the input for keyboard-wedge scanners
    const focusTimer = setInterval(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    }, 1000);
    
    return () => clearInterval(focusTimer);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchStudentsFromSheets();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scannedId.trim()) {
      processNfcId(scannedId.trim());
      setScannedId('');
    }
  };
  
  const processNfcId = async (nfcId: string) => {
    setLoading(true);
    try {
      // Clean ID
      const idToSearch = nfcId.toUpperCase();
      
      // Find student by nokp or id
      const student = students.find(s => {
        const nokp = (s['NO KP'] || s.nokp || '').toUpperCase();
        return nokp === idToSearch || nokp.includes(idToSearch);
      });
      
      if (!student) {
        setScanResult({
          success: false,
          message: `Pelajar dengan ID/NFC ${idToSearch} tidak dijumpai.`,
        });
        playSound(false);
        return;
      }
      
      // Determine Action (Toggle Keluar / Masuk based on basic logic, or default to latest missing)
      // For simplicity, we just log it as "Keluar/Masuk" or ask the user, but for fast NFC, we should infer or have a radio button.
      
      // Let's assume there's a global action selector
      const action = document.querySelector('input[name="scanAction"]:checked') as HTMLInputElement;
      const actionVal = action ? action.value : 'Keluar';
      
      // Log to Google Sheets
      await logMovement(student, actionVal);
      
      setScanResult({
        success: true,
        student: student,
        action: actionVal,
        message: 'Rekod berjaya disimpan.',
        timestamp: new Date().toLocaleTimeString('ms-MY')
      });
      playSound(true);
      
    } catch (err) {
      console.error('Error logging:', err);
      setScanResult({
        success: false,
        message: 'Ralat menyimpan rekod: ' + (err as Error).message,
      });
      playSound(false);
    } finally {
      setLoading(false);
    }
  };
  
  const logMovement = async (student: any, action: string) => {
    // Ideally we append to "Log Pergerakan" tab. We need to implement this in sheets-api.
    const token = await getAccessToken();
    if (!token) throw new Error('Not authenticated');
    
    // Fallback simple fetch to append
    const SPREADSHEET_ID = '1SpaKsuHmyGDU3DFoYA_jDkpPvRt6Ose2c2TnxFLqUUQ';
    const now = new Date();
    
    const values = [
      [
        student['NAMA MURID'] || student.name || 'Unknown',
        student['NO KP'] || student.nokp || '',
        student['KELAS AKADEMIK'] || student.form || '',
        action,
        now.toLocaleDateString('ms-MY'),
        now.toLocaleTimeString('ms-MY')
      ]
    ];
    
    const body = { values };
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Log Pergerakan!A:F:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );
    
    if (!res.ok) {
       // Just silently ignore if tab not found for now to not break UX, or better throw error
       const errJson = await res.json();
       if (errJson.error && errJson.error.message.includes('Unable to parse range')) {
          throw new Error('Tab "Log Pergerakan" tidak dijumpai. Sila cipta tab ini di Google Sheets terlebih dahulu.');
       }
       throw new Error('Gagal simpan ke hamparan.');
    }
  };

  const playSound = (success: boolean) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (success) {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch(e) {}
  };

  const startWebNFC = async () => {
    if (!('NDEFReader' in window)) {
      alert("Pelayar web ini tidak menyokong Web NFC (Guna Chrome di Android).");
      return;
    }
    
    try {
      setScanResult(null);
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();
      
      ndef.addEventListener("reading", ({ message, serialNumber }: any) => {
        // We use the NFC card serial number as the ID
        // Note: Serial number is often colon-separated like 04:d6:e3:22...
        const nfcId = serialNumber.replace(/:/g, "").toUpperCase();
        processNfcId(nfcId);
      });
      
      ndef.addEventListener("readingerror", () => {
        setScanResult({
          success: false,
          message: 'Gagal membaca kad NFC. Sila cuba lagi.'
        });
        playSound(false);
      });
      
      alert("NFC diaktifkan. Sila sentuh kad NFC ke belakang telefon anda.");
    } catch (error) {
      console.error(error);
      alert("Ralat mengaktifkan NFC: " + (error as Error).message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <Icons.ScanFace className="w-6 h-6 mr-2 text-indigo-600" />
            Imbasan Pintu Pagar
          </h1>
          <p className="text-sm text-slate-500 mt-1">Imbas kad NFC / Barcode pelajar untuk rekod keluar masuk.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center">
          
          <div className="flex space-x-4 mb-6">
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="scanAction" value="Keluar" defaultChecked className="w-4 h-4 text-indigo-600" />
              <span className="ml-2 text-sm font-medium">Pelajar Keluar</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="scanAction" value="Masuk" className="w-4 h-4 text-emerald-600" />
              <span className="ml-2 text-sm font-medium">Pelajar Masuk</span>
            </label>
          </div>

          <form onSubmit={handleManualSubmit} className="w-full relative mb-6">
            <input 
              ref={inputRef}
              type="text" 
              value={scannedId}
              onChange={(e) => setScannedId(e.target.value)}
              placeholder="Sedia Mengimbas... (Guna Scanner USB)"
              className="w-full border-2 border-indigo-200 focus:border-indigo-500 rounded-lg p-4 text-center text-lg shadow-inner outline-none transition-colors"
              autoFocus
            />
            {loading && <Icons.Loader2 className="w-5 h-5 absolute right-4 top-4 animate-spin text-indigo-500" />}
          </form>
          
          {isNfcSupported && (
            <button 
              onClick={startWebNFC}
              className="w-full mb-4 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-lg flex items-center justify-center font-medium transition-colors"
            >
              <Icons.Smartphone className="w-5 h-5 mr-2" />
              Guna Sensor NFC Telefon (Android)
            </button>
          )}

          <p className="text-xs text-slate-500 text-center">
            Pastikan anda mempunyai tab bernama <b>"Log Pergerakan"</b> di dalam fail Google Sheets anda.
          </p>
        </div>
        
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col justify-center min-h-[300px]">
          {scanResult ? (
            <div className={`text-center p-6 rounded-xl border ${scanResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              {scanResult.success ? (
                <>
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icons.CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-800 mb-1">{scanResult.student['NAMA MURID'] || scanResult.student.name || 'Pelajar'}</h3>
                  <p className="text-emerald-600 font-medium">{scanResult.student['KELAS AKADEMIK'] || scanResult.student.form || ''}</p>
                  
                  <div className="mt-4 py-2 border-t border-emerald-200 flex justify-center items-center space-x-2 text-sm text-emerald-700">
                    <Icons.Clock className="w-4 h-4" />
                    <span>Direkodkan pada {scanResult.timestamp} - <b>{scanResult.action}</b></span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icons.XCircle className="w-8 h-8 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-bold text-rose-800 mb-2">Imbasan Gagal</h3>
                  <p className="text-rose-600 text-sm">{scanResult.message}</p>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <Icons.Scan className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Menunggu imbasan...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
