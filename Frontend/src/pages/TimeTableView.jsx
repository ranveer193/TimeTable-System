import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { timetableAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CellHistoryModal from '../components/CellHistoryModal';

const DEPT_COLORS = {
  NONE: 'bg-slate-100 text-slate-700 border-slate-300',
  CS:   'bg-blue-100 text-blue-700 border-blue-300',
  ECE:  'bg-purple-100 text-purple-700 border-purple-300',
  IT:   'bg-emerald-100 text-emerald-700 border-emerald-300',
  MNC:  'bg-orange-100 text-orange-700 border-orange-300',
  ML:   'bg-pink-100 text-pink-700 border-pink-300',
};

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const DEPT_DOT = {
  CS: 'bg-blue-500', ECE: 'bg-purple-500', IT: 'bg-emerald-500',
  MNC: 'bg-orange-500', ML: 'bg-pink-500', NONE: 'bg-slate-300',
};

const TimetableView = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [timetable, setTimetable]           = useState(null);
  const [cells, setCells]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [editingCell, setEditingCell]       = useState(null);
  const [selectedCell, setSelectedCell]     = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [exportingPDF, setExportingPDF]     = useState(false);
  const [activeTab, setActiveTab]           = useState('schedule'); // 'schedule' | 'activity'
  const [activityLog, setActivityLog]       = useState([]);
  const [logLoading, setLogLoading]         = useState(false);
  const [logFetched, setLogFetched]         = useState(false);

  const departments = ['NONE', 'CS', 'ECE', 'IT', 'MNC', 'ML'];

  const fetchTimetable = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await timetableAPI.getOne(id);
      const data = res?.data?.data;
      setTimetable(data?.timetable || null);
      setCells(Array.isArray(data?.cells) ? data.cells : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch timetable');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchTimetable(); }, [fetchTimetable]);

  const fetchActivityLog = async () => {
    if (logFetched) return;
    setLogLoading(true);
    try {
      const res = await timetableAPI.getActivityLog(id);
      setActivityLog(Array.isArray(res?.data?.data) ? res.data.data : []);
      setLogFetched(true);
    } catch {
      toast.error('Failed to load activity log');
    } finally {
      setLogLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'activity') fetchActivityLog();
  };

  const canEditCell = (cell) => {
    if (!user || !cell) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'USER') return false;
    if (cell.department === 'NONE') return true;
    return cell.department === user.department;
  };

  const handleCellClick = (cell) => {
    if (canEditCell(cell)) {
      setEditingCell({ id: cell._id, subject: cell.subject, department: cell.department });
    } else {
      toast.error('You do not have permission to edit this cell');
    }
  };

  const handleSaveCell = async () => {
    if (!editingCell) return;
    if (!editingCell.subject?.trim()) { toast.error('Subject cannot be empty'); return; }
    try {
      const res = await timetableAPI.updateCell(editingCell.id, {
        subject:    editingCell.subject.trim(),
        department: editingCell.department,
      });
      toast.success('Cell updated successfully');

      // Feature 1 — clash warning (non-blocking)
      if (res?.data?.hasClash) {
        toast(`⚠️ ${editingCell.department} already has a subject in ${res.data.clashRoom} at this slot`, {
          icon: '⚠️', duration: 5000,
          style: { background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d' }
        });
      }

      setLogFetched(false); // invalidate log cache
      fetchTimetable();
      setEditingCell(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update cell');
    }
  };

  // Feature 4 — copy share link to clipboard
  const handleShare = () => {
    if (!timetable?.publicToken) { toast.error('Share link not available'); return; }
    const url = `${window.location.origin}/public/${timetable.publicToken}`;
    navigator.clipboard.writeText(url)
      .then(() => toast.success('Share link copied to clipboard!'))
      .catch(() => {
        // Fallback for older browsers
        const el = document.createElement('input');
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        toast.success('Share link copied!');
      });
  };

  const handleShowHistory = (cell) => {
    if (!cell) return;
    setSelectedCell(cell);
    setShowHistoryModal(true);
  };

  const exportToPDF = async () => {
    setExportingPDF(true);
    const tid = toast.loading('Generating PDF...');
    try {
      const doc       = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pw        = doc.internal.pageSize.getWidth();
      const ph        = doc.internal.pageSize.getHeight();
      const days      = timetable?.days || [];
      const ppd       = timetable?.periodsPerDay || 0;
      const lookup    = {};
      cells.forEach(c => { lookup[`${c.day}-${c.period}`] = c; });

      const deptFill  = { CS:[219,234,254], ECE:[243,232,255], IT:[209,250,229], MNC:[254,215,170], ML:[252,231,243], NONE:[241,245,249] };

      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pw, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      const title = timetable?.roomName || 'Timetable';
      doc.text(title, (pw - doc.getTextWidth(title)) / 2, 15);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      const sub = 'Academic Schedule';
      doc.text(sub, (pw - doc.getTextWidth(sub)) / 2, 25);

      const headers = [['Day / Period', ...Array.from({ length: ppd }, (_, i) => `Period ${i+1}`)]];
      const body    = days.map(day => [
        day,
        ...Array.from({ length: ppd }, (_, i) => {
          const c = lookup[`${day}-${i+1}`];
          return c?.subject ? `${c.subject}${c.department !== 'NONE' ? `\n(${c.department})` : ''}` : '';
        })
      ]);

      autoTable(doc, {
        startY: 40, head: headers, body,
        theme: 'grid',
        styles:      { fontSize: 9, cellPadding: 5, lineColor:[203,213,225], lineWidth:.5, textColor:[51,65,85], halign:'center', valign:'middle' },
        headStyles:  { fillColor:[59,130,246], textColor:[255,255,255], fontStyle:'bold', fontSize:10 },
        columnStyles:{ 0: { fillColor:[248,250,252], fontStyle:'bold', halign:'left', cellWidth:35 } },
        alternateRowStyles: { fillColor:[248,250,252] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index > 0) {
            const c = lookup[`${days[data.row.index]}-${data.column.index}`];
            if (c?.department && c.department !== 'NONE')
              data.cell.styles.fillColor = deptFill[c.department] || deptFill.NONE;
          }
        },
        margin: { top:40, right:10, bottom:30, left:10 }
      });

      const ly = (doc.lastAutoTable.finalY || 40) + 10;
      doc.setFontSize(9); doc.setTextColor(71,85,105); doc.setFont('helvetica','bold');
      doc.text('Department Legend:', 15, ly);
      const items = [
        { dept:'CS', name:'Computer Science', color:deptFill.CS },
        { dept:'ECE', name:'Electronics',     color:deptFill.ECE },
        { dept:'IT',  name:'Info. Tech.',      color:deptFill.IT  },
        { dept:'MNC', name:'Mechatronics',     color:deptFill.MNC },
        { dept:'ML',  name:'Machine Learning', color:deptFill.ML  },
      ];
      doc.setFont('helvetica','normal');
      let lx = 15, liy = ly + 7;
      items.forEach((item, i) => {
        doc.setFillColor(...item.color);
        doc.rect(lx, liy-3, 6, 4, 'F');
        doc.setDrawColor(203,213,225); doc.rect(lx, liy-3, 6, 4, 'S');
        doc.setTextColor(100,116,139);
        doc.text(`${item.dept} - ${item.name}`, lx+8, liy);
        if ((i+1)%3===0) { lx=15; liy+=7; } else { lx+=85; }
      });

      const footer = `Generated on ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}`;
      doc.setFontSize(8); doc.setTextColor(148,163,184);
      doc.text(footer, (pw - doc.getTextWidth(footer))/2, ph-10);
      doc.save(`${timetable?.roomName || 'timetable'}_${Date.now()}.pdf`);
      toast.dismiss(tid); toast.success('PDF downloaded!');
    } catch (err) {
      toast.dismiss(tid); toast.error('Failed to export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const getCellByDayAndPeriod = (day, period) =>
    Array.isArray(cells) ? cells.find(c => c?.day === day && c?.period === period) || null : null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="text-center">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-600 font-semibold mt-4">Loading timetable...</p>
      </div>
    </div>
  );

  if (!timetable) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="text-center bg-white rounded-3xl shadow-2xl border border-slate-200 p-10 max-w-md w-full">
        <div className="w-20 h-20 bg-red-100 rounded-2xl mx-auto mb-5 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Timetable Not Found</h2>
        <p className="text-slate-500 mb-6">This timetable does not exist or has been removed.</p>
        <button onClick={() => navigate('/dashboard')}
          className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg">
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* ── Sticky Header ────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Mobile */}
          <div className="flex flex-col gap-3 sm:hidden">
            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                onClick={() => navigate('/dashboard')}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-slate-900 truncate">{timetable.roomName}</h1>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                  <span>{Array.isArray(timetable.days) ? timetable.days.length : 0} days</span>
                  <span>·</span>
                  <span>{timetable.periodsPerDay || 0} periods</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold shadow-sm text-sm hover:bg-slate-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <button onClick={exportToPDF} disabled={exportingPDF}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg text-sm disabled:opacity-50">
                {exportingPDF
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                }
                PDF
              </button>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                onClick={() => navigate('/dashboard')}
                className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="truncate">{timetable.roomName}</span>
                </h1>
                <div className="flex items-center gap-4 text-sm text-slate-500 ml-12">
                  <span>{Array.isArray(timetable.days) ? timetable.days.length : 0} days</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 inline-block"></span>
                  <span>{timetable.periodsPerDay || 0} periods/day</span>
                  {timetable.createdBy?.name && (
                    <><span className="w-1 h-1 rounded-full bg-slate-300 inline-block"></span>
                    <span>by {timetable.createdBy.name}</span></>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 shadow-sm transition-all text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </motion.button>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={exportToPDF} disabled={exportingPDF}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 text-sm">
                {exportingPDF
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</>
                  : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Export PDF</>
                }
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 border-t border-slate-100">
            {[
              { id:'schedule', label:'Schedule',
                icon:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              },
              { id:'activity', label:'Activity Log',
                icon:<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              }
            ].map(tab => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'text-primary-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}>
                {tab.icon}{tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="timetableTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <AnimatePresence mode="wait">

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <motion.div key="schedule" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:.2 }}>
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* Banner */}
                <div className="relative bg-gradient-to-br from-primary-600 to-primary-700 text-white px-6 sm:px-10 py-8 text-center">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-900 rounded-full blur-3xl"></div>
                  </div>
                  <div className="relative">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1">{timetable.roomName}</h2>
                    <p className="text-primary-100 text-xs uppercase tracking-widest font-semibold">Academic Schedule</p>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-b from-slate-50 to-slate-100">
                        <th className="sticky left-0 z-20 px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b-2 border-slate-300 bg-slate-50 min-w-[100px] sm:min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center">
                              <svg className="w-3 h-3 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="hidden sm:inline">Day</span>
                          </div>
                        </th>
                        {Array.from({ length: timetable.periodsPerDay || 0 }, (_, i) => (
                          <th key={i} className="px-2 sm:px-4 py-3 sm:py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider border-b-2 border-slate-300 min-w-[140px] sm:min-w-[180px]">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span>Period {i + 1}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(timetable.days) && timetable.days.map((day) => (
                        <tr key={day} className="group hover:bg-slate-50 transition-colors">
                          <td className="sticky left-0 z-10 px-3 sm:px-6 py-2 sm:py-3 font-bold text-slate-900 bg-slate-50 border-r-2 border-b border-slate-200 min-w-[100px] sm:min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                                {day.substring(0, 3).toUpperCase()}
                              </div>
                              <span className="text-sm hidden sm:inline">{day}</span>
                            </div>
                          </td>
                          {Array.from({ length: timetable.periodsPerDay || 0 }, (_, i) => {
                            const period    = i + 1;
                            const cell      = getCellByDayAndPeriod(day, period);
                            const isEditing = editingCell?.id === cell?._id;
                            const canEdit   = cell && canEditCell(cell);
                            const isLocked  = cell && !canEdit;
                            const hasContent= cell?.subject?.trim() && cell.subject !== 'Empty';

                            return (
                              <td key={`${day}-${period}`} className="px-2 sm:px-3 py-2 sm:py-3 border-b border-slate-200 align-top min-w-[140px] sm:min-w-[180px]">
                                <motion.div
                                  whileHover={canEdit && !isEditing ? { scale: 1.01 } : {}}
                                  onClick={() => cell && !isEditing && handleCellClick(cell)}
                                  className={`min-h-[90px] sm:min-h-[110px] p-3 sm:p-4 rounded-xl border-2 transition-all relative ${
                                    isEditing  ? 'border-primary-400 bg-primary-50 shadow-lg ring-2 ring-primary-200'
                                    : canEdit  ? 'border-slate-200 hover:border-primary-300 hover:shadow-md cursor-pointer bg-white'
                                    : isLocked ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                                    :            'border-dashed border-slate-300 bg-slate-50'
                                  }`}
                                >
                                  {isEditing ? (
                                    <div className="space-y-2 sm:space-y-3">
                                      <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Subject</label>
                                        <input type="text" value={editingCell.subject}
                                          onChange={e => setEditingCell({ ...editingCell, subject: e.target.value })}
                                          className="w-full px-3 py-2 text-xs sm:text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                          placeholder="Enter subject" autoFocus />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Dept</label>
                                        <select value={editingCell.department}
                                          onChange={e => setEditingCell({ ...editingCell, department: e.target.value })}
                                          className="w-full px-3 py-2 text-xs sm:text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white">
                                          {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                      </div>
                                      <div className="flex gap-2 pt-1">
                                        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                                          onClick={e => { e.stopPropagation(); handleSaveCell(); }}
                                          className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Save
                                        </motion.button>
                                        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                                          onClick={e => { e.stopPropagation(); setEditingCell(null); }}
                                          className="flex-1 bg-gradient-to-r from-slate-500 to-slate-600 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>Cancel
                                        </motion.button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-full flex flex-col justify-between">
                                      <div>
                                        {isLocked && (
                                          <div className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                          </div>
                                        )}
                                        <div className="text-sm font-bold text-slate-900 mb-2 pr-8 leading-tight">
                                          {cell?.subject || (
                                            <span className="text-slate-400 italic text-xs font-normal flex items-center gap-1">
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                              Empty
                                            </span>
                                          )}
                                        </div>
                                        {cell?.department && cell.department !== 'NONE' && (
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border-2 ${DEPT_COLORS[cell.department] || DEPT_COLORS.NONE}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>{cell.department}
                                          </span>
                                        )}
                                      </div>
                                      {hasContent && (
                                        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                                          onClick={e => { e.stopPropagation(); handleShowHistory(cell); }}
                                          className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg text-xs font-semibold shadow-sm">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                          History
                                        </motion.button>
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Department Legend</p>
                  <div className="flex flex-wrap gap-2">
                    {departments.filter(d => d !== 'NONE').map(dept => (
                      <span key={dept} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${DEPT_COLORS[dept]}`}>
                        <div className="w-2 h-2 rounded-full bg-current"></div>{dept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ACTIVITY LOG TAB */}
          {activeTab === 'activity' && (
            <motion.div key="activity" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:.2 }}>
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">Activity Log</h3>
                    <p className="text-xs text-slate-500 mt-0.5">All cell edits for this timetable (last 100)</p>
                  </div>
                  <button onClick={() => { setLogFetched(false); fetchActivityLog(); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>

                {logLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                  </div>
                ) : activityLog.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">No activity yet</h3>
                    <p className="text-sm text-slate-500">Cell edits will appear here once made.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activityLog.map((log, i) => (
                      <motion.div key={`${log._id || i}`}
                        initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.03 }}
                        className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm ${
                          log.editedByDept && log.editedByDept !== 'NONE'
                            ? `bg-${DEPT_DOT[log.editedByDept]?.replace('bg-','') || 'primary'}-500`
                            : 'bg-gradient-to-br from-primary-500 to-primary-600'
                        }`}
                          style={{ background: log.editedByDept === 'CS' ? '#3b82f6' : log.editedByDept === 'ECE' ? '#8b5cf6' : log.editedByDept === 'IT' ? '#10b981' : log.editedByDept === 'MNC' ? '#f97316' : log.editedByDept === 'ML' ? '#ec4899' : '#6366f1' }}>
                          {(log.editedByName || 'U').charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900 text-sm">{log.editedByName || 'Unknown'}</span>
                            {log.editedByDept && log.editedByDept !== 'NONE' && (
                              <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${DEPT_COLORS[log.editedByDept] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {log.editedByDept}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${log.action === 'CLEAR' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {log.action}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-1.5">
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-md font-medium">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              {log.day}
                            </span>
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-md font-medium">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Period {log.period}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md border border-red-100 font-mono">
                              {log.previousSubject || '(empty)'}
                            </span>
                            <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 font-mono">
                              {log.newSubject || '(empty)'}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">{timeAgo(log.createdAt)}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <CellHistoryModal
        isOpen={showHistoryModal}
        onClose={() => { setShowHistoryModal(false); setSelectedCell(null); }}
        cell={selectedCell}
      />
    </div>
  );
};

export default TimetableView;