import React, { useEffect, useRef, useState } from 'react';
import { LockKeyhole, Radio, Sparkles, RefreshCw, Volume2, Moon, Sun, Camera, QrCode, Smartphone, Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { Student, StudentStatus } from '../types/hostel';
import { sounds } from '../utils/audio';
import { NfcScanGraphic, NfcScanState } from './NfcScanGraphic';
import { parseQrScanResult } from '../utils/qrParser';
import { CameraQrScannerModal } from './CameraQrScannerModal';

interface ScannerKioskProps {
  students: Student[];
  statuses: Record<string, StudentStatus>;
  onMarkMasuk: (student: Student) => void;
  onMarkKeluar: (student: Student) => void;
}

type Result = {
  kind: 'success' | 'error';
  student?: Student;
  message: string;
  detail?: string;
  statusType?: 'in' | 'out' | 'warn';
  statusLabel?: string;
};

export const ScannerKiosk: React.FC<ScannerKioskProps> = ({
  students,
  statuses,
  onMarkMasuk,
  onMarkKeluar,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScanRef = useRef<{ key: string; at: number } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [clock, setClock] = useState(new Date());
  const [theme, setTheme] = useState<'clean' | 'dark'>('clean');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Web NFC for Phone Tap
  const [isNfcActive, setIsNfcActive] = useState(false);
  const [nfcNotice, setNfcNotice] = useState<string | null>(null);
  const abortCtrlRef = useRef<AbortController | null>(null);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    return () => {
      if (abortCtrlRef.current) {
        abortCtrlRef.current.abort();
      }
    };
  }, []);

  const startPhoneNfc = async () => {
    if (!('NDEFReader' in window)) {
      setNfcNotice('Sila buka pautan dalam Google Chrome di telefon Android untuk NFC.');
      return;
    }

    try {
      if (abortCtrlRef.current) abortCtrlRef.current.abort();
      const ctrl = new AbortController();
      abortCtrlRef.current = ctrl;

      const ndef = new (window as any).NDEFReader();
      await ndef.scan({ signal: ctrl.signal });
      setIsNfcActive(true);
      setNfcNotice('NFC Android Aktif! Sentuh kad di belakang telefon.');
      sounds.playSuccessBeep();

      ndef.onreading = (event: any) => {
        let payload = '';
        if (event.message && event.message.records) {
          for (const record of event.message.records) {
            try {
              if (record.recordType === 'text') {
                const textDecoder = new TextDecoder(record.encoding || 'utf-8');
                payload = textDecoder.decode(record.data);
                break;
              } else if (record.recordType === 'url') {
                const textDecoder = new TextDecoder();
                payload = textDecoder.decode(record.data);
                break;
              }
            } catch {}
          }
        }
        if (!payload && event.serialNumber) {
          payload = event.serialNumber.replace(/:/g, '');
        }

        if (payload) {
          processScan(payload);
        }
      };

      ndef.onreadingerror = () => {
        setNfcNotice('Ralat membaca kad. Sila tekap rapat di belakang telefon.');
        sounds.playActionChime('error');
      };
    } catch (e: any) {
      setIsNfcActive(false);
      setNfcNotice(e.message || 'Gagal aktifkan NFC. Pastikan NFC dihidupkan dalam tetapan.');
    }
  };

  const stopPhoneNfc = () => {
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
      abortCtrlRef.current = null;
    }
    setIsNfcActive(false);
    setNfcNotice(null);
  };

  useEffect(() => {
    inputRef.current?.focus();
    const timer = window.setInterval(() => setClock(new Date()), 1000);

    // iPhone NFC flow: the NFC tag contains an HTTPS URL. iOS opens that URL,
    // then this page receives the student's IC number through ?kp=... (or ?nfc=...).
    // This is intentionally NOT Web NFC: Safari/iOS hands us the URL after the tag is tapped.
    const params = new URLSearchParams(window.location.search);
    const rawUrlValue = params.get('scan') || params.get('kp') || params.get('nfc');
    let scanVal = rawUrlValue || '';

    // Also accept a complete URL pasted/read by another NFC utility.
    if (scanVal && /^https?:\/\//i.test(scanVal)) {
      try {
        const u = new URL(scanVal);
        scanVal = u.searchParams.get('kp') || u.searchParams.get('nfc') || u.searchParams.get('scan') || '';
      } catch {}
    }

    if (scanVal) {
      setNfcNotice('Kad NFC dikesan oleh iPhone. Mengenal pasti murid…');
      setTimeout(() => {
        processScan(scanVal);
      }, 300);
    }

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const keepFocus = () => inputRef.current?.focus();
    window.addEventListener('click', keepFocus);
    window.addEventListener('focus', keepFocus);
    return () => {
      window.removeEventListener('click', keepFocus);
      window.removeEventListener('focus', keepFocus);
    };
  }, []);

  useEffect(() => {
    if (!result) return;
    // Show matched result for 2.8s then auto return to ready state
    const timer = window.setTimeout(() => {
      setResult(null);
      setInputValue('');
      inputRef.current?.focus();
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [result]);

  const processScan = (raw: string) => {
    if (!raw || !raw.trim()) return;

    const parsed = parseQrScanResult(raw, students);
    let match = parsed.student;

    if (!match) {
      const clean = raw.trim().replace(/[\s-]/g, '');
      match = students.find(s => s.kp === clean || s.id.toLowerCase() === clean.toLowerCase());
      if (!match) {
        const icExtract = raw.match(/\b\d{6}[-\s]?\d{2}[-\s]?\d{4}\b/);
        if (icExtract) {
          const cleanIc = icExtract[0].replace(/[\s-]/g, '');
          match = students.find(s => s.kp === cleanIc || s.kp.replace(/[\s-]/g, '') === cleanIc);
        }
      }
    }
    setInputValue('');

    if (!match) {
      sounds.playActionChime('error');
      setResult({
        kind: 'error',
        message: 'Imbasan Tidak Berjaya',
        detail: 'Kad/QR belum didaftarkan atau tidak padan. Sila cuba lagi.',
      });
      return;
    }

    // Prevent rapid double-tap
    const now = Date.now();
    const last = lastScanRef.current;
    if (last && last.key === match.kp && now - last.at < 8000) {
      sounds.playActionChime('error');
      setResult({
        kind: 'error',
        student: match,
        message: 'Imbasan Terlalu Pantas',
        detail: 'Sila tunggu beberapa saat sebelum menyentuh semula kad yang sama.',
      });
      return;
    }
    lastScanRef.current = { key: match.kp, at: now };

    const current = statuses[match.kp]?.status || 'DALAM';

    if (current === 'DALAM') {
      onMarkKeluar(match);
      sounds.playActionChime('out');
      setResult({
        kind: 'success',
        student: match,
        message: 'Pergerakan Keluar Direkodkan',
        detail: 'Selamat keluar ke sesi kelas persekolahan / aktiviti.',
        statusType: 'out',
        statusLabel: 'KELUAR KELAS',
      });
    } else if (current === 'KELUAR') {
      onMarkMasuk(match);
      sounds.playActionChime('in');
      setResult({
        kind: 'success',
        student: match,
        message: 'Selamat Kembali ke Asrama',
        detail: 'Kehadiran pulang ke asrama telah berjaya disahkan.',
        statusType: 'in',
        statusLabel: 'DALAM ASRAMA',
      });
    } else {
      sounds.playActionChime('error');
      setResult({
        kind: 'error',
        student: match,
        message: 'Perlu Semakan Warden',
        detail: 'Kad murid berstatus Outing/Bermalam. Sila berhubung dengan warden bertugas.',
        statusType: 'warn',
        statusLabel: current,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') processScan(inputValue);
  };

  const timeText = clock.toLocaleTimeString('ms-MY', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const dateText = clock.toLocaleDateString('ms-MY', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const scanState: NfcScanState = result
    ? result.kind === 'success'
      ? 'matched'
      : 'error'
    : 'idle';

  return (
    <main
      className={`min-h-screen transition-colors duration-500 flex items-center justify-center p-3 sm:p-6 select-none ${
        theme === 'clean'
          ? 'bg-gradient-to-br from-[#7791b7] via-[#85a0c6] to-[#6b85ab] text-slate-800'
          : 'bg-[#070b11] text-slate-100'
      }`}
    >
      <div className="w-full max-w-md">
        {/* TOP STATUS BAR & BRANDING */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xs border border-white/30">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/90 drop-shadow-xs">
                eAPPS • SSeMJ
              </p>
              <h1 className="text-sm font-bold text-white tracking-tight drop-shadow-xs">
                Imbas Kad NFC Asrama
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isNfcActive ? (
              <button
                onClick={stopPhoneNfc}
                className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer animate-pulse"
                title="Hentikan bacaan NFC telefon"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>NFC Aktif</span>
              </button>
            ) : (
              <button
                onClick={startPhoneNfc}
                className="px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
                title="Aktifkan imbasan kad NFC di belakang telefon"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>NFC Handphone</span>
              </button>
            )}
            <button
              onClick={() => setIsCameraOpen(true)}
              className="px-3 py-1.5 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-pink-900/30 transition-all cursor-pointer"
              title="Buka Kamera untuk imbas Kod QR murid"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Imbas QR</span>
            </button>
            <button
              onClick={() => setTheme(t => (t === 'clean' ? 'dark' : 'clean'))}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white border border-white/25 transition-colors cursor-pointer"
              title="Tukar tema"
            >
              {theme === 'clean' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>
            <div className="flex items-center gap-1 text-[10px] font-bold text-white bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2.5 py-1">
              <LockKeyhole className="w-3 h-3" />
              <span>KIOSK</span>
            </div>
          </div>
        </div>

        {/* MAIN PRO PHONE-STYLE SCREEN CARD (MATCHING USER SCREENSHOT) */}
        <div
          onClick={() => inputRef.current?.focus()}
          className={`rounded-[36px] shadow-2xl border transition-all duration-300 overflow-hidden relative cursor-pointer ${
            theme === 'clean'
              ? 'bg-white border-white/80 shadow-slate-900/20'
              : 'bg-slate-900 border-slate-800 text-white shadow-black/60'
          }`}
        >
          {/* Top Notch & Phone Header Details */}
          <div className="px-6 pt-5 pb-2 flex items-center justify-between text-xs border-b border-slate-100/80">
            <span className="font-semibold text-slate-400 text-[11px] tracking-wide">
              {timeText}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Aktif
              </span>
            </div>
          </div>

          {/* Graphic Stage */}
          <div className="p-6 sm:p-8">
            <NfcScanGraphic
              state={scanState}
              student={result?.student}
              message={result?.message}
              detail={result?.detail}
              statusBadge={
                result?.statusLabel
                  ? {
                      text: result.statusLabel,
                      type: result.statusType || 'in',
                    }
                  : undefined
              }
              onRetry={() => {
                setResult(null);
                inputRef.current?.focus();
              }}
            />
          </div>

          {/* Footer Card Ribbon */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 font-medium">
              {dateText}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-teal-700 font-semibold bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 text-teal-600" />
              <span>RFID / NFC USB</span>
            </div>
          </div>
        </div>

        {/* Hidden keyboard reader input */}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          inputMode="none"
          aria-hidden="true"
          tabIndex={-1}
          className="fixed -left-[9999px] top-0 w-px h-px opacity-0"
        />

        {nfcNotice && (
          <div className="mt-3 p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs text-center flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span className="font-medium">{nfcNotice}</span>
          </div>
        )}

        {isInIframe && (
          <div className="mt-3 text-center">
            <a
              href={window.location.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white text-xs font-semibold shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Penuh di Chrome Telefon (Untuk Akses NFC Perkakasan)</span>
            </a>
          </div>
        )}

        <p className="text-center text-[11px] text-white/80 drop-shadow-xs mt-3">
          Sentuhkan kad pintar pada pembaca atau imbas kod QR. Paparan akan bertukar secara automatik.
        </p>
      </div>

      <CameraQrScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={(data) => {
          setIsCameraOpen(false);
          processScan(data);
        }}
        title="Imbas Kod QR Pas Murid"
      />
    </main>
  );
};
