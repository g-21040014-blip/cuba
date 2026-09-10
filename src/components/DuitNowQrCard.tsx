import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, Download, Printer } from 'lucide-react';

interface DuitNowQrCardProps {
  title: string;                 // e.g. Student name ("NASI LEMAK BEST" in image)
  subtitle?: string;              // e.g. "TINGKATAN 4 SENI TARI · NO. KP: 080203-01-4321"
  qrValue: string;               // Scannable text payload
  codeNumber?: string;           // e.g. "PAS-4-4321-9921"
  bannerText?: string;           // e.g. "KOD PELEPASAN RASMI SSeMJ" (matches "MALAYSIA NATIONAL QR")
  footerNote?: string;           // e.g. "Diterima & Disahkan oleh Pengawal Keselamatan & Warden"
  compact?: boolean;
}

export const DuitNowQrCard: React.FC<DuitNowQrCardProps> = ({
  title,
  subtitle,
  qrValue,
  codeNumber,
  bannerText = 'KOD KESELAMATAN RASMI SSeMJ',
  footerNote = 'Diterima oleh Pengawal Keselamatan & Pengurusan Asrama SSeMJ',
  compact = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Fixed iconic DuitNow Pink color only
  const themeConfig = {
    primary: '#D9146C',
    primaryBg: 'bg-[#D9146C]',
    border: 'border-[#D9146C]',
    text: 'text-[#D9146C]',
    qrDark: '#D9146C',
  };

  useEffect(() => {
    let isMounted = true;
    if (!qrValue) return;

    QRCode.toDataURL(qrValue, {
      width: 450,
      margin: 1,
      color: {
        dark: themeConfig.qrDark,
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR generation failed:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [qrValue]);

  return (
    <div className="flex flex-col items-center select-none">
      {/* Main DuitNow QR Card Frame */}
      <div 
        className={`w-full ${compact ? 'max-w-[260px]' : 'max-w-[310px]'} bg-white rounded-3xl border-4 ${themeConfig.border} shadow-xl overflow-hidden text-center transition-all duration-300`}
        style={{ borderColor: themeConfig.primary }}
      >
        {/* Top White Area: Header Logo & Subtitle */}
        <div className="pt-4 pb-2 px-4 flex flex-col items-center">
          {/* Logo Badge Icon */}
          <div className="flex items-center gap-1.5">
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs shadow-xs"
              style={{ backgroundColor: themeConfig.primary }}
            >
              Q
            </div>
            <div className="text-left">
              <div 
                className="font-black text-xs sm:text-sm tracking-tight leading-none"
                style={{ color: themeConfig.primary }}
              >
                SSeMJ<span className="text-slate-900 font-extrabold">QR</span>
              </div>
              <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                ID Pelepasan Rasmi
              </div>
            </div>
          </div>

          {/* Real Scannable Colored QR Matrix */}
          <div className="my-2.5 p-1 bg-white rounded-xl flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Kod ${title}`}
                className={`${compact ? 'w-36 h-36' : 'w-44 h-44'} object-contain block`}
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className={`${compact ? 'w-36 h-36' : 'w-44 h-44'} bg-slate-100 flex items-center justify-center text-xs text-slate-400 animate-pulse rounded-lg`}>
                Menjana QR...
              </div>
            )}
          </div>

          {/* Name Display Under QR (Like "NASI LEMAK BEST" in user's image) */}
          <div className="w-full px-1">
            <div className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-2 leading-tight">
              {title}
            </div>
            {subtitle && (
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-tight mt-0.5">
                {subtitle}
              </div>
            )}
            {codeNumber && (
              <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                NO: {codeNumber}
              </div>
            )}
          </div>
        </div>

        {/* The Colored Banner Band (Like "MALAYSIA NATIONAL QR" in user's image) */}
        <div 
          className="py-1.5 px-3 text-white font-black text-[10px] sm:text-[11px] uppercase tracking-wider shadow-inner"
          style={{ backgroundColor: themeConfig.primary }}
        >
          {bannerText}
        </div>

        {/* Bottom Card White Section (Like MAE Merchant Partner in user's image) */}
        <div className="p-3 bg-white flex flex-col items-center justify-center border-t border-slate-100">
          <div className="text-[8px] sm:text-[9px] font-medium text-slate-500 text-center leading-tight mb-1.5">
            {footerNote}
          </div>
          
          {/* Official School Logo */}
          <div className="flex items-center gap-2 mt-0.5">
            <img
              src="/logo_ssemj_original.jpg"
              alt="Logo SSeMJ"
              className="h-8 w-auto object-contain"
            />
            <div className="text-left border-l border-slate-300 pl-2">
              <div className="text-[9px] font-black uppercase tracking-tight text-slate-900 leading-tight">
                Sekolah Seni Malaysia Johor
              </div>
              <div className="text-[8px] font-bold text-slate-600 uppercase tracking-tight">
                Pondok Kawalan Keselamatan
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
