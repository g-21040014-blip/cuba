import { getAccessToken } from './google-auth';

const SPREADSHEET_ID = '1SpaKsuHmyGDU3DFoYA_jDkpPvRt6Ose2c2TnxFLqUUQ';

export async function fetchSpreadsheetMetadata() {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Failed to fetch spreadsheet');
  }

  return res.json();
}

export async function fetchStudentsFromSheets() {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const metadata = await fetchSpreadsheetMetadata();
    // Cari tab 'Pelajar', jika tiada, cari yang ada perkataan pelajar
    const targetSheet = metadata.sheets.find((s: any) => 
      s.properties.title.toLowerCase().includes('pelajar')
    );
    
    if (!targetSheet) {
      throw new Error('Tab Pelajar tidak dijumpai dalam Google Sheets');
    }

    const sheetTitle = targetSheet.properties.title;
    
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/'${sheetTitle}'!A:Z`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to fetch students');
    }

    const data = await res.json();
    const rows = data.values || [];
    
    if (rows.length === 0) return [];

    const headers = rows[0];
    const students = rows.slice(1).map((row: any[]) => {
      const student: any = {};
      headers.forEach((header: string, index: number) => {
        student[header] = row[index] || '';
      });
      return student;
    });

    return students;
  } catch (err) {
    console.error('Error fetching students:', err);
    throw err;
  }
}

export async function saveRoomsToSheets(rooms: any[]) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const metadata = await fetchSpreadsheetMetadata();
    // Cari tab 'Bilik Asrama', jika tiada, guna tab pertama
    const targetSheet = metadata.sheets.find((s: any) => 
      s.properties.title.toLowerCase().includes('bilik')
    );
    const sheetTitle = targetSheet ? targetSheet.properties.title : metadata.sheets[0].properties.title;

    const values = [
      ['No Bilik', 'Blok', 'Kapasiti Maksimum', 'Jumlah Penghuni Semasa', 'Status'],
      ...rooms.map(r => [r.roomNo, r.blockCode, r.capacity, r.occupants, r.status])
    ];

    const body = {
      values
    };

    // Use update to overwrite data
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/'${sheetTitle}'!A1:E?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to save to Google Sheets');
    }

    return true;
  } catch (err) {
    console.error('Error saving to sheets:', err);
    throw err;
  }
}

export async function saveStudentsToSheets(students: any[]) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const metadata = await fetchSpreadsheetMetadata();
    // Cari tab 'Pelajar'
    const targetSheet = metadata.sheets.find((s: any) => 
      s.properties.title.toLowerCase().includes('pelajar')
    );
    
    if (!targetSheet) {
      throw new Error('Tab Pelajar tidak dijumpai dalam Google Sheets');
    }

    const sheetTitle = targetSheet.properties.title;

    const values = [
      ['BIL', 'NO KP', 'NAMA MURID', 'JANTINA', 'KELAS AKADEMIK', 'BIDANG', 'KELAS SENI', 'GAMBAR', 'NO BILIK', 'NO TELEFON', 'STATUS'],
      ...students.map((s, idx) => [
        idx + 1,
        s.nokp || s.id || '',
        s.name || '',
        s.jantina || '',
        s.kelas_akademik || s.form || '',
        s.bidang || '',
        s.kelas_seni || '',
        s.gambar || s.image || '',
        s.room || '',
        s.phone || '',
        s.status || 'Aktif'
      ])
    ];

    const body = {
      values
    };

    // Use update to overwrite data
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/'${sheetTitle}'!A1:K?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to save to Google Sheets');
    }

    return true;
  } catch (err) {
    console.error('Error saving students to sheets:', err);
    throw err;
  }
}

export async function fetchWardensFromSheets() {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const metadata = await fetchSpreadsheetMetadata();
    // Cari tab 'Warden'
    const targetSheet = metadata.sheets.find((s: any) => 
      s.properties.title.toLowerCase().includes('warden')
    );
    
    if (!targetSheet) {
      throw new Error('Tab Warden tidak dijumpai dalam Google Sheets');
    }

    const sheetTitle = targetSheet.properties.title;
    
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/'${sheetTitle}'!A:E`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to fetch wardens');
    }

    const data = await res.json();
    const rows = data.values || [];
    
    if (rows.length === 0) return [];

    const headers = rows[0];
    const wardens = rows.slice(1).map((row: any[]) => {
      const warden: any = {};
      headers.forEach((header: string, index: number) => {
        warden[header] = row[index] || '';
      });
      return warden;
    });

    return wardens;
  } catch (err) {
    console.error('Error fetching wardens:', err);
    throw err;
  }
}

export async function saveWardensToSheets(wardens: any[]) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const metadata = await fetchSpreadsheetMetadata();
    // Cari tab 'Warden'
    const targetSheet = metadata.sheets.find((s: any) => 
      s.properties.title.toLowerCase().includes('warden')
    );
    
    if (!targetSheet) {
      throw new Error('Tab Warden tidak dijumpai dalam Google Sheets');
    }

    const sheetTitle = targetSheet.properties.title;

    const values = [
      ['ID Warden', 'Nama', 'No Telefon', 'Emel', 'Blok Bertugas'],
      ...wardens.map(w => [w.id, w.name, w.phone, w.email, w.block])
    ];

    const body = {
      values
    };

    // Use update to overwrite data
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/'${sheetTitle}'!A1:E?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to save to Google Sheets');
    }

    return true;
  } catch (err) {
    console.error('Error saving wardens to sheets:', err);
    throw err;
  }
}
