import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Employee, Site, AttendanceRecord, SupabaseConfig, AppUser } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_SITES } from '../data/initialData';

const CONFIG_STORAGE_KEY = 've_supabase_config';

function isValidUuid(val: any): boolean {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

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
// EXCLUSIVE ONLINE SUPABASE DATA SERVICE
// ----------------------------------------------------

export class DataService {
  // --- AUTH & USER LOGIN ---
  static async loginUser(username: string, password: string): Promise<{ success: boolean; user?: AppUser; error?: string }> {
    const cleanUser = username.trim();
    const client = getSupabaseClient();

    if (!client) {
      return {
        success: false,
        error: 'Database Error: Supabase client is not configured. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    try {
      let { data, error } = await client
        .from('users')
        .select('*')
        .eq('username', cleanUser)
        .eq('password', password)
        .maybeSingle();

      if (error || !data) {
        const { count } = await client.from('users').select('*', { count: 'exact', head: true });
        if (count === 0 || count === null) {
          await client.from('users').insert([
            { username: 'venksuperadmin', password: '$uper@dmin$34', role: 'Superadmin' },
            { username: 'venkadmin', password: '@dmin$321', role: 'Admin' }
          ]);
          const retried = await client
            .from('users')
            .select('*')
            .eq('username', cleanUser)
            .eq('password', password)
            .maybeSingle();
          if (retried.data) {
            data = retried.data;
            error = null;
          }
        }
      }

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
      console.error('Online DB authentication error:', e);
    }

    return {
      success: false,
      error: 'Access Denied: Invalid username or password. Only registered online database accounts can log in.',
    };
  }

  // --- EMPLOYEES ---
  static async getEmployees(): Promise<Employee[]> {
    const client = getSupabaseClient();
    if (!client) {
      console.error('Supabase client not initialized');
      return [];
    }

    try {
      const { data, error } = await client.from('employees').select('*').order('emp_id');
      if (!error && data) {
        if (data.length > 0) {
          return data as Employee[];
        } else {
          // Auto seed online employees table if empty
          const payload = INITIAL_EMPLOYEES.map(({ id, ...rest }) => rest);
          const { data: inserted, error: insertErr } = await client.from('employees').insert(payload).select();
          if (!insertErr && inserted && inserted.length > 0) {
            return inserted as Employee[];
          }
        }
      } else if (error) {
        console.error('Online DB getEmployees error:', error);
      }
    } catch (err) {
      console.error('Online DB getEmployees exception:', err);
    }

    return [];
  }

  static async saveEmployee(employee: Partial<Employee>): Promise<Employee> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase online database client is not connected.');
    }

    if (employee.id && isValidUuid(employee.id)) {
      const { data, error } = await client.from('employees').update(employee).eq('id', employee.id).select().single();
      if (!error && data) return data as Employee;
      if (error) throw error;
    } else {
      const { id, ...newEmp } = employee;
      const { data, error } = await client.from('employees').insert([newEmp]).select().single();
      if (!error && data) return data as Employee;
      if (error) throw error;
    }

    throw new Error('Failed to save employee to online database');
  }

  static async deleteEmployee(empId: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    if (isValidUuid(empId)) {
      const { error } = await client.from('employees').delete().eq('id', empId);
      if (!error) return true;
      if (error) console.error('Online DB deleteEmployee error:', error);
    }
    return false;
  }

  // --- SITES ---
  static async getSites(): Promise<Site[]> {
    const client = getSupabaseClient();
    if (!client) {
      console.error('Supabase client not initialized');
      return [];
    }

    try {
      const { data, error } = await client.from('sites').select('*').order('name');
      if (!error && data) {
        if (data.length > 0) {
          return data as Site[];
        } else {
          const payload = INITIAL_SITES.map(({ id, ...rest }) => rest);
          const { data: inserted, error: insertErr } = await client.from('sites').insert(payload).select();
          if (!insertErr && inserted && inserted.length > 0) {
            return inserted as Site[];
          }
        }
      } else if (error) {
        console.error('Online DB getSites error:', error);
      }
    } catch (err) {
      console.error('Online DB getSites exception:', err);
    }

    return [];
  }

  static async saveSite(site: Partial<Site>): Promise<Site> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase online database client is not connected.');
    }

    if (site.id && isValidUuid(site.id)) {
      const { data, error } = await client.from('sites').update(site).eq('id', site.id).select().single();
      if (!error && data) return data as Site;
      if (error) throw error;
    } else {
      const { id, ...newSite } = site;
      const { data, error } = await client.from('sites').insert([newSite]).select().single();
      if (!error && data) return data as Site;
      if (error) throw error;
    }

    throw new Error('Failed to save site to online database');
  }

  static async deleteSite(siteId: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    if (isValidUuid(siteId)) {
      const { error } = await client.from('sites').delete().eq('id', siteId);
      if (!error) return true;
      if (error) console.error('Online DB deleteSite error:', error);
    }
    return false;
  }

  // --- ATTENDANCE ---
  static async getAttendanceForMonth(year: number, month: number): Promise<AttendanceRecord[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const client = getSupabaseClient();
    if (!client) return [];

    try {
      const { data, error } = await client
        .from('attendance_records')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (!error && data) {
        return (data as AttendanceRecord[]).map((r) => {
          const site_ids = r.site_ids && Array.isArray(r.site_ids) && r.site_ids.length > 0
            ? r.site_ids
            : (r.site_id ? [r.site_id] : []);
          return {
            ...r,
            site_id: site_ids[0] || r.site_id || null,
            site_ids,
            ot_hours: Number(r.ot_hours) || 0,
            late_hours: Number(r.late_hours) || 0,
            late_minutes: Number(r.late_minutes) || 0,
            labour_count: Number(r.labour_count) || 0,
          };
        });
      } else if (error) {
        console.error('Online DB getAttendanceForMonth error:', error);
      }
    } catch (err) {
      console.error('Online DB getAttendanceForMonth error:', err);
    }

    return [];
  }

  private static async resolveRecordUuids(record: Partial<AttendanceRecord>): Promise<{
    employee_id: string | null;
    site_id: string | null;
    site_ids: string[];
  }> {
    const employees = await this.getEmployees();
    const sites = await this.getSites();

    let empUuid: string | null = null;
    if (record.employee_id) {
      if (isValidUuid(record.employee_id)) {
        empUuid = record.employee_id;
      } else {
        const empMatch = employees.find(
          (e) => e.id === record.employee_id || e.emp_id === record.employee_id
        );
        if (empMatch && isValidUuid(empMatch.id)) {
          empUuid = empMatch.id;
        }
      }
    }

    const rawSiteIds = record.site_ids && Array.isArray(record.site_ids)
      ? record.site_ids
      : (record.site_id ? [record.site_id] : []);

    const resolvedSiteIds: string[] = [];
    rawSiteIds.forEach((sId) => {
      if (isValidUuid(sId)) {
        resolvedSiteIds.push(sId);
      } else {
        const siteMatch = sites.find((s) => s.id === sId || s.code === sId || s.name === sId);
        if (siteMatch && isValidUuid(siteMatch.id)) {
          resolvedSiteIds.push(siteMatch.id);
        }
      }
    });

    const primarySiteUuid = resolvedSiteIds.length > 0 ? resolvedSiteIds[0] : null;

    return {
      employee_id: empUuid,
      site_id: primarySiteUuid,
      site_ids: resolvedSiteIds,
    };
  }

  static async saveAttendanceRecord(record: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase online database client is not connected.');
    }

    const { employee_id: resolvedEmpId, site_id: primarySiteUuid, site_ids: resolvedSiteIds } =
      await this.resolveRecordUuids(record);

    const recordToSave = {
      ...record,
      employee_id: resolvedEmpId || record.employee_id,
      site_id: primarySiteUuid,
      site_ids: resolvedSiteIds,
      ot_hours: Number(record.ot_hours) || 0,
      late_hours: Number(record.late_hours) || 0,
      late_minutes: Number(record.late_minutes) || 0,
      labour_count: Number(record.labour_count) || 0,
      remarks: record.remarks || null,
    };

    if (recordToSave.employee_id && isValidUuid(recordToSave.employee_id) && recordToSave.date) {
      const { data, error } = await client
        .from('attendance_records')
        .upsert([{
          employee_id: recordToSave.employee_id,
          date: recordToSave.date,
          status: recordToSave.status || 'PRESENT',
          site_id: recordToSave.site_id,
          site_ids: recordToSave.site_ids,
          ot_hours: recordToSave.ot_hours,
          late_hours: recordToSave.late_hours,
          late_minutes: recordToSave.late_minutes,
          labour_count: recordToSave.labour_count,
          remarks: recordToSave.remarks,
          updated_at: new Date().toISOString(),
        }], { onConflict: 'employee_id,date' })
        .select()
        .single();

      if (!error && data) {
        return {
          ...data,
          site_ids: resolvedSiteIds,
          ot_hours: Number(data.ot_hours) || 0,
          late_hours: Number(data.late_hours) || 0,
          late_minutes: Number(data.late_minutes) || 0,
          labour_count: Number(data.labour_count) || 0,
        } as AttendanceRecord;
      }

      if (error) {
        console.error('Online DB saveAttendanceRecord error:', error);
        throw error;
      }
    }

    throw new Error('Invalid employee UUID or missing date for online database attendance save');
  }

  static async bulkSaveAttendance(records: Partial<AttendanceRecord>[]): Promise<void> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase online database client is not connected.');
    }

    if (records.length > 0) {
      const employees = await this.getEmployees();
      const sites = await this.getSites();

      const payload = records.map((r) => {
        let empUuid: string | null = null;
        if (r.employee_id) {
          if (isValidUuid(r.employee_id)) {
            empUuid = r.employee_id;
          } else {
            const empMatch = employees.find(e => e.id === r.employee_id || e.emp_id === r.employee_id);
            if (empMatch && isValidUuid(empMatch.id)) empUuid = empMatch.id;
          }
        }

        const rawSiteIds = r.site_ids && Array.isArray(r.site_ids)
          ? r.site_ids
          : (r.site_id ? [r.site_id] : []);

        const resolvedSiteIds: string[] = [];
        rawSiteIds.forEach((sId) => {
          if (isValidUuid(sId)) {
            resolvedSiteIds.push(sId);
          } else {
            const siteMatch = sites.find(s => s.id === sId || s.code === sId || s.name === sId);
            if (siteMatch && isValidUuid(siteMatch.id)) resolvedSiteIds.push(siteMatch.id);
          }
        });

        return {
          employee_id: empUuid || r.employee_id,
          date: r.date,
          status: r.status || 'PRESENT',
          site_id: resolvedSiteIds.length > 0 ? resolvedSiteIds[0] : null,
          site_ids: resolvedSiteIds,
          ot_hours: Number(r.ot_hours) || 0,
          late_hours: Number(r.late_hours) || 0,
          late_minutes: Number(r.late_minutes) || 0,
          labour_count: Number(r.labour_count) || 0,
          remarks: r.remarks || null,
          updated_at: new Date().toISOString(),
        };
      }).filter(r => isValidUuid(r.employee_id) && r.date);

      if (payload.length > 0) {
        const { error } = await client
          .from('attendance_records')
          .upsert(payload, { onConflict: 'employee_id,date' });

        if (error) {
          console.error('Online DB bulkSaveAttendance error:', error);
          throw error;
        }
      }
    }
  }

  static async resetToSampleData(): Promise<void> {
    const client = getSupabaseClient();
    if (client) {
      const sitePayload = INITIAL_SITES.map(({ id, ...rest }) => rest);
      const empPayload = INITIAL_EMPLOYEES.map(({ id, ...rest }) => rest);

      await client.from('sites').upsert(sitePayload, { onConflict: 'name' });
      await client.from('employees').upsert(empPayload, { onConflict: 'emp_id' });
    }
  }
}
