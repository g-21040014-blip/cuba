import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Sparkles, 
  FileText, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  Home, 
  Phone,
  Layers,
  FileSpreadsheet,
  DownloadCloud
} from 'lucide-react';
import { Student, StudentStatus, StatusType, StreamType, Gender } from '../types/hostel';
import { 
  getStudentInitials, 
  getAvatarColor, 
  getStatusBadgeConfig, 
  getBidangColor, 
  getRelativeTime 
} from '../utils/helpers';

interface StudentListProps {
  students: Student[];
  statuses: Record<string, StudentStatus>;
  onSelectStudent: (student: Student) => void;
  onOpenGatePass: (student: Student) => void;
  onMarkMasuk: (student: Student) => void;
  onMarkKeluar: (student: Student) => void;
  onAddNewStudent: (student: Student) => void;
  onOpenGoogleSheets?: () => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  statuses,
  onSelectStudent,
  onOpenGatePass,
  onMarkMasuk,
  onMarkKeluar,
  onAddNewStudent,
  onOpenGoogleSheets
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTingkatan, setFilterTingkatan] = useState<string>('all');
  const [filterBidang, setFilterBidang] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterJantina, setFilterJantina] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Student Form State
  const [newKp, setNewKp] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newJantina, setNewJantina] = useState<Gender>('L');
  const [newKelas, setNewKelas] = useState('2 INANG');
  const [newBidang, setNewBidang] = useState<StreamType>('MUZIK');
  const [newKelasSeni, setNewKelasSeni] = useState('2 GEMERSIK');
  const [newTingkatan, setNewTingkatan] = useState<number>(2);
  const [newDorm, setNewDorm] = useState('Aspura Kasturi 1');
  const [newWaris, setNewWaris] = useState('');
  const [newTelWaris, setNewTelWaris] = useState('');

  // Filtering
  const filteredStudents = students.filter(s => {
    if (searchQuery) {
      const q = searchQuery.toUpperCase();
      const matchName = s.nama.toUpperCase().includes(q);
      const matchKp = s.kp.includes(q);
      const matchDorm = s.dorm?.toUpperCase().includes(q);
      if (!matchName && !matchKp && !matchDorm) return false;
    }
    if (filterTingkatan !== 'all' && s.tingkatan !== parseInt(filterTingkatan, 10)) return false;
    if (filterBidang !== 'all' && s.bidang !== filterBidang) return false;
    if (filterJantina !== 'all' && s.jantina !== filterJantina) return false;
    if (filterStatus !== 'all') {
      const currentSt = statuses[s.kp]?.status || (s.kp ? statuses[s.kp.replace(/[\s-]/g, '')]?.status : undefined) || 'DALAM';
      if (currentSt !== filterStatus) return false;
    }

    return true;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKp.trim() || !newNama.trim()) return;

    const student: Student = {
      id: `T${newTingkatan}-${Date.now().toString().slice(-3)}`,
      kp: newKp.trim().replace(/[\s-]/g, ''),
      nama: newNama.trim().toUpperCase(),
      jantina: newJantina,
      kelas: newKelas,
      bidang: newBidang,
      kelasSeni: newKelasSeni,
      gambar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      photo: null,
      tingkatan: newTingkatan,
      dorm: newDorm,
      namaWaris: newWaris.trim() || 'Waris Pelajar',
      telWaris: newTelWaris.trim() || '012-3456789'
    };

    onAddNewStudent(student);
    setIsAddModalOpen(false);
    // Reset
    setNewKp('');
    setNewNama('');
    setNewWaris('');
    setNewTelWaris('');
  };

  return (
    <div className="space-y-4">
      
      {/* Search & Filter Toolbars */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Main search bar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama murid, No. KP, atau bilik asrama..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 font-medium shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onOpenGoogleSheets && (
              <button
                type="button"
                onClick={onOpenGoogleSheets}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-semibold text-xs rounded-xl shadow-xs transition-all"
                title="Tarik atau segerakan data murid & foto dari Google Sheet"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Tarik dari Google Sheet</span>
                <span className="sm:hidden">Google Sheet</span>
              </button>
            )}

            {/* Add Student Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex-shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Murid Baru</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <select
              value={filterTingkatan}
              onChange={e => setFilterTingkatan(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">Semua Tingkatan</option>
              <option value="1">Tingkatan 1</option>
              <option value="2">Tingkatan 2</option>
              <option value="3">Tingkatan 3</option>
              <option value="4">Tingkatan 4</option>
              <option value="5">Tingkatan 5</option>
            </select>
          </div>

          <div>
            <select
              value={filterBidang}
              onChange={e => setFilterBidang(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">Semua Pengkhususan Seni</option>
              <option value="MUZIK">Muzik</option>
              <option value="TARI">Tari</option>
              <option value="TEATER">Teater</option>
              <option value="VISUAL">Seni Visual</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">Semua Status Pergerakan</option>
              <option value="DALAM">Dalam Asrama</option>
              <option value="KELUAR">Keluar Asrama</option>
              <option value="OUTING">Sedang Outing</option>
              <option value="BERMALAM">Pulang Bermalam</option>
              <option value="KUARANTIN">Bilik Sakit</option>
            </select>
          </div>

          <div>
            <select
              value={filterJantina}
              onChange={e => setFilterJantina(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">Semua Jantina</option>
              <option value="L">Lelaki (Aspura)</option>
              <option value="P">Perempuan (Aspuri)</option>
            </select>
          </div>
        </div>

        {/* Counter Bar */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-1 font-mono">
          <span>Memaparkan <b className="text-slate-800">{filteredStudents.length}</b> daripada {students.length} murid</span>
          {(searchQuery || filterTingkatan !== 'all' || filterBidang !== 'all' || filterStatus !== 'all' || filterJantina !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterTingkatan('all');
                setFilterBidang('all');
                setFilterStatus('all');
                setFilterJantina('all');
              }}
              className="text-blue-600 hover:text-blue-800 text-xs font-semibold underline"
            >
              Set Semula Penapis
            </button>
          )}
        </div>
      </div>

      {/* STUDENT TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Murid &amp; Pengenalan</th>
                <th className="py-3 px-3">Tingkatan &amp; Kelas</th>
                <th className="py-3 px-3">Bidang Seni</th>
                <th className="py-3 px-3">Bilik Asrama</th>
                <th className="py-3 px-3">Status Semasa</th>
                <th className="py-3 px-3">Kemaskini</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(s => {
                  const st = statuses[s.kp];
                  const stConfig = getStatusBadgeConfig(st?.status || 'DALAM');
                  const bConfig = getBidangColor(s.bidang);

                  return (
                    <tr 
                      key={s.kp} 
                      className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectStudent(s)}
                    >
                      {/* Name & Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center font-bold text-xs text-white flex-shrink-0 relative shadow-xs"
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
                            <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                              KP: {s.kp} &middot; <span className="text-slate-400">ID: {s.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800">{s.kelas}</span>
                        <div className="text-[10px] text-slate-500">Tingkatan {s.tingkatan}</div>
                      </td>

                      {/* Stream */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${bConfig.bg} ${bConfig.text} ${bConfig.border}`}>
                          {s.bidang}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{s.kelasSeni}</div>
                      </td>

                      {/* Dorm */}
                      <td className="py-3 px-3 text-slate-700 text-[11px]">
                        {s.dorm || 'Blok Utama'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${stConfig.bg} ${stConfig.text} ${stConfig.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stConfig.dot}`}></span>
                          {stConfig.label}
                        </span>
                      </td>

                      {/* Relative time */}
                      <td className="py-3 px-3 text-slate-500 text-[11px] font-mono">
                        {getRelativeTime(st?.since || Date.now())}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {st?.status !== 'DALAM' ? (
                            <button
                              onClick={() => onMarkMasuk(s)}
                              title="Tandakan Masuk Asrama"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all shadow-xs"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onMarkKeluar(s)}
                              title="Tandakan Keluar Asrama"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all shadow-xs"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenGatePass(s)}
                            title="Jana Pas Pelepasan Pagar"
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                          </button>

                          <button
                            onClick={() => onSelectStudent(s)}
                            title="Lihat Kad Pintar"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    Tiada murid ditemui mengikut kriteria carian anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: DAFTAR MURID BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                Pendaftaran Murid Asrama Baru
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-600 font-medium block mb-1">Nama Penuh Murid (Huruf Besar)</label>
                  <input
                    type="text"
                    required
                    value={newNama}
                    onChange={e => setNewNama(e.target.value)}
                    placeholder="Cth: MUHAMMAD FARIS BIN ISMAIL"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1">No. Kad Pengenalan (12 Digit)</label>
                  <input
                    type="text"
                    required
                    value={newKp}
                    onChange={e => setNewKp(e.target.value)}
                    placeholder="120101010101"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1">Jantina</label>
                  <select
                    value={newJantina}
                    onChange={e => setNewJantina(e.target.value as Gender)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                  >
                    <option value="L">Lelaki (Aspura)</option>
                    <option value="P">Perempuan (Aspuri)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1">Tingkatan</label>
                  <select
                    value={newTingkatan}
                    onChange={e => setNewTingkatan(parseInt(e.target.value, 10))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                  >
                    <option value={1}>Tingkatan 1</option>
                    <option value={2}>Tingkatan 2</option>
                    <option value={3}>Tingkatan 3</option>
                    <option value={4}>Tingkatan 4</option>
                    <option value={5}>Tingkatan 5</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1">Pengkhususan Seni</label>
                  <select
                    value={newBidang}
                    onChange={e => setNewBidang(e.target.value as StreamType)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                  >
                    <option value="MUZIK">Muzik</option>
                    <option value="TARI">Tari</option>
                    <option value="TEATER">Teater</option>
                    <option value="VISUAL">Seni Visual</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1">Kelas Akademik &amp; Seni</label>
                  <input
                    type="text"
                    value={newKelas}
                    onChange={e => setNewKelas(e.target.value)}
                    placeholder="Cth: 2 INANG"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1">Bilik / Blok Asrama</label>
                  <input
                    type="text"
                    value={newDorm}
                    onChange={e => setNewDorm(e.target.value)}
                    placeholder="Cth: Aspura Jebat 1"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1">Nama Ibu Bapa / Waris</label>
                  <input
                    type="text"
                    value={newWaris}
                    onChange={e => setNewWaris(e.target.value)}
                    placeholder="Nama Waris"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1">No. Telefon Waris</label>
                  <input
                    type="text"
                    value={newTelWaris}
                    onChange={e => setNewTelWaris(e.target.value)}
                    placeholder="012-3456789"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Daftar Murid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
