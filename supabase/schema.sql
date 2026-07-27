-- ============================================================
-- Supabase Database Schema for Venkateswara Electricals
-- Project Attendance & Site Tracking System
-- ============================================================

-- 1. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emp_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    designation TEXT NOT NULL DEFAULT 'Worker',
    category TEXT NOT NULL DEFAULT 'Worker', -- 'Engineer' or 'Worker'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. SITES TABLE
CREATE TABLE IF NOT EXISTS public.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    location TEXT,
    code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PRESENT', -- 'PRESENT', 'ABSENT', 'HALF_DAY', 'HOLIDAY'
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    site_ids TEXT[] DEFAULT '{}',
    ot_hours NUMERIC(4, 2) NOT NULL DEFAULT 0.0,
    late_hours INT NOT NULL DEFAULT 0,
    late_minutes INT NOT NULL DEFAULT 0,
    labour_count INT NOT NULL DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_emp_date UNIQUE (employee_id, date)
);

-- MIGRATION STATEMENTS: ADD MISSING COLUMNS IF TABLES ALREADY EXIST ONLINE
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS site_ids TEXT[] DEFAULT '{}';
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS ot_hours NUMERIC(4, 2) NOT NULL DEFAULT 0.0;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS late_hours INT NOT NULL DEFAULT 0;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS late_minutes INT NOT NULL DEFAULT 0;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS labour_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 4. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Superadmin', 'Admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_site ON public.attendance_records(site_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR PUBLIC ANON ACCESS (Row Level Security Policies)
DROP POLICY IF EXISTS "Allow public read employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public insert employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public update employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public delete employees" ON public.employees;

CREATE POLICY "Allow public read employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow public insert employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update employees" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Allow public delete employees" ON public.employees FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read sites" ON public.sites;
DROP POLICY IF EXISTS "Allow public insert sites" ON public.sites;
DROP POLICY IF EXISTS "Allow public update sites" ON public.sites;
DROP POLICY IF EXISTS "Allow public delete sites" ON public.sites;

CREATE POLICY "Allow public read sites" ON public.sites FOR SELECT USING (true);
CREATE POLICY "Allow public insert sites" ON public.sites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update sites" ON public.sites FOR UPDATE USING (true);
CREATE POLICY "Allow public delete sites" ON public.sites FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow public insert attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow public update attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Allow public delete attendance" ON public.attendance_records;

CREATE POLICY "Allow public read attendance" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert attendance" ON public.attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update attendance" ON public.attendance_records FOR UPDATE USING (true);
CREATE POLICY "Allow public delete attendance" ON public.attendance_records FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read users" ON public.users;
DROP POLICY IF EXISTS "Allow public insert users" ON public.users;
DROP POLICY IF EXISTS "Allow public update users" ON public.users;

CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);

-- SEED USERS DATA
INSERT INTO public.users (username, password, role) VALUES
('venksuperadmin', '$uper@dmin$34', 'Superadmin'),
('venkadmin', '@dmin$321', 'Admin')
ON CONFLICT (username) DO NOTHING;

-- SEED SITES DATA
INSERT INTO public.sites (name, code, location) VALUES
('SFS Amber-Cordial Paradise', 'SFS-CP', 'Trivandrum'),
('Artech Livespace- Vinvish Cblock', 'ART-VC', 'Trivandrum'),
('Sree Dhanya Laposhe Cosmo Hospital', 'SD-CH', 'Trivandrum'),
('Cordon Emerald', 'CE', 'Trivandrum'),
('Dragon Stone', 'DS', 'Trivandrum'),
('PRS Hospital karamana', 'PRS', 'Karamana'),
('Cochin International School', 'CIS', 'Kochi'),
('Icloud SIS - Powerlink', 'ISIS', 'Trivandrum'),
('TRINS-Korani', 'TRINS', 'Korani'),
('Leela Madhavam', 'LM', 'Trivandrum'),
('Amara Resort', 'AR', 'Kovalam'),
('Silver Castle Winter leaf', 'SCWL', 'Trivandrum'),
('Simz Plaza', 'SP', 'Trivandrum')
ON CONFLICT (name) DO NOTHING;

-- SEED EMPLOYEES DATA
INSERT INTO public.employees (emp_id, name, designation, category) VALUES
('E001', 'NIRMAL KUMAR', 'Site Engineer', 'Engineer'),
('E002', 'MOHANDAS C', 'Site Engineer', 'Engineer'),
('E003', 'AJEESH KUMAR', 'Site Engineer', 'Engineer'),
('E004', 'RENJESH', 'Site Engineer', 'Engineer'),
('E005', 'SABITH', 'Site Engineer', 'Engineer'),
('E006', 'VINAYAK', 'Site Engineer', 'Engineer'),
('E007', 'BABU', 'Site Engineer', 'Engineer'),
('E008', 'JAYARAM', 'Site Engineer', 'Engineer'),
('E009', 'SREEJIN S', 'Site Engineer', 'Engineer'),
('E010', 'VIMAL', 'Worker', 'Worker'),
('E011', 'RENJITH R K', 'Worker', 'Worker'),
('E012', 'PRADEEP A D', 'Worker', 'Worker'),
('E013', 'PRAVEEN P', 'Worker', 'Worker'),
('E014', 'SIBIN', 'Worker', 'Worker'),
('E015', 'ARUN M L', 'Worker', 'Worker'),
('E016', 'PRADEEP B S', 'Worker', 'Worker'),
('E017', 'RATHEESH S', 'Worker', 'Worker'),
('E018', 'ANOOP A R', 'Worker', 'Worker'),
('E019', 'SREEKUMAR', 'Worker', 'Worker'),
('E020', 'PRADEEP KUMAR M', 'Worker', 'Worker'),
('E021', 'CHANDRABABU', 'Worker', 'Worker'),
('E022', 'JITHIN', 'Worker', 'Worker'),
('E023', 'KIRAN', 'Worker', 'Worker'),
('E024', 'ROBINSON', 'Worker', 'Worker'),
('E025', 'VISHNU R', 'Worker', 'Worker'),
('E026', 'SIVAPRASAD', 'Worker', 'Worker'),
('E027', 'NITHIN S G', 'Worker', 'Worker'),
('E028', 'DILEEP', 'Worker', 'Worker'),
('E029', 'CRISPIN VINCENT', 'Worker', 'Worker'),
('E030', 'SUSEEL', 'Worker', 'Worker'),
('E031', 'DAWN', 'Worker', 'Worker'),
('E032', 'SHIBIN', 'Worker', 'Worker'),
('E033', 'ANURAJ', 'Worker', 'Worker'),
('E034', 'ABHIJITH', 'Worker', 'Worker'),
('E035', 'JAYASHANKAR', 'Worker', 'Worker'),
('E036', 'NANDAKUMAR', 'Worker', 'Worker'),
('E037', 'ROYMON', 'Worker', 'Worker'),
('E038', 'SOORAJ', 'Worker', 'Worker'),
('E039', 'NAVIN', 'Worker', 'Worker'),
('E040', 'PRABIN MOSES', 'Worker', 'Worker'),
('E041', 'PRINCE', 'Worker', 'Worker'),
('E042', 'RAJESH R', 'Worker', 'Worker'),
('E043', 'SUJITH S', 'Worker', 'Worker'),
('E044', 'VISHNU J', 'Worker', 'Worker'),
('E045', 'VINOD P', 'Worker', 'Worker'),
('E046', 'AKSHAY', 'Worker', 'Worker'),
('E047', 'PRAVEEN KUMAR G', 'Worker', 'Worker'),
('E048', 'AKHIL', 'Worker', 'Worker'),
('E049', 'ARUN LAL', 'Worker', 'Worker'),
('E050', 'ALAN', 'Worker', 'Worker'),
('E051', 'ATHUL', 'Worker', 'Worker'),
('E052', 'SUB-NISHANTH', 'Subcontractor', 'Worker'),
('E053', 'SUB-ANILKUMAR', 'Subcontractor', 'Worker'),
('E054', 'SUB-ANOOP B', 'Subcontractor', 'Worker'),
('E055', 'SUB- BHUVANACHANDRAN', 'Subcontractor', 'Worker')
ON CONFLICT (emp_id) DO NOTHING;

