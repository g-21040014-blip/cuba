/**
 * =======================================================================================
 * FAIL KONFIGURASI KATA LALUAN / PIN KESELAMATAN SISTEM ASRAMA (SSEMJ)
 * Lokasi Fail: src/config/securityConfig.ts
 * =======================================================================================
 * 
 * Anda boleh menukar kata laluan / PIN untuk Admin, Warden dan Pengawal di sini.
 * Cukup tukar nilai nombor di bawah dan simpan fail ini:
 */

export const SYSTEM_SECURITY_CONFIG = {
  // 1. PIN Pentadbir / Admin (Kawalan Penuh, Google Sheets, Konfigurasi Sistem)
  ADMIN_PIN: 'spark',

  // 2. PIN Warden Bertugas (Kelulusan Outing, Cuti Bermalam, Laporan Harian)
  WARDEN_PIN: '1234',

  // 3. PIN Pengawal Keselamatan / Guard (Stesen Imbasan NFC & Pengesahan Pintu Pagar)
  GUARD_PIN: '9999',
};

export function matchesSecret(input: string, targetSecret: string): boolean {
  if (!input || !targetSecret) return false;
  const cleanInput = input.trim();
  const cleanTarget = targetSecret.trim().replace(/^["']|["']$/g, '');
  return cleanInput === cleanTarget || cleanInput.toLowerCase() === cleanTarget.toLowerCase();
}

/**
 * Fungsi pembaca PIN rasmi sistem:
 * - Membaca pembolehubah persekitaran (VITE_*) jika wujud.
 * - Jika tiada, membaca nilai terus dari SYSTEM_SECURITY_CONFIG di atas.
 */
export function getAdminPin(): string {
  const envPin = import.meta.env.VITE_ADMIN_PIN;
  if (envPin && typeof envPin === 'string' && envPin.trim() !== '') {
    return envPin.trim().replace(/^["']|["']$/g, '');
  }
  return (SYSTEM_SECURITY_CONFIG.ADMIN_PIN || '8888').trim().replace(/^["']|["']$/g, '');
}

export function getWardenPin(): string {
  const envPin = import.meta.env.VITE_WARDEN_PIN;
  if (envPin && typeof envPin === 'string' && envPin.trim() !== '') {
    return envPin.trim().replace(/^["']|["']$/g, '');
  }
  return (SYSTEM_SECURITY_CONFIG.WARDEN_PIN || '1234').trim().replace(/^["']|["']$/g, '');
}

export function getGuardPin(): string {
  const envPin = import.meta.env.VITE_GUARD_PIN;
  if (envPin && typeof envPin === 'string' && envPin.trim() !== '') {
    return envPin.trim().replace(/^["']|["']$/g, '');
  }
  return (SYSTEM_SECURITY_CONFIG.GUARD_PIN || '9999').trim().replace(/^["']|["']$/g, '');
}
