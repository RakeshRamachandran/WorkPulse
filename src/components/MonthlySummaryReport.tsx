import React, { useState } from 'react';
import type { Employee, Site, AttendanceRecord, MonthlyEmployeeSummary } from '../types';
import { getRecordSiteIds, isSubcontractor } from '../types';
import {
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  Users,
  Briefcase,
  Clock,
  TrendingUp,
  Zap,
  AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface MonthlySummaryReportProps {
  selectedYear: number;
  selectedMonth: number;
  employees: Employee[];
  sites: Site[];
  attendanceRecords: AttendanceRecord[];
}

export const MonthlySummaryReport: React.FC<MonthlySummaryReportProps> = ({
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

  // Calculate monthly stats per employee (direct employees only)
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

  // Filter summaries
  const filteredSummaries = summaries.filter((s) => {
    const matchesSearch =
      s.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employee.emp_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || s.employee.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthShortName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
  });

  // Aggregate Totals
  const totalEmployees = filteredSummaries.length;
  const totalWorkingDaysAll = filteredSummaries.reduce((acc, s) => acc + s.workingDays, 0);
  const totalLeaveDaysAll = filteredSummaries.reduce((acc, s) => acc + s.leaveDays, 0);
  const totalRegularHoursAll = filteredSummaries.reduce((acc, s) => acc + s.regularHours, 0);
  const totalOTHoursAll = filteredSummaries.reduce((acc, s) => acc + s.otHours, 0);
  const totalHoursAll = filteredSummaries.reduce((acc, s) => acc + s.totalHours, 0);
  const totalLateMinsAll = filteredSummaries.reduce((acc, s) => acc + s.totalLateMinutes, 0);

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
    doc.text(`Monthly Attendance Summary - ${monthName}`, logoImg ? 64 : 14, 22);

    doc.setFontSize(8.5);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 155, 22);

    const tableData = filteredSummaries.map((s) => [
      s.employee.emp_id,
      s.employee.name,
      s.workingDays.toString(),
      s.leaveDays.toString(),
      s.holidayCount.toString(),
      s.regularHours.toString(),
      s.otHours.toString(),
      s.totalHours.toString(),
      s.lateFormatted,
    ]);

    tableData.push([
      'TOTAL',
      `${totalEmployees} Staff`,
      totalWorkingDaysAll.toString(),
      totalLeaveDaysAll.toString(),
      '-',
      totalRegularHoursAll.toString(),
      totalOTHoursAll.toString(),
      totalHoursAll.toString(),
      `${Math.floor(totalLateMinsAll / 60)}h ${totalLateMinsAll % 60}m`,
    ]);

    autoTable(doc, {
      startY: 36,
      head: [
        ['Emp ID', 'Employee', 'Work Days', 'Leave Days', 'Holiday', 'Regular Hours', 'OT Hours', 'Total Hours', 'Late Time'],
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
        6: { halign: 'center' },
        7: { halign: 'center', fontStyle: 'bold' },
        8: { halign: 'center' },
      },
    });

    doc.save(`Venkateswara_Monthly_Report_${selectedMonth}_${selectedYear}.pdf`);
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
      'Holidays': s.holidayCount,
      'Regular Hours': s.regularHours,
      'OT Hours': s.otHours,
      'Total Work Hours': s.totalHours,
      'Late Time': s.lateFormatted,
    }));

    excelRows.push({
      'Employee ID': 'TOTAL',
      'Employee Name': `${totalEmployees} Staff`,
      'Designation': '',
      'Category': '',
      'Working Days': totalWorkingDaysAll,
      'Leave Days': totalLeaveDaysAll,
      'Holidays': 0,
      'Regular Hours': totalRegularHoursAll,
      'OT Hours': totalOTHoursAll,
      'Total Work Hours': totalHoursAll,
      'Late Time': `${Math.floor(totalLateMinsAll / 60)}h ${totalLateMinsAll % 60}m`,
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Attendance');

    XLSX.writeFile(workbook, `Venkateswara_Monthly_Report_${selectedMonth}_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-[24px] pb-12">
      {/* KPI Cards (Specs: Card radius 14px, Padding 20px, Gap 20px, Value 36px) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-[20px]">
        <div className="bg-white border border-[#E5E7EB] p-[20px] rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out group">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#6B7280]">Staff Roster</span>
            <div className="w-10 h-10 rounded-full bg-[#E8F7EE] text-[#16A34A] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[36px] font-bold text-[#111827] mt-3 leading-none">{totalEmployees}</p>
          <p className="text-[14px] text-[#6B7280] font-normal mt-1.5">Active Staff</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-[20px] rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out group">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#6B7280]">Work Days</span>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[36px] font-bold text-blue-600 mt-3 leading-none">{daysInMonth}</p>
          <p className="text-[14px] text-[#6B7280] font-normal mt-1.5">Total Days ({monthShortName})</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-[20px] rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out group">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#6B7280]">Leave Days</span>
            <div className="w-10 h-10 rounded-full bg-rose-50 text-[#EF4444] flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[36px] font-bold text-[#EF4444] mt-3 leading-none">{totalLeaveDaysAll}</p>
          <p className="text-[14px] text-[#6B7280] font-normal mt-1.5">Total Leaves</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-[20px] rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out group">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#6B7280]">Regular Hours</span>
            <div className="w-10 h-10 rounded-full bg-[#E8F7EE] text-[#16A34A] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[36px] font-bold text-[#16A34A] mt-3 leading-none">{totalRegularHoursAll}h</p>
          <p className="text-[14px] text-[#6B7280] font-normal mt-1.5">Standard 8h Rate</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-[20px] rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out group">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#6B7280]">Overtime (OT)</span>
            <div className="w-10 h-10 rounded-full bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[36px] font-bold text-[#F59E0B] mt-3 leading-none">{totalOTHoursAll}h</p>
          <p className="text-[14px] text-[#6B7280] font-normal mt-1.5">Extra Site Hours</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-[20px] rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out group">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#6B7280]">Total Work Hours</span>
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[36px] font-bold text-purple-600 mt-3 leading-none">{totalHoursAll}h</p>
          <p className="text-[14px] text-[#6B7280] font-normal mt-1.5">Reg + Overtime</p>
        </div>
      </div>

      {/* Main Table Card (Card radius 14px, Padding 20px) */}
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] space-y-[20px]">
        {/* Toolbar Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-[22px] font-semibold text-[#111827]">Monthly Attendance Breakdown</h2>
            <p className="text-[14px] text-[#6B7280] mt-0.5">Comprehensive manager summary for {monthName}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input (Height 40px, Radius 10px) */}
            <div className="relative min-w-[240px]">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search employee by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[40px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] pl-10 pr-4 text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:bg-white transition-all"
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
                <option value="ALL">All Categories</option>
                <option value="Engineer">Engineers</option>
                <option value="Worker">Workers</option>
              </select>
            </div>

            {/* Export Buttons (Height 40px, Radius 10px) */}
            <div className="flex items-center space-x-2 pl-2 border-l border-[#E5E7EB]">
              <button
                onClick={handleExportExcel}
                className="h-[40px] bg-[#16A34A] hover:bg-[#15803D] text-white font-medium text-[14px] px-4 rounded-[10px] shadow-xs transition-all duration-200 flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="h-[40px] bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#111827] font-medium text-[14px] px-4 rounded-[10px] shadow-xs transition-all duration-200 flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                <FileText className="w-5 h-5 text-[#16A34A]" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Container (Radius 12px, Sticky Header #FAFAFA, Row Height 52px, Hover #F9FBFA) */}
        <div className="rounded-[12px] border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] text-[13px] uppercase tracking-wider text-[#6B7280] font-semibold border-b border-[#E5E7EB] h-[48px]">
                  <th className="py-3 px-5 w-24">Emp ID</th>
                  <th className="py-3 px-5 min-w-[200px]">Employee Name</th>
                  <th className="py-3 px-5 text-center">Work Days</th>
                  <th className="py-3 px-5 text-center">Leave Days</th>
                  <th className="py-3 px-5 text-center">Holidays</th>
                  <th className="py-3 px-5 text-center">Reg Hours</th>
                  <th className="py-3 px-5 text-center">OT Hours</th>
                  <th className="py-3 px-5 text-center">Total Hours</th>
                  <th className="py-3 px-5 text-center">Late Time</th>
                  <th className="py-3 px-5">Primary Site Allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[14px] text-[#111827]">
                {filteredSummaries.map((sum) => (
                  <tr key={sum.employee.id} className="h-[52px] hover:bg-[#F9FBFA] transition-colors duration-150">
                    {/* Emp ID Badge */}
                    <td className="py-2.5 px-5 font-mono text-[12px] font-medium text-[#16A34A]">
                      <span className="bg-[#E8F7EE] text-[#16A34A] px-3 py-1 rounded-full inline-block">
                        {sum.employee.emp_id}
                      </span>
                    </td>

                    {/* Employee Name */}
                    <td className="py-2.5 px-5 font-semibold text-[#111827]">
                      {sum.employee.name}
                    </td>

                    {/* Work Days */}
                    <td className="py-2.5 px-5 text-center font-semibold text-[#111827]">
                      {sum.workingDays}
                    </td>

                    {/* Leave Days */}
                    <td className="py-2.5 px-5 text-center">
                      {sum.leaveDays > 0 ? (
                        <span className="bg-rose-50 text-[#EF4444] font-medium px-2.5 py-0.5 rounded-full text-[12px] inline-block">
                          {sum.leaveDays}d
                        </span>
                      ) : (
                        <span className="text-[#6B7280]">-</span>
                      )}
                    </td>

                    {/* Holidays */}
                    <td className="py-2.5 px-5 text-center font-medium text-[#6B7280]">
                      {sum.holidayCount > 0 ? `${sum.holidayCount}d` : '-'}
                    </td>

                    {/* Regular Hours (Green text) */}
                    <td className="py-2.5 px-5 text-center font-medium text-[#16A34A]">
                      {sum.regularHours}h
                    </td>

                    {/* OT Hours (Orange text) */}
                    <td className="py-2.5 px-5 text-center font-semibold text-[#F59E0B]">
                      {sum.otHours > 0 ? `+${sum.otHours}h` : '-'}
                    </td>

                    {/* Total Hours (Bold Green text) */}
                    <td className="py-2.5 px-5 text-center font-bold text-[#16A34A]">
                      {sum.totalHours}h
                    </td>

                    {/* Late Time (Red text) */}
                    <td className="py-2.5 px-5 text-center">
                      {sum.totalLateMinutes > 0 ? (
                        <span className="text-[#EF4444] font-semibold">
                          {sum.lateFormatted}
                        </span>
                      ) : (
                        <span className="text-[#6B7280]">-</span>
                      )}
                    </td>

                    {/* Assigned Site Chips */}
                    <td className="py-2.5 px-5">
                      <div className="flex flex-wrap gap-1.5">
                        {Object.keys(sum.siteDays).length === 0 ? (
                          <span className="bg-slate-100 text-[#6B7280] rounded-full px-2.5 py-0.5 text-[11px] font-medium">No site logged</span>
                        ) : (
                          Object.entries(sum.siteDays).map(([siteId, count]) => {
                            const sObj = siteMap.get(siteId);
                            return (
                              <span
                                key={siteId}
                                className="bg-[#E8F7EE] text-[#16A34A] rounded-full px-2.5 py-0.5 text-[11px] font-medium"
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
