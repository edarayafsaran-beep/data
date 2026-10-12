import React from 'react';

interface ActionProgressModalProps {
  isOpen: boolean;
  title: string;
  progress: number; // 0 to 100
  currentStepText?: string;
}

export const ActionProgressModal: React.FC<ActionProgressModalProps> = ({
  isOpen,
  title,
  progress,
  currentStepText,
}) => {
  if (!isOpen) return null;

  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  // Circular progress calculations
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs w-full shadow-2xl text-right relative overflow-hidden ring-1 ring-white/10">
        {/* Soft Ambient Glow */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-500/15 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none"></div>

        {/* Compact Header with Circular SVG Graphic */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
            <svg className="w-16 h-16 transform -rotate-90 drop-shadow-md">
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="5"
                className="text-slate-800 fill-none"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="url(#progressGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                className="transition-all duration-300 ease-out fill-none"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black bg-gradient-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent">
                {clampedProgress}%
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white truncate mb-1">{title}</h3>
            <p className="text-[11px] text-pink-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping inline-block"></span>
              {clampedProgress === 100 ? 'تەواو بوو' : 'خەریکی جێبەجێکردن...'}
            </p>
          </div>
        </div>

        {/* Current Step Description Card */}
        {currentStepText && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mb-3 text-right">
            <p className="text-xs text-slate-300 font-medium leading-relaxed flex items-start gap-2">
              <span className="text-pink-400 mt-0.5">⚡</span>
              <span className="flex-1">{currentStepText}</span>
            </p>
          </div>
        )}

        {/* Mini Linear Progress Bar */}
        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden p-0.5 mb-2">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${clampedProgress}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
          <span>داتابەیس & فایەرستۆر</span>
          <span>{clampedProgress}% / 100%</span>
        </div>
      </div>
    </div>
  );
};
