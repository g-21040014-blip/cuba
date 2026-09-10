import { Student, StudentStatus, HostelLog } from '../types/hostel';

const WEBHOOK_STORAGE_KEY = 'ssem_gsheet_webhook_url';
const AUTOSYNC_STORAGE_KEY = 'ssem_gsheet_autosync';
const SPREADSHEET_ID_STORAGE_KEY = 'ssem_gsheet_spreadsheet_id';

export interface GoogleSheetsConfig {
  webhookUrl: string;
  autoSync: boolean;
  spreadsheetId?: string;
  lastSynced?: number;
}

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  try {
    const webhookUrl = localStorage.getItem(WEBHOOK_STORAGE_KEY) || 'https://script.google.com/macros/s/AKfycbzA_6vKr5lwkNunOnO9qwiEPGIsBGFiFBfSvXf3bU4VG7Y5iLdIUHOzk4fQHEjW5fvJ/exec';
    const autoSync = localStorage.getItem(AUTOSYNC_STORAGE_KEY) === 'true';
    const spreadsheetId = localStorage.getItem(SPREADSHEET_ID_STORAGE_KEY) || '1tNACM32JUAbiSQW1JaI5L53uL67Daa0tXqYcP6bpWGs';
    const lastSynced = localStorage.getItem('ssem_gsheet_last_synced')
      ? parseInt(localStorage.getItem('ssem_gsheet_last_synced') || '0', 10)
      : undefined;

    return { webhookUrl, autoSync, spreadsheetId, lastSynced };
  } catch {
    return { webhookUrl: 'https://script.google.com/macros/s/AKfycbzA_6vKr5lwkNunOnO9qwiEPGIsBGFiFBfSvXf3bU4VG7Y5iLdIUHOzk4fQHEjW5fvJ/exec', autoSync: false, spreadsheetId: '1tNACM32JUAbiSQW1JaI5L53uL67Daa0tXqYcP6bpWGs' };
  }
}

export function saveGoogleSheetsConfig(config: GoogleSheetsConfig): void {
  try {
    localStorage.setItem(WEBHOOK_STORAGE_KEY, config.webhookUrl.trim());
    localStorage.setItem(AUTOSYNC_STORAGE_KEY, config.autoSync ? 'true' : 'false');
    if (config.spreadsheetId) {
      localStorage.setItem(SPREADSHEET_ID_STORAGE_KEY, config.spreadsheetId.trim());
    }
    if (config.lastSynced) {
      localStorage.setItem('ssem_gsheet_last_synced', config.lastSynced.toString());
    }
  } catch (err) {
    console.error('Failed to save Google Sheets config:', err);
  }
}

/**
 * Send payload to Google Apps Script Webhook
 * Due to browser CORS policies with Google Apps Script redirects,
 * we use mode 'no-cors' so the HTTP POST request is reliably executed on Google's servers.
 */
export async function sendToGoogleSheets(action: string, data: any): Promise<{ success: boolean; message: string }> {
  const config = getGoogleSheetsConfig();
  if (!config.webhookUrl) {
    return { success: false, message: 'URL Webhook Google Sheets belum ditetapkan.' };
  }

  const payload = {
    action,
    timestamp: new Date().toISOString(),
    data
  };

  try {
    // Send as POST with no-cors
    await fetch(config.webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    saveGoogleSheetsConfig({
      ...config,
      lastSynced: Date.now()
    });

    return { success: true, message: 'Data berjaya dihantar ke Google Sheets!' };
  } catch (err: any) {
    console.error('Error sending data to Google Sheets:', err);
    return { success: false, message: err.message || 'Gagal menghantar data ke Google Sheets.' };
  }
}

/**
 * Test the webhook connection
 */
export async function testWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com/macros/s/')) {
    return { 
      success: false, 
      message: 'Format URL Webhook tidak sah. Pastikan ia bermula dengan https://script.google.com/macros/s/...' 
    };
  }

  try {
    const payload = {
      action: 'TEST',
      timestamp: new Date().toISOString(),
      data: { test: true, app: 'SSeM e-Smart Hostel' }
    };

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    return { 
      success: true, 
      message: 'Isyarat ujian berjaya dihantar ke Google Apps Script Webhook!' 
    };
  } catch (err: any) {
    return { 
      success: false, 
      message: `Ralat semasa menyambung: ${err.message || 'Ralat rangkaian'}` 
    };
  }
}

/**
 * Initialize all 4 sheets in the user's Google Spreadsheet
 */
export async function initializeSheetsStructure(): Promise<{ success: boolean; message: string }> {
  return sendToGoogleSheets('INIT_SHEETS', {});
}

/**
 * Sync entire student database to Google Sheets
 */
export async function syncAllStudentsToSheets(
  students: Student[],
  statuses: Record<string, StudentStatus>
): Promise<{ success: boolean; message: string }> {
  const studentsList = students.map(s => {
    const st = statuses[s.kp];
    return {
      id: s.id,
      kp: s.kp,
      nama: s.nama,
      jantina: s.jantina === 'L' ? 'Lelaki' : 'Perempuan',
      tingkatan: s.tingkatan,
      kelas: s.kelas,
      bidang: s.bidang,
      kelasSeni: s.kelasSeni,
      dorm: s.dorm || '-',
      namaWaris: s.namaWaris || '-',
      telWaris: s.telWaris || '-',
      statusSemasa: st ? st.status : 'DALAM',
      destinasi: st?.dest || '-',
      dijangkaKembali: st?.expectedReturn || '-',
      pegawaiKemaskini: st?.guardianName || '-'
    };
  });

  return sendToGoogleSheets('SYNC_STUDENTS', { students: studentsList });
}

/**
 * Sync a single movement log entry to Google Sheets (Masuk / Keluar / Outing / Bermalam)
 */
export async function syncLogMovementToSheets(
  log: HostelLog,
  student?: Student,
  currentStatus?: StudentStatus
): Promise<void> {
  const config = getGoogleSheetsConfig();
  if (!config.webhookUrl || !config.autoSync) return;

  const now = new Date(log.ts);
  const tarikh = now.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const masa = now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const record = {
    tarikh,
    masa,
    noKp: log.kp,
    nama: log.nama,
    kelas: log.kelas,
    bidang: log.bidang,
    tingkatan: student?.tingkatan || '-',
    dorm: student?.dorm || '-',
    tindakan: log.action,
    butiran: log.detail,
    wardenBertugas: log.officer || 'Warden Bertugas',
    namaWaris: currentStatus?.guardianName || student?.namaWaris || '-',
    telWaris: currentStatus?.guardianPhone || student?.telWaris || '-'
  };

  sendToGoogleSheets('LOG_MOVEMENT', record).catch(err => {
    console.warn('Auto-sync log movement error:', err);
  });
}

/**
 * Sync attendance / roll-call scan
 */
export async function syncAttendanceToSheets(
  sessionLabel: string,
  student: Student,
  timestamp: number
): Promise<void> {
  const config = getGoogleSheetsConfig();
  if (!config.webhookUrl || !config.autoSync) return;

  const dateObj = new Date(timestamp);
  const tarikh = dateObj.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const masa = dateObj.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const record = {
    tarikh,
    masa,
    sesi: sessionLabel,
    noKp: student.kp,
    nama: student.nama,
    tingkatan: student.tingkatan,
    kelas: student.kelas,
    bidang: student.bidang,
    dorm: student.dorm || '-',
    statusKehadiran: 'HADIR (Imbasan Kad Pintar)'
  };

  sendToGoogleSheets('LOG_ATTENDANCE', record).catch(err => {
    console.warn('Auto-sync attendance error:', err);
  });
}

/**
 * Ready-to-use Google Apps Script source code
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * SISTEM PENGURUSAN ASRAMA e-SMART SEKOLAH SENI MALAYSIA (SSeM)
 * GOOGLE APPS SCRIPT WEBHOOK UNTUK SINKRONISASI REAL-TIME
 * =========================================================================
 * 
 * ARAHAN PEMASANGAN (1 MINIT):
 * 1. Buka Google Sheet baharu anda di Google Drive (cth: "Data e-Smart Asrama SSeM").
 * 2. Klik menu "Extensions" (Pelanjutan) -> "Apps Script".
 * 3. Padam semua kod sedia ada, dan tampal (paste) kod di bawah ini sepenuhnya.
 * 4. Klik butang "Save" (Simpan - ikon disket).
 * 5. Klik butang biru "Deploy" (Guna) -> "New deployment" (Gunaan baharu).
 * 6. Pilih jenis gear: "Web app".
 * 7. Tetapkan:
 *    - Description: "SSeM Webhook v1"
 *    - Execute as: "Me" (Saya / emel anda)
 *    - Who has access: "Anyone" (Sesiapa sahaja) <- PENTING supaya sistem web boleh menghantar data!
 * 8. Klik "Deploy", luluskan kebenaran (Authorize Access -> Advanced -> Go to ... (unsafe) -> Allow).
 * 9. Salin "Web app URL" (bermula dengan https://script.google.com/macros/s/...)
 *    dan tampalkan di tetapan sistem ini!
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Webhook Google Apps Script e-Smart Asrama SSeM sedang aktif!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var payload = JSON.parse(rawData);
    var action = payload.action;
    var data = payload.data;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Inisialisasi format 4 sheet secara automatik
    if (action === "INIT_SHEETS") {
      setupAllSheets(ss);
      return returnSuccess("Struktur 4 helaian berjaya dibina dan diformat!");
    }

    // 2. Ujian sambungan
    if (action === "TEST") {
      setupAllSheets(ss); // Pastikan helaian siap
      return returnSuccess("Sambungan ke Google Sheet SSeM berjaya!");
    }

    // 3. Log Pergerakan Murid (Masuk, Keluar, Outing, Bermalam)
    if (action === "LOG_MOVEMENT") {
      var sheet = getOrCreateSheet(ss, "LOG_PERGERAKAN");
      sheet.appendRow([
        data.tarikh || Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "dd/MM/yyyy"),
        data.masa || Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "HH:mm:ss"),
        "'" + data.noKp,
        data.nama,
        data.tingkatan,
        data.kelas,
        data.bidang,
        data.dorm,
        data.tindakan,
        data.butiran,
        data.wardenBertugas,
        data.namaWaris,
        "'" + data.telWaris
      ]);
      return returnSuccess("Log pergerakan berjaya direkod!");
    }

    // 4. Log Kehadiran / Roll-call
    if (action === "LOG_ATTENDANCE") {
      var sheet = getOrCreateSheet(ss, "KEHADIRAN_ROLLCALL");
      sheet.appendRow([
        data.tarikh || Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "dd/MM/yyyy"),
        data.masa || Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "HH:mm:ss"),
        data.sesi,
        "'" + data.noKp,
        data.nama,
        data.tingkatan,
        data.kelas,
        data.bidang,
        data.dorm,
        data.statusKehadiran
      ]);
      return returnSuccess("Log kehadiran berjaya direkod!");
    }

    // 5. Kemaskini & Sinkronisasi Semua Data Murid
    if (action === "SYNC_STUDENTS") {
      var sheet = getOrCreateSheet(ss, "DATA_MURID");
      // Kosongkan data lama kecuali baris tajuk
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
      }

      var rows = [];
      var students = data.students || [];
      for (var i = 0; i < students.length; i++) {
        var s = students[i];
        rows.push([
          s.id,
          "'" + s.kp,
          s.nama,
          s.jantina,
          s.tingkatan,
          s.kelas,
          s.bidang,
          s.kelasSeni,
          s.dorm,
          s.namaWaris,
          "'" + s.telWaris,
          s.statusSemasa,
          s.destinasi,
          s.dijangkaKembali,
          s.pegawaiKemaskini,
          Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "dd/MM/yyyy HH:mm")
        ]);
      }

      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
      return returnSuccess(students.length + " rekod murid berjaya dikemaskini ke Google Sheet!");
    }

    return returnSuccess("Aksi tidak dikenali, data diterima.");
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function returnSuccess(msg) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: msg
  })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function setupAllSheets(ss) {
  // 1. DATA_MURID
  var sMurid = getOrCreateSheet(ss, "DATA_MURID");
  if (sMurid.getLastRow() === 0) {
    var headers = [
      "ID Murid", "No. Kad Pengenalan", "Nama Penuh", "Jantina", "Tingkatan", 
      "Kelas Akademik", "Bidang Seni", "Kelas Seni", "Dormitori", 
      "Nama Waris", "No. Tel Waris", "Status Semasa", "Destinasi Terkini", 
      "Jangka Pulang", "Pegawai/Waris Catatan", "Kemaskini Terakhir"
    ];
    sMurid.appendRow(headers);
    formatHeaderRow(sMurid, "#0f766e");
  }

  // 2. LOG_PERGERAKAN
  var sLog = getOrCreateSheet(ss, "LOG_PERGERAKAN");
  if (sLog.getLastRow() === 0) {
    var headers = [
      "Tarikh", "Masa", "No. Kad Pengenalan", "Nama Murid", "Tingkatan", 
      "Kelas", "Bidang", "Dormitori", "Tindakan", "Butiran Pergerakan", 
      "Warden Bertugas", "Nama Waris / Pengambil", "No. Telefon Waris"
    ];
    sLog.appendRow(headers);
    formatHeaderRow(sLog, "#1e3a8a");
  }

  // 3. KEHADIRAN_ROLLCALL
  var sKehadiran = getOrCreateSheet(ss, "KEHADIRAN_ROLLCALL");
  if (sKehadiran.getLastRow() === 0) {
    var headers = [
      "Tarikh", "Masa", "Sesi Kehadiran", "No. Kad Pengenalan", "Nama Murid", 
      "Tingkatan", "Kelas", "Bidang", "Dormitori", "Status Kehadiran"
    ];
    sKehadiran.appendRow(headers);
    formatHeaderRow(sKehadiran, "#047857");
  }

  // 4. REKOD_KESIHATAN
  var sKesihatan = getOrCreateSheet(ss, "REKOD_KESIHATAN");
  if (sKesihatan.getLastRow() === 0) {
    var headers = [
      "Tarikh", "Masa", "No. Kad Pengenalan", "Nama Murid", "Tingkatan", 
      "Dormitori", "Simptom / Aduan", "Tindakan (Klinik/Kuarantin)", "Catatan Warden"
    ];
    sKesihatan.appendRow(headers);
    formatHeaderRow(sKesihatan, "#b91c1c");
  }
}

function formatHeaderRow(sheet, bgColor) {
  var headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setBackground(bgColor);
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontFamily("Calibri");
  sheet.setFrozenRows(1);
}
`;
