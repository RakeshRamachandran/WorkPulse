import React, { useState } from 'react';
import type { Employee, Site, AttendanceRecord, MonthlyEmployeeSummary } from '../types';
import { getRecordSiteIds, isSubcontractor } from '../types';
import {
  Users,
  Briefcase,
  Clock,
  TrendingUp,
  Zap,
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface DashboardViewProps {
  selectedYear: number;
  selectedMonth: number;
  employees: Employee[];
  sites: Site[];
  attendanceRecords: AttendanceRecord[];
  onNavigateToDaily: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedYear,
  selectedMonth,
  employees,
  sites,
  attendanceRecords,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const siteMap = new Map<string, Site>();
  sites.forEach((s) => siteMap.set(s.id, s));

  // Compute monthly employee summaries (direct employees only)
  const summaries: MonthlyEmployeeSummary[] = employees
    .filter((emp) => !isSubcontractor(emp))
    .map((emp) => {
    const empRecords = attendanceRecords.filter((r) => r.employee_id === emp.id);

    let workingDays = 0;
    let leaveDays = 0;
    let holidayCount = 0;
    let otHours = 0;
    let totalLateMinutes = 0;
    const siteDays: Record<string, number> = {};

    empRecords.forEach((r) => {
      if (r.status === 'PRESENT') {
        workingDays += 1;
      } else if (r.status === 'HALF_DAY') {
        workingDays += 0.5;
        leaveDays += 0.5;
      } else if (r.status === 'ABSENT') {
        leaveDays += 1;
      } else if (r.status === 'HOLIDAY') {
        holidayCount += 1;
      }

      otHours += Number(r.ot_hours) || 0;
      totalLateMinutes += Number(r.late_minutes) || 0;

      if (r.status === 'PRESENT' || r.status === 'HALF_DAY') {
        const sIds = getRecordSiteIds(r);
        sIds.forEach((sId) => {
          siteDays[sId] = (siteDays[sId] || 0) + 1;
        });
      }
    });

    const regularHours = workingDays * 8;
    const totalHours = regularHours + otHours;

    const lateHrs = Math.floor(totalLateMinutes / 60);
    const lateMins = totalLateMinutes % 60;
    const lateFormatted =
      totalLateMinutes > 0
        ? `${lateHrs > 0 ? `${lateHrs}h ` : ''}${lateMins}m`
        : '-';

    return {
      employee: emp,
      workingDays,
      leaveDays,
      holidayCount,
      regularHours,
      otHours,
      totalHours,
      totalLateMinutes,
      lateFormatted,
      siteDays,
    };
  });

  // Filtered summaries (sorted alphabetically by employee name)
  const filteredSummaries = summaries
    .filter((s) => {
      const matchesSearch =
        s.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.employee.emp_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || s.employee.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.employee.name.localeCompare(b.employee.name));

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthShortName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
  });

  // Calculate holiday days in the month (Sundays + saved HOLIDAY records)
  const holidayDaysSet = new Set<number>();
  for (let d = 1; d <= daysInMonth; d++) {
    const dObj = new Date(selectedYear, selectedMonth - 1, d);
    if (dObj.getDay() === 0) holidayDaysSet.add(d);
  }
  attendanceRecords.forEach((r) => {
    if (r.status === 'HOLIDAY' && r.date) {
      const parts = r.date.substring(0, 10).split('-');
      if (parts.length === 3 && parseInt(parts[0], 10) === selectedYear && parseInt(parts[1], 10) === selectedMonth) {
        const dayNum = parseInt(parts[2], 10);
        if (!isNaN(dayNum)) holidayDaysSet.add(dayNum);
      }
    }
  });

  const totalHolidaysInMonth = holidayDaysSet.size;
  const netWorkingDays = daysInMonth - totalHolidaysInMonth;

  // Aggregated totals for overview
  const totalEmployees = filteredSummaries.length;
  const totalWorkingDaysAll = filteredSummaries.reduce((acc, s) => acc + s.workingDays, 0);
  const totalLeaveDaysAll = filteredSummaries.reduce((acc, s) => acc + s.leaveDays, 0);
  const totalRegularHoursAll = filteredSummaries.reduce((acc, s) => acc + s.regularHours, 0);
  const totalOTHoursAll = filteredSummaries.reduce((acc, s) => acc + s.otHours, 0);
  const totalHoursAll = filteredSummaries.reduce((acc, s) => acc + s.totalHours, 0);
  const totalLateMinsAll = filteredSummaries.reduce((acc, s) => acc + s.totalLateMinutes, 0);
  const totalLateHoursAll = (totalLateMinsAll / 60).toFixed(1);

  // Helper to load logo image for PDF
  const loadLogoImage = (): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = '/logo.png';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  };

  // PDF Export
  const handleExportPDF = async () => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const logoImg = await loadLogoImage();

    // Top Header Banner
    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, 210, 32, 'F');

    // Add Logo Card if loaded
    if (logoImg) {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(10, 5, 48, 22, 2, 2, 'F');
      doc.addImage(logoImg, 'PNG', 12, 7, 44, 18);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Venkateswara Electricals', logoImg ? 64 : 14, 14);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Monthly Attendance Report - ${monthName}`, logoImg ? 64 : 14, 22);

    doc.setFontSize(8.5);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 155, 22);

    const tableData = filteredSummaries.map((s) => [
      s.employee.emp_id,
      s.employee.name,
      s.workingDays.toString(),
      s.leaveDays.toString(),
      s.regularHours.toString(),
      s.otHours.toString(),
      s.totalHours.toString(),
      s.lateFormatted,
    ]);

    tableData.push([
      'TOTAL',
      `${totalEmployees} Employees`,
      totalWorkingDaysAll.toString(),
      totalLeaveDaysAll.toString(),
      totalRegularHoursAll.toString(),
      totalOTHoursAll.toString(),
      totalHoursAll.toString(),
      `${Math.floor(totalLateMinsAll / 60)}h ${totalLateMinsAll % 60}m`,
    ]);

    autoTable(doc, {
      startY: 36,
      head: [
        ['Emp ID', 'Employee Name', 'Work Days', 'Leave Days', 'Regular Hours', 'OT Hours', 'Total Hours', 'Late Time'],
      ],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center', fontStyle: 'bold' },
        7: { halign: 'center' },
      },
    });

    doc.save(`Venkateswara_Attendance_${selectedMonth}_${selectedYear}.pdf`);
  };

  // Excel Export
  const handleExportExcel = () => {
    const excelRows = filteredSummaries.map((s) => ({
      'Employee ID': s.employee.emp_id,
      'Employee Name': s.employee.name,
      'Designation': s.employee.designation,
      'Category': s.employee.category,
      'Working Days': s.workingDays,
      'Leave Days': s.leaveDays,
      'Regular Hours': s.regularHours,
      'OT Hours': s.otHours,
      'Total Work Hours': s.totalHours,
      'Late Time': s.lateFormatted,
    }));

    excelRows.push({
      'Employee ID': 'TOTAL',
      'Employee Name': `${totalEmployees} Employees`,
      'Designation': '',
      'Category': '',
      'Working Days': totalWorkingDaysAll,
      'Leave Days': totalLeaveDaysAll,
      'Regular Hours': totalRegularHoursAll,
      'OT Hours': totalOTHoursAll,
      'Total Work Hours': totalHoursAll,
      'Late Time': `${Math.floor(totalLateMinsAll / 60)}h ${totalLateMinsAll % 60}m`,
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Attendance');

    XLSX.writeFile(workbook, `Venkateswara_Attendance_${selectedMonth}_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Modern KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {/* Card 1: Staff */}
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Staff</span>
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#16a34a] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 shrink-0" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3 leading-none">{totalEmployees}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Active Roster</p>
        </div>

        {/* Card 2: Working Days */}
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Working Days</span>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 shrink-0" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-blue-600 mt-3 leading-none">{netWorkingDays}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">{daysInMonth} Total Days ({totalHolidaysInMonth} Holidays)</p>
        </div>

        {/* Card 3: Leave Days */}
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Leave Days</span>
            <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-rose-600 mt-3 leading-none">{totalLeaveDaysAll}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Leaves Taken</p>
        </div>

        {/* Card 4: Regular Hours */}
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Regular Hours</span>
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#16a34a] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 shrink-0" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#16a34a] mt-3 leading-none">{totalRegularHoursAll}h</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Standard 8h Rate</p>
        </div>

        {/* Card 5: Overtime Hours */}
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overtime (OT)</span>
            <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 shrink-0" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-600 mt-3 leading-none">{totalOTHoursAll}h</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Extra Site Hours</p>
        </div>

        {/* Card 6: Late Hours */}
        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Late Hours</span>
            <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 shrink-0" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-purple-600 mt-3 leading-none">{totalLateHoursAll}h</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Arrival Delays</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
        {/* Toolbar Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Monthly Attendance Summary</h2>
            <p className="text-xs text-slate-500 font-normal mt-0.5">Overview & Payroll Report for {monthName}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input with non-overlapping pl-10 */}
            <div className="relative flex items-center min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or Emp ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:bg-white transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-1.5">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Engineer">Engineers</option>
                <option value="Worker">Workers</option>
              </select>
            </div>

            {/* Export Buttons with explicit flex-row space-x-2 and shrink-0 icons */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <button
                onClick={handleExportExcel}
                className="bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer shrink-0 active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Export Excel</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer shrink-0 active:scale-95"
              >
                <FileText className="w-4 h-4 text-[#16a34a] shrink-0" />
                <span className="whitespace-nowrap">Export PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Clean Table Container */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200 h-12">
                  <th className="py-3 px-5 w-28">Emp ID</th>
                  <th className="py-3 px-5 min-w-[200px]">Employee Name</th>
                  <th className="py-3 px-5 min-w-[150px]">Designation</th>
                  <th className="py-3 px-5 text-center">Work Days</th>
                  <th className="py-3 px-5 text-center">Leave Days</th>
                  <th className="py-3 px-5 text-center">Reg Hours</th>
                  <th className="py-3 px-5 text-center">OT Hours</th>
                  <th className="py-3 px-5 text-center">Total Hours</th>
                  <th className="py-3 px-5 text-center">Late Hours</th>
                  <th className="py-3 px-5">Assigned Sites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredSummaries.map((sum) => (
                  <tr key={sum.employee.id} className="h-13 hover:bg-slate-50/70 transition-colors">
                    {/* Emp ID Pill Badge */}
                    <td className="py-3 px-5">
                      <span className="bg-emerald-50 text-[#16a34a] px-2.5 py-1 rounded-full text-xs font-bold inline-block border border-emerald-200/60">
                        {sum.employee.emp_id}
                      </span>
                    </td>

                    {/* Employee Name */}
                    <td className="py-3 px-5 font-bold text-slate-900 text-sm">
                      {sum.employee.name}
                    </td>

                    {/* Designation */}
                    <td className="py-3 px-5 text-xs text-slate-500 font-semibold">
                      {sum.employee.designation}
                    </td>

                    {/* Working Days */}
                    <td className="py-3 px-5 text-center font-bold text-slate-900">
                      {sum.workingDays}
                    </td>

                    {/* Leave Days */}
                    <td className="py-3 px-5 text-center">
                      {sum.leaveDays > 0 ? (
                        <span className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full text-xs inline-block border border-rose-200">
                          {sum.leaveDays}d
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Regular Hours (Green text) */}
                    <td className="py-3 px-5 text-center font-bold text-[#16a34a]">
                      {sum.regularHours}h
                    </td>

                    {/* OT Hours (Orange text) */}
                    <td className="py-3 px-5 text-center font-extrabold text-amber-600">
                      {sum.otHours > 0 ? `+${sum.otHours}h` : '-'}
                    </td>

                    {/* Total Hours (Bold Green text) */}
                    <td className="py-3 px-5 text-center font-black text-sm text-[#16a34a]">
                      {sum.totalHours}h
                    </td>

                    {/* Late Hours (Red text) */}
                    <td className="py-3 px-5 text-center">
                      {sum.totalLateMinutes > 0 ? (
                        <span className="text-rose-600 font-bold">
                          {sum.lateFormatted}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Assigned Sites (Rounded chips) */}
                    <td className="py-3 px-5">
                      <div className="flex flex-wrap gap-1.5">
                        {Object.keys(sum.siteDays).length === 0 ? (
                          <span className="bg-slate-100 text-slate-500 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">No site logged</span>
                        ) : (
                          Object.entries(sum.siteDays).map(([siteId, count]) => {
                            const sObj = siteMap.get(siteId);
                            return (
                              <span
                                key={siteId}
                                className="bg-emerald-50 text-[#16a34a] rounded-full px-2.5 py-0.5 text-[11px] font-bold border border-emerald-200/60"
                              >
                                {sObj ? sObj.code : 'Site'}: {count}d
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
