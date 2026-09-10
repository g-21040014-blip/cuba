import Papa from 'papaparse';


import { fetchStudentsFromSheets } from './sheets-api';

export const fetchPublicStudents = async () => {
  try {
    const students = await fetchStudentsFromSheets();
    // Return in the format expected by the other components
    return students.map((row: any) => {
      let image = row.image || row['GAMBAR'] || undefined;
      if (image && typeof image === 'string' && image.includes('drive.google.com')) {
        const match = image.match(/id=([^&]+)/) || image.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
          image = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400-h400`;
        }
      }
      return {
        'ID Pelajar': row.id || row['ID Pelajar'] || '-',
        'Nama Penuh': row.name || row['Nama Penuh'] || '-',
        'Tingkatan': row.form || row['Tingkatan / Kelas'] || row['Tingkatan'] || '-',
        'No Bilik': row.room || row['No Bilik'] || '-',
        'No Telefon Penjaga': row.phone || row['No Telefon Penjaga'] || '-',
        'Status': row.status || row['Status'] || 'Aktif',
        'GAMBAR': image,
      };
    });
  } catch (error) {
    console.warn("Notice: Could not fetch students from Google Sheets OAuth:", error);
    return [];
  }
};

export const createAsramaSpreadsheet = async (accessToken: string) => {
  const sheetMetadata = {
    properties: {
      title: 'Data Sistem Pengurusan Asrama'
    },
    sheets: [
      { properties: { title: 'Blok Asrama' } },
      { properties: { title: 'Bilik Asrama' } },
      { properties: { title: 'Pelajar' } },
      { properties: { title: 'Warden' } },
      { properties: { title: 'AJK Asrama' } },
      { properties: { title: 'Pergerakan' } },
      { properties: { title: 'Kehadiran Sekolah' } }
    ]
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sheetMetadata)
  });

  if (!response.ok) {
    throw new Error('Failed to create spreadsheet');
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl;

  // Add Headers and Dummy Data to each sheet
  const initialData = [
    { 
      range: 'Blok Asrama!A1:D4', 
      values: [
        ['Kod Blok', 'Nama Blok', 'Kapasiti Bilik', 'Warden Bertugas'],
        ['A', 'ASPURA', '40', 'HAIRI BIN ABDUL RAHIM'],
        ['A', 'ASPURA', '40', 'NOOR FAIZ BIN JAFFAR'],
        ['B', 'ASPURI', '40', 'NIZAM BIN RUSLI']
      ] 
    },
    { 
      range: 'Bilik Asrama!A1:E4', 
      values: [
        ['No Bilik', 'Kod Blok', 'Kapasiti Maksimum', 'Jumlah Penghuni', 'Status'],
        ['A101', 'A', '4', '4', 'Penuh'],
        ['A102', 'A', '4', '3', 'Ada Kekosongan'],
        ['B201', 'B', '4', '0', 'Kosong']
      ] 
    },
    { 
      range: 'Pelajar!A1:F4', 
      values: [
        ['ID Pelajar', 'Nama Penuh', 'Tingkatan', 'No Bilik', 'No Telefon Penjaga', 'Status'],
        ['P001', 'Ahmad Zaki bin Abu', '4 Sains 1', 'A101', '012-3456789', 'Aktif'],
        ['P002', 'Siti Nurhaliza binti Ali', '5 Sastera', 'B201', '013-4567890', 'Aktif'],
        ['P003', 'Chong Wei Jie', '3 Amanah', 'A102', '014-5678901', 'Aktif']
      ] 
    },
    { 
      range: 'Warden!A1:E4', 
      values: [
        ['ID Warden', 'Nama', 'No Telefon', 'Emel', 'Blok Bertugas'],
        ['W001', 'HAIRI BIN ABDUL RAHIM', '019-1234567', 'hairi@sekolah.edu.my', 'A'],
        ['W002', 'NOOR FAIZ BIN JAFFAR', '018-2345678', 'noorfaiz@sekolah.edu.my', 'A'],
        ['W003', 'NIZAM BIN RUSLI', '017-3456789', 'nizam@sekolah.edu.my', 'B']
      ] 
    },
    { 
      range: 'AJK Asrama!A1:D3', 
      values: [
        ['ID Pelajar', 'Nama', 'Jawatan', 'Tugasan'],
        ['P001', 'Ahmad Zaki bin Abu', 'Ketua Asrama', 'Memantau Disiplin'],
        ['P002', 'Siti Nurhaliza binti Ali', 'Setiausaha', 'Merekod Kehadiran']
      ] 
    },
    { 
      range: 'Pergerakan!A1:I4', 
      values: [
        ['ID Transaksi', 'ID Pelajar', 'Nama', 'Tarikh Keluar', 'Masa Keluar', 'Tarikh Balik', 'Masa Balik', 'Tujuan', 'Status Kelulusan'],
        ['TRX001', 'P001', 'Ahmad Zaki bin Abu', '2023-11-10', '15:00', '2023-11-12', '17:00', 'Balik Kampung', 'Telah Diluluskan'],
        ['TRX002', 'P002', 'Siti Nurhaliza binti Ali', '2023-11-15', '08:00', '2023-11-15', '18:00', 'Klinik Kesihatan', 'Menunggu Kelulusan'],
        ['TRX003', 'P003', 'Chong Wei Jie', '2023-11-16', '09:00', '2023-11-16', '14:00', 'Urusan Keluarga', 'Menunggu Kelulusan']
      ] 
    },
    {
      range: 'Kehadiran Sekolah!A1:F3',
      values: [
        ['ID Transaksi', 'ID Pelajar', 'Nama Pelajar', 'Tarikh', 'Masa Keluar', 'Masa Masuk'],
        ['KHD001', 'P001', 'Ahmad Zaki bin Abu', new Date().toISOString().split('T')[0], '06:45', '14:30'],
        ['KHD002', 'P002', 'Siti Nurhaliza binti Ali', new Date().toISOString().split('T')[0], '06:50', '']
      ]
    }
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: initialData
    })
  });

  return { spreadsheetId, spreadsheetUrl };
};
