import React from 'react';
import { X, Printer, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Student, StudentStatus, HostelLog, Warden } from '../types/hostel';
import { formatDateTime, isOutingOverdue } from '../utils/helpers';

interface DailyReportModalProps {
  students: Student[];
  statuses: Record<string, StudentStatus>;
  logs: HostelLog[];
  currentWarden?: Warden;
  onClose: () => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  students,
  statuses,
  logs,
  currentWarden,
  onClose
}) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ms-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const total = students.length;
  const getStudentStatus = (s: Student): string => {
    return statuses[s.kp]?.status || 
           (s.kp ? statuses[s.kp.replace(/[\s-]/g, '')]?.status : undefined) || 
           'DALAM';
  };

  const dalam = students.filter(s => getStudentStatus(s) === 'DALAM').length;
  const keluar = students.filter(s => getStudentStatus(s) === 'KELUAR').length;
  const outing = students.filter(s => getStudentStatus(s) === 'OUTING').length;
  const bermalam = students.filter(s => getStudentStatus(s) === 'BERMALAM').length;
  const kuarantin = students.filter(s => getStudentStatus(s) === 'KUARANTIN').length;

  const overdueList = students
    .filter(s => {
      const st = statuses[s.kp] || (s.kp ? statuses[s.kp.replace(/[\s-]/g, '')] : undefined);
      return st?.status === 'OUTING' && isOutingOverdue(st?.expectedReturn);
    })
    .map(s => ({ s, st: statuses[s.kp] || (s.kp ? statuses[s.kp.replace(/[\s-]/g, '')] : undefined) as StudentStatus }));

  const activeLeaves = students
    .filter(s => {
      const status = getStudentStatus(s);
      return status === 'OUTING' || status === 'BERMALAM';
    })
    .map(s => ({ s, st: statuses[s.kp] || (s.kp ? statuses[s.kp.replace(/[\s-]/g, '')] : undefined) as StudentStatus }));

  React.useEffect(() => {
    document.body.classList.add('is-printing-target');
    return () => {
      document.body.classList.remove('is-printing-target');
    };
  }, []);

  return (
    <div className="modal-backdrop-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="modal-card-print bg-white text-slate-900 rounded-2xl w-full max-w-4xl max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-200 print:max-h-none print:overflow-visible print:border-none print:shadow-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Controls Bar */}
        <div className="no-print flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Laporan Rasmi Harian Warden Asrama
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Laporan
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document */}
        <div className="p-8 sm:p-10 space-y-6 print:p-0 print:text-black">
          
          {/* Header / Official Letterhead with Real School Logo */}
          <div className="text-center border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col items-center justify-center mb-2">
              <img 
                src="/logo_ssemj_original.jpg" 
                alt="Logo Sekolah Seni Malaysia Johor" 
                className="h-24 w-auto object-contain mb-3 drop-shadow-xs" 
              />
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-950">
                Sekolah Seni Malaysia Johor
              </h1>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-widest mt-0.5">
                Kementerian Pendidikan Malaysia &middot; Pengurusan Asrama SSeMJ
              </div>
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Unit Hal Ehwal Murid &middot; Pengurusan Warden Asrama
              </div>
            </div>
            <div className="inline-block mt-2 px-4 py-1 rounded-md bg-slate-950 text-white text-xs sm:text-sm font-bold uppercase tracking-wide">
              LAPORAN RASMI HARIAN KEDUDUKAN &amp; PERGERAKAN MURID ASRAMA
            </div>
            <div className="text-xs text-slate-600 font-mono mt-2 font-medium">
              Tarikh Cetakan: <b className="text-slate-900">{dateStr}</b> ({now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })})
            </div>
          </div>

          {/* Statistics Summary Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-l-4 border-blue-600 pl-2">
              1. Ringkasan Status Semasa Murid Asrama
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-300 p-2">Kategori</th>
                  <th className="border border-slate-300 p-2 text-center">Jumlah Murid</th>
                  <th className="border border-slate-300 p-2 text-center">Peratusan (%)</th>
                  <th className="border border-slate-300 p-2">Catatan Operasi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold">Dalam Asrama (Fizikal)</td>
                  <td className="border border-slate-300 p-2 text-center font-mono font-bold text-blue-700">{dalam}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono">{Math.round((dalam / (total || 1)) * 100)}%</td>
                  <td className="border border-slate-300 p-2 text-slate-600">Berada di dorm / kawasan asrama</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Keluar Asrama</td>
                  <td className="border border-slate-300 p-2 text-center font-mono">{keluar}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono">{Math.round((keluar / (total || 1)) * 100)}%</td>
                  <td className="border border-slate-300 p-2 text-slate-600">Luar kawasan asrama</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Sedang Outing Harian</td>
                  <td className="border border-slate-300 p-2 text-center font-mono font-bold text-amber-700">{outing}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono">{Math.round((outing / (total || 1)) * 100)}%</td>
                  <td className="border border-slate-300 p-2 text-slate-600">Membeli keperluan / temujanji</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Pulang Bermalam Bersama Keluarga</td>
                  <td className="border border-slate-300 p-2 text-center font-mono">{bermalam}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono">{Math.round((bermalam / (total || 1)) * 100)}%</td>
                  <td className="border border-slate-300 p-2 text-slate-600">Diambil oleh ibu bapa/penjaga sah</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Bilik Sakit / Kuarantin Kesihatan</td>
                  <td className="border border-slate-300 p-2 text-center font-mono">{kuarantin}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono">{Math.round((kuarantin / (total || 1)) * 100)}%</td>
                  <td className="border border-slate-300 p-2 text-slate-600">Rawatan &amp; rehat di bilik sakit</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-slate-300 p-2">JUMLAH KESELURUHAN ENROLMEN</td>
                  <td className="border border-slate-300 p-2 text-center font-mono text-sm">{total}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono">100%</td>
                  <td className="border border-slate-300 p-2 text-slate-600">Semua murid berdaftar asrama</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Overdue Alerts Section if any */}
          {overdueList.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 border-l-4 border-rose-600 pl-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                2. Senarai Murid Lewat Pulang Outing (Perlu Tindakan)
              </h3>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-rose-50 text-rose-900">
                    <th className="border border-slate-300 p-1.5">Nama Murid</th>
                    <th className="border border-slate-300 p-1.5">Kelas</th>
                    <th className="border border-slate-300 p-1.5">Destinasi</th>
                    <th className="border border-slate-300 p-1.5">Waktu Patut Pulang</th>
                    <th className="border border-slate-300 p-1.5">Nama &amp; No. Tel Waris</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueList.map(({ s, st }) => (
                    <tr key={s.kp}>
                      <td className="border border-slate-300 p-1.5 font-bold">{s.nama}</td>
                      <td className="border border-slate-300 p-1.5">{s.kelas}</td>
                      <td className="border border-slate-300 p-1.5">{st.dest}</td>
                      <td className="border border-slate-300 p-1.5 font-mono font-bold text-rose-700">{st.expectedReturn}</td>
                      <td className="border border-slate-300 p-1.5">{s.namaWaris} ({s.telWaris})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Active Leave Records */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-l-4 border-blue-600 pl-2">
              {overdueList.length > 0 ? '3.' : '2.'} Senarai Murid Berada di Luar Asrama (Outing &amp; Bermalam)
            </h3>
            {activeLeaves.length > 0 ? (
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-300 p-1.5">Bil</th>
                    <th className="border border-slate-300 p-1.5">Nama Murid</th>
                    <th className="border border-slate-300 p-1.5">Kelas / Seni</th>
                    <th className="border border-slate-300 p-1.5">Jenis Pelepasan</th>
                    <th className="border border-slate-300 p-1.5">Destinasi</th>
                    <th className="border border-slate-300 p-1.5">Jangkaan Kembali</th>
                    <th className="border border-slate-300 p-1.5">No. Tel Waris</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLeaves.map(({ s, st }, idx) => (
                    <tr key={s.kp}>
                      <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 p-1.5 font-semibold">{s.nama}</td>
                      <td className="border border-slate-300 p-1.5">{s.kelas} &middot; {s.bidang}</td>
                      <td className="border border-slate-300 p-1.5 font-bold uppercase">{st.status}</td>
                      <td className="border border-slate-300 p-1.5">{st.dest}</td>
                      <td className="border border-slate-300 p-1.5 font-mono">{st.expectedReturn || '—'}</td>
                      <td className="border border-slate-300 p-1.5 font-mono">{s.telWaris}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-3 border border-slate-300 text-xs text-slate-500 text-center">
                Tiada murid berada di luar asrama pada tarikh ini.
              </div>
            )}
          </div>

          {/* Endorsement & Signatures */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-12">
              <div>Disediakan oleh Warden Bertugas:</div>
              <div>
                <div className="w-56 border-b border-slate-900 mb-1"></div>
                <div className="font-bold">
                  Nama: {currentWarden ? currentWarden.nama : '_______________________'}
                </div>
                <div className="text-slate-500">
                  {currentWarden ? `${currentWarden.jawatan} (${currentWarden.tel})` : 'Warden Asrama SSeM'}
                </div>
              </div>
            </div>

            <div className="space-y-12 text-right">
              <div>Disahkan oleh Pengetua / PK HEM:</div>
              <div className="inline-block text-left">
                <div className="w-48 border-b border-slate-900 mb-1"></div>
                <div className="font-bold">Nama: _______________________</div>
                <div className="text-slate-500">Sekolah Seni Malaysia Johor</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
