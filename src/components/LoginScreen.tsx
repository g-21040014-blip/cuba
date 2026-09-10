import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, KeyRound, LogIn, Eye, EyeOff, HeartHandshake, ChevronRight, QrCode } from 'lucide-react';
import { getAdminPin, getWardenPin, getGuardPin, matchesSecret } from '../config/securityConfig';

interface LoginScreenProps {
  onLogin: (role: 'admin' | 'warden' | 'guard', name: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [role, setRole] = useState<'admin' | 'warden' | 'guard'>('warden');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const adminPin = getAdminPin();
  const wardenPin = getWardenPin();
  const guardPin = getGuardPin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = pin.trim();

    const isAdmin = matchesSecret(trimmed, adminPin);
    const isWarden = matchesSecret(trimmed, wardenPin);
    const isGuard = matchesSecret(trimmed, guardPin);

    // Direct role match against configured PINs
    if (role === 'admin' && isAdmin) {
      onLogin('admin', 'Pentadbir Sistem');
      return;
    } 
    if (role === 'warden' && isWarden) {
      onLogin('warden', 'Warden');
      return;
    } 
    if (role === 'guard' && isGuard) {
      onLogin('guard', 'Pengawal Keselamatan');
      return;
    }

    // Smart fallback if user entered another role's valid PIN
    if (isAdmin) {
      onLogin('admin', 'Pentadbir Sistem');
      return;
    }
    if (isWarden) {
      onLogin('warden', 'Warden');
      return;
    }
    if (isGuard) {
      onLogin('guard', 'Pengawal Keselamatan');
      return;
    }

    setError('Kata laluan / PIN tidak sah. Sila masukkan kata laluan yang betul.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-center text-white">
          <div className="bg-white p-2 rounded-xl inline-block mb-4 shadow-sm ring-1 ring-slate-200">
            <img src="/logo_ssemj_original.jpg" alt="Logo" className="h-24 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">e-APPS</h1>
          <p className="text-blue-100 mt-2 text-sm">Sila pilih peranan dan masukkan PIN</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => { setRole('admin'); setError(''); }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  role === 'admin' 
                    ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-xs' 
                    : 'border-slate-200 hover:border-amber-200 text-slate-500'
                }`}
              >
                <ShieldCheck className="w-6 h-6 mb-1.5 text-amber-600" />
                <span className="font-semibold text-xs">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => { setRole('warden'); setError(''); }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  role === 'warden' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs' 
                    : 'border-slate-200 hover:border-blue-200 text-slate-500'
                }`}
              >
                <ShieldAlert className="w-6 h-6 mb-1.5 text-blue-600" />
                <span className="font-semibold text-xs">Warden</span>
              </button>
              
              <button
                type="button"
                onClick={() => { setRole('guard'); setError(''); }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  role === 'guard' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs' 
                    : 'border-slate-200 hover:border-blue-200 text-slate-500'
                }`}
              >
                <Shield className="w-6 h-6 mb-1.5 text-slate-600" />
                <span className="font-semibold text-xs">Pengawal</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Masukkan Kata Laluan / PIN {role === 'admin' ? 'Pentadbir (Admin)' : role === 'warden' ? 'Warden' : 'Pengawal'}
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="block w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-mono transition-colors"
                  placeholder="Kata Laluan / PIN"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showPin ? "Sembunyi Kata Laluan" : "Papar Kata Laluan"}
                >
                  {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {error && (
                <p className="mt-2 text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md shadow-blue-500/20 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Log Masuk
            </button>
          </form>

          {/* Direct Public Kiosk Link */}
          <div className="mt-4">
            <a
              href="/scanner"
              className="w-full bg-emerald-50 hover:bg-emerald-100 rounded-xl p-3 border border-emerald-200 flex items-center justify-between gap-2 text-emerald-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <div className="text-left">
                  <div className="text-xs font-bold">Kiosk Imbasan Kad &amp; QR Awam</div>
                  <div className="text-[11px] text-emerald-600">Imbas kad murid terus tanpa perlu PIN log masuk</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600" />
            </a>
          </div>

          {/* PARENT & PUBLIC DIRECT ACCESS */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
            <a
              href="/waris"
              onClick={(e) => {
                // If SPA navigation preferred or fallback to hash/search
                window.location.href = '/waris';
              }}
              className="w-full bg-blue-50/90 hover:bg-blue-100/90 rounded-2xl p-3.5 border border-blue-200/80 flex items-center justify-between gap-3 transition-all group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                    Portal Waris &amp; Ibu Bapa
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Mohon pelepasan outing &amp; semak status rasmi (/waris)
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </a>

            <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
              <span>Laluan pantas awam:</span>
              <div className="flex items-center gap-2 font-mono">
                <a href="/waris" className="text-blue-600 hover:underline">/waris</a>
                <span>&bull;</span>
                <a href="/scanner" className="text-slate-600 hover:underline">/scanner</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
