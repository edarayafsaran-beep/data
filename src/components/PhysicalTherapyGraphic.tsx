import React, { useState } from 'react';
import { Sparkles, Heart, Zap, Flame, Droplets, Shield, ChevronLeft, ChevronRight, Gem, Award, Eye, Sun, UserCheck } from 'lucide-react';

export const PhysicalTherapyGraphic: React.FC = () => {
  const [activeZone, setActiveZone] = useState<'face' | 'lips' | 'laser' | 'hair' | 'eyes'>('face');
  const [laserEnergy, setLaserEnergy] = useState<number>(18);
  const [skinType, setSkinType] = useState<number>(3);
  const [wavelength, setWavelength] = useState<'755nm' | '808nm' | '1064nm'>('755nm');

  const zones = [
    {
      id: 'face',
      name: 'پێست و ڕوخسار (Skin & Glow)',
      code: 'FACE-01',
      procedure: 'هایدرۆفەیشڵی قووڵ + تەقشیری کاربۆن',
      sessions: '٤ بۆ ٦ جلسە',
      glowScore: '96%',
      status: 'نوێبوونەوەی کۆلاجین و نەرمبوونی پێست',
      recommendedTech: 'HydraFacial Elite MD + Carbon Laser',
      recoveryTime: 'دەستبەجێ (بێ پشوو)',
    },
    {
      id: 'lips',
      name: 'فیلەری لێو و گۆنا (Lip & Cheeks)',
      code: 'INJECT-02',
      procedure: 'فیلەری هیالۆرۆنیک ئەسیدی فەرەنسی',
      sessions: '١ جلسە (مانەوە تا ١٢ مانگ)',
      glowScore: '98%',
      status: 'قەبارەدان و کێشانی هێڵی لێوی پڕ و جوانکاری بەرز',
      recommendedTech: 'Juvederm Ultra XC / Teosyal Kiss',
      recoveryTime: '٢٤ کاتژمێر هێوربوونەوە',
    },
    {
      id: 'eyes',
      name: 'ناوچەوان و دەوری چاو (Botox Lift)',
      code: 'BOTOX-03',
      procedure: 'بۆتۆکسی دژە چرچی و بەرزکردنەوەی برۆ',
      sessions: '١ جلسە (نوێکردنەوە پاش ٦ مانگ)',
      glowScore: '94%',
      status: 'نەمانی تەواوی هێڵەکانی پێکەنین و تووڕەیی',
      recommendedTech: 'Allergan Botox 100U Cosmetic',
      recoveryTime: 'بێ هیچ شوێنەوارێک',
    },
    {
      id: 'laser',
      name: 'لەیزەری لەش (Full Body Laser)',
      code: 'LASER-04',
      procedure: 'لەیزەری سەردی ئەلێکساندەر بێ ئازار',
      sessions: '٦ بۆ ٨ جلسە',
      glowScore: '99%',
      status: 'نەهێشتنی ٩٥٪ی مووی نەخوازراو بە هەمیشەیی',
      recommendedTech: 'Candela GentleLase Pro (DCD Cooling)',
      recoveryTime: 'دەستبەجێ بە بەکارهێنانی دژەخۆر',
    },
    {
      id: 'hair',
      name: 'قژ و بێخی سەر (PRP & Meso)',
      code: 'HAIR-05',
      procedure: 'پلازمای دەوڵەمەند بە پەڕەکانی خوێن',
      sessions: '٣ بۆ ٥ جلسە',
      glowScore: '92%',
      status: 'بەهێزکردنی ڕەگی موو و وەستانی هەڵوەرین',
      recommendedTech: 'Swiss RegenLab PRP + Biotin Booster',
      recoveryTime: '١ ڕۆژ پشوودان بە بێخی سەر',
    },
  ];

  const currentZoneData = zones.find((z) => z.id === activeZone) || zones[0];

  return (
    <div className="bg-gradient-to-br from-slate-950/90 via-purple-950/20 to-slate-950/90 backdrop-blur-2xl border border-pink-500/30 rounded-[36px] p-6 md:p-8 shadow-md relative overflow-hidden my-6">
      {/* Background ambient radial flares */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[130px] pointer-events-none"></div>

      {/* Header bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-pink-300 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
              نەخشەی زیرەکی شیکاری پێست و لەیزەری جوانکاری
            </span>
            <span className="px-2.5 py-0.5 bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-300 text-[10px] font-mono rounded-md font-bold">
              3D AESTHETIC VISUALIZER
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white mt-1.5 tracking-tight flex items-center gap-2">
            <span>شیکاری زۆنەکانی دەموچاو و جەستە (Facial & Body Aesthetic Map)</span>
            <Gem className="w-5 h-5 text-pink-400 animate-pulse hidden sm:inline" />
          </h3>
        </div>

        {/* Zone Selector Buttons (دوگمەکانی هەڵبژاردنی زۆنی لەش و دەموچاو) */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-950/95 rounded-2xl border-2 border-pink-500/30 backdrop-blur-2xl shadow-[0_0_20px_rgba(236,72,153,0.15)]">
          {zones.map((z) => {
            const isActive = activeZone === z.id;
            const getIcon = () => {
              switch (z.id) {
                case 'face': return <Sparkles className={`w-3.5 h-3.5 ${isActive ? 'text-white animate-spin' : 'text-pink-400'}`} />;
                case 'lips': return <Heart className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-rose-400'}`} />;
                case 'eyes': return <Eye className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-purple-400'}`} />;
                case 'laser': return <Zap className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-cyan-400'}`} />;
                case 'hair': return <Flame className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-amber-400'}`} />;
                default: return <Sparkles className="w-3.5 h-3.5 text-pink-400" />;
              }
            };

            return (
              <button
                key={z.id}
                onClick={() => setActiveZone(z.id as any)}
                className={`group px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 cursor-pointer select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 via-fuchsia-600 to-purple-600 text-white shadow-[0_0_22px_rgba(236,72,153,0.55),inset_0_1px_1px_rgba(255,255,255,0.45)] scale-[1.04] border border-white/60'
                    : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/10 hover:border-pink-500/40 hover:shadow-[0_0_15px_rgba(236,72,153,0.2)]'
                }`}
              >
                <span className={`p-1 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-pink-500/20'} transition-colors`}>
                  {getIcon()}
                </span>
                <span>{z.name.split(' ')[0]}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff] animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Aesthetic Visualizer Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-6">
        {/* Left Column: Interactive Face & Silhouette Graphic */}
        <div className="lg:col-span-5 relative flex items-center justify-center p-6 bg-slate-900/60 rounded-3xl border border-pink-500/20 shadow-inner">
          <div className="relative w-full max-w-[280px] h-[340px] flex items-center justify-center">
            {/* Holographic Glowing Orbit Rings */}
            <div className="absolute w-64 h-64 border border-pink-500/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
            <div className="absolute w-48 h-48 border border-dashed border-purple-400/30 rounded-full animate-[spin_12s_linear_infinite_reverse]"></div>

            {/* Stylized Face & Aesthetic Geometry Silhouette */}
            <svg viewBox="0 0 200 320" className="w-full h-full drop-shadow-[0_0_20px_rgba(244,114,182,0.4)]">
              {/* Head / Face Oval Structure */}
              <ellipse cx="100" cy="110" rx="55" ry="72" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeDasharray="2 2" />
              <path d="M 60 90 Q 100 175 140 90" fill="none" stroke="#f472b6" strokeWidth="1.5" opacity="0.6" />

              {/* Forehead Zone (Botox) */}
              <path
                d="M 65 70 Q 100 55 135 70"
                fill="none"
                stroke={activeZone === 'eyes' ? '#f43f5e' : '#a855f7'}
                strokeWidth={activeZone === 'eyes' ? '4' : '2'}
                className={activeZone === 'eyes' ? 'animate-pulse' : ''}
              />
              <circle cx="85" cy="70" r="5" fill={activeZone === 'eyes' ? '#fb7185' : '#c084fc'} />
              <circle cx="100" cy="65" r="5" fill={activeZone === 'eyes' ? '#f43f5e' : '#c084fc'} />
              <circle cx="115" cy="70" r="5" fill={activeZone === 'eyes' ? '#fb7185' : '#c084fc'} />

              {/* Eyes Zone */}
              <ellipse cx="78" cy="100" rx="10" ry="5" fill="none" stroke="#e879f9" strokeWidth="2" />
              <circle cx="78" cy="100" r="2.5" fill="#f472b6" />
              <ellipse cx="122" cy="100" rx="10" ry="5" fill="none" stroke="#e879f9" strokeWidth="2" />
              <circle cx="122" cy="100" r="2.5" fill="#f472b6" />

              {/* Cheeks & Glow Nodes (HydraFacial / Fillers) */}
              <circle
                cx="66"
                cy="125"
                r="7"
                fill={activeZone === 'face' ? '#ec4899' : '#8b5cf6'}
                className={activeZone === 'face' ? 'animate-ping' : ''}
              />
              <circle
                cx="134"
                cy="125"
                r="7"
                fill={activeZone === 'face' ? '#ec4899' : '#8b5cf6'}
                className={activeZone === 'face' ? 'animate-ping' : ''}
              />
              <circle cx="66" cy="125" r="5" fill="#f472b6" />
              <circle cx="134" cy="125" r="5" fill="#f472b6" />

              {/* Lips Zone (Lip Filler) */}
              <path
                d="M 85 145 Q 100 138 115 145 Q 100 156 85 145 Z"
                fill={activeZone === 'lips' ? '#f43f5e' : '#ec4899'}
                stroke="#fda4af"
                strokeWidth="1.5"
                className={activeZone === 'lips' ? 'animate-bounce' : ''}
              />

              {/* Chin Node */}
              <circle cx="100" cy="170" r="5" fill={activeZone === 'lips' ? '#f43f5e' : '#a855f7'} />

              {/* Neck & Shoulders (Full Body Laser & Rejuvenation) */}
              <path d="M 85 180 L 80 210 Q 30 225 15 270" fill="none" stroke={activeZone === 'laser' ? '#ec4899' : '#6366f1'} strokeWidth="3" />
              <path d="M 115 180 L 120 210 Q 170 225 185 270" fill="none" stroke={activeZone === 'laser' ? '#ec4899' : '#6366f1'} strokeWidth="3" />

              {/* Hairline Halo (PRP & Scalp Rejuvenation) */}
              <path
                d="M 50 85 Q 100 20 150 85"
                fill="none"
                stroke={activeZone === 'hair' ? '#a855f7' : '#ec4899'}
                strokeWidth={activeZone === 'hair' ? '5' : '2'}
                strokeDasharray="4 4"
                className={activeZone === 'hair' ? 'animate-pulse' : ''}
              />
              <circle cx="100" cy="30" r="6" fill={activeZone === 'hair' ? '#c084fc' : '#ec4899'} className={activeZone === 'hair' ? 'animate-ping' : ''} />
            </svg>

            {/* Glowing Laser Target Marker on Active Zone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-24 border-2 border-pink-400 rounded-full animate-ping opacity-60"></div>
              <Sparkles className="w-6 h-6 text-pink-300 absolute animate-pulse" />
            </div>
          </div>

          <div className="absolute bottom-3 inset-x-0 text-center">
            <span className="text-[11px] font-bold text-pink-300/90 bg-pink-950/80 px-3 py-1 rounded-full border border-pink-500/30">
              دیاریکردنی زۆن: {currentZoneData.name}
            </span>
          </div>
        </div>

        {/* Right Column: Treatment Details, Settings & Glow Analytics */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Protocol Card */}
          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-pink-500 via-fuchsia-500 to-purple-600"></div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">
                  پرۆتۆکۆلی پێشنیازکراو ({currentZoneData.code})
                </span>
                <h4 className="text-lg md:text-xl font-black text-white mt-0.5">
                  {currentZoneData.procedure}
                </h4>
              </div>
              <div className="text-left">
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-fuchsia-400 font-mono">
                  {currentZoneData.glowScore}
                </span>
                <p className="text-[10px] font-bold text-slate-400">ڕێژەی گەشاوەیی و سەرکەوتن</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {currentZoneData.status}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">ئامێر و کەرەستە</span>
                <span className="font-bold text-white text-[11px] truncate block">{currentZoneData.recommendedTech}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ماوەی پێویست</span>
                <span className="font-bold text-pink-300 text-[11px] block">{currentZoneData.sessions}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">پشوودان (Recovery)</span>
                <span className="font-bold text-emerald-400 text-[11px] block">{currentZoneData.recoveryTime}</span>
              </div>
            </div>
          </div>

          {/* Interactive Aesthetic Controls (Skin Tone, Laser Power, Wavelength) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Skin Tone Selector (Fitzpatrick Scale) */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2 backdrop-blur-md shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>پلەی ڕەنگی پێست (Fitzpatrick)</span>
                </span>
                <span className="font-mono font-black text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">Type {skinType}</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                {[
                  { st: 1, color: '#fdf2e9' },
                  { st: 2, color: '#ffedd5' },
                  { st: 3, color: '#fed7aa' },
                  { st: 4, color: '#fdba74' },
                  { st: 5, color: '#fb923c' },
                  { st: 6, color: '#c2410c' },
                ].map(({ st, color }) => {
                  const isActive = skinType === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setSkinType(st)}
                      className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 select-none ${
                        isActive
                          ? 'bg-gradient-to-b from-pink-500 to-purple-700 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] scale-105 border border-pink-200'
                          : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/10'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-black/30 shadow-sm" style={{ backgroundColor: color }} />
                      <span className="text-[10px] font-mono leading-none">T{st}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Laser Wavelength Selector */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2 backdrop-blur-md shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>درێژی شەپۆلی لەیزەر</span>
                </span>
                <span className="font-mono font-black text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">{wavelength}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {[
                  { wl: '755nm' as const, label: 'Alex', color: 'from-pink-600 to-rose-600', shadow: 'shadow-pink-500/30' },
                  { wl: '808nm' as const, label: 'Diode', color: 'from-cyan-500 to-blue-600', shadow: 'shadow-cyan-500/30' },
                  { wl: '1064nm' as const, label: 'Nd:YAG', color: 'from-purple-600 to-indigo-600', shadow: 'shadow-purple-500/30' },
                ].map(({ wl, label, color, shadow }) => {
                  const isActive = wavelength === wl;
                  return (
                    <button
                      key={wl}
                      onClick={() => setWavelength(wl)}
                      className={`flex-1 py-2 px-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 select-none ${
                        isActive
                          ? `bg-gradient-to-r ${color} text-white shadow-md ${shadow} scale-105 border border-white/40 ring-1 ring-white/20`
                          : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/10'
                      }`}
                    >
                      <span className="font-mono">{wl}</span>
                      <span className={`text-[9px] px-1 py-0.2 rounded font-sans font-bold ${isActive ? 'bg-black/30 text-white' : 'text-slate-500'}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Laser Energy / Power Slider */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>وزەی ئامێری لەیزەر (Fluence / Energy Power)</span>
              </span>
              <span className="font-mono font-black text-amber-300 text-sm">{laserEnergy} J/cm²</span>
            </div>
            <input
              type="range"
              min="10"
              max="28"
              value={laserEnergy}
              onChange={(e) => setLaserEnergy(Number(e.target.value))}
              className="w-full accent-pink-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>١٠ ژوول (پێستی هەستیار)</span>
              <span>١٨ ژوول (ستاندارد)</span>
              <span>٢٨ ژوول (مووی توند و چڕ)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BeautyCenterGraphic = PhysicalTherapyGraphic;
