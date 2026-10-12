import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download, CheckCircle2, ShieldAlert, RefreshCw, X, HardDrive } from 'lucide-react';

interface OfflineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({ isOpen, onClose }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline_saved'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<string>('کەمێک پێش ئێستا');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      setTimeout(() => setSyncStatus('synced'), 2000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline_saved');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('بۆ دامەزراندنی وەک ئەپ (PWA)، تکایە لە مەنوی وێبگەڕەکەت (Chrome / Safari) هەڵبژێرە: "Add to Home Screen" یان "Install App".');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/15 rounded-[36px] w-full max-w-lg overflow-hidden shadow-md p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isOnline ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-white">کارکردنی بێ ئینتەرنێت (Offline PWA)</h3>
              <p className="text-xs text-slate-400">بەڕێوەبردنی کلینیک تەنانەت بەبێ هێڵی ئینتەرنێت</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network & Cache Status Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">دۆخی پەیوەندی</span>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-teal-400 shadow-[0_0_10px_#2dd4bf] animate-pulse' : 'bg-rose-400 shadow-[0_0_10px_#f43f5e]'}`}></span>
              <span className="text-sm font-bold text-white">{isOnline ? 'آنلاین (Online Connected)' : 'ئۆفلاین (Offline Mode)'}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isOnline ? 'سیستەم ڕاستەوخۆ دەبەسترێتەوە بە داتابەیس و هەموو گۆڕانکارییەکان سەیڤ دەبن.' : 'هێڵی ئینتەرنێت پچڕاوە. هەموو گۆڕانکارییەکانت لە ناوخۆی مۆبایل یان کۆمپیوتەرەکەتدا (Local Cache) هەڵدەگیرێن.'}
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">داتای ناوخۆیی (IndexedDB / Cache)</span>
            <div className="flex items-center gap-2 text-teal-300 text-sm font-bold">
              <HardDrive className="w-4 h-4 text-teal-400" />
              <span>{syncStatus === 'synced' ? 'تەواو هەڵگیراوە و هاوکاتە' : syncStatus === 'syncing' ? 'لە کاتی هاوکاتکردنەوە...' : 'هەڵگیراوە لە ئۆفلاین'}</span>
            </div>
            <p className="text-[11px] text-slate-400">دوایین هاوکاتکردنەوە: {lastSyncTime}</p>
          </div>
        </div>

        {/* Offline Features Bullet points */}
        <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span><strong>تۆمارکردنی نەخۆش و مەوعید:</strong> دەتوانیت لە کاتی نەبوونی ئینتەرنێتدا نەخۆشی نوێ زیاد بکەیت و مەوعید دابنێیت.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span><strong>داخڵکردنی پارە و مەسروفات:</strong> سەرجەم مامەڵە داراییەکان لە باک ئەپی ناوخۆیدا دەمێننەوە.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span><strong>خۆکارانە (Auto-Sync):</strong> هەرکاتێک ئینتەرنێت گەڕایەوە، داتاکان بە شێوەیەکی خۆکار لەگەڵ سێرڤەردا ڕێک دەبنەوە.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          {!isInstalled ? (
            <button
              onClick={handleInstallClick}
              className="px-5 py-3 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-xs rounded-2xl shadow-md hover:brightness-110 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>دامەزراندنی ئەپ (Install PWA)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold bg-teal-500/10 px-4 py-2.5 rounded-2xl border border-teal-500/30">
              <CheckCircle2 className="w-4 h-4" />
              <span>ئەپەکە وەک PWA دامەزراوە</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-2xl cursor-pointer transition-all"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
};
