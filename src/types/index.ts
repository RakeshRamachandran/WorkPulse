export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'HOLIDAY';

export interface Employee {
  id: string;
  emp_id: string; // e.g. E001
  name: string;
  designation: string; // e.g. 'Site Engineer', 'Worker'
  category: string; // 'Engineer' or 'Worker'
  is_active: boolean;
  created_at?: string;
}

export interface Site {
  id: string;
  name: string;
  location?: string;
  code?: string;
  is_active: boolean;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  site_id?: string | null;
  site_name?: string; // hydrated helper
  ot_hours: number;
  late_hours: number;
  late_minutes: number;
  remarks?: string;
}

export interface MonthlyEmployeeSummary {
  employee: Employee;
  workingDays: number;
  leaveDays: number;
  holidayCount: number;
  regularHours: number;
  otHours: number;
  totalHours: number;
  totalLateMinutes: number;
  lateFormatted: string;
  siteDays: Record<string, number>; // site_id -> count of days worked
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export interface AppUser {
  id?: string;
  username: string;
  role: 'Superadmin' | 'Admin';
}

export type ActiveTab = 'dashboard' | 'daily' | 'matrix' | 'summary' | 'masters' | 'sites' | 'supabase';
