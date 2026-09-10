import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Volume2, 
  VolumeX, 
  Clock, 
  ShieldCheck, 
  Printer, 
  Radio, 
  AlertTriangle,
  UserCheck,
  FileSpreadsheet,
  User,
  LogOut,
  Database,
  Lock,
  HeartHandshake,
  RefreshCw,
  DoorOpen,
  HeartPulse,
  GraduationCap,
  X,
  Search,
  Users,
  Compass,
  Menu,
  ChevronDown,
  Check
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { Warden, Student, StudentStatus } from '../types/hostel';

interface HeaderProps {
  stats: {
    total: number;
    dalam: number;
    keluar: number;
    outing: number;
    bermalam: number;
    kuarantin: number;
    overdue: number;
    hadirKelas?: number;
  };
  students?: Student[];
  statuses?: Record<string, StudentStatus>;
  onSelectStudent?: (student: Student) => void;
  onPrintReport: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenGoogleSheets: () => void;
  isGSheetConnected: boolean;
  isGSheetAutoSync: boolean;
  wardens: Warden[];
  currentWarden: Warden;
  onSelectWarden: (wardenId: string) => void;
  userRole?: 'admin' | 'warden' | 'guard' | null;
  onLogout?: () => void;
  onOpenSupabase?: () => void;
  hasSupabaseRlsError?: boolean;
  isSupabaseConnected?: boolean;
  onOpenParentPortal?: () => void;
  onQuickSyncGoogleSheets?: () => void;
  isSyncingGoogleSheets?: boolean;
  onQuickSyncSupabase?: () => void;
  isSyncingSupabase?: boolean;
  isRealtimeConnected?: boolean;
  onOpenSidebar?: () => void;
  onOpenCategory?: (cat: 'TOTAL' | 'KELUAR' | 'KUARANTIN' | 'HADIR_KELAS' | 'DALAM' | 'OUTING' | 'BERMALAM') => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  students,
  statuses,
  onSelectStudent,
  onPrintReport,
  soundEnabled,
  onToggleSound,
  onOpenGoogleSheets,
  isGSheetConnected,
  isGSheetAutoSync,
  wardens,
  currentWarden,
  onSelectWarden,
  userRole = 'warden',
  onLogout,
  onOpenSupabase,
  hasSupabaseRlsError = false,
  isSupabaseConnected = false,
  onOpenParentPortal,
  onQuickSyncGoogleSheets,
  isSyncingGoogleSheets = false,
  onQuickSyncSupabase,
  isSyncingSupabase = false,
  isRealtimeConnected = false,
  onOpenSidebar,
  onOpenCategory
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem('ssemj_header_banner_image');
      localStorage.removeItem('ssemj_freeze_header');
    } catch {}
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const hadirKelasCount = stats.hadirKelas !== undefined
    ? stats.hadirKelas
    : Math.max(0, (stats.total || 0) - (stats.bermalam || 0) - (stats.outing || 0) - (stats.kuarantin || 0));

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.toLocaleTimeString('ms-MY', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateStr = currentTime.toLocaleDateString('ms-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <header 
      id="app-main-header"
      className={`transition-all duration-300 relative z-20 md:sticky md:top-2.5 md:z-40 ${
        isScrolled
          ? 'md:bg-gradient-to-r md:from-blue-950/95 md:via-blue-900/95 md:to-indigo-950/95 md:border-blue-500/80 md:shadow-2xl md:ring-2 md:ring-blue-400/40 md:p-3.5 md:mb-3 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 border-blue-700/60 shadow-lg p-2.5 sm:p-4 md:p-5 mb-2.5 sm:mb-4'
          : 'bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 border-blue-700/60 shadow-lg p-2.5 sm:p-4 md:p-5 mb-2.5 sm:mb-4'
      } border rounded-xl sm:rounded-2xl text-white backdrop-blur-xl`}
    >
      {/* Bahagian Atas: Logo & Tajuk di kiri, Jam & Tarikh di kanan (Satu Baris Kemas) */}
      <div className={`flex items-center justify-between transition-all duration-200 border-b border-blue-700/50 w-full gap-2 sm:gap-4 ${
        isScrolled ? 'md:pb-2 md:mb-2 pb-1.5 mb-1.5' : 'pb-2 sm:pb-3.5 mb-2 sm:mb-3'
      }`}>
        {/* Bahagian Kiri: Logo SSeMJ diikuti Tajuk & Keterangan Sistem */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Logo Sekolah di sebelah kiri sekali */}
          <div className="bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md ring-1 sm:ring-2 ring-white/90 flex-shrink-0 overflow-hidden p-1 sm:p-1.5 h-9 w-9 sm:h-12 sm:w-12 md:h-13 md:w-13 transition-all duration-200">
            <img src="/logo_ssemj_original.jpg" alt="Logo SSeMJ" className="h-full w-auto object-contain" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-extrabold tracking-tight text-white text-base sm:text-xl lg:text-2xl leading-tight">
                e-APPS
              </h1>
              <span className="hidden xs:inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/30 border border-blue-400/40 text-[9px] sm:text-[10px] font-bold text-sky-200">
                SSeMJ
              </span>
            </div>
            <p className="text-blue-100/90 font-medium text-[10px] sm:text-xs md:text-sm truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none mt-0.5">
              Sistem Asrama Putra & Putri
            </p>
          </div>
        </div>

        {/* Bahagian Kanan: Jam & Tarikh (Kompak & Elegan) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-950/70 rounded-xl sm:rounded-2xl border border-blue-600/50 shadow-inner backdrop-blur-xs flex-shrink-0">
          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
            <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-sky-300" />
          </div>
          <div className="text-right">
            <div className="font-mono text-white font-bold text-xs sm:text-sm md:text-base leading-none tracking-tight">
              {timeStr}
            </div>
            <div className="text-[9px] sm:text-[10px] text-blue-200 font-medium leading-tight hidden xs:block mt-0.5">
              {dateStr}
            </div>
          </div>
        </div>
      </div>

      {/* Bar Status Metrik & Tindakan (Kemas, Tersusun & Responsif Pada Skrin Telefon) */}
      <div className="flex flex-col gap-1.5 sm:gap-2.5 w-full">
        {/* Baris 1: Grid 4 Butang Kategori Utama (2x2 pada Telefon, 4 lajur pada skrin lebih besar) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 w-full">
          {/* Butang Berkilat 0: Jumlah Murid */}
          <button
            type="button"
            id="btn-header-jumlah-murid"
            onClick={() => onOpenCategory?.('TOTAL')}
            title="Jumlah Keseluruhan Murid Berdaftar (Klik untuk lihat senarai semua murid)"
            className="group relative isolate overflow-hidden flex items-center justify-between gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-b from-blue-500/35 via-indigo-600/30 to-blue-800/25 hover:from-blue-500/50 text-blue-200 border border-blue-400/50 shadow-xs active:scale-95 transition-all cursor-pointer before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/35 before:to-transparent before:pointer-events-none before:rounded-t-xl"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Users className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
              <span className="font-semibold text-[10px] sm:text-[11px] truncate">Jumlah:</span>
            </div>
            <b className="font-mono text-white text-xs sm:text-sm font-extrabold flex-shrink-0">{stats.total}</b>
          </button>

          {/* Butang Berkilat 1: Keluar Asrama */}
          <button
            type="button"
            id="btn-header-keluar-asrama"
            onClick={() => onOpenCategory?.('KELUAR')}
            title="Maklumat Murid Keluar Asrama / Aktiviti Luar (Klik untuk lihat senarai)"
            className="group relative isolate overflow-hidden flex items-center justify-between gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-b from-amber-500/35 via-orange-600/30 to-rose-700/25 hover:from-amber-500/50 text-orange-200 border border-orange-400/50 shadow-xs active:scale-95 transition-all cursor-pointer before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/35 before:to-transparent before:pointer-events-none before:rounded-t-xl"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <DoorOpen className="w-3.5 h-3.5 text-orange-300 flex-shrink-0" />
              <span className="font-semibold text-[10px] sm:text-[11px] truncate">Keluar:</span>
            </div>
            <b className="font-mono text-white text-xs sm:text-sm font-extrabold flex-shrink-0">{stats.keluar}</b>
          </button>

          {/* Butang Berkilat 2: Bilik Sakit */}
          <button
            type="button"
            id="btn-header-bilik-sakit"
            onClick={() => onOpenCategory?.('KUARANTIN')}
            title="Maklumat Murid di Bilik Sakit / Kuarantin (Klik untuk lihat senarai)"
            className="group relative isolate overflow-hidden flex items-center justify-between gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-b from-purple-500/35 via-purple-600/30 to-fuchsia-800/25 hover:from-purple-500/50 text-purple-200 border border-purple-400/50 shadow-xs active:scale-95 transition-all cursor-pointer before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/35 before:to-transparent before:pointer-events-none before:rounded-t-xl"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <HeartPulse className="w-3.5 h-3.5 text-purple-300 flex-shrink-0" />
              <span className="font-semibold text-[10px] sm:text-[11px] truncate">Sakit:</span>
            </div>
            <b className="font-mono text-white text-xs sm:text-sm font-extrabold flex-shrink-0">{stats.kuarantin}</b>
          </button>

          {/* Butang Berkilat 3: Hadir Kelas */}
          <button
            type="button"
            id="btn-header-hadir-kelas"
            onClick={() => onOpenCategory?.('HADIR_KELAS')}
            title="Maklumat Murid Hadir Sesi Kelas / Sekolah (Klik untuk lihat senarai)"
            className="group relative isolate overflow-hidden flex items-center justify-between gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-b from-teal-500/35 via-teal-600/30 to-emerald-800/25 hover:from-teal-500/50 text-teal-200 border border-teal-400/50 shadow-xs active:scale-95 transition-all cursor-pointer before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/35 before:to-transparent before:pointer-events-none before:rounded-t-xl"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <GraduationCap className="w-3.5 h-3.5 text-teal-300 flex-shrink-0" />
              <span className="font-semibold text-[10px] sm:text-[11px] truncate">Hadir:</span>
            </div>
            <b className="font-mono text-white text-xs sm:text-sm font-extrabold flex-shrink-0">{hadirKelasCount}</b>
          </button>
        </div>

        {/* Baris 2: STATUS RINGKAS (Dalam, Outing, Bermalam, Lewat) dalam satu baris kemas */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 bg-blue-950/80 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-blue-600/50 text-[10px] sm:text-xs shadow-inner backdrop-blur-xs w-full">
          <div 
            onClick={() => onOpenCategory?.('DALAM')}
            className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded-md bg-gradient-to-b from-emerald-500/30 to-emerald-700/20 hover:from-emerald-500/45 text-emerald-200 border border-emerald-400/40 cursor-pointer select-none"
            title="Klik untuk lihat senarai murid dalam asrama"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-[10px] sm:text-[11px]">Dalam:</span>
            <b className="font-mono text-white text-xs font-bold">{stats.dalam}</b>
          </div>

          <div 
            onClick={() => onOpenCategory?.('OUTING')}
            className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded-md bg-gradient-to-b from-amber-500/30 to-amber-700/20 hover:from-amber-500/45 text-amber-200 border border-amber-400/40 cursor-pointer select-none"
            title="Klik untuk lihat senarai murid outing"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span className="font-medium text-[10px] sm:text-[11px]">Outing:</span>
            <b className="font-mono text-white text-xs font-bold">{stats.outing}</b>
          </div>

          <div 
            onClick={() => onOpenCategory?.('BERMALAM')}
            className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded-md bg-gradient-to-b from-sky-500/30 to-sky-700/20 hover:from-sky-500/45 text-sky-200 border border-sky-400/40 cursor-pointer select-none"
            title="Klik untuk lihat senarai murid bermalam"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-300"></span>
            <span className="font-medium text-[10px] sm:text-[11px]">Bermalam:</span>
            <b className="font-mono text-white text-xs font-bold">{stats.bermalam}</b>
          </div>

          {stats.overdue > 0 && (
            <div className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded-md bg-gradient-to-b from-rose-500/40 to-rose-800/30 text-rose-200 border border-rose-400/60 animate-pulse select-none">
              <AlertTriangle className="w-3 h-3 text-rose-300" />
              <span className="font-medium text-[10px] sm:text-[11px]">Lewat:</span>
              <b className="font-mono text-white text-xs font-bold">{stats.overdue}</b>
            </div>
          )}
        </div>

        {/* Baris 3: BUTANG MENU SIDEBAR (Kiri) & Warden Bertugas (Kanan) dalam Satu Baris Kemas */}
        <div className="flex items-center justify-between gap-2 w-full pt-1 border-t border-blue-800/40">
          {/* BUTANG MENU SIDEBAR UTAMA (IKON 3 BARIS SAHAJA) */}
          <button
            type="button"
            id="btn-header-open-sidebar"
            onClick={onOpenSidebar}
            className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg sm:rounded-xl border border-blue-400/60 shadow-sm transition-all cursor-pointer select-none active:scale-95 group ring-1 sm:ring-2 ring-blue-400/30 flex items-center justify-center flex-shrink-0"
            title="Buka Menu Sidebar Asrama"
            aria-label="Buka Menu Sidebar"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-sky-100 group-hover:scale-110 transition-transform" />
          </button>

          {/* Kelompok Kanan: Admin Role Badge & Warden Bertugas */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto min-w-0">
            {/* Admin Role Badge */}
            {userRole === 'admin' && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-200 border border-amber-400/50 rounded-lg text-[10px] sm:text-xs font-semibold shadow-xs flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden xs:inline">Admin</span>
              </div>
            )}

            {/* Warden Bertugas Selector */}
            {(userRole === 'warden' || userRole === 'admin') && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-950/70 rounded-lg sm:rounded-xl border border-blue-600/60 text-[10px] sm:text-xs shadow-inner min-w-0">
                <User className="w-3 h-3 text-amber-300 flex-shrink-0" />
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[9px] uppercase tracking-wider text-blue-200 font-semibold leading-none hidden sm:inline">
                    Warden:
                  </span>
                  <select
                    id="select-warden-bertugas"
                    value={currentWarden.id}
                    onChange={(e) => onSelectWarden(e.target.value)}
                    className="bg-transparent text-white font-medium text-[10px] sm:text-xs focus:outline-none cursor-pointer pr-1 py-0.5 truncate max-w-[140px] xs:max-w-[190px] sm:max-w-none"
                  >
                    {wardens.map((w) => (
                      <option key={w.id} value={w.id} className="bg-blue-900 text-white">
                        {w.nama} ({w.jawatan})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

