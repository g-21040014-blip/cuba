import React, { useState } from 'react';
import { X, Printer, ShieldCheck, QrCode, FileText } from 'lucide-react';
import { Student, StudentStatus } from '../types/hostel';
import { formatDateTime } from '../utils/helpers';
import { RealQrCode } from './RealQrCode';
import { DuitNowQrCard } from './DuitNowQrCard';

interface GatePassModalProps {
  student: Student | null;
  status: StudentStatus | undefined;
  onClose: () => void;
}

export const GatePassModal: React.FC<GatePassModalProps> = ({
  student,
  status,
  onClose
}) => {
  const [activeView, setActiveView] = useState<'duitnow' | 'borang'>('duitnow');

  React.useEffect(() => {
    if (!student || !status) return;
    document.body.classList.add('is-printing-target');
    return () => {
      document.body.classList.remove('is-printing-target');
    };
  }, [student, status]);

  if (!student || !status) return null;

  const passNumber = status.passId || `PAS-${student.tingkatan}-${student.kp.slice(-4)}-${Date.now().toString().slice(-4)}`;

  const qrPayload = `PAS PELEPASAN RASMI SSeMJ
No. Siri: ${passNumber}
Murid: ${student.nama}
No. KP: ${student.kp}
Kelas: ${student.kelas} (${student.bidang})
Status: ${status.status}
Tujuan: ${status.dest || status.alasan || 'Outing Rasmi'}
Dijangka Pulang: ${status.expectedReturn || 'Sebelum 7:00 PM'}
Tarikh: ${new Date().toLocaleDateString('ms-MY')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="modal-card-print bg-white text-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Actions Bar (hidden in print) */}
        <div className="no-print flex flex-wrap items-center justify-between p-3.5 bg-slate-50 border-b border-slate-200 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Pas Pelepasan
            </span>
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveView('duitnow')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  activeView === 'duitnow' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-[#D9146C]" />
                Kod QR
              </button>
              <button
                type="button"
                onClick={() => setActiveView('borang')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  activeView === 'borang' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Borang Rasmi
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIEW 1: DUITNOW STYLE CARD (MATCHING USER'S PHOTO) */}
        {activeView === 'duitnow' && (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center bg-slate-50/50 print:bg-white print:p-4">
            <DuitNowQrCard
              title={student.nama}
              subtitle={`${student.kelas} (${student.bidang}) · KP: ${student.kp}`}
              qrValue={qrPayload}
              codeNumber={passNumber}
              bannerText="KOD PELEPASAN KESELAMATAN SSeMJ"
              footerNote="Disahkan oleh Unit HEM & Pengawal Keselamatan SSeMJ"
            />
            <div className="no-print text-center text-[11px] text-slate-500 mt-4 max-w-xs leading-relaxed">
              Boleh diimbas terus menggunakan mana-mana kamera telefon atau Google Lens.
            </div>
          </div>
        )}

        {/* VIEW 2: PRINTABLE OFFICIAL PASS LETTERHEAD */}
        {activeView === 'borang' && (
          <div className="p-6 sm:p-8 space-y-5 print:p-6 print:text-black print:max-w-[170mm] print:mx-auto print:border-2 print:border-slate-800 print:rounded-2xl print:my-4">
          {/* Official Header with School Logo */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <div className="flex flex-col items-center justify-center">
              <img 
                src="/logo_ssemj_original.jpg" 
                alt="Logo Sekolah Seni Malaysia Johor" 
                className="h-20 w-auto object-contain mb-2.5 drop-shadow-xs" 
              />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-950">
                Sekolah Seni Malaysia Johor
              </h2>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-tight">
                Kementerian Pendidikan Malaysia &middot; Pengurusan Asrama SSeMJ
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Unit Hal Ehwal Murid &amp; Kawalan Keselamatan Pintu Pagar
              </div>
            </div>
            <div className="inline-block mt-3 px-4 py-1 rounded-md bg-slate-950 text-white font-mono text-xs font-bold tracking-widest uppercase">
              PAS PELEPASAN KELUAR ASRAMA
            </div>
          </div>

          {/* Pass Meta */}
          <div className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
            <div>
              <span className="text-slate-500">NO. SIRI PAS: </span>
              <b className="text-slate-900">{passNumber}</b>
            </div>
            <div>
              <span className="text-slate-500">TARIKH KELUAR: </span>
              <b className="text-slate-900">{new Date().toLocaleDateString('ms-MY')}</b>
            </div>
          </div>

          {/* Student Specifics Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="col-span-2 bg-slate-50 p-2.5 rounded border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase">Nama Murid</div>
              <div className="font-bold text-sm text-slate-900">{student.nama}</div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase">No. Kad Pengenalan</div>
              <div className="font-mono font-bold text-slate-900">{student.kp}</div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase">Kelas &amp; Pengkhususan</div>
              <div className="font-bold text-slate-900">{student.kelas} &middot; {student.bidang}</div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase">Bilik / Blok Asrama</div>
              <div className="font-bold text-slate-900">{student.dorm || 'Blok Utama'}</div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase">Jenis Pelepasan</div>
              <div className="font-bold text-teal-800 uppercase">{status.status}</div>
            </div>

            <div className="col-span-2 bg-slate-50 p-2.5 rounded border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase">Tujuan / Destinasi</div>
              <div className="font-semibold text-slate-900">{status.dest || status.alasan || 'Urusan Peribadi / Outing'}</div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase">Waktu Dijangka Pulang</div>
              <div className="font-mono font-bold text-amber-900 text-sm">{status.expectedReturn || 'Sebelum 07:00 PM'}</div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase">Waris / Hubungan</div>
              <div className="font-semibold text-slate-900 truncate">{student.namaWaris || 'Bapa / Ibu'}</div>
            </div>
          </div>

          {/* Security Guard Inspection Instructions */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-950 leading-relaxed">
            <b>Perhatian Pengawal Keselamatan Pintu Masuk:</b>
            <br />
            Sahkan identiti murid melalui imbasan cip kad / semakan No. KP. Murid wajib mengimbas kad kembali semasa melapor diri di asrama.
          </div>

          {/* Signatures & Security Barcode */}
          <div className="pt-4 border-t border-slate-300 flex items-end justify-between">
            <div className="text-center">
              <div className="w-32 border-b border-slate-900 pb-6 mb-1"></div>
              <div className="text-[10px] font-bold text-slate-700">Tandatangan Warden / Cop</div>
            </div>

            <div className="flex flex-col items-center">
              <RealQrCode 
                value={qrPayload} 
                size={84} 
                includeBorder 
                alt={`Kod QR Pas Pelepasan ${passNumber}`} 
              />
              <div className="font-mono text-[9px] text-slate-800 font-bold mt-1 text-center">
                {passNumber}
              </div>
              <div className="text-[8px] text-slate-500 uppercase tracking-tight">Imbas untuk sahkan</div>
            </div>

            <div className="text-center">
              <div className="w-32 border-b border-slate-900 pb-6 mb-1"></div>
              <div className="text-[10px] font-bold text-slate-700">Pengesahan Pengawal Pintu</div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};
