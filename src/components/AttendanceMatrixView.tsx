import React, { useState } from 'react';
import type { Employee, Site, AttendanceRecord } from '../types';
import { getRecordSiteIds, isSubcontractor } from '../types';
import { Search, Filter, Calendar, Info } from 'lucide-react';

interface AttendanceMatrixViewProps {
  selectedYear: number;
  selectedMonth: number;
  employees: Employee[];
  sites: Site[];
  attendanceRecords: AttendanceRecord[];
}

export const AttendanceMatrixView: React.FC<AttendanceMatrixViewProps> = ({
  selectedYear,
  selectedMonth,
  employees,
  sites,
  attendanceRecords,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const siteMap = new Map<string, Site>();
  sites.forEach((s) => siteMap.set(s.id, s));

  // Build employee lookup helper map
  const empMap = new Map<string, Employee>();
  employees.forEach((e) => {
    if (e.id) empMap.set(e.id, e);
    if (e.emp_id) empMap.set(e.emp_id, e);
    if (e.name) empMap.set(e.name.trim().toLowerCase(), e);
  });

  // Build record lookup map: `${empId}_${day}` -> AttendanceRecord
  const recordLookup = new Map<string, AttendanceRecord>();
  attendanceRecords.forEach((r) => {
    if (!r || !r.date) return;
    const dateStr = r.date.substring(0, 10);
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const recYear = parseInt(parts[0], 10);
      const recMonth = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);

      if (recYear === selectedYear && recMonth === selectedMonth && !isNaN(day)) {
        recordLookup.set(`${r.employee_id}_${day}`, r);
        const emp = empMap.get(r.employee_id);
        if (emp) {
          recordLookup.set(`${emp.id}_${day}`, r);
          recordLookup.set(`${emp.emp_id}_${day}`, r);
        }
      }
    }
  });

  const activeEmployees = employees.filter((emp) => emp.is_active !== false);

  const filteredEmployees = activeEmployees
    .filter((emp) => !isSubcontractor(emp))
    .filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.emp_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || emp.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-[24px]">
      {/* Header and Filter Controls (Card Specs: 14px radius, 20px padding) */}
      <div className="bg-white border border-[#E5E7EB] p-[20px] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#E8F7EE] text-[#16A34A] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[22px] font-semibold text-[#111827]">Daily Attendance Matrix</h2>
            <p className="text-[14px] text-[#6B7280]">
              Full Month Grid Overview - {monthName} (P / HD / L / H & Site Breakdown)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Input (Height 40px, Radius 10px) */}
          <div className="relative min-w-[220px]">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[40px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] pl-10 pr-3 text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:bg-white transition-all"
            />
          </div>

          {/* Category Filter (Height 40px, Radius 10px) */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-[#6B7280]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-[40px] bg-[#F8FAFC] text-[14px] font-medium text-[#111827] px-3.5 rounded-[10px] border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#16A34A] cursor-pointer"
            >
              <option value="ALL">All Staff</option>
              <option value="Engineer">Engineers</option>
              <option value="Worker">Workers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legend Bar (Card Specs: 14px radius, 20px padding) */}
      <div className="flex items-center space-x-6 text-[14px] text-[#111827] bg-white p-[20px] rounded-[14px] border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-x-auto">
        <span className="font-semibold text-[#6B7280] flex items-center gap-1.5 shrink-0">
          <Info className="w-4 h-4 text-[#16A34A]" /> Key Legend:
        </span>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="w-6 h-6 rounded-full bg-[#16A34A] text-white border border-[#16A34A] font-bold flex items-center justify-center text-[11px]">
            P
          </span>
          <span className="font-medium text-[#111827]">Present (Full Day)</span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="w-6 h-6 rounded-full bg-[#F59E0B] text-white border border-[#F59E0B] font-bold flex items-center justify-center text-[11px]">
            HD
          </span>
          <span className="font-medium text-[#111827]">Half Day</span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="w-6 h-6 rounded-full bg-[#EF4444] text-white border border-[#EF4444] font-bold flex items-center justify-center text-[11px]">
            L
          </span>
          <span className="font-medium text-[#111827]">Leave</span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="w-6 h-6 rounded-full bg-purple-600 text-white border border-purple-600 font-bold flex items-center justify-center text-[11px]">
            H
          </span>
          <span className="font-medium text-[#111827]">Holiday</span>
        </div>
      </div>

      {/* Matrix Table Container (Radius 12px, Sticky Header #FAFAFA, Row Height 52px) */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto max-h-[72vh]">
          <table className="w-full text-left text-[14px] border-collapse">
            <thead className="bg-[#FAFAFA] text-[#6B7280] sticky top-0 z-30 shadow-xs border-b border-[#E5E7EB] h-[48px]">
              <tr>
                <th className="p-3 border-r border-[#E5E7EB] w-12 min-w-[48px] max-w-[48px] sticky left-0 bg-[#FAFAFA] z-40 font-semibold text-center text-[13px] uppercase">
                  #
                </th>
                <th className="p-3 border-r-2 border-[#E5E7EB] w-52 min-w-[208px] max-w-[208px] sticky left-[48px] bg-[#FAFAFA] z-40 font-semibold text-[13px] uppercase tracking-wider">
                  Employee Name
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                  <th
                    key={d}
                    className="p-2 border-r border-[#E5E7EB] text-center min-w-[44px] font-semibold text-[#111827] bg-[#FAFAFA] text-[13px]"
                  >
                    {String(d).padStart(2, '0')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredEmployees.map((emp, idx) => (
                <tr key={emp.id} className="h-[52px] hover:bg-[#F9FBFA] transition-colors duration-150">
                  <td className="p-2.5 border-r border-[#E5E7EB] text-center font-mono font-medium text-[#6B7280] sticky left-0 bg-white z-20 w-12 min-w-[48px] max-w-[48px]">
                    {idx + 1}
                  </td>

                  <td className="p-2.5 border-r-2 border-[#E5E7EB] font-semibold text-[#111827] sticky left-[48px] bg-white z-20 w-52 min-w-[208px] max-w-[208px] truncate">
                    <div className="flex flex-col">
                      <span className="truncate text-[#111827] font-semibold">{emp.name}</span>
                      <span className="text-[12px] text-[#16A34A] font-medium">
                        {emp.emp_id}
                      </span>
                    </div>
                  </td>

                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const rec =
                      recordLookup.get(`${emp.id}_${day}`) ||
                      recordLookup.get(`${emp.emp_id}_${day}`);

                    const dObj = new Date(selectedYear, selectedMonth - 1, day);
                    const isSunday = dObj.getDay() === 0;

                    const rawStatus = rec?.status;
                    const status = (rawStatus && rawStatus.trim() !== '') ? rawStatus : (isSunday ? 'HOLIDAY' : undefined);
                    const siteIds = getRecordSiteIds(rec);
                    const assignedSites = siteIds.map((id) => siteMap.get(id)).filter(Boolean) as Site[];
                    const siteNamesStr = assignedSites.length > 0
                      ? assignedSites.map((s) => `${s.name} (${s.code || ''})`).join(', ')
                      : 'N/A';
                    const ot = rec?.ot_hours || 0;

                    let bgClass = 'bg-[#F8FAFC] text-[#6B7280] border border-[#E5E7EB]';
                    let letter = '-';

                    if (status === 'PRESENT') {
                      bgClass = 'bg-[#16A34A] text-white border-[#16A34A] font-bold shadow-xs';
                      letter = 'P';
                    } else if (status === 'HALF_DAY') {
                      bgClass = 'bg-[#F59E0B] text-white border-[#F59E0B] font-bold shadow-xs';
                      letter = 'HD';
                    } else if (status === 'LEAVE') {
                      bgClass = 'bg-[#EF4444] text-white border-[#EF4444] font-bold shadow-xs';
                      letter = 'L';
                    } else if (status === 'HOLIDAY') {
                      bgClass = 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs';
                      letter = 'H';
                    }

                    const tooltipText = rec
                      ? `Day ${day}: ${status}\nSite(s): ${siteNamesStr}${ot > 0 ? `\nOT: ${ot} hrs` : ''
                      }`
                      : `Day ${day}: Not Logged`;

                    return (
                      <td key={day} className="p-1 border-r border-[#E5E7EB] text-center" title={tooltipText}>
                        <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-[11px] ${bgClass}`}>
                          {letter}
                        </div>
                        {assignedSites.length > 1 && (
                          <div className="text-[9px] font-bold text-[#16A34A] leading-none mt-0.5" title={siteNamesStr}>
                            {assignedSites.length} sites
                          </div>
                        )}
                        {ot > 0 && (
                          <div className="text-[10px] font-bold text-[#F59E0B] mt-0.5">+ {ot}h</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
