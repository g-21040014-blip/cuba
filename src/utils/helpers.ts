import { Student, StatusType } from '../types/hostel';

const STOPWORDS = new Set(['BIN', 'BINTI', 'A/L', 'A/P', 'ANAK', 'BT', 'AP', 'AL']);
const AVATAR_COLORS = [
  '#0d9488', // teal-600
  '#d97706', // amber-600
  '#4f46e5', // indigo-600
  '#e11d48', // rose-600
  '#059669', // emerald-600
  '#0284c7', // sky-600
  '#7c3aed', // violet-600
  '#ea580c'  // orange-600
];

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getStudentInitials(name: string): string {
  if (!name) return '??';
  const parts = name.split(/\s+/).filter(p => p && !STOPWORDS.has(p.toUpperCase()));
  const first = (parts[0] || name)[0] || '?';
  const second = (parts[1] || '')[0] || '';
  return (first + second).toUpperCase();
}

export function getAvatarColor(key: string): string {
  return AVATAR_COLORS[hashString(key) % AVATAR_COLORS.length];
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ', ' + formatTime(ts);
}

export function getRelativeTime(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'Baru sahaja';
  if (mins < 60) return `${mins} minit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam ${mins % 60}m lalu`;
  const days = Math.floor(hrs / 24);
  return `${days} hari lalu`;
}

export function isOutingOverdue(expectedReturn?: string): boolean {
  if (!expectedReturn) return false;
  // Format could be 'HH:mm' or 'Day, HH:mm'
  const timeMatch = expectedReturn.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return false;
  const expHours = parseInt(timeMatch[1], 10);
  const expMins = parseInt(timeMatch[2], 10);
  const now = new Date();
  const exp = new Date();
  exp.setHours(expHours, expMins, 0, 0);

  // If time specified has passed today
  return now.getTime() > exp.getTime();
}

export function getStatusBadgeConfig(status: StatusType): {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'DALAM':
      return {
        label: 'Dalam Asrama',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500'
      };
    case 'KELUAR':
      return {
        label: 'Keluar Asrama',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500'
      };
    case 'OUTING':
      return {
        label: 'Sedang Outing',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-500'
      };
    case 'BERMALAM':
      return {
        label: 'Pulang Bermalam',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500'
      };
    case 'KUARANTIN':
      return {
        label: 'Bilik Sakit / Kuarantin',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        dot: 'bg-purple-500'
      };
  }
}

export function getBidangColor(bidang: string): { bg: string; text: string; border: string } {
  switch (bidang) {
    case 'TARI':
      return { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' };
    case 'TEATER':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
    case 'MUZIK':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'VISUAL':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  }
}
