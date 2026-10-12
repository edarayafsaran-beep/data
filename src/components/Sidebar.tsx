import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Tv,
  Users,
  CalendarCheck2,
  DollarSign,
  UserCog,
  Settings,
  Package,
  TrendingUp,
  Award,
  ShieldCheck,
  LogOut,
  MapPin,
  Building2,
  ChevronDown,
  Check,
  Sparkles,
  Wallet,
  Camera,
} from 'lucide-react';
import { User, Branch } from '../types';
import { hasTabAccess } from '../utils/permissions';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  pendingQueueCount: number;
  onLogout: () => void;
  branches: Branch[];
  activeBranchId: number | null;
  onBranchChange: (id: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  pendingQueueCount,
  onLogout,
  branches,
  activeBranchId,
  onBranchChange,
}) => {
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const userRole = currentUser.role;
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'داشبۆڕدی جوانکاری',
      icon: LayoutDashboard,
    },
    {
      id: 'patients',
      label: 'پڕۆفایلی چارەخوازان',
      icon: Users,
    },
    {
      id: 'appointments_whatsapp',
      label: 'مەوعیدەکان و وەتس ئەپ',
      icon: CalendarCheck2,
    },
    {
      id: 'crm_packages',
      label: 'پاکێجەکان و CRM',
      icon: Award,
    },
    {
      id: 'inventory',
      label: 'عەمباری جوانکاری',
      icon: Package,
    },
    {
      id: 'bi_analytics',
      label: 'ئامار و گەشە (BI)',
      icon: TrendingUp,
    },
    {
      id: 'tv_board',
      label: 'شاشەی هۆڵ (TV Board)',
      icon: Tv,
      badge: pendingQueueCount > 0 ? `${pendingQueueCount}` : 'LIVE',
      badgeColor: 'bg-pink-500/20 text-pink-300',
    },
    {
      id: 'financials',
      label: 'دارایی و حیسابات',
      icon: DollarSign,
    },
    {
      id: 'staff_sales_rewards',
      label: 'فرۆشتن و پاداشتی کارمەندان',
      icon: Sparkles,
      badge: 'لق',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    {
      id: 'monthly_financial_cards',
      label: 'کارتەکانی حیساباتی مانگانە',
      icon: Wallet,
      badge: 'نوێ',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'doctors',
      label: 'پزیشکان و شارەزایان',
      icon: UserCog,
    },
    {
      id: 'staff_attendance',
      label: 'هاتن و چوون (کامێرای دەموچاو)',
      icon: Camera,
      badge: 'LIVE AI',
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
    },

    {
      id: 'consolidated_branches',
      label: 'حیساباتی هەموو لقەکان',
      icon: Building2,
    },
    {
      id: 'audit_security',
      label: 'ئاسایش و لۆگ',
      icon: ShieldCheck,
    },
    {
      id: 'settings',
      label: 'ڕێکخستنەکان',
      icon: Settings,
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => hasTabAccess(currentUser, item.id));

  return (
    <aside className="w-64 bg-transparent border-0 flex flex-col p-4 md:p-5 h-[calc(100vh-80px)] shrink-0 select-none">
      {/* Branch Selector (Custom Luxury Cosmic Dropdown) */}
      <div className="mb-6 space-y-2 relative" ref={branchDropdownRef}>
        <div className="flex items-center justify-between px-3 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f3ff] animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">لق (BRANCH)</span>
          </div>
          <span className="text-[9px] font-mono font-bold text-slate-500">
            {branches.length} لقی چالاک
          </span>
        </div>

        {currentUser.role === 'super_admin' ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-2 border-cyan-400/40 hover:border-cyan-400 rounded-2xl px-3.5 py-2.5 text-xs font-black text-white flex items-center justify-between shadow-[0_0_20px_rgba(0,243,255,0.15)] transition-all duration-300 cursor-pointer group hover:shadow-[0_0_25px_rgba(0,243,255,0.3)] select-none"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 group-hover:scale-105 transition-transform">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="truncate text-white text-xs font-bold tracking-tight">
                  {activeBranch?.name || 'لقی سەرەکی'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform duration-300 ${isBranchDropdownOpen ? 'rotate-180 text-cyan-200' : ''}`} />
            </button>

            {/* Custom Dropdown Menu */}
            {isBranchDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 border-2 border-cyan-400/50 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(0,243,255,0.2)] p-2 z-[999] backdrop-blur-2xl animate-in fade-in zoom-in-95 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 border-b border-white/10 flex items-center justify-between">
                  <span>هەڵبژاردنی لقی سیستەم</span>
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                </div>
                {branches.map(branch => {
                  const isSelected = branch.id === (activeBranchId || activeBranch?.id);
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => {
                        onBranchChange(branch.id);
                        setIsBranchDropdownOpen(false);
                      }}
                      className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/20 text-cyan-200 border border-cyan-400/50 shadow-sm'
                          : 'hover:bg-white/[0.08] text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span className="truncate">{branch.name}</span>
                      </div>
                      {isSelected && (
                        <div className="p-0.5 rounded-full bg-cyan-400 text-slate-950">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full bg-gradient-to-r from-slate-950 to-slate-900 border border-cyan-400/30 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-cyan-300 flex items-center gap-2.5 shadow-sm">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>{activeBranch?.name || 'لقی سەرەکی'}</span>
          </div>
        )}
      </div>

      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-4 flex items-center justify-between">
        <span>بەشەکان</span>
      </div>

      <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group cursor-pointer p-3 rounded-2xl flex items-center justify-between text-right border relative overflow-hidden ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                  : 'bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-400"></div>
              )}
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl border ${
                    isActive
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                      : 'bg-white/5 border-white/10 text-slate-400 group-hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold tracking-wide">{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Active User Role Badge Card & Logout */}
      <div className="mt-auto p-4 rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase font-bold text-slate-400">دەسەڵات</span>
          <span className="text-[9px] px-2.5 py-0.5 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-full font-bold">
            {currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.role}
          </span>
        </div>
        <div>
          <p className="text-xs font-black text-white truncate">{currentUser.name}</p>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>چوونە دەرەوە</span>
        </button>
      </div>
    </aside>
  );
};
