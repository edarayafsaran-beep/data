export type UserRole = 'super_admin' | 'doctor' | 'receptionist' | 'accountant' | 'manager';

export interface UserPermissions {
  canAccessDashboard: boolean;
  canAccessCrmPackages: boolean;
  canAccessInventory: boolean;
  canAccessBiAnalytics: boolean;
  canAccessTvBoard: boolean;
  canAccessPatients: boolean;
  canAccessAppointments: boolean;
  canAccessFinancials: boolean;
  canAccessDoctors: boolean;
  canAccessAdminSettings: boolean;
  canAccessLaboratory: boolean;
  canAccessEmrConsultation: boolean;
  canAccessAuditLogs: boolean;
  canEditPatients: boolean;
  canDeleteRecords: boolean;
  canApproveFinancials: boolean;
  canEnterPayments: boolean;
  canViewTotalFinancials: boolean;
  canAccessWhatsapp: boolean;
  canViewAnalytics: boolean;
}

export type MembershipTier = 'Bronze' | 'Silver' | 'Gold' | 'VIP';

export interface MembershipTierDetail {
  tierName: MembershipTier;
  minPointsRequired: number;
  discountRate: number;
  badgeColor: string;
}

export interface Branch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  phoneNumbers?: string[];
  createdAt: string;
}

export interface User {
  id: number;
  uid: string; // Internal system ID or Firebase UID
  username?: string; // Added for custom login
  password?: string; // Added for custom login
  name: string;
  email: string;
  role: UserRole;
  branchId?: number; // null for super_admin
  salary: number; // In IQD
  specialty?: string;
  phone?: string;
  avatar?: string;
  facePhoto?: string;
  faceEnrolledAt?: string;
  permissions?: UserPermissions;
  createdAt?: string;
}

export interface Patient {
  id: number;
  branchId: number;
  patientCode: string; // e.g., PAT-1022
  name: string;
  phone: string;
  age: number;
  gender: 'نێر' | 'مێ';
  medicalHistory: string;
  chiefComplaint: string; // هۆکاری سەردان (لەیزەر، فیلەر، بۆتۆکس، پاککردنەوەی پێست، پلازما...)
  registeredDate: string;
  customRegistrationDate?: string;
  preferredDays?: string; // e.g. 'شەممە، دووشەممە، چوارشەممە'
  totalSessionsCompleted: number;
  membershipTier?: MembershipTier;
  loyaltyPoints?: number;
  isVip?: boolean;
  satisfactionRating?: number; // 1-5
  lastFollowUpNotes?: string;
  personalDiscount?: number; // %
}

export interface PatientComplaint {
  id: number;
  branchId: number;
  patientName: string;
  patientPhone: string;
  subject: string;
  date: string;
  status: 'نوێ' | 'لە پشکنیندایە' | 'چارەسەرکراوە';
  notes: string;
}

export interface TreatmentPackage {
  id: number;
  branchId: number;
  packageName: string;
  sessionsCount: number;
  treatmentName: string;
  originalPrice: number;
  discountPrice: number;
  discountPercentage: number;
  validityDays: number;
}

export interface InventoryItem {
  id: number;
  branchId: number;
  itemName: string;
  category: 'فیلەر و بۆتۆکس' | 'کەرەستەی لەیزەر' | 'سیرۆم و سکین کێر' | 'مەوادی یەکجار بەکارهاتوو';
  currentStock: number;
  minStockAlert: number;
  unit: 'دانە' | 'کیلۆ' | 'لیتر' | 'پاکەت';
  expiryDate: string;
  supplierName: string;
  unitCost: number; // IQD
  usageMonthlyForecast: number;
  paidAmount?: number;
  remainingAmount?: number;
}

export interface ClinicWorkflowStep {
  id: number;
  stepNumber: number;
  title: string;
  description: string;
  assignedRole: string;
  estimatedMinutes: number;
  autoNotifyPatient: boolean;
}

export interface CustomFormField {
  id: number;
  fieldName: string;
  fieldType: 'دەق' | 'ژمارە' | 'هەڵبژاردن' | 'مێژوو' | 'ئیمزا';
  required: boolean;
  options?: string[];
}

export interface Room {
  id: number;
  branchId: number;
  name: string; // e.g. 'ژووری ۱', 'ژووری VIP'
  department?: string;
  doctorInCharge?: string;
  capacity?: number;
  status: 'چالاک' | 'نائامادە' | 'سیانە';
}

export interface Treatment {
  id: number;
  branchId: number;
  name: string;
  description: string;
  price: number; // IQD
  durationMinutes: number;
  iconName?: string;
  consumables?: Array<{ itemId: number; quantity: number }>;
}

export type AppointmentStatus = 'چاوەڕێ دەکات' | 'لە ژوورەوەیە' | 'تەواوبوو' | 'هەڵوەشێنرایەوە' | 'بەڕێوەیە';

export interface Appointment {
  id: number;
  branchId: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  doctorId: number;
  doctorName: string;
  treatmentId: number;
  treatmentName: string;
  treatmentPrice: number;
  appointmentDate: string; // YYYY-MM-DD
  date?: string; // Standard alias for appointmentDate
  appointmentTime: string; // HH:mm
  roomNumber: string; // ژووری ۱, ژووری ۲...
  status: AppointmentStatus;
  paidAmount: number;
  discountApplied?: number; // %
  whatsappReminder1DaySent: boolean;
  whatsappReminderSameDaySent: boolean;
  notes?: string;
  financialYear?: string;
}

export interface Expense {
  id: number;
  branchId: number;
  title: string;
  category: 'مەوادی جوانکاری و دەرزی' | 'کرێ و ئاو و بڕق' | 'سیانەی ئامێری لەیزەر' | 'مەسروفاتی ڕۆژانە' | 'تەندروستی و پاککردنەوە';
  amount: number; // IQD
  date: string;
  recordedBy: string;
  notes?: string;
  financialYear?: string;
}

export interface WhatsappLog {
  id: number;
  branchId: number;
  patientName: string;
  phone: string;
  messageType: string;
  sentAt: string;
  status: string;
  content: string;
}

export interface MarketingCampaign {
  id: number;
  title: string;
  platform: string;
  status: string;
  targetAudience?: string;
  sentCount?: number;
}

export interface ClinicStats {
  todayPatients: number;
  weekPatients: number;
  monthPatients: number;
  allTimePatients: number;
  totalRevenue: number;
  totalExpenses: number;
  totalDoctorSalaries: number;
  netProfit: number;
  monthlyBreakdown: { month: string; revenue: number; expenses: number; profit: number; patients: number }[];
  yearlyBreakdown: { year: string; revenue: number; expenses: number; profit: number; patients: number }[];
}

export interface EmployeePayrollRecord {
  id: number;
  doctorId?: number;
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
  paymentStatus: 'دراوە' | 'لە چاوەڕوانیدایە' | 'پەسەندکراو';
  paymentDate: string;
}

export interface CashBox {
  id: number;
  name: string;
  responsible: string;
  balance: number;
  lastClosingTime: string;
  status: 'کراوەتەوە' | 'داخراوە';
}

export interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  currency: string;
  balance: number;
  branch: string;
  branchName?: string;
}

export interface FixedAsset {
  id: number;
  assetName: string;
  category: string;
  purchaseDate: string;
  purchaseCost: number;
  currentValue: number;
  depreciationRateYearly: number; // percentage
  responsiblePerson: string;
  status: 'بەکاردا هاتووە' | 'پێویست بە سیانە' | 'لەکارکەوتوو';
}

export interface FinancialAuditLog {
  id: number;
  user: string;
  action: string;
  category: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  ipAddress: string;
}

export interface LabTestOrder {
  id: number;
  branchId: number;
  testCode: string; // e.g. LAB-9041
  patientName: string;
  patientPhone: string;
  doctorName: string;
  testCategory: 'شیکاری پێست و قژ' | 'پشکنینی هۆرمۆن و خوێن' | 'پشکنینی هەستیاری (Allergy)' | 'پشکنینی فۆتۆگرافی دیجیتاڵی';
  testName: string;
  orderedDate: string;
  status: 'لە چاوەڕوانیدایە' | 'تەواوبوو' | 'کەمپڵ وەرگیراوە';
  sampleType: string;
  normalRange: string;
  resultValue: string;
  technicianNotes?: string;
  price: number;
}

export interface Prescription {
  id: number;
  branchId: number;
  prescriptionCode: string; // e.g. RX-5520
  patientName: string;
  doctorName: string;
  diagnosis: string;
  icdCode?: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    instructions: string;
    dispensed: boolean;
  }[];
  digitalSignatureUrl?: string;
  voiceNoteUrl?: string;
  date: string;
  status: 'نوێ' | 'صەرفکراوە لە دەرمانخانە' | 'هەڵوەشێنراوە';
  qrCode: string;
}

export interface SystemAuditLog {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  severity: 'ئاسایی' | 'ئاگاداری' | 'مەترسیدار';
}

export interface StaffSalesRewardRecord {
  id: number;
  branchId: number;
  employeeName: string;
  itemName: string;
  itemType: 'خزمەتگوزاری / جلسە' | 'بەرهەمی جوانکاری' | 'کەمپەینی مارکێتینگ';
  priceType: 'نرخی بنەڕەتی (Standard)' | 'نرخی داشکاندن (Discount)';
  unitPrice: number;
  quantity: number;
  totalRevenue: number;
  employeeBonusRate: number;
  employeeBonusAmount: number;
  netProfit: number;
  date: string;
  notes?: string;
}

export type AttendanceStatus =
  | 'ئامادەیە (Present)'
  | 'دواکەوتووە (Late)'
  | 'لە مۆڵەتدایە (On Leave)'
  | 'غائیبە (Absent)'
  | 'چووەتە دەرەوە (Checked Out)';

export interface StaffAttendanceRecord {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  branchId: number;
  branchName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  shiftTitle: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  overtimeMinutes: number;
  verificationMethod:
    | 'کامێرای ناسینەوەی ڕووخسار (Face Recognition)'
    | 'زیهازی پەنجە مۆری بایۆمەتری (Fingerprint)'
    | 'پشکنینی ئایپی و تۆڕی لق'
    | 'پشتڕاستکردنەوەی بەڕێوەبەر'
    | 'ئۆتۆماتیکی سیستەم';
  isTamperProofVerified: boolean;
  penaltyDeductionAmount?: number;
  capturedPhotoUrl?: string;
  userAvatar?: string;
  notes?: string;
}

export interface StaffLeaveRequest {
  id: number;
  userId: number;
  userName: string;
  branchId: number;
  branchName: string;
  leaveType: 'مۆڵەتی ئاسایی (Annual)' | 'مۆڵەتی نەخۆشی (Sick)' | 'مۆڵەتی بەپەلە (Emergency)' | 'مۆڵەتی بێ موچە (Unpaid)';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'پەسەندکراو (Approved)' | 'لە چاوەڕوانیدایە (Pending)' | 'ڕەتکراوەتەوە (Rejected)';
  appliedAt: string;
  approvedBy?: string;
  deductFromSalary: boolean;
  notes?: string;
}

export interface WorkShiftConfig {
  id: number;
  title: string;
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "17:00"
  gracePeriodMinutes: number; // e.g. 15 minutes before marking late
  penaltyPerLateMinute: number; // e.g. 1000 IQD per minute late
  branchId?: number;
}


