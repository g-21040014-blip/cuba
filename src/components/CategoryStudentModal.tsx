import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  DoorOpen, 
  HeartPulse, 
  GraduationCap, 
  Users, 
  Clock, 
  Compass 
} from 'lucide-react';
import { Student, StudentStatus } from '../types/hostel';

export type CategoryType = 'TOTAL' | 'KELUAR' | 'KUARANTIN' | 'HADIR_KELAS' | 'DALAM' | 'OUTING' | 'BERMALAM';

interface CategoryStudentModalProps {
  isOpen: boolean;
  category: CategoryType | null;
  onClose: () => void;
  students: Student[];
  statuses: Record<string, StudentStatus>;
  onSelectStudent?: (student: Student) => void;
}

export const CategoryStudentModal: React.FC<CategoryStudentModalProps> = ({
  isOpen,
  category,
  onClose,
  students,
  statuses,
  onSelectStudent
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  // Reset search when modal opens or category changes
  useEffect(() => {
    if (isOpen) {
      setSearchFilter('');
    }
  }, [isOpen, category]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !category) return null;

  const getFilteredStudents = () => {
    if (!students || !category) return [];

    let list: Student[] = [];

    if (category === 'TOTAL') {
      list = [...students];
    } else if (category === 'KELUAR') {
      list = students.filter(s => (statuses?.[s.kp]?.status || (s.kp ? statuses?.[s.kp.replace(/[\s-]/g, '')]?.status : undefined)) === 'KELUAR');
    } else if (category === 'KUARANTIN') {
      list = students.filter(s => (statuses?.[s.kp]?.status || (s.kp ? statuses?.[s.kp.replace(/[\s-]/g, '')]?.status : undefined)) === 'KUARANTIN');
    } else if (category === 'HADIR_KELAS') {
      list = students.filter(s => {
        const st = statuses?.[s.kp]?.status || (s.kp ? statuses?.[s.kp.replace(/[\s-]/g, '')]?.status : undefined) || 'DALAM';
        return st !== 'BERMALAM' && st !== 'OUTING' && st !== 'KUARANTIN';
      });
    } else if (category === 'DALAM') {
      list = students.filter(s => (statuses?.[s.kp]?.status || (s.kp ? statuses?.[s.kp.replace(/[\s-]/g, '')]?.status : undefined) || 'DALAM') === 'DALAM');
    } else if (category === 'OUTING') {
      list = students.filter(s => (statuses?.[s.kp]?.status || (s.kp ? statuses?.[s.kp.replace(/[\s-]/g, '')]?.status : undefined)) === 'OUTING');
    } else if (category === 'BERMALAM') {
      list = students.filter(s => (statuses?.[s.kp]?.status || (s.kp ? statuses?.[s.kp.replace(/[\s-]/g, '')]?.status : undefined)) === 'BERMALAM');
    }

    if (!searchFilter.trim()) return list;

    const q = searchFilter.toLowerCase();
    return list.filter(s => 
      s.nama?.toLowerCase().includes(q) ||
      s.kp?.toLowerCase().includes(q) ||
      s.kelas?.toLowerCase().includes(q) ||
      s.bidang?.toLowerCase().includes(q) ||
      Boolean(s.dorm && s.dorm.toLowerCase().includes(q))
    );
  };

  const filteredStudents = getFilteredStudents();

  const getCategoryTheme = () => {
    switch (category) {
      case 'TOTAL':
        return {
          headerBg: 'bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-700',
          title: 'Jumlah Keseluruhan Murid Berdaftar',
          subtitle: 'Senarai semua murid yang berdaftar dalam sistem asrama e-APPS',
          icon: <Users className="w-5 h-5" />
        };
      case 'KELUAR':
        return {
          headerBg: 'bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600',
          title: 'Maklumat Murid Keluar Asrama',
          subtitle: 'Murid yang sedang keluar bagi urusan luar / sekolah',
          icon: <DoorOpen className="w-5 h-5" />
        };
      case 'KUARANTIN':
        return {
          headerBg: 'bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-700',
          title: 'Maklumat Murid di Bilik Sakit / Kuarantin',
          subtitle: 'Murid yang sedang berehat atau dipantau tahap kesihatan',
          icon: <HeartPulse className="w-5 h-5" />
        };
      case 'HADIR_KELAS':
        return {
          headerBg: 'bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700',
          title: 'Maklumat Murid Hadir Sesi Kelas / Persekolahan',
          subtitle: 'Murid yang berada dalam asrama & bersedia hadir kelas',
          icon: <GraduationCap className="w-5 h-5" />
        };
      case 'DALAM':
        return {
          headerBg: 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800',
          title: 'Maklumat Murid Dalam Asrama',
          subtitle: 'Murid yang kini berada di dalam kawasan asrama SSeMJ',
          icon: <Users className="w-5 h-5" />
        };
      case 'OUTING':
        return {
          headerBg: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700',
          title: 'Maklumat Murid Sedang Outing',
          subtitle: 'Murid yang keluar outing harian bersama waris / penjaga',
          icon: <Clock className="w-5 h-5" />
        };
      case 'BERMALAM':
        return {
          headerBg: 'bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-900',
          title: 'Maklumat Murid Pulang Bermalam',
          subtitle: 'Murid yang pulang bermalam di rumah bersama keluarga',
          icon: <Compass className="w-5 h-5" />
        };
      default:
        return {
          headerBg: 'bg-gradient-to-r from-blue-800 to-indigo-800',
          title: 'Maklumat Murid',
          subtitle: 'Senarai maklumat status murid asrama',
          icon: <Users className="w-5 h-5" />
        };
    }
  };

  const theme = getCategoryTheme();

  // Render via portal directly to document.body to ensure it is in the absolute top layer
  return createPortal(
    <div 
      id="category-student-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="category-student-modal-container"
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 flex items-center justify-between text-white ${theme.headerBg}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white shadow-xs flex-shrink-0">
              {theme.icon}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight drop-shadow-xs">
                {theme.title}
              </h3>
              <p className="text-xs text-white/90 mt-0.5 font-medium">
                Jumlah: <span className="font-bold underline">{filteredStudents.length} murid</span> direkodkan
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-category-student-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
            title="Tutup (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Carian Input */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50/90">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="input-search-category-student"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari nama murid, no. KP, kelas, dorm atau bidang seni..."
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
              autoFocus
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                title="Padam carian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Senarai Murid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-slate-50/50 scrollbar-thin">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const st = statuses?.[student.kp] || (student.kp ? statuses?.[student.kp.replace(/[\s-]/g, '')] : undefined);
              return (
                <div
                  key={student.kp}
                  onClick={() => {
                    if (onSelectStudent) {
                      onSelectStudent(student);
                      onClose();
                    }
                  }}
                  className={`bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 flex items-start gap-3 transition-all shadow-2xs ${
                    onSelectStudent ? 'hover:border-blue-400 hover:shadow-md cursor-pointer active:scale-[0.99]' : ''
                  }`}
                >
                  {/* Avatar / Gambar */}
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200 shadow-2xs">
                    {student.photo || student.gambar ? (
                      <img
                        src={student.photo || student.gambar}
                        alt={student.nama}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span className="font-bold text-xs text-slate-600">
                        {student.nama?.slice(0, 2).toUpperCase() || 'M'}
                      </span>
                    )}
                  </div>

                  {/* Maklumat Murid */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {student.nama}
                      </h4>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0 border border-slate-200">
                        {student.kp}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-600 mt-1">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">{student.kelas}</span>
                      <span>&middot;</span>
                      <span className="text-purple-700 font-medium">{student.bidang}</span>
                      {student.dorm && (
                        <>
                          <span>&middot;</span>
                          <span className="text-slate-500">{student.dorm}</span>
                        </>
                      )}
                    </div>

                    {/* Butiran tambahan mengikut kategori */}
                    {category === 'KELUAR' && (
                      <div className="mt-2 text-[11px] bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5 text-orange-950 flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-orange-800">Tujuan:</span>
                          <span className="truncate">{st?.dest || st?.alasan || 'Aktiviti Luar / Sesi Sekolah'}</span>
                        </div>
                        {st?.expectedReturn && (
                          <span className="font-mono text-orange-700 font-bold bg-orange-100/80 px-2 py-0.5 rounded border border-orange-300">
                            Jangka Balik: {st.expectedReturn}
                          </span>
                        )}
                      </div>
                    )}

                    {category === 'KUARANTIN' && (
                      <div className="mt-2 text-[11px] bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1.5 text-purple-950 flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-purple-800">Sebab Rehat:</span>
                        <span>{st?.alasan || 'Demam / Rawatan Kesihatan di Bilik Sakit'}</span>
                      </div>
                    )}

                    {category === 'HADIR_KELAS' && (
                      <div className="mt-2 text-[11px] bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1.5 text-teal-950 flex items-center justify-between">
                        <span>Sedia &amp; hadir sesi akademik &amp; kelas seni</span>
                        <span className="font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded border border-teal-300">Aktif</span>
                      </div>
                    )}

                    {category === 'OUTING' && (
                      <div className="mt-2 text-[11px] bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-amber-950 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-amber-800">Outing:</span>
                          <span className="truncate">{st?.dest || 'Pekan / Pulang Sementara'}</span>
                        </div>
                        {st?.expectedReturn && (
                          <span className="font-mono text-amber-700 font-bold bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                            Balik: {st.expectedReturn}
                          </span>
                        )}
                      </div>
                    )}

                    {category === 'BERMALAM' && (
                      <div className="mt-2 text-[11px] bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 text-blue-950 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-blue-800">Bermalam:</span>
                          <span className="truncate">{st?.alasan || st?.dest || 'Cuti Bersama Keluarga'}</span>
                        </div>
                        {st?.expectedReturn && (
                          <span className="font-mono text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded border border-blue-300">
                            Balik: {st.expectedReturn}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs sm:text-sm">
              Tiada murid dijumpai dalam kategori ini.
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 hidden sm:inline">
            {onSelectStudent ? 'Klik pada kad murid untuk melihat profil dan rekod penuh.' : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold rounded-xl transition-all cursor-pointer ml-auto"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
