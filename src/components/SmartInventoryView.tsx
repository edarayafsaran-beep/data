import React, { useState } from 'react';
import { InventoryItem } from '../types';
import {
  Package,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Trash2,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Layers,
  Building2,
  CreditCard,
} from 'lucide-react';
import {
  STANDARD_INVENTORY_PRESETS,
  STANDARD_INVENTORY_CATEGORIES,
} from '../constants/standardPresets';

interface SmartInventoryViewProps {
  inventory: InventoryItem[];
  onAddInventoryItem: (item: Omit<InventoryItem, 'id' | 'branchId'>) => void;
  onUpdateStock: (id: number, newStock: number) => void;
}

export const SmartInventoryView: React.FC<SmartInventoryViewProps> = ({
  inventory,
  onAddInventoryItem,
  onUpdateStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // New Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('فیلەر و بۆتۆکس');
  const [currentStock, setCurrentStock] = useState(10);
  const [minStockAlert, setMinStockAlert] = useState(5);
  const [unit, setUnit] = useState<InventoryItem['unit']>('دانە');
  const [expiryDate, setExpiryDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]);
  const [supplierName, setSupplierName] = useState('');
  const [unitCost, setUnitCost] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [usageMonthlyForecast, setUsageMonthlyForecast] = useState(0);

  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  const totalPrice = Number(currentStock) * Number(unitCost);
  const remainingAmount = Math.max(0, totalPrice - Number(paidAmount));

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) return;
    const preset = STANDARD_INVENTORY_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setItemName(preset.itemName);
    setCategory(preset.category);
    setUnit(preset.unit);
    setSupplierName(preset.supplierName);
    setUnitCost(preset.unitCost);
    setMinStockAlert(preset.minStockAlert);
    setUsageMonthlyForecast(preset.usageMonthlyForecast);
    setPaidAmount(preset.unitCost * 10); // default paid

    const exp = new Date();
    exp.setMonth(exp.getMonth() + (preset.shelfLifeMonths || 24));
    setExpiryDate(exp.toISOString().split('T')[0]);
  };

  const safeInventory = Array.isArray(inventory) ? inventory : [];

  const filteredItems = safeInventory.filter((item) => {
    if (!item) return false;
    const itemName = (item.itemName || (item as any).name || '').toLowerCase();
    const supplierName = (item.supplierName || '').toLowerCase();
    const query = (searchTerm || '').trim().toLowerCase();
    const matchesSearch = !query || itemName.includes(query) || supplierName.includes(query);
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = safeInventory.filter((i) => i && Number(i.currentStock || 0) <= Number(i.minStockAlert || 0));
  const expiringItems = safeInventory.filter((i) => {
    if (!i || !i.expiryDate) return false;
    const exp = new Date(i.expiryDate).getTime();
    if (isNaN(exp)) return false;
    const now = new Date().getTime();
    const daysDiff = (exp - now) / (1000 * 3600 * 24);
    return daysDiff <= 90 && daysDiff > 0;
  });

  const totalInventoryValue = safeInventory.reduce((acc, curr) => acc + ((Number(curr?.currentStock) || 0) * (Number(curr?.unitCost) || 0)), 0);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) return;
    onAddInventoryItem({
      itemName,
      category,
      currentStock: Number(currentStock),
      minStockAlert: Number(minStockAlert),
      unit,
      expiryDate,
      supplierName,
      unitCost: Number(unitCost),
      usageMonthlyForecast: Number(usageMonthlyForecast),
      paidAmount: Number(paidAmount),
      remainingAmount: Number(remainingAmount),
    });
    
    // Reset
    setItemName('');
    setSupplierName('');
    setUnitCost(0);
    setPaidAmount(0);
    setCurrentStock(10);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/40 p-6 md:p-10 rounded-[40px] border border-white/10 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] font-black uppercase tracking-widest rounded-full">
                Inventory & Supplier Accounting
              </span>
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-widest rounded-full">
                Branch Isolated
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white">عەمبار و کۆگای کەرەستە (حیساباتی کۆمپانیاکان)</h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              تۆمارکردنی جۆری مەواد، ناوی کۆمپانیای دابینکەر، نرخی دانە، کۆی گشتی، پارەی دراو و قەرزی ماوە بۆ کۆمپانیا.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="group px-7 py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-2xl shadow-md shadow-teal-500/20 transition-all flex items-center gap-3 active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            <span>زیادکردنی مەوادی نوێ</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[32px] border border-white/10 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-xl">کۆی گشتی</span>
          </div>
          <span className="text-slate-400 text-xs font-bold block">سەرجەم ئایتمەکانی عەمبار</span>
          <div className="text-2xl font-black text-white font-mono mt-1">{safeInventory.length} ئایتم</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[32px] border border-white/10 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-xl">بەهای عەمبار</span>
          </div>
          <span className="text-slate-400 text-xs font-bold block">کۆی بەهای کاڵاکان</span>
          <div className="text-2xl font-black text-blue-300 font-mono mt-1">{totalInventoryValue.toLocaleString()} <span className="text-xs">د.ع</span></div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[32px] border border-white/10 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl">ئاگاداری</span>
          </div>
          <span className="text-slate-400 text-xs font-bold block">مەوادی کەمبوو لە عەمبار</span>
          <div className="text-2xl font-black text-amber-300 font-mono mt-1">{lowStockItems.length} ئایتم</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-[32px] border border-white/10 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-xl">بەسەرچوون</span>
          </div>
          <span className="text-slate-400 text-xs font-bold block">نزیک لە بەسەرچوون</span>
          <div className="text-2xl font-black text-rose-300 font-mono mt-1">{expiringItems.length} ئایتم</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="absolute right-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="گەڕان بەدوای ناوی مەواد یان ناوی کۆمپانیا..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-12 py-3.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-teal-500 transition-all font-bold"
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 no-scrollbar p-1.5 bg-slate-950/95 rounded-2xl border-2 border-teal-500/30 backdrop-blur-2xl">
          {['all', 'فیلەر و بۆتۆکس', 'کەرەستەی لەیزەر', 'سیرۆم و سکین کێر', 'مەوادی یەکجار بەکارهاتوو'].map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = cat === 'all' ? safeInventory.length : safeInventory.filter(i => i && i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-300 cursor-pointer select-none flex items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 text-slate-950 shadow-md scale-[1.03] border border-white/60' 
                    : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/5'
                }`}
              >
                <span>{cat === 'all' ? 'سەرجەم مەوادەکان' : cat}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                  isSelected ? 'bg-slate-950/30 text-slate-950' : 'bg-teal-500/20 text-teal-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Inventory Table with Company Accounting */}
      <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[36px] overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-white/10">
                <th className="p-4">کاڵا / مەواد</th>
                <th className="p-4">کۆمپانیا (دابینکەر)</th>
                <th className="p-4">بڕی بەردەست</th>
                <th className="p-4">نرخی دانە</th>
                <th className="p-4">کۆی گشتی نرخ</th>
                <th className="p-4">پارەی دراو</th>
                <th className="p-4">پارەی ماوە (قەرز)</th>
                <th className="p-4 text-left">کردارە خێراکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map((item) => {
                const isLow = item.currentStock <= item.minStockAlert;
                const totPrice = item.currentStock * (item.unitCost || 0);
                const paid = item.paidAmount !== undefined ? item.paidAmount : totPrice; // default fully paid if not set
                const rem = item.remainingAmount !== undefined ? item.remainingAmount : Math.max(0, totPrice - paid);

                return (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="space-y-1">
                        <strong className="text-white text-sm block group-hover:text-teal-300 transition-colors">{item.itemName}</strong>
                        <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 inline-block font-mono">
                          {item.category}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{item.supplierName || 'دیاری نەکراوە'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <strong className={`font-mono text-base ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {item.currentStock} {item.unit}
                      </strong>
                      {isLow && (
                        <span className="block text-[9px] text-amber-500 font-bold">بڕی کەمە!</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {(item.unitCost || 0).toLocaleString()} د.ع
                    </td>
                    <td className="p-4 font-mono font-black text-cyan-300">
                      {totPrice.toLocaleString()} د.ع
                    </td>
                    <td className="p-4 font-mono text-emerald-300 font-bold">
                      {paid.toLocaleString()} د.ع
                    </td>
                    <td className="p-4 font-mono">
                      {rem > 0 ? (
                        <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl font-bold">
                          {rem.toLocaleString()} د.ع
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold">
                          تسویه کراوە (0)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onUpdateStock(item.id, item.currentStock + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/20 transition-all cursor-pointer"
                          title="+1 زیادکردن"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onUpdateStock(item.id, Math.max(0, item.currentStock - 1))}
                          className="w-8 h-8 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-all cursor-pointer"
                          title="-1 کەمکردن"
                        >
                          <span className="font-bold">-</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredItems.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <Package className="w-16 h-16 text-slate-700 mx-auto opacity-20" />
            <p className="text-slate-500 font-bold">هیچ مەوادێک نەدۆزرایەوە</p>
          </div>
        )}
      </div>

      {/* Add New Item Modal with Company Accounting */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-teal-500/40 rounded-[36px] w-full max-w-xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">تۆمارکردنی کاڵا و حیساباتی کۆمپانیا</h3>
                  <p className="text-xs text-slate-400">ناوی ئایتم، کۆمپانیا، نرخ، پارەی دراو و پارەی ماوە</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              {/* Standard Preset Picker */}
              <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-2xl space-y-2">
                <label className="text-teal-300 block font-black flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                  <span>هەڵبژاردنی خێرا لە کۆگای سابت (Preset)</span>
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="w-full bg-slate-950 border border-teal-500/30 rounded-xl p-3 text-white outline-none focus:border-teal-400 font-bold cursor-pointer"
                >
                  <option value="">-- ئایتمێک لە کۆگای سابت هەڵبژێرە --</option>
                  {STANDARD_INVENTORY_CATEGORIES.map((cat) => (
                    <optgroup key={cat} label={`━━━━ ${cat} ━━━━`}>
                      {STANDARD_INVENTORY_PRESETS.filter((p) => p.category === cat).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.itemName} ({p.unitCost.toLocaleString()} د.ع / {p.unit}) - کۆمپانیا: {p.supplierName}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1.5 font-bold">ناوی کاڵا / مەواد (Item Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="ناوی مەواد بنووسە..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-2xl p-3.5 text-white outline-none focus:border-teal-400 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold">جۆری مەواد *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/15 rounded-2xl p-3.5 text-white outline-none focus:border-teal-400 font-bold"
                  >
                    <option value="فیلەر و بۆتۆکس">فیلەر و بۆتۆکس (Injectables)</option>
                    <option value="کەرەستەی لەیزەر">کەرەستەی لەیزەر (Laser Supplies)</option>
                    <option value="سیرۆم و سکین کێر">سیرۆم و سکین کێر (Skincare)</option>
                    <option value="مەوادی یەکجار بەکارهاتوو">مەوادی یەکجار بەکارهاتوو (Disposables)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold">ناوی کۆمپانیای دابینکەر (Supplier Company) *</label>
                  <input
                    type="text"
                    required
                    placeholder="ناوی کۆمپانیا..."
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-2xl p-3.5 text-white outline-none focus:border-teal-400 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold text-[11px]">بڕ (Quantity)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-2xl p-3.5 text-white font-mono font-bold outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold text-[11px]">یەکە (Unit)</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/15 rounded-2xl p-3.5 text-white outline-none focus:border-teal-400 font-bold"
                  >
                    <option value="دانە">دانە</option>
                    <option value="پاکەت">پاکەت</option>
                    <option value="لیتر">لیتر</option>
                    <option value="کیلۆ">کیلۆ</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold text-[11px]">نرخی دانە (IQD)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-2xl p-3.5 text-teal-300 font-mono font-bold outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold text-[11px]">پارەی دراو (پیشەکی)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-2xl p-3.5 text-emerald-300 font-mono font-bold outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Financial Summary Box */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-teal-500/30 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>کۆی گشتی نرخ (Total Price):</span>
                  <strong className="text-cyan-300 font-mono text-sm">{totalPrice.toLocaleString()} د.ع</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>بڕی پارەی دراو (Paid Amount):</span>
                  <strong className="text-emerald-300 font-mono">{Number(paidAmount).toLocaleString()} د.ع</strong>
                </div>
                <div className="flex justify-between text-slate-300 pt-2 border-t border-white/10">
                  <span>پارەی ماوە بۆ کۆمپانیا (Remaining Debt):</span>
                  <strong className="text-rose-400 font-mono text-sm">{remainingAmount.toLocaleString()} د.ع</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold">بەرواری بەسەرچوون</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-2xl p-3.5 text-white font-mono outline-none focus:border-teal-400 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold">حەدی هۆشداری (Min Alert)</label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-2xl p-3.5 text-white font-mono outline-none focus:border-teal-400 text-xs"
                  />
                </div>
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
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-400 to-blue-500 text-slate-950 font-black rounded-xl shadow-md cursor-pointer hover:opacity-90"
                >
                  پاشەکەوتکردنی کاڵا و حیسابات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
