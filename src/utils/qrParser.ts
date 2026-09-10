import { Student } from '../types/hostel';

export interface ParsedQrResult {
  student: Student | null;
  passNumber?: string;
  passType?: 'outing' | 'bermalam' | 'biasa';
  approvedBy?: string;
  statusText?: string;
  rawText: string;
}

export function parseQrScanResult(raw: string, students: Student[]): ParsedQrResult {
  const trimmed = raw.trim();
  let foundStudent: Student | null = null;
  let passNumber: string | undefined;
  let passType: 'outing' | 'bermalam' | 'biasa' | undefined;
  let approvedBy: string | undefined;
  let statusText: string | undefined;

  // 1. Extract IC Number (12 digits with or without hyphens)
  const kpMatch = trimmed.match(/\b\d{6}-?\d{2}-?\d{4}\b/);
  if (kpMatch) {
    const cleanKp = kpMatch[0].replace(/-/g, '');
    const s = students.find(item => item.kp.replace(/-/g, '') === cleanKp);
    if (s) foundStudent = s;
  }

  // 2. Fallback: match by Student ID (e.g. STU001)
  if (!foundStudent) {
    const sById = students.find(item => 
      trimmed.toLowerCase().includes(item.id.toLowerCase())
    );
    if (sById) foundStudent = sById;
  }

  // 3. Fallback: match by Exact Student Name in text
  if (!foundStudent) {
    for (const item of students) {
      if (item.nama && item.nama.length > 4 && trimmed.toUpperCase().includes(item.nama.toUpperCase())) {
        foundStudent = item;
        break;
      }
    }
  }

  // 4. Extract Pass Number (e.g. PAS-4-1234-5678 or PAS-XXXX)
  const passMatch = trimmed.match(/PAS-[A-Za-z0-9-]+/i);
  if (passMatch) {
    passNumber = passMatch[0].toUpperCase();
  }

  // 5. Extract Pass Type
  const lower = trimmed.toLowerCase();
  if (lower.includes('bermalam') || lower.includes('pulang bermalam') || lower.includes('balik bermalam')) {
    passType = 'bermalam';
  } else if (lower.includes('outing')) {
    passType = 'outing';
  } else if (lower.includes('riadah') || lower.includes('biasa') || lower.includes('keluar')) {
    passType = 'biasa';
  }

  // 6. Extract Approval Warden / Status
  if (lower.includes('diluluskan')) {
    statusText = 'DILULUSKAN';
  }
  const byMatch = trimmed.match(/Oleh:\s*([^\n\r]+)/i);
  if (byMatch) {
    approvedBy = byMatch[1].trim();
  }

  return {
    student: foundStudent,
    passNumber,
    passType,
    approvedBy,
    statusText,
    rawText: trimmed,
  };
}
