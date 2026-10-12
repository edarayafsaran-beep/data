import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { playNotificationSound } from '../utils/audioNotification';
import {
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  LogIn,
  Bell,
  Info,
  X,
  ArrowRight,
  Volume2,
  VolumeX,
} from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'whatsapp' | 'login' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  targetTab?: string;
  targetAction?: () => void;
  duration?: number; // duration in ms (default 5000)
}

interface NotificationContextType {
  notify: (options: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, onNavigateTab }) => {
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const notify = useCallback(
    ({ type, title, message, targetTab, targetAction, duration = 5000 }: Omit<NotificationItem, 'id' | 'timestamp'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newToast: NotificationItem = {
        id,
        type,
        title,
        message,
        timestamp,
        targetTab,
        targetAction,
        duration,
      };

      if (!isMuted) {
        playNotificationSound(type);
      }

      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 toasts visible

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [isMuted, dismiss]
  );

  const handleToastClick = (toast: NotificationItem) => {
    if (toast.targetTab && onNavigateTab) {
      onNavigateTab(toast.targetTab);
    }
    if (toast.targetAction) {
      toast.targetAction();
    }
    dismiss(toast.id);
  };

  return (
    <NotificationContext.Provider value={{ notify, dismiss, clearAll, isMuted, toggleMute }}>
      {children}

      {/* Floating Bottom-Right Notifications Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        {toasts.map((toast) => {
          const config = getNotificationStyleConfig(toast.type);
          const Icon = config.icon;

          return (
            <div
              key={toast.id}
              onClick={() => handleToastClick(toast)}
              className={`pointer-events-auto group relative flex flex-col overflow-hidden rounded-2xl border ${config.borderColor} ${config.bgColor} backdrop-blur-2xl shadow-md p-4 text-white transition-all duration-300 hover:scale-[1.03] cursor-pointer animate-in slide-in-from-bottom-5 fade-in`}
              style={{ boxShadow: `${config.glowShadow}, inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)` }}
            >
              {/* Glass sheen highlight line */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/20 pointer-events-none" />

              {/* Top Accent Line */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${config.accentBg}`} />

              <div className="relative z-10 flex items-start gap-3">
                {/* Icon Badge */}
                <div className={`p-2.5 rounded-xl ${config.iconBg} ${config.iconColor} shrink-0 mt-0.5 shadow-md border border-white/10 backdrop-blur-md`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-black text-white truncate drop-shadow-sm">{toast.title}</h4>
                    <span className="text-[10px] font-mono opacity-75 text-slate-200 shrink-0">{toast.timestamp}</span>
                  </div>

                  <p className="text-[11px] leading-relaxed text-slate-100/90 line-clamp-2 drop-shadow-sm">{toast.message}</p>

                  {/* Navigation prompt if target tab exists */}
                  {toast.targetTab && (
                    <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-teal-300 group-hover:text-white transition-colors">
                      <span>کلیک بکە بۆ چوون بۆ ئەم بەشە</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismiss(toast.id);
                  }}
                  className="p-1 text-slate-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors shrink-0"
                  title="داخستن"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Countdown timer bar */}
              {toast.duration && toast.duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
                  <div
                    className={`h-full ${config.accentBg}`}
                    style={{
                      animation: `shrinkWidth ${toast.duration}ms linear forwards`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Styling helper based on type
function getNotificationStyleConfig(type: NotificationType) {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle2,
        bgColor: 'bg-emerald-950/45',
        borderColor: 'border-emerald-400/50 hover:border-emerald-300',
        iconBg: 'bg-emerald-500/30',
        iconColor: 'text-emerald-300',
        accentBg: 'bg-emerald-400',
        glowShadow: '0 12px 40px -8px rgba(16, 185, 129, 0.45)',
      };
    case 'error':
      return {
        icon: AlertTriangle,
        bgColor: 'bg-rose-950/45',
        borderColor: 'border-rose-400/50 hover:border-rose-300',
        iconBg: 'bg-rose-500/30',
        iconColor: 'text-rose-300',
        accentBg: 'bg-rose-400',
        glowShadow: '0 12px 40px -8px rgba(244, 63, 94, 0.45)',
      };
    case 'whatsapp':
      return {
        icon: MessageSquare,
        bgColor: 'bg-teal-950/45',
        borderColor: 'border-teal-300/60 hover:border-teal-200',
        iconBg: 'bg-teal-400/30',
        iconColor: 'text-teal-200',
        accentBg: 'bg-teal-300',
        glowShadow: '0 12px 40px -8px rgba(45, 212, 191, 0.5)',
      };
    case 'login':
      return {
        icon: LogIn,
        bgColor: 'bg-indigo-950/45',
        borderColor: 'border-indigo-400/60 hover:border-indigo-300',
        iconBg: 'bg-indigo-500/30',
        iconColor: 'text-indigo-200',
        accentBg: 'bg-indigo-400',
        glowShadow: '0 12px 40px -8px rgba(99, 102, 241, 0.5)',
      };
    case 'warning':
      return {
        icon: Bell,
        bgColor: 'bg-amber-950/45',
        borderColor: 'border-amber-400/50 hover:border-amber-300',
        iconBg: 'bg-amber-500/30',
        iconColor: 'text-amber-300',
        accentBg: 'bg-amber-400',
        glowShadow: '0 12px 40px -8px rgba(245, 158, 11, 0.45)',
      };
    case 'info':
    default:
      return {
        icon: Info,
        bgColor: 'bg-slate-900/45',
        borderColor: 'border-cyan-400/50 hover:border-cyan-300',
        iconBg: 'bg-cyan-500/30',
        iconColor: 'text-cyan-300',
        accentBg: 'bg-cyan-400',
        glowShadow: '0 12px 40px -8px rgba(6, 182, 212, 0.45)',
      };
  }
}
