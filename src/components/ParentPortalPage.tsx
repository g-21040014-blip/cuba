import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Search, 
  Calendar, 
  Clock, 
  Car, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ShieldCheck,
  ChevronRight,
  Sparkles,
  QrCode,
  Share2,
  Copy,
  Check,
  Info,
  ArrowLeft,
  X,
  ExternalLink
} from 'lucide-react';
import { RealQrCode } from './RealQrCode';
import { DuitNowQrCard } from './DuitNowQrCard';
import { Student, ParentRequestType, ParentRequest } from '../types/hostel';
import { createParentRequest, loadParentRequests } from '../services/parentRequestsService';

interface ParentPortalPageProps {
  students: Student[];
}

export const ParentPortalPage: React.FC<ParentPortalPageProps> = ({ students }) => {
  const [activeTab, setActiveTab] = useState<'mohon' | 'semak' | 'panduan'>('mohon');
  
  // Search student for new request
  const [searchKp, setSearchKp] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  
  // Form fields
  const [requestType, setRequestType] = useState<ParentRequestType>('OUTING');
  const [tarikhKeluar, setTarikhKeluar] = useState(() => new Date().toISOString().split('T')[0]);
  const [masaKeluar, setMasaKeluar] = useState('14:00');
  const [tarikhKembali, setTarikhKembali] = useState(() => new Date().toISOString().split('T')[0]);
  const [masaKembali, setMasaKembali] = useState('18:30');
  const [namaPenjaga, setNamaPenjaga] = useState('');
  const [telPenjaga, setTelPenjaga] = useState('');
  const [hubungan, setHubungan] = useState('Ibu');
  const [noKenderaan, setNoKenderaan] = useState('');
  const [sebab, setSebab] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // Submission result state
  const [submittedRequest, setSubmittedRequest] = useState<ParentRequest | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Status check tab state
  const [checkQuery, setCheckQuery] = useState('');
  const [checkResults, setCheckResults] = useState<ParentRequest[]>([]);
  const [hasSearchedStatus, setHasSearchedStatus] = useState(false);

  // Check URL params on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('id');
    const kp = params.get('kp');
    if (ref || kp) {
      setActiveTab('semak');
      const q = ref || kp || '';
      setCheckQuery(q);
      const all = loadParentRequests();
      const cleanQ = q.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const results = all.filter(r => {
        const rKp = r.studentKp.replace(/[^0-9]/g, '');
        const rId = r.id.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const rName = r.studentNama.toUpperCase();
        return rKp.includes(cleanQ) || rId.includes(cleanQ) || rName.includes(q.trim().toUpperCase());
      });
      setCheckResults(results);
      setHasSearchedStatus(true);
    }
  }, []);

  // Live filter for student selection (Carian Nama Sahaja)
  const handleStudentSearch = (val: string) => {
    setSearchKp(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    const clean = val.trim().toLowerCase();
    const found = students.filter(s => {
      return s.nama.toLowerCase().includes(clean);
    }).slice(0, 6);
    setSearchResults(found);
  };

  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    setSearchKp(s.nama);
    setSearchResults([]);
    if (s.namaWaris && !namaPenjaga) setNamaPenjaga(s.namaWaris);
    if (s.telWaris && !telPenjaga) setTelPenjaga(s.telWaris);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Sila buat carian dan pilih murid daripada senarai cadangan.');
      return;
    }
    if (!agreeTerms) {
      alert('Sila tandakan persetujuan pengakuan penjaga sebelum menghantar.');
      return;
    }

    const newReq = createParentRequest({
      studentKp: selectedStudent.kp,
      studentNama: selectedStudent.nama,
      studentKelas: selectedStudent.kelas,
      studentDorm: selectedStudent.dorm || 'Asrama SSeMJ',
      type: requestType,
      tarikhKeluar,
      masaKeluar,
      tarikhKembali,
      masaKembali,
      namaPenjaga: namaPenjaga.toUpperCase(),
      telPenjaga,
      hubungan,
      noKenderaan: noKenderaan.toUpperCase(),
      sebab,
    });

    setSubmittedRequest(newReq);
  };

  const handleCheckStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkQuery.trim()) return;

    const all = loadParentRequests();
    const cleanQ = checkQuery.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    const results = all.filter(r => {
      const rKp = r.studentKp.replace(/[^0-9]/g, '');
      const rId = r.id.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const rName = r.studentNama.toUpperCase();
      return rKp.includes(cleanQ) || rId.includes(cleanQ) || rName.includes(checkQuery.trim().toUpperCase());
    });

    setCheckResults(results);
    setHasSearchedStatus(true);
  };

  const handleCopyPortalLink = () => {
    const url = `${window.location.origin}/waris`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col selection:bg-blue-500/20 selection:text-blue-900 font-sans">
      
      {/* TOP BRANDING BAR */}
      <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-b border-blue-800/40 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl p-1 shadow-md flex items-center justify-center flex-shrink-0">
              <img src="/logo_ssemj_original.jpg" alt="Logo SSeMJ" className="h-full w-auto object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase border border-blue-400/30">
                  <ShieldCheck className="w-3 h-3 text-blue-300" />
                  Portal Waris &amp; Penjaga
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white line-clamp-1">
                Sistem Pengurusan Asrama SSeMJ
              </h1>
              <p className="text-[11px] sm:text-xs text-blue-200 hidden sm:block">
                Permohonan Outing &amp; Pulang Bermalam Rasmi Sekolah Seni Malaysia Johor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCopyPortalLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-800/80 hover:bg-blue-700 text-blue-100 hover:text-white rounded-xl text-xs font-semibold border border-blue-700/60 transition-all shadow-xs"
              title="Salin pautan Portal Waris untuk simpanan atau perkongsian"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-blue-200" />}
              <span className="hidden sm:inline">{copiedLink ? 'Pautan Disalin!' : 'Kongsi Pautan'}</span>
            </button>
            <a
              href="/"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition-all"
              title="Kembali ke Laman Log Masuk Staf/Warden"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Log Masuk Staf</span>
            </a>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="max-w-4xl mx-auto px-4 pb-2 pt-1">
          <div className="flex bg-blue-950/60 p-1 rounded-xl border border-blue-800/40 gap-1">
            <button
              onClick={() => {
                setActiveTab('mohon');
                setSubmittedRequest(null);
              }}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'mohon'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-blue-200 hover:text-white hover:bg-blue-800/40'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Borang Permohonan Baharu</span>
            </button>
            <button
              onClick={() => setActiveTab('semak')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'semak'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-blue-200 hover:text-white hover:bg-blue-800/40'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Semak Status Permohonan</span>
            </button>
            <button
              onClick={() => setActiveTab('panduan')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'panduan'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-blue-200 hover:text-white hover:bg-blue-800/40'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Panduan &amp; Peraturan</span>
              <span className="sm:hidden">Panduan</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* TAB 1: MOHON BARU */}
        {activeTab === 'mohon' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {submittedRequest ? (
              /* SUCCESS NOTIFICATION */
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-200 shadow-lg text-center space-y-5">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <span className="inline-block px-3.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold mb-3 shadow-xs">
                    ⏳ Status: Menunggu Kelulusan Warden
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Permohonan Berjaya Dihantar!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto">
                    Permohonan anda telah direkodkan ke dalam sistem dan dihantar terus kepada Warden Bertugas untuk semakan &amp; kelulusan rasmi.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs sm:text-sm space-y-2.5 max-w-md mx-auto font-mono shadow-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-sans">No. Rujukan:</span>
                    <span className="font-bold text-blue-700">{submittedRequest.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-sans">Nama Murid:</span>
                    <span className="font-bold text-slate-900 text-right">{submittedRequest.studentNama}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-sans">Jenis Permohonan:</span>
                    <span className="font-bold text-amber-700">
                      {submittedRequest.type === 'OUTING' ? 'Outing Harian' : 'Pulang Bermalam'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500 font-sans">Tarikh Keluar:</span>
                    <span className="font-bold text-slate-800">{submittedRequest.tarikhKeluar} ({submittedRequest.masaKeluar})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Tarikh Kembali:</span>
                    <span className="font-bold text-slate-800">{submittedRequest.tarikhKembali} ({submittedRequest.masaKembali})</span>
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                  <button
                    onClick={() => {
                      setCheckQuery(submittedRequest.id);
                      setActiveTab('semak');
                      const all = loadParentRequests();
                      setCheckResults(all.filter(r => r.id === submittedRequest.id));
                      setHasSearchedStatus(true);
                    }}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Semak Status Sekarang</span>
                  </button>
                  <button
                    onClick={() => {
                      setSubmittedRequest(null);
                      setSelectedStudent(null);
                      setSearchKp('');
                    }}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 transition-all"
                  >
                    Hantar Permohonan Lain
                  </button>
                </div>
              </div>
            ) : (
              /* BORANG PERMOHONAN */
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8 space-y-6">
                
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Borang Permohonan Keluar Asrama
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Sila lengkapkan butiran anak jagaan dan maklumat keluar/masuk asrama untuk kelulusan pihak pengurusan.
                  </p>
                </div>

                {/* 1. PILIH MURID / CARIAN NAMA */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    1. Carian Nama Murid *
                  </label>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={searchKp}
                      onChange={e => handleStudentSearch(e.target.value)}
                      placeholder="Taip nama anak (cth: AHMAD, SITI, DANISH)..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pl-10 text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    {selectedStudent && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudent(null);
                          setSearchKp('');
                        }}
                        className="absolute right-3 top-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete suggestions dropdown */}
                  {searchResults.length > 0 && !selectedStudent && (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-150">
                      <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                        Cadangan Murid ({searchResults.length})
                      </div>
                      {searchResults.map(s => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectStudent(s)}
                          className="p-3 hover:bg-blue-50/80 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300">
                              {s.photo || s.gambar ? (
                                <img src={s.photo || s.gambar} alt={s.nama} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">
                                  {s.nama.slice(0, 2)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{s.nama}</div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                Tingkatan {s.tingkatan} &middot; {s.kelas}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                            Pilih <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Kad Murid Terpilih */}
                  {selectedStudent && (
                    <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 overflow-hidden flex-shrink-0">
                        {selectedStudent.photo || selectedStudent.gambar ? (
                          <img src={selectedStudent.photo || selectedStudent.gambar} alt={selectedStudent.nama} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-blue-700">
                            {selectedStudent.nama.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono text-[10px] font-bold">
                            Tingkatan {selectedStudent.tingkatan}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">{selectedStudent.kelas}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 truncate mt-0.5">{selectedStudent.nama}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Dorm: {selectedStudent.dorm || 'Asrama SSeMJ'}
                        </p>
                      </div>
                      <span className="text-emerald-600 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Disahkan
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. JENIS PERMOHONAN */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    2. Jenis Permohonan *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRequestType('OUTING');
                        setTarikhKembali(tarikhKeluar);
                        setMasaKembali('18:30');
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        requestType === 'OUTING'
                          ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/40 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${requestType === 'OUTING' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">Outing Harian</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Keluar pada hari yang sama (Maksimum pulang sebelum 6:30 PM)
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRequestType('BERMALAM');
                        const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
                        setTarikhKembali(tomorrow);
                        setMasaKembali('18:00');
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        requestType === 'BERMALAM'
                          ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/40 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${requestType === 'BERMALAM' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">Pulang Bermalam</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Bermalam di rumah keluarga (Hujung minggu / Cuti peristiwa)
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. TARIKH & MASA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Waktu Keluar *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">Tarikh:</span>
                        <input
                          type="date"
                          required
                          value={tarikhKeluar}
                          onChange={e => {
                            setTarikhKeluar(e.target.value);
                            if (requestType === 'OUTING') setTarikhKembali(e.target.value);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">Masa:</span>
                        <input
                          type="time"
                          required
                          value={masaKeluar}
                          onChange={e => setMasaKeluar(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Waktu Kembali ke Asrama *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">Tarikh:</span>
                        <input
                          type="date"
                          required
                          value={tarikhKembali}
                          onChange={e => setTarikhKembali(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">Masa:</span>
                        <input
                          type="time"
                          required
                          value={masaKembali}
                          onChange={e => setMasaKembali(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. BUTIRAN PENJAGA & KENDERAAN */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    4. Butiran Penjaga / Pembawa *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-slate-600 block mb-1">Nama Penuh Penjaga:</span>
                      <input
                        type="text"
                        required
                        value={namaPenjaga}
                        onChange={e => setNamaPenjaga(e.target.value)}
                        placeholder="Cth: AZMAN BIN AHMAD"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-600 block mb-1">No. Telefon WhatsApp Penjaga:</span>
                      <input
                        type="tel"
                        required
                        value={telPenjaga}
                        onChange={e => setTelPenjaga(e.target.value)}
                        placeholder="Cth: 012-3456789"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-600 block mb-1">Hubungan dengan Murid:</span>
                      <select
                        value={hubungan}
                        onChange={e => setHubungan(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                      >
                        <option value="Ibu">Ibu Kandung</option>
                        <option value="Bapa">Bapa Kandung</option>
                        <option value="Penjaga Sah">Penjaga Sah</option>
                        <option value="Abang/Kakak">Abang / Kakak</option>
                        <option value="Datuk/Nenek">Datuk / Nenek</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-xs text-slate-600 block mb-1">No. Pendaftaran Kenderaan (Plat Kereta):</span>
                      <input
                        type="text"
                        required
                        value={noKenderaan}
                        onChange={e => setNoKenderaan(e.target.value)}
                        placeholder="Cth: JMD 1234"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. SEBAB KELUAR */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    5. Sebab Permohonan / Catatan *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={sebab}
                    onChange={e => setSebab(e.target.value)}
                    placeholder="Nyatakan sebab permohonan (cth: Membeli keperluan peralatan seni &amp; pakaian asrama / Pulang kenduri keluarga)..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {/* 6. PENGAKUAN & PERSETUJUAN */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={e => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>
                      Saya dengan ini mengesahkan bahawa segala maklumat di atas adalah benar. Saya bertanggungjawab sepenuhnya atas keselamatan, kebajikan, dan disiplin anak jagaan saya sepanjang tempoh berada di luar asrama.
                    </span>
                  </label>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Hantar Permohonan ke Warden Bertugas</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: SEMAK STATUS PERMOHONAN */}
        {activeTab === 'semak' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  Semak Status Permohonan Waris
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan No. Kad Pengenalan anak (12 digit) atau No. Rujukan Permohonan (cth: REQ-2026...) untuk melihat kelulusan Warden.
                </p>
              </div>

              <form onSubmit={handleCheckStatus} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={checkQuery}
                    onChange={e => setCheckQuery(e.target.value)}
                    placeholder="No. Kad Pengenalan (tanpa tanda sempang) atau No. Rujukan..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 pl-10 text-xs sm:text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>Cari</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* RESULTS LIST */}
            {hasSearchedStatus && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-mono">
                  <span>Hasil Carian ({checkResults.length} rekod dijumpai):</span>
                </div>

                {checkResults.length === 0 ? (
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <Search className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-slate-800 text-sm">Tiada Rekod Dijumpai</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Sila pastikan No. Kad Pengenalan atau No. Rujukan yang dimasukkan adalah tepat, atau hantar permohonan baharu sekiranya belum memohon.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {checkResults.map(req => {
                      const isApproved = req.status === 'APPROVED';
                      const isPending = req.status === 'PENDING';
                      const isRejected = req.status === 'REJECTED';

                      return (
                        <div 
                          key={req.id} 
                          className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-sm space-y-4 transition-all ${
                            isApproved 
                              ? 'border-emerald-300 ring-2 ring-emerald-100' 
                              : isPending 
                              ? 'border-amber-300 ring-2 ring-amber-100' 
                              : 'border-rose-300'
                          }`}
                        >
                          {/* Card Header with Status Badge */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-500">#{req.id}</span>
                                <span className="text-xs text-slate-400">&bull;</span>
                                <span className="text-xs text-slate-500 font-mono">{new Date(req.createdAt).toLocaleDateString('ms-MY')}</span>
                              </div>
                              <h3 className="text-base font-bold text-slate-900 mt-0.5">{req.studentNama}</h3>
                              <p className="text-xs text-slate-500 font-mono">
                                Kelas: {req.studentKelas} &middot; KP: {req.studentKp}
                              </p>
                            </div>

                            <div className="flex-shrink-0">
                              {isApproved && (
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-xs">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  DILULUSKAN
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold shadow-xs animate-pulse">
                                  <Clock className="w-4 h-4 text-amber-600" />
                                  MENUNGGU KELULUSAN
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold shadow-xs">
                                  <AlertCircle className="w-4 h-4 text-rose-600" />
                                  TIDAK DILULUSKAN
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Request Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl font-mono">
                            <div>
                              <span className="text-slate-500 block text-[11px]">Jenis:</span>
                              <b className="text-slate-800">{req.type === 'OUTING' ? 'Outing Harian' : 'Pulang Bermalam'}</b>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">Waktu Keluar:</span>
                              <b className="text-slate-800">{req.tarikhKeluar} {req.masaKeluar}</b>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">Waktu Kembali:</span>
                              <b className="text-slate-800">{req.tarikhKembali} {req.masaKembali}</b>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">Kenderaan:</span>
                              <b className="text-slate-800">{req.noKenderaan}</b>
                            </div>
                          </div>

                          {/* REJECTION REASON IF APPLICABLE */}
                          {isRejected && req.rejectionReason && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                              <b>Catatan Penolakan Warden:</b> {req.rejectionReason}
                            </div>
                          )}

                          {/* DIGITAL GATE PASS (IF APPROVED) */}
                          {isApproved && (
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-white p-0.5 shadow-xs flex items-center justify-center shrink-0">
                                    <img src="/logo_ssemj_original.jpg" alt="Logo SSeMJ" className="h-full w-auto object-contain" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold tracking-wider uppercase text-emerald-100 block">
                                      Pas Pelepasan Digital Rasmi
                                    </span>
                                    <span className="text-[10px] text-emerald-200 block">Sekolah Seni Malaysia Johor</span>
                                  </div>
                                </div>
                                <span className="font-mono text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-lg border border-white/20 shadow-xs">
                                  {req.passId || 'PASS-AUTHORIZED'}
                                </span>
                              </div>

                              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-emerald-100">Diluluskan Oleh:</span>
                                  <span className="font-bold">{req.reviewedBy || 'Warden Bertugas'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-emerald-100">Waktu Kelulusan:</span>
                                  <span className="font-mono">{req.reviewedAt ? new Date(req.reviewedAt).toLocaleTimeString('ms-MY') : '-'}</span>
                                </div>
                              </div>

                              {/* DuitNow Style Official Verification Pass Card */}
                              <div className="py-2 flex flex-col items-center">
                                <DuitNowQrCard
                                  title={selectedStudent.nama}
                                  subtitle={`${selectedStudent.kelas} (${selectedStudent.bidang})`}
                                  qrValue={`PAS DIGITAL SSeMJ\nNo: ${req.passId || 'SAH'}\nMurid: ${selectedStudent.nama}\nNo. KP: ${selectedStudent.kp}\nJenis: ${req.type}\nStatus: DILULUSKAN\nOleh: ${req.reviewedBy || 'Warden'}`}
                                  codeNumber={req.passId || 'PAS-SAH'}
                                  bannerText="PAS PELEPASAN DIGITAL SSeMJ"
                                  footerNote="Tunjukkan kad QR ini kepada Pengawal Keselamatan di pintu pagar"
                                  compact
                                />
                              </div>

                              <div className="text-[11px] text-emerald-100 text-center italic">
                                &ldquo;Sila tunjukkan paparan pas digital bergaya DuitNow ini kepada Pengawal Keselamatan di pondok pengawal semasa mengambil atau menghantar murid.&rdquo;
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PANDUAN & SYARAT */}
        {activeTab === 'panduan' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Peraturan &amp; Waktu Pelepasan Asrama SSeMJ
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Panduan rasmi bagi ibu bapa dan penjaga murid Sekolah Seni Malaysia Johor.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <Clock className="w-4 h-4 text-amber-700" />
                    Waktu Outing Harian
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                    <li>Dibenarkan pada hari <b>Sabtu &amp; Ahad sahaja</b>.</li>
                    <li>Waktu keluar: Bermula jam <b>11:00 Pagi</b>.</li>
                    <li>Waktu wajib kembali: Sebelum jam <b>5:30 Petang</b>.</li>
                    <li>Murid wajib memakai pakaian rasmi atau pakaian outing asrama yang kemas.</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                    <Car className="w-4 h-4 text-blue-700" />
                    Syarat Pulang Bermalam
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                    <li>Hanya pada hujung minggu yang dibenarkan atau cuti peristiwa/penggal.</li>
                    <li>Waktu keluar: <b>Jumaat (selepas jam 12:30 tengah hari)</b> atau Sabtu pagi.</li>
                    <li>Waktu kembali: <b>Ahad sebelum jam 5:30 Petang</b> untuk Solat Maghrib berjemaah.</li>
                    <li>Hanya ibu bapa atau penjaga yang berdaftar sahaja dibenarkan menjemput.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Etika &amp; Prosedur Pengawal Keselamatan
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Semasa tiba di pondok pengawal, penjaga diminta menunjukkan <b>Pas Pelepasan Digital</b> yang telah berstatus <b>DILULUSKAN</b> di skrin telefon pintar anda atau menyebut nama penuh murid kepada anggota pengawal bertugas.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-700">
            Sekolah Seni Malaysia Johor &middot; Sistem Pengurusan Asrama SSeMJ
          </p>
          <p className="text-[11px] text-slate-400">
            Hak Cipta Terpelihara &copy; {new Date().getFullYear()}. Dibangunkan untuk kemudahan ibu bapa &amp; waris murid.
          </p>
        </div>
      </footer>

    </div>
  );
};
