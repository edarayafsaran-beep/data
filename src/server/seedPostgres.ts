import { batchUpsert, getAll } from './db';
import {
  initialBranches,
  initialUsers,
  initialPatients,
  initialTreatments,
  initialAppointments,
  initialExpenses,
  initialWhatsappLogs,
  initialCampaigns,
  initialInventory,
  initialPackages,
  initialComplaints,
  initialRooms,
  initialLabTests,
  initialPrescriptions,
  initialSystemAuditLogs,
  initialPayrollRecords,
  initialCashBoxes,
  initialBankAccounts,
  initialFixedAssets,
  initialFinancialAuditLogs,
  initialEmployeeBonuses,
} from '../initialData';

export async function seedPostgresIfNeeded(): Promise<{ seeded: boolean; counts: Record<string, number> }> {
  const counts: Record<string, number> = {};
  let newlySeeded = false;

  console.log("Checking PostgreSQL tables and seeding any empty collections...");

  const datasets: Array<{ name: string; items: any[] }> = [
    { name: 'branches', items: initialBranches },
    { name: 'users', items: initialUsers },
    { name: 'patients', items: initialPatients },
    { name: 'treatments', items: initialTreatments },
    { name: 'appointments', items: initialAppointments },
    { name: 'expenses', items: initialExpenses },
    { name: 'whatsappLogs', items: initialWhatsappLogs },
    { name: 'campaigns', items: initialCampaigns },
    { name: 'inventory', items: initialInventory },
    { name: 'treatmentPackages', items: initialPackages },
    { name: 'patientComplaints', items: initialComplaints },
    { name: 'rooms', items: initialRooms },
    { name: 'labTests', items: initialLabTests },
    { name: 'prescriptions', items: initialPrescriptions },
    { name: 'systemAuditLogs', items: initialSystemAuditLogs },
    { name: 'employeePayroll', items: initialPayrollRecords },
    { name: 'cashBoxes', items: initialCashBoxes },
    { name: 'bankAccounts', items: initialBankAccounts },
    { name: 'fixedAssets', items: initialFixedAssets },
    { name: 'financialAuditLogs', items: initialFinancialAuditLogs },
    { name: 'employeeBonuses', items: initialEmployeeBonuses },
  ];

/*
  for (const set of datasets) {
    try {
      const existing = await getAll(set.name, null, true);
      if (existing.length === 0 && set.items.length > 0) {
        const count = await batchUpsert(set.name, set.items);
        counts[set.name] = count;
        newlySeeded = true;
        console.log(`Seeded ${count} items into empty PostgreSQL table ${set.name}`);
      } else {
        counts[set.name] = existing.length;
      }
    } catch (e: any) {
      console.error(`Failed to verify/seed ${set.name}:`, e.message);
      counts[set.name] = 0;
    }
  }
*/

  // Ensure clean super_admin and 1 clean default branch exist if empty
  try {
    const superAdminUser = {
      id: 1,
      uid: 'super-admin-jwankary',
      username: 'jwankary',
      password: '123',
      name: 'بەڕێوەبەری سەرەکی',
      email: 'jwankary485@gmail.com',
      role: 'super_admin',
      branchId: 1,
      specialty: 'بەڕێوەبەری گشتی',
      salary: 0,
      permissions: {
        canAccessDashboard: true,
        canAccessCrmPackages: true,
        canAccessInventory: true,
        canAccessBiAnalytics: true,
        canAccessTvBoard: true,
        canAccessPatients: true,
        canAccessAppointments: true,
        canAccessFinancials: true,
        canAccessDoctors: true,
        canAccessMarketing: true,
        canAccessAdminSettings: true,
        canAccessLaboratory: true,
        canAccessEmrConsultation: true,
        canAccessAuditLogs: true,
        canEditPatients: true,
        canDeleteRecords: true,
        canApproveFinancials: true,
        canEnterPayments: true,
        canViewTotalFinancials: true,
        canAccessWhatsapp: true,
        canViewAnalytics: true,
      },
      createdAt: new Date().toISOString()
    };
    await batchUpsert('users', [superAdminUser]);

    const existingBranches = await getAll('branches', null, true);
    if (existingBranches.length === 0) {
      await batchUpsert('branches', [{
        id: 1,
        name: 'لقی سەرەکی',
        address: '',
        phone: '',
        createdAt: new Date().toISOString()
      }]);
    }
  } catch (err: any) {
    console.warn("Notice ensuring super_admin in PostgreSQL:", err.message);
  }

  return { seeded: true, counts };
}
