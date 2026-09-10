import React, { useState, useRef, useEffect } from 'react';
import { 
  Radio, 
  Search, 
  Send, 
  Clock, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  LogIn, 
  LogOut, 
  Home, 
  HeartPulse, 
  UserCheck, 
  FileText, 
  Sparkles,
  RefreshCw,
  Phone,
  MessageSquare,
  Camera,
  QrCode,
  FileCheck2,
  Smartphone,
  ExternalLink,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Student, StudentStatus } from '../types/hostel';
import { 
  getStudentInitials, 
  getAvatarColor, 
  getStatusBadgeConfig, 
  getBidangColor, 
  formatDateTime, 
  getRelativeTime, 
  isOutingOverdue 
} from '../utils/helpers';
import { sounds } from '../utils/audio';
import { NfcScanGraphic } from './NfcScanGraphic';
import { CameraQrScannerModal } from './CameraQrScannerModal';
import { GuardScanReceiptModal } from './GuardScanReceiptModal';
import { parseQrScanResult } from '../utils/qrParser';

interface ScanStationProps {
  students: Student[];
  statuses: Record<string, StudentStatus>;
  selectedSession: { key: string; period: string; dateStr: string };
  attendanceMap: Record<string, number>;
  onMarkMasuk: (student: Student) => void;
  onMarkKeluar: (student: Student) => void;
  onMarkKeluarLain: (student: Student) => void;
  onStartOuting: (student: Student, dest: string, expectedReturn: string, transport?: string) => void;
  onEndOuting: (student: Student) => void;
  onStartBermalam: (student: Student, dest: string, returnDate: string, guardian: string, phone: string, carPlate: string) => void;
  onEndBermalam: (student: Student) => void;
  onSetKuarantin: (student: Student, reason: string) => void;
  onMarkHadir: (student: Student) => void;
  onOpenStudentModal: (student: Student) => void;
  onOpenGatePass: (student: Student) => void;
  onOpenBulkReturn?: () => void;
  userRole?: string;
  officerName?: string;
}

export const ScanStation: React.FC<ScanStationProps> = ({
  students,
  statuses,
  selectedSession,
  attendanceMap,
  onMarkMasuk,
  onMarkKeluar,
  onMarkKeluarLain,
  onStartOuting,
  onEndOuting,
  onStartBermalam,
  onEndBermalam,
  onSetKuarantin,
  onMarkHadir,
  onOpenStudentModal,
  onOpenGatePass,
  onOpenBulkReturn,
  userRole = 'guard',
  officerName = 'Pengawal Keselamatan Pintu Pagar'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [scannerFlash, setScannerFlash] = useState<'idle' | 'success' | 'error'>('idle');
  const [continuousRollCall, setContinuousRollCall] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  // Camera & Receipt Modal states
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [scannedReceiptMeta, setScannedReceiptMeta] = useState<{
    passNumber?: string;
    passType?: 'outing' | 'bermalam' | 'biasa';
    approvedBy?: string;
  }>({});

  // Form states
  const [activeForm, setActiveForm] = useState<'none' | 'outing' | 'bermalam' | 'kuarantin'>('none');
  
  // Outing form inputs
  const [outingDest, setOutingDest] = useState('');
  const [outingReturn, setOutingReturn] = useState('');
  const [outingTransport, setOutingTransport] = useState('Bas Awam / Grab');

  // Bermalam form inputs
  const [bmDest, setBmDest] = useState('Rumah Keluarga');
  const [bmReturn, setBmReturn] = useState('Ahad, 06:00 PM');
  const [bmGuardian, setBmGuardian] = useState('');
  const [bmPhone, setBmPhone] = useState('');
  const [bmCarPlate, setBmCarPlate] = useState('');

  // Kuarantin form inputs
  const [kuarantinReason, setKuarantinReason] = useState('Demam & Selsema (Rehat di Bilik Sakit)');

  const inputRef = useRef<HTMLInputElement>(null);

  // Web NFC for mobile phones
  const [isNfcSupported, setIsNfcSupported] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [nfcStatusMsg, setNfcStatusMsg] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setIsNfcSupported(true);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const startPhoneNfc = async () => {
    if (!('NDEFReader' in window)) {
      sounds.playActionChime('error');
      return;
    }

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const ctrl = new AbortController();
      abortControllerRef.current = ctrl;

      const ndef = new (window as any).NDEFReader();
      await ndef.scan({ signal: ctrl.signal });
      setIsNfcScanning(true);
      setNfcStatusMsg('NFC Aktif! Sila sentuhkan kad di bahagian belakang telefon sekarang.');
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
            } catch (e) {
              console.warn('Error decoding NFC record:', e);
            }
          }
        }
        if (!payload && event.serialNumber) {
          payload = event.serialNumber.replace(/:/g, '');
        }

        if (payload) {
          setNfcStatusMsg(`Kad dikesan: ${payload}`);
          processScan(payload);
        }
      };

      ndef.onreadingerror = () => {
        setNfcStatusMsg('Kad dikesan tetapi ralat membaca. Sila tekap semula kad dengan rapat.');
        sounds.playActionChime('error');
      };
    } catch (err: any) {
      console.error('NFC error:', err);
      setIsNfcScanning(false);
      if (err.name === 'NotAllowedError') {
        setNfcStatusMsg('Kebenaran NFC ditolak. Sila benarkan akses NFC di pelayar Chrome.');
      } else {
        setNfcStatusMsg(`Gagal aktifkan NFC: ${err.message || 'Sila pastikan fungsi NFC aktif di tetapan telefon.'}`);
      }
    }
  };

  const stopPhoneNfc = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsNfcScanning(false);
    setNfcStatusMsg(null);
  };

  // Auto-fill guardian details when student selected
  useEffect(() => {
    if (selectedStudent) {
      setBmGuardian(selectedStudent.namaWaris || '');
      setBmPhone(selectedStudent.telWaris || '');
    }
  }, [selectedStudent]);

  // Handle URL query param ?scan=... or ?kp=... on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scanVal = params.get('scan') || params.get('kp');
    if (scanVal) {
      setTimeout(() => {
        processScan(scanVal);
      }, 350);
    }
  }, []);

  // Handle scan execution (works for QR codes, NFC cards, and manual KP/Pass IDs)
  const processScan = (raw: string, autoOpenReceipt = true) => {
    if (!raw || !raw.trim()) return;

    const parsed = parseQrScanResult(raw, students);
    let match = parsed.student;

    if (!match) {
      const clean = raw.trim().replace(/[\s-]/g, '');
      match = students.find(s => s.kp === clean || s.kp.replace(/[\s-]/g, '') === clean);
      if (!match) {
        // Check if text contains a 12-digit Malaysian IC format
        const icExtract = raw.match(/\b\d{6}[-\s]?\d{2}[-\s]?\d{4}\b/);
        if (icExtract) {
          const cleanIc = icExtract[0].replace(/[\s-]/g, '');
          match = students.find(s => s.kp === cleanIc || s.kp.replace(/[\s-]/g, '') === cleanIc);
        }
      }
      if (!match) {
        // Fallback by ID or name
        const byId = students.find(s => s.id.toLowerCase() === clean.toLowerCase());
        if (byId) match = byId;
        else {
          const byName = students.filter(s => s.nama.toUpperCase().includes(raw.trim().toUpperCase()));
          if (byName.length === 1) match = byName[0];
        }
      }
    }

    if (match) {
      sounds.playSuccessBeep();
      setScannerFlash('success');
      setSelectedStudent(match);
      setActiveForm('none');

      const passNum = parsed.passNumber || statuses[match.kp]?.passId || `PAS-${match.tingkatan}-${match.kp.slice(-4)}`;
      const passTyp = parsed.passType || (statuses[match.kp]?.status === 'BERMALAM' ? 'bermalam' : statuses[match.kp]?.status === 'OUTING' ? 'outing' : 'biasa');
      const approved = parsed.approvedBy || 'Warden Bertugas';

      setScannedReceiptMeta({
        passNumber: passNum,
        passType: passTyp,
        approvedBy: approved,
      });

      // If continuous roll-call mode is turned on, auto-mark presence!
      if (continuousRollCall) {
        onMarkHadir(match);
      } else if (autoOpenReceipt) {
        // Automatically pop up official receipt like DuitNow payment confirmation!
        setIsReceiptModalOpen(true);
      }

      setTimeout(() => setScannerFlash('idle'), 700);
    } else {
      sounds.playActionChime('error');
      setScannerFlash('error');
      setTimeout(() => setScannerFlash('idle'), 900);
    }

    setInputValue('');
    inputRef.current?.focus();
  };

  const handleReceiptConfirmKeluar = (
    student: Student, 
    type: 'outing' | 'bermalam' | 'biasa', 
    destination: string, 
    expectedReturn: string,
    guardianName?: string, 
    guardianPhone?: string, 
    carPlate?: string
  ) => {
    if (type === 'outing') {
      onStartOuting(student, destination || 'Bandar / Urusan Luar', expectedReturn || '06:00 PM', 'Bas Awam / Grab');
    } else if (type === 'bermalam') {
      onStartBermalam(
        student, 
        destination || 'Rumah Keluarga', 
        expectedReturn || 'Ahad, 06:00 PM', 
        guardianName || student.namaWaris || '', 
        guardianPhone || student.telWaris || '', 
        carPlate || ''
      );
    } else {
      onMarkKeluar(student);
    }
  };

  const handleReceiptConfirmMasuk = (student: Student) => {
    const curStatus = statuses[student.kp]?.status;
    if (curStatus === 'OUTING') {
      onEndOuting(student);
    } else if (curStatus === 'BERMALAM') {
      onEndBermalam(student);
    } else {
      onMarkMasuk(student);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processScan(inputValue);
    }
  };

  const currentStatus = selectedStudent ? statuses[selectedStudent.kp] : undefined;
  const isOverdue = currentStatus?.status === 'OUTING' && isOutingOverdue(currentStatus.expectedReturn);
  const isPresentInSession = selectedStudent ? !!attendanceMap[selectedStudent.kp] : false;

  // Filtered quick tap list for easy simulation
  const filteredQuickList = students.filter(s => {
    if (!quickSearchQuery) return true;
    const q = quickSearchQuery.toUpperCase();
    return s.nama.toUpperCase().includes(q) || s.kp.includes(q) || s.kelas.toUpperCase().includes(q);
  }).slice(0, 30);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-5">
      
      {/* Station Title & Continuous Roll-call toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-xs">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Imbas Kad NFC
            </h2>
            <p className="text-[11px] text-slate-500">
              Tempelkan kad RFID atau masukkan No. KP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenBulkReturn && (
            <button
              type="button"
              onClick={onOpenBulkReturn}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition-all shadow-2xs"
              title="Tandakan murid pulang ke asrama secara pukal (sesi petang)"
            >
              <Home className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pulang Pukal</span>
            </button>
          )}

          {/* Continuous Roll-call switch */}
          <button
            onClick={() => {
              const next = !continuousRollCall;
              setContinuousRollCall(next);
              if (next) sounds.playSuccessBeep();
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              continuousRollCall
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'
            }`}
            title="Mod Imbas Laju Kehadiran: Sentuh kad untuk tandakan hadir automatik"
          >
            <UserCheck className={`w-3.5 h-3.5 ${continuousRollCall ? 'text-emerald-600 animate-pulse' : ''}`} />
            <span>Auto-Hadir Roll-Call</span>
          </button>
        </div>
      </div>

      {/* VIRTUAL RFID SCANNER STAGE (PRO MOCKUP STYLE) */}
      <div 
        onClick={() => inputRef.current?.focus()}
        className={`relative rounded-3xl overflow-hidden border transition-all cursor-pointer select-none ${
          scannerFlash === 'success'
            ? 'bg-emerald-50/80 border-emerald-300 shadow-sm ring-2 ring-emerald-300/60'
            : scannerFlash === 'error'
            ? 'bg-rose-50/80 border-rose-300 shadow-sm ring-2 ring-rose-300/60'
            : 'bg-gradient-to-b from-sky-50/70 via-white to-slate-50/80 border-slate-200/90 hover:border-sky-300 shadow-xs'
        }`}
      >
        <NfcScanGraphic
          state={
            scannerFlash === 'success'
              ? (selectedStudent ? 'matched' : 'success')
              : scannerFlash === 'error'
              ? 'error'
              : 'idle'
          }
          student={selectedStudent}
          compact={true}
          message={
            scannerFlash === 'success'
              ? (selectedStudent ? 'Kad Murid Dikenalpasti' : 'Cip Berjaya Dikesan')
              : scannerFlash === 'error'
              ? 'Imbasan Tidak Berjaya'
              : isNfcScanning
              ? 'NFC Telefon Aktif - Sedia Sentuh Kad'
              : 'Sedia Mengimbas Kad Pintar'
          }
          detail={
            scannerFlash === 'success'
              ? 'Pergerakan / kehadiran murid sedia untuk direkodkan.'
              : scannerFlash === 'error'
              ? 'Kad belum didaftarkan atau tiada padanan dalam sistem.'
              : isNfcScanning
              ? 'Tekapkan kad NFC murid di bahagian belakang telefon anda.'
              : 'Sentuhkan kad RFID pada telefon atau taip No. KP di bawah'
          }
          statusBadge={
            selectedStudent && currentStatus
              ? {
                  text: currentStatus.status,
                  type: currentStatus.status === 'DALAM' ? 'in' : currentStatus.status === 'KELUAR' ? 'out' : 'warn'
                }
              : undefined
          }
        />
      </div>

      {/* MOBILE PHONE NFC SCANNER BANNER */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-sky-50 border border-blue-200 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isNfcScanning 
                ? 'bg-emerald-600 text-white animate-pulse shadow-md shadow-emerald-500/30' 
                : 'bg-indigo-600 text-white shadow-xs'
            }`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Imbas Kad di Belakang Handphone (NFC)
                </h3>
                {isNfcScanning ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    NFC AKTIF
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Sedia Diaktifkan
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600">
                {isNfcScanning 
                  ? 'Sedia! Tekapkan kad NFC pada bahagian belakang telefon anda.' 
                  : 'Tekan butang untuk buka sensor NFC telefon tanpa skrin hitam'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isNfcScanning ? (
              <button
                type="button"
                onClick={stopPhoneNfc}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <WifiOff className="w-4 h-4 text-rose-600" />
                <span>Henti NFC</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startPhoneNfc}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Wifi className="w-4 h-4" />
                <span>Aktifkan NFC Telefon</span>
              </button>
            )}

            {isInIframe && (
              <a
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
                title="Buka terus di pelayar Chrome untuk sokongan NFC perkakasan penuh"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Buka Tab Penuh</span>
              </a>
            )}
          </div>
        </div>

        {isNfcScanning && (
          <div className="text-xs px-3 py-2 rounded-xl flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium">{nfcStatusMsg || 'NFC Aktif! Sila sentuhkan kad di bahagian belakang telefon.'}</span>
          </div>
        )}
      </div>

      {/* SCAN INPUT FIELD */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Imbas kod QR, sentuh NFC atau taip No. KP..."
              autoComplete="off"
              className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
          </div>
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-3.5 py-3 bg-pink-50 hover:bg-pink-100 text-[#D9146C] border border-pink-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 flex-shrink-0 cursor-pointer"
            title="Buka Kamera untuk mengimbas Kod QR pas murid"
          >
            <Camera className="w-4 h-4 text-[#D9146C]" />
            <span className="hidden sm:inline font-bold">Imbas QR</span>
          </button>
          <button
            onClick={() => processScan(inputValue)}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all active:scale-95 flex-shrink-0 cursor-pointer"
          >
            <span>Imbas</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          Nota: Pengawal boleh guna butang <b>Imbas QR</b> (kamera) atau pembaca USB. Selepas imbasan, <b>Borang Rasmi (Resit)</b> akan dipaparkan untuk pengesahan rekod keluar/masuk.
        </p>
      </div>

      {/* SCANNED STUDENT RESULT CARD & ACTION DRAWER */}
      {selectedStudent && currentStatus ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
          
          {/* Student Header Summary */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center font-bold text-lg text-white shadow-md relative flex-shrink-0"
                style={{ backgroundColor: getAvatarColor(selectedStudent.kp) }}
              >
                {getStudentInitials(selectedStudent.nama)}
                {selectedStudent.gambar && (
                  <img 
                    src={selectedStudent.gambar} 
                    alt="" 
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>

              <div>
                <h3 
                  onClick={() => onOpenStudentModal(selectedStudent)}
                  className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {selectedStudent.nama}
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                </h3>
                <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-slate-700">{selectedStudent.kp}</span>
                  <span>&middot;</span>
                  <span>{selectedStudent.kelas}</span>
                  <span>&middot;</span>
                  <span className="text-blue-700 font-semibold">{selectedStudent.bidang}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeConfig(currentStatus.status).bg} ${getStatusBadgeConfig(currentStatus.status).text} ${getStatusBadgeConfig(currentStatus.status).border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusBadgeConfig(currentStatus.status).dot}`}></span>
                {getStatusBadgeConfig(currentStatus.status).label}
              </span>
              {isOverdue && (
                <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  Lewat Pulang!
                </span>
              )}
            </div>
          </div>

          {/* Context detail regarding current status */}
          <div className="text-xs bg-white p-3 rounded-xl border border-slate-200 text-slate-700 space-y-1 shadow-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span>Status Sejak:</span>
              <span className="font-mono text-slate-800 font-medium">{formatDateTime(currentStatus.since)} ({getRelativeTime(currentStatus.since)})</span>
            </div>
            {currentStatus.dest && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Destinasi / Lokasi:</span>
                <span className="font-semibold text-slate-900">{currentStatus.dest}</span>
              </div>
            )}
            {currentStatus.expectedReturn && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Jangkaan Pulang:</span>
                <span className={`font-mono font-bold ${isOverdue ? 'text-rose-600' : 'text-amber-700'}`}>
                  {currentStatus.expectedReturn}
                </span>
              </div>
            )}
            {currentStatus.alasan && (
              <div className="flex justify-between items-center text-purple-700">
                <span>Catatan Kesihatan:</span>
                <span>{currentStatus.alasan}</span>
              </div>
            )}
          </div>

          {/* Action to open the Official Receipt Form (Macam Resit DuitNow) */}
          <button
            type="button"
            onClick={() => {
              setScannedReceiptMeta({
                passNumber: currentStatus.passId || `PAS-${selectedStudent.tingkatan}-${selectedStudent.kp.slice(-4)}`,
                passType: currentStatus.status === 'BERMALAM' ? 'bermalam' : currentStatus.status === 'OUTING' ? 'outing' : 'biasa',
                approvedBy: 'Warden Bertugas'
              });
              setIsReceiptModalOpen(true);
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#D9146C] to-pink-700 hover:from-[#c01260] hover:to-pink-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4 text-pink-200" />
            <span>Buka Borang Rasmi / Resit Pengesahan Pagar (Macam Resit Kedai)</span>
          </button>

          {/* ACTION BUTTONS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            
            {/* Masuk Asrama */}
            <button
              onClick={() => {
                onMarkMasuk(selectedStudent);
                setActiveForm('none');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                currentStatus.status === 'DALAM'
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-xs'
              }`}
              disabled={currentStatus.status === 'DALAM'}
            >
              <LogIn className="w-3.5 h-3.5" />
              Masuk Asrama
            </button>

            {/* Keluar Lain-Lain */}
            <button
              onClick={() => {
                onMarkKeluarLain(selectedStudent);
                setActiveForm('none');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                currentStatus.status === 'KELUAR'
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 border-rose-600 text-white shadow-xs'
              }`}
              disabled={currentStatus.status === 'KELUAR'}
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar Asrama
            </button>

            {/* Outing Handler */}
            {currentStatus.status === 'OUTING' ? (
              <button
                onClick={() => {
                  onEndOuting(selectedStudent);
                  setActiveForm('none');
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 text-white shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tamat Outing
              </button>
            ) : (
              <button
                onClick={() => setActiveForm(activeForm === 'outing' ? 'none' : 'outing')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                  activeForm === 'outing'
                    ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Mula Outing
              </button>
            )}

            {/* Pulang Bermalam Handler */}
            {currentStatus.status === 'BERMALAM' ? (
              <button
                onClick={() => {
                  onEndBermalam(selectedStudent);
                  setActiveForm('none');
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-blue-600 hover:bg-blue-700 border border-blue-600 text-white shadow-xs"
              >
                <Home className="w-3.5 h-3.5" />
                Daftar Kembali
              </button>
            ) : (
              <button
                onClick={() => setActiveForm(activeForm === 'bermalam' ? 'none' : 'bermalam')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                  activeForm === 'bermalam'
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                    : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-800'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                Bermalam
              </button>
            )}

            {/* Rawatan / Kuarantin */}
            <button
              onClick={() => setActiveForm(activeForm === 'kuarantin' ? 'none' : 'kuarantin')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                activeForm === 'kuarantin'
                  ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                  : 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-800'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              Bilik Sakit
            </button>

            {/* Tandakan Hadir Sesi Semasa */}
            <button
              onClick={() => onMarkHadir(selectedStudent)}
              disabled={isPresentInSession}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                isPresentInSession
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-default'
                  : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {isPresentInSession ? 'Sudah Hadir ✓' : 'Hadir Roll-Call'}
            </button>
          </div>

          {/* DYNAMIC FORM: OUTING */}
          {activeForm === 'outing' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-150">
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Borang Pelepasan Outing Harian
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1 font-medium">Destinasi / Tempat Dituju</label>
                  <input
                    type="text"
                    value={outingDest}
                    onChange={e => setOutingDest(e.target.value)}
                    placeholder="Cth: Pasar Seni / Rumah Keluarga..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 block mb-1 font-medium">Waktu Dijangka Pulang</label>
                  <input
                    type="time"
                    value={outingReturn}
                    onChange={e => setOutingReturn(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setActiveForm('none')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    onStartOuting(
                      selectedStudent,
                      outingDest.trim() || 'Bandar / Urusan Peribadi',
                      outingReturn || '07:00',
                      outingTransport
                    );
                    setActiveForm('none');
                    setOutingDest('');
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all"
                >
                  Sahkan &amp; Mula Outing
                </button>
              </div>
            </div>
          )}

          {/* DYNAMIC FORM: BERMALAM */}
          {activeForm === 'bermalam' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-150">
              <div className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-blue-600" />
                Kebenaran Pulang Bermalam (Cuti / Hujung Minggu)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1 font-medium">Destinasi</label>
                  <input
                    type="text"
                    value={bmDest}
                    onChange={e => setBmDest(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 block mb-1 font-medium">Tarikh &amp; Masa Kembali</label>
                  <input
                    type="text"
                    value={bmReturn}
                    onChange={e => setBmReturn(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 block mb-1 font-medium">Nama Waris Pengambil</label>
                  <input
                    type="text"
                    value={bmGuardian}
                    onChange={e => setBmGuardian(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 block mb-1 font-medium">No. Tel &amp; No. Plat Kenderaan</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={bmPhone}
                      onChange={e => setBmPhone(e.target.value)}
                      placeholder="Tel waris"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none font-mono"
                    />
                    <input
                      type="text"
                      value={bmCarPlate}
                      onChange={e => setBmCarPlate(e.target.value)}
                      placeholder="No Plat"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setActiveForm('none')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    onStartBermalam(
                      selectedStudent,
                      bmDest,
                      bmReturn,
                      bmGuardian,
                      bmPhone,
                      bmCarPlate
                    );
                    setActiveForm('none');
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
                >
                  Keluarkan Kebenaran Bermalam
                </button>
              </div>
            </div>
          )}

          {/* DYNAMIC FORM: KUARANTIN */}
          {activeForm === 'kuarantin' && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-150">
              <div className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-purple-600" />
                Catatan Rawatan Kesihatan &amp; Bilik Sakit
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1 font-medium">Gejala / Alasan Rehat di Bilik Sakit</label>
                <input
                  type="text"
                  value={kuarantinReason}
                  onChange={e => setKuarantinReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setActiveForm('none')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    onSetKuarantin(selectedStudent, kuarantinReason);
                    setActiveForm('none');
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all"
                >
                  Simpan Catatan Rawatan
                </button>
              </div>
            </div>
          )}

          {/* Footer with Card details link & Pass print */}
          <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-200">
            <button
              onClick={() => onOpenStudentModal(selectedStudent)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Lihat Kad Pintar Penuh
            </button>
            <button
              onClick={() => onOpenGatePass(selectedStudent)}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              Cetak Pas Pelepasan
            </button>
          </div>

        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
          Belum ada kad diimbas lagi.
          <br />
          Profil murid dan butang kebenaran pergerakan akan terpapar di sini serta-merta.
        </div>
      )}

      {/* QUICK TAP SIMULATION LIST */}
      <div className="pt-3 border-t border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Cari &amp; Tap Pantas Kad (Simulasi Warden)
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {filteredQuickList.length} murid sedia di-tap
          </span>
        </div>

        <input
          type="text"
          value={quickSearchQuery}
          onChange={e => setQuickSearchQuery(e.target.value)}
          placeholder="Tapis nama murid untuk tap pantas..."
          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400"
        />

        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
          {filteredQuickList.map(s => {
            const st = statuses[s.kp];
            const badge = getStatusBadgeConfig(st?.status || 'DALAM');
            return (
              <div
                key={s.kp}
                onClick={() => processScan(s.kp)}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 cursor-pointer transition-all group shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: getAvatarColor(s.kp) }}
                  >
                    {getStudentInitials(s.nama)}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-medium text-slate-800 group-hover:text-blue-700 transition-colors truncate block">
                      {s.nama}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {s.kelas} &middot; {s.kp}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-mono font-semibold">
                    TAP ➔
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guard Scan Receipt Modal (Official form like payment receipt) */}
      <GuardScanReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        student={selectedStudent}
        status={selectedStudent ? statuses[selectedStudent.kp] : undefined}
        passNumber={scannedReceiptMeta.passNumber}
        passType={scannedReceiptMeta.passType}
        approvedBy={scannedReceiptMeta.approvedBy}
        guardName={officerName}
        onConfirmKeluar={handleReceiptConfirmKeluar}
        onConfirmMasuk={handleReceiptConfirmMasuk}
      />

      {/* Camera QR Scanner Modal */}
      <CameraQrScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={(data) => {
          setIsCameraScannerOpen(false);
          processScan(data, true);
        }}
        title="Imbas Kod QR Pas Pelepasan Murid"
      />

    </div>
  );
};
