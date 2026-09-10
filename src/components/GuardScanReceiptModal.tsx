import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  ShieldCheck, 
  AlertCircle, 
  LogIn, 
  LogOut, 
  Home, 
  Car,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { Student, StudentStatus } from '../types/hostel';
import { 
  getStatusBadgeConfig, 
  getBidangColor, 
  formatDateTime 
} from '../utils/helpers';
import { sounds } from '../utils/audio';

export interface GuardScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  status: StudentStatus | undefined;
  passNumber?: string;
  passType?: 'outing' | 'bermalam' | 'biasa';
  approvedBy?: string;
  guardName?: string;
  onConfirmKeluar: (
    student: Student, 
    type: 'outing' | 'bermalam' | 'biasa', 
    destination: string, 
    expectedReturn: string,
    guardianName?: string, 
    guardianPhone?: string, 
    carPlate?: string
  ) => void;
  onConfirmMasuk: (student: Student) => void;
}

export const GuardScanReceiptModal: React.FC<GuardScanReceiptModalProps> = ({
  isOpen,
  onClose,
  student,
  status,
  passNumber,
  passType = 'outing',
  approvedBy = 'Warden Asrama',
  guardName = 'Pengawal Keselamatan Pintu Pagar',
  onConfirmKeluar,
  onConfirmMasuk,
}) => {
  const [justRecorded, setJustRecorded] = useState<'keluar' | 'masuk' | null>(null);
  const [actionType, setActionType] = useState<'outing' | 'bermalam' | 'biasa'>(passType);
  const [destination, setDestination] = useState('Bandar / Pasar Raya');
  const [expectedReturn, setExpectedReturn] = useState('06:00 PM');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [carPlate, setCarPlate] = useState('');

  // Auto-fill student guardian details if available
  React.useEffect(() => {
    if (student) {
      setGuardianName(student.namaWaris || '');
      setGuardianPhone(student.telWaris || '');
      setJustRecorded(null);
      if (passType) setActionType(passType);
    }
  }, [student, passType]);

  if (!isOpen || !student) return null;

  const currentStatusCode = status?.status || 'DALAM';
  const stConfig = getStatusBadgeConfig(currentStatusCode);
  const bidangConfig = getBidangColor(student.bidang);
  const receiptNo = passNumber || status?.passId || `PAS-${student.tingkatan}-${student.kp.slice(-4)}-${Date.now().toString().slice(-4)}`;
  const nowStr = formatDateTime(Date.now());

  const handleKeluar = () => {
    onConfirmKeluar(
      student, 
      actionType, 
      destination, 
      expectedReturn, 
      guardianName, 
      guardianPhone, 
      carPlate
    );
    sounds.playActionChime('out');
    setJustRecorded('keluar');
  };

  const handleMasuk = () => {
    onConfirmMasuk(student);
    sounds.playSuccessBeep();
    setJustRecorded('masuk');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div 
      className="modal-backdrop-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="modal-card-print relative bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 my-auto text-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Bar (Screen only) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold tracking-wide uppercase">
              Pengesahan Imbasan Pondok Pagar
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Cetak Salinan Resit Ini"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-[11px] font-medium hidden sm:inline">Cetak</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RECEIPT SLIP BODY (PRINTABLE) */}
        <div className="p-5 sm:p-6 space-y-4 print:p-4 print:text-black">
          
          {/* RECEIPT HEADER - PERSIS RESIT BAYARAN DUITNOW DI KEDAI */}
          <div className="text-center border-b-2 border-dashed border-slate-300 pb-4">
            <div className="flex justify-center mb-2">
              <img 
                src="/logo_ssemj_original.jpg" 
                alt="Logo SSeMJ" 
                className="h-16 w-auto object-contain drop-shadow-xs" 
              />
            </div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
              SEKOLAH SENI MALAYSIA JOHOR
            </h2>
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">
              SLIP RASMI PENGESAHAN PERGERAKAN ASRAMA
            </p>
            <p className="text-[10px] text-slate-500">
              Pos Kawalan Keselamatan Pintu Pagar &middot; Unit HEM
            </p>

            {/* DuitNow Style Success Pill */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>KOD QR TELAH DIIMBAS &amp; SAH</span>
            </div>
          </div>

          {/* RECEIPT TRANSACTION META */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-2 font-mono">
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>NO. RUJUKAN PAS:</span>
              <span className="font-bold text-slate-900 font-sans tracking-wide">{receiptNo}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>TARIKH &amp; MASA IMBASAN:</span>
              <span className="text-slate-800 font-semibold">{nowStr}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>PEGAWAI / PENGAWAL BERTUGAS:</span>
              <span className="text-slate-800 font-semibold font-sans">{guardName}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-[11px] pt-1 border-t border-slate-200">
              <span>STATUS KELULUSAN WARDEN:</span>
              <span className="font-bold text-emerald-700 font-sans flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {approvedBy ? `DILULUSKAN (${approvedBy})` : 'DILULUSKAN'}
              </span>
            </div>
          </div>

          {/* STUDENT PROFILE SUMMARY */}
          <div className="border border-slate-200 rounded-2xl p-3.5 bg-white space-y-2.5 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center font-black text-sm shrink-0">
                {student.nama.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">
                  {student.nama}
                </div>
                <div className="text-xs text-slate-600 font-mono mt-0.5">
                  No. KP: <span className="font-bold text-slate-800">{student.kp}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                    {student.kelas}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${bidangConfig.bg} ${bidangConfig.text}`}>
                    {student.bidang}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold">
                    {student.dorm || 'Asrama SSeMJ'}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Student Status Banner */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Status Semasa Rekod:</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border ${stConfig.bg} ${stConfig.text} ${stConfig.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${stConfig.dot}`}></span>
                {stConfig.label}
              </span>
            </div>
          </div>

          {/* GUARDIAN & PASS INTENT DETAILS (IF ANY) */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3 text-xs space-y-1.5 text-slate-700">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Maklumat Waris / Pengambil (Jika Ada)
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Nama Waris:</span>
                <span className="font-semibold text-slate-800">{guardianName || 'Tiada maklumat'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">No. Telefon:</span>
                <span className="font-semibold text-slate-800">{guardianPhone || 'Tiada'}</span>
              </div>
            </div>
            {carPlate && (
              <div className="text-[11px] pt-1 border-t border-slate-200 flex items-center gap-1 text-slate-600">
                <Car className="w-3.5 h-3.5 text-slate-500" />
                <span>No. Kenderaan: <b>{carPlate}</b></span>
              </div>
            )}
          </div>

          {/* ACTION STATUS STAMP - IF JUST RECORDED */}
          {justRecorded && (
            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center space-y-1 animate-in zoom-in-95 duration-200 shadow-md">
              <div className="flex items-center justify-center gap-1.5 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                {justRecorded === 'keluar' 
                  ? 'REKOD KELUAR ASRAMA BERJAYA DITANDAKAN!' 
                  : 'REKOD MASUK / KEMBALI ASRAMA BERJAYA DITANDAKAN!'}
              </div>
              <p className="text-xs text-emerald-100">
                Data telah dikemaskini dalam sistem asrama dan log pengawal keselamatan.
              </p>
            </div>
          )}

          {/* GUARD ACTION CONTROLS (SCREEN ONLY) */}
          {!justRecorded && (
            <div className="no-print space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                <span>Tindakan Pengawal Keselamatan:</span>
                <span className="text-[10px] text-blue-600 lowercase font-normal">tekan butang untuk rekodkan</span>
              </div>

              {/* Action buttons depending on student state */}
              {currentStatusCode === 'DALAM' ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <button
                      type="button"
                      onClick={() => setActionType('outing')}
                      className={`p-2 rounded-xl font-semibold border transition-all cursor-pointer ${
                        actionType === 'outing' 
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Outing
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType('bermalam')}
                      className={`p-2 rounded-xl font-semibold border transition-all cursor-pointer ${
                        actionType === 'bermalam' 
                          ? 'bg-purple-600 text-white border-purple-700 shadow-xs' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Bermalam
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType('biasa')}
                      className={`p-2 rounded-xl font-semibold border transition-all cursor-pointer ${
                        actionType === 'biasa' 
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Keluar Asrama
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleKeluar}
                    className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sahkan &amp; Tandakan Murid KELUAR Pagar</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleMasuk}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sahkan &amp; Tandakan Murid KEMBALI / MASUK Pagar</span>
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleKeluar}
                      className="text-xs text-slate-500 hover:text-rose-600 underline cursor-pointer"
                    >
                      Tukar kepada rekod KELUAR semula jika tersilap
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SERRATED TEAR LINE FOOTER (RECEIPT LOOK) */}
          <div className="pt-3 border-t-2 border-dashed border-slate-300 text-center space-y-1">
            <div className="text-[10px] text-slate-400 font-mono">
              *** TERIMA KASIH &middot; KAWALAN KESELAMATAN SSeMJ ***
            </div>
            <div className="text-[9px] text-slate-400">
              Dokumen ini dijana secara digital oleh Sistem Asrama SSeMJ
            </div>
          </div>

          {/* Close or Done button */}
          <div className="no-print pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {justRecorded ? 'Tutup & Sedia Untuk Imbasan Seterusnya' : 'Tutup'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
