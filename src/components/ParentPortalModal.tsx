import React, { useState } from 'react';
import { 
  X, 
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
  Check
} from 'lucide-react';
import { Student, ParentRequestType, ParentRequest } from '../types/hostel';
import { createParentRequest, loadParentRequests } from '../services/parentRequestsService';

interface ParentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onRequestSubmitted?: () => void;
}

export const ParentPortalModal: React.FC<ParentPortalModalProps> = ({
  isOpen,
  onClose,
  students,
  onRequestSubmitted
}) => {
  const [activeTab, setActiveTab] = useState<'mohon' | 'semak'>('mohon');
  
  // Search student
  const [searchKp, setSearchKp] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
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

  if (!isOpen) return null;

  // Auto-search student by KP or name
  const handleStudentSearch = (val: string) => {
    setSearchKp(val);
    if (!val.trim()) {
      setSelectedStudent(null);
      return;
    }
    const clean = val.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = students.find(s => {
      const sKp = s.kp.toLowerCase().replace(/[^a-z0-9]/g, '');
      const sName = s.nama.toLowerCase();
      return sKp.includes(clean) || sName.includes(val.trim().toLowerCase());
    });
    if (found) {
      setSelectedStudent(found);
      if (found.namaWaris && !namaPenjaga) setNamaPenjaga(found.namaWaris);
      if (found.telWaris && !telPenjaga) setTelPenjaga(found.telWaris);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Sila buat carian dan pilih murid terlebih dahulu.');
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
    if (onRequestSubmitted) onRequestSubmitted();
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
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-5 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-md flex items-center justify-center flex-shrink-0">
              <img src="/logo_ssemj_original.jpg" alt="Logo" className="h-full w-auto object-contain" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[11px] font-semibold border border-blue-400/30 mb-1">
                <ShieldCheck className="w-3 h-3 text-blue-300" />
                <span>Portal Rasmi Waris / Ibu Bapa</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Permohonan Outing &amp; Pulang Bermalam
              </h2>
              <p className="text-xs text-blue-100">
                Sekolah Seni Malaysia Johor &middot; Terus ke Warden Bertugas
              </p>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setActiveTab('mohon');
                setSubmittedRequest(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'mohon'
                  ? 'bg-white text-blue-800 shadow-md'
                  : 'bg-blue-900/60 text-blue-200 hover:bg-blue-800/80'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Borang Permohonan Baharu</span>
            </button>
            <button
              onClick={() => setActiveTab('semak')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'semak'
                  ? 'bg-white text-blue-800 shadow-md'
                  : 'bg-blue-900/60 text-blue-200 hover:bg-blue-800/80'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Semak Status Permohonan</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50 space-y-5">

          {/* TAB 1: MOHON BARU */}
          {activeTab === 'mohon' && (
            <>
              {submittedRequest ? (
                /* SUCCESS NOTIFICATION */
                <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm text-center space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-xs font-bold mb-2">
                      ⏳ Status: Menunggu Kelulusan Warden
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      Permohonan Berjaya Dihantar!
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                      Permohonan anda telah direkodkan dalam sistem dan dihantar kepada Warden Bertugas untuk semakan &amp; kelulusan.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 max-w-md mx-auto font-mono">
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-500">No. Rujukan:</span>
                      <span className="font-bold text-blue-700">{submittedRequest.id}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-500">Nama Murid:</span>
                      <span className="font-bold text-slate-800">{submittedRequest.studentNama}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-500">Jenis:</span>
                      <span className="font-bold text-amber-700">
                        {submittedRequest.type === 'OUTING' ? 'Outing Harian' : 'Pulang Bermalam'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-500">Tarikh Keluar:</span>
                      <span className="font-bold text-slate-800">{submittedRequest.tarikhKeluar} ({submittedRequest.masaKeluar})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tarikh Kembali:</span>
                      <span className="font-bold text-slate-800">{submittedRequest.tarikhKembali} ({submittedRequest.masaKembali})</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => {
                        setSubmittedRequest(null);
                        setSelectedStudent(null);
                        setSearchKp('');
                        setSebab('');
                        setAgreeTerms(false);
                      }}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                    >
                      Hantar Permohonan Lain
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('semak');
                        setCheckQuery(submittedRequest.studentKp);
                        const all = loadParentRequests();
                        setCheckResults(all.filter(r => r.id === submittedRequest.id));
                        setHasSearchedStatus(true);
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all"
                    >
                      Semak Status Permohonan Ini
                    </button>
                  </div>
                </div>
              ) : (
                /* APPLICATION FORM */
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Step 1: Student Lookup */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px]">1</span>
                        <span>Cari Maklumat Murid / Anak</span>
                      </label>
                      <span className="text-[11px] text-slate-500">Masukkan No. KP atau Nama</span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={searchKp}
                        onChange={(e) => handleStudentSearch(e.target.value)}
                        placeholder="Contoh: 080215011234 atau nama murid..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        required
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    </div>

                    {/* Matched Student Card */}
                    {selectedStudent ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-200 flex items-center justify-center font-bold text-blue-800 flex-shrink-0 overflow-hidden text-sm">
                          {selectedStudent.gambar ? (
                            <img src={selectedStudent.gambar} alt="Murid" className="w-full h-full object-cover" />
                          ) : (
                            <span>{selectedStudent.nama.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-slate-900 truncate">
                              {selectedStudent.nama}
                            </h4>
                            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[10px] font-bold">
                              {selectedStudent.kelas}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            No. KP: <span className="font-mono">{selectedStudent.kp}</span> &middot; Dorm: {selectedStudent.dorm || 'Asrama SSeMJ'}
                          </p>
                        </div>
                        <div className="flex items-center text-emerald-600 text-xs font-semibold gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Disahkan</span>
                        </div>
                      </div>
                    ) : searchKp.trim().length > 2 ? (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Murid tidak dijumpai. Sila semak No. KP atau ejaan nama murid.</span>
                      </p>
                    ) : null}
                  </div>

                  {/* Step 2: Request Details */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px]">2</span>
                      <span>Jenis Permohonan &amp; Tarikh/Masa</span>
                    </label>

                    {/* Type selector */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRequestType('OUTING');
                          setTarikhKembali(tarikhKeluar);
                          setMasaKembali('18:30');
                        }}
                        className={`py-3 px-3 rounded-xl border-2 text-center transition-all ${
                          requestType === 'OUTING'
                            ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-xs'
                            : 'border-slate-200 text-slate-600 hover:border-amber-200'
                        }`}
                      >
                        <Clock className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                        <div className="text-xs font-bold">Outing Harian</div>
                        <div className="text-[10px] text-slate-500 font-normal">Balik hari yang sama</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRequestType('BERMALAM');
                          // set default return to 2 days later
                          const nextDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
                          setTarikhKembali(nextDate);
                          setMasaKembali('18:00');
                        }}
                        className={`py-3 px-3 rounded-xl border-2 text-center transition-all ${
                          requestType === 'BERMALAM'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-xs'
                            : 'border-slate-200 text-slate-600 hover:border-indigo-200'
                        }`}
                      >
                        <Calendar className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
                        <div className="text-xs font-bold">Pulang Bermalam</div>
                        <div className="text-[10px] text-slate-500 font-normal">Hujung minggu / cuti</div>
                      </button>
                    </div>

                    {/* Date & Time grids */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Tarikh &amp; Masa Keluar (Ambil)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={tarikhKeluar}
                            onChange={(e) => {
                              setTarikhKeluar(e.target.value);
                              if (requestType === 'OUTING') setTarikhKembali(e.target.value);
                            }}
                            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                            required
                          />
                          <input
                            type="time"
                            value={masaKeluar}
                            onChange={(e) => setMasaKeluar(e.target.value)}
                            className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Tarikh &amp; Masa Kembali (Hantar)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={tarikhKembali}
                            min={tarikhKeluar}
                            onChange={(e) => setTarikhKembali(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                            required
                          />
                          <input
                            type="time"
                            value={masaKembali}
                            onChange={(e) => setMasaKembali(e.target.value)}
                            className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Guardian Details */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px]">3</span>
                      <span>Maklumat Penjaga &amp; Kenderaan</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Nama Penuh Ibu / Bapa / Penjaga
                        </label>
                        <input
                          type="text"
                          value={namaPenjaga}
                          onChange={(e) => setNamaPenjaga(e.target.value)}
                          placeholder="Nama penuh seperti dalam MyKad"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Nombor Telefon Penjaga (WhatsApp)
                        </label>
                        <input
                          type="tel"
                          value={telPenjaga}
                          onChange={(e) => setTelPenjaga(e.target.value)}
                          placeholder="Contoh: 0123456789"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Hubungan dengan Murid
                        </label>
                        <select
                          value={hubungan}
                          onChange={(e) => setHubungan(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                        >
                          <option value="Bapa">Bapa Kandung</option>
                          <option value="Ibu">Ibu Kandung</option>
                          <option value="Penjaga Sah">Penjaga Sah / Angkat</option>
                          <option value="Datuk / Nenek">Datuk / Nenek</option>
                          <option value="Abang / Kakak">Abang / Kakak</option>
                          <option value="Waris Terdekat">Waris Terdekat</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Nombor Pendaftaran Kenderaan (No. Plat)
                        </label>
                        <input
                          type="text"
                          value={noKenderaan}
                          onChange={(e) => setNoKenderaan(e.target.value)}
                          placeholder="Contoh: JMG 1234 / Kereta Awam"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Sebab / Tujuan Permohonan
                      </label>
                      <textarea
                        value={sebab}
                        onChange={(e) => setSebab(e.target.value)}
                        placeholder="Contoh: Pulang bersama keluarga untuk rawatan kesihatan / kenduri / keperluan persekolahan..."
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                        required
                      ></textarea>
                    </div>

                    {/* Terms confirmation */}
                    <div className="pt-2 border-t border-slate-200">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                          required
                        />
                        <span className="text-[11px] text-slate-600 leading-snug">
                          Saya selaku ibu/bapa/penjaga mengesahkan maklumat di atas adalah benar dan bertanggungjawab sepenuhnya ke atas keselamatan dan disiplin murid sepanjang tempoh berada di luar asrama.
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!selectedStudent || !agreeTerms}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Hantar Permohonan ke Warden Bertugas</span>
                  </button>
                </form>
              )}
            </>
          )}

          {/* TAB 2: SEMAK STATUS PERMOHONAN */}
          {activeTab === 'semak' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Cari Status Permohonan Anak
                </label>
                <form onSubmit={handleCheckStatus} className="flex gap-2">
                  <input
                    type="text"
                    value={checkQuery}
                    onChange={(e) => setCheckQuery(e.target.value)}
                    placeholder="Masukkan No. KP Murid atau No. Rujukan (cth: REQ-...)"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Cari</span>
                  </button>
                </form>
                <p className="text-[11px] text-slate-500">
                  Sila masukkan nombor MyKad murid untuk menyemak permohonan terkini.
                </p>
              </div>

              {/* Search Results */}
              {hasSearchedStatus && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700">
                    Hasil Carian ({checkResults.length} permohonan dijumpai)
                  </h4>

                  {checkResults.length === 0 ? (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                      Tiada rekod permohonan dijumpai bagi No. KP / No. Rujukan tersebut.
                    </div>
                  ) : (
                    checkResults.map((req) => (
                      <div
                        key={req.id}
                        className={`bg-white rounded-xl border p-4 shadow-xs transition-all ${
                          req.status === 'APPROVED'
                            ? 'border-emerald-300 ring-1 ring-emerald-200'
                            : req.status === 'REJECTED'
                              ? 'border-rose-300 ring-1 ring-rose-200'
                              : 'border-amber-300 ring-1 ring-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">
                                {req.studentNama}
                              </span>
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">
                                {req.studentKelas}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">
                              Ref: {req.id}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {req.status === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Diluluskan</span>
                              </span>
                            )}
                            {req.status === 'PENDING' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Menunggu Kelulusan</span>
                              </span>
                            )}
                            {req.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Tidak Diluluskan</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                          <div>
                            <span className="text-slate-400 block">Jenis:</span>
                            <span className="font-semibold text-slate-800">
                              {req.type === 'OUTING' ? 'Outing Harian' : 'Pulang Bermalam'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Penjaga:</span>
                            <span className="font-semibold text-slate-800">
                              {req.namaPenjaga} ({req.hubungan})
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Tarikh Keluar:</span>
                            <span className="font-semibold text-slate-800">
                              {req.tarikhKeluar} ({req.masaKeluar})
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Tarikh Kembali:</span>
                            <span className="font-semibold text-slate-800">
                              {req.tarikhKembali} ({req.masaKembali})
                            </span>
                          </div>
                        </div>

                        {req.status === 'APPROVED' && req.passId && (
                          <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-emerald-700 block font-semibold">
                                No. Pas Pelepasan Pagar:
                              </span>
                              <span className="font-mono font-bold text-emerald-900">
                                {req.passId}
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-700 italic">
                              Disahkan oleh {req.reviewedBy || 'Warden'}
                            </span>
                          </div>
                        )}

                        {req.status === 'REJECTED' && (
                          <div className="mt-3 p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800">
                            <span className="font-semibold block text-[10px] text-rose-700">
                              Catatan Penolakan Warden:
                            </span>
                            <p className="mt-0.5 italic">
                              "{req.rejectionReason || 'Permohonan tidak dapat diluluskan.'}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer: Quick link sharing */}
        <div className="bg-white border-t border-slate-200 p-3.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Pautan portal ini boleh dikongsi ke WhatsApp Ibu Bapa</span>
          </div>
          <button
            type="button"
            onClick={handleCopyPortalLink}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Pautan Disalin!' : 'Salin Pautan Portal'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
