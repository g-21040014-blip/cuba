import { ParentRequest } from '../types/hostel';
import { 
  syncParentRequestToCloud, 
  syncParentRequestReviewToCloud 
} from './supabaseService';

const STORAGE_KEY = 'ssemj_parent_requests';

// Initial realistic sample requests for demonstration
const SAMPLE_REQUESTS: ParentRequest[] = [
  {
    id: 'REQ-20260905-001',
    studentKp: '080215011234',
    studentNama: 'MUHAMMAD DANISH BIN AZMAN',
    studentKelas: '4 TARI',
    studentDorm: 'Dorm A1 (Aspura)',
    type: 'OUTING',
    tarikhKeluar: new Date().toISOString().split('T')[0],
    masaKeluar: '14:00',
    tarikhKembali: new Date().toISOString().split('T')[0],
    masaKembali: '19:00',
    namaPenjaga: 'AZMAN BIN HASSAN',
    telPenjaga: '0123456789',
    hubungan: 'Bapa',
    noKenderaan: 'JMG 4321',
    sebab: 'Membeli barangan keperluan peralatan seni & pakaian asrama',
    status: 'PENDING',
    createdAt: Date.now() - 1000 * 60 * 30, // 30 mins ago
  },
  {
    id: 'REQ-20260905-002',
    studentKp: '080512015678',
    studentNama: 'NUR ALYA BATRISYIA BINTI RAZAK',
    studentKelas: '4 MUZIK',
    studentDorm: 'Dorm B2 (Aspuri)',
    type: 'BERMALAM',
    tarikhKeluar: new Date().toISOString().split('T')[0],
    masaKeluar: '16:30',
    tarikhKembali: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    masaKembali: '18:00',
    namaPenjaga: 'RAZAK BIN ISMAIL',
    telPenjaga: '0198765432',
    hubungan: 'Bapa',
    noKenderaan: 'VET 8899',
    sebab: 'Pulang menghadiri majlis perkahwinan keluarga terdekat di Muar',
    status: 'APPROVED',
    createdAt: Date.now() - 1000 * 60 * 180, // 3 hours ago
    reviewedAt: Date.now() - 1000 * 60 * 60,
    reviewedBy: 'NIZAM BIN RUSLI (Ketua Warden Asrama)',
    passId: 'PASS-BM-0905-002'
  }
];

export function loadParentRequests(): ParentRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_REQUESTS));
      return SAMPLE_REQUESTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load parent requests from localStorage', err);
    return SAMPLE_REQUESTS;
  }
}

export function saveParentRequests(requests: ParentRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ssemj_parent_requests_updated'));
    }
  } catch (err) {
    console.error('Failed to save parent requests to localStorage', err);
  }
}

export function createParentRequest(
  data: Omit<ParentRequest, 'id' | 'createdAt' | 'status'>
): ParentRequest {
  const current = loadParentRequests();
  const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(current.length + 1).padStart(3, '0');
  const newId = `REQ-${dateCode}-${seq}`;

  const newRequest: ParentRequest = {
    ...data,
    id: newId,
    status: 'PENDING',
    createdAt: Date.now(),
  };

  const updated = [newRequest, ...current];
  saveParentRequests(updated);

  // Sync to Supabase cloud so laptop/warden sees it immediately
  syncParentRequestToCloud(newRequest).catch(err => {
    console.warn('Background sync error for new parent request:', err);
  });

  return newRequest;
}

export function approveParentRequest(
  id: string,
  reviewedBy: string
): { request: ParentRequest; passId: string } | null {
  const current = loadParentRequests();
  const index = current.findIndex(r => r.id === id);
  if (index === -1) return null;

  const target = current[index];
  const prefix = target.type === 'OUTING' ? 'PASS-OT' : 'PASS-BM';
  const passId = `${prefix}-${new Date().toISOString().slice(5, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const updatedRequest: ParentRequest = {
    ...target,
    status: 'APPROVED',
    reviewedAt: Date.now(),
    reviewedBy,
    passId,
    rejectionReason: undefined
  };

  current[index] = updatedRequest;
  saveParentRequests(current);

  // Sync status to cloud
  syncParentRequestReviewToCloud(updatedRequest, 'APPROVED').catch(err => {
    console.warn('Background sync error for approved request:', err);
  });

  return { request: updatedRequest, passId };
}

export function rejectParentRequest(
  id: string,
  reviewedBy: string,
  reason: string
): ParentRequest | null {
  const current = loadParentRequests();
  const index = current.findIndex(r => r.id === id);
  if (index === -1) return null;

  const updatedRequest: ParentRequest = {
    ...current[index],
    status: 'REJECTED',
    reviewedAt: Date.now(),
    reviewedBy,
    rejectionReason: reason || 'Permohonan tidak memenuhi syarat semasa asrama.'
  };

  current[index] = updatedRequest;
  saveParentRequests(current);

  // Sync status to cloud
  syncParentRequestReviewToCloud(updatedRequest, 'REJECTED').catch(err => {
    console.warn('Background sync error for rejected request:', err);
  });

  return updatedRequest;
}

export function deleteParentRequest(id: string): void {
  const current = loadParentRequests();
  const filtered = current.filter(r => r.id !== id);
  saveParentRequests(filtered);
}

// Merge requests received from Supabase cloud into localStorage
export function mergeIncomingParentRequests(cloudRequests: ParentRequest[]): boolean {
  if (!Array.isArray(cloudRequests) || cloudRequests.length === 0) return false;
  const current = loadParentRequests();
  const map = new Map<string, ParentRequest>();

  // Add current local requests first
  current.forEach(r => map.set(r.id, r));

  let changed = false;
  // Merge cloud requests (cloud status takes precedence if newer or reviewed)
  cloudRequests.forEach(cr => {
    const existing = map.get(cr.id);
    if (!existing) {
      map.set(cr.id, cr);
      changed = true;
    } else {
      // If cloud has reviewed status and local is pending, update
      if (cr.status !== existing.status || (cr.reviewedAt || 0) > (existing.reviewedAt || 0)) {
        map.set(cr.id, { ...existing, ...cr });
        changed = true;
      }
    }
  });

  if (changed) {
    const mergedList = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedList));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ssemj_parent_requests_updated'));
      }
    } catch {}
    return true;
  }
  return false;
}

// Generate pre-filled WhatsApp link for Warden to notify parent
export function getWhatsAppNotificationUrl(
  request: ParentRequest,
  wardenName: string,
  type: 'APPROVED' | 'REJECTED'
): string {
  const cleanPhone = request.telPenjaga.replace(/[^0-9]/g, '');
  const phoneWithCountry = cleanPhone.startsWith('60') 
    ? cleanPhone 
    : cleanPhone.startsWith('0') 
      ? `6${cleanPhone}` 
      : `60${cleanPhone}`;

  let message = '';
  if (type === 'APPROVED') {
    message = 
`*PENGESAHAN KELULUSAN PERMOHONAN ASRAMA SSeMJ*
Sekolah Seni Malaysia Johor

Salam Sejahtera Tuan/Puan *${request.namaPenjaga}*,

Permohonan *${request.type === 'OUTING' ? 'Outing Harian' : 'Pulang Bermalam'}* bagi anak/jagaan anda telah *DILULUSKAN*.

 Maklumat Permohonan:
• *Nama Murid:* ${request.studentNama}
• *Kelas:* ${request.studentKelas}
• *Tarikh/Masa Keluar:* ${request.tarikhKeluar} (${request.masaKeluar})
• *Tarikh/Masa Kembali:* ${request.tarikhKembali} (${request.masaKembali})
• *No. Kenderaan:* ${request.noKenderaan}
• *No. Pas Pelepasan:* ${request.passId || '-'}
• *Warden Meluluskan:* ${wardenName}

Peringatan: Sila patuhi masa kembali ke asrama yang ditetapkan dan patuhi SOP keselamatan pos kawalan asrama. Terima kasih.`;
  } else {
    message = 
`*MAKLUMAN STATUS PERMOHONAN ASRAMA SSeMJ*
Sekolah Seni Malaysia Johor

Salam Sejahtera Tuan/Puan *${request.namaPenjaga}*,

Dukacita dimaklumkan bahawa permohonan *${request.type === 'OUTING' ? 'Outing Harian' : 'Pulang Bermalam'}* bagi anak/jagaan anda:
• *Nama Murid:* ${request.studentNama} (${request.studentKelas})

*TIDAK DAPAT DILULUSKAN* atas sebab:
"${request.rejectionReason || 'Sebab kekangan aktiviti sekolah/asrama'}"

• *Warden Bertugas:* ${wardenName}

Sebarang pertanyaan lanjut, sila berhubung terus dengan pihak Pengurusan Asrama SSeMJ. Terima kasih.`;
  }

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
}
