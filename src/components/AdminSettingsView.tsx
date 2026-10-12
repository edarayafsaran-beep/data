import React, { useState, useEffect } from 'react';
import { Room, Treatment, User, UserPermissions, UserRole, Branch } from '../types';
import {
  Settings,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Zap,
  CheckCircle2,
  Building,
  Key,
  UserPlus,
  X,
  SlidersHorizontal,
  DoorOpen,
  Building2,
  Users,
  Stethoscope,
  Layers,
  MessageSquare,
  Send,
  Smartphone,
  Globe,
  Copy,
  Check,
  ExternalLink,
  BellRing,
  Bot,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  HelpCircle,
  Sparkles,
  Info,
  Gift,
  Database,
  Download,
  Upload,
  Clock,
  RefreshCw,
  FileText,
  MapPin,
  Calendar,
  AlertTriangle,
  HardDrive,
  Table,
} from 'lucide-react';
import {
  STANDARD_AESTHETIC_PROCEDURES,
  STANDARD_PROCEDURE_CATEGORIES,
} from '../constants/standardPresets';
import {
  getDefaultPermissionsForRole,
  modulePermissionList,
  actionPermissionList,
} from '../utils/permissions';
import { resetDatabase } from '../lib/dataSync';

interface AdminSettingsViewProps {
  treatments: Treatment[];
  rooms: Room[];
  userRole: UserRole;
  currentUser: User;
  allUsers: User[];
  branches: Branch[];
  globalDiscount?: number;
  superAdminCreds: { username: string; password: string };
  onUpdateSuperAdminCreds: (username: string, password: string) => void;
  onSetGlobalDiscount?: (val: number) => void;
  onAddTreatment: (treatment: Omit<Treatment, 'id' | 'branchId'>) => void;
  onUpdateTreatment: (id: number, updated: Partial<Treatment>) => void;
  onDeleteTreatment: (id: number) => void;
  onAddRoom: (room: Omit<Room, 'id' | 'branchId'>) => void;
  onUpdateRoom: (id: number, updated: Partial<Room>) => void;
  onDeleteRoom: (id: number) => void;
  onUpdateUserPermissions: (userId: number, permissions: UserPermissions, role: UserRole) => void;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onDeleteUser?: (userId: number) => void;
  onAddBranch: (branch: Omit<Branch, 'id' | 'createdAt'>) => void;
  onUpdateBranch: (id: number, updated: Partial<Branch>) => void;
  onDeleteBranch: (id: number) => void;
  financialYears?: string[];
  activeFinancialYear?: string;
  onAddFinancialYear?: (year: string) => void;
  onSelectFinancialYear?: (year: string) => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  treatments,
  rooms,
  userRole,
  currentUser,
  allUsers,
  branches,
  globalDiscount = 0,
  superAdminCreds,
  onUpdateSuperAdminCreds,
  onSetGlobalDiscount,
  onAddTreatment,
  onUpdateTreatment,
  onDeleteTreatment,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onUpdateUserPermissions,
  onAddUser,
  onDeleteUser,
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  financialYears = ['2025', '2026'],
  activeFinancialYear = '2026',
  onAddFinancialYear,
  onSelectFinancialYear,
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  // Navigation sub-tabs inside Admin Settings
  const [activeSubTab, setActiveSubTab] = useState<'whatsapp' | 'rooms' | 'treatments' | 'users' | 'branches' | 'database' | 'super_admin' | 'general' | 'financial_years'>('financial_years');

  const [newYearInput, setNewYearInput] = useState('2027');

  const navItems = [
    {
      id: 'financial_years',
      label: 'ساڵە داراییەکان و ئارشیف',
      subLabel: 'دروستکردنی ساڵی نوێ و حیسابات',
      icon: Calendar,
      badge: activeFinancialYear,
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    },
    {
      id: 'branches',
      label: 'بەڕێوەبردنی لقەکان',
      subLabel: `لقەکانی کلینیک (${branches.length})`,
      icon: Building2,
      badge: `${branches.length} لق`,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'whatsapp',
      label: 'ڕێکخستنەکانی وەتس ئەپ',
      subLabel: 'WhatsApp Business Cloud',
      icon: MessageSquare,
      badge: 'چالاکە',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'rooms',
      label: 'ژوورەکانی کلینیک',
      subLabel: `بەڕێوەبردنی ژوورەکان (${rooms.length})`,
      icon: DoorOpen,
      badge: `${rooms.length} ژوور`,
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    },
    {
      id: 'treatments',
      label: 'جۆرەکانی چارەسەر',
      subLabel: `خیلاجەکان و نرخ (${treatments.length})`,
      icon: Zap,
      badge: `${treatments.length} خیلاج`,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      id: 'users',
      label: 'کارمەندان و دەسەڵاتەکان',
      subLabel: `بەکاربهێنەران و ڕۆڵەکان (${allUsers.length})`,
      icon: Users,
      badge: `${allUsers.length} کەس`,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'database',
      label: 'داتابەیس، باک ئەپ و ڕیستۆر',
      subLabel: 'باک ئەپ و گەڕاندنەوەی داتا (Backup & Restore)',
      icon: Database,
      badge: 'هەور و باک ئەپ',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'super_admin',
      label: 'ئاسایشی سوپەر ئەدمین',
      subLabel: 'Username & Password',
      icon: ShieldCheck,
      badge: 'ئاسایش',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
    {
      id: 'general',
      label: 'ڕێکخستنە گشتییەکان',
      subLabel: 'زانیاری کلینیک، داشکاندن و زمان',
      icon: Building,
      badge: 'گشتی',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
  ];

  // Super Admin Credentials state
  const [adminUsername, setAdminUsername] = useState(superAdminCreds?.username || 'super_admin');
  const [adminPassword, setAdminPassword] = useState(superAdminCreds?.password || '1234');
  const [adminCredsSuccess, setAdminCredsSuccess] = useState(false);

  const handleSaveAdminCreds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword) return;
    onUpdateSuperAdminCreds(adminUsername, adminPassword);
    setAdminCredsSuccess(true);
    setTimeout(() => setAdminCredsSuccess(false), 3000);
  };

  // Backup & Restore state
  const [backupsList, setBackupsList] = useState<Array<{ filename: string; size: number; createdAt: string }>>([]);
  const [backupMsg, setBackupMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoringFilename, setRestoringFilename] = useState<string | null>(null);
  const [restoreConfirmModal, setRestoreConfirmModal] = useState<{
    show: boolean;
    type: 'server_file' | 'local_upload';
    filename?: string;
    fileContent?: any;
  }>({ show: false, type: 'server_file' });

  // PostgreSQL DB Config State
  useEffect(() => {
    fetchBackups();
  }, []);

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    setBackupMsg({ text: 'خەریکی دروستکردنی باک ئەپی تەواوەتی داتابەیسە...', type: 'info' });
    try {
      const res = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setBackupMsg({
          text: `باک ئەپ بە سەرکەوتوویی دروستکرا! فایلی (${data.filename}) هەڵگیرا.`,
          type: 'success'
        });
        fetchBackups();
      } else {
        setBackupMsg({ text: data.error || 'هەڵە لە دروستکردنی باک ئەپ!', type: 'error' });
      }
    } catch (e: any) {
      setBackupMsg({ text: 'هەڵە لە پەیوەندی بە سێرڤەر: ' + e.message, type: 'error' });
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setBackupMsg(null), 7000);
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backup/list');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBackupsList(data);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`ئایا دڵنیایت لە سڕینەوەی ئەم فایلی باک ئەپە؟\n(${filename})`)) return;
    try {
      const res = await fetch(`/api/backup/delete/${filename}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBackupMsg({ text: 'فایلی باک ئەپ بە سەرکەوتوویی سڕایەوە', type: 'success' });
        fetchBackups();
      }
    } catch (e: any) {
      setBackupMsg({ text: 'هەڵە لە سڕینەوەی باک ئەپ: ' + e.message, type: 'error' });
    }
    setTimeout(() => setBackupMsg(null), 5000);
  };

  const handleRestoreFromFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string);
        setRestoreConfirmModal({
          show: true,
          type: 'local_upload',
          filename: file.name,
          fileContent: jsonContent
        });
      } catch (err) {
        setBackupMsg({ text: 'فایلی هەڵبژێردراو نادروستە یان فۆرماتی JSON نییە!', type: 'error' });
        setTimeout(() => setBackupMsg(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTriggerServerRestore = (filename: string) => {
    setRestoreConfirmModal({
      show: true,
      type: 'server_file',
      filename
    });
  };

  const executeRestore = async () => {
    setIsRestoring(true);
    setBackupMsg({ text: 'خەریکی گەڕاندنەوەی سەرجەم داتاکانە بۆ داتابەیس...', type: 'info' });
    try {
      let bodyData: any = {};
      if (restoreConfirmModal.type === 'server_file') {
        bodyData = { filename: restoreConfirmModal.filename };
      } else {
        bodyData = { backupData: restoreConfirmModal.fileContent };
      }

      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (data.success) {
        setBackupMsg({
          text: data.message || `داتابەیس بە سەرکەوتوویی گەڕێنرایەوە! سەرجەم (${data.restoredTotal || ''}) دۆکیومێنت نوێکرانەوە.`,
          type: 'success'
        });
        setRestoreConfirmModal({ show: false, type: 'server_file' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setBackupMsg({ text: data.error || 'هەڵە لە گەڕاندنەوەی باک ئەپ!', type: 'error' });
      }
    } catch (err: any) {
      setBackupMsg({ text: 'هەڵە لە پرۆسەی گەڕاندنەوە: ' + err.message, type: 'error' });
    } finally {
      setIsRestoring(false);
      setTimeout(() => setBackupMsg(null), 8000);
    }
  };

  // Modals state
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [showAddTreatmentModal, setShowAddTreatmentModal] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // New & Edit Branch form state
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchPhoneNumbersStr, setBranchPhoneNumbersStr] = useState('');

  // New & Edit Room form state
  const [roomName, setRoomName] = useState('');
  const [roomDepartment, setRoomDepartment] = useState('بەشی لەیزەر و جوانکاری');
  const [roomDoctor, setRoomDoctor] = useState('');
  const [roomCapacity, setRoomCapacity] = useState<number>(2);
  const [roomStatus, setRoomStatus] = useState<'چالاک' | 'نائامادە' | 'سیانە'>('چالاک');

  // New & Edit Treatment form state
  const [trtName, setTrtName] = useState('');
  const [trtDescription, setTrtDescription] = useState('');
  const [trtPrice, setTrtPrice] = useState<number>(30000);
  const [trtDurationMinutes, setTrtDurationMinutes] = useState<number>(35);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('doctor');
  const [newUserSpecialty, setNewUserSpecialty] = useState('');
  const [newUserSalary, setNewUserSalary] = useState<number>(1500000);
  const [newUserBranchId, setNewUserBranchId] = useState<number | null>(null);

  // Editing User Permissions state
  const [tempPermissions, setTempPermissions] = useState<UserPermissions>(
    getDefaultPermissionsForRole('doctor')
  );
  const [tempRole, setTempRole] = useState<UserRole>('doctor');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // General System settings state
  const [clinicName, setClinicName] = useState('سەنتەری جوانکاری ');
  const [clinicPhone, setClinicPhone] = useState('0750 111 2233');
  const [clinicAddress, setClinicAddress] = useState('سلێمانی - بەرامبەر نەخۆشخانەی فێرکاری');
  const [workingHours, setWorkingHours] = useState('09:00 AM - 08:00 PM');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // WhatsApp API Configuration state
  const [waPhoneNumber, setWaPhoneNumber] = useState('0750 111 2233');
  const [waAccountId, setWaAccountId] = useState('108492048201948');
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('109382049281048');
  const [waAccessToken, setWaAccessToken] = useState('EAAGk1...meta_cloud_token_dunia_2026');
  const [waShowToken, setWaShowToken] = useState(false);
  const [waWebhookUrl, setWaWebhookUrl] = useState('https://api.duniaclinic.com/webhook/whatsapp');
  const [waWebhookVerifyToken, setWaWebhookVerifyToken] = useState('dunia_clinic_verify_2026');

  // Auto Messaging Toggles
  const [waAuto24h, setWaAuto24h] = useState(true);
  const [waAutoSameDay, setWaAutoSameDay] = useState(true);
  const [waAutoCompletion, setWaAutoCompletion] = useState(true); // Automatic message when therapy session finishes!

  // Message Template customization
  const [waCompletionMsgTemplate, setWaCompletionMsgTemplate] = useState(
    '🏁 سوپاس بۆ سەردانەکەت: سڵاو {patient_name}ی بەڕێز، جلسەی جوانکاری و لەیزەری ئەمڕۆت لە "{clinic_name}" بەسەرکەوتوویی بەکۆتا هات. هیوای درەوشاوەیی و هەمیشە جوان بوونت بۆ دەخوازین! تکایە کرێمی دژەخۆر و ڕێنماییەکان لەبیر مەکە. هەمیشە بەخێر بێن! 🌟'
  );

  const [testPhone, setTestPhone] = useState('07501234567');
  const [testSentSuccess, setTestSentSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [waSavedSuccess, setWaSavedSuccess] = useState(false);

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleSaveWaSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setWaSavedSuccess(true);
    setTimeout(() => setWaSavedSuccess(false), 2500);
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;
    const phoneList = branchPhoneNumbersStr.split(/[,,\n]/).map(s => s.trim()).filter(Boolean);
    if (branchPhone && !phoneList.includes(branchPhone)) {
      phoneList.unshift(branchPhone);
    }
    onAddBranch({
      name: branchName,
      address: branchAddress,
      phone: branchPhone || phoneList[0] || '',
      phoneNumbers: phoneList.length > 0 ? phoneList : [branchPhone || '07500000000'],
    });
    setBranchName('');
    setBranchAddress('');
    setBranchPhone('');
    setBranchPhoneNumbersStr('');
    setShowAddBranchModal(false);
  };

  const handleUpdateBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !branchName.trim()) return;
    const phoneList = branchPhoneNumbersStr.split(/[,,\n]/).map(s => s.trim()).filter(Boolean);
    if (branchPhone && !phoneList.includes(branchPhone)) {
      phoneList.unshift(branchPhone);
    }
    onUpdateBranch(editingBranch.id, {
      name: branchName,
      address: branchAddress,
      phone: branchPhone || phoneList[0] || '',
      phoneNumbers: phoneList.length > 0 ? phoneList : [branchPhone || '07500000000'],
    });
    setEditingBranch(null);
    setBranchPhoneNumbersStr('');
  };

  const handleOpenEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchName(branch.name);
    setBranchAddress(branch.address || '');
    setBranchPhone(branch.phone || '');
    setBranchPhoneNumbersStr(branch.phoneNumbers ? branch.phoneNumbers.join(', ') : (branch.phone || ''));
  };

  const handleSendTestWaMessage = () => {
    if (!testPhone) return;
    setTestSentSuccess(true);
    setTimeout(() => setTestSentSuccess(false), 3000);
  };

  // ------------------ ROOM HANDLERS ------------------
  const handleOpenAddRoom = () => {
    setRoomName('');
    setRoomDepartment('بەشی لەیزەر و جوانکاری');
    setRoomDoctor(allUsers.find((u) => u.role === 'doctor')?.name || '');
    setRoomCapacity(2);
    setRoomStatus('چالاک');
    setShowAddRoomModal(true);
  };

  const handleOpenEditRoom = (rm: Room) => {
    setEditingRoom(rm);
    setRoomName(rm.name);
    setRoomDepartment(rm.department || 'بەشی لەیزەر و جوانکاری');
    setRoomDoctor(rm.doctorInCharge || '');
    setRoomCapacity(rm.capacity || 2);
    setRoomStatus(rm.status);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    onAddRoom({
      name: roomName,
      department: roomDepartment,
      doctorInCharge: roomDoctor,
      capacity: Number(roomCapacity),
      status: roomStatus,
    });

    setShowAddRoomModal(false);
  };

  const handleSaveEditRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom || !roomName.trim()) return;

    onUpdateRoom(editingRoom.id, {
      name: roomName,
      department: roomDepartment,
      doctorInCharge: roomDoctor,
      capacity: Number(roomCapacity),
      status: roomStatus,
    });

    setEditingRoom(null);
  };

  // ------------------ TREATMENT HANDLERS ------------------
  const handleOpenAddTreatment = () => {
    setTrtName('');
    setTrtDescription('');
    setTrtPrice(30000);
    setTrtDurationMinutes(35);
    setShowAddTreatmentModal(true);
  };

  const handleOpenEditTreatment = (t: Treatment) => {
    setEditingTreatment(t);
    setTrtName(t.name);
    setTrtDescription(t.description);
    setTrtPrice(t.price);
    setTrtDurationMinutes(t.durationMinutes);
  };

  const handleCreateTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trtName.trim() || !trtPrice) return;

    onAddTreatment({
      name: trtName,
      description: trtDescription,
      price: Number(trtPrice),
      durationMinutes: Number(trtDurationMinutes),
    });

    setShowAddTreatmentModal(false);
  };

  const handleSaveEditTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTreatment || !trtName.trim()) return;

    onUpdateTreatment(editingTreatment.id, {
      name: trtName,
      description: trtDescription,
      price: Number(trtPrice),
      durationMinutes: Number(trtDurationMinutes),
    });

    setEditingTreatment(null);
  };

  // ------------------ USER HANDLERS ------------------
  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserUsername || !newUserPassword) return;

    onAddUser({
      uid: `u-${Date.now()}`,
      username: newUserUsername,
      password: newUserPassword,
      name: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      role: newUserRole,
      branchId: newUserBranchId || 1,
      specialty: newUserSpecialty || 'کارمەندی کلینیک',
      salary: Number(newUserSalary),
      permissions: getDefaultPermissionsForRole(newUserRole),
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserUsername('');
    setNewUserPassword('');
    setNewUserPhone('');
    setNewUserSpecialty('');
    setShowAddUserModal(false);
  };

  const handleOpenEditUserModal = (usr: User) => {
    if (!isSuperAdmin) {
      alert('تەنها سوپەر ئەدمین (Super Admin) مافی دەستکاریکردنی دەسەڵاتەکانی هەیە.');
      return;
    }
    setEditingUser(usr);
    setTempRole(usr.role);
    setTempPermissions(
      usr.permissions || getDefaultPermissionsForRole(usr.role)
    );
  };

  const handleSaveUserPermissions = () => {
    if (!editingUser) return;
    onUpdateUserPermissions(editingUser.id, tempPermissions, tempRole);
    setSaveSuccessMsg(`دەسەڵاتەکانی (${editingUser.name}) بە سەرکەوتوویی نوێکرانەوە!`);
    setTimeout(() => {
      setSaveSuccessMsg('');
      setEditingUser(null);
    }, 1200);
  };

  const handleApplyRoleTemplate = (role: UserRole) => {
    setTempRole(role);
    setTempPermissions(getDefaultPermissionsForRole(role));
  };

  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-3 py-1 border text-xs font-bold rounded-full flex items-center gap-1 ${
                isSuperAdmin
                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                  : 'bg-slate-800 border-white/10 text-slate-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              {isSuperAdmin ? 'پانێڵی کۆنترۆڵی سوپەر ئەدمین (Super Admin)' : 'دەسەڵاتی دیاریکراو'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            بەڕێوەبردنی ژوورەکان، چارەسەرەکان، دەسەڵاتەکان و ڕێکخستنی سیستەم
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            زیادکردن و دەستکاریکردنی ژوورەکان (Rooms)، خیلاجەکان (Treatments)، کارمەندان و تێکڕای هەڵبژاردنەکانی کلینیک.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAddRoom}
              className="px-4 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 rounded-2xl text-xs font-black text-slate-950 flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <DoorOpen className="w-4 h-4 text-slate-950" />
              <span>ژووری نوێ</span>
            </button>

            <button
              onClick={handleOpenAddTreatment}
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-teal-400 hover:brightness-110 rounded-2xl text-xs font-black text-slate-950 flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>چارەسەری نوێ</span>
            </button>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:brightness-110 rounded-2xl text-xs font-black text-slate-950 flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>کارمەندی نوێ</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings Panel Grid Layout with Internal Sidebar on the Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Section Content Area (Left side in RTL) */}
        <div className="order-2 lg:order-1 lg:col-span-8 xl:col-span-9 space-y-6">

      {/* SUB-TAB 0: BRANCHES MANAGEMENT */}
      {activeSubTab === 'database' && (
        <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-indigo-500/40 shadow-md space-y-6">
          <h4 className="text-lg font-black text-indigo-300 flex items-center gap-2 border-b border-white/10 pb-4">
            <Database className="w-5 h-5 text-indigo-400" /> سیستەمی داتابەیسی هەور (Firebase Cloud)
          </h4>

          <div className="p-6 bg-indigo-500/10 border border-indigo-500/30 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h5 className="text-white font-black">داتاکانت پارێزراون لە هەوردا</h5>
                <p className="text-xs text-slate-400">سیستەمەکە ئێستا Firebase Firestore بەکاردەهێنێت کە زانیارییەکان لە سێرڤەرە جیهانییەکانی گوگڵ پاشەکەوت دەکات.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-slate-500">جۆری داتابەیس:</span>
                <div className="text-indigo-300 font-bold">Real-time NoSQL Firestore</div>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-slate-500">دۆخی پاراستن:</span>
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> چالاک و ئۆنڵاین
                </div>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-400 italic">
              * هەموو گۆڕانکارییەک کە ئەنجامی دەدەیت، ڕاستەوخۆ لە هەموو ئەو ئامێرانەی کە سیستەمەکەیان لێ کراوەتەوە نوێ دەبێتەوە.
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB: FINANCIAL YEARS & ARCHIVING */}
      {activeSubTab === 'financial_years' && (
        <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-teal-500/30 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-teal-400" /> بەڕێوەبردنی ساڵە داراییەکان و ئارشیف (Financial Years & Archiving)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                سوپەر ئەدمین دەتوانێت ساڵی دارایی نوێ دروست بکات، حیساباتی ساڵی نوێ دەست پێبکات، و لەنێوان ساڵە جیاوازەکاندا بگوازێتەوە بۆ پشکنینی حیسابات و قازانجی پار.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 border border-teal-500/40 rounded-2xl text-teal-300 font-black text-xs">
              <span>ساڵی دارایی چالاک:</span>
              <span className="font-mono text-sm">{activeFinancialYear}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create New Financial Year Card */}
            <div className="bg-slate-950/90 p-6 rounded-3xl border border-teal-500/40 shadow-md space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">دروستکردنی ساڵی دارایی نوێ</h4>
                  <p className="text-[10px] text-slate-400">حیسابات پاکدەبێتەوە بۆ ساڵی نوێ</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">ساڵی نوێ (بۆ نموونە: 2027)</label>
                  <input
                    type="text"
                    value={newYearInput}
                    onChange={(e) => setNewYearInput(e.target.value)}
                    placeholder="2027"
                    className="w-full p-3 bg-slate-900 border border-white/15 rounded-xl text-teal-300 font-mono font-bold outline-none focus:border-teal-400 text-center text-lg"
                  />
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-[11px] text-amber-300/90 leading-relaxed">
                  ⚠️ <strong>تێبینی گرنگ:</strong> کاتێک ساڵی دارایی نوێ دروست دەکەیت، حیسابات و داهات و مەسرەفەکان بۆ ساڵی نوێ سفر و پاک دەبنەوە، لەکاتێکدا **ناوی نەخۆشەکان، بەکارمەندەکان، ئایتم و کەرەستەکان وەک خۆیان و بەبێ هیچ فەوتانێک دەمێننەوە**.
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!newYearInput.trim()) return;
                    if (onAddFinancialYear) onAddFinancialYear(newYearInput.trim());
                  }}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-black rounded-xl shadow-md hover:brightness-110 transition-all cursor-pointer"
                >
                  دروستکردنی ساڵی دارایی ({newYearInput})
                </button>
              </div>
            </div>

            {/* List of Financial Years & Switcher */}
            <div className="bg-slate-950/90 p-6 rounded-3xl border border-white/10 shadow-md space-y-4 md:col-span-2">
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-400" /> ساڵە داراییە تۆمارکراوەکان و گەڕانەوە بۆ ساڵەکانی پار
              </h4>
              <p className="text-xs text-slate-400">
                هەر کاتێک سەیری حیسابات، داهات، مەسرەف و پوختەی قازانجی ساڵێکی ڕابردوو بکەیت، تەنها بە کرتەیەک ساڵەکە بگۆڕە:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {financialYears.map((yr) => {
                  const isActive = yr === activeFinancialYear;
                  return (
                    <div
                      key={yr}
                      className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-teal-500/15 border-teal-500/50 shadow-[0_0_20px_rgba(45,212,191,0.2)]'
                          : 'bg-slate-900/80 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-sm ${isActive ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                          {yr}
                        </div>
                        <div>
                          <h5 className="text-sm font-black text-white">ساڵی دارایی {yr}</h5>
                          <p className="text-[10px] text-slate-400">
                            {isActive ? '🟢 ساڵی چالاکی ئێستا' : '📁 ئارشیفی حیساباتی ساڵی پار'}
                          </p>
                        </div>
                      </div>

                      {!isActive && (
                        <button
                          onClick={() => {
                            if (onSelectFinancialYear) onSelectFinancialYear(yr);
                          }}
                          className="px-3 py-1.5 bg-white/10 hover:bg-teal-500 hover:text-slate-950 rounded-xl text-xs font-bold transition-all text-teal-300 cursor-pointer"
                        >
                          گۆڕین بۆ {yr}
                        </button>
                      )}
                      {isActive && (
                        <span className="text-xs font-bold text-teal-300 bg-teal-500/20 px-3 py-1 rounded-xl border border-teal-500/30">
                          ئێستا تێیدایت
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-900/60 border border-white/10 p-4 rounded-2xl text-xs text-slate-300 space-y-2 mt-4">
                <p className="font-bold text-white">💡 ڕێنمایی بەکارهێنان:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>کاتێک ساڵێک هەڵدەبژێریت (بۆ نموونە 2025)، تەواوی داشبۆڕد، ڕاپۆرتی حیسابات، داهات و قازانجی ئەو ساڵەت نیشان دەدات.</li>
                  <li>هەموو نەخۆشەکان و پێداویستییەکان بەردەوام لە هەموو ساڵەکاندا وەک خۆیان بە یەکگرتوویی دەمێننەوە.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 0: BRANCHES MANAGEMENT */}
      {activeSubTab === 'branches' && (
        <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" /> بەڕێوەبردنی لقەکانی کلینیک (Clinic Branches)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                سوپەر ئەدمین دەتوانێت لقی نوێ زیاد بکات و زانیاری لقەکان نوێ بکاتەوە.
              </p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setBranchName('');
                  setBranchAddress('');
                  setBranchPhone('');
                  setShowAddBranchModal(true);
                }}
                className="px-4 py-2 bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow hover:brightness-110 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>زیادکردنی لق</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="bg-slate-950/80 p-6 rounded-3xl border border-white/10 hover:border-cyan-500/40 transition-all shadow-md space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white">{branch.name}</h4>
                      <p className="text-[10px] text-slate-500">ID: #{branch.id} • دروستکراوە لە: {branch.createdAt}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-400">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    {branch.address || 'ناونیشان دیاری نەکراوە'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-500" />
                    {branch.phone || 'ژمارەی تەلەفۆن دیاری نەکراوە'}
                  </p>
                </div>

                {isSuperAdmin && (
                  <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditBranch(branch)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>دەستکاری</span>
                    </button>
                    <button
                      onClick={() => onDeleteBranch(branch.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 1: CLINIC ROOMS MANAGEMENT */}
      {activeSubTab === 'rooms' && (
        <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-emerald-400" /> بەڕێوەبردنی ژوورەکانی کلینیک (Clinic Rooms)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                سوپەر ئەدمین دەتوانێت ژووری نوێ زیاد بکات، ناو و بەشی ژوور بگۆڕێت، یان نائامادە و دیاری بکات.
              </p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={handleOpenAddRoom}
                className="px-4 py-2 bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow hover:brightness-110 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>زیادکردنی ژوور</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((rm) => (
              <div
                key={rm.id}
                className="bg-slate-950/80 p-6 rounded-3xl border border-white/10 hover:border-emerald-500/40 transition-all shadow-md flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-bold">
                      #{rm.id} • {rm.department || 'چارەسەر'}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        rm.status === 'چالاک'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : rm.status === 'سیانە'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {rm.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-white flex items-center gap-2">
                      <DoorOpen className="w-5 h-5 text-teal-400" />
                      {rm.name}
                    </h4>
                    <div className="text-xs text-slate-400 space-y-1 mt-2">
                      <p className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                        <span>پزیشکی بەرپرس: </span>
                        <strong className="text-slate-200">{rm.doctorInCharge || 'دیاری نەکراوە'}</strong>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>قابلیەتی وەرگرتن: </span>
                        <strong className="text-teal-300 font-mono">{rm.capacity || 2} نەخۆش بەیەکەوە</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {isSuperAdmin && (
                  <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditRoom(rm)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-teal-300 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                      <span>دەستکاری</span>
                    </button>

                    <button
                      onClick={() => onDeleteRoom(rm.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold transition-all"
                      title="سڕینەوەی ژوور"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TREATMENTS (خیلاجەکان) MANAGEMENT */}
      {activeSubTab === 'treatments' && (
        <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-pink-400" /> جۆرەکانی خزمەتگوزاری و چارەسەری جوانکاری لە سەنتەردا (Beauty Services & Pricing)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                سوپەر ئەدمین دەتوانێت خزمەتگوزاری نوێ تۆمار بکات، نرخ و کاتەکەی یان ناوی چارەسەر دەستکاری بکات.
              </p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={handleOpenAddTreatment}
                className="px-4 py-2 bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow hover:brightness-110 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>چارەسەری نوێ</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {treatments.map((t) => (
              <div
                key={t.id}
                className="bg-slate-950/80 p-6 rounded-3xl border border-white/10 hover:border-teal-500/40 transition-all shadow-md flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
                      {t.durationMinutes} خولەک
                    </span>
                    <span className="text-lg font-black text-emerald-300 font-mono">
                      {t.price.toLocaleString('en-US')} د.ع
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white">{t.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{t.description}</p>
                </div>

                {isSuperAdmin && (
                  <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditTreatment(t)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-teal-300 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                      <span>دەستکاریکردن</span>
                    </button>

                    <button
                      onClick={() => onDeleteTreatment(t.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold transition-all"
                      title="سڕینەوە"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: USERS & PERMISSIONS MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-3">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" /> دەسەڵاتی بەکارهێنەران و بەڕێوەبردنی کارمەندان (User Permissions & Roles)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تەنها **سوپەر ئەدمین** دەتوانێت دەسەڵاتی بینین و کارکردن لەسەر بەشەکانی سیستەم بۆ کارمەندان دیاری بکات.
              </p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2 bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>کارمەندی نوێ</span>
              </button>
            )}
          </div>

          {/* Explanation Banner */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-bold text-white">کۆنترۆڵی تەواوی دەسەڵاتەکان (Granular Role-Based Access Control):</strong>
              <p className="text-slate-300 leading-relaxed">
                بۆ هەر کارمەند یان ئەدمینێک کە لە سیستەمدا دروست دەکرێت، دەتوانیت لە ڕێگەی دوگمەی <strong>"دەستکاریکردنی دەسەڵاتەکان"</strong> بە ئارەزووی خۆت دیاری بکەیت کام بەش و کام تایبەتمەندی ببینێت. بەم شێوەیە کارمەندەکە تەنها ئەو بەشانە دەبینێت کە پێویستن بۆ کارەکەی و ناتوانێت هەموو شتێکی ناو سیستەمەکە ببینی.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allUsers.map((usr) => {
              const userPerms = usr.permissions || getDefaultPermissionsForRole(usr.role);
              const activePermsCount = Object.values(userPerms).filter(Boolean).length;

              return (
                <div
                  key={usr.id}
                  className={`p-6 rounded-3xl border transition-all shadow-md flex flex-col justify-between space-y-4 ${
                    usr.id === currentUser.id
                      ? 'bg-gradient-to-b from-slate-950 to-slate-900 border-teal-500/40 ring-1 ring-teal-500/30'
                      : 'bg-slate-950/80 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                          usr.role === 'super_admin'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : usr.role === 'doctor'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : usr.role === 'accountant'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                        }`}
                      >
                        {usr.role === 'super_admin'
                          ? 'سوپەر ئەدمین'
                          : usr.role === 'doctor'
                          ? 'پزیشک'
                          : usr.role === 'receptionist'
                          ? 'ڕێپێدان'
                          : usr.role === 'accountant'
                          ? 'ژمێریار'
                          : 'بەڕێوەبەر'}
                      </span>

                      {usr.id === currentUser.id && (
                        <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                          تۆیت (ئۆنلاین)
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-black text-white">{usr.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{usr.specialty || usr.email}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{usr.email}</p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">بەشە ڕێگەپێدراوەکان:</span>
                      <span className="font-mono text-teal-300 font-bold bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                        {activePermsCount} دەسەڵات
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEditUserModal(usr)}
                      disabled={!isSuperAdmin}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        isSuperAdmin
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 active:scale-95'
                          : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>دەستکاریکردنی دەسەڵاتەکان</span>
                    </button>

                    {isSuperAdmin && onDeleteUser && usr.role !== 'super_admin' && (
                      <button
                        onClick={() => onDeleteUser(usr.id)}
                        className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold transition-all"
                        title="سڕینەوەی کارمەند"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: GENERAL & SYSTEM SETTINGS */}
      {activeSubTab === 'general' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-5 h-5 text-teal-400" />
            <h3 className="text-xl font-black text-white">ڕێکخستنە گشتییەکان و سیستەم</h3>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* 1. Clinic Branding */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[36px] border border-white/10 shadow-md space-y-6">
              <h4 className="text-lg font-black text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <Info className="w-5 h-5 text-blue-400" /> زانیارییە بنەڕەتییەکانی کلینیک
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">ناوی کلینیک</label>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-teal-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">ژمارەی پەیوەندی</label>
                  <input
                    type="text"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white font-mono outline-none focus:border-teal-400"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-300 mb-1 font-bold">ناونیشانی تەواو</label>
                  <input
                    type="text"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-teal-400"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-300 mb-1 font-bold">کاتی دەوامی فەرمی</label>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            </div>

            {/* 2. Financial & Discounts */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[36px] border border-white/10 shadow-md space-y-6">
              <h4 className="text-lg font-black text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <Gift className="w-5 h-5 text-emerald-400" /> دارایی و داشکاندن
              </h4>
              <div className="grid grid-cols-1 gap-6 text-xs">
                <div>
                  <label className="block text-emerald-400 mb-1 font-bold flex items-center gap-2">
                    <Gift className="w-4 h-4" /> داشکاندنی گشتی بۆ هەموو نەخۆشەکان (٪)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={globalDiscount}
                    onChange={(e) => onSetGlobalDiscount && onSetGlobalDiscount(Number(e.target.value))}
                    className="w-full p-3.5 bg-slate-950 border border-emerald-500/50 rounded-2xl text-emerald-400 outline-none focus:border-emerald-400 font-bold"
                    placeholder="بۆ نموونە: 15"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">ئەگەر لە 0 زیاتر بێت، ئەم داشکاندنە بۆ هەموو مەوعیدەکان حیساب دەکرێت تا دەیسڕیتەوە.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-1 font-bold">دراوی سەرەکی سیستەم</label>
                    <select className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-teal-400">
                      <option value="IQD">دیناری عێراقی (IQD)</option>
                      <option value="USD">دۆلاری ئەمریکی (USD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-bold">باجی سەرەوە (٪)</label>
                    <input
                      type="number"
                      defaultValue={0}
                      className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-teal-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Notifications & AI Preferences */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[36px] border border-white/10 shadow-md space-y-6">
              <h4 className="text-lg font-black text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <BellRing className="w-5 h-5 text-amber-400" /> ئاگادارکردنەوەکان و ژیری دەستکرد
              </h4>
              <div className="space-y-4 text-xs">
                <label className="flex items-center justify-between p-3.5 bg-slate-950 border border-white/10 rounded-2xl cursor-pointer hover:border-amber-400/50 transition-colors">
                  <div>
                    <div className="text-white font-bold text-sm">ناردنی وەتس ئەپی خۆکار</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">بەشێوەیەکی خۆکار نامەی بیرخستنەوە بۆ نەخۆش دەنێرێت</div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </div>
                </label>
                
                <label className="flex items-center justify-between p-3.5 bg-slate-950 border border-white/10 rounded-2xl cursor-pointer hover:border-amber-400/50 transition-colors">
                  <div>
                    <div className="text-white font-bold text-sm">ژیری دەستکردی کلینیک (AI Assistant)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">یارمەتیدەر بۆ شیکردنەوەی داتا و ڕاپۆرتەکان</div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </div>
                </label>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">کاتی بیرخستنەوەی نۆرە (پێشتر)</label>
                  <select className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-400">
                    <option value="24">٢٤ کاتژمێر پێشتر</option>
                    <option value="12">١٢ کاتژمێر پێشتر</option>
                    <option value="2">٢ کاتژمێر پێشتر</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. UI & Localization */}
            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[36px] border border-white/10 shadow-md space-y-6">
              <h4 className="text-lg font-black text-white flex items-center gap-2 border-b border-white/10 pb-4">
                <Globe className="w-5 h-5 text-purple-400" /> ڕووکار و زمان
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">زمانی سیستەم</label>
                  <select className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-400">
                    <option value="ku">کوردی (سۆرانی)</option>
                    <option value="ar">عەرەبی (العربية)</option>
                    <option value="en">ئینگلیزی (English)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">ڕەنگی ڕووکار (Theme)</label>
                  <select className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-400">
                    <option value="dark">تاریک (Dark Mode) - پێشنیارکراو</option>
                    <option value="light">ڕووناک (Light Mode)</option>
                    <option value="system">بەپێی سیستەم (Auto)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-300 mb-1 font-bold">شێوازی پیشاندانی خشتەکان</label>
                  <select className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-purple-400">
                    <option value="compact">چڕ و بچووککراوە (Compact)</option>
                    <option value="comfortable">فراوان و ئاسوودە (Comfortable)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons for all General Settings */}
            <div className="xl:col-span-2 flex items-center justify-between pt-6 border-t border-white/10">
              {savedSuccess && (
                <span className="text-teal-400 font-bold text-sm flex items-center gap-1.5 animate-pulse bg-teal-500/10 px-4 py-2 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" /> هەموو ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران!
                </span>
              )}
              <div className="mr-auto">
                <button
                  onClick={handleSaveSystemSettings}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-md active:scale-95 transition-all flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  پاشەکەوتکردنی گۆڕانکارییەکان
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: SUPER ADMIN SECURITY & CREDENTIALS */}
      {activeSubTab === 'super_admin' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-black text-white">ئاسایشی سوپەر ئەدمین و تێپەڕەوشە</h3>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-amber-500/40 shadow-md space-y-6">
            <h4 className="text-lg font-black text-amber-300 flex items-center gap-2 border-b border-white/10 pb-4">
              <ShieldCheck className="w-5 h-5 text-amber-400" /> گۆڕینی ناوی بەکارهێنەر و تێپەڕەوشەی سوپەر ئەدمین (Super Admin Credentials)
            </h4>
            <form onSubmit={handleSaveAdminCreds} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">ناوی بەکارهێنەری سوپەر ئەدمین (Username)</label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">تێپەڕەوشەی نوێ (Password)</label>
                  <input
                    type="text"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-amber-200 outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {adminCredsSuccess && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> زانیارییەکانی سوپەر ئەدمین بە سەرکەوتوویی نوێکرانەوە!
                  </span>
                )}
                <button
                  type="submit"
                  className="mr-auto px-6 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black rounded-2xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>پاشەکەوتکردنی زانیارییەکانی سوپەر ئەدمین</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB: CLOUD DATABASE & COMPREHENSIVE BACKUP & RESTORE */}
      {activeSubTab === 'database' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6 text-indigo-400" />
                <h3 className="text-xl font-black text-white">ناوەندی داتابەیس، باک ئەپ و ڕیستۆر (Backup & Restore Center)</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                پاراستنی زانیارییەکان لە هەوردا (Google Cloud Firestore) لەگەڵ ئەنجامدانی باک ئەپ و گەڕاندنەوەی سەرجەم داتاکان بە یەک کلیک
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleManualBackup}
                disabled={isBackingUp || isRestoring}
                className="px-5 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 active:scale-95 text-slate-950 font-black rounded-2xl shadow-lg flex items-center gap-2 text-xs transition cursor-pointer"
              >
                {isBackingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>دروستکردنی باک ئەپی نوێ (1-Click Backup)</span>
              </button>

              <label className="px-5 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:brightness-110 active:scale-95 text-white font-black rounded-2xl shadow-lg flex items-center gap-2 text-xs transition cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>گەڕاندنەوە لە فایل (Restore from File)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFromFileInput}
                  disabled={isBackingUp || isRestoring}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('ئایا دڵنیایت لە سڕینەوەی هەموو داتای تاقیکاری و پاککردنەوەی حیساباتەکان؟ ئەم کردارە نەگەڕێنەرەوەیە!')) {
                    await resetDatabase();
                    alert('داتابەیس بە سەرکەوتوویی پاککرایەوە و سیستەمەکە ڕیستارت دەبێتەوە.');
                    window.location.reload();
                  }
                }}
                disabled={isBackingUp || isRestoring}
                className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-lg flex items-center gap-2 text-xs transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>پاککردنەوەی هەموو داتای تاقیکاری</span>
              </button>
            </div>
          </div>

          {/* Status Message Notification Banner */}
          {backupMsg && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 shadow-md animate-in fade-in duration-200 ${
                backupMsg.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                  : backupMsg.type === 'error'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
              }`}
            >
              {backupMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : backupMsg.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
              )}
              <span className="flex-1">{backupMsg.text}</span>
            </div>
          )}

          {/* Cloud Firestore Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-[28px] border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">داتابەیسی سەرەکی (Cloud DB)</span>
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Database className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-black text-white">Google Cloud Firestore</div>
              <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> سێرڤەری هەور چالاک و بەستراوەتەوە
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-[28px] border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">باک ئەپە هەڵگیراوەکان</span>
                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl">
                  <HardDrive className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-black text-white">{backupsList.length} فایلی باک ئەپ</div>
              <div className="text-[11px] text-cyan-300 font-medium">ئامادەیە بۆ داگرتن و گەڕاندنەوەی خێرا</div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-[28px] border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">باک ئەپی خۆکاری ڕۆژانە</span>
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-black text-white">کاتژمێر 17:00 (5:00 PM)</div>
              <div className="text-[11px] text-purple-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> هەموو ڕۆژێك لە کاتی داخستنی کلینیک
              </div>
            </div>
          </div>

          {/* Backups List and Management */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-teal-400" />
                <div>
                  <h4 className="text-base font-black text-white">لیستی باک ئەپە هەڵگیراوەکان (Backup History)</h4>
                  <p className="text-[11px] text-slate-400">دەتوانیت هەر باک ئەپێک دابگریتە ناو کۆمپیوتەرەکەت یان ڕاستەوخۆ بیکەیتەوە بە سەر داتابەیسەکەدا</p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchBackups}
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>نوێکردنەوەی لیست</span>
              </button>
            </div>

            {backupsList.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-3xl border border-dashed border-white/10 space-y-3">
                <Database className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-400">هیچ فایلی باک ئەپێک تا ئێستا دروست نەکراوە</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  کلیک لەسەر دوگمەی "دروستکردنی باک ئەپی نوێ" بکە بۆ دروستکردنی کۆپییەکی پارێزراو لە هەموو زانیارییەکانی کلینیک.
                </p>
                <button
                  type="button"
                  onClick={handleManualBackup}
                  disabled={isBackingUp}
                  className="mt-2 px-5 py-2.5 bg-teal-400 text-slate-950 font-black rounded-xl text-xs hover:brightness-110 active:scale-95 transition"
                >
                  دروستکردنی یەکەمین باک ئەپ
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {backupsList.map((backup, idx) => {
                  const sizeKB = (backup.size / 1024).toFixed(1);
                  return (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/80 hover:bg-slate-950 border border-white/10 hover:border-teal-500/40 rounded-2xl transition-all gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 shrink-0 mt-0.5 sm:mt-0">
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-white font-mono flex items-center gap-2">
                            <span>{backup.filename}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-cyan-300 font-sans">
                              {sizeKB} KB
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              {new Date(backup.createdAt).toLocaleDateString('ku-IQ', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {new Date(backup.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <a
                          href={`/api/backup/download/${backup.filename}`}
                          download
                          className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                          title="داگرتنی فایل بۆ ناو کۆمپیوتەر"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>داگرتن</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleTriggerServerRestore(backup.filename)}
                          disabled={isRestoring}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow"
                          title="گەڕاندنەوەی تەواوی داتابەیس بەم فایلە"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>گەڕاندنەوە (Restore)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBackup(backup.filename)}
                          disabled={isRestoring}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs transition"
                          title="سڕینەوەی باک ئەپ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Backup & Restore Instructions Box */}
          <div className="bg-indigo-950/30 border border-indigo-500/30 p-6 rounded-[32px] space-y-4">
            <h4 className="text-sm font-black text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> ڕێنمایی گرنگ دەربارەی باک ئەپ و گەڕاندنەوەی داتاکان
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/5 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-teal-400" /> چۆن باک ئەپ دەپارێزرێت؟
                </span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  کاتێک کلیک لەسەر دروستکردنی باک ئەپ دەکەیت، سیستەم سەرجەم لقەکان، نەخۆشەکان، مەوعیدەکان، حیسابات و مەسروفات، مەخزەن، نرخەکان و تەواوی دۆکیومێنتەکان لە فایلی JSON لە سێرڤەر و کۆمپیوتەرەکەتدا پاشەکەوت دەکات.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/5 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-purple-400" /> کەی و چۆن ڕیستۆر (Restore) دەکرێتەوە؟
                </span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  ئەگەر کۆمپیوتەرت گۆڕی، کێشەیەک ڕوویدا یان ویستت داتای پێشوو بگێڕیتەوە، تەنها کلیک لەسەر دوگمەی گەڕاندنەوە (Restore) بکە یان فایلی باک ئەپەکە هەڵبژێرە، سیستەم خۆکار هەموو داتاکان نوێ دەکاتەوە!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESTORE MODAL */}
      {restoreConfirmModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-[32px] p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-3 bg-purple-500/20 text-purple-300 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">پەسەندکردنی گەڕاندنەوەی داتابەیس (Restore Database)</h3>
                <p className="text-xs text-slate-400">تکایە دڵنیابەرەوە لە ئەنجامدانی ئەم کردارە</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-200 leading-relaxed">
                ئایا دڵنیایت کە دەتەوێت داتابەیسی سیستەم بگەڕێنیتەوە بە فایلی:
                <br />
                <strong className="text-white font-mono font-bold mt-1 inline-block">
                  {restoreConfirmModal.filename}
                </strong>
              </p>
              <p className="text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                ئاگاداری: هەموو داتاکانی ئێستا لەگەڵ ئەم باک ئەپە تێکەڵ و ڕێکدەخرێنەوە و پەڕەکە بە خۆکاری ریفرێش دەبێت.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setRestoreConfirmModal({ show: false, type: 'server_file' })}
                disabled={isRestoring}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-xs transition"
              >
                پەشیمانبوونەوە
              </button>

              <button
                type="button"
                onClick={executeRestore}
                disabled={isRestoring}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:brightness-110 active:scale-95 text-white font-black rounded-xl text-xs transition flex items-center gap-2 shadow-lg"
              >
                {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>بەڵێ، داتاکان بگەڕێنەرەوە (Confirm Restore)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: WHATSAPP INTEGRATION & AUTOMATIC MESSAGING SETTINGS */}
      {activeSubTab === 'whatsapp' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Main Card: Meta Cloud API Credentials */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-emerald-500/30 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
              <div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 mb-2">
                  <Bot className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Business Cloud API & Gateway
                </span>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-emerald-400" /> ڕێکخستنی سەرەکی وەتس ئەپ (WhatsApp Settings)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  تەواوی کلیلی API، ژمارەی مۆبایل، تۆکنەکان و لینکی Webhook ی کلینیکەکەت لێرەدا ڕێکبخە.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold text-teal-300 flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-teal-400" />
                  <span>داشبۆردی Meta Developers</span>
                </a>
              </div>
            </div>

            <form onSubmit={handleSaveWaSettings} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold flex items-center justify-between">
                    <span>ژمارەی مۆبایلی وەتس ئەپی کلینیک *</span>
                    <span className="text-[10px] text-slate-400 font-mono">WhatsApp Number</span>
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-emerald-400 absolute right-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={waPhoneNumber}
                      onChange={(e) => setWaPhoneNumber(e.target.value)}
                      placeholder="+964 750 111 2233"
                      className="w-full p-3.5 pr-10 bg-slate-950 border border-white/15 rounded-2xl text-white font-mono outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold flex items-center justify-between">
                    <span>ناسنامەی ئەکاونتی business (WABA Account ID)</span>
                    <span className="text-[10px] text-slate-400 font-mono">WABA ID</span>
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-emerald-400 absolute right-3.5 top-3.5" />
                    <input
                      type="text"
                      value={waAccountId}
                      onChange={(e) => setWaAccountId(e.target.value)}
                      placeholder="108492048201948"
                      className="w-full p-3.5 pr-10 bg-slate-950 border border-white/15 rounded-2xl text-white font-mono outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold flex items-center justify-between">
                    <span>ناسنامەی ژمارەی مۆبایل (Phone Number ID)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Phone ID</span>
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-teal-400 absolute right-3.5 top-3.5" />
                    <input
                      type="text"
                      value={waPhoneNumberId}
                      onChange={(e) => setWaPhoneNumberId(e.target.value)}
                      placeholder="109382049281048"
                      className="w-full p-3.5 pr-10 bg-slate-950 border border-white/15 rounded-2xl text-white font-mono outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold flex items-center justify-between">
                    <span>تۆکنی جێبەجێکردنی Webhook (Verify Token)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Verify Token</span>
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-teal-400 absolute right-3.5 top-3.5" />
                    <input
                      type="text"
                      value={waWebhookVerifyToken}
                      onChange={(e) => setWaWebhookVerifyToken(e.target.value)}
                      placeholder="dunia_clinic_verify_2026"
                      className="w-full p-3.5 pr-10 bg-slate-950 border border-white/15 rounded-2xl text-white font-mono outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-300 mb-1.5 font-bold flex items-center justify-between">
                    <span>تۆکنی هەمیشەیی دەسەڵات (Permanent Access Token) *</span>
                    <button
                      type="button"
                      onClick={() => setWaShowToken(!waShowToken)}
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      {waShowToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{waShowToken ? 'بیشارەوە' : 'پیشانی بدە'}</span>
                    </button>
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-amber-400 absolute right-3.5 top-3.5" />
                    <input
                      type={waShowToken ? 'text' : 'password'}
                      required
                      value={waAccessToken}
                      onChange={(e) => setWaAccessToken(e.target.value)}
                      placeholder="EAAGk1..."
                      className="w-full p-3.5 pr-10 bg-slate-950 border border-white/15 rounded-2xl text-amber-200 font-mono outline-none focus:border-emerald-400"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    تۆکنەکەت بە پارێزراوی لە سیرڤەر دەمێنێتەوە بۆ ناردنی پەیامی خۆکار.
                  </p>
                </div>

                <div className="md:col-span-2 bg-slate-950/80 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-teal-400" /> لینکی سەرەکی Webhook Callback URL:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(waWebhookUrl, 'webhook')}
                      className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-[11px] font-bold flex items-center gap-1 border border-emerald-500/30"
                    >
                      {copiedField === 'webhook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'webhook' ? 'کۆپی کرا!' : 'کۆپیکردنی لینک'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-emerald-400 text-xs bg-slate-900 p-3 rounded-xl border border-white/5 overflow-x-auto">
                    {waWebhookUrl}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                {waSavedSuccess && (
                  <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> زانیارییەکانی وەتس ئەپ بە سەرکەوتوویی پاشەکەوت کران!
                  </span>
                )}
                <button
                  type="submit"
                  className="mr-auto px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black rounded-2xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>پاشەکەوتکردنی ڕێکخستنەکانی وەتس ئەپ</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Automatic Messaging Triggers & Session Completion */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <BellRing className="w-5 h-5 text-teal-400" /> هەڵبژاردنەکانی ناردنی پەیامی خۆکار (Automatic Notification Triggers)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                دیاری بکە لە چ کاتێکدا سیستەم خۆکارانە پەیامی وەتس ئەپ بۆ نەخۆشەکان بنێرێت.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              {/* Trigger 1: 1-Day Prior */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      📅 بیرهێنانەوەی ۱ ڕۆژ پێشتر
                    </span>
                    <button
                      type="button"
                      onClick={() => setWaAuto24h(!waAuto24h)}
                      className="text-teal-400"
                    >
                      {waAuto24h ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-slate-600" />}
                    </button>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    ۲٤ کاتژمێر پێش مەوعید، بە شێوەیەکی ئۆتۆماتیکی پەیامی بیرهێنانەوەی ژوان بۆ مۆبایلی نەخۆش دەچێت.
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg w-fit ${waAuto24h ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                  {waAuto24h ? 'چالاکە (Active)' : 'ناچالاکە'}
                </span>
              </div>

              {/* Trigger 2: Same-Day */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      ⏰ بیرهێنانەوەی ڕۆژی مەوعید
                    </span>
                    <button
                      type="button"
                      onClick={() => setWaAutoSameDay(!waAutoSameDay)}
                      className="text-teal-400"
                    >
                      {waAutoSameDay ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-slate-600" />}
                    </button>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    سەرلەبەیانی ڕۆژی مەوعید (سەعات 08:00 AM) پەیامی هاندان و ئامادەبوون بۆ نەخۆش دەچێت.
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg w-fit ${waAutoSameDay ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                  {waAutoSameDay ? 'چالاکە (Active)' : 'ناچالاکە'}
                </span>
              </div>

              {/* Trigger 3: Session Completion (کە نەخۆش چارەسەری وەرگرت) */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-emerald-500/40 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      🏁 پەیامی تەواوبوونی جلسەی ئەمڕۆ
                    </span>
                    <button
                      type="button"
                      onClick={() => setWaAutoCompletion(!waAutoCompletion)}
                      className="text-emerald-400"
                    >
                      {waAutoCompletion ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-slate-600" />}
                    </button>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    کاتێک پزیشک یان ڕێپێدان نۆرەی نەخۆش دەکەن بە **"تەواوبوو" (Session Completed)**، ڕاستەوخۆ پەیامی سوپاسگوزاری و ڕێنمایی بۆ وەتس ئەپی نەخۆش دەڕوات!
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg w-fit ${waAutoCompletion ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
                  {waAutoCompletion ? 'چالاکە (سوپاسگوزاری تەواوبوون)' : 'ناچالاکە'}
                </span>
              </div>
            </div>

            {/* Template Editor for Session Completion */}
            <div className="bg-slate-950/90 p-6 rounded-3xl border border-white/10 space-y-4">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> ڕێکخستنی دەقی پەیامی تەواوبوونی جلسەی ئەمڕۆ (Session Completion Template)
              </h4>
              <p className="text-xs text-slate-400">
                ئەم دەقە خۆکارانە بنێردرێت کاتێک نەخۆش چارەسەری ئەو ڕۆژەی تەواو دەکات. دەتوانیت وشەکانی <code className="text-emerald-300 font-mono text-[11px]">{'{patient_name}'}</code> و <code className="text-emerald-300 font-mono text-[11px]">{'{clinic_name}'}</code> بەکاربهێنیت.
              </p>

              <textarea
                rows={3}
                value={waCompletionMsgTemplate}
                onChange={(e) => setWaCompletionMsgTemplate(e.target.value)}
                className="w-full p-4 bg-slate-900 border border-white/15 rounded-2xl text-white text-xs leading-relaxed outline-none focus:border-emerald-400"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>نموونەی پەیامی تاقیکاری:</span>
                <span className="text-emerald-400 font-bold">تەواوی نەخۆشەکان ئەم پەیامە وەردەگرن بە ناوی خۆیانەوە</span>
              </div>
            </div>
          </div>

          {/* Section 3: Test Send WhatsApp Simulator */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-teal-400" /> تاقیکردنەوەی ناردنی پەیامی وەتس ئەپ (Test Connection)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ژمارەیەکی تاقیکاری بنووسە بۆ تاقیکردنەوەی دروستی پەیوەندی وەتس ئەپی کلینیکەکەت.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="0750XXXXXXX"
                className="w-full sm:w-72 p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-white font-mono text-xs outline-none focus:border-emerald-400"
              />

              <button
                type="button"
                onClick={handleSendTestWaMessage}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black rounded-2xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Send className="w-4 h-4 text-slate-950" />
                <span>ناردنی پەیامی تاقیکاری</span>
              </button>

              {testSentSuccess && (
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 animate-bounce">
                  <CheckCircle2 className="w-4 h-4" /> پەیامی تاقیکاری بە سەرکەوتوویی نێردرا بۆ {testPhone}!
                </span>
              )}
            </div>
          </div>

          {/* Section 4: Comprehensive Kurdish Step-by-Step Guide for Meta API */}
          <div className="bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-6 md:p-8 rounded-[36px] border border-amber-500/30 shadow-md space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <HelpCircle className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-lg font-black text-white">
                  ڕێنمایی گشتگیر و هەنگاو بە هەنگاو: چۆن زانیارییەکانی وەتس ئەپ وەرگرم؟
                </h3>
                <p className="text-xs text-slate-400">
                  ئەگەر نازانیت چۆن WABA ID یان Access Token بەدەستبهێنیت، ئەم ٤ هەنگاوەی خوارەوە پەیڕەو بکە:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Step 1 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    ۱
                  </span>
                  <h4 className="font-bold text-white">دروستکردنی ئەکاونتی Meta Developers</h4>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  بڕۆ بۆ وێبسایتی <strong className="text-amber-300 font-mono">developers.facebook.com</strong> و بە ئەکاونتی فەیسبووکی کلینیکەکە چوونه‌ژووره‌وه‌ بکە. پاشان داواکاری Create App بکە و جۆری <strong className="text-emerald-300">Business</strong> هەڵبژێرە.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    ۲
                  </span>
                  <h4 className="font-bold text-white">زیادکردنی خزمەتگوزاری WhatsApp API</h4>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  لە بەشی Add Products، کلیک لەسەر <strong className="text-emerald-300">WhatsApp</strong> بکە. لەوێدا بەشی <strong className="text-amber-300 font-mono">API Setup</strong> دەبینیت، کە ڕاستەوخۆ <strong className="text-emerald-300">Phone Number ID</strong> و <strong className="text-emerald-300">WABA Account ID</strong>ت پێدەدات.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    ۳
                  </span>
                  <h4 className="font-bold text-white">وەرگرتنی تۆکنی هەمیشەیی (Permanent System Access Token)</h4>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  لە بەشی Meta Business Settings بڕۆ بۆ <strong className="text-amber-300">System Users</strong>، بەکارهێنەرێکی سیستەم دروستبکە و مۆڵەتی <code className="text-emerald-300 font-mono">whatsapp_business_messaging</code> ی پێبدە. تۆکنی هەمیشەییەکەی کۆپی بکە و لێرەدا پیستی بکە.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    ٤
                  </span>
                  <h4 className="font-bold text-white">بەستنەوەی Webhook بۆ وەرگرتنی وەڵامەکان</h4>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  لینکی Webhook Callback URLەکە کە لە سەرەوە هەیە کۆپی بکە و لە بەشی Webhooksی Meta داینێ لەگەڵ Verify Token تاوەکو وەڵامەکانی نەخۆش لە ڕاستەوخۆدا وەربگریتەوە.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

        </div>

        {/* Internal Right Sidebar for Settings Categories */}
        <div className="order-1 lg:order-2 lg:col-span-4 xl:col-span-3 bg-slate-900/80 backdrop-blur-md p-4 rounded-[32px] border border-white/10 shadow-md sticky top-24 space-y-2">
          <div className="p-3 border-b border-white/10 mb-2">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-teal-400" />
              <span>بەشەکانی ڕێکخستن</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">تکایە بەشێک هەڵبژێرە بۆ گۆڕانکاری</p>
          </div>

          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSubTab === item.id;
              const badgeCount =
                item.id === 'rooms'
                  ? rooms.length
                  : item.id === 'treatments'
                  ? treatments.length
                  : item.id === 'users'
                  ? allUsers.length
                  : null;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubTab(item.id as any)}
                  className={`w-full p-3.5 rounded-2xl text-xs font-black transition-all duration-300 flex items-center justify-between group cursor-pointer select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500/30 via-cyan-500/25 to-teal-500/20 text-white border-2 border-teal-400 shadow-[0_0_22px_rgba(20,184,166,0.35)] scale-[1.02]'
                      : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-900 border border-white/10 hover:border-teal-500/40 hover:shadow-[0_0_12px_rgba(20,184,166,0.15)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl transition-all ${
                        isActive
                          ? 'bg-gradient-to-tr from-teal-400 to-cyan-400 text-slate-950 font-bold shadow-[0_0_10px_#2dd4bf]'
                          : 'bg-white/5 text-slate-400 group-hover:text-teal-300 group-hover:bg-teal-500/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black">{item.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{item.subLabel}</div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                        isActive ? 'bg-teal-400 text-slate-950 font-bold border-teal-300 shadow-sm' : item.badgeColor || 'bg-white/10 text-slate-400 border-white/5'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD NEW ROOM MODAL */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-[36px] w-full max-w-md overflow-hidden shadow-md p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-emerald-400" /> زیادکردنی ژووری نوێ
              </h3>
              <button
                onClick={() => setShowAddRoomModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">ناوی ژوور *</label>
                <input
                  type="text"
                  required
                  placeholder="ژووری ٦ (هایدرۆ تەراپی)..."
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">بەش (Department)</label>
                <input
                  type="text"
                  placeholder="بەشی لەیزەر، فیلەر و بۆتۆکس، سکین کێر..."
                  value={roomDepartment}
                  onChange={(e) => setRoomDepartment(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">پزیشکی بەرپرس</label>
                  <select
                    value={roomDoctor}
                    onChange={(e) => setRoomDoctor(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white outline-none focus:border-emerald-400"
                  >
                    {allUsers
                      .filter((u) => u.role === 'doctor' || u.role === 'super_admin')
                      .map((doc) => (
                        <option key={doc.id} value={doc.name}>
                          {doc.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">دۆخی ژوور</label>
                  <select
                    value={roomStatus}
                    onChange={(e) => setRoomStatus(e.target.value as any)}
                    className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white outline-none focus:border-emerald-400"
                  >
                    <option value="چالاک">چالاک</option>
                    <option value="نائامادە">نائامادە</option>
                    <option value="سیانە">سیانە (مسیانە)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">قابلیەتی وەرگرتنی نەخۆش بە یەکەوە</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(Number(e.target.value))}
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white font-mono outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black rounded-xl shadow-md"
                >
                  زیادکردنی ژوور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EXISTING ROOM MODAL */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-teal-500/40 rounded-[36px] w-full max-w-md overflow-hidden shadow-md p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-400" /> دەستکاریکردنی ژووری ({editingRoom.name})
              </h3>
              <button
                onClick={() => setEditingRoom(null)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRoom} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">ناوی ژوور *</label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">بەش (Department)</label>
                <input
                  type="text"
                  value={roomDepartment}
                  onChange={(e) => setRoomDepartment(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">پزیشکی بەرپرس</label>
                  <select
                    value={roomDoctor}
                    onChange={(e) => setRoomDoctor(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white outline-none focus:border-teal-400"
                  >
                    {allUsers
                      .filter((u) => u.role === 'doctor' || u.role === 'super_admin')
                      .map((doc) => (
                        <option key={doc.id} value={doc.name}>
                          {doc.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">دۆخی ژوور</label>
                  <select
                    value={roomStatus}
                    onChange={(e) => setRoomStatus(e.target.value as any)}
                    className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white outline-none focus:border-teal-400"
                  >
                    <option value="چالاک">چالاک</option>
                    <option value="نائامادە">نائامادە</option>
                    <option value="سیانە">سیانە (مسیانە)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">قابلیەتی وەرگرتنی نەخۆش بە یەکەوە</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(Number(e.target.value))}
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white font-mono outline-none focus:border-teal-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black rounded-xl shadow-md"
                >
                  پاشەکەوتکردنی گۆڕانکارییەکان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD TREATMENT MODAL */}
      {showAddTreatmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-[36px] w-full max-w-lg overflow-hidden shadow-md p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-black text-white">زیادکردنی خزمەتگوزاری جوانکاری نوێ</h3>
              <button
                onClick={() => setShowAddTreatmentModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTreatment} className="space-y-4 text-xs">
              {/* Preset Selector */}
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl space-y-2">
                <label className="text-teal-300 font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" /> هەڵبژاردن لە وشە سابتەکانی کەتەلۆگ
                  </span>
                  <span className="text-[10px] text-teal-400/80 font-normal">پڕکردنەوەی خۆکار</span>
                </label>
                <select
                  onChange={(e) => {
                    const proc = STANDARD_AESTHETIC_PROCEDURES.find((p) => p.name === e.target.value);
                    if (proc) {
                      setTrtName(proc.name);
                      setTrtDescription(proc.description);
                      setTrtPrice(proc.suggestedPrice);
                      setTrtDurationMinutes(proc.durationMinutes);
                    }
                  }}
                  className="w-full bg-slate-950 border border-teal-500/30 rounded-xl p-2.5 text-white font-bold cursor-pointer outline-none mb-2"
                >
                  <option value="">-- هەڵبژاردنی خزمەتگوزاری ستاندارد --</option>
                  {STANDARD_PROCEDURE_CATEGORIES.map((cat) => (
                    <optgroup key={cat} label={`━━ ${cat} ━━`}>
                      {STANDARD_AESTHETIC_PROCEDURES.filter((p) => p.category === cat).map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.suggestedPrice.toLocaleString()} د.ع)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-0.5">
                  {STANDARD_AESTHETIC_PROCEDURES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setTrtName(p.name);
                        setTrtDescription(p.description);
                        setTrtPrice(p.suggestedPrice);
                        setTrtDurationMinutes(p.durationMinutes);
                      }}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        trtName === p.name
                          ? 'bg-teal-500 text-slate-950 font-black border-teal-400 shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10'
                      }`}
                    >
                      {p.name.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">ناوی چارەسەر *</label>
                <input
                  type="text"
                  required
                  value={trtName}
                  onChange={(e) => setTrtName(e.target.value)}
                  placeholder="چارەسەری ئاوی (Hydrotherapy)..."
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">پێناسە و ڕوونکردنەوە</label>
                <textarea
                  rows={2}
                  value={trtDescription}
                  onChange={(e) => setTrtDescription(e.target.value)}
                  placeholder="تایبەتمەندی چارەسەر و ئامێرەکە..."
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">نرخ (د.ع) *</label>
                  <input
                    type="number"
                    required
                    value={trtPrice}
                    onChange={(e) => setTrtPrice(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">ماوە (خولەک)</label>
                  <input
                    type="number"
                    value={trtDurationMinutes}
                    onChange={(e) => setTrtDurationMinutes(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddTreatmentModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-teal-400 text-slate-950 font-black rounded-xl shadow-md"
                >
                  زیادکردن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT EXISTING TREATMENT MODAL */}
      {editingTreatment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-teal-500/40 rounded-[36px] w-full max-w-lg overflow-hidden shadow-md p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-400" /> دەستکاریکردنی چارەسەری ({editingTreatment.name})
              </h3>
              <button
                onClick={() => setEditingTreatment(null)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTreatment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">ناوی چارەسەر *</label>
                <input
                  type="text"
                  required
                  value={trtName}
                  onChange={(e) => setTrtName(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">پێناسە و ڕوونکردنەوە</label>
                <textarea
                  rows={3}
                  value={trtDescription}
                  onChange={(e) => setTrtDescription(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">نرخ (د.ع) *</label>
                  <input
                    type="number"
                    required
                    value={trtPrice}
                    onChange={(e) => setTrtPrice(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">ماوە (خولەک)</label>
                  <input
                    type="number"
                    value={trtDurationMinutes}
                    onChange={(e) => setTrtDurationMinutes(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingTreatment(null)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black rounded-xl shadow-md"
                >
                  پاشەکەوتکردنی گۆڕانکارییەکان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT PERMISSIONS MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-[36px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-md p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" /> دیارییکردنی دەسەڵاتەکان
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  دەسەڵاتەکانی ({editingUser.name})
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Role Switcher & Templates */}
            <div className="space-y-3 bg-slate-950/80 p-5 rounded-2xl border border-white/10">
              <label className="block text-xs font-bold text-slate-300">
                گۆڕینی ناونیشانی فەرمی (Role) و پێشوەختەکان (Permission Templates):
              </label>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleApplyRoleTemplate('super_admin')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    tempRole === 'super_admin'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  سوپەر ئەدمین (Full)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRoleTemplate('doctor')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    tempRole === 'doctor'
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  پزیشک (Doctor)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRoleTemplate('receptionist')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    tempRole === 'receptionist'
                      ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  ڕێپێدان (Reception)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRoleTemplate('accountant')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    tempRole === 'accountant'
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  ژمێریار (Accountant)
                </button>
              </div>
            </div>

            {/* Granular Module Toggles */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider border-b border-white/10 pb-2">
                1. بەشە ڕێگەپێدراوەکانی سیستەم (Accessible Modules):
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {modulePermissionList.map((m) => {
                  const isChecked = tempPermissions[m.key];

                  return (
                    <label
                      key={m.key}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-gradient-to-r from-teal-500/10 to-blue-500/10 border-teal-500/40 text-white'
                          : 'bg-slate-950/60 border-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <span className="font-bold">{m.label}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setTempPermissions({
                            ...tempPermissions,
                            [m.key]: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-teal-400 rounded cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Action Privilege Toggles */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider border-b border-white/10 pb-2">
                2. دەسەڵاتە هەستیارەکان (Action Privileges):
              </h4>

              <div className="space-y-2 text-xs">
                {actionPermissionList.map((act) => {
                  const isChecked = tempPermissions[act.key];

                  return (
                    <label
                      key={act.key}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 font-bold'
                          : 'bg-slate-950/60 border-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <span className="block text-white font-bold">{act.label}</span>
                        <span className="text-[10px] text-slate-400">{act.description}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setTempPermissions({
                            ...tempPermissions,
                            [act.key]: e.target.checked,
                          })
                        }
                        className="w-4.5 h-4.5 accent-amber-400 rounded cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold text-xs"
              >
                پاشگەزبوونەوە
              </button>
              <button
                type="button"
                onClick={handleSaveUserPermissions}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition-all"
              >
                پاشەکەوتکردنی دەسەڵاتەکان
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: ADD NEW USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-[36px] w-full max-w-md overflow-hidden shadow-md p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-black text-white">زیادکردنی کارمەندی نوێ</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">ناوی کارمەند *</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="د. کاوان سامان..."
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">ئیمەیڵ *</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="kawan@aesthetic.com"
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">ناوی بەکارهێنەر (Username) *</label>
                  <input
                    type="text"
                    required
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="kawan_sam"
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-amber-300 font-bold outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">تێپەڕەوشە (Password) *</label>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-amber-200 outline-none focus:border-teal-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">ڕۆڵ (Role)</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400"
                  >
                    <option value="doctor">پزیشک</option>
                    <option value="receptionist">ڕێپێدان</option>
                    <option value="accountant">ژمێریار</option>
                    <option value="manager">بەڕێوەبەر</option>
                    <option value="super_admin">سوپەر ئەدمین</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">لق (Branch) *</label>
                  <select
                    required
                    value={newUserBranchId || ''}
                    onChange={(e) => setNewUserBranchId(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-cyan-300 font-bold outline-none focus:border-teal-400"
                  >
                    <option value="">هەڵبژاردنی لق...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">موچە (د.ع)</label>
                  <input
                    type="number"
                    value={newUserSalary}
                    onChange={(e) => setNewUserSalary(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">پسپۆڕی / کورته‌ وەسف</label>
                  <input
                    type="text"
                    value={newUserSpecialty}
                    onChange={(e) => setNewUserSpecialty(e.target.value)}
                    placeholder="پسپۆڕی جوانکاری، لەیزەر، پێشوازی..."
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-black rounded-xl shadow-md"
                >
                  تۆمارکردنی کارمەند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 7: ADD NEW BRANCH MODAL */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-[36px] w-full max-w-md overflow-hidden shadow-md p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" /> زیادکردنی لقی نوێ
              </h3>
              <button
                onClick={() => setShowAddBranchModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">ناوی لق *</label>
                <input
                  type="text"
                  required
                  placeholder="لقی دهۆک..."
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">ناونیشان</label>
                <input
                  type="text"
                  placeholder="دهۆک - تەنیشت پارکی ئازادی..."
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">ژمارەی تەلەفۆن</label>
                <input
                  type="text"
                  placeholder="0750..."
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white font-mono outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black rounded-xl shadow-md"
                >
                  تۆمارکردنی لق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: EDIT BRANCH MODAL */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-[36px] w-full max-w-md overflow-hidden shadow-md p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" /> دەستکاریکردنی لق
              </h3>
              <button
                onClick={() => setEditingBranch(null)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBranchSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">ناوی لق *</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">ناونیشان</label>
                <input
                  type="text"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">ژمارەی تەلەفۆن</label>
                <input
                  type="text"
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-white font-mono outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black rounded-xl shadow-md"
                >
                  پاشەکەوتکردن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
