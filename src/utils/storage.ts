import { HostelState, StudentStatus, HostelLog } from '../types/hostel';
import { INITIAL_STUDENTS } from '../data/studentsData';

const STORAGE_KEY = 'asrama_nfc_v2_state';

// Generate some realistic initial state so the system feels vibrant on first load
export function getInitialState(): HostelState {
  const now = Date.now();
  const statuses: Record<string, StudentStatus> = {};
  const logs: HostelLog[] = [];

  INITIAL_STUDENTS.forEach((s, idx) => {
    // Distribute realistic statuses
    if (idx === 3 || idx === 11 || idx === 19) {
      // Sedang Outing
      const since = now - (idx * 23 + 45) * 60000;
      const expHour = (new Date(since)).getHours() + 3;
      const expectedReturn = `${String(Math.min(22, expHour)).padStart(2, '0')}:00`;
      statuses[s.kp] = {
        status: 'OUTING',
        since,
        dest: idx === 3 ? 'Bandar Baru Bangi (Buku Seni)' : idx === 11 ? 'Mid Valley Megamall' : 'Klinik Kesihatan',
        expectedReturn,
        transport: 'Bas Sekolah / Pengangkutan Awam',
        guardianName: s.namaWaris,
        guardianPhone: s.telWaris,
        passId: `OUT-2026-${1000 + idx}`
      };
      logs.push({
        id: `LOG-${idx}-1`,
        ts: since,
        kp: s.kp,
        nama: s.nama,
        kelas: s.kelas,
        bidang: s.bidang,
        action: 'Mula Outing',
        detail: `Destinasi: ${statuses[s.kp].dest} (Dijangka pulang ${expectedReturn})`,
        officer: 'Warden Ustaz Harith'
      });
    } else if (idx === 7 || idx === 25) {
      // Pulang Bermalam
      const since = now - (idx * 50 + 120) * 60000;
      statuses[s.kp] = {
        status: 'BERMALAM',
        since,
        dest: 'Rumah Keluarga',
        expectedReturn: 'Ahad, 06:00 PM',
        guardianName: s.namaWaris,
        guardianPhone: s.telWaris,
        transport: 'Kereta Ibu Bapa',
        passId: `BML-2026-${2000 + idx}`
      };
      logs.push({
        id: `LOG-${idx}-2`,
        ts: since,
        kp: s.kp,
        nama: s.nama,
        kelas: s.kelas,
        bidang: s.bidang,
        action: 'Pulang Bermalam',
        detail: `Diambil oleh ${s.namaWaris} (${s.telWaris})`,
        officer: 'Cikgu Azman (Warden Bertugas)'
      });
    } else if (idx === 15) {
      // Kuarantin / Bilik Sakit
      statuses[s.kp] = {
        status: 'KUARANTIN',
        since: now - 3 * 3600000,
        alasan: 'Demam & Selsema (Rehat di Bilik Sakit)',
        dest: 'Bilik Rawatan Aspuri',
        passId: `MED-2026-${3000 + idx}`
      };
      logs.push({
        id: `LOG-${idx}-3`,
        ts: now - 3 * 3600000,
        kp: s.kp,
        nama: s.nama,
        kelas: s.kelas,
        bidang: s.bidang,
        action: 'Rawatan / Kuarantin',
        detail: 'Rehat di Bilik Rawatan / Sakit Asrama',
        officer: 'Penyelia Asrama Pn. Rohani'
      });
    } else if (idx === 5 || idx === 14) {
      // Keluar Asrama / Prep
      const since = now - (idx * 15 + 20) * 60000;
      statuses[s.kp] = {
        status: 'KELUAR',
        since,
        dest: 'Luar Kawasan Asrama',
        passId: `KLR-2026-${4000 + idx}`
      };
      logs.push({
        id: `LOG-${idx}-4`,
        ts: since,
        kp: s.kp,
        nama: s.nama,
        kelas: s.kelas,
        bidang: s.bidang,
        action: 'Keluar Asrama',
        detail: 'Keluar dari kawasan asrama',
        officer: 'Pengawal Keselamatan Pintu A'
      });
    } else {
      // DALAM asrama
      statuses[s.kp] = {
        status: 'DALAM',
        since: now - (idx * 40 + 180) * 60000
      };
    }
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const attendance: Record<string, Record<string, number>> = {
    [`${todayStr}_SUBUH`]: {},
    [`${todayStr}_ROLLCALL`]: {}
  };

  // Pre-seed some rollcall attendance
  INITIAL_STUDENTS.slice(0, 18).forEach(s => {
    attendance[`${todayStr}_SUBUH`][s.kp] = now - 5 * 3600000;
  });

  return {
    statuses,
    logs: logs.sort((a, b) => b.ts - a.ts),
    attendance
  };
}

export function loadHostelState(): HostelState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.statuses) {
        // Ensure any newly defined students have default status
        let updated = false;
        INITIAL_STUDENTS.forEach(s => {
          const cleanKp = s.kp.replace(/[\s-]/g, '');
          if (!parsed.statuses[s.kp] && !parsed.statuses[cleanKp]) {
            parsed.statuses[s.kp] = { status: 'DALAM', since: Date.now() };
            updated = true;
          }
        });
        if (updated) {
          saveHostelState(parsed);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load state from localStorage', err);
  }
  const defaultState = getInitialState();
  saveHostelState(defaultState);
  return defaultState;
}

export function saveHostelState(state: HostelState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save state to localStorage', err);
  }
}
