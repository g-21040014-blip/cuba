import React from 'react';
import { 
  X, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Home, 
  Clock, 
  Sparkles, 
  ExternalLink,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  Edit3
} from 'lucide-react';
import { RealQrCode } from './RealQrCode';
import { DuitNowQrCard } from './DuitNowQrCard';
import { Student, StudentStatus, HostelLog } from '../types/hostel';
import { 
  getStudentInitials, 
  getAvatarColor, 
  getStatusBadgeConfig, 
  getBidangColor, 
  formatDateTime, 
  getRelativeTime, 
  isOutingOverdue 
} from '../utils/helpers';

interface StudentModalProps {
  student: Student | null;
  status: StudentStatus | undefined;
  logs: HostelLog[];
  onClose: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent?: (kp: string) => void;
  onOpenGatePass: (student: Student) => void;
  onQuickAction: (action: 'masuk' | 'keluar' | 'keluar-lain' | 'end-outing') => void;
  onOpenEditMovement?: (student: Student) => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  student,
  status,
  logs,
  onClose,
  onEditStudent,
  onDeleteStudent,
  onOpenGatePass,
  onQuickAction,
  onOpenEditMovement
}) => {
  const [isEditingWaris, setIsEditingWaris] = React.useState(false);
  const [editNamaWaris, setEditNamaWaris] = React.useState('');
  const [editTelWaris, setEditTelWaris] = React.useState('');
  const [showDuitNowCard, setShowDuitNowCard] = React.useState(false);

  React.useEffect(() => {
    if (student) {
      setEditNamaWaris(student.namaWaris || '');
      setEditTelWaris(student.telWaris || '');
      setIsEditingWaris(false);
    }
  }, [student]);

  if (!student || !status) return null;

  const handleSaveWaris = () => {
    if (student) {
      onEditStudent({
        ...student,
        namaWaris: editNamaWaris,
        telWaris: editTelWaris
      });
      setIsEditingWaris(false);
    }
  };

  const stConfig = getStatusBadgeConfig(status.status);
  const bidangConfig = getBidangColor(student.bidang);
  const isOverdue = status.status === 'OUTING' && isOutingOverdue(status.expectedReturn);

  // Filter logs for this specific student
  const studentLogs = logs.filter(l => l.kp === student.kp).slice(0, 8);

  const cleanPhone = student.telWaris?.replace(/[^0-9]/g, '') || '';
  const waUrl = cleanPhone ? `https://wa.me/6${cleanPhone}?text=Assalamualaikum%20${encodeURIComponent(student.namaWaris || 'Tuan/Puan')},%20makluman%20pergerakan%20asrama%20Sekolah%20Seni%20Malaysia%20bagi%20anak%20tuan/puan%20${encodeURIComponent(student.nama)}.` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span className="text-xs uppercase tracking-wider font-bold text-slate-800">
              Maklumat Murid &middot; SSeMJ
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          
          {/* DIGITAL SMART CARD VISUAL */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 border border-blue-500/40 p-5 sm:p-6 shadow-xl ring-1 ring-black/5 text-white">
            {/* Card Chip & Crest Watermark */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-8 rounded-md bg-gradient-to-r from-amber-300 to-amber-100 border border-amber-400/60 flex items-center justify-center shadow-inner">
                  <div className="w-6 h-5 border border-amber-600/40 rounded grid grid-cols-2 gap-0.5 p-0.5">
                    <div className="bg-amber-500/30"></div>
                    <div className="bg-amber-500/30"></div>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-blue-200 tracking-wider">
                  NFC SMART PASS
                </span>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">
                  Sekolah Seni Malaysia Johor
                </div>
                <div className="text-[9px] text-blue-100/80">Kementerian Pendidikan Malaysia</div>
              </div>
            </div>

            {/* Profile Info Row */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
              {/* Photo */}
              <div className="relative group flex-shrink-0">
                <div 
                  className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-2xl shadow-lg ring-2 ring-white/30 relative"
                  style={{ backgroundColor: getAvatarColor(student.kp) }}
                >
                  <span className="text-white select-none">
                    {getStudentInitials(student.nama)}
                  </span>
                  {student.gambar && (
                    <img 
                      src={student.gambar} 
                      alt={student.nama}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <span className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${bidangConfig.bg} ${bidangConfig.text} ${bidangConfig.border}`}>
                  {student.bidang}
                </span>
              </div>

              {/* Student Bio */}
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {student.nama}
                </h3>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-blue-100">
                  <span className="font-mono bg-blue-900/70 px-2 py-0.5 rounded border border-blue-500/30">
                    KP: {student.kp}
                  </span>
                  <span className="bg-blue-900/70 px-2 py-0.5 rounded text-blue-200 border border-blue-500/30">
                    ID: {student.id}
                  </span>
                  <span className="text-blue-200">
                    Jantina: {student.jantina === 'L' ? 'Lelaki' : 'Perempuan'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                  <span className="bg-blue-900/80 text-blue-100 px-2.5 py-0.5 rounded-full border border-blue-400/40 font-medium">
                    {student.kelas} ({student.kelasSeni})
                  </span>
                  <span className="bg-blue-900/80 text-blue-100 px-2.5 py-0.5 rounded-full border border-blue-400/40 flex items-center gap-1">
                    <Home className="w-3 h-3 text-amber-300" />
                    {student.dorm || 'Blok Asrama'}
                  </span>
                </div>
              </div>

              {/* Real Scannable QR Code for Security Gate / Identity Verification */}
              <button
                type="button"
                onClick={() => setShowDuitNowCard(true)}
                title="Klik untuk buka Kad QR Gaya DuitNow"
                className="hidden sm:flex flex-col items-center justify-center bg-white p-2 rounded-xl text-slate-900 shadow-md border border-white/80 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
              >
                <RealQrCode 
                  value={`SSeMJ ID MURID\nNama: ${student.nama}\nNo. KP: ${student.kp}\nKelas: ${student.kelas}\nBidang: ${student.bidang}\nAsrama: ${student.dorm || 'Blok Utama'}`}
                  size={54}
                  alt={`QR Murid ${student.nama}`}
                />
                <span className="text-[8px] font-mono mt-0.5 font-bold text-[#D9146C] tracking-tight group-hover:underline">
                  KAD DUITNOW ↗
                </span>
              </button>
            </div>

            {/* Current Status Footer on Card */}
            <div className="mt-4 pt-3 border-t border-blue-600/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-blue-200">Status Semasa:</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold border ${stConfig.bg} ${stConfig.text} ${stConfig.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${stConfig.dot}`}></span>
                  {stConfig.label}
                </span>
                {isOverdue && (
                  <span className="bg-rose-500 text-white border border-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                    LEWAT BALIK
                  </span>
                )}
                {onOpenEditMovement && (
                  <button
                    type="button"
                    onClick={() => onOpenEditMovement(student)}
                    className="ml-1 px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Edit Rekod Pergerakan Jika Ada Kesilapan"
                  >
                    <Edit3 className="w-3 h-3 text-amber-300" />
                    <span>Edit Rekod</span>
                  </button>
                )}
              </div>
              <div className="text-blue-200 text-[11px] font-mono">
                Kemaskini: {getRelativeTime(status.since)}
              </div>
            </div>
          </div>

          {/* QUICK MOVEMENT CONTROLS */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tindakan Pantas Warden
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => onQuickAction('masuk')}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Masuk Asrama
              </button>

              <button
                onClick={() => onQuickAction('keluar-lain')}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Keluar Asrama
              </button>

              {status.status === 'OUTING' && (
                <button
                  onClick={() => onQuickAction('end-outing')}
                  className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tamat Outing
                </button>
              )}

              <button
                onClick={() => onOpenGatePass(student)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                Jana Pas Pagar
              </button>

              <button
                type="button"
                onClick={() => setShowDuitNowCard(true)}
                className="px-3 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#D9146C] border border-pink-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer col-span-2 sm:col-span-1"
              >
                <CreditCard className="w-3.5 h-3.5 text-[#D9146C]" />
                Kad QR DuitNow
              </button>
            </div>
          </div>

          {/* WARIS & GUARDIAN CONTACT SECTION */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  Maklumat Ibu Bapa / Waris
                </span>
                {!isEditingWaris && (
                  <button 
                    onClick={() => setIsEditingWaris(true)}
                    className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="Edit Maklumat"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {isEditingWaris && (
                <button 
                  onClick={() => setIsEditingWaris(false)}
                  className="text-[10px] bg-slate-200 hover:bg-slate-300 px-2 py-0.5 rounded text-slate-700 transition-colors font-medium"
                >
                  Batal
                </button>
              )}
            </div>

            {isEditingWaris ? (
              <div className="flex flex-col gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-600 font-medium block mb-1">Nama Ibu Bapa / Waris</label>
                  <input
                    type="text"
                    value={editNamaWaris}
                    onChange={(e) => setEditNamaWaris(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                    placeholder="Contoh: Ahmad Bin Ali"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-600 font-medium block mb-1">No. Telefon</label>
                  <input
                    type="text"
                    value={editTelWaris}
                    onChange={(e) => setEditTelWaris(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="Contoh: 0123456789"
                  />
                </div>
                <button
                  onClick={handleSaveWaris}
                  className="mt-1 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Maklumat Waris
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{student.namaWaris || 'Waris Belum Didaftarkan'}</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">
                    Tel: {student.telWaris || 'Tiada nombor'}
                  </div>
                </div>

                {cleanPhone && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${cleanPhone}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-all border border-slate-200 shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      Panggil
                    </a>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition-all shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MOVEMENT HISTORY FOR THIS STUDENT */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Log Pergerakan Terkini Murid Ini
              </span>
              <span className="text-[11px] text-slate-500">{studentLogs.length} rekod</span>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 max-h-48 overflow-y-auto">
              {studentLogs.length > 0 ? (
                studentLogs.map(log => (
                  <div key={log.id} className="p-3 text-xs flex items-start justify-between gap-3">
                    <div>
                      <span className="font-semibold text-slate-900">{log.action}</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">{log.detail || 'Pergerakan disahkan'}</p>
                      {log.officer && (
                        <p className="text-slate-500 text-[10px] mt-0.5">Pegawai: {log.officer}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 text-slate-500 font-mono text-[11px]">
                      {formatDateTime(log.ts)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  Belum ada rekod log khusus untuk murid ini.
                </div>
              )}
            </div>
          </div>

          {/* DANGER ZONE / PADAM MURID */}
          {onDeleteStudent && (
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  if (window.confirm(`Adakah anda pasti mahu memadam rekod ${student.nama}? Data akan hilang.`)) {
                    onDeleteStudent(student.kp);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors text-[11px] font-semibold flex items-center gap-1.5 border border-red-200"
                title="Padam Rekod Murid"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Padam Murid
              </button>
            </div>
          )}

        </div>
      </div>

      {/* DUITNOW STYLE CARD POPUP MODAL */}
      {showDuitNowCard && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowDuitNowCard(false)}
        >
          <div 
            className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl max-w-sm w-full flex flex-col items-center border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#D9146C]" />
                Kad QR Identiti (Gaya DuitNow)
              </span>
              <button
                type="button"
                onClick={() => setShowDuitNowCard(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <DuitNowQrCard
              title={student.nama}
              subtitle={`${student.kelas} (${student.bidang}) · KP: ${student.kp}`}
              qrValue={`SSeMJ ID MURID\nNama: ${student.nama}\nNo. KP: ${student.kp}\nKelas: ${student.kelas}\nBidang: ${student.bidang}\nAsrama: ${student.dorm || 'Blok Utama'}`}
              codeNumber={student.kp}
              bannerText="KOD IDENTITI RASMI SSeMJ"
              footerNote="Kad Identiti Murid Asrama Sekolah Seni Malaysia Johor"
            />

            <div className="w-full mt-4 pt-3 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Cetak Kad
              </button>
              <button
                type="button"
                onClick={() => setShowDuitNowCard(false)}
                className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
