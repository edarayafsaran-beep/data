import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentStatus } from '../types';
import {
  Tv,
  Play,
  Pause,
  Power,
  CheckCircle2,
  Clock,
  User,
  Stethoscope,
  Sparkles,
  Calendar,
  ArrowUpRight,
  Send,
  Filter,
  Check,
  ShieldCheck,
  Flame,
  Zap,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  PlusCircle,
  Activity,
  UserCheck,
} from 'lucide-react';

interface TodayAppointmentsDispatchBoardProps {
  appointments: Appointment[];
  onUpdateAppointmentStatus: (id: number, status: AppointmentStatus) => void;
  onOpenTvMode?: () => void;
  onOpenNewAppointment?: () => void;
}

export const TodayAppointmentsDispatchBoard: React.FC<TodayAppointmentsDispatchBoardProps> = ({
  appointments,
  onUpdateAppointmentStatus,
  onOpenTvMode,
  onOpenNewAppointment,
}) => {
  const [selectedDateFilter, setSelectedDateFilter] = useState<'today' | 'tomorrow' | 'all'>('today');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isAutoDispatchEnabled, setIsAutoDispatchEnabled] = useState<boolean>(true);
  const [dispatchedTvIds, setDispatchedTvIds] = useState<number[]>([]);
  const [lastDispatchedTime, setLastDispatchedTime] = useState<string>('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Tomorrow's date string calculation
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  // Filter appointments by date
  const filteredAppointments = appointments.filter((app) => {
    if (selectedDateFilter === 'today') {
      return app.appointmentDate === todayStr || !app.appointmentDate; // default to today if missing
    }
    if (selectedDateFilter === 'tomorrow') {
      return app.appointmentDate === tomorrowStr;
    }
    return true; // 'all'
  });

  // Auto-Dispatch Effect: When Auto-Dispatch is enabled, automatically mark today's patients as dispatched to TV
  useEffect(() => {
    if (isAutoDispatchEnabled && selectedDateFilter === 'today') {
      const todayApps = appointments.filter(
        (a) => (a.appointmentDate === todayStr || !a.appointmentDate) && a.status !== 'هەڵوەشێنرایەوە'
      );
      const allTodayActiveIds = todayApps.map((a) => a.id);
      
      // Update dispatched TV IDs list (strictly excluding cancelled ones)
      setDispatchedTvIds(allTodayActiveIds);
    } else {
      // Clean up any cancelled appointments from dispatched list
      setDispatchedTvIds((prev) =>
        prev.filter((id) => {
          const matched = appointments.find((a) => a.id === id);
          return matched ? matched.status !== 'هەڵوەشێنرایەوە' : true;
        })
      );
    }
  }, [isAutoDispatchEnabled, appointments, todayStr, selectedDateFilter]);

  // Handle 1-Click Send Single Patient to TV Board
  const handleSendSingleToTv = (app: Appointment) => {
    if (app.status === 'هەڵوەشێنرایەوە') {
      alert(`⚠️ نەخۆش (${app.patientName}) مەوعیدەکەی هەڵوەشێنراوەتەوە (نایەت)!\nناکرێت بخرێتە ڕیزی سەر شاشەی TV.`);
      return;
    }

    if (!dispatchedTvIds.includes(app.id)) {
      setDispatchedTvIds((prev) => [...prev, app.id]);
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastDispatchedTime(time);
    setNotificationMsg(`✅ [ناردن بۆ TV]: نەخۆش (${app.patientName}) بە سەرکەوتوویی ڕەوانەی شاشەی TV کرا.`);

    setTimeout(() => {
      setNotificationMsg(null);
    }, 4000);
  };

  // Handle 1-Click Send ALL Today's Patients to TV Board (Bulk Action)
  const handleBulkSendAllTodayToTv = () => {
    const todayActiveApps = appointments.filter(
      (a) => (a.appointmentDate === todayStr || !a.appointmentDate) && a.status !== 'هەڵوەشێنرایەوە'
    );
    const todayActiveIds = todayActiveApps.map((a) => a.id);

    setDispatchedTvIds((prev) => Array.from(new Set([...prev, ...todayActiveIds])));

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastDispatchedTime(time);
    setNotificationMsg(`🚀 [گواستنەوەی نەخۆشان]: ${todayActiveApps.length} نەخۆشی چالاکی ئەمڕۆ ڕەوانەی شاشەی TV کران! (نەخۆشە هەڵوەشێنراوەکان نەگوێزرانەوە)`);

    setTimeout(() => {
      setNotificationMsg(null);
    }, 4500);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-2xl border-2 border-cyan-500/30 rounded-[36px] p-6 shadow-md space-y-6 relative overflow-hidden">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header & Title */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/30">
            <Tv className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                ڕێکخستن و گواستنەوەی چارەخواز بۆ شاشەی TV
              </h2>
              <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold border border-cyan-500/30">
                1-CLICK TV DISPATCH
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              لیستی چارەخوازانی ئەمڕۆ و سبەینێ • بە یەک کلیک یان بە خۆکار (Auto-Dispatch) ڕەوانەی شاشەی TV بکە
            </p>
          </div>
        </div>

        {/* Action Controls & Auto Dispatch Switcher */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {/* AUTO-DISPATCH TOGGLE SWITCH */}
          <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-2xl border border-white/10 shadow-inner">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className={`w-4 h-4 ${isAutoDispatchEnabled ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
              <span>خۆکار ناردن بۆ TV (Auto):</span>
            </span>

            <button
              onClick={() => setIsAutoDispatchEnabled(!isAutoDispatchEnabled)}
              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${
                isAutoDispatchEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
              title={isAutoDispatchEnabled ? 'خۆکار ناردن چالاککراوە (ON)' : 'خۆکار ناردن کوژێنراوەتەوە (OFF)'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 font-black transition-transform flex items-center justify-center text-[9px] ${
                  isAutoDispatchEnabled ? 'translate-x-1 font-bold' : 'translate-x-7 text-white'
                }`}
              >
                {isAutoDispatchEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* Bulk 1-Click Send All Today's Patients */}
          <button
            onClick={handleBulkSendAllTodayToTv}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 hover:brightness-110 text-slate-950 rounded-2xl font-black text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Send className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>ناردنی سەرجەم چارەخوازانی ئەمڕۆ بۆ TV</span>
          </button>

          {/* Open Fullscreen TV Board Screen */}
          {onOpenTvMode && (
            <button
              onClick={onOpenTvMode}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <span>دیدەنی شاشەی TV</span>
              <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            </button>
          )}
        </div>
      </div>

      {/* Auto Dispatch Status Bar Indicator */}
      <div className="flex flex-wrap items-center justify-between bg-slate-950/70 p-3.5 rounded-2xl border border-white/10 text-xs gap-3">
        <div className="flex items-center gap-2">
          {isAutoDispatchEnabled ? (
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              ⚡ بزوێنەری ئۆتۆ-ناردنی TV چالاکە (Auto-Dispatch ACTIVE ON)
            </span>
          ) : (
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              ✋ ناردنی دەستی (Manual 1-Click Mode OFF)
            </span>
          )}

          {lastDispatchedTime && (
            <span className="text-slate-400 text-[11px] font-mono">
              دواین گواستنەوە: {lastDispatchedTime}
            </span>
          )}
        </div>

        {/* View Mode Toggle & Add New Button */}
        <div className="flex items-center gap-2">
          {onOpenNewAppointment && (
            <button
              onClick={onOpenNewAppointment}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>زیادکردنی مەوعید</span>
            </button>
          )}

          <div className="flex items-center bg-slate-950/90 p-1.5 rounded-2xl border border-white/15 backdrop-blur-xl shadow-inner gap-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all duration-300 flex items-center gap-1.5 cursor-pointer select-none ${
                viewMode === 'cards'
                  ? 'bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(0,243,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-cyan-200/50 scale-[1.02]'
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>کارتی چوارگۆشە</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all duration-300 flex items-center gap-1.5 cursor-pointer select-none ${
                viewMode === 'table'
                  ? 'bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(0,243,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-cyan-200/50 scale-[1.02]'
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>خشتە</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Banner when dispatched */}
      {notificationMsg && (
        <div className="p-4 bg-emerald-500/20 border-2 border-emerald-500/60 text-emerald-200 rounded-2xl text-xs font-bold animate-in fade-in slide-in-from-top-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{notificationMsg}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-300">TV Synced</span>
        </div>
      )}

      {/* Date Filter Selection Tabs (دوگمەکانی هەڵبژاردنی بەروار) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" /> دیاریکردنی بەرواری مەوعیدەکان:
          </span>

          <div className="flex items-center gap-2 bg-slate-950/95 p-1.5 rounded-2xl border-2 border-cyan-500/30 backdrop-blur-2xl shadow-[0_0_20px_rgba(0,243,255,0.15)] flex-wrap">
            <button
              onClick={() => setSelectedDateFilter('today')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 cursor-pointer select-none ${
                selectedDateFilter === 'today'
                  ? 'bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 text-slate-950 shadow-[0_0_25px_rgba(0,243,255,0.5),inset_0_1px_1px_rgba(255,255,255,0.5)] border border-white/60 scale-[1.03]'
                  : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(0,243,255,0.2)]'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${selectedDateFilter === 'today' ? 'text-slate-950' : 'text-cyan-400'}`} />
              <span>چارەخوازانی ئەمڕۆ ({todayStr})</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                selectedDateFilter === 'today' ? 'bg-slate-950/30 text-slate-950' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              }`}>
                {appointments.filter((a) => a.appointmentDate === todayStr || !a.appointmentDate).length}
              </span>
            </button>

            <button
              onClick={() => setSelectedDateFilter('tomorrow')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 cursor-pointer select-none ${
                selectedDateFilter === 'tomorrow'
                  ? 'bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 text-slate-950 shadow-[0_0_25px_rgba(0,243,255,0.5),inset_0_1px_1px_rgba(255,255,255,0.5)] border border-white/60 scale-[1.03]'
                  : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(0,243,255,0.2)]'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${selectedDateFilter === 'tomorrow' ? 'text-slate-950' : 'text-cyan-400'}`} />
              <span>مەوعیدی سبەینێ ({tomorrowStr})</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                selectedDateFilter === 'tomorrow' ? 'bg-slate-950/30 text-slate-950' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              }`}>
                {appointments.filter((a) => a.appointmentDate === tomorrowStr).length}
              </span>
            </button>

            <button
              onClick={() => setSelectedDateFilter('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 cursor-pointer select-none ${
                selectedDateFilter === 'all'
                  ? 'bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 text-slate-950 shadow-[0_0_25px_rgba(0,243,255,0.5),inset_0_1px_1px_rgba(255,255,255,0.5)] border border-white/60 scale-[1.03]'
                  : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(0,243,255,0.2)]'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${selectedDateFilter === 'all' ? 'text-slate-950' : 'text-cyan-400'}`} />
              <span>سەرجەم بەروارەکان</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                selectedDateFilter === 'all' ? 'bg-slate-950/30 text-slate-950' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
              }`}>
                {appointments.length}
              </span>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-bold">
          کۆی نیشاندراو: <span className="text-cyan-300 font-mono text-sm">{filteredAppointments.length}</span> چارەخواز
        </div>
      </div>

      {/* MAIN DISPLAY AREA: CARDS OR TABLE */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-16 bg-slate-950/40 rounded-3xl border border-white/5 space-y-3">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
          <p className="text-slate-400 text-xs font-semibold">
            هیچ مەوعیدێک لەم بەروارەدا ({selectedDateFilter === 'today' ? 'ئەمڕۆ' : selectedDateFilter === 'tomorrow' ? 'سبەینێ' : 'سەرجەم'}) تۆمار نەکراوە.
          </p>
          {onOpenNewAppointment && (
            <button
              onClick={onOpenNewAppointment}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold"
            >
              دیاریکردنی مەوعیدی نوێ
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* SQUARE CARDS VIEW ("کارتی چوارگۆشە") */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAppointments.map((app, idx) => {
            const isDispatched = dispatchedTvIds.includes(app.id) || isAutoDispatchEnabled;

            return (
              <div
                key={app.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                  app.status === 'لە ژوورەوەیە'
                    ? 'bg-purple-950/50 border-purple-500/60 shadow-md shadow-purple-500/10'
                    : isDispatched
                    ? 'bg-slate-950/90 border-cyan-500/40 hover:border-cyan-400 shadow-md'
                    : 'bg-slate-950/60 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Card Top Header: Time & Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-slate-900 border border-cyan-500/30 text-cyan-300 font-mono font-black text-xs rounded-xl shadow">
                    ⏰ {app.appointmentTime}
                  </span>

                  {isDispatched ? (
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold rounded-xl flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      لە TVda هەیە
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-slate-900 text-slate-400 border border-white/10 text-[10px] font-bold rounded-xl">
                      نەنێردراوە
                    </span>
                  )}
                </div>

                {/* Card Center: Patient Name in Large Bold Typography */}
                <div className="space-y-1.5 my-2">
                  <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between">
                    <span>نۆرەی #{idx + 1}</span>
                    <span className="text-cyan-400 font-semibold">{app.roomNumber}</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-white tracking-tight line-clamp-2">
                    {app.patientName}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium truncate">
                    {app.treatmentName}
                  </p>
                  <p className="text-[11px] text-cyan-400 font-bold flex items-center gap-1 pt-1">
                    <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                    <span>پزیشک: {app.doctorName}</span>
                  </p>
                </div>

                {/* Card Bottom: 1-Click Send Button & Status Selector */}
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <div className="relative">
                    <select
                      value={app.status}
                      onChange={(e) => onUpdateAppointmentStatus(app.id, e.target.value as AppointmentStatus)}
                      className="w-full bg-slate-950/90 border-2 border-cyan-500/30 hover:border-cyan-400 rounded-xl px-3 py-2 text-xs text-cyan-200 font-black cursor-pointer focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 shadow-inner transition-all appearance-none text-right"
                    >
                      <option value="چاوەڕێ دەکات" className="bg-slate-950 text-blue-300">⏳ دۆخ: چاوەڕێ دەکات</option>
                      <option value="لە ژوورەوەیە" className="bg-slate-950 text-purple-300">🚪 دۆخ: لە ژوورەوەیە</option>
                      <option value="تەواوبوو" className="bg-slate-950 text-sky-300">✅ دۆخ: تەواوبوو</option>
                      <option value="بەڕێوەیە" className="bg-slate-950 text-amber-300">🚗 دۆخ: بەڕێوەیە</option>
                      <option value="هەڵوەشێنرایەوە" className="bg-slate-950 text-rose-300">❌ دۆخ: هەڵوەشێنرایەوە</option>
                    </select>
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendSingleToTv(app)}
                    className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-98 ${
                      isDispatched
                        ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border-2 border-cyan-400/50 shadow-[0_0_15px_rgba(0,243,255,0.2)]'
                        : 'bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 text-slate-950 hover:brightness-110 shadow-[0_0_20px_rgba(0,243,255,0.4)]'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>{isDispatched ? 'دیوبارە ناردن بۆ TV' : 'ناردن بۆ شاشەی TV (1-Click)'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* STRUCTURED TABLE VIEW */
        <div className="overflow-x-auto bg-slate-950/80 rounded-3xl border border-white/10 p-4">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10 pb-3">
                <th className="pb-3 pr-4">ژمارە</th>
                <th className="pb-3">ناوی چارەخواز</th>
                <th className="pb-3">کاتژمێر</th>
                <th className="pb-3">بەروار</th>
                <th className="pb-3">چارەسەری دیاریکراو</th>
                <th className="pb-3">پزیشک & ژوور</th>
                <th className="pb-3">دۆخ (Status)</th>
                <th className="pb-3 pl-4 text-left">کردار (1-Click Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAppointments.map((app, idx) => {
                const isDispatched = dispatchedTvIds.includes(app.id) || isAutoDispatchEnabled;

                return (
                  <tr key={app.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 pr-4 font-mono font-bold text-cyan-300">#{idx + 1}</td>
                    <td className="py-4 font-bold text-white text-sm">{app.patientName}</td>
                    <td className="py-4 font-mono font-bold text-slate-300">{app.appointmentTime}</td>
                    <td className="py-4 font-mono text-slate-400">{app.appointmentDate || todayStr}</td>
                    <td className="py-4 text-slate-300">{app.treatmentName}</td>
                    <td className="py-4 text-slate-400">
                      <span className="block font-bold text-white">{app.doctorName}</span>
                      <span className="text-[10px] text-cyan-400">{app.roomNumber}</span>
                    </td>
                    <td className="py-4">
                      <div className="relative inline-block">
                        <select
                          value={app.status}
                          onChange={(e) => onUpdateAppointmentStatus(app.id, e.target.value as AppointmentStatus)}
                          className="bg-slate-950/90 border border-cyan-500/30 hover:border-cyan-400 rounded-xl px-2.5 py-1.5 pl-7 text-xs text-cyan-200 font-bold cursor-pointer transition-all shadow-inner appearance-none"
                        >
                          <option value="چاوەڕێ دەکات" className="bg-slate-950 text-blue-300">⏳ چاوەڕێ دەکات</option>
                          <option value="لە ژوورەوەیە" className="bg-slate-950 text-purple-300">🚪 لە ژوورەوەیە</option>
                          <option value="تەواوبوو" className="bg-slate-950 text-sky-300">✅ تەواوبوو</option>
                          <option value="بەڕێوەیە" className="bg-slate-950 text-amber-300">🚗 بەڕێوەیە</option>
                          <option value="هەڵوەشێنرایەوە" className="bg-slate-950 text-rose-300">❌ هەڵوەشێنرایەوە</option>
                        </select>
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-400">
                          <ChevronDown className="w-3 h-3" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pl-4 text-left">
                      <button
                        onClick={() => handleSendSingleToTv(app)}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          isDispatched
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black hover:brightness-110 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                        }`}
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>{isDispatched ? 'لە TVدا هەیە ✅' : 'ناردن بۆ TV'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TodayAppointmentsDispatchBoard;
