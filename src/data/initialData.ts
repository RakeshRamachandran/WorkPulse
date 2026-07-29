import type { Employee, Site, AttendanceRecord, AppUser } from '../types';

export const INITIAL_USERS: AppUser[] = [
  { username: 'venksuperadmin', role: 'Superadmin' },
  { username: 'venkadmin', role: 'Admin' },
];

export const INITIAL_SITES: Site[] = [
  { id: 'site-1', name: 'SFS Amber-Cordial Paradise', code: 'SFS-CP', location: 'Trivandrum', is_active: true },
  { id: 'site-2', name: 'Artech Livespace- Vinvish Cblock', code: 'ART-VC', location: 'Trivandrum', is_active: true },
  { id: 'site-3', name: 'Sree Dhanya Laposhe Cosmo Hospital', code: 'SD-CH', location: 'Trivandrum', is_active: true },
  { id: 'site-4', name: 'Cordon Emerald', code: 'CE', location: 'Trivandrum', is_active: true },
  { id: 'site-5', name: 'Dragon Stone', code: 'DS', location: 'Trivandrum', is_active: true },
  { id: 'site-6', name: 'PRS Hospital karamana', code: 'PRS', location: 'Karamana', is_active: true },
  { id: 'site-7', name: 'Cochin International School', code: 'CIS', location: 'Kochi', is_active: true },
  { id: 'site-8', name: 'Icloud SIS - Powerlink', code: 'ISIS', location: 'Trivandrum', is_active: true },
  { id: 'site-9', name: 'TRINS-Korani', code: 'TRINS', location: 'Korani', is_active: true },
  { id: 'site-10', name: 'Leela Madhavam', code: 'LM', location: 'Trivandrum', is_active: true },
  { id: 'site-11', name: 'Amara Resort', code: 'AR', location: 'Kovalam', is_active: true },
  { id: 'site-12', name: 'Silver Castle Winter leaf', code: 'SCWL', location: 'Trivandrum', is_active: true },
  { id: 'site-13', name: 'Simz Plaza', code: 'SP', location: 'Trivandrum', is_active: true },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp-1', emp_id: 'E001', name: 'NIRMAL KUMAR', designation: 'Site Engineer', category: 'Engineer', is_active: true },
  { id: 'emp-2', emp_id: 'E002', name: 'MOHANDAS C', designation: 'Site Engineer', category: 'Engineer', is_active: true },
  { id: 'emp-3', emp_id: 'E003', name: 'AJEESH KUMAR', designation: 'Site Engineer', category: 'Engineer', is_active: true },
  { id: 'emp-4', emp_id: 'E004', name: 'RENJESH', designation: 'Site Engineer', category: 'Engineer', is_active: true },
  { id: 'emp-5', emp_id: 'E005', name: 'SABITH', designation: 'Site Engineer', category: 'Engineer', is_active: true },
  { id: 'emp-6', emp_id: 'E006', name: 'VINAYAK', designation: 'Site Engineer', category: 'Engineer', is_active: true },
  { id: 'emp-7', emp_id: 'E007', name: 'BABU', designation: 'Site Engineer', category: 'Engineer', is_active: true },
  { id: 'emp-8', emp_id: 'E008', name: 'JAYARAM', designation: 'Site Engineer', category: 'Engineer', is_active: true },
  { id: 'emp-9', emp_id: 'E009', name: 'SREEJIN S', designation: 'Site Engineer', category: 'Engineer', is_active: true },
  { id: 'emp-10', emp_id: 'E010', name: 'VIMAL', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-11', emp_id: 'E011', name: 'RENJITH R K', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-12', emp_id: 'E012', name: 'PRADEEP A D', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-13', emp_id: 'E013', name: 'PRAVEEN P', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-14', emp_id: 'E014', name: 'SIBIN', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-15', emp_id: 'E015', name: 'ARUN M L', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-16', emp_id: 'E016', name: 'PRADEEP B S', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-17', emp_id: 'E017', name: 'RATHEESH S', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-18', emp_id: 'E018', name: 'ANOOP A R', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-19', emp_id: 'E019', name: 'SREEKUMAR', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-20', emp_id: 'E020', name: 'PRADEEP KUMAR M', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-21', emp_id: 'E021', name: 'CHANDRABABU', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-22', emp_id: 'E022', name: 'JITHIN', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-23', emp_id: 'E023', name: 'KIRAN', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-24', emp_id: 'E024', name: 'ROBINSON', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-25', emp_id: 'E025', name: 'VISHNU R', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-26', emp_id: 'E026', name: 'SIVAPRASAD', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-27', emp_id: 'E027', name: 'NITHIN S G', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-28', emp_id: 'E028', name: 'DILEEP', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-29', emp_id: 'E029', name: 'CRISPIN VINCENT', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-30', emp_id: 'E030', name: 'SUSEEL', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-31', emp_id: 'E031', name: 'DAWN', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-32', emp_id: 'E032', name: 'SHIBIN', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-33', emp_id: 'E033', name: 'ANURAJ', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-34', emp_id: 'E034', name: 'ABHIJITH', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-35', emp_id: 'E035', name: 'JAYASHANKAR', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-36', emp_id: 'E036', name: 'NANDAKUMAR', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-37', emp_id: 'E037', name: 'ROYMON', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-38', emp_id: 'E038', name: 'SOORAJ', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-39', emp_id: 'E039', name: 'NAVIN', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-40', emp_id: 'E040', name: 'PRABIN MOSES', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-41', emp_id: 'E041', name: 'PRINCE', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-42', emp_id: 'E042', name: 'RAJESH R', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-43', emp_id: 'E043', name: 'SUJITH S', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-44', emp_id: 'E044', name: 'VISHNU J', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-45', emp_id: 'E045', name: 'VINOD P', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-46', emp_id: 'E046', name: 'AKSHAY', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-47', emp_id: 'E047', name: 'PRAVEEN KUMAR G', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-48', emp_id: 'E048', name: 'AKHIL', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-49', emp_id: 'E049', name: 'ARUN LAL', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-50', emp_id: 'E050', name: 'ALAN', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-51', emp_id: 'E051', name: 'ATHUL', designation: 'Worker', category: 'Worker', is_active: true },
  { id: 'emp-52', emp_id: 'E052', name: 'SUB-NISHANTH', designation: 'Subcontractor', category: 'Worker', is_active: true },
  { id: 'emp-53', emp_id: 'E053', name: 'SUB-ANILKUMAR', designation: 'Subcontractor', category: 'Worker', is_active: true },
  { id: 'emp-54', emp_id: 'E054', name: 'SUB-ANOOP B', designation: 'Subcontractor', category: 'Worker', is_active: true },
  { id: 'emp-55', emp_id: 'E055', name: 'SUB- BHUVANACHANDRAN', designation: 'Subcontractor', category: 'Worker', is_active: true },
];

export function generateInitialAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const year = 2026;
  const month = 7;
  const daysInJuly = 31;

  INITIAL_EMPLOYEES.forEach((emp, empIdx) => {
    for (let day = 1; day <= daysInJuly; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(year, month - 1, day);
      const isSunday = dateObj.getDay() === 0;

      let status: 'PRESENT' | 'LEAVE' | 'HOLIDAY' = 'PRESENT';
      if (isSunday) {
        status = 'HOLIDAY';
      } else if ((empIdx + day) % 11 === 0) {
        status = 'LEAVE';
      }

      const site1 = INITIAL_SITES[empIdx % INITIAL_SITES.length];
      const site2 = INITIAL_SITES[(empIdx + 2) % INITIAL_SITES.length];
      const multiSite = day % 5 === 0;
      const siteIds = status === 'PRESENT' ? (multiSite ? [site1.id, site2.id] : [site1.id]) : [];

      const otHours = status === 'PRESENT' && (day % 3 === 0) ? 2.5 : 0;
      const isSubcontractor = emp.designation === 'Subcontractor' || emp.name.startsWith('SUB-');
      const labourCount = isSubcontractor && status === 'PRESENT' ? 4 + (day % 3) : 0;

      records.push({
        id: `att-${emp.id}-${dateStr}`,
        employee_id: emp.id,
        date: dateStr,
        status,
        site_id: siteIds[0] || null,
        site_ids: siteIds,
        ot_hours: otHours,
        late_hours: 0,
        late_minutes: 0,
        labour_count: labourCount,
        remarks: status === 'HOLIDAY' ? 'Sunday Weekly Off' : undefined,
      });
    }
  });

  return records;
}
