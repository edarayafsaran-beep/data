import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, X, LayoutDashboard, Users, Calendar, DollarSign, Wifi, CheckCircle2, HelpCircle } from 'lucide-react';

interface TourGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TourGuideModal: React.FC<TourGuideModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = [
    {
      title: 'بەخێر هاتن بۆ سەنتەری جوانکاری',
      description: 'ئەم ڕێبەرە کورتە (Tour Guide) یارمەتیت دەدات لە چەند هەنگاوێکی کورتدا بە سەرجەم بەشە سەرەکییەکانی سیستەمەکە ئاشنا ببن.',
      icon: Sparkles,
      color: 'from-pink-500 to-purple-500',
    },
    {
      title: '١. داشبۆڕدی سەرەکی (Dashboard)',
      description: 'شاشەی سەرەکی سیستەم کە سەردانیکەرانی ئەمڕۆ، نۆرەی لەیزەر و فیلەر، نەخشەی 3Dی جوانکاری و کۆی داهات پیشان دەدات.',
      icon: LayoutDashboard,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: '٢. بەڕێوەبردنی سەردانکەران (Clients)',
      description: 'تۆمارکردن و بەڕێوەبردنی پڕۆفایلی جوانکاری، جۆری پێست، وێنە و ڕێنمایی تایبەت بە هەر بەڕێزێک.',
      icon: Users,
      color: 'from-pink-500 to-rose-400',
    },
    {
      title: '٣. مەوعیدەکان و وەتس ئەپ (Appointments & WhatsApp)',
      description: 'ڕێکخستنی کاتی نۆرەکانی لەیزەر و جوانکاری لەگەڵ ناردنی خۆکاری نامەی بیرهێنانەوە و سوپاسی وەتس ئەپ.',
      icon: Calendar,
      color: 'from-fuchsia-500 to-pink-500',
    },
    {
      title: '٤. حیسابات و دارایی (Financials)',
      description: 'بەڕێوەبردنی وردی پارەی وەرگیراوی جلسەکان، کڕینی کەرەستەی جوانکاری و مووچەی ستاف و داهاتی گشتی.',
      icon: DollarSign,
      color: 'from-amber-500 to-orange-400',
    },
    {
      title: '٥. کارکردن بە بێ ئینتەرنێت (Offline PWA)',
      description: 'سیستەمەکە بەردەوام کار دەکات تەنانەت ئەگەر ئینتەرنێتیش بپچڕێت؛ هەموو زانیارییەکان پارێزراون.',
      icon: Wifi,
      color: 'from-emerald-500 to-teal-400',
    },
  ];

  if (!isOpen) return null;

  const step = steps[currentStep] || steps[0];
  const IconComponent = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/15 rounded-[36px] w-full max-w-xl overflow-hidden shadow-md p-6 md:p-8 flex flex-col justify-between relative">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white">ڕێنیشاندەری سیستەم (Tour Guide)</h3>
              <p className="text-[11px] text-slate-400">هەنگاو {currentStep + 1} لە {steps.length}</p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              setCurrentStep(0);
            }}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="py-8 md:py-10 text-center space-y-6">
          <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr ${step.color} p-0.5 shadow-md flex items-center justify-center transform hover:scale-105 transition-transform`}>
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-white">
              <IconComponent className="w-10 h-10 text-cyan-300" />
            </div>
          </div>

          <div className="space-y-3 max-w-md mx-auto">
            <h2 className="text-lg md:text-xl font-black text-white leading-relaxed">
              {step.title}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx ? 'w-8 bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentStep === 0
                ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-500'
                : 'bg-white/10 hover:bg-white/15 text-white cursor-pointer'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            <span>پێشوو</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                setCurrentStep(0);
              }}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
            >
              لادان (Skip)
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md hover:brightness-110 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <span>{currentStep === steps.length - 1 ? 'دەستپێکردن' : 'دواتر'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
