import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Phone, 
  MessageSquare, 
  Car, 
  Calendar, 
  User, 
  AlertCircle, 
  FileText, 
  Printer, 
  Trash2, 
  Share2, 
  Check, 
  Copy,
  ExternalLink,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Student, ParentRequest, Warden } from '../types/hostel';
import { 
  loadParentRequests, 
  approveParentRequest, 
  rejectParentRequest, 
  deleteParentRequest,
  getWhatsAppNotificationUrl 
} from '../services/parentRequestsService';

interface ParentRequestsManagerProps {
  students: Student[];
  currentWarden: Warden;
  onOpenGatePass?: (student: Student) => void;
  onOpenParentPortal: () => void;
  onShowToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
  onApproveAndCheckOut?: (student: Student, request: ParentRequest) => void;
}

export const ParentRequestsManager: React.FC<ParentRequestsManagerProps> = ({
  students,
  currentWarden,
  onOpenGatePass,
  onOpenParentPortal,
  onShowToast,
  onApproveAndCheckOut
}) => {
  const [requests, setRequests] = useState<ParentRequest[]>(() => loadParentRequests());
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Reject modal state
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Reload requests on interval or mount
  const refreshRequests = () => {
    setRequests(loadParentRequests());
  };

  useEffect(() => {
    refreshRequests();
    window.addEventListener('ssemj_parent_requests_updated', refreshRequests);
    const interval = setInterval(refreshRequests, 3000);
    return () => {
      window.removeEventListener('ssemj_parent_requests_updated', refreshRequests);
      clearInterval(interval);
    };
  }, []);

  const handleApprove = (req: ParentRequest) => {
    const wardenTitle = `${currentWarden.nama} (${currentWarden.jawatan})`;
    const res = approveParentRequest(req.id, wardenTitle);
    if (res) {
      refreshRequests();
      onShowToast(`Permohonan ${req.studentNama} telah DILULUSKAN.`, 'success');
      
      // If student is found and callback provided, can prompt to register check out
      const studentObj = students.find(s => s.kp === req.studentKp);
      if (studentObj && onApproveAndCheckOut) {
        onApproveAndCheckOut(studentObj, res.request);
      }
    }
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectingRequestId(id);
    setRejectionReason('Ada jadual latihan aktiviti seni / asrama yang tidak boleh ditinggalkan.');
  };

  const handleConfirmReject = () => {
    if (!rejectingRequestId) return;
    const wardenTitle = `${currentWarden.nama} (${currentWarden.jawatan})`;
    const updated = rejectParentRequest(rejectingRequestId, wardenTitle, rejectionReason);
    if (updated) {
      refreshRequests();
      onShowToast(`Permohonan telah DITOLAK.`, 'warning');
    }
    setRejectingRequestId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Adakah anda pasti mahu memadam rekod permohonan ini?')) {
      deleteParentRequest(id);
      refreshRequests();
      onShowToast('Permohonan telah dipadam.', 'success');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/waris`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    onShowToast('Pautan Portal Waris (/waris) disalin ke papan keratan.', 'success');
  };

  // Filtered list
  const filteredList = requests.filter(r => {
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    if (!matchStatus) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toUpperCase();
    return (
      r.studentNama.toUpperCase().includes(q) ||
      r.studentKp.includes(searchQuery) ||
      r.namaPenjaga.toUpperCase().includes(q) ||
      r.noKenderaan.toUpperCase().includes(q) ||
      r.id.toUpperCase().includes(q)
    );
  });

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  return (
    <div className="space-y-4">
      
      {/* Top action bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Filter Pills */}
        <div className="flex flex-wrap p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Kelulusan</span>
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                filterStatus === 'PENDING' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-900'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterStatus('APPROVED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Diluluskan ({approvedCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('REJECTED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Ditolak ({rejectedCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('ALL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Semua ({requests.length})</span>
          </button>
        </div>

        {/* Portal launch & share */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => window.open('/waris', '_blank')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-xs"
            title="Buka Portal Waris di tab baharu (/waris)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>Buka Portal Waris</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all"
            title="Salin Pautan Web untuk dikongsi kepada Ibu Bapa"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span className="hidden sm:inline">{copiedLink ? 'Pautan Disalin!' : 'Kongsi Pautan'}</span>
          </button>
        </div>

      </div>

      {/* Search Filter Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama murid, No. KP, nama penjaga, atau no. kenderaan..."
          className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
      </div>

      {/* Requests List */}
      {filteredList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
          <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-slate-700 text-sm">Tiada Permohonan Dijumpai</p>
          <p className="text-slate-500 mt-1">
            {filterStatus === 'PENDING'
              ? 'Tiada permohonan baharu yang sedang menunggu kelulusan pada masa ini.'
              : 'Tiada rekod yang sepadan dengan carian anda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredList.map((req) => {
            const studentObj = students.find(s => s.kp === req.studentKp);
            const isApproved = req.status === 'APPROVED';
            const isPending = req.status === 'PENDING';
            const isRejected = req.status === 'REJECTED';

            const whatsappApproveUrl = getWhatsAppNotificationUrl(req, currentWarden.nama, 'APPROVED');
            const whatsappRejectUrl = getWhatsAppNotificationUrl(req, currentWarden.nama, 'REJECTED');

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all ${
                  isPending
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : isApproved
                      ? 'border-emerald-200 hover:border-emerald-300'
                      : 'border-slate-200 opacity-80'
                }`}
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-800 text-xs overflow-hidden flex-shrink-0">
                        {studentObj?.gambar ? (
                          <img src={studentObj.gambar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{req.studentNama.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 leading-tight">
                          {req.studentNama}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-mono">
                          <span>{req.studentKelas}</span>
                          <span>&middot;</span>
                          <span>KP: {req.studentKp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300 animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>Menunggu</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Diluluskan</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-300">
                          <XCircle className="w-3 h-3" />
                          <span>Ditolak</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detail Info Grid */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Jenis Permohonan:</span>
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        req.type === 'OUTING' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {req.type === 'OUTING' ? 'Outing Harian' : 'Pulang Bermalam'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Waktu Keluar:</span>
                        <span className="font-semibold text-slate-800">
                          {req.tarikhKeluar} &middot; {req.masaKeluar}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Waktu Kembali:</span>
                        <span className="font-semibold text-slate-800">
                          {req.tarikhKembali} &middot; {req.masaKembali}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Nama Penjaga:</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {req.namaPenjaga} ({req.hubungan})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Kenderaan:</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {req.noKenderaan}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-700">
                      <span className="text-slate-400 font-semibold block text-[10px]">Alasan / Tujuan:</span>
                      <p className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-700 italic">
                        "{req.sebab}"
                      </p>
                    </div>

                    {isApproved && req.passId && (
                      <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 font-mono">
                        <span>Pas ID: <b>{req.passId}</b></span>
                        <span className="text-[10px] text-emerald-700 italic">Oleh: {req.reviewedBy}</span>
                      </div>
                    )}

                    {isRejected && req.rejectionReason && (
                      <div className="p-2 bg-rose-50 rounded-lg border border-rose-200 text-[11px] text-rose-800">
                        <span className="font-semibold block text-[10px]">Sebab Ditolak:</span>
                        <p className="italic">"{req.rejectionReason}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  
                  {/* Left: Contact Guardian */}
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${req.telPenjaga}`}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                      title={`Hubungi ${req.namaPenjaga}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>

                    {/* WhatsApp Action */}
                    <a
                      href={isApproved ? whatsappApproveUrl : whatsappRejectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors"
                      title="Hantar WhatsApp Makluman Rasmi ke Penjaga"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Waris</span>
                    </a>
                  </div>

                  {/* Right: Decision Buttons */}
                  <div className="flex items-center gap-1.5">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleOpenRejectModal(req.id)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Tolak
                        </button>

                        <button
                          onClick={() => handleApprove(req)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Luluskan</span>
                        </button>
                      </>
                    )}

                    {isApproved && studentObj && onOpenGatePass && (
                      <button
                        onClick={() => onOpenGatePass(studentObj)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Pas Keluar</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(req.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Padam Permohonan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 p-5 space-y-4 animate-in fade-in">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Sebab Penolakan Permohonan</span>
            </h3>
            <p className="text-xs text-slate-600">
              Sila nyatakan alasan penolakan untuk dimaklumkan kepada ibu bapa/penjaga:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Contoh: Ada aktiviti latihan / disiplin..."
            ></textarea>

            <div className="flex gap-2">
              <button
                onClick={() => setRejectingRequestId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Sahkan Tolak
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
