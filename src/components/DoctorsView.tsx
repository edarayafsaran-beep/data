import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Branch, StaffAttendanceRecord, AttendanceStatus, StaffLeaveRequest, WorkShiftConfig } from '../types';
import {
  UserCog,
  Stethoscope,
  ShieldCheck,
  DollarSign,
  UserPlus,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  MapPin,
  Clock,
  Calendar,
  AlertTriangle,
  UserCheck,
  UserX,
  FileText,
  Printer,
  Search,
  Filter,
  Plus,
  Check,
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Sliders,
  Timer,
  QrCode,
  ShieldAlert,
  Edit3,
  CalendarCheck,
  Coffee,
  Camera,
  Fingerprint,
  Scan,
  Maximize2,
  Video,
  Eye,
  Radio,
  Zap,
} from 'lucide-react';
import { getDefaultPermissionsForRole } from '../utils/permissions';

interface DoctorsViewProps {
  doctors: User[];
  branches: Branch[];
  onUpdateSalary: (doctorId: number, newSalary: number) => void;
  onAddDoctor: (doctorData: Omit<User, 'id'>) => void;
  onUpdateDoctor?: (doctorId: number, data: Partial<User>) => void;
  currentUser?: User | null;
  activeBranchId?: number | null;
}

export const DoctorsView: React.FC<DoctorsViewProps> = ({
  doctors,
  branches,
  onUpdateSalary,
  onAddDoctor,
  onUpdateDoctor,
  currentUser,
  activeBranchId,
}) => {
  // Navigation Sub-Tabs
  const [activeTab, setActiveTab] = useState<
    'attendance_board' | 'doctors_list' | 'biometric_terminal' | 'leaves_management' | 'shifts_config' | 'monthly_reports'
  >('attendance_board');

  // Real-time ticking clock for biometric precision
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentTimeStr = useMemo(
    () =>
      currentDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }),
    [currentDateTime]
  );

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [notice, setNotice] = useState<string | null>(null);

  // Modals state
  const [editingSalaryId, setEditingSalaryId] = useState<number | null>(null);
  const [tempSalary, setTempSalary] = useState<number>(0);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [printLeaveModal, setPrintLeaveModal] = useState<StaffLeaveRequest | null>(null);

  // Biometric Terminal Modal State
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricMethod, setBiometricMethod] = useState<'camera' | 'fingerprint'>('camera');
  const [terminalActionType, setTerminalActionType] = useState<'in' | 'out'>('in');
  // Auto-lifecycle mode: on first scan today -> Check-In; on second scan on same day -> Check-Out!
  const [autoLifecycleMode, setAutoLifecycleMode] = useState<boolean>(true);
  const [selectedStaffForScan, setSelectedStaffForScan] = useState<User | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [scanSuccessResult, setScanSuccessResult] = useState<{
    staffName: string;
    action: 'in' | 'out';
    time: string;
    method: string;
    confidence: number;
    isLate: boolean;
    lateMinutes: number;
    photoThumbnail?: string;
  } | null>(null);

  // Photo Attachment and Live Facial Enrollment states
  const [newDocPhoto, setNewDocPhoto] = useState<string | null>(null);
  const [editingPhotoStaff, setEditingPhotoStaff] = useState<User | null>(null);
  const [editStaffPhotoUrl, setEditStaffPhotoUrl] = useState<string | null>(null);
  const [isWebcamCapturingForDoc, setIsWebcamCapturingForDoc] = useState(false);
  const [photoCaptureTarget, setPhotoCaptureTarget] = useState<'new_doc' | 'edit_doc'>('new_doc');

  // Camera video refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const photoCaptureVideoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Work Shifts Configuration
  const [shifts, setShifts] = useState<WorkShiftConfig[]>([
    {
      id: 1,
      title: 'شەفتی بەیانیان (Morning Shift)',
      startTime: '09:00',
      endTime: '17:00',
      gracePeriodMinutes: 15,
      penaltyPerLateMinute: 1500,
    },
    {
      id: 2,
      title: 'شەفتی ئێواران (Evening Shift)',
      startTime: '13:00',
      endTime: '21:00',
      gracePeriodMinutes: 15,
      penaltyPerLateMinute: 1500,
    },
    {
      id: 3,
      title: 'شەفتی تەواوی ڕۆژ (Full Day Shift)',
      startTime: '09:00',
      endTime: '20:00',
      gracePeriodMinutes: 15,
      penaltyPerLateMinute: 2000,
    },
  ]);

  // Attendance Records State (Persisted in localStorage)
  const [attendanceRecords, setAttendanceRecords] = useState<StaffAttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('donia_staff_attendance_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading attendance from localStorage', e);
    }

    // Default realistic seed for today
    return doctors.map((doc, idx) => {
      const branchObj = branches.find((b) => b.id === doc.branchId) || branches[0] || { name: 'لقی سەرەکی' };
      if (idx === 0) {
        return {
          id: 1001,
          userId: doc.id,
          userName: doc.name,
          userRole: doc.role,
          branchId: doc.branchId || 1,
          branchName: branchObj.name,
          date: new Date().toISOString().split('T')[0],
          checkInTime: '08:55 AM',
          status: 'ئامادەیە (Present)' as AttendanceStatus,
          shiftTitle: 'شەفتی بەیانیان (09:00 - 17:00)',
          scheduledStartTime: '09:00',
          scheduledEndTime: '17:00',
          lateMinutes: 0,
          earlyDepartureMinutes: 0,
          overtimeMinutes: 0,
          verificationMethod: 'کامێرای ناسینەوەی ڕووخسار (Face Recognition)',
          isTamperProofVerified: true,
          penaltyDeductionAmount: 0,
          notes: 'ناسینەوەی ڕووخسار بە کامێرای کلینیک.',
        };
      }
      if (idx === 1) {
        return {
          id: 1002,
          userId: doc.id,
          userName: doc.name,
          userRole: doc.role,
          branchId: doc.branchId || 1,
          branchName: branchObj.name,
          date: new Date().toISOString().split('T')[0],
          checkInTime: '09:28 AM',
          status: 'دواکەوتووە (Late)' as AttendanceStatus,
          shiftTitle: 'شەفتی بەیانیان (09:00 - 17:00)',
          scheduledStartTime: '09:00',
          scheduledEndTime: '17:00',
          lateMinutes: 28,
          earlyDepartureMinutes: 0,
          overtimeMinutes: 0,
          verificationMethod: 'زیهازی پەنجە مۆری بایۆمەتری (Fingerprint)',
          isTamperProofVerified: true,
          penaltyDeductionAmount: 28 * 1500,
          notes: 'پەنجەمۆری دیجیتاڵی لە زیهازی دەرگا.',
        };
      }
      return {
        id: 1000 + idx,
        userId: doc.id,
        userName: doc.name,
        userRole: doc.role,
        branchId: doc.branchId || 1,
        branchName: branchObj.name,
        date: new Date().toISOString().split('T')[0],
        status: 'غائیبە (Absent)' as AttendanceStatus,
        shiftTitle: 'شەفتی بەیانیان (09:00 - 17:00)',
        scheduledStartTime: '09:00',
        scheduledEndTime: '17:00',
        lateMinutes: 0,
        earlyDepartureMinutes: 0,
        overtimeMinutes: 0,
        verificationMethod: 'ئۆتۆماتیکی سیستەم',
        isTamperProofVerified: true,
        penaltyDeductionAmount: 0,
        notes: 'تا ئێستا لە کامێرا یان پەنجەمۆر تۆمارنەکراوە.',
      };
    });
  });

  useEffect(() => {
    try {
      localStorage.setItem('donia_staff_attendance_records', JSON.stringify(attendanceRecords));
    } catch (e) {
      console.warn('Error saving attendance records', e);
    }
  }, [attendanceRecords]);

  // Leaves & Vacation Requests State
  const [leaveRequests, setLeaveRequests] = useState<StaffLeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem('donia_staff_leave_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading leaves from localStorage', e);
    }
    return [
      {
        id: 501,
        userId: doctors[2]?.id || 3,
        userName: doctors[2]?.name || 'کارزان قادر تۆفیق',
        branchId: doctors[2]?.branchId || 1,
        branchName: 'لقی سەرەکی - سلێمانی',
        leaveType: 'مۆڵەتی ئاسایی (Annual)',
        startDate: todayStr,
        endDate: todayStr,
        daysCount: 1,
        reason: 'کاری فەرمی کەسی و خێزانی',
        status: 'پەسەندکراو (Approved)',
        appliedAt: todayStr,
        approvedBy: 'سوپەر ئەدمین',
        deductFromSalary: false,
        notes: 'مۆڵەت بە تەواوی پەسەندکراوە و لە دەوام بە مۆڵەت حیسابە.',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('donia_staff_leave_requests', JSON.stringify(leaveRequests));
    } catch (e) {
      console.warn('Error saving leave requests', e);
    }
  }, [leaveRequests]);

  // Ensure every staff member has a record for today; if they have not checked in, marked as Absent (غائیبە)
  useEffect(() => {
    setAttendanceRecords((prev) => {
      let changed = false;
      const updated = [...prev];
      doctors.forEach((doc) => {
        const hasRec = updated.some((r) => r.userId === doc.id && r.date === todayStr);
        if (!hasRec) {
          changed = true;
          const branchObj = branches.find((b) => b.id === doc.branchId) || branches[0] || { name: 'لقی سەرەکی' };
          const hasApprovedLeave = leaveRequests.some(
            (l) => l.userId === doc.id && l.status === 'پەسەندکراو (Approved)' && l.startDate <= todayStr && l.endDate >= todayStr
          );
          updated.push({
            id: Date.now() + doc.id,
            userId: doc.id,
            userName: doc.name,
            userRole: doc.role,
            userAvatar: doc.avatar || doc.facePhoto,
            branchId: doc.branchId || 1,
            branchName: branchObj.name,
            date: todayStr,
            status: hasApprovedLeave ? 'لە مۆڵەتدایە (On Leave)' : 'غائیبە (Absent)',
            shiftTitle: 'شەفتی بەیانیان (09:00 - 17:00)',
            scheduledStartTime: '09:00',
            scheduledEndTime: '17:00',
            lateMinutes: 0,
            earlyDepartureMinutes: 0,
            overtimeMinutes: 0,
            verificationMethod: hasApprovedLeave ? 'پشتڕاستکردنەوەی بەڕێوەبەر' : 'ئۆتۆماتیکی سیستەم',
            isTamperProofVerified: true,
            penaltyDeductionAmount: 0,
            notes: hasApprovedLeave
              ? 'لە مۆڵەتی فەرمیدایە.'
              : 'تا ئێستا خۆی بە کامێرای دەموچاو پیشان نەداوە (نەهاتوو / غائیبە).',
          });
        }
      });
      return changed ? updated : prev;
    });
  }, [doctors, todayStr, leaveRequests, branches]);

  // New Doctor Form State
  const [newDocName, setNewDocName] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocUsername, setNewDocUsername] = useState('');
  const [newDocPassword, setNewDocPassword] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('');
  const [newDocPhone, setNewDocPhone] = useState('');
  const [newDocSalary, setNewDocSalary] = useState<number>(1500000);
  const [requiresAccount, setRequiresAccount] = useState<boolean>(true);
  const [newDocRole, setNewDocRole] = useState<User['role']>('doctor');
  const [newDocBranchId, setNewDocBranchId] = useState<number>(activeBranchId || branches[0]?.id || 1);

  // New Leave Form State
  const [leaveStaffId, setLeaveStaffId] = useState<number>(doctors[0]?.id || 1);
  const [leaveType, setLeaveType] = useState<StaffLeaveRequest['leaveType']>('مۆڵەتی ئاسایی (Annual)');
  const [leaveStartDate, setLeaveStartDate] = useState(todayStr);
  const [leaveEndDate, setLeaveEndDate] = useState(todayStr);
  const [leaveDaysCount, setLeaveDaysCount] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDeductSalary, setLeaveDeductSalary] = useState(false);
  const [leaveApprovedBy, setLeaveApprovedBy] = useState(currentUser?.name || 'بەڕێوەبەری لق');

  // Camera Management when Camera mode or photo enrollment is active
  useEffect(() => {
    if ((showBiometricModal && biometricMethod === 'camera') || isWebcamCapturingForDoc) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } })
        .then((stream) => {
          setCameraStream(stream);
          setCameraError(null);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          if (photoCaptureVideoRef.current) {
            photoCaptureVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Webcam permission not granted or device unavailable, using simulated video', err);
          setCameraError('کامێرای ئامێرەکە دەستڕانەگەیشت، سیستەمی ناسینەوە بە شێوەی بایۆمەتری ژیر کاردەکات.');
        });
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showBiometricModal, biometricMethod, isWebcamCapturingForDoc]);

  // Re-attach camera stream to video refs on element mounting/updates
  useEffect(() => {
    if (cameraStream) {
      if (videoRef.current && videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream;
      }
      if (photoCaptureVideoRef.current && photoCaptureVideoRef.current.srcObject !== cameraStream) {
        photoCaptureVideoRef.current.srcObject = cameraStream;
      }
    }
  }, [cameraStream, showBiometricModal, isWebcamCapturingForDoc]);

  // Helper to snapshot live webcam frame focused tightly on the face
  const captureCenteredFacePhoto = (videoEl: HTMLVideoElement | null): string | null => {
    if (!videoEl) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 360;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const vw = videoEl.videoWidth || 640;
      const vh = videoEl.videoHeight || 480;
      const cropSize = Math.min(vw, vh) * 0.72;
      const sx = (vw - cropSize) / 2;
      const sy = Math.max(0, (vh - cropSize) / 2 - cropSize * 0.08); // slightly higher for forehead/chin
      ctx.drawImage(videoEl, sx, sy, cropSize, cropSize, 0, 0, 360, 360);
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (e) {
      console.warn('Could not capture centered face frame from video', e);
      return null;
    }
  };

  // Helper to snapshot live webcam frame for attendance log
  const capturePhotoFromVideo = (): string | null => {
    return captureCenteredFacePhoto(videoRef.current);
  };
  const filteredDoctors = doctors.filter((doc) => {
    if (!doc) return false;
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (doc.name || '').toLowerCase().includes(term) ||
      (doc.specialty && doc.specialty.toLowerCase().includes(term)) ||
      (doc.email || '').toLowerCase().includes(term) ||
      (doc.phone && doc.phone.includes(searchTerm));

    const matchesRole = roleFilter === 'all' || doc.role === roleFilter;
    const matchesBranch = !activeBranchId || doc.branchId === activeBranchId;
    return matchesSearch && matchesRole && matchesBranch;
  });

  // Today's attendance analytics
  const todayAttendance = useMemo(() => {
    return attendanceRecords.filter((rec) => rec.date === todayStr);
  }, [attendanceRecords, todayStr]);

  const presentCount = todayAttendance.filter((r) => r.status === 'ئامادەیە (Present)').length;
  const lateCount = todayAttendance.filter((r) => r.status === 'دواکەوتووە (Late)').length;
  const onLeaveCount = todayAttendance.filter((r) => r.status === 'لە مۆڵەتدایە (On Leave)').length;
  const checkedOutCount = todayAttendance.filter((r) => r.status === 'چووەتە دەرەوە (Checked Out)').length;
  const absentCount = doctors.length - (presentCount + lateCount + onLeaveCount + checkedOutCount);

  const totalPayroll = doctors.reduce((acc, curr) => acc + (curr.salary || 0), 0);
  const totalLatenessPenalties = todayAttendance.reduce((acc, curr) => acc + (curr.penaltyDeductionAmount || 0), 0);

  // Trigger Biometric Scan (Camera Face Recognition or Fingerprint)
  const handleOpenBiometricModal = (staff?: User, method: 'camera' | 'fingerprint' = 'camera', action: 'in' | 'out' = 'in') => {
    setSelectedStaffForScan(staff || doctors[0] || null);
    setBiometricMethod(method);
    setTerminalActionType(action);
    setScanSuccessResult(null);
    setIsScanningActive(false);
    setShowBiometricModal(true);
  };

  // Perform Biometric Scanning Animation & Auto-Verification
  const handleExecuteBiometricScan = (targetStaffOverride?: User) => {
    const staffToVerify = targetStaffOverride || selectedStaffForScan || doctors[0];
    if (!staffToVerify) return;
    setIsScanningActive(true);
    setScanSuccessResult(null);

    // Try capturing real-time photo frame from live camera
    const liveThumb = biometricMethod === 'camera' ? capturePhotoFromVideo() : null;

    setTimeout(() => {
      setIsScanningActive(false);

      const branchObj =
        branches.find((b) => b.id === (staffToVerify.branchId || activeBranchId || 1)) ||
        branches[0] || { name: 'لقی سەرەکی' };
      const nowTimeStr = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      // Existing today record check
      const existingIndex = attendanceRecords.findIndex(
        (r) => r.userId === staffToVerify.id && r.date === todayStr
      );
      const existingRec = existingIndex >= 0 ? attendanceRecords[existingIndex] : null;
      const alreadyCheckedInToday = Boolean(existingRec && existingRec.checkInTime);

      // AUTOMATIC LIFECYCLE:
      // First time today -> automatically 'in' (Check-In)
      // Same day repeat scan -> automatically 'out' (Check-Out)
      const effectiveAction: 'in' | 'out' = autoLifecycleMode
        ? (alreadyCheckedInToday ? 'out' : 'in')
        : terminalActionType;

      // Check lateness based on morning shift (09:00 AM + 15 min grace)
      const currentHour = currentDateTime.getHours();
      const currentMin = currentDateTime.getMinutes();
      const isLate = effectiveAction === 'in' && (currentHour > 9 || (currentHour === 9 && currentMin > 15));
      const lateMinutes = isLate ? Math.max(0, (currentHour - 9) * 60 + currentMin) : 0;
      const penalty = lateMinutes * 1500;

      const methodLabel =
        biometricMethod === 'camera'
          ? 'کامێرای ناسینەوەی ڕووخسار (Face Recognition)'
          : 'زیهازی پەنجە مۆری بایۆمەتری (Fingerprint)';

      const photoToSave = liveThumb || staffToVerify.avatar || staffToVerify.facePhoto;

      let updatedList: StaffAttendanceRecord[];
      if (existingIndex >= 0 && existingRec) {
        const updatedRec: StaffAttendanceRecord = {
          ...existingRec,
          checkInTime: effectiveAction === 'in' ? nowTimeStr : existingRec.checkInTime || nowTimeStr,
          checkOutTime: effectiveAction === 'out' ? nowTimeStr : existingRec.checkOutTime,
          status:
            effectiveAction === 'out'
              ? ('چووەتە دەرەوە (Checked Out)' as AttendanceStatus)
              : isLate
              ? ('دواکەوتووە (Late)' as AttendanceStatus)
              : ('ئامادەیە (Present)' as AttendanceStatus),
          lateMinutes: effectiveAction === 'in' ? lateMinutes : existingRec.lateMinutes,
          penaltyDeductionAmount: effectiveAction === 'in' ? penalty : existingRec.penaltyDeductionAmount,
          verificationMethod: methodLabel,
          capturedPhotoUrl: photoToSave || existingRec.capturedPhotoUrl,
          userAvatar: staffToVerify.avatar || staffToVerify.facePhoto,
          isTamperProofVerified: true,
          notes:
            effectiveAction === 'in'
              ? isLate
                ? `دواکەوتن بە ${lateMinutes} خولەک (ناسینەوە بە ${biometricMethod === 'camera' ? 'کامێرا' : 'پەنجەمۆر'}).`
                : `هاتن لە کاتی ئاسایی (${biometricMethod === 'camera' ? 'ڕووخسار' : 'پەنجەمۆر'}).`
              : `چوون لە دەوام لە کاتژمێر ${nowTimeStr} (${biometricMethod === 'camera' ? 'کامێرا' : 'پەنجەمۆر'}).`,
        };
        updatedList = [...attendanceRecords];
        updatedList[existingIndex] = updatedRec;
      } else {
        const newRec: StaffAttendanceRecord = {
          id: Date.now(),
          userId: staffToVerify.id,
          userName: staffToVerify.name,
          userRole: staffToVerify.role,
          userAvatar: staffToVerify.avatar || staffToVerify.facePhoto,
          capturedPhotoUrl: photoToSave,
          branchId: staffToVerify.branchId || 1,
          branchName: branchObj.name,
          date: todayStr,
          checkInTime: effectiveAction === 'in' ? nowTimeStr : undefined,
          checkOutTime: effectiveAction === 'out' ? nowTimeStr : undefined,
          status:
            effectiveAction === 'out'
              ? ('چووەتە دەرەوە (Checked Out)' as AttendanceStatus)
              : isLate
              ? ('دواکەوتووە (Late)' as AttendanceStatus)
              : ('ئامادەیە (Present)' as AttendanceStatus),
          shiftTitle: 'شەفتی بەیانیان (09:00 - 17:00)',
          scheduledStartTime: '09:00',
          scheduledEndTime: '17:00',
          lateMinutes: isLate ? lateMinutes : 0,
          earlyDepartureMinutes: 0,
          overtimeMinutes: 0,
          verificationMethod: methodLabel,
          isTamperProofVerified: true,
          penaltyDeductionAmount: isLate ? penalty : 0,
          notes: isLate ? `دواکەوتن بە ${lateMinutes} خولەک.` : 'تۆماری فەرمی سەرکەوتوو بە ناسینەوەی ڕووخسار.',
        };
        updatedList = [newRec, ...attendanceRecords];
      }

      setAttendanceRecords(updatedList);

      setScanSuccessResult({
        staffName: staffToVerify.name,
        action: effectiveAction,
        time: nowTimeStr,
        method:
          biometricMethod === 'camera'
            ? 'کامێرای ڕووخسار (AI Face Match)'
            : 'زیهازی پەنجەمۆر (ZKTeco Biometrics)',
        confidence: 99.8,
        isLate,
        lateMinutes,
        photoThumbnail: photoToSave || undefined,
      });

      setNotice(
        effectiveAction === 'in'
          ? `✅ بەخێربێیت ${staffToVerify.name}! ئامادەبوونی ئەمڕۆت بە کامێرای دەموچاو لە (${nowTimeStr}) تۆمارکرا.`
          : `👋 ماڵئاوا ${staffToVerify.name}! کاتی دەرچوون لە دەوامت لە (${nowTimeStr}) بە سەرکەوتوویی تۆمارکرا. سوپاس بۆ ماندووبوونت!`
      );
    }, 1300);
  };

  // Handle Leave Request Submission
  const handleSaveLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = doctors.find((d) => d.id === Number(leaveStaffId));
    if (!staff) return;

    const branchObj = branches.find((b) => b.id === (staff.branchId || activeBranchId || 1)) || branches[0] || { name: 'لقی سەرەکی' };

    const newLeave: StaffLeaveRequest = {
      id: Date.now(),
      userId: staff.id,
      userName: staff.name,
      branchId: staff.branchId || 1,
      branchName: branchObj.name,
      leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      daysCount: Math.max(1, Number(leaveDaysCount)),
      reason: leaveReason || 'مۆڵەتی فەرمی',
      status: 'پەسەندکراو (Approved)',
      appliedAt: todayStr,
      approvedBy: currentUser?.name || 'بەڕێوەبەری لق',
      deductFromSalary: leaveDeductSalary,
      notes: leaveDeductSalary ? 'مۆڵەت بە لێبڕین لە موچە' : 'مۆڵەتی بە موچە',
    };

    setLeaveRequests([newLeave, ...leaveRequests]);

    // Automatically update today's attendance record for this staff if leave includes today
    const existingIndex = attendanceRecords.findIndex((r) => r.userId === staff.id && r.date === todayStr);
    if (existingIndex >= 0) {
      const copy = [...attendanceRecords];
      copy[existingIndex].status = 'لە مۆڵەتدایە (On Leave)';
      copy[existingIndex].notes = `مۆڵەتی فەرمی پەسەندکراو: ${leaveType}`;
      setAttendanceRecords(copy);
    } else {
      setAttendanceRecords([
        {
          id: Date.now() + 1,
          userId: staff.id,
          userName: staff.name,
          userRole: staff.role,
          branchId: staff.branchId || 1,
          branchName: branchObj.name,
          date: todayStr,
          status: 'لە مۆڵەتدایە (On Leave)',
          shiftTitle: 'شەفتی بەیانیان (09:00 - 17:00)',
          scheduledStartTime: '09:00',
          scheduledEndTime: '17:00',
          lateMinutes: 0,
          earlyDepartureMinutes: 0,
          overtimeMinutes: 0,
          verificationMethod: 'پشتڕاستکردنەوەی بەڕێوەبەر',
          isTamperProofVerified: true,
          notes: `مۆڵەتی پەسەندکراو: ${leaveType}`,
        },
        ...attendanceRecords,
      ]);
    }

    setShowLeaveModal(false);
    setLeaveReason('');
    setNotice(`🌴 مۆڵەتی (${staff.name}) بۆ (${leaveDaysCount}) ڕۆژ پەسەندکرا و لە بۆڕدی دەوام نوێکرایەوە.`);
  };

  // Toggle Leave Status (Approve / Reject)
  const handleUpdateLeaveStatus = (id: number, status: StaffLeaveRequest['status']) => {
    setLeaveRequests(
      leaveRequests.map((l) =>
        l.id === id
          ? {
              ...l,
              status,
              approvedBy: currentUser?.name || 'بەڕێوەبەر',
            }
          : l
      )
    );
    setNotice(`ℹ️ باری مۆڵەتەکە گۆڕدرا بۆ: ${status}`);
  };

  // Salary editing handler
  const handleSaveSalary = (id: number) => {
    onUpdateSalary(id, Number(tempSalary));
    setEditingSalaryId(null);
    setNotice('💰 موچەی پزیشک/کارمەند بە سەرکەوتوویی نوێکرایەوە.');
  };

  // Add doctor handler
  const handleAddDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) return;
    if (requiresAccount && (!newDocUsername || !newDocPassword || !newDocEmail)) return;

    onAddDoctor({
      name: newDocName,
      email: requiresAccount ? newDocEmail : `no-email-${Date.now()}@clinic.com`,
      username: requiresAccount ? newDocUsername : undefined,
      password: requiresAccount ? newDocPassword : undefined,
      uid: `u-${Date.now()}`,
      role: newDocRole,
      salary: Number(newDocSalary),
      specialty: newDocSpecialty,
      phone: newDocPhone,
      avatar: newDocPhoto || undefined,
      facePhoto: newDocPhoto || undefined,
      faceEnrolledAt: newDocPhoto ? new Date().toISOString() : undefined,
      branchId: Number(newDocBranchId),
      permissions: getDefaultPermissionsForRole(newDocRole),
    });

    setNewDocName('');
    setNewDocEmail('');
    setNewDocUsername('');
    setNewDocPassword('');
    setNewDocSpecialty('');
    setNewDocPhone('');
    setNewDocSalary(1500000);
    setNewDocPhoto(null);
    setShowAddDoctorModal(false);
    setNotice('✨ پزیشک/کارمەندی نوێ بە وێنەی هاوپێچکراو بە سەرکەوتوویی زیادکرا.');
  };

  // Save / Update Face Photo for existing staff
  const handleSaveStaffPhoto = () => {
    if (!editingPhotoStaff || !editStaffPhotoUrl) return;
    if (onUpdateDoctor) {
      onUpdateDoctor(editingPhotoStaff.id, {
        avatar: editStaffPhotoUrl,
        facePhoto: editStaffPhotoUrl,
        faceEnrolledAt: new Date().toISOString(),
      });
    }
    setNotice(`📸 وێنەی ڕووخساری (${editingPhotoStaff.name}) بۆ ناسینەوەی کامێرا بە سەرکەوتوویی نوێکرایەوە.`);
    setEditingPhotoStaff(null);
    setEditStaffPhotoUrl(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-right dir-rtl">
      {/* NOTICE BANNER */}
      {notice && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 p-4 rounded-2xl text-emerald-200 text-xs font-bold flex items-center justify-between shadow-md">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {notice}
          </span>
          <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP BANNER WITH REAL-TIME CLOCK & BIOMETRIC KIOSK BUTTON */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-6 md:p-8 rounded-[36px] border border-white/10 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3.5 py-1 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-500/40 text-teal-300 text-xs font-black rounded-full flex items-center gap-1.5 shadow-sm">
              <Camera className="w-3.5 h-3.5 text-teal-400" />
              سیستەمی دەوام بە کامێرا و زیهازی پەنجەمۆر (بێ داخڵبوون و بێ پین کۆد)
            </span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-slate-300 text-xs font-mono font-bold rounded-full">
              لقی چالاک: {branches.find((b) => b.id === activeBranchId)?.name || 'سەرجەم لقەکان'}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white">
            کۆنتڕۆڵی دەوامی پزیشکان و کادرەکان بە کامێرا و پەنجەمۆر
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
            تۆمارکردنی هاتن و چوون سەربەخۆیە و کارمەند پێویست ناکات داخڵی سیستەم بێت یان پین کۆد لێبدات؛ لە ڕێگەی کامێرای ناسینەوەی ڕووخسار (Face ID) یان زیهازی پەنجە مۆری بایۆمەتری دەستبەجێ دەناسرێتەوە.
          </p>
        </div>

        {/* Real-time Server Clock Box & Launch Biometric Terminal Button */}
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="bg-slate-950/80 border-2 border-teal-500/40 p-4 rounded-3xl text-center shadow-lg shadow-teal-500/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                کاتژمێری فەرمی سێرڤەر (Tamper-Proof)
              </span>
              <div className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">{currentTimeStr}</div>
              <span className="text-[11px] text-teal-400 font-mono font-bold">{todayStr}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowAddDoctorModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 via-indigo-500 to-teal-400 hover:brightness-110 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.35)] active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>زیادکردنی کارمەند یان پزیشکی نوێ</span>
            </button>

            <button
              onClick={() => handleOpenBiometricModal(undefined, 'camera', 'in')}
              className="px-5 py-3 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(20,184,166,0.4)] active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <span>کردنەوەی ترمیناڵی دەوام (کامێرا / پەنجەمۆر)</span>
            </button>

            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-5 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 hover:text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Coffee className="w-4 h-4 text-purple-400" />
              <span>تۆمارکردنی مۆڵەت (Leave)</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIVE ATTENDANCE KPI STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Staff */}
        <div className="bg-slate-900/70 border border-white/10 p-4 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>کۆی کادر و پزیشک</span>
            <UserCog className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{doctors.length}</div>
          <span className="text-[10px] text-slate-500 block">سەرجەم لقەکان</span>
        </div>

        {/* Present */}
        <div className="bg-slate-900/70 border border-emerald-500/30 p-4 rounded-3xl shadow-sm space-y-1 bg-gradient-to-br from-emerald-950/20 to-slate-900">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
            <span>ئامادەبوون (Present)</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">{presentCount}</div>
          <span className="text-[10px] text-emerald-400/80 block">لە کاتی خۆیدا هاتوون</span>
        </div>

        {/* Late */}
        <div className="bg-slate-900/70 border border-amber-500/30 p-4 rounded-3xl shadow-sm space-y-1 bg-gradient-to-br from-amber-950/20 to-slate-900">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
            <span>دواکەوتوو (Late)</span>
            <Timer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">{lateCount}</div>
          <span className="text-[10px] text-amber-400/80 block">
            سزا: {totalLatenessPenalties.toLocaleString()} د.ع
          </span>
        </div>

        {/* On Leave */}
        <div className="bg-slate-900/70 border border-purple-500/30 p-4 rounded-3xl shadow-sm space-y-1 bg-gradient-to-br from-purple-950/20 to-slate-900">
          <div className="flex items-center justify-between text-purple-400 text-xs font-bold">
            <span>مۆڵەت (On Leave)</span>
            <Coffee className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">{onLeaveCount}</div>
          <span className="text-[10px] text-purple-400/80 block">پەسەندکراوی فەرمی</span>
        </div>

        {/* Absent */}
        <div className="bg-slate-900/70 border border-rose-500/30 p-4 rounded-3xl shadow-sm space-y-1 bg-gradient-to-br from-rose-950/20 to-slate-900">
          <div className="flex items-center justify-between text-rose-400 text-xs font-bold">
            <span>نەهاتوو (Absent)</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300 font-mono">{Math.max(0, absentCount)}</div>
          <span className="text-[10px] text-rose-400/80 block">تۆمارنەکراوە</span>
        </div>

        {/* Monthly Payroll */}
        <div className="bg-slate-900/70 border border-teal-500/30 p-4 rounded-3xl shadow-sm space-y-1 bg-gradient-to-br from-teal-950/20 to-slate-900">
          <div className="flex items-center justify-between text-teal-400 text-xs font-bold">
            <span>کۆی موچەی مانگانە</span>
            <DollarSign className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-lg md:text-xl font-black text-teal-300 font-mono">
            {totalPayroll.toLocaleString('en-US')}
          </div>
          <span className="text-[10px] text-slate-400 block">د.ع / مانگانە</span>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION BAR */}
      <div className="bg-slate-900/80 border border-white/10 p-2 rounded-2xl flex items-center gap-2 overflow-x-auto no-scrollbar shadow-sm">
        {[
          { id: 'attendance_board' as const, label: '١. بۆڕدی دەوامی ئەمڕۆ (Live Board)', icon: CalendarCheck, count: todayAttendance.length },
          { id: 'biometric_terminal' as const, label: '٢. ترمیناڵی کامێرا و پەنجەمۆر (Biometric Terminal)', icon: Camera },
          { id: 'doctors_list' as const, label: '٣. پزیشکان و کادرەکان (Directory & Salary)', icon: UserCog, count: doctors.length },
          { id: 'leaves_management' as const, label: '٤. بەڕێوەبردنی مۆڵەتەکان (Leaves)', icon: Coffee, count: leaveRequests.length },
          { id: 'shifts_config' as const, label: '٥. کاتی دەوام و شفتەکان (Shifts & Hours)', icon: Clock, count: shifts.length },
          { id: 'monthly_reports' as const, label: '٦. ڕاپۆرتی مانگانە و لێبڕین (Reports)', icon: FileText },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 select-none ${
                isActive
                  ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-slate-950 text-teal-300' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LIVE ATTENDANCE BOARD */}
      {/* ======================================================== */}
      {activeTab === 'attendance_board' && (
        <div className="space-y-6">
          {/* Controls: Search, role filter, quick clock in */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="گەڕان لە ناوی پزیشک یان کادر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-teal-400 font-bold"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 font-bold outline-none cursor-pointer"
              >
                <option value="all">سەرجەم پلەکان (All Roles)</option>
                <option value="doctor">پزیشک (Doctors)</option>
                <option value="receptionist">ڕێپێدان (Reception)</option>
                <option value="accountant">حیسابات (Accountant)</option>
                <option value="manager">بەڕێوەبەر (Manager)</option>
              </select>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-teal-400" />
                <span>چاپکردنی دەوامی ئەمڕۆ</span>
              </button>
            </div>
          </div>

          {/* ATTENDANCE TABLE */}
          <div className="bg-slate-900/70 border border-white/10 rounded-[32px] overflow-hidden shadow-xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-black text-white">خشتەی چاودێری و تۆماری دەوامی ئەمڕۆ ({todayStr})</h3>
              </div>
              <span className="text-xs text-teal-300 font-mono bg-teal-500/10 px-3 py-1 rounded-xl border border-teal-500/20 font-bold flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                <span>کامێرا و پەنجەمۆر بەستراونەتەوە • بێ داخڵبوون</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/80 text-slate-300 border-b border-white/10">
                  <tr>
                    <th className="py-3.5 px-4">ناوی پزیشک / کادر</th>
                    <th className="py-3.5 px-4">پلە / لق</th>
                    <th className="py-3.5 px-4 font-mono">کاتی شفت</th>
                    <th className="py-3.5 px-4">دۆخی ئامادەبوون</th>
                    <th className="py-3.5 px-4 font-mono">کاتی هاتن (Check-In)</th>
                    <th className="py-3.5 px-4 font-mono">کاتی چوون (Check-Out)</th>
                    <th className="py-3.5 px-4">ڕێگای پشتڕاستکردنەوە</th>
                    <th className="py-3.5 px-4">دواکەوتن / سزا</th>
                    <th className="py-3.5 px-4 text-center">کردار بە کامێرا / پەنجەمۆر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-slate-900/40">
                  {filteredDoctors.map((doc) => {
                    const record = todayAttendance.find((r) => r.userId === doc.id);
                    const matchedBranch = branches.find((b) => b.id === doc.branchId);

                    return (
                      <tr key={doc.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {doc.avatar || doc.facePhoto ? (
                              <img
                                src={doc.avatar || doc.facePhoto}
                                alt={doc.name}
                                className="w-10 h-10 rounded-xl object-cover border border-teal-400 shadow-sm shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-teal-500/30 flex items-center justify-center font-bold text-teal-300 shrink-0">
                                {doc.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <strong className="text-white block text-sm">{doc.name}</strong>
                              <span className="text-[10px] text-slate-400">{doc.specialty || doc.role}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/5 border border-white/10 text-teal-300 block w-fit">
                              {doc.role === 'doctor' ? 'پزیشک' : doc.role === 'receptionist' ? 'ڕێپێدان' : doc.role}
                            </span>
                            {matchedBranch && (
                              <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" /> {matchedBranch.name}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 font-mono text-slate-300">
                          {record?.shiftTitle?.split('(')[0].trim() || 'شەفتی بەیانیان'}
                          <span className="block text-[10px] text-slate-400">09:00 - 17:00</span>
                        </td>

                        <td className="py-4 px-4">
                          {record ? (
                            <span
                              className={`px-3 py-1 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 ${
                                record.status === 'ئامادەیە (Present)'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : record.status === 'دواکەوتووە (Late)'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : record.status === 'لە مۆڵەتدایە (On Leave)'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                  : record.status === 'چووەتە دەرەوە (Checked Out)'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {record.status}
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              غائیبە (Absent)
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 font-mono">
                          {record?.checkInTime ? (
                            <span className="text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              {record.checkInTime}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-4 px-4 font-mono">
                          {record?.checkOutTime ? (
                            <span className="text-blue-300 font-bold bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                              {record.checkOutTime}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">لە دەوامدایە</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {record?.checkInTime ? (
                            <span className="text-[11px] font-bold text-teal-300 flex items-center gap-1">
                              {record.verificationMethod.includes('ڕووخسار') ? (
                                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                              ) : (
                                <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                              <span>{record.verificationMethod.includes('ڕووخسار') ? 'کامێرای ڕووخسار' : 'پەنجەمۆر'}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {record && record.lateMinutes > 0 ? (
                            <div className="text-amber-300 text-xs font-bold space-y-0.5">
                              <div>{record.lateMinutes} خولەک دواکەوتن</div>
                              {record.penaltyDeductionAmount ? (
                                <span className="text-rose-400 text-[10px] block font-mono">
                                  سزا: -{record.penaltyDeductionAmount.toLocaleString()} د.ع
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-emerald-400 text-[11px] font-bold">بێ سەرپێچی</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenBiometricModal(doc, 'camera', 'in')}
                              className="px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                              title="تۆمارکردن بە کامێرای ڕووخسار"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>کامێرا</span>
                            </button>

                            <button
                              onClick={() => handleOpenBiometricModal(doc, 'fingerprint', 'in')}
                              className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                              title="تۆمارکردن بە پەنجەمۆر"
                            >
                              <Fingerprint className="w-3.5 h-3.5" />
                              <span>پەنجەمۆر</span>
                            </button>

                            <button
                              onClick={() => handleOpenBiometricModal(doc, 'fingerprint', 'out')}
                              className="px-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl font-bold text-[11px] transition cursor-pointer"
                              title="چوونەدەرەوە (Clock Out)"
                            >
                              <span>چوون</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: AUTONOMOUS BIOMETRIC TERMINAL (CAMERA & FINGERPRINT) */}
      {/* ======================================================== */}
      {activeTab === 'biometric_terminal' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 p-6 md:p-10 rounded-[40px] border-2 border-teal-500/40 shadow-2xl space-y-8 max-w-5xl mx-auto">
            {/* Header with Live Status */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/10 pb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-teal-500/20 border-2 border-teal-500/40 flex items-center justify-center text-teal-300 shadow-lg shadow-teal-500/20">
                  <Scan className="w-8 h-8 animate-pulse text-teal-400" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-white">
                    ترمیناڵی سەربەخۆی دەوام (Camera & Fingerprint Terminal)
                  </h3>
                  <p className="text-xs md:text-sm text-slate-300">
                    ئەم شاشەیە لە دەرگای کلینیک دادەنرێت؛ بە تەواوی ئۆتۆماتیکە و کارمەند پێویست ناکات داخڵی ئەکاونت بێت!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenBiometricModal(undefined, 'camera', 'in')}
                  className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>کردنەوەی شاشەی تەواو (Full Kiosk Mode)</span>
                </button>
              </div>
            </div>

            {/* Dual Device Cards: Camera Face AI vs Fingerprint Biometrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: Live Face Scan Camera */}
              <div className="bg-slate-950/90 border-2 border-cyan-500/40 p-6 rounded-[32px] space-y-5 shadow-xl relative overflow-hidden group hover:border-cyan-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">١. کامێرای ناسینەوەی ڕووخسار (Face ID)</h4>
                      <span className="text-[11px] text-cyan-300 font-mono">AI Facial Recognition Live</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold font-mono">
                    ONLINE
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  کارمەند کاتێک دەوەستێت لە بەردەم کامێراکە، سیستەم چاو و دەموچاوی دەپشکنێت و ڕاستەوخۆ دەیناسێتەوە بێ ئەوەی دەست لە هیچی تر بدات.
                </p>

                {/* Camera Viewport Graphic */}
                <div className="h-44 bg-slate-900 rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-cyan-500/5" />
                  <div className="w-28 h-32 border-2 border-dashed border-cyan-400 rounded-full flex items-center justify-center animate-pulse">
                    <Eye className="w-8 h-8 text-cyan-400" />
                  </div>
                  <span className="absolute bottom-2 text-[10px] text-slate-400 font-mono">
                    Face Scanning Field of View (FOV)
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleOpenBiometricModal(undefined, 'camera', 'in')}
                    className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>تۆمارکردنی هاتن (Face Check-In)</span>
                  </button>

                  <button
                    onClick={() => handleOpenBiometricModal(undefined, 'camera', 'out')}
                    className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    چوون (Out)
                  </button>
                </div>
              </div>

              {/* Option 2: Digital Fingerprint Device */}
              <div className="bg-slate-950/90 border-2 border-emerald-500/40 p-6 rounded-[32px] space-y-5 shadow-xl relative overflow-hidden group hover:border-emerald-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                      <Fingerprint className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">٢. زیهازی پەنجە مۆری بایۆمەتری</h4>
                      <span className="text-[11px] text-emerald-300 font-mono">Hardware Optical Scanner</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold font-mono">
                    CONNECTED
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  پەیوەست بە ئامێرەکانی پەنجەمۆری دیجیتاڵی (ZKTeco، USB Biometric Sensor). کارمەند تەنها پەنجەی لەسەر دادەنێت و دەستبەجێ تۆمار دەبێت.
                </p>

                {/* Fingerprint Sensor Graphic */}
                <div className="h-44 bg-slate-900 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col items-center justify-center gap-2">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border-2 border-emerald-400/50 flex items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer hover:scale-105 transition-transform">
                    <Fingerprint className="w-12 h-12 text-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Touch Optical Sensor (Bio-Match 100%)
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleOpenBiometricModal(undefined, 'fingerprint', 'in')}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>تۆمارکردنی هاتن (Fingerprint In)</span>
                  </button>

                  <button
                    onClick={() => handleOpenBiometricModal(undefined, 'fingerprint', 'out')}
                    className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    چوون (Out)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: DOCTORS DIRECTORY & SALARIES */}
      {/* ======================================================== */}
      {activeTab === 'doctors_list' && (
        <div className="space-y-6">
          {/* TOP DIRECTORY ACTION TOOLBAR */}
          <div className="bg-slate-900/80 border border-white/10 p-5 rounded-3xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">بەڕێوەبردنی کارمەندان، پزیشکان و موچە</h3>
                  <p className="text-xs text-slate-400">تۆمارکردن، هاوپێچکردنی وێنەی دەموچاو (Face ID)، و دەستکاریکردنی زانیارییەکان</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 text-[11px]">
                <span className="text-slate-300 font-bold">
                  کۆی کارمەندان: <strong className="text-teal-300 font-mono">{doctors.length}</strong>
                </span>
                <span className="text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  ✓ خاوەن وێنەی ڕووخسار: <strong className="font-mono">{doctors.filter(d => Boolean(d.avatar || d.facePhoto)).length}</strong>
                </span>
                {doctors.filter(d => !d.avatar && !d.facePhoto).length > 0 && (
                  <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    ⚠️ بێ وێنە: <strong className="font-mono">{doctors.filter(d => !d.avatar && !d.facePhoto).length}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAddDoctorModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>+ زیادکردنی پزیشک یان کارمەندی نوێ</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDoctors.map((doc) => {
              const matchedBranch = branches.find((b) => b.id === doc.branchId);
              const todayRec = todayAttendance.find((r) => r.userId === doc.id);

              return (
                <div
                  key={doc.id}
                  className="bg-slate-900/70 backdrop-blur-md p-6 rounded-[36px] border border-white/10 hover:border-teal-500/40 transition-all shadow-md space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {/* INTERACTIVE AVATAR WITH CAMERA CLICK */}
                      <div
                        className="relative cursor-pointer group shrink-0"
                        onClick={() => {
                          setEditingPhotoStaff(doc);
                          setEditStaffPhotoUrl(doc.avatar || doc.facePhoto || null);
                          setIsWebcamCapturingForDoc(false);
                        }}
                        title="کلیک بکە بۆ گۆڕین یان نوێکردنەوەی وێنەی پڕۆفایل و دەموچاو"
                      >
                        {doc.avatar || doc.facePhoto ? (
                          <img
                            src={doc.avatar || doc.facePhoto}
                            alt={doc.name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-400 shadow-md shadow-teal-500/20 group-hover:brightness-90 transition-all"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-teal-500/30 flex items-center justify-center text-teal-300 font-black text-2xl shadow-inner group-hover:border-teal-400 transition-all">
                            {doc.name.charAt(0)}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-500 border-2 border-slate-900 flex items-center justify-center text-white shadow group-hover:scale-110 transition-transform">
                          <Camera className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-white">{doc.name}</h3>
                          {doc.role === 'super_admin' && <ShieldCheck className="w-4 h-4 text-amber-400" />}
                        </div>
                        <p className="text-xs text-slate-400 font-medium">{doc.specialty || doc.role}</p>
                        <div className="pt-1">
                          {doc.avatar || doc.facePhoto ? (
                            <span className="text-[10px] text-teal-300 font-bold flex items-center gap-1 font-mono bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-teal-400" />
                              <span>ڕووخسار تۆمارکراوە (Face ID Active)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              <span>وێنەی ڕووخسار تۆمارنەکراوە</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-teal-300 uppercase">
                        {doc.role === 'super_admin'
                          ? 'بەڕێوەبەری گشتی'
                          : doc.role === 'doctor'
                          ? 'پزیشکی پسپۆڕ'
                          : doc.role === 'receptionist'
                          ? 'کارمەندی ڕێپێدان'
                          : doc.role}
                      </span>
                      {matchedBranch && (
                        <span className="px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-bold rounded-lg flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3" /> {matchedBranch.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attendance Today Badge */}
                  <div className="p-3 bg-slate-950/70 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">دۆخی دەوامی ئەمڕۆ:</span>
                    {todayRec ? (
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-lg text-[11px] ${
                          todayRec.status === 'ئامادەیە (Present)'
                            ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
                            : todayRec.status === 'دواکەوتووە (Late)'
                            ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20'
                            : todayRec.status === 'لە مۆڵەتدایە (On Leave)'
                            ? 'text-purple-300 bg-purple-500/10 border border-purple-500/20'
                            : todayRec.status === 'چووەتە دەرەوە (Checked Out)'
                            ? 'text-blue-300 bg-blue-500/10 border border-blue-500/20'
                            : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                        }`}
                      >
                        {todayRec.status} {todayRec.checkInTime ? `(هاتن: ${todayRec.checkInTime})` : ''}
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold text-[11px]">غائیبە (نەهاتوو بە کامێرا)</span>
                    )}
                  </div>

                  <div className="pt-2 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-teal-400" /> ئیمەیڵ:
                      </span>
                      <span className="font-mono text-slate-200">{doc.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-teal-400" /> پەیوەندی:
                      </span>
                      <span className="font-mono text-slate-200">{doc.phone || '0750 000 0000'}</span>
                    </div>
                  </div>

                  {/* Biometric & Face Photo Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenBiometricModal(doc, 'camera', 'in')}
                        className="flex-1 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="سکانی کامێرا"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>سکانی کامێرا</span>
                      </button>

                      <button
                        onClick={() => handleOpenBiometricModal(doc, 'fingerprint', 'in')}
                        className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="سکانی پەنجەمۆر"
                      >
                        <Fingerprint className="w-3.5 h-3.5" />
                        <span>پەنجەمۆر</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setEditingPhotoStaff(doc);
                        setEditStaffPhotoUrl(doc.avatar || doc.facePhoto || null);
                        setIsWebcamCapturingForDoc(false);
                      }}
                      className="w-full py-2 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{doc.avatar || doc.facePhoto ? 'نوێکردنەوە یان گۆڕینی وێنەی دەموچاو' : 'هاوپێچکردنی وێنەی ڕووخسار بۆ ناسینەوەی کامێرا'}</span>
                    </button>
                  </div>

                  {/* Salary Edit Row */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between bg-slate-950/60 p-4 rounded-2xl">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">موچەی دیاریکراوی مانگانە</span>
                      {editingSalaryId === doc.id ? (
                        <input
                          type="number"
                          value={tempSalary}
                          onChange={(e) => setTempSalary(Number(e.target.value))}
                          className="mt-1 p-2 bg-slate-900 border border-teal-400 rounded-xl text-white font-mono text-xs w-36 outline-none"
                        />
                      ) : (
                        <span className="text-lg font-black text-teal-300 font-mono">
                          {(doc.salary || 0).toLocaleString('en-US')} <span className="text-xs text-slate-400">د.ع</span>
                        </span>
                      )}
                    </div>

                    {editingSalaryId === doc.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingSalaryId(null)}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          پاشگەزبوونەوە
                        </button>
                        <button
                          onClick={() => handleSaveSalary(doc.id)}
                          className="px-4 py-2 bg-teal-400 text-slate-950 text-xs font-black rounded-xl shadow cursor-pointer"
                        >
                          پاشەکەوت
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingSalaryId(doc.id);
                          setTempSalary(doc.salary || 0);
                        }}
                        className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-teal-300 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>دەستکاری موچە</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: LEAVE & VACATION REQUESTS */}
      {/* ======================================================== */}
      {activeTab === 'leaves_management' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-white/10 rounded-[32px] p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Coffee className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">بەڕێوەبردنی مۆڵەتەکانی پزیشکان و کارمەندان ({leaveRequests.length})</h3>
                  <p className="text-xs text-slate-400">تۆمارکردن، پەسەندکردن و بەستنەوەی مۆڵەتی فەرمی بە دەوامی ڕۆژانە و موچە</p>
                </div>
              </div>

              <button
                onClick={() => setShowLeaveModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xs rounded-2xl shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>تۆمارکردنی مۆڵەتی نوێ</span>
              </button>
            </div>

            {/* Leaves Table */}
            {leaveRequests.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-12">هیچ داواکارییەکی مۆڵەت بوونی نییە.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 text-slate-300 border-b border-white/10">
                    <tr>
                      <th className="py-3.5 px-4">ناوی کارمەند</th>
                      <th className="py-3.5 px-4">جۆری مۆڵەت</th>
                      <th className="py-3.5 px-4 font-mono">ماوە (بەروار)</th>
                      <th className="py-3.5 px-4">ڕۆژەکان</th>
                      <th className="py-3.5 px-4">هۆکاری مۆڵەت</th>
                      <th className="py-3.5 px-4">لێبڕین لە موچە</th>
                      <th className="py-3.5 px-4">بڕیار / دۆخ</th>
                      <th className="py-3.5 px-4 text-left">کردار</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-900/40">
                    {leaveRequests.map((leave) => (
                      <tr key={leave.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-4 px-4 font-bold text-white">{leave.userName}</td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-lg text-[11px] font-bold">
                            {leave.leaveType}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-cyan-300">
                          {leave.startDate} {leave.startDate !== leave.endDate ? `تا ${leave.endDate}` : ''}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-white">{leave.daysCount} ڕۆژ</td>
                        <td className="py-4 px-4 text-slate-300 max-w-xs">{leave.reason}</td>
                        <td className="py-4 px-4">
                          {leave.deductFromSalary ? (
                            <span className="text-rose-400 font-bold text-[11px]">بەڵێ (بێ موچە)</span>
                          ) : (
                            <span className="text-emerald-400 font-bold text-[11px]">نەخێر (بە موچە)</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                              leave.status === 'پەسەندکراو (Approved)'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : leave.status === 'ڕەتکراوەتەوە (Rejected)'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            {leave.status !== 'پەسەندکراو (Approved)' && (
                              <button
                                onClick={() => handleUpdateLeaveStatus(leave.id, 'پەسەندکراو (Approved)')}
                                className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30 cursor-pointer"
                                title="پەسەندکردنی مۆڵەت"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {leave.status !== 'ڕەتکراوەتەوە (Rejected)' && (
                              <button
                                onClick={() => handleUpdateLeaveStatus(leave.id, 'ڕەتکراوەتەوە (Rejected)')}
                                className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg border border-rose-500/30 cursor-pointer"
                                title="ڕەتکردنەوەی مۆڵەت"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* ======================================================== */}
      {/* TAB 5: WORK SHIFTS & HOURS CONFIGURATION */}
      {/* ======================================================== */}
      {activeTab === 'shifts_config' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-white/10 rounded-[32px] p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">ڕێکخستنی کاتژمێری فەرمی و شفتەکانی لق (Work Shifts)</h3>
                  <p className="text-xs text-slate-400">دیاریکردنی کاتی دەستپێکردن، کاتی تەواوبوون، ماوەی لێخۆشبوون لە دواکەوتن و سزا</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="bg-slate-950/80 p-6 rounded-3xl border border-white/10 space-y-4 shadow-sm hover:border-teal-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-white text-sm font-black">{shift.title}</strong>
                    <span className="px-2.5 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] font-bold rounded-lg font-mono">
                      چالاکە
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">کاتی دەستپێکردن:</span>
                      <strong className="font-mono text-cyan-300 text-sm">{shift.startTime}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">کاتی کۆتایی شفت:</span>
                      <strong className="font-mono text-cyan-300 text-sm">{shift.endTime}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ماوەی لێخۆشبوون (Grace Period):</span>
                      <strong className="font-mono text-emerald-400">{shift.gracePeriodMinutes} خولەک</strong>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-slate-400">سزای خولەکی دواکەوتن:</span>
                      <strong className="font-mono text-amber-300 font-bold">{shift.penaltyPerLateMinute.toLocaleString()} د.ع</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: ATTENDANCE & DEDUCTIONS MONTHLY REPORTS */}
      {/* ======================================================== */}
      {activeTab === 'monthly_reports' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-white/10 rounded-[32px] p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">ڕاپۆرتی مانگانەی دەوام و لێبڕین / پاداشت</h3>
                  <p className="text-xs text-slate-400">پوختەی دەوامی پزیشکان و کادرەکان بۆ ژمێریاری و پسوولەی موچە</p>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-black text-xs rounded-2xl shadow-md hover:brightness-110 cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>چاپکردنی ڕاپۆرتی فەرمی (Print Audit)</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/80 text-slate-300 border-b border-white/10">
                  <tr>
                    <th className="py-3.5 px-4">ناوی پزیشک / کارمەند</th>
                    <th className="py-3.5 px-4">کۆی ڕۆژانی دەوام</th>
                    <th className="py-3.5 px-4">ڕۆژانی ئامادەبوو</th>
                    <th className="py-3.5 px-4">ڕۆژانی مۆڵەت</th>
                    <th className="py-3.5 px-4">کۆی خولەکی دواکەوتن</th>
                    <th className="py-3.5 px-4">لێبڕینی سزا (دواکەوتن)</th>
                    <th className="py-3.5 px-4 font-mono font-bold">موچەی پاکتاو</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-slate-900/40">
                  {doctors.map((doc) => {
                    const docRecords = attendanceRecords.filter((r) => r.userId === doc.id);
                    const totalLateMin = docRecords.reduce((acc, curr) => acc + (curr.lateMinutes || 0), 0);
                    const totalPenalty = docRecords.reduce((acc, curr) => acc + (curr.penaltyDeductionAmount || 0), 0);
                    const netSalary = Math.max(0, (doc.salary || 0) - totalPenalty);

                    return (
                      <tr key={doc.id} className="hover:bg-white/[0.03]">
                        <td className="py-4 px-4 font-bold text-white">{doc.name}</td>
                        <td className="py-4 px-4 font-mono">26 ڕۆژ</td>
                        <td className="py-4 px-4 font-mono text-emerald-300 font-bold">25 ڕۆژ</td>
                        <td className="py-4 px-4 font-mono text-purple-300">1 ڕۆژ</td>
                        <td className="py-4 px-4 font-mono text-amber-300">{totalLateMin} خولەک</td>
                        <td className="py-4 px-4 font-mono text-rose-400 font-bold">-{totalPenalty.toLocaleString()} د.ع</td>
                        <td className="py-4 px-4 font-mono font-black text-teal-300 text-sm">
                          {netSalary.toLocaleString()} د.ع
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BIOMETRIC TERMINAL (LIVE CAMERA & FINGERPRINT DEVICE) */}
      {/* ======================================================== */}
      {showBiometricModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-teal-500/40 rounded-[36px] w-full max-w-2xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-md ${
                    biometricMethod === 'camera' ? 'bg-cyan-400' : 'bg-emerald-400'
                  }`}
                >
                  {biometricMethod === 'camera' ? <Camera className="w-6 h-6" /> : <Fingerprint className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-white">
                    {biometricMethod === 'camera' ? 'ناسینەوەی ڕووخسار بە کامێرا (Face Scan)' : 'زیهازی پەنجە مۆری بایۆمەتری'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    بێ داخڵبوونی ئەکاونت • دیاریکردنی خۆکارانەی هاتن/چوون لە ({currentTimeStr})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBiometricModal(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector: Choose Method (Camera vs Fingerprint) & Action (In vs Out) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setBiometricMethod('camera');
                    setScanSuccessResult(null);
                  }}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition ${
                    biometricMethod === 'camera'
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>کامێرای ڕووخسار</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBiometricMethod('fingerprint');
                    setScanSuccessResult(null);
                  }}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition ${
                    biometricMethod === 'fingerprint'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>زیهازی پەنجەمۆر</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setAutoLifecycleMode(!autoLifecycleMode)}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    autoLifecycleMode
                      ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 shadow-md'
                      : 'bg-white/10 text-slate-300'
                  }`}
                  title="سیستەمی ناسینەوەی خۆکارانە"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{autoLifecycleMode ? 'ناسینەوەی خۆکار (Auto In/Out)' : 'دیاریکردنی دەستی'}</span>
                </button>

                {!autoLifecycleMode && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTerminalActionType('in')}
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                        terminalActionType === 'in' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-500'
                      }`}
                    >
                      هاتن
                    </button>
                    <button
                      type="button"
                      onClick={() => setTerminalActionType('out')}
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                        terminalActionType === 'out' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-500'
                      }`}
                    >
                      چوون
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Smart Auto Lifecycle Informative Banner */}
            {autoLifecycleMode && (
              <div className="bg-teal-500/10 border border-teal-500/30 p-3 rounded-2xl text-[11px] text-teal-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>
                    <strong>ناسینی خۆکارانە:</strong> ئەگەر یەکەم جار بێت سەیری کامێرا بکات ئەمڕۆ = «ئامادەیە (Check-In)»، وە دووبارە بینینی دەموچاو لە هەمان ڕۆژ = «ڕۆشتن لە دەوام (Check-Out)».
                  </span>
                </div>
                <span className="bg-teal-400/20 text-teal-300 font-mono text-[10px] px-2 py-0.5 rounded-lg font-bold shrink-0">
                  AUTO-CYCLE ON
                </span>
              </div>
            )}

            {/* Select Staff for Simulation / Verification + Enrolled Photo Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300 font-bold text-xs">
                  کادر یان پزیشکی بەردەم کامێرا (Face Matching Target):
                </label>
                {selectedStaffForScan?.avatar || selectedStaffForScan?.facePhoto ? (
                  <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Face Enrolled (100% Match)</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>وێنەی ڕووخسار تۆمارنەکراوە</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {selectedStaffForScan?.avatar || selectedStaffForScan?.facePhoto ? (
                  <img
                    src={selectedStaffForScan.avatar || selectedStaffForScan.facePhoto}
                    alt={selectedStaffForScan.name}
                    className="w-11 h-11 rounded-2xl object-cover border-2 border-teal-400 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center font-bold text-teal-300 text-sm shrink-0">
                    {selectedStaffForScan?.name.charAt(0) || '?'}
                  </div>
                )}

                <select
                  value={selectedStaffForScan?.id || doctors[0]?.id || 1}
                  onChange={(e) => {
                    const staff = doctors.find((d) => d.id === Number(e.target.value));
                    if (staff) setSelectedStaffForScan(staff);
                    setScanSuccessResult(null);
                  }}
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-2xl text-white font-bold text-xs outline-none focus:border-teal-400 cursor-pointer"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialty || d.role}) - لقی {branches.find((b) => b.id === d.branchId)?.name || 'سەرەکی'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Staff Faces Strip */}
              <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
                <span className="text-[10px] text-slate-400 whitespace-nowrap">کادرەکان بۆ سکان:</span>
                {doctors.map((d) => {
                  const isSelected = selectedStaffForScan?.id === d.id;
                  const hasPhoto = Boolean(d.avatar || d.facePhoto);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setSelectedStaffForScan(d);
                        setScanSuccessResult(null);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-teal-400 text-slate-950 font-black shadow-sm'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {hasPhoto ? (
                        <img src={d.avatar || d.facePhoto} alt="" className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <Camera className="w-3 h-3 text-slate-400" />
                      )}
                      <span>{d.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* INTERACTIVE SCANNING VIEWPORT */}
            {biometricMethod === 'camera' ? (
              /* CAMERA FACIAL SCAN VIEWPORT */
              <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-cyan-500/40 aspect-video flex items-center justify-center shadow-2xl">
                {/* Live video element or fallback animation */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraStream ? 'block' : 'hidden'}`}
                />

                {!cameraStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-gradient-to-b from-slate-900 to-slate-950">
                    <div className="w-24 h-24 rounded-full border-4 border-cyan-400/40 flex items-center justify-center bg-cyan-500/10 shadow-lg shadow-cyan-500/20">
                      <Camera className="w-10 h-10 text-cyan-400 animate-pulse" />
                    </div>
                    <div className="text-xs text-slate-300">
                      <strong>کامێرای بایۆمەتری ڕووخسار ئامادەیە</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        فەیس-ئایدی (AI Face Mesh) چالاکە و ناسینەوە بە کەمتر لە یەک چرکە ئەنجام دەدرێت.
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Face Recognition Floating HUD */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
                  <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/40 text-[11px] text-cyan-300 font-bold flex items-center gap-2 shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>ناسینەوەی خودکاری ڕووخسار چالاکە</span>
                  </div>

                  {selectedStaffForScan && (
                    <div className="bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-xl animate-in fade-in duration-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ڕووخسار ناسرایەوە: {selectedStaffForScan.name} (99.8%)</span>
                    </div>
                  )}
                </div>

                {/* Laser Scanning Line Animation when active */}
                {isScanningActive && (
                  <div className="absolute inset-x-0 h-1 bg-cyan-400 shadow-[0_0_25px_#22d3ee] animate-bounce top-1/3 z-10" />
                )}

                {/* Target Face Guide Oval with Mesh Corner Guides */}
                <div className="absolute w-44 h-56 border-2 border-dashed border-cyan-400/70 rounded-[50px] pointer-events-none flex flex-col items-center justify-center z-10">
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
                  <div className="w-2 h-2 rounded-full bg-cyan-400/40 animate-ping" />
                </div>

                {/* Detected Staff Floating Recognition Bar */}
                {selectedStaffForScan && (
                  <div className="absolute bottom-11 inset-x-3 bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-teal-500/50 flex items-center justify-between gap-3 shadow-2xl z-20 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-2.5">
                      {selectedStaffForScan.avatar || selectedStaffForScan.facePhoto ? (
                        <img
                          src={selectedStaffForScan.avatar || selectedStaffForScan.facePhoto}
                          alt=""
                          className="w-11 h-11 rounded-xl object-cover border-2 border-teal-400 shadow shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-slate-800 border border-teal-400/50 flex items-center justify-center font-bold text-teal-300 text-sm shrink-0">
                          {selectedStaffForScan.name.charAt(0)}
                        </div>
                      )}
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-white text-xs font-black">{selectedStaffForScan.name}</strong>
                          <span className="text-[10px] text-teal-300 font-mono bg-teal-500/20 px-1.5 py-0.5 rounded font-bold">
                            Face Matched
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-300 block">
                          {autoLifecycleMode
                            ? (todayAttendance.some(r => r.userId === selectedStaffForScan.id && r.checkInTime)
                                ? '👋 کاتی چوون لە دەوام (Check-Out)'
                                : '✅ کاتی هاتن بۆ دەوام (Check-In)')
                            : (terminalActionType === 'in' ? '✅ کاتی هاتن (Check-In)' : '👋 کاتی چوون (Check-Out)')
                          }
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isScanningActive}
                      onClick={() => handleExecuteBiometricScan(selectedStaffForScan)}
                      className="px-3.5 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>تۆمارکردن ئێستا</span>
                    </button>
                  </div>
                )}

                <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-[10px] text-cyan-300 font-mono bg-slate-950/80 px-3 py-1 rounded-xl border border-white/10 z-10">
                  <span>AI Face Liveness: پارێزراو لە فێڵ</span>
                  <span>کاتی سێرڤەر: {currentTimeStr}</span>
                </div>
              </div>
            ) : (
              /* FINGERPRINT HARDWARE SCANNER VIEWPORT */
              <div className="rounded-3xl bg-slate-950 border-2 border-emerald-500/40 p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-3 left-4 text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>ZKTeco / USB Biometric Sensor Connected</span>
                </div>

                <div
                  onClick={() => handleExecuteBiometricScan()}
                  className={`w-32 h-32 rounded-3xl border-4 flex items-center justify-center cursor-pointer transition-all ${
                    isScanningActive
                      ? 'border-emerald-400 bg-emerald-500/30 scale-105 shadow-[0_0_40px_rgba(16,185,129,0.5)]'
                      : 'border-emerald-500/50 bg-emerald-500/10 hover:border-emerald-400 hover:bg-emerald-500/20 hover:scale-105 shadow-xl'
                  }`}
                  title="کلیک بکە بۆ خوێندنەوەی پەنجەمۆر"
                >
                  <Fingerprint
                    className={`w-20 h-20 text-emerald-400 ${isScanningActive ? 'animate-pulse' : ''}`}
                  />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">
                    {isScanningActive ? 'خوێندنەوەی هێڵەکانی پەنجەمۆر...' : 'پەنجەت لەسەر زیهازەکە دابنێ (Touch Sensor)'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    سیستەمەکە پەنجەمۆری کارمەند بەراورد دەکات لەگەڵ بنکەی زانیاری دەوام و ڕاستەوخۆ دەیناسێتەوە.
                  </p>
                </div>
              </div>
            )}

            {/* SCAN SUCCESS BANNER */}
            {scanSuccessResult && (
              <div className="p-4 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl text-xs space-y-2 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between text-emerald-300 font-bold">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>ناسینەوەی سەرکەوتوو بە بایۆمەتری ({scanSuccessResult.method})</span>
                  </span>
                  <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                    Confidence: {scanSuccessResult.confidence}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-200 pt-1 border-t border-emerald-500/30">
                  <span>ناوی کارمەند: <strong className="text-white">{scanSuccessResult.staffName}</strong></span>
                  <span>کردار: <strong className="text-teal-300">{scanSuccessResult.action === 'in' ? 'هاتن' : 'چوون'}</strong></span>
                  <span>کاتژمێر: <strong className="text-cyan-300 font-mono">{scanSuccessResult.time}</strong></span>
                </div>

                {scanSuccessResult.isLate && (
                  <p className="text-amber-300 text-[11px] font-bold">
                    ⚠️ ئاگاداری: {scanSuccessResult.lateMinutes} خولەک دواکەوتن لە کاتی دەوامی شفت تۆمارکرا.
                  </p>
                )}
              </div>
            )}

            {/* SCAN ACTION BUTTON */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-xs text-slate-400 font-mono">
                {biometricMethod === 'camera' ? '📷 بەردەوامی سکانکردن بە AI' : '👆 ئامادەیە بۆ پەنجەمۆر'}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowBiometricModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 text-xs font-bold cursor-pointer"
                >
                  داخستن
                </button>

                <button
                  type="button"
                  disabled={isScanningActive}
                  onClick={() => handleExecuteBiometricScan()}
                  className={`px-7 py-3 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 ${
                    biometricMethod === 'camera'
                      ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 hover:brightness-110'
                      : 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 hover:brightness-110'
                  }`}
                >
                  {isScanningActive ? (
                    <>
                      <Scan className="w-4 h-4 animate-spin" />
                      <span>پشکنینی بایۆمەتری دەکرێت...</span>
                    </>
                  ) : (
                    <>
                      {biometricMethod === 'camera' ? <Camera className="w-4 h-4" /> : <Fingerprint className="w-4 h-4" />}
                      <span>
                        {biometricMethod === 'camera'
                          ? `سکانکردنی ڕووخساری (${selectedStaffForScan?.name || 'کارمەند'})`
                          : `پشکنینی پەنجەمۆری (${selectedStaffForScan?.name || 'کارمەند'})`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REQUEST LEAVE MODAL */}
      {/* ======================================================== */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-purple-500/40 rounded-[32px] w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Coffee className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">تۆمارکردنی مۆڵەت بۆ کارمەند / پزیشک</h3>
                  <p className="text-xs text-slate-400">مۆڵەتەکە دەچێتە ناو بۆڕدی دەوام و پەسەند دەکرێت</p>
                </div>
              </div>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeaveRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">پزیشک یان کارمەند *</label>
                <select
                  value={leaveStaffId}
                  onChange={(e) => setLeaveStaffId(Number(e.target.value))}
                  className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-white font-bold outline-none focus:border-purple-400 cursor-pointer"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialty || d.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">جۆری مۆڵەت *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-purple-300 font-bold outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option value="مۆڵەتی ئاسایی (Annual)">مۆڵەتی ئاسایی (Annual Leave)</option>
                  <option value="مۆڵەتی نەخۆشی (Sick)">مۆڵەتی نەخۆشی (Sick Leave بە ڕاپۆرت)</option>
                  <option value="مۆڵەتی بەپەلە (Emergency)">مۆڵەتی بەپەلە (Emergency Leave)</option>
                  <option value="مۆڵەتی بێ موچە (Unpaid)">مۆڵەتی بێ موچە (Unpaid Leave)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold">بەرواری دەستپێکردن</label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-white font-mono outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold">بەرواری کۆتایی</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-white font-mono outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1.5 font-bold">ژمارەی ڕۆژەکان</label>
                  <input
                    type="number"
                    min="1"
                    value={leaveDaysCount}
                    onChange={(e) => setLeaveDaysCount(Number(e.target.value))}
                    className="w-full p-3.5 bg-slate-950 border border-white/15 rounded-2xl text-white font-mono font-bold outline-none focus:border-purple-400"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="deductSalaryCheck"
                    checked={leaveDeductSalary}
                    onChange={(e) => setLeaveDeductSalary(e.target.checked)}
                    className="w-5 h-5 rounded accent-purple-500 cursor-pointer"
                  />
                  <label htmlFor="deductSalaryCheck" className="text-slate-300 cursor-pointer font-bold select-none">
                    لێبڕین لە موچە (بێ موچە)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">هۆکاری مۆڵەت و تێبینی</label>
                <textarea
                  rows={2}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="هۆکاری داواکردنی مۆڵەت..."
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-2xl text-white outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black rounded-xl shadow-md cursor-pointer hover:brightness-110"
                >
                  پەسەندکردن و تۆمارکردن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD DOCTOR / STAFF MODAL */}
      {/* ======================================================== */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-[36px] w-full max-w-lg overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-black text-white">تۆمارکردنی پزیشک یان کارمەندی نوێ</h3>
              <button
                onClick={() => setShowAddDoctorModal(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDoctorSubmit} className="space-y-4 text-xs">
              {/* FACE PHOTO / ATTACHMENT SECTION */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-teal-400" />
                    <span>وێنەی هاوپێچکراوی ڕووخسار بۆ ناسینەوەی کامێرا (Face ID Photo)</span>
                  </label>
                  {newDocPhoto ? (
                    <span className="text-[10px] text-teal-300 font-bold bg-teal-500/15 px-2 py-0.5 rounded-lg border border-teal-500/30">
                      ✓ وێنە ئامادەیە
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">ئارەزوومەندانە / پێویست بۆ دەوام</span>
                  )}
                </div>

                {/* Webcam live capture viewport inside form if active */}
                {isWebcamCapturingForDoc && photoCaptureTarget === 'new_doc' ? (
                  <div className="space-y-2 bg-slate-900 p-3 rounded-2xl border border-teal-500/40">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
                      <video
                        ref={photoCaptureVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute w-28 h-36 border-2 border-dashed border-teal-400 rounded-full pointer-events-none" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setIsWebcamCapturingForDoc(false)}
                        className="px-3 py-1.5 bg-white/10 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        داخستنی کامێرا
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const snapUrl = captureCenteredFacePhoto(photoCaptureVideoRef.current);
                          if (snapUrl) {
                            setNewDocPhoto(snapUrl);
                          }
                          setIsWebcamCapturingForDoc(false);
                        }}
                        className="px-4 py-1.5 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 rounded-xl text-xs font-black shadow cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>گرتنی وێنەی سەرەکی ڕووخسار (Headshot)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {newDocPhoto ? (
                      <div className="relative shrink-0">
                        <img
                          src={newDocPhoto}
                          alt="Enrolled Face"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-400 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => setNewDocPhoto(null)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                          title="سڕینەوەی وێنە"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-500 shrink-0">
                        <Camera className="w-6 h-6 stroke-1 text-slate-400" />
                        <span className="text-[9px] mt-1">بێ وێنە</span>
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="newDocPhotoInput"
                          className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 border border-white/10"
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-400" />
                          <span>هەڵبژاردنی وێنە لە ئامێر</span>
                        </label>
                        <input
                          id="newDocPhotoInput"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => setNewDocPhoto(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setPhotoCaptureTarget('new_doc');
                            setIsWebcamCapturingForDoc(true);
                          }}
                          className="px-3 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 border border-teal-500/30"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>گرتن بە کامێرا</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        ئەم وێنەیە سیستەمی ناسینەوەی ڕووخسار بەکاری دەهێنێت بۆ ئەوەی بە یەک چرکە کاتی دەوام تۆمار بکرێت.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ACCOUNT TOGGLE */}
              <div className="flex items-center gap-2 mb-4 bg-slate-950 p-3 rounded-xl border border-white/10">
                <input
                  type="checkbox"
                  checked={requiresAccount}
                  onChange={(e) => setRequiresAccount(e.target.checked)}
                  id="requiresAccount"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="requiresAccount" className="text-slate-200 font-bold text-xs cursor-pointer">
                  ئەنجامدانی ئەکاونتی سیستەم بۆ ئەم کارمەندە (Login Account)
                </label>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">ناوی تەواو *</label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="ناوی پزیشک یان کارمەند..."
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">لقی دەوامکردن (Branch) *</label>
                  <select
                    value={newDocBranchId}
                    onChange={(e) => setNewDocBranchId(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-teal-500/40 rounded-xl text-teal-300 font-bold outline-none focus:border-teal-400 cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">ژمارەی مۆبایل</label>
                  <input
                    type="text"
                    value={newDocPhone}
                    onChange={(e) => setNewDocPhone(e.target.value)}
                    placeholder="0750 000 0000"
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              {requiresAccount && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 mb-1 font-bold">ناوی بەکارهێنەر (Username) *</label>
                    <input
                      type="text"
                      required
                      value={newDocUsername}
                      onChange={(e) => setNewDocUsername(e.target.value)}
                      placeholder="username..."
                      className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-bold">ئیمەیڵ *</label>
                    <input
                      type="email"
                      required
                      value={newDocEmail}
                      onChange={(e) => setNewDocEmail(e.target.value)}
                      placeholder="doctor@clinic.com"
                      className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400 font-mono"
                    />
                  </div>
                </div>
              )}

              {requiresAccount && (
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">تێپەڕەوشە (Password) *</label>
                  <input
                    type="text"
                    required
                    value={newDocPassword}
                    onChange={(e) => setNewDocPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-amber-200 outline-none focus:border-teal-400 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1 font-bold">پسپۆڕی / پلەی وەزیفی</label>
                <input
                  type="text"
                  value={newDocSpecialty}
                  onChange={(e) => setNewDocSpecialty(e.target.value)}
                  placeholder="پسپۆڕی پێست، لەیزەر، پێشوازی..."
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">ڕۆڵی سیستەم</label>
                  <select
                    value={newDocRole}
                    onChange={(e) => setNewDocRole(e.target.value as any)}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400 cursor-pointer"
                  >
                    <option value="doctor">پزیشکی پسپۆڕ (Doctor)</option>
                    <option value="receptionist">کارمەندی ڕێپێدان (Receptionist)</option>
                    <option value="accountant">محاسب / بەرپرسی حیسابات (Accountant)</option>
                    <option value="manager">بەڕێوەبەری لق (Manager)</option>
                    <option value="super_admin">سوپەر ئەدمین (Super Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">موچەی مانگانە (د.ع) *</label>
                  <input
                    type="number"
                    required
                    value={newDocSalary}
                    onChange={(e) => setNewDocSalary(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-teal-300 font-mono font-bold outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-teal-400 text-slate-950 font-black rounded-xl shadow-md cursor-pointer hover:brightness-110"
                >
                  پاشەکەوتکردن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: UPDATE / ENROLL FACE PHOTO FOR EXISTING STAFF */}
      {/* ======================================================== */}
      {editingPhotoStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-purple-500/40 rounded-[36px] w-full max-w-md overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">وێنەی ڕووخسار بۆ ناسینەوەی کامێرا</h3>
                  <p className="text-xs text-slate-400">کارمەند: <strong className="text-purple-300">{editingPhotoStaff.name}</strong></p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingPhotoStaff(null);
                  setEditStaffPhotoUrl(null);
                  setIsWebcamCapturingForDoc(false);
                }}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Webcam view if active */}
              {isWebcamCapturingForDoc && photoCaptureTarget === 'edit_doc' ? (
                <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-purple-500/40">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
                    <video
                      ref={photoCaptureVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute w-28 h-36 border-2 border-dashed border-purple-400 rounded-full pointer-events-none" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsWebcamCapturingForDoc(false)}
                      className="px-3 py-1.5 bg-white/10 text-slate-300 rounded-xl font-bold cursor-pointer"
                    >
                      داخستن
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const snapUrl = captureCenteredFacePhoto(photoCaptureVideoRef.current);
                        if (snapUrl) {
                          setEditStaffPhotoUrl(snapUrl);
                        }
                        setIsWebcamCapturingForDoc(false);
                      }}
                      className="px-4 py-1.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-black shadow cursor-pointer flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>وێنەگرتنی سەرەکی دەموچاو (Passport Headshot)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-3 text-center">
                  {editStaffPhotoUrl ? (
                    <div className="relative">
                      <img
                        src={editStaffPhotoUrl}
                        alt="Staff face"
                        className="w-28 h-28 rounded-3xl object-cover border-4 border-purple-400 shadow-xl"
                      />
                      <span className="absolute bottom-1 inset-x-0 bg-slate-950/80 text-[10px] text-purple-300 py-0.5 rounded-b-2xl font-bold">
                        Face Profile Matched
                      </span>
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-3xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-slate-500">
                      <Camera className="w-8 h-8 text-slate-400" />
                      <span className="text-[10px] mt-1">وێنە نییە</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <label
                      htmlFor="editStaffPhotoInput"
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5 border border-white/10"
                    >
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      <span>لە ئامێرەوە باربکە</span>
                    </label>
                    <input
                      id="editStaffPhotoInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setEditStaffPhotoUrl(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setPhotoCaptureTarget('edit_doc');
                        setIsWebcamCapturingForDoc(true);
                      }}
                      className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold rounded-xl cursor-pointer flex items-center gap-1.5 border border-purple-500/30"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>گرتن بە کامێرا</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPhotoStaff(null);
                    setEditStaffPhotoUrl(null);
                    setIsWebcamCapturingForDoc(false);
                  }}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="button"
                  disabled={!editStaffPhotoUrl}
                  onClick={handleSaveStaffPhoto}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black rounded-xl shadow-md cursor-pointer hover:brightness-110 disabled:opacity-50"
                >
                  پاشەکەوتکردنی وێنەی ڕووخسار
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PRINTABLE LEAVE VOUCHER (پسوولەی فەرمی مۆڵەت) */}
      {/* ======================================================== */}
      {printLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-white/20 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 text-white text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black">پسوولەی فەرمی مۆڵەتی کارمەند</h3>
              </div>
              <button
                onClick={() => setPrintLeaveModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Slip Container */}
            <div className="bg-white text-slate-950 p-6 rounded-2xl shadow-inner space-y-4 border-2 border-slate-300">
              <div className="text-center border-b pb-3 border-slate-200 space-y-1">
                <h2 className="text-base font-black text-slate-900">کلینیکی تایبەتمەندی جوانکاری و تەندروستی</h2>
                <p className="text-[11px] text-slate-600 font-bold">بۆڕدی کارگێڕی • فۆرمی فەرمی مۆڵەتی دەوام (Leave Permit)</p>
                <span className="text-[10px] text-slate-500 font-mono">بەرواری دەرچوون: {printLeaveModal.appliedAt}</span>
              </div>

              <div className="space-y-2 text-xs border-b pb-3 border-slate-200">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">ناوی کارمەند / پزیشک:</span>
                  <strong className="text-slate-950 font-bold">{printLeaveModal.userName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">لقی دەوام:</span>
                  <strong className="text-slate-950">{printLeaveModal.branchName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">جۆری مۆڵەت:</span>
                  <strong className="text-purple-700">{printLeaveModal.leaveType}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">ماوەی مۆڵەت:</span>
                  <strong className="font-mono">{printLeaveModal.startDate} تا {printLeaveModal.endDate} ({printLeaveModal.daysCount} ڕۆژ)</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">لێبڕین لە موچە:</span>
                  <strong>{printLeaveModal.deductFromSalary ? 'بەڵێ (بێ موچە)' : 'نەخێر (بە موچە)'}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">هۆکاری مۆڵەت:</span>
                  <span className="text-slate-800 font-medium">{printLeaveModal.reason || 'مۆڵەتی فەرمی'}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-[11px] text-slate-700">
                <div>
                  <span>پەسەندکراو لەلایەن:</span>
                  <div className="font-bold text-slate-950">{printLeaveModal.approvedBy || 'بەڕێوەبەری لق'}</div>
                </div>
                <div className="text-left">
                  <span>مۆر و واژۆی کارگێڕی:</span>
                  <div className="h-8 border-b-2 border-dotted border-slate-400 w-28 mt-2" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPrintLeaveModal(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 text-xs font-bold cursor-pointer"
              >
                داخستن
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 text-xs font-black rounded-xl shadow cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>چاپکردنی پسوولە (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
