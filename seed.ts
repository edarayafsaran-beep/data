
import { db } from './src/lib/firebase.ts';
import { collection, doc, setDoc } from 'firebase/firestore';
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
} from './src/initialData.ts';

async function seedData() {
  console.log("Starting seeding...");
  
  const collections = [
    { name: 'branches', data: initialBranches },
    { name: 'users', data: initialUsers },
    { name: 'patients', data: initialPatients },
    { name: 'treatments', data: initialTreatments },
    { name: 'appointments', data: initialAppointments },
    { name: 'expenses', data: initialExpenses },
    { name: 'whatsappLogs', data: initialWhatsappLogs },
    { name: 'campaigns', data: initialCampaigns },
    { name: 'inventory', data: initialInventory },
    { name: 'treatmentPackages', data: initialPackages },
    { name: 'patientComplaints', data: initialComplaints },
    { name: 'rooms', data: initialRooms },
    { name: 'labTests', data: initialLabTests },
    { name: 'prescriptions', data: initialPrescriptions },
    { name: 'systemAuditLogs', data: initialSystemAuditLogs },
    { name: 'employeePayroll', data: initialPayrollRecords },
    { name: 'cashBoxes', data: initialCashBoxes },
    { name: 'bankAccounts', data: initialBankAccounts },
    { name: 'fixedAssets', data: initialFixedAssets },
    { name: 'financialAuditLogs', data: initialFinancialAuditLogs },
    { name: 'employeeBonuses', data: initialEmployeeBonuses },
  ];

  for (const coll of collections) {
    console.log(`Seeding ${coll.name}...`);
    for (const item of coll.data) {
      // Use item.id if it exists, otherwise Firestore generates one
      const id = item.id ? String(item.id) : undefined;
      if (id) {
        await setDoc(doc(db, coll.name, id), item);
      } else {
        await setDoc(doc(collection(db, coll.name)), item);
      }
    }
  }
  console.log("Seeding complete!");
}

seedData().catch(console.error);
