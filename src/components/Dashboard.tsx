import React from 'react';
import { 
  Users, 
  Home, 
  LogOut, 
  Clock, 
  AlertTriangle, 
  HeartPulse, 
  Compass, 
  CheckCircle2, 
  Phone, 
  MessageSquare, X,
  Sparkles,
  Layers,
  Building
} from 'lucide-react';
import { Student, StudentStatus } from '../types/hostel';
import { 
  getStatusBadgeConfig, 
  getBidangColor, 
  isOutingOverdue, 
  formatDateTime 
} from '../utils/helpers';
import { sounds } from '../utils/audio';

interface DashboardProps {
  students: Student[];
  statuses: Record<string, StudentStatus>;
  selectedSession: { period: string; dateStr: string; key: string };
  attendanceMap: Record<string, number>;
  onSelectStudent: (student: Student) => void;
  onEndOuting: (student: Student) => void;
  onOpenBulkReturn?: () => void;
  onOpenBulkOuting?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  statuses,
  selectedSession,
  attendanceMap,
  onSelectStudent,
  onEndOuting,
  onOpenBulkReturn,
  onOpenBulkOuting
}) => {
  const [viewingCategory, setViewingCategory] = React.useState<string | null>(null);
  const [lastClicked, setLastClicked] = React.useState<string | null>(null);

  const handleCardClick = (category: string) => {
    setLastClicked(category);
    sounds.playActionChime('in');
    setViewingCategory(category);
    setTimeout(() => {
      setLastClicked(null);
    }, 450);
  };

  // Safely resolve each student's current status, defaulting to 'DALAM' if unassigned
  const getStudentStatus = (s: Student): string => {
    return statuses[s.kp]?.status || 
           (s.kp ? statuses[s.kp.replace(/[\s-]/g, '')]?.status : undefined) || 
           'DALAM';
  };

  const total = students.length;
  const dalam = students.filter(s => getStudentStatus(s) === 'DALAM').length;
  const keluar = students.filter(s => getStudentStatus(s) === 'KELUAR').length;
  const outing = students.filter(s => getStudentStatus(s) === 'OUTING').length;
  const bermalam = students.filter(s => getStudentStatus(s) === 'BERMALAM').length;
  const kuarantin = students.filter(s => getStudentStatus(s) === 'KUARANTIN').length;

  // Find overdue students
  const overdueStudents = students
    .filter(s => {
      const st = statuses[s.kp] || (s.kp ? statuses[s.kp.replace(/[\s-]/g, '')] : undefined);
      return st?.status === 'OUTING' && isOutingOverdue(st?.expectedReturn);
    })
    .map(s => ({ s, st: statuses[s.kp] || (s.kp ? statuses[s.kp.replace(/[\s-]/g, '')] : undefined) as StudentStatus }));

  // Attendance count
  const presentCount = Object.keys(attendanceMap).length;
  const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const isAspura = (s: Student) => s.jantina === 'L' || (s.dorm && s.dorm.toLowerCase().includes('aspura'));
  const isAspuri = (s: Student) => s.jantina === 'P' || (s.dorm && s.dorm.toLowerCase().includes('aspuri'));
  const aspuraTotal = students.filter(isAspura).length;
  const aspuraPresent = students.filter(s => isAspura(s) && !!attendanceMap[s.kp]).length;
  const aspuriTotal = students.filter(isAspuri).length;
  const aspuriPresent = students.filter(s => isAspuri(s) && !!attendanceMap[s.kp]).length;

  // Breakdown by Tingkatan
  const tingkatanList = [1, 2, 3, 4, 5];

  // Breakdown by Arts Stream
  const streams = ['MUZIK', 'TARI', 'TEATER', 'VISUAL'] as const;

  // Breakdown by Dorms
  const dorms = [
    'Aspura Kasturi 1', 'Aspura Kasturi 2', 'Aspura Jebat 1', 'Aspura Jebat 2',
    'Aspura Tuah 1', 'Aspura Tuah 2', 'Aspura Lekir 1', 'Aspura Lekir 2',
    'Aspuri Teja 1', 'Aspuri Teja 2', 'Aspuri Mahsuri 1', 'Aspuri Mahsuri 2',
    'Aspuri Cempaka 1', 'Aspuri Cempaka 2', 'Aspuri Melati 1', 'Aspuri Melati 2'
  ];


const renderModal = () => {
  if (!viewingCategory) return null;

  let title = 'Senarai Murid';
  let filteredList = students;

  if (viewingCategory === 'DALAM') {
    title = 'Senarai Dalam Asrama';
    filteredList = students.filter(s => getStudentStatus(s) === 'DALAM');
  } else if (viewingCategory === 'OUTING') {
    title = 'Senarai Sedang Outing';
    filteredList = students.filter(s => getStudentStatus(s) === 'OUTING');
  } else if (viewingCategory === 'BERMALAM') {
    title = 'Senarai Pulang Bermalam';
    filteredList = students.filter(s => getStudentStatus(s) === 'BERMALAM');
  } else if (viewingCategory === 'KUARANTIN') {
    title = 'Senarai Bilik Sakit / Kuarantin';
    filteredList = students.filter(s => getStudentStatus(s) === 'KUARANTIN');
  } else if (viewingCategory === 'KELUAR') {
    title = 'Senarai Keluar Asrama';
    filteredList = students.filter(s => getStudentStatus(s) === 'KELUAR');
  } else if (viewingCategory?.startsWith('TING_')) {
    const ting = parseInt(viewingCategory.replace('TING_', ''));
    title = `Senarai Murid Tingkatan ${ting}`;
    filteredList = students.filter(s => s.tingkatan === ting);
  } else if (viewingCategory?.startsWith('STREAM_')) {
    const str = viewingCategory.replace('STREAM_', '');
    title = `Senarai Murid Bidang Seni ${str}`;
    filteredList = students.filter(s => s.bidang === str);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-blue-900/10 flex items-center justify-between bg-blue-900 text-white z-10 sticky top-0 shadow-sm">
          <div>
            <h3 className="font-bold text-white text-lg">{title}</h3>
            <p className="text-xs text-blue-200">{filteredList.length} rekod</p>
          </div>
          <button
            onClick={() => setViewingCategory(null)}
            className="p-2 rounded-full hover:bg-blue-800 text-blue-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {filteredList.map(s => {
            const st = statuses[s.kp];
            const config = getStatusBadgeConfig(st?.status || 'DALAM');
            return (
              <div 
                key={s.kp} 
                className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all shadow-sm"
                onClick={() => {
                  setViewingCategory(null);
                  onSelectStudent(s);
                }}
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-200 overflow-hidden text-blue-700">
                  {s.photo ? (
                    <img src={s.photo} alt={s.nama} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-blue-700 text-sm">{s.nama.substring(0, 2)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{s.nama}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{s.kelas} &middot; {s.bidang}</p>
                  
                  {st?.status !== 'DALAM' && st?.dest && (
                    <p className="text-[11px] text-slate-600 mt-1.5 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{st.dest}</span>
                    </p>
                  )}
                </div>
                <div className={`px-2 py-1 rounded border text-[10px] font-bold ${config.bg} ${config.text} ${config.border}`}>
                  {config.label}
                </div>
              </div>
            );
          })}

          {filteredList.length === 0 && (
            <div className="text-center py-10">
              <p className="text-slate-500 text-sm">Tiada rekod dijumpai.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="space-y-6">
      
      {/* OVERDUE ALERT BANNER (If any student is late returning) */}
      {overdueStudents.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-rose-800 font-bold text-sm sm:text-base">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
              <span>Amaran: {overdueStudents.length} Murid Melepasi Masa Dijangka Pulang</span>
            </div>
            <span className="text-[11px] font-mono text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200 font-semibold">
              Tindakan Warden Segera
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {overdueStudents.map(({ s, st }) => (
              <div 
                key={s.kp}
                className="bg-white border border-rose-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs shadow-sm"
              >
                <div>
                  <h4 
                    onClick={() => onSelectStudent(s)}
                    className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer flex items-center gap-1"
                  >
                    {s.nama}
                  </h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    {s.kelas} &middot; Destinasi: <span className="text-rose-700 font-medium">{st.dest}</span>
                  </p>
                  <p className="text-rose-600 font-mono font-bold text-[11px] mt-0.5">
                    Patut Pulang: {st.expectedReturn}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {s.telWaris && (
                    <a
                      href={`https://wa.me/6${s.telWaris.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      title="WhatsApp Waris"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => onEndOuting(s)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] shadow-sm"
                  >
                    Sahkan Pulang
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PULANG PUKAL WARDEN QUICK ACTION BANNER */}
      {onOpenBulkReturn && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-emerald-950">
                  Tindakan Warden: Pulang Pukal Petang
                </h3>
                {(keluar > 0 || outing > 0) ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    {keluar + outing} Murid di Luar
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Semua di Asrama
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-800/90 mt-0.5">
                {keluar > 0 ? `${keluar} murid keluar asrama. ` : ''}
                {outing > 0 ? `${outing} murid outing. ` : ''}
                Sahkan kepulangan murid secara serentak waktu petang tanpa perlu imbas kad seorang demi seorang.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenBulkReturn}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Pulang ke Asrama Pukal</span>
          </button>
        </div>
      )}

      {/* KELUAR PUKAL (ENUM LIST) WARDEN QUICK ACTION BANNER */}
      {onOpenBulkOuting && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-100 border border-blue-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <LogOut className="w-5 h-5 rotate-180" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Pelepasan Pukal
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                  Tingkatan &amp; Bidang
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Lepaskan murid pulang bermalam atau aktiviti luar secara serentak mengikut tapisan Tingkatan, Bidang, Aspura &amp; Aspuri.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenBulkOuting}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4 rotate-180" />
            <span>Keluar Asrama Pukal</span>
          </button>
        </div>
      )}

      {/* METRICS OVERVIEW CARDS (GLOSSY ANIMATED BUTTONS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* 1. Total (Jumlah Murid) */}
        <button 
          type="button"
          onClick={() => handleCardClick('TOTAL')}
          className={`group relative isolate overflow-hidden text-left rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none
            bg-gradient-to-br from-white via-sky-50/50 to-blue-50/70 border border-blue-200/90 hover:border-blue-400
            shadow-xs hover:shadow-xl hover:shadow-blue-500/15 hover:-translate-y-1 active:scale-95 active:translate-y-0.5 active:shadow-inner
            before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/80 before:to-transparent before:pointer-events-none before:rounded-t-2xl
            after:absolute after:inset-0 after:w-full after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent after:-translate-x-full group-hover:after:translate-x-full after:transition-transform after:duration-1000 after:pointer-events-none
            ${lastClicked === 'TOTAL' ? 'ring-4 ring-blue-400/60 scale-95' : ''}
            ${viewingCategory === 'TOTAL' ? 'ring-2 ring-blue-600 ring-offset-2 border-blue-500 shadow-md' : ''}
          `}
        >
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold relative z-10">
            <span className="group-hover:text-blue-700 transition-colors">Jumlah Murid</span>
            <div className="w-7 h-7 rounded-xl bg-blue-100/90 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 font-mono font-extrabold text-2xl sm:text-3xl text-slate-900 group-hover:text-blue-700 transition-colors relative z-10">
            {total}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 relative z-10">
            <span>100% Berdaftar</span>
            <span className="text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Lihat &rarr;
            </span>
          </div>
        </button>

        {/* 2. Dalam Asrama */}
        <button 
          type="button"
          onClick={() => handleCardClick('DALAM')}
          className={`group relative isolate overflow-hidden text-left rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none
            bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/70 border border-emerald-200/90 hover:border-emerald-400
            shadow-xs hover:shadow-xl hover:shadow-emerald-500/15 hover:-translate-y-1 active:scale-95 active:translate-y-0.5 active:shadow-inner
            before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/80 before:to-transparent before:pointer-events-none before:rounded-t-2xl
            after:absolute after:inset-0 after:w-full after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent after:-translate-x-full group-hover:after:translate-x-full after:transition-transform after:duration-1000 after:pointer-events-none
            ${lastClicked === 'DALAM' ? 'ring-4 ring-emerald-400/60 scale-95' : ''}
            ${viewingCategory === 'DALAM' ? 'ring-2 ring-emerald-600 ring-offset-2 border-emerald-500 shadow-md' : ''}
          `}
        >
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold relative z-10">
            <span className="group-hover:text-emerald-900 transition-colors">Dalam Asrama</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100/90 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 font-mono font-extrabold text-2xl sm:text-3xl text-emerald-600 group-hover:text-emerald-700 transition-colors relative z-10">
            {dalam}
          </div>
          <div className="flex items-center justify-between text-[10px] text-emerald-700/80 mt-1 font-mono font-medium relative z-10">
            <span>{Math.round((dalam / (total || 1)) * 100)}% fizikal</span>
            <span className="text-emerald-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Lihat &rarr;
            </span>
          </div>
        </button>

        {/* 3. Sedang Outing */}
        <button 
          type="button"
          onClick={() => handleCardClick('OUTING')}
          className={`group relative isolate overflow-hidden text-left rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none
            bg-gradient-to-br from-white via-amber-50/50 to-yellow-50/70 border border-amber-200/90 hover:border-amber-400
            shadow-xs hover:shadow-xl hover:shadow-amber-500/15 hover:-translate-y-1 active:scale-95 active:translate-y-0.5 active:shadow-inner
            before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/80 before:to-transparent before:pointer-events-none before:rounded-t-2xl
            after:absolute after:inset-0 after:w-full after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent after:-translate-x-full group-hover:after:translate-x-full after:transition-transform after:duration-1000 after:pointer-events-none
            ${lastClicked === 'OUTING' ? 'ring-4 ring-amber-400/60 scale-95' : ''}
            ${viewingCategory === 'OUTING' ? 'ring-2 ring-amber-600 ring-offset-2 border-amber-500 shadow-md' : ''}
          `}
        >
          <div className="flex items-center justify-between text-amber-900 text-xs font-semibold relative z-10">
            <span className="group-hover:text-amber-950 transition-colors">Sedang Outing</span>
            <div className="w-7 h-7 rounded-xl bg-amber-100/90 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 font-mono font-extrabold text-2xl sm:text-3xl text-amber-600 group-hover:text-amber-700 transition-colors relative z-10">
            {outing}
          </div>
          <div className="flex items-center justify-between text-[10px] text-amber-700/80 mt-1 relative z-10">
            <span>Harian berpas</span>
            <span className="text-amber-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Lihat &rarr;
            </span>
          </div>
        </button>

        {/* 4. Pulang Bermalam */}
        <button 
          type="button"
          onClick={() => handleCardClick('BERMALAM')}
          className={`group relative isolate overflow-hidden text-left rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none
            bg-gradient-to-br from-white via-indigo-50/50 to-blue-50/70 border border-indigo-200/90 hover:border-indigo-400
            shadow-xs hover:shadow-xl hover:shadow-indigo-500/15 hover:-translate-y-1 active:scale-95 active:translate-y-0.5 active:shadow-inner
            before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/80 before:to-transparent before:pointer-events-none before:rounded-t-2xl
            after:absolute after:inset-0 after:w-full after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent after:-translate-x-full group-hover:after:translate-x-full after:transition-transform after:duration-1000 after:pointer-events-none
            ${lastClicked === 'BERMALAM' ? 'ring-4 ring-indigo-400/60 scale-95' : ''}
            ${viewingCategory === 'BERMALAM' ? 'ring-2 ring-indigo-600 ring-offset-2 border-indigo-500 shadow-md' : ''}
          `}
        >
          <div className="flex items-center justify-between text-indigo-900 text-xs font-semibold relative z-10">
            <span className="group-hover:text-indigo-950 transition-colors">Bermalam</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-100/90 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 font-mono font-extrabold text-2xl sm:text-3xl text-indigo-600 group-hover:text-indigo-700 transition-colors relative z-10">
            {bermalam}
          </div>
          <div className="flex items-center justify-between text-[10px] text-indigo-700/80 mt-1 relative z-10">
            <span>Bersama waris</span>
            <span className="text-indigo-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Lihat &rarr;
            </span>
          </div>
        </button>

        {/* 5. Kuarantin / Bilik Sakit */}
        <button 
          type="button"
          onClick={() => handleCardClick('KUARANTIN')}
          className={`group relative isolate overflow-hidden text-left rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none
            bg-gradient-to-br from-white via-purple-50/50 to-fuchsia-50/70 border border-purple-200/90 hover:border-purple-400
            shadow-xs hover:shadow-xl hover:shadow-purple-500/15 hover:-translate-y-1 active:scale-95 active:translate-y-0.5 active:shadow-inner
            before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/80 before:to-transparent before:pointer-events-none before:rounded-t-2xl
            after:absolute after:inset-0 after:w-full after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent after:-translate-x-full group-hover:after:translate-x-full after:transition-transform after:duration-1000 after:pointer-events-none
            ${lastClicked === 'KUARANTIN' ? 'ring-4 ring-purple-400/60 scale-95' : ''}
            ${viewingCategory === 'KUARANTIN' ? 'ring-2 ring-purple-600 ring-offset-2 border-purple-500 shadow-md' : ''}
          `}
        >
          <div className="flex items-center justify-between text-purple-900 text-xs font-semibold relative z-10">
            <span className="group-hover:text-purple-950 transition-colors">Bilik Sakit</span>
            <div className="w-7 h-7 rounded-xl bg-purple-100/90 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-2xs">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 font-mono font-extrabold text-2xl sm:text-3xl text-purple-600 group-hover:text-purple-700 transition-colors relative z-10">
            {kuarantin}
          </div>
          <div className="flex items-center justify-between text-[10px] text-purple-700/80 mt-1 relative z-10">
            <span>Pemantauan</span>
            <span className="text-purple-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Lihat &rarr;
            </span>
          </div>
        </button>

        {/* 6. Keluar Asrama / Aktiviti Luar */}
        <button 
          type="button"
          onClick={() => handleCardClick('KELUAR')}
          className={`group relative isolate overflow-hidden text-left rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none
            bg-gradient-to-br from-white via-rose-50/50 to-orange-50/70 border border-rose-200/90 hover:border-rose-400
            shadow-xs hover:shadow-xl hover:shadow-rose-500/15 hover:-translate-y-1 active:scale-95 active:translate-y-0.5 active:shadow-inner
            before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/80 before:to-transparent before:pointer-events-none before:rounded-t-2xl
            after:absolute after:inset-0 after:w-full after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent after:-translate-x-full group-hover:after:translate-x-full after:transition-transform after:duration-1000 after:pointer-events-none
            ${lastClicked === 'KELUAR' ? 'ring-4 ring-rose-400/60 scale-95' : ''}
            ${viewingCategory === 'KELUAR' ? 'ring-2 ring-rose-600 ring-offset-2 border-rose-500 shadow-md' : ''}
          `}
        >
          <div className="flex items-center justify-between text-rose-900 text-xs font-semibold relative z-10">
            <span className="group-hover:text-rose-950 transition-colors">Keluar Asrama</span>
            <div className="w-7 h-7 rounded-xl bg-rose-100/90 text-rose-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-2xs">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 font-mono font-extrabold text-2xl sm:text-3xl text-rose-600 group-hover:text-rose-700 transition-colors relative z-10">
            {keluar}
          </div>
          <div className="flex items-center justify-between text-[10px] text-rose-700/80 mt-1 relative z-10">
            <span>Urusan Luar</span>
            <span className="text-rose-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Lihat &rarr;
            </span>
          </div>
        </button>

      </div>

      {/* SESSION ROLL-CALL HIGHLIGHT */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Status Kehadiran Roll-Call Asrama
            </div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {presentCount} daripada {total} murid telah direkod hadir
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                🚹 Aspura: {aspuraPresent}/{aspuraTotal} Hadir
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                🚺 Aspuri: {aspuriPresent}/{aspuriTotal} Hadir
              </span>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-64 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-600 font-mono">
            <span>Kadar Kehadiran:</span>
            <span className="font-bold text-blue-600">{attendanceRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* SECTION 1: BREAKDOWN MENGIKUT TINGKATAN (FORMS 1-5) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Statistik Mengikut Tingkatan
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Dalam</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Outing</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Bermalam</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>Keluar</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {tingkatanList.map(ting => {
            const formStudents = students.filter(s => s.tingkatan === ting);
            const formTotal = formStudents.length;
            const formDalam = formStudents.filter(s => getStudentStatus(s) === 'DALAM').length;
            const formOuting = formStudents.filter(s => getStudentStatus(s) === 'OUTING').length;
            const formBermalam = formStudents.filter(s => getStudentStatus(s) === 'BERMALAM').length;
            const formKeluar = formStudents.filter(s => getStudentStatus(s) === 'KELUAR').length;

            const pctDalam = formTotal > 0 ? (formDalam / formTotal) * 100 : 0;
            const pctOuting = formTotal > 0 ? (formOuting / formTotal) * 100 : 0;
            const pctBermalam = formTotal > 0 ? (formBermalam / formTotal) * 100 : 0;
            const pctKeluar = formTotal > 0 ? (formKeluar / formTotal) * 100 : 0;

            const isCurrent = viewingCategory === `TING_${ting}`;

            return (
              <button 
                key={ting} 
                type="button"
                onClick={() => handleCardClick(`TING_${ting}`)}
                className={`group relative isolate overflow-hidden text-left rounded-2xl p-3.5 space-y-2.5 transition-all duration-200 cursor-pointer select-none
                  bg-gradient-to-br from-white via-slate-50/70 to-blue-50/40 border border-slate-200/90 hover:border-blue-400
                  shadow-xs hover:shadow-lg hover:-translate-y-0.5 active:scale-95 active:translate-y-0.5 active:shadow-inner
                  before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/70 before:to-transparent before:pointer-events-none
                  after:absolute after:inset-0 after:w-full after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:-translate-x-full group-hover:after:translate-x-full after:transition-transform after:duration-1000 after:pointer-events-none
                  ${lastClicked === `TING_${ting}` ? 'ring-4 ring-blue-400/50 scale-95' : ''}
                  ${isCurrent ? 'ring-2 ring-blue-600 border-blue-500 shadow-md' : ''}
                `}
              >
                <div className="flex justify-between items-baseline relative z-10">
                  <span className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">Tingkatan {ting}</span>
                  <span className="text-xs text-slate-500 font-mono font-semibold">{formTotal} Murid</span>
                </div>

                {/* Stacked Progress bar */}
                <div className="h-2 rounded-full bg-slate-200/80 flex overflow-hidden shadow-2xs relative z-10">
                  <span style={{ width: `${pctDalam}%` }} className="bg-emerald-500 transition-all"></span>
                  <span style={{ width: `${pctOuting}%` }} className="bg-amber-500 transition-all"></span>
                  <span style={{ width: `${pctBermalam}%` }} className="bg-blue-500 transition-all"></span>
                  <span style={{ width: `${pctKeluar}%` }} className="bg-rose-500 transition-all"></span>
                </div>

                <div className="flex justify-between text-[11px] text-slate-600 pt-0.5 font-mono relative z-10">
                  <span className="text-emerald-700 font-semibold">{formDalam} Dalam</span>
                  <span className="text-slate-500">{formOuting + formBermalam} Luar</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: BREAKDOWN MENGIKUT PENGKHUSUSAN SENI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Pengkhususan Seni SSeM
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {streams.map(str => {
            const streamStudents = students.filter(s => s.bidang === str);
            const strTotal = streamStudents.length;
            const strDalam = streamStudents.filter(s => getStudentStatus(s) === 'DALAM').length;
            const config = getBidangColor(str);
            const isCurrent = viewingCategory === `STREAM_${str}`;

            return (
              <button 
                key={str} 
                type="button"
                onClick={() => handleCardClick(`STREAM_${str}`)}
                className={`group relative isolate overflow-hidden text-left rounded-2xl p-4 space-y-2.5 transition-all duration-200 cursor-pointer select-none
                  bg-gradient-to-br from-white via-slate-50/70 to-slate-100/80 border border-slate-200/90 hover:border-blue-400
                  shadow-xs hover:shadow-lg hover:-translate-y-0.5 active:scale-95 active:translate-y-0.5 active:shadow-inner
                  before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/70 before:to-transparent before:pointer-events-none
                  after:absolute after:inset-0 after:w-full after:h-full after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:-translate-x-full group-hover:after:translate-x-full after:transition-transform after:duration-1000 after:pointer-events-none
                  ${lastClicked === `STREAM_${str}` ? 'ring-4 ring-blue-400/50 scale-95' : ''}
                  ${isCurrent ? 'ring-2 ring-blue-600 border-blue-500 shadow-md' : ''}
                `}
              >
                <div className="flex justify-between items-center relative z-10">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border shadow-2xs ${config.bg} ${config.text} ${config.border}`}>
                    {str}
                  </span>
                  <span className="font-mono text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">{strTotal}</span>
                </div>
                <div className="text-xs text-slate-600 flex justify-between items-center pt-1 font-mono relative z-10">
                  <span>Dalam Asrama:</span>
                  <b className="text-emerald-700 font-bold">{strDalam}</b>
                </div>
                <div className="text-xs text-slate-600 flex justify-between items-center font-mono relative z-10">
                  <span>Keluar / Outing:</span>
                  <b className="text-amber-700 font-bold">{strTotal - strDalam}</b>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {renderModal()}
    </div>
  );
};