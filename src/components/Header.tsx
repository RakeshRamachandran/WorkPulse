import React from 'react';
import type { ActiveTab, SupabaseConfig, AppUser } from '../types';
import {
  Calendar,
  Grid,
  FileSpreadsheet,
  Users,
  Database,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Building,
  ChevronDown,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  supabaseConfig: SupabaseConfig;
  onOpenSupabaseModal: () => void;
  onResetDemoData?: () => void;
  onLogout?: () => void;
  currentUser?: AppUser;
}

export const Sidebar: React.FC<{
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 z-30 shadow-xs select-none shrink-0">
      <div>
        {/* Brand Logo Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center">
          <img
            src="/logo.png"
            alt="Venkateswara Electricals"
            className="h-9 w-auto object-contain max-w-[200px]"
          />
        </div>

        {/* Navigation Menu */}
        <nav className="p-3.5 space-y-1.5 mt-2">
          {/* Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${activeTab === 'dashboard'
              ? 'bg-emerald-50 text-[#16a34a] font-bold border-r-4 border-[#16a34a] shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
          >
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-[#16a34a]' : 'text-slate-400'}`} />
            <span>Dashboard</span>
          </button>

          <hr className="border-t border-slate-100 my-2 mx-1" />

          {/* Attendance Operations */}
          <button
            onClick={() => setActiveTab('daily')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${activeTab === 'daily'
              ? 'bg-emerald-50 text-[#16a34a] font-bold border-r-4 border-[#16a34a] shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
          >
            <Calendar className={`w-4 h-4 shrink-0 ${activeTab === 'daily' ? 'text-[#16a34a]' : 'text-slate-400'}`} />
            <span>Daily Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${activeTab === 'summary'
              ? 'bg-emerald-50 text-[#16a34a] font-bold border-r-4 border-[#16a34a] shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
          >
            <FileSpreadsheet className={`w-4 h-4 shrink-0 ${activeTab === 'summary' ? 'text-[#16a34a]' : 'text-slate-400'}`} />
            <span>Monthly Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${activeTab === 'matrix'
              ? 'bg-emerald-50 text-[#16a34a] font-bold border-r-4 border-[#16a34a] shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
          >
            <Grid className={`w-4 h-4 shrink-0 ${activeTab === 'matrix' ? 'text-[#16a34a]' : 'text-slate-400'}`} />
            <span>Attendance Matrix</span>
          </button>

          <hr className="border-t border-slate-100 my-2 mx-1" />

          {/* Master Management */}
          <button
            onClick={() => setActiveTab('sites')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${activeTab === 'sites'
              ? 'bg-emerald-50 text-[#16a34a] font-bold border-r-4 border-[#16a34a] shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
          >
            <Building className={`w-4 h-4 shrink-0 ${activeTab === 'sites' ? 'text-[#16a34a]' : 'text-slate-400'}`} />
            <span>Site Locations</span>
          </button>

          <button
            onClick={() => setActiveTab('masters')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${activeTab === 'masters'
              ? 'bg-emerald-50 text-[#16a34a] font-bold border-r-4 border-[#16a34a] shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold'
              }`}
          >
            <Users className={`w-4 h-4 shrink-0 ${activeTab === 'masters' ? 'text-[#16a34a]' : 'text-slate-400'}`} />
            <span>Employee Roster</span>
          </button>
        </nav>
      </div>

      {/* Footer Branding - Powered by Axon9 */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 text-center">
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-500 font-medium">
            <span>Powered by</span>
            <span className="font-bold text-[#16a34a]">Axon9</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium italic tracking-wide">
            Minds wired to make things
          </p>
        </div>
      </div>
    </aside>
  );
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  supabaseConfig,
  onOpenSupabaseModal,
  onLogout,
}) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2025, 2026, 2027, 2028];

  const pageTitles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: "Welcome back! Here's what's happening with your team today.",
    },
    daily: {
      title: 'Daily Attendance Entry',
      subtitle: "Manage daily employee check-ins, site assignments & overtime hours.",
    },
    summary: {
      title: 'Monthly Summary Report',
      subtitle: "Comprehensive monthly attendance analytics, site-wise breakdown & payroll reports.",
    },
    matrix: {
      title: 'Daily Attendance Matrix',
      subtitle: "Full month grid overview (P / HD / L / H) with site allocation details.",
    },
    sites: {
      title: 'Site Locations Manager',
      subtitle: "List, create, edit & delete project site locations synced with Supabase.",
    },
    masters: {
      title: 'Employee Master Roster',
      subtitle: "Manage company workforce roster & registration.",
    },
    supabase: {
      title: 'Database Settings',
      subtitle: "Configure cloud database connection & view SQL schemas.",
    },
  };

  const currentInfo = pageTitles[activeTab];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs sticky top-0 z-20 backdrop-blur-md bg-white/95 shrink-0">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 leading-tight">
          {currentInfo.title}
        </h1>
        <p className="text-xs text-slate-500 font-normal">
          {currentInfo.subtitle}
        </p>
      </div>

      {/* Top Action Controls */}
      <div className="flex items-center space-x-3">
        {/* Period Selector Pills */}
        <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold px-2">Month:</span>
          <div className="relative flex items-center">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-white text-slate-800 text-xs font-semibold pl-3 pr-7 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16a34a] cursor-pointer shadow-xs appearance-none"
            >
              {months.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none shrink-0" />
          </div>

          <div className="relative flex items-center">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white text-slate-800 text-xs font-semibold pl-3 pr-7 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16a34a] cursor-pointer shadow-xs appearance-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none shrink-0" />
          </div>
        </div>

        {/* Supabase Storage Pill */}
        <button
          onClick={onOpenSupabaseModal}
          className={`flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all shadow-xs cursor-pointer ${supabaseConfig.isConnected
            ? 'bg-emerald-50 text-[#16a34a] border-emerald-200 hover:bg-emerald-100'
            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
        >
          <Database className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
          <span>{supabaseConfig.isConnected ? 'Supabase Connected' : 'Local Storage'}</span>
          {supabaseConfig.isConnected ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
        </button>

        {/* User Profile Avatar & Sign Out */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#16a34a] font-bold text-xs flex items-center justify-center border border-emerald-300 shadow-xs">
              VE
            </div>
            <span className="w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full absolute -bottom-0.5 -right-0.5 shrink-0" />
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              title="Sign Out of WorkPulse"
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
