import React, { useState, useEffect, useRef } from 'react';
import { Patient } from '../types';
import jsQR from 'jsqr';
import {
  QrCode,
  X,
  Search,
  Camera,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Zap,
  AlertCircle,
  RefreshCw,
  VideoOff,
  SwitchCamera,
  Volume2,
} from 'lucide-react';

interface QrScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
}

export const QrScanModal: React.FC<QrScanModalProps> = ({
  isOpen,
  onClose,
  patients,
  onSelectPatient,
}) => {
  const [scanInput, setScanInput] = useState('');
  const [scannedPatient, setScannedPatient] = useState<Patient | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'starting' | 'active' | 'error' | 'denied'>('idle');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Stop camera stream cleanly
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus('idle');
  };

  // Start camera stream
  const startCamera = async () => {
    stopCamera();
    setCameraStatus('starting');
    setErrorMsg(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('وێبگەڕەکەت پشتگیری کامێرا ناکات.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraStatus('active');
        scanFrame();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        setErrorMsg('مۆڵەتی کامێرا ڕەتکرایەوە. تکایە لە وێبگەڕەکەتدا ڕێگە بە کامێرا بدە.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraStatus('error');
        setErrorMsg('هیچ کامێرایەک لەسەر ئەم ئامێرە نەدۆزرایەوە.');
      } else {
        setCameraStatus('error');
        setErrorMsg('کامێرا نەکرایەوە. تکایە دڵنیابەرەوە هیچ بەرنامەیەکی تر کامێراکەی داگیرنەکردووە.');
      }
    }
  };

  // Continuous frame scanner loop
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        const rawResult = code.data.trim();
        if (rawResult && rawResult !== lastScannedCode) {
          setLastScannedCode(rawResult);
          handleSearchOrScan(rawResult);
          
          // Play a gentle beep sound on success scan
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = 880; // A5 pitch
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.12);
          } catch (e) {
            // Audio context fallback ignored
          }
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    if (isOpen && isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, isCameraOn, facingMode]);

  if (!isOpen) return null;

  const handleSearchOrScan = (codeToFind?: string) => {
    const rawTerm = (codeToFind || scanInput).trim();
    if (!rawTerm) return;

    // Extract PAT-XXXX or digits from full text if QR contains formatted message
    let term = rawTerm.toUpperCase();
    const matchCode = rawTerm.match(/PAT-\d+/i);
    if (matchCode) {
      term = matchCode[0].toUpperCase();
    }

    // Search by code, ID, phone, or name
    const found = patients.find(
      (p) =>
        p.patientCode.toUpperCase() === term ||
        p.patientCode.toUpperCase().includes(term) ||
        p.id.toString() === term ||
        p.phone.includes(term) ||
        p.name.includes(term)
    );

    if (found) {
      setScannedPatient(found);
      setScanInput(found.patientCode);
      setErrorMsg(null);
    } else {
      setScannedPatient(null);
      setErrorMsg(`هیچ نەخۆشێک بە کۆد یان زانیاریی (${rawTerm}) نەدۆزرایەوە!`);
    }
  };

  const handleConfirmPatient = () => {
    if (scannedPatient) {
      stopCamera();
      onSelectPatient(scannedPatient);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-[36px] w-full max-w-xl shadow-md shadow-cyan-950/50 overflow-hidden relative space-y-0">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                سکانکردنی ڕاستەوخۆی بارکۆد (Live QR & Barcode Camera)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                کامێرای مۆبایل یان کامپیوتر ئاڕاستەی کارتی نەخۆش بکە
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* Real Camera Viewfinder Box */}
          <div className="relative bg-slate-950 rounded-3xl border-2 border-cyan-500/40 overflow-hidden min-h-[260px] flex flex-col items-center justify-center shadow-inner group">
            {/* Hidden canvas for image decoding */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Video Feed */}
            {isCameraOn && (
              <video
                ref={videoRef}
                className="w-full h-[260px] object-cover rounded-3xl"
                autoPlay
                playsInline
                muted
              />
            )}

            {/* Scanning Overlay Grid & Laser */}
            {cameraStatus === 'active' && (
              <>
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-[bounce_2s_infinite] pointer-events-none z-10"></div>
                
                {/* Viewfinder Target Framing Box */}
                <div className="absolute w-48 h-48 border-2 border-dashed border-cyan-300/80 rounded-2xl pointer-events-none flex items-center justify-center z-10 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                  <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg"></div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg"></div>
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg"></div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg"></div>
                </div>

                <div className="absolute top-3 right-3 px-3 py-1 bg-slate-950/80 border border-emerald-500/50 rounded-full text-[11px] font-bold text-emerald-300 flex items-center gap-1.5 z-20 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>کامێرا چالاکە - بارکۆد سکان بکە</span>
                </div>
              </>
            )}

            {/* Camera Status: Starting State */}
            {cameraStatus === 'starting' && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
                <p className="text-xs font-bold text-cyan-300">داواکردنی مۆڵەت و کردنەوەی کامێرا...</p>
              </div>
            )}

            {/* Camera Status: Permission Denied or Error */}
            {(cameraStatus === 'denied' || cameraStatus === 'error' || !isCameraOn) && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
                  <VideoOff className="w-8 h-8" />
                </div>
                <div className="max-w-xs space-y-1">
                  <p className="text-xs font-bold text-rose-300">
                    {cameraStatus === 'denied'
                      ? 'مۆڵەتی کامێرا دانەنراوە'
                      : cameraStatus === 'error'
                      ? 'کامێرا بەردەست نییە'
                      : 'کامێرا کوژاوەتەوە'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    تکایە لە شوێنی ئادرەسی وێبگەڕەکەتدا ڕێگە بە کامێرا بدە یان کۆدەکە لە خوارەوە بەدەست بنووسە.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCameraOn(true);
                    startCamera();
                  }}
                  className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-xl text-xs font-bold text-cyan-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>دوبارە داگیرساندنەوەی کامێرا</span>
                </button>
              </div>
            )}

            {/* Camera Controls Bar */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-20">
              <button
                onClick={toggleFacingMode}
                className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 border border-white/15 rounded-xl text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer"
                title="گۆڕینی کامێرای پێشەوە / دواوە"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                <span>گۆڕینی کامێرا</span>
              </button>

              <button
                onClick={() => {
                  if (isCameraOn) {
                    stopCamera();
                    setIsCameraOn(false);
                  } else {
                    setIsCameraOn(true);
                  }
                }}
                className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 border border-white/15 rounded-xl text-[11px] font-bold text-slate-300 flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer"
              >
                {isCameraOn ? <VideoOff className="w-3.5 h-3.5 text-rose-400" /> : <Camera className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isCameraOn ? 'کوژاندنەوە' : 'داگیرساندن'}</span>
              </button>
            </div>
          </div>

          {/* Quick Manual Code Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              یان کۆدی نەخۆش یان ژمارە مۆبایل بەدەست بنووسە:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchOrScan()}
                  placeholder="کۆدی نەخۆش (وەک PAT-1001) یان ژمارە مۆبایل..."
                  className="w-full p-3 pr-10 bg-slate-950 border border-white/15 rounded-2xl text-white outline-none focus:border-cyan-400 font-mono text-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                onClick={() => handleSearchOrScan()}
                className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black rounded-2xl hover:brightness-110 active:scale-95 transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>دۆزینەوە</span>
              </button>
            </div>
          </div>


          {/* Search Result Card */}
          {scannedPatient && (
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-950 to-emerald-950/80 p-4 rounded-3xl border border-emerald-500/60 space-y-3 animate-in zoom-in-95 duration-200 shadow-md shadow-emerald-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black flex items-center justify-center text-lg shadow-inner">
                    {scannedPatient.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{scannedPatient.name}</h4>
                    <p className="text-xs font-mono text-emerald-400 font-bold">{scannedPatient.patientCode}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> دۆزرایەوە
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-900/90 p-3 rounded-2xl border border-white/5">
                <div>
                  تەمەن: <strong className="text-white">{scannedPatient.age} ساڵ</strong>
                </div>
                <div>
                  ڕەگەز: <strong className="text-white">{scannedPatient.gender}</strong>
                </div>
                <div>
                  مۆبایل: <strong className="text-white font-mono">{scannedPatient.phone}</strong>
                </div>
                <div>
                  کێشەی پزیشکی: <strong className="text-emerald-300">{scannedPatient.chiefComplaint}</strong>
                </div>
              </div>

              <button
                onClick={handleConfirmPatient}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-black rounded-2xl hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>کردنەوەی تەواوی فایلی پزیشکی {scannedPatient.name}</span>
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
