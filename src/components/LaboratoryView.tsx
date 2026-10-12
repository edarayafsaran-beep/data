import React, { useState } from 'react';
import { LabTestOrder } from '../types';
import { PrintableMedicalDocumentModal } from './PrintableMedicalDocumentModal';
import {
  TestTube2,
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  QrCode,
  Printer,
  Search,
  Filter,
  AlertCircle,
  X,
  Building,
} from 'lucide-react';

interface LaboratoryViewProps {
  labTests: LabTestOrder[];
  onAddLabTest: (test: Omit<LabTestOrder, 'id' | 'testCode' | 'branchId'>) => void;
  onUpdateTestResult: (id: number, resultValue: string, status: LabTestOrder['status'], notes?: string) => void;
}

export const LaboratoryView: React.FC<LaboratoryViewProps> = ({
  labTests,
  onAddLabTest,
  onUpdateTestResult,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('هەمووی');
  const [selectedTestModal, setSelectedTestModal] = useState<LabTestOrder | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Lab Test state
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [testCategory, setTestCategory] = useState<LabTestOrder['testCategory']>('شیکاری پێست و قژ');
  const [testName, setTestName] = useState('');
  const [sampleType, setSampleType] = useState('سیرۆمی خوێن');
  const [normalRange, setNormalRange] = useState('');
  const [price, setPrice] = useState<number>(25000);

  // Result entry state
  const [editResultValue, setEditResultValue] = useState('');
  const [editStatus, setEditStatus] = useState<LabTestOrder['status']>('تەواوبوو');
  const [editNotes, setEditNotes] = useState('');

  const filteredTests = labTests.filter((t) => {
    if (!t) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (t.patientName || '').toLowerCase().includes(q) ||
      (t.testCode || '').toLowerCase().includes(q) ||
      (t.testName || '').toLowerCase().includes(q);
    const matchesCategory =
      selectedCategoryFilter === 'هەمووی' || t.testCategory === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !testName) return;

    onAddLabTest({
      patientName,
      patientPhone,
      doctorName,
      testCategory,
      testName,
      sampleType,
      normalRange: normalRange || 'Normal range defined by laboratory',
      resultValue: 'لە پرۆسەی پشکنیندایە...',
      orderedDate: new Date().toISOString().split('T')[0],
      status: 'لە چاوەڕوانیدایە',
      price: Number(price),
    });

    setPatientName('');
    setPatientPhone('');
    setTestName('');
    setShowAddModal(false);
  };

  const handleSaveResult = () => {
    if (!selectedTestModal) return;
    onUpdateTestResult(selectedTestModal.id, editResultValue, editStatus, editNotes);
    setSelectedTestModal(null);
  };

  const [printableLabTest, setPrintableLabTest] = useState<LabTestOrder | null>(null);

  const handlePrintPdf = (test: LabTestOrder) => {
    setPrintableLabTest(test);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 rounded-[36px] border border-white/10 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold rounded-full flex items-center gap-1">
              <TestTube2 className="w-4 h-4 text-cyan-400" /> سیستەمی پشکنینی تاقیگە و تیشک (LIS/RIS)
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            تاقیگە، پشکنینی خوێن و تیشکی دیجیتاڵی
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            تۆمارکردنی پشکنینەکان، ئەنجامی ئۆتۆماتیک، ڕاپۆرتی PDF و بارکۆدی تاقیگە.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 rounded-2xl text-xs font-black text-slate-950 flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>داواکاری پشکنینی نوێ</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 backdrop-blur-md p-4 md:p-6 rounded-[28px] border border-white/10 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            placeholder="گەڕان بەپێی کۆدی پشکنین، ناوی نەخۆش، یان جۆری پشکنین..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          {['هەمووی', 'شیکاری پێست و قژ', 'پشکنینی هۆرمۆن و خوێن', 'پشکنینی هەستیاری (Allergy)', 'پشکنینی فۆتۆگرافی دیجیتاڵی'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedCategoryFilter === cat
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Tests Table / List */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-[36px] border border-white/10 shadow-md overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" /> لیستی داواکارییەکان و ئەنجامەکان
          </h3>
          <span className="text-xs text-cyan-300 font-mono font-bold">
            تێکڕا: {filteredTests.length} پشکنین
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-white/10">
              <tr>
                <th className="p-4">کۆدی پشکنین</th>
                <th className="p-4">نەخۆش</th>
                <th className="p-4">جۆری پشکنین</th>
                <th className="p-4">بەروار</th>
                <th className="p-4">باری پشکنین</th>
                <th className="p-4">نرخ (د.ع)</th>
                <th className="p-4 text-center">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredTests.map((test) => (
                <tr key={test.id} className="hover:bg-white/[0.02] transition-all">
                  <td className="p-4 font-mono font-bold text-cyan-300">
                    <span className="flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-slate-500" />
                      {test.testCode}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white">{test.patientName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{test.patientPhone}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-200">{test.testName}</div>
                    <span className="text-[10px] text-cyan-400/80">{test.testCategory}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-400">{test.orderedDate}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                        test.status === 'تەواوبوو'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : test.status === 'کەمپڵ وەرگیراوە'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse'
                      }`}
                    >
                      {test.status === 'تەواوبوو' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-400" />
                      )}
                      {test.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-white">
                    {test.price.toLocaleString()} د.ع
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedTestModal(test);
                          setEditResultValue(test.resultValue);
                          setEditStatus(test.status);
                          setEditNotes(test.technicianNotes || '');
                        }}
                        className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 font-bold active:scale-95 transition-all"
                      >
                        بینین / ئەنجام
                      </button>
                      <button
                        onClick={() => handlePrintPdf(test)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 active:scale-95 transition-all"
                        title="چاپی ڕاپۆرت (Print Report)"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW & EDIT TEST RESULT MODAL */}
      {selectedTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-[36px] w-full max-w-2xl overflow-hidden shadow-md p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  کۆد: {selectedTestModal.testCode}
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  ڕاپۆرتی تاقیگەی ({selectedTestModal.patientName})
                </h3>
              </div>
              <button
                onClick={() => setSelectedTestModal(null)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-950/80 p-4 rounded-2xl border border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block">پزیشکی داواکار:</span>
                <span className="font-bold text-white">{selectedTestModal.doctorName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">جۆری پشکنین:</span>
                <span className="font-bold text-cyan-300">{selectedTestModal.testName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">جۆری نموونە (Sample):</span>
                <span className="font-mono text-slate-200">{selectedTestModal.sampleType}</span>
              </div>
              <div>
                <span className="text-slate-400 block">ڕێژەی ئاسایی (Normal Range):</span>
                <span className="font-mono text-emerald-400">{selectedTestModal.normalRange}</span>
              </div>
            </div>

            {/* Edit Result Section */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">ئەنجامی پشکنین (Result Value) *</label>
                <textarea
                  rows={3}
                  value={editResultValue}
                  onChange={(e) => setEditResultValue(e.target.value)}
                  className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white outline-none focus:border-cyan-400 font-mono"
                  placeholder="ئەنجامی پشکنینەکە لێرە بنووسە..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">باری پشکنین</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as LabTestOrder['status'])}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-400"
                  >
                    <option value="لە چاوەڕوانیدایە">لە چاوەڕوانیدایە</option>
                    <option value="کەمپڵ وەرگیراوە">کەمپڵ وەرگیراوە</option>
                    <option value="تەواوبوو">تەواوبوو</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">تێبینی تەکنیکاری تاقیگە</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="تێبینی زیادە..."
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => handlePrintPdf(selectedTestModal)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>چاپی ڕاپۆرتی PDF</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTestModal(null)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold text-xs"
                >
                  داخستن
                </button>
                <button
                  type="button"
                  onClick={handleSaveResult}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-md"
                >
                  پاشەکەوتکردنی ئەنجام
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW LAB TEST */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-[36px] w-full max-w-md overflow-hidden shadow-md p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-black text-white">داواکاری پشکنینی تاقیگەی نوێ</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">ناوی نەخۆش *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="ناوی نەخۆش بنووسە..."
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">ژمارەی پەیوەندی نەخۆش</label>
                <input
                  type="text"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="0750 123 4567"
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">جۆری پشکنین</label>
                  <select
                    value={testCategory}
                    onChange={(e) => setTestCategory(e.target.value as LabTestOrder['testCategory'])}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-400"
                  >
                    <option value="شیکاری پێست و قژ">شیکاری پێست و قژ</option>
                    <option value="پشکنینی هۆرمۆن و خوێن">پشکنینی هۆرمۆن و خوێن</option>
                    <option value="پشکنینی هەستیاری (Allergy)">پشکنینی هەستیاری (Allergy)</option>
                    <option value="پشکنینی فۆتۆگرافی دیجیتاڵی">پشکنینی فۆتۆگرافی دیجیتاڵی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">ناوی تایبەتی پشکنین *</label>
                  <input
                    type="text"
                    required
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="CBC, Vitamin D3, X-Ray Spine..."
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">جۆری نموونە (Sample)</label>
                  <input
                    type="text"
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">نرخ (د.ع)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black rounded-xl shadow-md"
                >
                  تۆمارکردنی داواکاری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    {printableLabTest && (
      <PrintableMedicalDocumentModal
        isOpen={Boolean(printableLabTest)}
        onClose={() => setPrintableLabTest(null)}
        docType="lab_test"
        data={{
          patientName: printableLabTest.patientName,
          testName: printableLabTest.testName,
          testCategory: printableLabTest.testCategory,
          resultValue: printableLabTest.resultValue,
          normalRange: printableLabTest.normalRange,
          testStatus: printableLabTest.status,
          technicianNotes: printableLabTest.technicianNotes,
          labCode: printableLabTest.testCode,
          date: printableLabTest.orderedDate,
        }}
      />
    )}
  </div>
);
};
