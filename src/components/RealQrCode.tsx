import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface RealQrCodeProps {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
  includeBorder?: boolean;
}

export const RealQrCode: React.FC<RealQrCodeProps> = ({
  value,
  size = 128,
  className = '',
  alt = 'Kod QR Rasmi',
  includeBorder = false,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!value) {
      setDataUrl('');
      return;
    }

    QRCode.toDataURL(value, {
      width: Math.max(size * 2, 256), // 2x resolution for crisp high-DPI and printing
      margin: 1,
      color: {
        dark: '#0f172a', // deep slate
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setError(false);
        }
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
        if (isMounted) setError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (error || !dataUrl) {
    return (
      <div 
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-slate-100 rounded text-[10px] text-slate-400 font-mono ${className}`}
      >
        ...
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain block ${includeBorder ? 'p-1 bg-white rounded-lg border border-slate-200 shadow-2xs' : ''} ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
