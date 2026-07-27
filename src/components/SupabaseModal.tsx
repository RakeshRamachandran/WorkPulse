import React, { useState, useEffect } from 'react';
import type { SupabaseConfig } from '../types';
import { Database, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabaseClient';

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
  const [checking, setChecking] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleCheckConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckConnection = async () => {
    setChecking(true);
    setTestResult(null);

    try {
      const client = getSupabaseClient();
      if (!client) {
        onUpdateConfig({ ...config, isConnected: false });
        setTestResult({ success: false, msg: 'No active online database configured.' });
        setChecking(false);
        return;
      }

      // Quick query test to check DB responsiveness
      const { error } = await client.from('employees').select('id', { count: 'exact', head: true });

      if (!error) {
        onUpdateConfig({ ...config, isConnected: true });
        setTestResult({ success: true, msg: 'Online database connection is active and responsive.' });
      } else {
        onUpdateConfig({ ...config, isConnected: false });
        setTestResult({ success: false, msg: `Connection check returned: ${error.message}` });
      }
    } catch (err: any) {
      onUpdateConfig({ ...config, isConnected: false });
      setTestResult({ success: false, msg: err?.message || 'Failed to reach online database.' });
    } finally {
      setChecking(false);
    }
  };

  const isConnected = config.isConnected;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full transition cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-2xl border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Database Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Online Database Connection Status
            </p>
          </div>
        </div>

        {/* Main Connection Status Card */}
        <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center text-center space-y-3 ${
          isConnected
            ? 'bg-emerald-950/30 border-emerald-500/30'
            : 'bg-amber-950/30 border-amber-500/30'
        }`}>
          <div className="relative">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
              isConnected
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-amber-500/20 border-amber-500 text-amber-400'
            }`}>
              {isConnected ? (
                <Wifi className="w-7 h-7" />
              ) : (
                <WifiOff className="w-7 h-7" />
              )}
            </div>
            {isConnected && (
              <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center justify-center space-x-2">
              <h4 className="text-base font-bold text-white">
                {isConnected ? 'Online Database Connected' : 'Database Disconnected'}
              </h4>
              {isConnected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              {isConnected
                ? 'The application is connected to the cloud database.'
                : 'Unable to connect to the online database.'}
            </p>
          </div>

          {testResult && (
            <div className={`w-full text-left p-3 rounded-xl text-xs font-medium flex items-start space-x-2 ${
              testResult.success
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
            }`}>
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="break-words">{testResult.msg}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handleCheckConnection}
            disabled={checking}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2 rounded-xl border border-slate-700 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{checking ? 'Checking...' : 'Recheck Status'}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2 rounded-xl shadow-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

