import React, { useState, useRef } from 'react';
import { Patient, Prescription, User } from '../types';
import { PrintableMedicalDocumentModal } from './PrintableMedicalDocumentModal';
import {
  Stethoscope,
  FileSpreadsheet,
  Mic,
  PenTool,
  QrCode,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  Sparkles,
  Search,
  Pill,
  X,
  Volume2,
} from 'lucide-react';

interface EmrConsultationViewProps {
  patients: Patient[];
  doctors: User[];
  prescriptions: Prescription[];
  onAddPrescription: (prescription: Omit<Prescription, 'id' | 'prescriptionCode' | 'qrCode' | 'branchId'>) => void;
}

const COMMON_ICD10_CODES = [
  { code: 'L70.0', title: 'زیپکە و ئاکنەی دەموچاو (Acne Vulgaris)' },
  { code: 'L81.0', title: 'پەڵە و لەکەی تیشکی خۆر (Hyperpigmentation & Melasma)' },
  { code: 'L68.0', title: 'مووی زێدە بۆ لەیزەر (Hirsutism / Unwanted Hair)' },
  { code: 'L65.9', title: 'هەڵوەرینی قژ و لاوازی ڕەگی موو (Alopecia / Hair Thinning)' },
  { code: 'L57.0', title: 'چرچولۆچی و دژە پیری پێست (Photo-aging & Expression Lines)' },
  { code: 'R23.4', title: 'وشکی و تێکچوونی پێکهاتەی پێست (Dry & Uneven Skin Texture)' },
];

export const EmrConsultationView: React.FC<EmrConsultationViewProps> = ({
  patients,
  doctors,
  prescriptions,
  onAddPrescription,
}) => {
  const [printablePrescription, setPrintablePrescription] = useState<Prescription | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(patients[0]?.id || 1);
  const [doctorName, setDoctorName] = useState<string>(doctors[0]?.name || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [selectedIcdCode, setSelectedIcdCode] = useState('');
  const [showIcdSearch, setShowIcdSearch] = useState(false);

  // Voice note recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordedAudioText, setRecordedAudioText] = useState('');

  // Digital Signature Canvas
  const [hasSignature, setHasSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Medicine list state
  const [medicines, setMedicines] = useState<
    { name: string; dosage: string; frequency: string; durationDays: number; instructions: string; dispensed: boolean }[]
  >([
    {
      name: 'Sunscreen SPF 50+ Broad Spectrum Cream',
      dosage: 'بەشی پێویست',
      frequency: 'هەموو ۳ کاتژمێر جارێک لە کاتی بەرکەوتن بە خۆر',
      durationDays: 30,
      instructions: 'پاش لەیزەر و پاککردنەوەی پێست',
      dispensed: false,
    },
    {
      name: 'Hyaluronic Acid Serum 2% + B5',
      dosage: '٤ بۆ ٥ دڵۆپ',
      frequency: 'شەوانە پێش خەوتن',
      durationDays: 20,
      instructions: 'بۆ شێداری و ڕاگرتنی فیلەر',
      dispensed: false,
    },
  ]);

  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('100mg');
  const [medFreq, setMedFreq] = useState('١ حەب ڕۆژانە');
  const [medDays, setMedDays] = useState(10);
  const [medNotes, setMedNotes] = useState('پاش نان');

  const selectedPatient = patients.find((p) => p.id === Number(selectedPatientId));

  const handleAddMedicineItem = () => {
    if (!medName) return;
    setMedicines([
      ...medicines,
      {
        name: medName,
        dosage: medDosage,
        frequency: medFreq,
        durationDays: Number(medDays),
        instructions: medNotes,
        dispensed: false,
      },
    ]);
    setMedName('');
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleToggleVoiceRecording = () => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      setRecordedAudioText(
        'تێبینی دەنگی پزیشک: سەردانکەر کێشەی پەڵە و ئاسەواری زیپکەی هەیە، بڕیار دراوە ۳ جەلسەی لەیزەری فرەکشناڵ (CO2) و ۲ جەلسەی پرۆفایلۆ (Profhilo Skin Booster)ی بۆ ئەنجام بدرێت بە بەکارهێنانی کرێمی دژەخۆری SPF 50+.'
      );
    } else {
      setIsRecordingVoice(true);
    }
  };

  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    onAddPrescription({
      patientName: selectedPatient.name,
      doctorName,
      diagnosis: diagnosis || 'پشکنینی گشتی پێست و پرۆتۆکۆلی جوانکاری',
      icdCode: selectedIcdCode || 'L81.0',
      medicines,
      date: new Date().toISOString().split('T')[0],
      status: 'نوێ',
    });

    setDiagnosis('');
    setSelectedIcdCode('');
    alert('نسخەی دیجیتاڵی بە سەرکەوتوویی تۆمارکرا و ڕەوانەی دەرمانخانەی کلینیک کرا!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold rounded-full flex items-center gap-1">
              <Stethoscope className="w-4 h-4 text-teal-400" /> تۆماری پزیشکی دیجیتاڵی (EMR & Prescriptions)
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            سیستەمی ڕاوێژکاری، دەستنیشانکردنی ICD-10 و نوسینی نسخە
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            تۆماری پزیشکی نەخۆش، ئیمزای دیجیتاڵی، تۆماری دەنگی پزیشک، و کۆدی بارکۆدی نسخە بۆ دەرمانخانە.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form / Patient Selector */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Selection Card */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[32px] border border-white/10 shadow-md space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-400" /> هەڵبژاردنی نەخۆش و داتا پزیشکییەکان
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">دیاریکردنی نەخۆش *</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-teal-400 font-bold"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patientCode}) - {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">پزیشکی ڕاوێژکار</label>
                <select
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-teal-400 font-bold"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.specialty || 'پزیشک'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Patient Quick Summary Info */}
            {selectedPatient && (
              <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">سەردانی سەرەکی:</span>
                  <span className="font-bold text-white">{selectedPatient.chiefComplaint}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">مێژووی پزیشکی:</span>
                  <span className="font-bold text-teal-300">{selectedPatient.medicalHistory}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">تەمەن / ڕەگەز:</span>
                  <span className="font-mono text-white">
                    {selectedPatient.age} ساڵ ({selectedPatient.gender})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Diagnosis & ICD-10 */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[32px] border border-white/10 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" /> دەستنیشانکردنی پزیشکی (Diagnosis & ICD-10)
              </h3>
              <button
                onClick={() => setShowIcdSearch(!showIcdSearch)}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold text-teal-300"
              >
                {showIcdSearch ? 'داخستنی گەڕانی ICD' : 'گەڕان لە کۆدەکانی ICD-10'}
              </button>
            </div>

            {/* ICD Quick Picker */}
            {showIcdSearch && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-teal-500/30 space-y-2 animate-in fade-in">
                <span className="text-[11px] font-bold text-slate-400 block">
                  کۆدە باوەکانی نەخۆشییەکانی پێست و جوانکاری (Aesthetic ICD-10):
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {COMMON_ICD10_CODES.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        setSelectedIcdCode(item.code);
                        setDiagnosis(item.title);
                        setShowIcdSearch(false);
                      }}
                      className="w-full text-right p-2 rounded-xl hover:bg-white/10 text-xs flex items-center justify-between text-slate-200 transition-all"
                    >
                      <span className="font-bold">{item.title}</span>
                      <span className="font-mono text-teal-400 text-[10px] bg-teal-500/20 px-2 py-0.5 rounded-md">
                        {item.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="md:col-span-2">
                <label className="block text-slate-300 mb-1 font-bold">دەستنیشانکردنی نەخۆشی (Diagnosis) *</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="پەڵەی خۆر و ئاکنەی L81.0..."
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-bold">کۆدی ICD-10</label>
                <input
                  type="text"
                  value={selectedIcdCode}
                  onChange={(e) => setSelectedIcdCode(e.target.value)}
                  placeholder="M51.16"
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-teal-300 font-mono outline-none focus:border-teal-400 font-bold"
                />
              </div>
            </div>

            {/* Voice Note & Digital Signature Bar */}
            <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleToggleVoiceRecording}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                  isRecordingVoice
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isRecordingVoice ? 'تۆمارکردنی دەنگ وەستێنە (Recording...)' : 'تۆمارکردنی تێبینی دەنگی'}</span>
              </button>

              {recordedAudioText && (
                <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-white/10 flex items-start gap-2 max-w-md">
                  <Volume2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{recordedAudioText}</span>
                </div>
              )}
            </div>
          </div>

          {/* Add Medicine Section */}
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[32px] border border-white/10 shadow-md space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-400" /> ئامادەکردنی دەرمان و ژەمەکان (Prescription Medicines)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div className="col-span-2 md:col-span-2">
                <input
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="ناوی دەرمان (Pregabalin, Celecoxib...)"
                  className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={medDosage}
                  onChange={(e) => setMedDosage(e.target.value)}
                  placeholder="بڕ (Dosage)"
                  className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={medFreq}
                  onChange={(e) => setMedFreq(e.target.value)}
                  placeholder="دووبارەبوونەوە (Frequency)"
                  className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-teal-400"
                />
              </div>
              <div className="col-span-2 md:col-span-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleAddMedicineItem}
                  className="w-full py-2.5 bg-teal-500 text-slate-950 font-black rounded-xl hover:brightness-110 flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> زیادکردن
                </button>
              </div>
            </div>

            {/* Medicine Table */}
            <div className="divide-y divide-white/10 bg-slate-950 rounded-2xl border border-white/10 overflow-hidden text-xs">
              {medicines.map((m, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between text-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white block">{m.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {m.dosage} - {m.frequency} ({m.instructions})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedicine(idx)}
                    className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleSavePrescription}
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-md hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-slate-950" />
              <span>پەسەندکردن و ناردنی نسخە بۆ دەرمانخانە</span>
            </button>
          </div>
        </div>

        {/* Right Column: Active Prescriptions & QR Codes */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[32px] border border-white/10 shadow-md space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-teal-400" /> نسخە تۆمارکراوەکان و کۆدی QR
            </h3>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {prescriptions.map((p) => (
                <div
                  key={p.id}
                  className="p-4 bg-slate-950 border border-white/10 rounded-2xl space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-mono font-bold text-teal-400">{p.prescriptionCode}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'نوێ'
                          ? 'bg-teal-500/20 text-teal-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-white block">{p.patientName}</span>
                    <span className="text-[11px] text-slate-400">پزیشک: {p.doctorName}</span>
                  </div>

                  <div className="text-[11px] bg-white/[0.03] p-2 rounded-xl text-slate-300 space-y-1">
                    <span className="font-bold text-teal-300 block">دەستنیشانکردن:</span>
                    <p>{p.diagnosis}</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-white/5 pt-2">
                    <span>کۆدی ICD: {p.icdCode}</span>
                    <span>{p.date}</span>
                  </div>

                  <button
                    onClick={() => setPrintablePrescription(p)}
                    className="w-full py-2 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 border border-teal-500/30 rounded-xl text-xs font-bold text-teal-300 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-400" />
                    <span>چاپی نسخە (PDF Print)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {printablePrescription && (
        <PrintableMedicalDocumentModal
          isOpen={Boolean(printablePrescription)}
          onClose={() => setPrintablePrescription(null)}
          docType="prescription"
          data={{
            patientName: printablePrescription.patientName,
            doctorName: printablePrescription.doctorName,
            diagnosis: printablePrescription.diagnosis,
            icdCode: printablePrescription.icdCode,
            date: printablePrescription.date,
            medications: printablePrescription.medicines.map((m, idx) => ({
              id: idx,
              name: m.name,
              dosage: m.dosage,
              frequency: m.frequency,
              duration: `${m.durationDays} ڕۆژ`,
              notes: m.instructions,
            })),
          }}
        />
      )}
    </div>
  );
};
