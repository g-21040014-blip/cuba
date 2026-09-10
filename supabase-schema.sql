-- ==============================================================================
-- SKRIP PANGKALAN DATA SUPABASE UNTUK SISTEM ASRAMA e-SMART SSeMJ
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> RUN
-- ==============================================================================

-- 0. Pengaktifan sambungan UUID (jika diperlukan)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Jadual Peranti Pengimbas (Scanner Kiosk)
CREATE TABLE IF NOT EXISTS scanner_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_name TEXT NOT NULL,
    location TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    secret TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Jadual Log Pergerakan Pelajar (hostel_logs)
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

-- 3. Jadual Status Semasa Pelajar (student_status)
CREATE TABLE IF NOT EXISTS student_status (
    kp TEXT PRIMARY KEY,
    status TEXT NOT NULL, -- 'DALAM', 'KELUAR', 'OUTING', 'BERMALAM', 'KUARANTIN'
    since BIGINT NOT NULL,
    destination TEXT,
    expected_return BIGINT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- PENYELESAIAN RALAT 42501: ROW LEVEL SECURITY (RLS) POLICIES
-- Masalah "new row violates row-level security policy" berlaku kerana RLS aktif
-- tetapi tiada polisi kebenaran diberikan kepada pengguna tanpa login ('anon').
-- ==============================================================================

-- Aktifkan RLS pada semua jadual
ALTER TABLE hostel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanner_devices ENABLE ROW LEVEL SECURITY;

-- 1. Polisi Akses Penuh untuk hostel_logs (BACA & TULIS)
DROP POLICY IF EXISTS "Allow all for anon and authenticated on hostel_logs" ON hostel_logs;
DROP POLICY IF EXISTS "Public access hostel_logs" ON hostel_logs;
CREATE POLICY "Allow all for anon and authenticated on hostel_logs"
ON hostel_logs
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 2. Polisi Akses Penuh untuk student_status (BACA & TULIS / UPSERT)
DROP POLICY IF EXISTS "Allow all for anon and authenticated on student_status" ON student_status;
DROP POLICY IF EXISTS "Public access student_status" ON student_status;
CREATE POLICY "Allow all for anon and authenticated on student_status"
ON student_status
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. Polisi Akses Baca & Tulis untuk scanner_devices
DROP POLICY IF EXISTS "Allow all for anon and authenticated on scanner_devices" ON scanner_devices;
DROP POLICY IF EXISTS "Public access scanner_devices" ON scanner_devices;
CREATE POLICY "Allow all for anon and authenticated on scanner_devices"
ON scanner_devices
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- AKTIFKAN SUPABASE REALTIME (Live Updates Antara Telefon/Kiosk)
-- ==============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE hostel_logs;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE student_status;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- ==============================================================================
-- PILIHAN ALTERNATIF (PANTAS):
-- Jika anda mahu mematikan terus RLS supaya tiada sebarang sekatan kebenaran:
-- ------------------------------------------------------------------------------
-- ALTER TABLE hostel_logs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_status DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE scanner_devices DISABLE ROW LEVEL SECURITY;
-- ==============================================================================

