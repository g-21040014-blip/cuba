import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Check, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Code2, 
  Send,
  HelpCircle,
  Sparkles,
  DownloadCloud,
  Image,
  Users,
  Database
} from 'lucide-react';
import { 
  getGoogleSheetsConfig, 
  saveGoogleSheetsConfig, 
  testWebhook, 
  syncAllStudentsToSheets,
  GOOGLE_APPS_SCRIPT_CODE,
  GoogleSheetsConfig
} from '../services/googleSheetsSync';
import { 
  fetchStudentsFromGoogleSheet, 
  fetchSmartMergedStudentsFromGoogleSheet,
  fetchWardensFromGoogleSheet, 
  formatGoogleDriveImageUrl 
} from '../services/googleSheetImport';
import { Student, StudentStatus, Warden } from '../types/hostel';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  statuses: Record<string, StudentStatus>;
  wardens?: Warden[];
  onSyncNotification: (msg: string, isSuccess: boolean) => void;
  onImportStudents?: (imported: Student[]) => void;
  onImportWardens?: (imported: Warden[]) => void;
  defaultTab?: 'import' | 'config' | 'code' | 'guide';
  onOpenSupabase?: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  students,
  statuses,
  wardens = [],
  onSyncNotification,
  onImportStudents,
  onImportWardens,
  defaultTab = 'import',
  onOpenSupabase
}) => {
  const [config, setConfig] = useState<GoogleSheetsConfig>({ webhookUrl: '', autoSync: false });
  const [activeTab, setActiveTab] = useState<'import' | 'config' | 'code' | 'guide'>(defaultTab);
  const [testing, setTesting] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sheet Import State
  const [importSheetId, setImportSheetId] = useState('1tNACM32JUAbiSQW1JaI5L53uL67Daa0tXqYcP6bpWGs');
  const [importSheetName, setImportSheetName] = useState('DATA_MURID');
  const [importMode, setImportMode] = useState<'SMART' | 'MANUAL'>('SMART');
  const [isImporting, setIsImporting] = useState(false);
  const [isImportingWardens, setIsImportingWardens] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    count: number;
    withImages: number;
    sample: Student[];
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(getGoogleSheetsConfig());
      setActiveTab(defaultTab);
      setFeedback(null);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleFetchFromGoogleSheet = async (forceSmart = false) => {
    if (!importSheetId.trim()) {
      setFeedback({ type: 'error', message: 'Sila masukkan ID Google Spreadsheet.' });
      return;
    }

    setIsImporting(true);
    setFeedback(null);

    const useSmart = forceSmart || importMode === 'SMART';
    const res = useSmart 
      ? await fetchSmartMergedStudentsFromGoogleSheet(importSheetId.trim())
      : await fetchStudentsFromGoogleSheet(importSheetId.trim(), importSheetName.trim());

    setIsImporting(false);

    if (res.success && res.students.length > 0) {
      const withImages = res.students.filter(s => Boolean(s.gambar)).length;
      setImportPreview({
        count: res.students.length,
        withImages,
        sample: res.students.slice(0, 8)
      });

      if (onImportStudents) {
        onImportStudents(res.students);
      }

      setFeedback({
        type: 'success',
        message: res.message || `Berjaya memuat turun ${res.students.length} murid (${withImages} foto dikesan)! Data sistem kini diselaraskan sepenuhnya dengan Google Sheet.`
      });
      onSyncNotification(`${res.students.length} murid diselaraskan dengan Google Sheet!`, true);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleResetCacheAndResync = async () => {
    try {
      localStorage.removeItem('asrama_students_list_v3');
    } catch {}
    await handleFetchFromGoogleSheet(true);
  };

  const handleFetchWardens = async () => {
    if (!importSheetId.trim()) {
      setFeedback({ type: 'error', message: 'Sila masukkan ID Google Spreadsheet.' });
      return;
    }

    setIsImportingWardens(true);
    setFeedback(null);

    const res = await fetchWardensFromGoogleSheet(importSheetId.trim(), 'WARDEN');
    setIsImportingWardens(false);

    if (res.success && res.wardens.length > 0) {
      if (onImportWardens) {
        onImportWardens(res.wardens);
      }
      setFeedback({
        type: 'success',
        message: `Berjaya memuat turun ${res.wardens.length} rekod warden dari helaian WARDEN! Senarai warden kini dikemaskini.`
      });
      onSyncNotification(`${res.wardens.length} warden berjaya ditarik dari Google Sheet!`, true);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleSaveAndTest = async () => {
    if (!config.webhookUrl) {
      setFeedback({ type: 'error', message: 'Sila masukkan URL Webhook Google Apps Script terlebih dahulu.' });
      return;
    }

    setTesting(true);
    setFeedback(null);

    const result = await testWebhook(config.webhookUrl);
    setTesting(false);

    if (result.success) {
      saveGoogleSheetsConfig({
        ...config,
        lastSynced: Date.now()
      });
      setFeedback({ 
        type: 'success', 
        message: 'Sambungan Webhook berjaya! Google Sheet sedia menerima log masa nyata.' 
      });
      onSyncNotification('Sambungan Google Sheets disahkan aktif!', true);
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  const handleToggleAutoSync = () => {
    const updated = { ...config, autoSync: !config.autoSync };
    setConfig(updated);
    saveGoogleSheetsConfig(updated);
  };

  const handleSyncAllStudents = async () => {
    if (!config.webhookUrl) {
      setFeedback({ type: 'error', message: 'Sila masukkan dan uji Webhook URL terlebih dahulu.' });
      return;
    }

    setSyncingAll(true);
    setFeedback(null);

    const res = await syncAllStudentsToSheets(students, statuses);
    setSyncingAll(false);

    if (res.success) {
      setFeedback({ 
        type: 'success', 
        message: `Berjaya menghantar ${students.length} rekod murid ke helaian 'DATA_MURID'!` 
      });
      onSyncNotification(`${students.length} rekod murid dihantar ke Google Sheets!`, true);
      setConfig(prev => ({ ...prev, lastSynced: Date.now() }));
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div 
        id="modal-google-sheets"
        className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Penyambung Google Sheets SSeM
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Real-Time &amp; Import
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ambil data murid &amp; foto dari Google Sheet atau segerakan imbasan keluar/masuk asrama
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supabase Realtime Notice Banner */}
        {onOpenSupabase && (
          <div className="bg-sky-950/90 border-b border-sky-800/80 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-sky-200">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span>
                Mencari <b>Tab 1: Kunci Sambungan &amp; Kongsi Telefon</b> untuk selaras telefon pengawal &amp; warden?
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenSupabase();
              }}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all shadow whitespace-nowrap flex items-center gap-1 self-end sm:self-auto"
            >
              <span>Buka Tetapan Supabase</span>
              <span>➔</span>
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'import'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            Tarik Data Murid &amp; Foto
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'config'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Webhook Log Keluar/Masuk
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'code'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Kod Apps Script
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'guide'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Panduan Cara Ambil
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: TARIK DATA MURID & GAMBAR DARI GOOGLE SHEET */}
          {activeTab === 'import' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs">
                    <Database className="w-4 h-4" />
                    <span>Kaedah Penyelarasan Google Sheet:</span>
                  </div>
                  <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setImportMode('SMART')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        importMode === 'SMART'
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                      <span>Gabung Pintar</span>
                      <span className="text-[9px] bg-teal-800/80 text-teal-200 px-1 py-0.2 rounded font-normal">Disyorkan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('MANUAL')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                        importMode === 'MANUAL'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Helaian Manual</span>
                    </button>
                  </div>
                </div>

                {importMode === 'SMART' ? (
                  <div className="p-3 rounded-lg bg-teal-950/40 border border-teal-700/50 space-y-1.5 text-xs text-teal-200">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-400" />
                      <span>Mod Gabung Pintar Menggabungkan 2 Helaian Google Sheet:</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-teal-300/90 space-y-1">
                      <li><b>DATA_MURID</b>: Menarik perubahan nama murid, tingkatan, kelas, dorm/bilik, serta nombor telefon waris terkini yang anda edit.</li>
                      <li><b>Murid</b>: Memadankan pautan foto Google Drive murid berdasarkan No. KP secara automatik (320+ foto).</li>
                    </ul>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={importMode === 'SMART' ? 'sm:col-span-3 space-y-1' : 'sm:col-span-2 space-y-1'}>
                    <label className="text-[11px] text-slate-400 font-medium">
                      Spreadsheet ID:
                    </label>
                    <input
                      type="text"
                      value={importSheetId}
                      onChange={(e) => setImportSheetId(e.target.value)}
                      placeholder="1tNACM32JUAbiSQW1JaI5L53uL67Daa0tXqYcP6bpWGs"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  {importMode === 'MANUAL' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-slate-400 font-medium">
                          Nama Helaian (Tab Sheet):
                        </label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setImportSheetName('DATA_MURID')}
                            className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                              importSheetName === 'DATA_MURID'
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            DATA_MURID
                          </button>
                          <button
                            type="button"
                            onClick={() => setImportSheetName('Murid')}
                            className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                              importSheetName === 'Murid'
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            Murid
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={importSheetName}
                        onChange={(e) => setImportSheetName(e.target.value)}
                        placeholder="DATA_MURID atau Murid"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-400"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Image className="w-3.5 h-3.5 text-amber-400" />
                    Pautan gambar Google Drive ditukar automatik ke resolusi optimum (Google LH3 CDN).
                  </span>

                  <a 
                    href={`https://docs.google.com/spreadsheets/d/${importSheetId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 underline"
                  >
                    Buka Google Sheet <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  id="btn-fetch-students-gsheet"
                  onClick={() => handleFetchFromGoogleSheet()}
                  disabled={isImporting || isImportingWardens}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-all shadow-lg shadow-teal-950/40 flex items-center gap-2 disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Memuat Turun Data &amp; Foto Murid...
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="w-4 h-4" />
                      {importMode === 'SMART' 
                        ? `Tarik Data Terkini (Gabung Pintar: ${students.length} murid)`
                        : `Tarik Data Helaian '${importSheetName}' (${students.length} murid)`}
                    </>
                  )}
                </button>

                <button
                  id="btn-fetch-wardens-gsheet"
                  onClick={handleFetchWardens}
                  disabled={isImporting || isImportingWardens}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-lg shadow-amber-950/40 flex items-center gap-2 disabled:opacity-50"
                >
                  {isImportingWardens ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Memuat Turun Data Warden...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Tarik Senarai Warden (WARDEN)
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResetCacheAndResync}
                  disabled={isImporting || isImportingWardens}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all border border-slate-700 flex items-center gap-1.5 disabled:opacity-50"
                  title="Padam simpanan memori tempatan dan tarik semula data bersih dari Google Sheet"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Padam Cache &amp; Tarik Segar</span>
                </button>
              </div>

              {/* Warden List Summary */}
              {wardens && wardens.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      Senarai Warden Asrama (Jadual: WARDEN):
                    </span>
                    <span className="text-xs font-bold text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      {wardens.length} Warden Berdaftar
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {wardens.map((w) => (
                      <div 
                        key={w.id} 
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-[11px] truncate">{w.nama}</span>
                          <span className="text-[10px] text-amber-400 font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            {w.jawatan}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                          <span>{w.tel}</span>
                          <span className="text-slate-400 font-mono text-[9px] truncate max-w-[150px]">{w.email || '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Loaded Summary */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-400" />
                    Data Murid Aktif dalam Sistem:
                  </span>
                  <span className="text-xs font-bold text-teal-300 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
                    {students.length} Murid Dimuatkan
                  </span>
                </div>

                {/* Sample students preview */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {students.slice(0, 6).map((s) => (
                    <div 
                      key={s.kp}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 text-xs"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 relative flex-shrink-0 border border-slate-700">
                        {s.gambar ? (
                          <img 
                            src={s.gambar} 
                            alt="" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">
                            {s.nama.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white truncate text-[11px]">{s.nama}</div>
                        <div className="text-[10px] text-slate-400 truncate">{s.kelas} &middot; {s.bidang}</div>
                        <div className="text-[9px] text-teal-400 font-mono flex items-center justify-between">
                          <span>{s.kp}</span>
                          <span className="text-[9px] text-amber-300 font-sans truncate max-w-[80px]">{s.dorm}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TETAPAN WEBHOOK & AUTO-SYNC PERGERAKAN */}
          {activeTab === 'config' && (
            <div className="space-y-5">
              {/* Webhook URL Input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Google Apps Script Web App URL:</span>
                  {config.webhookUrl && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Tersimpan
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/AKfycbzA_6vKr5lwkNunOnO9qwiEPGIsBGFiFBfSvXf3bU4VG7Y5iLdIUHOzk4fQHEjW5fvJ/exec"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Dapatkan URL ini selepas klik <b>Deploy as Web App</b> di Google Apps Script sheet anda.
                </p>
              </div>

              {/* Action Buttons for Testing */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  id="btn-test-webhook"
                  onClick={handleSaveAndTest}
                  disabled={testing || !config.webhookUrl}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-md shadow-emerald-950/50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Menguji Sambungan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Uji Sambungan Webhook
                    </>
                  )}
                </button>

                <button
                  id="btn-sync-all-students"
                  onClick={handleSyncAllStudents}
                  disabled={syncingAll || !config.webhookUrl}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncingAll ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Menghantar {students.length} Murid...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-teal-400" />
                      Hantar Semua {students.length} Data Murid Sekarang
                    </>
                  )}
                </button>
              </div>

              {/* Auto Sync Toggle */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    Auto-Sinkronisasi Masa Nyata (Live Auto-Sync)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Setiap kali murid imbas kad di stesen atau roll-call, data terus dihantar ke Google Sheets secara automatik tanpa perlu klik apa-apa.
                  </p>
                </div>
                <button
                  onClick={handleToggleAutoSync}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                    config.autoSync ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      config.autoSync ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: KOD GOOGLE APPS SCRIPT */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">
                  Salin kod Google Apps Script ini dan tampal ke spreadsheet anda:
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      Disalin ke Papan Keratan!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Salin Kod Script
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 max-h-72 overflow-y-auto leading-relaxed selection:bg-teal-700 selection:text-white">
                <pre>{GOOGLE_APPS_SCRIPT_CODE}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: PANDUAN CARA AMBIL */}
          {activeTab === 'guide' && (
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-teal-300">Bagaimana Cara Mengambil Data dari Google Sheet?</h4>
                <p className="text-slate-400 leading-relaxed">
                  Data diambil terus melalui <b>Google Visualization API (tq export)</b> secara langsung dari pelayar web tanpa memerlukan pengesahan rumit:
                </p>
                <div className="bg-slate-900 p-2 rounded-lg font-mono text-[10px] text-amber-300 break-all">
                  https://docs.google.com/spreadsheets/d/1tNACM32JUAbiSQW1JaI5L53uL67Daa0tXqYcP6bpWGs/gviz/tq?tqx=out:csv&amp;sheet=Murid
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-teal-300">Bagaimana Cara Mengambil &amp; Memaparkan Gambar Google Drive?</h4>
                <p className="text-slate-400 leading-relaxed">
                  Pautan dalam Google Sheet berbentuk:
                </p>
                <div className="bg-slate-900 p-2 rounded-lg font-mono text-[10px] text-slate-300 break-all">
                  https://drive.google.com/uc?export=view&amp;id=<b>1-8B1RhWL3dxkdcvCTCy1gHyaVFld1Mq-</b>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Sistem mengekstrak <b>ID fail</b> Google Drive dan menukarkannya secara automatik kepada pautan CDN langsung Google:
                </p>
                <div className="bg-slate-900 p-2 rounded-lg font-mono text-[10px] text-emerald-300 break-all">
                  https://lh3.googleusercontent.com/d/<b>1-8B1RhWL3dxkdcvCTCy1gHyaVFld1Mq-</b>=w400
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Dengan menggunakan <code className="text-teal-300">referrerPolicy="no-referrer"</code>, foto dipaparkan dengan kelajuan tinggi tanpa sekatan kuki pelayar atau isu CORS!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {students.length} murid sedia ada &bull; {students.filter(s => Boolean(s.gambar)).length} dengan foto Google Drive
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
