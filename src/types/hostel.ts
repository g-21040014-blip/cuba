export type Gender = 'L' | 'P';
export type StreamType = 'TARI' | 'TEATER' | 'MUZIK' | 'VISUAL';
export type StatusType = 'DALAM' | 'KELUAR' | 'OUTING' | 'BERMALAM' | 'KUARANTIN';

export interface Student {
  id: string;
  kp: string;
  nama: string;
  jantina: Gender;
  kelas: string;
  bidang: StreamType;
  kelasSeni: string;
  gambar: string;
  photo: string | null;
  tingkatan: number;
  dorm?: string;
  namaWaris?: string;
  telWaris?: string;
}

export interface StudentStatus {
  status: StatusType;
  since: number;
  dest?: string;
  expectedReturn?: string;
  guardianName?: string;
  guardianPhone?: string;
  transport?: string;
  alasan?: string;
  passId?: string;
}

export interface HostelLog {
  id: string;
  ts: number;
  kp: string;
  nama: string;
  kelas: string;
  bidang: string;
  action: 'Masuk Asrama' | 'Keluar Asrama' | 'Mula Outing' | 'Tamat Outing' | 'Pulang Bermalam' | 'Kembali Bermalam' | 'Kehadiran' | 'Rawatan / Kuarantin' | 'PERMOHONAN_WARIS' | 'LULUS_WARIS' | 'TOLAK_WARIS' | 'DAFTAR_MURID' | string;
  detail: string;
  officer?: string;
}

export type SessionPeriod = 'SUBUH' | 'ASAR' | 'MAGHRIB' | 'ISYAK' | 'PREP' | 'ROLLCALL';

export interface AttendanceSession {
  key: string;
  period: SessionPeriod;
  dateStr: string;
  label: string;
  timeTarget: string;
}

export interface Warden {
  id: string;
  nama: string;
  jawatan: string;
  blok: string;
  tel: string;
  email?: string;
}

export interface GoogleSheetsConfig {
  webhookUrl: string;
  autoSync: boolean;
  lastSynced?: number;
}

export interface HostelState {
  statuses: Record<string, StudentStatus>;
  logs: HostelLog[];
  attendance: Record<string, Record<string, number>>; // sessionKey -> { kp: timestamp }
}

export type ParentRequestType = 'OUTING' | 'BERMALAM';
export type ParentRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ParentRequest {
  id: string;
  studentKp: string;
  studentNama: string;
  studentKelas: string;
  studentDorm?: string;
  type: ParentRequestType;
  tarikhKeluar: string;
  masaKeluar: string;
  tarikhKembali: string;
  masaKembali: string;
  namaPenjaga: string;
  telPenjaga: string;
  hubungan: string;
  noKenderaan: string;
  sebab: string;
  status: ParentRequestStatus;
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  rejectionReason?: string;
  passId?: string;
}

