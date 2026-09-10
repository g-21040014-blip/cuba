import React, { useEffect } from 'react';
import {
  X,
  LayoutDashboard,
  Clock,
  LogOut,
  UserCheck,
  Users,
  History,
  DoorOpen,
  HeartPulse,
  GraduationCap,
  Database,
  FileSpreadsheet,
  HeartHandshake,
  Printer,
  Volume2,
  VolumeX,
  RefreshCw,
  Lock,
  Radio,
  QrCode,
  ShieldCheck,
  User,
  ChevronRight,
  ExternalLink,
  Compass,
  AlertTriangle
} from 'lucide-react';
import { Warden, Student, StudentStatus } from '../types/hostel';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
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
  studentsCount: number;
  currentAttendanceCount: number;
  userRole?: 'admin' | 'warden' | 'guard' | null;
  wardens: Warden[];
  currentWarden: Warden;
  onSelectWarden: (wardenId: string) => void;
  onOpenCategory: (category: 'KELUAR' | 'KUARANTIN' | 'HADIR_KELAS' | 'DALAM' | 'OUTING' | 'BERMALAM') => void;
  onPrintReport: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenGoogleSheets: () => void;
  isGSheetConnected: boolean;
  onQuickSyncGoogleSheets?: () => void;
  isSyncingGoogleSheets?: boolean;
  onOpenSupabase?: () => void;
  isSupabaseConnected?: boolean;
  isRealtimeConnected?: boolean;
  hasSupabaseRlsError?: boolean;
  onQuickSyncSupabase?: () => void;
  isSyncingSupabase?: boolean;
  onOpenParentPortal?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  stats,
  studentsCount,
  currentAttendanceCount,
  userRole = 'warden',
  wardens,
  currentWarden,
  onSelectWarden,
  onOpenCategory,
  onPrintReport,
  soundEnabled,
  onToggleSound,
  onOpenGoogleSheets,
  isGSheetConnected,
  onQuickSyncGoogleSheets,
  isSyncingGoogleSheets = false,
  onOpenSupabase,
  isSupabaseConnected = false,
  isRealtimeConnected = false,
  hasSupabaseRlsError = false,
  onQuickSyncSupabase,
  isSyncingSupabase = false,
  onOpenParentPortal,
  onLogout,
}) => {
  // Tutup sidebar jika pengguna tekan kekunci ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Halang scroll latar belakang apabila modal sidebar dibuka pada skrin kecil
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTabClick = (tab: string) => {
    onSelectTab(tab);
    onClose();
  };

  const handleCategoryClick = (category: 'KELUAR' | 'KUARANTIN' | 'HADIR_KELAS' | 'DALAM' | 'OUTING' | 'BERMALAM') => {
    onOpenCategory(category);
    onClose();
  };

  return (
    <>
      {/* Backdrop Gelap dengan Efek Kabur (Blur) */}
      <div
        id="sidebar-backdrop"
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isOpen}
      />

      {/* Drawer Panel Sidebar */}
      <aside
        id="main-app-sidebar"
        aria-label="Menu Utama Sistem Asrama"
        className={`fixed top-0 left-0 bottom-0 z-50 w-[320px] sm:w-[360px] bg-slate-900 text-slate-100 shadow-2xl border-r border-slate-700/80 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Bahagian Header Sidebar: Logo & Jenama Sistem */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center p-1 ring-2 ring-blue-500/50 shadow-md flex-shrink-0">
              <img
                src="/logo_ssemj_original.jpg"
                alt="Logo SSeMJ"
                className="h-full w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-base tracking-tight">e-APPS</span>
                <span className="px-1.5 py-0.2 bg-blue-500/30 text-blue-300 text-[10px] font-bold rounded-md border border-blue-400/30">
                  v3.0
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 line-clamp-1">
                Sistem Asrama SSeMJ
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-sidebar"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700 active:scale-95"
            title="Tutup Menu Sidebar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bahagian Profil Pegawai & Warden Bertugas */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Sesi Pengguna:</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
              userRole === 'admin'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                : userRole === 'guard'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
            }`}>
              <ShieldCheck className="w-3 h-3" />
              {userRole === 'admin' ? 'Pentadbir' : userRole === 'guard' ? 'Pengawal Keselamatan' : 'Warden Asrama'}
            </span>
          </div>

          {/* Pemilih Warden Bertugas */}
          {(userRole === 'warden' || userRole === 'admin') && (
            <div className="mt-1 bg-slate-900/90 rounded-xl p-2 border border-slate-700/80">
              <label htmlFor="sidebar-select-warden" className="block text-[10px] text-blue-300 font-semibold mb-1 uppercase tracking-wider">
                Warden Bertugas Aktif:
              </label>
              <select
                id="sidebar-select-warden"
                value={currentWarden.id}
                onChange={(e) => onSelectWarden(e.target.value)}
                className="w-full bg-slate-800 text-white font-medium text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {wardens.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nama} ({w.jawatan})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Bahagian Kandungan Menu Boleh Skrol (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* SEKSYEN 1: NAVIGASI MODUL UTAMA */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Modul Utama
            </div>
            <div className="space-y-1">
              {/* Tab: Utama / Dashboard */}
              <button
                type="button"
                id="sidebar-nav-dashboard"
                onClick={() => handleTabClick('dashboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-blue-400" />
                  <span>Paparan Utama (Dashboard)</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'dashboard' ? 'text-white' : ''}`} />
              </button>

              {/* Tab: Outing & Bermalam */}
              <button
                type="button"
                id="sidebar-nav-outing"
                onClick={() => handleTabClick('outing')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'outing'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Outing &amp; Bermalam</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-200 border border-amber-500/30">
                    {stats.outing + stats.bermalam}
                  </span>
                  {stats.overdue > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title={`${stats.overdue} murid lewat kembali`} />
                  )}
                </div>
              </button>

              {/* Tab: Keluar Pukal */}
              {(userRole === 'warden' || userRole === 'admin') && (
                <button
                  type="button"
                  id="sidebar-nav-keluar-pukal"
                  onClick={() => handleTabClick('keluar-pukal')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'keluar-pukal'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="w-4 h-4 rotate-180 text-orange-400" />
                    <span>Keluar Pukal</span>
                  </div>
                </button>
              )}

              {/* Tab: Roll-Call Kehadiran */}
              {(userRole === 'warden' || userRole === 'admin') && (
                <button
                  type="button"
                  id="sidebar-nav-kehadiran"
                  onClick={() => handleTabClick('kehadiran')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'kehadiran'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Roll-Call Kehadiran</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {currentAttendanceCount}/{studentsCount}
                  </span>
                </button>
              )}

              {/* Tab: Data Murid */}
              {(userRole === 'warden' || userRole === 'admin') && (
                <button
                  type="button"
                  id="sidebar-nav-murid"
                  onClick={() => handleTabClick('murid')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'murid'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Data &amp; Direktori Murid</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {studentsCount}
                  </span>
                </button>
              )}

              {/* Tab: Log Aktiviti */}
              {(userRole === 'warden' || userRole === 'admin') && (
                <button
                  type="button"
                  id="sidebar-nav-log"
                  onClick={() => handleTabClick('log')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'log'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <History className="w-4 h-4 text-indigo-400" />
                    <span>Log &amp; Sejarah Rekod</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              )}
            </div>
          </div>

          {/* SEKSYEN 2: RINGKASAN STATUS KATEGORI (Klik untuk lihat senarai) */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Status &amp; Kategori Murid</span>
              <span className="text-[9px] text-slate-500 lowercase">klik untuk senarai</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Kategori: Dalam Asrama */}
              <button
                type="button"
                id="sidebar-cat-dalam"
                onClick={() => handleCategoryClick('DALAM')}
                className="p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/40 text-left transition-all cursor-pointer flex flex-col group"
              >
                <div className="flex items-center justify-between">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <b className="font-mono text-white text-xs font-bold">{stats.dalam}</b>
                </div>
                <span className="text-[11px] font-semibold text-emerald-200 mt-1.5 group-hover:text-white transition-colors">
                  Dalam Asrama
                </span>
              </button>

              {/* Kategori: Keluar Asrama */}
              <button
                type="button"
                id="sidebar-cat-keluar"
                onClick={() => handleCategoryClick('KELUAR')}
                className="p-2.5 rounded-xl bg-orange-950/40 hover:bg-orange-900/50 border border-orange-600/40 text-left transition-all cursor-pointer flex flex-col group"
              >
                <div className="flex items-center justify-between">
                  <DoorOpen className="w-4 h-4 text-orange-400" />
                  <b className="font-mono text-white text-xs font-bold">{stats.keluar}</b>
                </div>
                <span className="text-[11px] font-semibold text-orange-200 mt-1.5 group-hover:text-white transition-colors">
                  Keluar Asrama
                </span>
              </button>

              {/* Kategori: Bilik Sakit */}
              <button
                type="button"
                id="sidebar-cat-kuarantin"
                onClick={() => handleCategoryClick('KUARANTIN')}
                className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-600/40 text-left transition-all cursor-pointer flex flex-col group"
              >
                <div className="flex items-center justify-between">
                  <HeartPulse className="w-4 h-4 text-purple-400" />
                  <b className="font-mono text-white text-xs font-bold">{stats.kuarantin}</b>
                </div>
                <span className="text-[11px] font-semibold text-purple-200 mt-1.5 group-hover:text-white transition-colors">
                  Bilik Sakit
                </span>
              </button>

              {/* Kategori: Hadir Kelas */}
              <button
                type="button"
                id="sidebar-cat-hadir-kelas"
                onClick={() => handleCategoryClick('HADIR_KELAS')}
                className="p-2.5 rounded-xl bg-teal-950/40 hover:bg-teal-900/50 border border-teal-600/40 text-left transition-all cursor-pointer flex flex-col group"
              >
                <div className="flex items-center justify-between">
                  <GraduationCap className="w-4 h-4 text-teal-400" />
                  <b className="font-mono text-white text-xs font-bold">{stats.hadirKelas || 0}</b>
                </div>
                <span className="text-[11px] font-semibold text-teal-200 mt-1.5 group-hover:text-white transition-colors">
                  Hadir Kelas
                </span>
              </button>
            </div>
          </div>

          {/* SEKSYEN 3: PANGKALAN DATA & SEGERAK AWAN */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Integrasi &amp; Segerak Data
            </div>
            <div className="space-y-1.5">
              {/* Konfigurasi Supabase */}
              {onOpenSupabase && (
                <button
                  type="button"
                  id="sidebar-btn-supabase"
                  onClick={() => {
                    onClose();
                    onOpenSupabase();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-100 transition-all text-xs font-semibold group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold leading-tight">Setup Supabase</div>
                      <div className="text-[10px] text-slate-400">Pangkalan data &amp; realtime awan</div>
                    </div>
                  </div>
                  {isSupabaseConnected ? (
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 font-mono ${
                      isRealtimeConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      {isRealtimeConnected ? 'Realtime' : 'Polling'}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black">
                      Perlu Kunci
                    </span>
                  )}
                </button>
              )}

              {/* Butang Segerak Cepat Supabase */}
              {onQuickSyncSupabase && (
                <button
                  type="button"
                  id="sidebar-btn-sync-supabase"
                  onClick={onQuickSyncSupabase}
                  disabled={isSyncingSupabase}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-600/30 text-sky-100 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-600/20 text-sky-400">
                      <RefreshCw className={`w-4 h-4 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="text-left">
                      <div className="text-sky-100 font-bold leading-tight">Segerak Supabase</div>
                      <div className="text-[10px] text-sky-300/80">Tarik data telefon terkini</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-200 border border-sky-400/30">
                    {isSyncingSupabase ? 'Menyegerak...' : 'Segerak'}
                  </span>
                </button>
              )}

              {/* Integrasi Google Sheets */}
              {(userRole === 'admin' || userRole === 'warden') && (
                <button
                  type="button"
                  id="sidebar-btn-sheets"
                  onClick={() => {
                    onClose();
                    onOpenGoogleSheets();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/30 text-emerald-100 transition-all text-xs font-semibold group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold leading-tight flex items-center gap-1.5">
                        <span>Google Sheets</span>
                        {userRole !== 'admin' && (
                          <span className="text-[9px] px-1 py-0.2 bg-amber-500/30 text-amber-200 rounded flex items-center gap-0.5">
                            <Lock className="w-2 h-2" /> Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-emerald-300/80">Penyelarasan helaian excel awan</div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border ${
                    isGSheetConnected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {isGSheetConnected ? 'Bersambung' : 'Belum'}
                  </span>
                </button>
              )}

              {/* Segerak Pantas Google Sheets */}
              {(userRole === 'admin' || userRole === 'warden') && onQuickSyncGoogleSheets && (
                <button
                  type="button"
                  id="sidebar-btn-sync-sheets"
                  onClick={onQuickSyncGoogleSheets}
                  disabled={isSyncingGoogleSheets}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-teal-950/40 hover:bg-teal-900/60 border border-teal-600/30 text-teal-100 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-teal-600/20 text-teal-400">
                      <RefreshCw className={`w-4 h-4 ${isSyncingGoogleSheets ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="text-left">
                      <div className="text-teal-100 font-bold leading-tight">Segerak Google Sheet</div>
                      <div className="text-[10px] text-teal-300/80">Tarik senarai terkini</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-200 border border-teal-400/30">
                    {isSyncingGoogleSheets ? 'Menyegerak...' : 'Segerak'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* SEKSYEN 4: ALATAN & AKSES PANTAS */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Alatan &amp; Pintasan Luaran
            </div>
            <div className="space-y-1.5">
              {/* Cetak Laporan Harian */}
              {(userRole === 'warden' || userRole === 'admin') && (
                <button
                  type="button"
                  id="sidebar-btn-print"
                  onClick={() => {
                    onClose();
                    onPrintReport();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-600/30 text-blue-100 transition-all text-xs font-semibold group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold leading-tight">Cetak Laporan Harian</div>
                      <div className="text-[10px] text-blue-300/80">PDF &amp; cetakan kehadiran</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    Cetak
                  </span>
                </button>
              )}

              {/* Portal Waris */}
              <a
                href="/waris"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-600/30 text-indigo-100 transition-all text-xs font-semibold group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold leading-tight">Portal Waris &amp; Ibu Bapa</div>
                    <div className="text-[10px] text-indigo-300/80">Pautan permohonan (/waris)</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-indigo-300 opacity-70 group-hover:opacity-100 transition-opacity" />
              </a>

              {/* Kiosk Imbasan Pintu Pagar */}
              <a
                href="/scanner"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-violet-950/40 hover:bg-violet-900/60 border border-violet-600/30 text-violet-100 transition-all text-xs font-semibold group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold leading-tight">Kiosk Imbasan Pagar</div>
                    <div className="text-[10px] text-violet-300/80">Pautan tablet/telefon guard (/scanner)</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-violet-300 opacity-70 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
        </div>

        {/* Bahagian Footer Bawah Sidebar: Bunyi & Log Keluar */}
        <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex-shrink-0 space-y-2">
          {/* Suis Bunyi Pengimbas */}
          <button
            type="button"
            id="sidebar-btn-sound-toggle"
            onClick={onToggleSound}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <span>Bunyi Kad Imbasan</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-md border ${
              soundEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}>
              {soundEnabled ? 'Aktif' : 'Senyap'}
            </span>
          </button>

          {/* Butang Log Keluar */}
          {onLogout && (
            <button
              type="button"
              id="sidebar-btn-logout"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-600/40 text-rose-200 text-xs font-bold transition-all cursor-pointer group active:scale-98"
            >
              <LogOut className="w-4 h-4 text-rose-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Log Keluar Sesi</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
