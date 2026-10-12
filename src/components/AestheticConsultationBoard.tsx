import React, { useState } from 'react';
import { PrintableMedicalDocumentModal } from './PrintableMedicalDocumentModal';
import {
  Sparkles,
  Gem,
  Zap,
  Droplets,
  Sun,
  ShieldCheck,
  Printer,
  Calculator,
  Sliders,
  CheckCircle2,
  Camera,
  Heart,
  FileCheck,
  ChevronRight,
  Info,
} from 'lucide-react';

interface AestheticConsultationBoardProps {
  onSelectTreatmentPreset?: (treatmentName: string, price: number) => void;
}

export const AestheticConsultationBoard: React.FC<AestheticConsultationBoardProps> = ({
  onSelectTreatmentPreset,
}) => {
  const [showPrintConsentModal, setShowPrintConsentModal] = useState(false);
  const [activeFeature, setActiveFeature] = useState<'fitzpatrick' | 'injectables_calc' | 'consent_form' | 'before_after'>('fitzpatrick');

  // Fitzpatrick State
  const [selectedSkinType, setSelectedSkinType] = useState<number>(3); // Type 3 typical for Kurdistan

  // Injectable Calculator State
  const [botoxZones, setBotoxZones] = useState({
    forehead: true,
    glabella: true,
    crowsFeet: false,
    masseter: false,
  });
  const [fillerZones, setFillerZones] = useState({
    lips: true,
    cheeks: false,
    chin: false,
    jawline: false,
  });

  // Calculate totals
  const totalBotoxUnits = 
    (botoxZones.forehead ? 15 : 0) +
    (botoxZones.glabella ? 20 : 0) +
    (botoxZones.crowsFeet ? 12 : 0) +
    (botoxZones.masseter ? 30 : 0);

  const totalFillerML = 
    (fillerZones.lips ? 1.0 : 0) +
    (fillerZones.cheeks ? 1.5 : 0) +
    (fillerZones.chin ? 1.0 : 0) +
    (fillerZones.jawline ? 2.0 : 0);

  const estimatedBotoxPrice = totalBotoxUnits * 5000;
  const estimatedFillerPrice = totalFillerML * 140000;

  // Consent Form State
  const [consentName, setConsentName] = useState('');
  const [consentPhone, setConsentPhone] = useState('');
  const [hasNoContraindications, setHasNoContraindications] = useState(true);
  const [agreedConsent, setAgreedConsent] = useState(false);

  // Before & After comparison slider
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  const fitzpatrickTypes = [
    {
      type: 1,
      name: 'پێستی زۆر سپی (Type I)',
      color: '#fdf2e9',
      borderColor: '#fbd38d',
      desc: 'هەمیشە دەسوتێت لەبەر خۆردا، ڕەنگ ناگرێت (Pale Ivory).',
      laser: 'Alexandrite 755nm بە وزەی نزم تا مامناوەند (14 - 18 J/cm²).',
      cooling: 'ساردکەرەوەی بەهێزی دەستبەجێ (DCD Cryo spray).',
      caution: 'بەکارهێنانی دژەخۆری بەردەوامی SPF 50+.',
    },
    {
      type: 2,
      name: 'پێستی سپی (Type II)',
      color: '#ffedd5',
      borderColor: '#fbcfe8',
      desc: 'زوو دەسوتێت و بە کەمی ئەسمەر دەبێت (Fair Skin).',
      laser: 'Alexandrite 755nm یان Diode 808nm (16 - 20 J/cm²).',
      cooling: 'پێویست بە خێرایی پاش لەیزەر هەیە.',
      caution: 'خۆپاراستن لە تیشکی خۆر ٤٨ کاتژمێر.',
    },
    {
      type: 3,
      name: 'پێستی گەنمڕەنگی ڕوون (Type III - باوی کوردستان)',
      color: '#fed7aa',
      borderColor: '#f472b6',
      desc: 'هەندێک جار دەسوتێت، بە شێوەیەکی یەکسان گەنمڕەنگ دەبێت.',
      laser: 'Alexandrite 755nm / Diode 808nm (18 - 22 J/cm²). ئەنجامی خێرا و سەلامەت.',
      cooling: 'ساردکەرەوەی ئاسایی.',
      caution: 'دوورکەوتنەوە لە تەسمیڕکردنی خۆر ۲ هەفتە پێش جلسە.',
    },
    {
      type: 4,
      name: 'پێستی گەنمڕەنگی مامناوەند (Type IV)',
      color: '#fdba74',
      borderColor: '#c084fc',
      desc: 'بە دەگمەن دەسوتێت، زوو ڕەنگ دەگرێت (Olive / Mediterranean).',
      laser: 'Diode 808nm یان Long-pulsed Nd:YAG 1064nm بۆ پاراستنی مێلانین.',
      cooling: 'ساردکەرەوەی پەیوەست بە سەرە گەورەکان.',
      caution: 'بەکارنەهێنانی وزەی لەڕادەبەدەر بەبێ تێست سپۆت.',
    },
    {
      type: 5,
      name: 'پێستی ئەسمەری تۆخ (Type V)',
      color: '#fb923c',
      borderColor: '#a855f7',
      desc: 'دەگمەن دەسوتێت، بە قووڵی ئەسمەر دەبێت (Dark Brown).',
      laser: 'تەنها Long-Pulsed Nd:YAG 1064nm بە درێژی شەپۆلی قووڵ.',
      cooling: 'پێویست بە ساردکەرەوەی بەردەوام.',
      caution: 'ڕێگریکردن لە پەڵەی دوای لەیزەر (PIH Prevention).',
    },
    {
      type: 6,
      name: 'پێستی زۆر تۆخ (Type VI)',
      color: '#c2410c',
      borderColor: '#9333ea',
      desc: 'هەرگیز ناسوتێت، پێستی زۆر دەوڵەمەند بە مێلانین.',
      laser: 'تەنها 1064nm Nd:YAG بە پەڵسی درێژ.',
      cooling: 'فێنککەرەوەی چڕ و هەوای سارد.',
      caution: 'پشکنینی بەشێکی بچووک ٤٨ کاتژمێر پێش لەیزەر.',
    },
  ];

  const currentFitz = fitzpatrickTypes[selectedSkinType - 1];

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 backdrop-blur-2xl border border-pink-500/30 rounded-[36px] p-6 md:p-8 shadow-md relative overflow-hidden my-6">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 border border-pink-500/30 text-pink-300 text-xs font-black rounded-full flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
              سەنتەری ڕاوێژکاری و پێداویستیەکانی جوانکاری
            </span>
            <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold rounded-md">
              AESTHETIC SUITE
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-2">
            شیکاری جۆری پێست، حاسیبەی بۆتۆکس و فیلەر، و فۆرمی ڕەزامەندی
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            سەرجەم ئامرازە سەرەکی و تایبەتمەندەکانی سەنتەری جوانکاری لە یەک پانێڵی پێشکەوتوودا.
          </p>
        </div>

        {/* Feature Tabs (دوگمەکانی هەڵبژاردنی تایبەتمەندییەکان) */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950/95 p-1.5 rounded-2xl border-2 border-pink-500/30 backdrop-blur-2xl shadow-[0_0_20px_rgba(236,72,153,0.15)]">
          {[
            { id: 'fitzpatrick' as const, label: 'شیکاری Fitzpatrick', icon: Sun },
            { id: 'injectables_calc' as const, label: 'حاسیبەی فیلەر و بۆتۆکس', icon: Calculator },
            { id: 'consent_form' as const, label: 'فۆرمی ڕەزامەندی یاسایی', icon: FileCheck },
            { id: 'before_after' as const, label: 'پێشانگای پێش و پاش', icon: Camera },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = activeFeature === id;
            return (
              <button
                key={id}
                onClick={() => setActiveFeature(id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 cursor-pointer select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 via-fuchsia-600 to-purple-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/60 scale-[1.03]'
                    : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/10 hover:border-pink-500/40 hover:shadow-[0_0_12px_rgba(236,72,153,0.2)]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-pink-400'}`} />
                <span>{label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff] animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FEATURE 1: FITZPATRICK SKIN CLASSIFIER */}
      {activeFeature === 'fitzpatrick' && (
        <div className="pt-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {fitzpatrickTypes.map((t) => {
              const isSelected = selectedSkinType === t.type;
              return (
                <button
                  key={t.type}
                  onClick={() => setSelectedSkinType(t.type)}
                  className={`p-4 rounded-2xl border transition-all duration-300 text-right cursor-pointer flex flex-col justify-between select-none relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-b from-pink-950/60 to-purple-950/80 border-2 border-pink-400 shadow-[0_0_25px_rgba(236,72,153,0.35),inset_0_0_15px_rgba(236,72,153,0.2)] scale-[1.04] ring-2 ring-pink-400/40'
                      : 'bg-slate-950/70 border-white/10 hover:border-pink-500/30 hover:bg-slate-900/80 hover:shadow-[0_0_15px_rgba(236,72,153,0.15)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-6 h-6 rounded-full border-2 shadow-sm transition-transform duration-300 ${isSelected ? 'scale-110 ring-2 ring-pink-400' : ''}`}
                      style={{ backgroundColor: t.color, borderColor: t.borderColor }}
                    />
                    <span className={`text-[11px] font-mono font-black ${isSelected ? 'text-pink-200' : 'text-slate-400'}`}>
                      Type {t.type}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white leading-tight mt-1">{t.name.split('(')[0]}</h4>
                  {isSelected && (
                    <div className="absolute top-1 left-1">
                      <span className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_6px_#f472b6] block" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Details Card */}
          <div className="bg-slate-900/90 border border-pink-500/30 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-md">
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                <Sun className="w-4 h-4" /> جۆری پێست و وەڵامدانەوەی خۆر
              </span>
              <h3 className="text-lg font-black text-white">{currentFitz.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
                {currentFitz.desc}
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> ئامێر و درێژی شەپۆلی لەیزەری پێشنیارکراو
              </span>
              <div className="text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-2">
                <div className="font-bold text-cyan-300">{currentFitz.laser}</div>
                <div className="text-slate-400 text-[11px]">سیستەمی فێنککەرەوە: {currentFitz.cooling}</div>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> ڕێنمایی پزیشکی و چاودێری
              </span>
              <div className="text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-2">
                <div className="text-amber-300 font-bold">{currentFitz.caution}</div>
                <div className="text-slate-400 text-[11px]">پێویستە پاش جەلسە کرێمی Fucidin و دژەخۆر بدرێت.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 2: INJECTABLES CALCULATOR */}
      {activeFeature === 'injectables_calc' && (
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Botox Section */}
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">حاسیبەی دەرزی بۆتۆکس (Botox Units)</h3>
                  <p className="text-[11px] text-slate-400">مارکە: Allergan 100U / Dysport</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-pink-500/20 text-pink-300 font-mono font-bold text-xs rounded-xl border border-pink-500/30">
                {totalBotoxUnits} یەکە (Units)
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { key: 'forehead', label: 'ناوچەوان (Forehead Horizontal Lines)', units: '15 U' },
                { key: 'glabella', label: 'نێوان برۆ (Glabella / Frown Lines)', units: '20 U' },
                { key: 'crowsFeet', label: 'دەوری چاو (Crow’s Feet)', units: '12 U' },
                { key: 'masseter', label: 'بچووککردنەوەی چەناگە (Masseter Slimming)', units: '30 U' },
              ].map((zone) => {
                const isChecked = botoxZones[zone.key as keyof typeof botoxZones];
                return (
                  <label
                    key={zone.key}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer text-xs select-none ${
                      isChecked
                        ? 'bg-gradient-to-r from-pink-950/70 via-slate-900 to-slate-950 border-2 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.35)] scale-[1.01]'
                        : 'bg-slate-950/60 border-white/10 hover:border-pink-500/30 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                        isChecked
                          ? 'bg-gradient-to-tr from-pink-500 to-fuchsia-500 border-pink-300 shadow-[0_0_8px_#f472b6]'
                          : 'bg-slate-900 border-white/20'
                      }`}>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setBotoxZones({ ...botoxZones, [zone.key]: e.target.checked })
                        }
                        className="hidden"
                      />
                      <span className={`font-bold ${isChecked ? 'text-white' : 'text-slate-300'}`}>{zone.label}</span>
                    </div>
                    <span className={`font-mono font-black px-2 py-0.5 rounded-lg border ${
                      isChecked
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}>{zone.units}</span>
                  </label>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">تێچووی خەمڵێنراو:</span>
              <span className="font-mono font-black text-pink-300 text-base bg-pink-500/10 px-3 py-1 rounded-xl border border-pink-500/30">
                {estimatedBotoxPrice.toLocaleString()} د.ع
              </span>
            </div>
          </div>

          {/* Right: Filler Section */}
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">حاسیبەی دەرزی فیلەر (Filler Syringes)</h3>
                  <p className="text-[11px] text-slate-400">مارکە: Juvederm Ultra / Teosyal</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 font-mono font-bold text-xs rounded-xl border border-purple-500/30">
                {totalFillerML.toFixed(1)} ml
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { key: 'lips', label: 'فیلەری لێو (Russian Lip / Contour)', ml: '1.0 ml' },
                { key: 'cheeks', label: 'فیلەری گۆنا (Cheekbone Volume)', ml: '1.5 ml' },
                { key: 'chin', label: 'فیلەری چەناکە (Chin Projection)', ml: '1.0 ml' },
                { key: 'jawline', label: 'هێڵی تەکساس (Texas Jawline)', ml: '2.0 ml' },
              ].map((zone) => {
                const isChecked = fillerZones[zone.key as keyof typeof fillerZones];
                return (
                  <label
                    key={zone.key}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer text-xs select-none ${
                      isChecked
                        ? 'bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-950 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)] scale-[1.01]'
                        : 'bg-slate-950/60 border-white/10 hover:border-purple-500/30 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                        isChecked
                          ? 'bg-gradient-to-tr from-purple-500 to-indigo-500 border-purple-300 shadow-[0_0_8px_#c084fc]'
                          : 'bg-slate-900 border-white/20'
                      }`}>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setFillerZones({ ...fillerZones, [zone.key]: e.target.checked })
                        }
                        className="hidden"
                      />
                      <span className={`font-bold ${isChecked ? 'text-white' : 'text-slate-300'}`}>{zone.label}</span>
                    </div>
                    <span className={`font-mono font-black px-2 py-0.5 rounded-lg border ${
                      isChecked
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}>{zone.ml}</span>
                  </label>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">تێچووی خەمڵێنراو:</span>
              <span className="font-mono font-black text-purple-300 text-base bg-purple-500/10 px-3 py-1 rounded-xl border border-purple-500/30">
                {estimatedFillerPrice.toLocaleString()} د.ع
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 3: CONSENT FORM */}
      {activeFeature === 'consent_form' && (
        <div className="pt-6 max-w-3xl mx-auto space-y-6">
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-md">
            <div className="text-center space-y-2 border-b border-white/10 pb-4">
              <span className="text-[11px] font-black bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                فۆرمی یاسایی کلینیک
              </span>
              <h3 className="text-lg md:text-xl font-black text-white">
                فۆرمی ڕەزامەندی وەرگرتنی خزمەتگوزاری لەیزەر و جوانکاری
              </h3>
              <p className="text-xs text-slate-400">
                سەنتەری جوانکاری (BEAUTY CENTER) - هەولێر / سلێمانی
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">ناوی سیانی سەردانکەر *</label>
                <input
                  type="text"
                  placeholder="ناوی تەواو..."
                  value={consentName}
                  onChange={(e) => setConsentName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-pink-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-bold">ژمارەی مۆبایل *</label>
                <input
                  type="text"
                  placeholder="0750 000 0000"
                  value={consentPhone}
                  onChange={(e) => setConsentPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-pink-400"
                />
              </div>
            </div>

            {/* Medical Questions */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-white/5 text-xs text-slate-300">
              <h4 className="font-bold text-white text-xs mb-2">پرسیارە پزیشکییەکان بۆ سەلامەتی ئێوە:</h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasNoContraindications}
                  onChange={(e) => setHasNoContraindications(e.target.checked)}
                  className="accent-pink-500 w-4 h-4 rounded"
                />
                <span>دووگیان نیم و شیری دایک نادەم، وە دەرمانی ڕۆئاکوتان (Roaccutane) بەکارناهێنم لە ماوەی ٦ مانگی ڕابردوودا.</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedConsent}
                  onChange={(e) => setAgreedConsent(e.target.checked)}
                  className="accent-pink-500 w-4 h-4 rounded"
                />
                <span>ڕێنماییەکانی پێش و پاش جەلسەم پێدراوە و ئاگادارم کە بەکارهێنانی دژەخۆری بەردەوام پێویستە.</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowPrintConsentModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/30 text-amber-300 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>چاپکردنی فۆڕم (Print PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!consentName) {
                    alert('تکایە سەرەتا ناوی سەردانکەر بنووسە!');
                    return;
                  }
                  alert(`فۆرمی ڕەزامەندی بە سەرکەوتوویی لەگەڵ دۆسیەی (${consentName}) پەیوەست کرا.`);
                }}
                disabled={!agreedConsent}
                className={`px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition-all ${
                  agreedConsent
                    ? 'bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white cursor-pointer hover:brightness-110'
                    : 'bg-white/10 text-slate-500 cursor-not-allowed'
                }`}
              >
                پەسەندکردنی واژوو و تۆمارکردن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 4: BEFORE & AFTER PHOTO GALLERY */}
      {activeFeature === 'before_after' && (
        <div className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Interactive Image Comparison */}
            <div className="bg-slate-900 p-4 rounded-3xl border border-white/10 space-y-3 shadow-md">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-pink-300">بەراوردکاری ڕاستەوخۆ (Interactive Slider)</span>
                <span className="font-mono text-slate-400">فیلەری لێو (Lip Filler Contour)</span>
              </div>

              <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-white/10 select-none">
                {/* After Photo (Full Width) */}
                <img
                  src="https://images.unsplash.com/photo-1512290900672-1f5be1c6e1c2?w=800&auto=format&fit=crop&q=80"
                  alt="After Procedure"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute bottom-3 left-3 bg-pink-600/90 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow">
                  دواتر (After)
                </span>

                {/* Before Photo (Clipped by slider) */}
                <div
                  className="absolute inset-y-0 right-0 overflow-hidden"
                  style={{ width: `${100 - sliderPosition}%` }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80"
                    alt="Before Procedure"
                    className="absolute inset-y-0 right-0 w-[500px] max-w-none h-full object-cover"
                  />
                  <span className="absolute bottom-3 right-3 bg-slate-900/90 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow">
                    پێشتر (Before)
                  </span>
                </div>

                {/* Divider Line */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_10px_#fff] pointer-events-none"
                  style={{ right: `${100 - sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-pink-500 border-2 border-white shadow flex items-center justify-center text-[10px] text-white">
                    ↔
                  </div>
                </div>
              </div>

              {/* Slider Controller */}
              <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
                <span>پێشتر</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="w-full accent-pink-500 bg-slate-800 h-2 rounded cursor-pointer"
                />
                <span>دواتر</span>
              </div>
            </div>

            {/* Gallery Samples */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-pink-400" /> نموونەی بەڵگەنامەی چارەسەرەکانی سەنتەر
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900/80 rounded-2xl border border-white/10 space-y-2">
                  <img
                    src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&auto=format&fit=crop&q=60"
                    alt="HydraFacial Glow"
                    className="w-full h-24 object-cover rounded-xl"
                  />
                  <div className="text-[11px] font-bold text-white">هایدرۆفەیشڵی قووڵ</div>
                  <div className="text-[10px] text-pink-300 font-mono">نەرمبوون و نەمانی کونیلە</div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-2xl border border-white/10 space-y-2">
                  <img
                    src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=60"
                    alt="Laser Hair Removal"
                    className="w-full h-24 object-cover rounded-xl"
                  />
                  <div className="text-[11px] font-bold text-white">لەیزەری ئەلێکساندەری سەرد</div>
                  <div className="text-[10px] text-pink-300 font-mono">ئەنجامی جلسەی ٥</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrintConsentModal && (
        <PrintableMedicalDocumentModal
          isOpen={showPrintConsentModal}
          onClose={() => setShowPrintConsentModal(false)}
          docType="consent_form"
          data={{
            patientName: consentName || 'چارەخوازی سەنتەر',
            procedureName: 'خزمەتگوزاری لەیزەر، فیلەر و ڕاوێژی جوانکاری',
            date: new Date().toISOString().split('T')[0],
          }}
        />
      )}
    </div>
  );
};
