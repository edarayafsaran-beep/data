import React, { useState } from 'react';
import { SystemAuditLog, User } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Database,
  Wifi,
  HardDrive,
  RefreshCw,
  Key,
  KeyRound,
  Download,
  Upload,
  UserCheck,
  Server,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface AuditSecurityViewProps {
  auditLogs: SystemAuditLog[];
  allUsers: User[];
}

export const AuditSecurityView: React.FC<AuditSecurityViewProps> = ({ auditLogs, allUsers }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'backup' | 'sessions' | 'lan'>('logs');
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [offlineLanMode, setOfflineLanMode] = useState(true);

  const handleRunBackup = () => {
    setIsBackupRunning(true);
    setBackupSuccess(false);
    setTimeout(() => {
      setIsBackupRunning(false);
      setBackupSuccess(true);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-full flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-purple-400" /> ئاسایشی دەزگا، لۆگی سیستەم و بەکئەپ (Enterprise Security & Audit)
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            ئاسایشی داتا، لۆگی گۆڕانکارییەکان و تۆڕی ناوخۆیی (LAN)
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            چاودێریکردنی لۆگی چالاکییەکان، بەڕێوەبردنی سێشنەکانی JWT، هێنانەوەی بکئەپ و ئامادەیی کارکردن بەبێ ئینتەرنێت.
          </p>
        </div>

        {/* Offline LAN Badge */}
        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-white/10 text-xs">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <span className="font-bold text-white block">کارکردن لەسەر تۆڕی ناوخۆ (Offline LAN Ready)</span>
            <span className="text-[10px] text-slate-400 font-mono">192.168.1.100 : Postgres Ready</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md p-2 rounded-2xl border border-white/10 w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-purple-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" /> لۆگی ئاسایش و چالاکییەکان
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'backup'
              ? 'bg-purple-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" /> بەکئەپ و گەڕاندنەوە (Backup & Restore)
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'sessions'
              ? 'bg-purple-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" /> سێشنە چالاکەکان (JWT Sessions)
        </button>
      </div>

      {/* TAB 1: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-[36px] border border-white/10 shadow-md overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" /> مێژووی لۆگی ئاسایش و گۆڕانکارییەکان (Audit Trail)
            </h3>
            <span className="text-xs text-purple-300 font-mono font-bold">
              تێکڕا: {auditLogs.length} لۆگ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-white/10">
                <tr>
                  <th className="p-4">کات و بەروار</th>
                  <th className="p-4">بەکارهێنەر</th>
                  <th className="p-4">بەش (Module)</th>
                  <th className="p-4">کردار (Action)</th>
                  <th className="p-4">وردەکاری</th>
                  <th className="p-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-all">
                    <td className="p-4 font-mono text-slate-400">{log.timestamp}</td>
                    <td className="p-4">
                      <div className="font-bold text-white">{log.userName}</div>
                      <span className="text-[10px] text-purple-300 font-mono">{log.userRole}</span>
                    </td>
                    <td className="p-4 font-bold text-slate-200">{log.module}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-lg font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 max-w-xs">{log.details}</td>
                    <td className="p-4 font-mono text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md space-y-6">
            <div className="w-14 h-14 rounded-3xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Database className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">درەوستکردنی بکئەپ (Database Backup)</h3>
              <p className="text-xs text-slate-400 mt-1">
                دروستکردنی فایلی بکئەپی خێرا بۆ بنکەی داتای PostgreSQL بە شێوەی دروست و پارێزراو.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>دوایین بکئەپ:</span>
                <span className="font-mono text-emerald-400">ئەمڕۆ - 12:00 PM</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>قەبارەی بنکەی داتا:</span>
                <span className="font-mono text-white">42.8 MB</span>
              </div>
            </div>

            {backupSuccess && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>فایلی بکئەپ بە سەرکەوتوویی دروستکرا و پاشەکەوتکرا!</span>
              </div>
            )}

            <button
              onClick={handleRunBackup}
              disabled={isBackupRunning}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-slate-950 font-black text-xs rounded-2xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isBackupRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>لە پڕۆسەی ڕاکێشانی بکئەپ دایە...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>دروستکردن و دابەزاندنی بکئەپ (Download Backup SQL)</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md space-y-6">
            <div className="w-14 h-14 rounded-3xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">گەڕاندنەوەی داتا (Restore Database)</h3>
              <p className="text-xs text-slate-400 mt-1">
                دابەزاندنی فایلی بکئەپی کۆن بۆ سەر بنکەی داتا لە کاتی گواستنەوە یان کێشەدا.
              </p>
            </div>

            <div className="border-2 border-dashed border-white/20 hover:border-purple-500/50 rounded-2xl p-8 text-center cursor-pointer transition-all">
              <Server className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-300 block">
                فایلی بکئەپەکە ڕابکێشە ئێرە یان داگرە بۆ هەڵبژاردن (.sql, .bak)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: JWT SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[36px] border border-white/10 shadow-md space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-purple-400" /> سێشنە چالاکەکانی بەکارهێنەران (Active JWT Sessions)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 bg-slate-950 border border-white/10 rounded-2xl space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 font-black flex items-center justify-center text-xs">
                      {u.name[0]}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-white block">{u.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{u.role}</span>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Online" />
                </div>

                <div className="p-2.5 bg-white/[0.03] rounded-xl text-[10px] font-mono text-slate-400 space-y-1">
                  <div>IP: 192.168.1.{100 + u.id}</div>
                  <div>JWT Token Expire: 24 Hours</div>
                  <div className="text-emerald-400">STATUS: AUTHORIZED</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
