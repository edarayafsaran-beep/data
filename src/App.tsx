import React, { useState, useEffect } from 'react';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TvBoardView } from './components/TvBoardView';
import { PatientsView } from './components/PatientsView';
import { AppointmentsWhatsappView } from './components/AppointmentsWhatsappView';
import { FinancialsView } from './components/FinancialsView';
import { DoctorsView } from './components/DoctorsView';
import { AdminSettingsView } from './components/AdminSettingsView';
import { CrmPackagesView } from './components/CrmPackagesView';
import { SmartInventoryView } from './components/SmartInventoryView';
import { BiAnalyticsView } from './components/BiAnalyticsView';
import { AuditSecurityView } from './components/AuditSecurityView';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { QrScanModal } from './components/QrScanModal';
import { PatientProfileModal } from './components/PatientProfileModal';
import { OfflineModal } from './components/OfflineModal';
import { TourGuideModal } from './components/TourGuideModal';
import { LoginView } from './components/LoginView';
import { ConsolidatedBranchesView } from './components/ConsolidatedBranchesView';
import { MonthlyFinancialCardsView } from './components/MonthlyFinancialCardsView';
import { BranchStaffSalesRewardsView } from './components/BranchStaffSalesRewardsView';
import { StaffAttendanceView } from './components/StaffAttendanceView';
import { ActionProgressModal } from './components/ActionProgressModal';
import { Lock, ShieldAlert, Loader2, Sparkles } from 'lucide-react';
import { hasTabAccess, getDefaultPermissionsForRole } from './utils/permissions';
import { useAuth } from './context/AuthContext';
import { syncSave, syncDelete, syncLoad, subscribeCollection } from './lib/dataSync';
import { db as firestoreDb } from './lib/firebase';
import { collection as firestoreCollection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { dbApi } from './lib/api';

import {
  initialUsers,
  initialTreatments,
  initialRooms,
  initialPatients,
  initialAppointments,
  initialExpenses,
  initialInventory,
  initialPackages,
  initialTiers,
  initialComplaints,
  initialLabTests,
  initialPrescriptions,
  initialSystemAuditLogs,
  initialBranches,
  initialPayrollRecords,
  initialCashBoxes,
  initialBankAccounts,
  initialFixedAssets,
  initialFinancialAuditLogs,
  initialEmployeeBonuses,
} from './initialData';

import {
  Branch,
  User,
  UserRole,
  UserPermissions,
  Patient,
  Treatment,
  Room,
  Appointment,
  Expense,
  WhatsappLog,
  ClinicStats,
  InventoryItem,
  TreatmentPackage,
  MembershipTierDetail,
  PatientComplaint,
  LabTestOrder,
  Prescription,
  SystemAuditLog,
  EmployeePayrollRecord,
  StaffAttendanceRecord,
} from './types';

function MainAppContent() {
  const { user: authUser, loading: authLoading, logout: firebaseLogout } = useAuth();
  const { notify } = useNotification();
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      // Clean up lingering permanent localStorage session so login is always required
      localStorage.removeItem('dunia_user_session');
      const stored = sessionStorage.getItem('dunia_user_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user) return parsed.user;
        if (parsed.id || parsed.username) return parsed;
      }
    } catch (e) {}
    return null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const stored = sessionStorage.getItem('dunia_user_session');
      if (stored) return true;
    } catch (e) {}
    return false;
  });

  const [globalDiscount, setGlobalDiscount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('donia_global_discount');
      if (saved) return Number(saved) || 0;
    } catch (e) {}
    return 0;
  });
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [treatments, setTreatments] = useState<Treatment[]>(initialTreatments);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsappLog[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [treatmentPackages, setTreatmentPackages] = useState<TreatmentPackage[]>(initialPackages);
  const [membershipTiers, setMembershipTiers] = useState<MembershipTierDetail[]>(initialTiers);
  const [patientComplaints, setPatientComplaints] = useState<PatientComplaint[]>(initialComplaints);
  const [labTests, setLabTests] = useState<LabTestOrder[]>(initialLabTests);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [systemAuditLogs, setSystemAuditLogs] = useState<SystemAuditLog[]>(initialSystemAuditLogs);
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [activeBranchId, setActiveBranchId] = useState<number | null>(1);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [initProgress, setInitProgress] = useState(10);

  useEffect(() => {
    // Clean old demo test data from client browser localStorage
    try {
      const keysToRemove = [
        'dunia_cache_treatments',
        'dunia_cache_inventory',
        'dunia_cache_treatmentPackages',
        'dunia_cache_rooms',
        'dunia_cache_patients',
        'dunia_cache_appointments',
        'dunia_cache_expenses',
        'dunia_cache_users',
        'donia_employee_bonuses',
        'donia_fixed_assets',
        'donia_payroll_list',
        'donia_cash_boxes',
        'donia_bank_accounts',
        'donia_audit_logs',
        'donia_staff_attendance_records',
        'donia_staff_leave_requests'
      ];
      const hasCleaned = localStorage.getItem('dunia_test_data_wiped_v3');
      if (!hasCleaned) {
        keysToRemove.forEach(k => localStorage.removeItem(k));
        localStorage.setItem('dunia_test_data_wiped_v3', 'true');
      }
    } catch (e) {}

    if (!isDataLoaded) {
      const timer = setInterval(() => {
        setInitProgress(p => (p < 92 ? p + Math.floor(Math.random() * 12) + 6 : p));
      }, 150);
      return () => clearInterval(timer);
    } else {
      setInitProgress(100);
    }
  }, [isDataLoaded]);
  
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('clinic_active_tab');
      if (saved) return saved;
    } catch (e) {}
    return 'dashboard';
  });

  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('clinic_active_tab', tab);
    } catch (e) {}
  };
  const [isTvFullscreen, setIsTvFullscreen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);
  const [isTourGuideOpen, setIsTourGuideOpen] = useState<boolean>(false);
  const [scannedPatientProfile, setScannedPatientProfile] = useState<Patient | null>(null);
  
  const [superAdminCreds, setSuperAdminCreds] = useState<{ username: string; password: string }>(() => {
    try {
      const saved = localStorage.getItem('donia_superadmin_creds');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { username: 'admin', password: '123' };
  });

  const [financialYears, setFinancialYears] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('donia_financial_years');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return ['2024', '2025', '2026', '2027'];
  });

  const [activeFinancialYear, setActiveFinancialYear] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('donia_active_financial_year');
      if (saved) return saved;
    } catch (e) {}
    return '2026';
  });

  const handleAddFinancialYear = (newYear: string) => {
    if (financialYears.includes(newYear)) {
      notify({ type: 'error', title: 'هەڵە', message: `ساڵی دارایی (${newYear}) پێشتر بوونی هەیە!` });
      return;
    }
    const updated = [...financialYears, newYear].sort();
    setFinancialYears(updated);
    setActiveFinancialYear(newYear);
    try {
      localStorage.setItem('donia_financial_years', JSON.stringify(updated));
      localStorage.setItem('donia_active_financial_year', newYear);
    } catch (e) {}
    notify({
      type: 'success',
      title: 'ساڵی دارایی نوێ دروستکرا ✨',
      message: `ساڵی دارایی (${newYear}) چالاککرا. حیسابات بۆ ئەم ساڵە پاکە، و ناو و زانیاری نەخۆش و بەکارمەندەکان وەک خۆیان مانەوە.`,
    });
  };

  const handleSelectFinancialYear = (year: string) => {
    setActiveFinancialYear(year);
    try {
      localStorage.setItem('donia_active_financial_year', year);
    } catch (e) {}
  };

  const [progressModalState, setProgressModalState] = useState<{
    isOpen: boolean;
    title: string;
    progress: number;
    currentStepText?: string;
  }>({ isOpen: false, title: '', progress: 0, currentStepText: '' });

  const runWithProgress = async (title: string, action: (updateProgress: (pct: number, stepText: string) => Promise<void> | void) => Promise<void>) => {
    setProgressModalState({ isOpen: true, title, progress: 15, currentStepText: 'پێگەی 15%: ئامادەکردنی زانیاریەکان...' });
    await new Promise(r => setTimeout(r, 150));
    try {
      await action(async (pct, stepText) => {
        setProgressModalState({ isOpen: true, title, progress: pct, currentStepText: stepText });
        await new Promise(r => setTimeout(r, 120));
      });
      setProgressModalState({ isOpen: true, title, progress: 100, currentStepText: 'پێگەی 100%: پرۆسەکە بە سەرکەوتوویی تەواو بوو! ✅' });
      await new Promise(r => setTimeout(r, 400));
    } finally {
      setProgressModalState(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Load data from PostgreSQL and establish real-time Firestore synchronization
  useEffect(() => {
    // 1. Initial authoritative load from PostgreSQL
    const loadPgInitial = async () => {
      try {
        const [
          pgBranches, pgUsers, pgTreatments, pgRooms, pgPackages, pgTiers,
          pgComplaints, pgLabTests, pgPrescriptions, pgAuditLogs
        ] = await Promise.all([
          syncLoad<Branch>('branches', null, initialBranches),
          syncLoad<User>('users', null, initialUsers),
          syncLoad<Treatment>('treatments', null, initialTreatments),
          syncLoad<Room>('rooms', null, initialRooms),
          syncLoad<TreatmentPackage>('treatmentPackages', null, initialPackages),
          syncLoad<MembershipTierDetail>('membershipTiers', null, initialTiers),
          syncLoad<PatientComplaint>('patientComplaints', null, initialComplaints),
          syncLoad<LabTestOrder>('labTests', null, initialLabTests),
          syncLoad<Prescription>('prescriptions', null, initialPrescriptions),
          syncLoad<SystemAuditLog>('systemAuditLogs', null, initialSystemAuditLogs)
        ]);
        if (pgBranches.length > 0) setBranches(pgBranches);
        if (pgTreatments.length > 0) setTreatments(pgTreatments);
        if (pgRooms.length > 0) setRooms(pgRooms);
        if (pgPackages.length > 0) setTreatmentPackages(pgPackages);
        if (pgTiers.length > 0) setMembershipTiers(pgTiers);
        if (pgComplaints.length > 0) setPatientComplaints(pgComplaints);
        if (pgLabTests.length > 0) setLabTests(pgLabTests);
        if (pgPrescriptions.length > 0) setPrescriptions(pgPrescriptions);
        if (pgAuditLogs.length > 0) setSystemAuditLogs(pgAuditLogs);

        if (pgUsers.length > 0) {
          setAllUsers(pgUsers);
          const storedUser = sessionStorage.getItem('dunia_user_session');
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              const current = pgUsers.find(u => u.username === parsed.username);
              if (current) {
                setCurrentUser(current);
                setIsLoggedIn(true);
              }
            } catch (e) {
              sessionStorage.removeItem('dunia_user_session');
            }
          }
        }
      } catch (e) {
        console.warn("Notice loading initial database records:", e);
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadPgInitial();

    // 2. Real-time automatic Firestore listeners (no manual click needed!)
    const unsubBranches = subscribeCollection<Branch>('branches', null, (data) => setBranches(data));
    const unsubUsers = subscribeCollection<User>('users', null, (data) => {
      setAllUsers(data);
      const stored = sessionStorage.getItem('dunia_user_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const matched = data.find(u => u.username === parsed.username);
          if (matched) setCurrentUser(matched);
        } catch (e) {}
      }
    });
    const unsubTreatments = subscribeCollection<Treatment>('treatments', null, (data) => setTreatments(data));
    const unsubRooms = subscribeCollection<Room>('rooms', null, (data) => setRooms(data));
    const unsubPackages = subscribeCollection<TreatmentPackage>('treatmentPackages', null, (data) => setTreatmentPackages(data));
    const unsubComplaints = subscribeCollection<PatientComplaint>('patientComplaints', null, (data) => setPatientComplaints(data));
    const unsubLabTests = subscribeCollection<LabTestOrder>('labTests', null, (data) => setLabTests(data));
    const unsubPrescriptions = subscribeCollection<Prescription>('prescriptions', null, (data) => setPrescriptions(data));
    const unsubAudit = subscribeCollection<SystemAuditLog>('systemAuditLogs', null, (data) => setSystemAuditLogs(data));

    return () => {
      unsubBranches();
      unsubUsers();
      unsubTreatments();
      unsubRooms();
      unsubPackages();
      unsubComplaints();
      unsubLabTests();
      unsubPrescriptions();
      unsubAudit();
    };
  }, []);

  // Load branch-specific data automatically and listen in real-time
  useEffect(() => {
    if (!activeBranchId) return;

    // Clean up campaigns collection from Firestore if any existed
    try {
      getDocs(firestoreCollection(firestoreDb, 'campaigns')).then(snap => {
        snap.forEach(d => {
          deleteDoc(doc(firestoreDb, 'campaigns', d.id));
        });
      });
      dbApi.deleteDoc('campaigns', 'all').catch(() => {});
    } catch (e) {}

    const loadBranchData = async () => {
      try {
        const [pats, apps, exps, treats, invs] = await Promise.all([
          syncLoad<Patient>('patients', activeBranchId, initialPatients),
          syncLoad<Appointment>('appointments', activeBranchId, initialAppointments),
          syncLoad<Expense>('expenses', activeBranchId, initialExpenses),
          syncLoad<Treatment>('treatments', activeBranchId, initialTreatments),
          syncLoad<InventoryItem>('inventory', activeBranchId, initialInventory)
        ]);
        if (pats.length > 0) setPatients(pats);
        if (apps.length > 0) setAppointments(apps);
        if (exps.length > 0) setExpenses(exps);
        if (treats.length > 0) setTreatments(treats);
        if (invs.length > 0) setInventory(invs);
      } catch (err) {
        console.warn("Branch database load notice:", err);
      }
    };
    loadBranchData();

    // Real-time automatic listeners on branch data
    const unsubPatients = subscribeCollection<Patient>('patients', activeBranchId, (data) => setPatients(data));
    const unsubAppointments = subscribeCollection<Appointment>('appointments', activeBranchId, (data) => setAppointments(data));
    const unsubExpenses = subscribeCollection<Expense>('expenses', activeBranchId, (data) => setExpenses(data));
    const unsubInventory = subscribeCollection<InventoryItem>('inventory', activeBranchId, (data) => setInventory(data));

    return () => {
      unsubPatients();
      unsubAppointments();
      unsubExpenses();
      unsubInventory();
    };
  }, [activeBranchId]);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'super_admin' && currentUser.branchId) {
      setActiveBranchId(currentUser.branchId);
    } else if (!activeBranchId && branches.length > 0) {
      setActiveBranchId(branches[0].id);
    }
  }, [currentUser, branches]);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('clinic_tour_shown');
    if (!hasSeenTour) {
      setIsTourGuideOpen(true);
      localStorage.setItem('clinic_tour_shown', 'true');
    }
  }, []);

  const filteredPatients = patients.filter(p => !activeBranchId || p.branchId === activeBranchId);
  const filteredAppointments = appointments.filter(a => {
    const matchesBranch = !activeBranchId || a.branchId === activeBranchId;
    const recordYear = a.financialYear || (a.appointmentDate ? a.appointmentDate.split('-')[0] : '2026');
    const matchesYear = recordYear === activeFinancialYear;
    return matchesBranch && matchesYear;
  });

  const filteredExpenses = expenses.filter(e => {
    const matchesBranch = !activeBranchId || e.branchId === activeBranchId;
    const recordYear = e.financialYear || (e.date ? e.date.split('-')[0] : '2026');
    const matchesYear = recordYear === activeFinancialYear;
    return matchesBranch && matchesYear;
  });
  const filteredTreatments = treatments.filter(t => !activeBranchId || t.branchId === activeBranchId);

  if (!isDataLoaded) {
    return (
      <div dir="rtl" className="min-h-screen w-full bg-[#0a061e] text-slate-100 font-sans flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient background orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[55%] h-[55%] bg-purple-600/30 rounded-full blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-teal-600/30 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative z-10 space-y-6">
          <div className="w-20 h-20 bg-gradient-to-tr from-teal-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-teal-500/30 animate-bounce">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black bg-gradient-to-r from-teal-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
              سەنتەری جوانکاری و پزیشکی
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              سیستەمی بەڕێوەبردنی پێشکەوتووی لقەکان و حیسابات
            </p>
          </div>

          {/* Circular SVG Progress Ring */}
          <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-800 fill-none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * initProgress) / 100}
                strokeLinecap="round"
                className="fill-none transition-all duration-300 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-teal-400">{initProgress}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-300 animate-pulse">
              {initProgress < 40 ? 'ئامادەکردنی داتابەیس و داتای لقەکان...' : initProgress < 80 ? 'بەستنەوەی سەرکەوتوو بە PostgreSQL و Firestore...' : 'ئامادەکردنی ڕووکاری چوونەژوورەوە...'}
            </p>
            <p className="text-xs text-slate-500">بەڕێوەبردنی پارێزراو و خێرا</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !currentUser) {
    return (
      <LoginView
        users={allUsers}
        superAdminCreds={superAdminCreds}
        onLogin={(selectedUser) => {
          localStorage.setItem('dunia_user_session', JSON.stringify({ username: selectedUser.username }));
          setCurrentUser(selectedUser);
          setIsLoggedIn(true);
        }}
      />
    );
  }

  // 100% Real Financial & Patients stats calculation strictly from active database
  const totalRevenue = filteredAppointments
    .filter((a) => a.status === 'تەواوبوو' || a.status === 'لە ژوورەوەیە' || a.status === 'چاوەڕێ دەکات')
    .reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);

  const totalExpenseAmount = filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalDoctorSalaries = allUsers.filter(u => !activeBranchId || u.branchId === activeBranchId).reduce((acc, curr) => acc + (Number(curr.salary) || 0), 0);
  const netProfit = totalRevenue - totalExpenseAmount - totalDoctorSalaries;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayApps = filteredAppointments.filter(a => a.date === todayStr || (a as any).appointmentDate === todayStr);

  const curMonthKey = todayStr.substring(0, 7);
  const curMonthApps = filteredAppointments.filter(a => (a.date && a.date.startsWith(curMonthKey)) || ((a as any).appointmentDate && (a as any).appointmentDate.startsWith(curMonthKey)));
  const curMonthRev = curMonthApps
    .filter((a) => a.status === 'تەواوبوو' || a.status === 'لە ژوورەوەیە' || a.status === 'چاوەڕێ دەکات')
    .reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);
  const curMonthExps = filteredExpenses.filter(e => e.date && e.date.startsWith(curMonthKey));
  const curMonthExpTotal = curMonthExps.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const userPerms = currentUser.permissions || getDefaultPermissionsForRole(currentUser.role);
  const canViewTotalFin = currentUser.role === 'super_admin' || userPerms.canViewTotalFinancials;

  const stats: ClinicStats = {
    todayPatients: todayApps.length,
    weekPatients: filteredAppointments.filter(a => {
      const d = a.date || (a as any).appointmentDate;
      if (!d) return false;
      const diff = (new Date().getTime() - new Date(d).getTime()) / (1000 * 3600 * 24);
      return diff >= 0 && diff <= 7;
    }).length,
    monthPatients: curMonthApps.length,
    allTimePatients: filteredPatients.length,
    totalRevenue,
    totalExpenses: totalExpenseAmount,
    totalDoctorSalaries,
    netProfit,
    monthlyBreakdown: [
      {
        month: new Date().toLocaleDateString('ku-IQ', { month: 'long', year: 'numeric' }) || 'مانگی ئێستا',
        revenue: curMonthRev,
        expenses: curMonthExpTotal,
        profit: curMonthRev - curMonthExpTotal,
        patients: curMonthApps.length,
      }
    ],
    yearlyBreakdown: [
      {
        year: String(new Date().getFullYear()),
        revenue: totalRevenue,
        expenses: totalExpenseAmount,
        profit: netProfit,
        patients: filteredPatients.length,
      }
    ],
  };

  // Handlers
  const handleSwitchUser = (selectedUser: User) => {
    // Ensure permissions are attached
    const fullUser = {
      ...selectedUser,
      permissions: selectedUser.permissions || getDefaultPermissionsForRole(selectedUser.role),
    };
    setCurrentUser(fullUser);
    setIsLoggedIn(true);
    try {
      sessionStorage.setItem('dunia_user_session', JSON.stringify({ user: fullUser }));
      localStorage.removeItem('dunia_user_session');
    } catch (e) {}
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('dunia_user_session');
      localStorage.removeItem('dunia_user_session');
    } catch (e) {}
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleUpdateUserPermissions = async (userId: number, permissions: UserPermissions, role: UserRole) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions, role } : u));
    await syncSave('users', { id: userId, permissions, role });
  };

  const handleAddUser = async (userData: Omit<User, 'id'>) => {
    try {
      const newId = Date.now();
      const newUser: User = {
        ...userData,
        id: newId,
        uid: userData.uid || `usr-${newId}`,
        createdAt: new Date().toISOString(),
      };
      setAllUsers(prev => [newUser, ...prev]);
      await syncSave('users', newUser);

      notify({
        type: 'success',
        title: 'کارمەندی نوێ زیادکرا ✨',
        message: `هەژماری (${userData.name}) بە سەرکەوتوویی دروستکرا و دەتوانیت بە ناوی بەکارهێنەری "${userData.username}" بچێتە ژوورەوە.`,
      });
    } catch (error: any) {
      notify({ type: 'error', title: 'هەڵە لە دروستکردنی کارمەند', message: error.message });
    }
  };

  const checkCanDelete = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    const perms = currentUser.permissions || getDefaultPermissionsForRole(currentUser.role);
    return !!perms.canDeleteRecords;
  };

  const recordDeleteAudit = async (category: string, title: string) => {
    try {
      const auditItem: SystemAuditLog = {
        id: Date.now(),
        userId: currentUser?.id || 1,
        userName: currentUser?.name || 'سوپەر ئەدمین',
        userRole: currentUser?.role || 'super_admin',
        action: `سڕینەوەی ${category}`,
        module: category,
        details: `${currentUser?.name} تۆماری (${title}) لە سیستەم و داتابەیسی سەرەکی (PostgreSQL) سڕییەوە`,
        ipAddress: '127.0.0.1',
        timestamp: new Date().toISOString(),
        severity: 'ئاسایی'
      };
      setSystemAuditLogs(prev => [auditItem, ...prev]);
      await syncSave('systemAuditLogs', auditItem);
    } catch (e) {}
  };

  const handleDeleteUser = async (userId: number) => {
    if (!checkCanDelete()) {
      notify({
        type: 'error',
        title: 'مافی سڕینەوەت نییە ⚠️',
        message: 'تەنها سوپەر ئەدمین (Super Admin) دەتوانێت کارمەند یان پزیشک بسڕێتەوە.'
      });
      return;
    }
    if (currentUser && userId === currentUser.id) {
      alert('ناتوانیت ئەو هەژمارەی ئێستا تێیدایت بسڕیتەوە!');
      return;
    }
    const targetUser = allUsers.find(u => u.id === userId);
    const info = targetUser ? targetUser.name : `#${userId}`;
    if (!window.confirm(`ئایا دڵنیایت لە سڕینەوەی (${info}) لە لیستی کارمەندان و داتابەیس؟`)) {
      return;
    }
    setAllUsers(prev => prev.filter(u => u.id !== userId));
    await syncDelete('users', userId);
    await syncDelete('employeePayroll', userId);
    await syncDelete('staffAttendance', userId);
    await recordDeleteAudit('کارمەند / پزیشک', info);
    notify({
      type: 'success',
      title: 'کارمەند سڕایەوە 🗑️',
      message: `هەژماری (${info}) بە سەرکەوتوویی لە داتابەیس سڕایەوە.`
    });
  };

  const handleDeletePatient = async (patientId: number) => {
    if (!checkCanDelete()) {
      notify({
        type: 'error',
        title: 'مافی سڕینەوەت نییە ⚠️',
        message: 'تەنها سوپەر ئەدمین یان ئەو بەکارهێنەرانەی مافی سڕینەوەیان هەیە دەتوانن چارەخواز لە داتابەیس بسڕنەوە.'
      });
      return false;
    }
    const targetPatient = patients.find(p => p.id === patientId);
    const info = targetPatient ? targetPatient.name : `#${patientId}`;
    if (!window.confirm(`ئایا دڵنیایت لە سڕینەوەی چارەخواز (${info}) لە سیستەم و داتابەیس؟\nتەواوی دۆسیەی پزیشکی و پەیوەندییەکانی لە داتابەیس پاکدەکرێتەوە.`)) {
      return false;
    }
    setPatients(prev => prev.filter(p => p.id !== patientId));
    await syncDelete('patients', patientId);
    await recordDeleteAudit('چارەخواز', info);
    notify({
      type: 'success',
      title: 'چارەخواز سڕایەوە 🗑️',
      message: `دۆسیەی (${info}) لە سیستەم و داتابەیس سڕایەوە.`
    });
    return true;
  };

  const handleDeleteAppointment = async (appointmentId: number) => {
    if (!checkCanDelete()) {
      notify({
        type: 'error',
        title: 'مافی سڕینەوەت نییە ⚠️',
        message: 'تەنها سوپەر ئەدمین یان بەکارهێنەرانی ڕێپێدراو دەتوانن مەوعید لە داتابەیس بسڕنەوە.'
      });
      return false;
    }
    const app = appointments.find(a => a.id === appointmentId);
    const info = app ? `نۆرەی ${app.patientName} (${app.treatmentName})` : `#${appointmentId}`;
    if (!window.confirm(`ئایا دڵنیایت لە سڕینەوەی ئەم مەوعیدە (${info}) لە داتابەیس؟`)) {
      return false;
    }
    setAppointments(prev => prev.filter(a => a.id !== appointmentId));
    await syncDelete('appointments', appointmentId);
    await recordDeleteAudit('مەوعید', info);
    notify({
      type: 'success',
      title: 'مەوعید سڕایەوە 🗑️',
      message: `مەوعیدی (${info}) لە داتابەیس سڕایەوە.`
    });
    return true;
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!checkCanDelete()) {
      notify({
        type: 'error',
        title: 'مافی سڕینەوەت نییە ⚠️',
        message: 'تەنها سوپەر ئەدمین یان بەکارهێنەرانی ڕێپێدراو دەتوانن خەرجییەکان لە داتابەیس بسڕنەوە.'
      });
      return false;
    }
    const exp = expenses.find(e => e.id === expenseId);
    const info = exp ? `${exp.title} (${exp.amount.toLocaleString()} د.ع)` : `#${expenseId}`;
    if (!window.confirm(`ئایا دڵنیایت لە سڕینەوەی تۆماری خەرجی (${info}) لە داتابەیسی حیسابات؟`)) {
      return false;
    }
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    await syncDelete('expenses', expenseId);
    await recordDeleteAudit('خەرجی و مەسروفات', info);
    notify({
      type: 'success',
      title: 'خەرجی سڕایەوە 🗑️',
      message: `خەرجی (${info}) لە داتابەیس سڕایەوە.`
    });
    return true;
  };

  const handleDeleteInventoryItem = async (itemId: number) => {
    if (!checkCanDelete()) {
      notify({
        type: 'error',
        title: 'مافی سڕینەوەت نییە ⚠️',
        message: 'تەنها سوپەر ئەدمین یان بەکارهێنەرانی ڕێپێدراو دەتوانن کاڵا لە کۆگا و داتابەیس بسڕنەوە.'
      });
      return false;
    }
    const item = inventory.find(i => i.id === itemId);
    const info = item ? item.itemName : `#${itemId}`;
    if (!window.confirm(`ئایا دڵنیایت لە سڕینەوەی کاڵای (${info}) لە کۆگا و داتابەیس؟`)) {
      return false;
    }
    setInventory(prev => prev.filter(i => i.id !== itemId));
    await syncDelete('inventory', itemId);
    await recordDeleteAudit('کۆگا و ماددەکان', info);
    notify({
      type: 'success',
      title: 'کاڵا سڕایەوە 🗑️',
      message: `کاڵای (${info}) لە کۆگا و داتابەیس سڕایەوە.`
    });
    return true;
  };

  const handleDeletePackage = async (packageId: number) => {
    if (!checkCanDelete()) {
      notify({
        type: 'error',
        title: 'مافی سڕینەوەت نییە ⚠️',
        message: 'تەنها سوپەر ئەدمین دەتوانێت پاکێجی چارەسەری بسڕێتەوە.'
      });
      return false;
    }
    const pkg = treatmentPackages.find(p => p.id === packageId);
    const info = pkg ? pkg.packageName : `#${packageId}`;
    if (!window.confirm(`ئایا دڵنیایت لە سڕینەوەی پاکێجی (${info}) لە داتابەیس؟`)) {
      return false;
    }
    setTreatmentPackages(prev => prev.filter(p => p.id !== packageId));
    await syncDelete('treatmentPackages', packageId);
    await recordDeleteAudit('پاکێج', info);
    notify({
      type: 'success',
      title: 'پاکێج سڕایەوە 🗑️',
      message: `پاکێجی (${info}) لە داتابەیس سڕایەوە.`
    });
    return true;
  };

  const handleAddPatient = async (patientData: Omit<Patient, 'id' | 'patientCode' | 'totalSessionsCompleted'> & { registeredDate?: string; customRegistrationDate?: string; preferredDays?: string; branchId?: number }) => {
    await runWithProgress('تۆمارکردنی فایلی نەخۆشی نوێ ✨', async (update) => {
      update(30, 'پێگەی 30%: دروستکردنی پەڕەی پزیشکی و کۆدی نهێنی...');
      const newId = Date.now();
      const finalRegDate = patientData.registeredDate || patientData.customRegistrationDate || new Date().toISOString().split('T')[0];
      const targetBranchId = activeBranchId || patientData.branchId || currentUser?.branchId || 1;
      const newPatient: Patient = {
        ...patientData,
        id: newId,
        branchId: targetBranchId,
        patientCode: `PAT-10${newId.toString().slice(-4)}`,
        registeredDate: finalRegDate,
        preferredDays: patientData.preferredDays || 'شەممە، دووشەممە، چوارشەممە',
        totalSessionsCompleted: 1,
      };
      
      update(65, 'پێگەی 65%: پاشەکەوتکردن لە هەردوو داتابەیس (PostgreSQL & Firestore)...');
      setPatients(prev => [newPatient, ...prev]);
      await syncSave('patients', newPatient);

      update(85, 'پێگەی 85%: ناردنی پەیامی بەخێرهاتن (WhatsApp)...');
      const logId = Date.now() + 1;
      setWhatsappLogs(prev => [{
        id: logId,
        branchId: activeBranchId || 1,
        patientName: patientData.name,
        phone: patientData.phone,
        messageType: 'پەیامی بەخێرهاتن و هیوای درەوشاوەیی 💖',
        sentAt: 'ئێستا - ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'سەرکەوتوو (ڕاستەوخۆ نێردرا)',
        content: `🌸 سڵاو ${patientData.name}ی بەڕێز، بەخێر بێیت بۆ "سەنتەری جوانکاری ". زۆر خۆشحاڵین بە تۆمارکردنتان لە سیستەمەکەماندا. هیوای درەوشاوەیی و هەمیشە جوانبوونت بۆ دەخوازین! تیمەکەمان بەردەوام لە خزمەتتاندایە ✨💖`,
      }, ...prev]);

      update(100, 'پێگەی 100%: فایلی نەخۆش بە سەرکەوتوویی کرایەوە!');
      notify({
        type: 'whatsapp',
        title: 'فایلی نەخۆش + وەتسئەپ ✨',
        message: `فایلی پزیشکی بۆ (${patientData.name}) کرایەوە و پەیامی بەخێرهاتن نێردرا.`,
        targetTab: 'patients',
      });
    });
  };

  const handleUpdatePatient = async (id: number, updated: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    await syncSave('patients', { id, ...updated });
  };

  const handleAddAppointment = async (appData: Omit<Appointment, 'id' | 'whatsappReminder1DaySent' | 'whatsappReminderSameDaySent' | 'branchId'>) => {
    await runWithProgress('تۆمارکردنی نۆرە و سەردانی نوێ 📅', async (update) => {
      update(25, 'پێگەی 25%: هەژمارکردنی نرخ و داشکاندنی تایبەت...');
      let finalTreatmentPrice = appData.treatmentPrice;
      
      const patient = patients.find(p => p.id === appData.patientId);
      const personalDisc = patient?.personalDiscount || 0;
      const totalDiscountPct = Math.min(100, globalDiscount + personalDisc);

      if (totalDiscountPct > 0) {
        finalTreatmentPrice = finalTreatmentPrice - (finalTreatmentPrice * (totalDiscountPct / 100));
      }

      let finalPaidAmount = appData.paidAmount;
      if (appData.paidAmount >= appData.treatmentPrice) {
        finalPaidAmount = finalTreatmentPrice;
      }

      update(60, 'پێگەی 60%: پاشەکەوتکردنی نۆرە لە هەردوو داتابەیس...');
      const newId = Date.now();
      const newApp: Appointment = {
        ...appData,
        branchId: activeBranchId || (appData as any).branchId || currentUser?.branchId || 1,
        treatmentPrice: finalTreatmentPrice,
        paidAmount: finalPaidAmount,
        discountApplied: totalDiscountPct > 0 ? totalDiscountPct : 0,
        id: newId,
        whatsappReminder1DaySent: true,
        whatsappReminderSameDaySent: true,
      };
      
      setAppointments(prev => [newApp, ...prev]);
      await syncSave('appointments', newApp);

      update(85, 'پێگەی 85%: رێکخستنی بیرهێنانەوەی وەتس ئەپ...');
      const logId1 = Date.now() + 1;
      setWhatsappLogs(prev => [{
        id: logId1,
        branchId: activeBranchId || currentUser?.branchId || 1,
        patientName: appData.patientName,
        phone: appData.patientPhone,
        messageType: 'ئاگاداری ۱ ڕۆژ پێشتر (24h Reminder) 📅',
        sentAt: 'خۆکار (سبەی 06:00 PM)',
        status: 'سەرکەوتوو (ڕاستەوخۆ نێردرا)',
        content: `📅 بیرهێنانەوەی وەتس ئەپ: سڵاو ${appData.patientName}ی بەڕێز، نۆرەی جلسەی چارەسەریت سبەینێ لە بەرواری ${appData.appointmentDate} کاتژمێر ${appData.appointmentTime} دیاری کراوە.`,
      }, ...prev]);

      update(100, 'پێگەی 100%: نۆرە بە سەرکەوتوویی جێگیرکرا!');
      notify({
        type: 'success',
        title: 'نۆرەی نوێ جێگیرکرا 📅',
        message: `نۆرە لە بەرواری ${appData.appointmentDate} بۆ (${appData.patientName}) دیاری کرا.`,
        targetTab: 'appointments_whatsapp',
      });
    });
  };

  const handleUpdateAppointmentStatus = async (id: number, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    await syncSave('appointments', { id, status });

    if (status === 'تەواوبوو') {
      try {
        const foundApp = appointments.find(a => a.id === id);
        if (foundApp) {
          const tr = treatments.find(t => t.id === foundApp.treatmentId);
          if (tr && tr.consumables && tr.consumables.length > 0) {
            for (const cItem of tr.consumables) {
              setInventory(prev => prev.map(inv => {
                if (Number(inv.id) === Number(cItem.itemId)) {
                  const updatedStock = Math.max(0, (inv.currentStock || 0) - cItem.quantity);
                  syncSave('inventory', { ...inv, currentStock: updatedStock }).catch(() => {});
                  return { ...inv, currentStock: updatedStock };
                }
                return inv;
              }));
            }
          }

          fetch('/api/inventory/deduct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              branchId: foundApp.branchId, 
              treatmentId: foundApp.treatmentId 
            })
          }).catch(() => {});
        }
      } catch (error) {
        console.warn("Inventory deduction notice:", error);
      }
    }
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'branchId'>) => {
    const newId = Date.now();
    const newExp: Expense = {
      ...expenseData,
      branchId: activeBranchId || currentUser?.branchId || 1,
      id: newId,
      financialYear: activeFinancialYear || '2026',
    };
    setExpenses(prev => [newExp, ...prev.filter(e => e.id !== newId)]);
    await syncSave('expenses', newExp);
  };

  const handleUpdateSalary = async (doctorId: number, newSalary: number) => {
    setAllUsers(prev => prev.map(u => u.id === doctorId ? { ...u, salary: newSalary } : u));
    await syncSave('users', { id: doctorId, salary: newSalary });
    try {
      await syncSave('employeePayroll', { id: doctorId, basicSalary: newSalary, netSalary: newSalary });
    } catch (e) {}
  };

  const handleUpdateDoctor = async (doctorId: number, updatedData: Partial<User>) => {
    try {
      setAllUsers(prev => prev.map(u => u.id === doctorId ? { ...u, ...updatedData } : u));
      await syncSave('users', { id: doctorId, ...updatedData });
      notify({
        type: 'success',
        title: 'زانیاری پزیشک / کارمەند نوێکرایەوە ✨',
        message: 'وێنەی ڕووخسار و زانیارییەکان بە سەرکەوتوویی نوێکرانەوە.',
      });
    } catch (error: any) {
      notify({ type: 'error', title: 'هەڵە لە نوێکردنەوە', message: error.message });
    }
  };

  const handleAddDoctor = async (doctorData: Omit<User, 'id'>) => {
    const newId = Math.max(...allUsers.map(u => u.id), 0) + 1;
    try {
      const targetBranchId = activeBranchId || doctorData.branchId || currentUser?.branchId || 1;
      const newDoctor: User = {
        ...doctorData,
        id: newId,
        uid: doctorData.uid || `doc-${newId}`,
        branchId: targetBranchId,
        permissions: doctorData.permissions || getDefaultPermissionsForRole(doctorData.role),
        createdAt: new Date().toISOString(),
      };
      setAllUsers(prev => [newDoctor, ...prev]);
      await syncSave('users', newDoctor);

      // Also create their initial EmployeePayrollRecord in PostgreSQL so they are instantly prepared in the payroll list!
      const newPayroll: EmployeePayrollRecord = {
        id: newId,
        doctorId: newId,
        employeeName: doctorData.name,
        department: doctorData.specialty || (doctorData.role === 'doctor' ? 'بەشی پزیشکی و جوانکاری' : 'بەشی گشتی سەنتەر'),
        position: doctorData.role === 'doctor' ? 'پزیشکی پسپۆڕ' : 'کارمەندی سەنتەر',
        basicSalary: doctorData.salary || 1800000,
        overtimeHours: 0,
        overtimeRatePerHour: 0,
        bonus: 0,
        allowances: 0,
        taxDeduction: 0,
        penalties: 0,
        loanDeduction: 0,
        netSalary: doctorData.salary || 1800000,
        paymentStatus: 'لە چاوەڕوانیدایە',
        paymentDate: '',
      };
      await syncSave('employeePayroll', newPayroll);

      // Also create an attendance record for them
      const newAttendance: StaffAttendanceRecord = {
        id: newId,
        userId: newId,
        userName: doctorData.name,
        userRole: doctorData.role,
        userAvatar: doctorData.avatar || doctorData.facePhoto,
        branchId: doctorData.branchId || activeBranchId || 1,
        branchName: branches.find(b => b.id === (doctorData.branchId || activeBranchId))?.name || 'لقی سەرەکی',
        date: new Date().toISOString().split('T')[0],
        status: 'غائیبە (Absent)',
        shiftTitle: 'شەفتی بەیانیان (09:00 - 17:00)',
        scheduledStartTime: '09:00',
        scheduledEndTime: '17:00',
        lateMinutes: 0,
        earlyDepartureMinutes: 0,
        overtimeMinutes: 0,
        verificationMethod: 'ئۆتۆماتیکی سیستەم',
        isTamperProofVerified: true,
        penaltyDeductionAmount: 0,
        notes: 'تۆمارکراو لە سیستەم.',
      };
      await syncSave('staffAttendance', newAttendance);

      notify({
        type: 'success',
        title: 'پزیشک / کارمەندی نوێ زیادکرا ✨',
        message: `هەژماری (${doctorData.name}) بە سەرکەوتوویی دروستکرا و لە لیستی موچە و هاتن و چوون ئامادەکرا.`,
      });
    } catch (error: any) {
      notify({ type: 'error', title: 'هەڵە لە دروستکردنی پزیشک', message: error.message });
    }
  };

  const handleAddTreatment = async (treatmentData: Omit<Treatment, 'id' | 'branchId'>) => {
    const newId = Date.now();
    const newTr: Treatment = {
      ...treatmentData,
      branchId: activeBranchId || currentUser?.branchId || 1,
      id: newId,
    };
    setTreatments(prev => [newTr, ...prev]);
    await syncSave('treatments', newTr);
  };

  const handleUpdateTreatment = async (id: number, updated: Partial<Treatment>) => {
    setTreatments(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    await syncSave('treatments', { id, ...updated });
  };

  const handleDeleteTreatment = async (id: number) => {
    if (!checkCanDelete()) {
      notify({
        type: 'error',
        title: 'مافی سڕینەوەت نییە ⚠️',
        message: 'تەنها سوپەر ئەدمین یان بەکارهێنەرانی ڕێپێدراو دەتوانن خزمەتگوزاری بسڕنەوە.'
      });
      return;
    }
    const tr = treatments.find(t => t.id === id);
    const info = tr ? tr.name : `#${id}`;
    if (!window.confirm(`ئایا دڵنیایت لە سڕینەوەی خزمەتگوزاری (${info}) لە داتابەیس؟`)) {
      return;
    }
    setTreatments(prev => prev.filter(t => t.id !== id));
    await syncDelete('treatments', id);
    await recordDeleteAudit('خزمەتگوزاری', info);
    notify({
      type: 'success',
      title: 'خزمەتگوزاری سڕایەوە 🗑️',
      message: `خزمەتگوزاری (${info}) لە داتابەیس سڕایەوە.`
    });
  };

  const handleAddBranch = async (branchData: Omit<Branch, 'id' | 'createdAt'>) => {
    const newId = Date.now();
    const newBr: Branch = {
      ...branchData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBranches(prev => [...prev, newBr]);
    await syncSave('branches', newBr);
  };

  const handleUpdateBranch = async (id: number, updated: Partial<Branch>) => {
    setBranches(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
    await syncSave('branches', { id, ...updated });
  };

  const handleDeleteBranch = async (id: number) => {
    if (!checkCanDelete()) {
      notify({
        type: 'error',
        title: 'مافی سڕینەوەت نییە ⚠️',
        message: 'تەنها سوپەر ئەدمین دەتوانێت لق بسڕێتەوە.'
      });
      return;
    }
    if (id === 1) {
      alert('ناتوانیت لقی سەرەکی بسڕیتەوە!');
      return;
    }
    const br = branches.find(b => b.id === id);
    const info = br ? br.name : `#${id}`;
    if (!window.confirm(`ئایا دڵنیایت لە سڕینەوەی لقی (${info}) لە داتابەیس؟`)) {
      return;
    }
    setBranches(prev => prev.filter(b => b.id !== id));
    await syncDelete('branches', id);
    await recordDeleteAudit('لقەکانی سەنتەر', info);
    notify({
      type: 'success',
      title: 'لق سڕایەوە 🗑️',
      message: `لقی (${info}) لە داتابەیس سڕایەوە.`
    });
  };

  const handleAddRoom = async (roomData: Omit<Room, 'id' | 'branchId'>) => {
    const newId = Date.now();
    const newRm: Room = {
      ...roomData,
      branchId: activeBranchId || currentUser?.branchId || 1,
      id: newId,
    };
    await syncSave('rooms', newRm);
  };

  const handleUpdateRoom = async (id: number, updated: Partial<Room>) => {
    await syncSave('rooms', { id, ...updated });
  };

  const handleDeleteRoom = async (id: number) => {
    if (!checkCanDelete()) {
      notify({
        type: 'error',
        title: 'مافی سڕینەوەت نییە ⚠️',
        message: 'تەنها سوپەر ئەدمین دەتوانێت ژوور بسڕێتەوە.'
      });
      return;
    }
    const rm = rooms.find(r => r.id === id);
    const info = rm ? rm.name : `#${id}`;
    if (!window.confirm(`ئایا دڵنیایت لە سڕینەوەی (${info}) لە داتابەیس؟`)) {
      return;
    }
    setRooms(prev => prev.filter(r => r.id !== id));
    await syncDelete('rooms', id);
    await recordDeleteAudit('ژوورەکانی سەنتەر', info);
    notify({
      type: 'success',
      title: 'ژوور سڕایەوە 🗑️',
      message: `ژووری (${info}) لە داتابەیس سڕایەوە.`
    });
  };

  const handleSendWhatsappTest = async (patientName: string, phone: string, type: string) => {
    const newId = Date.now();
    const logItem: WhatsappLog = {
      id: newId,
      branchId: activeBranchId || currentUser?.branchId || 1,
      patientName,
      phone,
      messageType: 'ئاگاداری مەوعید',
      sentAt: 'ئێستا - ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'سەرکەوتوو',
      content: `[نامەی خۆکار] سڵاو ${patientName}، بیرهێنانەوەی مەوعیدی جوانکاریت لە سەنتەری جوانکاری.`,
    };
    setWhatsappLogs(prev => [logItem, ...prev]);
    
    notify({
      type: 'whatsapp',
      title: 'نامەی وەتسئەپ نێردرا 💬',
      message: `نامەی بیرهێنانەوەی ئۆتۆماتیکی ڕەوانە کرا بۆ (${patientName}).`,
      targetTab: 'appointments_whatsapp',
    });
  };

  const handleAddInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'branchId'>) => {
    const newId = Date.now();
    const item: InventoryItem = {
      ...itemData,
      branchId: activeBranchId || currentUser?.branchId || 1,
      id: newId,
    };
    setInventory(prev => [item, ...prev]);
    await syncSave('inventory', item);
  };

  const handleUpdateInventoryStock = async (id: number, newStock: number) => {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, currentStock: newStock } : i));
    await syncSave('inventory', { id, currentStock: newStock });
  };

  const handleAddPackage = async (pkgData: Omit<TreatmentPackage, 'id' | 'branchId'>) => {
    const newId = Date.now();
    const item: TreatmentPackage = {
      ...pkgData,
      branchId: activeBranchId || currentUser?.branchId || 1,
      id: newId,
    };
    setTreatmentPackages(prev => [item, ...prev]);
    await syncSave('treatmentPackages', item);
  };

  const handleAddComplaint = async (complaintData: Omit<PatientComplaint, 'id' | 'date' | 'branchId'>) => {
    const newId = Date.now();
    const item: PatientComplaint = {
      ...complaintData,
      branchId: activeBranchId || currentUser?.branchId || 1,
      id: newId,
      date: new Date().toISOString().split('T')[0],
    };
    setPatientComplaints(prev => [item, ...prev]);
    await syncSave('patientComplaints', item);
  };

  const handleAddLabTest = async (testData: Omit<LabTestOrder, 'id' | 'testCode' | 'branchId'>) => {
    const newId = Date.now();
    const item: LabTestOrder = {
      ...testData,
      branchId: activeBranchId || currentUser?.branchId || 1,
      id: newId,
      testCode: `LAB-9${Math.floor(100 + Math.random() * 900)}`,
    };
    setLabTests(prev => [item, ...prev]);
    await syncSave('labTests', item);
  };

  const handleUpdateTestResult = async (
    id: number,
    resultValue: string,
    status: LabTestOrder['status'],
    notes?: string
  ) => {
    setLabTests(prev => prev.map(t => t.id === id ? { ...t, resultValue, status, technicianNotes: notes } : t));
    await syncSave('labTests', { id, resultValue, status, technicianNotes: notes });
  };

  const handleAddPrescription = async (
    prescriptionData: Omit<Prescription, 'id' | 'prescriptionCode' | 'qrCode' | 'branchId'>
  ) => {
    const newId = Date.now();
    const item: Prescription = {
      ...prescriptionData,
      branchId: activeBranchId || currentUser?.branchId || 1,
      id: newId,
      prescriptionCode: `RX-${Math.floor(5000 + Math.random() * 4000)}`,
      qrCode: `QR-RX-${Math.floor(5000 + Math.random() * 4000)}-2026`,
    };
    setPrescriptions(prev => [item, ...prev]);
    await syncSave('prescriptions', item);
  };

  const isTabAllowed = currentUser ? hasTabAccess(currentUser, activeTab) : false;

  if (!isLoggedIn || !currentUser) {
    return (
      <LoginView
        users={allUsers.length > 0 ? allUsers : initialUsers}
        superAdminCreds={superAdminCreds}
        onLogin={(user) => {
          const fullUser = {
            ...user,
            permissions: user.permissions || getDefaultPermissionsForRole(user.role),
          };
          setCurrentUser(fullUser);
          setIsLoggedIn(true);
          try {
            sessionStorage.setItem('dunia_user_session', JSON.stringify({ user: fullUser }));
            localStorage.removeItem('dunia_user_session');
          } catch (e) {}
        }}
      />
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#040b16] text-slate-100 font-sans relative flex flex-col overflow-hidden selection:bg-teal-500 selection:text-slate-950">
      {/* Background Atmosphere Orbs & Avatar Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#040b16]">
        {/* Bioluminescent Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-600/30 rounded-full blur-[130px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-fuchsia-600/30 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-teal-400/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Moving Stars */}
        {[...Array(40)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-10px`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}

        {/* Glowing Lines (Crazy but not too many) */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`line-${i}`}
            className="glowing-line"
            style={{
              left: `${15 + i * 20}%`,
              top: `${Math.random() * 100}%`,
              height: `${Math.random() * 400 + 150}px`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

    <div className="flex flex-col h-screen overflow-hidden bg-transparent relative">
      {!isTvFullscreen ? (
        <>
          {/* Main Full-Width Header */}
          <div className="sticky top-0 z-50 w-full">
            <Header
              currentUser={currentUser}
              allUsers={allUsers}
              onSwitchUser={handleSwitchUser}
              onOpenTvMode={() => setIsTvFullscreen(true)}
              onOpenQrScanner={() => setIsQrScannerOpen(true)}
              onOpenOfflineModal={() => setIsOfflineModalOpen(true)}
              onOpenTourGuide={() => setIsTourGuideOpen(true)}
              activeTab={activeTab}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onLogout={handleLogout}
              financialYears={financialYears}
              activeFinancialYear={activeFinancialYear}
              onSelectFinancialYear={setActiveFinancialYear}
              branches={branches}
              activeBranchId={activeBranchId}
            />
          </div>

          {/* Body Area with Sidebar and Main View */}
          <div className="flex flex-1 overflow-hidden relative">
            <div className="sticky top-0 h-full">
              <Sidebar
                activeTab={activeTab}
                setActiveTab={handleSetActiveTab}
                currentUser={currentUser}
                pendingQueueCount={filteredAppointments.filter((a) => a.status === 'چاوەڕێ دەکات').length}
                onLogout={handleLogout}
                branches={branches}
                activeBranchId={activeBranchId}
                onBranchChange={setActiveBranchId}
              />
            </div>

            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
              {!isTabAllowed ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-900/60 backdrop-blur-xl rounded-[36px] border border-white/10 shadow-md space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-white">بەشێکی بەستراو (Access Restricted)</h3>
                  <p className="text-sm text-slate-400 max-w-md">
                    تۆ مافی چوونە ژوورەوە یان دەستکاریت نییە بۆ ئەم بەشەی سیستەمەکە. دەسەڵاتەکانت تەنها لەلایەن **سوپەر ئەدمین (Super Admin)** هەموار دەکرێنەوە.
                  </p>
                  <button
                    onClick={() => handleSetActiveTab('dashboard')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-slate-950 font-black rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    گەڕانەوە بۆ داشبۆڕد
                  </button>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <DashboardView
                      stats={stats}
                      todayAppointments={filteredAppointments}
                      currentUser={currentUser}
                      patients={filteredPatients}
                      doctors={allUsers.filter(u => !activeBranchId || u.branchId === activeBranchId)}
                      canViewTotal={canViewTotalFin}
                      onOpenTvMode={() => setIsTvFullscreen(true)}
                      onNavigateTab={handleSetActiveTab}
                      onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                      onOpenNewAppointment={() => handleSetActiveTab('appointments_whatsapp')}
                      onOpenNewPatient={() => handleSetActiveTab('patients')}
                    />
                  )}

                  {activeTab === 'crm_packages' && (
                    <CrmPackagesView
                      patients={patients}
                      packages={treatmentPackages}
                      onAddPackage={handleAddPackage}
                      onUpdatePatient={handleUpdatePatient}
                      activeBranchId={activeBranchId}
                    />
                  )}

                  {activeTab === 'inventory' && (
                    <SmartInventoryView
                      inventory={inventory.filter(i => !activeBranchId || i.branchId === activeBranchId)}
                      onAddInventoryItem={handleAddInventoryItem}
                      onUpdateStock={handleUpdateInventoryStock}
                    />
                  )}

                  {activeTab === 'bi_analytics' && (
                    <BiAnalyticsView
                      appointments={filteredAppointments}
                      expenses={filteredExpenses}
                      patients={filteredPatients}
                      doctors={allUsers.filter(u => !activeBranchId || u.branchId === activeBranchId)}
                      treatments={filteredTreatments}
                    />
                  )}

                  {activeTab === 'tv_board' && (
                    <TvBoardView
                      appointments={filteredAppointments}
                      onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                      onOpenNewAppointment={() => handleSetActiveTab('appointments_whatsapp')}
                    />
                  )}

                  {activeTab === 'patients' && (
                    <PatientsView
                      patients={filteredPatients}
                      appointments={filteredAppointments}
                      doctors={allUsers.filter(u => !activeBranchId || u.branchId === activeBranchId)}
                      treatments={filteredTreatments}
                      onAddPatient={handleAddPatient}
                      onUpdatePatient={handleUpdatePatient}
                      onAddAppointment={handleAddAppointment}
                      onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                      onOpenTvMode={() => setIsTvFullscreen(true)}
                      activeBranchId={activeBranchId}
                      branches={branches}
                      currentUser={currentUser}
                    />
                  )}

                  {activeTab === 'appointments_whatsapp' && (
                    <AppointmentsWhatsappView
                      appointments={filteredAppointments}
                      patients={filteredPatients}
                      treatments={filteredTreatments}
                      doctors={allUsers.filter(u => !activeBranchId || u.branchId === activeBranchId)}
                      whatsappLogs={whatsappLogs.filter(w => !activeBranchId || w.branchId === activeBranchId)}
                      globalDiscount={globalDiscount}
                      onAddAppointment={handleAddAppointment}
                      onSendWhatsappTest={handleSendWhatsappTest}
                      onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                      onOpenTvMode={() => setIsTvFullscreen(true)}
                      activeBranchId={activeBranchId}
                      branches={branches}
                    />
                  )}

                  {activeTab === 'financials' && (
                    <FinancialsView
                      expenses={filteredExpenses}
                      doctors={allUsers.filter(u => !activeBranchId || u.branchId === activeBranchId)}
                      totalRevenue={totalRevenue}
                      onAddExpense={handleAddExpense}
                      canViewTotal={canViewTotalFin}
                      onNavigateTab={handleSetActiveTab}
                      currentUser={currentUser}
                      branches={branches}
                      activeBranchId={activeBranchId}
                      activeFinancialYear={activeFinancialYear}
                      financialYears={financialYears}
                      onSelectFinancialYear={handleSelectFinancialYear}
                      onAddFinancialYear={handleAddFinancialYear}
                    />
                  )}

                  {activeTab === 'staff_sales_rewards' && (
                    <BranchStaffSalesRewardsView
                      activeBranchId={activeBranchId}
                      branches={branches}
                      staffUsers={allUsers}
                      inventory={inventory}
                      onUpdateInventory={setInventory}
                      onAddExpense={handleAddExpense}
                      currentUser={currentUser}
                    />
                  )}

                  {activeTab === 'monthly_financial_cards' && (
                    <MonthlyFinancialCardsView
                      appointments={filteredAppointments}
                      expenses={filteredExpenses}
                      branches={branches}
                      activeBranchId={activeBranchId}
                      currentUser={currentUser}
                      onAddExpense={handleAddExpense}
                    />
                  )}

                  {activeTab === 'consolidated_branches' && (
                    <ConsolidatedBranchesView
                      branches={branches}
                      allPatients={patients}
                      allAppointments={appointments}
                      allExpenses={expenses}
                      allUsers={allUsers}
                      totalRevenue={totalRevenue}
                    />
                  )}

                  {activeTab === 'doctors' && (
                    <DoctorsView
                      doctors={allUsers}
                      branches={branches}
                      onUpdateSalary={handleUpdateSalary}
                      onAddDoctor={handleAddDoctor}
                      onUpdateDoctor={handleUpdateDoctor}
                      currentUser={currentUser}
                      activeBranchId={activeBranchId}
                    />
                  )}

                  {activeTab === 'staff_attendance' && (
                    <StaffAttendanceView
                      doctors={allUsers}
                      branches={branches}
                      activeBranchId={activeBranchId}
                      currentUser={currentUser}
                    />
                  )}





                  {activeTab === 'audit_security' && (
                    <AuditSecurityView
                      auditLogs={systemAuditLogs}
                      allUsers={allUsers}
                    />
                  )}

                   {activeTab === 'settings' && (
                    <AdminSettingsView
                      treatments={filteredTreatments}
                      rooms={rooms}
                      userRole={currentUser.role}
                      currentUser={currentUser}
                      allUsers={allUsers.filter(u => !activeBranchId || u.branchId === activeBranchId)}
                      branches={branches}
                      globalDiscount={globalDiscount}
                      superAdminCreds={superAdminCreds}
                      onUpdateSuperAdminCreds={(u, p) => {
                        setSuperAdminCreds({ username: u, password: p });
                        try {
                          localStorage.setItem('donia_superadmin_creds', JSON.stringify({ username: u, password: p }));
                          const adminUser = allUsers.find(user => user.role === 'super_admin');
                          if (adminUser) {
                            syncSave('users', { id: adminUser.id, username: u, password: p }).catch(console.error);
                          }
                        } catch (e) {}
                      }}
                      onSetGlobalDiscount={(disc) => {
                        setGlobalDiscount(disc);
                        try {
                          localStorage.setItem('donia_global_discount', String(disc));
                        } catch (e) {}
                      }}
                      onAddTreatment={handleAddTreatment}
                      onUpdateTreatment={handleUpdateTreatment}
                      onDeleteTreatment={handleDeleteTreatment}
                      onAddRoom={handleAddRoom}
                      onUpdateRoom={handleUpdateRoom}
                      onDeleteRoom={handleDeleteRoom}
                      onUpdateUserPermissions={handleUpdateUserPermissions}
                      onAddUser={handleAddUser}
                      onDeleteUser={handleDeleteUser}
                      onAddBranch={handleAddBranch}
                      onUpdateBranch={handleUpdateBranch}
                      onDeleteBranch={handleDeleteBranch}
                      financialYears={financialYears}
                      activeFinancialYear={activeFinancialYear}
                      onAddFinancialYear={handleAddFinancialYear}
                      onSelectFinancialYear={setActiveFinancialYear}
                    />
                  )}
                </>
              )}
            </main>
          </div>
        </>
      ) : (
        <div className="fixed inset-0 z-50 bg-slate-950">
          <TvBoardView
            appointments={appointments}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            onOpenNewAppointment={() => setActiveTab('appointments')}
          />
        </div>
      )}
    </div>

      {/* Raycast / Global Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        patients={patients}
        appointments={appointments}
        doctors={allUsers}
        onNavigateTab={handleSetActiveTab}
      />

      {/* QR Code / Barcode Scanner Modal */}
      <QrScanModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        patients={patients}
        onSelectPatient={(p) => {
          setScannedPatientProfile(p);
          setIsQrScannerOpen(false);
        }}
      />

      {/* Offline Mode / PWA Modal */}
      <OfflineModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
      />

      {/* Tour Guide Modal */}
      <TourGuideModal
        isOpen={isTourGuideOpen}
        onClose={() => setIsTourGuideOpen(false)}
      />

      {/* Patient Profile Modal triggered from QR Scan */}
      {scannedPatientProfile && (
        <PatientProfileModal
          patient={scannedPatientProfile}
          appointments={appointments}
          doctors={allUsers}
          treatments={treatments}
          defaultTab="qrcode"
          activeBranchId={activeBranchId}
          branches={branches}
          currentUser={currentUser}
          onAddAppointment={handleAddAppointment}
          onUpdatePatient={handleUpdatePatient}
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          onOpenTvMode={() => setIsTvFullscreen(true)}
          onClose={() => setScannedPatientProfile(null)}
        />
      )}

      {/* Fullscreen TV Broadcast Overlay Mode */}
      {isTvFullscreen && (
        <TvBoardView
          appointments={appointments}
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          onOpenNewAppointment={() => {
            setIsTvFullscreen(false);
            setActiveTab('appointments');
          }}
          onCloseTvMode={() => setIsTvFullscreen(false)}
          isFullscreen={true}
        />
      )}

      {/* Global Action Progress Modal with Percentage */}
      <ActionProgressModal
        isOpen={progressModalState.isOpen}
        title={progressModalState.title}
        progress={progressModalState.progress}
        currentStepText={progressModalState.currentStepText}
      />
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <MainAppContent />
    </NotificationProvider>
  );
}

