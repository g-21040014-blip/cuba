import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Save, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  User, 
  FileText,
  Calendar
} from 'lucide-react';
import { HostelLog } from '../types/hostel';

interface EditLogModalProps {
  log: HostelLog | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLog: HostelLog) => void;
  onDelete?: (logId: string) => void;
}

const ACTION_OPTIONS = [
  'Masuk Asrama',
  'Keluar Asrama',
  'Mula Outing',
  'Tamat Outing',
  'Pulang Bermalam',
  'Kembali Bermalam',
  'Kehadiran',
  'Rawatan / Kuarantin',
  'Pelepasan Pukal'
];

export const EditLogModal: React.FC<EditLogModalProps> = ({
  log,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  if (!isOpen || !log) return null;

  const [action, setAction] = useState(log.action);
  const [detail, setDetail] = useState(log.detail);
  const [officer, setOfficer] = useState(log.officer || '');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    setAction(log.action);
    setDetail(log.detail || '');
    setOfficer(log.officer || '');
    setShowConfirmDelete(false);

    const d = new Date(log.ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDateStr(`${yyyy}-${mm}-${dd}`);

    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    setTimeStr(`${hh}:${min}`);
  }, [log, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newTs = log.ts;
    if (dateStr && timeStr) {
      const parsed = new Date(`${dateStr}T${timeStr}:00`);
      if (!isNaN(parsed.getTime())) {
        newTs = parsed.getTime();
      }
    }

    const updated: HostelLog = {
      ...log,
      action: action.trim(),
      detail: detail.trim(),
      officer: officer.trim(),
      ts: newTs
    };

    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && log) {
      onDelete(log.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-sm">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Kemaskini Rekod Log Pergerakan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Betulkan kesilapan butiran tindakan atau catatan log
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Student Info */}
        <div className="px-5 py-3 bg-slate-100/70 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="font-bold text-slate-900">
            {log.nama} <span className="text-slate-500 font-mono font-normal">({log.kp})</span>
          </div>
          <div className="text-slate-600 font-medium">
            {log.kelas} &middot; {log.bidang}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Action type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Jenis Tindakan
            </label>
            <select
              value={action}
              onChange={e => setAction(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
            >
              {ACTION_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              {!ACTION_OPTIONS.includes(action) && (
                <option value={action}>{action}</option>
              )}
            </select>
          </div>

          {/* Details / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Butiran / Catatan Pergerakan
            </label>
            <textarea
              required
              rows={3}
              value={detail}
              onChange={e => setDetail(e.target.value)}
              placeholder="Masukkan butiran atau catatan yang betul..."
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tarikh Rekod
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateStr}
                  onChange={e => setDateStr(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Masa Rekod
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={timeStr}
                  onChange={e => setTimeStr(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Officer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Pegawai / Warden Bertugas
            </label>
            <div className="relative">
              <input
                type="text"
                value={officer}
                onChange={e => setOfficer(e.target.value)}
                placeholder="Nama warden atau pengawal..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {onDelete && (
              <div>
                {!showConfirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Padam Rekod Ini</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Sahkan Padam
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
