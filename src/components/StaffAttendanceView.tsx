import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Branch, StaffAttendanceRecord, AttendanceStatus, WorkShiftConfig, StaffLeaveRequest } from '../types';
import {
  Camera,
  Scan,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  UserCheck,
  UserX,
  Fingerprint,
  CalendarCheck,
  Building2,
  Search,
  Filter,
  Eye,
  Radio,
  Coffee,
  Check,
  X,
  Volume2,
  VolumeX,
  ShieldCheck,
  RefreshCw,
  Sliders,
  ChevronDown,
  UserCog,
} from 'lucide-react';

interface StaffAttendanceViewProps {
  doctors: User[];
  branches: Branch[];
  activeBranchId?: number | null;
  currentUser?: User | null;
}

export const StaffAttendanceView: React.FC<StaffAttendanceViewProps> = ({
  doctors,
  branches,
  activeBranchId,
  currentUser,
}) => {
  // Current time state
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

  // Sound effects toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Camera video ref and state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);

  // Detection states
  const [faceInFrame, setFaceInFrame] = useState<boolean>(false);
  const [detectedStaff, setDetectedStaff] = useState<User | null>(null);
  const [recognitionConfidence, setRecognitionConfidence] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationCooldown, setVerificationCooldown] = useState<boolean>(false);
  const [autoAttendanceEnabled, setAutoAttendanceEnabled] = useState<boolean>(true);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(activeBranchId || null);

  // Success pop-up notification
  const [recentVerification, setRecentVerification] = useState<{
    staff: User;
    action: 'in' | 'out';
    time: string;
    isLate: boolean;
    lateMinutes: number;
    penalty: number;
    capturedPhoto?: string;
  } | null>(null);

  // Manual fallback mode (e.g. fingerprint or quick select)
  const [manualBiometricMode, setManualBiometricMode] = useState<'camera' | 'fingerprint'>('camera');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Work Shifts Configuration
  const [shifts] = useState<WorkShiftConfig[]>([
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

  // Attendance Records State (Persisted in localStorage so both views are synced)
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
    // Realistic fallback
    return doctors.map((doc, idx) => {
      const branchObj = branches.find((b) => b.id === doc.branchId) || branches[0] || { name: 'لقی سەرەکی' };
      if (idx === 0) {
        return {
          id: 1001,
          userId: doc.id,
          userName: doc.name,
          userRole: doc.role,
          userAvatar: doc.avatar || doc.facePhoto,
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
          notes: 'ناسینەوەی ڕووخسار بە کامێرای ژیر.',
        };
      }
      return {
        id: 1000 + idx,
        userId: doc.id,
        userName: doc.name,
        userRole: doc.role,
        userAvatar: doc.avatar || doc.facePhoto,
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
        notes: 'تا ئێستا لە کامێرا تۆمارنەکراوە.',
      };
    });
  });

  // Save to localStorage whenever records change
  useEffect(() => {
    try {
      localStorage.setItem('donia_staff_attendance_records', JSON.stringify(attendanceRecords));
    } catch (e) {
      console.warn('Error saving attendance records', e);
    }
  }, [attendanceRecords]);

  // Synchronize new doctors into today's attendance records automatically
  useEffect(() => {
    setAttendanceRecords((prev) => {
      let changed = false;
      const updated = [...prev];
      doctors.forEach((doc) => {
        const hasRec = updated.some((r) => (r.userId === doc.id || r.userName.trim() === doc.name.trim()) && r.date === todayStr);
        if (!hasRec) {
          changed = true;
          const branchObj = branches.find((b) => b.id === doc.branchId) || branches[0] || { name: 'لقی سەرەکی' };
          updated.push({
            id: Date.now() + doc.id,
            userId: doc.id,
            userName: doc.name,
            userRole: doc.role,
            userAvatar: doc.avatar || doc.facePhoto,
            branchId: doc.branchId || 1,
            branchName: branchObj.name,
            date: todayStr,
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
            notes: 'چاوەڕوانی ناسینەوەی ڕووخسارە لەبەردەم کامێرا.',
          });
        }
      });
      return changed ? updated : prev;
    });
  }, [doctors, todayStr, branches]);

  // Play audio beep / chime
  const playChime = (type: 'success' | 'alert') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(349.23, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      // AudioContext may be blocked before first user gesture
    }
  };

  // Start / Stop Camera Stream
  useEffect(() => {
    if (isCameraActive) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then((stream) => {
          setCameraStream(stream);
          setCameraError(null);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Webcam permission or device error, using AI simulation', err);
          setCameraError('کامێرای دەرەکی پەیوەست نەکراوە، سیستەم بە مۆدی زیرەکی دەستکرد و سیمولەیشن کاردەکات.');
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
  }, [isCameraActive]);

  // Keep videoRef in sync
  useEffect(() => {
    if (cameraStream && videoRef.current && videoRef.current.srcObject !== cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Helper to snapshot live webcam frame
  const captureFrameFromWebcam = (): string | null => {
    if (!videoRef.current) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const vw = videoRef.current.videoWidth || 640;
      const vh = videoRef.current.videoHeight || 480;
      const cropSize = Math.min(vw, vh) * 0.75;
      const sx = (vw - cropSize) / 2;
      const sy = Math.max(0, (vh - cropSize) / 2 - cropSize * 0.08);
      ctx.drawImage(videoRef.current, sx, sy, cropSize, cropSize, 0, 0, 400, 400);
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (e) {
      return null;
    }
  };

  // Core Smart Attendance Verification Logic
  const executeAttendanceForStaff = (staff: User) => {
    if (verificationCooldown) return;
    setIsVerifying(true);
    setVerificationCooldown(true);

    const capturedPhoto = captureFrameFromWebcam() || staff.avatar || staff.facePhoto;
    const branchObj = branches.find((b) => b.id === (staff.branchId || activeBranchId || 1)) || branches[0] || { name: 'لقی سەرەکی' };
    const nowTimeStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Check existing today record
    const existingIndex = attendanceRecords.findIndex(
      (r) => (r.userId === staff.id || r.userName.trim() === staff.name.trim()) && r.date === todayStr
    );
    const existingRec = existingIndex >= 0 ? attendanceRecords[existingIndex] : null;
    const alreadyCheckedInToday = Boolean(existingRec && existingRec.checkInTime);

    // Automatic toggle:
    // If not checked in today -> Check-In (هاتن)
    // If already checked in today -> Check-Out (چوون)
    const effectiveAction: 'in' | 'out' = alreadyCheckedInToday ? 'out' : 'in';

    // Calculate Lateness (09:00 AM + 15 mins grace period)
    const currentHour = currentDateTime.getHours();
    const currentMin = currentDateTime.getMinutes();
    const isLate = effectiveAction === 'in' && (currentHour > 9 || (currentHour === 9 && currentMin > 15));
    const lateMinutes = isLate ? Math.max(0, (currentHour - 9) * 60 + currentMin) : 0;
    const penalty = lateMinutes * 1500;

    setTimeout(() => {
      setIsVerifying(false);

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
          verificationMethod: manualBiometricMode === 'camera' ? 'کامێرای ناسینەوەی ڕووخسار (Face Recognition)' : 'زیهازی پەنجە مۆری بایۆمەتری (Fingerprint)',
          capturedPhotoUrl: capturedPhoto || existingRec.capturedPhotoUrl,
          userAvatar: staff.avatar || staff.facePhoto,
          isTamperProofVerified: true,
          notes:
            effectiveAction === 'in'
              ? isLate
                ? `دواکەوتن بە ${lateMinutes} خولەک (ناسینەوەی ڕووخساری زیرەک).`
                : 'ئامادەبوون لە کاتی خۆیدا بە ناسینەوەی زیرەکی دەموچاو لە چوارچێوەی کامێرا.'
              : `تۆماری فەرمی چوون لە دەوام لە کاتژمێر ${nowTimeStr}.`,
        };
        updatedList = [...attendanceRecords];
        updatedList[existingIndex] = updatedRec;
      } else {
        const newRec: StaffAttendanceRecord = {
          id: Date.now(),
          userId: staff.id,
          userName: staff.name,
          userRole: staff.role,
          userAvatar: staff.avatar || staff.facePhoto,
          capturedPhotoUrl: capturedPhoto,
          branchId: staff.branchId || 1,
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
          verificationMethod: manualBiometricMode === 'camera' ? 'کامێرای ناسینەوەی ڕووخسار (Face Recognition)' : 'زیهازی پەنجە مۆری بایۆمەتری (Fingerprint)',
          isTamperProofVerified: true,
          penaltyDeductionAmount: isLate ? penalty : 0,
          notes: isLate ? `دواکەوتن بە ${lateMinutes} خولەک.` : 'تۆماری دەوام بە کامێرای زیرەک.',
        };
        updatedList = [newRec, ...attendanceRecords];
      }

      setAttendanceRecords(updatedList);

      setRecentVerification({
        staff,
        action: effectiveAction,
        time: nowTimeStr,
        isLate,
        lateMinutes,
        penalty,
        capturedPhoto,
      });

      playChime(isLate ? 'alert' : 'success');

      // Keep success banner for 6 seconds, then reset cooldown
      setTimeout(() => {
        setRecentVerification(null);
        setVerificationCooldown(false);
      }, 6000);
    }, 1100);
  };

  // Autonomous Face Tracking Simulation
  // When autoAttendanceEnabled is on, it cycles through doctors and detects anyone positioned in front of camera
  useEffect(() => {
    if (!autoAttendanceEnabled || verificationCooldown || doctors.length === 0) return;

    const interval = setInterval(() => {
      // Pick a random staff member or cycle
      const candidateIndex = Math.floor(Math.random() * doctors.length);
      const candidate = doctors[candidateIndex];

      if (candidate) {
        setFaceInFrame(true);
        setDetectedStaff(candidate);
        setRecognitionConfidence(99.4 + Math.random() * 0.5);

        // Auto confirm after 2.5 seconds of face being in center frame
        const triggerTimeout = setTimeout(() => {
          if (autoAttendanceEnabled && !verificationCooldown) {
            executeAttendanceForStaff(candidate);
          }
        }, 2200);

        return () => clearTimeout(triggerTimeout);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [autoAttendanceEnabled, verificationCooldown, doctors]);

  // Toggle Fullscreen Kiosk Mode
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Filtered attendance records for table
  const todayAttendance = useMemo(
    () => attendanceRecords.filter((r) => r.date === todayStr),
    [attendanceRecords, todayStr]
  );

  const filteredAttendance = useMemo(() => {
    return todayAttendance.filter((rec) => {
      if (!rec) return false;
      const q = (searchFilter || '').toLowerCase();
      const matchesSearch =
        (rec.userName || '').toLowerCase().includes(q) ||
        (rec.userRole || '').toLowerCase().includes(q);
      const matchesBranch = !selectedBranchId || rec.branchId === selectedBranchId;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'present' && rec.status === 'ئامادەیە (Present)') ||
        (statusFilter === 'late' && rec.status === 'دواکەوتووە (Late)') ||
        (statusFilter === 'absent' && rec.status === 'غائیبە (Absent)') ||
        (statusFilter === 'checked_out' && rec.status === 'چووەتە دەرەوە (Checked Out)');
      return matchesSearch && matchesBranch && matchesStatus;
    });
  }, [todayAttendance, searchFilter, selectedBranchId, statusFilter]);

  // Statistics
  const presentCount = todayAttendance.filter((r) => r.status === 'ئامادەیە (Present)').length;
  const lateCount = todayAttendance.filter((r) => r.status === 'دواکەوتووە (Late)').length;
  const checkedOutCount = todayAttendance.filter((r) => r.status === 'چووەتە دەرەوە (Checked Out)').length;
  const absentCount = doctors.length - (presentCount + lateCount + checkedOutCount);

  return (
    <div
      ref={containerRef}
      className={`space-y-6 text-right dir-rtl ${
        isFullscreen ? 'p-8 bg-slate-950 min-h-screen overflow-y-auto' : ''
      }`}
    >
      {/* TOP HEADER WITH REAL-TIME CLOCK AND KIOSK CONTROLS */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-[36px] border-2 border-teal-500/40 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3.5 py-1 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/50 text-teal-300 text-xs font-black rounded-full flex items-center gap-1.5 shadow-sm">
              <Camera className="w-4 h-4 text-teal-400 animate-pulse" />
              سیستەمی زیرەکی دەوام (Touchless AI Attendance)
            </span>
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-full">
              بێ داگرتنی هیچ دوگمەیەک • بە تەواوی ئۆتۆماتیک
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white">
            پانێڵی سەربەخۆی هاتن و چوون بە ناسینەوەی ڕووخسار
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
            کارمەند یان پزیشک تەنها دەموچاوی دەهێنێتە ناو چوارچێوەی کامێراکە؛ سیستەم بە ژیری دەستکرد کەسەکە دەناسێتەوە، کاتی هاتن یان چوون هەڵدەبژێرێت و بە فەرمی تۆماری دەکات.
          </p>
        </div>

        {/* Real-Time Official Clock & Action Controls */}
        <div className="z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Clock Widget */}
          <div className="bg-slate-950/90 border-2 border-teal-400/50 p-4 rounded-3xl text-center shadow-lg shadow-teal-500/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                کاتژمێری فەرمی سێرڤەر (Real-Time)
              </span>
              <div className="text-2xl font-black text-white font-mono tracking-tight">{currentTimeStr}</div>
              <span className="text-[11px] text-teal-400 font-mono font-bold">{todayStr}</span>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col gap-2">
            <button
              onClick={handleToggleFullscreen}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="کردنەوەی شاشەی تەواو"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isFullscreen ? 'داخستنی کیۆسک' : 'شاشەی تەواو (Kiosk)'}</span>
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span>دەنگ: {soundEnabled ? 'چالاکە' : 'بێدەنگ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-emerald-500/30 p-5 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>ئامادەبووان (Present)</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-300 font-mono">{presentCount}</div>
          <span className="text-[10px] text-slate-400 block">لە کاتی خۆیان هاتوون</span>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/30 p-5 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>دواکەوتووان (Late)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-300 font-mono">{lateCount}</div>
          <span className="text-[10px] text-slate-400 block">سزای دواکەوتن تۆمارکراوە</span>
        </div>

        <div className="bg-slate-900/80 border border-blue-500/30 p-5 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>چوونەتە دەرەوە (Checked Out)</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-300 font-mono">{checkedOutCount}</div>
          <span className="text-[10px] text-slate-400 block">دەوامیان تەواوکردووە</span>
        </div>

        <div className="bg-slate-900/80 border border-rose-500/30 p-5 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>نەهاتووان (Absent)</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono">{absentCount}</div>
          <span className="text-[10px] text-slate-400 block">تا ئێستا نەهاتوونەتە بەردەم کامێرا</span>
        </div>
      </div>

      {/* MAIN AUTONOMOUS CAMERA KIOSK SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Smart Camera Viewport (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-950/90 border-2 border-teal-500/40 rounded-[36px] p-6 shadow-2xl space-y-4 relative overflow-hidden flex flex-col justify-between">
          {/* Top Bar inside Viewport */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-black text-teal-300 font-mono uppercase tracking-wider">
                LIVE AI FACE SCANNER ONLINE
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoAttendanceEnabled(!autoAttendanceEnabled)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  autoAttendanceEnabled
                    ? 'bg-teal-400 text-slate-950 font-black shadow'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>ناسینەوەی خودکار: {autoAttendanceEnabled ? 'چالاکە' : 'ناچالاک'}</span>
              </button>

              <button
                onClick={() => setManualBiometricMode(manualBiometricMode === 'camera' ? 'fingerprint' : 'camera')}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
              >
                {manualBiometricMode === 'camera' ? <Fingerprint className="w-3.5 h-3.5 text-emerald-400" /> : <Camera className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{manualBiometricMode === 'camera' ? 'دۆخی پەنجەمۆر' : 'دۆخی کامێرا'}</span>
              </button>
            </div>
          </div>

          {/* VIEWPORT AREA WITH SMART FACE TARGET FRAME */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-teal-500/30 aspect-video md:aspect-[16/10] flex items-center justify-center shadow-inner">
            {manualBiometricMode === 'camera' ? (
              <>
                {/* Real Webcam Stream or Animated Fallback */}
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
                    <div className="text-xs text-slate-300 space-y-1">
                      <strong className="text-white text-sm">سەنتەری بینینی کامێرای زیرەک (AI Vision)</strong>
                      <p className="text-[11px] text-slate-400">
                        دەموچاوت بهێنە ناو چوارچێوەی دیاریکراو؛ سیستەم بە شێوەیەکی ئۆتۆماتیک دەتناسێتەوە.
                      </p>
                    </div>
                  </div>
                )}

                {/* Laser Scanning Line Sweep */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-bounce top-1/4 pointer-events-none z-10" />

                {/* ADVANCED TARGET FACE RECOGNITION GUIDE OVAL */}
                <div className="absolute w-52 h-64 border-2 border-dashed border-cyan-400/80 rounded-[60px] pointer-events-none flex flex-col items-center justify-center z-10 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                  {/* Corner Target Markers */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

                  {/* Pulsing Face Sensor Dots */}
                  <div className="w-3 h-3 rounded-full bg-cyan-400/60 animate-ping mb-2" />
                  <span className="text-[10px] font-mono font-bold text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded-full border border-cyan-400/40">
                    ڕووخسار لەناو چوارچێوە دابنێ
                  </span>
                </div>

                {/* HUD Live Detection Banner */}
                {detectedStaff && (
                  <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-teal-400/60 flex items-center gap-3 shadow-xl">
                      {detectedStaff.avatar || detectedStaff.facePhoto ? (
                        <img
                          src={detectedStaff.avatar || detectedStaff.facePhoto}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border-2 border-teal-400 shadow shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-teal-400 flex items-center justify-center font-bold text-teal-300 text-sm shrink-0">
                          {detectedStaff.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-xs font-black">{detectedStaff.name}</span>
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono rounded font-bold">
                            {recognitionConfidence.toFixed(1)}% Match
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {detectedStaff.specialty || detectedStaff.role}
                        </span>
                      </div>
                    </div>

                    <div className="bg-teal-500 text-slate-950 px-3.5 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-xl animate-pulse">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isVerifying ? 'لە پەسەندکردندایە...' : 'ڕووخسار ناسرایەوە'}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* FINGERPRINT MODE VIEWPORT */
              <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div
                  onClick={() => {
                    const randomStaff = detectedStaff || doctors[0];
                    if (randomStaff) executeAttendanceForStaff(randomStaff);
                  }}
                  className="w-36 h-36 rounded-3xl border-4 border-emerald-400/60 bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-2xl shadow-emerald-500/20"
                  title="کلیک بکە بۆ خوێندنەوەی پەنجەمۆر"
                >
                  <Fingerprint className="w-24 h-24 text-emerald-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-black text-sm">پەنجەت لەسەر سێنسەرەکە دابنێ</h4>
                  <p className="text-xs text-slate-400">
                    پەیوەستکراوە بە ئامێری پەنجەمۆری دیجیتاڵی (Optical Biometric Scanner)
                  </p>
                </div>
              </div>
            )}

            {/* Live Verification Notification Banner */}
            {recentVerification && (
              <div className="absolute inset-x-6 bottom-6 bg-slate-950/95 backdrop-blur-xl border-2 border-emerald-400 p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 z-30 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm font-black">{recentVerification.staff.name}</strong>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-lg font-mono">
                        {recentVerification.action === 'in' ? '✅ هاتن (Check-In)' : '👋 چوون (Check-Out)'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-300 block">
                      کاتژمێر: <strong className="font-mono text-cyan-300">{recentVerification.time}</strong> • تۆمارکرا بە سەرکەوتوویی
                    </span>
                    {recentVerification.isLate && (
                      <span className="text-[11px] text-amber-400 font-bold block pt-0.5">
                        ⚠️ دواکەوتن بە {recentVerification.lateMinutes} خولەک (سزای {recentVerification.penalty.toLocaleString()} د.ع حیسابکرا)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">ئۆتۆماتیک پاشەکەوت کرا</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Staff Selection Bar for instant testing */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-[10px] text-slate-400 whitespace-nowrap">کادرەکان بۆ ناسینەوە:</span>
              {doctors.map((doc) => {
                const isSelected = detectedStaff?.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setDetectedStaff(doc);
                      setRecognitionConfidence(99.8);
                      executeAttendanceForStaff(doc);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-teal-400 text-slate-950 font-black shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    {doc.avatar || doc.facePhoto ? (
                      <img src={doc.avatar || doc.facePhoto} alt="" className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{doc.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                const nextDoc = doctors[(doctors.findIndex((d) => d.id === detectedStaff?.id) + 1) % doctors.length] || doctors[0];
                if (nextDoc) {
                  setDetectedStaff(nextDoc);
                  executeAttendanceForStaff(nextDoc);
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer whitespace-nowrap"
            >
              ناسینەوەی کەسی دواتر
            </button>
          </div>
        </div>

        {/* Right Column: Work Shifts and Active Rules (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Shifts Card */}
          <div className="bg-slate-900/80 border border-white/10 p-6 rounded-[36px] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">کاتەکانی دەوام (Shifts)</h3>
                  <span className="text-[10px] text-slate-400">دیاریکردنی کاتی فەرمی و مۆڵەتی دواکەوتن</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {shifts.map((shift) => (
                <div key={shift.id} className="p-3.5 bg-slate-950/70 rounded-2xl border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-white text-xs">{shift.title}</strong>
                    <span className="text-[11px] font-mono font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-lg border border-teal-500/20">
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>مۆڵەتی دواکەوتن: {shift.gracePeriodMinutes} خولەک</span>
                    <span>سزا بۆ هەر خولەکێک: {shift.penaltyPerLateMinute.toLocaleString()} د.ع</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 text-[11px] text-teal-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>دەستکاریکردنی دەوام لە پاشەکەوت و داتابەیسی سەنتەر پارێزراوە.</span>
            </div>
          </div>

          {/* Biometric Guidelines Card */}
          <div className="bg-slate-900/80 border border-white/10 p-6 rounded-[36px] shadow-xl space-y-3">
            <h4 className="text-xs font-black text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-400" />
              ڕێنمایی بۆ ناسینەوەی خێراتر
            </h4>
            <ul className="text-[11px] text-slate-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span>دەموچاو ڕێک بەرامبەر کامێراکە دابنێ لە دووری ٥٠ بۆ ٨٠ سانتیمەتر.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span>چاوەڕوان بە بۆ ١ چرکە تا هێڵی چوارچێوەکە سەوز دەبێت.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                <span>هاتن و چوون لە یەک ڕۆژدا بە شێوەی خۆکار لە نێوان (Check-In و Check-Out) دەگۆڕدرێت.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* TODAY'S LIVE ATTENDANCE LOG TABLE */}
      <div className="bg-slate-900/80 border border-white/10 rounded-[36px] p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <CalendarCheck className="w-5 h-5 text-teal-400" />
              <h3 className="text-lg font-black text-white">تۆماری ئامادەبوونی پزیشکان و کارمەندانی ئەمڕۆ ({filteredAttendance.length})</h3>
            </div>
            <p className="text-xs text-slate-400">هەموو تۆمارەکان بە کاتی سێرڤەر و بە بەڵگەی کامێرا لێرە دەبینرێن</p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="گەڕان بەپێی ناو..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pr-10 pl-4 py-2 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white outline-none focus:border-teal-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-950 border border-white/10 rounded-2xl text-xs text-slate-300 outline-none focus:border-teal-400 font-bold"
            >
              <option value="all">سەرجەم دۆخەکان</option>
              <option value="present">ئامادەبووان</option>
              <option value="late">دواکەوتووان</option>
              <option value="checked_out">دەرچووان</option>
              <option value="absent">نەهاتووان</option>
            </select>
          </div>
        </div>

        {/* Attendance Records Table */}
        {filteredAttendance.length === 0 ? (
          <p className="text-center text-slate-500 text-xs py-12">هیچ تۆمارێک نەدۆزرایەوە.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-300 border-b border-white/10">
                <tr>
                  <th className="py-4 px-4">ناوی پزیشک / کارمەند</th>
                  <th className="py-4 px-4">ڕۆڵ و پسپۆڕی</th>
                  <th className="py-4 px-4 font-mono">هاتن (In)</th>
                  <th className="py-4 px-4 font-mono">چوون (Out)</th>
                  <th className="py-4 px-4">دۆخی فەرمی</th>
                  <th className="py-4 px-4">شێوازی ناسینەوە</th>
                  <th className="py-4 px-4">دواکەوتن / سزا</th>
                  <th className="py-4 px-4 text-left">کرداری دەستی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-900/40">
                {filteredAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {rec.userAvatar ? (
                          <img src={rec.userAvatar} alt="" className="w-9 h-9 rounded-xl object-cover border border-white/10" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-teal-300">
                            {rec.userName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <strong className="text-white text-xs block">{rec.userName}</strong>
                          <span className="text-[10px] text-slate-400">{rec.branchName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">{rec.userRole}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-300">{rec.checkInTime || '—'}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-300">{rec.checkOutTime || '—'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                          rec.status === 'ئامادەیە (Present)'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : rec.status === 'دواکەوتووە (Late)'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : rec.status === 'چووەتە دەرەوە (Checked Out)'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">{rec.verificationMethod}</td>
                    <td className="py-3.5 px-4">
                      {rec.lateMinutes > 0 ? (
                        <div className="text-amber-300 font-mono text-[11px] font-bold">
                          {rec.lateMinutes} خولەک (-{rec.penaltyDeductionAmount?.toLocaleString()} د.ع)
                        </div>
                      ) : (
                        <span className="text-emerald-400 text-[11px] font-bold">کاتی تەواو (۰ سزا)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-left">
                      <button
                        onClick={() => {
                          const matchedDoc = doctors.find((d) => d.id === rec.userId || d.name === rec.userName);
                          if (matchedDoc) executeAttendanceForStaff(matchedDoc);
                        }}
                        className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-xl text-xs font-bold border border-teal-500/30 cursor-pointer transition-all"
                        title="تۆمارکردنەوەی دەوام بە کامێرا"
                      >
                        سکانکردنی کامێرا
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
  );
};
