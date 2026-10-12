import React, { useState } from 'react';
import { Patient, Appointment, User, Treatment, AppointmentStatus, Branch } from '../types';
import { PrintableMedicalDocumentModal, MedicalDocType } from './PrintableMedicalDocumentModal';
import {
  X,
  Phone,
  Calendar,
  FileText,
  QrCode,
  Image as ImageIcon,
  Printer,
  Send,
  Pill,
  DollarSign,
  LogOut,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Tag,
  Plus,
  Clock,
  User as UserIcon,
  Check,
  Search,
  Filter,
  Save,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  Percent,
  Building2,
  Trash2,
} from 'lucide-react';
import {
  STANDARD_AESTHETIC_PROCEDURES,
  STANDARD_PROCEDURE_CATEGORIES,
  STANDARD_PRESCRIPTION_PRESETS,
  STANDARD_PRESCRIPTION_CATEGORIES,
} from '../constants/standardPresets';

interface PrescriptionItem {
  id: number;
  medName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PatientProfileModalProps {
  patient: Patient;
  appointments: Appointment[];
  doctors?: User[];
  treatments?: Treatment[];
  defaultTab?: string;
  activeBranchId?: number | null;
  branches?: Branch[];
  currentUser?: User | null;
  onAddAppointment?: (
    appData: Omit<Appointment, 'id' | 'whatsappReminder1DaySent' | 'whatsappReminderSameDaySent' | 'branchId'> & {
      branchId?: number;
    }
  ) => void;
  onUpdatePatient?: (id: number, data: Partial<Patient>) => void;
  onDeletePatient?: (id: number) => void;
  onUpdateAppointmentStatus?: (id: number, status: AppointmentStatus) => void;
  onOpenTvMode?: () => void;
  onClose: () => void;
}

export const PatientProfileModal: React.FC<PatientProfileModalProps> = ({
  patient,
  appointments,
  doctors = [],
  treatments = [],
  defaultTab,
  activeBranchId,
  branches = [],
  currentUser,
  onAddAppointment,
  onUpdatePatient,
  onDeletePatient,
  onUpdateAppointmentStatus,
  onOpenTvMode,
  onClose,
}) => {
  const [notice, setNotice] = useState<string | null>(null);
  const [printableDoc, setPrintableDoc] = useState<{
    type: MedicalDocType;
    data: any;
  } | null>(null);

  // Active Tab for Comprehensive Management
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'surgeries' | 'financials' | 'prescriptions' | 'archive' | 'qrcode'>(() => {
    if (defaultTab === 'qrcode') return 'qrcode';
    if (defaultTab === 'financials') return 'financials';
    if (defaultTab === 'surgeries') return 'surgeries';
    if (defaultTab === 'prescriptions') return 'prescriptions';
    if (defaultTab === 'sessions') return 'sessions';
    if (defaultTab === 'archive') return 'archive';
    return 'overview';
  });

  // The system automatically knows which branch the logged-in user account belongs to!
  // A branch is NEVER selectable in profile or surgery - it is completely automatic.
  const effectiveBranchId = currentUser?.branchId || activeBranchId || patient.branchId || (branches[0]?.id ?? 1);
  const activeBranch = branches.find((b) => b.id === effectiveBranchId) || branches[0] || { id: 1, name: 'لقی سەرەکی' };
  const activeBranchName = activeBranch.name;

  // Cosmetic Surgeries State
  interface CosmeticSurgeryRecord {
    id: number;
    patientId: number;
    branchId: number;
    surgeryName: string;
    branchName: string;
    surgeonName: string;
    surgeryPrice: number;
    paidAmount: number;
    remainingAmount: number;
    anesthesiaType: string;
    date: string;
    notes: string;
  }

  const [patientSurgeries, setPatientSurgeries] = useState<CosmeticSurgeryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`donia_patient_surgeries_${patient.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading surgeries', e);
    }
    return [];
  });

  // Persist surgeries per patient
  React.useEffect(() => {
    try {
      localStorage.setItem(`donia_patient_surgeries_${patient.id}`, JSON.stringify(patientSurgeries));
    } catch (e) {
      console.warn('Error saving surgeries', e);
    }
  }, [patientSurgeries, patient.id]);

  const [showAddSurgeryModal, setShowAddSurgeryModal] = useState(false);
  const [surgeryNameInput, setSurgeryNameInput] = useState('');
  const [surgeonInput, setSurgeonInput] = useState(currentUser?.name || '');
  const [surgeryPriceInput, setSurgeryPriceInput] = useState<number>(0);
  const [surgeryPaidInput, setSurgeryPaidInput] = useState<number>(0);
  const [anesthesiaInput, setAnesthesiaInput] = useState('گشتی (General)');
  const [surgeryNotesInput, setSurgeryNotesInput] = useState('');

  const handleSaveSurgery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surgeryNameInput) return;

    const price = Number(surgeryPriceInput);
    const paid = Number(surgeryPaidInput);
    const rem = Math.max(0, price - paid);

    const newRec: CosmeticSurgeryRecord = {
      id: Date.now(),
      patientId: patient.id,
      branchId: effectiveBranchId,
      surgeryName: surgeryNameInput,
      branchName: activeBranchName,
      surgeonName: surgeonInput,
      surgeryPrice: price,
      paidAmount: paid,
      remainingAmount: rem,
      anesthesiaType: anesthesiaInput,
      date: new Date().toISOString().split('T')[0],
      notes: surgeryNotesInput,
    };

    setPatientSurgeries([newRec, ...patientSurgeries]);

    // Automatically record as appointment / financial entry so it hits Daily, Monthly, and General accounts!
    if (onAddAppointment) {
      onAddAppointment({
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        doctorId: doctors[0]?.id || 1,
        doctorName: surgeonInput,
        treatmentId: 888,
        treatmentName: `نەشتەرگەری جوانکاری: ${surgeryNameInput} (${activeBranchName})`,
        treatmentPrice: price,
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '11:00 AM',
        roomNumber: 'ژووری نەشتەرگەری',
        status: 'تەواوبوو',
        paidAmount: paid,
        discountApplied: 0,
        branchId: effectiveBranchId,
        notes: `نەشتەرگەری لە ${activeBranchName} (خۆکار لەسەر ئەکاونت) | پزیشک: ${surgeonInput} | سڕکردن: ${anesthesiaInput} | قەرز: ${rem.toLocaleString()} د.ع`,
      });
    }

    setNotice(`✨ نەشتەرگەری جوانکاری (${surgeryNameInput}) بە شێوەی ئۆتۆماتیکی لەسەر (${activeBranchName}) تۆمارکرا و لە حیساباتی ڕۆژانە، مانگانە و گشتی هەژمارکرا.`);
    setShowAddSurgeryModal(false);
    setSurgeryNotesInput('');
  };

  // Parse initial multiple services from patient.chiefComplaint
  const parseServices = (text?: string): string[] => {
    if (!text) return [];
    return text
      .split(/\s*(?:\+|\،|,| - )\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  // State for Multi-Selected Services (هۆکاری سەردان / خزمەتگوزاریی سەرەکی دیاریکراو)
  const [selectedServices, setSelectedServices] = useState<string[]>(() => parseServices(patient.chiefComplaint));
  const [isServicesSelectorModalOpen, setIsServicesSelectorModalOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [customServiceText, setCustomServiceText] = useState('');

  // Pain VAS Scale (1-10)
  const [painVasScore, setPainVasScore] = useState<number>(
    patient.satisfactionRating ? Math.max(1, 11 - patient.satisfactionRating * 2) : 4
  );

  // Clinical Notes & History
  const [medicalHistoryText, setMedicalHistoryText] = useState(
    patient.medicalHistory || 'تۆماری پێست، حەساسیەت یان پرۆسەی پێشووی جوانکاری.'
  );
  const [isEditingHistory, setIsEditingHistory] = useState(false);

  // Discount & Financial state
  const [discountAmount, setDiscountAmount] = useState<number>(() => {
    return Number(localStorage.getItem(`donia_patient_discount_${patient.id}`)) || 0;
  });
  const [isFullMonthPaid, setIsFullMonthPaid] = useState<boolean>(() => {
    return localStorage.getItem(`donia_patient_fullmonth_${patient.id}`) === 'true';
  });

  // Schedule Session Form
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(doctors[0]?.id || 1);
  const [selectedSessionServices, setSelectedSessionServices] = useState<string[]>([]);
  const [roomNumber, setRoomNumber] = useState('ژووری ۱');
  const [sessionPrice, setSessionPrice] = useState<number>(35000);
  const [sessionDiscount, setSessionDiscount] = useState<number>(0);
  const [sessionPaid, setSessionPaid] = useState<number>(35000);
  const [notes, setNotes] = useState('');
  const [selectedInvoiceAppointment, setSelectedInvoiceAppointment] = useState<Appointment | null>(null);

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      id: 1,
      medName: 'Sunscreen SPF 50+ Broad Spectrum Cream',
      dosage: 'بەشی پێویست',
      frequency: 'هەموو ۳ کاتژمێر جارێک لە کاتی دەرچوون',
      duration: '30 ڕۆژ',
      instructions: 'دوای جەلسەی لەیزەر و فەیشیەڵ',
    },
    {
      id: 2,
      medName: 'Fucidin 2% Antibiotic Ointment',
      dosage: 'چینێکی تەنک',
      frequency: '2 جار لە ڕۆژێکدا بۆ ۳ ڕۆژ',
      duration: '3 ڕۆژ',
      instructions: 'بۆ هێورکردنەوەی پێست پاش لەیزەر',
    },
  ]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('1 دڵۆپ / چینێکی تەنک');
  const [newMedInstructions, setNewMedInstructions] = useState('دوای لەیزەر');

  // Archive / Aesthetic Scans & Photos
  const [medicalDocs, setMedicalDocs] = useState([
    {
      id: 1,
      title: 'وێنەی پێش و پاشی فیلەر و لەیزەر (Before & After)',
      date: '2026-07-28',
      url: 'https://images.unsplash.com/photo-1512290900672-1f5be1c6e1c2?w=600&auto=format&fit=crop&q=60',
    },
    {
      id: 2,
      title: 'شیکاری دیجیتاڵی پێست و چەوری (Visia Skin Scan)',
      date: '2026-08-10',
      url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=60',
    },
  ]);

  // WhatsApp quick messages
  const sendWhatsappMessage = (templateType: 'reminder' | 'invoice' | 'custom', customText?: string) => {
    const cleanPhone = patient.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '964' + cleanPhone.slice(1) : cleanPhone;

    let msg = '';
    if (templateType === 'reminder') {
      msg = `سڵاو بەڕێز ${patient.name}،\nبیرتان دەخەینەوە کە مەوعیدتان هەیە لە سەنتەری جوانکاری. تکایە لە کاتی خۆیدا ئامادە بن.`;
    } else if (templateType === 'invoice') {
      msg = `سڵاو بەڕێز ${patient.name}،\nپوختەی حسابی سەردانەکەتان لە سەنتەری جوانکاری:\nکۆی گشتی: ${totalBilled.toLocaleString()} د.ع\nبڕی دراو: ${totalPaid.toLocaleString()} د.ع\nسوپاس بۆ متمانەتان.`;
    } else {
      msg = customText || `سڵاو ${patient.name} بەڕێز، پەیام لە سەنتەری جوانکارییەوە.`;
    }

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const patientAppointments = appointments.filter(
    (a) => a.patientId === patient.id || a.patientName === patient.name
  );

  const rawTotalBilled = patientAppointments.reduce((sum, app) => sum + (app.treatmentPrice || 35000), 0) || 35000;
  const totalBilled = Math.max(0, rawTotalBilled - discountAmount);
  const totalPaid = patientAppointments.reduce((sum, app) => sum + (app.paidAmount || 0), 0);
  const remainingBalance = Math.max(0, totalBilled - totalPaid);

  // Toggle procedure in Multi-Select
  const handleToggleService = (serviceName: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceName)) {
        return prev.filter((s) => s !== serviceName);
      } else {
        return [...prev, serviceName];
      }
    });
  };

  // Add custom typed service
  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customServiceText.trim()) return;
    const clean = customServiceText.trim();
    if (!selectedServices.includes(clean)) {
      setSelectedServices((prev) => [...prev, clean]);
    }
    setCustomServiceText('');
  };

  // Save selected services to patient record
  const handleSaveServices = () => {
    const finalChiefComplaint = selectedServices.length > 0 ? selectedServices.join(' + ') : 'سەردانی گشتی جوانکاری';
    if (onUpdatePatient) {
      onUpdatePatient(patient.id, { chiefComplaint: finalChiefComplaint });
    }
    patient.chiefComplaint = finalChiefComplaint;
    setNotice('✨ هۆکاری سەردان و خزمەتگوزارییە سەرەکییەکان بە سەرکەوتوویی نوێکرانەوە.');
    setIsServicesSelectorModalOpen(false);
  };

  // Handle scheduling session
  const handleScheduleSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddAppointment) return;

    const doc = doctors.find((d) => d.id === Number(selectedDoctorId)) || { id: currentUser?.id || 1, name: currentUser?.name || 'پزیشکی سەنتەر' };
    const treatmentTitle =
      selectedSessionServices.length > 0
        ? selectedSessionServices.join(' + ')
        : 'خزمەتگوزاری جوانکاری';

    const finalPrice = Math.max(0, Number(sessionPrice) - Number(sessionDiscount));
    const finalPaid = Number(sessionPaid) > finalPrice ? finalPrice : Number(sessionPaid);

    onAddAppointment({
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      doctorId: doc.id,
      doctorName: doc.name,
      treatmentId: 1,
      treatmentName: treatmentTitle,
      treatmentPrice: finalPrice,
      appointmentDate,
      appointmentTime,
      roomNumber,
      status: 'چاوەڕێ دەکات',
      paidAmount: finalPaid,
      discountApplied: Number(sessionDiscount),
      branchId: effectiveBranchId,
      notes: notes || `خزمەتگوزاری: ${treatmentTitle}`,
    });

    setNotice(`✅ مەوعید و نۆرەی نوێ بە سەرکەوتوویی زیادکرا (نرخی پاش داشکاندن: ${finalPrice.toLocaleString()} د.ع).`);
    setShowScheduleForm(false);
    setSelectedSessionServices([]);
    setNotes('');
    setSessionDiscount(0);
  };

  const handleAddPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;
    setPrescriptions([
      ...prescriptions,
      {
        id: Date.now(),
        medName: newMedName,
        dosage: newMedDosage,
        frequency: '2 جار لە ڕۆژێکدا',
        duration: '7 ڕۆژ',
        instructions: newMedInstructions,
      },
    ]);
    setNewMedName('');
    setNotice('💊 دەرمان بە سەرکەوتوویی بۆ ڕەچەتەی نەخۆش زیادکرا.');
  };

  // Filtered procedures for Multi-Select Catalog
  const filteredProcedures = STANDARD_AESTHETIC_PROCEDURES.filter((proc) => {
    const matchesCategory = activeCategoryFilter === 'all' || proc.category === activeCategoryFilter;
    const matchesSearch =
      !serviceSearchTerm ||
      proc.name.includes(serviceSearchTerm) ||
      proc.nameEn.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
      proc.category.includes(serviceSearchTerm);
    return matchesCategory && matchesSearch;
  });

  return (
    /* Modal Backdrop - Safe spacing from top & bottom so it NEVER slips under the header */
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 overflow-y-auto text-right dir-rtl">
      {/* Spacious, Ultra-Wide Modal Card Container (max-w-7xl) */}
      <div className="w-full max-w-[97vw] 2xl:max-w-7xl max-h-[94vh] bg-slate-900 border-2 border-teal-500/30 rounded-[32px] shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(20,184,166,0.18)] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* TOP MODAL HEADER: Patient Info & Actions */}
        <div className="bg-slate-900/95 border-b border-white/10 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-400 via-cyan-400 to-pink-500 flex items-center justify-center font-black text-2xl text-slate-950 shadow-lg shadow-teal-500/20 shrink-0">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">{patient.name}</h1>
                <span className="text-xs font-mono font-bold text-teal-300 bg-teal-500/20 px-3 py-1 rounded-xl border border-teal-500/30">
                  کۆد: {patient.patientCode}
                </span>
                {patient.isVip && (
                  <span className="text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> VIP نەخۆش
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-3 flex-wrap">
                <span>تەمەن: {patient.age} ساڵ • {patient.gender}</span>
                <span>•</span>
                <span className="text-teal-300 font-mono flex items-center gap-1" dir="ltr">
                  <Phone className="w-3.5 h-3.5 text-teal-400 inline" /> {patient.phone}
                </span>
                <span>•</span>
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="text-slate-400">بەرواری تۆمار:</span>
                  <strong className="font-mono text-cyan-300">{patient.registeredDate}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: WhatsApp, Exit */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsServicesSelectorModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-pink-500/25 to-purple-600/25 hover:from-pink-500/40 hover:to-purple-600/40 border-2 border-pink-500/50 text-pink-200 font-black text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-pink-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              title="دەستنیشانکردنی چەندین خزمەتگوزاری و هۆکاری سەردان"
            >
              <Tag className="w-4 h-4 text-pink-400" />
              <span>هۆکاری سەردان / خزمەتگوزاریی سەرەکی (دیاریکراو)</span>
              <span className="w-5 h-5 rounded-full bg-pink-500 text-white font-mono text-[11px] flex items-center justify-center font-bold">
                {selectedServices.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => sendWhatsappMessage('custom', `سڵاو بەڕێز ${patient.name}، پەیام لە سەنتەری جوانکارییەوە.`)}
              className="px-3.5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="ناردنی وەتس ئەپ"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">واتس ئەپ</span>
            </button>

            {onDeletePatient && currentUser?.role === 'super_admin' && (
              <button
                type="button"
                onClick={() => {
                  onDeletePatient(patient.id);
                  onClose();
                }}
                className="px-3.5 py-2.5 bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer"
                title="سڕینەوەی دۆسیەی ئەم چارەخوازە لە داتابەیس"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">سڕینەوە لە داتابەیس</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white font-black text-xs rounded-2xl flex items-center gap-2 shadow transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="چوونەدەر لە پڕۆفایلی نەخۆش"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>چوونەدەر (Exit)</span>
            </button>
          </div>
        </div>

        {/* REASON FOR VISIT & SELECTED SERVICES BANNER BAR */}
        <div className="bg-slate-950/90 border-b border-white/10 px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              خزمەتگوزارییە دیاریکراوەکانی چارەخواز:
            </span>
            {selectedServices.length > 0 ? (
              selectedServices.map((service) => (
                <span
                  key={service}
                  className="px-3 py-1 bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-teal-500/15 border border-pink-500/30 text-pink-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <span>{service}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleService(service)}
                    className="text-pink-400 hover:text-white cursor-pointer"
                    title="سڕینەوە"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic font-mono bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/5">
                سەردانی گشتی دیارینەکراو
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsServicesSelectorModalOpen(true)}
            className="text-xs font-bold text-teal-300 hover:text-teal-200 bg-teal-500/10 hover:bg-teal-500/20 px-3 py-1.5 rounded-xl border border-teal-500/30 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-teal-400" />
            <span>دەستکاریکردن یان زیادکردنی خزمەتگوزاری</span>
          </button>
        </div>

        {/* NOTICE BANNER */}
        {notice && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-6 py-2.5 text-xs text-emerald-200 font-bold flex items-center justify-between shrink-0 animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {notice}
            </span>
            <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* NAVIGATION TABS WITH COLORFUL COSMIC LUXURY */}
        <div className="bg-slate-950/80 border-b border-white/10 px-6 py-3 flex items-center gap-2.5 overflow-x-auto shrink-0 text-xs no-scrollbar">
          {[
            { id: 'overview' as const, label: '١. زانیاری و پشکنینی گشتی', icon: FileText, gradient: 'from-teal-400 via-cyan-400 to-emerald-400', glow: 'rgba(20,184,166,0.4)' },
            { id: 'sessions' as const, label: `٢. مەوعید و جلسەکان (${patientAppointments.length})`, icon: Calendar, gradient: 'from-cyan-400 via-sky-400 to-blue-500', glow: 'rgba(0,243,255,0.4)' },
            { id: 'surgeries' as const, label: `٣. نەشتەرگەرییەکانی جوانکاری (${patientSurgeries.length})`, icon: Sparkles, gradient: 'from-amber-400 via-pink-500 to-purple-500', glow: 'rgba(236,72,153,0.4)' },
            { id: 'prescriptions' as const, label: `٤. ڕەچەتە و دەرمان (${prescriptions.length})`, icon: Pill, gradient: 'from-emerald-400 via-teal-400 to-cyan-400', glow: 'rgba(16,185,129,0.4)' },
            { id: 'financials' as const, label: '٥. حیسابات و داشکاندن', icon: DollarSign, gradient: 'from-fuchsia-500 via-purple-500 to-pink-500', glow: 'rgba(217,70,239,0.4)' },
            { id: 'qrcode' as const, label: '٦. کارتی تایبەتی پڕۆفایل و QR', icon: QrCode, gradient: 'from-pink-500 via-rose-500 to-amber-500', glow: 'rgba(244,63,94,0.4)' },
            { id: 'archive' as const, label: `٧. ئەرشیف و وێنەکان (${medicalDocs.length})`, icon: ImageIcon, gradient: 'from-amber-400 via-orange-400 to-yellow-500', glow: 'rgba(245,158,11,0.4)' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl font-black transition-all duration-300 cursor-pointer whitespace-nowrap flex items-center gap-2 select-none ${
                  isActive
                    ? `bg-gradient-to-r ${tab.gradient} text-slate-950 shadow-[0_0_20px_${tab.glow}] border border-white/60 scale-[1.02]`
                    : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/10 hover:border-white/30'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
              </button>
            );
          })}
        </div>

        {/* MODAL BODY CONTAINER - Scrollable & Full-Width */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950/60 space-y-6">

          {/* TAB 1: OVERVIEW & CLINICAL NOTES */}
          {activeTab === 'overview' && (
            <div className="w-full space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Right Column: Clinical Details, Skin Assessment, Multi-Service Card (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* MULTI-SERVICE SELECTION PROMINENT CARD */}
                  <div className="bg-slate-900 border-2 border-pink-500/30 p-6 rounded-3xl space-y-4 shadow-xl shadow-pink-500/5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-pink-400" />
                        <h3 className="text-sm md:text-base font-black text-white">
                          هۆکاری سەردان / خزمەتگوزاریی سەرەکی (دیاریکراو)
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsServicesSelectorModalOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>دەستنیشانکردنی خزمەتگوزارییەکان ({selectedServices.length})</span>
                      </button>
                    </div>

                    {selectedServices.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-300">
                          ئەم چارەخوازە ئەم خزمەتگوزاری و چارەسەرانەی خوارەوەی لە سەنتەرەکەمان دیاریکردووە:
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {selectedServices.map((serv) => (
                            <span
                              key={serv}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-teal-500/20 border border-pink-500/40 text-pink-200 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm"
                            >
                              <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                              <span>{serv}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleService(serv)}
                                className="text-pink-400 hover:text-white cursor-pointer ml-1"
                                title="سڕینەوەی ئەم ئایتمە"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950/70 rounded-2xl border border-white/5 text-center space-y-2">
                        <p className="text-xs text-slate-400">تا ئێستا هیچ خزمەتگوزارییەکی تایبەت دیارینەکراوە.</p>
                        <button
                          type="button"
                          onClick={() => setIsServicesSelectorModalOpen(true)}
                          className="text-xs text-pink-400 hover:text-pink-300 font-bold underline cursor-pointer"
                        >
                          کلیک لێرە بکە بۆ دەستنیشانکردنی هۆکاری سەردان لە کەتەلۆگی سەنتەر
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SKIN ASSESSMENT & GLOW INDEX */}
                  <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-400" /> هەڵسەنگاندنی پێست، شێداری و ڕەزامەندی لە ئەنجام
                      </span>
                      <span className="text-xs font-mono font-bold text-pink-300 bg-pink-500/10 px-3 py-1 rounded-xl border border-pink-500/20">
                        {Math.min(100, Math.max(60, painVasScore * 10))}٪ شێداری و درەوشانەوە
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-white/10 p-0.5">
                      <div
                        className="bg-gradient-to-r from-pink-500 via-fuchsia-400 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(60, painVasScore * 10))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>نمرەی درەوشانەوە و ڕەزامەندی (1 تا 10):</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={painVasScore}
                        onChange={(e) => setPainVasScore(Number(e.target.value))}
                        className="w-1/2 accent-pink-500 bg-slate-800 h-2 rounded cursor-pointer"
                      />
                      <span className="font-mono font-bold text-pink-400 text-sm">{painVasScore} / 10 ⭐</span>
                    </div>
                  </div>

                  {/* AESTHETIC SURGERY SUMMARY CARD IN PATIENT PROFILE */}
                  <div className="bg-slate-900 border border-amber-500/30 p-6 rounded-3xl space-y-4 shadow-sm shadow-amber-500/5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs md:text-sm font-black text-white">
                            نەشتەرگەرییەکانی جوانکاری چارەخواز ({patientSurgeries.length})
                          </h3>
                          <span className="text-[10px] text-slate-400">
                            لقی دیاریکراوی ئەکاونت: <strong className="text-teal-300 font-bold">{activeBranchName}</strong> (خۆکار)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('surgeries');
                            setShowAddSurgeryModal(true);
                          }}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-md"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>نەشتەرگەری نوێ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('surgeries')}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl border border-white/10 cursor-pointer"
                        >
                          بینینی تەواوی
                        </button>
                      </div>
                    </div>

                    {patientSurgeries.length > 0 ? (
                      <div className="space-y-2.5">
                        {patientSurgeries.slice(0, 2).map((s) => (
                          <div key={s.id} className="p-3.5 bg-slate-950/80 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <strong className="text-white text-sm block">{s.surgeryName}</strong>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                                <span>پزیشک: <span className="text-slate-200">{s.surgeonName}</span></span>
                                <span>•</span>
                                <span>لق: <span className="text-teal-300">{s.branchName}</span></span>
                                <span>•</span>
                                <span>سڕکردن: <span className="text-amber-300">{s.anesthesiaType}</span></span>
                              </div>
                            </div>
                            <div className="text-left font-mono shrink-0">
                              <div className="text-white font-black text-xs">{s.surgeryPrice.toLocaleString()} د.ع</div>
                              <div className="text-emerald-400 text-[11px]">دراوە: {s.paidAmount.toLocaleString()} د.ع</div>
                              {s.remainingAmount > 0 && (
                                <div className="text-rose-400 text-[11px]">قەرز: {s.remainingAmount.toLocaleString()} د.ع</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic">
                        تا ئێستا هیچ نەشتەرگەرییەک بۆ ئەم چارەخوازە تۆمارنەکراوە.
                      </p>
                    )}
                  </div>

                  {/* MEDICAL HISTORY & CLINICAL DECISION */}
                  <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h3 className="text-xs md:text-sm font-bold text-teal-300 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-400" /> مێژووی پزیشکی و بڕیاری پزیشک
                      </h3>
                      <button
                        onClick={() => {
                          if (isEditingHistory && onUpdatePatient) {
                            onUpdatePatient(patient.id, { medicalHistory: medicalHistoryText });
                            setNotice('💾 مێژووی پزیشکی پاشەکەوت کرا.');
                          }
                          setIsEditingHistory(!isEditingHistory);
                        }}
                        className="text-xs bg-white/5 hover:bg-white/10 text-teal-300 px-3.5 py-1.5 rounded-xl font-bold border border-white/10 cursor-pointer transition-all"
                      >
                        {isEditingHistory ? 'پاشەکەوتکردن' : 'دەستکاری'}
                      </button>
                    </div>
                    {isEditingHistory ? (
                      <textarea
                        rows={4}
                        value={medicalHistoryText}
                        onChange={(e) => setMedicalHistoryText(e.target.value)}
                        className="w-full p-3.5 bg-slate-950 border border-teal-500/40 rounded-2xl text-xs text-white outline-none focus:border-teal-400"
                      />
                    ) : (
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-white/5">
                        {medicalHistoryText}
                      </p>
                    )}
                  </div>
                </div>

                {/* Left Column: Quick Actions & Financial Highlights (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Financial Mini Card */}
                  <div className="bg-slate-900 border border-white/10 p-5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-bold text-purple-300 flex items-center gap-2 border-b border-white/10 pb-2">
                      <DollarSign className="w-4 h-4 text-purple-400" /> دۆخی دارایی
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-white/5">
                        <span className="text-slate-400">کۆی گشتی حیساب:</span>
                        <strong className="font-mono text-white text-sm">{totalBilled.toLocaleString()} د.ع</strong>
                      </div>
                      <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-white/5">
                        <span className="text-slate-400">بڕی دراو (کاش):</span>
                        <strong className="font-mono text-emerald-400 text-sm">{totalPaid.toLocaleString()} د.ع</strong>
                      </div>
                      <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-white/5">
                        <span className="text-slate-400">قەرزی ماوە:</span>
                        <strong className={`font-mono text-sm ${remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-300'}`}>
                          {remainingBalance > 0 ? `${remainingBalance.toLocaleString()} د.ع` : 'پاککراوە (0)'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* QUICK ACTIONS SIDEBAR */}
                  <div className="bg-slate-900 border border-white/10 p-5 rounded-3xl space-y-3 shadow-sm">
                    <h3 className="text-xs font-bold text-cyan-300 border-b border-white/10 pb-2">کردارە خێراکان</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setActiveTab('surgeries');
                          setShowAddSurgeryModal(true);
                        }}
                        className="w-full py-3 bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-300 font-black text-xs rounded-2xl border border-amber-500/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>تۆمارکردنی نەشتەرگەری جوانکاری (خۆکار لە لق)</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('sessions');
                          setShowScheduleForm(true);
                        }}
                        className="w-full py-3 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs rounded-2xl border border-teal-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>تۆمارکردنی مەوعیدی نوێ</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('qrcode')}
                        className="w-full py-3 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 font-bold text-xs rounded-2xl border border-pink-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>بینین و چاپکردنی کارتی VIP</span>
                      </button>

                      <button
                        onClick={() => sendWhatsappMessage('reminder')}
                        className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs rounded-2xl border border-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <Send className="w-4 h-4" />
                        <span>ناردنی یادخستنەوەی وەتس ئەپ</span>
                      </button>

                      <button
                        onClick={() => sendWhatsappMessage('invoice')}
                        className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs rounded-2xl border border-purple-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>ناردنی پسووڵەی حیساب بە وەتس ئەپ</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SESSIONS & APPOINTMENTS (FULL WIDTH) */}
          {activeTab === 'sessions' && (
            <div className="w-full space-y-6">
              <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-2">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-400" /> مەوعید و جلسەکانی نەخۆش ({patientAppointments.length})
                  </h3>
                  <button
                    onClick={() => setShowScheduleForm(!showScheduleForm)}
                    className="text-xs font-black bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 px-4 py-2 rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>جلسەی نوێ</span>
                  </button>
                </div>

                {/* SCHEDULE FORM OVERLAY */}
                {showScheduleForm && (
                  <form onSubmit={handleScheduleSession} className="p-6 bg-slate-950 border border-teal-500/40 rounded-3xl space-y-5 text-xs animate-in zoom-in-95 duration-200">
                    <div className="font-bold text-teal-300 border-b border-white/10 pb-2 flex items-center justify-between">
                      <span>زیادکردنی مەوعید و هەڵبژاردنی فرە-خزمەتگوزاری و نرخ</span>
                      <button type="button" onClick={() => setShowScheduleForm(false)} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Predefined Treatment Selector with Multi-Service chips */}
                    <div className="space-y-3">
                      <label className="block text-slate-300 font-bold">
                        خزمەتگوزارییە داواکراوەکان بۆ ئەم جلسەیە (دەستنیشانکردنی چەندین ئایتم):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {STANDARD_AESTHETIC_PROCEDURES.map((proc) => {
                          const isSelected = selectedSessionServices.includes(proc.name);
                          return (
                            <button
                              key={proc.id}
                              type="button"
                              onClick={() => {
                                const updated = isSelected
                                  ? selectedSessionServices.filter((s) => s !== proc.name)
                                  : [...selectedSessionServices, proc.name];
                                setSelectedSessionServices(updated);

                                // Auto recalculate price sum
                                const sum = updated.reduce((total, name) => {
                                  const p = STANDARD_AESTHETIC_PROCEDURES.find((item) => item.name === name);
                                  return total + (p ? p.suggestedPrice : 35000);
                                }, 0) || 35000;
                                setSessionPrice(sum);
                                setSessionPaid(sum);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-500 text-slate-950 border-teal-400 font-black shadow-md scale-105'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10'
                              }`}
                            >
                              <span>{proc.name.split('(')[0].trim()}</span>
                              <span className="font-mono text-[10px] opacity-75 mr-1">({proc.suggestedPrice.toLocaleString()} د.ع)</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div>
                        <label className="block text-slate-300 mb-1 font-bold">پزیشک / پسپۆڕ</label>
                        <select
                          value={selectedDoctorId}
                          onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                          className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400 cursor-pointer"
                        >
                          {doctors.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.role === 'doctor' ? 'پزیشک' : 'کارمەند'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-bold">ژوور / بەش</label>
                        <input
                          type="text"
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                          className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-bold">بەروار</label>
                        <input
                          type="date"
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                          className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white font-mono outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-bold">کاتژمێر</label>
                        <input
                          type="text"
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                          className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white font-mono outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div>
                        <label className="block text-slate-300 mb-1 font-bold">نرخی خەمڵێنراو (د.ع)</label>
                        <input
                          type="number"
                          value={sessionPrice}
                          onChange={(e) => setSessionPrice(Number(e.target.value))}
                          className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white font-mono outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-amber-400 mb-1 font-bold">داشکاندن (د.ع)</label>
                        <input
                          type="number"
                          value={sessionDiscount}
                          onChange={(e) => setSessionDiscount(Number(e.target.value))}
                          placeholder="0"
                          className="w-full p-3 bg-slate-900 border border-amber-500/50 rounded-xl text-amber-300 font-mono outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-emerald-400 mb-1 font-bold">پارەی کاش دراو (د.ع)</label>
                        <input
                          type="number"
                          value={sessionPaid}
                          onChange={(e) => setSessionPaid(Number(e.target.value))}
                          className="w-full p-3 bg-slate-900 border border-emerald-500/50 rounded-xl text-emerald-300 font-mono outline-none font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="text-xs text-teal-300 font-bold">
                        نرخی کۆتایی: {Math.max(0, Number(sessionPrice) - Number(sessionDiscount)).toLocaleString()} د.ع
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowScheduleForm(false)}
                          className="px-4 py-2 bg-white/10 text-slate-300 rounded-xl cursor-pointer"
                        >
                          پاشگەزبوونەوە
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-teal-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-md hover:brightness-110 active:scale-95 transition-all"
                        >
                          تۆمارکردنی جلسە
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* SESSIONS TABLE */}
                {patientAppointments.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-10">هیچ مەوعید یان جلسەیەک تۆمارنەکراوە.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-950/80 text-slate-300 border-b border-white/10">
                        <tr>
                          <th className="py-3 px-4 font-mono">#</th>
                          <th className="py-3 px-4">خزمەتگوزاری / چارەسەر</th>
                          <th className="py-3 px-4">پزیشک</th>
                          <th className="py-3 px-4 font-mono">بەروار و کات</th>
                          <th className="py-3 px-4">ژوور</th>
                          <th className="py-3 px-4">نرخ و کاش</th>
                          <th className="py-3 px-4">دۆخ</th>
                          <th className="py-3 px-4 text-center">وەسڵ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-slate-900/40">
                        {patientAppointments.map((app, idx) => (
                          <tr key={app.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-white max-w-[250px]">{app.treatmentName}</td>
                            <td className="py-3 px-4 text-slate-300">{app.doctorName}</td>
                            <td className="py-3 px-4 font-mono text-cyan-300">{app.appointmentDate} • {app.appointmentTime}</td>
                            <td className="py-3 px-4 text-slate-300">{app.roomNumber}</td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-400">{app.paidAmount.toLocaleString()} د.ع</td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white/5 border border-white/10 text-teal-300">
                                {app.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceAppointment(app)}
                                className="px-3 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold rounded-xl border border-teal-500/40 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>وەسڵ</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SURGERIES (نەشتەرگەرییەکانی جوانکاری) */}
          {activeTab === 'surgeries' && (
            <div className="w-full space-y-6">
              <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">نەشتەرگەرییەکانی جوانکاری چارەخواز ({patientSurgeries.length})</h3>
                      <p className="text-xs text-slate-400">تۆمارکردنی نەشتەرگەری لە لقە تایبەتەکان، نرخی نەشتەرگەری و حیساباتی فەرمی</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddSurgeryModal(true)}
                    className="text-xs font-black bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 text-slate-950 px-5 py-2.5 rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>تۆمارکردنی نەشتەرگەری نوێ</span>
                  </button>
                </div>

                {patientSurgeries.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-10">هیچ نەشتەرگەرییەک بۆ ئەم چارەخوازە تۆمارنەکراوە.</p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-950/80 text-slate-300 border-b border-white/10">
                        <tr>
                          <th className="py-3 px-4">ناوی نەشتەرگەری</th>
                          <th className="py-3 px-4">لق (Branch)</th>
                          <th className="py-3 px-4">پزیشکی نەشتەرگەر</th>
                          <th className="py-3 px-4">جۆری سڕکردن</th>
                          <th className="py-3 px-4">نرخی نەشتەرگەری</th>
                          <th className="py-3 px-4">پارەی دراو / ماوە</th>
                          <th className="py-3 px-4 font-mono">بەروار</th>
                          <th className="py-3 px-4 text-left">کردار</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-slate-900/40">
                        {patientSurgeries.map((s) => (
                          <tr key={s.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white">
                              {s.surgeryName}
                              {s.notes && <span className="block text-[10px] text-slate-400 font-normal">{s.notes}</span>}
                            </td>
                            <td className="py-3.5 px-4 text-cyan-300 font-medium">
                              <span className="inline-flex items-center gap-1.5 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                                {s.branchName}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-200">{s.surgeonName}</td>
                            <td className="py-3.5 px-4 text-amber-300">{s.anesthesiaType}</td>
                            <td className="py-3.5 px-4 font-mono font-black text-white">{s.surgeryPrice.toLocaleString()} د.ع</td>
                            <td className="py-3.5 px-4 font-mono">
                              <div className="text-emerald-300 font-bold">دراوە: {s.paidAmount.toLocaleString()} د.ع</div>
                              <div className={s.remainingAmount > 0 ? 'text-rose-400' : 'text-slate-500'}>
                                قەرز: {s.remainingAmount.toLocaleString()} د.ع
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-400">{s.date}</td>
                            <td className="py-3.5 px-4 text-left">
                              <button
                                onClick={() => {
                                  if (confirm('ئایا دڵنیایت لە سڕینەوەی ئەم نەشتەرگەرییە؟')) {
                                    setPatientSurgeries(patientSurgeries.filter(item => item.id !== s.id));
                                  }
                                }}
                                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition cursor-pointer"
                                title="سڕینەوە"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ADD SURGERY MODAL */}
              {showAddSurgeryModal && (
                <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-slate-900 border-2 border-amber-500/40 rounded-[32px] w-full max-w-xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                          <Sparkles className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white">تۆمارکردنی نەشتەرگەری جوانکاری نوێ</h3>
                          <p className="text-xs text-slate-400">لەگەڵ هەژمارکردنی ڕاستەوخۆ لە حیساباتی ڕۆژانە، مانگانە و گشتی</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAddSurgeryModal(false)}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveSurgery} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1.5 font-bold">جۆری نەشتەرگەری جوانکاری *</label>
                        <input
                          type="text"
                          required
                          value={surgeryNameInput}
                          onChange={(e) => setSurgeryNameInput(e.target.value)}
                          placeholder="نموونە: نەشتەرگەری لوت، لیپۆساکشن، تامی بەڵی..."
                          className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-white outline-none focus:border-amber-400 font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-300 mb-1.5 font-bold flex items-center justify-between">
                            <span>لقی ئەنجامدراوی نەشتەرگەری:</span>
                            <span className="text-[10px] text-teal-300 font-bold">
                              (خۆکارانە لەسەر ئەکاونتەکەت دیاریکراوە)
                            </span>
                          </label>
                          <div className="w-full p-3.5 bg-slate-950/80 border border-teal-500/40 rounded-2xl text-teal-300 font-bold flex items-center justify-between shadow-inner">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-teal-400" />
                              <span className="font-black text-sm">{activeBranchName}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-teal-500/10 text-teal-300 text-[10px] rounded-lg border border-teal-500/20 font-mono font-bold">
                              ئۆتۆماتیکی ئەکاونتی کارمەند
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-300 mb-1.5 font-bold">پزیشکی نەشتەرگەر (Surgeon) *</label>
                          <input
                            type="text"
                            required
                            value={surgeonInput}
                            onChange={(e) => setSurgeonInput(e.target.value)}
                            className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-white outline-none focus:border-amber-400 font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-300 mb-1.5 font-bold">نرخی نەشتەرگەری (IQD)</label>
                          <input
                            type="number"
                            min="0"
                            step="50000"
                            required
                            value={surgeryPriceInput}
                            onChange={(e) => setSurgeryPriceInput(Number(e.target.value))}
                            className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-white font-mono font-bold outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 mb-1.5 font-bold">پارەی دراو (Paid)</label>
                          <input
                            type="number"
                            min="0"
                            step="50000"
                            required
                            value={surgeryPaidInput}
                            onChange={(e) => setSurgeryPaidInput(Number(e.target.value))}
                            className="w-full p-3.5 bg-slate-950 border border-emerald-500/40 rounded-2xl text-emerald-300 font-mono font-bold outline-none focus:border-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 mb-1.5 font-bold">جۆری سڕکردن (Anesthesia)</label>
                          <select
                            value={anesthesiaInput}
                            onChange={(e) => setAnesthesiaInput(e.target.value)}
                            className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-amber-300 outline-none focus:border-amber-400 font-bold"
                          >
                            <option value="گشتی (General)">گشتی (General Anesthesia)</option>
                            <option value="لۆکاڵی (Local)">لۆکاڵی (Local Anesthesia)</option>
                            <option value="سڕکردنی سووک (Sedation)">سڕکردنی سووک (Sedation)</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>نرخی کۆتایی:</span>
                          <strong className="text-cyan-300 font-mono">{Number(surgeryPriceInput).toLocaleString()} د.ع</strong>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>پارەی دراو (کاش):</span>
                          <strong className="text-emerald-300 font-mono">{Number(surgeryPaidInput).toLocaleString()} د.ع</strong>
                        </div>
                        <div className="flex justify-between text-slate-300 pt-2 border-t border-white/10">
                          <span>قەرزی ماوە:</span>
                          <strong className="text-rose-400 font-mono">{Math.max(0, Number(surgeryPriceInput) - Number(surgeryPaidInput)).toLocaleString()} د.ع</strong>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1.5 font-bold">تێبینی و ڕێنمایی پۆست-ۆپ</label>
                        <textarea
                          rows={2}
                          value={surgeryNotesInput}
                          onChange={(e) => setSurgeryNotesInput(e.target.value)}
                          placeholder="تێبینی پزیشک..."
                          className="w-full p-3 bg-slate-950 border border-white/15 rounded-2xl text-white outline-none focus:border-amber-400 text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => setShowAddSurgeryModal(false)}
                          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer"
                        >
                          پاشگەزبوونەوە
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-black rounded-xl shadow-md cursor-pointer hover:opacity-90"
                        >
                          تۆمارکردن و هەژمارکردن لە حیسابات
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRESCRIPTIONS (FULL WIDTH) */}
          {activeTab === 'prescriptions' && (
            <div className="w-full space-y-6">
              <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-emerald-400" /> ڕەچەتەی دەرمان و ڕێنمایی پزیشک ({prescriptions.length})
                  </h3>
                </div>

                {/* ADD MED FORM WITH STANDARD PRESETS */}
                <form onSubmit={handleAddPrescription} className="p-5 bg-slate-950 rounded-2xl space-y-4 border border-emerald-500/30">
                  {/* Preset Pills */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-emerald-300 block">
                      هەڵبژاردنی دەرمان و ڕەچەتە لە وشە سابتەکان (Standard Prescription Presets):
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-0.5">
                      {STANDARD_PRESCRIPTION_PRESETS.map((rx) => (
                        <button
                          key={rx.id}
                          type="button"
                          onClick={() => {
                            setNewMedName(rx.medName);
                            setNewMedDosage(rx.dosage);
                            setNewMedInstructions(rx.instructions);
                          }}
                          className={`text-[11px] px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-right flex items-center gap-1.5 ${
                            newMedName === rx.medName
                              ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-md scale-105'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10'
                          }`}
                        >
                          <span>{rx.medName.split('(')[0].trim()}</span>
                          <span className="text-[10px] opacity-75 font-mono">({rx.frequency})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="ناوی دەرمان (بۆ نموونە: Sunscreen SPF 50+)"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-emerald-400 font-bold"
                      required
                    />
                    <input
                      type="text"
                      placeholder="ژەمە (بۆ نموونە: 2 جار لە ڕۆژێکدا)"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-emerald-400"
                    />
                    <input
                      type="text"
                      placeholder="ڕێنمایی (بۆ نموونە: دوای جلسەی لەیزەر)"
                      value={newMedInstructions}
                      onChange={(e) => setNewMedInstructions(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer shadow-md hover:brightness-110 active:scale-95 transition-all"
                    >
                      زیادکردنی دەرمان
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {prescriptions.map((rx) => (
                    <div key={rx.id} className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-white block text-sm">{rx.medName}</strong>
                        <span className="text-slate-400 text-[11px]">{rx.dosage} • {rx.frequency} ({rx.duration})</span>
                      </div>
                      <span className="text-teal-300 bg-teal-500/10 px-3 py-1 rounded-xl text-xs font-bold border border-teal-500/20">
                        {rx.instructions}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIALS & DISCOUNTS (FULL WIDTH) */}
          {activeTab === 'financials' && (
            <div className="w-full space-y-6">
              <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-6">
                <h3 className="text-base font-bold text-purple-300 flex items-center gap-2 border-b border-white/10 pb-3">
                  <DollarSign className="w-5 h-5 text-purple-400" /> پوختەی حیسابات، داشکاندن و پارەدانی مانگانە
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 bg-slate-950 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-slate-400 text-xs">کۆی گشتی نرخ (پاش داشکاندن):</span>
                    <div className="font-mono font-bold text-white text-lg">
                      {totalBilled.toLocaleString('en-US')} د.ع
                      {discountAmount > 0 && (
                        <span className="text-xs text-amber-400 block font-normal">
                          ({rawTotalBilled.toLocaleString()} - {discountAmount.toLocaleString()} داشکاندن)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5 bg-slate-950 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-amber-400 text-xs font-bold">بڕی داشکاندن (د.ع):</span>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                        className="w-full p-2 bg-slate-900 border border-amber-500/40 rounded-xl text-amber-300 font-mono text-sm outline-none"
                      />
                      <span className="text-xs text-slate-400">د.ع</span>
                    </div>
                  </div>
                  <div className="p-5 bg-slate-950 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-rose-400 text-xs font-bold">قەرزی ماوە:</span>
                    <div className="font-mono font-bold text-rose-400 text-lg">
                      {isFullMonthPaid ? '0 (تەواو دراوە)' : `${remainingBalance.toLocaleString('en-US')} د.ع`}
                    </div>
                  </div>
                </div>

                {/* FULL MONTH FULL PAYMENT TOGGLE */}
                <div className="p-5 bg-slate-950 rounded-2xl border border-teal-500/30 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <strong className="text-white text-sm block">پارەدانی یەک مانگ بە تەواوی (Full Month Prepayment)</strong>
                    <span className="text-xs text-slate-400">ئایا نەخۆشەکە نرخی تەواوی یەک مانگی بە یەک جار داوە؟</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFullMonthPaid}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setIsFullMonthPaid(val);
                        localStorage.setItem(`donia_patient_fullmonth_${patient.id}`, String(val));
                        setNotice(val ? '✅ پارەدانی یەک مانگ بە تەواوی تۆمارکرا و قەرز سفر بووەوە.' : 'ℹ️ دۆخی پارەدان گۆڕدرا.');
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      localStorage.setItem(`donia_patient_discount_${patient.id}`, String(discountAmount));
                      setNotice('💾 داشکاندن و بڕی پارەدانی نەخۆش بە سەرکەوتوویی پاشەکەوت کرا.');
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xs rounded-xl cursor-pointer shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>پاشەکەوتکردنی گۆڕانکارییەکان</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VIP PATIENT QR CARD & BARCODE (FULL WIDTH) */}
          {activeTab === 'qrcode' && (
            <div className="w-full space-y-6">
              <div className="bg-slate-900 border border-white/10 p-6 md:p-8 rounded-3xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-pink-400" /> کارتی تایبەتی ئەندامێتی و QR کۆدی چارەخواز
                    </h3>
                    <p className="text-xs text-slate-400">ئەم کارتە دەتوانرێت بە شێوەی ڕەنگاوڕەنگ یان PDF چاپ بکرێت و بدرێتە چارەخواز</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPrintableDoc({
                        type: 'vip_card',
                        data: {
                          patientName: patient.name,
                          patientPhone: patient.phone,
                          patientCode: patient.patientCode,
                          patientAge: patient.age,
                          patientGender: patient.gender,
                        },
                      })
                    }
                    className="px-5 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>چاپکردنی کارتی چارەخواز (Print VIP Card / PDF)</span>
                  </button>
                </div>

                {/* VISUAL VIP CARD PREVIEW */}
                <div className="max-w-xl mx-auto bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/80 border-2 border-pink-500/40 rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden text-right">
                  {/* Glowing background flares */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                    <div>
                      <h4 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-fuchsia-200 to-white">
                        BEAUTY CENTER
                      </h4>
                      <p className="text-[10px] text-pink-300/80 font-mono">Aesthetic & Laser VIP Member</p>
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-pink-500/20 text-pink-300 px-3 py-1 rounded-xl border border-pink-500/30">
                      {patient.patientCode}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-3 flex-1 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block">ناوی بەڕێز:</span>
                        <strong className="text-base text-white font-black">{patient.name}</strong>
                      </div>
                      <div className="flex items-center gap-4 text-slate-300">
                        <div>
                          <span className="text-[10px] text-slate-400 block">تەمەن / ڕەگەز:</span>
                          <span className="font-bold">{patient.age} ساڵ • {patient.gender}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">ژمارەی مۆبایل:</span>
                          <span className="font-mono text-teal-300" dir="ltr">{patient.phone}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">خزمەتگوزارییە سەرەکییەکان:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedServices.slice(0, 3).map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded-lg text-[10px] font-bold border border-pink-500/30">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* QR Code Container */}
                    <div className="p-3 bg-white rounded-2xl shadow-lg flex flex-col items-center justify-center shrink-0">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                          `BEAUTY-CENTER:${patient.patientCode}:${patient.name}:${patient.phone}`
                        )}`}
                        alt={`QR Code ${patient.patientCode}`}
                        className="w-28 h-28 object-contain"
                      />
                      <span className="text-[9px] font-mono text-slate-800 font-bold mt-1">{patient.patientCode}</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                    <span>بەرواری دەرچوون: {patient.registeredDate}</span>
                    <span className="text-pink-300 font-bold">بۆ مەوعید پەیوەندی بکەن</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ARCHIVE & SCANS (FULL WIDTH) */}
          {activeTab === 'archive' && (
            <div className="w-full space-y-6">
              <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                  <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-cyan-400" /> ئەرشیفی وێنە، تیشک و پشکنینەکان ({medicalDocs.length})
                  </h3>
                  <button
                    onClick={() => {
                      const title = prompt('ناوی وێنە یان تیشکەکە بنووسە:');
                      if (title) {
                        setMedicalDocs([
                          ...medicalDocs,
                          {
                            id: Date.now(),
                            title,
                            date: new Date().toISOString().split('T')[0],
                            url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=60',
                          },
                        ]);
                        setNotice('📸 تیشک یان وێنە بۆ ئەرشیف زیادکرا.');
                      }
                    }}
                    className="text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3.5 py-2 rounded-xl cursor-pointer hover:bg-cyan-500/30 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>زیادکردنی وێنە/تیشک</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {medicalDocs.map((doc) => (
                    <div key={doc.id} className="rounded-2xl border border-white/10 bg-slate-950 overflow-hidden shadow-md group">
                      <img src={doc.url} alt={doc.title} className="w-full h-44 object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      <div className="p-3 text-xs text-white font-bold flex items-center justify-between">
                        <span className="truncate">{doc.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{doc.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL BOTTOM BAR: Fixed footer */}
        <div className="bg-slate-900 border-t border-white/10 px-6 py-4 flex items-center justify-between shrink-0 shadow-md flex-wrap gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>سیستەمی سەنتەری جوانکاری</span>
            <span>•</span>
            <span>کۆدی چارەخواز: <strong className="font-mono text-teal-300">{patient.patientCode}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsServicesSelectorModalOpen(true)}
              className="px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Tag className="w-3.5 h-3.5 text-pink-400" />
              <span>دەستنیشانکردنی خزمەتگوزاری ({selectedServices.length})</span>
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>چوونەدەر (Exit)</span>
            </button>
          </div>
        </div>

      </div>

      {/* MULTI-SELECT SERVICES & REASON FOR VISIT FULL MODAL OVERLAY */}
      {isServicesSelectorModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-pink-500/40 rounded-[32px] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 bg-slate-900/95 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black text-white">
                    هۆکاری سەردان / خزمەتگوزاریی سەرەکی (دیاریکراو)
                  </h3>
                  <p className="text-xs text-slate-400">
                    دەستنیشانکردنی چەندین خزمەتگوزاری (Multi-Select) بۆ چارەخواز: <strong>{patient.name}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsServicesSelectorModalOpen(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              
              {/* Search Bar & Active Summary */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={serviceSearchTerm}
                    onChange={(e) => setServiceSearchTerm(e.target.value)}
                    placeholder="گەڕان لە خزمەتگوزارییەکان..."
                    className="w-full pr-10 pl-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-pink-400 font-bold"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="px-3.5 py-1.5 bg-pink-500/20 border border-pink-500/40 text-pink-300 font-bold rounded-xl text-xs">
                    {selectedServices.length} خزمەتگوزاری دیاریکراوە
                  </span>
                  {selectedServices.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedServices([])}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-bold border border-rose-500/20 cursor-pointer transition-colors"
                    >
                      سڕینەوەی هەمووی
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Services Chips Box */}
              {selectedServices.length > 0 && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-pink-500/30 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    خزمەتگوزارییە هەڵبژێردراوەکان:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedServices.map((srv) => (
                      <span
                        key={srv}
                        className="px-3 py-1 bg-gradient-to-r from-pink-500/25 to-purple-600/25 border border-pink-500/50 text-pink-200 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm"
                      >
                        <span>{srv}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleService(srv)}
                          className="text-pink-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Add Form */}
              <form onSubmit={handleAddCustomService} className="flex items-center gap-2">
                <input
                  type="text"
                  value={customServiceText}
                  onChange={(e) => setCustomServiceText(e.target.value)}
                  placeholder="یان خزمەتگوزارییەک بە دەست بنووسە (بۆ نموونە: پاکێجی بووکێن یان تەقشیر)..."
                  className="flex-1 p-2.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-pink-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>زیادکردن</span>
                </button>
              </form>

              {/* Categories Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveCategoryFilter('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border ${
                    activeCategoryFilter === 'all'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400 shadow-md scale-105'
                      : 'bg-slate-950 text-slate-400 border-white/10 hover:bg-slate-800'
                  }`}
                >
                  هەمووی ({STANDARD_AESTHETIC_PROCEDURES.length})
                </button>
                {STANDARD_PROCEDURE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      activeCategoryFilter === cat
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400 shadow-md scale-105'
                        : 'bg-slate-950 text-slate-400 border-white/10 hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Procedures Grid Catalog */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto p-1 custom-scrollbar">
                {filteredProcedures.map((proc) => {
                  const isSelected = selectedServices.includes(proc.name);
                  return (
                    <div
                      key={proc.id}
                      onClick={() => handleToggleService(proc.name)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 select-none ${
                        isSelected
                          ? 'bg-gradient-to-br from-pink-900/40 to-purple-900/40 border-pink-500/70 shadow-lg shadow-pink-500/10 ring-1 ring-pink-500/40'
                          : 'bg-slate-950 hover:bg-slate-850 border-white/10 hover:border-pink-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500">{proc.category}</span>
                          <strong className={`text-xs block leading-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {proc.name}
                          </strong>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-pink-500 text-white shadow-md' : 'bg-slate-900 border border-white/10 text-slate-600'
                          }`}
                        >
                          {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3" />}
                        </div>
                      </div>

                      <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-teal-300">
                          {proc.suggestedPrice.toLocaleString()} د.ع
                        </span>
                        <span className="text-slate-500 flex items-center gap-1 font-mono text-[10px]">
                          <Clock className="w-3 h-3" /> {proc.durationMinutes} خولەک
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-slate-900/95 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">
                کۆی خزمەتگوزاری دیاریکراو: <strong className="text-pink-300">{selectedServices.length} ئایتم</strong>
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsServicesSelectorModalOpen(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer"
                >
                  داخستن
                </button>
                <button
                  type="button"
                  onClick={handleSaveServices}
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>پاشەکەوتکردن لە پڕۆفایلی چارەخواز</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL INVOICE / RECEIPT MODAL */}
      {selectedInvoiceAppointment && (
        <div className="fixed inset-0 z-[10001] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-950 border border-slate-300 w-full max-w-lg rounded-[32px] p-8 shadow-2xl space-y-6 dir-rtl text-right">
            {/* Header */}
            <div className="text-center border-b border-slate-200 pb-4 space-y-1">
              <h2 className="text-xl font-black text-slate-900">سەنتەری جوانکاری</h2>
              <p className="text-xs text-slate-500">BEAUTY CENTER • Official Medical Invoice</p>
              <div className="text-[11px] text-slate-500 font-mono">وەسڵی فەرمی و پسوولەی دارایی چارەخواز</div>
            </div>

            {/* Patient & Invoice Info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">ناوی چارەخواز:</span>
                <strong className="text-slate-900 text-sm">{patient.name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">کۆدی نەخۆش:</span>
                <strong className="text-slate-900 font-mono">{patient.patientCode}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">تەمەن و ڕەگەز:</span>
                <strong className="text-slate-900">{patient.age} ساڵ • {patient.gender}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">بەرواری وەسڵ:</span>
                <strong className="text-slate-900 font-mono">{selectedInvoiceAppointment.appointmentDate}</strong>
              </div>
            </div>

            {/* Treatment Items Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">خزمەتگوزاری / ئایتم</th>
                    <th className="py-2.5 px-3">نرخ</th>
                    <th className="py-2.5 px-3">داشکاندن</th>
                    <th className="py-2.5 px-3">کۆی گشتی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-900">{selectedInvoiceAppointment.treatmentName}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {(selectedInvoiceAppointment.treatmentPrice + (selectedInvoiceAppointment.discountApplied || 0)).toLocaleString()} د.ع
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-600 font-bold">
                      {(selectedInvoiceAppointment.discountApplied || 0).toLocaleString()} د.ع
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-700 font-bold">
                      {selectedInvoiceAppointment.paidAmount.toLocaleString()} د.ع
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-sm font-black">
              <span>کۆی پارەی دراو (کاش):</span>
              <span className="font-mono text-emerald-300 text-lg">
                {selectedInvoiceAppointment.paidAmount.toLocaleString()} د.ع
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedInvoiceAppointment(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-700 font-bold text-xs cursor-pointer"
              >
                داخستن
              </button>
              <button
                type="button"
                onClick={() => {
                  setMedicalDocs([
                    ...medicalDocs,
                    {
                      id: Date.now(),
                      title: `وەسڵی فەرمی - ${selectedInvoiceAppointment.treatmentName} (${selectedInvoiceAppointment.appointmentDate})`,
                      date: selectedInvoiceAppointment.appointmentDate,
                      url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60',
                    },
                  ]);
                  setNotice('💾 وەسڵەکە بە سەرکەوتوویی لە پڕۆفایلی نەخۆش (ئەرشیف) پاشەکەوت کرا.');
                  setSelectedInvoiceAppointment(null);
                }}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                💾 پاشەکەوتکردن لە ئەرشیف
              </button>
              <button
                type="button"
                onClick={() =>
                  setPrintableDoc({
                    type: 'patient_invoice',
                    data: {
                      patientName: patient.name,
                      patientPhone: patient.phone,
                      patientAge: patient.age,
                      treatmentName: selectedInvoiceAppointment.treatmentName,
                      doctorName: selectedInvoiceAppointment.doctorName,
                      originalPrice: selectedInvoiceAppointment.treatmentPrice,
                      discountPct: selectedInvoiceAppointment.discountApplied,
                      discountAmount: Math.round(
                        ((selectedInvoiceAppointment.treatmentPrice || 150000) *
                          (selectedInvoiceAppointment.discountApplied || 0)) /
                          100
                      ),
                      paidAmount:
                        selectedInvoiceAppointment.paidAmount ||
                        selectedInvoiceAppointment.treatmentPrice,
                      date: selectedInvoiceAppointment.appointmentDate,
                    },
                  })
                }
                className="px-6 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 hover:brightness-110 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>چاپکردنی وەسڵ و فاکتۆر (PDF / Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {printableDoc && (
        <PrintableMedicalDocumentModal
          isOpen={Boolean(printableDoc)}
          onClose={() => setPrintableDoc(null)}
          docType={printableDoc.type}
          data={printableDoc.data}
        />
      )}
    </div>
  );
};
