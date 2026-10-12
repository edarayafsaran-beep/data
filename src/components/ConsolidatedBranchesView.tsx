import React, { useState } from 'react';
import { Branch, Expense, Patient, Appointment, User } from '../types';
import { PrintableFinancialReportModal } from './PrintableFinancialReportModal';
import { Building2, TrendingUp, DollarSign, Users, Receipt, Printer, Award, ShieldCheck, Calendar, Activity } from 'lucide-react';

interface ConsolidatedBranchesViewProps {
  branches: Branch[];
  allPatients: Patient[];
  allAppointments: Appointment[];
  allExpenses: Expense[];
  allUsers: User[];
  totalRevenue: number;
}

export const ConsolidatedBranchesView: React.FC<ConsolidatedBranchesViewProps> = ({
  branches,
  allPatients,
  allAppointments,
  allExpenses,
  allUsers,
  totalRevenue,
}) => {
  // Aggregate stats across all branches (100% Real from active database)
  const totalBranchesCount = branches.length;
  const totalPatientsCount = allPatients.length;
  const totalExpensesAmount = allExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const consolidatedRevenue = totalRevenue;
  const consolidatedProfit = consolidatedRevenue - totalExpensesAmount;
  const [showPrintModal, setShowPrintModal] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-900 p-6 md:p-8 rounded-[36px] border border-cyan-500/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold rounded-full">
              Super Admin Exclusive 👑
            </span>
            <span className="text-xs text-slate-400 font-mono">Multi-Branch Consolidated ERP Analytics</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">حیساباتی هەموو لقەکان (All-Branches Consolidated Accounts)</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
            پوختەی کۆی گشتی داهات، مەسروفات، قازانجی سافی، و ژمارەی سەردانیکاران بۆ سەرجەم لقەکانی سەنتەری جوانکاری .
          </p>
        </div>

        <button
          onClick={() => setShowPrintModal(true)}
          className="px-5 py-3 bg-cyan-400 text-slate-950 font-black rounded-2xl shadow-md flex items-center gap-2 text-xs hover:brightness-110 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>چاپکردنی ڕاپۆرتی گشتی (PDF)</span>
        </button>
      </div>

      {/* Global Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">کۆی گشتی داهاتی هەموو لقەکان:</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">{consolidatedRevenue.toLocaleString()} د.ع</div>
          <div className="text-[10px] text-emerald-400">بەڕێوەچوو لە {totalBranchesCount} لقدا</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">کۆی گشتی مەسروفات:</span>
            <Receipt className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300 font-mono">{totalExpensesAmount.toLocaleString()} د.ع</div>
          <div className="text-[10px] text-rose-400">کۆی خەرجی و مەواد</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-cyan-500/40 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyan-300 font-bold">قازانجی سافی گشتی (Net Profit):</span>
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-200 font-mono">{consolidatedProfit.toLocaleString()} د.ع</div>
          <div className="text-[10px] text-cyan-400">داهات - مەسروفات گشتی</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">کۆی گشتی سەردانیکاران:</span>
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">{totalPatientsCount} نەخۆش</div>
          <div className="text-[10px] text-amber-400">لە سەرجەم لقەکان</div>
        </div>
      </div>

      {/* Branch Breakdown Table */}
      <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md space-y-6">
        <h3 className="text-lg font-black text-white flex items-center gap-2 border-b border-white/10 pb-4">
          <Building2 className="w-5 h-5 text-teal-400" /> وردەکاری دارایی و ئاماری هەر لق بەجیا (100% داتای ڕاستەقینە)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-bold">
                <th className="py-3 px-4">ناوی لق (Branch)</th>
                <th className="py-3 px-4">ناونیشان و تەلەفۆن</th>
                <th className="py-3 px-4">داهات (Revenue)</th>
                <th className="py-3 px-4">مەسروفات (Expenses)</th>
                <th className="py-3 px-4">قازانجی سافی (Net Profit)</th>
                <th className="py-3 px-4">ژمارەی نەخۆش</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {branches.map((b, idx) => {
                const branchApps = allAppointments.filter((a) => (a as any).branchId === b.id || (!((a as any).branchId) && idx === 0));
                const branchRevenue = branchApps.reduce((acc, a) => acc + (Number(a.paidAmount) || 0), 0);
                const branchExpenses = allExpenses.filter((e) => (e as any).branchId === b.id || (!((e as any).branchId) && idx === 0));
                const branchExpense = branchExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
                const branchProfit = branchRevenue - branchExpense;
                const branchPatients = allPatients.filter((p) => (p as any).branchId === b.id || (!((p as any).branchId) && idx === 0)).length;

                return (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      {b.name}
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      {b.address || 'ناونیشان دیاری نەکراوە'} • {b.phone || ''}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-emerald-300">
                      {branchRevenue.toLocaleString()} د.ع
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-rose-300">
                      {branchExpense.toLocaleString()} د.ع
                    </td>
                    <td className="py-4 px-4 font-mono font-black text-teal-300">
                      {branchProfit.toLocaleString()} د.ع
                    </td>
                    <td className="py-4 px-4 font-mono text-amber-300 font-bold">
                      {branchPatients} نەخۆش
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showPrintModal && (
        <PrintableFinancialReportModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          reportType="general_financial"
          selectedYear={new Date().getFullYear().toString()}
          totalRevenue={consolidatedRevenue}
          expenses={allExpenses}
          payrollList={[]}
          cashBoxes={[]}
          bankAccounts={[]}
          activeBranchName="سەرجەم لقەکان بە یەکەوە"
        />
      )}
    </div>
  );
};
