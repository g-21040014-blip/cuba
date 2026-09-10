import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Database,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  X,
  Terminal,
  Share2,
  QrCode as QrIcon,
  UploadCloud,
  Trash2,
  Key,
  Globe,
  Smartphone,
  Info,
  RotateCcw
} from 'lucide-react';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  getSupabaseShareUrl
} from '../lib/supabase';
import {
  isSupabaseConfigured,
  getSupabaseSyncErrorState,
  subscribeToSupabaseSyncError,
  testSupabaseRlsPermissions,
  retryPendingSync,
  getPendingSyncCount,
  uploadAllCurrentStateToSupabase,
  SUPABASE_FULL_SETUP_SQL,
  SUPABASE_RLS_FIX_SQL,
  SUPABASE_DISABLE_RLS_SQL,
  SupabaseSyncErrorState
} from '../services/supabaseService';
import { HostelState, Student } from '../types/hostel';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  hostelState?: HostelState;
  students?: Student[];
  onConfigSaved?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  hostelState,
  students = [],
  onConfigSaved
}) => {
  const [errorState, setErrorState] = useState<SupabaseSyncErrorState>(getSupabaseSyncErrorState());
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'upload'>('config');
  const [sqlSubTab, setSqlSubTab] = useState<'full' | 'policy' | 'disable'>('full');
  
  // Input fields for Supabase credentials
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Testing connection state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [pendingCount, setPendingCount] = useState(getPendingSyncCount());
  
  // Share link & QR code
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  const configured = isSupabaseConfigured();

  // Load saved config on open
  useEffect(() => {
    if (isOpen) {
      const saved = getSavedSupabaseConfig();
      setUrlInput(saved.url && !saved.url.includes('placeholder.supabase.co') ? saved.url : '');
      setKeyInput(saved.anonKey && saved.anonKey !== 'placeholder' ? saved.anonKey : '');
      setTestResult(null);
      setSaveSuccessMsg(null);
      setPendingCount(getPendingSyncCount());

      // If already configured, generate QR code for quick mobile scanning
      const shareUrl = getSupabaseShareUrl();
      if (shareUrl) {
        QRCode.toDataURL(shareUrl, { width: 220, margin: 1 })
          .then((url) => setQrCodeDataUrl(url))
          .catch((err) => console.warn('QR generation error:', err));
      } else {
        setQrCodeDataUrl('');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = subscribeToSupabaseSyncError((state) => {
      setErrorState(state);
      setPendingCount(getPendingSyncCount());
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const currentSql =
    sqlSubTab === 'full'
      ? SUPABASE_FULL_SETUP_SQL
      : sqlSubTab === 'policy'
      ? SUPABASE_RLS_FIX_SQL
      : SUPABASE_DISABLE_RLS_SQL;

  const handleSaveAndTest = async () => {
    const cleanUrl = urlInput.trim();
    const cleanKey = keyInput.trim();

    if (!cleanUrl || !cleanUrl.startsWith('https://')) {
      if (onShowToast) onShowToast('Sila masukkan URL Supabase yang sah (bermula https://).', 'error');
      return;
    }
    if (!cleanKey || cleanKey.length < 20) {
      if (onShowToast) onShowToast('Sila masukkan Supabase Anon / Public API Key yang sah.', 'error');
      return;
    }

    setIsSaving(true);
    setTesting(true);
    setTestResult(null);
    setSaveSuccessMsg(null);

    try {
      // 1. Save config to localStorage and recreate dynamic client
      saveSupabaseConfig(cleanUrl, cleanKey);

      // Generate share QR code immediately
      const shareUrl = getSupabaseShareUrl();
      if (shareUrl) {
        QRCode.toDataURL(shareUrl, { width: 220, margin: 1 })
          .then((u) => setQrCodeDataUrl(u))
          .catch(() => {});
      }

      // 2. Test RLS read/write
      const res = await testSupabaseRlsPermissions();
      setTestResult(res);

      if (res.success) {
        setSaveSuccessMsg('Konfigurasi Supabase berjaya disimpan & disahkan aktif!');
        if (onShowToast) onShowToast('Penyambungan Supabase berjaya disahkan!', 'success');
        if (onConfigSaved) onConfigSaved();
      } else {
        if (onShowToast) {
          onShowToast(
            'Kunci disimpan tetapi semakan pangkalan data menunjukkan jadual/polisi belum sedia. Sila semak tab Skrip SQL.',
            'warning'
          );
        }
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Gagal menyambung ke Supabase. Sila periksa URL dan Anon Key.'
      });
    } finally {
      setIsSaving(false);
      setTesting(false);
    }
  };

  const handleClearConfig = () => {
    if (window.confirm('Adakah anda pasti mahu menetapkan semula konfigurasi Supabase kepada konfigurasi lalai rasmi sistem?')) {
      clearSupabaseConfig();
      const def = getSavedSupabaseConfig();
      setUrlInput(def.url);
      setKeyInput(def.anonKey);
      setQrCodeDataUrl('');
      setTestResult(null);
      setSaveSuccessMsg('Konfigurasi telah diset semula kepada sambungan lalai sistem.');
      if (onShowToast) onShowToast('Konfigurasi Supabase telah diset semula kepada sambungan lalai rasmi.', 'info');
      if (onConfigSaved) onConfigSaved();
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = getSupabaseShareUrl();
    if (!shareUrl) {
      if (onShowToast) onShowToast('Sila simpan URL & Key Supabase terlebih dahulu.', 'warning');
      return;
    }
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
    if (onShowToast) onShowToast('Pautan persediaan berjaya disalin! Hantar ke WhatsApp telefon pengawal/warden.', 'success');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(currentSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    if (onShowToast) onShowToast('Skrip SQL berjaya disalin!', 'success');
  };

  const handleUploadAllToCloud = async () => {
    if (!hostelState || students.length === 0) {
      if (onShowToast) onShowToast('Tiada rekod murid untuk dimuat naik.', 'warning');
      return;
    }
    setUploading(true);
    setUploadProgress({ current: 0, total: students.length });

    try {
      const res = await uploadAllCurrentStateToSupabase(
        hostelState.statuses,
        students,
        (current, total) => {
          setUploadProgress({ current, total });
        }
      );

      if (res.success) {
        if (onShowToast) onShowToast(`Berjaya memuat naik status ${res.count} murid ke Supabase!`, 'success');
      } else {
        if (onShowToast) onShowToast(`Muat naik gagal: ${res.error || 'Ralat tidak diketahui'}`, 'error');
      }
    } catch (err: any) {
      if (onShowToast) onShowToast(`Ralat muat naik: ${err?.message}`, 'error');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleRetryPending = async () => {
    setTesting(true);
    try {
      const { synced, failed } = await retryPendingSync();
      setPendingCount(getPendingSyncCount());
      if (onShowToast) {
        if (failed === 0) {
          onShowToast(`Semua ${synced} rekod tertunggak berjaya disegerakkan ke Supabase!`, 'success');
        } else {
          onShowToast(`${synced} disegerak, ${failed} masih tertunggak.`, 'warning');
        }
      }
    } finally {
      setTesting(false);
    }
  };

  const shareUrl = getSupabaseShareUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Pangkalan Data Awan (Supabase Realtime)
                </h2>
                {configured ? (
                  errorState.hasRlsError ? (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Ralat RLS (42501)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Disambung ✓
                    </span>
                  )
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Belum Dikonfigurasi
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Menyegerakkan data antara telefon warden, telefon pengawal, dan kiosk secara masa nyata
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-3 sm:px-4 pt-2.5 pb-2 gap-2 text-xs overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'config'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Tab 1: Kunci &amp; Kongsi Telefon</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'sql'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Tab 2: Skrip SQL</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'upload'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Tab 3: Muat Naik Data</span>
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: CONFIGURATION & SHARING */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  TAB 1: KUNCI SAMBUNGAN &amp; KONGSI TELEFON
                </span>
                <span className="text-[11px] text-slate-400">Langkah 1 daripada 3</span>
              </div>
              
              {/* STATUS BANNER */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start gap-3">
                <Info className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-slate-300 space-y-1">
                  <span className="font-semibold text-white">Kenapa data telefon warden &amp; pengawal tak sama?</span>
                  <p className="text-slate-400 leading-relaxed">
                    Setiap telefon menyimpan data secara berasingan melainkan disambungkan ke projek Supabase yang sama.
                    Isi URL &amp; Key projek Supabase anda di bawah, kemudian salin pautan kongsi ke telefon pengawal &amp; warden lain.
                  </p>
                </div>
              </div>

              {/* INPUT FIELDS */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Key className="w-4 h-4 text-sky-400" />
                  Maklumat Kunci Projek Supabase
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Supabase Project URL:
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="url"
                      placeholder="https://xyzabcdefg.supabase.co"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Didapati di: <b>Supabase Dashboard ➔ Project Settings ➔ API ➔ Project URL</b>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Supabase Anon / Public API Key:
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Didapati di: <b>Supabase Dashboard ➔ Project Settings ➔ API ➔ Project API keys (anon public)</b>
                  </p>
                </div>

                {/* SAVE BUTTON & RESET */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={handleSaveAndTest}
                    disabled={isSaving || testing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all shadow-md disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSaving || testing ? 'animate-spin' : ''}`} />
                    <span>{isSaving || testing ? 'Menyimpan & Menguji...' : 'Simpan & Uji Sambungan'}</span>
                  </button>

                  {configured && (
                    <button
                      onClick={handleClearConfig}
                      title="Set semula ke URL dan Anon Key lalai sistem"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 text-xs font-medium border border-amber-800/40 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Set Semula ke Lalai</span>
                    </button>
                  )}
                </div>

                {/* FEEDBACK MSG */}
                {saveSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {testResult && !saveSuccessMsg && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      testResult.success
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold">
                        {testResult.success ? 'Sambungan Berjaya: ' : 'Sambungan Gagal: '}
                      </span>
                      <span>{testResult.message}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SHARE LINK SECTION (CRITICAL FOR GUARD & WARDEN SYNC) */}
              {configured && shareUrl && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-850 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      Kongsi Tetapan ke Telefon Pengawal &amp; Warden
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pengawal dan warden lain <b>tidak perlu menaip URL atau Key</b> ini. Cuma hantarkan pautan ini ke WhatsApp mereka, atau minta mereka imbas kod QR di bawah dengan kamera telefon.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                    {qrCodeDataUrl && (
                      <div className="p-2 bg-white rounded-xl shadow-lg flex-shrink-0">
                        <img src={qrCodeDataUrl} alt="QR Code Konfigurasi Supabase" className="w-28 h-28" />
                      </div>
                    )}
                    <div className="space-y-2 w-full">
                      <button
                        onClick={handleCopyShareLink}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                      >
                        {copiedShareLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedShareLink ? 'Pautan Disalin! Sedia Dihantar' : 'Salin Pautan Persediaan (WhatsApp)'}</span>
                      </button>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Sila buka pautan ini untuk menyegerakkan data sistem e-SMART SSeMJ secara masa nyata pada telefon anda:\n\n${shareUrl}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-500/40 text-xs font-medium transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Hantar Terus Melalui WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: SQL SCRIPTS */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 space-y-1">
                <span className="font-semibold text-teal-300">Cara Setup Pangkalan Data di Supabase Dashboard:</span>
                <ol className="list-decimal list-inside text-slate-400 space-y-0.5 pt-1">
                  <li>Buka <b>Supabase Dashboard</b> projek anda.</li>
                  <li>Pilih menu <b>SQL Editor</b> di sebelah kiri ➔ Tekan <b>New query</b>.</li>
                  <li>Tampal kod SQL di bawah dan tekan butang hijau <b>RUN</b>.</li>
                </ol>
              </div>

              {/* SUB TABS FOR SQL */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setSqlSubTab('full')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      sqlSubTab === 'full'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Skrip Penuh (Disyorkan)
                  </button>
                  <button
                    onClick={() => setSqlSubTab('policy')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      sqlSubTab === 'policy'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Polisi RLS Sahaja
                  </button>
                  <button
                    onClick={() => setSqlSubTab('disable')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      sqlSubTab === 'disable'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Matikan RLS
                  </button>
                </div>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-all shadow-sm"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Telah Disalin!' : 'Salin SQL'}</span>
                </button>
              </div>

              {/* CODE BLOCK */}
              <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400">
                  <span className="font-mono">schema.sql</span>
                  <span>PostgreSQL</span>
                </div>
                <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60 leading-relaxed selection:bg-sky-500/30">
                  {currentSql}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD CURRENT DATA TO CLOUD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-sky-400" />
                  Muat Naik Status Murid ke Supabase
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Apabila anda baru menyambungkan Supabase, pangkalan data di awan masih kosong.
                  Tekan butang di bawah untuk memuat naik semua rekod status murid ({students.length} murid)
                  dari peranti ini ke pangkalan data Supabase.
                </p>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <div>• Jumlah murid dalam sistem: <b className="text-white">{students.length} orang</b></div>
                  <div>• Peranti sasaran: <b className="text-sky-300">Jadual student_status di Supabase</b></div>
                </div>

                <button
                  onClick={handleUploadAllToCloud}
                  disabled={uploading || !configured}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  <UploadCloud className={`w-4 h-4 ${uploading ? 'animate-bounce' : ''}`} />
                  <span>
                    {uploading
                      ? `Sedang memuat naik... (${uploadProgress?.current || 0}/${uploadProgress?.total || students.length})`
                      : `Muat Naik Status ${students.length} Murid ke Supabase Sekarang`}
                  </span>
                </button>
              </div>

              {pendingCount > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-xs text-amber-300 flex items-center justify-between">
                  <span>Terdapat {pendingCount} log tertunggak di peranti ini.</span>
                  <button
                    onClick={handleRetryPending}
                    disabled={testing}
                    className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors"
                  >
                    Segerak Sekarang
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 hover:underline"
          >
            <span>Buka Supabase Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
