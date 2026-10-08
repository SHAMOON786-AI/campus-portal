-- Run this in your Supabase SQL Editor to set up the necessary tables for the new features

-- 1. Student Profiles Table
CREATE TABLE IF NOT EXISTS students (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  branch TEXT,
  cgpa NUMERIC(4,2),
  graduation_year INTEGER,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Company/Recruiter Profiles Table
CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  company_name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Modify Jobs Table for Allowed Departments
-- (Assuming jobs table already exists, we just add the allowed_departments column if it doesn't)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='allowed_departments') THEN
    ALTER TABLE jobs ADD COLUMN allowed_departments TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- 4. Audit Logs Table for Admin Actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Add Profile Picture URL Column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
