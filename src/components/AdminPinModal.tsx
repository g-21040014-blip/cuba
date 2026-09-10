import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldAlert, KeyRound, X, ArrowRight } from 'lucide-react';
import { getAdminPin, matchesSecret } from '../config/securityConfig';

export { getAdminPin };

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const correctPin = getAdminPin();

    if (matchesSecret(pin, correctPin)) {
      onSuccess();
      onClose();
    } else {
      setError('Kata laluan / PIN Pentadbir tidak sah. Sila cuba lagi.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-amber-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-lg leading-tight">Pengesahan Pentadbir (Admin)</h3>
          <p className="text-amber-100 text-xs mt-1">
            Akses kepada Google Sheet adalah terhad untuk Admin sahaja.
          </p>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Masukkan Kata Laluan / PIN Pentadbir
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-4 w-4 text-slate-400" />
              </div>
              <input
                ref={inputRef}
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Kata Laluan / PIN"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-center text-base font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-600 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-2">
              Sila masukkan PIN Admin sistem untuk membuka penyelarasan Google Sheet.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all"
            >
              <span>Sahkan &amp; Masuk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
