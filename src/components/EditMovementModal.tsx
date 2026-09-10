import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Save, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Truck, 
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Student, StudentStatus, StatusType } from '../types/hostel';
import { getAvatarColor, getStudentInitials, getStatusBadgeConfig } from '../utils/helpers';

interface EditMovementModalProps {
  student: Student | null;
  status: StudentStatus | undefined;
  wardenName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    student: Student,
    newStatusData: {
      status: StatusType;
      dest: string;
      expectedReturn: string;
      transport: string;
      guardianName: string;
      guardianPhone: string;
    },
    correctionNote: string
  ) => void;
  onCancelMovement: (student: Student, reason: string) => void;
}

export const EditMovementModal: React.FC<EditMovementModalProps> = ({
  student,
  status,
  wardenName,
  isOpen,
  onClose,
  onSave,
  onCancelMovement
}) => {
  if (!isOpen || !student) return null;

  const currentStatusType: StatusType = status?.status || 'DALAM';

  // State
  const [selectedStatus, setSelectedStatus] = useState<StatusType>(currentStatusType);
  const [dest, setDest] = useState(status?.dest || '');
  const [tarikhBalik, setTarikhBalik] = useState('');
  const [masaBalik, setMasaBalik] = useState('');
  const [transport, setTransport] = useState(status?.transport || '');
  const [guardianName, setGuardianName] = useState(status?.guardianName || student.namaWaris || '');
  const [guardianPhone, setGuardianPhone] = useState(status?.guardianPhone || student.telWaris || '');
  const [correctionNote, setCorrectionNote] = useState('');
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  // Parse existing expectedReturn (format: "YYYY-MM-DD HH:mm" or similar)
  useEffect(() => {
    setSelectedStatus(status?.status || 'DALAM');
    setDest(status?.dest || '');
    setTransport(status?.transport || '');
    setGuardianName(status?.guardianName || student.namaWaris || '');
    setGuardianPhone(status?.guardianPhone || student.telWaris || '');
    setCorrectionNote('');
    setShowConfirmCancel(false);

    if (status?.expectedReturn) {
      const parts = status.expectedReturn.trim().split(' ');
      if (parts.length >= 2) {
        setTarikhBalik(parts[0]);
        setMasaBalik(parts[1]);
      } else if (parts.length === 1 && parts[0].includes('-')) {
        setTarikhBalik(parts[0]);
        setMasaBalik('18:00');
      } else {
        const today = new Date().toISOString().slice(0, 10);
        setTarikhBalik(today);
        setMasaBalik(parts[0] || '18:00');
      }
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setTarikhBalik(today);
      setMasaBalik(currentStatusType === 'BERMALAM' ? '17:00' : '18:30');
    }
  }, [student, status, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalExpectedReturn = (tarikhBalik && masaBalik) 
      ? `${tarikhBalik} ${masaBalik}`.trim()
      : status?.expectedReturn || '';

    onSave(
      student,
      {
        status: selectedStatus,
        dest: dest.trim(),
        expectedReturn: finalExpectedReturn,
        transport: transport.trim(),
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim()
      },
      correctionNote.trim() || 'Pembetulan maklumat rekod oleh warden'
    );
    onClose();
  };

  const handleExecuteCancelMovement = () => {
    onCancelMovement(
      student,
      correctionNote.trim() || 'Pembatalan rekod: Murid sebenarnya tidak keluar / tersilap rekod'
    );
    onClose();
  };

  const statusConfig = getStatusBadgeConfig(currentStatusType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-sm">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Kemaskini / Edit Rekod Pergerakan
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  Pembetulan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Betulkan kesilapan maklumat keluar, masa, atau status murid
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Mini Card */}
        <div className="p-4 sm:p-5 bg-blue-50/40 border-b border-blue-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0 ${getAvatarColor(student.bidang)}`}>
              {getStudentInitials(student.nama)}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm truncate">{student.nama}</div>
              <div className="text-[11px] text-slate-500 font-mono flex flex-wrap items-center gap-1.5 pt-0.5">
                <span>{student.kp}</span>
                <span>&middot;</span>
                <span className="font-semibold text-slate-700">{student.kelas}</span>
                <span>&middot;</span>
                <span className="text-blue-700 font-medium">{student.bidang}</span>
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-[10px] text-slate-500 font-medium">Status Asal</div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Informational Guidance */}
        <div className="mx-4 sm:mx-5 mt-4 p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Jika rekod ini dimasukkan secara tersilap (contoh: salah pilih murid atau murid sebenarnya tidak keluar), anda boleh klik butang <b>"Batal Keluar (Kembalikan ke Dalam Asrama)"</b> di bahagian bawah.
          </p>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Status Pergerakan Yang Betul
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedStatus('OUTING')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                  selectedStatus === 'OUTING'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/40'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Outing Harian
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('BERMALAM')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                  selectedStatus === 'BERMALAM'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-400/40'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Pulang Bermalam
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('KELUAR')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                  selectedStatus === 'KELUAR'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-sm ring-2 ring-purple-400/40'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Lawatan / Luar
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('DALAM')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                  selectedStatus === 'DALAM'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400/40'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Dalam Asrama
              </button>
            </div>
          </div>

          {/* Destinasi / Tujuan */}
          {selectedStatus !== 'DALAM' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Destinasi / Nama Aktiviti / Tujuan
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={dest}
                  onChange={e => setDest(e.target.value)}
                  placeholder="Contoh: Lawatan Muzik ke JB, AEON Tebrau, Rumah Keluarga..."
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Tarikh & Masa Balik (Dijangka) */}
          {selectedStatus !== 'DALAM' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tarikh Balik (Dijangka)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={tarikhBalik}
                    onChange={e => setTarikhBalik(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Masa Balik (Dijangka)
                </label>
                <div className="relative">
                  <input
                    type="time"
                    required
                    value={masaBalik}
                    onChange={e => setMasaBalik(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Catatan / Pengangkutan */}
          {selectedStatus !== 'DALAM' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Catatan / Pengangkutan / No. Kenderaan
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={transport}
                  onChange={e => setTransport(e.target.value)}
                  placeholder="Contoh: Bas Sekolah SSeMJ, Kereta Bapa (JTL 8899), dsb."
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Waris Info if Bermalam */}
          {selectedStatus === 'BERMALAM' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Penjaga Mengambil
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={guardianName}
                    onChange={e => setGuardianName(e.target.value)}
                    placeholder="Nama waris / penjaga..."
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  No. Telefon Penjaga
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={e => setGuardianPhone(e.target.value)}
                    placeholder="Contoh: 012-3456789"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Sebab Pembetulan / Audit Trail Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan Pembetulan (Audit Log)
            </label>
            <input
              type="text"
              value={correctionNote}
              onChange={e => setCorrectionNote(e.target.value)}
              placeholder="Contoh: Pembetulan masa balik yang tersilap isi, atau pertukaran van..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Catatan ini akan direkodkan dalam Log Pergerakan bagi tujuan rekod pengurusan warden ({wardenName}).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Quick Cancel Movement Button if currently outside */}
            {currentStatusType !== 'DALAM' && (
              <div>
                {!showConfirmCancel ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmCancel(true)}
                    className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Batal Keluar (Tersilap Rekod)</span>
                  </button>
                ) : (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                    <div className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Sahkan batalkan rekod keluar murid ini?</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExecuteCancelMovement}
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all"
                      >
                        Ya, Batal Keluar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmCancel(false)}
                        className="px-2.5 py-1 rounded-lg bg-white text-slate-600 border border-slate-200 text-xs font-medium"
                      >
                        Kembali
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Kemaskini</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
