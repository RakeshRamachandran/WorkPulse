import React, { useState, useEffect } from 'react';
import type { Employee, Site, AttendanceRecord, AttendanceStatus } from '../types';
import {
  Search,
  CheckCircle,
  Clock,
  Building,
  UserCheck,
  Calendar as CalendarIcon,
  Save,
  Filter,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  X
} from 'lucide-react';

interface DailyAttendanceViewProps {
  selectedYear: number;
  selectedMonth: number;
  employees: Employee[];
  sites: Site[];
  attendanceRecords: AttendanceRecord[];
  onSaveRecord: (record: Partial<AttendanceRecord>) => Promise<void>;
  onBulkSave: (records: Partial<AttendanceRecord>[]) => Promise<void>;
  onUnsavedStatusChange?: (hasUnsaved: boolean) => void;
}

export const DailyAttendanceView: React.FC<DailyAttendanceViewProps> = ({
  selectedYear,
  selectedMonth,
  employees,
  sites,
  attendanceRecords,
  onBulkSave,
  onUnsavedStatusChange,
}) => {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === selectedYear && (today.getMonth() + 1) === selectedMonth;
  const defaultDay = isCurrentMonth ? today.getDate() : 1;

  const [selectedDay, setSelectedDay] = useState<number>(defaultDay);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterSiteId, setFilterSiteId] = useState<string>('ALL');
  const [bulkSiteId, setBulkSiteId] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showSavedNotification, setShowSavedNotification] = useState<boolean>(false);

  // Day switch modal state
  const [pendingDay, setPendingDay] = useState<number | null>(null);

  const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  // Local draft records state
  const [draftRecords, setDraftRecords] = useState<Record<string, Partial<AttendanceRecord>>>({});

  useEffect(() => {
    const map: Record<string, Partial<AttendanceRecord>> = {};
    employees.forEach((emp) => {
      const existing = attendanceRecords.find(
        (r) => r.employee_id === emp.id && r.date === dateStr
      );
      if (existing) {
        map[emp.id] = existing;
      } else {
        map[emp.id] = {
          employee_id: emp.id,
          date: dateStr,
          status: '' as any,
          site_id: null,
          ot_hours: 0,
          late_hours: 0,
          late_minutes: 0,
          remarks: undefined,
        };
      }
    });
    setDraftRecords(map);
    setHasUnsavedChanges(false);
    if (onUnsavedStatusChange) onUnsavedStatusChange(false);
  }, [selectedYear, selectedMonth, selectedDay, employees, attendanceRecords]);

  // Browser navigation unsaved guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const updateLocalRecord = (empId: string, updates: Partial<AttendanceRecord>) => {
    setDraftRecords((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        ...updates,
      },
    }));
    setHasUnsavedChanges(true);
    if (onUnsavedStatusChange) onUnsavedStatusChange(true);
  };

  const handleStatusChange = (empId: string, status: string) => {
    const current = draftRecords[empId] || {};
    updateLocalRecord(empId, {
      status: status as AttendanceStatus,
      site_id: status === 'ABSENT' || status === 'HOLIDAY' ? null : current.site_id,
      ot_hours: status === 'ABSENT' ? 0 : (current.ot_hours || 0),
    });
  };

  const handleSiteChange = (empId: string, siteId: string) => {
    updateLocalRecord(empId, {
      site_id: siteId || null,
    });
  };

  const handleOTChange = (empId: string, otHours: number) => {
    updateLocalRecord(empId, {
      ot_hours: otHours,
    });
  };

  const handleLateTimeChange = (empId: string, lateMins: number) => {
    updateLocalRecord(empId, {
      late_hours: Math.floor(lateMins / 60),
      late_minutes: lateMins,
      remarks: lateMins > 0 ? `Late arrival ${lateMins} mins` : undefined,
    });
  };

  const handleBulkMarkPresent = () => {
    setDraftRecords((prev) => {
      const next = { ...prev };
      filteredEmployees.forEach((emp) => {
        const cur = next[emp.id] || {};
        next[emp.id] = {
          ...cur,
          employee_id: emp.id,
          date: dateStr,
          status: 'PRESENT',
          site_id: bulkSiteId || cur.site_id || null,
        };
      });
      return next;
    });
    setHasUnsavedChanges(true);
    if (onUnsavedStatusChange) onUnsavedStatusChange(true);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const recordsToSave = Object.values(draftRecords).filter(r => r.status && r.status.trim() !== '');
      if (recordsToSave.length === 0) {
        alert('Please select attendance status for at least one employee before saving.');
        setIsSaving(false);
        return;
      }
      await onBulkSave(recordsToSave);
      setHasUnsavedChanges(false);
      if (onUnsavedStatusChange) onUnsavedStatusChange(false);
      setShowSavedNotification(true);
      setTimeout(() => setShowSavedNotification(false), 3000);
    } catch (err) {
      console.error('Failed to save daily attendance:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Day Change Handler with Unsaved Protection
  const handleDaySelectChange = (newDay: number) => {
    if (hasUnsavedChanges) {
      setPendingDay(newDay);
    } else {
      setSelectedDay(newDay);
    }
  };

  const confirmSaveAndSwitchDay = async () => {
    if (pendingDay !== null) {
      await handleSaveAll();
      setSelectedDay(pendingDay);
      setPendingDay(null);
    }
  };

  const confirmDiscardAndSwitchDay = () => {
    if (pendingDay !== null) {
      setHasUnsavedChanges(false);
      if (onUnsavedStatusChange) onUnsavedStatusChange(false);
      setSelectedDay(pendingDay);
      setPendingDay(null);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.emp_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'ALL' || emp.category === filterCategory;
    const draftSiteId = draftRecords[emp.id]?.site_id;
    const matchesSite = filterSiteId === 'ALL' || draftSiteId === filterSiteId;

    return matchesSearch && matchesCategory && matchesSite;
  });

  const draftList = Object.values(draftRecords);
  const presentCount = draftList.filter((r) => r.status === 'PRESENT' || r.status === 'HALF_DAY').length;
  const absentCount = draftList.filter((r) => r.status === 'ABSENT').length;
  const otTotalHours = draftList.reduce((acc, r) => acc + (Number(r.ot_hours) || 0), 0);
  const lateCount = draftList.filter((r) => (r.late_minutes || 0) > 0).length;

  return (
    <div className="space-y-[24px] pb-36">
      {/* Date Header & Quick Stats Banner */}
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] space-y-[20px]">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
          {/* Date Selector */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-[#E8F7EE] text-[#16A34A] flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[14px] font-medium text-[#6B7280] block">Attendance Date</span>
              <div className="flex items-center space-x-3 mt-1">
                <div className="relative">
                  <select
                    value={selectedDay}
                    onChange={(e) => handleDaySelectChange(Number(e.target.value))}
                    className="h-[40px] bg-[#F8FAFC] text-[#111827] font-semibold text-[14px] px-3.5 pr-9 rounded-[10px] border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#16A34A] cursor-pointer appearance-none shadow-xs transition"
                  >
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                      const dObj = new Date(selectedYear, selectedMonth - 1, d);
                      const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });
                      return (
                        <option key={d} value={d}>
                          Day {String(d).padStart(2, '0')} - ({dayName})
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <span className="text-[16px] font-semibold text-[#111827]">
                  {new Date(selectedYear, selectedMonth - 1, selectedDay).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Bulk Set Site Action */}
          <div className="flex items-center space-x-3 bg-[#F8FAFC] p-1.5 rounded-[10px] border border-[#E5E7EB]">
            <div className="relative">
              <select
                value={bulkSiteId}
                onChange={(e) => setBulkSiteId(e.target.value)}
                className="h-[40px] bg-white text-[14px] font-medium text-[#111827] pl-3 pr-8 rounded-[10px] border border-[#E5E7EB] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">-- Bulk Select Site --</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={handleBulkMarkPresent}
              className="h-[40px] bg-[#16A34A] hover:bg-[#15803D] text-white font-medium text-[14px] px-4 rounded-[10px] shadow-xs transition-all duration-200 flex items-center space-x-2 cursor-pointer active:scale-95 shrink-0"
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Set All Present</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[20px]">
          <div className="bg-white border border-[#E5E7EB] p-[20px] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-[#E8F7EE] text-[#16A34A] flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[14px] font-medium text-[#6B7280] block">Present</span>
              <span className="text-[28px] font-bold text-[#16A34A] leading-none mt-1 block">{presentCount} <span className="text-[14px] text-[#6B7280] font-normal">/ {employees.length}</span></span>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] p-[20px] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-[#EF4444] flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[14px] font-medium text-[#6B7280] block">Leaves</span>
              <span className="text-[28px] font-bold text-[#EF4444] leading-none mt-1 block">{absentCount}</span>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] p-[20px] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[14px] font-medium text-[#6B7280] block">Total OT</span>
              <span className="text-[28px] font-bold text-[#F59E0B] leading-none mt-1 block">{otTotalHours} <span className="text-[14px] font-normal text-[#6B7280]">hrs</span></span>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] p-[20px] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[14px] font-medium text-[#6B7280] block">Late Arrivals</span>
              <span className="text-[28px] font-bold text-purple-600 leading-none mt-1 block">{lateCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-[20px] rounded-[14px] border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        {/* Search Input */}
        <div className="relative flex items-center flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employee by name, ID, or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[40px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] pl-10 pr-4 text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Site Filter */}
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-[#6B7280] shrink-0" />
            <div className="relative">
              <select
                value={filterSiteId}
                onChange={(e) => setFilterSiteId(e.target.value)}
                className="h-[40px] bg-[#F8FAFC] text-[14px] font-medium text-[#111827] pl-3 pr-8 rounded-[10px] border border-[#E5E7EB] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">All Project Sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-[#6B7280] shrink-0" />
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-[40px] bg-[#F8FAFC] text-[14px] font-medium text-[#111827] pl-3 pr-8 rounded-[10px] border border-[#E5E7EB] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Engineer">Engineers Only</option>
                <option value="Worker">Workers Only</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] text-[13px] uppercase tracking-wider text-[#6B7280] font-semibold border-b border-[#E5E7EB] h-[48px]">
                <th className="py-3 px-5 w-28">Emp ID</th>
                <th className="py-3 px-5 min-w-[200px]">Employee Name</th>
                <th className="py-3 px-5 min-w-[150px]">Designation</th>
                <th className="py-3 px-5 text-center w-52">Attendance Status</th>
                <th className="py-3 px-5 min-w-[240px]">Assigned Site Location</th>
                <th className="py-3 px-5 text-center w-28">OT Hours</th>
                <th className="py-3 px-5 text-center w-36">Late Arrival</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[14px] text-[#111827]">
              {filteredEmployees.map((emp) => {
                const rec = draftRecords[emp.id] || {};
                const currentStatus: string = rec.status || '';
                const currentSiteId = rec.site_id || '';
                const currentOT = rec.ot_hours || 0;
                const currentLateMins = rec.late_minutes || 0;

                let statusStyle = 'bg-[#F8FAFC] text-[#6B7280] border-[#E5E7EB] font-normal hover:bg-slate-100';
                if (currentStatus === 'PRESENT') {
                  statusStyle = 'bg-[#16A34A] text-white border-[#16A34A] font-semibold shadow-xs';
                } else if (currentStatus === 'HALF_DAY') {
                  statusStyle = 'bg-[#F59E0B] text-white border-[#F59E0B] font-semibold shadow-xs';
                } else if (currentStatus === 'ABSENT') {
                  statusStyle = 'bg-[#EF4444] text-white border-[#EF4444] font-semibold shadow-xs';
                } else if (currentStatus === 'HOLIDAY') {
                  statusStyle = 'bg-purple-600 text-white border-purple-600 font-semibold shadow-xs';
                }

                return (
                  <tr key={emp.id} className="h-[52px] hover:bg-[#F9FBFA] transition-colors duration-150">
                    {/* Emp ID Pill Badge */}
                    <td className="py-2.5 px-5">
                      <span className="bg-[#E8F7EE] text-[#16A34A] px-3 py-1 rounded-full text-[12px] font-medium inline-block">
                        {emp.emp_id}
                      </span>
                    </td>

                    {/* Employee Name */}
                    <td className="py-2.5 px-5 font-semibold text-[#111827]">
                      {emp.name}
                    </td>

                    {/* Designation */}
                    <td className="py-2.5 px-5 text-[14px] text-[#6B7280]">
                      {emp.designation}
                    </td>

                    {/* Status Select */}
                    <td className="py-2.5 px-5 text-center">
                      <div className="relative">
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(emp.id, e.target.value)}
                          className={`w-full h-[40px] text-[14px] px-3.5 rounded-[10px] border appearance-none cursor-pointer transition-all ${statusStyle}`}
                        >
                          <option value="" className="bg-white text-[#6B7280] font-normal">
                            -- Select Status --
                          </option>
                          <option value="PRESENT" className="bg-white text-[#16A34A] font-semibold">
                            Present (Full Day)
                          </option>
                          <option value="HALF_DAY" className="bg-white text-[#F59E0B] font-semibold">
                            Half Day (0.5 Day)
                          </option>
                          <option value="ABSENT" className="bg-white text-[#EF4444] font-semibold">
                            Leave / Absent
                          </option>
                          <option value="HOLIDAY" className="bg-white text-purple-600 font-semibold">
                            Official Holiday
                          </option>
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-80" />
                      </div>
                    </td>

                    {/* Site Dropdown */}
                    <td className="py-2.5 px-5">
                      {currentStatus === 'ABSENT' || currentStatus === 'HOLIDAY' ? (
                        <span className="text-[14px] text-[#6B7280] italic">N/A ({currentStatus || 'Absent'})</span>
                      ) : (
                        <div className="relative flex items-center space-x-2">
                          <Building className="w-4 h-4 text-[#6B7280] shrink-0" />
                          <div className="relative flex-1">
                            <select
                              value={currentSiteId}
                              onChange={(e) => handleSiteChange(emp.id, e.target.value)}
                              className="w-full h-[40px] bg-[#F8FAFC] text-[14px] font-medium text-[#111827] pl-3 pr-8 rounded-[10px] border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:bg-white appearance-none cursor-pointer transition"
                            >
                              <option value="">-- Select Site Location --</option>
                              {sites.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.code})
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      )}
                    </td>

                    {/* OT Input */}
                    <td className="py-2.5 px-5 text-center">
                      {currentStatus === 'ABSENT' ? (
                        <span className="text-[14px] text-[#6B7280]">-</span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max="16"
                          step="0.5"
                          value={currentOT}
                          onChange={(e) => handleOTChange(emp.id, parseFloat(e.target.value) || 0)}
                          className="w-20 h-[40px] bg-[#F8FAFC] border border-[#E5E7EB] text-center font-semibold text-[14px] text-[#111827] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:bg-white transition"
                        />
                      )}
                    </td>

                    {/* Late Minutes Dropdown */}
                    <td className="py-2.5 px-5 text-center">
                      {currentStatus === 'ABSENT' || currentStatus === 'HOLIDAY' ? (
                        <span className="text-[14px] text-[#6B7280]">-</span>
                      ) : (
                        <div className="relative">
                          <select
                            value={currentLateMins}
                            onChange={(e) => handleLateTimeChange(emp.id, parseInt(e.target.value, 10))}
                            className={`w-full h-[40px] text-[14px] font-semibold pl-3 pr-7 rounded-[10px] border appearance-none cursor-pointer focus:outline-none ${
                              currentLateMins > 0
                                ? 'bg-rose-50 text-[#EF4444] border-rose-200'
                                : 'bg-[#F8FAFC] text-[#111827] border-[#E5E7EB]'
                            }`}
                          >
                            <option value="0">On Time</option>
                            <option value="15">15 mins</option>
                            <option value="30">30 mins</option>
                            <option value="45">45 mins</option>
                            <option value="60">1 hour</option>
                            <option value="90">1.5 hours</option>
                            <option value="120">2 hours</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bottom Sticky Save Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl z-40 px-4">
        <div className="bg-white/95 text-[#111827] backdrop-blur-md px-5 py-3 rounded-[14px] shadow-[0_6px_24px_rgba(0,0,0,0.08)] border border-[#E5E7EB] flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-[10px] ${hasUnsavedChanges ? 'bg-amber-50 text-[#F59E0B] border border-amber-200' : 'bg-[#E8F7EE] text-[#16A34A] border border-[#16A34A]/20'}`}>
              <CalendarIcon className="w-4 h-4 shrink-0" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#111827] leading-tight">
                Daily Attendance ({dateStr})
              </p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                {hasUnsavedChanges ? 'Unsaved edits present. Click to save.' : 'All entries saved to database.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {showSavedNotification && (
              <div className="flex items-center space-x-1.5 bg-[#E8F7EE] text-[#16A34A] border border-[#16A34A]/30 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>Saved!</span>
              </div>
            )}

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className={`h-[40px] px-5 rounded-[10px] text-[13px] font-semibold shadow-xs transition-all duration-200 flex items-center space-x-2 cursor-pointer active:scale-95 shrink-0 ${
                hasUnsavedChanges
                  ? 'bg-[#16A34A] hover:bg-[#15803D] text-white ring-2 ring-[#16A34A]/40'
                  : 'bg-[#16A34A] hover:bg-[#15803D] text-white'
              }`}
            >
              <Save className={`w-4 h-4 shrink-0 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Saving...' : `Save Attendance`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Internal Day Switch Unsaved Protection Modal */}
      {pendingDay !== null && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] w-full max-w-md p-[20px] shadow-[0_6px_24px_rgba(0,0,0,0.12)] space-y-4 relative">
            <button
              onClick={() => setPendingDay(null)}
              className="absolute top-4 right-4 text-[#6B7280] hover:text-[#111827] bg-[#F8FAFC] p-1.5 rounded-full transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-[#F59E0B] border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-[#111827]">Unsaved Attendance Edits</h3>
                <p className="text-[13px] text-[#6B7280] mt-0.5">
                  You have unsaved edits for Day {selectedDay}. Save before switching to Day {pendingDay}?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E5E7EB]">
              <button
                onClick={confirmDiscardAndSwitchDay}
                className="h-[40px] px-4 rounded-[10px] text-[13px] font-semibold text-[#EF4444] bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
              >
                Discard & Switch
              </button>
              <button
                onClick={confirmSaveAndSwitchDay}
                className="h-[40px] px-5 rounded-[10px] text-[13px] font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] shadow-xs transition cursor-pointer flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4 shrink-0" />
                <span>Save & Switch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
