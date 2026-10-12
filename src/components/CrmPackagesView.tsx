import React, { useState } from 'react';
import {
  Patient,
  TreatmentPackage,
  MembershipTier,
} from '../types';
import {
  Users,
  Package,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Star,
  Zap,
  Sparkles,
  Award,
  Gift,
  MessageCircle,
  Crown,
  Percent,
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  ChevronLeft,
  X,
  UserCheck,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';
import {
  STANDARD_AESTHETIC_PROCEDURES,
  STANDARD_PROCEDURE_CATEGORIES,
  STANDARD_PACKAGE_PRESETS,
} from '../constants/standardPresets';

interface CrmPackagesViewProps {
  patients: Patient[];
  packages: TreatmentPackage[];
  onAddPackage: (pkg: Omit<TreatmentPackage, 'id' | 'branchId'>) => void;
  onUpdatePatient?: (id: number, updated: Partial<Patient>) => Promise<void>;
  activeBranchId?: number | null;
}

export const CrmPackagesView: React.FC<CrmPackagesViewProps> = ({
  patients,
  packages,
  onAddPackage,
  onUpdatePatient,
  activeBranchId,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'packages' | 'loyalty' | 'vip' | 'followup'>('packages');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedPkgId, setCopiedPkgId] = useState<number | null>(null);

  // Modal: Create Package
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [newPackageName, setNewPackageName] = useState('');
  const [newSessionsCount, setNewSessionsCount] = useState(6);
  const [newTreatmentName, setNewTreatmentName] = useState('پاکێجی لەیزەری ئەلێکساندەر + هایدرۆفەیشڵ');
  const [newOriginalPrice, setNewOriginalPrice] = useState(450000);
  const [newDiscountPrice, setNewDiscountPrice] = useState(360000);
  const [newValidityDays, setNewValidityDays] = useState(90);

  // Modal: Assign/Sell Package to Patient
  const [selectedPkgToSell, setSelectedPkgToSell] = useState<TreatmentPackage | null>(null);
  const [selectedPatientForPkg, setSelectedPatientForPkg] = useState<number | null>(null);
  const [pkgSaleNotes, setPkgSaleNotes] = useState('');
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(null);

  // Modal: Quick Custom Points
  const [customPointsPatient, setCustomPointsPatient] = useState<Patient | null>(null);
  const [customPointsAmount, setCustomPointsAmount] = useState(50);
  const [customPointsAction, setCustomPointsAction] = useState<'add' | 'subtract'>('add');

  // Filter patients by branch if activeBranchId is set
  const branchPatients = activeBranchId
    ? patients.filter((p) => p.branchId === activeBranchId)
    : patients;

  const branchPackages = activeBranchId
    ? packages.filter((p) => p.branchId === activeBranchId)
    : packages;

  // Filtered patients for search
  const filteredPatients = branchPatients.filter((p) => {
    if (!p) return false;
    const q = (searchTerm || '').toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(q) ||
      (p.patientCode || '').toLowerCase().includes(q) ||
      (p.chiefComplaint && (p.chiefComplaint || '').toLowerCase().includes(q))
    );
  });

  // KPI Calculations
  const totalVipPatients = branchPatients.filter((p) => p.isVip || p.membershipTier === 'VIP' || p.membershipTier === 'Gold').length;
  const totalLoyaltyPoints = branchPatients.reduce((sum, p) => sum + (p.loyaltyPoints || 0), 0);
  const followUpNeededCount = branchPatients.filter(
    (p) => (p.totalSessionsCompleted > 0 && p.totalSessionsCompleted < 6) || p.isVip
  ).length;

  // Handler: Create Package
  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackageName.trim()) return;
    const discountPerc = Math.max(
      0,
      Math.round(((newOriginalPrice - newDiscountPrice) / (newOriginalPrice || 1)) * 100)
    );

    onAddPackage({
      packageName: newPackageName.trim(),
      sessionsCount: Number(newSessionsCount),
      treatmentName: newTreatmentName.trim(),
      originalPrice: Number(newOriginalPrice),
      discountPrice: Number(newDiscountPrice),
      discountPercentage: discountPerc,
      validityDays: Number(newValidityDays),
    });

    setShowPackageModal(false);
    setNewPackageName('');
  };

  // Handler: Assign Package to Patient
  const handleAssignPackageToPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkgToSell || !selectedPatientForPkg) return;

    const patient = branchPatients.find((p) => p.id === selectedPatientForPkg);
    if (!patient) return;

    const addedPoints = Math.round(selectedPkgToSell.discountPrice / 10000); // 1 point per 10k IQD
    const currentPoints = patient.loyaltyPoints || 0;
    const newPoints = currentPoints + addedPoints;

    const updatedComplaint = patient.chiefComplaint
      ? `${patient.chiefComplaint} + ${selectedPkgToSell.packageName}`
      : selectedPkgToSell.packageName;

    if (onUpdatePatient) {
      await onUpdatePatient(patient.id, {
        chiefComplaint: updatedComplaint,
        loyaltyPoints: newPoints,
        lastFollowUpNotes: pkgSaleNotes || `کڕینی ${selectedPkgToSell.packageName} لە ڕێکەوتی ئەمرۆ`,
      });
    }

    setSaleSuccessMessage(`پاکێجی "${selectedPkgToSell.packageName}" بۆ ${patient.name} تۆمارکرا (+${addedPoints} خاڵی وەفاداری).`);
    setTimeout(() => {
      setSelectedPkgToSell(null);
      setSelectedPatientForPkg(null);
      setPkgSaleNotes('');
      setSaleSuccessMessage(null);
    }, 1800);
  };

  // Handler: Quick Add / Remove Loyalty Points
  const handleQuickPoints = async (patient: Patient, delta: number) => {
    if (!onUpdatePatient) return;
    const current = patient.loyaltyPoints || 0;
    const newPoints = Math.max(0, current + delta);
    
    // Auto tier calculation
    let tier: MembershipTier = 'Bronze';
    if (newPoints >= 500) tier = 'VIP';
    else if (newPoints >= 250) tier = 'Gold';
    else if (newPoints >= 100) tier = 'Silver';

    await onUpdatePatient(patient.id, {
      loyaltyPoints: newPoints,
      membershipTier: tier,
    });
  };

  // Handler: Toggle VIP
  const handleToggleVip = async (patient: Patient) => {
    if (!onUpdatePatient) return;
    const nextStatus = !patient.isVip;
    await onUpdatePatient(patient.id, {
      isVip: nextStatus,
      membershipTier: nextStatus ? 'VIP' : (patient.membershipTier === 'VIP' ? 'Gold' : patient.membershipTier),
      personalDiscount: nextStatus ? (patient.personalDiscount || 15) : 0,
    });
  };

  // Handler: Save Custom Points
  const handleSaveCustomPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPointsPatient || !onUpdatePatient) return;
    const current = customPointsPatient.loyaltyPoints || 0;
    const delta = customPointsAction === 'add' ? customPointsAmount : -customPointsAmount;
    const newPoints = Math.max(0, current + delta);

    let tier: MembershipTier = 'Bronze';
    if (newPoints >= 500) tier = 'VIP';
    else if (newPoints >= 250) tier = 'Gold';
    else if (newPoints >= 100) tier = 'Silver';

    await onUpdatePatient(customPointsPatient.id, {
      loyaltyPoints: newPoints,
      membershipTier: tier,
    });

    setCustomPointsPatient(null);
  };

  // Copy WhatsApp Promo
  const handleCopyWhatsappPromo = (pkg: TreatmentPackage) => {
    const text = `🌸 ئۆفەری تایبەتی "${pkg.packageName}" لە سەنتەری جوانکاری ✨\n\n💎 خزمەتگوزارییەکان: ${pkg.treatmentName}\n📅 ژمارەی جلسەکان: ${pkg.sessionsCount} جلسە\n⏳ ماوەی بەسەرچوون: ${pkg.validityDays} ڕۆژ\n💰 نرخی پێشوو: ${pkg.originalPrice.toLocaleString()} د.ع\n🎁 نرخی بەداشکاندن: ${pkg.discountPrice.toLocaleString()} د.ع (${pkg.discountPercentage}% داشکاندن)\n\n📍 بۆ نۆرەگرتن و پەیوەندی: نامە بنێرن یان پەیوەندی بکەن.`;
    navigator.clipboard.writeText(text);
    setCopiedPkgId(pkg.id);
    setTimeout(() => setCopiedPkgId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner - Sleek & Modern Kurdish Aesthetic */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-6 md:p-8 rounded-[32px] border border-cyan-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black rounded-full flex items-center gap-1.5 shadow-sm">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                CRM & Loyalty Engine v2.5
              </span>
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold rounded-full">
                بەڕێوەبردنی پەیوەندی و ئەندامێتی نەخۆش
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              پەیوەندییەکانی نەخۆش، ئەندامێتی و پاکێجەکان
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              بەڕێوەبردنی وەفاداری (Loyalty Points)، ئەندامێتی VIP، پاکێجەکانی چارەسەری، دواکەوتنی سەردان و بەدواداچوونی سەرکەوتوو بە شێوازێکی زۆر سادە و خێرا.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPackageModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 font-black text-xs rounded-2xl shadow-[0_0_25px_rgba(0,243,255,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> دروستکردنی پاکێجی نوێ
            </button>
          </div>
        </div>
      </div>

      {/* Simplified High-Impact KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-3xl border border-white/10 backdrop-blur-md relative overflow-hidden group hover:border-cyan-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">پاکێجە چالاکەکان</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-white mt-2 font-mono">
            {branchPackages.length}
          </div>
          <span className="text-[11px] text-cyan-300 font-bold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" /> ئامادەیە بۆ فرۆشتن
          </span>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-3xl border border-white/10 backdrop-blur-md relative overflow-hidden group hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">ئەندامانی VIP و زێڕین</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-amber-300 mt-2 font-mono">
            {totalVipPatients}
          </div>
          <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-amber-400" /> خاوەن پاداشت و داشکاندن
          </span>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-3xl border border-white/10 backdrop-blur-md relative overflow-hidden group hover:border-purple-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">کۆی خاڵەکانی وەفاداری</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Gift className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-purple-300 mt-2 font-mono">
            {totalLoyaltyPoints.toLocaleString()}
          </div>
          <span className="text-[11px] text-purple-400 font-bold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> دابەشکراو لەناو چارەخوازان
          </span>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-3xl border border-white/10 backdrop-blur-md relative overflow-hidden group hover:border-rose-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">بەدواداچوونی سەردان</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-rose-300 mt-2 font-mono">
            {followUpNeededCount}
          </div>
          <span className="text-[11px] text-rose-400 font-bold flex items-center gap-1 mt-1">
            <MessageCircle className="w-3 h-3" /> پەیوەندی و بەسەرکردنەوە
          </span>
        </div>
      </div>

      {/* Clean 4-Way Sub-Tabs (دوگمەکانی بەشەکان) */}
      <div className="flex flex-wrap bg-slate-950/95 p-1.5 rounded-2xl gap-2 border border-cyan-500/30 backdrop-blur-xl shadow-lg">
        <button
          onClick={() => {
            setActiveSubTab('packages');
            setSearchTerm('');
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 cursor-pointer select-none ${
            activeSubTab === 'packages'
              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(0,243,255,0.4)] scale-102 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>١. پاکێجەکانی چارەسەری</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/20">
            {branchPackages.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('loyalty');
            setSearchTerm('');
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 cursor-pointer select-none ${
            activeSubTab === 'loyalty'
              ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-slate-950 shadow-[0_0_15px_rgba(217,70,239,0.4)] scale-102 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>٢. خاڵەکانی وەفاداری (Loyalty Points)</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('vip');
            setSearchTerm('');
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 cursor-pointer select-none ${
            activeSubTab === 'vip'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-102 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>٣. ئەندامێتی VIP و یانەی تایبەت</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/20">
            {totalVipPatients}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('followup');
            setSearchTerm('');
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-2 cursor-pointer select-none ${
            activeSubTab === 'followup'
              ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-102 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>٤. بەدواداچوونی سەردانەکان (Recall)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: TREATMENT PACKAGES                                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'packages' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {branchPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-slate-900/90 border border-white/10 hover:border-cyan-400/50 rounded-[28px] p-6 space-y-4 shadow-xl relative overflow-hidden transition-all group flex flex-col justify-between"
              >
                {/* Discount Badge */}
                <div className="absolute top-0 left-0 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black px-4 py-1.5 rounded-br-2xl shadow-md flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  {pkg.discountPercentage}% داشکاندن
                </div>

                <div className="pt-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-cyan-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {pkg.validityDays} ڕۆژ مۆڵەت
                    </span>
                    <span className="bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                      {pkg.sessionsCount} جلسە
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                    {pkg.packageName}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {pkg.treatmentName}
                  </p>
                </div>

                {/* Price Details Card */}
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">ژمارەی جلسەکان:</span>
                    <strong className="text-cyan-300 font-mono text-sm">{pkg.sessionsCount} جلسەی تەواو</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">نرخی ئەسڵی:</span>
                    <span className="text-slate-500 line-through font-mono">{pkg.originalPrice.toLocaleString()} د.ع</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                    <span className="text-emerald-400 font-black">نرخی تایبەت:</span>
                    <strong className="text-xl font-black text-emerald-300 font-mono">
                      {pkg.discountPrice.toLocaleString()} د.ع
                    </strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedPkgToSell(pkg);
                      setSelectedPatientForPkg(branchPatients[0]?.id || null);
                    }}
                    className="py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" /> دیاریکردن بۆ چارەخواز
                  </button>

                  <button
                    onClick={() => handleCopyWhatsappPromo(pkg)}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedPkgId === pkg.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" /> کۆپی کرا
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" /> کۆپیکردنی ئۆفەر
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: LOYALTY POINTS                                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'loyalty' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top helper banner for loyalty rules */}
          <div className="bg-purple-950/40 border border-purple-500/20 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-purple-200 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" /> یاساکانی خاڵی وەفاداری (Loyalty Rules)
              </h4>
              <p className="text-xs text-purple-300/80">
                هەر ١٠,٠٠٠ دینار خەرجکردن = ١ خاڵی وەفاداری. هەر ١٠٠ خاڵ دەگۆڕدرێت بۆ ١٠,٠٠٠ دینار داشکاندنی ڕاستەوخۆ لە جلسەی داهاتوو.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl">
                برۆنز: 0-99
              </span>
              <span className="px-3 py-1 bg-slate-400/10 border border-slate-400/30 text-slate-200 text-xs font-bold rounded-xl">
                زیوی: 100+
              </span>
              <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-bold rounded-xl">
                زێڕین: 250+
              </span>
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold rounded-xl">
                VIP: 500+
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="گەڕان بەپێی ناوی چارەخواز، مۆبایل یان کۆد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-slate-900 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Patients Loyalty List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => {
              const points = patient.loyaltyPoints || 0;
              const tier = patient.membershipTier || (points >= 500 ? 'VIP' : points >= 250 ? 'Gold' : points >= 100 ? 'Silver' : 'Bronze');
              const tierBadgeColor =
                tier === 'VIP'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                  : tier === 'Gold'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : tier === 'Silver'
                  ? 'bg-slate-400/20 text-slate-200 border-slate-300/40'
                  : 'bg-orange-500/10 text-orange-300 border-orange-400/20';

              return (
                <div
                  key={patient.id}
                  className="bg-slate-900/90 border border-white/10 hover:border-purple-500/40 rounded-3xl p-5 space-y-4 shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{patient.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {patient.patientCode} • {patient.phone}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 text-[10px] font-black rounded-xl border ${tierBadgeColor}`}>
                      {tier}
                    </span>
                  </div>

                  {/* Points Counter */}
                  <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">خاڵەکانی ئێستا:</span>
                      <strong className="text-xl font-black text-purple-300 font-mono">
                        {points} <span className="text-xs font-normal text-purple-400">خاڵ</span>
                      </strong>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">بڕی داشکاندنی هاوتا:</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {(points * 100).toLocaleString()} د.ع
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      onClick={() => handleQuickPoints(patient, 25)}
                      className="py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-purple-300 font-black text-[11px] rounded-xl transition-all cursor-pointer"
                      title="زیادکردنی ٢٥ خاڵ بۆ سەردان"
                    >
                      +25 خاڵ
                    </button>
                    <button
                      onClick={() => handleQuickPoints(patient, 50)}
                      className="py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 font-black text-[11px] rounded-xl transition-all cursor-pointer"
                      title="زیادکردنی ٥٠ خاڵ بۆ خەرجی سەروو ١٠٠ هەزار"
                    >
                      +50 خاڵ
                    </button>
                    <button
                      onClick={() => setCustomPointsPatient(patient)}
                      className="py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 font-bold text-[11px] rounded-xl transition-all cursor-pointer"
                    >
                      دەستکاری...
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: VIP MEMBERSHIP CLUB                                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'vip' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-slate-900 border border-amber-500/30 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-amber-200 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" /> یانەی تایبەتی ئەندامێتی VIP
              </h3>
              <p className="text-xs text-amber-300/80 max-w-2xl leading-relaxed">
                ئەندامانی VIP داشکاندنی ڕاستەوخۆ وەردەگرن لەسەر تەواوی خزمەتگوزارییەکانی فیلەر، بۆتۆکس، لەیزەر و پێشینەی وەرگرتنی نۆرە.
              </p>
            </div>
            <div className="px-4 py-2 bg-amber-500/20 border border-amber-400/40 rounded-2xl text-center">
              <span className="text-[10px] text-amber-300/80 block">کۆی ئەندامانی VIP</span>
              <strong className="text-xl font-black text-amber-300 font-mono">{totalVipPatients} کەس</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => {
              const isVip = !!patient.isVip;
              return (
                <div
                  key={patient.id}
                  className={`rounded-3xl p-5 space-y-4 border transition-all relative overflow-hidden ${
                    isVip
                      ? 'bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-900/80 border-white/10 hover:border-slate-700'
                  }`}
                >
                  {isVip && (
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-br-xl shadow-md flex items-center gap-1">
                      <Crown className="w-3 h-3 fill-slate-950" /> VIP MEMBER
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-md ${
                        isVip
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{patient.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {patient.patientCode} • {patient.phone}
                      </span>
                    </div>
                  </div>

                  {/* VIP Digital Card Mini Preview */}
                  <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">داشکاندنی تایبەت:</span>
                      <strong className="text-amber-300 font-mono">
                        {patient.personalDiscount ? `${patient.personalDiscount}%` : isVip ? '15%' : '0%'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">کۆی جلسەکان:</span>
                      <span className="text-slate-200 font-mono">{patient.totalSessionsCompleted} جلسە</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">خاڵی وەفاداری:</span>
                      <span className="text-purple-300 font-mono font-bold">{patient.loyaltyPoints || 0} خاڵ</span>
                    </div>
                  </div>

                  {/* Toggle VIP Button */}
                  <button
                    onClick={() => handleToggleVip(patient)}
                    className={`w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isVip
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300'
                        : 'bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    {isVip ? 'لابردنی دۆخی VIP' : 'بەرزکردنەوە بۆ ئەندامی VIP'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: RECALL & FOLLOW-UP                                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'followup' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-teal-950/40 via-emerald-950/20 to-slate-900 border border-emerald-500/30 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-emerald-200 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" /> بەدواداچوونی سەردان و دڵنیابوونەوە لە چارەخوازان
              </h3>
              <p className="text-xs text-emerald-300/80 max-w-2xl leading-relaxed">
                بەدواداچوون بۆ ئەو چارەخوازانەی کە کاتی جلسەی داهاتوویان هاتووە یان بۆ ماوەیەکە سەردانیان نەکردووە بۆ ناردنی نامەی چاکبوونەوە لە واتسئاپ بە یەک کلیک.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPatients.map((patient) => {
              const whatsappText = encodeURIComponent(
                `🌸 سڵاو بەڕێز ${patient.name} گیان، هیوادارین لە تەندروستییەکی باشدا بیت.\n\nتیمە پزیشکییەکەمان لە سەنتەری جوانکاری بەدواداچوون بۆ دۆخی پێست و چارەسەرەکەت (${patient.chiefComplaint || 'خزمەتگوزارییەکانی جوانکاری'}) دەکات.\n\nئایا هیچ پرسیارێکت هەیە یان دەتەوێت کاتی جلسەی داهاتوو دیاری بکەین؟ ✨`
              );

              return (
                <div
                  key={patient.id}
                  className="bg-slate-900/90 border border-white/10 hover:border-emerald-500/40 rounded-3xl p-5 space-y-4 shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-slate-950 text-base shadow-md">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{patient.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{patient.phone}</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-xl">
                      {patient.totalSessionsCompleted} جلسە کراوە
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-white/5 space-y-1.5 text-xs">
                    <div className="text-slate-400 text-[11px]">خزمەتگوزاری / هۆکاری سەردان:</div>
                    <div className="text-slate-200 font-bold text-xs truncate">
                      {patient.chiefComplaint || 'خزمەتگوزاری گشتی'}
                    </div>
                    {patient.lastFollowUpNotes && (
                      <div className="text-[10px] text-amber-300/80 pt-1 border-t border-white/5">
                        تێبینی: {patient.lastFollowUpNotes}
                      </div>
                    )}
                  </div>

                  {/* Send WhatsApp Followup */}
                  <a
                    href={`https://wa.me/${patient.phone.replace(/[^0-9]/g, '')}?text=${whatsappText}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer no-underline"
                  >
                    <MessageCircle className="w-4 h-4" /> ناردنی بەدواداچوونی واتسئاپ
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE PACKAGE MODAL (Simple, Preset-Driven)                     */}
      {/* ========================================================================= */}
      {showPackageModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-[32px] w-full max-w-xl p-6 md:p-8 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">دروستکردنی پاکێجی نوێی چارەسەر</h3>
                  <span className="text-[11px] text-slate-400">پاکێجی چەند جلسەیی بە داشکاندنی تایبەت</span>
                </div>
              </div>
              <button
                onClick={() => setShowPackageModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-4 text-xs">
              {/* 1-Click Aesthetic Package Presets */}
              <div className="p-4 bg-purple-500/10 border border-purple-500/25 rounded-2xl space-y-2.5">
                <label className="text-purple-300 font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" /> هەڵبژاردن لە پاکێجە ئامادەکراوەکان (Package Presets):
                  </span>
                  <span className="text-[10px] text-purple-400/80 font-normal">١-کلیک بۆ پڕکردنەوە</span>
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-0.5">
                  {STANDARD_PACKAGE_PRESETS.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        setNewPackageName(pkg.name);
                        setNewTreatmentName(pkg.procedures.join(' + '));
                        setNewSessionsCount(pkg.totalSessions);
                        setNewOriginalPrice(pkg.originalPrice);
                        setNewDiscountPrice(pkg.discountedPrice);
                      }}
                      className={`text-[11px] px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-right flex items-center gap-1.5 ${
                        newPackageName === pkg.name
                          ? 'bg-purple-500 text-white font-black border-purple-400 shadow-md scale-102'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10'
                      }`}
                    >
                      <span>{pkg.name.split('(')[0].trim()}</span>
                      <span className="font-mono text-[10px] text-purple-200">
                        ({pkg.discountedPrice.toLocaleString()} د.ع)
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categorized Standard Procedure Selector */}
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl space-y-2">
                <label className="text-cyan-300 font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> یان هەڵبژاردنی خزمەتگوزاری (لە کەتەلۆگ):
                  </span>
                </label>
                <select
                  onChange={(e) => {
                    const proc = STANDARD_AESTHETIC_PROCEDURES.find((p) => p.name === e.target.value);
                    if (proc) {
                      setNewTreatmentName(proc.name);
                      setNewPackageName(`پاکێجی تایبەتی ${proc.nameEn}`);
                      setNewOriginalPrice(proc.suggestedPrice * newSessionsCount);
                      setNewDiscountPrice(Math.round(proc.suggestedPrice * newSessionsCount * 0.8));
                    }
                  }}
                  className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl p-2.5 text-white font-bold cursor-pointer outline-none"
                >
                  <option value="">-- خزمەتگوزارییەک هەڵبژێرە --</option>
                  {STANDARD_PROCEDURE_CATEGORIES.map((category) => (
                    <optgroup key={category} label={`━━ ${category} ━━`}>
                      {STANDARD_AESTHETIC_PROCEDURES.filter((p) => p.category === category).map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.suggestedPrice.toLocaleString()} د.ع)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Package Name Input */}
              <div>
                <label className="text-slate-300 block mb-1.5 font-bold">ناوی پاکێج</label>
                <input
                  type="text"
                  required
                  placeholder="بۆ نموونە: پاکێجی زێڕینی لەیزەری تەواوی لەش"
                  value={newPackageName}
                  onChange={(e) => setNewPackageName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none text-xs font-bold"
                />
              </div>

              {/* Treatment details */}
              <div>
                <label className="text-slate-300 block mb-1.5 font-bold">وردەکاری خزمەتگوزارییەکان</label>
                <input
                  type="text"
                  required
                  value={newTreatmentName}
                  onChange={(e) => setNewTreatmentName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold">ژمارەی جلسەکان</label>
                  <input
                    type="number"
                    min="1"
                    value={newSessionsCount}
                    onChange={(e) => setNewSessionsCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold">ماوەی مۆڵەت (ڕۆژ)</label>
                  <input
                    type="number"
                    min="10"
                    value={newValidityDays}
                    onChange={(e) => setNewValidityDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold">نرخی ئەسڵی (د.ع)</label>
                  <input
                    type="number"
                    value={newOriginalPrice}
                    onChange={(e) => setNewOriginalPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold">نرخی بەداشکاندن (د.ع)</label>
                  <input
                    type="number"
                    value={newDiscountPrice}
                    onChange={(e) => setNewDiscountPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none font-mono text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black rounded-xl hover:brightness-110 shadow-lg cursor-pointer text-xs"
                >
                  پاشەکەوتکردنی پاکێج
                </button>
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-6 py-3.5 bg-white/5 text-slate-300 font-bold rounded-xl hover:bg-white/10 cursor-pointer text-xs"
                >
                  پاشگەزبوونەوە
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN / SELL PACKAGE TO PATIENT                                 */}
      {/* ========================================================================= */}
      {selectedPkgToSell && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-[32px] w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">دیاریکردنی پاکێج بۆ چارەخواز</h3>
                  <span className="text-[11px] text-cyan-300 font-bold">{selectedPkgToSell.packageName}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPkgToSell(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saleSuccessMessage ? (
              <div className="p-6 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-black text-emerald-200">{saleSuccessMessage}</h4>
              </div>
            ) : (
              <form onSubmit={handleAssignPackageToPatient} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold">چارەخواز هەڵبژێرە:</label>
                  <select
                    value={selectedPatientForPkg || ''}
                    onChange={(e) => setSelectedPatientForPkg(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none font-bold"
                  >
                    {branchPatients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.patientCode} - {p.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>نرخی پاکێج:</span>
                    <strong className="text-emerald-400 font-mono text-sm">
                      {selectedPkgToSell.discountPrice.toLocaleString()} د.ع
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>ژمارەی جلسەکان:</span>
                    <span className="text-cyan-300 font-mono font-bold">{selectedPkgToSell.sessionsCount} جلسە</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>پاداشتی خاڵی وەفاداری:</span>
                    <span className="text-purple-300 font-mono font-bold">
                      +{Math.round(selectedPkgToSell.discountPrice / 10000)} خاڵ
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold">تێبینی یان شێوازی پارەدان (ئارەزوومەندانە):</label>
                  <input
                    type="text"
                    placeholder="بۆ نموونە: قیستی یەکەم دراوە یان نەقد..."
                    value={pkgSaleNotes}
                    onChange={(e) => setPkgSaleNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black rounded-xl hover:brightness-110 shadow-lg cursor-pointer text-xs"
                  >
                    تۆمارکردن بۆ چارەخواز
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPkgToSell(null)}
                    className="px-6 py-3.5 bg-white/5 text-slate-300 font-bold rounded-xl hover:bg-white/10 cursor-pointer text-xs"
                  >
                    پاشگەزبوونەوە
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CUSTOM LOYALTY POINTS EDIT                                       */}
      {/* ========================================================================= */}
      {customPointsPatient && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-[32px] w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">دەستکاری خاڵەکانی وەفاداری</h3>
                  <span className="text-[11px] text-purple-300 font-bold">{customPointsPatient.name}</span>
                </div>
              </div>
              <button
                onClick={() => setCustomPointsPatient(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPoints} className="space-y-4 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCustomPointsAction('add')}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    customPointsAction === 'add'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  + زیادکردنی خاڵ
                </button>
                <button
                  type="button"
                  onClick={() => setCustomPointsAction('subtract')}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    customPointsAction === 'subtract'
                      ? 'bg-rose-500 text-white font-black'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  - لێدەرکردن (بەکارهێنراو)
                </button>
              </div>

              <div>
                <label className="text-slate-300 block mb-1.5 font-bold">بڕی خاڵەکان:</label>
                <input
                  type="number"
                  min="1"
                  value={customPointsAmount}
                  onChange={(e) => setCustomPointsAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-purple-400 outline-none font-mono text-base font-bold"
                />
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 text-[11px] text-slate-400 flex justify-between">
                <span>خاڵەکانی ئێستا:</span>
                <strong className="text-white font-mono">{customPointsPatient.loyaltyPoints || 0} خاڵ</strong>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black rounded-xl hover:brightness-110 shadow-lg cursor-pointer"
                >
                  پاشەکەوتکردن
                </button>
                <button
                  type="button"
                  onClick={() => setCustomPointsPatient(null)}
                  className="px-5 py-3 bg-white/5 text-slate-300 font-bold rounded-xl hover:bg-white/10 cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
