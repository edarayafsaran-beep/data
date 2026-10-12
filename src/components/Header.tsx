import React from 'react';
import { User, Branch } from '../types';
import { useNotification } from '../context/NotificationContext';
import {
  Activity,
  Tv,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Sparkles,
  Search,
  Globe,
  Maximize2,
  Zap,
  Flame,
  Heart,
  LogOut,
  Droplets,
  Volume2,
  VolumeX,
  QrCode,
  Gem,
  Wifi,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  onOpenTvMode: () => void;
  onOpenQrScanner?: () => void;
  onOpenOfflineModal: () => void;
  onOpenTourGuide: () => void;
  activeTab: string;
  onOpenCommandPalette: () => void;
  onLogout: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  financialYears?: string[];
  activeFinancialYear?: string;
  onSelectFinancialYear?: (year: string) => void;
  branches: Branch[];
  activeBranchId: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onOpenTvMode,
  onOpenQrScanner,
  onOpenOfflineModal,
  onOpenTourGuide,
  onOpenCommandPalette,
  onLogout,
  onToggleMobileMenu,
  isMobileMenuOpen,
  financialYears = ['2025', '2026'],
  activeFinancialYear = '2026',
  onSelectFinancialYear,
  branches,
  activeBranchId,
}) => {
  const activeBranch = branches.find(b => b.id === activeBranchId);
  const branchName = activeBranch ? activeBranch.name : 'سەنتەری جوانکاری';
  const [showRoleDropdown, setShowRoleDropdown] = React.useState(false);
  const [showYearDropdown, setShowYearDropdown] = React.useState(false);
  const yearDropdownRef = React.useRef<HTMLDivElement>(null);
  const [currentLang, setCurrentLang] = React.useState<'KU' | 'EN'>('KU');
  const { isMuted, toggleMute } = useNotification();

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <header className="relative z-30 w-full h-20 md:h-24 bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-2xl border-b-2 border-pink-500/40 rounded-b-2xl md:rounded-b-[36px] flex items-center justify-between px-2.5 sm:px-4 md:px-8 shadow-[0_15px_40px_rgba(236,72,153,0.2)] ring-1 ring-white/10">
      {/* Background ambient neon glow flares */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-r from-pink-500/15 via-fuchsia-400/20 to-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-80"></div>

      {/* Right Side: Beauty Center Brand Identity & Mobile Hamburger Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 md:w-1/3 justify-start min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-pink-300 transition-all cursor-pointer shrink-0"
            title="مێنۆی سەرەکی"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-pink-400" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <div className="flex flex-col select-none min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-pink-400 shadow-[0_0_12px_#f472b6] animate-pulse shrink-0"></span>
            <h1 className="text-base sm:text-lg md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-fuchsia-200 to-white tracking-widest font-sans drop-shadow-[0_0_15px_rgba(244,114,182,0.4)] truncate italic">
              {branchName}
            </h1>
          </div>
          <p className="hidden sm:flex text-[9px] md:text-[11px] font-extrabold text-pink-300/90 tracking-widest uppercase items-center gap-1 mt-0.5 mr-3 font-mono truncate">
            <Sparkles className="w-3 h-3 text-pink-400 animate-spin shrink-0" />
            <span>Aesthetic & Laser Center</span>
          </p>
        </div>
      </div>

      {/* Center: SPECTACULAR 3D ORBITING AESTHETIC LOGO CORE */}
      <div className="relative cursor-pointer group flex items-center justify-center py-1 sm:py-2 shrink-0">
        {/* Ambient Outer Glow */}
        <div className="absolute -inset-4 sm:-inset-8 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-400 to-purple-600 opacity-60 sm:opacity-75 blur-xl sm:blur-2xl group-hover:opacity-100 transition duration-700"></div>

        {/* Outer Orbit Ring 1 - Visible on md+ screens */}
        <div className="hidden md:flex absolute w-28 h-28 rounded-full border border-pink-400/30 animate-[spin_12s_linear_infinite] items-center justify-center pointer-events-none">
          {/* Orbiting Gem Top */}
          <div className="absolute -top-3 p-1.5 bg-slate-950 border border-pink-400/60 rounded-full text-pink-300 shadow-[0_0_10px_#f472b6] transform -rotate-12">
            <Gem className="w-3.5 h-3.5" />
          </div>
          {/* Orbiting Heart Bottom */}
          <div className="absolute -bottom-3 p-1.5 bg-slate-950 border border-fuchsia-400/60 rounded-full text-fuchsia-300 shadow-[0_0_10px_#d946ef] transform rotate-12">
            <Heart className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Outer Orbit Ring 2 - Visible on md+ screens */}
        <div className="hidden md:flex absolute w-24 h-24 rounded-full border border-dashed border-fuchsia-300/50 animate-[spin_16s_linear_infinite_reverse] items-center justify-center pointer-events-none">
          <div className="absolute -right-2 p-1.5 bg-slate-950 border border-pink-300/60 rounded-full text-pink-300 shadow-[0_0_10px_#f472b6]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="absolute -left-2 p-1.5 bg-slate-950 border border-purple-400/60 rounded-full text-purple-300 shadow-[0_0_10px_#c084fc]">
            <Droplets className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Central 3D Holographic Sphere Core - scaled for phone/tablet/desktop */}
        <div className="relative z-10 w-11 h-11 sm:w-14 sm:h-14 md:w-18 md:h-18 rounded-full bg-gradient-to-b from-slate-900 via-purple-950 to-pink-950 flex items-center justify-center border-2 border-pink-300 shadow-[0_0_25px_rgba(236,72,153,0.8),inset_0_0_15px_rgba(244,114,182,0.6)] backdrop-blur-3xl transform group-hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-1 rounded-full bg-pink-500/10 border border-pink-400/30 animate-pulse"></div>

          {/* Central Pulsing Gem / Sparkle Icon */}
          <div className="relative z-10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-pink-200 drop-shadow-[0_0_15px_#f472b6] animate-pulse" />
          </div>

          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-pink-400 border-2 border-slate-950 shadow-[0_0_12px_#f472b6] animate-ping"></div>
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-fuchsia-400 border-2 border-slate-950 shadow-[0_0_12px_#d946ef]"></div>
        </div>
      </div>

      {/* Left Controls & Responsive Profile Selector */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-2 md:gap-3 flex-1 md:w-1/3 relative shrink-0">
        {/* Audio Sound Mute/Unmute Toggle Button */}
        {/* Financial Year Selector Dropdown */}
        <div className="relative" ref={yearDropdownRef}>
          <button
            onClick={() => setShowYearDropdown(!showYearDropdown)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-950 via-teal-950/40 to-slate-950 hover:from-teal-900/30 hover:to-slate-900 border-2 border-teal-400/40 hover:border-teal-400 rounded-2xl text-teal-300 text-xs font-black transition-all duration-300 hover:-translate-y-0.5 shadow-[0_0_15px_rgba(20,184,166,0.2)] hover:shadow-[0_0_20px_rgba(20,184,166,0.35)] cursor-pointer group select-none"
            title="گۆڕینی ساڵی دارایی"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf] animate-pulse"></span>
            <span className="text-[10px] text-slate-400 hidden sm:inline font-bold">ساڵی دارایی:</span>
            <span className="font-mono text-teal-200 font-black px-1.5 py-0.5 rounded-lg bg-teal-500/20 border border-teal-400/30">
              {activeFinancialYear}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-teal-400 transition-transform duration-300 ${showYearDropdown ? 'rotate-180 text-teal-200' : ''}`} />
          </button>

          {showYearDropdown && (
            <div className="absolute left-0 mt-2 w-48 bg-slate-950/95 border-2 border-teal-400/50 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(20,184,166,0.2)] p-2 z-[999] backdrop-blur-2xl animate-in fade-in zoom-in-95 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 border-b border-white/10 flex items-center justify-between">
                <span>ساڵە داراییەکانی کلینیک</span>
                <Sparkles className="w-3 h-3 text-teal-400" />
              </div>
              {financialYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => {
                    if (onSelectFinancialYear) onSelectFinancialYear(yr);
                    setShowYearDropdown(false);
                  }}
                  className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between cursor-pointer ${
                    yr === activeFinancialYear
                      ? 'bg-gradient-to-r from-teal-500/25 to-emerald-500/20 text-teal-200 border border-teal-500/40 shadow-sm'
                      : 'hover:bg-white/[0.08] text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="font-mono font-black">{yr}</span>
                  {yr === activeFinancialYear && (
                    <span className="flex items-center gap-1 text-[10px] text-teal-300 font-bold">
                      <span>چالاکە</span>
                      <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]"></span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={toggleMute}
          className={`p-1.5 sm:p-2 border rounded-xl sm:rounded-2xl text-xs font-bold transition-all hover:-translate-y-0.5 shadow-md flex items-center gap-1 cursor-pointer ${
            isMuted
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              : 'bg-teal-500/10 border-teal-500/40 text-teal-300'
          }`}
          title={isMuted ? 'چالاککردنی دەنگ' : 'بێدەنگکردنی دەنگ'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />}
        </button>

        {onOpenQrScanner && (
          <button
            onClick={onOpenQrScanner}
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 bg-pink-500/10 hover:bg-pink-500/25 border border-pink-400/40 rounded-xl text-pink-300 text-[11px] font-bold transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer shrink-0"
            title="سکانکردنی QR / Barcode"
          >
            <QrCode className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">QR</span>
          </button>
        )}

        <button
          onClick={onOpenCommandPalette}
          className="hidden lg:flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 hover:border-white/25 rounded-2xl text-slate-300 text-xs font-bold transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
          title="گەڕان (Cmd + K)"
        >
          <Search className="w-4 h-4 text-pink-400" />
          <span>گەڕان</span>
        </button>

        <button
          onClick={onOpenTvMode}
          className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white/5 border border-white/10 hover:border-white/25 rounded-xl sm:rounded-2xl text-teal-300 text-xs font-bold transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
          title="شاشەی TV"
        >
          <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />
          <span className="hidden md:inline">TV</span>
        </button>

        <button
          onClick={onOpenTourGuide}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-2xl text-pink-300 text-xs font-bold transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
          title="ڕێنشاندەری سیستەم (Tour Guide)"
        >
          <HelpCircle className="w-4 h-4 text-pink-400" />
          <span>ڕێبەر</span>
        </button>

        <button
          onClick={onOpenOfflineModal}
          className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-xl sm:rounded-2xl text-teal-300 text-xs font-bold transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
          title="کارکردن بێ ئینتەرنێت (Offline PWA)"
        >
          <Wifi className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />
          <span className="hidden md:inline">بێ ئینتەرنێت</span>
        </button>

        <button
          onClick={() => setCurrentLang(currentLang === 'KU' ? 'EN' : 'KU')}
          className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl sm:rounded-2xl text-xs text-slate-300 font-mono font-bold flex items-center gap-1 hover:-translate-y-0.5 transition-all shadow-sm cursor-pointer"
          title="گۆڕینی زمان"
        >
          <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
          <span>{currentLang}</span>
        </button>
      </div>
    </header>
  );
};


