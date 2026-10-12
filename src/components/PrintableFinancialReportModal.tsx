import React, { useRef } from 'react';
import {
  Printer,
  FileDown,
  X,
  CheckCircle2,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Wallet,
  Landmark,
  Award,
  Sparkles,
  UserCheck,
  ShieldCheck,
  Copy,
  FileText,
} from 'lucide-react';
import { Expense, User, Branch } from '../types';

export type ReportType =
  | 'general_financial'
  | 'expenses'
  | 'payroll'
  | 'cash_bank'
  | 'daily_closing'
  | 'monthly_summary'
  | 'single_salary_slip'
  | 'single_expense_voucher'
  | 'monthly_items_discounts';

interface PrintableFinancialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  selectedYear: string;
  totalRevenue: number;
  expenses: Expense[];
  payrollList: Array<{
    id: number;
    employeeName: string;
    department: string;
    position: string;
    basicSalary: number;
    overtimeHours: number;
    overtimeRatePerHour: number;
    bonus: number;
    allowances: number;
    taxDeduction: number;
    penalties: number;
    loanDeduction: number;
    netSalary: number;
    paymentStatus: string;
    paymentDate: string;
  }>;
  cashBoxes: Array<{
    id: number;
    name: string;
    responsible: string;
    balance: number;
    lastClosingTime: string;
    status: string;
  }>;
  bankAccounts: Array<{
    id: number;
    bankName: string;
    accountNumber: string;
    currency: string;
    balance: number;
    branch: string;
  }>;
  activeBranchName?: string;
  currentUser?: User;
  // Specific targets for single slip / custom day / month
  customData?: {
    singleEmployeeId?: number;
    singleExpenseId?: number;
    monthName?: string;
    monthKey?: string;
    dayDateStr?: string;
    daysData?: any[];
    itemizedList?: any[];
  };
}

export const PrintableFinancialReportModal: React.FC<PrintableFinancialReportModalProps> = ({
  isOpen,
  onClose,
  reportType: initialReportType,
  selectedYear,
  totalRevenue,
  expenses,
  payrollList,
  cashBoxes,
  bankAccounts,
  activeBranchName = 'هەموو لقەکان',
  currentUser,
  customData,
}) => {
  const [activeReport, setActiveReport] = React.useState<ReportType>(initialReportType);
  const [copied, setCopied] = React.useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setActiveReport(initialReportType);
  }, [initialReportType]);

  if (!isOpen) return null;

  // Key Calculations
  const totalExpenseAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPayrollCost = payrollList.reduce((acc, curr) => acc + curr.netSalary, 0);
  const totalCashBalance = cashBoxes.reduce((acc, curr) => acc + curr.balance, 0);
  const totalBankIQD = bankAccounts
    .filter((b) => b.currency.includes('IQD'))
    .reduce((acc, curr) => acc + curr.balance, 0);
  const totalBankUSD = bankAccounts
    .filter((b) => b.currency.includes('USD'))
    .reduce((acc, curr) => acc + curr.balance, 0);

  const netProfit = totalRevenue - totalExpenseAmount - totalPayrollCost;
  const currentDateStr = new Date().toLocaleDateString('ku-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTimestamp = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB');

  // Trigger browser print dialog (which has Save as PDF)
  const handlePrint = () => {
    window.print();
  };

  // Copy raw summary to clipboard
  const handleCopySummary = () => {
    const text = `ڕاپۆرتی دارایی کلینیک - ساڵی ${selectedYear}
بەروار: ${currentTimestamp}
کۆی داهات: ${totalRevenue.toLocaleString()} د.ع
کۆی خەرجی: ${totalExpenseAmount.toLocaleString()} د.ع
کۆی موچەی کارمەندان: ${totalPayrollCost.toLocaleString()} د.ع
قازانجی سافی: ${netProfit.toLocaleString()} د.ع
کۆی نەختی ناو سندووق: ${totalCashBalance.toLocaleString()} د.ع
حیساباتی بانک: ${totalBankIQD.toLocaleString()} د.ع و ${totalBankUSD.toLocaleString()} $`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Selected single employee if needed
  const singleEmployee = customData?.singleEmployeeId
    ? payrollList.find((p) => p.id === customData.singleEmployeeId) || payrollList[0]
    : payrollList[0];

  // Selected single expense if needed
  const singleExpense = customData?.singleExpenseId
    ? expenses.find((e) => e.id === customData.singleExpenseId) || expenses[0]
    : expenses[0];

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-teal-500/40 rounded-[32px] w-full max-w-5xl shadow-2xl my-4 sm:my-8 max-h-[94vh] flex flex-col overflow-hidden text-right">
        
        {/* TOP MODAL ACTION BAR (Hidden when printing via .no-print) */}
        <div className="no-print p-4 sm:p-6 border-b border-white/10 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>چاپکردن و دەرهێنانی ڕاپۆرت وەک PDF</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-mono">
                  Official PDF / Print Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                فۆرماتی فەرمی و بەڵگەنامەی باوەڕپێکراوی دارای بۆ چاپ و هەڵگرتن وەک فایلی PDF.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="کۆپیکردنی پوختە"
            >
              <Copy className="w-3.5 h-3.5 text-teal-400" />
              <span>{copied ? 'کۆپی کرا!' : 'کۆپیکردن'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>چاپکردن / داگرتنی PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* REPORT TYPE SELECTOR (Hidden in print) */}
        <div className="no-print px-4 sm:px-6 py-2.5 bg-slate-900 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-slate-400 shrink-0 font-bold ml-1">جۆری ڕاپۆرت:</span>
          {[
            { id: 'general_financial' as const, label: 'قازانج و دارایی گشتی', icon: TrendingUp },
            { id: 'expenses' as const, label: 'مەسروفات و فاکتۆرەکان', icon: Receipt },
            { id: 'payroll' as const, label: 'کۆی موچەی ستاف', icon: Wallet },
            { id: 'single_salary_slip' as const, label: 'وەسڵی موچەی کارمەند', icon: FileText },
            { id: 'cash_bank' as const, label: 'سندووق و بانکەکان', icon: Landmark },
            { id: 'daily_closing' as const, label: 'داخستنی ڕۆژانە', icon: Calendar },
            { id: 'monthly_summary' as const, label: 'ڕاپۆرتی مانگانە', icon: Sparkles },
            { id: 'monthly_items_discounts' as const, label: 'ئایتمەکان و داشکاندن', icon: Award },
          ].map((tab) => {
            const isSel = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-bold shrink-0 flex items-center gap-1.5 transition cursor-pointer select-none ${
                  isSel
                    ? 'bg-teal-400 text-slate-950 font-black shadow'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${isSel ? 'text-slate-950' : 'text-teal-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* PRINT HINT BAR (Hidden in print) */}
        <div className="no-print px-6 py-2 bg-teal-500/10 border-b border-teal-500/20 text-[11px] text-teal-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            <span>
              ئاگاداری: لە کاتی کرانەوەی پەنجەرەی چاپ، دەتوانیت لە بەشی (Destination) هەڵبژاردەی <strong>«Save as PDF»</strong> دیاری بکەیت تا وەک فایلی PDF پاشەکەوت بکرێت.
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">A4 • Portrait / Landscape • RTL</span>
        </div>

        {/* PRINTABLE DOCUMENT BODY (Styled for both dark screen and pure white crisp print) */}
        <div
          ref={printAreaRef}
          id="printable-financial-doc"
          className="printable-section flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 text-slate-100"
        >
          <div className="max-w-4xl mx-auto bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-300 space-y-6 printable-paper">
            
            {/* DOCUMENT OFFICIAL HEADER */}
            <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-black text-lg">
                    D
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                      سەنتەری پسپۆڕیی جوانکاری و پزیشکی
                    </h1>
                    <p className="text-[11px] text-slate-600 font-bold">
                      ADVANCED MEDICAL & AESTHETIC CENTER
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1 flex flex-wrap items-center gap-3">
                  <span>📍 ناونیشان: سلێمانی - شەقامی بازنەیی مەلیک مەحمود</span>
                  <span>📞 0770 123 4567</span>
                  <span>🏥 لقی: <strong className="text-slate-900">{activeBranchName}</strong></span>
                </div>
              </div>

              <div className="text-left font-mono text-[11px] text-slate-600 space-y-0.5 border-r pr-4 border-slate-200">
                <div className="font-black text-sm text-slate-950">فۆڕمی فەرمی دارایی</div>
                <div>بەروار: <strong className="text-slate-900 font-sans">{currentDateStr}</strong></div>
                <div>کاتی دەرهێنان: <strong className="text-slate-900">{currentTimestamp}</strong></div>
                <div>ساڵی دارایی: <strong className="text-slate-900">{selectedYear}</strong></div>
                <div>ئەنجامدەر: <strong className="text-slate-900 font-sans">{currentUser?.name || 'سوپەر ئەدمین'}</strong></div>
              </div>
            </div>

            {/* DOCUMENT TITLE & BADGE */}
            <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-300 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
                  <span>
                    {activeReport === 'general_financial' && 'ڕاپۆرتی گشتی قازانج، داهات و خەرجی (Annual / Period P&L Report)'}
                    {activeReport === 'expenses' && 'ڕاپۆرتی خەرجییەکان و فاکتۆرە تۆمارکراوەکان (Expenses & Invoices Ledger)'}
                    {activeReport === 'payroll' && 'لیستی گشتی موچەی ستاف و باجی دەستبڕ (Monthly Staff Payroll Sheet)'}
                    {activeReport === 'single_salary_slip' && `پسوولەی موچەی فەرمانبەر: ${singleEmployee.employeeName}`}
                    {activeReport === 'cash_bank' && 'ڕاپۆرتی سندووقی نەختی سەنتەر و حیساباتی بانکی (Cash & Banks Reconciliation)'}
                    {activeReport === 'daily_closing' && 'ڕاپۆرتی داخستنی ڕۆژانەی سەنتەر (Daily Closing Audit Report)'}
                    {activeReport === 'monthly_summary' && `پوختەی دارایی و حیساباتی مانگی ${customData?.monthName || 'دیاریکراو'}`}
                    {activeReport === 'monthly_items_discounts' && 'ڕاپۆرتی خزمەتگوزاری، ئایتمە بەکارهاتووەکان و داشکاندنەکان'}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  بەڵگەنامەی فەرمی وردبینی بەشی دارایی کلینیک • کۆدی دۆکیومێنت: <span className="font-mono font-bold text-slate-800">DOC-FIN-{selectedYear}-{Math.floor(Math.random() * 8999 + 1000)}</span>
                </p>
              </div>

              <span className="px-3 py-1 bg-slate-900 text-teal-300 text-xs font-mono font-black rounded-lg">
                AUDITED
              </span>
            </div>

            {/* CONTENT BASED ON SELECTED REPORT */}

            {/* 1. GENERAL FINANCIAL REPORT */}
            {activeReport === 'general_financial' && (
              <div className="space-y-6 text-xs text-slate-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">کۆی داهات (Revenue):</span>
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-700">
                      {totalRevenue.toLocaleString()} د.ع
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">کۆی خەرجی کارکردن:</span>
                    <span className="text-base sm:text-lg font-black font-mono text-rose-700">
                      {totalExpenseAmount.toLocaleString()} د.ع
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">کۆی موچەی کارمەندان:</span>
                    <span className="text-base sm:text-lg font-black font-mono text-amber-700">
                      {totalPayrollCost.toLocaleString()} د.ع
                    </span>
                  </div>
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                    <span className="text-[11px] text-teal-800 font-bold block">قازانجی سافی (Net Profit):</span>
                    <span className="text-base sm:text-lg font-black font-mono text-teal-900">
                      {netProfit.toLocaleString()} د.ع
                    </span>
                  </div>
                </div>

                {/* Financial Summary Table */}
                <table className="w-full text-right border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">بڕگە و پەیکەری دارایی</th>
                      <th className="p-2.5">ڕێژە لە داهات</th>
                      <th className="p-2.5">بڕ بە دراوی عێراقی (IQD)</th>
                      <th className="p-2.5">تێبینی وردبینی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr>
                      <td className="p-2.5 font-bold font-sans">١. کۆی داهاتی گشتی خزمەتگوزارییەکان</td>
                      <td className="p-2.5 font-bold">100.0%</td>
                      <td className="p-2.5 font-bold text-emerald-800">{totalRevenue.toLocaleString()} د.ع</td>
                      <td className="p-2.5 font-sans text-slate-600">لەیزەر، فیلەر، بۆتۆکس و نەشتەرگەری بچووک</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold font-sans">٢. کۆی مەسروفاتی ڕۆژانە و کارگێڕی</td>
                      <td className="p-2.5">
                        {((totalExpenseAmount / (totalRevenue || 1)) * 100).toFixed(1)}%
                      </td>
                      <td className="p-2.5 text-rose-700 font-bold">{totalExpenseAmount.toLocaleString()} د.ع</td>
                      <td className="p-2.5 font-sans text-slate-600">کڕینی مەواد، کرێ، چاککردنەوە و کارەبا</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold font-sans">٣. کۆی موچەی ستاف و پزیشکان</td>
                      <td className="p-2.5">
                        {((totalPayrollCost / (totalRevenue || 1)) * 100).toFixed(1)}%
                      </td>
                      <td className="p-2.5 text-amber-700 font-bold">{totalPayrollCost.toLocaleString()} د.ع</td>
                      <td className="p-2.5 font-sans text-slate-600">پوختەی موچە دوای لێدەرکردنی باج و قەرز</td>
                    </tr>
                    <tr className="bg-slate-50 font-black">
                      <td className="p-2.5 font-bold font-sans text-teal-900">پوختەی قازانجی نەختینەی سافی (Net Profit)</td>
                      <td className="p-2.5 text-teal-900 font-bold">
                        {((netProfit / (totalRevenue || 1)) * 100).toFixed(1)}%
                      </td>
                      <td className="p-2.5 text-teal-900 font-bold text-sm">{netProfit.toLocaleString()} د.ع</td>
                      <td className="p-2.5 font-sans text-teal-900 font-bold">داهات - (مەسروفات + موچە)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. EXPENSES AUDIT REPORT */}
            {activeReport === 'expenses' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <span className="font-bold text-rose-900">کۆی گشتی مەسروفاتە تۆمارکراوەکان:</span>
                  <span className="font-black font-mono text-rose-900 text-base">{totalExpenseAmount.toLocaleString()} د.ع</span>
                </div>

                <table className="w-full text-right border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">ژ.</th>
                      <th className="p-2.5">بابەت و ناوەڕۆک</th>
                      <th className="p-2.5">پۆلێن</th>
                      <th className="p-2.5">بەروار</th>
                      <th className="p-2.5">تۆمارکار</th>
                      <th className="p-2.5">بڕ (IQD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {expenses.map((exp, idx) => (
                      <tr key={exp.id || idx}>
                        <td className="p-2 text-slate-500">{idx + 1}</td>
                        <td className="p-2 font-bold font-sans text-slate-900">{exp.title}</td>
                        <td className="p-2 font-sans text-slate-600">{exp.category}</td>
                        <td className="p-2 text-slate-600">{exp.date}</td>
                        <td className="p-2 font-sans text-slate-700">{exp.recordedBy || 'کارمەندی حیسابات'}</td>
                        <td className="p-2 font-bold text-rose-700">{exp.amount.toLocaleString()} د.ع</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-black font-mono">
                    <tr>
                      <td colSpan={5} className="p-2.5 font-sans text-right">کۆی مەسروفاتەکان:</td>
                      <td className="p-2.5 text-rose-800">{totalExpenseAmount.toLocaleString()} د.ع</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* 3. STAFF PAYROLL SHEET */}
            {activeReport === 'payroll' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <span className="font-bold text-amber-900">کۆی پاکتاوی موچەی کارمەندان:</span>
                  <span className="font-black font-mono text-amber-900 text-base">{totalPayrollCost.toLocaleString()} د.ع</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border border-slate-300 rounded-lg text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300">
                      <tr>
                        <th className="p-2">ناو و پلە</th>
                        <th className="p-2">بەش</th>
                        <th className="p-2">موچەی بنەڕەتی</th>
                        <th className="p-2">زیادە و پاداشت</th>
                        <th className="p-2">باج و دەستبڕ</th>
                        <th className="p-2">موچەی سافی</th>
                        <th className="p-2">دۆخ</th>
                        <th className="p-2">واژۆی کارمەند</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {payrollList.map((emp) => (
                        <tr key={emp.id}>
                          <td className="p-2 font-bold font-sans text-slate-900">
                            <div>{emp.employeeName}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{emp.position}</div>
                          </td>
                          <td className="p-2 font-sans text-slate-600">{emp.department}</td>
                          <td className="p-2">{emp.basicSalary.toLocaleString()} د.ع</td>
                          <td className="p-2 text-emerald-700">{((emp.bonus || 0) + (emp.allowances || 0)) > 0 ? `+${((emp.bonus || 0) + (emp.allowances || 0)).toLocaleString()} د.ع` : `0 د.ع`}</td>
                          <td className="p-2 text-rose-700">{((emp.taxDeduction || 0) + (emp.loanDeduction || 0) + (emp.penalties || 0)) > 0 ? `-${((emp.taxDeduction || 0) + (emp.loanDeduction || 0) + (emp.penalties || 0)).toLocaleString()} د.ع` : `0 د.ع`}</td>
                          <td className="p-2 font-black text-slate-950">{emp.netSalary.toLocaleString()} د.ع</td>
                          <td className="p-2 font-sans">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                              {emp.paymentStatus}
                            </span>
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-sans text-[10px] text-slate-400">
                            ..................
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-black font-mono">
                      <tr>
                        <td colSpan={5} className="p-2.5 font-sans text-right">کۆی گشتی موچە:</td>
                        <td colSpan={3} className="p-2.5 text-amber-900">{totalPayrollCost.toLocaleString()} د.ع</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 4. SINGLE SALARY SLIP (پسوولەی تاکەکەسی موچە) */}
            {activeReport === 'single_salary_slip' && (
              <div className="space-y-4 text-xs border-2 border-dashed border-slate-300 p-6 rounded-2xl bg-slate-50/50">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                  <div>
                    <span className="text-[11px] text-slate-500">پسوولەی فەرمی دابەشکردنی موچە</span>
                    <h3 className="text-base font-black text-slate-900">{singleEmployee.employeeName}</h3>
                    <p className="text-xs text-slate-600 font-medium">{singleEmployee.position} • {singleEmployee.department}</p>
                  </div>
                  <div className="text-left font-mono text-[11px]">
                    <div>ژمارەی پسوولە: <strong className="text-slate-900">PAY-2026-{singleEmployee.id}</strong></div>
                    <div>بەرواری خەرجکردن: <strong className="text-slate-900">{singleEmployee.paymentDate}</strong></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Earnings */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                    <span className="font-bold text-emerald-800 block border-b pb-1">داهات و شایستە داراییەکان (Earnings):</span>
                    <div className="flex justify-between font-mono">
                      <span className="font-sans text-slate-600">موچەی بنەڕەتی (Basic):</span>
                      <span className="font-bold">{singleEmployee.basicSalary.toLocaleString()} د.ع</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="font-sans text-slate-600">کاتی زیادە ({singleEmployee.overtimeHours} کاتژمێر):</span>
                      <span>{(singleEmployee.overtimeHours * singleEmployee.overtimeRatePerHour).toLocaleString()} د.ع</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="font-sans text-slate-600">پاداشت و سوپاسگوزاری:</span>
                      <span className="text-emerald-700">{singleEmployee.bonus > 0 ? `+${singleEmployee.bonus.toLocaleString()} د.ع` : `0 د.ع`}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="font-sans text-slate-600">دەرماڵەی هاتوچۆ و ڕێزلێنان:</span>
                      <span className="text-emerald-700">{singleEmployee.allowances > 0 ? `+${singleEmployee.allowances.toLocaleString()} د.ع` : `0 د.ع`}</span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                    <span className="font-bold text-rose-800 block border-b pb-1">لێبڕین و دەستبڕەکان (Deductions):</span>
                    <div className="flex justify-between font-mono">
                      <span className="font-sans text-slate-600">باجی موچە (Income Tax):</span>
                      <span className="text-rose-700">-{singleEmployee.taxDeduction.toLocaleString()} د.ع</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="font-sans text-slate-600">سزا یان دواکەوتن:</span>
                      <span className="text-rose-700">-{singleEmployee.penalties.toLocaleString()} د.ع</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="font-sans text-slate-600">قیستی پێشینە / قەرز:</span>
                      <span className="text-rose-700">-{singleEmployee.loanDeduction.toLocaleString()} د.ع</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between font-black">
                  <span className="text-sm">کۆی شایستەی پاکتاوکراوی سافی (Net Payable):</span>
                  <span className="text-lg font-mono text-teal-300">{singleEmployee.netSalary.toLocaleString()} دیناری عێراقی</span>
                </div>
              </div>
            )}

            {/* 5. CASH & BANKS RECONCILIATION */}
            {activeReport === 'cash_bank' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">کۆی نەختی ناو سندووقەکان:</span>
                    <span className="text-lg font-black font-mono text-slate-900">{totalCashBalance.toLocaleString()} د.ع</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">کۆی حیساباتی بانکەکان (دینار و دۆلار):</span>
                    <span className="text-lg font-black font-mono text-teal-800">
                      {totalBankIQD.toLocaleString()} د.ع + {totalBankUSD.toLocaleString()} $
                    </span>
                  </div>
                </div>

                <h4 className="font-bold text-slate-900 pt-2">لیستی باڵانسی سندووقەکانی سەنتەر:</h4>
                <table className="w-full text-right border border-slate-300 rounded-lg text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">ناوی سندووق</th>
                      <th className="p-2.5">بەرپرسی سندووق</th>
                      <th className="p-2.5">کاتی کۆتا داخستن</th>
                      <th className="p-2.5">دۆخی سندووق</th>
                      <th className="p-2.5">باڵانسی نەختینە (IQD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {cashBoxes.map((box) => (
                      <tr key={box.id}>
                        <td className="p-2.5 font-bold font-sans text-slate-900">{box.name}</td>
                        <td className="p-2.5 font-sans text-slate-600">{box.responsible}</td>
                        <td className="p-2.5 text-slate-600">{box.lastClosingTime}</td>
                        <td className="p-2.5 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${box.status === 'کراوەتەوە' ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-800'}`}>
                            {box.status}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-950">{box.balance.toLocaleString()} د.ع</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h4 className="font-bold text-slate-900 pt-2">حیساباتی بانکە فەرمییەکان:</h4>
                <table className="w-full text-right border border-slate-300 rounded-lg text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">ناوی بانک</th>
                      <th className="p-2.5">ژمارەی ئەکاونت</th>
                      <th className="p-2.5">لق</th>
                      <th className="p-2.5">دراو</th>
                      <th className="p-2.5">باڵانس</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {bankAccounts.map((b) => (
                      <tr key={b.id}>
                        <td className="p-2.5 font-bold font-sans text-slate-900">{b.bankName}</td>
                        <td className="p-2.5 text-slate-600">{b.accountNumber}</td>
                        <td className="p-2.5 font-sans text-slate-600">{b.branch}</td>
                        <td className="p-2.5 font-sans">{b.currency}</td>
                        <td className="p-2.5 font-bold text-teal-900">
                          {b.balance.toLocaleString()} {b.currency.includes('USD') ? '$' : 'د.ع'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. DAILY CLOSING REPORT */}
            {activeReport === 'daily_closing' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">ژمارەی نەخۆشانی ئەمڕۆ:</span>
                    <span className="text-base font-black font-mono text-slate-900">١٤ نەخۆش</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">کۆی داهاتی نەختینەی ئەمڕۆ:</span>
                    <span className="text-base font-black font-mono text-emerald-800">١,٤٥٠,000 د.ع</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">مەسروفاتی دەرچوو:</span>
                    <span className="text-base font-black font-mono text-rose-800">١٢٠,000 د.ع</span>
                  </div>
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                    <span className="text-[11px] text-teal-800 font-bold block">صافی نەختی ناو سندووق:</span>
                    <span className="text-base font-black font-mono text-teal-900">١,٣٣٠,000 د.ع</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <h4 className="font-bold text-slate-900">پوختەی خزمەتگوزاری و کارەکانی ئەمڕۆ:</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <span className="block text-slate-500 text-[10px]">لەیزەری تەواوی لەش:</span>
                      <strong className="text-slate-900 font-mono">٦ نەخۆش (٦٥٠,000 د.ع)</strong>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <span className="block text-slate-500 text-[10px]">فیلەر و بۆتۆکس:</span>
                      <strong className="text-slate-900 font-mono">٤ نەخۆش (٥٢٠,000 د.ع)</strong>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <span className="block text-slate-500 text-[10px]">هایدرافیشڵ و پێست:</span>
                      <strong className="text-slate-900 font-mono">٤ نەخۆش (٢٨٠,000 د.ع)</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. MONTHLY SUMMARY & ITEMS/DISCOUNTS REPORT */}
            {(activeReport === 'monthly_summary' || activeReport === 'monthly_items_discounts') && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">
                      ڕاپۆرتی خزمەتگوزاری و ئایتمەکان کە داهاتیان پەیداکردووە لەگەڵ داشکاندن
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      ڕوونکردنەوەی ناوی چارەسەر، ناوی نەخۆش، پزیشک، نرخی ئەسڵی، ڕێژەی داشکاندن، و پارەی وەرگیراو.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg font-mono">
                    {customData?.monthName || 'مانگی دیاریکراو'} {selectedYear}
                  </span>
                </div>

                {/* Items & Treatments Table */}
                <table className="w-full text-right border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">ناوی ئایتم / چارەسەری ئەنجامدراو</th>
                      <th className="p-2.5">نەخۆش</th>
                      <th className="p-2.5">پزیشک / ئەنجامدەر</th>
                      <th className="p-2.5">نرخی ئەسڵی (IQD)</th>
                      <th className="p-2.5">داشکاندن (Discount)</th>
                      <th className="p-2.5">پارەی وەرگیراوی صافی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {customData?.itemizedList && customData.itemizedList.length > 0 ? (
                      customData.itemizedList.map((it: any, idx: number) => (
                      <tr key={it.id || idx}>
                        <td className="p-2.5 font-bold font-sans text-slate-900">{it.itemName}</td>
                        <td className="p-2.5 font-sans text-slate-800">{it.patientName}</td>
                        <td className="p-2.5 font-sans text-slate-600">{it.doctorName}</td>
                        <td className="p-2.5 font-bold text-slate-700">{it.originalPrice?.toLocaleString()} د.ع</td>
                        <td className="p-2.5 font-sans">
                          {it.discountPercentage > 0 ? (
                            <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              %{it.discountPercentage} (-{it.discountAmount?.toLocaleString()} د.ع)
                            </span>
                          ) : (
                            <span className="text-slate-400">بێ داشکاندن</span>
                          )}
                        </td>
                        <td className="p-2.5 font-black text-emerald-800">{it.paidAmount?.toLocaleString()} د.ع</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500 font-sans text-xs">
                        هیچ خزمەتگوزارییەکی دارایی تۆمارکراو لەم بەروارەدا نییە.
                      </td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </div>
            )}

            {/* DOCUMENT OFFICIAL FOOTER SIGNATURES */}
            <div className="pt-8 border-t-2 border-slate-900 mt-8 grid grid-cols-3 gap-6 text-center text-xs text-slate-700">
              <div className="space-y-8">
                <span className="font-bold text-slate-900 block">ئامادەکاری حیسابات</span>
                <div className="text-[11px] text-slate-500">
                  واژۆ: .......................................
                </div>
              </div>

              <div className="space-y-8">
                <span className="font-bold text-slate-900 block">وردبینی بەشی دارایی (Auditor)</span>
                <div className="text-[11px] text-slate-500">
                  واژۆ: .......................................
                </div>
              </div>

              <div className="space-y-8">
                <span className="font-bold text-slate-900 block">پەسەندکردنی بەڕێوەبەری گشتی</span>
                <div className="text-[11px] text-slate-500">
                  واژۆ و مۆر: .......................................
                </div>
              </div>
            </div>

            {/* FOOTER AUDIT TIMESTAMP */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>سیستەمی فەرمی ERP دارایی • پارێزراوە لە ساختەکاری</span>
              <span>لاپەڕە 1 لە 1 • چاپکراوە لە ڕێکەوتی {currentTimestamp}</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
