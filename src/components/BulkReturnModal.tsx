import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Home, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Filter, 
  Sparkles, 
  Clock, 
  Building,
  GraduationCap,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Student, StudentStatus, Warden } from '../types/hostel';
import { getAvatarColor, getStudentInitials } from '../utils/helpers';

interface BulkReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  statuses: Record<string, StudentStatus>;
  currentWarden: Warden;
  onConfirmBulkReturn: (selectedKps: string[], note: string) => void;
}

export const BulkReturnModal: React.FC<BulkReturnModalProps> = ({
  isOpen,
  onClose,
  students,
  statuses,
  currentWarden,
  onConfirmBulkReturn,
}) => {
  const [filterType, setFilterType] = useState<'KELUAR' | 'OUTING' | 'SEMUA_LUAR'>('KELUAR');
  const [filterTingkatan, setFilterTingkatan] = useState<string>('ALL');
  const [filterJantina, setFilterJantina] = useState<string>('ALL');
  const [note, setNote] = useState('Pulang petang - selesai sesi kelas persekolahan');
  const [selectedKps, setSelectedKps] = useState<Set<string>>(new Set());

  // Helper to safely get student status
  const getStatus = (s: Student) => {
    return statuses[s.kp]?.status || 
           (s.kp ? statuses[s.kp.replace(/[\s-]/g, '')]?.status : undefined) || 
           'DALAM';
  };

  // Eligible students who are currently OUT of hostel (KELUAR or OUTING)
  const eligibleStudents = useMemo(() => {
    return students.filter(s => {
      const st = getStatus(s);
      if (filterType === 'KELUAR') {
        if (st !== 'KELUAR') return false;
      } else if (filterType === 'OUTING') {
        if (st !== 'OUTING') return false;
      } else {
        // SEMUA_LUAR: both KELUAR and OUTING
        if (st !== 'KELUAR' && st !== 'OUTING') return false;
      }

      // Filter Tingkatan
      if (filterTingkatan !== 'ALL' && s.tingkatan !== Number(filterTingkatan)) {
        return false;
      }

      // Filter Jantina
      if (filterJantina !== 'ALL' && s.jantina !== filterJantina) {
        return false;
      }

      return true;
    });
  }, [students, statuses, filterType, filterTingkatan, filterJantina]);

  // Sync selectedKps whenever eligible list changes or on initial open
  React.useEffect(() => {
    if (isOpen) {
      setSelectedKps(new Set(eligibleStudents.map(s => s.kp)));
    }
  }, [isOpen, eligibleStudents]);

  if (!isOpen) return null;

  const totalKeluar = students.filter(s => getStatus(s) === 'KELUAR').length;
  const totalOuting = students.filter(s => getStatus(s) === 'OUTING').length;
  const totalDiLuar = totalKeluar + totalOuting;

  const handleToggleStudent = (kp: string) => {
    const next = new Set(selectedKps);
    if (next.has(kp)) {
      next.delete(kp);
    } else {
      next.add(kp);
    }
    setSelectedKps(next);
  };

  const handleSelectAll = () => {
    setSelectedKps(new Set(eligibleStudents.map(s => s.kp)));
  };

  const handleDeselectAll = () => {
    setSelectedKps(new Set());
  };

  const handleConfirm = () => {
    if (selectedKps.size === 0) return;
    onConfirmBulkReturn(Array.from(selectedKps), note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Home className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/30 text-emerald-100">
                  Tindakan Warden
                </span>
                <span className="text-[11px] text-emerald-200">
                  Waktu Petang
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white mt-0.5">
                Pulang ke Asrama Secara Pukal
              </h2>
              <p className="text-xs text-emerald-100/80">
                Tandakan murid telah selamat kembali ke asrama tanpa perlu scan seorang demi seorang.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* Quick Stat Summary Alert */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-[11px] font-medium text-amber-700">Keluar Kelas / Sekolah</p>
              <p className="text-xl font-bold text-amber-900 mt-0.5">{totalKeluar}</p>
              <p className="text-[10px] text-amber-600">Murid</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
              <p className="text-[11px] font-medium text-blue-700">Outing Harian</p>
              <p className="text-xl font-bold text-blue-900 mt-0.5">{totalOuting}</p>
              <p className="text-[10px] text-blue-600">Murid</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <p className="text-[11px] font-medium text-emerald-700">Dipilih Untuk Pulang</p>
              <p className="text-xl font-bold text-emerald-900 mt-0.5">{selectedKps.size}</p>
              <p className="text-[10px] text-emerald-600">Murid</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                Pilihan Kumpulan Murid
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline"
                >
                  Pilih Semua ({eligibleStudents.length})
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 underline"
                >
                  Batal Semua
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Category selector */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Status Semasa</label>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-emerald-500"
                >
                  <option value="KELUAR">Keluar Kelas Sahaja ({totalKeluar})</option>
                  <option value="SEMUA_LUAR">Semua Di Luar (Kelas + Outing: {totalDiLuar})</option>
                  <option value="OUTING">Outing Harian Sahaja ({totalOuting})</option>
                </select>
              </div>

              {/* Tingkatan selector */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Tingkatan</label>
                <select
                  value={filterTingkatan}
                  onChange={e => setFilterTingkatan(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Semua Tingkatan</option>
                  <option value="1">Tingkatan 1</option>
                  <option value="2">Tingkatan 2</option>
                  <option value="3">Tingkatan 3</option>
                  <option value="4">Tingkatan 4</option>
                  <option value="5">Tingkatan 5</option>
                </select>
              </div>

              {/* Jantina selector */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Jantina / Asrama</label>
                <select
                  value={filterJantina}
                  onChange={e => setFilterJantina(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Semua (Putra & Putri)</option>
                  <option value="L">Asrama Putra (Lelaki)</option>
                  <option value="P">Asrama Putri (Perempuan)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student preview checklist */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-slate-700">
                Senarai Murid Akan Ditandakan Pulang ({eligibleStudents.length}):
              </p>
              <span className="text-[11px] text-slate-500">
                Klik mana-mana murid untuk nyahpilih jika belum pulang
              </span>
            </div>

            {eligibleStudents.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-700">
                  Tiada murid dalam kategori ini yang sedang berada di luar
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Semua murid telah berada di dalam asrama atau tiada padanan tapisan.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-100 bg-white">
                {eligibleStudents.map(student => {
                  const isChecked = selectedKps.has(student.kp);
                  const st = getStatus(student);
                  return (
                    <div
                      key={student.kp}
                      onClick={() => handleToggleStudent(student.kp)}
                      className={`flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                        isChecked ? 'bg-emerald-50/30' : 'opacity-60 bg-slate-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isChecked 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-700 overflow-hidden shrink-0">
                          {student.gambar ? (
                            <img src={student.gambar} alt={student.nama} className="w-full h-full object-cover" />
                          ) : (
                            getStudentInitials(student.nama)
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                            {student.nama}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <span>Ting. {student.tingkatan}</span>
                            <span>&middot;</span>
                            <span>{student.kelas}</span>
                            {student.dorm && (
                              <>
                                <span>&middot;</span>
                                <span>{student.dorm}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st === 'OUTING' 
                            ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {st === 'OUTING' ? 'Outing' : 'Keluar Kelas'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Rekod (Log Warden)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Cth: Pulang petang tamat sesi kelas 4:00 petang"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Tindakan ini akan direkodkan di bawah nama warden: <span className="font-semibold text-slate-700">{currentWarden?.nama || 'Warden Bertugas'}</span>
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            <span className="font-bold text-emerald-700">{selectedKps.size}</span> murid dipilih
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={selectedKps.size === 0}
              onClick={handleConfirm}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
                selectedKps.size > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Sahkan Pulang ke Asrama ({selectedKps.size})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
