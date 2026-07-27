import React, { useState, useEffect } from 'react';
import { Sidebar, Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DailyAttendanceView } from './components/DailyAttendanceView';
import { MonthlySummaryReport } from './components/MonthlySummaryReport';
import { AttendanceMatrixView } from './components/AttendanceMatrixView';
import { SiteLocationsManager } from './components/SiteLocationsManager';
import { MasterDataManager } from './components/MasterDataManager';
import { SupabaseModal } from './components/SupabaseModal';
import { LoginPage } from './components/LoginPage';
import type { ActiveTab, Employee, Site, AttendanceRecord, SupabaseConfig, AppUser } from './types';
import { DataService, getStoredConfig } from './lib/supabaseClient';
import confetti from 'canvas-confetti';
import { AlertTriangle, X } from 'lucide-react';

const SESSION_STORAGE_KEY = 'workpulse_auth_session';
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours session logout duration

interface StoredSession {
  user: AppUser;
  timestamp: number;
}

function getValidStoredSession(): AppUser | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);
    if (session && session.user && session.timestamp) {
      if (Date.now() - session.timestamp < SESSION_DURATION_MS) {
        return session.user;
      }
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  return null;
}

export default function App() {
  const initialUser = getValidStoredSession();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(initialUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialUser !== null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredConfig());
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Unsaved Changes Protection State
  const [hasUnsavedAttendance, setHasUnsavedAttendance] = useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const loadData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      const emps = await DataService.getEmployees();
      const st = await DataService.getSites();
      const recs = await DataService.getAttendanceForMonth(selectedYear, selectedMonth);

      setEmployees(emps);
      setSites(st);
      setAttendanceRecords(recs);
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await loadData(false);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [selectedYear, selectedMonth, isAuthenticated]);

  // Intercept Navigation if Unsaved Changes Exist
  const handleTabChange = (newTab: ActiveTab) => {
    if (activeTab === 'daily' && hasUnsavedAttendance && newTab !== 'daily') {
      setPendingNavigation(() => () => {
        setHasUnsavedAttendance(false);
        setActiveTab(newTab);
      });
    } else {
      setActiveTab(newTab);
    }
  };

  const handleMonthChange = (month: number) => {
    if (activeTab === 'daily' && hasUnsavedAttendance) {
      setPendingNavigation(() => () => {
        setHasUnsavedAttendance(false);
        setSelectedMonth(month);
      });
    } else {
      setSelectedMonth(month);
    }
  };

  const handleYearChange = (year: number) => {
    if (activeTab === 'daily' && hasUnsavedAttendance) {
      setPendingNavigation(() => () => {
        setHasUnsavedAttendance(false);
        setSelectedYear(year);
      });
    } else {
      setSelectedYear(year);
    }
  };

  const confirmDiscardAndNavigate = () => {
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  // Handler for single record save
  const handleSaveRecord = async (record: Partial<AttendanceRecord>) => {
    await DataService.saveAttendanceRecord(record);
    const updatedRecs = await DataService.getAttendanceForMonth(selectedYear, selectedMonth);
    setAttendanceRecords(updatedRecs);
  };

  // Handler for bulk daily attendance save
  const handleBulkSave = async (records: Partial<AttendanceRecord>[]) => {
    await DataService.bulkSaveAttendance(records);
    const updatedRecs = await DataService.getAttendanceForMonth(selectedYear, selectedMonth);
    setAttendanceRecords(updatedRecs);
    setHasUnsavedAttendance(false);
  };

  // Master Data Handlers
  const handleSaveSite = async (site: Partial<Site>) => {
    const saved = await DataService.saveSite(site);
    const updated = await DataService.getSites();
    setSites(updated);
    return saved;
  };

  const handleDeleteSite = async (siteId: string) => {
    await DataService.deleteSite(siteId);
    setSites((prev) => prev.filter(s => s.id !== siteId));
  };

  const handleSaveEmployee = async (employee: Partial<Employee>) => {
    const saved = await DataService.saveEmployee(employee);
    const updated = await DataService.getEmployees();
    setEmployees(updated);
    return saved;
  };

  const handleDeleteEmployee = async (empId: string) => {
    await DataService.deleteEmployee(empId);
    setEmployees((prev) => prev.filter(e => e.id !== empId));
  };

  // Reset sample data
  const handleResetDemoData = async () => {
    if (window.confirm('Reset local attendance data to July 2026 PDF sample records?')) {
      await DataService.resetToSampleData();
      await loadData();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user: AppUser) => {
          const sessionPayload: StoredSession = {
            user,
            timestamp: Date.now(),
          };
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionPayload));
          setCurrentUser(user);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col lg:flex-row selection:bg-emerald-100 selection:text-emerald-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          setSelectedMonth={handleMonthChange}
          setSelectedYear={handleYearChange}
          supabaseConfig={supabaseConfig}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onResetDemoData={handleResetDemoData}
          onRefreshData={handleManualSync}
          isRefreshing={isSyncing}
          onLogout={() => {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            setCurrentUser(null);
            setIsAuthenticated(false);
          }}
          currentUser={currentUser}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-3 sm:p-6 max-w-[1600px] w-full mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24 space-x-3 text-[#6B7280]">
              <div className="w-6 h-6 border-2 border-[#16A34A] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold">Loading Venkateswara Operations Portal...</span>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  employees={employees}
                  sites={sites}
                  attendanceRecords={attendanceRecords}
                  onNavigateToDaily={() => handleTabChange('daily')}
                />
              )}

              {activeTab === 'daily' && (
                <DailyAttendanceView
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  employees={employees}
                  sites={sites}
                  attendanceRecords={attendanceRecords}
                  onSaveRecord={handleSaveRecord}
                  onBulkSave={handleBulkSave}
                  onUnsavedStatusChange={setHasUnsavedAttendance}
                />
              )}

              {activeTab === 'summary' && (
                <MonthlySummaryReport
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  employees={employees}
                  sites={sites}
                  attendanceRecords={attendanceRecords}
                />
              )}

              {activeTab === 'matrix' && (
                <AttendanceMatrixView
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  employees={employees}
                  sites={sites}
                  attendanceRecords={attendanceRecords}
                />
              )}

              {activeTab === 'sites' && (
                <SiteLocationsManager
                  sites={sites}
                  onSaveSite={handleSaveSite}
                  onDeleteSite={handleDeleteSite}
                />
              )}

              {activeTab === 'masters' && (
                <MasterDataManager
                  employees={employees}
                  onSaveEmployee={handleSaveEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Supabase Config Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        config={supabaseConfig}
        onUpdateConfig={(newCfg: SupabaseConfig) => {
          setSupabaseConfig(newCfg);
          loadData();
        }}
      />

      {/* Global Unsaved Changes Protection Modal */}
      {pendingNavigation !== null && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] w-full max-w-md p-[20px] shadow-[0_6px_24px_rgba(0,0,0,0.12)] space-y-4 relative">
            <button
              onClick={() => setPendingNavigation(null)}
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
                  You have unsaved edits on the Daily Attendance sheet. Switching tabs or dates will discard your changes.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E5E7EB]">
              <button
                onClick={() => setPendingNavigation(null)}
                className="h-[40px] px-4 rounded-[10px] text-[13px] font-semibold text-[#6B7280] bg-[#F8FAFC] hover:bg-slate-200 transition cursor-pointer"
              >
                Keep Editing
              </button>

              <button
                onClick={confirmDiscardAndNavigate}
                className="h-[40px] px-4 rounded-[10px] text-[13px] font-semibold text-[#EF4444] bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
              >
                Discard & Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
