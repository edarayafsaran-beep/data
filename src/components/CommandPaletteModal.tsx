import React, { useState, useEffect } from 'react';
import { Patient, Appointment, User } from '../types';
import {
  Search,
  Command,
  User as UserIcon,
  Calendar,
  Sparkles,
  ArrowRight,
  TestTube2,
  DollarSign,
  Package,
  X,
  Stethoscope,
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  appointments: Appointment[];
  doctors: User[];
  onNavigateTab: (tabId: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  patients,
  appointments,
  doctors,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = (query || '').toLowerCase();
  const matchingPatients = patients.filter(
    (p) =>
      p && (
        (p.name || '').toLowerCase().includes(q) ||
        (p.patientCode || '').toLowerCase().includes(q) ||
        (p.phone || '').includes(query)
      )
  );

  const navigationCommands = [
    { label: 'داشبۆڕدی سەرەکی جوانکاری', tabId: 'dashboard', icon: Command, category: 'بەشەکان' },
    { label: 'سەردانکەران و پڕۆفایلی جوانکاری', tabId: 'patients', icon: UserIcon, category: 'بەشەکان' },
    { label: 'مەوعیدەکانی لەیزەر و وەتس ئەپ', tabId: 'appointments_whatsapp', icon: Calendar, category: 'بەشەکان' },
    { label: 'حیسابات و داهاتی جوانکاری (ERP)', tabId: 'financials', icon: DollarSign, category: 'بەشەکان' },
    { label: 'عەمباری فیلەر و لەیزەر', tabId: 'inventory', icon: Package, category: 'بەشەکان' },
    { label: 'پاکێجەکان و CRM', tabId: 'crm_packages', icon: Command, category: 'بەشەکان' },
  ];

  const matchingNavs = navigationCommands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-start justify-center pt-20 p-4">
      <div className="bg-slate-900 border border-white/20 rounded-[32px] w-full max-w-xl overflow-hidden shadow-md animate-in zoom-in-95 duration-200 space-y-2 p-2">
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-950/80 rounded-2xl border border-white/10">
          <Search className="w-5 h-5 text-teal-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="گەڕانی گشتگیر (Raycast Command Palette) - ناوی نەخۆش، کۆدی مەوعید، یان بەشەکە بنووسە..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none font-bold"
          />
          <span className="px-2 py-1 bg-white/10 rounded-lg text-[10px] font-mono text-slate-400">
            ESC
          </span>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[380px] overflow-y-auto space-y-4 p-2 text-xs">
          {/* Patients match */}
          {matchingPatients.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold font-mono text-teal-400 px-3 uppercase tracking-wider">
                نەخۆشەکان ({matchingPatients.length})
              </span>
              {matchingPatients.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onNavigateTab('patients');
                    onClose();
                  }}
                  className="p-3 bg-white/[0.02] hover:bg-white/10 rounded-xl cursor-pointer transition-all flex items-center justify-between text-slate-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center">
                      {p.name[0]}
                    </div>
                    <div>
                      <span className="font-bold text-white block">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p.patientCode} • {p.phone}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-all rotate-180" />
                </div>
              ))}
            </div>
          )}

          {/* Navigation Commands */}
          {matchingNavs.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold font-mono text-slate-400 px-3 uppercase tracking-wider">
                بەشەکانی سیستەم
              </span>
              {matchingNavs.map((cmd) => {
                const IconComponent = cmd.icon;
                return (
                  <div
                    key={cmd.tabId}
                    onClick={() => {
                      onNavigateTab(cmd.tabId);
                      onClose();
                    }}
                    className="p-3 hover:bg-white/10 rounded-xl cursor-pointer transition-all flex items-center justify-between text-slate-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-white">{cmd.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-teal-400">
                      چوونە بەش
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-white/10 rounded-b-2xl flex items-center justify-between text-[11px] text-slate-500 px-4">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            سیستەمی گەڕانی گشتگیر
          </span>
          <span className="font-mono">Cmd + K</span>
        </div>
      </div>
    </div>
  );
};
