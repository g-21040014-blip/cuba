import React, { useState } from 'react';
import { 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Compass, 
  Home, 
  FileText, 
  Car,
  Search,
  Users,
  Edit3
} from 'lucide-react';
import { Student, StudentStatus, Warden, ParentRequest, StatusType } from '../types/hostel';
import { 
  getStudentInitials, 
  getAvatarColor, 
  formatDateTime, 
  getRelativeTime, 
  isOutingOverdue 
} from '../utils/helpers';
import { ParentRequestsManager } from './ParentRequestsManager';
import { loadParentRequests } from '../services/parentRequestsService';
import { EditMovementModal } from './EditMovementModal';

interface OutingMonitorProps {
  students: Student[];
  statuses: Record<string, StudentStatus>;
  currentWarden: Warden;
  onEndOuting: (student: Student) => void;
  onEndBermalam: (student: Student) => void;
  onEndKeluar?: (student: Student) => void;
  onSelectStudent: (student: Student) => void;
  onOpenGatePass: (student: Student) => void;
  onBulkReturnOuting: () => void;
  onOpenParentPortal: () => void;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
  onApproveAndCheckOut?: (student: Student, request: ParentRequest) => void;
  onUpdateStudentStatus?: (
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
  onCancelMovement?: (student: Student, reason: string) => void;
  userRole?: 'admin' | 'warden' | 'guard' | null;
}

export const OutingMonitor: React.FC<OutingMonitorProps> = ({
  students,
  statuses,
  currentWarden,
  onEndOuting,
  onEndBermalam,
  onEndKeluar,
  onSelectStudent,
  onOpenGatePass,
  onBulkReturnOuting,
  onOpenParentPortal,
  onShowToast,
  onApproveAndCheckOut,
  onUpdateStudentStatus,
  onCancelMovement,
  userRole
}) => {
  const [subTab, setSubTab] = useState<'outing' | 'bermalam' | 'keluar' | 'semua' | 'permohonan'>('outing');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState<{ student: Student; status: StudentStatus } | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(() => {
    return loadParentRequests().filter(r => r.status === 'PENDING').length;
  });

  // Periodically refresh pending count for badge
  React.useEffect(() => {
    const check = () => {
      const all = loadParentRequests();
      setPendingRequestsCount(all.filter(r => r.status === 'PENDING').length);
    };
    check();
    window.addEventListener('ssemj_parent_requests_updated', check);
    const interval = setInterval(check, 3000);
    return () => {
      window.removeEventListener('ssemj_parent_requests_updated', check);
      clearInterval(interval);
    };
  }, []);

  // Helper to safely get student status with/without dashes
  const getStatus = (kp: string) => {
    return statuses[kp] || statuses[kp.replace(/[\s-]/g, '')];
  };

  // Active outing students
  const activeOutings = students
    .filter(s => getStatus(s.kp)?.status === 'OUTING')
    .map(s => ({ s, st: getStatus(s.kp)! }))
    .sort((a, b) => a.st.since - b.st.since);

  // Active bermalam students
  const activeBermalam = students
    .filter(s => getStatus(s.kp)?.status === 'BERMALAM')
    .map(s => ({ s, st: getStatus(s.kp)! }))
    .sort((a, b) => a.st.since - b.st.since);

  // Active aktiviti luar / lawatan students
  const activeKeluar = students
    .filter(s => getStatus(s.kp)?.status === 'KELUAR')
    .map(s => ({ s, st: getStatus(s.kp)! }))
    .sort((a, b) => a.st.since - b.st.since);

  // Semua pelajar di luar asrama
  const allActiveOutside = [...activeOutings, ...activeBermalam, ...activeKeluar]
    .sort((a, b) => a.st.since - b.st.since);

  const getSourceList = () => {
    switch (subTab) {
      case 'outing': return activeOutings;
      case 'bermalam': return activeBermalam;
      case 'keluar': return activeKeluar;
      case 'semua': return allActiveOutside;
      default: return [];
    }
  };

  const displayedList = getSourceList().filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toUpperCase();
    return (
      item.s.nama.toUpperCase().includes(q) ||
      (item.st.dest && item.st.dest.toUpperCase().includes(q)) ||
      (item.s.kelas && item.s.kelas.toUpperCase().includes(q))
    );
  });

  const overdueCount = activeOutings.filter(item => isOutingOverdue(item.st.expectedReturn)).length;

  return (
    <div className="space-y-4">
      
      {/* Top Header & Sub-tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-sm">
        
        {/* Sub-tabs switch */}
        <div className="flex flex-wrap p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
          <button
            onClick={() => setSubTab('outing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'outing'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Outing ({activeOutings.length})</span>
            {overdueCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setSubTab('bermalam')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'bermalam'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Bermalam ({activeBermalam.length})</span>
          </button>

          <button
            onClick={() => setSubTab('keluar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'keluar'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Lawatan / Aktiviti Luar ({activeKeluar.length})</span>
          </button>

          <button
            onClick={() => setSubTab('semua')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'semua'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Semua Di Luar ({allActiveOutside.length})</span>
          </button>

          <button
            onClick={() => setSubTab('permohonan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'permohonan'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Permohonan Waris</span>
            {pendingRequestsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                subTab === 'permohonan' ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-white animate-pulse'
              }`}>
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* Search within outing or action buttons */}
        <div className="flex items-center gap-2">
          {subTab !== 'permohonan' ? (
            <>
              <div className="relative flex-1 sm:w-60">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tapis nama / destinasi..."
                  className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Bulk check-in return button */}
              <button
                onClick={onBulkReturnOuting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-semibold whitespace-nowrap shadow-2xs"
                title="Sahkan murid kembali ke asrama secara pukal (waktu petang / tamat kelas / outing)"
              >
                <Home className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pulang Pukal</span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenParentPortal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold whitespace-nowrap shadow-xs transition-colors"
            >
              <span>Portal Waris (Borang Ibu Bapa)</span>
            </button>
          )}
        </div>

      </div>

      {/* MAIN CONTENT DISPLAY */}
      {subTab === 'permohonan' ? (
        <ParentRequestsManager
          students={students}
          currentWarden={currentWarden}
          onOpenGatePass={onOpenGatePass}
          onOpenParentPortal={onOpenParentPortal}
          onShowToast={onShowToast || (() => {})}
          onApproveAndCheckOut={onApproveAndCheckOut}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {displayedList.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {displayedList.map(({ s, st }) => {
              const isOverdue = subTab === 'outing' && isOutingOverdue(st.expectedReturn);
              const cleanPhone = s.telWaris?.replace(/[^0-9]/g, '');

              return (
                <div 
                  key={s.kp} 
                  className={`p-4 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isOverdue ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-blue-50/50'
                  }`}
                >
                  {/* Left: Student particulars */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div 
                      onClick={() => onSelectStudent(s)}
                      className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center font-bold text-sm text-white flex-shrink-0 cursor-pointer shadow-xs relative"
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

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 
                          onClick={() => onSelectStudent(s)}
                          className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer truncate"
                        >
                          {s.nama}
                        </h4>
                        {isOverdue && (
                          <span className="bg-rose-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex-shrink-0 shadow-xs">
                            LEWAT
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5 flex flex-wrap items-center gap-2 font-mono">
                        <span>{s.kelas}</span>
                        <span>&middot;</span>
                        <span>{s.dorm}</span>
                        <span>&middot;</span>
                        <span className="text-slate-400">KP: {s.kp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Destination & timing */}
                  <div className="flex-1 text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 w-full md:w-auto">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        st.status === 'BERMALAM'
                          ? 'bg-blue-100 text-blue-800'
                          : st.status === 'KELUAR'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {st.status === 'BERMALAM' ? 'Bermalam' : st.status === 'KELUAR' ? 'Lawatan / Luar' : 'Outing'}
                      </span>
                      <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-1" />
                      <span className="font-semibold text-slate-900 truncate">
                        {st.dest || 'Tiada destinasi dinyatakan'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono gap-2 pt-0.5">
                      <span>Keluar: {formatDateTime(st.since)} ({getRelativeTime(st.since)})</span>
                      <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-amber-600 font-medium'}>
                        Dijangka Pulang: {st.expectedReturn || '—'}
                      </span>
                    </div>

                    {st.guardianName && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-0.5">
                        <span>Waris: {st.guardianName} ({st.guardianPhone || s.telWaris})</span>
                        {st.transport && <span>&middot; Pengangkutan: {st.transport}</span>}
                      </div>
                    )}
                    {st.transport && !st.guardianName && (
                      <div className="text-[10px] text-slate-500 pt-0.5">
                        Catatan: {st.transport}
                      </div>
                    )}
                  </div>

                  {/* Right: Quick actions & contact */}
                  <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                    {cleanPhone && (
                      <>
                        <a
                          href={`https://wa.me/6${cleanPhone}?text=Assalamualaikum%20waris%20${encodeURIComponent(s.nama)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all shadow-xs"
                          title="WhatsApp Waris"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`tel:${cleanPhone}`}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-xs"
                          title="Hubungi Telefon Waris"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                        </a>
                      </>
                    )}

                    <button
                      onClick={() => onOpenGatePass(s)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-xs"
                      title="Lihat Pas Pelepasan Pagar"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                    </button>

                    {onUpdateStudentStatus && (
                      <button
                        type="button"
                        onClick={() => setEditingStudent({ student: s, status: st })}
                        className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all shadow-xs flex items-center gap-1"
                        title="Edit / Betulkan Kesilapan Rekod"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                        <span className="hidden sm:inline text-[10px] font-bold">Edit</span>
                      </button>
                    )}

                    {st.status === 'BERMALAM' ? (
                      <button
                        onClick={() => onEndBermalam(s)}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                      >
                        <Home className="w-3.5 h-3.5" />
                        <span>Daftar Masuk</span>
                      </button>
                    ) : st.status === 'KELUAR' ? (
                      <button
                        onClick={() => (onEndKeluar ? onEndKeluar(s) : onEndOuting(s))}
                        className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sahkan Pulang</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onEndOuting(s)}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sahkan Pulang</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Compass className="w-10 h-10 mx-auto text-slate-400 stroke-[1.5]" />
            <div className="text-sm font-semibold text-slate-700">
              {subTab === 'outing' 
                ? 'Tiada murid sedang outing pada masa ini.' 
                : subTab === 'bermalam'
                ? 'Tiada murid mempunyai kebenaran pulang bermalam aktif.'
                : subTab === 'keluar'
                ? 'Tiada murid sedang keluar untuk aktiviti luar / lawatan.'
                : 'Tiada murid di luar kawasan asrama pada masa ini.'}
            </div>
            <p className="text-xs text-slate-500">
              Semua murid yang berkaitan berada di dalam asrama atau direkodkan dengan selamat.
            </p>
          </div>
        )}
      </div>
      )}

      {/* Edit Movement Modal for correcting records */}
      <EditMovementModal
        isOpen={!!editingStudent}
        student={editingStudent?.student || null}
        status={editingStudent?.status}
        wardenName={currentWarden?.nama || 'Warden Bertugas'}
        onClose={() => setEditingStudent(null)}
        onSave={(st, data, note) => {
          if (onUpdateStudentStatus) {
            onUpdateStudentStatus(st, data, note);
          }
          setEditingStudent(null);
        }}
        onCancelMovement={(st, reason) => {
          if (onCancelMovement) {
            onCancelMovement(st, reason);
          }
          setEditingStudent(null);
        }}
      />

    </div>
  );
};
