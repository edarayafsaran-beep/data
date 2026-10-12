import React from 'react';
import {
  Printer,
  X,
  Copy,
  CheckCircle2,
  FileText,
  TestTube2,
  Stethoscope,
  Receipt,
  QrCode,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  HeartPulse,
} from 'lucide-react';

export type MedicalDocType =
  | 'patient_invoice'
  | 'lab_test'
  | 'prescription'
  | 'consent_form'
  | 'patient_directory'
  | 'vip_card'
  | 'dashboard_summary';

export interface PrintableMedicalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  docType: MedicalDocType;
  branchName?: string;
  data: {
    // Patient / Person info
    patientName?: string;
    patientPhone?: string;
    patientAge?: number | string;
    patientGender?: string;
    patientCode?: string;
    date?: string;

    // Doctor info
    doctorName?: string;
    doctorSpeciality?: string;

    // Invoice fields
    treatmentName?: string;
    originalPrice?: number;
    discountPct?: number;
    discountAmount?: number;
    paidAmount?: number;
    paymentMethod?: string;
    invoiceNumber?: string;

    // Lab Test fields
    testName?: string;
    testCategory?: string;
    resultValue?: string;
    normalRange?: string;
    testStatus?: string;
    technicianNotes?: string;
    labCode?: string;

    // Prescription fields
    diagnosis?: string;
    icdCode?: string;
    medications?: Array<{
      id?: number | string;
      name: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      notes?: string;
    }>;

    // Consent Form fields
    procedureName?: string;
    consentText?: string;
    allergies?: string;
    patientSignatureName?: string;

    // Patient Directory fields
    patientsList?: Array<{
      id: number;
      name: string;
      phone: string;
      age?: number;
      gender?: string;
      totalVisits?: number;
      balance?: number;
    }>;

    // Dashboard fields
    kpiStats?: {
      todayCount?: number;
      completedCount?: number;
      revenue?: number;
      activeDoctors?: number;
    };
  };
}

export const PrintableMedicalDocumentModal: React.FC<PrintableMedicalDocumentModalProps> = ({
  isOpen,
  onClose,
  docType,
  branchName = 'لقی سەرەکی',
  data,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const currentDateStr = new Date().toLocaleDateString('ku-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTimestamp =
    new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB');

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `بەڵگەنامەی پزیشکی - ${docType}
ناوی چارەخواز: ${data.patientName || 'دیاری نەکراو'}
بەروار: ${data.date || currentDateStr}
لق: ${branchName}
کاتی تۆمار: ${currentTimestamp}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-teal-500/40 rounded-[32px] w-full max-w-4xl shadow-2xl my-4 sm:my-8 max-h-[94vh] flex flex-col overflow-hidden text-right">
        
        {/* TOP MODAL ACTION BAR (Hidden in print) */}
        <div className="no-print p-4 sm:p-5 border-b border-white/10 bg-slate-950/95 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>چاپکردن و دەرهێنانی بەڵگەنامە وەک PDF</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-mono">
                  Medical PDF Form
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                بەڵگەنامەی فەرمی پزیشکی بە دیزاینی سپی و ئامادەکراو بۆ داگرتنی PDF یان پرینتەر.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="کۆپیکردن"
            >
              <Copy className="w-3.5 h-3.5 text-teal-400" />
              <span>{copied ? 'کۆپی کرا!' : 'کۆپی'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>چاپکردن / داگرتنی PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* HINT BAR (Hidden in print) */}
        <div className="no-print px-6 py-2 bg-teal-500/10 border-b border-teal-500/20 text-[11px] text-teal-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            <span>
              ئاگاداری: دەتوانیت لە بەشی چاپی وێبگەڕەکەتدا هەڵبژاردەی <strong>«Save as PDF»</strong> دیاری بکەیت بۆ هەڵگرتن وەک فایلی PDF.
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">A4 • Portrait • RTL Medical Header</span>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="printable-section flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 text-slate-100">
          <div className="max-w-3xl mx-auto bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-300 space-y-6 printable-paper">
            
            {/* OFFICIAL CLINIC LETTERHEAD */}
            <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-black text-lg">
                    D
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                      سەنتەری پسپۆڕیی جوانکاری و پزیشکی
                    </h1>
                    <p className="text-[11px] text-slate-600 font-bold">
                      DONIA ADVANCED MEDICAL & AESTHETIC CENTER
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1 flex flex-wrap items-center gap-3">
                  <span>📍 ناونیشان: سلێمانی - شەقامی بازنەیی مەلیک مەحمود</span>
                  <span>📞 0770 123 4567</span>
                  <span>🏥 لقی: <strong className="text-slate-900">{branchName}</strong></span>
                </div>
              </div>

              <div className="text-left font-mono text-[11px] text-slate-600 space-y-0.5 border-r pr-4 border-slate-200">
                <div className="font-black text-sm text-slate-950">
                  {docType === 'patient_invoice' && 'فۆڕمی وەسڵ و فاکتۆر'}
                  {docType === 'lab_test' && 'ڕاپۆرتی تاقیگەی پزیشکی'}
                  {docType === 'prescription' && 'ڕەچەتەی پزیشکی (Rx)'}
                  {docType === 'consent_form' && 'فۆڕمی ڕەزامەندی نەخۆش'}
                  {docType === 'patient_directory' && 'تۆماری چارەخوازان'}
                  {docType === 'vip_card' && 'کارتی ئەندامێتی VIP'}
                  {docType === 'dashboard_summary' && 'پوختەی کارگێڕی ڕۆژانە'}
                </div>
                <div>بەروار: <strong className="text-slate-900 font-sans">{data.date || currentDateStr}</strong></div>
                <div>کاتی دەرچوون: <strong className="text-slate-900">{currentTimestamp}</strong></div>
                <div>کۆدی دۆکیومێنت: <strong className="text-slate-900">DOC-{Math.floor(Math.random() * 89999 + 10000)}</strong></div>
              </div>
            </div>

            {/* PATIENT INFO BANNER (FOR CLINICAL / INVOICE DOCS) */}
            {data.patientName && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block">ناوی چاوپێکەوتوو / نەخۆش:</span>
                  <strong className="text-sm font-black text-slate-950">{data.patientName}</strong>
                </div>
                {data.patientPhone && (
                  <div>
                    <span className="text-[11px] text-slate-500 block">ژمارەی پەیوەندی:</span>
                    <strong className="font-mono text-slate-800">{data.patientPhone}</strong>
                  </div>
                )}
                {data.patientAge && (
                  <div>
                    <span className="text-[11px] text-slate-500 block">تەمەن و رەگەز:</span>
                    <strong className="font-mono text-slate-800">{data.patientAge} ساڵ {data.patientGender ? `(${data.patientGender})` : ''}</strong>
                  </div>
                )}
                {data.doctorName && (
                  <div>
                    <span className="text-[11px] text-slate-500 block">پزیشکی بەرپرس:</span>
                    <strong className="text-slate-900">{data.doctorName}</strong>
                  </div>
                )}
              </div>
            )}

            {/* DOCUMENT-SPECIFIC CONTENT */}

            {/* 1. PATIENT INVOICE */}
            {docType === 'patient_invoice' && (
              <div className="space-y-4 text-xs">
                <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-teal-900">پسوولەی فەرمی وەرگرتنی پارەی خزمەتگوزاری</span>
                  <span className="font-mono font-bold text-teal-800">
                    وەسڵی ژمارە: {data.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`}
                  </span>
                </div>

                <table className="w-full text-right border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">خزمەتگوزاری / چارەسەر</th>
                      <th className="p-2.5">پزیشک / شارەزا</th>
                      <th className="p-2.5">نرخی ئەسڵی (IQD)</th>
                      <th className="p-2.5">داشکاندن</th>
                      <th className="p-2.5">پارەی دراو (صافی)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr>
                      <td className="p-3 font-bold font-sans text-slate-900">{data.treatmentName || 'خزمەتگوزاری پزیشکی و جوانکاری'}</td>
                      <td className="p-3 font-sans text-slate-700">{data.doctorName || 'پزیشکی سەنتەر'}</td>
                      <td className="p-3 text-slate-600">{(data.originalPrice || data.paidAmount || 150000).toLocaleString()} د.ع</td>
                      <td className="p-3 font-sans">
                        {(data.discountPct || 0) > 0 ? (
                          <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            %{data.discountPct} (-{(data.discountAmount || 0).toLocaleString()} د.ع)
                          </span>
                        ) : (
                          <span className="text-slate-400">بێ داشکاندن</span>
                        )}
                      </td>
                      <td className="p-3 font-black text-emerald-800 text-sm">
                        {(data.paidAmount || 150000).toLocaleString()} دیناری عێراقی
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                    <tr>
                      <td colSpan={4} className="p-3 font-sans text-right">کۆی پاکتاوکراوی نەختینە:</td>
                      <td className="p-3 font-black font-mono text-emerald-800 text-base">
                        {(data.paidAmount || 150000).toLocaleString()} د.ع
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <p>• بڕی پارەی وەرگیراو بە تەواوی خراوەتە ناو سندووقی ژمێریاری سەنتەر.</p>
                  <p>• هیچ پارەیەک دوای ئەنجامدانی جەلسە ناگەڕێنرێتەوە بەپێی ڕێنماییە فەرمییەکان.</p>
                </div>
              </div>
            )}

            {/* 2. LAB TEST REPORT */}
            {docType === 'lab_test' && (
              <div className="space-y-4 text-xs">
                <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-cyan-950 text-sm">{data.testName || 'پشکنینی خوێن و تاقیگە'}</h3>
                    <span className="text-[11px] text-cyan-800 font-bold">بەشی: {data.testCategory || 'تاقیگەی گشتی'}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-cyan-100 text-cyan-900 font-mono font-bold rounded-lg text-xs">
                    {data.labCode || `LAB-TEST-${Math.floor(Math.random() * 8999 + 1000)}`}
                  </span>
                </div>

                <table className="w-full text-right border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">ناوی پشکنین</th>
                      <th className="p-2.5">ئەنجامی بەدەستهاتوو</th>
                      <th className="p-2.5">ڕێژەی ئاسایی (Normal Range)</th>
                      <th className="p-2.5">دۆخی تەندروستی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr>
                      <td className="p-3 font-bold font-sans text-slate-900">{data.testName || 'CBC & Iron Profile'}</td>
                      <td className="p-3 font-black text-slate-950 text-sm">{data.resultValue || '13.8 g/dL (Normal)'}</td>
                      <td className="p-3 text-slate-600">{data.normalRange || '12.0 - 15.5 g/dL'}</td>
                      <td className="p-3 font-sans">
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                          {data.testStatus || 'ئاسایی (Normal)'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {data.technicianNotes && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">تێبینی پسپۆڕی تاقیگە:</span>
                    <p className="text-slate-700">{data.technicianNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* 3. DOCTOR PRESCRIPTION (Rx) */}
            {docType === 'prescription' && (
              <div className="space-y-4 text-xs">
                <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-indigo-950 text-sm block">دەستنیشانکردنی پزیشکی (Diagnosis):</span>
                    <p className="text-slate-800 font-bold">{data.diagnosis || 'تێکچوونی پێست و پەڵە (Melasma / Skin Pigmentation)'}</p>
                  </div>
                  {data.icdCode && (
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 font-mono font-bold rounded-lg text-xs">
                      ICD: {data.icdCode}
                    </span>
                  )}
                </div>

                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 p-2.5 border-b border-slate-300 font-black text-slate-900 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    <span>لیستی دەرمان و ڕێنماییەکان (Rx Medications & Dosages):</span>
                  </div>
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2">ژ.</th>
                        <th className="p-2">ناوی دەرمان / کرێم</th>
                        <th className="p-2">بڕ / دۆز (Dosage)</th>
                        <th className="p-2">چۆنیەتی بەکارهێنان</th>
                        <th className="p-2">ماوە (Duration)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {(data.medications && data.medications.length > 0
                        ? data.medications
                        : [
                            { id: 1, name: 'Sunscreen SPF 50+ (La Roche-Posay)', dosage: 'ڕۆژانە ٢ جار', frequency: 'پێش چوونە دەرەوە', duration: 'بەردەوام' },
                            { id: 2, name: 'Hyaluronic Acid Serum 2%', dosage: '٥ دڵۆپ شەوانە', frequency: 'شەوانە پێش خەوتن', duration: '١ مانگ' },
                            { id: 3, name: 'Vitamin C 20% Brightening', dosage: 'بەیانیان', frequency: 'ڕۆژانە ١ جار', duration: '٦ هەفتە' },
                          ]
                      ).map((m: any, idx: number) => (
                        <tr key={m.id || idx}>
                          <td className="p-2.5 text-slate-500">{idx + 1}</td>
                          <td className="p-2.5 font-bold font-sans text-slate-950">{m.name}</td>
                          <td className="p-2.5 font-sans text-slate-700">{m.dosage || '-'}</td>
                          <td className="p-2.5 font-sans text-slate-700">{m.frequency || '-'}</td>
                          <td className="p-2.5 font-sans text-slate-600">{m.duration || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. AESTHETIC CONSENT FORM */}
            {docType === 'consent_form' && (
              <div className="space-y-4 text-xs">
                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl">
                  <h3 className="font-black text-rose-950 text-sm">
                    فۆڕمی فەرمی ڕەزامەندی و ئاگاداری چارەسەری جوانکاری ({data.procedureName || 'لەیزەر / فیلەر و بۆتۆکس'})
                  </h3>
                  <p className="text-[11px] text-rose-800 mt-1">
                    ئەم فۆرمە بەڵگەنامەیەکی یاسایی و پزیشکییە کە چارەخواز بە تەواوی ئاگادار دەکرێتەوە لە سروشتی چارەسەرەکە.
                  </p>
                </div>

                <div className="p-4 border border-slate-300 rounded-xl space-y-2.5 text-slate-700 leading-relaxed bg-slate-50/50">
                  <p>١. من بە تەواوی ئاگادارم لەو چارەسەرەی ئەنجامی دەدەم و وەڵامی هەموو پرسیارەکانم لەلایەن پزیشکی پسپۆڕ دراوەتەوە.</p>
                  <p>٢. ڕێنماییەکانی پێش و دوای ئەنجامدانی جەلسەم پێدراوە و پابەند دەبم بە بەکارهێنانی دژەخۆر و کرێمە پێویستەکان.</p>
                  <p>٣. هیچ جۆرە نەخۆشییەکی درێژخایەن، دووگیانی، یان حەساسیەتێکم نەشاردۆتەوە لە تیمی پزیشکی.</p>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between text-[11px] text-amber-900">
                  <span>ڕەزامەندی لەلایەن چارەخواز دراوە بە شێوازی یاسایی.</span>
                  <span className="font-bold">تۆمارکرا لە سیستەمی دیجیتاڵی</span>
                </div>
              </div>
            )}

            {/* 5. PATIENT DIRECTORY */}
            {docType === 'patient_directory' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900">کۆی چارەخوازانی تۆمارکراو: {(data.patientsList || []).length} نەخۆش</span>
                  <span className="text-slate-600 font-mono">ڕێکەوت: {currentDateStr}</span>
                </div>

                <table className="w-full text-right border border-slate-300 rounded-lg text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-800 border-b border-slate-300">
                    <tr>
                      <th className="p-2">ژ.</th>
                      <th className="p-2">ناوی چارەخواز</th>
                      <th className="p-2">ژمارەی مۆبایل</th>
                      <th className="p-2">تەمەن</th>
                      <th className="p-2">نۆرەکان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {(data.patientsList || []).slice(0, 30).map((p, idx) => (
                      <tr key={p.id || idx}>
                        <td className="p-2 text-slate-500">{idx + 1}</td>
                        <td className="p-2 font-bold font-sans text-slate-900">{p.name}</td>
                        <td className="p-2 text-slate-700">{p.phone}</td>
                        <td className="p-2 text-slate-600">{p.age ? `${p.age} ساڵ` : '-'}</td>
                        <td className="p-2 font-bold text-teal-800">{p.totalVisits || 1} سەردان</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. VIP QR MEMBERSHIP CARD */}
            {docType === 'vip_card' && (
              <div className="space-y-4 text-xs text-center py-4">
                <div className="max-w-md mx-auto border-2 border-slate-900 rounded-3xl p-6 bg-slate-50 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">VIP Membership Card</span>
                      <strong className="text-base font-black text-slate-950">{data.patientName || 'چارەخوازی سەنتەر'}</strong>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-900 text-teal-300 rounded-lg font-mono text-[10px] font-bold">
                      {data.patientCode || 'VIP-MEMBER'}
                    </span>
                  </div>

                  <div className="w-36 h-36 mx-auto bg-white border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center p-2 shadow-inner">
                    <QrCode className="w-28 h-28 text-slate-900" />
                  </div>

                  <div className="text-center font-mono text-xs text-slate-600 space-y-0.5">
                    <div>{data.patientPhone || '0770 000 0000'}</div>
                    <div className="text-[10px] text-slate-400">سەنتەری پزیشکی و جوانکاری • {branchName}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. DASHBOARD SUMMARY */}
            {docType === 'dashboard_summary' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">نەخۆشانی ئەمڕۆ:</span>
                    <span className="text-lg font-black font-mono text-slate-900">
                      {data.kpiStats?.todayCount ?? 0} نەخۆش
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">تەواوبووەکان:</span>
                    <span className="text-lg font-black font-mono text-emerald-700">
                      {data.kpiStats?.completedCount ?? 0} جەلسە
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">داهاتی خەمڵێنراو:</span>
                    <span className="text-lg font-black font-mono text-teal-800">
                      {(data.kpiStats?.revenue ?? 0).toLocaleString()} د.ع
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">پزیشکانی دەوام:</span>
                    <span className="text-lg font-black font-mono text-indigo-700">
                      {data.kpiStats?.activeDoctors ?? 0} دکتۆر
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENT OFFICIAL FOOTER SIGNATURES */}
            <div className="pt-6 border-t-2 border-slate-900 mt-6 grid grid-cols-2 gap-8 text-center text-xs text-slate-700">
              <div className="space-y-8 text-right">
                <span className="font-bold text-slate-900 block">واژۆی پزیشک / ئەنجامدەر:</span>
                <div className="text-[11px] text-slate-400">
                  ..................................................................
                </div>
              </div>

              <div className="space-y-8 text-left">
                <span className="font-bold text-slate-900 block">واژۆ و مۆری فەرمی سەنتەر:</span>
                <div className="text-[11px] text-slate-400 font-mono">
                  [ DONIA CLINIC SEAL & VERIFIED ]
                </div>
              </div>
            </div>

            {/* AUDIT BOTTOM LINE */}
            <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>سیستەمی فەرمی دیجیتاڵی • پارێزراوە</span>
              <span>چاپکراوە لە ڕێکەوتی {currentTimestamp}</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
