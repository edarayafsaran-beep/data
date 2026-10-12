import React, { useState } from 'react';
import { Branch, User, InventoryItem, StaffSalesRewardRecord, Expense } from '../types';
import {
  Award,
  Sparkles,
  PlusCircle,
  DollarSign,
  TrendingUp,
  Package,
  CheckCircle2,
  Trash2,
  Printer,
  Tag,
  Users,
  Building2,
  AlertCircle,
  X,
  MessageSquare,
  Send,
  BarChart3,
  Wallet,
} from 'lucide-react';

interface BranchStaffSalesRewardsViewProps {
  activeBranchId: number | null;
  branches: Branch[];
  staffUsers: User[];
  inventory: InventoryItem[];
  onUpdateInventory: (updatedInventory: InventoryItem[]) => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'branchId'>) => void;
  currentUser: User | null;
}

export const BranchStaffSalesRewardsView: React.FC<BranchStaffSalesRewardsViewProps> = ({
  activeBranchId,
  branches,
  staffUsers,
  inventory,
  onUpdateInventory,
  onAddExpense,
  currentUser,
}) => {
  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];
  const branchId = activeBranch?.id || 1;

  const [activeSubTab, setActiveSubTab] = useState<'records' | 'comparison' | 'whatsapp_log'>('records');

  // Predefined catalog items with Standard Price & Discount Price
  const [catalogItems] = useState<Array<{
    id: number;
    name: string;
    type: 'خزمەتگوزاری / جلسە' | 'بەرهەمی جوانکاری' | 'کەمپەینی مارکێتینگ';
    standardPrice: number;
    discountPrice: number;
    costPrice: number;
    linkedInventoryName?: string;
  }>>([
    { id: 1, name: 'جلسەی لەیزەری ئەلێکساندەر (Full Body)', type: 'خزمەتگوزاری / جلسە', standardPrice: 150000, discountPrice: 120000, costPrice: 20000, linkedInventoryName: 'گەڵی لەیزەر' },
    { id: 2, name: 'دەرزی فیلەری لێو و ڕوومەت (Juvederm/Neuramis)', type: 'بەرهەمی جوانکاری', standardPrice: 250000, discountPrice: 210000, costPrice: 120000, linkedInventoryName: 'فیلەری هیالورۆنیک' },
    { id: 3, name: 'دەرزی بۆتۆکسی چاو و ناوچاوان (Botox Allergan)', type: 'بەرهەمی جوانکاری', standardPrice: 180000, discountPrice: 150000, costPrice: 80000, linkedInventoryName: 'تۆپی بۆتۆکس' },
    { id: 4, name: 'جلسەی هایدرۆفەیشڵی پزیشکی (HydraFacial)', type: 'خزمەتگوزاری / جلسە', standardPrice: 100000, discountPrice: 80000, costPrice: 15000, linkedInventoryName: 'سێرومی هایدرۆفەیشڵ' },
    { id: 5, name: 'کمیسیۆنی مارکێتینگ و پڕۆمۆشنی سۆشیال میدیا', type: 'کەمپەینی مارکێتینگ', standardPrice: 100000, discountPrice: 75000, costPrice: 0 },
  ]);

  // Records for Branch Staff Sales & Rewards
  const [records, setRecords] = useState<StaffSalesRewardRecord[]>([]);

  // WhatsApp logs simulation
  const [whatsappLogs, setWhatsappLogs] = useState<Array<{
    id: number;
    employeeName: string;
    phone: string;
    message: string;
    status: string;
    time: string;
  }>>([]);

  // Modal State for adding new record
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedEmp, setSelectedEmp] = useState<string>(staffUsers[0]?.name || '');
  const [selectedCatalogId, setSelectedCatalogId] = useState<number>(1);
  const [priceMode, setPriceMode] = useState<'Standard' | 'Discount'>('Standard');
  const [quantity, setQuantity] = useState<number>(1);
  const [bonusRate, setBonusRate] = useState<number>(15); // percentage
  const [customNotes, setCustomNotes] = useState<string>('');
  const [sendWhatsappAlert, setSendWhatsappAlert] = useState<boolean>(true);

  const currentCatalogItem = catalogItems.find((c) => c.id === selectedCatalogId) || catalogItems[0];
  const activeUnitPrice = priceMode === 'Standard' ? currentCatalogItem.standardPrice : currentCatalogItem.discountPrice;
  const totalRev = activeUnitPrice * quantity;
  const computedBonus = Math.round((totalRev * bonusRate) / 100);
  const estimatedCost = currentCatalogItem.costPrice * quantity;
  const computedNetProfit = totalRev - estimatedCost - computedBonus;

  const handleAddRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !currentCatalogItem) return;

    // 1. Create Staff Sales & Reward record
    const newRecord: StaffSalesRewardRecord = {
      id: Date.now(),
      branchId: branchId,
      employeeName: selectedEmp,
      itemName: currentCatalogItem.name,
      itemType: currentCatalogItem.type,
      priceType: priceMode === 'Standard' ? 'نرخی بنەڕەتی (Standard)' : 'نرخی داشکاندن (Discount)',
      unitPrice: activeUnitPrice,
      quantity: Number(quantity),
      totalRevenue: totalRev,
      employeeBonusRate: Number(bonusRate),
      employeeBonusAmount: computedBonus,
      netProfit: computedNetProfit,
      date: new Date().toISOString().split('T')[0],
      notes: customNotes || `پاداشتی فرۆشتن و مارکێتینگ بۆ کارمەند (${selectedEmp})`,
    };

    setRecords([newRecord, ...records]);

    // 2. Automatically Deduct from Inventory if linked
    if (currentCatalogItem.linkedInventoryName) {
      const updatedInv = inventory.map((invItem) => {
        if (
          invItem.branchId === branchId &&
          (invItem.itemName || '').toLowerCase().includes((currentCatalogItem.linkedInventoryName || '').toLowerCase())
        ) {
          const newQty = Math.max(0, invItem.currentStock - Number(quantity));
          return { ...invItem, currentStock: newQty };
        }
        return invItem;
      });
      onUpdateInventory(updatedInv);
    }

    // 3. Automatically record as an expense so it hits General & Daily accounts!
    onAddExpense({
      title: `پاداشت و کمیسیۆنی کارمەند: ${selectedEmp} (${currentCatalogItem.name})`,
      category: 'مەسروفاتی ڕۆژانە',
      amount: computedBonus,
      date: new Date().toISOString().split('T')[0],
      recordedBy: currentUser?.name || 'سوپەر ئەدمین',
      notes: `بڕی فرۆشتن: ${totalRev.toLocaleString()} د.ع | کمیسیۆن (${bonusRate}%): ${computedBonus.toLocaleString()} د.ع`,
    });

    // 4. Simulate WhatsApp Alert if checked
    if (sendWhatsappAlert) {
      const newWaLog = {
        id: Date.now(),
        employeeName: selectedEmp,
        phone: '0770XXXXXXX',
        message: `سڵاو بەڕێز ${selectedEmp}، پاداشتی مارکێتینگ و کمیسیۆنت بە بڕی ${computedBonus.toLocaleString()} د.ع بۆ (${currentCatalogItem.name}) تۆمارکرا.`,
        status: 'نێردرا (WhatsApp API)',
        time: new Date().toLocaleTimeString(),
      };
      setWhatsappLogs([newWaLog, ...whatsappLogs]);
    }

    // Reset Form
    setCustomNotes('');
    setQuantity(1);
    setShowAddModal(false);
  };

  const handleDeleteRecord = (id: number) => {
    if (confirm('ئایا دڵنیایت لە سڕینەوەی ئەم تۆمارە؟')) {
      setRecords(records.filter((r) => r.id !== id));
    }
  };

  // Filter records for active branch
  const branchRecords = records.filter((r) => r.branchId === branchId);
  const totalBranchRevenue = branchRecords.reduce((acc, curr) => acc + curr.totalRevenue, 0);
  const totalBranchBonuses = branchRecords.reduce((acc, curr) => acc + curr.employeeBonusAmount, 0);
  const totalBranchNetProfit = branchRecords.reduce((acc, curr) => acc + curr.netProfit, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 p-6 md:p-8 rounded-[36px] border border-cyan-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-full">
              لق: {activeBranch?.name} ({activeBranch?.address || 'لقی کلینیک'})
            </span>
            <span className="text-xs text-slate-400 font-mono">Advanced Staff Sales, Payroll Sync & WhatsApp Alerts</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">بەڕێوەبردنی فرۆشتن، پاداشت و بەستنەوەی موچە و وەتس ئەپ</h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
            دیاریکردنی نرخ (بنەڕەتی و داشکاندن)، کەمبوونەوەی عەمبار، ناردنی ئاگاداری وەتس ئەپ بۆ کارمەند، و بەستنەوە بە لیستی موچەی مانگانە.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold text-slate-200 flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>چاپکردن</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 active:scale-95 text-slate-950 font-black rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 text-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>تۆمارکردنی فرۆشتن و پاداشت</span>
          </button>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 p-2 bg-slate-950/80 rounded-2xl border border-white/10 w-fit text-xs">
        <button
          onClick={() => setActiveSubTab('records')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'records' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>تۆماری فرۆشتن و پاداشت</span>
        </button>
        <button
          onClick={() => setActiveSubTab('comparison')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'comparison' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>بەراوردی ئاستی لقەکان</span>
        </button>
        <button
          onClick={() => setActiveSubTab('whatsapp_log')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'whatsapp_log' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>لۆگی ئاگادارییەکانی وەتس ئەپ</span>
        </button>
      </div>

      {/* SUB-TAB: RECORDS */}
      {activeSubTab === 'records' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/70 p-5 rounded-3xl border border-white/10 backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>کۆی گشتی فرۆشتن و داهاتی لق</span>
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-300 font-mono">
                {totalBranchRevenue.toLocaleString()} <span className="text-xs">د.ع</span>
              </div>
            </div>

            <div className="bg-slate-900/70 p-5 rounded-3xl border border-white/10 backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>کۆی پاداشت و کمیسیۆنی کارمەندان</span>
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono">
                {totalBranchBonuses.toLocaleString()} <span className="text-xs">د.ع</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-950/90 to-slate-900 p-5 rounded-3xl border-2 border-cyan-500/40 backdrop-blur-md space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-cyan-300 text-xs font-bold">
                <span>قازانجی پاکی سەنتەر (Net Profit)</span>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-300 font-mono">
                {totalBranchNetProfit.toLocaleString()} <span className="text-xs">د.ع</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" /> تۆماری فرۆشتن و پاداشتی کارمەندان ({activeBranch?.name})
              </h3>
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold rounded-xl">
                {branchRecords.length} تۆمار
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="p-3.5">کارمەند / پزیشک</th>
                    <th className="p-3.5">بابەت / خزمەتگوزاری</th>
                    <th className="p-3.5">جۆری نرخ</th>
                    <th className="p-3.5">نرخی یەکە × بڕ</th>
                    <th className="p-3.5">کۆی داهات</th>
                    <th className="p-3.5">پاداشت و موچە (Payroll Sync)</th>
                    <th className="p-3.5">قازانجی پاک</th>
                    <th className="p-3.5">بەروار</th>
                    <th className="p-3.5 text-left">کردار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {branchRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-slate-500">
                        هیچ تۆمارێک بۆ ئەم لقمە نییە.
                      </td>
                    </tr>
                  ) : (
                    branchRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="p-3.5 font-bold text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>{r.employeeName}</span>
                        </td>
                        <td className="p-3.5">
                          <strong className="text-slate-200 block">{r.itemName}</strong>
                          <span className="text-[10px] text-teal-300 font-mono">{r.itemType}</span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            r.priceType.includes('Standard') ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {r.priceType}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300">
                          {r.unitPrice.toLocaleString()} × {r.quantity}
                        </td>
                        <td className="p-3.5 font-mono font-black text-cyan-300">
                          {r.totalRevenue.toLocaleString()} د.ع
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-amber-300">
                            +{r.employeeBonusAmount.toLocaleString()} د.ع
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md mt-1">
                            <CheckCircle2 className="w-3 h-3" /> بەستراوە بە موچە (Synced)
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-black text-emerald-300">
                          {r.netProfit.toLocaleString()} د.ع
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">{r.date}</td>
                        <td className="p-3.5 text-left">
                          <button
                            onClick={() => handleDeleteRecord(r.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition cursor-pointer"
                            title="سڕینەوە"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: COMPARISON OF BRANCHES */}
      {activeSubTab === 'comparison' && (
        <div className="bg-slate-900/60 p-6 md:p-8 rounded-[36px] border border-white/10 space-y-6 shadow-md">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-cyan-400" /> بەراوردی ئاستی فرۆشتن و پاداشت لە نێوان لقەکاندا (Branch Comparison Analytics)
            </h3>
            <p className="text-xs text-slate-400 mt-1">تێکڕای فرۆشتن، پاداشتی کارمەندان و قازانجی پاک بەپێی لقەکان</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {branches.map((b) => {
              const bRecs = records.filter((r) => r.branchId === b.id);
              const bRev = bRecs.reduce((acc, curr) => acc + curr.totalRevenue, 0);
              const bBonus = bRecs.reduce((acc, curr) => acc + curr.employeeBonusAmount, 0);
              const bNet = bRecs.reduce((acc, curr) => acc + curr.netProfit, 0);

              return (
                <div key={b.id} className="bg-slate-950 p-6 rounded-3xl border border-white/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-cyan-400" />
                      <strong className="text-white text-base">{b.name}</strong>
                    </div>
                    <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-300 text-[10px] font-mono rounded-lg">
                      {b.address || 'لقی کلینیک'}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                      <span className="text-slate-400">کۆی فرۆشتن:</span>
                      <strong className="text-cyan-300 font-mono text-sm">{bRev.toLocaleString()} د.ع</strong>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                      <span className="text-slate-400">پاداشت و کمیسیۆن:</span>
                      <strong className="text-amber-300 font-mono text-sm">{bBonus.toLocaleString()} د.ع</strong>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                      <span className="text-slate-400">قازانجی پاک:</span>
                      <strong className="text-emerald-300 font-mono text-sm">{bNet.toLocaleString()} د.ع</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB: WHATSAPP LOGS */}
      {activeSubTab === 'whatsapp_log' && (
        <div className="bg-slate-900/60 p-6 md:p-8 rounded-[36px] border border-white/10 space-y-6 shadow-md">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-400" /> تۆماری نامە و ئاگادارییەکانی وەتس ئەپ بۆ کارمەندان (WhatsApp Notifications)
            </h3>
            <p className="text-xs text-slate-400 mt-1">ئاگادارکردنەوەی کارمەندان لە کاتی تۆمارکردنی پاداشت و کمیسیۆن</p>
          </div>

          <div className="space-y-3">
            {whatsappLogs.map((log) => (
              <div key={log.id} className="bg-slate-950 p-4 rounded-2xl border border-white/10 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-white">{log.employeeName}</strong>
                    <span className="text-slate-400 font-mono">({log.phone})</span>
                  </div>
                  <p className="text-slate-300 bg-white/5 p-3 rounded-xl leading-relaxed">{log.message}</p>
                </div>
                <div className="text-left shrink-0 space-y-1">
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-[10px] font-bold block">
                    {log.status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD NEW RECORD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-[32px] w-full max-w-xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">تۆمارکردنی فرۆشتن، پاداشت و بەستنەوە بە موچە</h3>
                  <p className="text-xs text-slate-400">لق: {activeBranch?.name} - عەمبار و وەتس ئەپ ئۆتۆماتیک</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRecordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">کارمەند / پزیشکی جێبەجێکار *</label>
                <select
                  value={selectedEmp}
                  onChange={(e) => setSelectedEmp(e.target.value)}
                  className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-white outline-none focus:border-cyan-400 font-bold"
                >
                  {staffUsers.map((u, i) => (
                    <option key={i} value={u.name}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">خزمەتگوزاری یان بەرهەم (بەپێی نرخ و عەمبار) *</label>
                <select
                  value={selectedCatalogId}
                  onChange={(e) => setSelectedCatalogId(Number(e.target.value))}
                  className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-cyan-300 outline-none focus:border-cyan-400 font-bold"
                >
                  {catalogItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} | بنەڕەتی: {item.standardPrice.toLocaleString()} د.ع | داشکاندن: {item.discountPrice.toLocaleString()} د.ع
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setPriceMode('Standard')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    priceMode === 'Standard'
                      ? 'bg-indigo-500/20 border-indigo-400 text-white'
                      : 'bg-slate-950 border-white/10 text-slate-400'
                  }`}
                >
                  <span className="block text-[11px] font-bold">نرخی بنەڕەتی (Standard Price)</span>
                  <strong className="text-lg font-black font-mono text-indigo-300 mt-1 block">
                    {currentCatalogItem.standardPrice.toLocaleString()} د.ع
                  </strong>
                </div>

                <div
                  onClick={() => setPriceMode('Discount')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    priceMode === 'Discount'
                      ? 'bg-amber-500/20 border-amber-400 text-white'
                      : 'bg-slate-950 border-white/10 text-slate-400'
                  }`}
                >
                  <span className="block text-[11px] font-bold">نرخی داشکاندن (Discount Price)</span>
                  <strong className="text-lg font-black font-mono text-amber-300 mt-1 block">
                    {currentCatalogItem.discountPrice.toLocaleString()} د.ع
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold">بڕ / ژمارە (Quantity) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-white font-mono font-bold outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold">رێژەی پاداشت / کمیسیۆن (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={bonusRate}
                    onChange={(e) => setBonusRate(Number(e.target.value))}
                    className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-amber-300 font-mono font-bold outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>کۆی گشتی داهاتی مامەڵە:</span>
                  <strong className="text-cyan-300 font-mono text-sm">{totalRev.toLocaleString()} د.ع</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>پاداشت و کمیسیۆن (بەستراو بە موچە):</span>
                  <strong className="text-amber-300 font-mono">{computedBonus.toLocaleString()} د.ع</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>قازانجی پاکی سەنتەر:</span>
                  <strong className="text-emerald-300 font-mono">{computedNetProfit.toLocaleString()} د.ع</strong>
                </div>
                {currentCatalogItem.linkedInventoryName && (
                  <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-teal-300 text-[11px]">
                    <Package className="w-4 h-4 text-teal-400" />
                    <span>بە شێوەیەکی ئۆتۆماتیکی بڕی {quantity} لە عەمباری ({currentCatalogItem.linkedInventoryName}) کەم دەبێتەوە.</span>
                  </div>
                )}
              </div>

              {/* WhatsApp Checkbox */}
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl">
                <input
                  type="checkbox"
                  id="waCheck"
                  checked={sendWhatsappAlert}
                  onChange={(e) => setSendWhatsappAlert(e.target.checked)}
                  className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
                />
                <label htmlFor="waCheck" className="text-emerald-200 text-xs font-bold cursor-pointer flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>ناردنی ئاگاداری وەتس ئەپ بۆ کارمەند لە کاتی تۆمارکردن</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">تێبینی و ڕونکردنەوە</label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="تێبینی بنووسە..."
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-2xl text-white outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-black rounded-xl shadow-md cursor-pointer hover:opacity-90 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>تۆمارکردن، عەمبار و ناردن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
