import React, { useState } from 'react';
import type { SupabaseConfig } from '../types';
import { Database, Check, Copy, ExternalLink, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { saveStoredConfig, resetSupabaseClient } from '../lib/supabaseClient';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  onUpdateConfig: (newConfig: SupabaseConfig) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [url, setUrl] = useState(config.url);
  const [anonKey, setAnonKey] = useState(config.anonKey);
  const [testing, setTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      if (!url.trim() || !anonKey.trim()) {
        const newConf = { url: '', anonKey: '', isConnected: false };
        saveStoredConfig(newConf);
        resetSupabaseClient();
        onUpdateConfig(newConf);
        setTestResult({ success: true, msg: 'Switched to Local Storage Database mode.' });
        setTesting(false);
        return;
      }

      // Quick test fetch
      const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });

      if (res.ok || res.status === 200 || res.status === 404) {
        const newConf = { url: url.trim(), anonKey: anonKey.trim(), isConnected: true };
        saveStoredConfig(newConf);
        resetSupabaseClient();
        onUpdateConfig(newConf);
        setTestResult({ success: true, msg: 'DB connected successfully!' });
      } else {
        setTestResult({ success: false, msg: `Connection failed: ${res.statusText}` });
      }
    } catch (err: any) {
      setTestResult({ success: false, msg: err.message || 'Failed to reach Supabase project URL.' });
    } finally {
      setTesting(false);
    }
  };

  const sqlSchemaSnippet = `-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emp_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    designation TEXT NOT NULL DEFAULT 'Worker',
    category TEXT NOT NULL DEFAULT 'Worker',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    location TEXT,
    code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PRESENT',
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    ot_hours NUMERIC(4, 2) NOT NULL DEFAULT 0.0,
    late_hours INT NOT NULL DEFAULT 0,
    late_minutes INT NOT NULL DEFAULT 0,
    remarks TEXT,
    CONSTRAINT unique_emp_date UNIQUE (employee_id, date)
);

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.users (username, password, role) VALUES
    ('venksuperadmin', '$uper@dmin$34', 'Superadmin'),
    ('venkadmin', '@dmin$321', 'Admin')
ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role;`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Supabase Connection Settings</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect your cloud database or use built-in offline local storage.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://your-project-id.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Supabase Anon Key (API Key)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 ${testResult.success
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{testResult.msg}</span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={handleSave}
              disabled={testing}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2 rounded-xl shadow-lg transition flex items-center space-x-2"
            >
              {testing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{testing ? 'Testing...' : 'Save & Verify Connection'}</span>
            </button>
          </div>
        </div>

        {/* Database SQL Setup Script helper */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Supabase SQL Schema Setup</span>
            <button
              onClick={copySql}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-[10px] text-slate-400 font-mono overflow-x-auto max-h-36">
            {sqlSchemaSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
