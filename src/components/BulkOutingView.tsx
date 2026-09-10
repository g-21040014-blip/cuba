import React, { useState, useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Filter, 
  Sparkles, 
  Clock, 
  Calendar,
  Building,
  GraduationCap,
  ShieldCheck,
  Check,
  Search,
  CheckSquare,
  Square,
  Printer,
  ChevronRight,
  Info,
  LogOut,
  MapPin,
  FileText,
  UserCheck,
  ArrowRight,
  Send,
  Eye
} from 'lucide-react';
import { Student, StudentStatus, Warden, StreamType } from '../types/hostel';
import { getAvatarColor, getStudentInitials, getStatusBadgeConfig, getBidangColor } from '../utils/helpers';

interface BulkOutingViewProps {
  students: Student[];
  statuses: Record<string, StudentStatus>;
  wardens: Warden[];
  currentWarden: Warden;
  onConfirmBulkOuting: (
    selectedKps: string[],
    params: {
      type: 'BERMALAM' | 'OUTING' | 'KELUAR';
      tarikhKeluar: string;
      masaKeluar: string;
      tarikhBalik: string;
      masaBalik: string;
      tujuan: string;
      catatan: string;
      wardenNama: string;
    }
  ) => void;
  onNavigateTab?: (tab: 'dashboard' | 'scan' | 'murid' | 'outing' | 'kehadiran' | 'log' | 'keluar-pukal') => void;
}

export const BulkOutingView: React.FC<BulkOutingViewProps> = ({
  students,
  statuses,
  wardens,
  currentWarden,
  onConfirmBulkOuting,
  onNavigateTab
}) => {
  // --- SUCCESS NOTIFICATION STATE ---
  const [executionSuccess, setExecutionSuccess] = useState<{
    count: number;
    type: 'BERMALAM' | 'OUTING' | 'KELUAR';
    tujuan: string;
    tarikhBalik: string;
    masaBalik: string;
    wardenNama: string;
  } | null>(null);

  // --- FORM STATE ---
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const defaultReturnDateStr = useMemo(() => {
    const d = new Date();
    // Default return 2 days later or next Sunday
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }, []);

  const defaultTimeStr = useMemo(() => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }, []);

  const [outingType, setOutingType] = useState<'BERMALAM' | 'OUTING' | 'KELUAR'>('BERMALAM');
  const [tarikhKeluar, setTarikhKeluar] = useState(todayStr);
  const [masaKeluar, setMasaKeluar] = useState(defaultTimeStr);
  const [tarikhBalik, setTarikhBalik] = useState(defaultReturnDateStr);
  const [masaBalik, setMasaBalik] = useState('18:00');
  const [tujuan, setTujuan] = useState('Cuti Bermalam Hujung Minggu');
  const [catatan, setCatatan] = useState('Dijemput ibu bapa / pengangkutan keluarga');
  const [selectedWardenNama, setSelectedWardenNama] = useState(currentWarden?.nama || (wardens[0]?.nama ?? 'Warden Bertugas'));

  // --- ENUMLIST FILTER STATE ---
  const [filterTingkatan, setFilterTingkatan] = useState<string>('ALL');
  const [filterBidang, setFilterBidang] = useState<string>('ALL');
  const [filterJantina, setFilterJantina] = useState<string>('ALL'); // 'ALL' | 'L' | 'P'
  const [filterStatus, setFilterStatus] = useState<'DALAM' | 'ALL'>('DALAM');
  const [searchQuery, setSearchQuery] = useState('');

  // --- SELECTION STATE ---
  const [selectedKps, setSelectedKps] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Helper to safely get student status
  const getStatus = (s: Student): string => {
    return statuses[s.kp]?.status || 
           (s.kp ? statuses[s.kp.replace(/[\s-]/g, '')]?.status : undefined) || 
           'DALAM';
  };

  // Filtered students list based on criteria
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return students.filter(s => {
      const st = getStatus(s);

      // Status filter
      if (filterStatus === 'DALAM' && st !== 'DALAM') {
        return false;
      }

      // Tingkatan filter
      if (filterTingkatan !== 'ALL' && s.tingkatan !== Number(filterTingkatan)) {
        return false;
      }

      // Bidang filter
      if (filterBidang !== 'ALL' && s.bidang !== filterBidang) {
        return false;
      }

      // Jantina / Asrama (Aspura/Aspuri) filter
      if (filterJantina !== 'ALL' && s.jantina !== filterJantina) {
        return false;
      }

      // Search query filter
      if (q) {
        const cleanKp = (s.kp || '').toLowerCase().replace(/[\s-]/g, '');
        const searchKp = q.replace(/[\s-]/g, '');
        const matchName = (s.nama || '').toLowerCase().includes(q);
        const matchKp = cleanKp.includes(searchKp);
        const matchClass = (s.kelas || '').toLowerCase().includes(q);
        const matchDorm = (s.dorm || '').toLowerCase().includes(q);
        if (!matchName && !matchKp && !matchClass && !matchDorm) {
          return false;
        }
      }

      return true;
    });
  }, [students, statuses, filterStatus, filterTingkatan, filterBidang, filterJantina, searchQuery]);

  // Selected students objects
  const selectedStudentsList = useMemo(() => {
    return students.filter(s => selectedKps.has(s.kp));
  }, [students, selectedKps]);

  // Breakdown statistics of selected students
  const selectionStats = useMemo(() => {
    let aspura = 0;
    let aspuri = 0;
    const formCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const bidangCounts: Record<string, number> = {};

    selectedStudentsList.forEach(s => {
      if (s.jantina === 'L') aspura++;
      else aspuri++;

      if (formCounts[s.tingkatan] !== undefined) {
        formCounts[s.tingkatan]++;
      }
      bidangCounts[s.bidang] = (bidangCounts[s.bidang] || 0) + 1;
    });

    return {
      total: selectedStudentsList.length,
      aspura,
      aspuri,
      formCounts,
      bidangCounts
    };
  }, [selectedStudentsList]);

  // Toggle individual student in EnumList
  const toggleStudent = (kp: string) => {
    setSelectedKps(prev => {
      const next = new Set(prev);
      if (next.has(kp)) {
        next.delete(kp);
      } else {
        next.add(kp);
      }
      return next;
    });
  };

  // Select all currently filtered
  const handleSelectAllFiltered = () => {
    setSelectedKps(prev => {
      const next = new Set(prev);
      filteredStudents.forEach(s => next.add(s.kp));
      return next;
    });
  };

  // Deselect all
  const handleDeselectAll = () => {
    setSelectedKps(new Set());
  };

  // Select only Aspura from filtered
  const handleSelectAspuraFiltered = () => {
    setSelectedKps(prev => {
      const next = new Set(prev);
      filteredStudents.filter(s => s.jantina === 'L').forEach(s => next.add(s.kp));
      return next;
    });
  };

  // Select only Aspuri from filtered
  const handleSelectAspuriFiltered = () => {
    setSelectedKps(prev => {
      const next = new Set(prev);
      filteredStudents.filter(s => s.jantina === 'P').forEach(s => next.add(s.kp));
      return next;
    });
  };

  // Handle Preset Purpose Clicks
  const handlePresetTujuan = (val: string, type: 'BERMALAM' | 'OUTING' | 'KELUAR') => {
    setTujuan(val);
    setOutingType(type);
  };

  // Confirm and Execute Bulk Outing
  const handleExecute = () => {
    if (selectedKps.size === 0) return;

    const count = selectedKps.size;
    const finalTujuan = tujuan.trim() || 'Pelepasan Pukal Asrama';

    onConfirmBulkOuting(Array.from(selectedKps), {
      type: outingType,
      tarikhKeluar,
      masaKeluar,
      tarikhBalik,
      masaBalik,
      tujuan: finalTujuan,
      catatan: catatan.trim(),
      wardenNama: selectedWardenNama
    });

    setExecutionSuccess({
      count,
      type: outingType,
      tujuan: finalTujuan,
      tarikhBalik,
      masaBalik,
      wardenNama: selectedWardenNama
    });

    setShowConfirmModal(false);
    setSelectedKps(new Set());
  };

  // Print Gate Manifest
  const handlePrintManifest = () => {
    window.print();
  };

  const isAllFilteredSelected = filteredStudents.length > 0 && 
    filteredStudents.every(s => selectedKps.has(s.kp));

  return (
    <div className="space-y-6">

      {/* EXECUTION SUCCESS BANNER */}
      {executionSuccess && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-emerald-400/40 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-white/20 backdrop-blur-xs rounded-2xl flex-shrink-0">
                <CheckCircle2 className="w-7 h-7 text-emerald-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                    REKOD TELAH DISIMPAN
                  </span>
                  <span className="text-emerald-100 text-xs font-semibold">
                    Warden: {executionSuccess.wardenNama}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black mt-1">
                  Pelepasan Pukal Berjaya Disahkan! ({executionSuccess.count} Murid)
                </h3>
                <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                  Sebanyak <b>{executionSuccess.count} orang murid</b> telah berjaya direkodkan keluar asrama untuk aktiviti <b>{executionSuccess.tujuan}</b> (Kategori: <b>{executionSuccess.type}</b>). Dijangka kembali pada <b>{executionSuccess.tarikhBalik} ({executionSuccess.masaBalik})</b>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-center flex-shrink-0">
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('outing')}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat Pemantauan Outing</span>
                </button>
              )}
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('log')}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-800/80 text-white text-xs font-semibold border border-emerald-400/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Log Pergerakan</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setExecutionSuccess(null)}
                className="px-3 py-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-200 text-xs font-semibold transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-blue-700/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 bg-amber-400 text-slate-950 text-xs font-black rounded-full uppercase tracking-wider shadow">
                MODUL WARDEN
              </span>
              <span className="px-3 py-1 bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-300" />
                Format EnumList
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <LogOut className="w-7 h-7 text-amber-400 rotate-180" />
              Keluar Asrama Secara Pukal
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Tandakan senarai nama murid mengikut <b>Tingkatan</b>, <b>Bidang Kesenian</b>, <b>Aspura</b> &amp; <b>Aspuri</b> untuk pelepasan beramai-ramai dengan satu klik sahaja.
            </p>
          </div>

          {/* Quick Stats Pill Counters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="text-center px-3 py-1.5">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">
                {selectionStats.total}
              </div>
              <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Dipilih
              </div>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="text-center px-3 py-1.5">
              <div className="text-lg sm:text-xl font-bold text-sky-400">
                {selectionStats.aspura}
              </div>
              <div className="text-[10px] font-semibold text-sky-200 uppercase">
                Aspura (L)
              </div>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="text-center px-3 py-1.5">
              <div className="text-lg sm:text-xl font-bold text-pink-400">
                {selectionStats.aspuri}
              </div>
              <div className="text-[10px] font-semibold text-pink-200 uppercase">
                Aspuri (P)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN WORKBENCH: FORM ON LEFT/TOP, ENUMLIST ON RIGHT/BOTTOM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: MAKLUMAT PELEPASAN & SUBMISSION (col-span-4) */}
        <div className="lg:col-span-4 space-y-5 z-10">
          
          {/* CARD: MAKLUMAT KELUAR & BALIK */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">1. Butiran Pelepasan Pukal</h3>
                <p className="text-[11px] text-slate-500">Tetapkan tarikh keluar, jangka kembali &amp; tujuan</p>
              </div>
            </div>

            {/* JENIS PELEPASAN RADIO/BUTTONS */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jenis Pelepasan Pukal
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setOutingType('BERMALAM')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    outingType === 'BERMALAM'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Bermalam
                </button>
                <button
                  type="button"
                  onClick={() => setOutingType('OUTING')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    outingType === 'OUTING'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Outing
                </button>
                <button
                  type="button"
                  onClick={() => setOutingType('KELUAR')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    outingType === 'KELUAR'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Aktiviti Luar
                </button>
              </div>
            </div>

            {/* TARIKH & MASA KELUAR */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                Waktu Keluar Asrama
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tarikh Keluar</label>
                  <input
                    type="date"
                    value={tarikhKeluar}
                    onChange={e => setTarikhKeluar(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Masa Keluar</label>
                  <input
                    type="time"
                    value={masaKeluar}
                    onChange={e => setMasaKeluar(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* TARIKH & MASA BALIK */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2.5">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Dijangka Kembali ke Asrama
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-emerald-800 mb-1">Tarikh Balik</label>
                  <input
                    type="date"
                    value={tarikhBalik}
                    onChange={e => setTarikhBalik(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-emerald-800 mb-1">Masa Balik</label>
                  <input
                    type="time"
                    value={masaBalik}
                    onChange={e => setMasaBalik(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* TUJUAN DENGAN CADANGAN PANTAS */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tujuan Pelepasan / Destinasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={tujuan}
                onChange={e => setTujuan(e.target.value)}
                placeholder="Contoh: Cuti Bermalam Hujung Minggu / Pertandingan"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              />
              
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1 mt-2">
                <button
                  type="button"
                  onClick={() => handlePresetTujuan('Lawatan Sambil Belajar', 'KELUAR')}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors font-semibold"
                >
                  + Lawatan Belajar
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetTujuan('Lawatan Rasmi Sekolah', 'KELUAR')}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors font-semibold"
                >
                  + Lawatan Rasmi
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetTujuan('Pertandingan Kesenian Luar', 'KELUAR')}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors font-semibold"
                >
                  + Pertandingan Luar
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetTujuan('Cuti Bermalam Hujung Minggu', 'BERMALAM')}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors font-medium"
                >
                  + Bermalam Mingguan
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetTujuan('Cuti Pertengahan Penggal', 'BERMALAM')}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors font-medium"
                >
                  + Cuti Penggal
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetTujuan('Outing Bandar JB Berkelompok', 'OUTING')}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors font-medium"
                >
                  + Outing Beramai
                </button>
              </div>
            </div>

            {/* CATATAN TAMBAHAN / PENGANGKUTAN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Pengangkutan / Waris
              </label>
              <input
                type="text"
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                placeholder="Contoh: Bas sekolah disediakan / Dijemput waris di pos pengawal"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* WARDEN PENGESAH */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Warden Pengesah Pelepasan
              </label>
              <select
                value={selectedWardenNama}
                onChange={e => setSelectedWardenNama(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
              >
                {wardens.map(w => (
                  <option key={w.id} value={w.nama}>
                    {w.nama} ({w.jawatan})
                  </option>
                ))}
              </select>
            </div>

            {/* ACTION BUTTON TO OPEN CONFIRMATION */}
            <div className="pt-2">
              <button
                type="button"
                disabled={selectedKps.size === 0 || !tujuan.trim()}
                onClick={() => setShowConfirmModal(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5 text-amber-300" />
                <span>Sahkan Pelepasan ({selectedKps.size} Murid)</span>
              </button>
              {selectedKps.size === 0 && (
                <p className="text-[11px] text-center text-amber-700 mt-2 font-medium">
                  * Sila tandakan sekurang-kurangnya seorang murid dari senarai di sebelah.
                </p>
              )}
            </div>

          </div>

          {/* QUICK SUMMARY CARD */}
          {selectedKps.size > 0 && (
            <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                <span>Ringkasan Pilihan:</span>
                <span className="text-amber-400 font-mono">{selectionStats.total} murid</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-slate-400 text-[10px] block">Aspura (Lelaki)</span>
                  <span className="font-bold text-sky-400">{selectionStats.aspura} murid</span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-slate-400 text-[10px] block">Aspuri (Perempuan)</span>
                  <span className="font-bold text-pink-400">{selectionStats.aspuri} murid</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Jangka Balik: {tarikhBalik} ({masaBalik})</span>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: ENUMLIST FILTERS & STUDENT SELECTION LIST (col-span-8) */}
        <div className="lg:col-span-8 space-y-4">

          {/* FILTER CARD (TINGKATAN, BIDANG, ASPURA/ASPURI, CARIAN) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">2. Penapis EnumList Murid</h3>
                  <p className="text-[11px] text-slate-500">Tapis mengikut Tingkatan, Bidang &amp; Asrama</p>
                </div>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari nama / no. KP / kelas..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* FILTER ROW 1: ASRAMA / JANTINA (ASPURA vs ASPURI) */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Kategori Asrama / Jantina:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterJantina('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    filterJantina === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua Asrama
                </button>
                <button
                  type="button"
                  onClick={() => setFilterJantina('L')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    filterJantina === 'L'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-500/20'
                      : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                  }`}
                >
                  <span>👦 Aspura (Lelaki)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterJantina('P')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    filterJantina === 'P'
                      ? 'bg-pink-600 text-white border-pink-600 shadow-sm shadow-pink-500/20'
                      : 'bg-pink-50 text-pink-800 border-pink-200 hover:bg-pink-100'
                  }`}
                >
                  <span>👧 Aspuri (Perempuan)</span>
                </button>

                {/* Status Toggle (Dalam Asrama Sahaja vs Semua) */}
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterStatus(s => s === 'DALAM' ? 'ALL' : 'DALAM')}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                      filterStatus === 'DALAM'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {filterStatus === 'DALAM' ? '✓ Dalam Asrama Sahaja' : 'Semua Status'}
                  </button>
                </div>
              </div>
            </div>

            {/* FILTER ROW 2: TINGKATAN */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Tingkatan:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterTingkatan('ALL')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                    filterTingkatan === 'ALL'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua
                </button>
                {[1, 2, 3, 4, 5].map(form => (
                  <button
                    key={form}
                    type="button"
                    onClick={() => setFilterTingkatan(String(form))}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                      filterTingkatan === String(form)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tingkatan {form}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTER ROW 3: BIDANG KESENIAN */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Bidang Kesenian:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterBidang('ALL')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                    filterBidang === 'ALL'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua Bidang
                </button>
                {(['MUZIK', 'VISUAL', 'TARI', 'TEATER'] as StreamType[]).map(b => {
                  const bColor = getBidangColor(b);
                  const isSelected = filterBidang === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setFilterBidang(b)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : `${bColor.bg} ${bColor.text} ${bColor.border} hover:opacity-80`
                      }`}
                    >
                      Seni {b}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ENUMLIST BATCH ACTIONS BAR */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-600 font-medium">
                Memaparkan <span className="font-bold text-slate-900">{filteredStudents.length}</span> orang murid
                {selectedKps.size > 0 && (
                  <span> (<span className="text-blue-600 font-bold">{selectedKps.size}</span> ditandakan)</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Pilih Semua Tapisan ({filteredStudents.length})</span>
                </button>

                {filterJantina === 'ALL' && (
                  <>
                    <button
                      type="button"
                      onClick={handleSelectAspuraFiltered}
                      className="px-2 py-1 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-semibold transition-all"
                    >
                      + Aspura Sahaja
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAspuriFiltered}
                      className="px-2 py-1 rounded-xl bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200 text-xs font-semibold transition-all"
                    >
                      + Aspuri Sahaja
                    </button>
                  </>
                )}

                {selectedKps.size > 0 && (
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-all"
                  >
                    Nyahpilih Semua
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* ENUMLIST STUDENT CHECKLIST ITEMS */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-2">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs text-slate-500 font-semibold px-2">
              <span>Senarai Nama Murid (Klik kotak atau baris nama untuk memilih)</span>
              <span>Tingkatan / Bidang / Asrama</span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-semibold text-slate-600">Tiada rekod murid mengikut tapisan semasa.</p>
                <p className="text-xs">Sila ubah kriteria penapis atau semak carian anda.</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                {filteredStudents.map(student => {
                  const isChecked = selectedKps.has(student.kp);
                  const statusStr = getStatus(student);
                  const statusCfg = getStatusBadgeConfig(statusStr as any);
                  const bidangColor = getBidangColor(student.bidang);
                  const initials = getStudentInitials(student.nama);
                  const avatarColor = getAvatarColor(student.kp);

                  return (
                    <div
                      key={student.kp}
                      onClick={() => toggleStudent(student.kp)}
                      className={`p-2.5 sm:p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 select-none ${
                        isChecked
                          ? 'bg-blue-50/90 border border-blue-300/80 shadow-xs'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      {/* Left: Checkbox + Avatar + Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Custom EnumList Checkbox Box */}
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all border ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-white border-slate-300 text-transparent hover:border-blue-400'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        {/* Student Avatar / Photo */}
                        <div className="relative flex-shrink-0">
                          {student.photo || student.gambar ? (
                            <img
                              src={student.photo || student.gambar}
                              alt={student.nama}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-xs"
                              style={{ backgroundColor: avatarColor }}
                            >
                              {initials}
                            </div>
                          )}

                          {/* Gender Indicator Dot */}
                          <span 
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white text-[8px] flex items-center justify-center font-bold text-white ${
                              student.jantina === 'L' ? 'bg-sky-500' : 'bg-pink-500'
                            }`}
                            title={student.jantina === 'L' ? 'Aspura' : 'Aspuri'}
                          >
                            {student.jantina}
                          </span>
                        </div>

                        {/* Name & Identifiers */}
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-slate-900 truncate flex items-center gap-1.5">
                            <span>{student.nama}</span>
                            {student.dorm && (
                              <span className="hidden sm:inline text-[10px] font-normal text-slate-400 font-mono">
                                ({student.dorm})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                            <span>{student.kp}</span>
                            <span>•</span>
                            <span className="text-slate-700 font-sans font-medium">{student.kelas}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Badges */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Aspura / Aspuri Badge */}
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border hidden sm:inline-block ${
                          student.jantina === 'L'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-pink-50 text-pink-700 border-pink-200'
                        }`}>
                          {student.jantina === 'L' ? 'Aspura' : 'Aspuri'}
                        </span>

                        {/* Bidang Badge */}
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${bidangColor.bg} ${bidangColor.text} ${bidangColor.border}`}>
                          {student.bidang}
                        </span>

                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                          {statusStr === 'DALAM' ? 'Dalam' : statusStr}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom floating button if list is long */}
            {selectedKps.size > 0 && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {selectedKps.size} murid sedia untuk pelepasan pukal.
                </span>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-all flex items-center gap-1.5"
                >
                  <span>Teruskan ke Pengesahan ➔</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* CONFIRMATION MODAL & PRINTABLE MANIFEST */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-400 text-slate-950">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">
                    Sahkan Pelepasan Pukal ({selectedStudentsList.length} Murid)
                  </h2>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Sila semak butiran sebelum mengemaskini status asrama dan menjana log pergerakan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
              
              {/* Manifest Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Jenis Pelepasan</span>
                    <span className="font-bold text-xs text-blue-700">{outingType}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Jumlah Murid</span>
                    <span className="font-bold text-xs text-slate-900">{selectedStudentsList.length} Orang</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Aspura / Aspuri</span>
                    <span className="font-bold text-xs text-slate-900">{selectionStats.aspura} L / {selectionStats.aspuri} P</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Warden Pengesah</span>
                    <span className="font-bold text-xs text-slate-900 truncate block" title={selectedWardenNama}>
                      {selectedWardenNama.split(' ')[0]}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[11px]">Masa Keluar:</span>
                    <span className="font-bold text-slate-900">{tarikhKeluar} ({masaKeluar})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[11px]">Dijangka Kembali:</span>
                    <span className="font-bold text-emerald-700">{tarikhBalik} ({masaBalik})</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 font-semibold block text-[11px]">Tujuan / Destinasi:</span>
                    <span className="font-bold text-slate-900">{tujuan}</span>
                  </div>
                  {catatan && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 font-semibold block text-[11px]">Catatan Pengangkutan:</span>
                      <span className="font-medium text-slate-700">{catatan}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* List of Selected Students Preview */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>Senarai Murid yang Terlibat ({selectedStudentsList.length}):</span>
                  <button
                    onClick={handlePrintManifest}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[11px]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Senarai (Manifest Pagar)</span>
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100 bg-white">
                  {selectedStudentsList.map((s, idx) => (
                    <div key={s.kp} className="p-2 px-3 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] text-slate-400 font-mono w-5">{idx + 1}.</span>
                        <span className="font-bold text-slate-800 truncate">{s.nama}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 flex-shrink-0">
                        <span>{s.kelas}</span>
                        <span>•</span>
                        <span className="font-sans font-bold">{s.jantina === 'L' ? 'Aspura' : 'Aspuri'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notice info */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Tindakan Sistem:</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Status murid akan bertukar kepada <b>{outingType}</b> serta-merta, rekod pergerakan akan disimpan dalam Log Aktiviti, dan maklumat akan disegerakkan ke pangkalan data cloud dan Google Sheets.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
              >
                Batal / Ubah Pilihan
              </button>
              <button
                type="button"
                onClick={handleExecute}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Sahkan &amp; Lepaskan {selectedStudentsList.length} Murid Sekarang</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
