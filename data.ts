import { MenuGroup } from './types';

export const navigationMenu: MenuGroup[] = [
  {
    title: 'Utama',
    items: [
      { id: 'dashboard', label: 'Papan Pemuka', icon: 'LayoutDashboard' },
    ],
  },
  {
    title: 'Pendaftaran',
    items: [
      { id: 'upload-data', label: 'Setup Apps Script (Data)', icon: 'Database' },
      { id: 'register-block', label: 'Daftar Blok Asrama', icon: 'Building' },
      { id: 'register-room', label: 'Daftar Bilik Asrama', icon: 'DoorClosed' },
      { id: 'register-student', label: 'Daftar Asrama Pelajar', icon: 'GraduationCap' },
      { id: 'register-warden', label: 'Daftar Warden Asrama', icon: 'UserCircle' },
      { id: 'register-committee', label: 'Daftar AJK Asrama', icon: 'Users' },
    ],
  },
  {
    title: 'Organisasi',
    items: [
      { id: 'org-chart-warden', label: 'Carta Organisasi (Warden)', icon: 'Network' },
      { id: 'org-chart-student', label: 'Carta Organisasi (Pelajar)', icon: 'Network' },
    ],
  },
  {
    title: 'Pergerakan',
    items: [
      { id: 'nfc-scanner', label: 'Imbasan Pintu Pagar (NFC)', icon: 'ScanFace' },
      { id: 'apply-out-child', label: 'Mohon Anak Keluar', icon: 'LogOut' },
      { id: 'apply-out-student', label: 'Mohon Pelajar Keluar', icon: 'LogOut' },
      { id: 'approve-out', label: 'Kelulusan Keluar Asrama', icon: 'CheckSquare' },
      { id: 'record-out', label: 'Rekod Keluar Asrama', icon: 'History' },
      { id: 'record-in', label: 'Rekod Masuk Asrama', icon: 'History' },
      { id: 'record-school-out', label: 'Rekod Ke Sekolah (QR)', icon: 'BookOpen' },
      { id: 'record-school-in', label: 'Rekod Balik Asrama (QR)', icon: 'Home' },
      { id: 'school-attendance-stats', label: 'Statistik Kehadiran Sekolah', icon: 'BarChart3' },
      { id: 'data-report', label: 'Data Keluar/Masuk', icon: 'Database' },
    ],
  },
];
