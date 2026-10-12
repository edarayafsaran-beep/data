import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentStatus } from '../types';
import { relaxingMusicPlayer } from '../utils/relaxingMusic';
import {
  Tv,
  Volume2,
  VolumeX,
  Maximize2,
  Clock,
  CheckCircle,
  Stethoscope,
  Megaphone,
  Filter,
  Search,
  Calendar,
  PlusCircle,
  X,
  Check,
  Edit3,
  Sparkles,
  Radio,
  Sun,
  Cloud,
  CloudSun,
  Thermometer,
  Music,
  Headphones,
  Sliders,
} from 'lucide-react';

interface TvBoardViewProps {
  appointments: Appointment[];
  onUpdateAppointmentStatus?: (id: number, status: AppointmentStatus) => void;
  onOpenNewAppointment?: () => void;
  onCloseTvMode?: () => void;
  isFullscreen?: boolean;
}

export const TvBoardView: React.FC<TvBoardViewProps> = ({
  appointments,
  onUpdateAppointmentStatus,
  onOpenNewAppointment,
  onCloseTvMode,
  isFullscreen = false,
}) => {
  // Live Clock
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [dayName, setDayName] = useState<string>('');
  const [secondsAngle, setSecondsAngle] = useState<number>(0);
  const [minutesAngle, setMinutesAngle] = useState<number>(0);
  const [hoursAngle, setHoursAngle] = useState<number>(0);

  // Selected Date Filter (Defaults to Today's YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Control Panel Toggle & Audio
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [musicVolume, setMusicVolume] = useState<number>(0.35);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState<boolean>(false);

  const toggleRelaxingMusic = () => {
    if (isMusicPlaying) {
      relaxingMusicPlayer.stop();
      setIsMusicPlaying(false);
    } else {
      relaxingMusicPlayer.start();
      relaxingMusicPlayer.setVolume(musicVolume);
      setIsMusicPlaying(true);
    }
  };

  const handleMusicVolumeChange = (newVol: number) => {
    setMusicVolume(newVol);
    relaxingMusicPlayer.setVolume(newVol);
  };

  // Clean up music when unmounting
  useEffect(() => {
    return () => {
      relaxingMusicPlayer.stop();
    };
  }, []);

  // Ticker announcement message
  const [announcementText, setAnnouncementText] = useState<string>(
    '✨ بەخێربێن بۆ سەنتەری جوانکاری  • نوێترین تەکنەلۆجیای لەیزەر، فیلەر، بۆتۆکس و هایدرۆفەیشڵ • پەخشی ڕاستەوخۆی نۆرەی بەڕێزان.'
  );
  const [isEditingTicker, setIsEditingTicker] = useState<boolean>(false);
  const [tempTickerText, setTempTickerText] = useState<string>(announcementText);

  // Real-time Clock interval & analog angles & weather simulation
  const [weatherTemp, setWeatherTemp] = useState<number>(31);
  const [weatherCondition, setWeatherCondition] = useState<string>('خۆرەتاو و ڕووناک');
  const [weatherIconType, setWeatherIconType] = useState<'sun' | 'cloud' | 'cloudsun'>('sun');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const s = now.getSeconds();
      const m = now.getMinutes();
      const h = now.getHours();

      setSecondsAngle(s * 6);
      setMinutesAngle(m * 6 + s * 0.1);
      setHoursAngle((h % 12) * 30 + m * 0.5);

      setTimeStr(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString('ku-IQ', { year: 'numeric', month: 'long', day: 'numeric' })
      );
      setDayName(now.toLocaleDateString('ku-IQ', { weekday: 'long' }));

      // Dynamic weather simulation based on hour of day
      if (h >= 6 && h < 11) {
        setWeatherTemp(27);
        setWeatherCondition('بەیانی خۆش و ئارام');
        setWeatherIconType('sun');
      } else if (h >= 11 && h < 17) {
        setWeatherTemp(34);
        setWeatherCondition('خۆرەتاو و گەرم');
        setWeatherIconType('sun');
      } else if (h >= 17 && h < 20) {
        setWeatherTemp(29);
        setWeatherCondition('ئێوارەی فێنک');
        setWeatherIconType('cloudsun');
      } else {
        setWeatherTemp(22);
        setWeatherCondition('شەوی ئارام');
        setWeatherIconType('cloud');
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio chime generator
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.5, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playNote(659.25, now, 0.8); // E5
      playNote(880.0, now + 0.25, 1.2); // A5
    } catch (err) {
      console.warn('Audio chime blocked or unsupported', err);
    }
  };

  // Date Shift Helpers
  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Unique Doctors & Rooms for filter dropdowns
  const uniqueDoctors = Array.from(
    new Set(appointments.map((a) => a.doctorName).filter(Boolean))
  );
  const uniqueRooms = Array.from(
    new Set(appointments.map((a) => a.roomNumber).filter(Boolean))
  );

  // Filter Appointments by Selected Date, Search, Doctor, Room, Status
  const dateAppointments = appointments.filter((a) => {
    const matchDate = a.appointmentDate === selectedDate;
    if (!matchDate) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = (a.patientName || '').toLowerCase().includes(term);
      const matchPhone = (a.patientPhone || '').toLowerCase().includes(term);
      if (!matchName && !matchPhone) return false;
    }

    if (doctorFilter !== 'all' && a.doctorName !== doctorFilter) return false;
    if (roomFilter !== 'all' && a.roomNumber !== roomFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;

    return true;
  });

  // Sort appointments: In Room first, Waiting second, Completed third, Cancelled last
  const sortedAppointments = [...dateAppointments].sort((a, b) => {
    const statusPriority: Record<AppointmentStatus, number> = {
      'لە ژوورەوەیە': 1,
      'چاوەڕێ دەکات': 2,
      'بەڕێوەیە': 3,
      'تەواوبوو': 4,
      'هەڵوەشێنرایەوە': 5,
    };
    const pA = statusPriority[a.status] || 99;
    const pB = statusPriority[b.status] || 99;
    if (pA !== pB) return pA - pB;
    return a.appointmentTime.localeCompare(b.appointmentTime);
  });

  const totalCount = dateAppointments.length;
  const waitingCount = dateAppointments.filter(
    (a) => a.status === 'چاوەڕێ دەکات' || a.status === 'بەڕێوەیە'
  ).length;
  const inTherapyCount = dateAppointments.filter((a) => a.status === 'لە ژوورەوەیە').length;
  const completedCount = dateAppointments.filter((a) => a.status === 'تەواوبوو').length;

  const handleUpdateStatus = (id: number, newStatus: AppointmentStatus) => {
    if (onUpdateAppointmentStatus) {
      onUpdateAppointmentStatus(id, newStatus);
      if (newStatus === 'تەواوبوو' || newStatus === 'لە ژوورەوەیە') {
        playChime();
      }
    }
  };

  const handleToggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Error enabling full-screen mode:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Dynamic Grid sizing & card compactness based on total count
  let gridColsClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  let cardSizeClass = 'p-4 space-y-2';
  let titleSizeClass = 'text-lg font-black';

  if (totalCount >= 5 && totalCount <= 8) {
    gridColsClass = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
    cardSizeClass = 'p-3 space-y-1.5';
    titleSizeClass = 'text-base font-black';
  } else if (totalCount >= 9 && totalCount <= 14) {
    gridColsClass = 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5';
    cardSizeClass = 'p-2.5 space-y-1';
    titleSizeClass = 'text-sm font-bold';
  } else if (totalCount >= 15 && totalCount <= 24) {
    gridColsClass = 'grid-cols-4 sm:grid-cols-5 lg:grid-cols-6';
    cardSizeClass = 'p-2 space-y-1';
    titleSizeClass = 'text-xs font-bold';
  } else if (totalCount >= 25) {
    gridColsClass = 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-8';
    cardSizeClass = 'p-1.5 space-y-0.5';
    titleSizeClass = 'text-[11px] font-bold';
  }

  return (
    <div
      className={`w-full bg-transparent text-slate-100 flex flex-col justify-between p-4 md:p-6 relative overflow-hidden select-none font-sans dir-rtl ${
        isFullscreen
          ? 'fixed inset-0 z-[9999] h-screen w-screen overflow-hidden'
          : 'rounded-[32px] min-h-screen'
      }`}
    >
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* TOP HEADER: Broadcast Header */}
      <header className="relative z-10 flex flex-col lg:flex-row items-center justify-between pb-4 border-b border-white/10 gap-4 shrink-0">
        
        {/* Left: Classic Circular Analog & Digital Clock & Weather Widget */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-4 bg-white/[0.04] backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-3xl shadow-md">
            {/* Classic Circular Analog Clock */}
            <div className="relative w-12 h-12 rounded-full border-2 border-cyan-400/80 bg-slate-950/80 flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.3)]">
              <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 z-10"></div>
              {/* Hour hand */}
              <div
                className="absolute w-0.5 h-3 bg-white rounded-full origin-bottom bottom-6"
                style={{ transform: `rotate(${hoursAngle}deg)` }}
              ></div>
              {/* Minute hand */}
              <div
                className="absolute w-0.5 h-4.5 bg-cyan-300 rounded-full origin-bottom bottom-6"
                style={{ transform: `rotate(${minutesAngle}deg)` }}
              ></div>
              {/* Second hand */}
              <div
                className="absolute w-[1px] h-5 bg-rose-400 rounded-full origin-bottom bottom-6"
                style={{ transform: `rotate(${secondsAngle}deg)` }}
              ></div>
            </div>

            <div className="flex flex-col">
              <div className="text-xl font-black font-mono text-cyan-300 tracking-wider">
                {timeStr}
              </div>
              <div className="text-[11px] text-slate-200 font-bold flex items-center gap-1.5">
                <span className="text-cyan-400 font-black">{dayName}</span>
                <span>•</span>
                <span>{dateStr}</span>
              </div>
            </div>
          </div>

          {/* Weather Widget */}
          <div className="flex items-center gap-3 bg-white/[0.04] backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-3xl shadow-md">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              {weatherIconType === 'sun' && <Sun className="w-5 h-5 animate-spin" style={{ animationDuration: '15s' }} />}
              {weatherIconType === 'cloud' && <Cloud className="w-5 h-5 animate-pulse" />}
              {weatherIconType === 'cloudsun' && <CloudSun className="w-5 h-5 animate-bounce" />}
            </div>
            <div className="flex flex-col">
              <div className="text-base font-black text-amber-300 font-mono flex items-center gap-1">
                <span>{weatherTemp}°C</span>
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-[10px] text-slate-300 font-bold">
                {weatherCondition} (هەولێر)
              </div>
            </div>
          </div>
        </div>

        {/* Center: Glowing Animated Clinic Title */}
        <div className="flex flex-col items-center gap-1.5 relative cursor-pointer">
          <div className="relative flex items-center gap-3 bg-slate-950/60 backdrop-blur-xl border border-pink-500/50 px-6 py-2 rounded-full shadow-[0_0_25px_rgba(236,72,153,0.2)]">
            <div className="relative w-8 h-8 rounded-full bg-slate-900 border border-pink-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />
            </div>
            <h1 className="text-lg md:text-xl font-black bg-gradient-to-r from-white via-pink-200 to-fuchsia-300 bg-clip-text text-transparent tracking-wide">
              سەنتەری جوانکاری 
            </h1>
            <div className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/50 px-2.5 py-0.5 rounded-full">
              <Radio className="w-3 h-3 text-rose-400 animate-ping" />
              <span className="text-[10px] font-black text-rose-300">LIVE</span>
            </div>
          </div>

          {/* Date Switcher Pill Bar */}
          <div className="flex items-center gap-2 bg-white/[0.04] backdrop-blur-xl border border-white/10 px-3 py-1 rounded-2xl text-xs">
            <button
              onClick={() => handleShiftDate(-1)}
              className="text-slate-300 hover:text-white font-bold"
            >
              ◀ پێشوو
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className={`font-black ${isToday ? 'text-cyan-400' : 'text-slate-300'}`}
            >
              ئەمڕۆ ({selectedDate})
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-950/60 text-cyan-300 border border-white/10 rounded-lg px-2 py-0.5 text-xs font-mono outline-none"
            />
            <button
              onClick={() => handleShiftDate(1)}
              className="text-slate-300 hover:text-white font-bold"
            >
              دواتر ▶
            </button>
          </div>
        </div>

        {/* Right: Relaxing Music, Sound, Fullscreen, Filters */}
        <div className="flex items-center gap-2">
          {/* Relaxing Ambient Music Toggle Button */}
          <button
            onClick={toggleRelaxingMusic}
            className={`px-3 py-2.5 rounded-2xl border transition-all backdrop-blur-xl flex items-center gap-2 shadow-md cursor-pointer ${
              isMusicPlaying
                ? 'bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30 border-emerald-400/70 text-emerald-200 shadow-emerald-950/60 ring-1 ring-emerald-400/40'
                : 'bg-white/[0.04] hover:bg-white/10 border-white/10 text-slate-300'
            }`}
            title={isMusicPlaying ? 'کوژاندنەوەی موزیکی ئارامکەرەوە' : 'داگیرساندنی موزیکی ئارامکەرەوە (Relaxing Spa & Zen Music)'}
          >
            <Music className={`w-4 h-4 ${isMusicPlaying ? 'text-emerald-300 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-xs font-bold hidden sm:inline">
              {isMusicPlaying ? 'موزیک: چالاکە' : 'موزیکی ئارامی'}
            </span>
            {isMusicPlaying && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-2xl border transition-all backdrop-blur-xl cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-white/[0.04] border-white/10 text-rose-400'
            }`}
            title={soundEnabled ? 'دەنگی نۆتیفیکەیشن چالاکە' : 'دەنگی نۆتیفیکەیشن بێدەنگکراوە'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          <button
            onClick={handleToggleBrowserFullscreen}
            className="p-2.5 bg-white/[0.04] backdrop-blur-xl hover:bg-white/10 border border-white/10 rounded-2xl text-slate-300 transition-all"
            title="تەواوی شاشە"
          >
            <Maximize2 className="w-4 h-4 text-cyan-300" />
          </button>

          <button
            onClick={() => setIsControlPanelOpen(!isControlPanelOpen)}
            className={`px-3 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 border backdrop-blur-xl ${
              isControlPanelOpen
                ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                : 'bg-white/[0.04] text-cyan-300 border-cyan-500/30 hover:bg-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>پاڵاوگە</span>
          </button>

          {onCloseTvMode && (
            <button
              onClick={onCloseTvMode}
              className="p-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-2xl text-rose-200 transition-all backdrop-blur-xl"
              title="داخستن"
            >
              <X className="w-4 h-4 text-rose-300" />
            </button>
          )}
        </div>
      </header>

      {/* FILTER DRAWER */}
      {isControlPanelOpen && (
        <div className="my-2 p-3 bg-slate-950/90 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl space-y-3 animate-in slide-in-from-top-2 shrink-0 shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-bold">گەڕان:</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ناو یان کۆد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl pr-8 pl-3 py-1.5 text-white outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2" />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-bold">پزیشک:</label>
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl p-1.5 text-white outline-none"
              >
                <option value="all">سەرجەم پزیشکەکان</option>
                {uniqueDoctors.map((doc) => (
                  <option key={doc} value={doc}>{doc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-bold">ژوور:</label>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl p-1.5 text-white outline-none"
              >
                <option value="all">سەرجەم ژوورەکان</option>
                {uniqueRooms.map((rm) => (
                  <option key={rm} value={rm}>{rm}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-bold">دۆخ:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl p-1.5 text-white outline-none"
              >
                <option value="all">سەرجەم دۆخەکان</option>
                <option value="چاوەڕێ دەکات">چاوەڕێ دەکات</option>
                <option value="لە ژوورەوەیە">لە ژوورەوەیە</option>
                <option value="تەواوبوو">تەواوبوو</option>
              </select>
            </div>
          </div>

          {/* Ambient Relaxing Music Settings Bar */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300">
                <Music className="w-4 h-4" />
              </span>
              <span className="font-bold text-white">موزیکی ئارامکەرەوە و هێورکەرەوە (Zen Background Music):</span>
              <span className={`text-[11px] font-bold ${isMusicPlaying ? 'text-emerald-400' : 'text-slate-400'}`}>
                {isMusicPlaying ? 'داگیرساوە 🎵' : 'کوژاوەتەوە 🔇'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleRelaxingMusic}
                className={`px-3 py-1 rounded-xl font-bold transition-all border cursor-pointer ${
                  isMusicPlaying
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
                {isMusicPlaying ? 'کوژاندنەوەی موزیک' : 'داگیرساندنی موزیک'}
              </button>

              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-xl border border-white/10">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-bold text-slate-300">دەنگ:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
                  className="w-20 accent-cyan-400 cursor-pointer"
                />
                <span className="text-[10px] font-mono font-bold text-cyan-300 min-w-[28px]">
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PATIENTS GRID */}
      <div className="flex-1 my-3 overflow-y-auto flex flex-col justify-center">
        {sortedAppointments.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.02] backdrop-blur-xl border border-dashed border-white/15 rounded-3xl space-y-2">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-200">هیچ مەوعیدێک لەم بەروارەدا نییە.</h3>
          </div>
        ) : (
          <div className={`grid ${gridColsClass} gap-2.5 items-stretch`}>
            {sortedAppointments.map((app, idx) => {
              const isCompleted = app.status === 'تەواوبوو';
              const isInTherapy = app.status === 'لە ژوورەوەیە';

              return (
                <div
                  key={app.id}
                  className={`rounded-2xl border transition-all flex flex-col justify-between ${cardSizeClass} bg-white/[0.02] backdrop-blur-md border-white/10 hover:border-cyan-500/40 shadow-sm`}
                >
                  <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/5">
                    <span className="w-5 h-5 rounded bg-cyan-500/20 font-mono font-black text-cyan-300 text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    {isCompleted ? (
                      <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" /> تەواو
                      </span>
                    ) : isInTherapy ? (
                      <span className="text-purple-300 text-[10px] font-bold flex items-center gap-0.5 animate-pulse">
                        <Stethoscope className="w-3 h-3" /> لە ژوورەوە
                      </span>
                    ) : (
                      <span className="text-amber-300 text-[10px]">⏳ چاوەڕێ</span>
                    )}
                  </div>

                  <div className="my-1">
                    <h3 className={`${titleSizeClass} text-white tracking-tight truncate font-black`}>
                      {app.patientName}
                    </h3>
                  </div>

                  <div className="pt-1 border-t border-white/5 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'لە ژوورەوەیە')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                        isInTherapy ? 'bg-purple-600 text-white border-purple-400' : 'bg-white/5 text-slate-300 border-white/10'
                      }`}
                    >
                      🩺 ژوور
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'تەواوبوو')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-0.5 ${
                        isCompleted ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5" /> تەواو
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TICKER BANNER */}
      <footer className="relative z-10 bg-white/[0.04] backdrop-blur-2xl border border-white/15 p-2.5 rounded-2xl flex items-center justify-between text-xs text-slate-200 shrink-0 shadow-md">
        <div className="flex items-center gap-2 flex-1 overflow-hidden relative group">
          <span className="px-2 py-0.5 bg-cyan-400 text-slate-950 font-black rounded-xl uppercase text-[10px] shrink-0 flex items-center gap-1 z-10">
            <Megaphone className="w-3 h-3 text-slate-950" /> ڕاگەیاندن
          </span>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <div className="animate-marquee inline-block font-semibold text-white text-xs">
              {announcementText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {announcementText}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setTempTickerText(announcementText);
            setIsEditingTicker(true);
          }}
          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-xl text-cyan-300 font-bold text-[11px] flex items-center gap-1 shrink-0 backdrop-blur-md"
        >
          <Edit3 className="w-3 h-3" />
          <span>دەستکاری</span>
        </button>
      </footer>

      {/* Edit Modal */}
      {isEditingTicker && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-md text-right">
            <h3 className="text-lg font-black text-white">دەستکاری پەیامی جوڵاو</h3>
            <textarea
              rows={3}
              value={tempTickerText}
              onChange={(e) => setTempTickerText(e.target.value)}
              className="w-full bg-slate-950 border border-white/15 rounded-2xl p-3 text-xs text-white outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditingTicker(false)}
                className="px-4 py-2 bg-white/5 text-slate-300 rounded-xl text-xs font-bold"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={() => {
                  setAnnouncementText(tempTickerText);
                  setIsEditingTicker(false);
                }}
                className="px-5 py-2 bg-cyan-400 text-slate-950 rounded-xl text-xs font-black shadow-md"
              >
                پاشەکەوتکردن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

