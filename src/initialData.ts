import {
  Branch,
  User,
  Patient,
  Treatment,
  Room,
  Appointment,
  Expense,
  WhatsappLog,
  TreatmentPackage,
  InventoryItem,
  PatientComplaint,
  ClinicWorkflowStep,
  CustomFormField,
  MembershipTierDetail,
  EmployeePayrollRecord,
  CashBox,
  BankAccount,
  FixedAsset,
  FinancialAuditLog,
  MarketingCampaign,
} from './types';
import { getDefaultPermissionsForRole } from './utils/permissions';

export const initialBranches: Branch[] = [
  {
    id: 1,
    name: "لقی سەرەکی",
    address: "",
    phone: "",
    createdAt: new Date().toISOString(),
  },
];

export const initialUsers: User[] = [
  {
    id: 1,
    uid: "super-admin-jwankary",
    username: "jwankary",
    password: "123",
    name: "بەڕێوەبەری سەرەکی",
    email: "jwankary485@gmail.com",
    role: "super_admin",
    branchId: 1,
    salary: 0,
    specialty: "بەڕێوەبەری گشتی",
    phone: "",
    permissions: getDefaultPermissionsForRole('super_admin'),
  },
];

export const initialPackages: TreatmentPackage[] = [];

export const initialInventory: InventoryItem[] = [];

export const initialComplaints: PatientComplaint[] = [];

export const initialWorkflowSteps: ClinicWorkflowStep[] = [];

export const initialCustomFields: CustomFormField[] = [];

export const initialTreatments: Treatment[] = [];

export const initialPatients: Patient[] = [];

export const initialAppointments: Appointment[] = [];

export const initialExpenses: Expense[] = [];

export const initialWhatsappLogs: WhatsappLog[] = [];

export const initialCampaigns: MarketingCampaign[] = [];

export const initialTiers: MembershipTierDetail[] = [
  { tierName: "Bronze", minPointsRequired: 0, discountRate: 5, badgeColor: "bg-amber-700/30 text-amber-300" },
  { tierName: "Silver", minPointsRequired: 150, discountRate: 10, badgeColor: "bg-slate-500/30 text-slate-200" },
  { tierName: "Gold", minPointsRequired: 300, discountRate: 15, badgeColor: "bg-amber-500/30 text-amber-200 font-bold" },
  { tierName: "VIP", minPointsRequired: 600, discountRate: 25, badgeColor: "bg-fuchsia-500/30 text-fuchsia-200 font-black border border-fuchsia-500/40" },
];

export const initialLabTests: any[] = [];

export const initialPrescriptions: any[] = [];

export const initialSystemAuditLogs: any[] = [];

export const initialRooms: Room[] = [];

export const initialPayrollRecords: EmployeePayrollRecord[] = [];

export const initialCashBoxes: CashBox[] = [
  { id: 1, name: 'سندووقی سەرەکی', responsible: 'بەڕێوەبەر', balance: 0, lastClosingTime: 'ئەمڕۆ', status: 'کراوەتەوە' },
];

export const initialBankAccounts: BankAccount[] = [];

export const initialFixedAssets: FixedAsset[] = [];

export const initialFinancialAuditLogs: FinancialAuditLog[] = [];

export const initialEmployeeBonuses: any[] = [];
