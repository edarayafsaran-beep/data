import React, { useState } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Activity,
  Tv,
  Megaphone,
  UserPlus,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  Stethoscope,
  Printer,
  Sparkles,
  Filter,
} from 'lucide-react';
import { Appointment, ClinicStats, User, Patient, UserRole } from '../types';
import { PrintableMedicalDocumentModal } from './PrintableMedicalDocumentModal';
import { PhysicalTherapyGraphic } from './PhysicalTherapyGraphic';
import { TodayAppointmentsDispatchBoard } from './TodayAppointmentsDispatchBoard';
import { AestheticConsultationBoard } from './AestheticConsultationBoard';

interface DashboardViewProps {
  stats: ClinicStats;
  todayAppointments: Appointment[];
  currentUser: User;
  patients: Patient[];
  doctors?: User[];
  onOpenTvMode: () => void;
  onNavigateTab: (tab: string) => void;
  onUpdateAppointmentStatus: (id: number, status: any) => void;
  onOpenNewAppointment: () => void;
  onOpenNewPatient: () => void;
  canViewTotal?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  todayAppointments,
  currentUser,
  patients,
  doctors = [],
  onOpenTvMode,
  onNavigateTab,
  onUpdateAppointmentStatus,
  onOpenNewAppointment,
  onOpenNewPatient,
  canViewTotal = true,
}) => {
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole>(currentUser.role || 'super_admin');
  const [showPrintDashboardModal, setShowPrintDashboardModal] = useState(false);
  const [drillDownType, setDrillDownType] = useState<'today_patients' | 'total_patients' | 'net_profit' | 'whatsapp_stats' | 'doctor_salaries' | null>(null);

  const waitingCount = todayAppointments.filter((a) => a.status === 'چاوەڕێ دەکات').length;
  const inSessionCount = todayAppointments.filter((a) => a.status === 'لە ژوورەوەیە').length;
  const completedCount = todayAppointments.filter((a) => a.status === 'تەواوبوو').length;

  const staffDoctorsList = doctors.filter((u) => u.role === 'doctor' || u.role === 'super_admin' || (u as any).salary);
  const totalDoctorSalariesSum = staffDoctorsList.reduce((acc, d) => acc + (Number((d as any).salary) || 0), 0);

  const handlePrintTopic = (_topic: string) => {
    setShowPrintDashboardModal(true);
  };

  const getRoleTitle = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'سەرپەرشتیاری گشتی (Super Admin)';
      case 'doctor':
        return 'پزیشکی پسپۆڕ (Doctor EMR)';
      case 'receptionist':
        return 'ڕێپێدان و سکرتاریەت (Receptionist)';
      case 'accountant':
        return 'ژمێریار و بەڕێوەبەری دارایی (Accountant)';
      case 'manager':
        return 'بەڕێوەبەری سەرەکی (Manager)';
      default:
        return 'کارمەندی کلینیک';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Hero Banner & Quick Actions */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-white/10 p-5 md:p-6 shadow-md backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 border border-pink-500/40 text-pink-300 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm font-sans">
                <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" /> BEAUTY CENTER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {getRoleTitle(selectedRoleFilter)}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              بەخێربێیت، {currentUser.name}
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={() => onNavigateTab('monthly_financial_cards')}
              className="flex-1 lg:flex-none px-3.5 py-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 rounded-xl text-xs font-black text-slate-950 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>کارتەکانی حیساباتی مانگانە</span>
            </button>
            <button
              onClick={() => handlePrintTopic('کۆی داشبۆرد و ئامارەکان')}
              className="flex-1 lg:flex-none px-3.5 py-2.5 bg-slate-950/80 hover:bg-slate-900 border border-amber-400/30 hover:border-amber-400/60 rounded-xl text-xs font-bold text-amber-200 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_12px_rgba(251,191,36,0.15)] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>چاپکردن</span>
            </button>
            <button
              onClick={onOpenNewPatient}
              className="flex-1 lg:flex-none px-4 py-2.5 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 hover:from-cyan-950/60 hover:to-slate-900 border border-cyan-400/40 hover:border-cyan-400 rounded-xl text-xs font-bold text-cyan-200 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(0,243,255,0.15)] hover:shadow-[0_0_20px_rgba(0,243,255,0.3)] cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-300" />
              <span>تۆماری چارەخواز</span>
            </button>
            <button
              onClick={onOpenNewAppointment}
              className="flex-1 lg:flex-none px-5 py-2.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:brightness-110 rounded-xl text-xs font-black text-slate-950 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:shadow-[0_0_25px_rgba(0,243,255,0.6)] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>دیاریکردنی مەوعید</span>
            </button>
          </div>
        </div>

        {/* Role-tailored Dashboard Guidance Badge */}
        {currentUser.role === 'super_admin' && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>پیشاندانی دیمەنی داشبۆڕد بەپێی ڕۆڵی دیاریکراو (Role Simulator):</span>
            </span>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(['super_admin', 'doctor', 'receptionist', 'accountant', 'manager'] as UserRole[]).map((rl) => (
                <button
                  key={rl}
                  onClick={() => setSelectedRoleFilter(rl)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    selectedRoleFilter === rl
                      ? 'bg-amber-400 text-slate-950 shadow font-black'
                      : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {rl === 'super_admin' && 'سوپەر ئەدمین'}
                  {rl === 'doctor' && 'پزیشک'}
                  {rl === 'receptionist' && 'ڕێپێدان'}
                  {rl === 'accountant' && 'ژمێریار'}
                  {rl === 'manager' && 'بەڕێوەبەر'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Key Stat Cards (Clickable for Detailed Statistics) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {/* Card 1: Patients & Queue Today */}
        <div
          onClick={() => setDrillDownType('today_patients')}
          className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-white/10 shadow-md relative overflow-hidden group hover:border-cyan-500/60 transition-all flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">چارەخوازانی ئەمڕۆ (Today)</span>
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-3xl font-black text-white">{todayAppointments.length}</span>
              <span className="text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                ئەمڕۆ (کلیک بۆ وردەکاری)
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
              <span>لەژوورەوە: <strong className="text-cyan-300 font-bold">{inSessionCount}</strong></span>
              <span>چاوەڕێ: <strong className="text-amber-300 font-bold">{waitingCount}</strong></span>
              <span>تەواوبوو: <strong className="text-sky-300 font-bold">{completedCount}</strong></span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrintTopic('چارەخوازانی ئەمڕۆ و نۆرەکان');
              }}
              className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 text-amber-300 border border-amber-400/30 hover:border-amber-400/60 rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-sm hover:shadow-[0_0_12px_rgba(251,191,36,0.2)] transition-all cursor-pointer select-none"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" /> چاپکردن
            </button>
            <span className="text-cyan-400 font-bold text-[11px] flex items-center gap-1 group-hover:underline">
              <span>بینینی وردەکاری</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Master Patient Directory */}
        <div
          onClick={() => setDrillDownType('total_patients')}
          className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-white/10 shadow-md relative overflow-hidden group hover:border-blue-500/60 transition-all flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">کۆی چارەخوازان (Clients)</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-3xl font-black text-white">{patients.length}</span>
              <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                تۆمارکراو (کلیک بۆ وردەکاری)
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
              <span>مانگانە: <strong className="text-blue-300 font-bold">{stats.monthPatients}</strong></span>
              <span>هەفتانە: <strong className="text-slate-200 font-bold">{stats.weekPatients}</strong></span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrintTopic('تۆماری سەرجەم چارەخوازان');
              }}
              className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 text-amber-300 border border-amber-400/30 hover:border-amber-400/60 rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-sm hover:shadow-[0_0_12px_rgba(251,191,36,0.2)] transition-all cursor-pointer select-none"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" /> چاپکردن
            </button>
            <span className="text-blue-400 font-bold text-[11px] flex items-center gap-1 group-hover:underline">
              <span>بینینی وردەکاری</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Financial Net Profit or Masked */}
        {canViewTotal ? (
          <div
            onClick={() => setDrillDownType('net_profit')}
            className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-white/10 shadow-md relative overflow-hidden group hover:border-sky-500/60 transition-all flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">پوختەی قازانج (Net Revenue)</span>
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-2xl md:text-3xl font-black text-cyan-300">
                  {(stats.netProfit / 1000).toLocaleString('en-US')}K
                </span>
                <span className="text-xs text-slate-400 font-bold">د.ع (کلیک بۆ وردەکاری)</span>
              </div>
              <p className="text-[11px] text-cyan-400/90 mt-3 flex items-center justify-between">
                <span>داهاتی مانگ بەبێ مەسروف</span>
                <span className="flex items-center gap-0.5 font-bold">
                  {stats.totalRevenue > 0 ? (
                    <><TrendingUp className="w-3 h-3 text-cyan-400" /> ئەرێنی</>
                  ) : (
                    <span className="text-slate-400">سفر (بێ تۆمار)</span>
                  )}
                </span>
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrintTopic('ڕاپۆرتی دارایی و حیسابات');
                }}
                className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 text-amber-300 border border-amber-400/30 hover:border-amber-400/60 rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-sm hover:shadow-[0_0_12px_rgba(251,191,36,0.2)] transition-all cursor-pointer select-none"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" /> چاپکردن
              </button>
              <span className="text-sky-400 font-bold text-[11px] flex items-center gap-1 group-hover:underline">
                <span>بینینی وردەکاری</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-white/10 shadow-md relative overflow-hidden group hover:border-amber-500/60 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">داهات و قازانجی کلینیک</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-xl font-black text-amber-300">******* (شاراوەیە)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                تۆ دەسەڵاتی بینینی کۆی گشتی دارایی و داھاتت نییە.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
              <span>پاراستنی زانیارییەکان</span>
              <span>🔒 قفڵکراو</span>
            </div>
          </div>
        )}

        {/* Card 4: WhatsApp Bot Status */}
        <div
          onClick={() => setDrillDownType('whatsapp_stats')}
          className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-white/10 shadow-md relative overflow-hidden group hover:border-cyan-500/60 transition-all flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">سیستەمی وەتس ئەپ</span>
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-2xl font-black text-white">چالاکە (کلیک بۆ وردەکاری)</span>
              <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.8)] animate-pulse"></div>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
              <span>ئاگاداری ۱ ڕۆژ + ڕۆژی مەوعید:</span>
              <span className="text-cyan-300 font-bold font-mono">100% خۆکار</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrintTopic('ئۆتۆمۆیشی وەتس ئەپ');
              }}
              className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 text-amber-300 border border-amber-400/30 hover:border-amber-400/60 rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-sm hover:shadow-[0_0_12px_rgba(251,191,36,0.2)] transition-all cursor-pointer select-none"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" /> چاپکردن
            </button>
            <span className="text-cyan-400 font-bold text-[11px] flex items-center gap-1 group-hover:underline">
              <span>بینینی وردەکاری</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </section>

      {/* Featured Beauty & Aesthetic Interactive Graphic */}
      <PhysicalTherapyGraphic />

      {/* Aesthetic Consultation, Fitzpatrick Analyzer & Injectables Suite */}
      <AestheticConsultationBoard />

      {/* Today & Tomorrow Appointments 1-Click TV Dispatch Board */}
      <TodayAppointmentsDispatchBoard
        appointments={todayAppointments}
        onUpdateAppointmentStatus={onUpdateAppointmentStatus}
        onOpenTvMode={onOpenTvMode}
        onOpenNewAppointment={onOpenNewAppointment}
      />

      {/* Secondary Panels & AI Ad Studio */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: AI Ad Studio */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[32px] border border-white/10 flex flex-col justify-between shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Megaphone className="w-4 h-4" /> پانێڵی مارکێتینگی زیرەک
              </span>
              <span className="text-[10px] bg-blue-500/20 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                سیستەمی هوشیار
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              بە یەک کلیک پۆست و دەقی ڕێکڵام بە زمانی کوردی (سۆرانی) بەرهەم بهێنە بۆ فەیسبووک و ئینستاگرام و وەتس ئەپی سەنتەری جوانکاری.
            </p>

            <button
              onClick={() => onNavigateTab('marketing')}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 hover:brightness-110 rounded-2xl font-black text-xs text-slate-950 uppercase tracking-widest shadow-md shadow-cyan-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>دروستکردنی دەقی مارکێتینگ</span>
              <ArrowUpRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>

          <div
            onClick={() => setDrillDownType('doctor_salaries')}
            className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[32px] border border-white/10 shadow-md cursor-pointer hover:border-cyan-500/50 transition-all group"
          >
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-cyan-400" /> موچەی پزیشک و کارمەندان
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrintTopic('موچەی پزیشک و کارمەندان');
                  }}
                  className="text-[11px] text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> چاپکردن
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateTab('doctors');
                  }}
                  className="text-[11px] text-cyan-400 hover:underline font-bold cursor-pointer"
                >
                  بینینی هەمووی
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {staffDoctorsList.length > 0 ? (
                staffDoctorsList.slice(0, 4).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium">
                      {doc.name} {doc.role === 'super_admin' ? '(بەڕێوەبەر)' : '(پزیشک)'}
                    </span>
                    <span className="font-mono font-bold text-cyan-300">
                      {(Number((doc as any).salary) || 0).toLocaleString()} د.ع
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-3 text-slate-400 text-xs">
                  هیچ مووچەیەکی تۆمارکراو نییە (سفر د.ع)
                </div>
              )}
              <div className="w-full h-px bg-white/10 my-2"></div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-200">کۆی موچەکان (لە قازانج دەردەکرێت)</span>
                <span className="text-sky-300 font-mono text-sm">
                  {totalDoctorSalariesSum.toLocaleString()} د.ع
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Drill-Down Statistics Modal */}
      {drillDownType && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-[32px] w-full max-w-4xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {drillDownType === 'today_patients' && 'وردەکاری ئاماری چارەخوازانی ئەمڕۆ'}
                    {drillDownType === 'total_patients' && 'وردەکاری سەرجەم چارەخوازە تۆمارکراوەکان'}
                    {drillDownType === 'net_profit' && 'وردەکاری ڕاپۆرتی دارایی و قازانجی کلینیک'}
                    {drillDownType === 'whatsapp_stats' && 'وردەکاری سیستەمی ئۆتۆمۆیشنی وەتس ئەپ'}
                  </h3>
                  <p className="text-xs text-slate-400">ڕاپۆرتی ورد و داتای ڕاستەقینەی بەستراو بەم ئامارە</p>
                </div>
              </div>

              <button
                onClick={() => setDrillDownType(null)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Based on drillDownType */}
            <div className="space-y-4 text-xs">
              {drillDownType === 'today_patients' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5">
                      <span className="text-slate-400 block text-[11px]">کۆی نۆرەکانی ئەمڕۆ</span>
                      <strong className="text-xl font-black text-white font-mono">{todayAppointments.length} نۆرە</strong>
                    </div>
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5">
                      <span className="text-slate-400 block text-[11px]">لە ژوورەوەیە</span>
                      <strong className="text-xl font-black text-cyan-300 font-mono">{inSessionCount} کەس</strong>
                    </div>
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5">
                      <span className="text-slate-400 block text-[11px]">چاوەڕوان / تەواوبوو</span>
                      <strong className="text-xl font-black text-amber-300 font-mono">{waitingCount} / {completedCount}</strong>
                    </div>
                  </div>

                  <div className="bg-slate-950/90 rounded-2xl border border-white/10 overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-slate-300 font-bold border-b border-white/10">
                          <th className="p-3">#</th>
                          <th className="p-3">ناوی چارەخواز</th>
                          <th className="p-3">خزمەتگوزاری</th>
                          <th className="p-3">پزیشک</th>
                          <th className="p-3">کات</th>
                          <th className="p-3">دۆخ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {todayAppointments.map((app, idx) => (
                          <tr key={app.id} className="hover:bg-white/[0.04]">
                            <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-bold text-white">{app.patientName}</td>
                            <td className="p-3 text-cyan-300">{app.treatmentName}</td>
                            <td className="p-3 text-slate-300">{app.doctorName}</td>
                            <td className="p-3 font-mono text-slate-400">{app.appointmentTime}</td>
                            <td className="p-3 font-bold text-emerald-400">{app.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {drillDownType === 'total_patients' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[11px]">کۆی گشتی چارەخوازانی تۆمارکراو</span>
                      <strong className="text-2xl font-black text-blue-300 font-mono">{patients.length} چارەخواز</strong>
                    </div>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-xl font-bold text-xs">
                      داتابەیسی چالاک
                    </span>
                  </div>

                  <div className="bg-slate-950/90 rounded-2xl border border-white/10 overflow-hidden max-h-96 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-slate-300 font-bold border-b border-white/10">
                          <th className="p-3">کۆد</th>
                          <th className="p-3">ناوی چارەخواز</th>
                          <th className="p-3">مۆبایل</th>
                          <th className="p-3">تەمەن</th>
                          <th className="p-3">هۆکاری سەردان</th>
                          <th className="p-3">جلسەکان</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {patients.map((p) => (
                          <tr key={p.id} className="hover:bg-white/[0.04]">
                            <td className="p-3 font-mono text-teal-300 font-bold">{p.patientCode}</td>
                            <td className="p-3 font-bold text-white">{p.name}</td>
                            <td className="p-3 font-mono text-slate-300" dir="ltr">{p.phone}</td>
                            <td className="p-3 text-slate-300">{p.age} ساڵ</td>
                            <td className="p-3 text-pink-300 truncate max-w-[180px]">{p.chiefComplaint || 'گشتی'}</td>
                            <td className="p-3 font-mono text-cyan-300 font-bold">{p.totalSessionsCompleted} جلسە</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {drillDownType === 'net_profit' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5">
                      <span className="text-slate-400 block text-[11px]">کۆی گشتی داهات</span>
                      <strong className="text-xl font-black text-emerald-300 font-mono">{stats.totalRevenue.toLocaleString()} د.ع</strong>
                    </div>
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5">
                      <span className="text-slate-400 block text-[11px]">کۆی مەسروفات</span>
                      <strong className="text-xl font-black text-rose-300 font-mono">{stats.totalExpenses.toLocaleString()} د.ع</strong>
                    </div>
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5">
                      <span className="text-slate-400 block text-[11px]">قازانجی ساف (Net)</span>
                      <strong className="text-xl font-black text-cyan-300 font-mono">{stats.netProfit.toLocaleString()} د.ع</strong>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-2">
                    <h4 className="font-bold text-white">پوختەی وردی دارایی مانگانە:</h4>
                    <p className="text-slate-300">ئەم ئامارە لەسەر بنەمای داهاتی ڕاستەقینەی کلینیک و دابشکاندنی موچەی پزیشکان و مەسروفاتی عەمبار و کەرەستەکانی فیلەر و بۆتۆکس حیساب کراوە.</p>
                  </div>
                </div>
              )}

              {drillDownType === 'whatsapp_stats' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[11px]">دۆخی وەتس ئەپ کلواود API</span>
                      <strong className="text-lg font-black text-emerald-400">✅ 100% کارا و پەیوەستکراو</strong>
                    </div>
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-xl font-bold text-xs">
                      Meta Business
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-2">
                    <h4 className="font-bold text-white">جۆری نامە خۆکارەکان کە دەوەشێنرێن:</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      <li>نامەی بەخێرهاتن بۆ چارەخوازی نوێ.</li>
                      <li>نامەی بیرخستنەوەی نۆرە پێش ٢٤ کاتژمێر.</li>
                      <li>نامەی پیرۆزبایی دوای تەواوبوونی جلسەی لەیزەر یان فیلەر.</li>
                    </ul>
                  </div>
                </div>
              )}

              {drillDownType === 'doctor_salaries' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[11px]">کۆی گشتی مووچەی ستاف و پزیشکان</span>
                      <strong className="text-2xl font-black text-sky-300 font-mono">
                        {totalDoctorSalariesSum.toLocaleString()} د.ع
                      </strong>
                    </div>
                    <span className="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded-xl font-bold text-xs">
                      {staffDoctorsList.length} کارمەند و پزیشک
                    </span>
                  </div>

                  <div className="bg-slate-950/90 rounded-2xl border border-white/10 overflow-hidden max-h-80 overflow-y-auto">
                    {staffDoctorsList.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        هیچ مووچە و کارمەندێک بۆ ئەم لقە تۆمار نەکراوە (سفر د.ع)
                      </div>
                    ) : (
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-400 font-bold border-b border-white/10 sticky top-0">
                            <th className="p-3">ناو</th>
                            <th className="p-3">ڕۆڵ / پسپۆڕی</th>
                            <th className="p-3">مووچەی بنەڕەتی</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                          {staffDoctorsList.map((doc) => (
                            <tr key={doc.id} className="hover:bg-white/[0.02]">
                              <td className="p-3 font-bold text-white">{doc.name}</td>
                              <td className="p-3 text-cyan-300">{doc.role}</td>
                              <td className="p-3 font-mono font-bold text-emerald-400">
                                {(Number((doc as any).salary) || 0).toLocaleString()} د.ع
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setDrillDownType(null)}
                className="px-6 py-2.5 bg-cyan-500 text-slate-950 font-black rounded-xl hover:brightness-110 cursor-pointer"
              >
                داخستن
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrintDashboardModal && (
        <PrintableMedicalDocumentModal
          isOpen={showPrintDashboardModal}
          onClose={() => setShowPrintDashboardModal(false)}
          docType="dashboard_summary"
          data={{
            date: new Date().toISOString().split('T')[0],
            kpiStats: {
              todayCount: todayAppointments.length,
              completedCount: completedCount,
              revenue: stats.totalRevenue,
              activeDoctors: staffDoctorsList.length,
            },
          }}
        />
      )}
    </div>
  );
};
