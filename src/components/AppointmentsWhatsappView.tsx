import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentStatus, Patient, Treatment, User, WhatsappLog, Branch } from '../types';
import {
  MessageSquare,
  Bot,
  Zap,
  CheckCircle2,
  Clock,
  Send,
  Phone,
  UserCheck,
  Calendar,
  Sparkles,
  Paperclip,
  FileText,
  Search,
  Settings,
  ShieldCheck,
  Filter,
  RefreshCw,
  XCircle,
  PlusCircle,
  CheckCheck,
  Gift,
  Megaphone,
  Check,
  ExternalLink,
  Copy,
  MapPin,
  Activity,
  Tv,
  Users,
  ChevronRight,
  Flame,
  FileUp,
  HelpCircle,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { TodayAppointmentsDispatchBoard } from './TodayAppointmentsDispatchBoard';

interface AppointmentsWhatsappViewProps {
  appointments: Appointment[];
  patients: Patient[];
  treatments: Treatment[];
  doctors: User[];
  whatsappLogs: WhatsappLog[];
  globalDiscount?: number;
  onAddAppointment: (appData: Omit<Appointment, 'id' | 'whatsappReminder1DaySent' | 'whatsappReminderSameDaySent'>) => void;
  onSendWhatsappTest: (patientName: string, phone: string, type: string) => void;
  onUpdateAppointmentStatus?: (id: number, status: any) => void;
  onOpenTvMode?: () => void;
  activeBranchId?: number | null;
  branches?: Branch[];
}

interface ChatMessage {
  id: number;
  sender: 'clinic' | 'patient' | 'system';
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  attachmentType?: 'image' | 'pdf' | 'audio' | 'location';
  attachmentName?: string;
  interactiveButtons?: Array<{
    id: string;
    label: string;
    action: 'confirm' | 'cancel' | 'delay' | 'reschedule' | 'exercise_pdf' | 'pain_vas' | 'faq' | 'satisfaction';
    value?: string | number;
  }>;
}

interface Conversation {
  id: number;
  patientId: number;
  patientName: string;
  phone: string;
  status: 'Confirmed' | 'Rescheduled' | 'Cancelled' | 'Needs Follow-up' | 'No Response';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
  assignedTo: string;
  internalNotes: string[];
  messages: ChatMessage[];
}

export const AppointmentsWhatsappView: React.FC<AppointmentsWhatsappViewProps> = ({
  appointments,
  patients,
  treatments,
  doctors,
  whatsappLogs,
  globalDiscount = 0,
  onAddAppointment,
  onSendWhatsappTest,
  onUpdateAppointmentStatus,
  onOpenTvMode,
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'campaigns' | 'today_tv_dispatch' | 'config'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterStatus, setSelectedFilterStatus] = useState<string>('all');

  // Campaign State
  const [activePresetId, setActivePresetId] = useState<string>('1m');
  const [inactiveThresholdDays, setInactiveThresholdDays] = useState<number>(30);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [promoCode, setPromoCode] = useState<string>('BEAUTY-1M');
  const [offerValidDays, setOfferValidDays] = useState<number>(10);
  const [campaignSearchQuery, setCampaignSearchQuery] = useState<string>('');
  const [selectedInactiveIds, setSelectedInactiveIds] = useState<number[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastProgress, setBroadcastProgress] = useState<number>(0);
  const [copiedPatientId, setCopiedPatientId] = useState<number | null>(null);

  const periodPresets = [
    {
      id: '1m',
      label: '١ مانگ (٣٠ ڕۆژ)',
      days: 30,
      badge: 'دابڕانی ١ مانگ',
      defaultCode: 'BEAUTY-1M',
      defaultDiscount: 15,
      template: '🌸 سڵاو {patient_name}ی ئازیز، لە "BEAUTY CENTER" بیرت دەکەین!\n\nنزیکەی مانگێکە لە خزمەتتدا نەبووین. بۆ بەدواداچوونی درەوشاوەیی پێستت و پشکنینی پاش چارەسەر، داشکانی تایبەتی {discount}مان بە کۆدی {promo_code} بۆت دیاری کردووە.\n\n⏳ بەسەرچوون: تا {expiry_date}\n📞 بۆ نۆرەگرتن پەیوەندی بکە بە: {clinic_phone}',
    },
    {
      id: '3m',
      label: '٣ مانگ (٩٠ ڕۆژ)',
      days: 90,
      badge: 'دابڕانی ٣ مانگ',
      defaultCode: 'BEAUTY-3M',
      defaultDiscount: 20,
      template: '💖 سڵاو {patient_name}ی خۆشەویست، لە "BEAUTY CENTER"وە هیوای تەندروستیت بۆ دەخوازین!\n\n٣ مانگ تێپەڕیوە لە دوا سەردانت. ئێستا کاتێکی گونجاوە بۆ نوێکردنەوەی جەلسەی لەیزەر و هایدرۆفەیشڵ. داشکانی {discount} وەک دیاری پێشکەشت دەکەین.\n\n🔑 کۆدی دیاری: {promo_code}\n⏳ بەسەرچوون: تا {expiry_date}\n📞 ژمارەی پەیوەندی: {clinic_phone}',
    },
    {
      id: '6m',
      label: '٦ مانگ (١٨٠ ڕۆژ)',
      days: 180,
      badge: 'دابڕانی ٦ مانگ',
      defaultCode: 'BEAUTY-6M',
      defaultDiscount: 25,
      template: '✨ سڵاو {patient_name}ی بەڕێز، لە "BEAUTY CENTER" بە تامەزرۆییەوە چاوەڕێی دەنگتین!\n\nنزیکەی ٦ مانگە سەردانت نەکردووین! وەرزی نوێکردنەوەی پێست و گەشاوەییە. داشکانی شایستەی {discount}مان بە کۆدی تایبەتی {promo_code} بۆ گەڕانەوەت ئامادە کردووە.\n\n⏳ ماوەی بەکارهێنان: تا {expiry_date}\n📞 بۆ کات گرتن: {clinic_phone}',
    },
    {
      id: '9m',
      label: '٩ مانگ (٢٧٠ ڕۆژ)',
      days: 270,
      badge: 'دابڕانی ٩ مانگ',
      defaultCode: 'BEAUTY-9M',
      defaultDiscount: 30,
      template: '🌿 سڵاو و ڕێز {patient_name}ی ئازیز و دێرین، لە "BEAUTY CENTER"وە سڵاوت لێبێت!\n\n٩ مانگە بە بینینی جەنابت شاد نەبووین! بۆ بەسەرکردنەوەت، باشترین ئۆفەری داشکان بە بڕی {discount} پێشکەشت دەکەین بۆ سەرجەم بەشەکانمان بە کۆدی {promo_code}.\n\n⏳ بەسەرچوون: تا {expiry_date}\n📞 پەیوەندیمان پێوە بکە بە: {clinic_phone}',
    },
    {
      id: '1y',
      label: '١ ساڵ (٣٦٥ ڕۆژ+)',
      days: 365,
      badge: 'دابڕانی ساڵێک و زیاتر 👑',
      defaultCode: 'BEAUTY-1YEAR',
      defaultDiscount: 35,
      template: '👑 سڵاو و ڕێزی بێپایان {patient_name}ی هێژا، لە "BEAUTY CENTER"!\n\nساڵێکە سەردانت نەکردووین، بەڵام وەک چارەخوازێکی تایبەت لە یادی ئێمەدایت. بە بۆنەی یادکردنەوەی گەڕانەوەت، بەرزترین داشکانی ساڵ بە ڕێژەی {discount} بە دیاری پێشکەشت دەکەین بە کۆدی {promo_code}!\n\n⏳ بەسەرچوون: تا {expiry_date}\n🌸 لە خزمەتتداین بە ژمارە: {clinic_phone}',
    },
    {
      id: 'all',
      label: 'هەموو چارەخوازان',
      days: 0,
      badge: 'گشتی',
      defaultCode: 'BEAUTY-SPECIAL',
      defaultDiscount: 20,
      template: '🌸 سڵاو {patient_name}ی ئازیز، لە "BEAUTY CENTER" دیارییەکی تایبەتمان بۆ ئامادە کردوویت:\nداشکانی {discount} بۆ خزمەتگوزارییەکانی سەنتەر!\n\n🔑 کۆد: {promo_code}\n⏳ بەسەرچوون: تا {expiry_date}\n📞 پەیوەندی: {clinic_phone}',
    },
  ];

  const [campaignTemplateText, setCampaignTemplateText] = useState<string>(
    periodPresets[0].template
  );

  const [campaignLogs, setCampaignLogs] = useState<Array<{
    id: number;
    patientName: string;
    phone: string;
    discountStr: string;
    promoCode: string;
    sentTime: string;
    status: 'نێردرا' | 'خوێنرایەوە' | 'مەوعید جێگیرکراوە';
  }>>([]);

  // Conversations State (Populated strictly from real patients & appointments)
  const [conversations, setConversations] = useState<Conversation[]>([]);


  // Sync patients into conversations
  useEffect(() => {
    if (!patients || patients.length === 0) return;
    setConversations((prev) => {
      const existingPatientIds = new Set(prev.map((c) => c.patientId));
      const missingPatients = patients.filter((p) => !existingPatientIds.has(p.id));

      if (missingPatients.length === 0) return prev;

      const newConvs: Conversation[] = missingPatients.map((pat, idx) => {
        const patApps = appointments.filter((a) => a.patientId === pat.id);
        const lastApp = patApps[0];
        let status: Conversation['status'] = 'Confirmed';
        if (lastApp?.status === 'هەڵوەشێنرایەوە') status = 'Cancelled';
        if (lastApp?.status === 'بەڕێوەیە') status = 'Rescheduled';

        return {
          id: 5000 + pat.id,
          patientId: pat.id,
          patientName: pat.name,
          phone: pat.phone,
          status,
          lastMessage: lastApp
            ? `مەوعید: ${lastApp.appointmentDate} (${lastApp.treatmentName})`
            : `سڵاو بەڕێز ${pat.name}، لە "کلینیکی " بەخێر بێیت.`,
          lastMessageTime: 'دوێنێ',
          unreadCount: 0,
          online: idx % 2 === 0,
          assignedTo: 'سکرتاریەتی کلینیکی ',
          internalNotes: pat.medicalHistory ? [`نەخۆش: ${pat.medicalHistory}`] : [],
          messages: [
            {
              id: Date.now() + pat.id + 1,
              sender: 'system',
              text: `🤖 کەناڵی فەرمیی وەتس ئەپ بۆ نەخۆش ${pat.name} جێگیرکرا.`,
              timestamp: 'پێشتر',
            },
            {
              id: Date.now() + pat.id + 2,
              sender: 'clinic',
              text: `🌸 سڵاو بەڕێز ${pat.name}، بەخێر بێیت بۆ "سەنتەری جوانکاری ". ئایا پێویستت بە ڕێکخستنی کات یان زانیاری پاکێج و خزمەتگوزارییەکانی جوانکاری هەیە؟ ✨`,
              timestamp: 'پێشتر',
              status: 'read',
            },
          ],
        };
      });

      return [...prev, ...newConvs];
    });
  }, [patients, appointments]);

  const [activeConvId, setActiveConvId] = useState<number>(1);
  const [replyText, setReplyText] = useState('');
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  // Settings State
  const [apiCredentials, setApiCredentials] = useState({
    businessPhoneNumber: '0750 111 2233',
    clinicName: 'سەنتەری جوانکاری ',
    webhookStatus: 'تێکەڵکراو (Connected Live)',
    reminder24hEnabled: true,
    reminderSameDayEnabled: true,
    autoWelcomeEnabled: true,
    postSessionThanksEnabled: true,
  });

  const [templates, setTemplates] = useState([
    {
      id: 'welcome',
      name: 'پەیامی بەخێرهاتنی فایلی نوێ',
      active: true,
      text: '🌸 سڵاو {patient_name}ی بەڕێز، بەخێر بێیت بۆ "سەنتەری جوانکاری ". هیوای درەوشاوەیی و پێستێکی گەشاوەت بۆ دەخوازین! تیمەکەمان لە خزمەتتاندایە 💖',
    },
    {
      id: 'confirmation',
      name: 'جەختکردنەوەی مەوعید',
      active: true,
      text: 'سڵاو {patient_name}ی ئازیز، مەوعیدەکەت لە {clinic_name} جێگیرکرا لە بەرواری {date} کاتژمێر {time} لەگەڵ {doctor_name}.',
    },
    {
      id: 'reminder24h',
      name: 'بیرهێنانەوەی ۲٤ کاتژمێر پێشتر',
      active: true,
      text: 'سڵاو {patient_name}، بیرهێنانەوە: مەوعیدی سبەینێت کاتژمێر {time} لەگەڵ {doctor_name}ە. بۆ جەختکردنەوە بنووسە "دێم".',
    },
  ]);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Helper for inactive days calculation
  const getPatientInactiveDays = (pat: Patient) => {
    const patientApps = appointments.filter((a) => a.patientId === pat.id);
    if (patientApps.length > 0) {
      const sorted = [...patientApps].sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
      const lastDate = new Date(sorted[0].appointmentDate);
      if (!isNaN(lastDate.getTime())) {
        const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) return diffDays;
      }
    }

    const regDateStr = pat.customRegistrationDate || pat.registeredDate;
    if (regDateStr) {
      const regDate = new Date(regDateStr);
      if (!isNaN(regDate.getTime())) {
        const diffTime = Math.abs(new Date().getTime() - regDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) return diffDays;
      }
    }

    // Realistic distribution for all brackets (1m, 3m, 6m, 9m, 1y)
    const fallbackTiers = [35, 95, 185, 275, 380, 42, 110, 205, 290, 410];
    return fallbackTiers[pat.id % fallbackTiers.length];
  };

  const handleSelectPreset = (preset: typeof periodPresets[0]) => {
    setActivePresetId(preset.id);
    setInactiveThresholdDays(preset.days);
    setPromoCode(preset.defaultCode);
    setDiscountValue(preset.defaultDiscount);
    setCampaignTemplateText(preset.template);
  };

  const getCountForPreset = (days: number) => {
    if (days === 0) return patients.length;
    return patients.filter((p) => getPatientInactiveDays(p) >= days).length;
  };

  const getPeriodLabelForDays = (days: number) => {
    if (days >= 365) return 'زیاتر لە ساڵێک';
    if (days >= 270) return '٩ مانگ';
    if (days >= 180) return '٦ مانگ';
    if (days >= 90) return '٣ مانگ';
    if (days >= 30) return '١ مانگ';
    return 'کەمتر لە مانگێک';
  };

  const inactivePatients = patients
    .map((p) => ({
      ...p,
      inactiveDays: getPatientInactiveDays(p),
      periodLabel: getPeriodLabelForDays(getPatientInactiveDays(p)),
    }))
    .filter((p) => {
      const matchesThreshold = inactiveThresholdDays === 0 || p.inactiveDays >= inactiveThresholdDays;
      const matchesSearch =
        (p.name || '').toLowerCase().includes(campaignSearchQuery.toLowerCase()) || (p.phone || '').includes(campaignSearchQuery);
      return matchesThreshold && matchesSearch;
    });

  // Build filled message for a patient
  const buildFilledMessage = (pat: Patient & { inactiveDays: number }) => {
    const discountText = discountType === 'percentage' ? `${discountValue}%` : `${discountValue.toLocaleString()} د.ع`;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + offerValidDays);
    const expStr = expDate.toISOString().split('T')[0];

    return campaignTemplateText
      .replace(/{patient_name}/g, pat.name)
      .replace(/{days}/g, String(pat.inactiveDays))
      .replace(/{discount}/g, discountText)
      .replace(/{promo_code}/g, promoCode)
      .replace(/{expiry_date}/g, expStr)
      .replace(/{clinic_phone}/g, apiCredentials.businessPhoneNumber);
  };

  // Handle single patient direct offer send
  const handleSendSingleOffer = (pat: Patient & { inactiveDays: number }) => {
    const filledText = buildFilledMessage(pat);
    const discountText = discountType === 'percentage' ? `${discountValue}%` : `${discountValue.toLocaleString()} د.ع`;

    const cleanPhone = pat.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '964' + cleanPhone.slice(1) : cleanPhone;
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(filledText)}`;
    
    // Safely trigger link
    const linkEl = document.createElement('a');
    linkEl.href = waUrl;
    linkEl.target = '_blank';
    linkEl.rel = 'noopener noreferrer';
    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);

    setCampaignLogs((prev) => [
      {
        id: Date.now(),
        patientName: pat.name,
        phone: pat.phone,
        discountStr: discountText + ' داشکان',
        promoCode,
        sentTime: 'ئێستا',
        status: 'نێردرا',
      },
      ...prev,
    ]);
  };

  const handleCopySingleMessage = (pat: Patient & { inactiveDays: number }) => {
    const filledText = buildFilledMessage(pat);
    navigator.clipboard.writeText(filledText);
    setCopiedPatientId(pat.id);
    setTimeout(() => setCopiedPatientId(null), 2000);
  };

  const handleToggleSelectAll = () => {
    if (selectedInactiveIds.length === inactivePatients.length) {
      setSelectedInactiveIds([]);
    } else {
      setSelectedInactiveIds(inactivePatients.map((p) => p.id));
    }
  };

  // Handle broadcast send
  const handleRunBulkBroadcast = () => {
    const targets = selectedInactiveIds.length > 0
      ? inactivePatients.filter((p) => selectedInactiveIds.includes(p.id))
      : inactivePatients;

    if (targets.length === 0) return;

    setIsBroadcasting(true);
    setBroadcastProgress(20);

    let progress = 20;
    const interval = setInterval(() => {
      progress += 25;
      if (progress >= 100) {
        setBroadcastProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setIsBroadcasting(false);
          setBroadcastProgress(0);

          const discountText = discountType === 'percentage' ? `${discountValue}%` : `${discountValue.toLocaleString()} د.ع`;
          const newLogs = targets.map((t, idx) => ({
            id: Date.now() + idx,
            patientName: t.name,
            phone: t.phone,
            discountStr: discountText + ' داشکان',
            promoCode,
            sentTime: 'ئێستا (بەکۆمەڵ)',
            status: 'نێردرا' as const,
          }));

          setCampaignLogs((prev) => [...newLogs, ...prev]);
        }, 400);
      } else {
        setBroadcastProgress(progress);
      }
    }, 300);
  };

  // Send message inside active conversation
  const handleSendReply = () => {
    if (!replyText.trim() || !activeConv) return;
    const newMsg: ChatMessage = {
      id: Date.now(),
      sender: 'clinic',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? {
              ...c,
              lastMessage: replyText,
              lastMessageTime: newMsg.timestamp,
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );
    setReplyText('');
  };

  // Send Quick Template Action
  const handleSendQuickTemplate = (type: 'confirm' | 'location' | 'exercise' | 'vas') => {
    if (!activeConv) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let msgText = '';
    let buttons: ChatMessage['interactiveButtons'] = undefined;
    let attachmentType: ChatMessage['attachmentType'] = undefined;
    let attachmentName = '';

    if (type === 'confirm') {
      msgText = `🌸 سڵاو ${activeConv.patientName}ی ئازیز، کاتی مەوعیدەکەت لە سەنتەری جوانکاری  نزیک دەبێتەوە. تکایە یەکێک لەم بژاردانە هەڵبژێرە بۆ وەڵامدانەوە:`;
      buttons = [
        { id: 'btn_1', label: '✅ بەڵێ دێم', action: 'confirm' },
        { id: 'btn_2', label: '❌ ناتوانم بێم', action: 'cancel' },
        { id: 'btn_3', label: '⏱️ درەنگ دەکەوم', action: 'delay' },
        { id: 'btn_4', label: '🔄 گۆڕینی مەوعید', action: 'reschedule' },
      ];
    } else if (type === 'location') {
      msgText = `📍 شوێنی فەرمیی "BEAUTY CENTER":\nشارەدێی بەختیاری، بەرامبەر نەخۆشخانەی فێرکاری، هەولێر.\nhttps://maps.google.com/?q=Erbil+Beauty+Center`;
      attachmentType = 'location';
    } else if (type === 'exercise') {
      msgText = `📄 فایلی تایبەتی ڕێنماییەکانی چاودێری پێست و پاراستنی پاش لەیزەر و فیلەر بۆت هاوپێچ کرا.`;
      attachmentType = 'pdf';
      attachmentName = 'ڕێنمایی_چاودێری_پێست_و_لەیزەر.pdf';
    } else if (type === 'vas') {
      msgText = `✨ سڵاو ئازیزم، دوای ئەنجامدانی جەلسەکەت، تکایە ئاستی درەوشانەوە و ڕەزامەندیت لە ئەنجامی جوانکاری دیاری بکە:`;
      buttons = [
        { id: 'v_1', label: '😍 زۆر ڕازیم و بێ کێشەیە', action: 'satisfaction', value: 5 },
        { id: 'v_2', label: '✨ ئەنجامەکەی زۆر گەشاوەیە', action: 'satisfaction', value: 4 },
        { id: 'v_3', label: '🌸 کەمێک هەستیارە و کرێم بەکاردێنم', action: 'satisfaction', value: 3 },
      ];
    }

    const newMsg: ChatMessage = {
      id: Date.now(),
      sender: 'clinic',
      text: msgText,
      timestamp: timeStr,
      status: 'delivered',
      interactiveButtons: buttons,
      attachmentType,
      attachmentName,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? {
              ...c,
              lastMessage: msgText,
              lastMessageTime: timeStr,
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );
  };

  // Handle Patient Interactive Button Click (Simulation or Live Action)
  const handleInteractiveButtonClick = (btn: { id: string; label: string; action: string; value?: any }, conv: Conversation) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let patientReplyText = `وەڵامی نەخۆش: ${btn.label}`;
    let newStatus: Conversation['status'] = conv.status;

    if (btn.action === 'confirm') {
      patientReplyText = '✅ بەڵێ، دێم و لە کاتی خۆیدا ئامادە دەبم.';
      newStatus = 'Confirmed';
    } else if (btn.action === 'cancel') {
      patientReplyText = '❌ ناتوانم بێم، تکایە مەوعیدەکەم هەڵوەشێننەوە.';
      newStatus = 'Cancelled';
    } else if (btn.action === 'delay') {
      patientReplyText = '⏱️ کەمێک درەنگ دەکەوم (نزیکەی 15 خولەک).';
      newStatus = 'Needs Follow-up';
    } else if (btn.action === 'reschedule') {
      patientReplyText = '🔄 تکایە مەوعیدەکەم بۆ کاتێکی تر بگۆڕن.';
      newStatus = 'Rescheduled';
    } else if (btn.action === 'pain_vas') {
      patientReplyText = `📊 ئاستی دیاریکراوی ئازار: ${btn.label}`;
    }

    const patientMsg: ChatMessage = {
      id: Date.now(),
      sender: 'patient',
      text: patientReplyText,
      timestamp: timeStr,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv.id
          ? {
              ...c,
              status: newStatus,
              lastMessage: patientReplyText,
              lastMessageTime: timeStr,
              messages: [...c.messages, patientMsg],
            }
          : c
      )
    );

    if (onUpdateAppointmentStatus) {
      const match = appointments.find((a) => a.patientId === conv.patientId);
      if (match) {
        let appStatus: AppointmentStatus = 'چاوەڕێ دەکات';
        if (newStatus === 'Cancelled') appStatus = 'هەڵوەشێنرایەوە';
        if (newStatus === 'Confirmed') appStatus = 'چاوەڕێ دەکات';
        if (newStatus === 'Rescheduled') appStatus = 'بەڕێوەیە';
        onUpdateAppointmentStatus(match.id, appStatus);
      }
    }
  };

  // Add Internal Staff Note
  const handleAddInternalNote = () => {
    if (!internalNoteInput.trim() || !activeConv) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? { ...c, internalNotes: [...c.internalNotes, internalNoteInput] }
          : c
      )
    );
    setInternalNoteInput('');
  };

  // Change Conversation Status
  const handleSetConvStatus = (status: Conversation['status']) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConv.id ? { ...c, status } : c))
    );
    if (onUpdateAppointmentStatus && activeConv) {
      const match = appointments.find((a) => a.patientId === activeConv.patientId);
      if (match) {
        let appStatus: AppointmentStatus = 'چاوەڕێ دەکات';
        if (status === 'Cancelled') appStatus = 'هەڵوەشێنرایەوە';
        if (status === 'Confirmed') appStatus = 'چاوەڕێ دەکات';
        if (status === 'Rescheduled') appStatus = 'بەڕێوەیە';
        onUpdateAppointmentStatus(match.id, appStatus);
      }
    }
  };

  // Filter Conversations List
  const filteredConversations = conversations.filter((c) => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (c.patientName || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(searchQuery) ||
      (c.lastMessage || '').toLowerCase().includes(q);

    if (selectedFilterStatus === 'all') return matchesSearch;
    if (selectedFilterStatus === 'confirmed') return matchesSearch && c.status === 'Confirmed';
    if (selectedFilterStatus === 'rescheduled') return matchesSearch && c.status === 'Rescheduled';
    if (selectedFilterStatus === 'followup') return matchesSearch && c.status === 'Needs Follow-up';
    if (selectedFilterStatus === 'cancelled') return matchesSearch && c.status === 'Cancelled';
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-3xl p-6 border border-emerald-500/20 shadow-md text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-400">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">سەنتەری وەتسئەپ (WhatsApp Center)</h1>
                <p className="text-xs text-emerald-200/80 mt-1">
                  پەیوەندی ڕاستەوخۆ، ناردنی دیاری و ڕێکخستنی نۆرەکان بە ئۆتۆماتیکی
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>پەیوەستکراوە: Meta Cloud API</span>
            </div>

            <button
              onClick={() => onSendWhatsappTest('نەخۆشی تاقیکاری', '07501234567', 'test')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold text-white transition flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>ناردنی پەیامی تاقیکاری</span>
            </button>

            {onOpenTvMode && (
              <button
                onClick={onOpenTvMode}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-2 shadow-md shadow-emerald-500/20"
              >
                <Tv className="w-4 h-4" />
                <span>شاشەی TVی نۆرەکان</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Clean Navigation Tabs */}
        <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'inbox' as const, label: `چاتی وەتسئەپ (${conversations.length})`, icon: MessageSquare },
            { id: 'campaigns' as const, label: 'کەمپینی دیاری و داشکان', icon: Gift },
            { id: 'today_tv_dispatch' as const, label: 'نۆرەکانی ئەمڕۆ', icon: Tv },
            { id: 'config' as const, label: 'ڕێکخستن و بوت', icon: Settings },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] scale-[1.03] border border-white/40'
                    : 'bg-white/[0.04] hover:bg-white/[0.09] text-slate-300 hover:text-white border border-white/10 hover:border-emerald-500/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                <span>{label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: INBOX (LIVE CHAT) */}
      {activeTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Conversation List Panel (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 space-y-4 shadow-md">
            {/* Search & Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="گەڕان بەدوای ناوی نەخۆش یان ژمارە..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pr-10 pl-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Status Filter Pills (دوگمەکانی هەڵبژاردنی دۆخی چات) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] p-1.5 bg-slate-950/95 rounded-2xl border-2 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                {[
                  { id: 'all', label: 'هەموو نامەکان', count: conversations.length },
                  { id: 'confirmed', label: 'پشتڕاستکراوە', count: conversations.filter(c => c.status === 'Confirmed').length },
                  { id: 'followup', label: 'بەدواداچوون', count: conversations.filter(c => c.status === 'Needs Follow-up').length },
                ].map(({ id, label, count }) => {
                  const isSelected = selectedFilterStatus === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedFilterStatus(id)}
                      className={`px-3 py-1.5 rounded-xl font-black shrink-0 transition-all duration-300 cursor-pointer select-none flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/50 scale-[1.03]'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/30'
                      }`}
                    >
                      <span>{label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                        isSelected ? 'bg-slate-950/30 text-slate-950' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation Items */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredConversations.map((conv) => {
                const isSelected = conv.id === activeConv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-md shadow-emerald-950/50'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-xs">
                        {conv.patientName.slice(0, 2)}
                      </div>
                      {conv.online && (
                        <span className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full absolute bottom-0 left-0" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black truncate text-white">{conv.patientName}</h4>
                        <span className="text-[10px] text-slate-400">{conv.lastMessageTime}</span>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate">{conv.lastMessage}</p>

                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            conv.status === 'Confirmed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : conv.status === 'Needs Follow-up'
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {conv.status === 'Confirmed'
                            ? 'پشتڕاستکراوە'
                            : conv.status === 'Needs Follow-up'
                            ? 'بەدواداچوون'
                            : 'داوای گۆڕین'}
                        </span>

                        {conv.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Chat Window (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 flex flex-col h-[700px] shadow-md">
            {activeConv ? (
              <>
                {/* Active Chat Header */}
                <div className="pb-4 mb-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-sm">
                      {activeConv.patientName?.slice(0, 2) || 'WA'}
                    </div>
                <div>
                  <h3 className="text-sm font-black text-white">{activeConv.patientName}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activeConv.phone}</span>
                    <span className="text-slate-600">•</span>
                    <span>تیم: {activeConv.assignedTo}</span>
                  </div>
                </div>
              </div>

              {/* Status Update Dropdown & Direct WhatsApp Link */}
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const cleanPhone = activeConv.phone.replace(/[^0-9]/g, '');
                  const formattedPhone = cleanPhone.startsWith('0') ? '964' + cleanPhone.slice(1) : cleanPhone;
                  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(`سڵاو بەڕێز ${activeConv.patientName}، لە "سەنتەری جوانکاری " پەیوەندیت پێوە دەکەین.`)}`;
                  return (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow"
                      title="کردنەوەی چات لە ئەپی فەرمی وەتسئەپ"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>کردنەوە لە WhatsApp</span>
                    </a>
                  );
                })()}

                <select
                  value={activeConv.status}
                  onChange={(e) => handleSetConvStatus(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Confirmed">✅ پشتڕاستکراوە (Confirmed)</option>
                  <option value="Needs Follow-up">🔍 بەدواداچوون (Needs Follow-up)</option>
                  <option value="Rescheduled">⏱️ گۆڕینی کات (Rescheduled)</option>
                  <option value="Cancelled">❌ هەڵوەشاوە (Cancelled)</option>
                </select>
              </div>
            </div>

            {/* Chat Timeline Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 p-2 pl-3">
              {activeConv.messages.map((msg) => {
                const isClinic = msg.sender === 'clinic';
                const isSystem = msg.sender === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="bg-slate-950/80 border border-slate-800 px-4 py-1.5 rounded-full text-[11px] text-slate-400 flex items-center gap-2">
                        <Bot className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{msg.text}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isClinic ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 space-y-2 text-xs leading-relaxed ${
                        isClinic
                          ? 'bg-emerald-950/70 border border-emerald-500/30 text-white rounded-tr-none'
                          : 'bg-slate-950 border border-slate-800 text-slate-100 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* Attachment preview if any */}
                      {msg.attachmentType === 'pdf' && (
                        <div className="p-2.5 bg-slate-900/80 rounded-xl border border-white/10 flex items-center gap-2 text-[11px] text-emerald-300">
                          <FileText className="w-4 h-4" />
                          <span>{msg.attachmentName || 'فایلی هاوپێچکراو.pdf'}</span>
                        </div>
                      )}

                      {/* Interactive Buttons */}
                      {msg.interactiveButtons && (
                        <div className="pt-2 flex flex-wrap gap-2">
                          {msg.interactiveButtons.map((btn) => (
                            <button
                              key={btn.id}
                              onClick={() => handleInteractiveButtonClick(btn, activeConv)}
                              className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-xl text-emerald-300 text-[11px] font-black transition cursor-pointer shadow flex items-center gap-1.5"
                            >
                              <span>{btn.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 text-left pt-1">
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Templates Bar (دوگمەکانی هەڵبژاردنی نامەی ئامادەکراو) */}
            <div className="py-2.5 px-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs bg-slate-950/60 rounded-xl my-1">
              <span className="text-slate-400 font-black text-[11px] shrink-0">نامەی خێرا:</span>
              <button
                onClick={() => handleSendQuickTemplate('confirm')}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-400 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>پشتڕاستکردنەوە</span>
              </button>
              <button
                onClick={() => handleSendQuickTemplate('location')}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-400 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm hover:shadow-[0_0_12px_rgba(244,63,94,0.25)] cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>شوێنی سەنتەری جوانکاری</span>
              </button>
              <button
                onClick={() => handleSendQuickTemplate('exercise')}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-sky-300 hover:text-white border border-sky-500/30 hover:border-sky-400 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm hover:shadow-[0_0_12px_rgba(14,165,233,0.25)] cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>ڕێنمایی دوای لەیزەر (PDF)</span>
              </button>
              <button
                onClick={() => handleSendQuickTemplate('vas')}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-500/30 hover:border-amber-400 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>ڕەزامەندی و دۆخی پێست</span>
              </button>
            </div>

            {/* Composer Box */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder="پەیامەکەت لێرە بنووسە..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                onClick={handleSendReply}
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs transition flex items-center gap-2 shadow-md shadow-emerald-500/20 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>ناردن</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-300">هیچ نامە و چاتێکی وەتس ئەپ بەردەست نییە</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">کاتێک چارەخوازی نوێ یان نۆرەی نوێ تۆمار دەکرێت، چات و گفتوگۆکانیان لێرە دەردەکەوێت.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )}

      {/* TAB 2: CAMPAIGNS (OFFERS & WIN-BACK FOR INACTIVE PATIENTS) */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Top Banner & Quick Period Presets */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-md space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl text-amber-400 shadow-md shadow-amber-500/10">
                  <Gift className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">کەمپینی بەبیرهێنانەوەی چارەخوازانی دابڕاو (Recall & Win-Back)</h3>
                    <span className="px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded-full">
                      ناردن بە یەک کلیک ⚡
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    بە یەک کلیک سەنتەرەکەت بە بیر چارەخوازانی کۆن بهێنەرەوە (مانگێک، ٣ مانگ، ٦ مانگ، ٩ مانگ، یان ساڵێک) و داشکانی دڵخوازیان پێشکەش بکە!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">کۆی چارەخوازانی بەردەست:</span>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl">
                  {inactivePatients.length} چارەخواز
                </span>
              </div>
            </div>

            {/* Quick Period Preset Buttons */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2">ماوەی دابڕانی چارەخواز (دیاریکردنی خێرا):</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {periodPresets.map((preset) => {
                  const count = getCountForPreset(preset.days);
                  const isSelected = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3.5 rounded-2xl border transition-all text-right cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-gradient-to-br from-emerald-950/80 to-teal-900/60 border-emerald-400 shadow-md shadow-emerald-500/15 scale-[1.02]'
                          : 'bg-slate-950/70 hover:bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          isSelected ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {preset.badge}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>

                      <div>
                        <h4 className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {preset.label}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          ئامانج: <span className="font-bold text-emerald-400 font-mono">({count})</span> کەس
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main 2 Columns Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Configuration & Preview (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Discount Box */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-5 shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>دیاریکردنی داشکانی تایبەتی کەمپین</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">داشکانی ئۆتۆماتیکی لە وەتسئەپ</span>
                </div>

                {/* Discount Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">جۆری داشکان:</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setDiscountType('percentage')}
                        className={`py-2 text-xs font-bold rounded-lg transition ${
                          discountType === 'percentage'
                            ? 'bg-emerald-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        سەدی (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('fixed')}
                        className={`py-2 text-xs font-bold rounded-lg transition ${
                          discountType === 'fixed'
                            ? 'bg-emerald-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        نەختینە (د.ع)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      بڕی داشکان ({discountType === 'percentage' ? '%' : 'IQD'}):
                    </label>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold rounded-xl p-2.5 text-sm focus:outline-none focus:border-emerald-500 text-center"
                    />
                  </div>
                </div>

                {/* Quick % buttons */}
                {discountType === 'percentage' && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-slate-400">هەڵبژاردنی خێرای ڕێژەی داشکان:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[10, 15, 20, 25, 30, 35, 40, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountValue(pct)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                            discountValue === pct
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Promo Code & Validity */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">کۆدی دیاری (Promo Code):</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-amber-300 font-mono font-bold rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">ماوەی بەکارهێنان:</label>
                    <select
                      value={offerValidDays}
                      onChange={(e) => setOfferValidDays(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value={7}>٧ ڕۆژ (١ هەفتە)</option>
                      <option value={10}>١٠ ڕۆژ (پێشنیازکراو)</option>
                      <option value={14}>١٤ ڕۆژ (٢ هەفتە)</option>
                      <option value={30}>٣٠ ڕۆژ (١ مانگ)</option>
                    </select>
                  </div>
                </div>

                {/* Template Editor */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">دەقی پەیامی وەتسئەپ (Kurdish Template):</label>
                    <span className="text-[10px] text-emerald-400">دەتوانیت دەستکاری بکەیت</span>
                  </div>
                  <textarea
                    rows={6}
                    value={campaignTemplateText}
                    onChange={(e) => setCampaignTemplateText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3.5 text-xs leading-relaxed focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                    <span className="text-slate-500">گۆڕاوەکان:</span>
                    <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 font-mono text-emerald-400">{'{patient_name}'}</span>
                    <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 font-mono text-amber-400">{'{discount}'}</span>
                    <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 font-mono text-cyan-400">{'{promo_code}'}</span>
                    <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 font-mono text-sky-400">{'{expiry_date}'}</span>
                    <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 font-mono text-rose-400">{'{clinic_phone}'}</span>
                  </div>
                </div>

                {/* WhatsApp Phone Live Preview Bubble */}
                <div className="p-4 bg-slate-950/90 border border-emerald-500/20 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>پێشبینینی شێوازی نامەکە لە ناو مۆبایلی نەخۆش:</span>
                    </span>
                    <span className="text-slate-500 font-mono">WhatsApp Preview</span>
                  </div>
                  <div className="bg-[#0b141a] p-3.5 rounded-xl border border-white/5 text-xs text-slate-200 leading-relaxed whitespace-pre-line shadow-inner">
                    {campaignTemplateText
                      .replace(/{patient_name}/g, inactivePatients[0]?.name || 'بەڕێز/خانم')
                      .replace(/{days}/g, String(inactivePatients[0]?.inactiveDays || 30))
                      .replace(/{discount}/g, discountType === 'percentage' ? `${discountValue}%` : `${discountValue.toLocaleString()} د.ع`)
                      .replace(/{promo_code}/g, promoCode)
                      .replace(/{expiry_date}/g, new Date(Date.now() + offerValidDays * 86400000).toISOString().split('T')[0])
                      .replace(/{clinic_phone}/g, apiCredentials.businessPhoneNumber)}
                  </div>
                </div>

                {/* Main Action Button */}
                <button
                  onClick={handleRunBulkBroadcast}
                  disabled={isBroadcasting || inactivePatients.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:brightness-110 text-slate-950 font-black rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Megaphone className="w-4 h-4 text-slate-950" />
                  <span>
                    {isBroadcasting
                      ? `لە ناردندایە... (${broadcastProgress}%)`
                      : `🚀 ناردنی گشتی بە یەک کلیک بۆ (${selectedInactiveIds.length > 0 ? selectedInactiveIds.length : inactivePatients.length}) چارەخواز`}
                  </span>
                </button>

                {isBroadcasting && (
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                        style={{ width: `${broadcastProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-emerald-400 text-center font-bold">
                      پەیامەکان بە ڕێکخراوی ڕەوانەی وەتسئەپ دەکرێن...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Target Patients List & Live Logs (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Filtered Inactive Patients List */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-black text-white">لیستی چارەخوازانی ئامانجدار ({inactivePatients.length})</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                    >
                      {selectedInactiveIds.length === inactivePatients.length ? 'لابردنی هەمووان' : 'دیاریکردنی هەمووان'}
                    </button>
                  </div>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                  <input
                    type="text"
                    placeholder="گەڕان بە ناوی چارەخواز یان ژمارە مۆبایل..."
                    value={campaignSearchQuery}
                    onChange={(e) => setCampaignSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pr-9 pl-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Patients Cards List */}
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {inactivePatients.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      هیچ چارەخوازێک لەم ماوەیەدا نەدۆزرایەوە.
                    </div>
                  ) : (
                    inactivePatients.map((pat) => {
                      const isSelected = selectedInactiveIds.includes(pat.id);
                      const filledText = buildFilledMessage(pat);
                      const cleanPhone = pat.phone.replace(/[^0-9]/g, '');
                      const formattedPhone = cleanPhone.startsWith('0') ? '964' + cleanPhone.slice(1) : cleanPhone;
                      const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(filledText)}`;
                      const isCopied = copiedPatientId === pat.id;

                      return (
                        <div
                          key={pat.id}
                          className={`p-3.5 rounded-2xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-slate-950 border-emerald-500/50 shadow'
                              : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedInactiveIds((prev) =>
                                  prev.includes(pat.id) ? prev.filter((id) => id !== pat.id) : [...prev, pat.id]
                                );
                              }}
                              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                            />

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-xs">{pat.name}</h4>
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                  {pat.periodLabel} ({pat.inactiveDays} ڕۆژ)
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{pat.phone}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleCopySingleMessage(pat)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="کۆپیکردنی دەقی ئەم پەیامە"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{isCopied ? 'کۆپیکرا ✅' : 'کۆپیکردن'}</span>
                            </button>

                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleSendSingleOffer(pat)}
                              className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
                              title="کردنەوەی چاتی ڕاستەوخۆ لە وەتسئەپ"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>ناردن لە WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Campaign Logs History */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4 shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <span>مێژووی ناردنی کۆتا کەمپینەکان</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">({campaignLogs.length}) تۆمارکراو</span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {campaignLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-300"
                    >
                      <div>
                        <span className="font-bold text-white">{log.patientName}</span>
                        <span className="text-slate-500 mx-2">•</span>
                        <span className="text-emerald-400 font-bold">{log.discountStr}</span>
                        <span className="text-slate-500 mx-2">•</span>
                        <span className="text-amber-300 font-mono text-[10px]">{log.promoCode}</span>
                      </div>
                      <span className="text-[10px] bg-slate-800 px-2.5 py-1 rounded-lg text-slate-400 font-mono">
                        {log.sentTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TODAY DISPATCH */}
      {activeTab === 'today_tv_dispatch' && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-md space-y-6">
          <TodayAppointmentsDispatchBoard
            appointments={appointments}
            onUpdateAppointmentStatus={onUpdateAppointmentStatus || (() => {})}
            onOpenTvMode={onOpenTvMode}
          />
        </div>
      )}

      {/* TAB 4: CONFIG & BOT */}
      {activeTab === 'config' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* API Credentials Box */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4 shadow-md">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">دۆخی گرێدانی وەتسئەپ (Meta WhatsApp API)</h3>
                <p className="text-xs text-slate-400 mt-0.5">پەیوەستکردنی ژمارەی کلینیک بە بەشەکانی ئۆتۆماتیکی</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-400">ژمارەی پەیوەستکراوی کلینیک:</span>
                <p className="text-sm font-bold text-white">{apiCredentials.businessPhoneNumber}</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="text-slate-400">دۆخی سێرڤەر:</span>
                <p className="text-sm font-bold text-emerald-400">{apiCredentials.webhookStatus}</p>
              </div>
            </div>
          </div>

          {/* Automation Toggles */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4 shadow-md">
            <h3 className="text-base font-black text-white pb-3 border-b border-slate-800 flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              <span>یاساکانی ناردنی پەیامی خۆکار (Automation Rules)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition">
                <div>
                  <h4 className="font-bold text-white">بیرهێنانەوەی ۲٤ کاتژمێر پێش نۆرە</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">ناردنی ئاگاداری ڕۆژێک پێش وادەی مەوعیدەکە</p>
                </div>
                <input
                  type="checkbox"
                  checked={apiCredentials.reminder24hEnabled}
                  onChange={(e) =>
                    setApiCredentials({ ...apiCredentials, reminder24hEnabled: e.target.checked })
                  }
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition">
                <div>
                  <h4 className="font-bold text-white">پەیامی خۆکاری بەخێرهاتن</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">ناردنی نامەی پیرۆزبایی کاتی کردنەوەی فایلی نوێ</p>
                </div>
                <input
                  type="checkbox"
                  checked={apiCredentials.autoWelcomeEnabled}
                  onChange={(e) =>
                    setApiCredentials({ ...apiCredentials, autoWelcomeEnabled: e.target.checked })
                  }
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Message Templates */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4 shadow-md">
            <h3 className="text-base font-black text-white pb-3 border-b border-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>دیزاین و دەقەکانی ناردن (Message Templates)</span>
            </h3>

            <div className="space-y-4">
              {templates.map((tpl) => (
                <div key={tpl.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400">{tpl.name}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{tpl.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
