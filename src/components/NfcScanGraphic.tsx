import React from 'react';
import { Check, X, Wifi, User, Radio, Sparkles } from 'lucide-react';
import { Student } from '../types/hostel';
import { getStudentInitials, getAvatarColor } from '../utils/helpers';

export type NfcScanState = 'idle' | 'scanning' | 'success' | 'error' | 'matched';

interface NfcScanGraphicProps {
  state: NfcScanState;
  student?: Student | null;
  message?: string;
  detail?: string;
  onRetry?: () => void;
  statusBadge?: {
    text: string;
    type: 'in' | 'out' | 'outing' | 'warn';
  };
  compact?: boolean;
}

export const NfcScanGraphic: React.FC<NfcScanGraphicProps> = ({
  state,
  student,
  message,
  detail,
  onRetry,
  statusBadge,
  compact = false,
}) => {
  const isSuccess = state === 'success';
  const isError = state === 'error';
  const isMatched = state === 'matched' || (isSuccess && student);
  const isIdle = state === 'idle' || state === 'scanning';

  // Ripple color theme based on state
  const rippleTheme = isError
    ? {
        outer: 'bg-rose-100/40 border-rose-200/50',
        middle: 'bg-rose-100/70 border-rose-200/70',
        inner: 'bg-rose-200/60 border-rose-300/80',
        glow: 'shadow-rose-500/20',
        badgeBg: 'bg-rose-500 text-white shadow-lg shadow-rose-500/40',
        cardGradient: 'from-rose-500 to-orange-500',
      }
    : isSuccess
    ? {
        outer: 'bg-emerald-100/40 border-emerald-200/50',
        middle: 'bg-emerald-100/70 border-emerald-200/70',
        inner: 'bg-emerald-200/60 border-emerald-300/80',
        glow: 'shadow-emerald-500/20',
        badgeBg: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40',
        cardGradient: 'from-teal-500 to-emerald-600',
      }
    : {
        outer: 'bg-sky-100/35 border-sky-200/40',
        middle: 'bg-sky-100/65 border-sky-200/60',
        inner: 'bg-sky-200/60 border-sky-300/80',
        glow: 'shadow-sky-500/20',
        badgeBg: 'bg-sky-500 text-white shadow-lg shadow-sky-500/40',
        cardGradient: 'from-sky-400 via-blue-500 to-indigo-600',
      };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${compact ? 'py-4' : 'py-8'}`}>
      {/* 1. SOFT CONCENTRIC RIPPLES (MATCHING USER SCREENSHOT) */}
      <div className="relative flex items-center justify-center">
        {/* Outer Wave */}
        <div
          className={`absolute rounded-full border transition-all duration-700 ease-out animate-[pulse_3s_ease-in-out_infinite] ${
            compact ? 'w-48 h-48' : 'w-72 h-72 sm:w-80 sm:h-80'
          } ${rippleTheme.outer}`}
        />

        {/* Middle Wave */}
        <div
          className={`absolute rounded-full border transition-all duration-500 ease-out ${
            compact ? 'w-36 h-36' : 'w-56 h-56 sm:w-64 sm:h-64'
          } ${rippleTheme.middle}`}
        />

        {/* Inner Wave */}
        <div
          className={`absolute rounded-full border transition-all duration-500 ease-out ${
            compact ? 'w-28 h-28' : 'w-44 h-44 sm:w-48 sm:h-48'
          } ${rippleTheme.inner}`}
        />

        {/* 2. CENTER STAGE GRAPHIC */}
        {isMatched && student ? (
          /* ========================================================
             MATCHED STATE: PRO REALISTIC DIGITAL SMART CARD
             (Matches Screen 3 from reference: "It's Match!")
             ======================================================== */
          <div className="relative z-10 animate-in zoom-in-95 fade-in duration-300">
            <div
              className={`rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-700 text-white p-4 sm:p-5 shadow-2xl shadow-blue-900/30 border border-white/20 relative overflow-hidden transition-transform duration-300 hover:scale-[1.02] ${
                compact ? 'w-64 h-38' : 'w-72 sm:w-80 h-44 sm:h-48'
              }`}
            >
              {/* Card glossy shimmer highlight */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-sky-400/20 rounded-full blur-lg pointer-events-none" />

              {/* Card Header: Institution & Contactless waves */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center backdrop-blur-xs">
                    <Radio className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider text-sky-100 uppercase">
                    e-APPS • SSeMJ
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-sky-200 rotate-90" />
                  <span className="text-[9px] font-mono tracking-widest text-sky-200/80">NFC</span>
                </div>
              </div>

              {/* Card Body: Chip + Student Photo/Avatar & Info */}
              <div className="flex items-center gap-3 mt-2 sm:mt-3">
                {/* Chip graphic */}
                <div className="hidden sm:flex flex-col justify-between w-8 h-6 rounded-md bg-amber-200 border border-amber-300 p-0.5 shadow-inner shrink-0">
                  <div className="h-0.5 w-full bg-amber-400/60 rounded-xs" />
                  <div className="h-0.5 w-full bg-amber-400/60 rounded-xs" />
                </div>

                {/* Avatar / Photo */}
                <div
                  className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden flex items-center justify-center font-bold text-white shadow-md border-2 border-white/30 shrink-0 relative"
                  style={{ backgroundColor: getAvatarColor(student.kp) }}
                >
                  {getStudentInitials(student.nama)}
                  {student.gambar && (
                    <img
                      src={student.gambar}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>

                {/* Student Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold tracking-tight text-white line-clamp-1">
                    {student.nama}
                  </p>
                  <p className="text-[10px] text-sky-100 font-mono mt-0.5 tracking-wider">
                    KP: {student.kp}
                  </p>
                  <p className="text-[10px] text-sky-200 mt-0.5 flex items-center gap-1">
                    <span>Ting. {student.tingkatan} {student.kelas}</span>
                    {student.dorm && (
                      <>
                        <span>&bull;</span>
                        <span className="line-clamp-1">{student.dorm}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Card Footer: Status Pill */}
              <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between">
                <span className="text-[9px] tracking-widest text-sky-200/90 uppercase font-mono">
                  Smart Matric Card
                </span>
                {statusBadge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      statusBadge.type === 'in'
                        ? 'bg-emerald-400 text-emerald-950 font-extrabold'
                        : statusBadge.type === 'out'
                        ? 'bg-amber-300 text-amber-950 font-extrabold'
                        : 'bg-white text-blue-900 font-bold'
                    }`}
                  >
                    {statusBadge.text}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             SCANNING / SUCCESS / ERROR STATE: PHONE & HOVERING CARD
             (Matches Screens 1 & 2 from reference image)
             ======================================================== */
          <div className="relative z-10 flex flex-col items-center">
            
            {/* The Stylized Modern White Phone Graphic */}
            <div
              className={`relative bg-white rounded-[32px] border-2 border-slate-200 shadow-2xl shadow-slate-300/60 p-2.5 transition-all duration-300 flex flex-col items-center justify-between ${
                compact ? 'w-24 h-36' : 'w-32 sm:w-36 h-48 sm:h-52'
              }`}
            >
              {/* Phone Speaker & Camera Notch */}
              <div className="flex items-center gap-1.5 pt-1">
                <div className="w-6 h-1 rounded-full bg-slate-300" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              </div>

              {/* Phone Screen Area */}
              <div className="w-full flex-1 my-1.5 rounded-[20px] bg-slate-50/80 border border-slate-100 flex flex-col items-center justify-center p-2 relative overflow-hidden">
                {/* Floating Wave/Indicator inside screen */}
                <div className="flex flex-col items-center justify-center">
                  <div
                    className={`rounded-full p-2.5 transition-all duration-300 ${
                      isError
                        ? 'bg-rose-50 text-rose-500'
                        : isSuccess
                        ? 'bg-emerald-50 text-emerald-500'
                        : 'bg-sky-50 text-sky-500 animate-pulse'
                    }`}
                  >
                    <Radio className={`${compact ? 'w-4 h-4' : 'w-6 h-6'}`} />
                  </div>
                  <span className="text-[9px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                    {isError ? 'Gagal' : isSuccess ? 'Dikesan' : 'NFC'}
                  </span>
                </div>
              </div>

              {/* Phone Home Indicator Bar */}
              <div className="w-10 h-1 rounded-full bg-slate-300 pb-0.5" />

              {/* HOVERING SMART CARD SLIDING ACROSS PHONE (THE HERO GRAPHIC FROM MOCKUP) */}
              <div
                className={`absolute -top-5 sm:-top-7 w-22 sm:w-26 h-14 sm:h-16 rounded-xl shadow-xl border border-white/40 p-1.5 flex flex-col justify-between transition-all duration-500 bg-gradient-to-tr ${rippleTheme.cardGradient} ${
                  isIdle ? 'animate-[bounce_3s_ease-in-out_infinite]' : 'scale-105'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Wifi className="w-3 h-3 text-white/90 rotate-90" />
                  <div className="w-3 h-2 rounded-xs bg-amber-200/90 border border-amber-300 shadow-2xs" />
                </div>

                {/* Center Badge on Card: Tick or Cross */}
                <div className="flex items-center justify-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md ${rippleTheme.badgeBg}`}>
                    {isSuccess ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isError ? (
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <Wifi className="w-3 h-3 stroke-[2.5]" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[7px] text-white/80 font-mono font-medium">
                  <span>SMART ID</span>
                  <span>••••</span>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* 3. TYPOGRAPHY & STATUS MESSAGING (MATCHING USER SCREENSHOT) */}
      <div className={`text-center relative z-10 ${compact ? 'mt-3' : 'mt-6 sm:mt-8'}`}>
        {/* Step Indicator */}
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
          {isMatched ? 'PADANAN KAD DITEMUI' : isError ? 'RALAT IMBASAN' : 'LANGKAH IMBASAN KAD'}
        </p>

        {/* Main Title */}
        <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
          {message || (isError ? 'Imbasan Tidak Berjaya' : isSuccess ? 'Imbasan Berjaya' : 'Sedia Untuk Imbas')}
        </h2>

        {/* Subtitle description */}
        <p className="text-xs sm:text-sm text-slate-500 max-w-xs sm:max-w-sm mx-auto mt-1 leading-relaxed">
          {detail ||
            (isError
              ? 'Kad belum didaftarkan atau imbasan terlalu pantas. Sila sentuhkan kad sekali lagi.'
              : isSuccess
              ? 'Maklumat murid telah direkodkan dan status telah dikemaskini.'
              : 'Sentuhkan kad pintar asrama pada pembaca RFID / telefon anda')}
        </p>

        {/* Action Button (e.g. Try Again button from Screenshot 2) */}
        {isError && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Cuba Lagi</span>
          </button>
        )}
      </div>
    </div>
  );
};
