import { Student, Gender, StreamType, Warden } from '../types/hostel';

/**
 * Format Google Drive image link to high-performance direct web image link
 * Avoids CORS, cookies, or iframe blocks from drive.google.com
 */
export function formatGoogleDriveImageUrl(rawUrl: string, width: number = 400): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Check if it has a file ID in Google Drive URL
  // Formats:
  // - https://drive.google.com/uc?export=view&id=FILE_ID
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/file/d/FILE_ID/view
  // - id=FILE_ID
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) || trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    const fileId = idMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}=w${width}`;
  }

  // If already an lh3 link or external http image
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return '';
}

/**
 * Parses CSV text safely handling quotes and commas
 */
export function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentField = '';

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentField.trim());
      if (row.some(cell => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || row.length > 0) {
    row.push(currentField.trim());
    if (row.some(cell => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Intelligent dorm room generator based on Tingkatan, Gender and Class
 */
function assignDormRoom(tingkatan: number, jantina: Gender, indexInForm: number): string {
  const roomNum = Math.floor(indexInForm / 6) + 1;
  const padRoom = roomNum < 10 ? `0${roomNum}` : `${roomNum}`;

  if (jantina === 'L') {
    if (tingkatan <= 2) return `Aspura Kasturi ${tingkatan}-${padRoom}`;
    if (tingkatan === 3) return `Aspura Jebat 1-${padRoom}`;
    if (tingkatan === 4) return `Aspura Tuah 2-${padRoom}`;
    return `Aspura Lekir 2-${padRoom}`;
  } else {
    if (tingkatan <= 2) return `Aspuri Teja ${tingkatan}-${padRoom}`;
    if (tingkatan === 3) return `Aspuri Mahsuri 1-${padRoom}`;
    if (tingkatan === 4) return `Aspuri Cempaka 2-${padRoom}`;
    return `Aspuri Melati 2-${padRoom}`;
  }
}

/**
 * Multi-strategy fetcher for Google Sheet CSV data.
 * Strategy 1: Local server proxy (/api/proxy-google-sheet) - completely bypasses browser CORS & iframe limitations.
 * Strategy 2: Direct Google Docs gviz endpoint with cache-busting.
 * Strategy 3: Direct export fallback endpoint.
 * Strategy 4: External CORS proxy fallback (allorigins).
 */
export async function fetchGoogleSheetCsvText(
  sheetId: string,
  sheetName: string
): Promise<string> {
  const cleanId = sheetId.trim();
  const rawSheet = sheetName.trim();
  const cleanSheet = encodeURIComponent(rawSheet);
  const timestamp = Date.now();
  const errors: string[] = [];

  // Strategy 1: Local app server proxy (/api/proxy-google-sheet)
  try {
    const proxyUrl = `/api/proxy-google-sheet?sheetId=${cleanId}&sheet=${cleanSheet}&_=${timestamp}`;
    const proxyRes = await fetch(proxyUrl, {
      cache: 'no-store',
      headers: { Accept: 'text/csv,text/plain,*/*' }
    });
    if (proxyRes.ok) {
      const text = await proxyRes.text();
      if (text && text.trim().length > 0 && !text.startsWith('{"error":')) {
        return text;
      }
    } else {
      errors.push(`Proxy HTTP ${proxyRes.status}`);
    }
  } catch (err: any) {
    errors.push(`Proxy: ${err.message || err}`);
  }

  // Strategy 2: Direct Google Sheet gviz endpoint
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${cleanSheet}&headers=1&tq=&_=${timestamp}`;
    const directRes = await fetch(gvizUrl, { cache: 'no-store' });
    if (directRes.ok) {
      const text = await directRes.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } else {
      errors.push(`Direct gviz HTTP ${directRes.status}`);
    }
  } catch (err: any) {
    errors.push(`Direct gviz: ${err.message || err}`);
  }

  // Strategy 3: Direct export fallback
  try {
    const isGid = /^\d+$/.test(rawSheet);
    const exportUrl = isGid
      ? `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv&gid=${rawSheet}&_=${timestamp}`
      : `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv&sheet=${cleanSheet}&_=${timestamp}`;
    const exportRes = await fetch(exportUrl, { cache: 'no-store' });
    if (exportRes.ok) {
      const text = await exportRes.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } else {
      errors.push(`Export HTTP ${exportRes.status}`);
    }
  } catch (err: any) {
    errors.push(`Export: ${err.message || err}`);
  }

  // Strategy 4: External CORS proxy fallback
  try {
    const targetUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${cleanSheet}&headers=1&tq=`;
    const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const corsRes = await fetch(corsProxyUrl, { cache: 'no-store' });
    if (corsRes.ok) {
      const text = await corsRes.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } else {
      errors.push(`CORS proxy HTTP ${corsRes.status}`);
    }
  } catch (err: any) {
    errors.push(`CORS proxy: ${err.message || err}`);
  }

  throw new Error(`Tidak dapat menghubungi Google Sheet (${rawSheet}): ${errors.join(', ')}`);
}

/**
 * Fetch and parse students from Google Sheet via Google Visualization API or Direct CSV Export
 */
export async function fetchStudentsFromGoogleSheet(
  sheetId: string = '1tNACM32JUAbiSQW1JaI5L53uL67Daa0tXqYcP6bpWGs',
  sheetName: string = 'Murid'
): Promise<{ success: boolean; students: Student[]; message: string }> {
  try {
    const cleanId = sheetId.trim();
    const rawSheet = sheetName.trim();

    const csvText = await fetchGoogleSheetCsvText(cleanId, rawSheet);
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      throw new Error(`Helaian '${rawSheet}' tidak mengandungi data murid atau kosong.`);
    }

    // Identify header column indices with comprehensive aliases
    const header = rows[0].map(h => (h || '').toUpperCase().trim());
    
    // Kad Pengenalan
    const idxKp = header.findIndex(h => 
      h === 'NO KP' || h === 'NO. KP' || h.includes('KP') || h.includes('KAD PENGENALAN') || h.includes('IC') || h.includes('MYKAD')
    );
    // Nama Murid
    const idxNama = header.findIndex(h => 
      h === 'NAMA' || h === 'NAMA MURID' || h === 'NAMA PENUH' || h === 'NAMA PELAJAR' || h.includes('NAMA')
    );
    // Jantina
    const idxJantina = header.findIndex(h => 
      h === 'JANTINA' || h === 'JANT' || h === 'GENDER' || h.includes('JANTINA')
    );
    // Tingkatan
    const idxTingkatan = header.findIndex(h => 
      h === 'TINGKATAN' || h === 'TING' || h === 'FORM' || h.includes('TINGKATAN')
    );
    // Kelas Akademik
    const idxKelas = header.findIndex(h => 
      h.includes('KELAS AKADEMIK') || h === 'KELAS' || h.includes('KELAS')
    );
    // Bidang Seni
    const idxBidang = header.findIndex(h => 
      h.includes('BIDANG SENI') || h === 'BIDANG' || h.includes('BIDANG') || h.includes('STREAM')
    );
    // Kelas Seni
    const idxKelasSeni = header.findIndex(h => 
      h.includes('KELAS SENI') || (h.includes('SENI') && !h.includes('BIDANG'))
    );
    // Gambar / Foto
    const idxGambar = header.findIndex(h => 
      h.includes('GAMBAR') || h.includes('FOTO') || h.includes('PHOTO') || h.includes('IMAGE') || h.includes('URL FOTO') || h.includes('LINK GAMBAR')
    );
    // Dormitori / Bilik
    const idxDorm = header.findIndex(h => 
      h.includes('DORMITORI') || h.includes('DORM') || h.includes('BILIK') || h.includes('KAMAR')
    );
    // Nama Waris
    const idxNamaWaris = header.findIndex(h => 
      h.includes('NAMA WARIS') || h.includes('NAMA PENJAGA') || h === 'WARIS' || h === 'PENJAGA'
    );
    // No Tel Waris
    const idxTelWaris = header.findIndex(h => 
      h.includes('TEL WARIS') || h.includes('NO TEL WARIS') || h.includes('NO. TEL WARIS') || 
      h.includes('HP WARIS') || h.includes('TELEFON WARIS') || h.includes('NO TEL PENJAGA') || 
      h.includes('NO. TELEFON') || h.includes('NO TEL') || h.includes('NO HP')
    );

    // Fallbacks if header names match default standard layout
    const finalIdxKp = idxKp !== -1 ? idxKp : 1;
    const finalIdxNama = idxNama !== -1 ? idxNama : 2;
    const finalIdxJantina = idxJantina !== -1 ? idxJantina : 3;
    const finalIdxKelas = idxKelas !== -1 ? idxKelas : 4;
    const finalIdxBidang = idxBidang !== -1 ? idxBidang : 5;
    const finalIdxKelasSeni = idxKelasSeni !== -1 ? idxKelasSeni : 6;
    const finalIdxGambar = idxGambar !== -1 ? idxGambar : (header.length > 7 && !idxDorm ? 7 : -1);

    const students: Student[] = [];
    let countInForm: Record<string, number> = {};

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawKp = (row[finalIdxKp] || '').trim().replace(/[^0-9]/g, '');
      const rawNama = (row[finalIdxNama] || '').trim().toUpperCase();
      
      if (!rawKp || !rawNama) continue;

      const rawJantina = (row[finalIdxJantina] || '').trim().toUpperCase();
      const jantina: Gender = rawJantina.startsWith('P') || rawJantina.includes('PEREMPUAN') ? 'P' : 'L';
      const kelas = (row[finalIdxKelas] || '').trim().toUpperCase() || '1 BALADA';
      
      const rawBidang = (row[finalIdxBidang] || '').trim().toUpperCase();
      let bidang: StreamType = 'MUZIK';
      if (rawBidang.includes('TARI')) bidang = 'TARI';
      else if (rawBidang.includes('TEATER')) bidang = 'TEATER';
      else if (rawBidang.includes('VISUAL')) bidang = 'VISUAL';

      const kelasSeni = (finalIdxKelasSeni !== -1 ? row[finalIdxKelasSeni] : '')?.trim().toUpperCase() || '-';
      
      // Extract Gambar URL
      const rawGambar = (finalIdxGambar !== -1 ? row[finalIdxGambar] : '')?.trim() || '';
      const formattedGambar = formatGoogleDriveImageUrl(rawGambar, 400);

      // Determine Tingkatan from column or class string (e.g. "2 INANG" -> 2)
      let tingkatan = 1;
      if (idxTingkatan !== -1 && row[idxTingkatan]) {
        const parsedTing = parseInt(row[idxTingkatan].trim().replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsedTing) && parsedTing >= 1 && parsedTing <= 5) {
          tingkatan = parsedTing;
        }
      } else {
        const numMatch = kelas.match(/\d+/);
        if (numMatch) {
          tingkatan = parseInt(numMatch[0], 10);
        }
      }

      // Read Dorm from Google Sheet if provided; otherwise assign intelligently
      const formKey = `${tingkatan}-${jantina}`;
      countInForm[formKey] = (countInForm[formKey] || 0) + 1;
      
      const sheetDorm = idxDorm !== -1 ? (row[idxDorm] || '').trim() : '';
      const dorm = sheetDorm || assignDormRoom(tingkatan, jantina, countInForm[formKey]);

      // Read Waris details from Google Sheet if provided
      const sheetNamaWaris = idxNamaWaris !== -1 ? (row[idxNamaWaris] || '').trim() : '';
      const namaWaris = sheetNamaWaris || `Waris ${rawNama.split(' ')[0]}`;

      const sheetTelWaris = idxTelWaris !== -1 ? (row[idxTelWaris] || '').trim().replace(/[^0-9+-]/g, '') : '';
      const telWaris = sheetTelWaris || `01${Math.floor(10000000 + Math.random() * 89999999)}`;

      const studentId = `SM-${tingkatan}${jantina}-${String(i).padStart(3, '0')}`;

      students.push({
        id: studentId,
        kp: rawKp,
        nama: rawNama,
        jantina,
        tingkatan,
        kelas,
        bidang,
        kelasSeni,
        gambar: formattedGambar,
        photo: formattedGambar || null,
        dorm,
        namaWaris,
        telWaris
      });
    }

    return {
      success: true,
      students,
      message: `Berjaya memuat turun ${students.length} data murid & foto terkini daripada Google Sheet (Helaian: ${rawSheet})!`
    };
  } catch (err: any) {
    console.warn(`[GoogleSheetImport] Pemberitahuan helaian '${sheetName}':`, err.message || err);
    return {
      success: false,
      students: [],
      message: err.message || 'Ralat semasa memuat turun data dari Google Sheet.'
    };
  }
}

/**
 * Smart Merge: Fetch both DATA_MURID (for latest dorms, parent contacts & official edits) 
 * and Murid (for Google Drive photos) and join them seamlessly by No. KP.
 */
export async function fetchSmartMergedStudentsFromGoogleSheet(
  sheetId: string = '1tNACM32JUAbiSQW1JaI5L53uL67Daa0tXqYcP6bpWGs'
): Promise<{ success: boolean; students: Student[]; message: string; source: string }> {
  try {
    const cleanId = sheetId.trim();

    // Fetch DATA_MURID and Murid concurrently
    const [resDataMurid, resMurid] = await Promise.allSettled([
      fetchStudentsFromGoogleSheet(cleanId, 'DATA_MURID'),
      fetchStudentsFromGoogleSheet(cleanId, 'Murid')
    ]);

    const dataMuridResult = resDataMurid.status === 'fulfilled' ? resDataMurid.value : null;
    const muridResult = resMurid.status === 'fulfilled' ? resMurid.value : null;

    // If both succeeded, smart merge them
    if (dataMuridResult?.success && dataMuridResult.students.length > 0 && muridResult?.success && muridResult.students.length > 0) {
      const photoMap = new Map<string, string>();
      muridResult.students.forEach(s => {
        if (s.gambar) photoMap.set(s.kp, s.gambar);
      });

      // Merge photos into DATA_MURID
      const merged: Student[] = dataMuridResult.students.map(s => {
        const photo = photoMap.get(s.kp) || s.gambar || '';
        return {
          ...s,
          gambar: photo,
          photo: photo || null
        };
      });

      // Append any student found in Murid tab that is missing in DATA_MURID
      const existingKp = new Set(dataMuridResult.students.map(s => s.kp));
      let extraCount = 0;
      for (const s of muridResult.students) {
        if (!existingKp.has(s.kp)) {
          merged.push(s);
          extraCount++;
        }
      }

      const withPhotos = merged.filter(s => Boolean(s.gambar)).length;
      return {
        success: true,
        students: merged,
        message: `Gabung Pintar Berjaya! ${merged.length} murid diselaraskan (${withPhotos} ada foto, ${extraCount} murid tambahan dari helaian Murid).`,
        source: 'DATA_MURID + Murid'
      };
    }

    // Fallback: If only DATA_MURID succeeded
    if (dataMuridResult?.success && dataMuridResult.students.length > 0) {
      return {
        success: true,
        students: dataMuridResult.students,
        message: `Berjaya memuat turun ${dataMuridResult.students.length} murid daripada helaian DATA_MURID.`,
        source: 'DATA_MURID'
      };
    }

    // Fallback: If only Murid succeeded
    if (muridResult?.success && muridResult.students.length > 0) {
      return {
        success: true,
        students: muridResult.students,
        message: `Berjaya memuat turun ${muridResult.students.length} murid daripada helaian Murid.`,
        source: 'Murid'
      };
    }

    return {
      success: false,
      students: [],
      message: dataMuridResult?.message || muridResult?.message || 'Google Sheets belum dapat dihubungi.',
      source: 'offline'
    };
  } catch (err: any) {
    console.warn('[GoogleSheetImport] Smart merge skipped or fallback used:', err.message || err);
    return {
      success: false,
      students: [],
      message: err.message || 'Ralat semasa gabung data Google Sheet.',
      source: 'error'
    };
  }
}

/**
 * Fetch and parse wardens from Google Sheet table WARDEN
 */
export async function fetchWardensFromGoogleSheet(
  sheetId: string = '1tNACM32JUAbiSQW1JaI5L53uL67Daa0tXqYcP6bpWGs',
  sheetName: string = 'WARDEN'
): Promise<{ success: boolean; wardens: Warden[]; message: string }> {
  try {
    const cleanId = sheetId.trim();
    const rawSheet = sheetName.trim();

    const csvText = await fetchGoogleSheetCsvText(cleanId, rawSheet);
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      throw new Error('Jadual WARDEN tidak mengandungi sebarang data.');
    }

    const header = rows[0].map(h => h.toUpperCase());
    const idxNama = header.findIndex(h => h.includes('NAMA'));
    const idxEmail = header.findIndex(h => h.includes('EMAIL') || h.includes('EMEL'));
    const idxTel = header.findIndex(h => h.includes('HP') || h.includes('TEL') || h.includes('NO'));

    const finalIdxNama = idxNama !== -1 ? idxNama : 0;
    const finalIdxEmail = idxEmail !== -1 ? idxEmail : 1;
    const finalIdxTel = idxTel !== -1 ? idxTel : 2;

    const wardens: Warden[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawNama = row[finalIdxNama]?.trim().toUpperCase() || '';
      if (!rawNama) continue;

      const email = row[finalIdxEmail]?.trim() || '';
      let rawTel = row[finalIdxTel]?.trim() || '';
      
      // format phone number if needed (e.g. 0126120261 -> 012-6120261)
      if (rawTel && !rawTel.includes('-') && rawTel.length >= 10) {
        rawTel = `${rawTel.slice(0, 3)}-${rawTel.slice(3)}`;
      }

      // Assign position / blok intelligently
      let jawatan = 'Warden Asrama';
      let blok = 'Aspura / Aspuri';

      if (rawNama.includes('NIZAM')) {
        jawatan = 'Ketua Warden Asrama';
        blok = 'Pentadbiran Asrama';
      } else if (rawNama.includes('NOOR FAIZ')) {
        jawatan = 'Warden Aspura';
        blok = 'Aspura (Kasturi & Tuah)';
      } else if (rawNama.includes('BIN ') || rawNama.startsWith('MUHAMMAD')) {
        jawatan = 'Warden Aspura';
        blok = i % 2 === 0 ? 'Aspura (Kasturi & Tuah)' : 'Aspura (Jebat & Lekir)';
      } else {
        jawatan = 'Warden Aspuri';
        blok = i % 2 === 0 ? 'Aspuri (Teja & Mahsuri)' : 'Aspuri (Cempaka & Melati)';
      }

      wardens.push({
        id: `W-${String(i).padStart(2, '0')}`,
        nama: rawNama,
        jawatan,
        blok,
        tel: rawTel || '—',
        email
      });
    }

    return {
      success: true,
      wardens,
      message: `Berjaya memuat turun ${wardens.length} rekod warden!`
    };
  } catch (err: any) {
    console.warn('[GoogleSheetImport] Pemberitahuan helaian WARDEN:', err.message || err);
    return {
      success: false,
      wardens: [],
      message: err.message || 'Ralat semasa memuat turun data warden dari Google Sheet.'
    };
  }
}
