import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Printer, 
  Filter, 
  Calendar,
  ShieldCheck,
  Building2,
  Clock,
  Edit3
} from 'lucide-react';
import { HostelLog } from '../types/hostel';
import { formatDateTime } from '../utils/helpers';
import { EditLogModal } from './EditLogModal';

interface ActivityLogProps {
  logs: HostelLog[];
  onPrintReport: () => void;
  onUpdateLog?: (updatedLog: HostelLog) => void;
  onDeleteLog?: (logId: string) => void;
}

const ACTION_COLORS: Record<string, { dot: string; text: string; bg: string }> = {
  'Masuk Asrama': { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  'Keluar Asrama': { dot: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
  'Mula Outing': { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  'Tamat Outing': { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  'Pulang Bermalam': { dot: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-50' },
  'Kembali Bermalam': { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  'Kehadiran': { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
  'Rawatan / Kuarantin': { dot: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' },
};

export const ActivityLog: React.FC<ActivityLogProps> = ({
  logs,
  onPrintReport,
  onUpdateLog,
  onDeleteLog
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [editingLog, setEditingLog] = useState<HostelLog | null>(null);

  const filteredLogs = logs.filter(l => {
    if (searchQuery) {
      const q = searchQuery.toUpperCase();
      if (!l.nama.toUpperCase().includes(q) && !l.kp.includes(q) && !l.detail.toUpperCase().includes(q)) {
        return false;
      }
    }
    if (actionFilter !== 'all' && l.action !== actionFilter) {
      return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const rows = [
      ['Tarikh & Masa', 'Nama Pelajar', 'No. KP', 'Kelas', 'Bidang Seni', 'Tindakan', 'Butiran / Catatan', 'Pegawai / Warden']
    ];

    filteredLogs.forEach(l => {
      rows.push([
        formatDateTime(l.ts),
        l.nama,
        l.kp,
        l.kelas,
        l.bidang,
        l.action,
        l.detail || '',
        l.officer || 'Sistem Pengimbas'
      ]);
    });

    const csvContent = rows
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Log-Asrama-SSeM-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      
      {/* Search & Export Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari log nama, No. KP atau catatan..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">Semua Jenis Tindakan</option>
            <option value="Masuk Asrama">Masuk Asrama</option>
            <option value="Keluar Asrama">Keluar Asrama</option>
            <option value="Mula Outing">Mula Outing</option>
            <option value="Tamat Outing">Tamat Outing</option>
            <option value="Pulang Bermalam">Pulang Bermalam</option>
            <option value="Kembali Bermalam">Kembali Bermalam</option>
            <option value="Kehadiran">Kehadiran Sesi</option>
            <option value="Rawatan / Kuarantin">Rawatan / Kuarantin</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Muat Turun CSV</span>
          </button>

          <button
            onClick={onPrintReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Laporan Harian Warden</span>
          </button>
        </div>
      </div>

      {/* ACTIVITY LOG LIST */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">Papar {filteredLogs.length} Rekod Terkini</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Audit masa sebenar (realtime timestamp)</span>
        </div>

        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {filteredLogs.map(log => {
              const conf = ACTION_COLORS[log.action] || { dot: 'bg-slate-400', text: 'text-slate-700', bg: 'bg-slate-100' };

              return (
                <div key={log.id} className="p-3.5 sm:p-4 hover:bg-blue-50/50 transition-colors flex items-start justify-between gap-3 text-xs">
                  
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${conf.dot} mt-1.5 flex-shrink-0`}></span>
                    
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {log.nama}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border border-current/20 ${conf.bg} ${conf.text}`}>
                          {log.action}
                        </span>
                      </div>

                      <div className="text-slate-600 text-xs">
                        {log.detail || 'Pengesahan pergerakan direkodkan'}
                      </div>

                      <div className="text-slate-500 text-[11px] flex flex-wrap items-center gap-2 font-mono pt-0.5">
                        <span>KP: {log.kp}</span>
                        <span>&middot;</span>
                        <span>{log.kelas}</span>
                        <span>&middot;</span>
                        <span>{log.bidang}</span>
                        {log.officer && (
                          <>
                            <span>&middot;</span>
                            <span className="text-slate-600">Oleh: {log.officer}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-center flex-shrink-0">
                    <div className="text-right font-mono text-[11px] text-slate-500">
                      <div className="text-slate-800 font-medium">{new Date(log.ts).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{new Date(log.ts).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' })}</div>
                    </div>

                    {onUpdateLog && (
                      <button
                        type="button"
                        onClick={() => setEditingLog(log)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-700 border border-slate-200 hover:border-amber-300 transition-all shadow-2xs"
                        title="Edit Rekod Log (Betulkan Kesilapan)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 text-xs">
            Tiada rekod aktiviti yang sepadan dengan carian ini.
          </div>
        )}
      </div>

      {/* Edit Log Modal */}
      <EditLogModal
        isOpen={!!editingLog}
        log={editingLog}
        onClose={() => setEditingLog(null)}
        onSave={(updated) => {
          if (onUpdateLog) {
            onUpdateLog(updated);
          }
          setEditingLog(null);
        }}
        onDelete={(id) => {
          if (onDeleteLog) {
            onDeleteLog(id);
          }
          setEditingLog(null);
        }}
      />

    </div>
  );
};
