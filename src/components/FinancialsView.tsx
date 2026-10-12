import React, { useState, useEffect, useCallback } from 'react';
import {
  Expense,
  User,
  EmployeePayrollRecord,
  CashBox,
  BankAccount,
  FixedAsset,
  FinancialAuditLog,
  Branch,
  Appointment,
  Patient,
} from '../types';
import {
  STANDARD_EXPENSE_PRESETS,
  STANDARD_EXPENSE_CATEGORIES,
} from '../constants/standardPresets';
import { PrintableFinancialReportModal, ReportType } from './PrintableFinancialReportModal';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { cleanForFirestore } from '../utils/firestoreCleaner';
import { syncSave, syncDelete, syncLoad } from '../lib/dataSync';
import {
  initialPayrollRecords,
  initialCashBoxes,
  initialBankAccounts,
  initialFixedAssets,
  initialFinancialAuditLogs,
  initialEmployeeBonuses,
} from '../initialData';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  PlusCircle,
  Wallet,
  Calendar,
  PiggyBank,
  Building2,
  Users,
  Clock,
  ShieldCheck,
  Printer,
  FileText,
  AlertTriangle,
  Bot,
  Sparkles,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  CreditCard,
  CheckCircle2,
  Lock,
  Search,
  Download,
  Activity,
  Award,
  Plus,
  Edit3,
  RotateCcw,
  Zap,
  Trash2,
  X,
} from 'lucide-react';

interface FinancialsViewProps {
  expenses: Expense[];
  doctors: User[];
  totalRevenue: number;
  appointments?: Appointment[];
  patients?: Patient[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'branchId'>) => void;
  onDeleteExpense?: (id: number) => void;
  canViewTotal?: boolean;
  onNavigateTab?: (tab: string) => void;
  currentUser?: User;
  branches?: Branch[];
  activeBranchId?: number | null;
  activeFinancialYear?: string;
  financialYears?: string[];
  onSelectFinancialYear?: (year: string) => void;
  onAddFinancialYear?: (year: string) => void;
}

export const FinancialsView: React.FC<FinancialsViewProps> = ({
  expenses,
  doctors,
  totalRevenue,
  appointments = [],
  patients = [],
  onAddExpense,
  onDeleteExpense,
  canViewTotal = true,
  onNavigateTab,
  currentUser,
  branches = [],
  activeBranchId,
  activeFinancialYear = '2026',
  financialYears = ['2024', '2025', '2026', '2027'],
  onSelectFinancialYear,
  onAddFinancialYear,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'hr' | 'bonuses' | 'attendance' | 'payroll' | 'expenses' | 'cash_bank' | 'receivables' | 'assets' | 'budget_tax' | 'ai_insights' | 'audit_nocode' | 'daily_monthly_reports'
  >(() => {
    try {
      const saved = localStorage.getItem('clinic_financials_subtab');
      if (saved) return saved as any;
    } catch (e) {}
    return 'dashboard';
  });

  const handleSubTabChange = (tabId: any) => {
    setActiveSubTab(tabId);
    try {
      localStorage.setItem('clinic_financials_subtab', tabId);
    } catch (e) {}
  };

  // Cash Box Modal States (Replaces window.prompt)
  const [showAddCashBoxModal, setShowAddCashBoxModal] = useState<boolean>(false);
  const [newCashBoxName, setNewCashBoxName] = useState<string>('');
  const [newCashBoxResp, setNewCashBoxResp] = useState<string>('');
  const [newCashBoxBalance, setNewCashBoxBalance] = useState<number>(0);

  const [editingCashBox, setEditingCashBox] = useState<CashBox | null>(null);
  const [editCashBalance, setEditCashBalance] = useState<number>(0);

  // Bank Account Modal States (Replaces window.prompt)
  const [showAddBankModal, setShowAddBankModal] = useState<boolean>(false);
  const [newBankName, setNewBankName] = useState<string>('');
  const [newBankAccNum, setNewBankAccNum] = useState<string>('');
  const [newBankBalance, setNewBankBalance] = useState<number>(0);
  const [newBankCurrency, setNewBankCurrency] = useState<string>('د.ع (IQD)');
  const [newBankBranch, setNewBankBranch] = useState<string>('');

  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [editBankBalance, setEditBankBalance] = useState<number>(0);

  // Fixed Asset Modal States (Replaces window.prompt)
  const [showAddAssetModal, setShowAddAssetModal] = useState<boolean>(false);
  const [newAssetName, setNewAssetName] = useState<string>('');
  const [newAssetCategory, setNewAssetCategory] = useState<string>('ئامێری پزیشکی');
  const [newAssetCost, setNewAssetCost] = useState<number>(0);
  const [newAssetResp, setNewAssetResp] = useState<string>('');

  // Printable Financial Report Modal State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printModalReportType, setPrintModalReportType] = useState<ReportType>('general_financial');
  const [printCustomData, setPrintCustomData] = useState<any>(undefined);

  const handleOpenPrintModal = (type: ReportType = 'general_financial', custom?: any) => {
    setPrintModalReportType(type);
    setPrintCustomData(custom);
    setShowPrintModal(true);
  };

  // Add Expense Form State
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('مەوادی جوانکاری و دەرزی');
  const [amount, setAmount] = useState<number>(50000);
  const [notes, setNotes] = useState('');

  // 1. Employee Bonuses & Marketing Rewards State (Persisted in Firestore & LocalStorage)
  const [employeeBonuses, setEmployeeBonuses] = useState<Array<{
    id: number;
    employeeName: string;
    branchId: number;
    amount: number;
    reason: string;
    date: string;
    notes?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('donia_employee_bonuses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading bonuses from localStorage', e);
    }
    return initialEmployeeBonuses;
  });

  // Sync bonuses with PostgreSQL (authoritative) and Firestore
  useEffect(() => {
    syncLoad('employeeBonuses', activeBranchId, initialEmployeeBonuses).then(cloudBonuses => {
      if (cloudBonuses && cloudBonuses.length > 0) setEmployeeBonuses(cloudBonuses);
    });

    const unsub = onSnapshot(collection(db, 'employeeBonuses'), (snap) => {
      if (!snap.empty) {
        const cloudBonuses = snap.docs.map(d => ({ ...d.data(), id: Number(d.id) || d.data().id } as any));
        setEmployeeBonuses(cloudBonuses);
        try {
          localStorage.setItem('donia_employee_bonuses', JSON.stringify(cloudBonuses));
        } catch (e) {}
      }
    }, () => {});
    return () => unsub();
  }, [activeBranchId]);

  const [showAddBonusModal, setShowAddBonusModal] = useState(false);
  const [bonusEmpName, setBonusEmpName] = useState(currentUser?.name || '');
  const [bonusAmount, setBonusAmount] = useState<number>(100000);
  const [bonusReason, setBonusReason] = useState('مارکێتینگ و پڕۆمۆشن');
  const [bonusNotes, setBonusNotes] = useState('');

  const handleAddBonusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusEmpName || !bonusAmount) return;

    const newBonus = {
      id: Date.now(),
      employeeName: bonusEmpName,
      branchId: activeBranchId || 1,
      amount: Number(bonusAmount),
      reason: bonusReason,
      date: new Date().toISOString().split('T')[0],
      notes: bonusNotes
    };

    setEmployeeBonuses(prev => {
      const updated = [newBonus, ...prev];
      try {
        localStorage.setItem('donia_employee_bonuses', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    await syncSave('employeeBonuses', newBonus);

    // Reflect bonus in pending payroll record
    setPayrollList(prev => {
      const updated = prev.map(p => {
        if (p.employeeName.trim().toLowerCase() === bonusEmpName.trim().toLowerCase() && p.paymentStatus !== 'دراوە') {
          const newBonusVal = (p.bonus || 0) + Number(bonusAmount);
          const newNet = p.basicSalary + newBonusVal + (p.allowances || 0) - (p.penalties || 0) - (p.taxDeduction || 0) - (p.loanDeduction || 0);
          const updatedRec = { ...p, bonus: newBonusVal, netSalary: newNet };
          syncSave('employeePayroll', updatedRec).catch(console.error);
          return updatedRec;
        }
        return p;
      });
      try {
        localStorage.setItem('donia_payroll_list', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Automatically record as an expense so it counts in General Financials & Daily Closing!
    onAddExpense({
      title: `پاداشت و پرێمی کارمەند: ${bonusEmpName} (${bonusReason})`,
      category: 'مەسروفاتی ڕۆژانە',
      amount: Number(bonusAmount),
      date: new Date().toISOString().split('T')[0],
      recordedBy: currentUser?.name || 'سوپەر ئەدمین',
      notes: bonusNotes ? `${bonusReason} - ${bonusNotes}` : bonusReason
    });

    setBonusNotes('');
    setShowAddBonusModal(false);
  };

  const handleDeleteBonus = async (bonusId: number) => {
    setEmployeeBonuses(prev => {
      const updated = prev.filter(item => item.id !== bonusId);
      try {
        localStorage.setItem('donia_employee_bonuses', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'employeeBonuses', String(bonusId)));
    } catch (e) {}
  };

  // 2. Payroll state & Slip Modal (Persisted in Firestore & LocalStorage)
  const [selectedSlip, setSelectedSlip] = useState<EmployeePayrollRecord | null>(null);
  const [paymentConfirmationModal, setPaymentConfirmationModal] = useState<EmployeePayrollRecord | null>(null);
  const [finDrillDown, setFinDrillDown] = useState<
    | 'revenue'
    | 'discounts'
    | 'expenses'
    | 'net_profit'
    | 'today_patients'
    | 'today_revenue'
    | 'today_expenses'
    | 'today_net'
    | 'month_revenue'
    | 'month_salaries'
    | 'month_expenses'
    | 'month_net'
    | 'cashbox_balance'
    | 'bank_balance'
    | null
  >(null);
  const [drillDownSearch, setDrillDownSearch] = useState<string>('');
  const isSuperAdmin = currentUser?.role === 'super_admin';

  // 3. Cash Boxes State (Persisted in Firestore & LocalStorage)
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>(() => {
    try {
      const saved = localStorage.getItem('donia_cash_boxes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialCashBoxes;
  });

  useEffect(() => {
    syncLoad<CashBox>('cashBoxes', null, initialCashBoxes).then(cloudBoxes => {
      if (cloudBoxes && cloudBoxes.length > 0) setCashBoxes(cloudBoxes);
    });

    const unsub = onSnapshot(collection(db, 'cashBoxes'), (snap) => {
      if (!snap.empty) {
        const cloudBoxes = snap.docs.map(d => ({ ...d.data(), id: Number(d.id) || d.data().id } as CashBox));
        setCashBoxes(cloudBoxes);
        try {
          localStorage.setItem('donia_cash_boxes', JSON.stringify(cloudBoxes));
        } catch (e) {}
      }
    }, () => {});
    return () => unsub();
  }, []);

  // 4. Bank Accounts State (Persisted in PostgreSQL & LocalStorage)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('donia_bank_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialBankAccounts;
  });

  useEffect(() => {
    syncLoad<BankAccount>('bankAccounts', null, initialBankAccounts).then(cloudBanks => {
      if (cloudBanks && cloudBanks.length > 0) setBankAccounts(cloudBanks);
    });

    const unsub = onSnapshot(collection(db, 'bankAccounts'), (snap) => {
      if (!snap.empty) {
        const cloudBanks = snap.docs.map(d => ({ ...d.data(), id: Number(d.id) || d.data().id } as BankAccount));
        setBankAccounts(cloudBanks);
        try {
          localStorage.setItem('donia_bank_accounts', JSON.stringify(cloudBanks));
        } catch (e) {}
      }
    }, () => {});
    return () => unsub();
  }, []);

  // 5. Fixed Assets State (Persisted in PostgreSQL & LocalStorage)
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>(() => {
    try {
      const saved = localStorage.getItem('donia_fixed_assets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialFixedAssets;
  });

  useEffect(() => {
    syncLoad<FixedAsset>('fixedAssets', null, initialFixedAssets).then(cloudAssets => {
      if (cloudAssets && cloudAssets.length > 0) setFixedAssets(cloudAssets);
    });

    const unsub = onSnapshot(collection(db, 'fixedAssets'), (snap) => {
      if (!snap.empty) {
        const cloudAssets = snap.docs.map(d => ({ ...d.data(), id: Number(d.id) || d.data().id } as FixedAsset));
        setFixedAssets(cloudAssets);
        try {
          localStorage.setItem('donia_fixed_assets', JSON.stringify(cloudAssets));
        } catch (e) {}
      }
    }, () => {});
    return () => unsub();
  }, []);

  // 6. Audit Logs State (Persisted in PostgreSQL & LocalStorage)
  const [auditLogs, setAuditLogs] = useState<FinancialAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('donia_audit_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialFinancialAuditLogs;
  });

  useEffect(() => {
    syncLoad<FinancialAuditLog>('financialAuditLogs', null, initialFinancialAuditLogs).then(cloudLogs => {
      if (cloudLogs && cloudLogs.length > 0) setAuditLogs(cloudLogs);
    });

    const unsub = onSnapshot(collection(db, 'financialAuditLogs'), (snap) => {
      if (!snap.empty) {
        const cloudLogs = snap.docs.map(d => ({ ...d.data(), id: Number(d.id) || d.data().id } as FinancialAuditLog));
        setAuditLogs(cloudLogs);
        try {
          localStorage.setItem('donia_audit_logs', JSON.stringify(cloudLogs));
        } catch (e) {}
      }
    }, () => {});
    return () => unsub();
  }, []);

  // 7. Payroll Records State (Persisted in PostgreSQL & LocalStorage)
  const [payrollList, setPayrollList] = useState<EmployeePayrollRecord[]>(() => {
    try {
      const saved = localStorage.getItem('donia_payroll_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: EmployeePayrollRecord) => {
            if (p.paymentStatus === 'دراوە') {
              return {
                ...p,
                bonus: 0,
                allowances: 0,
                penalties: 0,
                taxDeduction: 0,
                loanDeduction: 0,
                overtimeHours: 0,
                overtimeRatePerHour: 0,
                netSalary: p.basicSalary
              };
            }
            return p;
          });
        }
      }
    } catch (e) {
      console.warn('Error reading payroll from localStorage', e);
    }
    return initialPayrollRecords;
  });

  // Sync payroll with PostgreSQL & Firestore
  useEffect(() => {
    syncLoad<EmployeePayrollRecord>('employeePayroll', null, initialPayrollRecords).then(cloudRecords => {
      if (cloudRecords && cloudRecords.length > 0) setPayrollList(cloudRecords);
    });

    const unsub = onSnapshot(collection(db, 'employeePayroll'), (snap) => {
      if (!snap.empty) {
        const cloudRecords = snap.docs.map(d => ({ ...d.data(), id: Number(d.id) || d.data().id } as EmployeePayrollRecord));
        setPayrollList(cloudRecords);
        try {
          localStorage.setItem('donia_payroll_list', JSON.stringify(cloudRecords));
        } catch (e) {}
      }
    }, () => {});
    return () => unsub();
  }, []);

  // Centralized Salary Payment: Updates Payroll status, creates Expense, deducts Cashbox, clears Bonuses, logs Audit
  const handlePaySalary = async (record: EmployeePayrollRecord) => {
    const today = new Date().toISOString().split('T')[0];
    const amountToPay = Number(record.netSalary || record.basicSalary);
    const updatedRecord: EmployeePayrollRecord = {
      ...record,
      paymentStatus: 'دراوە',
      paymentDate: today,
      bonus: 0,
      allowances: 0,
      penalties: 0,
      taxDeduction: 0,
      loanDeduction: 0,
      overtimeHours: 0,
      overtimeRatePerHour: 0,
      netSalary: record.basicSalary,
    };

    // 1. Update Payroll state and localStorage immediately
    setPayrollList(prev => {
      const updated = prev.map(p => p.id === record.id ? updatedRecord : p);
      try {
        localStorage.setItem('donia_payroll_list', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Persist to PostgreSQL employeePayroll
    await syncSave('employeePayroll', updatedRecord);

    // 3. Automatically record Expense into PostgreSQL expenses collection
    onAddExpense({
      title: `دانی موچەی مانگانە: ${record.employeeName} (${record.position})`,
      category: 'مەسروفاتی ڕۆژانە',
      amount: amountToPay,
      date: today,
      financialYear: selectedYear || activeFinancialYear || '2026',
      recordedBy: currentUser?.name || 'سوپەر ئەدمین',
      notes: `موچەی مانگانەی کارمەند بە سەرکەوتوویی درا. دۆخی دارایی نوێکرایەوە.`
    });

    // 4. Deduct from primary Cash Box balance in PostgreSQL & state
    setCashBoxes(prev => {
      if (prev.length === 0) return prev;
      const updatedBoxes = [...prev];
      const mainBox = { ...updatedBoxes[0] };
      mainBox.balance = Math.max(0, mainBox.balance - amountToPay);
      mainBox.lastClosingTime = `ئەمڕۆ ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      updatedBoxes[0] = mainBox;
      try {
        localStorage.setItem('donia_cash_boxes', JSON.stringify(updatedBoxes));
      } catch (e) {}
      syncSave('cashBoxes', mainBox).catch(console.error);
      return updatedBoxes;
    });

    // 5. Clear employee bonuses in state, localStorage, and PostgreSQL
    setEmployeeBonuses(prev => {
      const updated = prev.filter(b => b.employeeName.trim().toLowerCase() !== record.employeeName.trim().toLowerCase());
      try {
        localStorage.setItem('donia_employee_bonuses', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    employeeBonuses
      .filter(b => b.employeeName.trim().toLowerCase() === record.employeeName.trim().toLowerCase())
      .forEach(b => {
        syncDelete('employeeBonuses', b.id).catch(console.error);
      });

    // 6. Record Financial Audit Log
    const newAuditLog: FinancialAuditLog = {
      id: Date.now(),
      user: currentUser?.name || 'سوپەر ئەدمین',
      action: `دانی موچەی ${record.employeeName}`,
      category: 'Payroll',
      oldValue: 'پەسەندکراو / لە چاوەڕوانی',
      newValue: `دراوە (${amountToPay.toLocaleString()} د.ع)`,
      timestamp: new Date().toLocaleString('en-US'),
      ipAddress: '192.168.1.15',
    };
    setAuditLogs(prev => {
      const updated = [newAuditLog, ...prev];
      try {
        localStorage.setItem('donia_audit_logs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    await syncSave('financialAuditLogs', newAuditLog);

    setPaymentConfirmationModal(null);
  };

  // Initial HR Employees mapped strictly from real registered clinic doctors & staff
  const [employees, setEmployees] = useState<any[]>(() => {
    return (doctors || []).map((doc) => ({
      id: doc.id,
      name: doc.name,
      dept: doc.specialty || (doc.role === 'doctor' ? 'بەشی پزیشکی و جوانکاری' : 'بەشی کارگێڕی'),
      pos: doc.role === 'doctor' ? 'پزیشکی پسپۆڕ' : doc.role === 'receptionist' ? 'پێشوازی' : doc.role === 'accountant' ? 'ژمێریار' : 'کارمەند',
      salary: Number(doc.salary) || 0,
      phone: doc.phone || '',
      status: 'چالاک',
      hireDate: doc.createdAt ? doc.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
    }));
  });

  // Keep employees list synchronized with doctors & all registered staff
  useEffect(() => {
    if (!doctors || doctors.length === 0) return;
    setEmployees(prev => {
      let changed = false;
      const updated = [...prev];
      doctors.forEach(doc => {
        const found = updated.find(e => e.name.trim() === doc.name.trim() || e.id === doc.id);
        if (!found) {
          changed = true;
          updated.push({
            id: doc.id || 200 + Math.floor(Math.random() * 800),
            name: doc.name,
            dept: doc.specialty || (doc.role === 'doctor' ? 'بەشی پزیشکی و جوانکاری' : 'بەشی گشتی سەنتەر'),
            pos: doc.role === 'doctor' ? 'پزیشکی پسپۆڕ' : doc.role === 'receptionist' ? 'پێشوازی' : doc.role === 'accountant' ? 'حیسابات' : 'شارەزا',
            salary: Number(doc.salary) || 0,
            phone: doc.phone || '',
            status: 'چالاک',
            hireDate: doc.createdAt ? doc.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          });
        }
      });
      return changed ? updated : prev;
    });
  }, [doctors]);

  // Synchronize doctors into payrollList automatically without resetting paid records
  useEffect(() => {
    if (!doctors || doctors.length === 0) return;
    setPayrollList(prev => {
      let changed = false;
      const updatedList = [...prev];
      doctors.forEach(docItem => {
        // Skip super_admin users with 0 or missing salary so they don't collide with staff payroll
        if (docItem.role === 'super_admin' && (!docItem.salary || docItem.salary === 0)) return;

        const cleanDocName = docItem.name.trim().toLowerCase();
        const cleanNoTitle = cleanDocName.replace(/^د\.\s*/, '');
        const foundIndex = updatedList.findIndex(p => {
          if (p.doctorId && p.doctorId === docItem.id) return true;
          if (p.id === docItem.id && (p.employeeName.trim().toLowerCase().includes(cleanNoTitle) || cleanDocName.includes(p.employeeName.trim().toLowerCase()))) return true;
          const pClean = p.employeeName.trim().toLowerCase();
          const pCleanNoTitle = pClean.replace(/^د\.\s*/, '');
          return pClean === cleanDocName || pCleanNoTitle === cleanNoTitle || (cleanNoTitle.length > 3 && pCleanNoTitle.includes(cleanNoTitle));
        });

        if (foundIndex === -1) {
          changed = true;
          let safePayrollId = docItem.id || Date.now() + Math.floor(Math.random() * 1000);
          if (updatedList.some(r => r.id === safePayrollId)) {
            safePayrollId = Date.now() + Math.floor(Math.random() * 10000);
          }
          const newRec: EmployeePayrollRecord = {
            id: safePayrollId,
            doctorId: docItem.id,
            employeeName: docItem.name,
            department: docItem.specialty || (docItem.role === 'doctor' ? 'بەشی پزیشکی و جوانکاری' : 'بەشی گشتی سەنتەر'),
            position: docItem.role === 'doctor' ? 'پزیشکی پسپۆڕ' : 'کارمەندی سەنتەر',
            basicSalary: Number(docItem.salary) || 0,
            overtimeHours: 0,
            overtimeRatePerHour: 0,
            bonus: 0,
            allowances: 0,
            taxDeduction: 0,
            penalties: 0,
            loanDeduction: 0,
            netSalary: Number(docItem.salary) || 0,
            paymentStatus: 'لە چاوەڕوانیدایە',
            paymentDate: '',
          };
          updatedList.push(newRec);
          setDoc(doc(db, 'employeePayroll', String(newRec.id)), cleanForFirestore(newRec)).catch(console.error);
        } else {
          // Doctor already exists in payroll - never override paymentStatus!
          const currentRec = updatedList[foundIndex];
          if (!currentRec.doctorId && docItem.id) {
            currentRec.doctorId = docItem.id;
          }
          if (docItem.salary && docItem.salary !== currentRec.basicSalary && currentRec.paymentStatus !== 'دراوە') {
            changed = true;
            const updatedRec = {
              ...currentRec,
              basicSalary: docItem.salary,
              netSalary: docItem.salary + (currentRec.bonus || 0) + (currentRec.allowances || 0) - (currentRec.penalties || 0) - (currentRec.taxDeduction || 0) - (currentRec.loanDeduction || 0),
            };
            updatedList[foundIndex] = updatedRec;
            setDoc(doc(db, 'employeePayroll', String(updatedRec.id)), cleanForFirestore(updatedRec)).catch(console.error);
          }
        }
      });
      if (changed) {
        try {
          localStorage.setItem('donia_payroll_list', JSON.stringify(updatedList));
        } catch (e) {}
        return updatedList;
      }
      return prev;
    });
  }, [doctors]);

  // Financial Calculations
  const totalExpenseAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPayrollCost = payrollList.reduce((acc, curr) => acc + curr.netSalary, 0);
  const totalCashBalance = cashBoxes.reduce((acc, curr) => acc + curr.balance, 0);
  const totalBankIQD = bankAccounts.filter((b) => b.currency.includes('IQD')).reduce((acc, curr) => acc + curr.balance, 0);

  // Year separation state synchronized with props
  const [selectedYear, setSelectedYear] = useState<string>(activeFinancialYear || '2026');
  useEffect(() => {
    if (activeFinancialYear) setSelectedYear(activeFinancialYear);
  }, [activeFinancialYear]);

  const [availableYears, setAvailableYears] = useState<string[]>(financialYears || ['2027', '2026', '2025', '2024']);
  useEffect(() => {
    if (financialYears && financialYears.length > 0) setAvailableYears(financialYears);
  }, [financialYears]);

  const [showNewYearModal, setShowNewYearModal] = useState<boolean>(false);
  const [newYearInput, setNewYearInput] = useState<string>('');

  const handleCreateNewFinancialYearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearInput || !newYearInput.trim()) return;
    const trimmed = newYearInput.trim();
    if (availableYears.includes(trimmed)) {
      alert('ئەم ساڵە پێشتر بوونی هەیە!');
      return;
    }
    const updated = [trimmed, ...availableYears];
    setAvailableYears(updated);
    setSelectedYear(trimmed);
    if (onAddFinancialYear) onAddFinancialYear(trimmed);
    if (onSelectFinancialYear) onSelectFinancialYear(trimmed);
    try {
      localStorage.setItem('donia_financial_years', JSON.stringify(updated));
      localStorage.setItem('donia_active_financial_year', trimmed);
    } catch (e) {}
    setNewYearInput('');
    setShowNewYearModal(false);
    alert(`✅ ساڵی مالی ${trimmed} بە سەرکەوتوویی دروستکرا و وەک ساڵی کارا دیاریکرا.`);
  };

  // 100% Real-time dataset based on selectedYear strictly from actual database records
  const activeYearApps = (appointments || []).filter((a) => {
    const d = a.date || (a as any).appointmentDate;
    if (!d) return false;
    return d.startsWith(selectedYear);
  });
  const finalYearApps = activeYearApps.length > 0
    ? activeYearApps
    : (selectedYear === (activeFinancialYear || '2026') ? (appointments || []) : []);

  const yearTotalRevenue = finalYearApps
    .filter((a) => a.status === 'تەواوبوو' || a.status === 'لە ژوورەوەیە' || a.status === 'چاوەڕێ دەکات')
    .reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);

  const yearTotalDiscounts = finalYearApps.reduce((acc, curr) => {
    const orig = Number(curr.treatmentPrice) || Number(curr.paidAmount) || 0;
    const pct = Number(curr.discountApplied) || 0;
    return acc + Math.round((orig * pct) / 100);
  }, 0);
  const yearTotalOffers = 0;

  const activeYearExpenses = (expenses || []).filter((e) => {
    if (!e.date) return false;
    return e.date.startsWith(selectedYear);
  });
  const finalYearExpenses = activeYearExpenses.length > 0
    ? activeYearExpenses
    : (selectedYear === (activeFinancialYear || '2026') ? (expenses || []) : []);

  const yearTotalExpenses = finalYearExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const yearTotalPayroll = payrollList.filter(p => p.paymentStatus === 'دراوە').reduce((acc, curr) => acc + curr.netSalary, 0);

  const yearNetProfit = yearTotalRevenue - yearTotalDiscounts - yearTotalExpenses - yearTotalPayroll;

  // Real Periods breakdown
  const todayStr = new Date().toISOString().split('T')[0];
  const todayApps = (appointments || []).filter((a) => a.date === todayStr || (a as any).appointmentDate === todayStr);
  const todayRevenue = todayApps
    .filter((a) => a.status === 'تەواوبوو' || a.status === 'لە ژوورەوەیە' || a.status === 'چاوەڕێ دەکات')
    .reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);
  const todayExpenses = (expenses || []).filter((e) => e.date === todayStr);
  const todayExpenseAmount = todayExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const todayNetProfit = todayRevenue - todayExpenseAmount;

  const curMonthKey = todayStr.substring(0, 7);
  const monthApps = (appointments || []).filter((a) => {
    const d = a.date || (a as any).appointmentDate;
    return d && d.startsWith(curMonthKey);
  });
  const monthRevenue = monthApps
    .filter((a) => a.status === 'تەواوبوو' || a.status === 'لە ژوورەوەیە' || a.status === 'چاوەڕێ دەکات')
    .reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);
  const monthExpenses = (expenses || []).filter((e) => e.date && e.date.startsWith(curMonthKey));
  const monthExpenseAmount = monthExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const monthPayrollAmount = payrollList.filter(p => p.paymentStatus === 'دراوە').reduce((acc, curr) => acc + curr.netSalary, 0);
  const monthNetProfit = monthRevenue - monthExpenseAmount - monthPayrollAmount;

  const dailyProfit = todayNetProfit;
  const weeklyProfit = Math.round(yearNetProfit / 52);
  const monthlyProfit = monthNetProfit;
  const semiAnnualProfit = Math.round(yearNetProfit / 2);
  const fullYearProfit = yearNetProfit;

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    onAddExpense({
      title,
      category,
      amount: Number(amount),
      date: new Date().toISOString().split('T')[0],
      recordedBy: currentUser?.name || 'سوپەر ئەدمین',
      notes,
    });

    // Add Audit Log and persist to Firestore & localStorage
    const newAudit: FinancialAuditLog = {
      id: Date.now(),
      user: currentUser?.name || 'سوپەر ئەدمین',
      action: `تۆمارکردنی مەسروفاتی ${title}`,
      category: 'Expenses',
      oldValue: '0',
      newValue: `${amount.toLocaleString()} د.ع`,
      timestamp: new Date().toLocaleString('en-US'),
      ipAddress: '192.168.1.15',
    };
    setAuditLogs(prev => {
      const updated = [newAudit, ...prev];
      try {
        localStorage.setItem('donia_audit_logs', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
    try {
      await setDoc(doc(db, 'financialAuditLogs', String(newAudit.id)), cleanForFirestore(newAudit));
    } catch (err) {}

    setTitle('');
    setNotes('');
    setShowAddExpenseModal(false);
  };

  const handlePrintSalarySlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Main Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-bold rounded-full">
              Enterprise Financial ERP v5.0
            </span>
            <span className="text-xs text-slate-400 font-mono">سیستەمی سەربەخۆی دارایی، موچە، صندوق و بانک</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">بەڕێوەبردنی دارایی، موچەی کارمەندان، صندوق و بودجە</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
            حیسابکردنی ئۆتۆماتیکی موچە، فاکتۆر، صندوقی ڕۆژانە، باج، قەرزەکان، سەرمایەی جێگیر (Assets) و شیکاری زیرەکی دەستکرد.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenPrintModal('general_financial')}
            className="px-5 py-3 bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 hover:brightness-110 rounded-2xl text-xs font-black text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.3)] active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>دەرهێنانی ڕاپۆرت وەک PDF / چاپکردن</span>
          </button>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('monthly_financial_cards')}
              className="px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 rounded-2xl text-xs font-black text-slate-950 flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>پاکێجە مانگانەییەکان</span>
            </button>
          )}
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-rose-500 via-amber-500 to-teal-400 hover:brightness-110 rounded-2xl text-xs font-black text-slate-950 flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>تۆمارکردنی مەسروفات</span>
          </button>
        </div>
      </div>

      {/* STREAMLINED MODERN ERP SUB-TABS (دوگمەکانی هەڵبژاردنی بەشی دارایی) */}
      <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-950/90 rounded-2xl border-2 border-teal-500/30 backdrop-blur-2xl shadow-[0_0_20px_rgba(20,184,166,0.15)] text-xs no-scrollbar">
        {[
          { id: 'dashboard' as const, label: 'پانێڵی سەرەکی و قازانج', icon: Activity },
          { id: 'bonuses' as const, label: 'پاداشت و مارکێتینگ', icon: Award },
          { id: 'expenses' as const, label: 'مەسروفات و فاکتۆر', icon: Receipt },
          { id: 'payroll' as const, label: 'موچەی کارمەندان', icon: Wallet },
          { id: 'cash_bank' as const, label: 'صندوق و بانک', icon: Landmark },
          { id: 'daily_monthly_reports' as const, label: 'ڕاپۆرتی ڕۆژانە و مانگانە', icon: FileText },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSubTabChange(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-black transition-all duration-300 flex items-center gap-2 whitespace-nowrap cursor-pointer select-none ${
                isActive
                  ? 'bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.5),inset_0_1px_1px_rgba(255,255,255,0.5)] border border-teal-200/50 scale-[1.03]'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/5 hover:border-teal-500/30 hover:shadow-[0_0_12px_rgba(20,184,166,0.15)]'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-teal-400'}`} />
              <span>{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 shadow-[0_0_6px_#000] animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: FINANCIAL DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* YEAR SEPARATOR & STRICT ISOLATION FILTER (دوگمەکانی هەڵبژاردنی ساڵی دارایی) */}
          <div className="bg-slate-950/80 p-4.5 rounded-3xl border-2 border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_25px_rgba(20,184,166,0.12)] backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
                <Calendar className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <strong className="text-white text-xs block font-black">هەڵبژاردنی ساڵی مالی (Strict Year Separation)</strong>
                <span className="text-[10px] text-teal-300/80 font-bold">حیساباتی هەر ساڵێک بە تەواوی جیاکراوەیە و تێکەڵ ناکرێت</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowNewYearModal(true)}
                className="px-3.5 py-2.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.35)] cursor-pointer hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
              >
                <span>+ دروستکردنی ساڵی نوێ</span>
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => {
                    if (confirm(`دڵنیایت لە سڕینەوەی ساڵی دارایی ${selectedYear}؟`)) {
                      setAvailableYears(prev => prev.filter(y => y !== selectedYear));
                      setSelectedYear(availableYears.filter(y => y !== selectedYear)[0] || '2026');
                    }
                  }}
                  className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-black transition"
                >
                  سڕینەوەی ساڵ
                </button>
              )}
              {availableYears.map((yr) => {
                const isSelected = selectedYear === yr;
                return (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-300 cursor-pointer select-none flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/60 scale-105'
                        : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/10 hover:border-teal-400/40 hover:shadow-[0_0_12px_rgba(20,184,166,0.2)]'
                    }`}
                  >
                    <Calendar className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-teal-400'}`} />
                    <span>ساڵی {yr}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {!canViewTotal && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-xs text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>تێبینی: تۆ مۆڵەتی بینینی کۆی گشتی داهات و قازانجی کلینیکت نییە، بەڵام دەتوانیت مەسروفات زیاد بکەیت و مامەڵەکان بەڕێوەبەریت.</span>
            </div>
          )}

          {/* KPI Summary Grid for Selected Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setFinDrillDown('revenue')}
              className="bg-slate-900/60 p-5 rounded-3xl border border-white/10 backdrop-blur-md cursor-pointer hover:border-teal-400/60 transition-all group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>کۆی داهاتی ساڵی {selectedYear} (کلیک بۆ وردەکاری)</span>
                <TrendingUp className="w-5 h-5 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-teal-300 font-mono mt-2">
                {canViewTotal ? `${yearTotalRevenue.toLocaleString('en-US')} ` : '******* '}
                <span className="text-xs">د.ع</span>
              </div>
              <span className="text-[10px] text-teal-400 font-bold group-hover:underline">داهاتی سەربەخۆی ساڵ 🔍</span>
            </div>

            <div
              onClick={() => setFinDrillDown('discounts')}
              className="bg-slate-900/60 p-5 rounded-3xl border border-white/10 backdrop-blur-md cursor-pointer hover:border-amber-400/60 transition-all group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>داشکاندن و ئۆفەرەکان (کلیک)</span>
                <Receipt className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-xl font-black text-amber-300 font-mono mt-2">
                {canViewTotal ? `${(yearTotalDiscounts + yearTotalOffers).toLocaleString('en-US')} ` : '******* '}
                <span className="text-xs">د.ع</span>
              </div>
              <span className="text-[10px] text-amber-400 font-bold group-hover:underline">داشکاندن: {yearTotalDiscounts.toLocaleString()} 🔍</span>
            </div>

            <div
              onClick={() => setFinDrillDown('expenses')}
              className="bg-slate-900/60 p-5 rounded-3xl border border-white/10 backdrop-blur-md cursor-pointer hover:border-rose-400/60 transition-all group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>مەسروفات + موچە (کلیک)</span>
                <TrendingDown className="w-5 h-5 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-300 font-mono mt-2">
                {canViewTotal ? `${(yearTotalExpenses + yearTotalPayroll).toLocaleString('en-US')} ` : '******* '}
                <span className="text-xs">د.ع</span>
              </div>
              <span className="text-[10px] text-rose-400 font-bold group-hover:underline">مەسروفات و موچەی کارمەندان 🔍</span>
            </div>

            <div
              onClick={() => setFinDrillDown('net_profit')}
              className="bg-gradient-to-br from-cyan-950/80 to-slate-900 p-5 rounded-3xl border-2 border-cyan-500/40 backdrop-blur-md shadow-md cursor-pointer hover:border-cyan-400 transition-all group"
            >
              <div className="flex items-center justify-between text-cyan-300 text-xs font-bold">
                <span>قازانجی پاک (ساڵی {selectedYear}) (کلیک)</span>
                <PiggyBank className="w-5 h-5 text-cyan-300" />
              </div>
              <div className="text-2xl font-black text-cyan-300 font-mono mt-2">
                {canViewTotal ? `${yearNetProfit.toLocaleString('en-US')} ` : '******* '}
                <span className="text-xs">د.ع</span>
              </div>
              <span className="text-[10px] text-cyan-300 font-bold group-hover:underline">شیکاری قازانجی پاک 🔍</span>
            </div>
          </div>

          {/* PERIODS PROFIT BREAKDOWN: DAILY, WEEKLY, MONTHLY, SEMI-ANNUAL, FULL-YEAR */}
          <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-teal-400" /> وردەکاری قازانجی پاک بۆ ماوەکان (ڕۆژانە، هەفتانە، مانگانە، نیوە ساڵ، ساڵی تەواو) - ساڵی {selectedYear}
              </h3>
              <button
                onClick={() => handleOpenPrintModal('general_financial')}
                className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow hover:brightness-110 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>چاپکردنی ڕاپۆرتی قازانج (PDF)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                <span className="text-slate-400 block font-bold">ڕۆژانە (Daily Profit)</span>
                <div className="text-lg font-black text-teal-300 font-mono">{canViewTotal ? `${dailyProfit.toLocaleString()} د.ع` : '*******'}</div>
                <span className="text-[10px] text-slate-500 block">تێکڕای قازانجی هەر ڕۆژێک</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                <span className="text-slate-400 block font-bold">هەفتانە (Weekly Profit)</span>
                <div className="text-lg font-black text-cyan-300 font-mono">{canViewTotal ? `${weeklyProfit.toLocaleString()} د.ع` : '*******'}</div>
                <span className="text-[10px] text-slate-500 block">تێکڕای قازانجی هەر هەفتەیەک</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                <span className="text-slate-400 block font-bold">مانگانە (Monthly Profit)</span>
                <div className="text-lg font-black text-emerald-300 font-mono">{canViewTotal ? `${monthlyProfit.toLocaleString()} د.ع` : '*******'}</div>
                <span className="text-[10px] text-slate-500 block">تێکڕای قازانجی مانگانە</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                <span className="text-slate-400 block font-bold">نیوە ساڵ (6 Months)</span>
                <div className="text-lg font-black text-amber-300 font-mono">{canViewTotal ? `${semiAnnualProfit.toLocaleString()} د.ع` : '*******'}</div>
                <span className="text-[10px] text-slate-500 block">کۆی قازانجی ٦ مانگی یەکەم</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 space-y-2">
                <span className="text-cyan-400 block font-bold">ساڵی تەواو (Full Year)</span>
                <div className="text-lg font-black text-cyan-200 font-mono">{canViewTotal ? `${fullYearProfit.toLocaleString()} د.ع` : '*******'}</div>
                <span className="text-[10px] text-cyan-400 block font-bold">کۆی خاوێنی ساڵی {selectedYear}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Box & Bank Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-4 shadow-md">
              <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Landmark className="w-5 h-5 text-teal-400" /> نەختییەی سەرجەم صندوق و بانکی ڕاستەقینە
              </h3>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <strong className="text-white block">کۆی نەختییەی صندوقەکان (Cash Balance)</strong>
                    <span className="text-[10px] text-slate-400">صندوقی سەرەکی + پێشوازی + دەرمانسازی</span>
                  </div>
                  <strong className="text-teal-300 font-mono text-sm">{totalCashBalance.toLocaleString()} د.ع</strong>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <strong className="text-white block">کۆی باڵانسی بانکی (Bank Balance IQD)</strong>
                    <span className="text-[10px] text-slate-400">بانکی جیهان + RT Bank</span>
                  </div>
                  <strong className="text-blue-300 font-mono text-sm">{totalBankIQD.toLocaleString()} د.ع</strong>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <strong className="text-white block">قەرزی نەخۆشەکان (Accounts Receivable)</strong>
                    <span className="text-[10px] text-slate-400">بڕی پارەی کۆنەکراوە لە نەخۆشەکان</span>
                  </div>
                  <strong className="text-amber-300 font-mono text-sm">450,000 د.ع</strong>
                </div>
              </div>
            </div>

            {/* Expenses by Category Breakdown */}
            <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-4 shadow-md">
              <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Receipt className="w-5 h-5 text-rose-400" /> دابەشبوونی مەسروفات بەپێی بەشەکان
              </h3>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-white/5 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-300">کەلوپەلی پزیشکی و مەواد</span>
                    <span className="text-rose-300 font-mono">135,000 د.ع (52%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-[52%]"></div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-white/5 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-300">کرێ، ئاو، کارەبا و مۆلیدە</span>
                    <span className="text-amber-300 font-mono">85,000 د.ع (33%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[33%]"></div>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-white/5 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-300">سیانە و مەسروفاتی ڕۆژانە</span>
                    <span className="text-teal-300 font-mono">40,000 د.ع (15%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full w-[15%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: EMPLOYEE BONUSES & MARKETING REWARDS */}
      {activeSubTab === 'bonuses' && (
        <div className="bg-slate-900/60 p-6 md:p-8 rounded-[36px] border border-amber-500/30 space-y-6 shadow-md animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
            <div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 mb-2">
                <Award className="w-3.5 h-3.5 text-amber-400" /> پرێم و پاداشتی کارمەندان و مارکێتینگ
              </span>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-400" /> تۆمارکردن و بەڕێوەبردنی پاداشتی کارمەندان (Bonuses & Marketing Rewards)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                لێرە دەتوانیت پاداشت بۆ هەر کارمەندێک لە هەر لقێک تۆمار بکەیت (بۆ مارکێتینگ، فرۆشتنی پاکێج، یان لێهاتوویی)، کە ڕاستەوخۆ لە حیساباتی گشتی و ڕۆژانە وەک مەسروفات هەژمار دەکرێت.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddBonusModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black rounded-2xl shadow-lg flex items-center gap-2 text-xs transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>پاداشتی نوێ (Add Bonus)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-4">ناوی کارمەند</th>
                  <th className="p-4">جۆر / هۆکاری پاداشت</th>
                  <th className="p-4">بڕی پاداشت (IQD)</th>
                  <th className="p-4">بەروار</th>
                  <th className="p-4">تێبینی</th>
                  <th className="p-4 text-left">کردار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {employeeBonuses.map((b) => (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <strong className="text-white block font-bold">{b.employeeName}</strong>
                      <span className="text-[10px] text-teal-300 font-mono">لق: {branches.find(br => br.id === b.branchId)?.name || 'لقەی سەرەکی'}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-[11px]">
                        {b.reason}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-black text-emerald-300 text-sm">
                      +{b.amount.toLocaleString()} د.ع
                    </td>
                    <td className="p-4 font-mono text-slate-400">{b.date}</td>
                    <td className="p-4 text-slate-300 max-w-xs truncate">{b.notes || '-'}</td>
                    <td className="p-4 text-left">
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('ئایا دڵنیایت لە سڕینەوەی ئەم پاداشتە؟')) {
                              handleDeleteBonus(b.id);
                            }
                          }}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition"
                          title="سڕینەوەی پاداشت"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD BONUS MODAL */}
      {showAddBonusModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-[32px] p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-300 rounded-2xl">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">تۆمارکردنی پاداشت و پرێمی کارمەند</h3>
                  <p className="text-xs text-slate-400">بۆ مارکێتینگ، فرۆشتنی پاکێج و دەستکەوتی نایاب</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBonusModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBonusSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">ناوی کارمەند *</label>
                <select
                  value={bonusEmpName}
                  onChange={(e) => setBonusEmpName(e.target.value)}
                  className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-white outline-none focus:border-amber-400 font-bold"
                >
                  {employees.map((emp, i) => (
                    <option key={i} value={emp.name}>{emp.name} ({emp.pos})</option>
                  ))}
                  {doctors.map((doc, i) => (
                    <option key={`doc-${i}`} value={doc.name}>{doc.name} ({doc.specialty || 'پزیشک'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">هۆکار / جۆری پاداشت *</label>
                <select
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-amber-300 outline-none focus:border-amber-400 font-bold"
                >
                  <option value="مارکێتینگ و پڕۆمۆشن">مارکێتینگ و پڕۆمۆشن (Marketing & Ads)</option>
                  <option value="فرۆشتنی پاکێج و خزمەتگوزاری">فرۆشتنی پاکێج و خزمەتگوزاری (Package Sales)</option>
                  <option value="دەستکەوتی نایاب و کارامەیی">دەستکەوتی نایاب و کارامەیی (Outstanding Performance)</option>
                  <option value="پاداشتی مانگانە / جەژن">پاداشتی مانگانە / جەژن (Monthly / Holiday Bonus)</option>
                  <option value="هیتر">هیتر (Other Bonus)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">بڕی پاداشت (بە دیناری عێراقی) *</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-emerald-400 absolute right-3.5 top-3.5" />
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    required
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(Number(e.target.value))}
                    className="w-full p-3.5 pr-10 bg-slate-950 border border-emerald-500/40 rounded-2xl text-emerald-300 font-mono font-bold outline-none focus:border-emerald-400 text-sm"
                    placeholder="100000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">تێبینی (ئەگەر هەبێت)</label>
                <textarea
                  rows={3}
                  value={bonusNotes}
                  onChange={(e) => setBonusNotes(e.target.value)}
                  placeholder="بۆ نموونە: پاداشتی سەرکەوتنی کەمپەینی تایبەت..."
                  className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-white outline-none focus:border-amber-400"
                ></textarea>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-200">
                ℹ️ ئەم پاداشتە ڕاستەوخۆ لە حیساباتی گشتی، مەسروفات و داتای ڕۆژانە و مانگانەدا وەک خەرجی هەژمار دەکرێت.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddBonusModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-xs transition"
                >
                  پەشیمانبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition shadow-lg"
                >
                  تۆمارکردنی پاداشت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: HR & EMPLOYEES */}
      {activeSubTab === 'hr' && (
        <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-6 shadow-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-400" /> لیست و دۆسیەی کارمەندان (Employee Management HR)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">بەڕێوەبردنی موچەی بنەڕەتی، ناونیشان و بەشەکانی کلینیک</p>
            </div>
            <button
              onClick={() => alert('تایبەتمەندی زیادکردنی کارمەندی نوێ بۆ دۆسیەی HR دیاری کرا.')}
              className="px-4 py-2 bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow hover:brightness-110 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> کارمەندی نوێ
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-4">کۆدی HR</th>
                  <th className="p-4">ناوی کارمەند</th>
                  <th className="p-4">بەش</th>
                  <th className="p-4">پلەی وەزیفی</th>
                  <th className="p-4">موچەی بنەڕەتی (Basic Salary)</th>
                  <th className="p-4">تەلەفۆن</th>
                  <th className="p-4">بەرواری دامەزراندن</th>
                  <th className="p-4">دۆخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-teal-300 font-bold">EMP-{emp.id}</td>
                    <td className="p-4 font-bold text-white">{emp.name}</td>
                    <td className="p-4 text-slate-300">{emp.dept}</td>
                    <td className="p-4 text-slate-400">{emp.pos}</td>
                    <td className="p-4 font-mono font-bold text-emerald-300">{emp.salary.toLocaleString()} د.ع</td>
                    <td className="p-4 text-slate-400 font-mono">{emp.phone}</td>
                    <td className="p-4 text-slate-400 font-mono">{emp.hireDate}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-500/30">
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYROLL & SALARY SLIP */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-6 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-400" /> فیۆل و حیساباتی ئۆتۆماتیکی موچەی کارمەندان (Payroll Engine)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  موچەی بنەڕەتی + کاتژمێری زیادە + پاداشت - باج - سزا - قەرز = سەرفی خاوێن
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenPrintModal('payroll')}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> چاپکردنی تەواوی موچەکان (PDF)
                </button>
                <button
                  onClick={() => alert('سەرجەم موچەکانی ئەم مانگە بە سەرکەوتوویی حیسابکران و پەسەندکران.')}
                  className="px-4 py-2 bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow hover:brightness-110 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> پەسەندکردنی سەرجەم موچەکان
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="p-4">ناوی کارمەند</th>
                    <th className="p-4">موچەی بنەڕەتی</th>
                    <th className="p-4">کاتژمێری زیادە</th>
                    <th className="p-4">پاداشت و ڕێزلێنان</th>
                    <th className="p-4">دابڕینی باج و سزا</th>
                    <th className="p-4">پوختەی سەرانە (Net Salary)</th>
                    <th className="p-4">دۆخی دران</th>
                    <th className="p-4 text-left">کردار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payrollList.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <strong className="text-white block">{p.employeeName}</strong>
                        <span className="text-[10px] text-slate-400">{p.position}</span>
                      </td>
                      <td className="p-4 font-mono text-slate-300">{p.basicSalary.toLocaleString()} د.ع</td>
                      <td className="p-4 font-mono text-teal-300">
                        {p.overtimeHours} کاتژمێر (+{(p.overtimeHours * p.overtimeRatePerHour).toLocaleString()})
                      </td>
                      <td className="p-4 font-mono text-emerald-300">
                        {(p.bonus + p.allowances) > 0 ? `+${(p.bonus + p.allowances).toLocaleString()} د.ع` : `0 د.ع`}
                      </td>
                      <td className="p-4 font-mono text-rose-300">
                        {(p.taxDeduction + p.penalties + p.loanDeduction) > 0 ? `-${(p.taxDeduction + p.penalties + p.loanDeduction).toLocaleString()} د.ع` : `0 د.ع`}
                      </td>
                      <td className="p-4 font-mono text-emerald-400 font-black text-sm">
                        {p.netSalary.toLocaleString()} د.ع
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-500/30">
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-left flex gap-2">
                        <button
                          onClick={() => handleOpenPrintModal('single_salary_slip', { singleEmployeeId: p.id })}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 text-blue-300 border border-blue-500/30 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> پسوولەی موچە / PDF
                        </button>
                        {(() => {
                          const isPaid = p.paymentStatus === 'دراوە';
                          const diffInDays = p.paymentDate ? (new Date().getTime() - new Date(p.paymentDate).getTime()) / (1000 * 3600 * 24) : Infinity;
                          const canPay = !isPaid || diffInDays >= 10;
                          
                          if (canPay) {
                            return (
                              <button
                                onClick={() => setPaymentConfirmationModal(p)}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> {isPaid ? 'دووبارە دانی موچە' : 'دانی موچە'}
                              </button>
                            );
                          } else {
                            return (
                              <button
                                disabled
                                className="px-3 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-not-allowed"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> موچەی پێدرا
                              </button>
                            );
                          }
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT CONFIRMATION MODAL */}
      {paymentConfirmationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-[32px] p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-white">دڵنیایی لە دانی موچە</h3>
            <p className="text-slate-300 text-sm">ئایا دڵنیایت کە موچەی <strong className="text-white">{paymentConfirmationModal.employeeName}</strong> بە بڕی <strong className="text-emerald-400">{paymentConfirmationModal.netSalary.toLocaleString()} د.ع</strong> ئەدەیت؟</p>
            <div className="flex gap-3">
              <button onClick={() => setPaymentConfirmationModal(null)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700">نەخێر</button>
              <button onClick={() => {
                if (paymentConfirmationModal) {
                  handlePaySalary(paymentConfirmationModal);
                }
              }} className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400">بەڵێ، دڵنیام</button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXPENSES & INVOICES */}
      {activeSubTab === 'expenses' && (
        <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-400" /> تۆماری تەواوی مەسروفات و فاکتۆرەکان
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">بەڕێوەبردنی خەرجییەکانی ڕۆژانە، کڕینی کەلوپەل و پسوولەی دابینکەران</p>
            </div>
            <button
              onClick={() => handleOpenPrintModal('expenses')}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-xs rounded-xl shadow hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> چاپکردنی تەواوی مەسروفاتەکان (PDF)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-4">ناوی مەسروفات</th>
                  <th className="p-4">جۆر (Category)</th>
                  <th className="p-4">بەروار</th>
                  <th className="p-4">تۆمارکەر</th>
                  <th className="p-4">بڕی پارە (د.ع)</th>
                  <th className="p-4 text-left">کردار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">{exp.title}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded-lg">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-mono">{exp.date}</td>
                    <td className="p-4 text-slate-400">{exp.recordedBy}</td>
                    <td className="p-4 font-mono font-black text-rose-300 text-sm">
                      -{exp.amount.toLocaleString('en-US')} د.ع
                    </td>
                    <td className="p-4 text-left flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenPrintModal('expenses', { singleExpenseId: exp.id })}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="وەسڵ / PDF"
                      >
                        <Printer className="w-3 h-3" /> وەسڵ / PDF
                      </button>
                      {onDeleteExpense && (currentUser?.role === 'super_admin' || currentUser?.permissions?.canDeleteRecords) && (
                        <button
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          title="سڕینەوەی ئەم خەرجییە لە داتابەیس"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CASH & BANKING */}
      {activeSubTab === 'cash_bank' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-300 font-bold">دەرهێنانی دۆکیومێنتی سەلماندن و باڵانسی نەختینە:</span>
            <button
              onClick={() => handleOpenPrintModal('cash_bank')}
              className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-950" /> چاپکردنی ڕاپۆرتی سندووق و بانک (PDF)
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cashboxes */}
          <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-teal-400" /> بەڕێوەبردنی صندوقەکانی نەختی (Multiple Cashboxes)
              </h3>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setNewCashBoxName('');
                    setNewCashBoxResp(currentUser?.name || 'سوپەر ئەدمین');
                    setNewCashBoxBalance(5000000);
                    setShowAddCashBoxModal(true);
                  }}
                  className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> سندووقی نوێ
                </button>
              )}
            </div>
            <div className="space-y-3">
              {cashBoxes.map((c) => (
                <div key={c.id} className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{c.name}</h4>
                    <span className="text-[10px] text-slate-400">بەرپڕس: {c.responsible} | کۆتا داخران: {c.lastClosingTime}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <strong className="text-teal-300 font-mono text-sm block">{c.balance.toLocaleString()} د.ع</strong>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${c.status === 'کراوەتەوە' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>{c.status}</span>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCashBox(c);
                            setEditCashBalance(c.balance);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-xs cursor-pointer"
                          title="گۆڕینی باڵانس"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newStatus = c.status === 'کراوەتەوە' ? 'داخراوە' : 'کراوەتەوە';
                            const updatedBoxes = cashBoxes.map(box => box.id === c.id ? { ...box, status: newStatus as any, lastClosingTime: `ئەمڕۆ ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` } : box);
                            setCashBoxes(updatedBoxes);
                            try {
                              localStorage.setItem('donia_cash_boxes', JSON.stringify(updatedBoxes));
                              setDoc(doc(db, 'cashBoxes', String(c.id)), cleanForFirestore({ ...c, status: newStatus, lastClosingTime: `ئەمڕۆ ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` })).catch(console.error);
                            } catch (e) {}
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs cursor-pointer"
                          title="داخستن / کردنەوە"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" /> هەژمارە بانکییەکان و تەحویل (Bank Accounts)
              </h3>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setNewBankName('');
                    setNewBankAccNum('IQ-90RTB-1002-111');
                    setNewBankBalance(10000000);
                    setNewBankCurrency('د.ع (IQD)');
                    setNewBankBranch('سلێمانی - شەقامی سالم');
                    setShowAddBankModal(true);
                  }}
                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> ئەژماری نوێ
                </button>
              )}
            </div>
            <div className="space-y-3">
              {bankAccounts.map((b) => (
                <div key={b.id} className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{b.bankName}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">ئەژمار: {b.accountNumber} ({b.branch})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <strong className="text-blue-300 font-mono text-sm block">
                        {b.balance.toLocaleString()} {b.currency.includes('USD') ? '$' : 'د.ع'}
                      </strong>
                      <span className="text-[10px] text-slate-400">ڕەسیدی بانک</span>
                    </div>
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBankAccount(b);
                          setEditBankBalance(b.balance);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg text-xs cursor-pointer"
                        title="دەستکاری باڵانس"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* TAB 6: RECEIVABLES & PAYABLES */}
      {activeSubTab === 'receivables' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-4 shadow-md">
            <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <CreditCard className="w-5 h-5 text-amber-400" /> قەرزی سەر نەخۆشەکان (Accounts Receivable)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 text-center text-slate-500">
                هیچ قەرزێکی تۆمارکراوی چارەخوازان لە سیستەمدا نییە.
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-4 shadow-md">
            <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <FileText className="w-5 h-5 text-rose-400" /> قەرزی سەر کلینیک بۆ دابینکەران (Accounts Payable)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 text-center text-slate-500">
                هیچ قەرزێکی تۆمارکراوی کلینیک بۆ دابینکەران و کۆمپانیاکان نییە.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: ASSETS */}
      {activeSubTab === 'assets' && (
        <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-6 shadow-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-400" /> بەڕێوەبردنی سەرمایەی جێگیر و ئامێرەکان (Fixed Assets Management)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">بەهای ئامێرە پزیشکییەکان، هەڵسەنگاندنی بەها، و دابەزینی بەهای ساڵانە (Depreciation)</p>
            </div>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  setNewAssetName('');
                  setNewAssetCategory('ئامێری پزیشکی');
                  setNewAssetCost(12000000);
                  setNewAssetResp(currentUser?.name || '');
                  setShowAddAssetModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" /> تۆمارکردنی ئامێری نوێ
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-4">ناوی ئامێر / Asset</th>
                  <th className="p-4">بەش</th>
                  <th className="p-4">بەرواری کڕین</th>
                  <th className="p-4">نرخی کڕین (Cost)</th>
                  <th className="p-4">بەهای ئێستا (Current Value)</th>
                  <th className="p-4">داخوورانی ساڵانە</th>
                  <th className="p-4">بەرپڕس</th>
                  <th className="p-4 text-left">کردار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fixedAssets.map((a) => (
                  <tr key={a.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">{a.assetName}</td>
                    <td className="p-4 text-slate-300">{a.category}</td>
                    <td className="p-4 text-slate-400 font-mono">{a.purchaseDate}</td>
                    <td className="p-4 font-mono text-slate-300">{a.purchaseCost.toLocaleString()} د.ع</td>
                    <td className="p-4 font-mono text-teal-300 font-bold">{a.currentValue.toLocaleString()} د.ع</td>
                    <td className="p-4 text-rose-300 font-mono">{a.depreciationRateYearly}% /ساڵ</td>
                    <td className="p-4 text-slate-400">{a.responsiblePerson}</td>
                    <td className="p-4 text-left">
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`ئایا دڵنیایت لە سڕینەوەی ئامێری (${a.assetName})؟`)) {
                              const updated = fixedAssets.filter(item => item.id !== a.id);
                              setFixedAssets(updated);
                              try {
                                localStorage.setItem('donia_fixed_assets', JSON.stringify(updated));
                                deleteDoc(doc(db, 'fixedAssets', String(a.id))).catch(console.error);
                              } catch (e) {}
                            }
                          }}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs"
                          title="سڕینەوە"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: BUDGET & TAX */}
      {activeSubTab === 'budget_tax' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-4 shadow-md">
            <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Calculator className="w-5 h-5 text-teal-400" /> بەڕێوەبردنی بودجە و سنوردارکردن (Budget Management)
            </h3>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">بودجەی مانگانەی کەلوپەلی پزیشکی</span>
                  <span className="text-teal-300 font-mono">135,000 / 500,000 د.ع (27%)</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-teal-400 h-full w-[27%]"></div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">بودجەی مارکێتینگ و بڵاوکردنەوە</span>
                  <span className="text-amber-300 font-mono">350,000 / 400,000 د.ع (87%)</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full w-[87%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-4 shadow-md">
            <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldCheck className="w-5 h-5 text-purple-400" /> هەژمارکاری باج و باجی داهات (Tax & VAT Center)
            </h3>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                <div>
                  <strong className="text-white block">باجی سەر داهاتی موچە (Income Tax 2.5%)</strong>
                  <span className="text-[10px] text-slate-400">تێکڕای بڕینی مانگانە لە موچەی کادران</span>
                </div>
                <strong className="text-purple-300 font-mono">100,000 د.ع</strong>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                <div>
                  <strong className="text-white block">باجی ڕسووماتی بازرگانی و تەندروستی</strong>
                  <span className="text-[10px] text-slate-400">ڕسووماتی ساڵانەی سەندیکای پزیشکی</span>
                </div>
                <strong className="text-purple-300 font-mono">250,000 د.ع</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: AI FINANCIAL INSIGHTS */}
      {activeSubTab === 'ai_insights' && (
        <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 p-6 md:p-8 rounded-[36px] border border-purple-500/30 shadow-md space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">شیکەرەوە و ئاگادارکەرەوەی زیرەکی دەستکرد (AI Financial Intelligence)</h3>
              <p className="text-xs text-purple-300/80">پێشبینی داهات، دەستنیشانکردنی مەسروفاتی گوماناوی و پێشنیاری ڕێکخستنی موچە</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/80 p-5 rounded-3xl border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                <Sparkles className="w-4 h-4" /> پوختەی شیکاری داهات و دارایی
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                داهاتی ڕاستەقینەی تۆمارکراوی ئێستای کلینیک بڕی <strong>{totalRevenue.toLocaleString()} د.ع</strong>یە و کۆی مەسروفات <strong>{totalExpenseAmount.toLocaleString()} د.ع</strong>یە.
              </p>
            </div>

            <div className="bg-slate-950/80 p-5 rounded-3xl border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" /> تێبینی لەسەر مەسروفات (Anomaly Alert)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                هیچ مەسروفاتێکی گوماناوی تۆمار نەکراوە. تێکڕای خەرجی کەلوپەلی پزیشکی لە ئاستی ئاساییدایە.
              </p>
            </div>

            <div className="bg-slate-950/80 p-5 rounded-3xl border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                <Zap className="w-4 h-4" /> پێشنیاری بەکاربهێنەری بودجە
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                دەتوانیت 10%ی بودجەی مارکێتینگ بگوازیتەوە بۆ کڕینی دەرزی فیلەر و بۆتۆکسی زیاتر بۆ بەرزکردنەوەی قازانجی ڕاستەوخۆ.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: AUDIT LOGS & NO-CODE STUDIO */}
      {activeSubTab === 'audit_nocode' && (
        <div className="space-y-6">
          {/* No-code Formula Editor */}
          <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-4 shadow-md">
            <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Edit3 className="w-5 h-5 text-teal-400" /> دیزاینەری فۆڕمۆڵا و ڕێساکانی سوپەر ئەدمین (No-Code Formula Studio)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                <label className="text-slate-300 font-bold block">فۆڕمۆڵای حیسابکردنی موچەی ئۆتۆماتیکی</label>
                <input
                  type="text"
                  readOnly
                  value="NetSalary = Basic + (Overtime * Rate) + Bonus - (Tax 2.5% + Loan)"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-teal-300 font-mono text-[11px]"
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                <label className="text-slate-300 font-bold block">دۆخی ڕادەستکردنی ڕەزامەندی دارایی (Approval Workflow)</label>
                <select className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-bold">
                  <option>دوو قۆناغی: بەڕێوەبەری پێشوازی ⬅ سوپەر ئەدمین</option>
                  <option>یەک قۆناغی ڕاستەوخۆ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Trail Log */}
          <div className="bg-slate-900/60 p-6 rounded-[36px] border border-white/10 space-y-4 shadow-md">
            <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> تۆماری دەستکارییەکان و پاراستن (Audit Trail Log)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="p-3">بەکارهێنەر</th>
                    <th className="p-3">کرداری ئەنجامدراو</th>
                    <th className="p-3">بەش</th>
                    <th className="p-3">کۆن ➔ نوێ</th>
                    <th className="p-3">کاتی تۆمار</th>
                    <th className="p-3">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="p-3 font-bold text-white">{log.user}</td>
                      <td className="p-3 text-slate-300">{log.action}</td>
                      <td className="p-3 text-teal-300 font-mono">{log.category}</td>
                      <td className="p-3 text-slate-400 font-mono">
                        {log.oldValue} ➔ <strong className="text-emerald-300">{log.newValue}</strong>
                      </td>
                      <td className="p-3 text-slate-400 font-mono">{log.timestamp}</td>
                      <td className="p-3 text-slate-500 font-mono">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Salary Slip Print Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-[36px] w-full max-w-lg p-6 space-y-6 shadow-md text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-black text-white">فیۆلی موچەی دیجیتاڵی (Salary Slip)</h3>
                <span className="text-slate-400 font-mono">Dunyak Clinic Enterprise ERP</span>
              </div>
              <button
                onClick={() => setSelectedSlip(null)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold"
              >
                داخستن
              </button>
            </div>

            <div className="bg-slate-950 p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                  <strong className="text-white text-sm block">{selectedSlip.employeeName}</strong>
                  <span className="text-slate-400">{selectedSlip.department} - {selectedSlip.position}</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-mono font-bold rounded-lg">
                  {selectedSlip.paymentDate}
                </span>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span>موچەی بنەڕەتی (Basic Salary):</span>
                  <strong className="font-mono">{selectedSlip.basicSalary.toLocaleString()} د.ع</strong>
                </div>
                <div className="flex justify-between text-teal-300">
                  <span>کاتژمێری زیادە ({selectedSlip.overtimeHours}h):</span>
                  <strong className="font-mono">+{(selectedSlip.overtimeHours * selectedSlip.overtimeRatePerHour).toLocaleString()} د.ع</strong>
                </div>
                <div className="flex justify-between text-emerald-300">
                  <span>پاداشت و ڕێزلێنان:</span>
                  <strong className="font-mono">{(selectedSlip.bonus + selectedSlip.allowances) > 0 ? `+${(selectedSlip.bonus + selectedSlip.allowances).toLocaleString()} د.ع` : `0 د.ع`}</strong>
                </div>
                <div className="flex justify-between text-rose-300">
                  <span>دابڕینی باج و سزا و قەرز:</span>
                  <strong className="font-mono">{(selectedSlip.taxDeduction + selectedSlip.penalties + selectedSlip.loanDeduction) > 0 ? `-${(selectedSlip.taxDeduction + selectedSlip.penalties + selectedSlip.loanDeduction).toLocaleString()} د.ع` : `0 د.ع`}</strong>
                </div>
                <div className="flex justify-between text-white text-sm font-black pt-3 border-t border-white/10">
                  <span>پوختەی سەرانە (Net Pay):</span>
                  <strong className="text-emerald-400 font-mono text-base">{selectedSlip.netSalary.toLocaleString()} د.ع</strong>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrintSalarySlip}
                className="flex-1 py-3 bg-emerald-400 text-slate-950 font-black rounded-xl hover:brightness-110 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> چاپکردنی پسوولەی موچە
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal with Standard Presets */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-rose-500/40 rounded-[36px] w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 flex flex-col my-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-white">تۆمارکردنی مەسروفاتی نوێ</h3>
                  <p className="text-xs text-slate-400">دەستنیشانکردنی خێرای مەسروفات لە وشە سابتەکان (Presets)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="flex-1 overflow-y-auto space-y-5 text-xs pr-1">
              {/* Standard Expense Presets Selector */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2.5">
                <span className="text-[11px] font-bold text-rose-300 block">
                  هەڵبژاردنی خێرای مەسروفات لە وشە سابتەکان (Standard Presets):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
                  {STANDARD_EXPENSE_PRESETS.map((exp) => (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => {
                        setTitle(exp.title);
                        setCategory(exp.category as any);
                        setAmount(exp.suggestedAmount);
                        setNotes(exp.description);
                      }}
                      className={`text-[11px] px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-right flex items-center gap-1.5 ${
                        title === exp.title
                          ? 'bg-rose-500 text-slate-950 font-black border-rose-400 shadow-md scale-105'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10'
                      }`}
                    >
                      <span>{exp.title.split('(')[0].trim()}</span>
                      <span className="font-mono text-[10px] opacity-75">({exp.suggestedAmount.toLocaleString()} د.ع)</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">ناوی مەسروفات *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="کڕینی کەلوپەل، ئاو و کارەبا..."
                  className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-rose-400 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">بەشی مەسروفات</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-rose-400 cursor-pointer"
                  >
                    {STANDARD_EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">بڕی پارە (د.ع) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-rose-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">تێبینی / وردەکاری</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="زانیاری زیاتر..."
                  className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-black rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  پاشەکەوتکردنی مەسروفات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* TAB: DAILY & MONTHLY REPORTS */}
      {activeSubTab === 'daily_monthly_reports' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-teal-500/30 shadow-md">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-amber-400" /> ڕاپۆرتی گشتگیر: ڕۆژانە و مانگانە (Daily & Monthly Comprehensive Reports)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                پوختەی وردی داهات، مەسروفات، موچەی کارمەندان، قازانجی سافی، و زانیاری سەردانیکاران بۆ ئەمڕۆ و ئەم مانگە.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleOpenPrintModal('daily_closing')}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black rounded-xl shadow-md flex items-center gap-1.5 text-xs hover:brightness-110 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-slate-950" />
                <span>چاپکردنی ڕاپۆرتی ڕۆژانە (PDF)</span>
              </button>
              <button
                onClick={() => handleOpenPrintModal('monthly_summary')}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black rounded-xl shadow-md flex items-center gap-1.5 text-xs hover:brightness-110 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>چاپکردنی مانگانەی گشتگیر (PDF)</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: DAILY REPORT (ڕاپۆرتی ئەمڕۆ) */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h4 className="text-lg font-black text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-400" /> ڕاپۆرتی ڕۆژانە (امروز / Today Report - {new Date().toLocaleDateString('en-GB')})
              </h4>
              <span className="text-xs font-bold text-teal-300 bg-teal-500/20 px-3 py-1 rounded-xl border border-teal-500/30">
                🟢 چالاک و نوێکراوەوە
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setFinDrillDown('today_patients')}
                className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 hover:border-teal-400/60 transition-all cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">سەردانیکارانی ئەمڕۆ:</span>
                  <span className="text-[10px] text-teal-400 font-bold group-hover:underline">وردەکاری 🔍</span>
                </div>
                <div className="text-2xl font-black text-white font-mono">{todayApps.length} نەخۆش</div>
                <div className="text-[10px] text-teal-400">تۆمارکراوی ئەمڕۆ لە داتابەیس</div>
              </div>

              <div
                onClick={() => setFinDrillDown('today_revenue')}
                className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 hover:border-emerald-400/60 transition-all cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">داهاتی ئەمڕۆ (Revenue):</span>
                  <span className="text-[10px] text-emerald-400 font-bold group-hover:underline">وەسڵەکان 🔍</span>
                </div>
                <div className="text-2xl font-black text-emerald-300 font-mono">{todayRevenue.toLocaleString()} د.ع</div>
                <div className="text-[10px] text-emerald-400">کۆی پارەی وەرگیراوی ئەمڕۆ</div>
              </div>

              <div
                onClick={() => setFinDrillDown('today_expenses')}
                className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 hover:border-rose-400/60 transition-all cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">مەسروفاتی ئەمڕۆ (Expenses):</span>
                  <span className="text-[10px] text-rose-400 font-bold group-hover:underline">پسوولەکان 🔍</span>
                </div>
                <div className="text-2xl font-black text-rose-300 font-mono">{todayExpenseAmount.toLocaleString()} د.ع</div>
                <div className="text-[10px] text-rose-400">خەرجییەکانی ئەمڕۆ لە داتابەیس</div>
              </div>

              <div
                onClick={() => setFinDrillDown('today_net')}
                className="bg-slate-950/80 p-5 rounded-2xl border border-teal-500/40 hover:border-teal-400 transition-all cursor-pointer group space-y-1 shadow-[0_0_20px_rgba(45,212,191,0.15)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-teal-300 font-bold">قازانجی سافی ئەمڕۆ (Net Profit):</span>
                  <span className="text-[10px] text-teal-300 font-bold group-hover:underline">شیکاری 🔍</span>
                </div>
                <div className="text-2xl font-black text-teal-200 font-mono">{todayNetProfit.toLocaleString()} د.ع</div>
                <div className="text-[10px] text-teal-400">داهات - مەسروفات (ئەمڕۆ)</div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h5 className="text-xs font-bold text-slate-300">خزمەتگوزاری و چارەسەرە بەکارهاتووەکانی ئەمڕۆ ({todayApps.length} نۆرە):</h5>
              {todayApps.length === 0 ? (
                <div className="p-4 bg-slate-950 rounded-xl border border-white/5 text-center text-slate-400 text-xs">
                  هیچ خزمەتگوزاری یان نۆرەیەکی ئەمڕۆ تۆمار نەکراوە (0).
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {Object.entries(
                    todayApps.reduce((acc: Record<string, number>, curr) => {
                      const t = curr.treatmentName || 'خزمەتگوزاری پزیشکی';
                      acc[t] = (acc[t] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([name, count]) => (
                    <div key={name} className="bg-slate-950 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                      <span className="text-slate-300 font-bold">{name}</span>
                      <span className="font-mono text-teal-400 font-bold">{count} نەخۆش</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: MONTHLY REPORT (ڕاپۆرتی مانگانە) */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h4 className="text-lg font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" /> ڕاپۆرتی مانگانەی گشتگیر (Monthly Comprehensive Report)
              </h4>
              <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-xl border border-indigo-500/30">
                📁 مانگی ئێستا ({selectedYear})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setFinDrillDown('month_revenue')}
                className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 hover:border-emerald-400/60 transition-all cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">کۆی داهاتی مانگ (Total Revenue):</span>
                  <span className="text-[10px] text-emerald-400 font-bold group-hover:underline">وردەکاری 🔍</span>
                </div>
                <div className="text-2xl font-black text-emerald-300 font-mono">{monthRevenue.toLocaleString()} د.ع</div>
                <div className="text-[10px] text-emerald-400">کۆی فاکتۆرەکان لەم مانگەدا</div>
              </div>

              <div
                onClick={() => setFinDrillDown('month_salaries')}
                className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 hover:border-amber-400/60 transition-all cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">کۆی موچەی کارمەندان (Staff Salaries):</span>
                  <span className="text-[10px] text-amber-400 font-bold group-hover:underline">لیستی موچە 🔍</span>
                </div>
                <div className="text-2xl font-black text-amber-300 font-mono">{monthPayrollAmount.toLocaleString()} د.ع</div>
                <div className="text-[10px] text-amber-400">موچەی مانگانەی دراو بە تیم</div>
              </div>

              <div
                onClick={() => setFinDrillDown('month_expenses')}
                className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 hover:border-rose-400/60 transition-all cursor-pointer group space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">کۆی مەسروفاتی کارکردن (Operating Exp):</span>
                  <span className="text-[10px] text-rose-400 font-bold group-hover:underline">پسوولەکان 🔍</span>
                </div>
                <div className="text-2xl font-black text-rose-300 font-mono">{monthExpenseAmount.toLocaleString()} د.ع</div>
                <div className="text-[10px] text-rose-400">خەرجییەکانی ئەم مانگە</div>
              </div>

              <div
                onClick={() => setFinDrillDown('month_net')}
                className="bg-slate-950/80 p-5 rounded-2xl border border-indigo-500/40 hover:border-indigo-400 transition-all cursor-pointer group space-y-1 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-indigo-300 font-bold">پوختەی قازانجی مانگانە (Net Profit):</span>
                  <span className="text-[10px] text-indigo-300 font-bold group-hover:underline">شیکاری 🔍</span>
                </div>
                <div className="text-2xl font-black text-indigo-200 font-mono">
                  {monthNetProfit.toLocaleString()} د.ع
                </div>
                <div className="text-[10px] text-indigo-400">داهات - (موچە + مەسروفات)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-slate-950 p-6 rounded-3xl border border-white/10 space-y-4">
                <h5 className="text-sm font-black text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" /> پرکارترین و داواکراوەترین ئایتم/چارەسەر لەم مانگەدا:
                </h5>
                <div className="space-y-3 text-xs">
                  {monthApps.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 font-sans">
                      هیچ خزمەتگوزاری یان نۆرەیەک بۆ ئەم مانگە تۆمار نەکراوە (0).
                    </div>
                  ) : (
                    Object.entries(
                      monthApps.reduce((acc: Record<string, number>, curr) => {
                        const t = curr.treatmentName || 'خزمەتگوزاری پزیشکی';
                        acc[t] = (acc[t] || 0) + 1;
                        return acc;
                      }, {})
                    )
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([name, count], index) => (
                        <div key={name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                          <span className="text-white font-bold">{index + 1}. {name}</span>
                          <span className="font-mono text-teal-300 font-bold">{count} جلسە</span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-3xl border border-white/10 space-y-4">
                <h5 className="text-sm font-black text-white flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-emerald-400" /> پوختە و بەرچاوی دارایی گشتی (کلیک بۆ سندووق و بانک):
                </h5>
                <div className="space-y-3 text-xs text-slate-300">
                  <div
                    onClick={() => setFinDrillDown('cashbox_balance')}
                    className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition"
                  >
                    <span className="flex items-center gap-1.5 font-bold text-white">
                      <Wallet className="w-4 h-4 text-emerald-400" /> کۆی گشتی باڵانسی کاش و صندوق:
                    </span>
                    <strong className="text-emerald-300 font-mono">{totalCashBalance.toLocaleString()} د.ع 🔍</strong>
                  </div>
                  <div
                    onClick={() => setFinDrillDown('bank_balance')}
                    className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition"
                  >
                    <span className="flex items-center gap-1.5 font-bold text-white">
                      <Landmark className="w-4 h-4 text-cyan-400" /> کۆی گشتی باڵانسی بانکی:
                    </span>
                    <strong className="text-cyan-300 font-mono">{totalBankIQD.toLocaleString()} د.ع 🔍</strong>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span>ڕێژەی قازانجی صافی نسبت بە داهات:</span>
                    <strong className="text-indigo-300 font-mono">
                      {monthRevenue > 0 ? Math.round((monthNetProfit / monthRevenue) * 100) : 0}%
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW FINANCIAL YEAR MODAL */}
      {showNewYearModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-teal-500/40 w-full max-w-md rounded-[32px] p-6 shadow-md space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold">
                  📅
                </div>
                <div>
                  <h3 className="text-white font-black text-base">دروستکردنی ساڵی مالی نوێ</h3>
                  <p className="text-slate-400 text-xs">تایبەت بە حیساباتی سەربەخۆی ساڵی نوێ</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewYearModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewFinancialYearSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">ساڵی مالی (بۆ نموونە: 2028، 2029) *</label>
                <input
                  type="text"
                  required
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  placeholder="ساڵ بنووسە..."
                  className="w-full p-3 bg-slate-950 border border-teal-500/30 rounded-xl text-teal-300 font-mono text-base outline-none focus:border-teal-400"
                />
              </div>

              <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-200 leading-relaxed text-[11px]">
                💡 تێبینی: بە دروستکردنی ئەم ساڵە، سیستەمەکە حیساباتی ئەم ساڵە بە تەواوی سەربەخۆ دەکات و لە کاتی کرانەوەی سیستەمەکەشدا بە شێوەیەکی خۆکار وەک ساڵی سەرەکی دەردەکەوێت.
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewYearModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black rounded-xl shadow-md cursor-pointer hover:opacity-90"
                >
                  دروستکردن و چالاککردن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Financial Drill-Down Modal (100% Real Database Records) */}
      {finDrillDown && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-teal-500/40 rounded-[32px] w-full max-w-5xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {finDrillDown === 'revenue' && `وردەکاری کۆی داهاتی ساڵی ${selectedYear}`}
                    {finDrillDown === 'discounts' && `وردەکاری داشکاندن و ئۆفەرەکان - ساڵی ${selectedYear}`}
                    {finDrillDown === 'expenses' && `وردەکاری مەسروفات و موچەی کارمەندان - ساڵی ${selectedYear}`}
                    {finDrillDown === 'net_profit' && `شیکاری وردی قازانجی پاک - ساڵی ${selectedYear}`}
                    {finDrillDown === 'today_patients' && `وردەکاری سەردانیکارانی ئەمڕۆ (${todayApps.length} نەخۆش)`}
                    {finDrillDown === 'today_revenue' && `وەسڵەکان و داهاتی ئەمڕۆ (${todayRevenue.toLocaleString()} د.ع)`}
                    {finDrillDown === 'today_expenses' && `پسوولەکان و مەسروفاتی ئەمڕۆ (${todayExpenseAmount.toLocaleString()} د.ع)`}
                    {finDrillDown === 'today_net' && `شیکاری قازانجی صافی ئەمڕۆ (${todayNetProfit.toLocaleString()} د.ع)`}
                    {finDrillDown === 'month_revenue' && `داهاتی ئەم مانگە (${monthRevenue.toLocaleString()} د.ع)`}
                    {finDrillDown === 'month_salaries' && `لیستی موچەی کارمەندان (${monthPayrollAmount.toLocaleString()} د.ع)`}
                    {finDrillDown === 'month_expenses' && `مەسروفاتی ئەم مانگە (${monthExpenseAmount.toLocaleString()} د.ع)`}
                    {finDrillDown === 'month_net' && `قازانجی سافی ئەم مانگە (${monthNetProfit.toLocaleString()} د.ع)`}
                    {finDrillDown === 'cashbox_balance' && `وردەکاری باڵانسی سندووق و کاش (${totalCashBalance.toLocaleString()} د.ع)`}
                    {finDrillDown === 'bank_balance' && `وردەکاری باڵانسی ئەژمێرە بانکییەکان (${totalBankIQD.toLocaleString()} د.ع)`}
                  </h3>
                  <p className="text-xs text-slate-400">سەرجەم داتاکان ڕاستەوخۆ لە داتابەیسەوە بە تەواوی ڕاستەقینە دەرهێنراون</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="گەڕان لە داتاکاندا..."
                    value={drillDownSearch}
                    onChange={(e) => setDrillDownSearch(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-400 w-48 sm:w-60"
                  />
                </div>
                <button
                  onClick={() => {
                    setFinDrillDown(null);
                    setDrillDownSearch('');
                  }}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* REVENUE DRILLDOWN */}
              {(finDrillDown === 'revenue' || finDrillDown === 'today_revenue' || finDrillDown === 'month_revenue') && (() => {
                const targetApps = finDrillDown === 'today_revenue' 
                  ? todayApps 
                  : finDrillDown === 'month_revenue' 
                  ? monthApps 
                  : finalYearApps;
                const filtered = targetApps.filter((a) => {
                  if (!drillDownSearch) return true;
                  const q = drillDownSearch.toLowerCase();
                  return (
                    (a.patientName && a.patientName.toLowerCase().includes(q)) ||
                    (a.treatmentName && a.treatmentName.toLowerCase().includes(q)) ||
                    (a.doctorName && a.doctorName.toLowerCase().includes(q))
                  );
                });

                return (
                  <div className="space-y-4">
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[11px]">کۆی داهاتی هەژمارکراو</span>
                        <strong className="text-2xl font-black text-emerald-300 font-mono">
                          {targetApps.reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0).toLocaleString()} د.ع
                        </strong>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold text-xs">
                        {targetApps.length} پسوولە / نۆرە
                      </span>
                    </div>

                    <div className="bg-slate-950/90 rounded-2xl border border-white/10 overflow-hidden max-h-80 overflow-y-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-300 font-bold border-b border-white/10 sticky top-0">
                            <th className="p-3">نەخۆش</th>
                            <th className="p-3">خزمەتگوزاری / چارەسەر</th>
                            <th className="p-3">پزیشک</th>
                            <th className="p-3">بڕی دراو (داهات)</th>
                            <th className="p-3">بەروار</th>
                            <th className="p-3">دۆخ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {filtered.map((app) => (
                            <tr key={app.id} className="hover:bg-white/[0.04]">
                              <td className="p-3 font-sans font-bold text-white">{app.patientName}</td>
                              <td className="p-3 font-sans text-teal-300">{app.treatmentName}</td>
                              <td className="p-3 font-sans text-slate-400">{app.doctorName}</td>
                              <td className="p-3 font-bold text-emerald-400">{(app.paidAmount || 0).toLocaleString()} د.ع</td>
                              <td className="p-3 text-slate-400">{app.date || (app as any).appointmentDate}</td>
                              <td className="p-3 font-sans">
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                  {app.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-500 font-sans">
                                هیچ داتایەکی داهات لەم بەشەدا تۆمار نەکراوە (0 د.ع).
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* DISCOUNTS DRILLDOWN */}
              {finDrillDown === 'discounts' && (() => {
                const discountedApps = finalYearApps.filter((a) => (Number(a.discountApplied) || 0) > 0);
                const filtered = discountedApps.filter((a) => {
                  if (!drillDownSearch) return true;
                  const q = drillDownSearch.toLowerCase();
                  return (
                    (a.patientName && a.patientName.toLowerCase().includes(q)) ||
                    (a.treatmentName && a.treatmentName.toLowerCase().includes(q))
                  );
                });

                return (
                  <div className="space-y-4">
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[11px]">کۆی گشتی داشکاندنەکان</span>
                        <strong className="text-2xl font-black text-amber-300 font-mono">{yearTotalDiscounts.toLocaleString()} د.ع</strong>
                      </div>
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs">
                        {discountedApps.length} نۆرەی داشکێندراو
                      </span>
                    </div>

                    <div className="bg-slate-950/90 rounded-2xl border border-white/10 overflow-hidden max-h-80 overflow-y-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-300 font-bold border-b border-white/10 sticky top-0">
                            <th className="p-3">نەخۆش</th>
                            <th className="p-3">خزمەتگوزاری</th>
                            <th className="p-3">نرخی ئەسڵی</th>
                            <th className="p-3">ڕێژەی داشکاندن</th>
                            <th className="p-3">بڕی داشکێنراو</th>
                            <th className="p-3">بڕی وەرگیراو</th>
                            <th className="p-3">بەروار</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {filtered.map((app) => {
                            const orig = Number(app.treatmentPrice) || Number(app.paidAmount) || 0;
                            const pct = Number(app.discountApplied) || 0;
                            const amt = Math.round((orig * pct) / 100);
                            return (
                              <tr key={app.id} className="hover:bg-white/[0.04]">
                                <td className="p-3 font-sans font-bold text-white">{app.patientName}</td>
                                <td className="p-3 font-sans text-teal-300">{app.treatmentName}</td>
                                <td className="p-3 text-slate-300">{orig.toLocaleString()} د.ع</td>
                                <td className="p-3 text-amber-300 font-bold">{pct}%</td>
                                <td className="p-3 text-amber-400 font-bold">-{amt.toLocaleString()} د.ع</td>
                                <td className="p-3 text-emerald-400 font-bold">{(app.paidAmount || 0).toLocaleString()} د.ع</td>
                                <td className="p-3 text-slate-400">{app.date || (app as any).appointmentDate}</td>
                              </tr>
                            );
                          })}
                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-slate-500 font-sans">
                                هیچ داشکاندنێک تۆمار نەکراوە (0).
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* EXPENSES DRILLDOWN */}
              {(finDrillDown === 'expenses' || finDrillDown === 'today_expenses' || finDrillDown === 'month_expenses') && (() => {
                const targetExpenses = finDrillDown === 'today_expenses' 
                  ? todayExpenses 
                  : finDrillDown === 'month_expenses' 
                  ? monthExpenses 
                  : finalYearExpenses;
                const filtered = targetExpenses.filter((e) => {
                  if (!drillDownSearch) return true;
                  const q = drillDownSearch.toLowerCase();
                  return (
                    (e.title && e.title.toLowerCase().includes(q)) ||
                    (e.category && e.category.toLowerCase().includes(q)) ||
                    (e.recordedBy && e.recordedBy.toLowerCase().includes(q))
                  );
                });

                return (
                  <div className="space-y-4">
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[11px]">کۆی گشتی خەرجییەکان</span>
                        <strong className="text-2xl font-black text-rose-300 font-mono">
                          {targetExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString()} د.ع
                        </strong>
                      </div>
                      <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl font-bold text-xs">
                        {targetExpenses.length} پسوولەی مەسروفات
                      </span>
                    </div>

                    <div className="bg-slate-950/90 rounded-2xl border border-white/10 overflow-hidden max-h-80 overflow-y-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-300 font-bold border-b border-white/10 sticky top-0">
                            <th className="p-3">بابەت / مەسروف</th>
                            <th className="p-3">پۆلێن</th>
                            <th className="p-3">بڕ (د.ع)</th>
                            <th className="p-3">تۆمارکەر</th>
                            <th className="p-3">بەروار</th>
                            <th className="p-3">تێبینی</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {filtered.map((ex) => (
                            <tr key={ex.id} className="hover:bg-white/[0.04]">
                              <td className="p-3 font-bold font-sans text-white">{ex.title}</td>
                              <td className="p-3 font-sans text-cyan-300">{ex.category}</td>
                              <td className="p-3 text-rose-400 font-bold font-mono">{ex.amount.toLocaleString()} د.ع</td>
                              <td className="p-3 font-sans text-slate-400">{ex.recordedBy}</td>
                              <td className="p-3 text-slate-400">{ex.date}</td>
                              <td className="p-3 font-sans text-slate-500 truncate max-w-[150px]">{ex.notes || '-'}</td>
                            </tr>
                          ))}
                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-500 font-sans">
                                هیچ مەسروفاتێک تۆمار نەکراوە (0 د.ع).
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* NET PROFIT DRILLDOWN */}
              {(finDrillDown === 'net_profit' || finDrillDown === 'today_net' || finDrillDown === 'month_net') && (() => {
                const isToday = finDrillDown === 'today_net';
                const isMonth = finDrillDown === 'month_net';
                const rev = isToday ? todayRevenue : isMonth ? monthRevenue : yearTotalRevenue;
                const exp = isToday ? todayExpenseAmount : isMonth ? monthExpenseAmount : yearTotalExpenses;
                const pay = isToday ? 0 : isMonth ? monthPayrollAmount : yearTotalPayroll;
                const net = rev - exp - pay;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5">
                        <span className="text-slate-400 block text-[11px]">داهات (+)</span>
                        <strong className="text-xl font-black text-emerald-300 font-mono">{rev.toLocaleString()} د.ع</strong>
                      </div>
                      <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5">
                        <span className="text-slate-400 block text-[11px]">مەسروفات (-)</span>
                        <strong className="text-xl font-black text-rose-300 font-mono">{exp.toLocaleString()} د.ع</strong>
                      </div>
                      <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5">
                        <span className="text-slate-400 block text-[11px]">موچەی کارمەندان (-)</span>
                        <strong className="text-xl font-black text-amber-300 font-mono">{pay.toLocaleString()} د.ع</strong>
                      </div>
                      <div className="bg-slate-950/80 p-4 rounded-2xl border border-cyan-500/40 shadow">
                        <span className="text-cyan-300 block text-[11px] font-bold">قازانجی سافی (=)</span>
                        <strong className="text-xl font-black text-cyan-200 font-mono">{net.toLocaleString()} د.ع</strong>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-2">
                      <h4 className="font-bold text-white">فورمولای پاکسازی حیسابات:</h4>
                      <p className="text-slate-300">
                        قازانجی پاک = {rev.toLocaleString()} د.ع (داهات) - {exp.toLocaleString()} د.ع (مەسروفات) {pay > 0 ? `- ${pay.toLocaleString()} د.ع (موچە)` : ''} = <strong className="text-cyan-300">{net.toLocaleString()} د.ع</strong>.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* TODAY PATIENTS DRILLDOWN */}
              {finDrillDown === 'today_patients' && (() => {
                const filtered = todayApps.filter((a) => {
                  if (!drillDownSearch) return true;
                  const q = drillDownSearch.toLowerCase();
                  return (
                    (a.patientName && a.patientName.toLowerCase().includes(q)) ||
                    (a.treatmentName && a.treatmentName.toLowerCase().includes(q)) ||
                    (a.doctorName && a.doctorName.toLowerCase().includes(q))
                  );
                });

                return (
                  <div className="space-y-4">
                    <div className="bg-slate-950/90 rounded-2xl border border-white/10 overflow-hidden max-h-80 overflow-y-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-300 font-bold border-b border-white/10 sticky top-0">
                            <th className="p-3">ناوی نەخۆش</th>
                            <th className="p-3">مۆبایل</th>
                            <th className="p-3">خزمەتگوزاری</th>
                            <th className="p-3">پزیشک</th>
                            <th className="p-3">کات</th>
                            <th className="p-3">بڕی دراو</th>
                            <th className="p-3">دۆخ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {filtered.map((app) => (
                            <tr key={app.id} className="hover:bg-white/[0.04]">
                              <td className="p-3 font-sans font-bold text-white">{app.patientName}</td>
                              <td className="p-3 text-slate-400" dir="ltr">{app.patientPhone || '-'}</td>
                              <td className="p-3 font-sans text-teal-300">{app.treatmentName}</td>
                              <td className="p-3 font-sans text-slate-400">{app.doctorName}</td>
                              <td className="p-3 text-slate-400">{app.appointmentTime || '-'}</td>
                              <td className="p-3 text-emerald-400 font-bold">{(app.paidAmount || 0).toLocaleString()} د.ع</td>
                              <td className="p-3 font-sans">
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                  {app.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-slate-500 font-sans">
                                هیچ نەخۆشێک بۆ ئەمڕۆ لە داتابەیسدا تۆمار نەکراوە (0).
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* PAYROLL SALARIES DRILLDOWN */}
              {finDrillDown === 'month_salaries' && (() => {
                const filtered = payrollList.filter((p) => {
                  if (!drillDownSearch) return true;
                  const q = drillDownSearch.toLowerCase();
                  return (
                    (p.employeeName && p.employeeName.toLowerCase().includes(q)) ||
                    (p.department && p.department.toLowerCase().includes(q))
                  );
                });

                return (
                  <div className="space-y-4">
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[11px]">کۆی موچەی کارمەندان</span>
                        <strong className="text-2xl font-black text-amber-300 font-mono">{monthPayrollAmount.toLocaleString()} د.ع</strong>
                      </div>
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs">
                        {payrollList.length} کارمەند
                      </span>
                    </div>

                    <div className="bg-slate-950/90 rounded-2xl border border-white/10 overflow-hidden max-h-80 overflow-y-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-300 font-bold border-b border-white/10 sticky top-0">
                            <th className="p-3">ناوی کارمەند</th>
                            <th className="p-3">بەش</th>
                            <th className="p-3">پلە</th>
                            <th className="p-3">موچەی بنەڕەتی</th>
                            <th className="p-3">موچەی صافی</th>
                            <th className="p-3">دۆخی پارەدان</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {filtered.map((rec) => (
                            <tr key={rec.id} className="hover:bg-white/[0.04]">
                              <td className="p-3 font-sans font-bold text-white">{rec.employeeName}</td>
                              <td className="p-3 font-sans text-slate-400">{rec.department}</td>
                              <td className="p-3 font-sans text-cyan-300">{rec.position}</td>
                              <td className="p-3 text-slate-300">{rec.basicSalary.toLocaleString()} د.ع</td>
                              <td className="p-3 text-amber-300 font-bold">{rec.netSalary.toLocaleString()} د.ع</td>
                              <td className="p-3 font-sans">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${rec.paymentStatus === 'دراوە' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                  {rec.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-500 font-sans">
                                هیچ کارمەندێک تۆمار نەکراوە (0).
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* CASHBOXES DRILLDOWN */}
              {finDrillDown === 'cashbox_balance' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/90 rounded-2xl border border-white/10 overflow-hidden max-h-80 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-slate-300 font-bold border-b border-white/10 sticky top-0">
                          <th className="p-3">ناوی سندووق</th>
                          <th className="p-3">بەرپرسی سندووق</th>
                          <th className="p-3">باڵانس (د.ع)</th>
                          <th className="p-3">دوایین داخستن</th>
                          <th className="p-3">دۆخ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {cashBoxes.map((c) => (
                          <tr key={c.id} className="hover:bg-white/[0.04]">
                            <td className="p-3 font-sans font-bold text-white">{c.name}</td>
                            <td className="p-3 font-sans text-slate-400">{c.responsible}</td>
                            <td className="p-3 text-emerald-400 font-bold">{c.balance.toLocaleString()} د.ع</td>
                            <td className="p-3 text-slate-400">{c.lastClosingTime || '-'}</td>
                            <td className="p-3 font-sans">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${c.status === 'کراوەتەوە' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BANK ACCOUNTS DRILLDOWN */}
              {finDrillDown === 'bank_balance' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/90 rounded-2xl border border-white/10 overflow-hidden max-h-80 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-slate-300 font-bold border-b border-white/10 sticky top-0">
                          <th className="p-3">ناوی بانک</th>
                          <th className="p-3">ژمارەی ئەژمێر</th>
                          <th className="p-3">لق</th>
                          <th className="p-3">باڵانس</th>
                          <th className="p-3">دراو</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {bankAccounts.map((b) => (
                          <tr key={b.id} className="hover:bg-white/[0.04]">
                            <td className="p-3 font-sans font-bold text-white">{b.bankName}</td>
                            <td className="p-3 text-slate-400">{b.accountNumber}</td>
                            <td className="p-3 font-sans text-slate-400">{b.branchName}</td>
                            <td className="p-3 text-cyan-300 font-bold">{b.balance.toLocaleString()}</td>
                            <td className="p-3 font-sans text-slate-400">{b.currency}</td>
                          </tr>
                        ))}
                        {bankAccounts.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                              هیچ ئەژمێرێکی بانکی تۆمار نەکراوە (0 د.ع).
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => {
                  setFinDrillDown(null);
                  setDrillDownSearch('');
                }}
                className="px-6 py-2.5 bg-teal-400 text-slate-950 font-black rounded-xl hover:brightness-110 cursor-pointer"
              >
                داخستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CASH BOX MODAL */}
      {showAddCashBoxModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-teal-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-teal-400" /> دروستکردنی سندووقی نوێ
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">ناوی سندووق:</label>
                <input
                  type="text"
                  value={newCashBoxName}
                  onChange={(e) => setNewCashBoxName(e.target.value)}
                  placeholder="ناوی سندووق بنووسە..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">ناوی بەرپرس:</label>
                <input
                  type="text"
                  value={newCashBoxResp}
                  onChange={(e) => setNewCashBoxResp(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">سەرمایەی سەرەتایی (د.ع):</label>
                <input
                  type="number"
                  value={newCashBoxBalance}
                  onChange={(e) => setNewCashBoxBalance(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-teal-300 font-mono text-xs"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCashBoxModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                پاشگەزبوونەوە
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newCashBoxName.trim()) return;
                  const newBox: CashBox = {
                    id: Date.now(),
                    name: newCashBoxName.trim(),
                    responsible: newCashBoxResp || currentUser?.name || 'سوپەر ئەدمین',
                    balance: Number(newCashBoxBalance) || 0,
                    lastClosingTime: 'ئەمڕۆ ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    status: 'کراوەتەوە',
                  };
                  const updated = [...cashBoxes, newBox];
                  setCashBoxes(updated);
                  try {
                    localStorage.setItem('donia_cash_boxes', JSON.stringify(updated));
                  } catch (e) {}
                  syncSave('cashBoxes', newBox).catch(console.error);
                  setShowAddCashBoxModal(false);
                }}
                className="flex-1 py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
              >
                دروستکردن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CASH BOX BALANCE MODAL */}
      {editingCashBox && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-teal-500/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white">گۆڕینی باڵانسی ({editingCashBox.name})</h3>
            <div>
              <label className="text-xs text-slate-300 block mb-1">باڵانسی نوێ (د.ع):</label>
              <input
                type="number"
                value={editCashBalance}
                onChange={(e) => setEditCashBalance(Number(e.target.value))}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-teal-300 font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingCashBox(null)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                داخستن
              </button>
              <button
                type="button"
                onClick={() => {
                  const updatedBoxes = cashBoxes.map(box => box.id === editingCashBox.id ? { ...box, balance: editCashBalance } : box);
                  setCashBoxes(updatedBoxes);
                  try {
                    localStorage.setItem('donia_cash_boxes', JSON.stringify(updatedBoxes));
                  } catch (e) {}
                  syncSave('cashBoxes', { ...editingCashBox, balance: editCashBalance }).catch(console.error);
                  setEditingCashBox(null);
                }}
                className="flex-1 py-2.5 bg-teal-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
              >
                پاشەکەوتکردن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD BANK MODAL */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" /> تۆمارکردنی ئەژماری بانکی نوێ
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">ناوی بانک:</label>
                <input
                  type="text"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  placeholder="ناوی بانک..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">ژمارەی ئەژمار (IBAN/Account):</label>
                <input
                  type="text"
                  value={newBankAccNum}
                  onChange={(e) => setNewBankAccNum(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-blue-300 font-mono text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-bold">دراو:</label>
                  <select
                    value={newBankCurrency}
                    onChange={(e) => setNewBankCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white text-xs"
                  >
                    <option value="د.ع (IQD)">د.ع (IQD)</option>
                    <option value="دۆلار (USD)">دۆلار (USD)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-bold">باڵانسی سەرەتایی:</label>
                  <input
                    type="number"
                    value={newBankBalance}
                    onChange={(e) => setNewBankBalance(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-blue-300 font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">لق / ناونیشان:</label>
                <input
                  type="text"
                  value={newBankBranch}
                  onChange={(e) => setNewBankBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white text-xs"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddBankModal(false)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                پاشگەزبوونەوە
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newBankName.trim()) return;
                  const newBank: BankAccount = {
                    id: Date.now(),
                    bankName: newBankName.trim(),
                    accountNumber: newBankAccNum,
                    currency: newBankCurrency,
                    balance: Number(newBankBalance) || 0,
                    branch: newBankBranch,
                  };
                  const updated = [...bankAccounts, newBank];
                  setBankAccounts(updated);
                  try {
                    localStorage.setItem('donia_bank_accounts', JSON.stringify(updated));
                  } catch (e) {}
                  syncSave('bankAccounts', newBank).catch(console.error);
                  setShowAddBankModal(false);
                }}
                className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl text-xs cursor-pointer"
              >
                تۆمارکردن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BANK ACCOUNT BALANCE MODAL */}
      {editingBankAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white">گۆڕینی باڵانسی ({editingBankAccount.bankName})</h3>
            <div>
              <label className="text-xs text-slate-300 block mb-1">باڵانسی نوێ:</label>
              <input
                type="number"
                value={editBankBalance}
                onChange={(e) => setEditBankBalance(Number(e.target.value))}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-blue-300 font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingBankAccount(null)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                داخستن
              </button>
              <button
                type="button"
                onClick={() => {
                  const updatedBanks = bankAccounts.map(acc => acc.id === editingBankAccount.id ? { ...acc, balance: editBankBalance } : acc);
                  setBankAccounts(updatedBanks);
                  try {
                    localStorage.setItem('donia_bank_accounts', JSON.stringify(updatedBanks));
                  } catch (e) {}
                  syncSave('bankAccounts', { ...editingBankAccount, balance: editBankBalance }).catch(console.error);
                  setEditingBankAccount(null);
                }}
                className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl text-xs cursor-pointer"
              >
                پاشەکەوتکردن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD FIXED ASSET MODAL */}
      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-teal-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-400" /> تۆمارکردنی ئامێری نوێ
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">ناوی ئامێر / Asset Name:</label>
                <input
                  type="text"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  placeholder="ناوی ئامێری پزیشکی..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-bold">بەش / جۆر:</label>
                  <input
                    type="text"
                    value={newAssetCategory}
                    onChange={(e) => setNewAssetCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-bold">نرخی کڕین (د.ع):</label>
                  <input
                    type="number"
                    value={newAssetCost}
                    onChange={(e) => setNewAssetCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-teal-300 font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-bold">ناوی بەرپرسی ئامێر:</label>
                <input
                  type="text"
                  value={newAssetResp}
                  onChange={(e) => setNewAssetResp(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white text-xs"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAssetModal(false)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                پاشگەزبوونەوە
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newAssetName.trim()) return;
                  const newAsset: FixedAsset = {
                    id: Date.now(),
                    assetName: newAssetName.trim(),
                    category: newAssetCategory,
                    purchaseDate: new Date().toISOString().split('T')[0],
                    purchaseCost: Number(newAssetCost) || 0,
                    currentValue: Number(newAssetCost) || 0,
                    depreciationRateYearly: 10,
                    responsiblePerson: newAssetResp || currentUser?.name || '',
                    status: 'بەکاردا هاتووە',
                  };
                  const updated = [newAsset, ...fixedAssets];
                  setFixedAssets(updated);
                  try {
                    localStorage.setItem('donia_fixed_assets', JSON.stringify(updated));
                  } catch (e) {}
                  syncSave('fixedAssets', newAsset).catch(console.error);
                  setShowAddAssetModal(false);
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer hover:brightness-110"
              >
                تۆمارکردن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE PRINTABLE FINANCIAL AUDIT & PDF EXPORT MODAL */}
      <PrintableFinancialReportModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        reportType={printModalReportType}
        selectedYear={selectedYear}
        totalRevenue={totalRevenue}
        expenses={expenses}
        payrollList={payrollList}
        cashBoxes={cashBoxes}
        bankAccounts={bankAccounts}
        activeBranchName={branches.find((b) => b.id === activeBranchId)?.name || 'هەموو لقەکان'}
        currentUser={currentUser}
        customData={printCustomData}
      />
    </div>
  );
};
