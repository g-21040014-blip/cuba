import React, { useState } from 'react';
import { 
  UserCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Home, 
  AlertCircle,
  Users,
  CheckCheck
} from 'lucide-react';
import { Student, StudentStatus, SessionPeriod } from '../types/hostel';
import { 
  getStudentInitials, 
  getAvatarColor, 
  formatTime 
} from '../utils/helpers';

interface AttendanceSessionViewProps {
  students: Student[];
  statuses: Record<string, StudentStatus>;
  selectedSession: { key: string; period: SessionPeriod; dateStr: string; label: string; timeTarget: string };
  attendanceMap: Record<string, number>;
  onSelectSession?: (period: SessionPeriod) => void;
  onMarkHadir: (student: Student) => void;
  onBulkMarkHadir: (studentsToMark: Student[]) => void;
  onSelectStudent: (student: Student) => void;
}

export const AttendanceSessionView: React.FC<AttendanceSessionViewProps> = ({
  students,
  statuses,
  selectedSession,
  attendanceMap,
  onMarkHadir,
  onBulkMarkHadir,
  onSelectStudent
}) => {
  const [activeGroup, setActiveGroup] = useState<'aspura' | 'aspuri' | 'all'>('aspura');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'belum' | 'hadir'>('belum');
  const [dormFilter, setDormFilter] = useState<string>('all');

  // Helpers to identify Aspura vs Aspuri
  const isAspura = (s: Student) => s.jantina === 'L' || (s.dorm && s.dorm.toLowerCase().includes('aspura'));
  const isAspuri = (s: Student) => s.jantina === 'P' || (s.dorm && s.dorm.toLowerCase().includes('aspuri'));

  // Groups
  const aspuraStudents = students.filter(isAspura);
  const aspuriStudents = students.filter(isAspuri);

  // Aspura Stats
  const aspuraTotal = aspuraStudents.length;
  const aspuraPresent = aspuraStudents.filter(s => !!attendanceMap[s.kp]).length;
  const aspuraAbsent = aspuraTotal - aspuraPresent;
  const aspuraRate = aspuraTotal > 0 ? Math.round((aspuraPresent / aspuraTotal) * 100) : 0;
  const aspuraMissingInHostel = aspuraStudents.filter(s => {
    const st = statuses[s.kp]?.status || (s.kp ? statuses[s.kp.replace(/[\s-]/g, '')]?.status : undefined) || 'DALAM';
    return st === 'DALAM' && !attendanceMap[s.kp];
  });

  // Aspuri Stats
  const aspuriTotal = aspuriStudents.length;
  const aspuriPresent = aspuriStudents.filter(s => !!attendanceMap[s.kp]).length;
  const aspuriAbsent = aspuriTotal - aspuriPresent;
  const aspuriRate = aspuriTotal > 0 ? Math.round((aspuriPresent / aspuriTotal) * 100) : 0;
  const aspuriMissingInHostel = aspuriStudents.filter(s => {
    const st = statuses[s.kp]?.status || (s.kp ? statuses[s.kp.replace(/[\s-]/g, '')]?.status : undefined) || 'DALAM';
    return st === 'DALAM' && !attendanceMap[s.kp];
  });

  // Overall Stats
  const total = students.length;
  const presentCount = Object.keys(attendanceMap).length;
  const absentCount = total - presentCount;
  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  // Current Active Group Selection
  const currentGroupStudents = activeGroup === 'aspura'
    ? aspuraStudents
    : activeGroup === 'aspuri'
    ? aspuriStudents
    : students;

  const currentGroupPresent = currentGroupStudents.filter(s => !!attendanceMap[s.kp]).length;
  const currentGroupAbsent = currentGroupStudents.length - currentGroupPresent;

  // Distinct dorms for current group
  const dorms = [...new Set(currentGroupStudents.map(s => s.dorm || 'Blok Utama'))].sort();

  // Filter students
  const filteredStudents = currentGroupStudents.filter(s => {
    if (searchQuery) {
      const q = searchQuery.toUpperCase();
      if (!s.nama.toUpperCase().includes(q) && !s.kp.includes(q)) return false;
    }
    if (dormFilter !== 'all' && s.dorm !== dormFilter) return false;

    const isPresent = !!attendanceMap[s.kp];
    if (filterState === 'belum' && isPresent) return false;
    if (filterState === 'hadir' && !isPresent) return false;

    return true;
  });

  return (
    <div className="space-y-5">
      
      {/* HEADER BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kehadiran Harian Asrama &middot; {new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Sesi Roll-Call Asrama (Kumpulan Aspura &amp; Aspuri)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Semak dan sahkan rekod kehadiran murid mengikut blok Aspura (Lelaki) dan Aspuri (Perempuan).
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-mono">
            <span className="text-slate-500">Jumlah Keseluruhan:</span>
            <span className="font-bold text-emerald-600">{presentCount} Hadir</span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-700">{total} Murid ({rate}%)</span>
          </div>
        </div>
      </div>

      {/* DUA KUMPULAN ROLL-CALL CARDS: ASPURA & ASPURI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* KAD KUMPULAN ASPURA */}
        <div className={`bg-white border rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm transition-all ${
          activeGroup === 'aspura' ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                🚹
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    Asrama Putera
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">Kumpulan Aspura</h4>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-mono font-bold text-blue-700">{aspuraRate}%</div>
              <div className="text-[11px] text-slate-500 font-mono">{aspuraPresent} / {aspuraTotal} Hadir</div>
            </div>
          </div>

          {/* Progress Bar Aspura */}
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${aspuraRate}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Hadir: <b className="text-emerald-700 font-mono">{aspuraPresent}</b>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Belum Hadir: <b className="text-rose-700 font-mono">{aspuraAbsent}</b>
            </span>
            <span className="text-slate-400 font-mono">Jumlah: {aspuraTotal}</span>
          </div>

          {/* Button Sahkan Hadir Aspura */}
          <button
            type="button"
            onClick={() => onBulkMarkHadir(aspuraMissingInHostel.length > 0 ? aspuraMissingInHostel : aspuraStudents.filter(s => !attendanceMap[s.kp]))}
            disabled={aspuraAbsent === 0}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all ${
              aspuraAbsent === 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default opacity-85'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.99] cursor-pointer'
            }`}
            title="Tandakan hadir semua murid Aspura yang berada dalam asrama"
          >
            <CheckCheck className="w-4 h-4" />
            <span>
              {aspuraAbsent === 0
                ? 'Semua Aspura Hadir ✓'
                : `Semua Hadir Roll-Call Aspura (${aspuraMissingInHostel.length > 0 ? aspuraMissingInHostel.length : aspuraAbsent})`}
            </span>
          </button>
        </div>

        {/* KAD KUMPULAN ASPURI */}
        <div className={`bg-white border rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm transition-all ${
          activeGroup === 'aspuri' ? 'border-purple-400 ring-2 ring-purple-500/20' : 'border-slate-200 hover:border-slate-300'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                🚺
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    Asrama Puteri
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">Kumpulan Aspuri</h4>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-mono font-bold text-purple-700">{aspuriRate}%</div>
              <div className="text-[11px] text-slate-500 font-mono">{aspuriPresent} / {aspuriTotal} Hadir</div>
            </div>
          </div>

          {/* Progress Bar Aspuri */}
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-300"
              style={{ width: `${aspuriRate}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Hadir: <b className="text-emerald-700 font-mono">{aspuriPresent}</b>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Belum Hadir: <b className="text-rose-700 font-mono">{aspuriAbsent}</b>
            </span>
            <span className="text-slate-400 font-mono">Jumlah: {aspuriTotal}</span>
          </div>

          {/* Button Sahkan Hadir Aspuri */}
          <button
            type="button"
            onClick={() => onBulkMarkHadir(aspuriMissingInHostel.length > 0 ? aspuriMissingInHostel : aspuriStudents.filter(s => !attendanceMap[s.kp]))}
            disabled={aspuriAbsent === 0}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all ${
              aspuriAbsent === 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default opacity-85'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20 active:scale-[0.99] cursor-pointer'
            }`}
            title="Tandakan hadir semua murid Aspuri yang berada dalam asrama"
          >
            <CheckCheck className="w-4 h-4" />
            <span>
              {aspuriAbsent === 0
                ? 'Semua Aspuri Hadir ✓'
                : `Semua Hadir Roll-Call Aspuri (${aspuriMissingInHostel.length > 0 ? aspuriMissingInHostel.length : aspuriAbsent})`}
            </span>
          </button>
        </div>

      </div>

      {/* TAB PILIHAN KUMPULAN & FILTER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
        
        {/* Navigasi Kumpulan: Aspura / Aspuri / Semua */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => { setActiveGroup('aspura'); setDormFilter('all'); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeGroup === 'aspura'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>🚹 Kumpulan Aspura</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeGroup === 'aspura' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {aspuraStudents.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveGroup('aspuri'); setDormFilter('all'); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeGroup === 'aspuri'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>🚺 Kumpulan Aspuri</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeGroup === 'aspuri' ? 'bg-purple-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {aspuriStudents.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveGroup('all'); setDormFilter('all'); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeGroup === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>👥 Semua Murid</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeGroup === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {students.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Paparan Senarai: <b className="text-slate-800">{activeGroup === 'aspura' ? 'Aspura (Putera)' : activeGroup === 'aspuri' ? 'Aspuri (Puteri)' : 'Semua Murid'}</b>
          </div>
        </div>

        {/* Status Filter & Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* State filter: Belum / Hadir / Semua */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
            <button
              onClick={() => setFilterState('belum')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterState === 'belum'
                  ? 'bg-white text-rose-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Belum Direkod ({currentGroupAbsent})
            </button>
            <button
              onClick={() => setFilterState('hadir')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterState === 'hadir'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sudah Hadir ({currentGroupPresent})
            </button>
            <button
              onClick={() => setFilterState('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterState === 'all'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({currentGroupStudents.length})
            </button>
          </div>

          {/* Dorm Selector & Search */}
          <div className="flex items-center gap-2">
            <select
              value={dormFilter}
              onChange={e => setDormFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500 max-w-[200px]"
            >
              <option value="all">Semua Blok Bilik Dorm ({activeGroup.toUpperCase()})</option>
              {dorms.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <div className="relative flex-1 sm:w-56">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama / KP..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

      </div>

      {/* STUDENT ATTENDANCE TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Murid</th>
                <th className="py-3 px-3">Kumpulan</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3">Bilik Dorm</th>
                <th className="py-3 px-3">Status Pergerakan</th>
                <th className="py-3 px-3">Status Roll-Call</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(s => {
                  const isPresent = !!attendanceMap[s.kp];
                  const st = statuses[s.kp];
                  const groupLabel = isAspura(s) ? 'Aspura' : 'Aspuri';

                  return (
                    <tr 
                      key={s.kp} 
                      className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectStudent(s)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center font-bold text-xs text-white flex-shrink-0 relative shadow-xs"
                            style={{ backgroundColor: getAvatarColor(s.kp) }}
                          >
                            {getStudentInitials(s.nama)}
                            {s.gambar && (
                              <img 
                                src={s.gambar} 
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
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {s.nama}
                            </div>
                            <div className="text-slate-400 text-[10px] font-mono">
                              {s.kp}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          groupLabel === 'Aspura'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          <span>{groupLabel === 'Aspura' ? '🚹' : '🚺'}</span>
                          <span>{groupLabel}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {s.kelas}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {s.dorm || 'Blok Utama'}
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[11px] text-slate-600">
                          {st?.status === 'DALAM' ? 'Dalam Asrama' : st?.status === 'OUTING' ? 'Sedang Outing' : st?.status === 'BERMALAM' ? 'Bermalam di Rumah' : st?.status === 'KELUAR' ? 'Keluar Asrama' : 'Bilik Sakit'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Hadir ({formatTime(attendanceMap[s.kp])})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Belum Hadir
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        {!isPresent && (
                          <button
                            onClick={() => onMarkHadir(s)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs"
                          >
                            Tandakan Hadir
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Tiada rekod murid mengikut kriteria tapisan ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
