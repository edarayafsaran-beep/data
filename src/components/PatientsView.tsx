import React, { useState, useRef, useEffect } from 'react';
import { Patient, Appointment, User, Treatment, Branch } from '../types';
import { PrintableMedicalDocumentModal } from './PrintableMedicalDocumentModal';
import {
  Search,
  UserPlus,
  Phone,
  Calendar,
  Eye,
  Download,
  Printer,
  Sparkles,
  MessageCircle,
  QrCode,
  Grid,
  List,
  User as UserIcon,
  Layers,
  CheckCircle2,
  X,
  Tag,
  Check,
  Plus,
  Clock,
  ChevronDown,
  ArrowUpDown,
  Filter,
  Users,
  Award,
  MapPin,
  Building2,
  Trash2,
} from 'lucide-react';
import { PatientProfileModal } from './PatientProfileModal';
import {
  STANDARD_AESTHETIC_PROCEDURES,
  STANDARD_PROCEDURE_CATEGORIES,
  WEEKDAYS,
  StandardProcedure,
} from '../constants/standardPresets';

interface PatientsViewProps {
  patients: Patient[];
  appointments: Appointment[];
  doctors?: User[];
  treatments?: Treatment[];
  activeBranchId?: number | null;
  branches?: Branch[];
  currentUser?: User | null;
  onAddPatient: (
    patientData: Omit<Patient, 'id' | 'patientCode' | 'totalSessionsCompleted' | 'branchId'> & {
      registeredDate?: string;
      customRegistrationDate?: string;
      preferredDays?: string;
      branchId?: number;
    }
  ) => void;
  onUpdatePatient?: (id: number, data: Partial<Patient>) => void;
  onDeletePatient?: (id: number) => void;
  onAddAppointment?: (appData: Omit<Appointment, 'id' | 'whatsappReminder1DaySent' | 'whatsappReminderSameDaySent' | 'branchId'>) => void;
  onUpdateAppointmentStatus?: (id: number, status: any) => void;
  onOpenTvMode?: () => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  appointments,
  doctors = [],
  treatments = [],
  activeBranchId,
  branches = [],
  currentUser,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
  onAddAppointment,
  onUpdateAppointmentStatus,
  onOpenTvMode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'code' | 'sessions'>('date');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientModalTab, setPatientModalTab] = useState<'overview' | 'prescriptions' | 'exercises' | 'scans' | 'financials' | 'qrcode' | 'whatsapp'>('overview');
  const [showAddModal, setShowAddModal] = useState(false);

  const currentBranch = branches.find((b) => b.id === activeBranchId) || branches[0] || { name: 'لقی سەرەکی' };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // New Patient Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState<'نێر' | 'مێ'>('مێ');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>([]);
  const [activeComplaintCategory, setActiveComplaintCategory] = useState<string>('all');
  const [registeredDate, setRegisteredDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [preferredDays, setPreferredDays] = useState<string>('');

  const toggleComplaint = (procName: string) => {
    setSelectedComplaints((prev) =>
      prev.includes(procName) ? prev.filter((p) => p !== procName) : [...prev, procName]
    );
  };

  const totalEstimatedProcedurePrice = selectedComplaints.reduce((sum, name) => {
    const proc = STANDARD_AESTHETIC_PROCEDURES.find((p) => p.name === name);
    return sum + (proc?.suggestedPrice || 0);
  }, 0);

  // Filter and sort patients - Strictly unified for this branch
  const filteredPatients = patients.filter((p) => {
    if (!p) return false;
    const term = (searchTerm || '').toLowerCase();
    const nameStr = (p.name || '').toLowerCase();
    const phoneStr = (p.phone || '');
    const codeStr = (p.patientCode || '').toLowerCase();
    const complaintStr = (p.chiefComplaint || '').toLowerCase();

    return (
      nameStr.includes(term) ||
      phoneStr.includes(searchTerm) ||
      codeStr.includes(term) ||
      complaintStr.includes(term)
    );
  }).sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '', 'ckb');
    if (sortBy === 'code') return (a.patientCode || '').localeCompare(b.patientCode || '');
    if (sortBy === 'sessions') return (b.totalSessionsCompleted || 0) - (a.totalSessionsCompleted || 0);
    return (b.id || 0) - (a.id || 0); // date/newest first
  });

  const handleSubmitNewPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const finalChiefComplaint = selectedComplaints.length > 0
      ? selectedComplaints.join(' + ')
      : chiefComplaint.trim() || 'سەردانی گشتی جوانکاری';

    onAddPatient({
      name,
      phone,
      age: Number(age),
      gender,
      medicalHistory,
      chiefComplaint: finalChiefComplaint,
      registeredDate,
      customRegistrationDate: registeredDate,
      preferredDays,
      branchId: activeBranchId || currentUser?.branchId || 1,
    });

    setName('');
    setPhone('');
    setMedicalHistory('');
    setChiefComplaint('');
    setSelectedComplaints([]);
    setRegisteredDate(new Date().toISOString().split('T')[0]);
    setPreferredDays('');
    setShowAddModal(false);
  };

  const handleExportCSV = () => {
    const headers = ['کۆد', 'ناو', 'مۆبایل', 'تەمەن', 'ڕەگەز', 'هۆکاری سەردان', 'کۆی جلسەکان', 'بەروار'];
    const rows = filteredPatients.map((p) => [
      p.patientCode,
      p.name,
      p.phone,
      p.age,
      p.gender,
      p.chiefComplaint,
      p.totalSessionsCompleted,
      p.registeredDate,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `patients_${currentBranch.name}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [showPrintModal, setShowPrintModal] = useState(false);

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar - Unified, Branch-Aware, No Split Pages */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-pink-500/20 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-3.5 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-400/40 text-pink-300 text-xs font-black rounded-full flex items-center gap-1.5 shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-pink-400" />
              {currentBranch.name}
            </span>
            <span className="px-3 py-1 bg-slate-800/80 border border-white/10 text-slate-300 text-xs font-mono font-bold rounded-full">
              کۆی چارەخوازانی لق: {patients.length} کەس
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white">پڕۆفایلی چارەخوازان</h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
            سەرجەم ناوی چارەخوازان و زانیاری پزیشکی، جلسەکانی جوانکاری و پەیوەندی بە شێوازێکی یەکگرتوو و سادە بۆ لقی هەڵبژێردراو.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap relative z-10">
          <button
            onClick={handleExportCSV}
            className="px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-white/10 rounded-2xl text-xs font-bold text-pink-300 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4 text-pink-400" />
            <span>داگرتنی Excel / CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-white/10 rounded-2xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>چاپکردن (Print)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3.5 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 hover:brightness-110 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.4)] active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[3]" />
            <span>تۆمارکردنی چارەخوازی نوێ</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search, View Mode Toggle, Sorting */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute right-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="گەڕان بەپێی ناو، ژمارەی مۆبایل، کۆدی چارەخواز، یان خزمەتگوزاری..."
            className="w-full pl-4 pr-12 py-3 bg-slate-950 border border-white/10 focus:border-pink-400 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
          {/* View Mode Toggle: List vs Cards */}
          <div className="flex items-center bg-slate-950/90 p-1.5 rounded-2xl border border-white/15 backdrop-blur-xl shadow-inner gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 cursor-pointer select-none ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-pink-500 via-fuchsia-600 to-purple-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-pink-200/50 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="پیشاندانی هەموو چارەخوازان بە شێوازی لیستی خشتەیی"
            >
              <List className="w-4 h-4" />
              <span>لیست (List)</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 cursor-pointer select-none ${
                viewMode === 'cards'
                  ? 'bg-gradient-to-r from-pink-500 via-fuchsia-600 to-purple-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-pink-200/50 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="پیشاندانی هەموو چارەخوازان بە شێوازی کارت"
            >
              <Grid className="w-4 h-4" />
              <span>کارت (Cards)</span>
            </button>
          </div>

          {/* Custom Sorting Dropdown Selector */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-gradient-to-r from-slate-950 via-slate-900 to-pink-950/40 hover:from-pink-950/60 hover:to-slate-900 border-2 border-pink-500/40 hover:border-pink-400 rounded-2xl text-xs font-black text-pink-200 transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.2)] hover:shadow-[0_0_22px_rgba(236,72,153,0.35)] cursor-pointer select-none group"
            >
              <div className="p-1 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-400/30">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </div>
              <span className="text-slate-400 text-[11px] font-bold">ڕێکخستن:</span>
              <span className="text-white font-bold">
                {sortBy === 'date' && 'نوێترین بەروار'}
                {sortBy === 'name' && 'ناوی ئەلفوبێ'}
                {sortBy === 'code' && 'کۆدی پڕۆفایل'}
                {sortBy === 'sessions' && 'زۆرترین جلسە'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-pink-400 transition-transform duration-300 ${isSortDropdownOpen ? 'rotate-180 text-pink-200' : ''}`} />
            </button>

            {isSortDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-slate-950/95 border-2 border-pink-500/50 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(236,72,153,0.25)] p-2 z-[999] backdrop-blur-2xl animate-in fade-in zoom-in-95 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 border-b border-white/10 flex items-center justify-between">
                  <span>شێوازی ڕیزبەندی (Sorting)</span>
                  <Sparkles className="w-3 h-3 text-pink-400" />
                </div>
                {[
                  { id: 'date', label: 'بەپێی بەرواری نوێترین (Newest)' },
                  { id: 'name', label: 'بەپێی ناوی ئەلفوبێ (A - Z)' },
                  { id: 'code', label: 'بەپێی کۆدی چارەخواز (Code ID)' },
                  { id: 'sessions', label: 'بەپێی زۆرترین جلسە (Sessions)' },
                ].map((opt) => {
                  const isSelected = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.id as any);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-500/25 to-purple-500/20 text-pink-200 border border-pink-400/50 shadow-sm'
                          : 'hover:bg-white/[0.08] text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <div className="p-0.5 rounded-full bg-pink-400 text-slate-950">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: List or Cards */}
      {filteredPatients.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-white/5 space-y-3">
          <UserIcon className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
          <p className="text-sm font-bold text-slate-400">هیچ چارەخوازێک بەم زانیارییانە نەدۆزرایەوە.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            تۆمارکردنی چارەخوازی نوێ
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* Clean and Professional Table List View */
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-[28px] border border-white/10 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-300 font-bold border-b border-white/10">
                  <th className="py-4 px-4 font-mono text-[11px] text-slate-400">#</th>
                  <th className="py-4 px-4 font-mono">کۆدی پڕۆفایل</th>
                  <th className="py-4 px-4 text-sm">ناوی سیانی چارەخواز</th>
                  <th className="py-4 px-4">ژمارەی مۆبایل</th>
                  <th className="py-4 px-4">تەمەن / ڕەگەز</th>
                  <th className="py-4 px-4">هۆکاری سەردان</th>
                  <th className="py-4 px-4">جلسەکان</th>
                  <th className="py-4 px-4 font-mono">بەرواری تۆمار</th>
                  <th className="py-4 px-4 text-center">کردارەکان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPatients.map((patient, index) => (
                  <tr
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setPatientModalTab('overview');
                    }}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-500 font-bold">{index + 1}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
                        {patient.patientCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center font-bold text-pink-300 text-xs">
                          {patient.name.charAt(0)}
                        </div>
                        <span className="font-bold text-white group-hover:text-pink-300 transition-colors text-sm">
                          {patient.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300" dir="ltr">
                      {patient.phone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span>{patient.age} ساڵ</span>
                      <span className="text-slate-500 mx-1">•</span>
                      <span className="text-slate-400">{patient.gender}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {patient.chiefComplaint ? (
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {patient.chiefComplaint.split(/\s*(?:\+|\،|,| - )\s*/).filter(Boolean).slice(0, 2).map((item, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/20 truncate max-w-[120px]">
                              {item}
                            </span>
                          ))}
                          {patient.chiefComplaint.split(/\s*(?:\+|\،|,| - )\s*/).filter(Boolean).length > 2 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-white/10 text-slate-300">
                              +{patient.chiefComplaint.split(/\s*(?:\+|\،|,| - )\s*/).filter(Boolean).length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">گشتی</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                        {patient.totalSessionsCompleted} جلسە
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {patient.registeredDate}
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setPatientModalTab('overview');
                          }}
                          className="px-2.5 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                          title="بینینی پڕۆفایلی تەواو"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>پڕۆفایل</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setPatientModalTab('qrcode');
                          }}
                          className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 rounded-xl transition-all cursor-pointer"
                          title="کارتی QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`https://wa.me/${patient.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded-xl transition-all"
                          title="پەیامی وەتسئەپ"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>

                        <a
                          href={`tel:${patient.phone}`}
                          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all"
                          title="تەلەفۆن"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>

                        {onDeletePatient && currentUser?.role === 'super_admin' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePatient(patient.id);
                            }}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
                            title="سڕینەوەی چارەخواز لە داتابەیس"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className="group p-5 rounded-3xl bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-pink-500/30 hover:bg-slate-900/60 transition-all cursor-pointer shadow-md hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3 mt-1">
                  <span className="text-[10px] font-mono font-bold text-teal-300 bg-teal-500/20 px-2.5 py-1 rounded-xl border border-teal-500/30">
                    {patient.patientCode}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{patient.registeredDate}</span>
                </div>

                <h3 className="text-lg font-black text-white group-hover:text-pink-300 transition-colors">
                  {patient.name}
                </h3>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono" dir="ltr">
                    <Phone className="w-3.5 h-3.5 text-teal-400" /> {patient.phone}
                  </p>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`tel:${patient.phone}`}
                      className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                      title="پەیوەندی تەلەفۆنی"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${patient.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-lg transition-colors"
                      title="ناردنی پەیامی وەتس ئەپ"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPatient(patient);
                        setPatientModalTab('qrcode');
                      }}
                      className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg transition-colors flex items-center gap-1 font-mono text-[11px] font-bold"
                      title="بینین و چاپکردنی کارتی QR"
                    >
                      <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>QR</span>
                    </button>

                    {onDeletePatient && currentUser?.role === 'super_admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePatient(patient.id);
                        }}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors flex items-center gap-1 font-mono text-[11px] font-bold border border-rose-500/20"
                        title="سڕینەوەی چارەخواز لە داتابەیس"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>تەمەن و ڕەگەز:</span>
                    <span className="font-bold text-slate-100">{patient.age} ساڵ ({patient.gender})</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>هۆکاری سەردان:</span>
                    {patient.chiefComplaint ? (
                      <span className="font-bold text-pink-300 truncate max-w-[170px] bg-pink-500/10 px-2.5 py-0.5 rounded-lg border border-pink-500/20 text-[11px]">
                        {patient.chiefComplaint}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-bold">گشتی</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>کۆی جلسەکان:</span>
                    <span className="font-bold text-cyan-300">{patient.totalSessionsCompleted} جلسە</span>
                  </div>
                  {patient.preferredDays && (
                    <div className="flex items-center justify-between text-slate-300 pt-1">
                      <span>ڕۆژەکانی جلسە:</span>
                      <span className="font-bold text-teal-300 text-[11px] bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">{patient.preferredDays}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPatient(patient);
                  setPatientModalTab('overview');
                }}
                className="mt-5 w-full py-2.5 bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/30 rounded-2xl text-xs font-bold text-pink-300 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-pink-400" />
                <span>پڕۆفایلی پزیشکی و مێژوو</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Patient Profile Modal */}
      {selectedPatient && (
        <PatientProfileModal
          patient={selectedPatient}
          appointments={appointments}
          doctors={doctors}
          treatments={treatments}
          defaultTab={patientModalTab}
          activeBranchId={activeBranchId}
          branches={branches}
          currentUser={currentUser}
          onAddAppointment={onAddAppointment}
          onUpdatePatient={onUpdatePatient}
          onDeletePatient={onDeletePatient}
          onUpdateAppointmentStatus={onUpdateAppointmentStatus}
          onOpenTvMode={onOpenTvMode}
          onClose={() => setSelectedPatient(null)}
        />
      )}

      {/* Add New Patient Modal - Wide & Spacious (max-w-6xl) with Multi-Procedure Selector */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-pink-500/30 rounded-[32px] w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-white">تۆمارکردنی چارەخوازی نوێ و دیاریکردنی خزمەتگوزاری</h3>
                  <p className="text-xs text-slate-400">زانیاری کەسی، رۆژانی جلسات و هەڵبژاردنی فرە-خزمەتگوزاری (Multi-Select)</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <form onSubmit={handleSubmitNewPatient} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-xs">
                {/* 2-Column Main Info */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Right Column: Personal & Timing (7 cols) */}
                  <div className="lg:col-span-7 space-y-4 bg-slate-950/50 p-5 rounded-3xl border border-white/5">
                    <h4 className="text-sm font-black text-pink-300 flex items-center gap-2 border-b border-white/5 pb-2">
                      <UserIcon className="w-4 h-4 text-pink-400" /> زانیارییە سەرەکییەکانی چارەخواز
                    </h4>

                    <div>
                      <label className="block text-slate-300 mb-1.5 font-bold">ناوی سیانی چارەخواز *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ناوی تەواوی چارەخواز..."
                        className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-pink-400 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 mb-1.5 font-bold flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-teal-400" /> ژمارەی مۆبایل (WhatsApp) *
                        </label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0750 000 0000"
                          className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1.5 font-bold">تەمەن (ساڵ)</label>
                        <input
                          type="number"
                          value={age}
                          onChange={(e) => setAge(Number(e.target.value))}
                          className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-pink-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 mb-1.5 font-bold flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-pink-400" /> تاریخی تۆمارکردن
                        </label>
                        <input
                          type="date"
                          required
                          value={registeredDate}
                          onChange={(e) => setRegisteredDate(e.target.value)}
                          className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-pink-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1.5 font-bold">ڕەگەز</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as any)}
                          className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-pink-400 cursor-pointer"
                        >
                          <option value="مێ">مێ (ئافرەت)</option>
                          <option value="نێر">نێر (پیاو)</option>
                        </select>
                      </div>
                    </div>

                    {/* Preferred Weekdays Selection Chips */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-slate-300 font-bold">
                        ڕۆژەکانی دڵخوازی حەفتە بۆ جلسەکان (دەستنیشانکردنی یەک کلیک):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map((day) => {
                          const selected = preferredDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const current = preferredDays ? preferredDays.split('، ').filter(Boolean) : [];
                                const updated = selected ? current.filter((d) => d !== day) : [...current, day];
                                setPreferredDays(updated.join('، '));
                              }}
                              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                                selected
                                  ? 'bg-pink-500 text-white border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.3)] scale-105'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-white/5 hover:border-white/20'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${selected ? 'bg-white text-pink-600' : 'bg-slate-800 border border-white/10'}`}>
                                {selected ? <Check className="w-2.5 h-2.5 stroke-[4]" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
                              </div>
                              <span>{day}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Left Column: Medical History & Auto-Notification Note (5 cols) */}
                  <div className="lg:col-span-5 space-y-4 bg-slate-950/50 p-5 rounded-3xl border border-white/5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="text-sm font-black text-pink-300 flex items-center gap-2 border-b border-white/5 pb-2">
                        <Sparkles className="w-4 h-4 text-pink-400" /> مێژووی پزیشکی و تێبینی
                      </h4>

                      <div>
                        <label className="block text-slate-300 mb-1.5 font-bold">تێبینی، نەخۆشی یان حەساسیەتی پێست</label>
                        <textarea
                          rows={4}
                          value={medicalHistory}
                          onChange={(e) => setMedicalHistory(e.target.value)}
                          placeholder="جۆری پێست، حەساسیەت بە دەرمان، فیلەر یان بۆتۆکسی پێشوو..."
                          className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-pink-400"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 font-bold">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                      <span>
                        ⚡ پاش تۆمارکردن: ڕاستەوخۆ پەیامی بەخێرهاتن و هیوای درەوشاوەیی لە ڕێگەی وەتس ئەپ بۆ چارەخواز دەنێردرێت 💖
                      </span>
                    </div>
                  </div>
                </div>

                {/* Multi-Select Procedures Section */}
                <div className="bg-slate-950/70 p-5 md:p-6 rounded-3xl border border-pink-500/20 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/10 pb-4">
                    <div>
                      <h4 className="text-sm md:text-base font-black text-white flex items-center gap-2">
                        <Tag className="w-4 h-4 text-pink-400" />
                        هۆکاری سەردان / خزمەتگوزاریی سەرەکی (دیاریکراو) - فرە-ئایتم (Multi-Select)
                      </h4>
                      <p className="text-[11px] text-slate-400">کلیک لەسەر هەر بابەتێک بکە بۆ دەستنیشانکردنی، زانیارییەکان ڕێکتر دەبن</p>
                    </div>

                    {selectedComplaints.length > 0 && (
                      <div className="flex items-center gap-3">
                        <span className="px-4 py-1.5 bg-pink-500 text-white font-black rounded-full text-[10px] shadow-lg shadow-pink-500/20 animate-pulse">
                          {selectedComplaints.length} بابەت هەڵبژێردراوە
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedComplaints([])}
                          className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <X className="w-3 h-3" /> سڕینەوەی هەمووی
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setActiveComplaintCategory('all')}
                      className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                        activeComplaintCategory === 'all'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400 shadow-md scale-105'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-white/10'
                      }`}
                    >
                      هەمووی ({STANDARD_AESTHETIC_PROCEDURES.length})
                    </button>
                    {STANDARD_PROCEDURE_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveComplaintCategory(cat)}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                          activeComplaintCategory === cat
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400 shadow-md scale-105'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Procedures Multi-Select Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                    {STANDARD_AESTHETIC_PROCEDURES.filter(
                      (p) => activeComplaintCategory === 'all' || p.category === activeComplaintCategory
                    ).map((proc) => {
                      const isSelected = selectedComplaints.includes(proc.name);
                      return (
                        <div
                          key={proc.id}
                          onClick={() => toggleComplaint(proc.name)}
                          className={`p-4 rounded-[24px] border transition-all cursor-pointer flex flex-col gap-3 select-none relative group ${
                            isSelected
                              ? 'bg-gradient-to-br from-pink-900/40 to-purple-900/40 border-pink-500/60 shadow-[0_0_25px_rgba(236,72,153,0.15)] ring-1 ring-pink-500/30'
                              : 'bg-slate-900/40 hover:bg-slate-900/80 border-white/5 hover:border-pink-500/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <span className="text-[10px] uppercase tracking-widest font-black text-slate-500 group-hover:text-pink-400/60 transition-colors">
                                {proc.category}
                              </span>
                              <strong className={`text-[13px] block leading-tight transition-colors ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                {proc.name}
                              </strong>
                            </div>
                            <div className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                              isSelected ? 'bg-pink-500 text-white scale-110 shadow-lg shadow-pink-500/40' : 'bg-slate-950 border border-white/10 text-slate-600'
                            }`}>
                              {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                          
                          <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                            <span className={`font-mono font-black text-xs ${isSelected ? 'text-pink-300' : 'text-teal-400'}`}>
                              {proc.suggestedPrice.toLocaleString()} <small className="font-sans text-[10px]">د.ع</small>
                            </span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {proc.durationMinutes} خولەک
                            </span>
                          </div>

                          {isSelected && (
                            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Complaints Chips Preview */}
                  {selectedComplaints.length > 0 ? (
                    <div className="p-3 bg-slate-900 rounded-2xl border border-white/10 space-y-2">
                      <span className="text-[11px] font-bold text-slate-300 block">خزمەتگوزارییە دیاریکراوەکان بۆ ئەم چارەخوازە:</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedComplaints.map((comp) => (
                          <span
                            key={comp}
                            className="px-2.5 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-pink-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
                          >
                            <span>{comp.split('(')[0].trim()}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleComplaint(comp);
                              }}
                              className="text-pink-400 hover:text-white cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-400 mb-1 text-[11px]">یان دەتوانیت بە دەست بنووسیت:</label>
                      <input
                        type="text"
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder="لەیزەر، فیلەر، بۆتۆکس، پاککردنەوەی پێست..."
                        className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-pink-400"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer - Fixed at bottom */}
              <div className="px-6 py-4 border-t border-white/10 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  {selectedComplaints.length > 0 && (
                    <div className="text-xs">
                      <span className="text-slate-400">کۆی خەمڵێنراوی نرخ: </span>
                      <strong className="text-pink-300 font-mono text-sm">
                        {totalEstimatedProcedurePrice.toLocaleString()} د.ع
                      </strong>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer"
                  >
                    پاشگەزبوونەوە
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>تۆمارکردن و دروستکردنی پڕۆفایل</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPrintModal && (
        <PrintableMedicalDocumentModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          docType="patient_directory"
          branchName={currentBranch.name}
          data={{
            patientsList: patients.map((p) => ({
              id: p.id,
              name: p.name,
              phone: p.phone,
              age: p.age,
              gender: p.gender,
              totalVisits: p.totalSessionsCompleted,
              balance: 0,
            })),
          }}
        />
      )}
    </div>
  );
};
