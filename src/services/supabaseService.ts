import { supabase, getSavedSupabaseConfig } from '../lib/supabase';
import { Student, StudentStatus, HostelLog } from '../types/hostel';

export interface SupabaseSyncErrorState {
  hasRlsError: boolean;
  lastErrorMessage: string | null;
  lastErrorCode: string | null;
  lastFailedTable: string | null;
  timestamp: number;
}

const PENDING_SYNC_KEY = 'ssemj_pending_supabase_sync';

let currentErrorState: SupabaseSyncErrorState = {
  hasRlsError: false,
  lastErrorMessage: null,
  lastErrorCode: null,
  lastFailedTable: null,
  timestamp: 0,
};

const listeners = new Set<(state: SupabaseSyncErrorState) => void>();

export const getSupabaseSyncErrorState = (): SupabaseSyncErrorState => {
  return currentErrorState;
};

export const subscribeToSupabaseSyncError = (
  listener: (state: SupabaseSyncErrorState) => void
) => {
  listeners.add(listener);
  listener(currentErrorState);
  return () => {
    listeners.delete(listener);
  };
};

const updateErrorState = (update: Partial<SupabaseSyncErrorState>) => {
  currentErrorState = {
    ...currentErrorState,
    ...update,
    timestamp: Date.now(),
  };
  listeners.forEach((l) => {
    try {
      l(currentErrorState);
    } catch (e) {
      console.error('Error in Supabase error listener:', e);
    }
  });
};

export const clearSupabaseRlsError = () => {
  updateErrorState({
    hasRlsError: false,
    lastErrorMessage: null,
    lastErrorCode: null,
    lastFailedTable: null,
  });
};

// Queue failed sync payloads locally so no data is lost during RLS lockouts
interface PendingPayload {
  type: 'status' | 'log';
  payload: any;
  addedAt: number;
}

const getPendingQueue = (): PendingPayload[] => {
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const enqueuePending = (item: PendingPayload) => {
  try {
    const queue = getPendingQueue();
    // Keep max 200 items to avoid storage bloat
    const updated = [item, ...queue.slice(0, 199)];
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to enqueue pending sync payload:', err);
  }
};

export const getPendingSyncCount = (): number => {
  return getPendingQueue().length;
};

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  const { url, anonKey } = getSavedSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    !url.includes('placeholder.supabase.co') &&
    anonKey !== 'placeholder' &&
    url.startsWith('https://') &&
    anonKey.length > 20
  );
};

// Batch upload all current student statuses to Supabase to initialize/sync remote database
export const uploadAllCurrentStateToSupabase = async (
  statuses: Record<string, StudentStatus>,
  students: Student[],
  onProgress?: (done: number, total: number) => void
): Promise<{ success: boolean; count: number; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, count: 0, error: 'Supabase belum dikonfigurasikan' };
  }

  try {
    const records = students.map((s) => {
      const cleanKp = (s.kp || '').replace(/[\s-]/g, '');
      const current = statuses[s.kp] || statuses[cleanKp];
      return {
        kp: cleanKp,
        status: current?.status || 'DALAM',
        since: current?.since || Date.now(),
        destination: current?.dest || null,
        expected_return: current?.expectedReturn || null,
        updated_at: new Date().toISOString(),
      };
    });

    const chunkSize = 50;
    let uploaded = 0;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('student_status')
        .upsert(chunk, { onConflict: 'kp' });

      if (error) {
        return { success: false, count: uploaded, error: error.message };
      }
      uploaded += chunk.length;
      if (onProgress) onProgress(uploaded, records.length);
    }

    return { success: true, count: uploaded };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Ralat muat naik data' };
  }
};

export const syncStudentStatus = async (
  kp: string,
  status: string,
  destination: string | undefined,
  expectedReturn?: string
) => {
  if (!isSupabaseConfigured()) return;
  const cleanKp = (kp || '').replace(/[\s-]/g, '');
  const payload: any = {
    kp: cleanKp,
    status,
    since: Date.now(),
    destination: destination || null,
    expected_return: expectedReturn || null,
    updated_at: new Date().toISOString(),
  };

  try {
    let { error } = await supabase
      .from('student_status')
      .upsert(payload, { onConflict: 'kp' });

    // Fallback if expected_return column has BIGINT type mismatch in PostgreSQL
    if (error && (error.code === '22P02' || error.message?.includes('bigint') || error.message?.includes('expected_return'))) {
      const parsedTime = expectedReturn ? Date.parse(expectedReturn.replace(' ', 'T')) : NaN;
      payload.expected_return = !isNaN(parsedTime) ? parsedTime : null;
      const retryRes = await supabase.from('student_status').upsert(payload, { onConflict: 'kp' });
      error = retryRes.error;
    }

    if (error) {
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        updateErrorState({
          hasRlsError: true,
          lastErrorMessage: error.message,
          lastErrorCode: error.code,
          lastFailedTable: 'student_status',
        });
        enqueuePending({ type: 'status', payload, addedAt: Date.now() });
        console.warn(
          '[Supabase RLS Error 42501]: Table "student_status" menyekat kemasukan data kerana ketiadaan polisi RLS. Sila rujuk pembantu RLS Supabase di bahagian atas dashboard.',
          error
        );
      } else {
        console.error('Supabase sync error (status):', error);
      }
    } else {
      if (currentErrorState.hasRlsError && currentErrorState.lastFailedTable === 'student_status') {
        clearSupabaseRlsError();
      }
    }
  } catch (err) {
    console.error('Supabase error:', err);
  }
};

export interface BulkStatusItem {
  kp: string;
  status: string;
  since?: number;
  destination?: string;
  expectedReturn?: string;
}

/**
 * High-performance batch synchronization for bulk outing, bulk return, and mass updates.
 * Automatically chunks payloads and recovers from PostgreSQL column type mismatches.
 */
export const syncBulkStudentStatuses = async (
  items: BulkStatusItem[]
): Promise<{ success: boolean; count: number; error?: string }> => {
  if (!isSupabaseConfigured() || !items || items.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const records = items.map(item => {
      const cleanKp = (item.kp || '').replace(/[\s-]/g, '');
      return {
        kp: cleanKp,
        status: item.status,
        since: item.since || Date.now(),
        destination: item.destination || null,
        expected_return: item.expectedReturn || null,
        updated_at: new Date().toISOString(),
      };
    });

    const chunkSize = 50;
    let uploaded = 0;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      let { error } = await supabase
        .from('student_status')
        .upsert(chunk, { onConflict: 'kp' });

      // Fallback for BIGINT column type mismatch on expected_return
      if (error && (error.code === '22P02' || error.message?.includes('bigint') || error.message?.includes('expected_return'))) {
        console.warn('Supabase type mismatch on expected_return, retrying with numeric timestamps...');
        const numericChunk = chunk.map(rec => {
          const parsed = rec.expected_return ? Date.parse(String(rec.expected_return).replace(' ', 'T')) : NaN;
          return {
            ...rec,
            expected_return: !isNaN(parsed) ? parsed : null
          };
        });
        const retryRes = await supabase
          .from('student_status')
          .upsert(numericChunk, { onConflict: 'kp' });
        error = retryRes.error;
      }

      if (error) {
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          updateErrorState({
            hasRlsError: true,
            lastErrorMessage: error.message,
            lastErrorCode: error.code,
            lastFailedTable: 'student_status',
          });
          chunk.forEach(p => enqueuePending({ type: 'status', payload: p, addedAt: Date.now() }));
        }
        console.error('Supabase bulk status sync error:', error);
        return { success: false, count: uploaded, error: error.message };
      }
      uploaded += chunk.length;
    }

    if (currentErrorState.hasRlsError && currentErrorState.lastFailedTable === 'student_status') {
      clearSupabaseRlsError();
    }
    return { success: true, count: uploaded };
  } catch (err: any) {
    console.error('Supabase bulk status exception:', err);
    return { success: false, count: 0, error: err?.message || 'Ralat muat naik status pukal' };
  }
};

/**
 * High-performance batch synchronization for hostel logs.
 */
export const syncBulkHostelLogs = async (
  logs: HostelLog[]
): Promise<{ success: boolean; count: number; error?: string }> => {
  if (!isSupabaseConfigured() || !logs || logs.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const records = logs.map(log => {
      const cleanKp = (log.kp || '').replace(/[\s-]/g, '');
      return {
        id: log.id,
        ts: log.ts,
        kp: cleanKp,
        nama: log.nama,
        action: log.action,
        detail: log.detail,
        officer: log.officer,
        created_at: new Date(log.ts).toISOString(),
      };
    });

    const chunkSize = 50;
    let inserted = 0;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const { error } = await supabase.from('hostel_logs').insert(chunk);
      if (error) {
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          updateErrorState({
            hasRlsError: true,
            lastErrorMessage: error.message,
            lastErrorCode: error.code,
            lastFailedTable: 'hostel_logs',
          });
          chunk.forEach(p => enqueuePending({ type: 'log', payload: p, addedAt: Date.now() }));
        }
        console.error('Supabase bulk logs sync error:', error);
        return { success: false, count: inserted, error: error.message };
      }
      inserted += chunk.length;
    }

    if (currentErrorState.hasRlsError && currentErrorState.lastFailedTable === 'hostel_logs') {
      clearSupabaseRlsError();
    }
    return { success: true, count: inserted };
  } catch (err: any) {
    console.error('Supabase bulk logs exception:', err);
    return { success: false, count: 0, error: err?.message || 'Ralat muat naik log pukal' };
  }
};

export const syncHostelLog = async (log: HostelLog) => {
  if (!isSupabaseConfigured()) return;
  const cleanKp = (log.kp || '').replace(/[\s-]/g, '');
  const payload = {
    id: log.id,
    ts: log.ts,
    kp: cleanKp,
    nama: log.nama,
    action: log.action,
    detail: log.detail,
    officer: log.officer,
    created_at: new Date(log.ts).toISOString(),
  };

  try {
    const { error } = await supabase.from('hostel_logs').insert(payload);

    if (error) {
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        updateErrorState({
          hasRlsError: true,
          lastErrorMessage: error.message,
          lastErrorCode: error.code,
          lastFailedTable: 'hostel_logs',
        });
        enqueuePending({ type: 'log', payload, addedAt: Date.now() });
        console.warn(
          '[Supabase RLS Error 42501]: Table "hostel_logs" menyekat kemasukan data kerana ketiadaan polisi RLS. Sila rujuk pembantu RLS Supabase di bahagian atas dashboard.',
          error
        );
      } else {
        console.error('Supabase sync error (log):', error);
      }
    } else {
      if (currentErrorState.hasRlsError && currentErrorState.lastFailedTable === 'hostel_logs') {
        clearSupabaseRlsError();
      }
    }
  } catch (err) {
    console.error('Supabase error:', err);
  }
};

// Sync parent request creation to cloud
export const syncParentRequestToCloud = async (req: any) => {
  const cleanKp = (req.studentKp || '').replace(/[\s-]/g, '');
  const log: HostelLog = {
    id: `REQ-${req.id}`,
    ts: req.createdAt || Date.now(),
    kp: cleanKp,
    nama: req.studentNama,
    kelas: req.studentKelas,
    bidang: '',
    action: 'PERMOHONAN_WARIS',
    detail: JSON.stringify(req),
    officer: `Waris: ${req.namaPenjaga} (${req.hubungan})`
  };
  await syncHostelLog(log);
};

// Sync parent request approval or rejection to cloud
export const syncParentRequestReviewToCloud = async (req: any, type: 'APPROVED' | 'REJECTED') => {
  const cleanKp = (req.studentKp || '').replace(/[\s-]/g, '');
  const log: HostelLog = {
    id: `REQ-REV-${req.id}-${Date.now()}`,
    ts: Date.now(),
    kp: cleanKp,
    nama: req.studentNama,
    kelas: req.studentKelas,
    bidang: '',
    action: type === 'APPROVED' ? 'LULUS_WARIS' : 'TOLAK_WARIS',
    detail: JSON.stringify(req),
    officer: req.reviewedBy || 'Warden'
  };
  await syncHostelLog(log);
};

// Sync attendance record to cloud
export const syncAttendanceRecordToCloud = async (
  sessionKey: string,
  sessionLabel: string,
  student: Student,
  timestamp: number,
  officer: string
) => {
  const cleanKp = (student.kp || '').replace(/[\s-]/g, '');
  const log: HostelLog = {
    id: `ATT-${sessionKey}-${cleanKp}-${timestamp}`,
    ts: timestamp,
    kp: cleanKp,
    nama: student.nama,
    kelas: student.kelas,
    bidang: student.bidang,
    action: 'Kehadiran',
    detail: JSON.stringify({ sessionKey, sessionLabel, time: timestamp }),
    officer: officer || 'Warden Bertugas'
  };
  await syncHostelLog(log);
};

// Sync new student registration to cloud
export const syncNewStudentToCloud = async (student: Student) => {
  const cleanKp = (student.kp || '').replace(/[\s-]/g, '');
  const log: HostelLog = {
    id: `NEW-STU-${cleanKp}-${Date.now()}`,
    ts: Date.now(),
    kp: cleanKp,
    nama: student.nama,
    kelas: student.kelas,
    bidang: student.bidang,
    action: 'DAFTAR_MURID',
    detail: JSON.stringify(student),
    officer: 'Sistem / Pentadbir'
  };
  await syncHostelLog(log);
};

export const verifyScannerDevice = async (secret: string) => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('scanner_devices')
      .select('*')
      .eq('secret', secret)
      .eq('active', true)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
};

export const fetchInitialStateFromSupabase = async () => {
  if (!isSupabaseConfigured()) return null;
  try {
    const [statusRes, logsRes] = await Promise.all([
      supabase.from('student_status').select('*'),
      supabase.from('hostel_logs').select('*').order('ts', { ascending: false }).limit(1500),
    ]);

    if (statusRes.error) {
      if (statusRes.error.code === '42501') {
        updateErrorState({
          hasRlsError: true,
          lastErrorMessage: statusRes.error.message,
          lastErrorCode: statusRes.error.code,
          lastFailedTable: 'student_status',
        });
      }
      console.warn('Notice fetching status from Supabase:', statusRes.error);
    }
    if (logsRes.error) {
      if (logsRes.error.code === '42501') {
        updateErrorState({
          hasRlsError: true,
          lastErrorMessage: logsRes.error.message,
          lastErrorCode: logsRes.error.code,
          lastFailedTable: 'hostel_logs',
        });
      }
      console.warn('Notice fetching logs from Supabase:', logsRes.error);
    }

    return {
      statuses: statusRes.data || [],
      logs: logsRes.data || [],
    };
  } catch (err) {
    console.warn('Failed to fetch initial state from Supabase:', err);
    return null;
  }
};

// Helper to extract parent requests, attendance, and registered students from cloud logs
export const parseSpecialCloudLogs = (logs: any[]) => {
  const requestsMap = new Map<string, any>();
  const attendanceMap: Record<string, Record<string, number>> = {};
  const newStudentsMap = new Map<string, Student>();

  // Process logs in chronological order so later status overrides earlier
  const chronological = [...logs].sort((a, b) => (a.ts || 0) - (b.ts || 0));

  for (const log of chronological) {
    if (!log.detail) continue;

    // Parent Request creation or status update
    if (log.action === 'PERMOHONAN_WARIS' || log.action === 'LULUS_WARIS' || log.action === 'TOLAK_WARIS') {
      try {
        const parsed = JSON.parse(log.detail);
        if (parsed && parsed.id) {
          const existing = requestsMap.get(parsed.id);
          requestsMap.set(parsed.id, { ...(existing || {}), ...parsed });
        }
      } catch {}
    }

    // Attendance records
    if (log.action === 'Kehadiran') {
      try {
        const parsed = JSON.parse(log.detail);
        if (parsed && parsed.sessionKey && log.kp) {
          const sKey = parsed.sessionKey;
          if (!attendanceMap[sKey]) attendanceMap[sKey] = {};
          const cleanKp = (log.kp || '').replace(/[\s-]/g, '');
          attendanceMap[sKey][cleanKp] = parsed.time || log.ts;
          attendanceMap[sKey][log.kp] = parsed.time || log.ts;
        }
      } catch {
        // Fallback for simple string detail
      }
    }

    // Newly registered students
    if (log.action === 'DAFTAR_MURID') {
      try {
        const parsed = JSON.parse(log.detail);
        if (parsed && parsed.kp && parsed.nama) {
          const cleanKp = (parsed.kp || '').replace(/[\s-]/g, '');
          newStudentsMap.set(cleanKp, parsed);
        }
      } catch {}
    }
  }

  return {
    requests: Array.from(requestsMap.values()),
    attendance: attendanceMap,
    newStudents: Array.from(newStudentsMap.values())
  };
};

// Test permissions directly to check if RLS is working
export const testSupabaseRlsPermissions = async (): Promise<{
  success: boolean;
  message: string;
  code?: string;
}> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase URL atau Anon Key belum dikonfigurasikan.',
    };
  }

  try {
    // Test write & delete on hostel_logs with a test ID
    const testId = `_test_rls_${Date.now()}`;
    const insertRes = await supabase.from('hostel_logs').insert({
      id: testId,
      ts: Date.now(),
      kp: '000000-00-0000',
      nama: 'Ujian Polisi RLS',
      action: 'Ujian Sambungan',
      detail: 'Ujian automatik dari Sistem Kad Asrama SSeMJ',
      officer: 'Sistem',
      created_at: new Date().toISOString(),
    });

    if (insertRes.error) {
      return {
        success: false,
        message: insertRes.error.message || 'Sekatan akses dikesan pada hostel_logs',
        code: insertRes.error.code,
      };
    }

    // Clean up test log
    await supabase.from('hostel_logs').delete().eq('id', testId);

    // Test upsert on student_status
    const statusRes = await supabase.from('student_status').upsert(
      {
        kp: '000000-00-0000',
        status: 'DALAM',
        since: Date.now(),
        destination: 'Ujian',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'kp' }
    );

    if (statusRes.error) {
      return {
        success: false,
        message: statusRes.error.message || 'Sekatan akses dikesan pada student_status',
        code: statusRes.error.code,
      };
    }

    // Clean up test status
    await supabase.from('student_status').delete().eq('kp', '000000-00-0000');

    clearSupabaseRlsError();

    // Flush any pending queue
    await retryPendingSync();

    return {
      success: true,
      message: 'Berjaya! Polisi RLS Supabase membenarkan operasi baca & tulis sepenuhnya.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal berkomunikasi dengan Supabase.',
    };
  }
};

// Retry any pending updates once RLS has been fixed
export const retryPendingSync = async (): Promise<{ synced: number; failed: number }> => {
  const queue = getPendingQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: PendingPayload[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'status') {
        const { error } = await supabase.from('student_status').upsert(item.payload, { onConflict: 'kp' });
        if (error) {
          failed++;
          remaining.push(item);
        } else {
          synced++;
        }
      } else if (item.type === 'log') {
        const { error } = await supabase.from('hostel_logs').insert(item.payload);
        if (error) {
          failed++;
          remaining.push(item);
        } else {
          synced++;
        }
      }
    } catch {
      failed++;
      remaining.push(item);
    }
  }

  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(remaining));
  return { synced, failed };
};

export const SUPABASE_FULL_SETUP_SQL = `-- ==============================================================================
-- SKRIP PANGKALAN DATA PENUH SUPABASE UNTUK e-SMART SSeMJ
-- Salin semua kod ini dan tampal di: Supabase Dashboard -> SQL Editor -> New Query -> RUN
-- ==============================================================================

-- 1. Jadual Status Semasa Murid (student_status)
CREATE TABLE IF NOT EXISTS student_status (
    kp TEXT PRIMARY KEY,
    status TEXT NOT NULL, -- 'DALAM', 'KELUAR', 'OUTING', 'BERMALAM', 'KUARANTIN'
    since BIGINT NOT NULL,
    destination TEXT,
    expected_return TEXT, -- Menyokong format teks tarikh/masa 'YYYY-MM-DD HH:mm' atau timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pastikan lajur expected_return sedia ada ditukar kepada TEXT sekiranya pernah dicipta sebagai BIGINT
ALTER TABLE IF EXISTS student_status ALTER COLUMN expected_return TYPE TEXT;

-- 2. Jadual Log Pergerakan & Transaksi Asrama (hostel_logs)
CREATE TABLE IF NOT EXISTS hostel_logs (
    id TEXT PRIMARY KEY,
    ts BIGINT NOT NULL,
    kp TEXT NOT NULL,
    nama TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    officer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Jadual Peranti Pengimbas (scanner_devices)
CREATE TABLE IF NOT EXISTS scanner_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_name TEXT NOT NULL,
    location TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    secret TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Aktifkan Row-Level Security (RLS) & Beri Kebenaran Penuh
ALTER TABLE student_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanner_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon and authenticated on student_status" ON student_status;
CREATE POLICY "Allow all for anon and authenticated on student_status"
ON student_status FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon and authenticated on hostel_logs" ON hostel_logs;
CREATE POLICY "Allow all for anon and authenticated on hostel_logs"
ON hostel_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon and authenticated on scanner_devices" ON scanner_devices;
CREATE POLICY "Allow all for anon and authenticated on scanner_devices"
ON scanner_devices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Aktifkan Realtime Live Updates
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE student_status;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE hostel_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;`;

export const SUPABASE_RLS_FIX_SQL = `-- ==============================================================================
-- PENYELESAIAN RALAT 42501 (ROW-LEVEL SECURITY POLICY) & PEMBETULAN SKIMA SUPABASE
-- Salin semua kod ini dan tampal di Supabase Dashboard: SQL Editor -> Run
-- ==============================================================================

-- 1. Tukar lajur expected_return kepada TEXT (elak ralat sintaks BIGINT pada tarikh balik)
ALTER TABLE IF EXISTS student_status ALTER COLUMN expected_return TYPE TEXT;

-- 2. Aktifkan RLS
ALTER TABLE IF EXISTS hostel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scanner_devices ENABLE ROW LEVEL SECURITY;

-- 3. Beri kebenaran Penuh (Baca, Tulis, Kemas kini) kepada 'anon' dan 'authenticated'
DROP POLICY IF EXISTS "Allow all for anon and authenticated on hostel_logs" ON hostel_logs;
DROP POLICY IF EXISTS "Public access hostel_logs" ON hostel_logs;
CREATE POLICY "Allow all for anon and authenticated on hostel_logs"
ON hostel_logs FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon and authenticated on student_status" ON student_status;
DROP POLICY IF EXISTS "Public access student_status" ON student_status;
CREATE POLICY "Allow all for anon and authenticated on student_status"
ON student_status FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon and authenticated on scanner_devices" ON scanner_devices;
DROP POLICY IF EXISTS "Public access scanner_devices" ON scanner_devices;
CREATE POLICY "Allow all for anon and authenticated on scanner_devices"
ON scanner_devices FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. Aktifkan Realtime siaran langsung
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE hostel_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE student_status;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;`;

export const SUPABASE_DISABLE_RLS_SQL = `-- Alternatif Pantas: Matikan terus perlindungan RLS jika sistem Kiosk/Dalam sahaja:
ALTER TABLE IF EXISTS student_status ALTER COLUMN expected_return TYPE TEXT;
ALTER TABLE IF EXISTS hostel_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scanner_devices DISABLE ROW LEVEL SECURITY;`;
