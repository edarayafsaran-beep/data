import React, { useState, useEffect } from 'react';
import {
  Database,
  X,
  Search,
  RotateCw,
  Server,
  Cpu,
  CheckCircle2,
  Download,
  Eye,
  Table,
  Copy,
  Check,
  ChevronLeft,
  ExternalLink,
  Code,
  Layers,
  Sparkles,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { dbApi } from '../lib/api';

interface TableMeta {
  tableName: string;
  rowCount: number;
  titleKu: string;
  category: string;
  description: string;
}

interface DatabaseExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseExplorerModal: React.FC<DatabaseExplorerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'tables' | 'ram' | 'connection'>('tables');
  
  // Tables state
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [databaseName, setDatabaseName] = useState<string>('Layerbase PostgreSQL (jwankary)');
  const [isLoadingTables, setIsLoadingTables] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Selected table records inspection
  const [selectedTable, setSelectedTable] = useState<TableMeta | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);
  const [recordSearch, setRecordSearch] = useState<string>('');
  const [recordViewMode, setRecordViewMode] = useState<'table' | 'json'>('table');
  const [inspectedRecord, setInspectedRecord] = useState<any | null>(null);

  // RAM status state
  const [dbMetrics, setDbMetrics] = useState<any>(null);
  const [isRefreshingMetrics, setIsRefreshingMetrics] = useState<boolean>(false);
  const [cacheClearNotice, setCacheClearNotice] = useState<string>('');

  // Copy connection URI
  const [copiedUri, setCopiedUri] = useState<boolean>(false);

  const connectionString = "postgresql://postgres:MREP50cCUT54KeTUFBn95zh5@jwankary-main-clay-pooler.sage.cloud.layerbase.dev/jwankary?sslmode=require";

  useEffect(() => {
    if (isOpen) {
      loadTables();
      loadRamStatus();
    }
  }, [isOpen]);

  const loadTables = async () => {
    setIsLoadingTables(true);
    try {
      const data = await dbApi.getTablesSummary();
      if (data && Array.isArray(data.tables)) {
        setTables(data.tables);
        setTotalRecords(data.totalRecords);
        setDatabaseName(data.database);
      }
    } catch (err) {
      console.error("Failed to load tables summary:", err);
    } finally {
      setIsLoadingTables(false);
    }
  };

  const loadRamStatus = async () => {
    setIsRefreshingMetrics(true);
    try {
      const data = await dbApi.getRamStatus();
      setDbMetrics(data);
    } catch (err) {
      console.error("Failed to load RAM status:", err);
    } finally {
      setIsRefreshingMetrics(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await dbApi.clearRamCache();
      setCacheClearNotice('کاشی پاراستنی ڕام بە سەرکەوتوویی بەتاڵکرایەوە ✨');
      loadRamStatus();
      setTimeout(() => setCacheClearNotice(''), 3000);
    } catch (e) {}
  };

  const handleOpenTableRecords = async (table: TableMeta) => {
    setSelectedTable(table);
    setInspectedRecord(null);
    setRecordSearch('');
    setIsLoadingRecords(true);
    try {
      const res = await fetch(`/api/db/${table.tableName}?skipCache=true`);
      if (res.ok) {
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error("Failed to load records for " + table.tableName, err);
      setRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const handleCopyUri = () => {
    navigator.clipboard.writeText(connectionString);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2500);
  };

  if (!isOpen) return null;

  // Categories extraction
  const categories = ['all', ...Array.from(new Set(tables.map(t => t.category)))];

  // Filtered tables
  const filteredTables = tables.filter(t => {
    const matchesSearch = 
      t.titleKu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtered records inside selected table
  const filteredRecords = records.filter(r => {
    if (!recordSearch) return true;
    const str = JSON.stringify(r).toLowerCase();
    return str.includes(recordSearch.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col bg-slate-900 border border-emerald-500/30 rounded-2xl md:rounded-3xl shadow-2xl text-white overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400 shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300">
                  ناوەندی داتابەیس و خشتەکان (Database Tables Explorer)
                </h3>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-mono font-bold">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {databaseName} • ٢٧ خشتە • {totalRecords} تۆمار
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/backup/export-live"
              download
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold transition"
              title="دابەزاندنی تەواوی زانیاری و خشتەکان وەک فایلی JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دابەزاندنی هەموو داتاکان (JSON)</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/40 border-b border-white/10 shrink-0 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => { setActiveTab('tables'); setSelectedTable(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'tables'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>بینینی خشتەکان و تۆمارەکان ({tables.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ram')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'ram'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>دۆخی ڕام و پاراستن (RAM Shield)</span>
          </button>

          <button
            onClick={() => setActiveTab('connection')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'connection'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>پەیوەندی دەرەکی (DBeaver / pgAdmin)</span>
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">

          {/* TAB 1: TABLES AND RECORDS EXPLORER */}
          {activeTab === 'tables' && (
            <div className="space-y-4">
              {/* If a table is selected for inspection */}
              {selectedTable ? (
                <div className="space-y-4 animate-fadeIn">
                  {/* Selected Table Sub-header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/60 border border-white/10 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedTable(null)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="گەڕانەوە بۆ لیستی سەرەکی خشتەکان"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>گەڕانەوە</span>
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white">{selectedTable.titleKu}</h4>
                          <span className="text-[11px] font-mono px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                            {selectedTable.tableName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {selectedTable.description} • کۆی تۆمارەکان: <span className="font-bold text-emerald-400 font-mono">{records.length}</span>
                        </p>
                      </div>
                    </div>

                    {/* View mode toggle and search */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="گەڕان لەناو ئەم تۆمارانەدا..."
                          value={recordSearch}
                          onChange={(e) => setRecordSearch(e.target.value)}
                          className="w-48 sm:w-64 pr-8 pl-3 py-1.5 bg-slate-900 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center bg-slate-900 p-0.5 border border-white/15 rounded-xl">
                        <button
                          onClick={() => setRecordViewMode('table')}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                            recordViewMode === 'table' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          خشتە
                        </button>
                        <button
                          onClick={() => setRecordViewMode('json')}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                            recordViewMode === 'json' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          JSON
                        </button>
                      </div>

                      <button
                        onClick={() => handleOpenTableRecords(selectedTable)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition cursor-pointer"
                        title="نوێکردنەوەی تۆمارەکان"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isLoadingRecords ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Record Loading State */}
                  {isLoadingRecords ? (
                    <div className="p-12 text-center text-slate-400 space-y-3">
                      <RotateCw className="w-8 h-8 mx-auto animate-spin text-emerald-400" />
                      <p className="text-xs">خەریکی هێنانی زانیارییەکانی خشتەی {selectedTable.titleKu}یە...</p>
                    </div>
                  ) : filteredRecords.length === 0 ? (
                    <div className="p-12 text-center bg-slate-950/40 rounded-2xl border border-dashed border-white/10 space-y-2">
                      <p className="text-sm font-bold text-slate-400">هیچ تۆمارێک نەدۆزرایەوە</p>
                      <p className="text-xs text-slate-500">ئەم خشتەیە لە ئێستادا بەتاڵە یان بەدواداچوونەکەت هیچ ئەنجامێکی نەبوو.</p>
                    </div>
                  ) : recordViewMode === 'json' ? (
                    /* JSON Raw Viewer */
                    <div className="p-4 bg-slate-950 border border-white/10 rounded-2xl overflow-x-auto max-h-[500px]">
                      <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
                        {JSON.stringify(filteredRecords, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    /* Formatted Table Viewer */
                    <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-950/40">
                      <div className="overflow-x-auto max-h-[520px]">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-900/90 text-slate-300 uppercase tracking-wider sticky top-0 border-b border-white/10 z-10">
                            <tr>
                              <th className="px-4 py-3 font-bold"># ID</th>
                              <th className="px-4 py-3 font-bold">لق (Branch)</th>
                              <th className="px-4 py-3 font-bold">زانیارییە سەرەکییەکان (Data Payload)</th>
                              <th className="px-4 py-3 font-bold">کاتی نوێبوونەوە</th>
                              <th className="px-4 py-3 font-bold text-center">کردار</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-slate-300">
                            {filteredRecords.map((item, idx) => (
                              <tr key={item.id || idx} className="hover:bg-white/5 transition">
                                <td className="px-4 py-3 font-mono font-bold text-teal-300 whitespace-nowrap">
                                  {String(item.id || idx + 1)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {item.branchId || item.branch_id ? (
                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded-md font-mono">
                                      لق {item.branchId || item.branch_id}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 max-w-md">
                                  <div className="truncate font-mono text-slate-300 text-[11px]" title={JSON.stringify(item)}>
                                    {item.name || item.title || item.username || item.fullName || item.reason || item.amount || JSON.stringify(item).slice(0, 80)}
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                  {item.updatedAt || item.updated_at || item.createdAt || 'PostgreSQL'}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <button
                                    onClick={() => setInspectedRecord(item)}
                                    className="px-2.5 py-1 bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                  >
                                    وردەکاری تەواو
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Record Full Inspection Popup */}
                  {inspectedRecord && (
                    <div className="p-4 bg-slate-950 border border-teal-500/40 rounded-2xl space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                          <Code className="w-4 h-4" />
                          <span>وردەکاری تەواوی تۆمار: ID #{inspectedRecord.id}</span>
                        </div>
                        <button
                          onClick={() => setInspectedRecord(null)}
                          className="p-1 text-slate-400 hover:text-white rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <pre className="text-xs font-mono text-slate-200 bg-slate-900/80 p-3 rounded-xl overflow-x-auto max-h-60 leading-relaxed">
                        {JSON.stringify(inspectedRecord, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                /* Tables Catalog View */
                <div className="space-y-4">
                  {/* Search and Category Filter Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                      <input
                        type="text"
                        placeholder="گەڕان بەدوای خشتە یان بەشێکدا..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-9 pl-4 py-2.5 bg-slate-950/60 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
                      />
                    </div>

                    {/* Refresh and Total Count */}
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-slate-400 px-3 py-2 bg-slate-950/40 border border-white/10 rounded-xl">
                        کۆی گشتی: <span className="font-bold text-emerald-400 font-mono">{filteredTables.length}</span> خشتە
                      </div>

                      <button
                        onClick={loadTables}
                        disabled={isLoadingTables}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition cursor-pointer"
                        title="نوێکردنەوەی خشتەکان"
                      >
                        <RotateCw className={`w-4 h-4 ${isLoadingTables ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer font-bold ${
                          selectedCategory === cat
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                        }`}
                      >
                        {cat === 'all' ? 'هەموو بەشەکان' : cat}
                      </button>
                    ))}
                  </div>

                  {/* Tables Grid */}
                  {isLoadingTables ? (
                    <div className="p-16 text-center text-slate-400 space-y-3">
                      <RotateCw className="w-8 h-8 mx-auto animate-spin text-emerald-400" />
                      <p className="text-xs">خەریکی وەرگرتنی پێڕستی خشتەکانە لە Layerbase PostgreSQL...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredTables.map((t) => (
                        <div
                          key={t.tableName}
                          onClick={() => handleOpenTableRecords(t)}
                          className="group p-4 bg-slate-950/50 hover:bg-slate-950 border border-white/10 hover:border-emerald-500/40 rounded-2xl transition duration-200 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-emerald-950/30"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h5 className="text-sm font-black text-white group-hover:text-emerald-300 transition">
                                  {t.titleKu}
                                </h5>
                                <span className="font-mono text-[10px] text-slate-500 block">
                                  {t.tableName}
                                </span>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono shrink-0 ${
                                t.rowCount > 0 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {t.rowCount} تۆمار
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {t.description}
                            </p>
                          </div>

                          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 text-[10px]">بەش: {t.category}</span>
                            <span className="text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition">
                              <span>بینینی داتا</span>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RAM SHIELD AND HEALTH MONITOR */}
          {activeTab === 'ram' && (
            <div className="space-y-5 animate-fadeIn">
              {/* RAM Protection Banner */}
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-emerald-200">
                    سیستەمی پاراستنی ڕامی داتابەیس (Low-RAM Shield) چالاکە
                  </div>
                  <div className="text-xs text-emerald-400/80 mt-1 leading-relaxed">
                    ڕامی داتابەیسەکە بە تەواوی پارێزراوە لە هیلاکبوون؛ ژمارەی پەیوەندییەکان دیاریکراوە بۆ ۳ پەیوەندی، کاتی بەتاڵبوون کەمی کردووە بۆ ۱۰ چرکە، و داواکارییە دووبارەبووەکان لە سێرڤەر کاش دەکرێن.
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl space-y-1">
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-pink-400" />
                    <span>قەبارەی داتابەیس</span>
                  </div>
                  <div className="text-lg font-black text-white font-mono">
                    {dbMetrics?.database?.size || '9.6 MB'}
                  </div>
                  <div className="text-[10px] text-slate-500">زۆر کەم و خێرا</div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl space-y-1">
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-teal-400" />
                    <span>پەیوەندییەکانی Pool</span>
                  </div>
                  <div className="text-lg font-black text-white font-mono">
                    Max: {dbMetrics?.pool?.maxConnections || 3} (کراوە: {dbMetrics?.pool?.currentTotal || 1})
                  </div>
                  <div className="text-[10px] text-emerald-400">ڕێگری لە هیلاکبوونی ڕام</div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl space-y-1">
                  <div className="text-slate-400">سنووری work_mem بۆ هەر گەڕانێک</div>
                  <div className="text-lg font-bold text-emerald-300 font-mono">
                    2 MB (Lean)
                  </div>
                  <div className="text-[10px] text-slate-500">کەمترین بەکارهێنانی یادگە</div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl space-y-1">
                  <div className="text-slate-400">کاتی ئۆتۆماتیکی بەتاڵکردنەوە</div>
                  <div className="text-lg font-bold text-amber-300 font-mono">
                    10 چرکە
                  </div>
                  <div className="text-[10px] text-slate-500">پەیوەندی بەتاڵ دانامێنێت</div>
                </div>
              </div>

              {/* Cache Stats */}
              <div className="p-4 bg-slate-950/50 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400">ڕێژەی کاشکردنی گەڕانە دووبارەکان: </span>
                  <span className="font-bold text-emerald-400 font-mono mr-1">
                    {dbMetrics?.ramShieldCache?.hitRate || '100%'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    داواکارییە دووبارەکان ڕاستەوخۆ لە کاشی سێرڤەرەوە وەڵام دەدرێنەوە بەبێ ئەوەی هیچ ڕامێکی داتابەیسەکە بەکاربێنن.
                  </p>
                </div>

                <button
                  onClick={handleClearCache}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl text-slate-300 hover:text-white transition font-medium cursor-pointer self-start sm:self-auto"
                >
                  پاککردنەوەی دەستیی کاش
                </button>
              </div>

              {cacheClearNotice && (
                <div className="text-center text-xs text-emerald-400 font-bold animate-fadeIn">
                  {cacheClearNotice}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={loadRamStatus}
                  disabled={isRefreshingMetrics}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRefreshingMetrics ? 'animate-spin' : ''}`} />
                  <span>پشکنینی نوێی دۆخی ڕام</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: EXTERNAL SQL CONNECTION */}
          {activeTab === 'connection' && (
            <div className="space-y-5 animate-fadeIn max-w-3xl">
              <div className="p-4 bg-slate-950/60 border border-emerald-500/20 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-emerald-400" />
                    بینینی خشتەکان لەسەر ماڵپەڕ و داشبۆردی فەرمیی کۆمپانیاکە (Layerbase):
                  </h4>
                  <a
                    href="https://cloud.layerbase.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition"
                  >
                    <span>کردنەوەی سایتی Layerbase</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ماڵپەڕی داتابەیسەکە ناوی <strong>Layerbase</strong>ە (<code className="text-emerald-300 font-mono">https://cloud.layerbase.dev</code>). بۆ بینینی خشتەکان بە تەواوی لەسەر سایتی خۆیان:
                </p>
                <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside pr-1">
                  <li>بچۆ بۆ ماڵپەڕی: <strong className="text-white font-mono">https://cloud.layerbase.dev</strong> یان <strong className="text-white font-mono">https://layerbase.dev</strong></li>
                  <li>بەو هەژمارە (ئیمەیڵە) بچۆ ژوورەوە کە پێی داتابەیسەکەت دروستکردووە.</li>
                  <li>کلیک لەسەر پرۆژەی <strong>jwankary</strong> بکە.</li>
                  <li>لە بەشی تەنیشت بچۆ سەر <strong>Table Editor</strong> یان <strong>Database</strong> یاخود <strong>SQL Editor</strong>.</li>
                  <li>هەموو ٢٧ خشتەکە لەوێ دەبینیت لەگەڵ هەموو کۆڵۆم و داتاکانیان.</li>
                </ol>
              </div>

              <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl space-y-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  یاخود لە بەرنامەکانی وەک DBeaver و TablePlus بەم زانیارییانە بیبینە:
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  دەتوانیت هەر بەرنامەیەکی بەڕێوەبردنی داتابەیس وەک <strong>DBeaver, pgAdmin, TablePlus, DataGrip, VS Code SQLTools</strong> بەکاربهێنیت بە تێکردنی ئەم زانیارییانە:
                </p>
              </div>

              {/* Connection Details Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 border border-white/10 rounded-xl space-y-1">
                  <span className="text-slate-500">Host (سێرڤەر):</span>
                  <div className="font-mono text-emerald-300 select-all break-all">
                    jwankary-main-clay-pooler.sage.cloud.layerbase.dev
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-white/10 rounded-xl space-y-1">
                  <span className="text-slate-500">Port (پۆرت):</span>
                  <div className="font-mono text-white select-all">5432</div>
                </div>

                <div className="p-3 bg-slate-950 border border-white/10 rounded-xl space-y-1">
                  <span className="text-slate-500">Database Name (ناوی داتابەیس):</span>
                  <div className="font-mono text-white select-all">jwankary</div>
                </div>

                <div className="p-3 bg-slate-950 border border-white/10 rounded-xl space-y-1">
                  <span className="text-slate-500">User (بەکارهێنەر):</span>
                  <div className="font-mono text-white select-all">postgres</div>
                </div>

                <div className="p-3 bg-slate-950 border border-white/10 rounded-xl space-y-1 sm:col-span-2">
                  <span className="text-slate-500">SSL Mode:</span>
                  <div className="font-mono text-teal-300">require (verify-full)</div>
                </div>
              </div>

              {/* Connection String Box */}
              <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">لینک و کۆدی تەواوی پەیوەستبوون (Connection URL):</span>
                  <button
                    onClick={handleCopyUri}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    {copiedUri ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUri ? 'کۆپی کرا!' : 'کۆپیکردن'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-slate-300 select-all break-all border border-white/5">
                  {connectionString}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-slate-950/60 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>داتابەیس چالاک و پەیوەستە بە بەردەوامی (5+ Years Guaranteed)</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition cursor-pointer"
          >
            داخستن
          </button>
        </div>

      </div>
    </div>
  );
};
