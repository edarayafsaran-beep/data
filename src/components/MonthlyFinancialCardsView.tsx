import React, { useState } from 'react';
import { Appointment, Expense, User, Branch } from '../types';
import { PrintableFinancialReportModal, ReportType } from './PrintableFinancialReportModal';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Plus,
  Search,
  Eye,
  Printer,
  FileText,
  Building2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PieChart,
  Layers,
  Award,
  Wallet,
  CheckCircle2,
  X,
  PlusCircle,
  Filter,
  ChevronDown,
  Tag,
  Stethoscope,
  Gift,
} from 'lucide-react';

interface MonthlyFinancialCardsViewProps {
  appointments: Appointment[];
  expenses: Expense[];
  branches: Branch[];
  activeBranchId: number | null;
  currentUser: User;
  onAddExpense?: (expense: Omit<Expense, 'id' | 'branchId'>) => void;
}

const MONTH_NAMES_KURDISH = [
  { id: 1, name: 'کانوونی دووەم (January)', key: '01', color: 'from-blue-600/30 to-indigo-600/30 border-blue-500/40 text-blue-300' },
  { id: 2, name: 'شوبات (February)', key: '02', color: 'from-cyan-600/30 to-blue-600/30 border-cyan-500/40 text-cyan-300' },
  { id: 3, name: 'ئازار (March)', key: '03', color: 'from-emerald-600/30 to-teal-600/30 border-emerald-500/40 text-emerald-300' },
  { id: 4, name: 'نیسان (April)', key: '04', color: 'from-teal-600/30 to-cyan-600/30 border-teal-500/40 text-teal-300' },
  { id: 5, name: 'ئایار (May)', key: '05', color: 'from-green-600/30 to-emerald-600/30 border-green-500/40 text-green-300' },
  { id: 6, name: 'حوزەیران (June)', key: '06', color: 'from-amber-600/30 to-yellow-600/30 border-amber-500/40 text-amber-300' },
  { id: 7, name: 'تمووز (July)', key: '07', color: 'from-orange-600/30 to-amber-600/30 border-orange-500/40 text-orange-300' },
  { id: 8, name: 'ئاب (August)', key: '08', color: 'from-rose-600/30 to-pink-600/30 border-rose-500/40 text-rose-300' },
  { id: 9, name: 'ئەیلوول (September)', key: '09', color: 'from-pink-600/30 to-purple-600/30 border-pink-500/40 text-pink-300' },
  { id: 10, name: 'تشرینی یەکەم (October)', key: '10', color: 'from-purple-600/30 to-indigo-600/30 border-purple-500/40 text-purple-300' },
  { id: 11, name: 'تشرینی دووەم (November)', key: '11', color: 'from-indigo-600/30 to-blue-600/30 border-indigo-500/40 text-indigo-300' },
  { id: 12, name: 'کانوونی یەکەم (December)', key: '12', color: 'from-sky-600/30 to-indigo-600/30 border-sky-500/40 text-sky-300' },
];

const STANDARD_ITEM_PRESETS: Array<{ name: string; basePrice: number; discountPct: number; doctor: string }> = [];

export const MonthlyFinancialCardsView: React.FC<MonthlyFinancialCardsViewProps> = ({
  appointments,
  expenses,
  branches,
  activeBranchId,
  currentUser,
  onAddExpense,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [activeTab, setActiveTab] = useState<'revenue_cards' | 'expense_cards' | 'comparison'>('revenue_cards');
  
  // Modal for inspecting daily details of a selected month
  const [selectedMonthModal, setSelectedMonthModal] = useState<{
    monthNumber: number;
    monthName: string;
    type: 'revenue' | 'expense' | 'both';
  } | null>(null);

  const [expandedDayNumber, setExpandedDayNumber] = useState<number | null>(null);
  const [dailySearchQuery, setDailySearchQuery] = useState('');

  // Printable Financial Report Modal State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printModalReportType, setPrintModalReportType] = useState<ReportType>('monthly_items_discounts');
  const [printCustomData, setPrintCustomData] = useState<any>(undefined);

  const handleOpenPrintModal = (type: ReportType = 'monthly_items_discounts', custom?: any) => {
    setPrintModalReportType(type);
    setPrintCustomData(custom);
    setShowPrintModal(true);
  };

  // Quick Expense Modal State
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('مەسروفاتی ڕۆژانە');
  const [expenseAmount, setExpenseAmount] = useState<number>(35000);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Branch isolation filter
  const branchFilteredAppointments = activeBranchId
    ? appointments.filter((a) => a.branchId === activeBranchId)
    : appointments;

  const branchFilteredExpenses = activeBranchId
    ? expenses.filter((e) => e.branchId === activeBranchId)
    : expenses;

  // Active branch name
  const activeBranchObj = branches.find((b) => b.id === activeBranchId);
  const activeBranchName = activeBranchObj ? activeBranchObj.name : 'هەموو لقەکان';

  // Function to calculate daily stats for a given month & year
  const getMonthlyBreakdown = (monthKey: string, year: string) => {
    const daysInMonth = new Date(Number(year), Number(monthKey), 0).getDate();
    const daysData = [];

    let monthTotalRevenue = 0;
    let monthTotalExpenses = 0;
    let monthTotalAppointments = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayFormatted = String(day).padStart(2, '0');
      const dateStr = `${year}-${monthKey}-${dayFormatted}`;

      // Filter appointments on this exact day (100% Real from database)
      const dayApps = branchFilteredAppointments.filter((a) => a.date === dateStr || (a as any).appointmentDate === dateStr);
      const dayRevenueFromApps = dayApps.reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);

      // Filter expenses on this exact day (100% Real from database)
      const dayExps = branchFilteredExpenses.filter((e) => e.date === dateStr);
      const dayExpenseAmount = dayExps.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      const finalRevenue = dayRevenueFromApps;
      const finalExpense = dayExpenseAmount;
      const finalAppsCount = dayApps.length;

      // Construct explicit itemized procedures list strictly from real appointments
      const itemizedProcedures = dayApps.map((app) => {
        const origPrice = Number(app.treatmentPrice) || Number(app.paidAmount) || 0;
        const discountPct = Number(app.discountApplied) || 0;
        const discountAmt = Math.round((origPrice * discountPct) / 100);
        const netPaid = Number(app.paidAmount) || (origPrice - discountAmt);

        return {
          id: app.id,
          itemName: app.treatmentName || 'خزمەتگوزاری پزیشکی',
          patientName: app.patientName || 'نەخۆش',
          doctorName: app.doctorName || 'پزیشک',
          originalPrice: origPrice,
          discountPercentage: discountPct,
          discountAmount: discountAmt,
          paidAmount: netPaid,
          time: app.appointmentTime || '10:00 AM',
        };
      });

      const dayNameKurds = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];
      const dateObj = new Date(Number(year), Number(monthKey) - 1, day);
      const dayOfWeekName = dayNameKurds[dateObj.getDay()];

      monthTotalRevenue += finalRevenue;
      monthTotalExpenses += finalExpense;
      monthTotalAppointments += finalAppsCount;

      daysData.push({
        dayNumber: day,
        dateStr,
        dayOfWeekName,
        revenue: finalRevenue,
        expenses: finalExpense,
        netProfit: finalRevenue - finalExpense,
        appointmentsCount: finalAppsCount,
        appointmentsList: dayApps,
        expensesList: dayExps,
        itemizedProcedures,
      });
    }

    const monthNetProfit = monthTotalRevenue - monthTotalExpenses;
    const dailyAverageRevenue = Math.round(monthTotalRevenue / daysInMonth);
    const dailyAverageExpense = Math.round(monthTotalExpenses / daysInMonth);

    // Top revenue day
    const busiestDay = [...daysData].sort((a, b) => b.revenue - a.revenue)[0];

    return {
      monthKey,
      year,
      daysInMonth,
      totalRevenue: monthTotalRevenue,
      totalExpenses: monthTotalExpenses,
      netProfit: monthNetProfit,
      totalAppointments: monthTotalAppointments,
      dailyAverageRevenue,
      dailyAverageExpense,
      busiestDay,
      daysData,
    };
  };

  const handleAddQuickExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount || !onAddExpense) return;

    onAddExpense({
      title: expenseTitle,
      category: expenseCategory,
      amount: Number(expenseAmount),
      date: expenseDate,
      recordedBy: currentUser.name || 'سوپەر ئەدمین',
      notes: expenseNotes,
    });

    setExpenseTitle('');
    setExpenseNotes('');
    setShowAddExpenseModal(false);
    alert('✅ مەسروفاتی ڕۆژانە بە سەرکەوتوویی تۆمارکرا!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Main Banner Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-8 rounded-[36px] border border-white/10 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black rounded-full flex items-center gap-1.5 shadow">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>پست و پاکێجەکانی حیساباتی مانگانە v2.5</span>
            </span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{activeBranchName}</span>
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white leading-snug">
            پاکێجەکانی حیساباتی مانگانە، مەسروفات و ئایتمە بەکارهاتووەکان
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            کارتەکانی حیساباتی مانگانە بە شێوەیەکی ئۆتۆماتیکی دروست دەبن؛ کلیک لەسەر کارتی هەر مانگێک بکە بۆ بینینی <strong className="text-amber-300">ناوی ئایتمەکە/خزمەتگوزارییەکە، نرخەکەی، و داشکاندنی کراوە</strong> لە سەرجەم ڕۆژەکاندا.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year selector */}
          <div className="flex items-center bg-slate-950/80 border border-white/10 rounded-2xl p-1 text-xs">
            {['2025', '2026', '2027'].map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  selectedYear === yr
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenPrintModal('monthly_items_discounts')}
              className="px-5 py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 rounded-2xl text-xs font-black text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>چاپکردن و PDF بۆ ڕاپۆرتی پاکێجەکان</span>
            </button>

            {onAddExpense && (
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="px-5 py-3 bg-gradient-to-r from-rose-500 via-amber-500 to-teal-400 hover:brightness-110 rounded-2xl text-xs font-black text-slate-950 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-slate-950" />
                <span>تۆمارکردنی مەسروفاتی نوێ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-950/90 rounded-2xl border-2 border-amber-500/30 backdrop-blur-2xl shadow-[0_0_20px_rgba(245,158,11,0.15)] text-xs no-scrollbar">
        <button
          onClick={() => setActiveTab('revenue_cards')}
          className={`px-5 py-3 rounded-xl font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'revenue_cards'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>کارتەکانی حیساباتی داهات بەپێی مانگ ({MONTH_NAMES_KURDISH.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expense_cards')}
          className={`px-5 py-3 rounded-xl font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'expense_cards'
              ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 text-white shadow-md scale-[1.02]'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <Receipt className="w-4 h-4 text-rose-300" />
          <span>کارتەکانی مەسروفاتی مانگانە</span>
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-5 py-3 rounded-xl font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'comparison'
              ? 'bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>شیکاری و بەراوردکاری هەموو مانگەکان</span>
        </button>
      </div>

      {/* TAB 1: REVENUE MONTHLY PACKAGE CARDS */}
      {activeTab === 'revenue_cards' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-400" /> پاکێجە مانگانەییەکانی داهاتی کلینیک (ساڵی {selectedYear})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                کارتەکان بە شێوەیەکی خۆکار بۆ هەموو مانگێک دروست کراون. کلیک لەسەر هەر مانگێک بکە بۆ بینینی هەموو ڕۆژەکان و ئایتمەکان.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MONTH_NAMES_KURDISH.map((m) => {
              const summary = getMonthlyBreakdown(m.key, selectedYear);

              return (
                <div
                  key={m.id}
                  className="bg-slate-900/80 backdrop-blur-md p-6 rounded-[32px] border border-white/10 hover:border-amber-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-5 group hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]"
                >
                  <div className="space-y-4">
                    {/* Header of month card */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center font-mono font-black text-white text-base shadow`}>
                          {m.key}
                        </div>
                        <div>
                          <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                            {m.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {summary.daysInMonth} ڕۆژ | ساڵی {selectedYear}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-xl">
                        پاکێجی داهات
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-slate-400">کۆی داهاتی مانگ:</span>
                        <div className="text-base font-black text-emerald-300 font-mono">
                          {summary.totalRevenue.toLocaleString()} د.ع
                        </div>
                      </div>

                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-slate-400">ژمارەی سەردانیکاران:</span>
                        <div className="text-base font-black text-cyan-300 font-mono">
                          {summary.totalAppointments} نۆرە
                        </div>
                      </div>

                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-slate-400">تێکڕای داهاتی ڕۆژانە:</span>
                        <div className="text-sm font-bold text-slate-200 font-mono">
                          {summary.dailyAverageRevenue.toLocaleString()} د.ع
                        </div>
                      </div>

                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-slate-400">بەرزترین ڕۆژ:</span>
                        <div className="text-xs font-bold text-amber-300 font-mono truncate">
                          ڕۆژی {summary.busiestDay.dayNumber} ({summary.busiestDay.revenue.toLocaleString()} د.ع)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() =>
                      setSelectedMonthModal({
                        monthNumber: m.id,
                        monthName: m.name,
                        type: 'revenue',
                      })
                    }
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-slate-950" />
                    <span>وردەکاریی ڕۆژەکان و ئایتمە بەکارهاتووەکان</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES MONTHLY PACKAGE CARDS */}
      {activeTab === 'expense_cards' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-400" /> پاکێجە مانگانەییەکانی مەسروفات و خەرجی (ساڵی {selectedYear})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                مەسروفاتەکان بە شێوەیەکی ئۆتۆماتیکی لەسەر بنەمای فاکتۆرەکان کراونەتە کارتی تایبەت بۆ هەر مانگێک.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MONTH_NAMES_KURDISH.map((m) => {
              const summary = getMonthlyBreakdown(m.key, selectedYear);

              return (
                <div
                  key={m.id}
                  className="bg-slate-900/80 backdrop-blur-md p-6 rounded-[32px] border border-white/10 hover:border-rose-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-5 group hover:shadow-[0_0_25px_rgba(244,63,94,0.15)]"
                >
                  <div className="space-y-4">
                    {/* Header of expense card */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600/30 to-pink-600/30 border border-rose-500/40 flex items-center justify-center font-mono font-black text-rose-300 text-base shadow">
                          {m.key}
                        </div>
                        <div>
                          <h3 className="text-base font-black text-white group-hover:text-rose-300 transition-colors">
                            {m.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {summary.daysInMonth} ڕۆژی مەسروفات | {selectedYear}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold rounded-xl">
                        پاکێجی مەسروفات
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-slate-400">کۆی مەسروفاتی مانگ:</span>
                        <div className="text-base font-black text-rose-400 font-mono">
                          {summary.totalExpenses.toLocaleString()} د.ع
                        </div>
                      </div>

                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-slate-400">تێکڕای خەرجی ڕۆژانە:</span>
                        <div className="text-base font-black text-slate-200 font-mono">
                          {summary.dailyAverageExpense.toLocaleString()} د.ع
                        </div>
                      </div>

                      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/5 space-y-1 col-span-2">
                        <span className="text-[10px] text-slate-400">قازانجی سافی مانگ (داهات - مەسروفات):</span>
                        <div className="text-sm font-black text-teal-300 font-mono">
                          {summary.netProfit.toLocaleString()} د.ع
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() =>
                      setSelectedMonthModal({
                        monthNumber: m.id,
                        monthName: m.name,
                        type: 'expense',
                      })
                    }
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Receipt className="w-4 h-4 text-white" />
                    <span>وردەکاریی مەسروفاتی ڕۆژەکانی ئەم مانگە</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: COMPARISON & OVERVIEW */}
      {activeTab === 'comparison' && (
        <div className="bg-slate-900/80 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-white/10 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-teal-400" /> جەدوەلی بەراوردکاری هەموو مانگەکانی ساڵی {selectedYear}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                بەراوردی کۆی داهات، مەسروفات، و قازانجی صافی نێوان سەرجەم مانگەکان.
              </p>
            </div>
            <button
              onClick={() => handleOpenPrintModal('general_financial')}
              className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow cursor-pointer hover:brightness-110 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>چاپکردن و PDF بۆ جەدوەل</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-300 font-bold border-b border-white/10">
                  <th className="p-4">مانگ</th>
                  <th className="p-4">کۆی داهات (IQD)</th>
                  <th className="p-4">کۆی مەسروفات (IQD)</th>
                  <th className="p-4">قازانجی سافی (Net Profit)</th>
                  <th className="p-4">ژمارەی نۆرەکان</th>
                  <th className="p-4">کردار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {MONTH_NAMES_KURDISH.map((m) => {
                  const summary = getMonthlyBreakdown(m.key, selectedYear);
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-4 font-black font-sans text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>{m.name}</span>
                      </td>
                      <td className="p-4 font-bold text-emerald-400">
                        {summary.totalRevenue.toLocaleString()} د.ع
                      </td>
                      <td className="p-4 font-bold text-rose-400">
                        {summary.totalExpenses.toLocaleString()} د.ع
                      </td>
                      <td className="p-4 font-bold text-teal-300">
                        {summary.netProfit.toLocaleString()} د.ع
                      </td>
                      <td className="p-4 text-cyan-300 font-bold">{summary.totalAppointments} نۆرە</td>
                      <td className="p-4">
                        <button
                          onClick={() =>
                            setSelectedMonthModal({
                              monthNumber: m.id,
                              monthName: m.name,
                              type: 'both',
                            })
                          }
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 rounded-xl text-[11px] font-sans font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>سەیری ڕۆژەکان بکه</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MONTHLY DAILY BREAKDOWN MODAL (کاتێک کلیک لەسەر کارتی مانگەکە دەکرێت) */}
      {selectedMonthModal && (() => {
        const monthKey = String(selectedMonthModal.monthNumber).padStart(2, '0');
        const monthSummary = getMonthlyBreakdown(monthKey, selectedYear);

        const filteredDays = monthSummary.daysData.filter((d) => {
          if (!dailySearchQuery) return true;
          return (
            d.dateStr.includes(dailySearchQuery) ||
            d.dayOfWeekName.includes(dailySearchQuery) ||
            String(d.dayNumber).includes(dailySearchQuery)
          );
        });

        return (
          <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-slate-900 border-2 border-amber-500/40 rounded-[36px] w-full max-w-5xl p-6 md:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-black text-xl font-mono shadow">
                    {monthKey}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <span>وردەکاری حیساباتی ڕۆژانەی {selectedMonthModal.monthName}</span>
                      <span className="text-xs text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-mono">
                        ساڵی {selectedYear}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      لیستی هەموو ({monthSummary.daysInMonth}) ڕۆژەکانی مانگ. کلیک لەسەر دوگمەی <strong className="text-amber-300">«ئایتمەکان و داشکاندن»</strong> بکە بۆ بینینی هەموو ئەو خزمەتگوزارییانەی پارەکەیان پەیداکردووە.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const allItems = monthSummary.daysData.flatMap((d) => d.itemizedProcedures);
                      handleOpenPrintModal('monthly_items_discounts', {
                        monthName: selectedMonthModal.monthName,
                        monthKey,
                        itemizedList: allItems,
                        daysData: monthSummary.daysData,
                      });
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow active:scale-95 transition-all"
                  >
                    <Printer className="w-4 h-4 text-slate-950" />
                    <span>چاپکردن و PDF بۆ ئەم مانگە</span>
                  </button>

                  <button
                    onClick={() => setSelectedMonthModal(null)}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Summary Stats Box for this Month */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400">کۆی داهاتی مانگ:</span>
                  <div className="text-xl font-black text-emerald-300 font-mono">
                    {monthSummary.totalRevenue.toLocaleString()} د.ع
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400">کۆی مەسروفاتی مانگ:</span>
                  <div className="text-xl font-black text-rose-400 font-mono">
                    {monthSummary.totalExpenses.toLocaleString()} د.ع
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-2xl border border-teal-500/40 space-y-1 shadow">
                  <span className="text-[11px] text-teal-300 font-bold">پوختەی قازانجی مانگ:</span>
                  <div className="text-xl font-black text-teal-200 font-mono">
                    {monthSummary.netProfit.toLocaleString()} د.ع
                  </div>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400">کۆی نۆرەکان:</span>
                  <div className="text-xl font-black text-cyan-300 font-mono">
                    {monthSummary.totalAppointments} نۆرە
                  </div>
                </div>
              </div>

              {/* Filter bar for Days */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    value={dailySearchQuery}
                    onChange={(e) => setDailySearchQuery(e.target.value)}
                    placeholder="گەڕان بەپێی ڕۆژ یان بەروار..."
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>

                <span className="text-xs text-slate-400 font-mono">
                  پیشاندانی {filteredDays.length} ڕۆژ لە {monthSummary.daysInMonth}
                </span>
              </div>

              {/* Table of Daily Breakdown with Expandable Procedure Items */}
              <div className="bg-slate-950/90 rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 font-bold border-b border-white/10">
                      <th className="p-3.5">ڕۆژ و بەروار</th>
                      <th className="p-3.5">کاتی هەفتە</th>
                      <th className="p-3.5">داهات (IQD)</th>
                      <th className="p-3.5">مەسروفات (IQD)</th>
                      <th className="p-3.5">قازانجی سافی (Net Profit)</th>
                      <th className="p-3.5">نۆرەکان</th>
                      <th className="p-3.5">ئایتمەکان و داشکاندن</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {filteredDays.map((day) => {
                      const isExpanded = expandedDayNumber === day.dayNumber;

                      return (
                        <React.Fragment key={day.dayNumber}>
                          <tr
                            className={`hover:bg-white/[0.04] transition-colors ${
                              isExpanded ? 'bg-amber-500/10 border-r-4 border-amber-400' : ''
                            }`}
                          >
                            <td className="p-3.5 font-bold font-sans text-white flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-300 font-mono text-xs">
                                {day.dayNumber}
                              </span>
                              <span>{day.dateStr}</span>
                            </td>
                            <td className="p-3.5 font-sans text-slate-300 font-bold">{day.dayOfWeekName}</td>
                            <td className="p-3.5 font-bold text-emerald-400">
                              {day.revenue.toLocaleString()} د.ع
                            </td>
                            <td className="p-3.5 font-bold text-rose-400">
                              {day.expenses.toLocaleString()} د.ع
                            </td>
                            <td className="p-3.5 font-bold text-teal-300">
                              {day.netProfit.toLocaleString()} د.ع
                            </td>
                            <td className="p-3.5 font-bold text-cyan-300">{day.appointmentsCount} نۆرە</td>
                            <td className="p-3.5 font-sans">
                              <button
                                onClick={() => setExpandedDayNumber(isExpanded ? null : day.dayNumber)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer ${
                                  isExpanded
                                    ? 'bg-amber-400 text-slate-950 font-black shadow'
                                    : 'bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10'
                                }`}
                              >
                                <Tag className="w-3.5 h-3.5" />
                                <span>{isExpanded ? 'داخستنی ئایتمەکان' : 'سەیری ئایتمەکان و داشکاندن بکه'}</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            </td>
                          </tr>

                          {/* EXPANDED ITEMIZED BREAKDOWN ROW FOR THIS DAY */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="p-4 bg-slate-950/95 font-sans border-t border-b border-amber-500/30">
                                <div className="space-y-4 animate-in fade-in duration-200">
                                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                    <div className="flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-amber-400" />
                                      <h4 className="text-xs font-black text-white">
                                        لیستی ئەو خزمەتگوزاری و ئایتمانەی پارەیان پەیداکردووە لە بەرواری ({day.dateStr} - {day.dayOfWeekName}):
                                      </h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-amber-300 font-mono font-bold bg-amber-500/20 px-2.5 py-0.5 rounded-full">
                                        کۆی {day.itemizedProcedures.length} ئایتم / خزمەتگوزاری
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleOpenPrintModal('monthly_items_discounts', {
                                            monthName: `${selectedMonthModal.monthName} (ڕۆژی ${day.dayNumber} - ${day.dayOfWeekName})`,
                                            monthKey,
                                            dayDateStr: day.dateStr,
                                            itemizedList: day.itemizedProcedures,
                                          })
                                        }
                                        className="px-2.5 py-1 bg-amber-400 text-slate-950 font-black rounded-lg text-[10px] flex items-center gap-1 hover:brightness-110 cursor-pointer shadow active:scale-95 transition-all"
                                      >
                                        <Printer className="w-3 h-3 text-slate-950" />
                                        <span>وەسڵی ڕۆژانە / PDF</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Table of Procedures/Items on this day */}
                                  {day.itemizedProcedures.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400 text-xs bg-slate-900/60 rounded-xl border border-white/5">
                                      هیچ خزمەتگوزاری یان نۆرەیەکی پارەدار لەم بەروارەدا تۆمار نەکراوە (0 د.ع).
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/90">
                                      <table className="w-full text-right text-xs">
                                        <thead>
                                          <tr className="bg-slate-950 text-slate-400 font-bold border-b border-white/10">
                                            <th className="p-2.5">ناوی ئایتم / خزمەتگوزاری بەکارهاتوو</th>
                                            <th className="p-2.5">ناوی چارەخواز</th>
                                            <th className="p-2.5">پزیشک / شارەزا</th>
                                            <th className="p-2.5">نرخی ئەسڵی (IQD)</th>
                                            <th className="p-2.5">داشکاندنی کراوە</th>
                                            <th className="p-2.5">داهاتی صافی (IQD)</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 font-mono">
                                          {day.itemizedProcedures.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/[0.04]">
                                              <td className="p-2.5 font-bold font-sans text-teal-300 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                                                <span>{item.itemName}</span>
                                              </td>
                                              <td className="p-2.5 font-sans text-white font-bold">{item.patientName}</td>
                                              <td className="p-2.5 font-sans text-slate-300">{item.doctorName}</td>
                                              <td className="p-2.5 font-bold text-slate-300">
                                                {item.originalPrice.toLocaleString()} د.ع
                                              </td>
                                              <td className="p-2.5 font-sans">
                                                {item.discountPercentage > 0 ? (
                                                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-lg font-mono">
                                                    🏷️ داشکاندن {item.discountPercentage}% (-{item.discountAmount.toLocaleString()} د.ع)
                                                  </span>
                                                ) : (
                                                  <span className="text-slate-500 text-[10px]">بێ داشکاندن (0%)</span>
                                                )}
                                              </td>
                                              <td className="p-2.5 font-bold text-emerald-300">
                                                {item.paidAmount.toLocaleString()} د.ع
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {/* Itemized Expenses for this day if any */}
                                  {day.expensesList.length > 0 && (
                                    <div className="space-y-2 pt-2">
                                      <h5 className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                                        <Receipt className="w-3.5 h-3.5 text-rose-400" />
                                        <span>مەسروفات و فاکتۆرە خەرجکراوەکانی ئەم ڕۆژە:</span>
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                        {day.expensesList.map((ex) => (
                                          <div key={ex.id} className="p-2.5 bg-slate-900 border border-rose-500/30 rounded-xl flex items-center justify-between">
                                            <div>
                                              <span className="font-bold text-white block">{ex.title}</span>
                                              <span className="text-[10px] text-slate-400">پۆلێن: {ex.category} | تۆمارکار: {ex.recordedBy}</span>
                                            </div>
                                            <span className="font-mono font-bold text-rose-400">{ex.amount.toLocaleString()} د.ع</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Modal Action */}
              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setSelectedMonthModal(null)}
                  className="px-6 py-2.5 bg-amber-400 text-slate-950 font-black rounded-xl text-xs hover:brightness-110 cursor-pointer shadow"
                >
                  داخستن
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* QUICK ADD EXPENSE MODAL */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 w-full max-w-md rounded-[32px] p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-black text-base">تۆمارکردنی مەسروفاتی ڕۆژانە</h3>
                  <p className="text-slate-400 text-xs">زانیاری خەرجی ڕاستەوخۆ تۆمار بکە</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddQuickExpenseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">ناونیشانی مەسروفات *</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="بۆ نموونە: کڕینی دەرزی و فیلەر..."
                  className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">پۆلێن</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-rose-400"
                  >
                    <option value="مەسروفاتی ڕۆژانە">مەسروفاتی ڕۆژانە</option>
                    <option value="مەوادی جوانکاری و دەرزی">مەوادی جوانکاری و دەرزی</option>
                    <option value="کرێ و ئاو و بڕق">کرێ و ئاو و بڕق</option>
                    <option value="سیانەی ئامێری لەیزەر">سیانەی ئامێری لەیزەر</option>
                    <option value="تەندروستی و پاککردنەوە">تەندروستی و پاککردنەوە</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">بڕی پارە (د.ع) *</label>
                  <input
                    type="number"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-rose-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">بەروار</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">تێبینی</label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="وردەکاری زیاتر..."
                  className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-black rounded-xl shadow-md cursor-pointer hover:brightness-110"
                >
                  پاشەکەوتکردن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE PRINTABLE FINANCIAL AUDIT & PDF EXPORT MODAL */}
      <PrintableFinancialReportModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        reportType={printModalReportType}
        selectedYear={selectedYear}
        totalRevenue={branchFilteredAppointments.reduce((acc, curr) => acc + (Number(curr.paidAmount) || Number(curr.treatmentPrice) || 0), 0)}
        expenses={branchFilteredExpenses}
        payrollList={[]}
        cashBoxes={[]}
        bankAccounts={[]}
        activeBranchName={activeBranchName}
        currentUser={currentUser}
        customData={printCustomData}
      />
    </div>
  );
};
