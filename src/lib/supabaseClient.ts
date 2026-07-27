import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Employee, Site, AttendanceRecord, SupabaseConfig, AppUser } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_SITES, generateInitialAttendance } from '../data/initialData';

const CONFIG_STORAGE_KEY = 've_supabase_config';
const LOCAL_EMP_KEY = 've_local_employees';
const LOCAL_SITES_KEY = 've_local_sites';
const LOCAL_ATT_KEY = 've_local_attendance';

export function getStoredConfig(): SupabaseConfig {
  const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return {
          ...parsed,
          url: parsed.url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, ''),
        };
      }
    } catch {
      // fallback
    }
  }

  // Fallback to Vite environment variables (.env / .env.local)
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: Boolean(envUrl && envKey),
  };
}

export function saveStoredConfig(config: SupabaseConfig) {
  const sanitized = {
    ...config,
    url: config.url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, ''),
  };
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(sanitized));
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredConfig();
  if (config.url && config.anonKey) {
    const cleanUrl = config.url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    if (!supabaseInstance) {
      supabaseInstance = createClient(cleanUrl, config.anonKey);
    }
    return supabaseInstance;
  }
  return null;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

// ----------------------------------------------------
// UNIFIED DATA SERVICE (SUPABASE WITH LOCALSTORAGE FALLBACK)
// ----------------------------------------------------

export class DataService {
  // Init local storage if empty
  static initLocalStorage() {
    if (!localStorage.getItem(LOCAL_EMP_KEY)) {
      localStorage.setItem(LOCAL_EMP_KEY, JSON.stringify(INITIAL_EMPLOYEES));
    }
    if (!localStorage.getItem(LOCAL_SITES_KEY)) {
      localStorage.setItem(LOCAL_SITES_KEY, JSON.stringify(INITIAL_SITES));
    }
    if (!localStorage.getItem(LOCAL_ATT_KEY)) {
      localStorage.setItem(LOCAL_ATT_KEY, JSON.stringify(generateInitialAttendance()));
    }
  }

  // --- AUTH & USER LOGIN ---
  static async loginUser(username: string, password: string): Promise<{ success: boolean; user?: AppUser; error?: string }> {
    const cleanUser = username.trim();
    const client = getSupabaseClient();

    if (client) {
      try {
        const { data, error } = await client
          .from('users')
          .select('*')
          .eq('username', cleanUser)
          .eq('password', password)
          .maybeSingle();

        if (!error && data) {
          return {
            success: true,
            user: {
              id: data.id,
              username: data.username,
              role: data.role as 'Superadmin' | 'Admin',
            },
          };
        }
      } catch (e) {
        // Fallback to strict predefined user list
      }
    }

    // Pre-configured user accounts strictly required by specification
    const userDb: Record<string, { pass: string; role: 'Superadmin' | 'Admin' }> = {
      'venksuperadmin': { pass: '$uper@dmin$34', role: 'Superadmin' },
      'venkadmin': { pass: '@dmin$321', role: 'Admin' },
    };

    const match = userDb[cleanUser];
    if (match && match.pass === password) {
      return {
        success: true,
        user: {
          username: cleanUser,
          role: match.role,
        },
      };
    }

    return {
      success: false,
      error: 'Access Denied: Invalid username or password. Only registered accounts can log in.',
    };
  }

  // --- EMPLOYEES ---
  static async getEmployees(): Promise<Employee[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('employees').select('*').order('emp_id');
      if (!error && data && data.length > 0) {
        return data as Employee[];
      }
    }

    // Local fallback
    this.initLocalStorage();
    const stored = localStorage.getItem(LOCAL_EMP_KEY);
    return stored ? JSON.parse(stored) : INITIAL_EMPLOYEES;
  }

  static async saveEmployee(employee: Partial<Employee>): Promise<Employee> {
    const client = getSupabaseClient();
    if (client) {
      if (employee.id && !employee.id.startsWith('emp-')) {
        const { data, error } = await client.from('employees').update(employee).eq('id', employee.id).select().single();
        if (!error && data) return data as Employee;
      } else {
        const { id, ...newEmp } = employee;
        const { data, error } = await client.from('employees').insert([newEmp]).select().single();
        if (!error && data) return data as Employee;
      }
    }

    // Local storage fallback
    this.initLocalStorage();
    const employees = await this.getEmployees();
    let updated: Employee;
    if (employee.id) {
      const idx = employees.findIndex(e => e.id === employee.id);
      if (idx >= 0) {
        employees[idx] = { ...employees[idx], ...employee } as Employee;
        updated = employees[idx];
      } else {
        updated = { ...employee, id: `emp-${Date.now()}` } as Employee;
        employees.push(updated);
      }
    } else {
      updated = {
        id: `emp-${Date.now()}`,
        emp_id: employee.emp_id || `E${String(employees.length + 1).padStart(3, '0')}`,
        name: employee.name || 'New Employee',
        designation: employee.designation || 'Worker',
        category: employee.category || 'Worker',
        is_active: true,
      };
      employees.push(updated);
    }

    localStorage.setItem(LOCAL_EMP_KEY, JSON.stringify(employees));
    return updated;
  }

  // --- SITES ---
  static async getSites(): Promise<Site[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('sites').select('*').order('name');
      if (!error && data && data.length > 0) {
        return data as Site[];
      }
    }

    this.initLocalStorage();
    const stored = localStorage.getItem(LOCAL_SITES_KEY);
    return stored ? JSON.parse(stored) : INITIAL_SITES;
  }

  static async saveSite(site: Partial<Site>): Promise<Site> {
    const client = getSupabaseClient();
    if (client) {
      if (site.id && !site.id.startsWith('site-')) {
        const { data, error } = await client.from('sites').update(site).eq('id', site.id).select().single();
        if (!error && data) return data as Site;
      } else {
        const { id, ...newSite } = site;
        const { data, error } = await client.from('sites').insert([newSite]).select().single();
        if (!error && data) return data as Site;
      }
    }

    this.initLocalStorage();
    const sites = await this.getSites();
    let updated: Site;
    if (site.id) {
      const idx = sites.findIndex(s => s.id === site.id);
      if (idx >= 0) {
        sites[idx] = { ...sites[idx], ...site } as Site;
        updated = sites[idx];
      } else {
        updated = { ...site, id: `site-${Date.now()}` } as Site;
        sites.push(updated);
      }
    } else {
      updated = {
        id: `site-${Date.now()}`,
        name: site.name || 'New Site',
        code: site.code || '',
        location: site.location || '',
        is_active: true,
      };
      sites.push(updated);
    }

    localStorage.setItem(LOCAL_SITES_KEY, JSON.stringify(sites));
    return updated;
  }

  static async deleteSite(siteId: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (client && !siteId.startsWith('site-')) {
      const { error } = await client.from('sites').delete().eq('id', siteId);
      if (!error) return true;
    }

    this.initLocalStorage();
    const stored = localStorage.getItem(LOCAL_SITES_KEY);
    const sites: Site[] = stored ? JSON.parse(stored) : INITIAL_SITES;
    const filtered = sites.filter((s) => s.id !== siteId);
    localStorage.setItem(LOCAL_SITES_KEY, JSON.stringify(filtered));
    return true;
  }

  static async deleteEmployee(empId: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (client && !empId.startsWith('emp-')) {
      const { error } = await client.from('employees').delete().eq('id', empId);
      if (!error) return true;
    }

    this.initLocalStorage();
    const stored = localStorage.getItem(LOCAL_EMP_KEY);
    const emps: Employee[] = stored ? JSON.parse(stored) : INITIAL_EMPLOYEES;
    const filtered = emps.filter((e) => e.id !== empId);
    localStorage.setItem(LOCAL_EMP_KEY, JSON.stringify(filtered));
    return true;
  }

  // --- ATTENDANCE ---
  static async getAttendanceForMonth(year: number, month: number): Promise<AttendanceRecord[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // 1. Try Supabase
    let supabaseRecords: AttendanceRecord[] = [];
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('attendance_records')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      if (!error && data && data.length > 0) {
        supabaseRecords = data as AttendanceRecord[];
      }
    }

    // 2. Always read localStorage (it is the always-written-to ground truth)
    this.initLocalStorage();
    const stored = localStorage.getItem(LOCAL_ATT_KEY);
    const allLocal: AttendanceRecord[] = stored ? JSON.parse(stored) : generateInitialAttendance();
    const localRecords = allLocal.filter(r => r.date >= startDate && r.date <= endDate);

    // 3. Merge: start with Supabase, then overlay localStorage records (they are always fresher
    //    because every save writes to localStorage, even when Supabase upsert fails).
    const merged = new Map<string, AttendanceRecord>();
    supabaseRecords.forEach(r => merged.set(`${r.employee_id}_${r.date}`, r));
    localRecords.forEach(r => merged.set(`${r.employee_id}_${r.date}`, r));
    const resultRecords = Array.from(merged.values());

    // 4. Normalize site_ids and site_id on all returned records
    return resultRecords.map((r) => {
      const site_ids = r.site_ids && Array.isArray(r.site_ids) && r.site_ids.length > 0
        ? r.site_ids
        : (r.site_id ? [r.site_id] : []);
      const primary_site_id = site_ids.length > 0 ? site_ids[0] : (r.site_id || null);
      return {
        ...r,
        site_id: primary_site_id,
        site_ids,
      };
    });
  }

  static async saveAttendanceRecord(record: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const client = getSupabaseClient();
    let savedRecord: AttendanceRecord | null = null;

    const site_ids = record.site_ids && Array.isArray(record.site_ids)
      ? record.site_ids
      : (record.site_id ? [record.site_id] : []);
    const primary_site_id = site_ids.length > 0 ? site_ids[0] : (record.site_id || null);

    const recordToSave = {
      ...record,
      site_id: primary_site_id,
      site_ids,
    };

    if (client && recordToSave.employee_id && recordToSave.date) {
      const { data, error } = await client
        .from('attendance_records')
        .upsert([{
          employee_id: recordToSave.employee_id,
          date: recordToSave.date,
          status: recordToSave.status || 'PRESENT',
          site_id: primary_site_id,
          site_ids: site_ids,
          ot_hours: recordToSave.ot_hours || 0,
          late_hours: recordToSave.late_hours || 0,
          late_minutes: recordToSave.late_minutes || 0,
          labour_count: recordToSave.labour_count || 0,
          remarks: recordToSave.remarks || null,
          updated_at: new Date().toISOString(),
        }], { onConflict: 'employee_id,date' })
        .select()
        .single();

      if (!error && data) {
        savedRecord = { ...data, site_ids } as AttendanceRecord;
      }
    }

    // Always update local storage too as single source of truth for fast render!
    this.initLocalStorage();
    const stored = localStorage.getItem(LOCAL_ATT_KEY);
    const records: AttendanceRecord[] = stored ? JSON.parse(stored) : generateInitialAttendance();

    const existingIdx = records.findIndex(
      r => r.employee_id === recordToSave.employee_id && r.date === recordToSave.date
    );

    if (existingIdx >= 0) {
      records[existingIdx] = { ...records[existingIdx], ...recordToSave } as AttendanceRecord;
      if (!savedRecord) savedRecord = records[existingIdx];
    } else {
      const newRec: AttendanceRecord = {
        id: recordToSave.id || `att-${recordToSave.employee_id}-${recordToSave.date}`,
        employee_id: recordToSave.employee_id!,
        date: recordToSave.date!,
        status: recordToSave.status || 'PRESENT',
        site_id: primary_site_id,
        site_ids: site_ids,
        ot_hours: recordToSave.ot_hours || 0,
        late_hours: recordToSave.late_hours || 0,
        late_minutes: recordToSave.late_minutes || 0,
        labour_count: recordToSave.labour_count || 0,
        remarks: recordToSave.remarks,
      };
      records.push(newRec);
      if (!savedRecord) savedRecord = newRec;
    }

    localStorage.setItem(LOCAL_ATT_KEY, JSON.stringify(records));
    return savedRecord;
  }

  static async bulkSaveAttendance(records: Partial<AttendanceRecord>[]): Promise<void> {
    const client = getSupabaseClient();
    if (client && records.length > 0) {
      const payload = records.map((r) => {
        const sIds = r.site_ids && Array.isArray(r.site_ids)
          ? r.site_ids
          : (r.site_id ? [r.site_id] : []);
        return {
          employee_id: r.employee_id,
          date: r.date,
          status: r.status || 'PRESENT',
          site_id: sIds[0] || null,
          site_ids: sIds,
          ot_hours: r.ot_hours || 0,
          late_hours: r.late_hours || 0,
          late_minutes: r.late_minutes || 0,
          labour_count: r.labour_count || 0,
          remarks: r.remarks || null,
          updated_at: new Date().toISOString(),
        };
      });

      const { error } = await client
        .from('attendance_records')
        .upsert(payload, { onConflict: 'employee_id,date' });

      if (error) {
        console.error('Supabase bulk save notice:', error);
      }
    }

    // Always update local storage too!
    this.initLocalStorage();
    const stored = localStorage.getItem(LOCAL_ATT_KEY);
    const existingRecords: AttendanceRecord[] = stored ? JSON.parse(stored) : generateInitialAttendance();

    records.forEach((rec) => {
      const sIds = rec.site_ids && Array.isArray(rec.site_ids)
        ? rec.site_ids
        : (rec.site_id ? [rec.site_id] : []);
      const primary_site_id = sIds[0] || null;

      const normalizedRec = {
        ...rec,
        site_id: primary_site_id,
        site_ids: sIds,
      };

      const idx = existingRecords.findIndex(
        (r) => r.employee_id === rec.employee_id && r.date === rec.date
      );
      if (idx >= 0) {
        existingRecords[idx] = { ...existingRecords[idx], ...normalizedRec } as AttendanceRecord;
      } else {
        existingRecords.push({
          id: `att-${rec.employee_id}-${rec.date}`,
          employee_id: rec.employee_id!,
          date: rec.date!,
          status: rec.status || 'PRESENT',
          site_id: primary_site_id,
          site_ids: sIds,
          ot_hours: rec.ot_hours || 0,
          late_hours: rec.late_hours || 0,
          late_minutes: rec.late_minutes || 0,
          labour_count: rec.labour_count || 0,
          remarks: rec.remarks,
        });
      }
    });

    localStorage.setItem(LOCAL_ATT_KEY, JSON.stringify(existingRecords));
  }

  static async resetToSampleData(): Promise<void> {
    localStorage.setItem(LOCAL_EMP_KEY, JSON.stringify(INITIAL_EMPLOYEES));
    localStorage.setItem(LOCAL_SITES_KEY, JSON.stringify(INITIAL_SITES));
    localStorage.setItem(LOCAL_ATT_KEY, JSON.stringify(generateInitialAttendance()));
  }
}
