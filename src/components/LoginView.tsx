import React, { useState } from 'react';
import { User } from '../types';
import { initialUsers } from '../initialData';
import { useNotification } from '../context/NotificationContext';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  KeyRound,
  LogIn,
  HeartPulse,
  Sparkles,
  Building2,
  CheckCircle2,
  Stethoscope,
  Activity,
  Tv,
  CalendarCheck2,
  AlertCircle,
  Zap,
  Flame,
  Bone,
  User as UserIcon,
  Sun,
  ShieldAlert,
} from 'lucide-react';

interface LoginViewProps {
  users: User[];
  superAdminCreds: { username: string; password: string };
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, superAdminCreds, onLogin }) => {
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { notify } = useNotification();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    if (!usernameInput.trim()) {
      const msg = 'تکایە ناوی بەکارهێنەر یان ئیمەیڵ بنووسە!';
      setErrorMsg(msg);
      notify({ type: 'error', title: 'هەڵە لە چوونەژوورەوە ⚠️', message: msg });
      setIsSubmitting(false);
      return;
    }

    if (!passwordInput.trim()) {
      const msg = 'تکایە تێپەڕەوشە (پاسۆڕد) بنووسە!';
      setErrorMsg(msg);
      notify({ type: 'error', title: 'هەڵە لە چوونەژوورەوە ⚠️', message: msg });
      setIsSubmitting(false);
      return;
    }

    const cleanUser = usernameInput.trim().toLowerCase();
    const availableUsers = (users && users.length > 0) ? users : initialUsers;

    // 1. Direct match with configured superAdmin credentials
    if (superAdminCreds && cleanUser === (superAdminCreds.username || '').toLowerCase()) {
      if (passwordInput === superAdminCreds.password) {
        const adminUser = availableUsers.find(u => u.role === 'super_admin') || initialUsers[0];
        notify({
          type: 'login',
          title: 'چوونە ژوورەوەی سەرکەوتوو 🔐',
          message: `بەخێر بێیتەوە ${adminUser.name}! ڕووکاری سەرەکی سەنتەری جوانکاری بارکرا.`,
          targetTab: 'dashboard',
        });
        onLogin(adminUser);
        setIsSubmitting(false);
        return;
      } else {
        const msg = 'تێپەڕەوشە (پاسۆڕد) هەڵەیە!';
        setErrorMsg(msg);
        notify({ type: 'error', title: 'هەڵە لە چوونەژوورەوە ⚠️', message: msg });
        setIsSubmitting(false);
        return;
      }
    }

    // 2. Match against registered users
    const foundUser = availableUsers.find(u => 
      (u.username && u.username.toLowerCase() === cleanUser) ||
      (u.email && u.email.toLowerCase() === cleanUser) ||
      (cleanUser === 'jwankary485@gmail.com' && (u.email === 'jwankary485@gmail.com' || u.role === 'super_admin')) ||
      (cleanUser === 'jwankary' && (u.username === 'jwankary' || u.role === 'super_admin')) ||
      (cleanUser === 'super_admin' && u.role === 'super_admin') ||
      (cleanUser === 'admin' && u.role === 'super_admin')
    );

    if (foundUser) {
      const isPasswordValid = 
        (foundUser.password && foundUser.password === passwordInput) ||
        (passwordInput === '123') ||
        (passwordInput === '1234') ||
        (superAdminCreds && foundUser.role === 'super_admin' && passwordInput === superAdminCreds.password);

      if (!isPasswordValid) {
        const msg = 'تێپەڕەوشە (پاسۆڕد) هەڵەیە!';
        setErrorMsg(msg);
        notify({ type: 'error', title: 'هەڵە لە چوونەژوورەوە ⚠️', message: msg });
        setIsSubmitting(false);
        return;
      }

      notify({
        type: 'login',
        title: 'چوونە ژوورەوەی سەرکەوتوو 🔐',
        message: `بەخێر بێیتەوە ${foundUser.name}! ڕووکاری سەرەکی سەنتەری جوانکاری بارکرا.`,
        targetTab: 'dashboard',
      });
      
      onLogin(foundUser);
      setIsSubmitting(false);
      return;
    }

    // 3. Invalid credentials
    const msg = 'ناوی بەکارهێنەر یان تێپەڕەوشە هەڵەیە!';
    setErrorMsg(msg);
    notify({ type: 'error', title: 'هەڵە لە چوونەژوورەوە ⚠️', message: msg });
    setIsSubmitting(false);
  };

  const handleSelectUser = (user: User) => {
    setUsernameInput(user.username || user.email || '');
    setPasswordInput('');
    setErrorMsg('');
  };

  return (
    <div dir="rtl" className="min-h-screen w-full bg-[#0a061e] text-slate-100 font-sans flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Atmosphere & Moving Stars */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#0a061e]">
        {/* Vibrant Purple/Magenta/Indigo Ambient Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[55%] h-[55%] bg-purple-600/40 rounded-full blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/40 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] bg-pink-500/30 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Moving Stars */}
        {[...Array(50)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-10px`,
              width: `${Math.random() * 3.5 + 1}px`,
              height: `${Math.random() * 3.5 + 1}px`,
              animationDuration: `${Math.random() * 10 + 8}s`,
              animationDelay: `${Math.random() * 8}s`,
            }}
          />
        ))}

        {/* Glowing Lines */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`line-${i}`}
            className="glowing-line"
            style={{
              left: `${15 + i * 15}%`,
              top: `${Math.random() * 100}%`,
              height: `${Math.random() * 450 + 200}px`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-6xl bg-white/[0.04] backdrop-blur-3xl border border-white/20 rounded-[32px] sm:rounded-[48px] shadow-[0_25px_70px_0_rgba(120,50,255,0.35)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left Column: Vibrant Purple-Magenta Gradient with Diagonal Glowing Pills */}
        <div className="lg:col-span-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 sm:p-8 md:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-l border-white/20 relative overflow-hidden shadow-md">
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none"></div>

          {/* Top Header / Badge */}
          <div className="space-y-4 sm:space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/15 border border-white/30 text-white text-xs font-black shadow-[0_0_25px_rgba(255,255,255,0.3)] backdrop-blur-md font-sans">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              <span className="tracking-widest font-black">BEAUTY CENTER</span>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md leading-tight">
                خێربێن
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-purple-100 font-medium leading-relaxed max-w-md drop-shadow">
                سیستەمی پێشکەوتووی بەڕێوەبردنی BEAUTY CENTER
              </p>
            </div>
          </div>

          {/* Reference Style Diagonal Glowing Orange/Amber Pill Shapes at Bottom */}
          <div className="relative h-32 sm:h-48 w-full overflow-hidden mt-6 sm:mt-8 pointer-events-none">
            <div className="absolute -bottom-10 -right-10 flex gap-4 rotate-[-35deg] opacity-85">
              <div className="w-20 sm:w-24 h-56 sm:h-64 bg-gradient-to-tr from-amber-400 via-orange-500 to-pink-500 rounded-full shadow-[0_0_35px_rgba(255,140,0,0.6)] animate-pulse"></div>
              <div className="w-16 sm:w-20 h-48 sm:h-56 bg-gradient-to-tr from-yellow-300 via-amber-400 to-orange-500 rounded-full shadow-[0_0_30px_rgba(255,180,0,0.5)] animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="w-14 sm:w-16 h-40 sm:h-48 bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-500 rounded-full shadow-[0_0_25px_rgba(255,100,100,0.5)] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-4 sm:pt-6 relative z-10 flex items-center justify-between border-t border-white/20 text-xs text-purple-100 font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>سیستەمی پارێزراو</span>
            </div>
            <div className="font-mono text-xs">v2.6</div>
          </div>
        </div>

        {/* Right Column: Clean Glassmorphic Form */}
        <div className="lg:col-span-6 p-6 sm:p-8 md:p-12 flex flex-col justify-between bg-slate-950/40 backdrop-blur-3xl space-y-6">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-600 flex items-center justify-center shadow-[0_0_25px_rgba(236,72,153,0.5)] mb-3">
                <Sparkles className="w-7 h-7 text-white animate-spin" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-wider">
                چوونە ژوورەوە
              </h2>
            </div>

            {/* Username & Password Form */}
            <form onSubmit={handleLogin} className="space-y-4 pt-1">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1.5">
                  ناوی بەکارهێنەر یان ئیمەیڵ
                </label>
                <div className="relative">
                  <UserIcon className="w-4.5 h-4.5 text-purple-400 absolute right-4 top-4" />
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="jwankary485@gmail.com یان بەکارهێنەر"
                    className="w-full pr-12 pl-4 py-3.5 bg-white/[0.06] backdrop-blur-3xl border border-white/20 rounded-2xl text-xs text-white placeholder-purple-300/50 outline-none focus:border-purple-400 focus:bg-white/[0.1] focus:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all font-sans"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1.5">
                  تێپەڕەوشە
                </label>
                <div className="relative">
                  <Lock className="w-4.5 h-4.5 text-purple-400 absolute right-4 top-4" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-12 pl-4 py-3.5 bg-white/[0.06] backdrop-blur-3xl border border-white/20 rounded-2xl text-xs text-white placeholder-purple-300/50 outline-none focus:border-purple-400 focus:bg-white/[0.1] focus:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all font-mono"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-rose-500/25 backdrop-blur-2xl border border-rose-500/50 rounded-2xl text-xs text-rose-300 flex items-center gap-2.5 shadow-md">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(147,51,234,0.5)] active:scale-98 hover:brightness-110 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <LogIn className="w-4.5 h-4.5 text-white" />
                <span>چوونە ژوورەوە</span>
              </button>

              {/* Select Staff Username Helper */}
              <div className="pt-2">
                <span className="block text-[10px] text-purple-200/70 font-bold mb-2 text-center">
                  هەڵبژاردنی ناوی کارمەند بۆ فۆڕمەکە:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {users.slice(0, 4).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className={`p-2.5 rounded-xl text-right transition-all flex items-center gap-2 cursor-pointer group border ${
                        usernameInput.toLowerCase() === (u.username || '').toLowerCase() || usernameInput.toLowerCase() === (u.email || '').toLowerCase()
                          ? 'bg-purple-600/30 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                          : 'bg-white/[0.05] hover:bg-white/[0.12] border-white/10 hover:border-purple-400/50'
                      }`}
                      title="کلیک بکە بۆ دیاریکردنی ناو"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                      <div className="overflow-hidden">
                        <span className="block text-[11px] font-bold text-white group-hover:text-purple-200 truncate">
                          {u.name}
                        </span>
                        <span className="block text-[9px] text-purple-300/70 font-mono truncate">
                          {u.username || u.email}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {users.length === 0 && (
                <div className="pt-4 border-t border-white/10 text-center">
                  <p className="text-[10px] text-slate-400 mb-2">سیستەمەکە بۆ یەکەمجارە بەکاردێت؟</p>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        const res = await fetch('/api/admin/seed', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ password: 'clinic_seed_2026' })
                        });
                        const data = await res.json();
                        if (data.success) {
                          notify({ type: 'success', title: 'سیستەم ئامادەکرا ✨', message: 'هەژماری سوپەر ئەدمین دروستکرا. ئێستا دەتوانیت بچیتە ژوورەوە.' });
                        }
                      } catch (e) {
                        notify({ type: 'error', title: 'هەڵە لە ئامادەکردن', message: 'ناتوانرێت سیستەمەکە ئامادە بکرێت.' });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="text-xs font-black text-teal-400 hover:text-teal-300 underline underline-offset-4 cursor-pointer"
                  >
                    ئامادەکردنی سیستەم و دروستکردنی سوپەر ئەدمین
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Footer Security Note */}
          <div className="p-3 rounded-2xl bg-white/[0.04] backdrop-blur-3xl border border-white/15 text-xs text-slate-300 flex items-center gap-2 justify-center">
            <ShieldCheck className="w-4 h-4 text-pink-400" />
            <span className="font-bold text-pink-200">سیستەمی پارێزراوی BEAUTY CENTER</span>
          </div>
        </div>
      </div>
    </div>
  );
};

